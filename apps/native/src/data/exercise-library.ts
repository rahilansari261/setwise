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

/** Library id for any exercise (custom exercises have none). */
export function libraryIdOf(exercise: Pick<Exercise, "id" | "libraryId">) {
	return exercise.libraryId ?? libraryIdByExerciseId.get(exercise.id);
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
