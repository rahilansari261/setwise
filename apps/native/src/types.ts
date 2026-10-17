export type Category =
	| "Chest"
	| "Back"
	| "Legs"
	| "Shoulders"
	| "Arms"
	| "Core"
	| "Cardio"
	| "Other";

export type MetricType =
	| "weight_reps"
	| "distance_time"
	| "reps_only"
	| "time_only";

export type SetType = "normal" | "warmup" | "drop" | "failure";

export type Unit = "kg" | "lbs";

export interface Exercise {
	id: string;
	name: string;
	category: Category;
	metricType: MetricType;
	notes?: string;
	isCustom?: boolean;
}

export interface WorkoutSet {
	id: string;
	setNumber: number;
	/** In the user's current unit. */
	weight: number;
	reps: number;
	/** Kilometres. */
	distance?: number;
	timeSeconds?: number;
	completed: boolean;
	completedAt?: number;
	setType: SetType;
	comment?: string;
	isPersonalRecord?: boolean;
}

export interface WorkoutExercise {
	id: string;
	exerciseId: string;
	exerciseName: string;
	category: Category;
	sets: WorkoutSet[];
	notes?: string;
}

export interface WorkoutDay {
	/** YYYY-MM-DD */
	date: string;
	title?: string;
	exercises: WorkoutExercise[];
	notes?: string;
}

export interface RoutineDay {
	name: string;
	exerciseIds: string[];
}

export interface Routine {
	id: string;
	name: string;
	description: string;
	days: RoutineDay[];
}

export interface Settings {
	unit: Unit;
	defaultBarbellWeight: number;
	autoRestTimer: boolean;
	defaultRestSeconds: number;
	vibrationEnabled: boolean;
	restNotification: boolean;
}

export type Gender = "male" | "female" | "other";
export type SplitId = "ppl" | "upper_lower" | "full_body" | "bro" | "custom";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Goal = "strength" | "muscle" | "fat_loss" | "general";

export interface Reminder {
	enabled: boolean;
	hour: number;
	minute: number;
	/** 0 = Sunday … 6 = Saturday */
	days: number[];
}

export interface Profile {
	name: string;
	gender: Gender;
	age: number;
	heightCm: number;
	weightKg: number;
	split: SplitId;
	experience: Experience;
	goal: Goal;
	daysPerWeek: number;
	reminder: Reminder;
	onboardedAt: number;
}

export interface ActiveRoutine {
	routineId: string;
	nextDayIndex: number;
}

export interface PersonalRecord {
	exerciseId: string;
	exerciseName: string;
	category: Category;
	maxWeight: { value: number; reps: number; date: string };
	maxEstimated1RM: {
		value: number;
		weight: number;
		reps: number;
		date: string;
	};
	maxVolume: { value: number; date: string };
}
