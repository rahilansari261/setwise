import React, { useState } from 'react';
import {
  Dumbbell,
  Calendar,
  Layers,
  Settings,
  Flame,
  Check,
  Download,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { formatDateISO } from '../utils/calc';

interface HeaderProps {
  onOpenRoutines: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRoutines, onOpenSettings }) => {
  const {
    currentDate,
    setCurrentDate,
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    workouts,
  } = useWorkout();

  const isToday = currentDate === formatDateISO(new Date());

  // Count workouts in current streak or total
  const totalWorkoutsLogged = Object.keys(workouts).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white select-none">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand wordmark & icon */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-950/40 text-white">
            <Dumbbell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-base text-slate-100">
                FitNotes
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick "Today" Jump (visible if not already on today) */}
          {!isToday && activeTab === 'workout' && (
            <button
              onClick={() => setCurrentDate(formatDateISO(new Date()))}
              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-md transition-colors flex items-center gap-1 shadow-sm active:scale-95"
              title="Jump to Today"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
          )}

          {/* Unit Toggle (lbs / kg) */}
          <button
            onClick={() =>
              updateSettings({ unit: settings.unit === 'lbs' ? 'kg' : 'lbs' })
            }
            className="h-8 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold font-tabular text-slate-200 flex items-center gap-1 transition-colors active:scale-95"
            title="Toggle lbs / kg"
          >
            <span className={settings.unit === 'lbs' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              LBS
            </span>
            <span className="text-slate-600">/</span>
            <span className={settings.unit === 'kg' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              KG
            </span>
          </button>

          {/* Routines trigger */}
          <button
            onClick={onOpenRoutines}
            className="h-8 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors active:scale-95"
            title="Workout Routines & Templates"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Routines</span>
          </button>

          {/* Direct Download ZIP */}
          <a
            href="/fitnotes-app.zip"
            download="fitnotes-app.zip"
            className="h-8 px-2.5 rounded-md bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-500/80 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 shadow-sm"
            title="Download Full Project ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download ZIP</span>
          </a>

          {/* Settings trigger */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 flex items-center justify-center transition-colors active:scale-95"
            title="Settings & Backup"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
