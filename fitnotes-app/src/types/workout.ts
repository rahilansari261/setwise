export type Category = 
  | 'Chest'
  | 'Back'
  | 'Legs'
  | 'Shoulders'
  | 'Arms'
  | 'Core'
  | 'Cardio'
  | 'Other';

export type MetricType = 'weight_reps' | 'distance_time' | 'reps_only' | 'time_only';

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

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
  weight: number; // in current unit (lbs or kg)
  reps: number;
  distance?: number; // km or miles
  timeSeconds?: number;
  completed: boolean;
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
  date: string; // YYYY-MM-DD
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

export interface UserSettings {
  unit: 'lbs' | 'kg';
  defaultBarbellWeight: number; // 45 for lbs, 20 for kg
  autoRestTimer: boolean;
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  amoledMode: boolean;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  category: Category;
  maxWeight: { value: number; reps: number; date: string };
  maxEstimated1RM: { value: number; weight: number; reps: number; date: string };
  maxVolume: { value: number; date: string };
}
