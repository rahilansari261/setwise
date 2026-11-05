import { DEFAULT_EXERCISES } from "@/src/data/exercises";
import { estimate1RM, roundTo } from "@/src/lib/calc";
import { addDays, fromISO, todayISO } from "@/src/lib/dates";
import type { BackupFile } from "@/src/state/workout-store";
import type {
	Settings,
	WorkoutDay,
	WorkoutExercise,
	WorkoutSet,
} from "@/src/types";

// Starting working weight (kg) and rep target for every exercise in the PPL preset.
const PLAN: Record<string, { start: number; reps: number; step: number }> = {
	"barbell-bench-press": { start: 60, reps: 6, step: 2.5 },
	"overhead-press": { start: 35, reps: 6, step: 2.5 },
	"incline-dumbbell-bench-press": { start: 20, reps: 10, step: 2 },
	"dumbbell-lateral-raise": { start: 8, reps: 14, step: 1 },
	"cable-rope-triceps-pushdown": { start: 25, reps: 12, step: 2.5 },
	"conventional-deadlift": { start: 100, reps: 5, step: 5 },
	"barbell-row": { start: 55, reps: 8, step: 2.5 },
	"lat-pulldown": { start: 50, reps: 10, step: 2.5 },
	"face-pull": { start: 20, reps: 15, step: 2.5 },
	"barbell-bicep-curl": { start: 25, reps: 10, step: 2.5 },
	"dumbbell-hammer-curl": { start: 12, reps: 12, step: 1 },
	"barbell-back-squat": { start: 80, reps: 6, step: 2.5 },
	"romanian-deadlift": { start: 70, reps: 8, step: 2.5 },
	"leg-press": { start: 140, reps: 10, step: 10 },
	"lying-leg-curl": { start: 35, reps: 12, step: 2.5 },
	"standing-calf-raise": { start: 60, reps: 15, step: 5 },
};

const DAYS = [
	{
		name: "Push",
		ids: [
			"barbell-bench-press",
			"overhead-press",
			"incline-dumbbell-bench-press",
			"dumbbell-lateral-raise",
			"cable-rope-triceps-pushdown",
		],
	},
	{
		name: "Pull",
		ids: [
			"conventional-deadlift",
			"barbell-row",
			"lat-pulldown",
			"face-pull",
			"barbell-bicep-curl",
			"dumbbell-hammer-curl",
		],
	},
	{
		name: "Legs",
		ids: [
			"barbell-back-squat",
			"romanian-deadlift",
			"leg-press",
			"lying-leg-curl",
			"standing-calf-raise",
		],
	},
];

/** Small deterministic PRNG so every run produces the same history. */
function prng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 2 ** 32;
	};
}

/**
 * Builds about six months of Push/Pull/Legs history ending yesterday: six training days a week,
 * roughly one missed session in ten, steady progression with a lighter week every eighth week.
 */
export function buildDemoBackup(settings: Settings, months = 6): BackupFile {
	const rand = prng(42);
	const byId = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e]));
	const end = addDays(todayISO(), -1);
	const start = addDays(end, -Math.round(months * 30.4));
	const best = new Map<string, number>();
	const workouts: Record<string, WorkoutDay> = {};
	let rotation = 0;
	let n = 0;

	for (let date = start; date <= end; date = addDays(date, 1)) {
		const d = fromISO(date);
		if (d.getDay() === 0 || rand() < 0.1) continue; // Sundays off, plus the odd missed day
		const week = Math.floor(
			(d.getTime() - fromISO(start).getTime()) / (7 * 86_400_000),
		);
		const deload = week % 8 === 7;
		const day = DAYS[rotation % DAYS.length] ?? DAYS[0];
		rotation++;
		if (!day) continue;

		let clock = new Date(
			d.getFullYear(),
			d.getMonth(),
			d.getDate(),
			18,
			Math.floor(rand() * 40),
		).getTime();
		const tick = (ms: number) => {
			clock += ms;
			return clock;
		};
		const exercises: WorkoutExercise[] = day.ids.map((id, exIndex) => {
			const plan = PLAN[id] ?? { start: 20, reps: 10, step: 2.5 };
			const ex = byId.get(id);
			// About one step every two weeks, flattening out over time.
			const progress = Math.floor(Math.sqrt(week) * 2.2) * plan.step;
			const working = roundTo(
				(plan.start + progress) * (deload ? 0.85 : 1),
				plan.step >= 2.5 ? 2.5 : 1,
			);
			const sets: WorkoutSet[] = [];
			if (exIndex === 0) {
				sets.push(
					makeSet(1, roundTo(working * 0.5, 2.5), 10, "warmup", tick(120_000)),
				);
			}
			const workingSets = exIndex < 2 ? 4 : 3;
			for (let i = 0; i < workingSets; i++) {
				const reps = Math.max(
					1,
					plan.reps +
						Math.round((rand() - 0.6) * 2) -
						(i === workingSets - 1 ? 1 : 0),
				);
				const set = makeSet(
					sets.length + 1,
					working,
					reps,
					"normal",
					tick(150_000 + rand() * 60_000),
				);
				const e1rm = estimate1RM(set.weight, set.reps);
				const prior = best.get(id);
				if (prior !== undefined && e1rm > prior) set.isPersonalRecord = true;
				if (prior === undefined || e1rm > prior) best.set(id, e1rm);
				sets.push(set);
			}
			return {
				id: `demo-we-${n++}`,
				exerciseId: id,
				exerciseName: ex?.name ?? id,
				category: ex?.category ?? "Other",
				sets,
			};
		});
		workouts[date] = { date, title: day.name, exercises };
	}

	return {
		app: "setwise",
		version: 1,
		exportedAt: new Date().toISOString(),
		profile: null,
		settings: { ...settings, unit: "kg" },
		customExercises: [],
		routines: [],
		activeRoutine: { routineId: "ppl", nextDayIndex: rotation % DAYS.length },
		workouts,
	};

	function makeSet(
		setNumber: number,
		weight: number,
		reps: number,
		setType: WorkoutSet["setType"],
		at: number,
	): WorkoutSet {
		return {
			id: `demo-set-${n++}`,
			setNumber,
			weight,
			reps,
			completed: true,
			completedAt: at,
			setType,
		};
	}
}
