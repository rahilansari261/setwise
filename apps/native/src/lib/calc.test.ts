import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	convertDistance,
	distanceUnit,
	fmtSetTime,
	parseSetTime,
} from "./calc.ts";

describe("fmtSetTime", () => {
	it("formats minutes and seconds", () => {
		assert.equal(fmtSetTime(0), "0:00");
		assert.equal(fmtSetTime(65), "1:05");
		assert.equal(fmtSetTime(600), "10:00");
	});

	it("adds hours from 60 minutes up", () => {
		assert.equal(fmtSetTime(3723), "1:02:03");
	});

	it("clamps negative and fractional values", () => {
		assert.equal(fmtSetTime(-5), "0:00");
		assert.equal(fmtSetTime(90.9), "1:30");
	});
});

describe("parseSetTime", () => {
	it("parses bare seconds, m:ss and h:mm:ss", () => {
		assert.equal(parseSetTime("90"), 90);
		assert.equal(parseSetTime("1:30"), 90);
		assert.equal(parseSetTime("1:02:03"), 3723);
	});

	it("treats empty input as zero", () => {
		assert.equal(parseSetTime("  "), 0);
	});

	it("rejects text that isn't a time yet", () => {
		assert.equal(parseSetTime("1:"), null);
		assert.equal(parseSetTime("abc"), null);
		assert.equal(parseSetTime("1::30"), null);
		assert.equal(parseSetTime("1:2:3:4"), null);
		assert.equal(parseSetTime("-1"), null);
	});

	it("round-trips with fmtSetTime", () => {
		for (const seconds of [0, 45, 61, 1800, 3661]) {
			assert.equal(parseSetTime(fmtSetTime(seconds)), seconds);
		}
	});
});

describe("distance", () => {
	it("follows the weight unit", () => {
		assert.equal(distanceUnit("kg"), "km");
		assert.equal(distanceUnit("lbs"), "mi");
	});

	it("converts between kilometres and miles", () => {
		assert.equal(convertDistance(1, "lbs", "kg"), 1.61);
		assert.equal(convertDistance(5, "kg", "lbs"), 3.11);
		assert.equal(convertDistance(3, "kg", "kg"), 3);
		assert.equal(convertDistance(0, "lbs", "kg"), 0);
	});
});
