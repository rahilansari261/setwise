import React from 'react';
import { Dumbbell, Calendar, BookOpen, TrendingUp, Calculator } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useWorkout();

  const navItems = [
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'exercises', label: 'Exercises', icon: BookOpen },
    { id: 'track', label: 'Analysis', icon: TrendingUp },
    { id: 'tools', label: 'Tools', icon: Calculator },
  ] as const;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-4xl mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-all active:scale-95 ${
                isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-950/60' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
