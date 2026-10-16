import React, { useState } from 'react';
import {
  Calculator,
  Disc,
  Flame,
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import {
  calculatePlates,
  calculate1RM,
  calculateBrzycki1RM,
  get1RMPercentages,
  generateWarmupSets,
} from '../utils/calc';

export const ToolsModal: React.FC = () => {
  const { settings, startRestTimer } = useWorkout();

  const [activeTool, setActiveTool] = useState<'plates' | '1rm' | 'warmup' | 'timer'>('plates');

  // Plate Calculator State
  const [targetWeight, setTargetWeight] = useState<number>(settings.unit === 'lbs' ? 225 : 100);
  const [barWeight, setBarWeight] = useState<number>(settings.defaultBarbellWeight);

  // 1RM Calculator State
  const [calcWeight, setCalcWeight] = useState<number>(settings.unit === 'lbs' ? 205 : 90);
  const [calcReps, setCalcReps] = useState<number>(5);

  // Warmup state
  const [workingWeight, setWorkingWeight] = useState<number>(settings.unit === 'lbs' ? 275 : 120);

  // Plate calculation result
  const plateBreakdown = calculatePlates(targetWeight, barWeight, settings.unit);

  // 1RM calculation result
  const epley1RM = calculate1RM(calcWeight, calcReps);
  const brzycki1RM = calculateBrzycki1RM(calcWeight, calcReps);
  const percentages = get1RMPercentages(epley1RM);

  // Warmup sets
  const warmupSets = generateWarmupSets(workingWeight, barWeight);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28 space-y-4">
      {/* Tool Selector Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-sm grid grid-cols-4 gap-1">
        <button
          onClick={() => setActiveTool('plates')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTool === 'plates'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Disc className="w-4 h-4" />
          <span>Plates</span>
        </button>

        <button
          onClick={() => setActiveTool('1rm')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTool === '1rm'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>1RM Calc</span>
        </button>

        <button
          onClick={() => setActiveTool('warmup')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTool === 'warmup'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Warmup</span>
        </button>

        <button
          onClick={() => setActiveTool('timer')}
          className={`py-2.5 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            activeTool === 'timer'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>Rest Timer</span>
        </button>
      </div>

      {/* 1. PLATE CALCULATOR */}
      {activeTool === 'plates' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Disc className="w-5 h-5 text-emerald-400" />
              <span>Barbell Plate Calculator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Calculate the exact Olympic plates needed on each side of the barbell.
            </p>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Target Weight ({settings.unit})
              </label>
              <input
                type="number"
                step={settings.unit === 'lbs' ? '5' : '2.5'}
                value={targetWeight}
                onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold font-tabular text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Barbell Weight ({settings.unit})
              </label>
              <select
                value={barWeight}
                onChange={(e) => setBarWeight(parseFloat(e.target.value))}
                className="w-full h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={settings.unit === 'lbs' ? 45 : 20}>
                  Standard Bar ({settings.unit === 'lbs' ? '45 lbs' : '20 kg'})
                </option>
                <option value={settings.unit === 'lbs' ? 35 : 15}>
                  Women's Bar ({settings.unit === 'lbs' ? '35 lbs' : '15 kg'})
                </option>
                <option value={settings.unit === 'lbs' ? 25 : 10}>
                  Technique Bar ({settings.unit === 'lbs' ? '25 lbs' : '10 kg'})
                </option>
              </select>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(settings.unit === 'lbs'
              ? [135, 185, 225, 275, 315, 365, 405]
              : [60, 80, 100, 120, 140, 160, 180]
            ).map((w) => (
              <button
                key={w}
                onClick={() => setTargetWeight(w)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-tabular border transition-colors ${
                  targetWeight === w
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {w} {settings.unit}
              </button>
            ))}
          </div>

          {/* Visual Barbell Diagram */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 my-2">
            <div className="text-xs text-slate-400 mb-4 flex items-center justify-between">
              <span>Barbell Sleeve (One Side)</span>
              <span className="font-tabular font-bold text-emerald-400">
                {plateBreakdown.weightPerSide} {settings.unit} / side
              </span>
            </div>

            {/* Barbell illustration */}
            <div className="flex items-center justify-center gap-1.5 h-32 overflow-x-auto py-2">
              {/* Collar / Barbell Shaft */}
              <div className="w-5 h-20 bg-slate-600 rounded-l-md border-r-4 border-slate-400 shrink-0" />
              <div className="w-12 h-6 bg-slate-500 shrink-0" />

              {/* Stacked Plates */}
              {plateBreakdown.platesPerSide.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Empty Bar</div>
              ) : (
                plateBreakdown.platesPerSide.flatMap((p, pIdx) => {
                  const platesArr = [];
                  for (let i = 0; i < p.count; i++) {
                    // Height proportion based on plate weight
                    let heightClass = 'h-28';
                    if (p.weight <= 5) heightClass = 'h-14';
                    else if (p.weight <= 10) heightClass = 'h-18';
                    else if (p.weight <= 25) heightClass = 'h-22';

                    platesArr.push(
                      <div
                        key={`${pIdx}-${i}`}
                        className={`w-6 ${heightClass} rounded flex flex-col items-center justify-center font-bold text-[10px] text-white shadow-md border border-black/30 shrink-0 select-none transition-all`}
                        style={{ backgroundColor: p.color }}
                        title={`${p.weight} ${settings.unit}`}
                      >
                        <span className="rotate-90">{p.weight}</span>
                      </div>
                    );
                  }
                  return platesArr;
                })
              )}

              {/* End of sleeve collar */}
              <div className="w-6 h-10 bg-slate-700 rounded-r border-l border-slate-600 shrink-0" />
            </div>
          </div>

          {/* Plate count summary list */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-200">Plates to Load Per Side:</div>
            {plateBreakdown.platesPerSide.length === 0 ? (
              <p className="text-xs text-slate-400">No plates needed (target is empty barbell).</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {plateBreakdown.platesPerSide.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-xs font-bold font-tabular text-white">
                        {p.weight} {settings.unit}
                      </span>
                    </div>
                    <span className="text-xs font-bold font-tabular text-emerald-400">
                      × {p.count}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {plateBreakdown.remainder > 0 && (
              <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300">
                Remaining weight unable to load with standard plates: {plateBreakdown.remainder}{' '}
                {settings.unit}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 1RM CALCULATOR */}
      {activeTool === '1rm' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>One-Rep Max (1RM) Calculator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Estimate your true single-rep maximum based on submaximal sets.
            </p>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Lifted Weight ({settings.unit})
              </label>
              <input
                type="number"
                step="5"
                value={calcWeight}
                onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 0)}
                className="w-full h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold font-tabular text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Reps Completed
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={calcReps}
                onChange={(e) => setCalcReps(parseInt(e.target.value, 10) || 1)}
                className="w-full h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold font-tabular text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 1RM Results Hero */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 text-center">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Estimated 1RM (Epley)
            </span>
            <div className="text-3xl font-extrabold font-tabular text-white my-1">
              {epley1RM} <span className="text-sm font-normal text-slate-300">{settings.unit}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Brzycki estimate: {brzycki1RM} {settings.unit}
            </p>
          </div>

          {/* Percentage Table */}
          <div>
            <div className="text-xs font-bold text-slate-200 mb-2">
              Percentage of 1RM Working Weights:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {percentages.map((p) => (
                <div
                  key={p.percent}
                  className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 text-center"
                >
                  <span className="text-xs font-semibold text-slate-400 block">{p.percent}%</span>
                  <span className="text-sm font-bold font-tabular text-white">
                    {p.weight} {settings.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. WARMUP CALCULATOR */}
      {activeTool === 'warmup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Progressive Warmup Generator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Safely prepare your joints and central nervous system for heavy working sets.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Heavy Working Set Weight ({settings.unit})
            </label>
            <input
              type="number"
              step="5"
              value={workingWeight}
              onChange={(e) => setWorkingWeight(parseFloat(e.target.value) || 0)}
              className="w-full h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold font-tabular text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-200">Recommended Warmup Protocol:</div>
            <div className="divide-y divide-slate-800 bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
              {warmupSets.map((ws, i) => (
                <div key={i} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{ws.label}</span>
                    <span className="text-[11px] text-slate-400">Intensity: {ws.percent}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-tabular text-amber-400">
                      {ws.weight} {settings.unit}
                    </span>
                    <span className="text-xs text-slate-400 block font-tabular">
                      × {ws.reps} reps
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. MANUAL REST TIMER */}
      {activeTool === 'timer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Timer className="w-5 h-5 text-emerald-400" />
              <span>Dedicated Rest Interval Timer</span>
            </h3>
            <p className="text-xs text-slate-400">
              Start a custom rest timer with audio alert and haptic chime.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[30, 60, 90, 120, 150, 180, 240, 300].map((sec) => (
              <button
                key={sec}
                onClick={() => startRestTimer(sec, 'Manual Rest')}
                className="h-14 rounded-xl bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-700 border border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95"
              >
                <span className="text-base font-bold font-tabular text-white">
                  {sec >= 60 ? `${sec / 60} min` : `${sec}s`}
                </span>
                <span className="text-[10px] text-slate-400">Start Rest</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
