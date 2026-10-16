import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Check,
  Calendar,
  FileText,
  TrendingUp,
  MoreVertical,
  Minus,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { WorkoutExercise, WorkoutSet, SetType } from '../types/workout';
import {
  addDays,
  formatDisplayDate,
  calculate1RM,
  formatDateISO,
} from '../utils/calc';
import { CATEGORY_COLORS } from '../data/defaultExercises';

interface WorkoutDayViewProps {
  onOpenRoutines: () => void;
  onOpenExerciseHistory: (exerciseId: string) => void;
}

export const WorkoutDayView: React.FC<WorkoutDayViewProps> = ({
  onOpenRoutines,
  onOpenExerciseHistory,
}) => {
  const {
    currentDate,
    setCurrentDate,
    currentDayWorkout,
    settings,
    addSet,
    updateSet,
    deleteSet,
    toggleSetCompleted,
    removeExerciseFromWorkout,
    saveWorkoutNotes,
    saveExerciseNotes,
    openExerciseSelector,
    reorderExercises,
    personalRecords,
  } = useWorkout();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [workoutNotesInput, setWorkoutNotesInput] = useState(currentDayWorkout.notes || '');
  const [activeMenuExerciseId, setActiveMenuExerciseId] = useState<string | null>(null);

  // Compute daily totals
  const dailyStats = useMemo(() => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;

    currentDayWorkout.exercises.forEach((we) => {
      we.sets.forEach((set) => {
        totalSets += 1;
        if (set.completed) {
          completedSets += 1;
          totalVolume += (set.weight || 0) * (set.reps || 0);
        }
      });
    });

    return {
      totalExercises: currentDayWorkout.exercises.length,
      totalSets,
      completedSets,
      totalVolume,
    };
  }, [currentDayWorkout]);

  // Handle cycle set type
  const cycleSetType = (weId: string, set: WorkoutSet) => {
    const types: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
    const currentIndex = types.indexOf(set.setType);
    const nextType = types[(currentIndex + 1) % types.length];
    updateSet(weId, set.id, { setType: nextType });
  };

  const handleCopyLastSet = (we: WorkoutExercise) => {
    if (we.sets.length === 0) {
      addSet(we.id);
      return;
    }
    const lastSet = we.sets[we.sets.length - 1];
    addSet(we.id, {
      weight: lastSet.weight,
      reps: lastSet.reps,
      setType: lastSet.setType,
    });
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= currentDayWorkout.exercises.length) return;
    const items = [...currentDayWorkout.exercises];
    const [moved] = items.splice(index, 1);
    items.splice(newIdx, 0, moved);
    reorderExercises(items);
  };

  return (
    <div className="pb-28">
      {/* Date Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-14 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Previous Day */}
          <button
            onClick={() => setCurrentDate(addDays(currentDate, -1))}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Date Indicator & Picker */}
          <div className="text-center flex-1 min-w-0">
            <div className="flex items-center justify-center gap-1.5">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
                className="bg-transparent text-white font-bold text-base sm:text-lg cursor-pointer focus:outline-none text-center"
              />
            </div>
            <p className="text-xs text-slate-400 truncate">
              {formatDisplayDate(currentDate)}
            </p>
          </div>

          {/* Next Day */}
          <button
            onClick={() => setCurrentDate(addDays(currentDate, 1))}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Daily Metrics Ribbon */}
      <div className="max-w-4xl mx-auto px-4 pt-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-slate-400 font-medium">Exercises</div>
            <div className="text-lg font-bold font-tabular text-slate-100">
              {dailyStats.totalExercises}
            </div>
          </div>
          <div className="border-x border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Completed Sets</div>
            <div className="text-lg font-bold font-tabular text-emerald-400">
              {dailyStats.completedSets}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {dailyStats.totalSets}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Volume</div>
            <div className="text-lg font-bold font-tabular text-slate-100">
              {dailyStats.totalVolume.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">{settings.unit}</span>
            </div>
          </div>
        </div>

        {/* Workout Notes */}
        <div className="mt-2.5">
          {!isEditingNotes ? (
            <button
              onClick={() => {
                setWorkoutNotesInput(currentDayWorkout.notes || '');
                setIsEditingNotes(true);
              }}
              className="w-full text-left px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">
                {currentDayWorkout.notes || 'Tap to add workout notes / comments...'}
              </span>
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">Workout Notes</label>
              <textarea
                value={workoutNotesInput}
                onChange={(e) => setWorkoutNotesInput(e.target.value)}
                placeholder="How did you feel? Energy levels, modifications, warmup notes..."
                className="w-full h-20 p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    saveWorkoutNotes(workoutNotesInput);
                    setIsEditingNotes(false);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                >
                  Save Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Exercises List */}
      <div className="max-w-4xl mx-auto px-4 mt-3 space-y-4">
        {currentDayWorkout.exercises.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center my-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Exercises Logged Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Track your lifts for {formatDisplayDate(currentDate)}. Add individual exercises or load a pre-built routine split.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={openExerciseSelector}
                className="w-full sm:w-auto px-6 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Exercise</span>
              </button>
              <button
                onClick={onOpenRoutines}
                className="w-full sm:w-auto px-6 h-12 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Load Routine Template</span>
              </button>
            </div>
          </div>
        ) : (
          currentDayWorkout.exercises.map((we, exIdx) => {
            const catColor = CATEGORY_COLORS[we.category] || CATEGORY_COLORS.Other;
            const pr = personalRecords[we.exerciseId];

            return (
              <div
                key={we.id}
                className="bg-slate-900 border border-slate-800/90 rounded-2xl overflow-hidden shadow-md"
              >
                {/* Exercise Header */}
                <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border ${catColor.border} ${catColor.bg} ${catColor.text}`}
                    >
                      {we.category.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {we.exerciseName}
                        </h4>
                        {pr && (
                          <button
                            onClick={() => onOpenExerciseHistory(we.exerciseId)}
                            className="text-[10px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                            title={`Personal Best: ${pr.maxWeight.value} ${settings.unit}`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>PR: {pr.maxWeight.value} {settings.unit}</span>
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{we.category}</span>
                    </div>
                  </div>

                  {/* Top exercise actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reorder buttons */}
                    {exIdx > 0 && (
                      <button
                        onClick={() => handleMoveExercise(exIdx, 'up')}
                        className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {exIdx < currentDayWorkout.exercises.length - 1 && (
                      <button
                        onClick={() => handleMoveExercise(exIdx, 'down')}
                        className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Exercise history trigger */}
                    <button
                      onClick={() => onOpenExerciseHistory(we.exerciseId)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                      title="View Exercise History & Charts"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </button>

                    {/* Delete exercise */}
                    <button
                      onClick={() => removeExerciseFromWorkout(we.id)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors"
                      title="Remove Exercise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-950/30">
                        <th className="py-2 pl-3 w-10 text-center">Set</th>
                        <th className="py-2 px-1 w-12 text-center">Type</th>
                        <th className="py-2 px-2 text-center">{settings.unit.toUpperCase()}</th>
                        <th className="py-2 px-2 text-center">Reps</th>
                        <th className="py-2 px-2 text-center hidden sm:table-cell">Est. 1RM</th>
                        <th className="py-2 pr-3 w-16 text-center">Done</th>
                        <th className="py-2 pr-2 w-8 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {we.sets.map((set) => {
                        const est1RM = calculate1RM(set.weight, set.reps);

                        // Set type styling
                        let setBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                        let setBadgeLabel = 'N';
                        if (set.setType === 'warmup') {
                          setBadgeClass = 'bg-amber-950/60 text-amber-300 border-amber-800/50';
                          setBadgeLabel = 'W';
                        } else if (set.setType === 'drop') {
                          setBadgeClass = 'bg-purple-950/60 text-purple-300 border-purple-800/50';
                          setBadgeLabel = 'D';
                        } else if (set.setType === 'failure') {
                          setBadgeClass = 'bg-rose-950/60 text-rose-300 border-rose-800/50';
                          setBadgeLabel = 'F';
                        }

                        return (
                          <tr
                            key={set.id}
                            className={`transition-colors ${
                              set.completed ? 'bg-emerald-950/15' : 'hover:bg-slate-800/20'
                            }`}
                          >
                            {/* Set Number */}
                            <td className="py-2.5 pl-3 text-center font-tabular font-semibold text-slate-300">
                              {set.setNumber}
                            </td>

                            {/* Set Type Switcher */}
                            <td className="py-2.5 px-1 text-center">
                              <button
                                onClick={() => cycleSetType(we.id, set)}
                                className={`w-6 h-6 rounded-md text-[10px] font-bold border transition-colors inline-flex items-center justify-center ${setBadgeClass}`}
                                title={`Set type: ${set.setType}. Tap to cycle (Normal, Warmup, Drop, Failure)`}
                              >
                                {setBadgeLabel}
                              </button>
                            </td>

                            {/* Weight Stepper & Input */}
                            <td className="py-2.5 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() =>
                                    updateSet(we.id, set.id, {
                                      weight: Math.max(0, (set.weight || 0) - (settings.unit === 'lbs' ? 5 : 2.5)),
                                    })
                                  }
                                  className="w-6 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center active:scale-90"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  step={settings.unit === 'lbs' ? '2.5' : '1'}
                                  min="0"
                                  value={set.weight === 0 ? '' : set.weight}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateSet(we.id, set.id, {
                                      weight: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-16 h-8 bg-slate-800/90 border border-slate-700 rounded-lg text-center font-tabular font-bold text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  onClick={() =>
                                    updateSet(we.id, set.id, {
                                      weight: (set.weight || 0) + (settings.unit === 'lbs' ? 5 : 2.5),
                                    })
                                  }
                                  className="w-6 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center active:scale-90"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Reps Stepper & Input */}
                            <td className="py-2.5 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() =>
                                    updateSet(we.id, set.id, {
                                      reps: Math.max(0, (set.reps || 0) - 1),
                                    })
                                  }
                                  className="w-6 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center active:scale-90"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={set.reps === 0 ? '' : set.reps}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateSet(we.id, set.id, {
                                      reps: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-14 h-8 bg-slate-800/90 border border-slate-700 rounded-lg text-center font-tabular font-bold text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  onClick={() =>
                                    updateSet(we.id, set.id, {
                                      reps: (set.reps || 0) + 1,
                                    })
                                  }
                                  className="w-6 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center active:scale-90"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Est 1RM column */}
                            <td className="py-2.5 px-2 text-center font-tabular text-slate-400 hidden sm:table-cell">
                              {est1RM > 0 ? `${est1RM} ${settings.unit}` : '-'}
                            </td>

                            {/* Completion Checkmark Button (>= 44px hitbox) */}
                            <td className="py-2.5 pr-3 text-center">
                              <button
                                onClick={() => toggleSetCompleted(we.id, set.id)}
                                className={`min-w-[44px] min-h-[44px] mx-auto rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${
                                  set.completed
                                    ? 'bg-emerald-500 text-slate-950 font-bold'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-500 border border-slate-700'
                                }`}
                                aria-label={set.completed ? 'Mark incomplete' : 'Mark complete'}
                              >
                                <Check
                                  className={`w-5 h-5 stroke-[2.8] transition-transform ${
                                    set.completed ? 'scale-110' : 'opacity-40'
                                  }`}
                                />
                              </button>
                            </td>

                            {/* Delete set */}
                            <td className="py-2.5 pr-2 text-center">
                              <button
                                onClick={() => deleteSet(we.id, set.id)}
                                className="w-7 h-7 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 flex items-center justify-center transition-colors"
                                title="Delete Set"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Actions for Exercise Card */}
                <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addSet(we.id)}
                      className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 transition-colors active:scale-95 border border-slate-700/80"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Set</span>
                    </button>
                    <button
                      onClick={() => handleCopyLastSet(we)}
                      className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors active:scale-95 border border-slate-700/80"
                      title="Copy previous set's weight and reps"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Set</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenExerciseHistory(we.exerciseId)}
                    className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors py-1 px-2"
                  >
                    <span>History</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Add Exercise Bottom Trigger if has exercises */}
        {currentDayWorkout.exercises.length > 0 && (
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={openExerciseSelector}
              className="w-full py-3.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-98 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Exercise</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
