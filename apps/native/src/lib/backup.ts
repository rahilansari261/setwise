import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { distanceUnit } from "@/src/lib/calc";
import { todayISO } from "@/src/lib/dates";
import type { BackupFile } from "@/src/state/workout-store";
import type {
	Exercise,
	Routine,
	RoutineBundle,
	Unit,
	WorkoutDay,
} from "@/src/types";

async function shareText(filename: string, content: string, mimeType: string) {
	const file = new File(Paths.cache, filename);
	if (file.exists) file.delete();
	file.create();
	file.write(content);
	if (!(await Sharing.isAvailableAsync()))
		throw new Error("Sharing isn't available on this device.");
	await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
}

export async function shareBackup(backup: BackupFile) {
	await shareText(
		`setwise-backup-${todayISO()}.json`,
		JSON.stringify(backup, null, 2),
		"application/json",
	);
}

export async function shareRoutine(
	routine: Routine,
	customExercises: Exercise[],
) {
	const used = new Set(routine.days.flatMap((d) => d.exerciseIds));
	const bundle: RoutineBundle = {
		app: "setwise-routine",
		version: 1,
		routine: { ...routine, folderId: undefined },
		exercises: customExercises.filter((e) => used.has(e.id)),
	};
	const safe =
		routine.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "routine";
	await shareText(
		`setwise-routine-${safe}.json`,
		JSON.stringify(bundle, null, 2),
		"application/json",
	);
}

/** Parses a routine file, throwing a readable error if it isn't one. */
export function parseRoutineBundle(text: string): RoutineBundle {
	let data: Partial<RoutineBundle>;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error("That file isn't an Adonis routine.");
	}
	if (data.app !== "setwise-routine" || !data.routine?.days?.length)
		throw new Error("That file isn't an Adonis routine.");
	return {
		app: "setwise-routine",
		version: 1,
		routine: data.routine,
		exercises: data.exercises ?? [],
	};
}

const csvCell = (v: string | number) => {
	const s = String(v);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** FitNotes-compatible columns so the file opens in spreadsheets and other trackers. */
export async function shareCSV(
	workouts: Record<string, WorkoutDay>,
	unit: Unit,
) {
	const rows = [
		[
			"Date",
			"Exercise",
			"Category",
			`Weight (${unit})`,
			"Reps",
			`Distance (${distanceUnit(unit)})`,
			"Time (s)",
			"Comment",
			"Set type",
			"RPE",
		],
	];
	for (const date of Object.keys(workouts).sort()) {
		for (const we of workouts[date]?.exercises ?? []) {
			for (const s of we.sets) {
				if (!s.completed) continue;
				rows.push([
					date,
					we.exerciseName,
					we.category,
					String(s.weight || 0),
					String(s.reps || 0),
					String(s.distance ?? ""),
					String(s.timeSeconds ?? ""),
					s.comment ?? "",
					s.setType,
					String(s.rpe ?? ""),
				]);
			}
		}
	}
	await shareText(
		`setwise-${todayISO()}.csv`,
		rows.map((r) => r.map(csvCell).join(",")).join("\n"),
		"text/csv",
	);
}

/** Returns the picked file's text, or null if the user cancelled. */
export async function pickBackupText(): Promise<string | null> {
	const result = await DocumentPicker.getDocumentAsync({
		type: ["application/json", "text/plain", "*/*"],
		copyToCacheDirectory: true,
	});
	if (result.canceled || !result.assets[0]) return null;
	return new File(result.assets[0].uri).text();
}
