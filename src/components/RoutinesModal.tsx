import React, { useState } from 'react';
import { Layers, Plus, Trash2, X, ChevronRight, Check, ArrowRight, Play } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { Routine, RoutineDay } from '../types/workout';
import { formatDisplayDate } from '../utils/calc';

interface RoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoutinesModal: React.FC<RoutinesModalProps> = ({ isOpen, onClose }) => {
  const {
    routines,
    exercises,
    currentDate,
    loadRoutineIntoWorkout,
    addRoutine,
    deleteRoutine,
    setActiveTab,
  } = useWorkout();

  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New routine state
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newDays, setNewDays] = useState<RoutineDay[]>([
    { name: 'Day 1', exerciseIds: [] },
  ]);

  if (!isOpen) return null;

  const handleLoadDay = (routineId: string, dayIdx: number) => {
    loadRoutineIntoWorkout(routineId, dayIdx);
    onClose();
    setActiveTab('workout');
  };

  const handleSaveCustomRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    addRoutine({
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim() || 'Custom user routine',
      days: newDays.filter((d) => d.name.trim() && d.exerciseIds.length > 0),
    });

    setIsCreating(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setNewDays([{ name: 'Day 1', exerciseIds: [] }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Workout Routines</h2>
              <p className="text-xs text-slate-400">Pre-built templates & workout splits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isCreating ? (
            <>
              {/* Routines List */}
              <div className="space-y-3">
                {routines.map((routine) => {
                  const isExpanded = selectedRoutine?.id === routine.id;

                  return (
                    <div
                      key={routine.id}
                      className="bg-slate-800/60 border border-slate-700/70 rounded-2xl overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setSelectedRoutine(isExpanded ? null : routine)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-800/90 transition-colors"
                      >
                        <div>
                          <h3 className="text-sm font-bold text-white">{routine.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {routine.description}
                          </p>
                          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
                            {routine.days.length} workout days
                          </span>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {/* Expanded Days in this Routine */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-900/80 border-t border-slate-700 space-y-2.5">
                          {routine.days.map((day, dayIdx) => (
                            <div
                              key={dayIdx}
                              className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-200">
                                  {day.name}
                                </span>
                                <button
                                  onClick={() => handleLoadDay(routine.id, dayIdx)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  <span>Load Into Today</span>
                                </button>
                              </div>

                              {/* Exercise Pills */}
                              <div className="flex flex-wrap gap-1.5">
                                {day.exerciseIds.map((exId) => {
                                  const ex = exercises.find((e) => e.id === exId);
                                  return (
                                    <span
                                      key={exId}
                                      className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700"
                                    >
                                      {ex?.name || exId}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Create Custom Routine Button */}
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Custom Routine Template</span>
              </button>
            </>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSaveCustomRoutine} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Create Custom Routine</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Routine Name</label>
                <input
                  type="text"
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  placeholder="e.g. My 4-Day Strength & Hypertrophy"
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newRoutineDesc}
                  onChange={(e) => setNewRoutineDesc(e.target.value)}
                  placeholder="e.g. Focus on chest and arms progression"
                  className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Days setup */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-200">Routine Split Days</div>
                {newDays.map((day, dIdx) => (
                  <div key={dIdx} className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => {
                          const updated = [...newDays];
                          updated[dIdx].name = e.target.value;
                          setNewDays(updated);
                        }}
                        className="h-8 px-2 bg-slate-900 border border-slate-700 rounded text-xs font-bold text-white focus:outline-none"
                      />
                      {newDays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewDays(newDays.filter((_, i) => i !== dIdx))}
                          className="text-rose-400 text-xs p-1"
                        >
                          Remove Day
                        </button>
                      )}
                    </div>

                    {/* Quick Exercise select checkboxes */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Select Exercises:</span>
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        {exercises.slice(0, 20).map((ex) => {
                          const isChecked = day.exerciseIds.includes(ex.id);
                          return (
                            <label
                              key={ex.id}
                              className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const updated = [...newDays];
                                  if (e.target.checked) {
                                    updated[dIdx].exerciseIds.push(ex.id);
                                  } else {
                                    updated[dIdx].exerciseIds = updated[dIdx].exerciseIds.filter(
                                      (id) => id !== ex.id
                                    );
                                  }
                                  setNewDays(updated);
                                }}
                                className="accent-emerald-500 rounded"
                              />
                              <span className="truncate">{ex.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setNewDays([...newDays, { name: `Day ${newDays.length + 1}`, exerciseIds: [] }])
                  }
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 border border-dashed border-slate-700 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Split Day</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoutineName.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  Save Routine
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
