import { colors } from "@/src/theme";
import type {
	DumbbellMode,
	Equipment,
	Exercise,
	SetType,
	WorkoutExercise,
	WorkoutSet,
} from "@/src/types";

export interface SetTypeInfo {
	type: SetType;
	/** One or two characters shown in the SET column. */
	short: string;
	name: string;
	hint: string;
	color: string;
	/** Counts toward records, e1RM and training-zone stats. */
	counts: boolean;
}

export const SET_TYPES: SetTypeInfo[] = [
	{
		type: "normal",
		short: "",
		name: "Normal",
		hint: "A regular working set",
		color: colors.muted,
		counts: true,
	},
	{
		type: "warmup",
		short: "W",
		name: "Warm-up",
		hint: "Light set to prepare; ignored by records",
		color: colors.muted,
		counts: false,
	},
	{
		type: "top",
		short: "T",
		name: "Top set",
		hint: "Your heaviest set of the session",
		color: colors.streak,
		counts: true,
	},
	{
		type: "backoff",
		short: "B",
		name: "Back-off",
		hint: "Lighter volume after the top set",
		color: colors.streak,
		counts: true,
	},
	{
		type: "drop",
		short: "D",
		name: "Drop set",
		hint: "Cut the weight and keep going",
		color: colors.streak,
		counts: true,
	},
	{
		type: "failure",
		short: "F",
		name: "Failure",
		hint: "Taken until no more reps are possible",
		color: colors.danger,
		counts: true,
	},
	{
		type: "feeder",
		short: "Fd",
		name: "Feeder",
		hint: "Short ramp-up set before the work",
		color: colors.muted,
		counts: false,
	},
	{
		type: "myo",
		short: "M",
		name: "Myo-reps",
		hint: "Activation set then short mini-sets",
		color: colors.streak,
		counts: true,
	},
	{
		type: "negative",
		short: "N",
		name: "Negative",
		hint: "Slow eccentric-only reps",
		color: colors.streak,
		counts: true,
	},
	{
		type: "partial",
		short: "P",
		name: "Partial",
		hint: "Reps through a partial range",
		color: colors.streak,
		counts: true,
	},
	{
		type: "left",
		short: "L",
		name: "Left side",
		hint: "One-sided set, left",
		color: colors.accent,
		counts: true,
	},
	{
		type: "right",
		short: "R",
		name: "Right side",
		hint: "One-sided set, right",
		color: colors.accent,
		counts: true,
	},
];

const BY_TYPE = new Map(SET_TYPES.map((t) => [t.type, t]));
export const setTypeInfo = (type: SetType): SetTypeInfo =>
	BY_TYPE.get(type) ?? (SET_TYPES[0] as SetTypeInfo);

/** True for sets that feed records, e1RM and zones (warm-ups and feeders don't). */
export const countsAsWork = (set: Pick<WorkoutSet, "setType">) =>
	setTypeInfo(set.setType).counts;

export const DUMBBELL_MODES: {
	value: DumbbellMode;
	name: string;
	hint: string;
}[] = [
	{
		value: "single",
		name: "One dumbbell",
		hint: "Weight is the single dumbbell you hold",
	},
	{
		value: "pair",
		name: "Pair ×2",
		hint: "Weight is per dumbbell, volume is doubled",
	},
	{
		value: "total",
		name: "Total",
		hint: "Weight is both dumbbells added together",
	},
	{
		value: "alternating",
		name: "Alternating",
		hint: "One dumbbell, reps counted across both sides",
	},
];

/** Weight × reps for one set, honouring the exercise's dumbbell mode. */
export function setVolume(
	set: Pick<WorkoutSet, "weight" | "reps">,
	mode?: DumbbellMode,
): number {
	const raw = (set.weight || 0) * (set.reps || 0);
	return mode === "pair" ? raw * 2 : raw;
}

export const exerciseVolumeMode = (we: Pick<WorkoutExercise, "dumbbellMode">) =>
	we.dumbbellMode;

/** True for exercises where a dumbbell mode is meaningful. */
export const usesDumbbells = (exercise: Pick<Exercise, "name" | "equipment">) =>
	exercise.equipment === "Dumbbell";

const EQUIPMENT_RULES: [RegExp, Equipment][] = [
	[/dumbbell|\bdb\b|arnold|goblet/i, "Dumbbell"],
	[/kettlebell/i, "Kettlebell"],
	[/\bband\b|resistance/i, "Band"],
	[/cable|pulldown|pushdown|face pull|crossover|lat pull/i, "Cable"],
	[
		/machine|leg press|leg extension|leg curl|pec deck|smith|hack squat|calf raise/i,
		"Machine",
	],
	[
		/barbell|bench press|deadlift|squat|overhead press|\bez\b|\bbar\b|row|shrug/i,
		"Barbell",
	],
	[
		/push-?up|pull-?up|chin-?up|dip|plank|crunch|sit-?up|burpee|lunge|bodyweight/i,
		"Bodyweight",
	],
];

export const EQUIPMENT: Equipment[] = [
	"Barbell",
	"Dumbbell",
	"Machine",
	"Cable",
	"Bodyweight",
	"Kettlebell",
	"Band",
	"Other",
];

/** The stored equipment if set, otherwise a best guess from the exercise name. */
export function equipmentOf(
	exercise: Pick<Exercise, "name" | "equipment" | "category" | "metricType">,
): Equipment {
	if (exercise.equipment) return exercise.equipment;
	if (
		exercise.metricType === "reps_only" ||
		exercise.metricType === "time_only"
	)
		return "Bodyweight";
	if (exercise.category === "Cardio") return "Machine";
	for (const [re, eq] of EQUIPMENT_RULES) if (re.test(exercise.name)) return eq;
	return "Other";
}

export const ACTIVITY_TYPES = [
	"Strength training",
	"Hybrid training",
	"Hypertrophy",
	"Powerlifting",
	"Bodybuilding",
	"Olympic lifting",
	"Calisthenics",
	"CrossFit",
	"HIIT",
	"Circuit training",
	"Functional training",
	"Running",
	"Treadmill",
	"Walking",
	"Hiking",
	"Cycling",
	"Spinning",
	"Swimming",
	"Rowing",
	"Elliptical",
	"Stair climber",
	"Jump rope",
	"Yoga",
	"Pilates",
	"Stretching",
	"Mobility",
	"Boxing",
	"Martial arts",
	"Cricket",
	"Football",
	"Basketball",
	"Badminton",
	"Tennis",
	"Table tennis",
	"Volleyball",
	"Climbing",
	"Dance",
	"Zumba",
	"Core training",
	"Other",
] as const;

export const RPE_LEVELS: { value: number; label: string }[] = [
	{ value: 6, label: "Easy · 4+ reps left" },
	{ value: 7, label: "Moderate · ~3 reps left" },
	{ value: 8, label: "Hard · ~2 reps left" },
	{ value: 9, label: "Very hard · ~1 rep left" },
	{ value: 10, label: "Max effort · none left" },
];

export const SESSION_RPE: Record<number, string> = {
	1: "Very light",
	2: "Light",
	3: "Light",
	4: "Moderate",
	5: "Moderate",
	6: "Somewhat hard",
	7: "Hard",
	8: "Very hard",
	9: "Extremely hard",
	10: "Max effort",
};
