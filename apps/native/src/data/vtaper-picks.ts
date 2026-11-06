import type { VGroup } from "@/src/lib/vmuscle";

/**
 * The short list the library opens on: the movements that build a V-taper, grouped by muscle.
 * Ids are hand-written defaults (src/data/exercises.ts) or `lib-<id>` from the bundled library.
 */
export const VTAPER_PICKS: Record<VGroup, string[]> = {
	Lats: [
		"pull-up",
		"lib-1429", // Wide Grip Pull-Up
		"chin-up",
		"lat-pulldown",
		"lib-0238", // Cable Straight Arm Pulldown
		"lib-3563", // Cable One Arm Pulldown
		"lib-2285", // Lever Pullover
		"lib-0017", // Assisted Pull-Up
	],
	"Side delts": [
		"dumbbell-lateral-raise",
		"cable-lateral-raise",
		"lean-away-lateral-raise",
		"lib-0584", // Lever Lateral Raise
		"lib-0396", // Dumbbell Seated Lateral Raise
		"lib-0192", // Cable One Arm Lateral Raise
		"lib-0246", // Cable Upright Row
	],
	"Rear delts": [
		"face-pull",
		"reverse-pec-deck-fly",
		"lib-0383", // Dumbbell Reverse Fly
		"lib-0380", // Dumbbell Rear Lateral Raise
		"lib-0203", // Cable Rear Delt Row (With Rope)
		"lib-0225", // Cable Standing Cross-Over High Reverse Fly
	],
	"Upper back": [
		"seated-cable-row",
		"single-arm-dumbbell-row",
		"lib-0327", // Dumbbell Incline Row (chest supported)
		"t-bar-row",
		"barbell-row",
		"lib-3541", // Dumbbell Incline Y-Raise
	],
	Chest: [
		"incline-dumbbell-bench-press",
		"incline-barbell-bench-press",
		"lib-1299", // Lever Incline Chest Press
		"lib-0179", // Cable Low Fly
		"barbell-bench-press",
		"chest-dips",
		"cable-crossover",
	],
	Arms: [
		"incline-dumbbell-curl",
		"barbell-bicep-curl",
		"dumbbell-hammer-curl",
		"preacher-curl",
		"cable-rope-triceps-pushdown",
		"overhead-triceps-extension",
		"skull-crusher",
	],
	Legs: [
		"barbell-back-squat",
		"romanian-deadlift",
		"leg-press",
		"bulgarian-split-squat",
		"lying-leg-curl",
		"leg-extension",
		"hip-thrust",
		"standing-calf-raise",
	],
	"Front delts": ["dumbbell-shoulder-press", "overhead-press", "arnold-press"],
	Core: [
		"hanging-leg-raise",
		"cable-crunch",
		"plank",
		"ab-wheel-rollout",
		"stomach-vacuum",
	],
};

/** Pick id → position, for sorting the short list by group priority. */
export const PICK_ORDER = new Map(
	Object.values(VTAPER_PICKS)
		.flat()
		.map((id, i) => [id, i]),
);
