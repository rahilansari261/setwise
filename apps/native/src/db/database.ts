import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

import type { Exercise, Routine, WorkoutDay } from "@/src/types";

// All user data lives in this one on-device file. Nothing here is synced to a server.
const DB_NAME = "setwise.db";
const SCHEMA_VERSION = 1;

let db: SQLiteDatabase | null = null;

function getDb(): SQLiteDatabase {
	if (!db) db = openDatabaseSync(DB_NAME);
	return db;
}

let migration: Promise<void> | null = null;

/** Safe to call from anywhere; the schema is only migrated once per launch. */
export function migrate(): Promise<void> {
	migration ??= runMigrations();
	return migration;
}

async function runMigrations(): Promise<void> {
	const database = getDb();
	await database.execAsync("PRAGMA journal_mode = WAL;");
	const row = await database.getFirstAsync<{ user_version: number }>(
		"PRAGMA user_version",
	);
	const version = row?.user_version ?? 0;
	if (version >= SCHEMA_VERSION) return;

	if (version < 1) {
		await database.execAsync(`
			CREATE TABLE IF NOT EXISTS kv (
				key TEXT PRIMARY KEY NOT NULL,
				value TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS workout_days (
				date TEXT PRIMARY KEY NOT NULL,
				data TEXT NOT NULL,
				updated_at INTEGER NOT NULL
			);
			CREATE TABLE IF NOT EXISTS custom_exercises (
				id TEXT PRIMARY KEY NOT NULL,
				data TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS routines (
				id TEXT PRIMARY KEY NOT NULL,
				data TEXT NOT NULL,
				position INTEGER NOT NULL DEFAULT 0
			);
		`);
	}
	await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

// ---- key/value -------------------------------------------------------------

export async function getKV<T>(key: string): Promise<T | null> {
	await migrate();
	const row = await getDb().getFirstAsync<{ value: string }>(
		"SELECT value FROM kv WHERE key = ?",
		key,
	);
	if (!row) return null;
	try {
		return JSON.parse(row.value) as T;
	} catch {
		return null;
	}
}

export async function setKV(key: string, value: unknown): Promise<void> {
	await getDb().runAsync(
		"INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
		key,
		JSON.stringify(value),
	);
}

export async function deleteKV(key: string): Promise<void> {
	await getDb().runAsync("DELETE FROM kv WHERE key = ?", key);
}

// ---- workouts --------------------------------------------------------------

export async function loadWorkoutDays(): Promise<Record<string, WorkoutDay>> {
	const rows = await getDb().getAllAsync<{ date: string; data: string }>(
		"SELECT date, data FROM workout_days",
	);
	const out: Record<string, WorkoutDay> = {};
	for (const row of rows) {
		try {
			out[row.date] = JSON.parse(row.data) as WorkoutDay;
		} catch {
			// A corrupt row should never take the whole history down with it.
		}
	}
	return out;
}

export async function saveWorkoutDay(day: WorkoutDay): Promise<void> {
	if (day.exercises.length === 0 && !day.notes && !day.title) {
		await getDb().runAsync("DELETE FROM workout_days WHERE date = ?", day.date);
		return;
	}
	await getDb().runAsync(
		"INSERT INTO workout_days (date, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
		day.date,
		JSON.stringify(day),
		Date.now(),
	);
}

export async function replaceAllWorkoutDays(
	days: Record<string, WorkoutDay>,
): Promise<void> {
	const database = getDb();
	await database.withTransactionAsync(async () => {
		await database.runAsync("DELETE FROM workout_days");
		for (const day of Object.values(days)) {
			await database.runAsync(
				"INSERT INTO workout_days (date, data, updated_at) VALUES (?, ?, ?)",
				day.date,
				JSON.stringify(day),
				Date.now(),
			);
		}
	});
}

// ---- exercises & routines --------------------------------------------------

export async function loadCustomExercises(): Promise<Exercise[]> {
	const rows = await getDb().getAllAsync<{ data: string }>(
		"SELECT data FROM custom_exercises",
	);
	return rows.map((r) => JSON.parse(r.data) as Exercise);
}

export async function saveCustomExercise(exercise: Exercise): Promise<void> {
	await getDb().runAsync(
		"INSERT INTO custom_exercises (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
		exercise.id,
		JSON.stringify(exercise),
	);
}

export async function deleteCustomExercise(id: string): Promise<void> {
	await getDb().runAsync("DELETE FROM custom_exercises WHERE id = ?", id);
}

export async function loadRoutines(): Promise<Routine[]> {
	const rows = await getDb().getAllAsync<{ data: string }>(
		"SELECT data FROM routines ORDER BY position, rowid",
	);
	return rows.map((r) => JSON.parse(r.data) as Routine);
}

export async function saveRoutines(routines: Routine[]): Promise<void> {
	const database = getDb();
	await database.withTransactionAsync(async () => {
		await database.runAsync("DELETE FROM routines");
		for (const [position, routine] of routines.entries()) {
			await database.runAsync(
				"INSERT INTO routines (id, data, position) VALUES (?, ?, ?)",
				routine.id,
				JSON.stringify(routine),
				position,
			);
		}
	});
}

export async function replaceCustomExercises(
	exercises: Exercise[],
): Promise<void> {
	const database = getDb();
	await database.withTransactionAsync(async () => {
		await database.runAsync("DELETE FROM custom_exercises");
		for (const exercise of exercises) {
			await database.runAsync(
				"INSERT INTO custom_exercises (id, data) VALUES (?, ?)",
				exercise.id,
				JSON.stringify(exercise),
			);
		}
	});
}

/** Removes every row the app has written. Used by "Delete account" and "Erase all data". */
export async function wipeAll(): Promise<void> {
	await getDb().execAsync(`
		DELETE FROM kv;
		DELETE FROM workout_days;
		DELETE FROM custom_exercises;
		DELETE FROM routines;
	`);
}
