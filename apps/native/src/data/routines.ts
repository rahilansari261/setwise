import type { Routine, SplitId } from "@/src/types";

// V-taper programs for the aesthetic hybrid athlete: lats and side delts get the most work, rear delts
// and upper back next, front delts mostly through pressing, waist trained for tightness rather than size,
// and a short conditioning finisher so the physique comes with an engine.
export const DEFAULT_ROUTINES: Routine[] = [
	{
		id: "vt-full-body",
		name: "V-Taper Full Body",
		description:
			"Three days a week for your first year. Every session hits lats and side delts and ends with a short conditioning finisher.",
		days: [
			{
				name: "Full Body A",
				exerciseIds: [
					"barbell-back-squat",
					"lat-pulldown",
					"incline-dumbbell-bench-press",
					"dumbbell-lateral-raise",
					"face-pull",
					"plank",
					"rowing-machine",
				],
			},
			{
				name: "Full Body B",
				exerciseIds: [
					"romanian-deadlift",
					"seated-cable-row",
					"dumbbell-shoulder-press",
					"cable-lateral-raise",
					"incline-dumbbell-curl",
					"hanging-leg-raise",
					"stationary-bike",
				],
			},
			{
				name: "Full Body C",
				exerciseIds: [
					"leg-press",
					"chin-up",
					"incline-barbell-bench-press",
					"dumbbell-lateral-raise",
					"reverse-pec-deck-fly",
					"cable-rope-triceps-pushdown",
					"jump-rope",
				],
			},
		],
	},
	{
		id: "vt-upper-lower",
		name: "V-Taper Upper / Lower",
		description:
			"Four days. Upper A builds width, Upper B builds the shoulders; lower days finish with cardio.",
		days: [
			{
				name: "Upper A · Width",
				exerciseIds: [
					"pull-up",
					"incline-dumbbell-bench-press",
					"dumbbell-lateral-raise",
					"seated-cable-row",
					"lib-0238",
					"face-pull",
					"incline-dumbbell-curl",
					"cable-rope-triceps-pushdown",
				],
			},
			{
				name: "Lower A",
				exerciseIds: [
					"barbell-back-squat",
					"romanian-deadlift",
					"leg-extension",
					"lying-leg-curl",
					"standing-calf-raise",
					"hanging-leg-raise",
					"rowing-machine",
				],
			},
			{
				name: "Upper B · Shoulders",
				exerciseIds: [
					"lat-pulldown",
					"dumbbell-shoulder-press",
					"cable-lateral-raise",
					"lib-0327",
					"incline-barbell-bench-press",
					"reverse-pec-deck-fly",
					"dumbbell-hammer-curl",
					"overhead-triceps-extension",
				],
			},
			{
				name: "Lower B",
				exerciseIds: [
					"leg-press",
					"bulgarian-split-squat",
					"hip-thrust",
					"seated-leg-curl",
					"standing-calf-raise",
					"stomach-vacuum",
					"treadmill-running",
				],
			},
		],
	},
	{
		id: "vt-ppl",
		name: "V-Taper Push / Pull / Legs",
		description:
			"Three or six days. Push is shoulder-led, pull is lat-led, legs end with conditioning.",
		days: [
			{
				name: "Push",
				exerciseIds: [
					"incline-dumbbell-bench-press",
					"dumbbell-shoulder-press",
					"dumbbell-lateral-raise",
					"cable-lateral-raise",
					"chest-dips",
					"cable-rope-triceps-pushdown",
				],
			},
			{
				name: "Pull",
				exerciseIds: [
					"pull-up",
					"lat-pulldown",
					"lib-0238",
					"seated-cable-row",
					"face-pull",
					"reverse-pec-deck-fly",
					"barbell-bicep-curl",
				],
			},
			{
				name: "Legs",
				exerciseIds: [
					"barbell-back-squat",
					"romanian-deadlift",
					"leg-press",
					"lying-leg-curl",
					"standing-calf-raise",
					"hanging-leg-raise",
					"stair-climber",
				],
			},
		],
	},
	{
		id: "vt-specialization",
		name: "Shoulder & Lat Specialization",
		description:
			"Five days for experienced lifters: two width days, a dedicated shoulder day.",
		days: [
			{
				name: "Width",
				exerciseIds: [
					"pull-up",
					"lat-pulldown",
					"lib-0238",
					"dumbbell-lateral-raise",
					"lib-0584",
					"lib-0192",
				],
			},
			{
				name: "Chest & Arms",
				exerciseIds: [
					"incline-dumbbell-bench-press",
					"lib-0179",
					"chest-dips",
					"incline-dumbbell-curl",
					"cable-rope-triceps-pushdown",
				],
			},
			{
				name: "Legs",
				exerciseIds: [
					"barbell-back-squat",
					"romanian-deadlift",
					"leg-extension",
					"lying-leg-curl",
					"standing-calf-raise",
					"rowing-machine",
				],
			},
			{
				name: "Shoulders",
				exerciseIds: [
					"dumbbell-shoulder-press",
					"cable-lateral-raise",
					"lean-away-lateral-raise",
					"face-pull",
					"reverse-pec-deck-fly",
					"lib-0383",
				],
			},
			{
				name: "Back & Core",
				exerciseIds: [
					"seated-cable-row",
					"lib-0327",
					"single-arm-dumbbell-row",
					"lib-0225",
					"hanging-leg-raise",
					"stomach-vacuum",
				],
			},
		],
	},
];

/** Ids of the general-purpose routines shipped before the V-taper focus; older installs still have them. */
export const LEGACY_ROUTINE_IDS = [
	"ppl",
	"upper-lower",
	"full-body",
	"bro-split",
	"strength-5x5",
];

/** Built-in routine ids, old and new: these don't count toward the free plan's custom-routine limit. */
export const BUILT_IN_ROUTINE_IDS = new Set([
	...DEFAULT_ROUTINES.map((r) => r.id),
	...LEGACY_ROUTINE_IDS,
]);

export interface SplitOption {
	id: SplitId;
	name: string;
	description: string;
	routineId: string | null;
	/** Label per weekday, Monday first. null = rest. */
	week: (string | null)[];
}

// Split ids are stored in profiles, so the old ids are kept and now point at the V-taper programs.
export const SPLITS: SplitOption[] = [
	{
		id: "full_body",
		name: "V-Taper Full Body",
		description: "3 days · best in your first year",
		routineId: "vt-full-body",
		week: ["FULL", null, "FULL", null, "FULL", null, null],
	},
	{
		id: "upper_lower",
		name: "V-Taper Upper / Lower",
		description: "4 days · width day + shoulder day",
		routineId: "vt-upper-lower",
		week: ["UPPR", "LOWR", null, "UPPR", "LOWR", null, null],
	},
	{
		id: "ppl",
		name: "V-Taper Push / Pull / Legs",
		description: "6 days · shoulder-led push, lat-led pull",
		routineId: "vt-ppl",
		week: ["PUSH", "PULL", "LEGS", "PUSH", "PULL", "LEGS", null],
	},
	{
		id: "bro",
		name: "Shoulder & Lat Specialization",
		description: "5 days · for experienced lifters",
		routineId: "vt-specialization",
		week: ["WIDE", "CHST", "LEGS", "SHLD", "BACK", null, null],
	},
	{
		id: "custom",
		name: "Custom",
		description: "Build your own routine later",
		routineId: null,
		week: [null, null, null, null, null, null, null],
	},
];

/** The program to suggest for a training age. */
export function recommendedSplit(
	experience: "beginner" | "intermediate" | "advanced",
): SplitId {
	return experience === "beginner"
		? "full_body"
		: experience === "advanced"
			? "bro"
			: "upper_lower";
}

export function splitById(id: SplitId): SplitOption {
	return SPLITS.find((s) => s.id === id) ?? (SPLITS.at(-1) as SplitOption);
}

/** Training weekdays for a split as JS day numbers (0 = Sunday). */
export function trainingWeekdays(id: SplitId): number[] {
	const week = splitById(id).week;
	const days: number[] = [];
	week.forEach((label, mondayIndex) => {
		if (label) days.push((mondayIndex + 1) % 7);
	});
	return days;
}
