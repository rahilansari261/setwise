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

import * as db from "@/src/db/database";
import type {
	ExerciseFolder,
	Gym,
	Measurement,
	PlannedWorkout,
	ProgressPhoto,
	RoutineFolder,
	TargetGoal,
} from "@/src/types";

const KEYS = {
	favorites: "favorites",
	exerciseFolders: "exercise_folders",
	routineFolders: "routine_folders",
	gyms: "gyms",
	measurements: "measurements",
	photos: "photos",
	goals: "goals",
	planned: "planned",
} as const;

/** Everything in here round-trips through the JSON backup under `extras`. */
export interface ExtrasData {
	favorites: string[];
	exerciseFolders: ExerciseFolder[];
	routineFolders: RoutineFolder[];
	gyms: Gym[];
	measurements: Measurement[];
	photos: ProgressPhoto[];
	goals: TargetGoal[];
	planned: Record<string, PlannedWorkout>;
}

const EMPTY: ExtrasData = {
	favorites: [],
	exerciseFolders: [],
	routineFolders: [],
	gyms: [],
	measurements: [],
	photos: [],
	goals: [],
	planned: {},
};

let counter = 0;
export const extraId = (prefix: string) =>
	`${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

function useExtrasValue() {
	const [data, setData] = useState<ExtrasData>(EMPTY);
	const ref = useRef<ExtrasData>(EMPTY);

	useEffect(() => {
		(async () => {
			const entries = await Promise.all(
				(Object.keys(KEYS) as (keyof ExtrasData)[]).map(
					async (k) => [k, await db.getKV(KEYS[k])] as const,
				),
			);
			const next = { ...EMPTY } as Record<string, unknown>;
			for (const [k, v] of entries) if (v) next[k] = v;
			ref.current = next as unknown as ExtrasData;
			setData(ref.current);
		})().catch(console.error);
	}, []);

	const commit = useCallback(
		<K extends keyof ExtrasData>(key: K, value: ExtrasData[K]) => {
			ref.current = { ...ref.current, [key]: value };
			setData(ref.current);
			db.setKV(KEYS[key], value).catch(console.error);
		},
		[],
	);

	const actions = useMemo(
		() => ({
			toggleFavorite: (exerciseId: string) => {
				const cur = ref.current.favorites;
				commit(
					"favorites",
					cur.includes(exerciseId)
						? cur.filter((x) => x !== exerciseId)
						: [...cur, exerciseId],
				);
			},

			saveExerciseFolder: (folder: ExerciseFolder) => {
				const cur = ref.current.exerciseFolders;
				commit(
					"exerciseFolders",
					cur.some((f) => f.id === folder.id)
						? cur.map((f) => (f.id === folder.id ? folder : f))
						: [...cur, folder],
				);
			},
			deleteExerciseFolder: (id: string) =>
				commit(
					"exerciseFolders",
					ref.current.exerciseFolders.filter((f) => f.id !== id),
				),

			saveRoutineFolder: (folder: RoutineFolder) => {
				const cur = ref.current.routineFolders;
				commit(
					"routineFolders",
					cur.some((f) => f.id === folder.id)
						? cur.map((f) => (f.id === folder.id ? folder : f))
						: [...cur, folder],
				);
			},
			deleteRoutineFolder: (id: string) =>
				commit(
					"routineFolders",
					ref.current.routineFolders.filter((f) => f.id !== id),
				),

			saveGym: (gym: Gym) => {
				const cur = ref.current.gyms;
				commit(
					"gyms",
					cur.some((g) => g.id === gym.id)
						? cur.map((g) => (g.id === gym.id ? gym : g))
						: [...cur, gym],
				);
			},
			deleteGym: (id: string) =>
				commit(
					"gyms",
					ref.current.gyms.filter((g) => g.id !== id),
				),

			/** One entry per date; saving the same date merges into it. */
			saveMeasurement: (m: Measurement) => {
				const rest = ref.current.measurements.filter((x) => x.date !== m.date);
				const prev = ref.current.measurements.find((x) => x.date === m.date);
				commit(
					"measurements",
					[...rest, { ...prev, ...m }].sort((a, b) =>
						a.date.localeCompare(b.date),
					),
				);
			},
			deleteMeasurement: (date: string) =>
				commit(
					"measurements",
					ref.current.measurements.filter((m) => m.date !== date),
				),

			addPhoto: (photo: ProgressPhoto) =>
				commit(
					"photos",
					[...ref.current.photos, photo].sort((a, b) =>
						b.date.localeCompare(a.date),
					),
				),
			deletePhoto: (id: string) =>
				commit(
					"photos",
					ref.current.photos.filter((p) => p.id !== id),
				),

			saveGoal: (goal: TargetGoal) => {
				const cur = ref.current.goals;
				commit(
					"goals",
					cur.some((g) => g.id === goal.id)
						? cur.map((g) => (g.id === goal.id ? goal : g))
						: [...cur, goal],
				);
			},
			deleteGoal: (id: string) =>
				commit(
					"goals",
					ref.current.goals.filter((g) => g.id !== id),
				),

			planWorkout: (date: string, plan: PlannedWorkout) =>
				commit("planned", { ...ref.current.planned, [date]: plan }),
			clearPlan: (date: string) => {
				const next = { ...ref.current.planned };
				delete next[date];
				commit("planned", next);
			},
			movePlan: (from: string, to: string) => {
				const plan = ref.current.planned[from];
				if (!plan) return;
				const next = { ...ref.current.planned };
				delete next[from];
				next[to] = { ...plan, skipped: false };
				commit("planned", next);
			},

			exportExtras: (): ExtrasData => ref.current,
			importExtras: async (raw: Partial<ExtrasData> | undefined) => {
				const next = { ...EMPTY, ...(raw ?? {}) };
				ref.current = next;
				setData(next);
				await Promise.all(
					(Object.keys(KEYS) as (keyof ExtrasData)[]).map((k) =>
						db.setKV(KEYS[k], next[k]),
					),
				);
			},
			wipeExtras: async () => {
				ref.current = EMPTY;
				setData(EMPTY);
			},
		}),
		[commit],
	);

	return { ...data, ...actions };
}

const ExtrasContext = createContext<ReturnType<typeof useExtrasValue> | null>(
	null,
);

export function ExtrasProvider({ children }: { children: ReactNode }) {
	const value = useExtrasValue();
	return (
		<ExtrasContext.Provider value={value}>{children}</ExtrasContext.Provider>
	);
}

export function useExtras() {
	const ctx = useContext(ExtrasContext);
	if (!ctx) throw new Error("useExtras must be used inside ExtrasProvider");
	return ctx;
}
