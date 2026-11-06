import { lbToKg } from "@/src/lib/calc";
import { addDays, fromISO, startOfWeek } from "@/src/lib/dates";
import { countsAsWork, setVolume } from "@/src/lib/sets";
import { exerciseSessions, hasLogged, weekStreak } from "@/src/lib/stats";
import {
	type ExerciseLookup,
	groupOf,
	VGROUPS,
	type VGroup,
} from "@/src/lib/vmuscle";
import type {
	Category,
	Measurement,
	TargetGoal,
	Unit,
	WorkoutDay,
} from "@/src/types";

type Workouts = Record<string, WorkoutDay>;

const toKg = (value: number, unit: Unit) =>
	unit === "lbs" ? lbToKg(value) : value;

// ---- muscle recovery ----------------------------------------------------------

export const RECOVERY_GROUPS: VGroup[] = VGROUPS.map((g) => g.group);

const BASE_RECOVERY_HOURS: Record<VGroup, number> = {
	Legs: 60,
	Lats: 54,
	"Upper back": 48,
	Chest: 48,
	"Front delts": 42,
	"Side delts": 36,
	"Rear delts": 36,
	Arms: 36,
	Core: 30,
};

export interface MuscleRecovery {
	group: VGroup;
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
	exercises: ExerciseLookup,
	now = Date.now(),
): MuscleRecovery[] {
	const dates = Object.keys(workouts).sort().reverse();
	return RECOVERY_GROUPS.map((group) => {
		let last = 0;
		let sets = 0;
		let rpeSum = 0;
		let rpeN = 0;
		for (const date of dates) {
			const day = workouts[date];
			if (!day) continue;
			let hit = 0;
			let stamp = 0;
			for (const we of day.exercises) {
				const known = exercises.get(we.exerciseId);
				const g = groupOf({
					name: known?.name ?? we.exerciseName,
					category: known?.category ?? we.category,
					target: known?.target,
				});
				if (g !== group) continue;
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
		const base = BASE_RECOVERY_HOURS[group];
		const needHours = Math.min(
			96,
			base + Math.max(0, sets - 6) * 3 + (rpeN && rpeSum / rpeN >= 9 ? 12 : 0),
		);
		if (!last)
			return { group, sets: 0, needHours, recovered: 1, state: "fresh" };
		const hoursSince = Math.max(0, (now - last) / 3_600_000);
		const recovered = Math.min(1, hoursSince / needHours);
		return {
			group,
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
