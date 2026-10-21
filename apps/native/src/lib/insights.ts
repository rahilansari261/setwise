import { lbToKg } from "@/src/lib/calc";
import { addDays, fromISO, startOfWeek } from "@/src/lib/dates";
import { countsAsWork, setVolume } from "@/src/lib/sets";
import { exerciseSessions, hasLogged, weekStreak } from "@/src/lib/stats";
import type {
	Category,
	Gender,
	Measurement,
	TargetGoal,
	Unit,
	WorkoutDay,
} from "@/src/types";

type Workouts = Record<string, WorkoutDay>;

const toKg = (value: number, unit: Unit) =>
	unit === "lbs" ? lbToKg(value) : value;

// ---- strength ranking -------------------------------------------------------
// Approximate one-rep-max ÷ bodyweight multiples for a lifter at each level. They are rules of
// thumb in the spirit of the public strength-standard tables, not an official scale.

export const LEVELS = [
	"Beginner",
	"Novice",
	"Intermediate",
	"Advanced",
	"Elite",
] as const;
export type Level = (typeof LEVELS)[number];

interface Standard {
	key: string;
	name: string;
	exerciseIds: string[];
	/** Male multiples of bodyweight for Beginner…Elite. */
	ratios: [number, number, number, number, number];
}

export const STANDARDS: Standard[] = [
	{
		key: "squat",
		name: "Back squat",
		exerciseIds: ["barbell-back-squat"],
		ratios: [0.75, 1.25, 1.75, 2.25, 2.75],
	},
	{
		key: "bench",
		name: "Bench press",
		exerciseIds: ["barbell-bench-press"],
		ratios: [0.5, 0.75, 1.25, 1.75, 2.0],
	},
	{
		key: "deadlift",
		name: "Deadlift",
		exerciseIds: ["conventional-deadlift"],
		ratios: [1.0, 1.5, 2.0, 2.5, 3.0],
	},
	{
		key: "ohp",
		name: "Overhead press",
		exerciseIds: ["overhead-press"],
		ratios: [0.35, 0.55, 0.8, 1.1, 1.4],
	},
	{
		key: "row",
		name: "Barbell row",
		exerciseIds: ["barbell-row"],
		ratios: [0.5, 0.75, 1.0, 1.5, 1.75],
	},
];

const GENDER_FACTOR: Record<Gender, number> = {
	male: 1,
	female: 0.65,
	other: 0.82,
};

export interface RankedLift {
	key: string;
	name: string;
	/** Best estimated 1RM in kg, 0 when never logged. */
	e1rmKg: number;
	ratio: number;
	level: Level | "Untrained";
	/** 0–1 position inside the whole Beginner→Elite range. */
	progress: number;
	nextLevel?: Level;
	nextTargetKg?: number;
}

export function strengthRanking(
	workouts: Workouts,
	unit: Unit,
	bodyweightKg: number,
	gender: Gender,
): RankedLift[] {
	const factor = GENDER_FACTOR[gender];
	return STANDARDS.map((std) => {
		let best = 0;
		for (const id of std.exerciseIds)
			for (const s of exerciseSessions(workouts, id))
				best = Math.max(best, s.e1rm);
		const e1rmKg = toKg(best, unit);
		const ratio = bodyweightKg > 0 ? e1rmKg / bodyweightKg : 0;
		const thresholds = std.ratios.map((r) => r * factor);
		let idx = -1;
		thresholds.forEach((t, i) => {
			if (ratio >= t) idx = i;
		});
		const top = thresholds[4] ?? 1;
		const nextIdx = idx + 1;
		return {
			key: std.key,
			name: std.name,
			e1rmKg,
			ratio,
			level: idx < 0 ? "Untrained" : (LEVELS[idx] as Level),
			progress: Math.min(1, ratio / top),
			nextLevel: nextIdx < LEVELS.length ? LEVELS[nextIdx] : undefined,
			nextTargetKg:
				nextIdx < LEVELS.length
					? Math.round((thresholds[nextIdx] ?? 0) * bodyweightKg)
					: undefined,
		};
	});
}

// ---- muscle recovery ----------------------------------------------------------

export const RECOVERY_CATEGORIES: Category[] = [
	"Chest",
	"Back",
	"Legs",
	"Shoulders",
	"Arms",
	"Core",
];

const BASE_RECOVERY_HOURS: Partial<Record<Category, number>> = {
	Legs: 60,
	Back: 54,
	Chest: 48,
	Shoulders: 42,
	Arms: 36,
	Core: 30,
};

export interface MuscleRecovery {
	category: Category;
	lastTrained?: number;
	sets: number;
	hoursSince?: number;
	needHours: number;
	/** 0–1, 1 = fully recovered. 1 also for muscles not trained recently. */
	recovered: number;
	state: "ready" | "almost" | "recovering" | "fresh";
}

/** Fatigue model: heavier sessions (more sets, higher RPE) need longer. A rule of thumb, not science. */
export function muscleRecovery(
	workouts: Workouts,
	now = Date.now(),
): MuscleRecovery[] {
	return RECOVERY_CATEGORIES.map((category) => {
		let last = 0;
		let sets = 0;
		let rpeSum = 0;
		let rpeN = 0;
		const dates = Object.keys(workouts).sort().reverse();
		for (const date of dates) {
			const day = workouts[date];
			if (!day) continue;
			let hit = 0;
			let stamp = 0;
			for (const we of day.exercises) {
				if (we.category !== category) continue;
				for (const s of we.sets) {
					if (!s.completed || !countsAsWork(s)) continue;
					hit++;
					stamp = Math.max(stamp, s.completedAt ?? 0);
					if (s.rpe) {
						rpeSum += s.rpe;
						rpeN++;
					}
				}
			}
			if (hit > 0) {
				last = stamp || fromISO(date).getTime() + 12 * 3_600_000;
				sets = hit;
				break;
			}
		}
		const base = BASE_RECOVERY_HOURS[category] ?? 48;
		const needHours = Math.min(
			96,
			base + Math.max(0, sets - 6) * 3 + (rpeN && rpeSum / rpeN >= 9 ? 12 : 0),
		);
		if (!last)
			return { category, sets: 0, needHours, recovered: 1, state: "fresh" };
		const hoursSince = Math.max(0, (now - last) / 3_600_000);
		const recovered = Math.min(1, hoursSince / needHours);
		return {
			category,
			lastTrained: last,
			sets,
			hoursSince,
			needHours,
			recovered,
			state:
				recovered >= 1 ? "ready" : recovered >= 0.7 ? "almost" : "recovering",
		};
	});
}

// ---- training zones -------------------------------------------------------------

export interface ZoneSplit {
	zone: "strength" | "hypertrophy" | "endurance";
	label: string;
	range: string;
	sets: number;
	pct: number;
}

export function trainingZones(
	workouts: Workouts,
	fromDate: string,
): ZoneSplit[] {
	const counts = { strength: 0, hypertrophy: 0, endurance: 0 };
	for (const [date, day] of Object.entries(workouts)) {
		if (date < fromDate) continue;
		for (const we of day.exercises)
			for (const s of we.sets) {
				if (!s.completed || !countsAsWork(s) || s.weight <= 0 || s.reps <= 0)
					continue;
				if (s.reps <= 5) counts.strength++;
				else if (s.reps <= 12) counts.hypertrophy++;
				else counts.endurance++;
			}
	}
	const total = counts.strength + counts.hypertrophy + counts.endurance;
	const mk = (
		zone: ZoneSplit["zone"],
		label: string,
		range: string,
	): ZoneSplit => ({
		zone,
		label,
		range,
		sets: counts[zone],
		pct: total ? counts[zone] / total : 0,
	});
	return [
		mk("strength", "Strength", "1–5 reps"),
		mk("hypertrophy", "Muscle size", "6–12 reps"),
		mk("endurance", "Endurance", "13+ reps"),
	];
}

// ---- monthly recap ----------------------------------------------------------------

export interface MonthRecap {
	month: string;
	workouts: number;
	sets: number;
	volumeKg: number;
	minutes: number;
	prs: number;
	activeDays: number;
	topExercise?: { name: string; sets: number };
	topCategory?: { category: Category; sets: number };
	bestDay?: { date: string; volumeKg: number };
}

export function monthRecap(
	workouts: Workouts,
	month: string,
	unit: Unit,
): MonthRecap {
	const out: MonthRecap = {
		month,
		workouts: 0,
		sets: 0,
		volumeKg: 0,
		minutes: 0,
		prs: 0,
		activeDays: 0,
	};
	const byExercise = new Map<string, number>();
	const byCategory = new Map<Category, number>();
	for (const [date, day] of Object.entries(workouts)) {
		if (!date.startsWith(month) || !hasLogged(day)) continue;
		out.workouts++;
		out.activeDays++;
		let dayVol = 0;
		let first = Number.POSITIVE_INFINITY;
		let last = 0;
		for (const we of day.exercises)
			for (const s of we.sets) {
				if (!s.completed) continue;
				if (s.completedAt) {
					first = Math.min(first, s.completedAt);
					last = Math.max(last, s.completedAt);
				}
				if (!countsAsWork(s)) continue;
				out.sets++;
				dayVol += toKg(setVolume(s, we.dumbbellMode), unit);
				if (s.isPersonalRecord) out.prs++;
				byExercise.set(
					we.exerciseName,
					(byExercise.get(we.exerciseName) ?? 0) + 1,
				);
				byCategory.set(we.category, (byCategory.get(we.category) ?? 0) + 1);
			}
		out.volumeKg += dayVol;
		out.minutes +=
			day.finished?.durationMin ??
			(last > first ? Math.round((last - first) / 60000) : 0);
		if (!out.bestDay || dayVol > out.bestDay.volumeKg)
			out.bestDay = { date, volumeKg: dayVol };
	}
	const top = [...byExercise.entries()].sort((a, b) => b[1] - a[1])[0];
	if (top) out.topExercise = { name: top[0], sets: top[1] };
	const cat = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
	if (cat) out.topCategory = { category: cat[0], sets: cat[1] };
	return out;
}

export const monthKey = (iso: string) => iso.slice(0, 7);
export function shiftMonth(month: string, delta: number): string {
	const [y, m] = month.split("-").map(Number);
	const d = new Date(y ?? 1970, (m ?? 1) - 1 + delta, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---- achievements -------------------------------------------------------------------

export interface Achievement {
	id: string;
	title: string;
	desc: string;
	progress: number;
	target: number;
	done: boolean;
}

export function achievements(
	workouts: Workouts,
	unit: Unit,
	today: string,
): Achievement[] {
	let sessions = 0;
	let prs = 0;
	let volumeKg = 0;
	let sets = 0;
	let maxWeekSessions = 0;
	const perWeek = new Map<string, number>();
	for (const [date, day] of Object.entries(workouts)) {
		if (!hasLogged(day)) continue;
		sessions++;
		const wk = startOfWeek(date);
		perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1);
		for (const we of day.exercises)
			for (const s of we.sets) {
				if (!s.completed) continue;
				if (s.isPersonalRecord) prs++;
				if (!countsAsWork(s)) continue;
				sets++;
				volumeKg += toKg(setVolume(s, we.dumbbellMode), unit);
			}
	}
	for (const n of perWeek.values())
		maxWeekSessions = Math.max(maxWeekSessions, n);
	const streak = weekStreak(workouts, today);

	const tiers = (
		idPrefix: string,
		value: number,
		steps: number[],
		title: (n: number) => string,
		desc: (n: number) => string,
	): Achievement[] =>
		steps.map((n) => ({
			id: `${idPrefix}-${n}`,
			title: title(n),
			desc: desc(n),
			progress: Math.min(value, n),
			target: n,
			done: value >= n,
		}));

	return [
		...tiers(
			"sessions",
			sessions,
			[1, 10, 25, 50, 100, 250],
			(n) => (n === 1 ? "First rep" : `${n} workouts`),
			(n) => `Log ${n} workout${n > 1 ? "s" : ""}`,
		),
		...tiers(
			"streak",
			streak,
			[2, 4, 8, 12, 26, 52],
			(n) => `${n}-week streak`,
			(n) => `Train every week for ${n} weeks`,
		),
		...tiers(
			"volume",
			volumeKg,
			[10_000, 100_000, 500_000, 1_000_000],
			(n) => `${n >= 1_000_000 ? "1M" : `${n / 1000}k`} kg moved`,
			(n) => `Lift ${n.toLocaleString()} kg in total`,
		),
		...tiers(
			"prs",
			prs,
			[1, 10, 25, 50],
			(n) => (n === 1 ? "Record breaker" : `${n} PRs`),
			(n) => `Set ${n} personal record${n > 1 ? "s" : ""}`,
		),
		...tiers(
			"sets",
			sets,
			[100, 500, 1000, 5000],
			(n) => `${n.toLocaleString()} sets`,
			(n) => `Complete ${n.toLocaleString()} working sets`,
		),
		{
			id: "week-4",
			title: "Four in a week",
			desc: "Train on four different days in one week",
			progress: Math.min(maxWeekSessions, 4),
			target: 4,
			done: maxWeekSessions >= 4,
		},
	];
}

// ---- goals ---------------------------------------------------------------------------

export interface GoalProgress {
	current: number;
	/** 0–1 */
	fraction: number;
	done: boolean;
}

export function latestBodyweightKg(
	measurements: Measurement[],
	profileKg: number,
): number {
	for (let i = measurements.length - 1; i >= 0; i--) {
		const w = measurements[i]?.weightKg;
		if (w) return w;
	}
	return profileKg;
}

export function goalProgress(
	goal: TargetGoal,
	ctx: {
		workouts: Workouts;
		measurements: Measurement[];
		profileKg: number;
		unit: Unit;
		today: string;
	},
): GoalProgress {
	let current = 0;
	if (goal.kind === "bodyweight") {
		const kg = latestBodyweightKg(ctx.measurements, ctx.profileKg);
		current = ctx.unit === "lbs" ? Math.round(kg * 2.20462 * 10) / 10 : kg;
	} else if (goal.kind === "lift") {
		for (const s of exerciseSessions(ctx.workouts, goal.exerciseId ?? ""))
			current = Math.max(current, s.e1rm);
	} else {
		const monday = startOfWeek(ctx.today);
		for (let i = 0; i < 7; i++)
			if (hasLogged(ctx.workouts[addDays(monday, i)])) current++;
	}
	const span = goal.target - goal.start;
	const fraction =
		goal.kind === "weekly_workouts"
			? Math.min(1, current / goal.target)
			: span === 0
				? 1
				: Math.max(0, Math.min(1, (current - goal.start) / span));
	return { current, fraction, done: fraction >= 1 };
}
