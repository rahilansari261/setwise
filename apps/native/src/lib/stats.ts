import { distanceUnit, estimate1RM, fmt, fmtSetTime } from "@/src/lib/calc";
import { addDays, startOfWeek } from "@/src/lib/dates";
import { countsAsWork, setVolume } from "@/src/lib/sets";
import type { Category, MetricType, Unit, WorkoutDay } from "@/src/types";

export function dayStats(day: WorkoutDay | undefined) {
	let volume = 0;
	let done = 0;
	let total = 0;
	let first = Number.POSITIVE_INFINITY;
	let last = 0;
	for (const we of day?.exercises ?? []) {
		for (const s of we.sets) {
			total++;
			if (!s.completed) continue;
			done++;
			volume += setVolume(s, we.dumbbellMode);
			if (s.completedAt) {
				first = Math.min(first, s.completedAt);
				last = Math.max(last, s.completedAt);
			}
		}
	}
	const durationSec = last > first ? (last - first) / 1000 : 0;
	return {
		volume,
		done,
		total,
		durationSec,
		exercises: day?.exercises.length ?? 0,
	};
}

export const hasLogged = (day: WorkoutDay | undefined) =>
	Boolean(day?.exercises.some((we) => we.sets.some((s) => s.completed)));

/** Consecutive weeks with at least one logged workout. The current week only counts once it has one. */
export function weekStreak(
	workouts: Record<string, WorkoutDay>,
	today: string,
): number {
	const weekHasWorkout = (monday: string) =>
		Array.from({ length: 7 }, (_, i) => addDays(monday, i)).some((d) =>
			hasLogged(workouts[d]),
		);
	let monday = startOfWeek(today);
	if (!weekHasWorkout(monday)) monday = addDays(monday, -7);
	let streak = 0;
	while (weekHasWorkout(monday) && streak < 520) {
		streak++;
		monday = addDays(monday, -7);
	}
	return streak;
}

export type ProgressMetric =
	| "e1rm"
	| "weight"
	| "volume"
	| "reps"
	| "time"
	| "distance";

/** One set as text for its exercise type: "60 × 8", "12 reps", "1:30" or "3.1 km in 25:00". */
export function setSummary(
	s: { weight: number; reps: number; distance?: number; timeSeconds?: number },
	metric: MetricType,
	unit: Unit,
): string {
	if (metric === "reps_only") return `${s.reps} reps`;
	if (metric === "time_only") return fmtSetTime(s.timeSeconds ?? 0);
	if (metric === "distance_time") {
		const dist = s.distance
			? `${fmt(s.distance, 2)} ${distanceUnit(unit)}`
			: "";
		const time = s.timeSeconds ? fmtSetTime(s.timeSeconds) : "";
		return dist && time ? `${dist} in ${time}` : dist || time || "—";
	}
	return `${fmt(s.weight)} × ${s.reps}`;
}

export interface ExerciseSession {
	date: string;
	bestSet: { weight: number; reps: number };
	e1rm: number;
	maxWeight: number;
	volume: number;
	sets: number;
	/** Best single-set values, for reps-only, timed and distance exercises. */
	maxReps: number;
	maxTime: number;
	maxDistance: number;
	/** The set with the longest distance, with its time. */
	bestDistanceSet: { distance: number; timeSeconds: number };
}

/** One point per day the exercise was logged, oldest first. Warm-ups don't count. */
export function exerciseSessions(
	workouts: Record<string, WorkoutDay>,
	exerciseId: string,
): ExerciseSession[] {
	const out: ExerciseSession[] = [];
	for (const date of Object.keys(workouts).sort()) {
		let best = { weight: 0, reps: 0 };
		let e1rm = 0;
		let maxWeight = 0;
		let volume = 0;
		let sets = 0;
		let maxReps = 0;
		let maxTime = 0;
		let maxDistance = 0;
		let bestDistanceSet = { distance: 0, timeSeconds: 0 };
		for (const we of workouts[date]?.exercises ?? []) {
			if (we.exerciseId !== exerciseId) continue;
			for (const s of we.sets) {
				if (!s.completed || !countsAsWork(s)) continue;
				sets++;
				volume += setVolume(s, we.dumbbellMode);
				maxWeight = Math.max(maxWeight, s.weight);
				maxReps = Math.max(maxReps, s.reps || 0);
				maxTime = Math.max(maxTime, s.timeSeconds ?? 0);
				if ((s.distance ?? 0) > maxDistance) {
					maxDistance = s.distance ?? 0;
					bestDistanceSet = {
						distance: maxDistance,
						timeSeconds: s.timeSeconds ?? 0,
					};
				}
				const est = estimate1RM(s.weight, s.reps);
				if (est > e1rm) {
					e1rm = est;
					best = { weight: s.weight, reps: s.reps };
				}
			}
		}
		if (sets > 0)
			out.push({
				date,
				bestSet: best,
				e1rm,
				maxWeight,
				volume,
				sets,
				maxReps,
				maxTime,
				maxDistance,
				bestDistanceSet,
			});
	}
	return out;
}

export function metricValue(
	s: ExerciseSession,
	metric: ProgressMetric,
): number {
	if (metric === "reps") return s.maxReps;
	if (metric === "time") return s.maxTime;
	if (metric === "distance") return s.maxDistance;
	if (metric === "weight") return s.maxWeight;
	if (metric === "volume") return s.volume;
	return s.e1rm;
}

/** Completed working sets per muscle group since `fromDate`. */
export function setsByCategory(
	workouts: Record<string, WorkoutDay>,
	fromDate: string,
) {
	const counts = new Map<Category, number>();
	for (const [date, day] of Object.entries(workouts)) {
		if (date < fromDate) continue;
		for (const we of day.exercises) {
			const n = we.sets.filter((s) => s.completed && countsAsWork(s)).length;
			if (n) counts.set(we.category, (counts.get(we.category) ?? 0) + n);
		}
	}
	return [...counts.entries()]
		.map(([category, sets]) => ({ category, sets }))
		.sort((a, b) => b.sets - a.sets);
}
