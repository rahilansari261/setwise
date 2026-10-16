import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Dumbbell, ChevronRight, Check } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { Category, MetricType } from '../types/workout';
import { CATEGORY_COLORS } from '../data/defaultExercises';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
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

export const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
}) => {
  const { exercises, addCustomExercise, workouts, settings } = useWorkout();
  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // New exercise form
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<Category>('Chest');
  const [customMetric, setCustomMetric] = useState<MetricType>('weight_reps');

  // Pre-calculate last used stats for quick reference
  const lastPerformedStats = useMemo(() => {
    const stats: Record<string, string> = {};
    const days = Object.values(workouts).sort((a, b) => b.date.localeCompare(a.date));

    for (const day of days) {
      for (const we of day.exercises) {
        if (!stats[we.exerciseId] && we.sets.length > 0) {
          const completedSets = we.sets.filter((s) => s.completed);
          const refSet = completedSets[completedSets.length - 1] || we.sets[we.sets.length - 1];
          if (refSet) {
            stats[we.exerciseId] = `${refSet.weight} ${settings.unit} × ${refSet.reps}`;
          }
        }
      }
    }
    return stats;
  }, [workouts, settings.unit]);

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

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newId = addCustomExercise({
      name: customName.trim(),
      category: customCategory,
      metricType: customMetric,
      isCustom: true,
    });

    setCustomName('');
    setIsCreatingCustom(false);
    onSelectExercise(newId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Select Exercise</h2>
              <p className="text-xs text-slate-400">
                {filteredExercises.length} exercises available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise (e.g. Bench, Squat, Curl)..."
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
        </div>

        {/* Category Horizontal Pills */}
        <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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

        {/* Custom exercise creator toggle / form */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800">
          {!isCreatingCustom ? (
            <button
              onClick={() => setIsCreatingCustom(true)}
              className="w-full py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Custom Exercise</span>
            </button>
          ) : (
            <form onSubmit={handleCreateCustom} className="py-2 space-y-2.5">
              <div className="text-xs font-bold text-slate-200">New Custom Exercise</div>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Exercise Name (e.g., Swiss Bar Press)"
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as Category)}
                    className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tracking Type</label>
                  <select
                    value={customMetric}
                    onChange={(e) => setCustomMetric(e.target.value as MetricType)}
                    className="w-full h-9 px-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="weight_reps">Weight & Reps</option>
                    <option value="reps_only">Reps Only</option>
                    <option value="distance_time">Distance & Time</option>
                    <option value="time_only">Time Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  Save & Add
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">No exercises found matching "{searchQuery}"</p>
              <button
                onClick={() => {
                  setCustomName(searchQuery);
                  setIsCreatingCustom(true);
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create "{searchQuery}"</span>
              </button>
            </div>
          ) : (
            filteredExercises.map((ex) => {
              const catColor = CATEGORY_COLORS[ex.category] || CATEGORY_COLORS.Other;
              const lastStats = lastPerformedStats[ex.id];

              return (
                <button
                  key={ex.id}
                  onClick={() => onSelectExercise(ex.id)}
                  className="w-full min-h-[52px] px-3 py-2.5 rounded-xl hover:bg-slate-800/70 flex items-center justify-between text-left transition-colors group active:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${catColor.border} ${catColor.bg}`}
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
                        {lastStats && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400/90 font-tabular">Last: {lastStats}</span>
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
      </div>
    </div>
  );
};
