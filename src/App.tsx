import React, { useState } from 'react';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { WorkoutDayView } from './components/WorkoutDayView';
import { CalendarView } from './components/CalendarView';
import { ExerciseDatabaseView } from './components/ExerciseDatabaseView';
import { TrackAnalyticsView } from './components/TrackAnalyticsView';
import { ToolsModal } from './components/ToolsModal';
import { RestTimerOverlay } from './components/RestTimerOverlay';
import { ExerciseSelectorModal } from './components/ExerciseSelectorModal';
import { RoutinesModal } from './components/RoutinesModal';
import { SettingsModal } from './components/SettingsModal';
import { Smartphone, Monitor } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    isExerciseSelectorOpen,
    closeExerciseSelector,
    addExerciseToWorkout,
  } = useWorkout();

  const [isRoutinesOpen, setIsRoutinesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState<string | null>(null);

  // Desktop Simulator view toggle
  const [isDeviceFrame, setIsDeviceFrame] = useState(false);

  const handleOpenExerciseHistory = (exerciseId: string) => {
    setSelectedExerciseForHistory(exerciseId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start selection:bg-emerald-500 selection:text-white">
      {/* Desktop Mode Toggle Bar (hidden on mobile) */}
      <div className="hidden lg:flex items-center justify-between w-full max-w-4xl px-4 py-2 text-xs text-slate-400 border-b border-slate-900 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">FitNotes Mobile Experience</span>
          <span className="text-slate-600">·</span>
          <span>Native workout logging clone</span>
        </div>
        <button
          onClick={() => setIsDeviceFrame(!isDeviceFrame)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          {isDeviceFrame ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Screen View</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phone Simulator View</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container: either standard responsive or phone simulator frame */}
      <div
        className={`w-full flex-1 flex flex-col bg-slate-950 transition-all ${
          isDeviceFrame
            ? 'max-w-[420px] my-4 rounded-[40px] border-[6px] border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-700/50 min-h-[850px] relative'
            : 'max-w-4xl'
        }`}
      >
        {/* FitNotes Top Header */}
        <Header
          onOpenRoutines={() => setIsRoutinesOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Tab Content */}
        <main className="flex-1 w-full">
          {activeTab === 'workout' && (
            <WorkoutDayView
              onOpenRoutines={() => setIsRoutinesOpen(true)}
              onOpenExerciseHistory={handleOpenExerciseHistory}
            />
          )}

          {activeTab === 'calendar' && <CalendarView />}

          {activeTab === 'exercises' && (
            <ExerciseDatabaseView
              selectedExerciseId={selectedExerciseForHistory}
              onClearSelected={() => setSelectedExerciseForHistory(null)}
            />
          )}

          {activeTab === 'track' && <TrackAnalyticsView />}

          {activeTab === 'tools' && <ToolsModal />}
        </main>

        {/* Floating Rest Timer */}
        <RestTimerOverlay />

        {/* Fixed Mobile Bottom Tab Bar */}
        <BottomNav />

        {/* Modals & Drawers */}
        <ExerciseSelectorModal
          isOpen={isExerciseSelectorOpen}
          onClose={closeExerciseSelector}
          onSelectExercise={addExerciseToWorkout}
        />

        <RoutinesModal
          isOpen={isRoutinesOpen}
          onClose={() => setIsRoutinesOpen(false)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Exercise History Modal when triggered from Workout card */}
        {selectedExerciseForHistory && activeTab !== 'exercises' && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div className="pointer-events-auto">
              <ExerciseDatabaseView
                selectedExerciseId={selectedExerciseForHistory}
                onClearSelected={() => setSelectedExerciseForHistory(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <WorkoutProvider>
      <MainAppContent />
    </WorkoutProvider>
  );
}
