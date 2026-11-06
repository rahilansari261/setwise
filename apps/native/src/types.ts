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

export type SetType =
	| "normal"
	| "warmup"
	| "top"
	| "backoff"
	| "drop"
	| "failure"
	| "feeder"
	| "myo"
	| "negative"
	| "partial"
	| "left"
	| "right";

export type Equipment =
	| "Barbell"
	| "Dumbbell"
	| "Machine"
	| "Cable"
	| "Bodyweight"
	| "Kettlebell"
	| "Band"
	| "Other";

/** How a dumbbell weight is entered, and how it counts toward volume. */
export type DumbbellMode = "single" | "pair" | "total" | "alternating";

export type ThemePref = "dark" | "light" | "system";
export type Language = "system" | "en" | "hi";

export type Unit = "kg" | "lbs";

export interface Exercise {
	id: string;
	name: string;
	category: Category;
	metricType: MetricType;
	notes?: string;
	isCustom?: boolean;
	equipment?: Equipment;
	/** Id in the bundled exercise library (instructions, target muscles). */
	libraryId?: string;
	/** Main muscle worked, e.g. "pectorals". */
	target?: string;
	/** Supporting muscles, comma separated. */
	secondary?: string;
}

export interface WorkoutSet {
	id: string;
	setNumber: number;
	/** In the user's current unit. */
	weight: number;
	reps: number;
	/** Kilometres when the unit is kg, miles when it is lbs. */
	distance?: number;
	timeSeconds?: number;
	completed: boolean;
	completedAt?: number;
	setType: SetType;
	comment?: string;
	isPersonalRecord?: boolean;
	/** Rate of perceived exertion, 1–10 (halves allowed). */
	rpe?: number;
}

export interface WorkoutExercise {
	id: string;
	exerciseId: string;
	exerciseName: string;
	category: Category;
	sets: WorkoutSet[];
	notes?: string;
	/** Exercises sharing a supersetId are performed back to back. */
	supersetId?: string;
	dumbbellMode?: DumbbellMode;
}

export interface FinishInfo {
	at: number;
	/** Whole-session RPE, 1–10. */
	rpe?: number;
	activity?: string;
	durationMin?: number;
}

export interface WorkoutDay {
	/** YYYY-MM-DD */
	date: string;
	title?: string;
	exercises: WorkoutExercise[];
	notes?: string;
	finished?: FinishInfo;
	/** Marked as a planned rest day. */
	restDay?: boolean;
	gymId?: string;
}

/** A routine day pencilled in for a date; shown as missed once the date passes unlogged. */
export interface PlannedWorkout {
	routineId: string;
	dayIndex: number;
	/** Set when the user chose to skip it. */
	skipped?: boolean;
}

export interface Gym {
	id: string;
	name: string;
	barWeight: number;
	/** Plate sizes available at this gym, in the user's unit. Empty = standard set. */
	plates: number[];
}

export interface ExerciseFolder {
	id: string;
	name: string;
	exerciseIds: string[];
}

export interface RoutineFolder {
	id: string;
	name: string;
}

export interface Measurement {
	/** YYYY-MM-DD */
	date: string;
	weightKg?: number;
	bodyFat?: number;
	/** Circumferences in cm. */
	/** Widest point across the shoulders (around the deltoids), cm. */
	shoulders?: number;
	chest?: number;
	waist?: number;
	hips?: number;
	arm?: number;
	thigh?: number;
	neck?: number;
}

export type Pose = "front" | "side" | "back";

export interface ProgressPhoto {
	id: string;
	date: string;
	uri: string;
	note?: string;
	/** Older photos have none and count as front. */
	pose?: Pose;
}

export type TargetKind = "bodyweight" | "lift" | "weekly_workouts";

export interface TargetGoal {
	id: string;
	kind: TargetKind;
	title: string;
	target: number;
	/** Reference weight/value when the goal was created. */
	start: number;
	exerciseId?: string;
	createdAt: string;
	achievedAt?: string;
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
	folderId?: string;
}

export interface Settings {
	unit: Unit;
	defaultBarbellWeight: number;
	autoRestTimer: boolean;
	defaultRestSeconds: number;
	vibrationEnabled: boolean;
	restNotification: boolean;
	theme: ThemePref;
	language: Language;
	biometricLock: boolean;
	activeGymId?: string;
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

/** A routine as sent to a friend: the routine plus any custom exercises it uses. */
export interface RoutineBundle {
	app: "setwise-routine";
	version: 1;
	routine: Routine;
	exercises: Exercise[];
}
