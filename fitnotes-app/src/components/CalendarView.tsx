import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Dumbbell, ArrowRight } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { formatDateISO, parseDateISO, formatDisplayDate } from '../utils/calc';
import { CATEGORY_COLORS } from '../data/defaultExercises';

export const CalendarView: React.FC = () => {
  const { workouts, currentDate, setCurrentDate, setActiveTab, settings } = useWorkout();

  // Selected date inside calendar view
  const [viewDate, setViewDate] = useState<Date>(() => parseDateISO(currentDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Days array
  const calendarCells = useMemo(() => {
    const cells = [];
    // Blank padding before first day
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        dayNumber: day,
        dateStr,
        workout: workouts[dateStr],
      });
    }
    return cells;
  }, [year, month, daysInMonth, firstDayIndex, workouts]);

  // Selected day workout details
  const selectedWorkout = workouts[currentDate];

  // Month Statistics
  const monthStats = useMemo(() => {
    let workoutsCount = 0;
    let totalMonthVolume = 0;

    Object.entries(workouts).forEach(([dateStr, day]) => {
      const [y, m] = dateStr.split('-').map(Number);
      if (y === year && m === month + 1) {
        let hasCompletedSets = false;
        day.exercises.forEach((we) => {
          we.sets.forEach((set) => {
            if (set.completed) {
              hasCompletedSets = true;
              totalMonthVolume += (set.weight || 0) * (set.reps || 0);
            }
          });
        });
        if (hasCompletedSets || day.exercises.length > 0) {
          workoutsCount += 1;
        }
      }
    });

    return {
      workoutsCount,
      totalMonthVolume,
    };
  }, [workouts, year, month]);

  const handleSelectDate = (dateStr: string) => {
    setCurrentDate(dateStr);
  };

  const handleJumpToWorkout = () => {
    setActiveTab('workout');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28">
      {/* Month Navigator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold text-white">{monthName}</h2>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{monthStats.workoutsCount} Workouts</span>
              <span aria-hidden="true">·</span>
              <span className="font-tabular font-medium text-emerald-400">
                {monthStats.totalMonthVolume.toLocaleString()} {settings.unit}
              </span>
            </div>
          </div>
          <button
            onClick={nextMonth}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-[11px] font-semibold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="h-12 sm:h-14 rounded-xl" />;
            }

            const isSelected = cell.dateStr === currentDate;
            const hasWorkout = cell.workout && cell.workout.exercises.length > 0;
            const isToday = cell.dateStr === formatDateISO(new Date());

            return (
              <button
                key={cell.dateStr}
                onClick={() => handleSelectDate(cell.dateStr)}
                className={`h-12 sm:h-14 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400 shadow-md'
                    : hasWorkout
                    ? 'bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700'
                    : 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-400'
                } ${isToday && !isSelected ? 'ring-1 ring-emerald-500/50' : ''}`}
              >
                <span className="text-xs sm:text-sm font-medium font-tabular">
                  {cell.dayNumber}
                </span>

                {/* Workout indicator */}
                {hasWorkout && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Workout Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>{formatDisplayDate(currentDate)}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedWorkout && selectedWorkout.exercises.length > 0
                ? `${selectedWorkout.exercises.length} exercises logged`
                : 'No workout logged for this date'}
            </p>
          </div>

          <button
            onClick={handleJumpToWorkout}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <span>{selectedWorkout && selectedWorkout.exercises.length > 0 ? 'Edit Workout' : 'Log Workout'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {selectedWorkout && selectedWorkout.exercises.length > 0 ? (
          <div className="space-y-2.5">
            {selectedWorkout.notes && (
              <div className="p-2.5 rounded-xl bg-slate-800/60 text-xs text-slate-300 italic border border-slate-800">
                "{selectedWorkout.notes}"
              </div>
            )}

            <div className="divide-y divide-slate-800">
              {selectedWorkout.exercises.map((we) => {
                const completedSets = we.sets.filter((s) => s.completed);
                const catColor = CATEGORY_COLORS[we.category] || CATEGORY_COLORS.Other;

                return (
                  <div key={we.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full`}
                        style={{ backgroundColor: catColor.accent }}
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {we.exerciseName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {completedSets.length > 0 ? (
                            <span>
                              {completedSets.length} sets completed (
                              {completedSets.map((s) => `${s.weight}×${s.reps}`).join(', ')})
                            </span>
                          ) : (
                            <span>{we.sets.length} sets planned</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-tabular text-slate-400">
                      {we.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400">
            <p className="text-xs">Rest day or unlogged workout.</p>
            <button
              onClick={handleJumpToWorkout}
              className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
            >
              Start logging for {formatDisplayDate(currentDate)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
