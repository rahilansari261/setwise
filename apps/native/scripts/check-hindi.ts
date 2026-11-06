// Lists UI strings that would still show in English with the language set to हिंदी.
//   npx tsx scripts/check-hindi.ts [files…]     (defaults to every screen and component)
// Exercise, muscle and program names, brand names and units are meant to stay English and are skipped.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { toHindi } from "../src/lib/translate";

const KEEP_ENGLISH = new Set(
	[
		"Adonis",
		"Adonis Pro",
		"PRO",
		"PR",
		"e1RM",
		"RPE",
		"KG",
		"LB",
		"EN",
		"AUTO",
		"हिं",
		"kg",
		"lbs",
		"cm",
		"Google",
		"Apple",
		"Lats",
		"Side delts",
		"Rear delts",
		"Upper back",
		"Chest",
		"Front delts",
		"Arms",
		"Legs",
		"Core",
		"Back",
		"Shoulders",
		"Cardio",
		"Other",
		"1M",
		"3M",
		"6M",
		"ALL",
		"EPLEY",
		"BRZYCKI",
		"Myo-reps",
		"V-taper",
		"Strength",
		"Muscle size",
		"Endurance",
		"+30s",
		"SET",
		"×",
	].map((s) => s.toLowerCase()),
);

function walk(dir: string, out: string[] = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith(".tsx")) out.push(p);
	}
	return out;
}

const root = join(__dirname, "..");
const LIB_WITH_UI_TEXT = [
	"vmuscle",
	"checkin",
	"pro",
	"sets",
	"vtaper",
	"insights",
].map((f) => join(root, `src/lib/${f}.ts`));
const files = process.argv.slice(2).length
	? process.argv.slice(2)
	: [
			...walk(join(root, "app")),
			...walk(join(root, "src/components")),
			...LIB_WITH_UI_TEXT,
		];

const misses = new Map<string, Set<string>>();
const note = (s: string, file: string) => {
	const text = s.replace(/\s+/g, " ").trim();
	if (text.length < 2 || !/[A-Za-z]{2}/.test(text)) return;
	if (
		(/^[\w./:@#()[\]-]+$/.test(text) && text === text.toLowerCase()) ||
		/^\(|^\/\/|biome-ignore/.test(text)
	)
		return; // ids, urls, keys
	if (/[{}=;<>]|=>|\bconst\b|\breturn\b/.test(text)) return; // code that slipped through
	if (KEEP_ENGLISH.has(text.toLowerCase())) return;
	if (toHindi(text) !== text) return;
	if (!misses.has(text)) misses.set(text, new Set());
	misses.get(text)?.add(file.replace(`${root}/`, ""));
};

for (const file of files) {
	const src = readFileSync(file, "utf8");
	// JSX text between tags
	for (const m of src.matchAll(/>\s*([^<>{}]+?)\s*</g)) note(m[1] ?? "", file);
	// string props and object fields that end up on screen
	for (const m of src.matchAll(
		/\b(?:title|label|placeholder|detail|note|name|hint|tip|why|blurb|desc|description|q|a)[=:]\s*"([^"]+)"/g,
	))
		note(m[1] ?? "", file);
	for (const m of src.matchAll(/\b(?:toast|Alert\.alert)\(\s*"([^"]+)"/g))
		note(m[1] ?? "", file);
	// {"..."} children and t("...") calls
	for (const m of src.matchAll(/\{\s*"([^"]{3,})"\s*\}/g))
		note(m[1] ?? "", file);
	// template literals on screen: `${n} sessions` is checked as "7 sessions"
	for (const m of src.matchAll(/`([^`]*\$\{[^`]*)`/g)) {
		const sample = (m[1] ?? "").replace(/\$\{[^}]*\}/g, "7");
		if (/[A-Za-z]{3}/.test(sample.replace(/\b7\b/g, ""))) note(sample, file);
	}
}

const sorted = [...misses.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [text, where] of sorted)
	console.log(`${text}    ← ${[...where].join(", ")}`);
console.log(`\n${sorted.length} strings without Hindi`);
process.exit(0);
