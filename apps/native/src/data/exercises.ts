import type { Category, Exercise } from "@/src/types";

export const DEFAULT_EXERCISES: Exercise[] = [
	// CHEST
	{
		id: "barbell-bench-press",
		name: "Barbell Bench Press",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "incline-barbell-bench-press",
		name: "Incline Barbell Bench Press",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "flat-dumbbell-bench-press",
		name: "Flat Dumbbell Bench Press",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "incline-dumbbell-bench-press",
		name: "Incline Dumbbell Bench Press",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "decline-barbell-bench-press",
		name: "Decline Barbell Bench Press",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "chest-dips",
		name: "Chest Dips",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "cable-crossover",
		name: "Cable Crossover",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "dumbbell-flyes",
		name: "Dumbbell Flyes",
		category: "Chest",
		metricType: "weight_reps",
	},
	{
		id: "push-up",
		name: "Push-Up",
		category: "Chest",
		metricType: "reps_only",
	},
	{
		id: "pec-deck-machine",
		name: "Pec Deck Machine",
		category: "Chest",
		metricType: "weight_reps",
	},

	// BACK
	{
		id: "conventional-deadlift",
		name: "Conventional Deadlift",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "barbell-row",
		name: "Barbell Bent Over Row",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "pull-up",
		name: "Pull-Up",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "chin-up",
		name: "Chin-Up",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "lat-pulldown",
		name: "Lat Pulldown",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "seated-cable-row",
		name: "Seated Cable Row",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "t-bar-row",
		name: "T-Bar Row",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "single-arm-dumbbell-row",
		name: "Single-Arm Dumbbell Row",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "romanian-deadlift",
		name: "Romanian Deadlift (RDL)",
		category: "Back",
		metricType: "weight_reps",
	},
	{
		id: "back-hyperextensions",
		name: "Hyperextensions",
		category: "Back",
		metricType: "weight_reps",
	},

	// LEGS
	{
		id: "barbell-back-squat",
		name: "Barbell Back Squat",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "barbell-front-squat",
		name: "Barbell Front Squat",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "leg-press",
		name: "Leg Press",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "bulgarian-split-squat",
		name: "Bulgarian Split Squat",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "leg-extension",
		name: "Leg Extension Machine",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "lying-leg-curl",
		name: "Lying Leg Curl",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "seated-leg-curl",
		name: "Seated Leg Curl",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "standing-calf-raise",
		name: "Standing Calf Raise",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "seated-calf-raise",
		name: "Seated Calf Raise",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "walking-lunges",
		name: "Walking Lunges",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "hack-squat",
		name: "Hack Squat Machine",
		category: "Legs",
		metricType: "weight_reps",
	},
	{
		id: "hip-thrust",
		name: "Barbell Hip Thrust",
		category: "Legs",
		metricType: "weight_reps",
	},

	// SHOULDERS
	{
		id: "overhead-press",
		name: "Overhead Press (OHP)",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "dumbbell-shoulder-press",
		name: "Seated Dumbbell Shoulder Press",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "dumbbell-lateral-raise",
		name: "Dumbbell Lateral Raise",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "cable-lateral-raise",
		name: "Cable Lateral Raise",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "face-pull",
		name: "Face Pull",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "arnold-press",
		name: "Arnold Press",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "reverse-pec-deck-fly",
		name: "Reverse Pec Deck (Rear Delt)",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "barbell-shrug",
		name: "Barbell Shrug",
		category: "Shoulders",
		metricType: "weight_reps",
	},
	{
		id: "dumbbell-shrug",
		name: "Dumbbell Shrug",
		category: "Shoulders",
		metricType: "weight_reps",
	},

	// ARMS
	{
		id: "barbell-bicep-curl",
		name: "Barbell Bicep Curl",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "dumbbell-hammer-curl",
		name: "Dumbbell Hammer Curl",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "incline-dumbbell-curl",
		name: "Incline Dumbbell Curl",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "preacher-curl",
		name: "Preacher Curl",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "cable-rope-triceps-pushdown",
		name: "Triceps Rope Pushdown",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "skull-crusher",
		name: "Skull Crusher (EZ Bar)",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "close-grip-bench-press",
		name: "Close Grip Bench Press",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "overhead-triceps-extension",
		name: "Overhead Dumbbell Triceps Extension",
		category: "Arms",
		metricType: "weight_reps",
	},
	{
		id: "concentration-curl",
		name: "Concentration Curl",
		category: "Arms",
		metricType: "weight_reps",
	},

	// CORE
	{ id: "plank", name: "Plank", category: "Core", metricType: "time_only" },
	{
		id: "hanging-leg-raise",
		name: "Hanging Leg Raise",
		category: "Core",
		metricType: "reps_only",
	},
	{
		id: "ab-wheel-rollout",
		name: "Ab Wheel Rollout",
		category: "Core",
		metricType: "reps_only",
	},
	{
		id: "cable-woodchopper",
		name: "Cable Woodchopper",
		category: "Core",
		metricType: "weight_reps",
	},
	{
		id: "cable-crunch",
		name: "Cable Kneeling Crunch",
		category: "Core",
		metricType: "weight_reps",
	},
	{
		id: "russian-twist",
		name: "Russian Twist",
		category: "Core",
		metricType: "reps_only",
	},

	// CARDIO
	{
		id: "treadmill-running",
		name: "Treadmill Running",
		category: "Cardio",
		metricType: "distance_time",
	},
	{
		id: "stationary-bike",
		name: "Stationary Bike",
		category: "Cardio",
		metricType: "distance_time",
	},
	{
		id: "rowing-machine",
		name: "Rowing Machine",
		category: "Cardio",
		metricType: "distance_time",
	},
	{
		id: "stair-climber",
		name: "Stair Climber",
		category: "Cardio",
		metricType: "time_only",
	},
	{
		id: "jump-rope",
		name: "Jump Rope",
		category: "Cardio",
		metricType: "time_only",
	},
];

export const CATEGORIES: Category[] = [
	"Chest",
	"Back",
	"Legs",
	"Shoulders",
	"Arms",
	"Core",
	"Cardio",
	"Other",
];

// Muted marks so categories read apart without competing with the accent.
export const CATEGORY_COLOR: Record<Category, string> = {
	Chest: "#FF7A85",
	Back: "#6FA8FF",
	Legs: "#5CD6A0",
	Shoulders: "#F2B84B",
	Arms: "#C08CFF",
	Core: "#4FD1E0",
	Cardio: "#FF8F4D",
	Other: "#8A919E",
};
