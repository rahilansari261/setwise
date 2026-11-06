import { DEFAULT_EXERCISES } from "@/src/data/exercises";
import { ENV } from "@/src/env";
import type { Category, Equipment, Exercise, MetricType } from "@/src/types";
import rows from "./exercise-library.json";

// [id, name, category, equipment, metric, target, secondary, gifFile]
type Row = [
	string,
	string,
	Category,
	Equipment,
	MetricType,
	string,
	string,
	string,
];

const normalize = (name: string) =>
	name.toLowerCase().replace(/[^a-z0-9]/g, "");

const defaultsByName = new Map(
	DEFAULT_EXERCISES.map((e) => [normalize(e.name), e.id]),
);

/** Library exercises that don't duplicate one of the hand-written defaults. */
export const LIBRARY_EXERCISES: Exercise[] = [];
/** Our exercise id → library id, for defaults that also exist in the library. */
const libraryIdByExerciseId = new Map<string, string>();
const gifByLibraryId = new Map<string, string>();
const infoByLibraryId = new Map<
	string,
	{ target: string; secondary: string }
>();

for (const [
	id,
	name,
	category,
	equipment,
	metricType,
	target,
	secondary,
	gif,
] of rows as Row[]) {
	if (gif) gifByLibraryId.set(id, gif);
	infoByLibraryId.set(id, { target, secondary });
	const existing = defaultsByName.get(normalize(name));
	if (existing) {
		libraryIdByExerciseId.set(existing, id);
		continue;
	}
	LIBRARY_EXERCISES.push({
		id: `lib-${id}`,
		name,
		category,
		equipment,
		metricType,
		libraryId: id,
		target,
		secondary,
	});
}

/**
 * Hand-written defaults whose names differ from the library's, matched by hand so they get
 * how-to steps and target muscles too ("Lat Pulldown" is the library's "Cable Pulldown").
 */
const ALIASES: Record<string, string> = {
	"incline-barbell-bench-press": "0047",
	"flat-dumbbell-bench-press": "0289",
	"incline-dumbbell-bench-press": "0314",
	"decline-barbell-bench-press": "0033",
	"chest-dips": "0251",
	"cable-crossover": "0155",
	"dumbbell-flyes": "0308",
	"pec-deck-machine": "0596",
	"conventional-deadlift": "0032",
	"lat-pulldown": "0198",
	"seated-cable-row": "0861",
	"t-bar-row": "0606",
	"single-arm-dumbbell-row": "0292",
	"romanian-deadlift": "0085",
	"back-hyperextensions": "0489",
	"barbell-back-squat": "0043",
	"leg-press": "0739",
	"bulgarian-split-squat": "0410",
	"leg-extension": "0585",
	"lying-leg-curl": "0586",
	"seated-leg-curl": "0599",
	"standing-calf-raise": "1372",
	"seated-calf-raise": "0594",
	"walking-lunges": "1460",
	"hack-squat": "0743",
	"hip-thrust": "3562",
	"overhead-press": "1456",
	"dumbbell-shoulder-press": "0405",
	"face-pull": "0233",
	"arnold-press": "2137",
	"reverse-pec-deck-fly": "0602",
	"barbell-bicep-curl": "0031",
	"incline-dumbbell-curl": "0318",
	"preacher-curl": "0070",
	"cable-rope-triceps-pushdown": "0200",
	"skull-crusher": "0060",
	"close-grip-bench-press": "0030",
	"concentration-curl": "0297",
	"overhead-triceps-extension": "0430",
	plank: "2135",
	"ab-wheel-rollout": "0857",
	"treadmill-running": "0685",
	"stationary-bike": "2138",
	"stair-climber": "2311",
};

/** Library id for any exercise (custom exercises have none). */
export function libraryIdOf(exercise: Pick<Exercise, "id" | "libraryId">) {
	return (
		exercise.libraryId ??
		libraryIdByExerciseId.get(exercise.id) ??
		ALIASES[exercise.id]
	);
}

export function libraryInfo(libraryId: string) {
	return infoByLibraryId.get(libraryId);
}

export const MEDIA_CREDIT = "© Gym visual — https://gymvisual.com/";

/** GIF URL, only when the app has been pointed at media the owner is licensed to use. */
export function exerciseGifUrl(libraryId: string): string | null {
	const base = ENV.EXPO_PUBLIC_EXERCISE_MEDIA_BASE_URL;
	const file = gifByLibraryId.get(libraryId);
	return base && file ? `${base.replace(/\/$/, "")}/${file}` : null;
}

/** Step-by-step text in English and Hindi. The 2 MB file is only parsed the first time it's needed. */
export function exerciseInstructions(
	libraryId: string,
): { en: string; hi: string } | null {
	const all = require("./exercise-instructions.json") as Record<
		string,
		[string, string]
	>;
	const hit = all[libraryId];
	return hit ? { en: hit[0], hi: hit[1] } : null;
}
