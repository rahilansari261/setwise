import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Dumbbell,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Trophy,
  Calendar,
  X,
  PlusCircle,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { Exercise, Category } from '../types/workout';
import { CATEGORY_COLORS } from '../data/defaultExercises';
import { calculate1RM, formatDisplayDate } from '../utils/calc';

interface ExerciseDatabaseViewProps {
  onSelectForWorkout?: (exerciseId: string) => void;
  selectedExerciseId?: string | null;
  onClearSelected?: () => void;
}

const CATEGORIES: ('All' | Category)[] = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
];

export const ExerciseDatabaseView: React.FC<ExerciseDatabaseViewProps> = ({
  onSelectForWorkout,
  selectedExerciseId,
  onClearSelected,
}) => {
  const {
    exercises,
    workouts,
    personalRecords,
    settings,
    addCustomExercise,
    addExerciseToWorkout,
    deleteCustomExercise,
    setActiveTab,
  } = useWorkout();

  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);

  // If a selectedExerciseId prop is passed in, activate it
  React.useEffect(() => {
    if (selectedExerciseId) {
      const found = exercises.find((e) => e.id === selectedExerciseId);
      if (found) setActiveExercise(found);
    }
  }, [selectedExerciseId, exercises]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [exercises, selectedCategory, searchQuery]);

  // Calculate detailed exercise history for activeExercise
  const exerciseHistory = useMemo(() => {
    if (!activeExercise) return [];

    const historyItems: {
      date: string;
      sets: { weight: number; reps: number; completed: boolean; est1RM: number }[];
      maxWeight: number;
      best1RM: number;
      totalVolume: number;
    }[] = [];

    // Sort dates chronological
    const sortedDates = Object.keys(workouts).sort();

    sortedDates.forEach((dateStr) => {
      const day = workouts[dateStr];
      const we = day.exercises.find((e) => e.exerciseId === activeExercise.id);
      if (we && we.sets.length > 0) {
        let maxWeight = 0;
        let best1RM = 0;
        let totalVolume = 0;

        const sets = we.sets.map((s) => {
          const est1RM = calculate1RM(s.weight, s.reps);
          if (s.completed) {
            if (s.weight > maxWeight) maxWeight = s.weight;
            if (est1RM > best1RM) best1RM = est1RM;
            totalVolume += s.weight * s.reps;
          }
          return {
            weight: s.weight,
            reps: s.reps,
            completed: s.completed,
            est1RM,
          };
        });

        historyItems.push({
          date: dateStr,
          sets,
          maxWeight,
          best1RM,
          totalVolume,
        });
      }
    });

    return historyItems;
  }, [activeExercise, workouts]);

  const pr = activeExercise ? personalRecords[activeExercise.id] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercise library..."
            className="w-full h-11 pl-9 pr-9 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category horizontal switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercises Grid / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/70 overflow-hidden shadow-sm">
        {filteredExercises.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No exercises found.</p>
          </div>
        ) : (
          filteredExercises.map((ex) => {
            const catColor = CATEGORY_COLORS[ex.category] || CATEGORY_COLORS.Other;
            const exPR = personalRecords[ex.id];

            return (
              <button
                key={ex.id}
                onClick={() => setActiveExercise(ex)}
                className="w-full min-h-[58px] px-4 py-3 hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors group active:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${catColor.border} ${catColor.bg}`}
                  >
                    <span className={`text-[11px] font-bold ${catColor.text}`}>
                      {ex.category.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {ex.name}
                      </span>
                      {ex.isCustom && (
                        <span className="text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{ex.category}</span>
                      {exPR && exPR.maxWeight.value > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-400/90 font-tabular flex items-center gap-1">
                            <Trophy className="w-3 h-3 inline" />
                            {exPR.maxWeight.value} {settings.unit}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
              </button>
            );
          })
        )}
      </div>

      {/* Exercise Details & History Modal */}
      {activeExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeExercise.name}</h3>
                  <p className="text-xs text-slate-400">{activeExercise.category}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveExercise(null);
                  if (onClearSelected) onClearSelected();
                }}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* PR Cards Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>Max Weight</span>
                  </div>
                  <div className="text-base font-bold font-tabular text-white mt-1">
                    {pr && pr.maxWeight.value > 0 ? `${pr.maxWeight.value} ${settings.unit}` : '-'}
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Est. 1RM</span>
                  </div>
                  <div className="text-base font-bold font-tabular text-emerald-400 mt-1">
                    {pr && pr.maxEstimated1RM.value > 0
                      ? `${pr.maxEstimated1RM.value} ${settings.unit}`
                      : '-'}
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className="text-[11px] text-slate-400 font-medium">Best Volume</div>
                  <div className="text-base font-bold font-tabular text-white mt-1">
                    {pr && pr.maxVolume.value > 0
                      ? `${pr.maxVolume.value.toLocaleString()} ${settings.unit}`
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Progression Chart (SVG) */}
              {exerciseHistory.length > 1 && (
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-200">Strength Progression</span>
                    <span className="text-[11px] text-emerald-400 font-tabular">Est. 1RM Curve</span>
                  </div>
                  <div className="h-40 w-full relative flex items-end">
                    {/* SVG Line Graph */}
                    {(() => {
                      const values = exerciseHistory.map((h) => h.best1RM || h.maxWeight);
                      const minVal = Math.min(...values) * 0.9;
                      const maxVal = Math.max(...values) * 1.1;
                      const range = maxVal - minVal || 1;

                      const points = exerciseHistory.map((h, i) => {
                        const x = (i / (exerciseHistory.length - 1)) * 100;
                        const val = h.best1RM || h.maxWeight;
                        const y = 100 - ((val - minVal) / range) * 80 - 10;
                        return { x, y, val, date: h.date };
                      });

                      const pathD = points.reduce((acc, p, i) => {
                        return `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                      }, '');

                      return (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {/* Grid line */}
                          <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeDasharray="2" strokeWidth="0.5" />
                          <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeDasharray="2" strokeWidth="0.5" />
                          <line x1="0" y1="80" x2="100" y2="80" stroke="#334155" strokeDasharray="2" strokeWidth="0.5" />

                          {/* Line */}
                          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Dots */}
                          {points.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r="3.5"
                              fill="#10b981"
                              stroke="#0f172a"
                              strokeWidth="1.5"
                            />
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-tabular">
                    <span>{exerciseHistory[0].date}</span>
                    <span>{exerciseHistory[exerciseHistory.length - 1].date}</span>
                  </div>
                </div>
              )}

              {/* History Log list */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 mb-2.5">
                  Workout Log History ({exerciseHistory.length} sessions)
                </h4>
                {exerciseHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No logs recorded for this exercise yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {exerciseHistory
                      .slice()
                      .reverse()
                      .map((session, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-200">
                              {formatDisplayDate(session.date)}
                            </span>
                            <span className="text-[11px] font-tabular text-emerald-400 font-medium">
                              Vol: {session.totalVolume.toLocaleString()} {settings.unit}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {session.sets.map((set, setIdx) => (
                              <span
                                key={setIdx}
                                className={`text-[11px] font-tabular px-2 py-1 rounded-md border ${
                                  set.completed
                                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                                    : 'bg-slate-900/50 text-slate-400 border-slate-800'
                                }`}
                              >
                                {set.weight} {settings.unit} × {set.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3">
              <button
                onClick={() => {
                  addExerciseToWorkout(activeExercise.id);
                  setActiveExercise(null);
                  setActiveTab('workout');
                }}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add to Today's Workout</span>
              </button>

              {activeExercise.isCustom && (
                <button
                  onClick={() => {
                    if (confirm(`Delete custom exercise "${activeExercise.name}"?`)) {
                      deleteCustomExercise(activeExercise.id);
                      setActiveExercise(null);
                    }
                  }}
                  className="h-12 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs font-semibold transition-colors border border-slate-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
