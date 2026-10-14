import React, { useState } from 'react';
import { Timer, Play, Pause, X, Plus, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const RestTimerOverlay: React.FC = () => {
  const {
    restTimer,
    pauseRestTimer,
    resumeRestTimer,
    stopRestTimer,
    addRestTimerSeconds,
    settings,
    updateSettings,
  } = useWorkout();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!restTimer.isActive) return null;

  const minutes = Math.floor(restTimer.remainingSeconds / 60);
  const seconds = restTimer.remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((restTimer.totalSeconds - restTimer.remainingSeconds) / (restTimer.totalSeconds || 1)) * 100)
  );

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40">
      <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl shadow-xl shadow-black/60 overflow-hidden text-slate-100 transition-all">
        {/* Progress line */}
        <div className="w-full h-1 bg-slate-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-3.5 flex items-center justify-between gap-3">
          {/* Left: Timer Icon & Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Timer className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-tabular text-2xl font-bold tracking-tight text-white leading-none">
                  {timeFormatted}
                </span>
                {restTimer.isPaused && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1 rounded">
                    PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[150px] sm:max-w-[190px]">
                {restTimer.exerciseName ? `Rest: ${restTimer.exerciseName}` : 'Rest Timer'}
              </p>
            </div>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* +30s */}
            <button
              onClick={() => addRestTimerSeconds(30)}
              className="h-9 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-0.5 active:scale-95 transition-colors"
              title="Add 30 seconds"
            >
              <Plus className="w-3 h-3" />
              <span>30s</span>
            </button>

            {/* Pause / Resume */}
            {restTimer.isPaused ? (
              <button
                onClick={resumeRestTimer}
                className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-colors shadow-sm"
                title="Resume Timer"
              >
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </button>
            ) : (
              <button
                onClick={pauseRestTimer}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center active:scale-95 transition-colors"
                title="Pause Timer"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {/* Mute toggle */}
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center active:scale-95 transition-colors"
              title={settings.soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Dismiss */}
            <button
              onClick={stopRestTimer}
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-700 text-slate-400 flex items-center justify-center active:scale-95 transition-colors"
              title="Cancel Timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
