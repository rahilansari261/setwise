import type { BodyMeasurement, Exercise, WorkoutDay } from "@/src/types";

// Kept free of "@/" value imports so `node --test` can load it directly.

/** Shoulder-to-waist ratio of the classic V-taper ("Adonis index"). */
export const GOLDEN_RATIO = 1.618;
/** Where the progress bar starts; most untrained men measure around here. */
const RATIO_FLOOR = 1.2;

export type FocusMuscle = "lats" | "side_delts" | "rear_delts" | "upper_chest";

export interface FocusTarget {
	id: FocusMuscle;
	name: string;
	/** Hard sets per week that reliably grow the muscle. */
	min: number;
	max: number;
}

/** The muscles that build the V: width up top (lats, delts) and a full upper chest. */
export const FOCUS_TARGETS: FocusTarget[] = [
	{ id: "lats", name: "Lats", min: 12, max: 18 },
	{ id: "side_delts", name: "Side delts", min: 12, max: 20 },
	{ id: "rear_delts", name: "Rear delts", min: 8, max: 12 },
	{ id: "upper_chest", name: "Upper chest", min: 8, max: 12 },
];

const FOCUS_BY_EXERCISE: Record<string, FocusMuscle> = {
	"pull-up": "lats",
	"wide-grip-pull-up": "lats",
	"chin-up": "lats",
	"lat-pulldown": "lats",
	"single-arm-lat-pulldown": "lats",
	"straight-arm-pulldown": "lats",
	"single-arm-dumbbell-row": "lats",
	"seated-cable-row": "lats",
	"barbell-row": "lats",
	"t-bar-row": "lats",
	"dumbbell-lateral-raise": "side_delts",
	"cable-lateral-raise": "side_delts",
	"machine-lateral-raise": "side_delts",
	"cable-y-raise": "side_delts",
	"face-pull": "rear_delts",
	"reverse-pec-deck-fly": "rear_delts",
	"rear-delt-dumbbell-fly": "rear_delts",
	"incline-barbell-bench-press": "upper_chest",
	"incline-dumbbell-bench-press": "upper_chest",
	"low-to-high-cable-fly": "upper_chest",
};

/** Custom exercises have no fixed id, so their name decides. */
const FOCUS_BY_NAME: [RegExp, FocusMuscle][] = [
	[/rear delt|face pull|reverse (pec|fly)/i, "rear_delts"],
	[/lateral raise|side raise|y[- ]raise/i, "side_delts"],
	[/pull[- ]?up|chin[- ]?up|pulldown|pull[- ]?down|\brow\b|pullover/i, "lats"],
	[/incline|low[- ]to[- ]high/i, "upper_chest"],
];

export function focusMuscle(
	exerciseId: string,
	exerciseName: string,
): FocusMuscle | null {
	const byId = FOCUS_BY_EXERCISE[exerciseId];
	if (byId) return byId;
	for (const [pattern, muscle] of FOCUS_BY_NAME) {
		if (pattern.test(exerciseName)) return muscle;
	}
	return null;
}

/** True for exercises that count toward a V-taper muscle; used to badge them in lists. */
export const isFocusExercise = (exercise: Pick<Exercise, "id" | "name">) =>
	focusMuscle(exercise.id, exercise.name) !== null;

/** Logged working sets (warm-ups excluded) per focus muscle for dates in [from, to). */
export function focusSets(
	workouts: Record<string, WorkoutDay>,
	from: string,
	to: string,
): Record<FocusMuscle, number> {
	const out: Record<FocusMuscle, number> = {
		lats: 0,
		side_delts: 0,
		rear_delts: 0,
		upper_chest: 0,
	};
	for (const [date, day] of Object.entries(workouts)) {
		if (date < from || date >= to) continue;
		for (const we of day.exercises) {
			const muscle = focusMuscle(we.exerciseId, we.exerciseName);
			if (!muscle) continue;
			out[muscle] += we.sets.filter(
				(s) => s.completed && s.setType !== "warmup",
			).length;
		}
	}
	return out;
}

/** Shoulders ÷ waist to two decimals, or null until both are measured. */
export function vTaperRatio(m: BodyMeasurement | undefined): number | null {
	if (!m?.shouldersCm || !m.waistCm) return null;
	return Math.round((m.shouldersCm / m.waistCm) * 100) / 100;
}

/** 0 at a 1.2 ratio, 1 at the golden ratio. */
export function ratioProgress(ratio: number): number {
	const p = (ratio - RATIO_FLOOR) / (GOLDEN_RATIO - RATIO_FLOOR);
	return Math.min(1, Math.max(0, p));
}

/** The waist that would hit the golden ratio at the current shoulder width. */
export function goalWaistCm(shouldersCm: number): number {
	return Math.round((shouldersCm / GOLDEN_RATIO) * 10) / 10;
}

/** Measurements sorted oldest first, one per date (a later write for the same date wins). */
export function upsertMeasurement(
	list: BodyMeasurement[],
	entry: BodyMeasurement,
): BodyMeasurement[] {
	return [...list.filter((m) => m.date !== entry.date), entry].sort((a, b) =>
		a.date.localeCompare(b.date),
	);
}

/** Newest entry that has both numbers the ratio needs. */
export function latestWithRatio(
	list: BodyMeasurement[],
): BodyMeasurement | undefined {
	for (let i = list.length - 1; i >= 0; i--) {
		if (vTaperRatio(list[i]) !== null) return list[i];
	}
	return undefined;
}

export const cmToIn = (cm: number) => Math.round((cm / 2.54) * 10) / 10;
export const inToCm = (inches: number) => Math.round(inches * 2.54 * 10) / 10;
