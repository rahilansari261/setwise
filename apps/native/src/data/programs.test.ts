// Run with: npx tsx src/data/programs.test.ts
// Every exercise id used by the V-taper picks and the built-in programs must exist in the app.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DEFAULT_EXERCISES } from "./exercises";
import { DEFAULT_ROUTINES, SPLITS } from "./routines";
import { VTAPER_PICKS } from "./vtaper-picks";

const normalize = (name: string) =>
	name.toLowerCase().replace(/[^a-z0-9]/g, "");
const rows = JSON.parse(
	readFileSync(join(__dirname, "exercise-library.json"), "utf8"),
) as [string, string][];
const defaultNames = new Set(DEFAULT_EXERCISES.map((e) => normalize(e.name)));
// Mirrors exercise-library.ts: library rows that duplicate a default are dropped.
const known = new Set([
	...DEFAULT_EXERCISES.map((e) => e.id),
	...rows
		.filter(([, name]) => !defaultNames.has(normalize(name)))
		.map(([id]) => `lib-${id}`),
]);

const picks = Object.values(VTAPER_PICKS).flat();
for (const id of picks) assert.ok(known.has(id), `pick ${id} exists`);
assert.equal(new Set(picks).size, picks.length, "no pick appears twice");
assert.ok(
	picks.length >= 50 && picks.length <= 80,
	`picks stay a short list (${picks.length})`,
);

for (const r of DEFAULT_ROUTINES)
	for (const d of r.days)
		for (const id of d.exerciseIds)
			assert.ok(known.has(id), `${r.name} / ${d.name}: ${id} exists`);

const routineIds = new Set(DEFAULT_ROUTINES.map((r) => r.id));
for (const s of SPLITS)
	if (s.routineId)
		assert.ok(routineIds.has(s.routineId), `split ${s.id} → ${s.routineId}`);

console.log(
	`ok  programs (${picks.length} picks, ${DEFAULT_ROUTINES.length} programs)`,
);
