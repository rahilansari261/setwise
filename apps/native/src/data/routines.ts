import type { Routine, SplitId } from "@/src/types";

export const DEFAULT_ROUTINES: Routine[] = [
	{
		id: "ppl",
		name: "Push / Pull / Legs",
		description:
			"Push muscles, pull muscles and lower body on separate days. Run it 3 or 6 days a week.",
		days: [
			{
				name: "Push",
				exerciseIds: [
					"barbell-bench-press",
					"overhead-press",
					"incline-dumbbell-bench-press",
					"dumbbell-lateral-raise",
					"cable-rope-triceps-pushdown",
				],
			},
			{
				name: "Pull",
				exerciseIds: [
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
				exerciseIds: [
					"barbell-back-squat",
					"romanian-deadlift",
					"leg-press",
					"lying-leg-curl",
					"standing-calf-raise",
				],
			},
		],
	},
	{
		id: "upper-lower",
		name: "Upper / Lower",
		description: "Four days, each muscle group twice a week.",
		days: [
			{
				name: "Upper A",
				exerciseIds: [
					"barbell-bench-press",
					"barbell-row",
					"overhead-press",
					"lat-pulldown",
					"skull-crusher",
					"incline-dumbbell-curl",
				],
			},
			{
				name: "Lower A",
				exerciseIds: [
					"barbell-back-squat",
					"romanian-deadlift",
					"leg-press",
					"standing-calf-raise",
					"hanging-leg-raise",
				],
			},
			{
				name: "Upper B",
				exerciseIds: [
					"incline-barbell-bench-press",
					"pull-up",
					"dumbbell-shoulder-press",
					"seated-cable-row",
					"cable-rope-triceps-pushdown",
					"dumbbell-hammer-curl",
				],
			},
			{
				name: "Lower B",
				exerciseIds: [
					"conventional-deadlift",
					"barbell-front-squat",
					"bulgarian-split-squat",
					"lying-leg-curl",
					"seated-calf-raise",
				],
			},
		],
	},
	{
		id: "full-body",
		name: "Full Body",
		description:
			"Every major muscle, every session. Three days a week with a rest day between.",
		days: [
			{
				name: "Full Body A",
				exerciseIds: [
					"barbell-back-squat",
					"barbell-bench-press",
					"barbell-row",
					"dumbbell-lateral-raise",
					"plank",
				],
			},
			{
				name: "Full Body B",
				exerciseIds: [
					"conventional-deadlift",
					"overhead-press",
					"lat-pulldown",
					"walking-lunges",
					"hanging-leg-raise",
				],
			},
			{
				name: "Full Body C",
				exerciseIds: [
					"barbell-front-squat",
					"incline-dumbbell-bench-press",
					"seated-cable-row",
					"barbell-bicep-curl",
					"cable-rope-triceps-pushdown",
				],
			},
		],
	},
	{
		id: "bro-split",
		name: "Bro Split",
		description: "One muscle group per day, five days a week.",
		days: [
			{
				name: "Chest",
				exerciseIds: [
					"barbell-bench-press",
					"incline-dumbbell-bench-press",
					"chest-dips",
					"cable-crossover",
					"pec-deck-machine",
				],
			},
			{
				name: "Back",
				exerciseIds: [
					"conventional-deadlift",
					"pull-up",
					"barbell-row",
					"lat-pulldown",
					"seated-cable-row",
				],
			},
			{
				name: "Legs",
				exerciseIds: [
					"barbell-back-squat",
					"leg-press",
					"romanian-deadlift",
					"leg-extension",
					"standing-calf-raise",
				],
			},
			{
				name: "Shoulders",
				exerciseIds: [
					"overhead-press",
					"dumbbell-lateral-raise",
					"reverse-pec-deck-fly",
					"face-pull",
					"dumbbell-shrug",
				],
			},
			{
				name: "Arms",
				exerciseIds: [
					"barbell-bicep-curl",
					"close-grip-bench-press",
					"dumbbell-hammer-curl",
					"skull-crusher",
					"cable-rope-triceps-pushdown",
				],
			},
		],
	},
	{
		id: "strength-5x5",
		name: "Strength 5×5",
		description: "Linear progression on the five big compound lifts.",
		days: [
			{
				name: "Workout A",
				exerciseIds: [
					"barbell-back-squat",
					"barbell-bench-press",
					"barbell-row",
				],
			},
			{
				name: "Workout B",
				exerciseIds: [
					"barbell-back-squat",
					"overhead-press",
					"conventional-deadlift",
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
		id: "ppl",
		name: "Push · Pull · Legs",
		description: "Chest + triceps / back + biceps / legs",
		routineId: "ppl",
		week: ["PUSH", "PULL", "LEGS", "PUSH", "PULL", "LEGS", null],
	},
	{
		id: "upper_lower",
		name: "Upper / Lower",
		description: "Alternate upper and lower body",
		routineId: "upper-lower",
		week: ["UPPR", "LOWR", null, "UPPR", "LOWR", null, null],
	},
	{
		id: "full_body",
		name: "Full Body",
		description: "Every muscle, every session",
		routineId: "full-body",
		week: ["FULL", null, "FULL", null, "FULL", null, null],
	},
	{
		id: "bro",
		name: "Bro Split",
		description: "One muscle group per day",
		routineId: "bro-split",
		week: ["CHST", "BACK", "LEGS", "SHLD", "ARMS", null, null],
	},
	{
		id: "custom",
		name: "Custom",
		description: "Build your own routine later",
		routineId: null,
		week: [null, null, null, null, null, null, null],
	},
];

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
