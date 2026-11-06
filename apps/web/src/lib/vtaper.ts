// Mirrors apps/native/src/lib/vtaper.ts and the app's torso drawing, so the site shows the same numbers.

export const IDEAL = 1.618;

export const STAGES = [
	{ name: "Building", from: 0 },
	{ name: "Athletic", from: 1.3 },
	{ name: "V-taper", from: 1.45 },
	{ name: "Greek god", from: 1.58 },
];

export const stageOf = (ratio: number) =>
	STAGES.reduce((acc, s) => (ratio >= s.from ? s : acc), STAGES[0]!);

export const progressToIdeal = (ratio: number) =>
	Math.max(0, Math.min(1, (ratio - 1.2) / (IDEAL - 1.2)));

/** Front-view torso on a 220 × 200 grid, shoulders `ratio` times a fixed waist. */
export function torso(ratio: number) {
	const cx = 110;
	const waist = 64;
	const s = Math.min(96, (waist * ratio) / 2);
	const w = waist / 2;
	const hip = w + 6;
	return [
		`M ${cx - s} 52`,
		`Q ${cx - s - 4} 64 ${cx - s + 10} 80`,
		`C ${cx - w - 10} 108 ${cx - w - 2} 130 ${cx - w} 146`,
		`L ${cx - hip} 190`,
		`L ${cx + hip} 190`,
		`L ${cx + w} 146`,
		`C ${cx + w + 2} 130 ${cx + w + 10} 108 ${cx + s - 10} 80`,
		`Q ${cx + s + 4} 64 ${cx + s} 52`,
		`Q ${cx} 40 ${cx - s} 52 Z`,
	].join(" ");
}
