import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  WorkoutDay,
  WorkoutExercise,
  WorkoutSet,
  Exercise,
  Routine,
  UserSettings,
  PersonalRecord,
  Category,
} from '../types/workout';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';
import { DEFAULT_ROUTINES, generateSampleHistory } from '../data/sampleRoutines';
import {
  formatDateISO,
  calculate1RM,
  playRestTimerBeep,
  triggerHaptic,
  convertWeight,
} from '../utils/calc';

interface RestTimerState {
  isActive: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  exerciseName?: string;
}

interface WorkoutContextType {
  // Navigation & Date
  currentDate: string;
  setCurrentDate: (date: string) => void;
  activeTab: 'workout' | 'calendar' | 'exercises' | 'track' | 'tools';
  setActiveTab: (tab: 'workout' | 'calendar' | 'exercises' | 'track' | 'tools') => void;

  // Data
  workouts: Record<string, WorkoutDay>;
  currentDayWorkout: WorkoutDay;
  exercises: Exercise[];
  routines: Routine[];
  settings: UserSettings;
  personalRecords: Record<string, PersonalRecord>;

  // Workout Actions
  addExerciseToWorkout: (exerciseId: string) => void;
  removeExerciseFromWorkout: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string, templateSet?: Partial<WorkoutSet>) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  deleteSet: (workoutExerciseId: string, setId: string) => void;
  toggleSetCompleted: (workoutExerciseId: string, setId: string) => void;
  reorderExercises: (workoutExercises: WorkoutExercise[]) => void;
  saveWorkoutNotes: (notes: string) => void;
  saveExerciseNotes: (workoutExerciseId: string, notes: string) => void;

  // Exercise Management
  addCustomExercise: (exercise: Omit<Exercise, 'id'>) => string;
  deleteCustomExercise: (exerciseId: string) => void;

  // Routine Actions
  addRoutine: (routine: Omit<Routine, 'id'>) => void;
  deleteRoutine: (routineId: string) => void;
  loadRoutineIntoWorkout: (routineId: string, dayIndex: number) => void;

  // Rest Timer
  restTimer: RestTimerState;
  startRestTimer: (seconds?: number, exerciseName?: string) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  stopRestTimer: () => void;
  addRestTimerSeconds: (seconds: number) => void;

  // Settings & Storage
  updateSettings: (updates: Partial<UserSettings>) => void;
  exportCSV: () => void;
  exportJSON: () => void;
  importJSON: (jsonString: string) => boolean;
  resetToSampleData: () => void;
  clearAllData: () => void;

  // UI helpers
  openExerciseSelector: () => void;
  closeExerciseSelector: () => void;
  isExerciseSelectorOpen: boolean;
  selectedExerciseForHistory: Exercise | null;
  setSelectedExerciseForHistory: (ex: Exercise | null) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WORKOUTS: 'fitnotes_workouts_v1',
  EXERCISES: 'fitnotes_exercises_v1',
  ROUTINES: 'fitnotes_routines_v1',
  SETTINGS: 'fitnotes_settings_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  unit: 'lbs',
  defaultBarbellWeight: 45,
  autoRestTimer: true,
  defaultRestSeconds: 90,
  soundEnabled: true,
  vibrationEnabled: true,
  amoledMode: true,
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDate, setCurrentDate] = useState<string>(() => formatDateISO(new Date()));
  const [activeTab, setActiveTab] = useState<'workout' | 'calendar' | 'exercises' | 'track' | 'tools'>('workout');
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState<Exercise | null>(null);

  // Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Exercises Library
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXERCISES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_EXERCISES;
  });

  // Routines
  const [routines, setRoutines] = useState<Routine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_ROUTINES;
  });

  // Workouts History
  const [workouts, setWorkouts] = useState<Record<string, WorkoutDay>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return generateSampleHistory();
  });

  // Rest Timer State
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    isPaused: false,
    remainingSeconds: 0,
    totalSeconds: 90,
    exerciseName: undefined,
  });

  // Persist State
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
    } catch {
      // ignore
    }
  }, [exercises]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    } catch {
      // ignore
    }
  }, [routines]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch {
      // ignore
    }
  }, [workouts]);

  // Rest Timer countdown interval
  useEffect(() => {
    if (!restTimer.isActive || restTimer.isPaused) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (!prev.isActive || prev.isPaused) return prev;

        if (prev.remainingSeconds <= 1) {
          // Timer finished!
          if (settings.soundEnabled) {
            playRestTimerBeep(true);
            setTimeout(() => playRestTimerBeep(true), 250);
          }
          if (settings.vibrationEnabled) {
            triggerHaptic();
          }
          return {
            ...prev,
            isActive: false,
            isPaused: false,
            remainingSeconds: 0,
          };
        }

        // Warning chime at 3 seconds
        if (prev.remainingSeconds === 4 && settings.soundEnabled) {
          playRestTimerBeep(false);
        }

        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isActive, restTimer.isPaused, settings.soundEnabled, settings.vibrationEnabled]);

  // Current day workout accessor
  const currentDayWorkout: WorkoutDay = useMemo(() => {
    return (
      workouts[currentDate] || {
        date: currentDate,
        exercises: [],
        notes: '',
      }
    );
  }, [workouts, currentDate]);

  // Personal Records computation across all workouts
  const personalRecords = useMemo(() => {
    const prMap: Record<string, PersonalRecord> = {};

    Object.values(workouts).forEach((day) => {
      day.exercises.forEach((we) => {
        const ex = exercises.find((e) => e.id === we.exerciseId);
        const category: Category = ex?.category || we.category || 'Other';

        if (!prMap[we.exerciseId]) {
          prMap[we.exerciseId] = {
            exerciseId: we.exerciseId,
            exerciseName: we.exerciseName,
            category,
            maxWeight: { value: 0, reps: 0, date: day.date },
            maxEstimated1RM: { value: 0, weight: 0, reps: 0, date: day.date },
            maxVolume: { value: 0, date: day.date },
          };
        }

        let dayVolume = 0;

        we.sets.forEach((set) => {
          if (!set.completed) return;
          const weight = set.weight || 0;
          const reps = set.reps || 0;
          dayVolume += weight * reps;

          // Max weight
          if (weight > prMap[we.exerciseId].maxWeight.value) {
            prMap[we.exerciseId].maxWeight = {
              value: weight,
              reps,
              date: day.date,
            };
          }

          // Estimated 1RM
          const e1rm = calculate1RM(weight, reps);
          if (e1rm > prMap[we.exerciseId].maxEstimated1RM.value) {
            prMap[we.exerciseId].maxEstimated1RM = {
              value: e1rm,
              weight,
              reps,
              date: day.date,
            };
          }
        });

        if (dayVolume > prMap[we.exerciseId].maxVolume.value) {
          prMap[we.exerciseId].maxVolume = {
            value: dayVolume,
            date: day.date,
          };
        }
      });
    });

    return prMap;
  }, [workouts, exercises]);

  // Timer controls
  const startRestTimer = useCallback(
    (seconds?: number, exerciseName?: string) => {
      const duration = seconds ?? settings.defaultRestSeconds;
      setRestTimer({
        isActive: true,
        isPaused: false,
        remainingSeconds: duration,
        totalSeconds: duration,
        exerciseName,
      });
      if (settings.soundEnabled) {
        playRestTimerBeep(false);
      }
    },
    [settings.defaultRestSeconds, settings.soundEnabled]
  );

  const pauseRestTimer = useCallback(() => {
    setRestTimer((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeRestTimer = useCallback(() => {
    setRestTimer((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const stopRestTimer = useCallback(() => {
    setRestTimer((prev) => ({ ...prev, isActive: false, isPaused: false, remainingSeconds: 0 }));
  }, []);

  const addRestTimerSeconds = useCallback((seconds: number) => {
    setRestTimer((prev) => ({
      ...prev,
      remainingSeconds: Math.max(0, prev.remainingSeconds + seconds),
      totalSeconds: Math.max(prev.totalSeconds, prev.remainingSeconds + seconds),
    }));
  }, []);

  // Workout mutation helpers
  const updateDayWorkout = useCallback(
    (date: string, updater: (prev: WorkoutDay) => WorkoutDay) => {
      setWorkouts((prev) => {
        const existing = prev[date] || { date, exercises: [], notes: '' };
        const updated = updater(existing);
        return {
          ...prev,
          [date]: updated,
        };
      });
    },
    []
  );

  const addExerciseToWorkout = useCallback(
    (exerciseId: string) => {
      const exercise = exercises.find((e) => e.id === exerciseId);
      if (!exercise) return;

      // Check if this exercise was performed in past workouts to prepopulate first set
      let defaultWeight = 0;
      let defaultReps = 10;
      for (const day of Object.values(workouts)) {
        const found = day.exercises.find((we) => we.exerciseId === exerciseId);
        if (found && found.sets.length > 0) {
          const lastSet = found.sets[found.sets.length - 1];
          defaultWeight = lastSet.weight;
          defaultReps = lastSet.reps;
          break;
        }
      }

      const newWorkoutExercise: WorkoutExercise = {
        id: `we-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        sets: [
          {
            id: `set-${Date.now()}-1`,
            setNumber: 1,
            weight: defaultWeight,
            reps: defaultReps,
            completed: false,
            setType: 'normal',
          },
        ],
      };

      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        exercises: [...prev.exercises, newWorkoutExercise],
      }));

      setIsExerciseSelectorOpen(false);
    },
    [exercises, workouts, currentDate, updateDayWorkout]
  );

  const removeExerciseFromWorkout = useCallback(
    (workoutExerciseId: string) => {
      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        exercises: prev.exercises.filter((e) => e.id !== workoutExerciseId),
      }));
    },
    [currentDate, updateDayWorkout]
  );

  const addSet = useCallback(
    (workoutExerciseId: string, templateSet?: Partial<WorkoutSet>) => {
      updateDayWorkout(currentDate, (prev) => {
        return {
          ...prev,
          exercises: prev.exercises.map((we) => {
            if (we.id !== workoutExerciseId) return we;
            const lastSet = we.sets[we.sets.length - 1];
            const nextSetNumber = we.sets.length + 1;
            const newSet: WorkoutSet = {
              id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              setNumber: nextSetNumber,
              weight: templateSet?.weight ?? lastSet?.weight ?? 0,
              reps: templateSet?.reps ?? lastSet?.reps ?? 10,
              completed: false,
              setType: templateSet?.setType ?? 'normal',
            };
            return {
              ...we,
              sets: [...we.sets, newSet],
            };
          }),
        };
      });
    },
    [currentDate, updateDayWorkout]
  );

  const updateSet = useCallback(
    (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        exercises: prev.exercises.map((we) => {
          if (we.id !== workoutExerciseId) return we;
          return {
            ...we,
            sets: we.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
          };
        }),
      }));
    },
    [currentDate, updateDayWorkout]
  );

  const deleteSet = useCallback(
    (workoutExerciseId: string, setId: string) => {
      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        exercises: prev.exercises.map((we) => {
          if (we.id !== workoutExerciseId) return we;
          const filtered = we.sets.filter((s) => s.id !== setId);
          // Renumber sets
          const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
          return {
            ...we,
            sets: renumbered,
          };
        }),
      }));
    },
    [currentDate, updateDayWorkout]
  );

  const toggleSetCompleted = useCallback(
    (workoutExerciseId: string, setId: string) => {
      let isNowCompleted = false;
      let targetExercise: WorkoutExercise | undefined;
      let targetSet: WorkoutSet | undefined;

      updateDayWorkout(currentDate, (prev) => {
        const nextExercises = prev.exercises.map((we) => {
          if (we.id !== workoutExerciseId) return we;
          targetExercise = we;
          return {
            ...we,
            sets: we.sets.map((s) => {
              if (s.id === setId) {
                targetSet = s;
                isNowCompleted = !s.completed;
                return { ...s, completed: isNowCompleted };
              }
              return s;
            }),
          };
        });
        return {
          ...prev,
          exercises: nextExercises,
        };
      });

      if (isNowCompleted && targetExercise && targetSet) {
        if (settings.vibrationEnabled) {
          triggerHaptic();
        }

        // Check if this set is a new PR!
        const existingPR = personalRecords[targetExercise.exerciseId];
        const new1RM = calculate1RM(targetSet.weight, targetSet.reps);
        const isPR =
          targetSet.weight > 0 &&
          targetSet.reps > 0 &&
          (!existingPR ||
            targetSet.weight > existingPR.maxWeight.value ||
            new1RM > existingPR.maxEstimated1RM.value);

        if (isPR) {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.75 },
            });
          } catch {
            // ignore
          }
        }

        // Auto trigger rest timer
        if (settings.autoRestTimer) {
          startRestTimer(settings.defaultRestSeconds, targetExercise.exerciseName);
        }
      }
    },
    [currentDate, updateDayWorkout, settings, personalRecords, startRestTimer]
  );

  const reorderExercises = useCallback(
    (workoutExercises: WorkoutExercise[]) => {
      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        exercises: workoutExercises,
      }));
    },
    [currentDate, updateDayWorkout]
  );

  const saveWorkoutNotes = useCallback(
    (notes: string) => {
      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        notes,
      }));
    },
    [currentDate, updateDayWorkout]
  );

  const saveExerciseNotes = useCallback(
    (workoutExerciseId: string, notes: string) => {
      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        exercises: prev.exercises.map((we) => (we.id === workoutExerciseId ? { ...we, notes } : we)),
      }));
    },
    [currentDate, updateDayWorkout]
  );

  // Custom Exercise creation
  const addCustomExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
    const id = `custom-${Date.now()}`;
    const newEx: Exercise = {
      ...exercise,
      id,
      isCustom: true,
    };
    setExercises((prev) => [newEx, ...prev]);
    return id;
  }, []);

  const deleteCustomExercise = useCallback((exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  }, []);

  // Routines
  const addRoutine = useCallback((routine: Omit<Routine, 'id'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: `routine-${Date.now()}`,
    };
    setRoutines((prev) => [...prev, newRoutine]);
  }, []);

  const deleteRoutine = useCallback((routineId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
  }, []);

  const loadRoutineIntoWorkout = useCallback(
    (routineId: string, dayIndex: number) => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine || !routine.days[dayIndex]) return;

      const routineDay = routine.days[dayIndex];
      const newExercises: WorkoutExercise[] = [];

      routineDay.exerciseIds.forEach((exId, idx) => {
        const ex = exercises.find((e) => e.id === exId);
        if (!ex) return;

        // Try to get previous weight & reps
        let lastWeight = 0;
        let lastReps = 10;
        for (const day of Object.values(workouts)) {
          const found = day.exercises.find((we) => we.exerciseId === exId);
          if (found && found.sets.length > 0) {
            lastWeight = found.sets[0].weight;
            lastReps = found.sets[0].reps;
            break;
          }
        }

        newExercises.push({
          id: `we-routine-${Date.now()}-${idx}`,
          exerciseId: ex.id,
          exerciseName: ex.name,
          category: ex.category,
          sets: [
            {
              id: `set-r-${Date.now()}-${idx}-1`,
              setNumber: 1,
              weight: lastWeight,
              reps: lastReps,
              completed: false,
              setType: 'normal',
            },
            {
              id: `set-r-${Date.now()}-${idx}-2`,
              setNumber: 2,
              weight: lastWeight,
              reps: lastReps,
              completed: false,
              setType: 'normal',
            },
            {
              id: `set-r-${Date.now()}-${idx}-3`,
              setNumber: 3,
              weight: lastWeight,
              reps: lastReps,
              completed: false,
              setType: 'normal',
            },
          ],
        });
      });

      updateDayWorkout(currentDate, (prev) => ({
        ...prev,
        notes: prev.notes ? `${prev.notes} | ${routine.name} - ${routineDay.name}` : `${routine.name} - ${routineDay.name}`,
        exercises: [...prev.exercises, ...newExercises],
      }));
    },
    [routines, exercises, workouts, currentDate, updateDayWorkout]
  );

  // Settings update & Unit conversions
  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      if (updates.unit && updates.unit !== settings.unit) {
        const oldUnit = settings.unit;
        const newUnit = updates.unit;

        // Convert existing workouts weight values
        setWorkouts((prevWorkouts) => {
          const converted: Record<string, WorkoutDay> = {};
          Object.entries(prevWorkouts).forEach(([date, day]) => {
            converted[date] = {
              ...day,
              exercises: day.exercises.map((we) => ({
                ...we,
                sets: we.sets.map((s) => ({
                  ...s,
                  weight: convertWeight(s.weight, oldUnit, newUnit),
                })),
              })),
            };
          });
          return converted;
        });

        // Set default barbell weight according to unit
        updates.defaultBarbellWeight = newUnit === 'lbs' ? 45 : 20;
      }

      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [settings.unit]
  );

  // FitNotes Compatible CSV Export
  const exportCSV = useCallback(() => {
    const headers = ['Date', 'Exercise', 'Category', 'Weight', 'Reps', 'Distance', 'Time', 'Comment'];
    const rows: string[] = [headers.join(',')];

    Object.values(workouts).forEach((day) => {
      day.exercises.forEach((we) => {
        we.sets.forEach((set) => {
          const row = [
            `"${day.date}"`,
            `"${we.exerciseName.replace(/"/g, '""')}"`,
            `"${we.category}"`,
            set.weight || 0,
            set.reps || 0,
            set.distance || 0,
            set.timeSeconds || 0,
            `"${(set.comment || '').replace(/"/g, '""')}"`,
          ];
          rows.push(row.join(','));
        });
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `FitNotes_Export_${formatDateISO(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [workouts]);

  // JSON Export / Backup
  const exportJSON = useCallback(() => {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings,
      exercises,
      routines,
      workouts,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `FitNotes_Backup_${formatDateISO(new Date())}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [settings, exercises, routines, workouts]);

  const importJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.workouts && typeof data.workouts === 'object') {
        setWorkouts(data.workouts);
      }
      if (Array.isArray(data.exercises)) {
        setExercises(data.exercises);
      }
      if (Array.isArray(data.routines)) {
        setRoutines(data.routines);
      }
      if (data.settings && typeof data.settings === 'object') {
        setSettings(data.settings);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetToSampleData = useCallback(() => {
    const sample = generateSampleHistory();
    setWorkouts(sample);
    setExercises(DEFAULT_EXERCISES);
    setRoutines(DEFAULT_ROUTINES);
  }, []);

  const clearAllData = useCallback(() => {
    setWorkouts({});
  }, []);

  const openExerciseSelector = useCallback(() => setIsExerciseSelectorOpen(true), []);
  const closeExerciseSelector = useCallback(() => setIsExerciseSelectorOpen(false), []);

  return (
    <WorkoutContext.Provider
      value={{
        currentDate,
        setCurrentDate,
        activeTab,
        setActiveTab,
        workouts,
        currentDayWorkout,
        exercises,
        routines,
        settings,
        personalRecords,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        addSet,
        updateSet,
        deleteSet,
        toggleSetCompleted,
        reorderExercises,
        saveWorkoutNotes,
        saveExerciseNotes,
        addCustomExercise,
        deleteCustomExercise,
        addRoutine,
        deleteRoutine,
        loadRoutineIntoWorkout,
        restTimer,
        startRestTimer,
        pauseRestTimer,
        resumeRestTimer,
        stopRestTimer,
        addRestTimerSeconds,
        updateSettings,
        exportCSV,
        exportJSON,
        importJSON,
        resetToSampleData,
        clearAllData,
        openExerciseSelector,
        closeExerciseSelector,
        isExerciseSelectorOpen,
        selectedExerciseForHistory,
        setSelectedExerciseForHistory,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
