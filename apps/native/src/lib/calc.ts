import type { Unit } from "@/src/types";

/** Epley estimated one-rep max, to one decimal. */
export function estimate1RM(weight: number, reps: number): number {
	if (weight <= 0 || reps <= 0) return 0;
	if (reps === 1) return weight;
	return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Brzycki estimated one-rep max, to one decimal. */
export function brzycki1RM(weight: number, reps: number): number {
	if (weight <= 0 || reps <= 0) return 0;
	if (reps === 1) return weight;
	if (reps >= 36) return Math.round(weight * 20) / 10;
	return Math.round((weight / (1.0278 - 0.0278 * reps)) * 10) / 10;
}

export function percentTable(oneRepMax: number) {
	return [100, 95, 90, 85, 80, 75, 70, 65, 60, 50].map((percent) => ({
		percent,
		weight: roundTo((oneRepMax * percent) / 100, 0.5),
	}));
}

export interface Plate {
	weight: number;
	color: string;
}

const KG_PLATES: Plate[] = [
	{ weight: 25, color: "#E5484D" },
	{ weight: 20, color: "#3E7BFA" },
	{ weight: 15, color: "#F5C542" },
	{ weight: 10, color: "#3DBE7A" },
	{ weight: 5, color: "#E8EAED" },
	{ weight: 2.5, color: "#3A3F48" },
	{ weight: 1.25, color: "#A0A6B1" },
];

const LB_PLATES: Plate[] = [
	{ weight: 45, color: "#3E7BFA" },
	{ weight: 35, color: "#F5C542" },
	{ weight: 25, color: "#3DBE7A" },
	{ weight: 10, color: "#E8EAED" },
	{ weight: 5, color: "#A0A6B1" },
	{ weight: 2.5, color: "#3A3F48" },
];

const PLATE_COLORS = [
	"#E5484D",
	"#3E7BFA",
	"#F5C542",
	"#3DBE7A",
	"#E8EAED",
	"#A0A6B1",
];

/** Plates for the gym's own set of sizes (heaviest first), falling back to the standard set. */
export function platesFor(unit: Unit, available?: number[]): Plate[] {
	if (!available || available.length === 0)
		return unit === "kg" ? KG_PLATES : LB_PLATES;
	return [...new Set(available)]
		.filter((w) => w > 0)
		.sort((a, b) => b - a)
		.map((weight, i) => ({
			weight,
			color: PLATE_COLORS[i % PLATE_COLORS.length] ?? "#A0A6B1",
		}));
}

export function calculatePlates(
	target: number,
	bar: number,
	unit: Unit,
	available?: number[],
) {
	const plates = platesFor(unit, available);
	const perSide: { plate: Plate; count: number }[] = [];
	if (target <= bar) return { perSide, perSideWeight: 0, remainder: 0 };
	let remaining = (target - bar) / 2;
	for (const plate of plates) {
		if (remaining >= plate.weight) {
			const count = Math.floor(remaining / plate.weight + 1e-9);
			perSide.push({ plate, count });
			remaining = +(remaining - count * plate.weight).toFixed(3);
		}
	}
	return {
		perSide,
		perSideWeight: (target - bar) / 2,
		remainder: +(remaining * 2).toFixed(2),
	};
}

export function warmupSets(working: number, bar: number, unit: Unit) {
	const step = unit === "kg" ? 2.5 : 5;
	// No bar (dumbbells, machines): ramp by percentage of the working weight.
	if (bar <= 0) {
		if (working <= 0) return [];
		return [
			{ label: "40%", weight: roundTo(working * 0.4, step / 2), reps: 8 },
			{ label: "60%", weight: roundTo(working * 0.6, step / 2), reps: 5 },
			{ label: "80%", weight: roundTo(working * 0.8, step / 2), reps: 2 },
		];
	}
	if (working <= bar) return [{ label: "Empty bar", weight: bar, reps: 10 }];
	const at = (pct: number) =>
		Math.max(bar, roundTo(bar + (working - bar) * pct, step));
	return [
		{ label: "Empty bar", weight: bar, reps: 10 },
		{ label: "40%", weight: at(0.4), reps: 5 },
		{ label: "65%", weight: at(0.65), reps: 3 },
		{ label: "85%", weight: at(0.85), reps: 1 },
	];
}

export function roundTo(value: number, step: number): number {
	return Math.round(value / step) * step;
}

export function convertWeight(weight: number, from: Unit, to: Unit): number {
	if (from === to) return weight;
	if (from === "lbs") return roundTo(weight * 0.45359237, 0.5);
	return Math.round(weight * 2.20462262);
}

export const kgToLb = (kg: number) => kg * 2.20462262;
export const lbToKg = (lb: number) => lb / 2.20462262;
export const cmToFtIn = (cm: number) => {
	const totalIn = Math.round(cm / 2.54);
	return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
};

/** Formats 1234.5 → "1,234.5", 1200 → "1,200". */
export function fmt(n: number, maxDecimals = 1): string {
	return n.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export function fmtDuration(totalSeconds: number): string {
	const s = Math.max(0, Math.round(totalSeconds));
	const m = Math.floor(s / 60);
	return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Distance follows the weight unit: kg logs kilometres, lbs logs miles. */
export function distanceUnit(unit: Unit): "km" | "mi" {
	return unit === "kg" ? "km" : "mi";
}

/** Converts a distance logged under one weight unit to the other (km ↔ mi), to two decimals. */
export function convertDistance(
	distance: number,
	from: Unit,
	to: Unit,
): number {
	if (from === to || !distance) return distance;
	const converted = from === "lbs" ? distance * 1.609344 : distance / 1.609344;
	return Math.round(converted * 100) / 100;
}

/** Set time as m:ss, or h:mm:ss from an hour up. */
export function fmtSetTime(totalSeconds: number): string {
	const s = Math.max(0, Math.floor(totalSeconds || 0));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const ss = String(s % 60).padStart(2, "0");
	return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Parses "90", "1:30" or "1:02:03" into seconds; "" is 0. Returns null while the text isn't a valid time. */
export function parseSetTime(input: string): number | null {
	const trimmed = input.trim();
	if (trimmed === "") return 0;
	const parts = trimmed.split(":");
	if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
	return parts.reduce(
		(total, part) => total * 60 + Number.parseInt(part, 10),
		0,
	);
}
