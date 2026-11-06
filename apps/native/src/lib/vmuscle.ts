import type { Category, Exercise, WorkoutDay, WorkoutSet } from "@/src/types";

/** The muscle groups that matter for a V-taper, in priority order. */
export type VGroup =
	| "Lats"
	| "Side delts"
	| "Rear delts"
	| "Upper back"
	| "Chest"
	| "Front delts"
	| "Arms"
	| "Legs"
	| "Core";

export interface VGroupInfo {
	group: VGroup;
	/** Weekly working-set range to aim for. */
	min: number;
	max: number;
	/** What it does for the taper. */
	why: string;
}

// Ranges follow the common 10–20 hard sets per muscle per week guidance for growth; priority muscles
// (the ones that widen the frame) get the top of it, front delts and abs the bottom.
export const VGROUPS: VGroupInfo[] = [
	{ group: "Lats", min: 12, max: 20, why: "Width of the back — the 'V'" },
	{ group: "Side delts", min: 12, max: 20, why: "Shoulder width" },
	{ group: "Rear delts", min: 8, max: 14, why: "Capped, 3D shoulders" },
	{ group: "Upper back", min: 8, max: 14, why: "Thickness and posture" },
	{ group: "Chest", min: 8, max: 14, why: "Fills the front of the frame" },
	{ group: "Arms", min: 8, max: 14, why: "Biceps and triceps" },
	{ group: "Legs", min: 8, max: 14, why: "Balance and hormones" },
	{ group: "Front delts", min: 0, max: 6, why: "Already hit by pressing" },
	{ group: "Core", min: 4, max: 10, why: "Keep the waist tight, not thick" },
];

const BY_TARGET: Record<string, VGroup | null> = {
	lats: "Lats",
	"upper back": "Upper back",
	traps: "Upper back",
	"levator scapulae": "Upper back",
	pectorals: "Chest",
	"serratus anterior": "Chest",
	biceps: "Arms",
	triceps: "Arms",
	forearms: "Arms",
	quads: "Legs",
	hamstrings: "Legs",
	glutes: "Legs",
	calves: "Legs",
	adductors: "Legs",
	abductors: "Legs",
	abs: "Core",
	spine: "Core",
	"cardiovascular system": null,
};

// Checked in this order: "rear lateral raise" and "front lateral raise" also contain "lateral raise".
const REAR =
	/rear delt|rear lateral|reverse (?:pec|fly|flye)|revers fly|face pull|bent[- ]over lateral|reverse peck/i;
const FRONT = /front raise|front lateral/i;
const SIDE = /lateral raise|side raise|side lateral|upright row|y-raise/i;
const LATS = /pull-?down|pull-?up|chin-?up|\blat\b|lat pull/i;

/** Which V-taper group an exercise trains, or null for cardio and the like. */
export function groupOf(ex: {
	name: string;
	category?: Category;
	target?: string;
}): VGroup | null {
	const name = ex.name;
	if (REAR.test(name)) return "Rear delts";
	if (FRONT.test(name)) return "Front delts";
	if (SIDE.test(name)) return "Side delts";
	if (ex.target === "delts" || (!ex.target && ex.category === "Shoulders"))
		return "Front delts";
	if (LATS.test(name)) return "Lats";
	if (ex.target && ex.target in BY_TARGET) return BY_TARGET[ex.target] ?? null;
	switch (ex.category) {
		case "Chest":
			return "Chest";
		case "Back":
			return /row|shrug/i.test(name) ? "Upper back" : "Lats";
		case "Arms":
			return "Arms";
		case "Legs":
			return "Legs";
		case "Core":
			return "Core";
		default:
			return null;
	}
}

export interface ExerciseLookup {
	get(id: string): Pick<Exercise, "name" | "category" | "target"> | undefined;
}

/** Working sets per group from `fromDate` on (inclusive). `counts` decides which sets are work. */
export function setsPerGroup(
	workouts: Record<string, WorkoutDay>,
	exercises: ExerciseLookup,
	fromDate: string,
	counts: (set: WorkoutSet) => boolean,
): Map<VGroup, number> {
	const out = new Map<VGroup, number>();
	for (const [date, day] of Object.entries(workouts)) {
		if (date < fromDate) continue;
		for (const we of day.exercises) {
			const known = exercises.get(we.exerciseId);
			const group = groupOf({
				name: known?.name ?? we.exerciseName,
				category: known?.category ?? we.category,
				target: known?.target,
			});
			if (!group) continue;
			const n = we.sets.filter((s) => s.completed && counts(s)).length;
			if (n) out.set(group, (out.get(group) ?? 0) + n);
		}
	}
	return out;
}

export type VStatus = "low" | "good" | "high";

export function statusOf(info: VGroupInfo, sets: number): VStatus {
	if (sets < info.min) return "low";
	if (sets > info.max) return "high";
	return "good";
}

/** Priority groups furthest below their minimum first. */
export function biggestGaps(counts: Map<VGroup, number>, limit = 3) {
	return VGROUPS.filter((g) => g.min > 0)
		.map((g) => ({
			info: g,
			missing: Math.max(0, g.min - (counts.get(g.group) ?? 0)),
		}))
		.filter((g) => g.missing > 0)
		.sort((a, b) => b.missing - a.missing)
		.slice(0, limit);
}

// ---- conditioning ---------------------------------------------------------------
// The "hybrid" half: an aesthetic physique with an engine to match.

export const CONDITIONING = {
	minSessions: 2,
	maxSessions: 4,
	/** Weekly minutes to aim for; 150 is the common health guideline for moderate cardio. */
	minMinutes: 90,
	goalMinutes: 150,
};

export interface ConditioningWeek {
	sessions: number;
	minutes: number;
	/** Kilometres or miles, in the units the sets were logged in. */
	distance: number;
}

/** Cardio days, minutes and distance from `fromDate` on (cardio = exercises in the Cardio category). */
export function conditioningWeek(
	workouts: Record<string, WorkoutDay>,
	exercises: ExerciseLookup,
	fromDate: string,
): ConditioningWeek {
	let sessions = 0;
	let seconds = 0;
	let distance = 0;
	for (const [date, day] of Object.entries(workouts)) {
		if (date < fromDate) continue;
		let cardioToday = false;
		for (const we of day.exercises) {
			const category = exercises.get(we.exerciseId)?.category ?? we.category;
			if (category !== "Cardio") continue;
			for (const s of we.sets) {
				if (!s.completed) continue;
				cardioToday = true;
				seconds += s.timeSeconds ?? 0;
				distance += s.distance ?? 0;
			}
		}
		if (cardioToday) sessions++;
	}
	return {
		sessions,
		minutes: Math.round(seconds / 60),
		distance: Math.round(distance * 10) / 10,
	};
}
