// Run with: npx tsx src/lib/checkin.test.ts
import assert from "node:assert/strict";

import {
	daysBetweenISO,
	daysUntilCheckIn,
	defaultPair,
	photosOfPose,
	poseOf,
} from "./checkin";

const p = (id: string, date: string, pose?: "front" | "side" | "back") => ({
	id,
	date,
	uri: id,
	pose,
});

assert.equal(daysUntilCheckIn([], "2026-11-06"), null, "no photos yet");
assert.equal(
	daysUntilCheckIn([p("a", "2026-11-06")], "2026-11-06"),
	14,
	"just checked in",
);
assert.equal(
	daysUntilCheckIn([p("a", "2026-10-20"), p("b", "2026-10-30")], "2026-11-06"),
	7,
	"uses the latest",
);
assert.ok(
	(daysUntilCheckIn([p("a", "2026-10-01")], "2026-11-06") ?? 1) <= 0,
	"overdue",
);

assert.equal(poseOf({}), "front", "untagged photos count as front");
const photos = [
	p("c", "2026-11-06", "front"),
	p("a", "2026-09-01"),
	p("b", "2026-10-01", "side"),
	p("d", "2026-10-15", "front"),
];
assert.deepEqual(
	photosOfPose(photos, "front").map((x) => x.id),
	["a", "d", "c"],
);
const pair = defaultPair(photos, "front");
assert.equal(pair?.before.id, "a");
assert.equal(pair?.after.id, "c");
assert.equal(
	defaultPair(photos, "side"),
	null,
	"one photo is not a comparison",
);
assert.equal(
	daysBetweenISO("2026-10-30", "2026-11-06"),
	7,
	"across a month boundary",
);
console.log("ok  checkin");
