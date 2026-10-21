// Builds src/data/exercise-library.json (list data) and exercise-instructions.json (lazy-loaded text)
// from https://github.com/hasaneyldrm/exercises-dataset (data/exercises.json, MIT-licensed text and metadata).
// The dataset's images and GIFs are © Gym visual and are deliberately NOT used here — see
// src/data/NOTICE-exercise-data.md.
//
//   curl -L https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json -o /tmp/exercises.json
//   node scripts/build-exercise-data.mjs /tmp/exercises.json
import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
if (!src)
	throw new Error(
		"Usage: node scripts/build-exercise-data.mjs <exercises.json>",
	);
const rows = JSON.parse(readFileSync(src, "utf8"));

const CATEGORY = {
	chest: "Chest",
	back: "Back",
	"upper legs": "Legs",
	"lower legs": "Legs",
	shoulders: "Shoulders",
	"upper arms": "Arms",
	"lower arms": "Arms",
	waist: "Core",
	cardio: "Cardio",
	neck: "Other",
};

const EQUIPMENT = {
	"body weight": "Bodyweight",
	dumbbell: "Dumbbell",
	cable: "Cable",
	barbell: "Barbell",
	"ez barbell": "Barbell",
	"olympic barbell": "Barbell",
	"trap bar": "Barbell",
	"leverage machine": "Machine",
	"smith machine": "Machine",
	"sled machine": "Machine",
	"skierg machine": "Machine",
	"upper body ergometer": "Machine",
	"stationary bike": "Machine",
	"elliptical machine": "Machine",
	"stepmill machine": "Machine",
	band: "Band",
	"resistance band": "Band",
	kettlebell: "Kettlebell",
};

const titleCase = (s) =>
	s.replace(/\b([a-z])([a-z']*)/g, (_, a, b) => a.toUpperCase() + b);

const isHold = (name) =>
	/\b(plank|hold|wall sit|hang|isometric|bridge)\b/i.test(name) &&
	!/curl|raise|row|press/i.test(name);

const list = [];
const text = {};
for (const r of rows) {
	const category = CATEGORY[r.category] ?? "Other";
	const equipment = EQUIPMENT[r.equipment] ?? "Other";
	const metric =
		category === "Cardio"
			? "distance_time"
			: isHold(r.name)
				? "time_only"
				: equipment === "Bodyweight"
					? "reps_only"
					: "weight_reps";
	list.push([
		r.id,
		titleCase(r.name),
		category,
		equipment,
		metric,
		r.target ?? "",
		(r.secondary_muscles ?? []).join(", "),
		// File name of the (separately licensed) GIF, used only if you host the media yourself.
		(r.gif_url ?? "").split("/").pop() ?? "",
	]);
	const en = r.instructions?.en;
	const hi = r.instructions?.hi;
	if (en || hi) text[r.id] = [en ?? "", hi ?? ""];
}

writeFileSync("src/data/exercise-library.json", JSON.stringify(list));
writeFileSync("src/data/exercise-instructions.json", JSON.stringify(text));
console.log(
	`${list.length} exercises, ${Object.keys(text).length} with instructions`,
);
