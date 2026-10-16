import { Routine, WorkoutDay } from '../types/workout';
import { addDays, formatDateISO } from '../utils/calc';

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs (PPL)',
    description: 'Classic 3-day or 6-day hypertrophy and strength program splitting push muscles, pull muscles, and lower body.',
    days: [
      {
        name: 'Push (Chest, Shoulders, Triceps)',
        exerciseIds: [
          'barbell-bench-press',
          'overhead-press',
          'incline-dumbbell-bench-press',
          'dumbbell-lateral-raise',
          'cable-rope-triceps-pushdown',
        ],
      },
      {
        name: 'Pull (Back, Biceps, Rear Delts)',
        exerciseIds: [
          'conventional-deadlift',
          'barbell-row',
          'lat-pulldown',
          'face-pull',
          'barbell-bicep-curl',
          'dumbbell-hammer-curl',
        ],
      },
      {
        name: 'Legs (Quads, Hamstrings, Calves)',
        exerciseIds: [
          'barbell-back-squat',
          'romanian-deadlift',
          'leg-press',
          'lying-leg-curl',
          'standing-calf-raise',
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower 4-Day Split',
    description: 'Well-balanced 4-day routine hitting each muscle group twice per week for maximum recovery and progression.',
    days: [
      {
        name: 'Upper A',
        exerciseIds: [
          'barbell-bench-press',
          'barbell-row',
          'overhead-press',
          'lat-pulldown',
          'skull-crusher',
          'incline-dumbbell-curl',
        ],
      },
      {
        name: 'Lower A',
        exerciseIds: [
          'barbell-back-squat',
          'romanian-deadlift',
          'leg-press',
          'standing-calf-raise',
          'hanging-leg-raise',
        ],
      },
      {
        name: 'Upper B',
        exerciseIds: [
          'incline-barbell-bench-press',
          'pull-up',
          'dumbbell-shoulder-press',
          'seated-cable-row',
          'cable-rope-triceps-pushdown',
          'dumbbell-hammer-curl',
        ],
      },
      {
        name: 'Lower B',
        exerciseIds: [
          'conventional-deadlift',
          'barbell-front-squat',
          'bulgarian-split-squat',
          'lying-leg-curl',
          'seated-calf-raise',
        ],
      },
    ],
  },
  {
    id: 'starting-strength',
    name: 'Strength 5x5 Foundation',
    description: 'Time-tested linear progression focusing on the 5 fundamental compound lifts.',
    days: [
      {
        name: 'Workout A',
        exerciseIds: ['barbell-back-squat', 'barbell-bench-press', 'barbell-row'],
      },
      {
        name: 'Workout B',
        exerciseIds: ['barbell-back-squat', 'overhead-press', 'conventional-deadlift'],
      },
    ],
  },
];

export function generateSampleHistory(): Record<string, WorkoutDay> {
  const today = formatDateISO(new Date());
  const history: Record<string, WorkoutDay> = {};

  // Today: Push Day (in progress / logged)
  history[today] = {
    date: today,
    notes: 'Feeling great energy today. Good bench lockout.',
    exercises: [
      {
        id: 'we-today-1',
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        category: 'Chest',
        sets: [
          { id: 's1', setNumber: 1, weight: 135, reps: 10, completed: true, setType: 'warmup', comment: 'Warmup' },
          { id: 's2', setNumber: 2, weight: 185, reps: 5, completed: true, setType: 'warmup' },
          { id: 's3', setNumber: 3, weight: 215, reps: 6, completed: true, setType: 'normal', isPersonalRecord: true, comment: 'Clean pause at chest' },
          { id: 's4', setNumber: 4, weight: 215, reps: 5, completed: true, setType: 'normal' },
          { id: 's5', setNumber: 5, weight: 195, reps: 8, completed: false, setType: 'normal' },
        ],
      },
      {
        id: 'we-today-2',
        exerciseId: 'overhead-press',
        exerciseName: 'Overhead Press (OHP)',
        category: 'Shoulders',
        sets: [
          { id: 's6', setNumber: 1, weight: 95, reps: 8, completed: true, setType: 'warmup' },
          { id: 's7', setNumber: 2, weight: 135, reps: 6, completed: true, setType: 'normal' },
          { id: 's8', setNumber: 3, weight: 135, reps: 5, completed: false, setType: 'normal' },
        ],
      },
      {
        id: 'we-today-3',
        exerciseId: 'incline-dumbbell-bench-press',
        exerciseName: 'Incline Dumbbell Bench Press',
        category: 'Chest',
        sets: [
          { id: 's9', setNumber: 1, weight: 65, reps: 10, completed: false, setType: 'normal' },
          { id: 's10', setNumber: 2, weight: 65, reps: 8, completed: false, setType: 'normal' },
        ],
      },
      {
        id: 'we-today-4',
        exerciseId: 'cable-rope-triceps-pushdown',
        exerciseName: 'Triceps Rope Pushdown',
        category: 'Arms',
        sets: [
          { id: 's11', setNumber: 1, weight: 50, reps: 12, completed: false, setType: 'normal' },
          { id: 's12', setNumber: 2, weight: 50, reps: 10, completed: false, setType: 'drop' },
        ],
      },
    ],
  };

  // 2 days ago: Pull Day
  const dMinus2 = addDays(today, -2);
  history[dMinus2] = {
    date: dMinus2,
    notes: 'Heavy deadlifts felt solid. Grip held up well.',
    exercises: [
      {
        id: 'we-m2-1',
        exerciseId: 'conventional-deadlift',
        exerciseName: 'Conventional Deadlift',
        category: 'Back',
        sets: [
          { id: 's201', setNumber: 1, weight: 225, reps: 5, completed: true, setType: 'warmup' },
          { id: 's202', setNumber: 2, weight: 275, reps: 3, completed: true, setType: 'warmup' },
          { id: 's203', setNumber: 3, weight: 315, reps: 5, completed: true, setType: 'normal', isPersonalRecord: true },
          { id: 's204', setNumber: 4, weight: 315, reps: 4, completed: true, setType: 'normal' },
        ],
      },
      {
        id: 'we-m2-2',
        exerciseId: 'barbell-row',
        exerciseName: 'Barbell Bent Over Row',
        category: 'Back',
        sets: [
          { id: 's205', setNumber: 1, weight: 165, reps: 8, completed: true, setType: 'normal' },
          { id: 's206', setNumber: 2, weight: 165, reps: 8, completed: true, setType: 'normal' },
          { id: 's207', setNumber: 3, weight: 165, reps: 7, completed: true, setType: 'normal' },
        ],
      },
      {
        id: 'we-m2-3',
        exerciseId: 'barbell-bicep-curl',
        exerciseName: 'Barbell Bicep Curl',
        category: 'Arms',
        sets: [
          { id: 's208', setNumber: 1, weight: 75, reps: 10, completed: true, setType: 'normal' },
          { id: 's209', setNumber: 2, weight: 75, reps: 9, completed: true, setType: 'normal' },
        ],
      },
    ],
  };

  // 4 days ago: Leg Day
  const dMinus4 = addDays(today, -4);
  history[dMinus4] = {
    date: dMinus4,
    notes: 'New PR on Squats! Hit 275 for 5 reps.',
    exercises: [
      {
        id: 'we-m4-1',
        exerciseId: 'barbell-back-squat',
        exerciseName: 'Barbell Back Squat',
        category: 'Legs',
        sets: [
          { id: 's401', setNumber: 1, weight: 185, reps: 8, completed: true, setType: 'warmup' },
          { id: 's402', setNumber: 2, weight: 225, reps: 5, completed: true, setType: 'warmup' },
          { id: 's403', setNumber: 3, weight: 275, reps: 5, completed: true, setType: 'normal', isPersonalRecord: true },
          { id: 's404', setNumber: 4, weight: 275, reps: 5, completed: true, setType: 'normal' },
          { id: 's405', setNumber: 5, weight: 275, reps: 4, completed: true, setType: 'normal' },
        ],
      },
      {
        id: 'we-m4-2',
        exerciseId: 'romanian-deadlift',
        exerciseName: 'Romanian Deadlift (RDL)',
        category: 'Back',
        sets: [
          { id: 's406', setNumber: 1, weight: 205, reps: 8, completed: true, setType: 'normal' },
          { id: 's407', setNumber: 2, weight: 205, reps: 8, completed: true, setType: 'normal' },
        ],
      },
      {
        id: 'we-m4-3',
        exerciseId: 'standing-calf-raise',
        exerciseName: 'Standing Calf Raise',
        category: 'Legs',
        sets: [
          { id: 's408', setNumber: 1, weight: 180, reps: 15, completed: true, setType: 'normal' },
          { id: 's409', setNumber: 2, weight: 180, reps: 12, completed: true, setType: 'normal' },
        ],
      },
    ],
  };

  // 7 days ago: Push Day (Bench progression tracking)
  const dMinus7 = addDays(today, -7);
  history[dMinus7] = {
    date: dMinus7,
    notes: 'Bench was 205 lbs today.',
    exercises: [
      {
        id: 'we-m7-1',
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        category: 'Chest',
        sets: [
          { id: 's701', setNumber: 1, weight: 135, reps: 10, completed: true, setType: 'warmup' },
          { id: 's702', setNumber: 2, weight: 185, reps: 6, completed: true, setType: 'warmup' },
          { id: 's703', setNumber: 3, weight: 205, reps: 6, completed: true, setType: 'normal' },
          { id: 's704', setNumber: 4, weight: 205, reps: 6, completed: true, setType: 'normal' },
          { id: 's705', setNumber: 5, weight: 205, reps: 5, completed: true, setType: 'normal' },
        ],
      },
      {
        id: 'we-m7-2',
        exerciseId: 'overhead-press',
        exerciseName: 'Overhead Press (OHP)',
        category: 'Shoulders',
        sets: [
          { id: 's706', setNumber: 1, weight: 125, reps: 6, completed: true, setType: 'normal' },
          { id: 's707', setNumber: 2, weight: 125, reps: 6, completed: true, setType: 'normal' },
        ],
      },
    ],
  };

  // 14 days ago: Push Day
  const dMinus14 = addDays(today, -14);
  history[dMinus14] = {
    date: dMinus14,
    notes: 'Working back up to 200 on bench.',
    exercises: [
      {
        id: 'we-m14-1',
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        category: 'Chest',
        sets: [
          { id: 's1401', setNumber: 1, weight: 135, reps: 10, completed: true, setType: 'warmup' },
          { id: 's1402', setNumber: 2, weight: 195, reps: 6, completed: true, setType: 'normal' },
          { id: 's1403', setNumber: 3, weight: 195, reps: 6, completed: true, setType: 'normal' },
          { id: 's1404', setNumber: 4, weight: 195, reps: 5, completed: true, setType: 'normal' },
        ],
      },
      {
        id: 'we-m14-2',
        exerciseId: 'barbell-back-squat',
        exerciseName: 'Barbell Back Squat',
        category: 'Legs',
        sets: [
          { id: 's1405', setNumber: 1, weight: 245, reps: 5, completed: true, setType: 'normal' },
          { id: 's1406', setNumber: 2, weight: 245, reps: 5, completed: true, setType: 'normal' },
        ],
      },
    ],
  };

  // 21 days ago: Baseline
  const dMinus21 = addDays(today, -21);
  history[dMinus21] = {
    date: dMinus21,
    notes: 'First week back on program.',
    exercises: [
      {
        id: 'we-m21-1',
        exerciseId: 'barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        category: 'Chest',
        sets: [
          { id: 's2101', setNumber: 1, weight: 185, reps: 8, completed: true, setType: 'normal' },
          { id: 's2102', setNumber: 2, weight: 185, reps: 7, completed: true, setType: 'normal' },
        ],
      },
      {
        id: 'we-m21-2',
        exerciseId: 'conventional-deadlift',
        exerciseName: 'Conventional Deadlift',
        category: 'Back',
        sets: [
          { id: 's2103', setNumber: 1, weight: 295, reps: 5, completed: true, setType: 'normal' },
        ],
      },
    ],
  };

  return history;
}
