import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { WorkoutDay } from "../types.ts";
import {
	focusMuscle,
	focusSets,
	GOLDEN_RATIO,
	goalWaistCm,
	latestWithRatio,
	ratioProgress,
	upsertMeasurement,
	vTaperRatio,
} from "./vtaper.ts";

describe("vTaperRatio", () => {
	it("divides shoulders by waist to two decimals", () => {
		assert.equal(
			vTaperRatio({ date: "2026-01-01", shouldersCm: 120, waistCm: 80 }),
			1.5,
		);
		assert.equal(
			vTaperRatio({ date: "2026-01-01", shouldersCm: 118, waistCm: 81 }),
			1.46,
		);
	});

	it("needs both numbers", () => {
		assert.equal(vTaperRatio({ date: "2026-01-01", shouldersCm: 120 }), null);
		assert.equal(vTaperRatio(undefined), null);
	});
});

describe("ratio goal", () => {
	it("maps 1.2 → 0 and the golden ratio → 1, clamped", () => {
		assert.equal(ratioProgress(1.2), 0);
		assert.equal(ratioProgress(GOLDEN_RATIO), 1);
		assert.equal(ratioProgress(1), 0);
		assert.equal(ratioProgress(2), 1);
	});

	it("finds the waist that hits the golden ratio", () => {
		assert.equal(goalWaistCm(121.4), 75);
	});
});

describe("measurements list", () => {
	it("keeps one entry per date, oldest first", () => {
		const list = upsertMeasurement(
			[
				{ date: "2026-02-01", waistCm: 84 },
				{ date: "2026-01-01", waistCm: 86 },
			],
			{ date: "2026-02-01", waistCm: 83 },
		);
		assert.deepEqual(
			list.map((m) => [m.date, m.waistCm]),
			[
				["2026-01-01", 86],
				["2026-02-01", 83],
			],
		);
	});

	it("skips entries without both numbers for the latest ratio", () => {
		const latest = latestWithRatio([
			{ date: "2026-01-01", shouldersCm: 115, waistCm: 85 },
			{ date: "2026-02-01", armCm: 35 },
		]);
		assert.equal(latest?.date, "2026-01-01");
	});
});

describe("focus muscles", () => {
	it("maps built-in exercises by id", () => {
		assert.equal(focusMuscle("lat-pulldown", "Lat Pulldown"), "lats");
		assert.equal(focusMuscle("face-pull", "Face Pull"), "rear_delts");
		assert.equal(focusMuscle("barbell-back-squat", "Barbell Back Squat"), null);
	});

	it("maps custom exercises by name", () => {
		assert.equal(
			focusMuscle("custom-1", "Lean-Away Lateral Raise"),
			"side_delts",
		);
		assert.equal(
			focusMuscle("custom-2", "Machine Rear Delt Fly"),
			"rear_delts",
		);
		assert.equal(focusMuscle("custom-3", "Kneeling Cable Pulldown"), "lats");
		assert.equal(focusMuscle("custom-4", "Incline Smith Press"), "upper_chest");
		assert.equal(focusMuscle("custom-5", "Hip Thrust Machine"), null);
	});

	it("counts completed working sets inside the date range", () => {
		const set = (
			completed: boolean,
			setType: "normal" | "warmup" = "normal",
		) => ({
			id: Math.random().toString(),
			setNumber: 1,
			weight: 10,
			reps: 10,
			completed,
			setType,
		});
		const day = (date: string): WorkoutDay => ({
			date,
			exercises: [
				{
					id: "a",
					exerciseId: "dumbbell-lateral-raise",
					exerciseName: "Dumbbell Lateral Raise",
					category: "Shoulders",
					sets: [set(true, "warmup"), set(true), set(true), set(false)],
				},
				{
					id: "b",
					exerciseId: "pull-up",
					exerciseName: "Pull-Up",
					category: "Back",
					sets: [set(true), set(true), set(true)],
				},
			],
		});
		const sets = focusSets(
			{
				"2026-03-01": day("2026-03-01"),
				"2026-03-02": day("2026-03-02"),
				"2026-03-09": day("2026-03-09"),
			},
			"2026-03-02",
			"2026-03-09",
		);
		assert.deepEqual(sets, {
			lats: 3,
			side_delts: 2,
			rear_delts: 0,
			upper_chest: 0,
		});
	});
});
