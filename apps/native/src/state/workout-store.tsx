import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AppState } from "react-native";
import { DEFAULT_EXERCISES } from "@/src/data/exercises";
import { DEFAULT_ROUTINES, splitById } from "@/src/data/routines";
import * as db from "@/src/db/database";
import { convertWeight, estimate1RM } from "@/src/lib/calc";
import { todayISO } from "@/src/lib/dates";
import type {
	ActiveRoutine,
	Exercise,
	PersonalRecord,
	Profile,
	Routine,
	SetType,
	Settings,
	Unit,
	WorkoutDay,
	WorkoutExercise,
	WorkoutSet,
} from "@/src/types";

const DEFAULT_SETTINGS: Settings = {
	unit: "kg",
	defaultBarbellWeight: 20,
	autoRestTimer: true,
	defaultRestSeconds: 90,
	vibrationEnabled: true,
	restNotification: true,
};

const KV = {
	profile: "profile",
	settings: "settings",
	activeRoutine: "active_routine",
} as const;
const SAVE_DELAY_MS = 400;
const SET_TYPE_ORDER: SetType[] = ["normal", "warmup", "drop", "failure"];

export interface LastPerformance {
	date: string;
	sets: WorkoutSet[];
}

export interface BackupFile {
	app: "setwise";
	version: 1;
	exportedAt: string;
	profile: Profile | null;
	settings: Settings;
	customExercises: Exercise[];
	routines: Routine[];
	activeRoutine: ActiveRoutine | null;
	workouts: Record<string, WorkoutDay>;
}

let idCounter = 0;
export const newId = (prefix: string) =>
	`${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const emptyDay = (date: string): WorkoutDay => ({ date, exercises: [] });

function makeSet(setNumber: number, from?: Partial<WorkoutSet>): WorkoutSet {
	return {
		id: newId("set"),
		setNumber,
		weight: from?.weight ?? 0,
		reps: from?.reps ?? 10,
		distance: from?.distance,
		timeSeconds: from?.timeSeconds,
		completed: false,
		setType: from?.setType ?? "normal",
	};
}

function useWorkoutStoreValue() {
	const [ready, setReady] = useState(false);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
	const [workouts, setWorkouts] = useState<Record<string, WorkoutDay>>({});
	const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
	const [routines, setRoutines] = useState<Routine[]>([]);
	const [activeRoutine, setActiveRoutineState] = useState<ActiveRoutine | null>(
		null,
	);
	const [currentDate, setCurrentDate] = useState(todayISO);

	// The ref is the synchronous source of truth so set actions can read their own result.
	const workoutsRef = useRef<Record<string, WorkoutDay>>({});
	const pendingSaves = useRef(new Map<string, ReturnType<typeof setTimeout>>());

	const load = useCallback(async () => {
		await db.migrate();
		const [p, s, a, w, c, r] = await Promise.all([
			db.getKV<Profile>(KV.profile),
			db.getKV<Settings>(KV.settings),
			db.getKV<ActiveRoutine>(KV.activeRoutine),
			db.loadWorkoutDays(),
			db.loadCustomExercises(),
			db.loadRoutines(),
		]);
		let loadedRoutines = r;
		if (loadedRoutines.length === 0) {
			loadedRoutines = DEFAULT_ROUTINES;
			await db.saveRoutines(loadedRoutines);
		}
		workoutsRef.current = w;
		setProfile(p);
		setSettings({ ...DEFAULT_SETTINGS, ...s });
		setActiveRoutineState(a);
		setWorkouts(w);
		setCustomExercises(c);
		setRoutines(loadedRoutines);
		setReady(true);
	}, []);

	useEffect(() => {
		load().catch((error) => {
			console.error("Failed to open local database", error);
			setReady(true);
		});
	}, [load]);

	const flushSaves = useCallback(() => {
		for (const [date, timer] of pendingSaves.current) {
			clearTimeout(timer);
			const day = workoutsRef.current[date];
			if (day) db.saveWorkoutDay(day).catch(console.error);
		}
		pendingSaves.current.clear();
	}, []);

	useEffect(() => {
		const sub = AppState.addEventListener("change", (state) => {
			if (state !== "active") flushSaves();
		});
		return () => sub.remove();
	}, [flushSaves]);

	const queueSave = useCallback((day: WorkoutDay) => {
		const existing = pendingSaves.current.get(day.date);
		if (existing) clearTimeout(existing);
		pendingSaves.current.set(
			day.date,
			setTimeout(() => {
				pendingSaves.current.delete(day.date);
				db.saveWorkoutDay(workoutsRef.current[day.date] ?? day).catch(
					console.error,
				);
			}, SAVE_DELAY_MS),
		);
	}, []);

	const updateDay = useCallback(
		(date: string, fn: (prev: WorkoutDay) => WorkoutDay) => {
			const next = fn(workoutsRef.current[date] ?? emptyDay(date));
			workoutsRef.current = { ...workoutsRef.current, [date]: next };
			setWorkouts(workoutsRef.current);
			queueSave(next);
			return next;
		},
		[queueSave],
	);

	const updateExercise = useCallback(
		(
			date: string,
			weId: string,
			fn: (we: WorkoutExercise) => WorkoutExercise,
		) =>
			updateDay(date, (day) => ({
				...day,
				exercises: day.exercises.map((we) => (we.id === weId ? fn(we) : we)),
			})),
		[updateDay],
	);

	// ---- derived ---------------------------------------------------------------

	const exercises = useMemo(
		() => [...customExercises, ...DEFAULT_EXERCISES],
		[customExercises],
	);
	const exerciseById = useMemo(
		() => new Map(exercises.map((e) => [e.id, e])),
		[exercises],
	);

	const sortedDates = useMemo(
		() => Object.keys(workouts).sort().reverse(),
		[workouts],
	);

	// Cached per source exercise entry so an unchanged history hands back the same object,
	// which lets exercise cards skip re-rendering while a different card is being edited.
	const lastCache = useRef(new WeakMap<WorkoutExercise, LastPerformance>());
	const lastPerformance = useCallback(
		(exerciseId: string, beforeDate: string): LastPerformance | null => {
			for (const date of sortedDates) {
				if (date >= beforeDate) continue;
				const we = workouts[date]?.exercises.find(
					(e) => e.exerciseId === exerciseId,
				);
				if (!we) continue;
				const cached = lastCache.current.get(we);
				if (cached) return cached;
				const sets = we.sets.filter((s) => s.completed);
				if (sets.length === 0) continue;
				const result = { date, sets };
				lastCache.current.set(we, result);
				return result;
			}
			return null;
		},
		[sortedDates, workouts],
	);

	const personalRecords = useMemo(() => {
		const map: Record<string, PersonalRecord> = {};
		for (const day of Object.values(workouts)) {
			for (const we of day.exercises) {
				let record = map[we.exerciseId];
				let dayVolume = 0;
				for (const set of we.sets) {
					if (!set.completed || set.setType === "warmup") continue;
					record ??= map[we.exerciseId] = {
						exerciseId: we.exerciseId,
						exerciseName: we.exerciseName,
						category: we.category,
						maxWeight: { value: 0, reps: 0, date: day.date },
						maxEstimated1RM: { value: 0, weight: 0, reps: 0, date: day.date },
						maxVolume: { value: 0, date: day.date },
					};
					dayVolume += set.weight * set.reps;
					if (set.weight > record.maxWeight.value) {
						record.maxWeight = {
							value: set.weight,
							reps: set.reps,
							date: day.date,
						};
					}
					const e1rm = estimate1RM(set.weight, set.reps);
					if (e1rm > record.maxEstimated1RM.value) {
						record.maxEstimated1RM = {
							value: e1rm,
							weight: set.weight,
							reps: set.reps,
							date: day.date,
						};
					}
				}
				if (record && dayVolume > record.maxVolume.value)
					record.maxVolume = { value: dayVolume, date: day.date };
			}
		}
		return map;
	}, [workouts]);

	// ---- workout actions ---------------------------------------------------------

	const addExercises = useCallback(
		(date: string, exerciseIds: string[], setsPerExercise = 1) => {
			const added: WorkoutExercise[] = [];
			for (const exerciseId of exerciseIds) {
				const exercise = exerciseById.get(exerciseId);
				if (!exercise) continue;
				const last = lastPerformance(exerciseId, date);
				const working = last?.sets.filter((s) => s.setType !== "warmup") ?? [];
				const template = working.at(-1) ?? last?.sets.at(-1);
				const count = Math.max(setsPerExercise, 1);
				added.push({
					id: newId("we"),
					exerciseId,
					exerciseName: exercise.name,
					category: exercise.category,
					sets: Array.from({ length: count }, (_, i) =>
						makeSet(i + 1, working.at(i) ?? template),
					),
				});
			}
			updateDay(date, (day) => ({
				...day,
				exercises: [...day.exercises, ...added],
			}));
		},
		[exerciseById, lastPerformance, updateDay],
	);

	const removeExercise = useCallback(
		(date: string, weId: string) =>
			updateDay(date, (day) => ({
				...day,
				exercises: day.exercises.filter((we) => we.id !== weId),
			})),
		[updateDay],
	);

	const moveExercise = useCallback(
		(date: string, weId: string, direction: -1 | 1) =>
			updateDay(date, (day) => {
				const list = [...day.exercises];
				const from = list.findIndex((we) => we.id === weId);
				const to = from + direction;
				if (from < 0 || to < 0 || to >= list.length) return day;
				const [item] = list.splice(from, 1);
				if (item) list.splice(to, 0, item);
				return { ...day, exercises: list };
			}),
		[updateDay],
	);

	const addSet = useCallback(
		(date: string, weId: string) =>
			updateExercise(date, weId, (we) => ({
				...we,
				sets: [
					...we.sets,
					makeSet(
						we.sets.length + 1,
						we.sets.at(-1) && { ...we.sets.at(-1), setType: "normal" },
					),
				],
			})),
		[updateExercise],
	);

	const updateSet = useCallback(
		(date: string, weId: string, setId: string, patch: Partial<WorkoutSet>) =>
			updateExercise(date, weId, (we) => ({
				...we,
				sets: we.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
			})),
		[updateExercise],
	);

	const deleteSet = useCallback(
		(date: string, weId: string, setId: string) =>
			updateExercise(date, weId, (we) => ({
				...we,
				sets: we.sets
					.filter((s) => s.id !== setId)
					.map((s, i) => ({ ...s, setNumber: i + 1 })),
			})),
		[updateExercise],
	);

	const cycleSetType = useCallback(
		(date: string, weId: string, setId: string) =>
			updateExercise(date, weId, (we) => ({
				...we,
				sets: we.sets.map((s) => {
					if (s.id !== setId) return s;
					const next =
						SET_TYPE_ORDER[
							(SET_TYPE_ORDER.indexOf(s.setType) + 1) % SET_TYPE_ORDER.length
						];
					return { ...s, setType: next ?? "normal" };
				}),
			})),
		[updateExercise],
	);

	/** Toggles a set and reports whether it just became a personal record. */
	const toggleSet = useCallback(
		(
			date: string,
			weId: string,
			setId: string,
		): { completed: boolean; isPR: boolean; exerciseName: string } => {
			const we = workoutsRef.current[date]?.exercises.find(
				(e) => e.id === weId,
			);
			const set = we?.sets.find((s) => s.id === setId);
			if (!we || !set)
				return { completed: false, isPR: false, exerciseName: "" };
			const completed = !set.completed;

			let isPR = false;
			if (
				completed &&
				set.setType !== "warmup" &&
				set.weight > 0 &&
				set.reps > 0
			) {
				// Compare against every other completed set of this exercise; a first-ever session is not a PR.
				let bestWeight = 0;
				let best1RM = 0;
				let hasHistory = false;
				for (const day of Object.values(workoutsRef.current)) {
					for (const other of day.exercises) {
						if (other.exerciseId !== we.exerciseId) continue;
						for (const s of other.sets) {
							if (!s.completed || s.id === setId || s.setType === "warmup")
								continue;
							hasHistory = hasHistory || day.date < date;
							bestWeight = Math.max(bestWeight, s.weight);
							best1RM = Math.max(best1RM, estimate1RM(s.weight, s.reps));
						}
					}
				}
				isPR =
					hasHistory &&
					(set.weight > bestWeight ||
						estimate1RM(set.weight, set.reps) > best1RM);
			}

			updateSet(date, weId, setId, {
				completed,
				completedAt: completed ? Date.now() : undefined,
				isPersonalRecord: completed ? isPR : false,
			});
			return { completed, isPR, exerciseName: we.exerciseName };
		},
		[updateSet],
	);

	const setExerciseNotes = useCallback(
		(date: string, weId: string, notes: string) =>
			updateExercise(date, weId, (we) => ({ ...we, notes })),
		[updateExercise],
	);

	const setDayNotes = useCallback(
		(date: string, notes: string) =>
			updateDay(date, (day) => ({ ...day, notes })),
		[updateDay],
	);

	// ---- routines ------------------------------------------------------------------

	const persistRoutines = useCallback((next: Routine[]) => {
		setRoutines(next);
		db.saveRoutines(next).catch(console.error);
	}, []);

	const setActiveRoutine = useCallback((next: ActiveRoutine | null) => {
		setActiveRoutineState(next);
		if (next) db.setKV(KV.activeRoutine, next).catch(console.error);
		else db.deleteKV(KV.activeRoutine).catch(console.error);
	}, []);

	const saveRoutine = useCallback(
		(routine: Routine) => {
			const exists = routines.some((r) => r.id === routine.id);
			persistRoutines(
				exists
					? routines.map((r) => (r.id === routine.id ? routine : r))
					: [...routines, routine],
			);
		},
		[routines, persistRoutines],
	);

	const deleteRoutine = useCallback(
		(routineId: string) => {
			persistRoutines(routines.filter((r) => r.id !== routineId));
			if (activeRoutine?.routineId === routineId) setActiveRoutine(null);
		},
		[routines, persistRoutines, activeRoutine, setActiveRoutine],
	);

	const startRoutineDay = useCallback(
		(date: string, routineId: string, dayIndex: number) => {
			const routine = routines.find((r) => r.id === routineId);
			const routineDay = routine?.days[dayIndex];
			if (!routine || !routineDay) return;
			addExercises(date, routineDay.exerciseIds, 3);
			updateDay(date, (day) => ({
				...day,
				title: day.title ?? routineDay.name,
			}));
			if (activeRoutine?.routineId === routineId) {
				setActiveRoutine({
					routineId,
					nextDayIndex: (dayIndex + 1) % routine.days.length,
				});
			}
		},
		[routines, addExercises, updateDay, activeRoutine, setActiveRoutine],
	);

	// ---- exercises -----------------------------------------------------------------

	const addCustomExercise = useCallback(
		(input: Omit<Exercise, "id" | "isCustom">) => {
			const exercise: Exercise = {
				...input,
				id: newId("custom"),
				isCustom: true,
			};
			setCustomExercises((prev) => [exercise, ...prev]);
			db.saveCustomExercise(exercise).catch(console.error);
			return exercise.id;
		},
		[],
	);

	const removeCustomExercise = useCallback((id: string) => {
		setCustomExercises((prev) => prev.filter((e) => e.id !== id));
		db.deleteCustomExercise(id).catch(console.error);
	}, []);

	// ---- settings & profile -------------------------------------------------------

	const updateSettings = useCallback(
		async (patch: Partial<Settings>) => {
			let next = { ...settings, ...patch };
			if (patch.unit && patch.unit !== settings.unit) {
				const from = settings.unit;
				const to: Unit = patch.unit;
				flushSaves();
				const converted: Record<string, WorkoutDay> = {};
				for (const [date, day] of Object.entries(workoutsRef.current)) {
					converted[date] = {
						...day,
						exercises: day.exercises.map((we) => ({
							...we,
							sets: we.sets.map((s) => ({
								...s,
								weight: convertWeight(s.weight, from, to),
							})),
						})),
					};
				}
				workoutsRef.current = converted;
				setWorkouts(converted);
				await db.replaceAllWorkoutDays(converted);
				next = { ...next, defaultBarbellWeight: to === "kg" ? 20 : 45 };
			}
			setSettings(next);
			await db.setKV(KV.settings, next);
		},
		[settings, flushSaves],
	);

	const saveProfile = useCallback(async (next: Profile) => {
		setProfile(next);
		await db.setKV(KV.profile, next);
	}, []);

	const completeOnboarding = useCallback(
		async (next: Profile, unit: Unit) => {
			await updateSettings({ unit });
			const routineId = splitById(next.split).routineId;
			if (routineId && routines.some((r) => r.id === routineId)) {
				setActiveRoutine({ routineId, nextDayIndex: 0 });
			}
			await saveProfile(next);
		},
		[updateSettings, routines, setActiveRoutine, saveProfile],
	);

	// ---- backup ------------------------------------------------------------------------

	const exportBackup = useCallback((): BackupFile => {
		flushSaves();
		return {
			app: "setwise",
			version: 1,
			exportedAt: new Date().toISOString(),
			profile,
			settings,
			customExercises,
			routines,
			activeRoutine,
			workouts: workoutsRef.current,
		};
	}, [flushSaves, profile, settings, customExercises, routines, activeRoutine]);

	/** Accepts a Setwise backup or a backup from the old FitNotes web app. */
	const importBackup = useCallback(
		async (raw: string) => {
			const data = JSON.parse(raw) as Partial<BackupFile> & {
				exercises?: Exercise[];
				settings?: Partial<Settings> & { unit?: Unit };
			};
			if (!data.workouts || typeof data.workouts !== "object")
				throw new Error("This file has no workouts in it.");
			flushSaves();
			const nextWorkouts = data.workouts as Record<string, WorkoutDay>;
			const nextCustom =
				data.customExercises ??
				(data.exercises ?? []).filter((e) => e.isCustom);
			const nextRoutines = data.routines?.length ? data.routines : routines;
			const nextSettings = { ...settings, ...(data.settings ?? {}) };

			await db.replaceAllWorkoutDays(nextWorkouts);
			await db.replaceCustomExercises(nextCustom);
			await db.saveRoutines(nextRoutines);
			await db.setKV(KV.settings, nextSettings);
			if (data.profile) await db.setKV(KV.profile, data.profile);
			if (data.activeRoutine)
				await db.setKV(KV.activeRoutine, data.activeRoutine);

			workoutsRef.current = nextWorkouts;
			setWorkouts(nextWorkouts);
			setCustomExercises(nextCustom);
			setRoutines(nextRoutines);
			setSettings(nextSettings);
			if (data.profile) setProfile(data.profile);
			if (data.activeRoutine) setActiveRoutineState(data.activeRoutine);
			return Object.keys(nextWorkouts).length;
		},
		[flushSaves, routines, settings],
	);

	const wipeLocalData = useCallback(async () => {
		for (const timer of pendingSaves.current.values()) clearTimeout(timer);
		pendingSaves.current.clear();
		await db.wipeAll();
		await db.saveRoutines(DEFAULT_ROUTINES);
		workoutsRef.current = {};
		setWorkouts({});
		setCustomExercises([]);
		setRoutines(DEFAULT_ROUTINES);
		setSettings(DEFAULT_SETTINGS);
		setActiveRoutineState(null);
		setProfile(null);
	}, []);

	return {
		ready,
		profile,
		settings,
		workouts,
		exercises,
		exerciseById,
		customExercises,
		routines,
		activeRoutine,
		personalRecords,
		currentDate,
		setCurrentDate,
		lastPerformance,
		addExercises,
		removeExercise,
		moveExercise,
		addSet,
		updateSet,
		deleteSet,
		cycleSetType,
		toggleSet,
		setExerciseNotes,
		setDayNotes,
		saveRoutine,
		deleteRoutine,
		setActiveRoutine,
		startRoutineDay,
		addCustomExercise,
		removeCustomExercise,
		updateSettings,
		saveProfile,
		completeOnboarding,
		exportBackup,
		importBackup,
		wipeLocalData,
	};
}

type WorkoutStore = ReturnType<typeof useWorkoutStoreValue>;

/** Actions that per-set UI calls. Their identity never changes, so memoised rows stay memoised. */
const STABLE_ACTIONS = [
	"addSet",
	"updateSet",
	"deleteSet",
	"cycleSetType",
	"toggleSet",
	"removeExercise",
	"moveExercise",
	"setExerciseNotes",
] as const;
type WorkoutActions = Pick<WorkoutStore, (typeof STABLE_ACTIONS)[number]>;

const WorkoutContext = createContext<WorkoutStore | null>(null);
const ActionsContext = createContext<WorkoutActions | null>(null);

export function WorkoutProvider({ children }: { children: ReactNode }) {
	const value = useWorkoutStoreValue();
	const latest = useRef(value);
	latest.current = value;
	const actions = useMemo(() => {
		const out: Record<string, unknown> = {};
		for (const name of STABLE_ACTIONS) {
			out[name] = (...args: unknown[]) =>
				(latest.current[name] as (...a: unknown[]) => unknown)(...args);
		}
		return out as unknown as WorkoutActions;
	}, []);
	return (
		<ActionsContext.Provider value={actions}>
			<WorkoutContext.Provider value={value}>
				{children}
			</WorkoutContext.Provider>
		</ActionsContext.Provider>
	);
}

export function useWorkouts(): WorkoutStore {
	const ctx = useContext(WorkoutContext);
	if (!ctx) throw new Error("useWorkouts must be used inside WorkoutProvider");
	return ctx;
}

export function useWorkoutActions(): WorkoutActions {
	const ctx = useContext(ActionsContext);
	if (!ctx)
		throw new Error("useWorkoutActions must be used inside WorkoutProvider");
	return ctx;
}

export const emptyWorkoutDay = emptyDay;
