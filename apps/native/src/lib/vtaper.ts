import type { Measurement } from "@/src/types";

/** The "golden" shoulder-to-waist ratio the app steers you towards (the Adonis index). */
export const IDEAL_RATIO = 1.618;

export interface VTaperStage {
	name: string;
	/** Lower bound of the ratio for this stage. */
	from: number;
}

export const STAGES: VTaperStage[] = [
	{ name: "Building", from: 0 },
	{ name: "Athletic", from: 1.3 },
	{ name: "V-taper", from: 1.45 },
	{ name: "Greek god", from: 1.58 },
];

/** Shoulder circumference divided by waist circumference. 0 if either is missing. */
export function vtaperRatio(shoulders?: number, waist?: number): number {
	if (!shoulders || !waist || shoulders <= 0 || waist <= 0) return 0;
	return Math.round((shoulders / waist) * 1000) / 1000;
}

export function stageOf(ratio: number): VTaperStage {
	let out = STAGES[0] as VTaperStage;
	for (const s of STAGES) if (ratio >= s.from) out = s;
	return out;
}

/** How far along the road from 1.2 to the ideal ratio, 0–1. */
export function progressToIdeal(ratio: number): number {
	return Math.max(0, Math.min(1, (ratio - 1.2) / (IDEAL_RATIO - 1.2)));
}

/**
 * What would close the gap: a smaller waist, wider shoulders, or a bit of both.
 * Values are in cm; zero means that side is already there.
 */
export function gapAdvice(shoulders: number, waist: number) {
	const waistNeeded = shoulders / IDEAL_RATIO;
	const shouldersNeeded = waist * IDEAL_RATIO;
	return {
		cutWaist: Math.max(0, Math.round((waist - waistNeeded) * 10) / 10),
		addShoulders: Math.max(
			0,
			Math.round((shouldersNeeded - shoulders) * 10) / 10,
		),
	};
}

export interface VTaperPoint {
	date: string;
	ratio: number;
	shoulders: number;
	waist: number;
}

/** One point per measurement day that has both numbers, oldest first. */
export function vtaperHistory(measurements: Measurement[]): VTaperPoint[] {
	const out: VTaperPoint[] = [];
	for (const m of measurements) {
		const ratio = vtaperRatio(m.shoulders, m.waist);
		if (ratio > 0)
			out.push({
				date: m.date,
				ratio,
				shoulders: m.shoulders as number,
				waist: m.waist as number,
			});
	}
	return out;
}
