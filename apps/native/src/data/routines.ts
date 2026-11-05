import type { Routine, SplitId } from "@/src/types";

// Every default routine is built around the V-taper: lats and side delts get the most weekly sets,
// rear delts and upper chest round out the frame, and legs are kept to what balance needs.
export const DEFAULT_ROUTINES: Routine[] = [
	{
		id: "vt-ppl",
		name: "V-Taper Push / Pull / Legs",
		description:
			"Six days. Side delts on every push and leg day, two lat movements on every pull day.",
		days: [
			{
				name: "Push · Delts",
				exerciseIds: [
					"incline-barbell-bench-press",
					"dumbbell-shoulder-press",
					"cable-lateral-raise",
					"low-to-high-cable-fly",
					"dumbbell-lateral-raise",
					"overhead-triceps-extension",
				],
			},
			{
				name: "Pull · Width",
				exerciseIds: [
					"wide-grip-pull-up",
					"lat-pulldown",
					"straight-arm-pulldown",
					"single-arm-dumbbell-row",
					"reverse-pec-deck-fly",
					"dumbbell-hammer-curl",
				],
			},
			{
				name: "Legs · Core",
				exerciseIds: [
					"barbell-back-squat",
					"romanian-deadlift",
					"lying-leg-curl",
					"standing-calf-raise",
					"cable-lateral-raise",
					"stomach-vacuum",
				],
			},
		],
	},
	{
		id: "vt-upper-lower",
		name: "V-Taper Upper / Lower",
		description:
			"Four days. Each upper day trains lats, side delts, rear delts and upper chest.",
		days: [
			{
				name: "Upper A",
				exerciseIds: [
					"pull-up",
					"incline-dumbbell-bench-press",
					"seated-cable-row",
					"dumbbell-lateral-raise",
					"face-pull",
					"cable-rope-triceps-pushdown",
				],
			},
			{
				name: "Lower A",
				exerciseIds: [
					"barbell-back-squat",
					"romanian-deadlift",
					"lying-leg-curl",
					"standing-calf-raise",
					"stomach-vacuum",
				],
			},
			{
				name: "Upper B",
				exerciseIds: [
					"lat-pulldown",
					"incline-barbell-bench-press",
					"single-arm-dumbbell-row",
					"cable-lateral-raise",
					"rear-delt-dumbbell-fly",
					"incline-dumbbell-curl",
				],
			},
			{
				name: "Lower B",
				exerciseIds: [
					"leg-press",
					"bulgarian-split-squat",
					"seated-leg-curl",
					"seated-calf-raise",
					"plank",
				],
			},
		],
	},
	{
		id: "vt-full-body",
		name: "V-Taper Full Body",
		description:
			"Three days for busy weeks. A lat pull, a lateral raise and a rear delt move every session.",
		days: [
			{
				name: "Full Body A",
				exerciseIds: [
					"barbell-back-squat",
					"pull-up",
					"incline-dumbbell-bench-press",
					"dumbbell-lateral-raise",
					"face-pull",
				],
			},
			{
				name: "Full Body B",
				exerciseIds: [
					"romanian-deadlift",
					"lat-pulldown",
					"dumbbell-shoulder-press",
					"cable-lateral-raise",
					"reverse-pec-deck-fly",
				],
			},
			{
				name: "Full Body C",
				exerciseIds: [
					"leg-press",
					"single-arm-dumbbell-row",
					"incline-barbell-bench-press",
					"machine-lateral-raise",
					"straight-arm-pulldown",
				],
			},
		],
	},
	{
		id: "vt-width",
		name: "Width Split",
		description:
			"Five days for experienced lifters. Back width and delts twice a week, everything else once.",
		days: [
			{
				name: "Back Width",
				exerciseIds: [
					"wide-grip-pull-up",
					"lat-pulldown",
					"single-arm-lat-pulldown",
					"straight-arm-pulldown",
					"seated-cable-row",
				],
			},
			{
				name: "Delts",
				exerciseIds: [
					"dumbbell-shoulder-press",
					"cable-lateral-raise",
					"machine-lateral-raise",
					"cable-y-raise",
					"rear-delt-dumbbell-fly",
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
				],
			},
			{
				name: "Upper Chest · Lats",
				exerciseIds: [
					"incline-barbell-bench-press",
					"low-to-high-cable-fly",
					"pull-up",
					"single-arm-dumbbell-row",
					"face-pull",
				],
			},
			{
				name: "Delts · Arms",
				exerciseIds: [
					"dumbbell-lateral-raise",
					"reverse-pec-deck-fly",
					"incline-dumbbell-curl",
					"overhead-triceps-extension",
					"stomach-vacuum",
				],
			},
		],
	},
];

export interface SplitOption {
	id: SplitId;
	name: string;
	description: string;
	routineId: string | null;
	/** Label per weekday, Monday first. null = rest. */
	week: (string | null)[];
}

export const SPLITS: SplitOption[] = [
	{
		id: "vt_ppl",
		name: "V-Taper PPL",
		description: "Delts on push & legs, width on pull",
		routineId: "vt-ppl",
		week: ["PUSH", "PULL", "LEGS", "PUSH", "PULL", "LEGS", null],
	},
	{
		id: "vt_upper_lower",
		name: "V-Taper Upper / Lower",
		description: "Every upper day builds the V",
		routineId: "vt-upper-lower",
		week: ["UPPR", "LOWR", null, "UPPR", "LOWR", null, null],
	},
	{
		id: "vt_full_body",
		name: "V-Taper Full Body",
		description: "Lats and delts in every session",
		routineId: "vt-full-body",
		week: ["FULL", null, "FULL", null, "FULL", null, null],
	},
	{
		id: "vt_width",
		name: "Width Split",
		description: "Back width and delts twice a week",
		routineId: "vt-width",
		week: ["WDTH", "DLTS", "LEGS", "CHST", "DLTS", null, null],
	},
	{
		id: "custom",
		name: "Custom",
		description: "Build your own routine later",
		routineId: null,
		week: [null, null, null, null, null, null, null],
	},
];

/** Profiles saved before the V-taper splits keep their nearest match. */
const LEGACY_SPLITS: Record<string, SplitId> = {
	ppl: "vt_ppl",
	upper_lower: "vt_upper_lower",
	full_body: "vt_full_body",
	bro: "vt_width",
};

export function splitById(id: string): SplitOption {
	const current = LEGACY_SPLITS[id] ?? id;
	return SPLITS.find((s) => s.id === current) ?? (SPLITS.at(-1) as SplitOption);
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
