// Run with: npx tsx src/lib/vmuscle.test.ts
import assert from "node:assert/strict";

import {
	biggestGaps,
	groupOf,
	setsPerGroup,
	statusOf,
	VGROUPS,
} from "./vmuscle";

const cases: [string, Parameters<typeof groupOf>[0], string | null][] = [
	["lat pulldown → Lats", { name: "Lat Pulldown", category: "Back" }, "Lats"],
	[
		"pull-up → Lats",
		{ name: "Pull-Up", category: "Back", target: "lats" },
		"Lats",
	],
	[
		"barbell row (hand-written, Back) → Upper back",
		{ name: "Barbell Bent Over Row", category: "Back" },
		"Upper back",
	],
	[
		"dataset row target upper back",
		{ name: "Cable Seated Row", category: "Back", target: "upper back" },
		"Upper back",
	],
	[
		"lateral raise → Side delts",
		{ name: "Dumbbell Lateral Raise", category: "Shoulders", target: "delts" },
		"Side delts",
	],
	[
		"upright row → Side delts",
		{ name: "Barbell Upright Row", category: "Shoulders", target: "delts" },
		"Side delts",
	],
	[
		"face pull → Rear delts",
		{ name: "Face Pull", category: "Shoulders" },
		"Rear delts",
	],
	[
		"reverse pec deck → Rear delts",
		{ name: "Reverse Pec Deck Fly", category: "Shoulders" },
		"Rear delts",
	],
	[
		"overhead press → Front delts",
		{ name: "Overhead Press", category: "Shoulders" },
		"Front delts",
	],
	[
		"bench → Chest",
		{ name: "Barbell Bench Press", category: "Chest", target: "pectorals" },
		"Chest",
	],
	[
		"curl → Arms",
		{ name: "Barbell Curl", category: "Arms", target: "biceps" },
		"Arms",
	],
	[
		"squat → Legs",
		{ name: "Barbell Back Squat", category: "Legs", target: "quads" },
		"Legs",
	],
	["plank → Core", { name: "Plank", category: "Core", target: "abs" }, "Core"],
	[
		"treadmill → none",
		{
			name: "Treadmill Running",
			category: "Cardio",
			target: "cardiovascular system",
		},
		null,
	],
];
for (const [label, ex, want] of cases) {
	assert.equal(groupOf(ex), want, label);
}

const workouts = {
	"2026-11-02": {
		date: "2026-11-02",
		exercises: [
			{
				id: "a",
				exerciseId: "lat",
				exerciseName: "Lat Pulldown",
				category: "Back" as const,
				sets: [
					{ completed: true, setType: "normal" },
					{ completed: true, setType: "warmup" },
					{ completed: false, setType: "normal" },
					{ completed: true, setType: "normal" },
				],
			},
			{
				id: "b",
				exerciseId: "gone",
				exerciseName: "Dumbbell Lateral Raise",
				category: "Shoulders" as const,
				sets: [{ completed: true, setType: "normal" }],
			},
		],
	},
	"2026-10-01": {
		date: "2026-10-01",
		exercises: [
			{
				id: "c",
				exerciseId: "lat",
				exerciseName: "Lat Pulldown",
				category: "Back" as const,
				sets: [{ completed: true, setType: "normal" }],
			},
		],
	},
};
const counts = setsPerGroup(
	workouts as never,
	{ get: () => undefined },
	"2026-10-27",
	(s) => s.setType !== "warmup",
);
assert.equal(
	counts.get("Lats"),
	2,
	"warm-up, unfinished and old sets are not counted",
);
assert.equal(
	counts.get("Side delts"),
	1,
	"falls back to the logged name when the exercise is gone",
);

const lats = VGROUPS.find((g) => g.group === "Lats");
assert.ok(lats);
assert.equal(statusOf(lats, 5), "low");
assert.equal(statusOf(lats, 15), "good");
assert.equal(statusOf(lats, 25), "high");

const gaps = biggestGaps(counts, 2);
assert.equal(gaps[0]?.info.group, "Side delts"); // 1 of 12 sets: 11 short, the biggest gap
assert.ok(gaps.every((g) => g.missing > 0));
assert.ok(
	!gaps.some((g) => g.info.group === "Front delts"),
	"front delts has no minimum",
);
console.log(
	"ok  vmuscle (",
	cases.length,
	"mapping cases + counting + status + gaps )",
);
