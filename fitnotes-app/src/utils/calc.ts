/**
 * FitNotes calculation utilities
 */

// Epley 1RM Formula: Weight * (1 + Reps / 30)
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Brzycki 1RM Formula: Weight / (1.0278 - (0.0278 * Reps))
export function calculateBrzycki1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 36) return Math.round(weight * 2);
  return Math.round(weight / (1.0278 - 0.0278 * reps));
}

// 1RM Percentage Table
export function get1RMPercentages(oneRepMax: number): { percent: number; weight: number }[] {
  const percentages = [100, 95, 90, 85, 80, 75, 70, 65, 60, 50];
  return percentages.map((percent) => ({
    percent,
    weight: Math.round((oneRepMax * percent) / 100),
  }));
}

// Plate Calculator
export interface PlateBreakdown {
  targetWeight: number;
  barWeight: number;
  weightPerSide: number;
  platesPerSide: { weight: number; count: number; color: string }[];
  remainder: number;
}

const LBS_PLATES = [
  { weight: 45, color: '#ef4444' }, // Red
  { weight: 35, color: '#3b82f6' }, // Blue
  { weight: 25, color: '#eab308' }, // Yellow
  { weight: 10, color: '#22c55e' }, // Green
  { weight: 5, color: '#94a3b8' },  // White/Grey
  { weight: 2.5, color: '#06b6d4' } // Light Blue
];

const KG_PLATES = [
  { weight: 25, color: '#ef4444' }, // Red
  { weight: 20, color: '#3b82f6' }, // Blue
  { weight: 15, color: '#eab308' }, // Yellow
  { weight: 10, color: '#22c55e' }, // Green
  { weight: 5, color: '#94a3b8' },  // White
  { weight: 2.5, color: '#000000' },// Black
  { weight: 1.25, color: '#a855f7' }// Chrome / Purple
];

export function calculatePlates(
  targetWeight: number,
  barWeight: number,
  unit: 'lbs' | 'kg'
): PlateBreakdown {
  const availablePlates = unit === 'lbs' ? LBS_PLATES : KG_PLATES;
  
  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      barWeight,
      weightPerSide: 0,
      platesPerSide: [],
      remainder: 0,
    };
  }

  let remainingPerSide = (targetWeight - barWeight) / 2;
  const platesPerSide: { weight: number; count: number; color: string }[] = [];

  for (const plate of availablePlates) {
    if (remainingPerSide >= plate.weight) {
      const count = Math.floor(remainingPerSide / plate.weight);
      platesPerSide.push({
        weight: plate.weight,
        count,
        color: plate.color,
      });
      remainingPerSide = +(remainingPerSide - count * plate.weight).toFixed(2);
    }
  }

  return {
    targetWeight,
    barWeight,
    weightPerSide: (targetWeight - barWeight) / 2,
    platesPerSide,
    remainder: +(remainingPerSide * 2).toFixed(2),
  };
}

// Progressive Warmup Sets Calculator
export function generateWarmupSets(workingWeight: number, barWeight: number) {
  if (workingWeight <= barWeight) {
    return [{ label: 'Empty Bar', weight: barWeight, reps: 10, percent: 'Empty Bar' }];
  }

  const sets = [
    { label: 'Warmup 1', weight: barWeight, reps: 10, percent: 'Empty Bar' },
    { label: 'Warmup 2', weight: Math.round(barWeight + (workingWeight - barWeight) * 0.4), reps: 5, percent: '40%' },
    { label: 'Warmup 3', weight: Math.round(barWeight + (workingWeight - barWeight) * 0.65), reps: 3, percent: '65%' },
    { label: 'Warmup 4', weight: Math.round(barWeight + (workingWeight - barWeight) * 0.85), reps: 1, percent: '85%' },
  ];

  return sets;
}

// Web Audio API Beep synthesizer (clean gym timer notification sound)
export function playRestTimerBeep(highPitch = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(highPitch ? 880 : 587.33, ctx.currentTime); // A5 or D5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio might be blocked by browser policy until user interacts
  }
}

// Web Haptic feedback trigger
export function triggerHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(30);
    } catch {
      // Ignored
    }
  }
}

// Date helpers
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateISO(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(isoString: string): string {
  const date = parseDateISO(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(isoString: string): string {
  const date = parseDateISO(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function addDays(isoString: string, days: number): string {
  const date = parseDateISO(isoString);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}

// Convert weight between lbs and kg
export function convertWeight(weight: number, from: 'lbs' | 'kg', to: 'lbs' | 'kg'): number {
  if (from === to) return weight;
  if (from === 'lbs' && to === 'kg') {
    return Math.round(weight * 0.45359237 * 2) / 2; // round to nearest 0.5kg
  }
  return Math.round(weight * 2.20462262); // round to nearest lb
}
