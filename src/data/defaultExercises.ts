import { Exercise } from '../types/workout';

export const DEFAULT_EXERCISES: Exercise[] = [
  // CHEST
  { id: 'barbell-bench-press', name: 'Barbell Bench Press', category: 'Chest', metricType: 'weight_reps' },
  { id: 'incline-barbell-bench-press', name: 'Incline Barbell Bench Press', category: 'Chest', metricType: 'weight_reps' },
  { id: 'flat-dumbbell-bench-press', name: 'Flat Dumbbell Bench Press', category: 'Chest', metricType: 'weight_reps' },
  { id: 'incline-dumbbell-bench-press', name: 'Incline Dumbbell Bench Press', category: 'Chest', metricType: 'weight_reps' },
  { id: 'decline-barbell-bench-press', name: 'Decline Barbell Bench Press', category: 'Chest', metricType: 'weight_reps' },
  { id: 'chest-dips', name: 'Chest Dips', category: 'Chest', metricType: 'weight_reps' },
  { id: 'cable-crossover', name: 'Cable Crossover', category: 'Chest', metricType: 'weight_reps' },
  { id: 'dumbbell-flyes', name: 'Dumbbell Flyes', category: 'Chest', metricType: 'weight_reps' },
  { id: 'push-up', name: 'Push-Up', category: 'Chest', metricType: 'reps_only' },
  { id: 'pec-deck-machine', name: 'Pec Deck Machine', category: 'Chest', metricType: 'weight_reps' },

  // BACK
  { id: 'conventional-deadlift', name: 'Conventional Deadlift', category: 'Back', metricType: 'weight_reps' },
  { id: 'barbell-row', name: 'Barbell Bent Over Row', category: 'Back', metricType: 'weight_reps' },
  { id: 'pull-up', name: 'Pull-Up', category: 'Back', metricType: 'weight_reps' },
  { id: 'chin-up', name: 'Chin-Up', category: 'Back', metricType: 'weight_reps' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', metricType: 'weight_reps' },
  { id: 'seated-cable-row', name: 'Seated Cable Row', category: 'Back', metricType: 'weight_reps' },
  { id: 't-bar-row', name: 'T-Bar Row', category: 'Back', metricType: 'weight_reps' },
  { id: 'single-arm-dumbbell-row', name: 'Single-Arm Dumbbell Row', category: 'Back', metricType: 'weight_reps' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift (RDL)', category: 'Back', metricType: 'weight_reps' },
  { id: 'back-hyperextensions', name: 'Hyperextensions', category: 'Back', metricType: 'weight_reps' },

  // LEGS
  { id: 'barbell-back-squat', name: 'Barbell Back Squat', category: 'Legs', metricType: 'weight_reps' },
  { id: 'barbell-front-squat', name: 'Barbell Front Squat', category: 'Legs', metricType: 'weight_reps' },
  { id: 'leg-press', name: 'Leg Press', category: 'Legs', metricType: 'weight_reps' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Legs', metricType: 'weight_reps' },
  { id: 'leg-extension', name: 'Leg Extension Machine', category: 'Legs', metricType: 'weight_reps' },
  { id: 'lying-leg-curl', name: 'Lying Leg Curl', category: 'Legs', metricType: 'weight_reps' },
  { id: 'seated-leg-curl', name: 'Seated Leg Curl', category: 'Legs', metricType: 'weight_reps' },
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', category: 'Legs', metricType: 'weight_reps' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', category: 'Legs', metricType: 'weight_reps' },
  { id: 'walking-lunges', name: 'Walking Lunges', category: 'Legs', metricType: 'weight_reps' },
  { id: 'hack-squat', name: 'Hack Squat Machine', category: 'Legs', metricType: 'weight_reps' },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', category: 'Legs', metricType: 'weight_reps' },

  // SHOULDERS
  { id: 'overhead-press', name: 'Overhead Press (OHP)', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'dumbbell-shoulder-press', name: 'Seated Dumbbell Shoulder Press', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'face-pull', name: 'Face Pull', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'reverse-pec-deck-fly', name: 'Reverse Pec Deck (Rear Delt)', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'barbell-shrug', name: 'Barbell Shrug', category: 'Shoulders', metricType: 'weight_reps' },
  { id: 'dumbbell-shrug', name: 'Dumbbell Shrug', category: 'Shoulders', metricType: 'weight_reps' },

  // ARMS
  { id: 'barbell-bicep-curl', name: 'Barbell Bicep Curl', category: 'Arms', metricType: 'weight_reps' },
  { id: 'dumbbell-hammer-curl', name: 'Dumbbell Hammer Curl', category: 'Arms', metricType: 'weight_reps' },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', category: 'Arms', metricType: 'weight_reps' },
  { id: 'preacher-curl', name: 'Preacher Curl', category: 'Arms', metricType: 'weight_reps' },
  { id: 'cable-rope-triceps-pushdown', name: 'Triceps Rope Pushdown', category: 'Arms', metricType: 'weight_reps' },
  { id: 'skull-crusher', name: 'Skull Crusher (EZ Bar)', category: 'Arms', metricType: 'weight_reps' },
  { id: 'close-grip-bench-press', name: 'Close Grip Bench Press', category: 'Arms', metricType: 'weight_reps' },
  { id: 'overhead-triceps-extension', name: 'Overhead Dumbbell Triceps Extension', category: 'Arms', metricType: 'weight_reps' },
  { id: 'concentration-curl', name: 'Concentration Curl', category: 'Arms', metricType: 'weight_reps' },

  // CORE
  { id: 'plank', name: 'Plank', category: 'Core', metricType: 'time_only' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'Core', metricType: 'reps_only' },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', category: 'Core', metricType: 'reps_only' },
  { id: 'cable-woodchopper', name: 'Cable Woodchopper', category: 'Core', metricType: 'weight_reps' },
  { id: 'cable-crunch', name: 'Cable Kneeling Crunch', category: 'Core', metricType: 'weight_reps' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'Core', metricType: 'reps_only' },

  // CARDIO
  { id: 'treadmill-running', name: 'Treadmill Running', category: 'Cardio', metricType: 'distance_time' },
  { id: 'stationary-bike', name: 'Stationary Bike', category: 'Cardio', metricType: 'distance_time' },
  { id: 'rowing-machine', name: 'Rowing Machine', category: 'Cardio', metricType: 'distance_time' },
  { id: 'stair-climber', name: 'Stair Climber', category: 'Cardio', metricType: 'time_only' },
  { id: 'jump-rope', name: 'Jump Rope', category: 'Cardio', metricType: 'time_only' },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Chest: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-800/40', accent: '#f43f5e' },
  Back: { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800/40', accent: '#3b82f6' },
  Legs: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/40', accent: '#10b981' },
  Shoulders: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/40', accent: '#f59e0b' },
  Arms: { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-800/40', accent: '#a855f7' },
  Core: { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/40', accent: '#06b6d4' },
  Cardio: { bg: 'bg-orange-950/40', text: 'text-orange-400', border: 'border-orange-800/40', accent: '#f97316' },
  Other: { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-800', accent: '#64748b' },
};
