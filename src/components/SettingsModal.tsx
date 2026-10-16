import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  X,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Volume2,
  Smartphone,
  Timer,
  Scale,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    exportCSV,
    exportJSON,
    importJSON,
    resetToSampleData,
    clearAllData,
  } = useWorkout();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importJSON(content);
      if (success) {
        setImportStatus('Backup restored successfully!');
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        setImportStatus('Invalid JSON backup format. Please check file.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">FitNotes Settings</h2>
              <p className="text-xs text-slate-400">Preferences, Units & Backup</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.includes('success')
                  ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-700 text-rose-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Unit Preferences */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Weight Unit System</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateSettings({ unit: 'lbs' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-tabular transition-all ${
                  settings.unit === 'lbs'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Pounds (lbs)
              </button>
              <button
                onClick={() => updateSettings({ unit: 'kg' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-tabular transition-all ${
                  settings.unit === 'kg'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Kilograms (kg)
              </button>
            </div>
          </div>

          {/* Rest Timer Settings */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span>Rest Timer Behavior</span>
            </div>

            {/* Auto rest toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Auto-Start Rest Timer
                </span>
                <span className="text-[11px] text-slate-400">
                  Starts countdown when you complete a set
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRestTimer}
                onChange={(e) => updateSettings({ autoRestTimer: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded"
              />
            </div>

            {/* Default rest seconds */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                Default Rest Duration
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[30, 60, 90, 120, 180].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateSettings({ defaultRestSeconds: s })}
                    className={`py-2 rounded-lg text-xs font-semibold font-tabular border transition-all ${
                      settings.defaultRestSeconds === s
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Alert */}
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Timer Sound Notification
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded"
              />
            </div>

            {/* Vibration */}
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Tactile Haptic Feedback
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => updateSettings({ vibrationEnabled: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded"
              />
            </div>
          </div>

          {/* Backup & Export */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Data Export & Backup</span>
            </div>
            <p className="text-[11px] text-slate-400">
              FitNotes saves your workouts offline in browser storage. Export your data regularly.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportCSV}
                className="h-11 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={exportJSON}
                className="h-11 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Backup JSON</span>
              </button>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <a
                href="/fitnotes-app.zip"
                download="fitnotes-app.zip"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-950/40"
              >
                <Download className="w-4 h-4" />
                <span>Download Project Code (.ZIP)</span>
              </a>
            </div>
          </div>

          {/* Data Reset Tools */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-200">Database Tools</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm('Reload sample workouts and demo history?')) {
                    resetToSampleData();
                    onClose();
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Demo Data</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear all logged workouts? This cannot be undone.')) {
                    clearAllData();
                    onClose();
                  }
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 rounded-xl border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
