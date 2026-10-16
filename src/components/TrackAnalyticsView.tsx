import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Trophy,
  BarChart3,
  Flame,
  Calendar,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { calculate1RM, formatDisplayDate } from '../utils/calc';
import { CATEGORY_COLORS } from '../data/defaultExercises';
import { Category } from '../types/workout';

export const TrackAnalyticsView: React.FC = () => {
  const { workouts, exercises, personalRecords, settings } = useWorkout();

  // Find default exercise for charting (first one with history)
  const defaultExId = useMemo(() => {
    for (const pr of Object.values(personalRecords)) {
      if (pr.maxWeight.value > 0) return pr.exerciseId;
    }
    return exercises[0]?.id || '';
  }, [personalRecords, exercises]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(defaultExId);
  const [metricType, setMetricType] = useState<'1rm' | 'max_weight' | 'volume'>('1rm');
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | 'all'>('all');

  const selectedExercise = useMemo(() => {
    return exercises.find((e) => e.id === selectedExerciseId) || exercises[0];
  }, [exercises, selectedExerciseId]);

  // Compute time-series data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    const data: { date: string; value: number; label: string }[] = [];
    const sortedDates = Object.keys(workouts).sort();

    // Time filter cutoff
    const now = new Date();
    let cutoffDays = 99999;
    if (timeRange === '1m') cutoffDays = 30;
    if (timeRange === '3m') cutoffDays = 90;
    if (timeRange === '6m') cutoffDays = 180;

    sortedDates.forEach((dateStr) => {
      const workoutDate = new Date(dateStr);
      const diffDays = (now.getTime() - workoutDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays > cutoffDays) return;

      const day = workouts[dateStr];
      const we = day.exercises.find((e) => e.exerciseId === selectedExercise.id);
      if (we && we.sets.length > 0) {
        let best1RM = 0;
        let maxWeight = 0;
        let dayVolume = 0;

        we.sets.forEach((s) => {
          if (!s.completed) return;
          const e1rm = calculate1RM(s.weight, s.reps);
          if (e1rm > best1RM) best1RM = e1rm;
          if (s.weight > maxWeight) maxWeight = s.weight;
          dayVolume += s.weight * s.reps;
        });

        if (best1RM > 0 || maxWeight > 0 || dayVolume > 0) {
          let value = best1RM;
          if (metricType === 'max_weight') value = maxWeight;
          if (metricType === 'volume') value = dayVolume;

          data.push({
            date: dateStr,
            value,
            label: `${value} ${settings.unit}`,
          });
        }
      }
    });

    return data;
  }, [workouts, selectedExercise, metricType, timeRange, settings.unit]);

  // Muscle Category Volume Breakdown (all time or recent)
  const categoryVolumes = useMemo(() => {
    const totals: Record<Category, number> = {
      Chest: 0,
      Back: 0,
      Legs: 0,
      Shoulders: 0,
      Arms: 0,
      Core: 0,
      Cardio: 0,
      Other: 0,
    };

    Object.values(workouts).forEach((day) => {
      day.exercises.forEach((we) => {
        const cat = we.category || 'Other';
        we.sets.forEach((s) => {
          if (s.completed) {
            totals[cat] = (totals[cat] || 0) + (s.weight || 0) * (s.reps || 0);
          }
        });
      });
    });

    const maxCatVolume = Math.max(...Object.values(totals), 1);

    return {
      totals,
      maxCatVolume,
    };
  }, [workouts]);

  // Overall PRs list
  const topPRs = useMemo(() => {
    return Object.values(personalRecords)
      .filter((pr) => pr.maxWeight.value > 0)
      .sort((a, b) => b.maxEstimated1RM.value - a.maxEstimated1RM.value);
  }, [personalRecords]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28 space-y-4">
      {/* Exercise Selector & Metric Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Exercise Progression</span>
            </h2>
            <p className="text-xs text-slate-400">Track strength and volume over time</p>
          </div>

          {/* Exercise Picker */}
          <div className="relative">
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full sm:w-64 h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Switcher & Time Range */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          {/* Metric buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/70 rounded-xl border border-slate-800">
            <button
              onClick={() => setMetricType('1rm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                metricType === '1rm'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Est. 1RM
            </button>
            <button
              onClick={() => setMetricType('max_weight')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                metricType === 'max_weight'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Max Weight
            </button>
            <button
              onClick={() => setMetricType('volume')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                metricType === 'volume'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Total Volume
            </button>
          </div>

          {/* Time range */}
          <div className="flex items-center gap-1">
            {(['1m', '3m', '6m', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase font-tabular transition-colors ${
                  timeRange === r
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Display Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">{selectedExercise?.name}</h3>
            <span className="text-xs text-slate-400 font-tabular">
              {metricType === '1rm'
                ? 'Estimated 1RM (Epley)'
                : metricType === 'max_weight'
                ? 'Heaviest Single Set'
                : 'Total Session Volume'}
            </span>
          </div>

          {chartData.length > 0 && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Latest Value</span>
              <span className="text-lg font-bold font-tabular text-emerald-400">
                {chartData[chartData.length - 1].value.toLocaleString()} {settings.unit}
              </span>
            </div>
          )}
        </div>

        {/* Visual Line / Bar Graph */}
        {chartData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-xs">
              No completed sets recorded for {selectedExercise?.name} in this time range.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-52 w-full relative flex items-end pt-4 pb-2 px-2">
              {(() => {
                const values = chartData.map((d) => d.value);
                const minVal = Math.min(...values) * 0.85;
                const maxVal = Math.max(...values) * 1.15;
                const range = maxVal - minVal || 1;

                const points = chartData.map((d, i) => {
                  const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 96 + 2;
                  const y = 90 - ((d.value - minVal) / range) * 75;
                  return { x, y, value: d.value, date: d.date };
                });

                const pathD = points.reduce((acc, p, i) => {
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                }, '');

                return (
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {/* Horizontal reference grid lines */}
                    <line x1="0" y1="15" x2="100" y2="15" stroke="#334155" strokeDasharray="3" strokeWidth="0.4" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeDasharray="3" strokeWidth="0.4" />
                    <line x1="0" y1="85" x2="100" y2="85" stroke="#334155" strokeDasharray="3" strokeWidth="0.4" />

                    {/* Gradient Fill under the line */}
                    {points.length > 1 && (
                      <path
                        d={`${pathD} L ${points[points.length - 1].x} 95 L ${points[0].x} 95 Z`}
                        fill="rgba(16, 185, 129, 0.12)"
                      />
                    )}

                    {/* Line stroke */}
                    {points.length > 1 && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Interactive Points */}
                    {points.map((p, idx) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#10b981"
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            {/* X Axis dates */}
            <div className="flex justify-between text-[11px] text-slate-400 font-tabular border-t border-slate-800 pt-2 px-1">
              <span>{chartData[0].date}</span>
              {chartData.length > 2 && (
                <span>{chartData[Math.floor(chartData.length / 2)].date}</span>
              )}
              <span>{chartData[chartData.length - 1].date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Muscle Group Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Volume by Muscle Group</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">Total accumulated volume across all workouts</p>

        <div className="space-y-2.5">
          {(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as Category[]).map((cat) => {
            const vol = categoryVolumes.totals[cat] || 0;
            const percent = Math.round((vol / categoryVolumes.maxCatVolume) * 100);
            const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;

            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{cat}</span>
                  <span className="font-tabular text-slate-400">
                    {vol.toLocaleString()} {settings.unit}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: color.accent,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Records Showcase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Personal Records Trophy Hall</span>
          </h3>
          <span className="text-xs text-slate-400 font-tabular">{topPRs.length} PRs logged</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {topPRs.slice(0, 6).map((pr) => (
            <div
              key={pr.exerciseId}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-100 truncate max-w-[180px]">
                  {pr.exerciseName}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {pr.maxWeight.reps} reps · {pr.maxWeight.date}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold font-tabular text-amber-400 block">
                  {pr.maxWeight.value} {settings.unit}
                </span>
                <span className="text-[10px] font-tabular text-emerald-400/90">
                  1RM: {pr.maxEstimated1RM.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
