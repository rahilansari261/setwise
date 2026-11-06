import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

import type { Exercise, Routine, WorkoutDay } from "@/src/types";

// All user data lives in this one on-device file. Nothing here is synced to a server.
const DB_NAME = "setwise.db";
const SCHEMA_VERSION = 2;

let db: SQLiteDatabase | null = null;

function getDb(): SQLiteDatabase {
	if (!db) db = openDatabaseSync(DB_NAME);
	return db;
}

/** Synchronous read of the saved theme so colours can be chosen before the first render. */
export function readThemePref(): "dark" | "light" | "system" {
	try {
		const row = getDb().getFirstSync<{ value: string }>(
			"SELECT value FROM kv WHERE key = 'settings'",
		);
		const theme = row
			? (JSON.parse(row.value) as { theme?: string }).theme
			: null;
		return theme === "light" || theme === "system" ? theme : "dark";
	} catch {
		return "dark";
	}
}

// ---- change tracking for cloud sync -------------------------------------------------

/** Device-only keys that never leave the phone. */
const LOCAL_ONLY_KV = new Set([
	"sync_state",
	"dev_pro",
	"auth_guest",
	"photos",
	"programs_seeded",
]);

let silent = false;
const dirtyListeners = new Set<() => void>();

/** Called whenever a syncable record changes locally. Returns an unsubscribe function. */
export function onDirty(listener: () => void): () => void {
	dirtyListeners.add(listener);
	return () => dirtyListeners.delete(listener);
}

async function markDirty(key: string, ts = Date.now()): Promise<void> {
	if (silent) return;
	await getDb().runAsync(
		"INSERT INTO sync_dirty (key, ts) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET ts = excluded.ts",
		key,
		ts,
	);
	for (const l of dirtyListeners) l();
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
	if (version < 2) {
		// Which records changed on this phone since they were last uploaded (see src/lib/sync.ts).
		await database.execAsync(`
			CREATE TABLE IF NOT EXISTS sync_dirty (
				key TEXT PRIMARY KEY NOT NULL,
				ts INTEGER NOT NULL
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
	if (!LOCAL_ONLY_KV.has(key)) await markDirty(`kv:${key}`);
}

export async function deleteKV(key: string): Promise<void> {
	await getDb().runAsync("DELETE FROM kv WHERE key = ?", key);
	if (!LOCAL_ONLY_KV.has(key)) await markDirty(`kv:${key}`);
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
		await markDirty(`day:${day.date}`);
		return;
	}
	await getDb().runAsync(
		"INSERT INTO workout_days (date, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
		day.date,
		JSON.stringify(day),
		Date.now(),
	);
	await markDirty(`day:${day.date}`);
}

export async function replaceAllWorkoutDays(
	days: Record<string, WorkoutDay>,
): Promise<void> {
	const database = getDb();
	const before = await database.getAllAsync<{ date: string }>(
		"SELECT date FROM workout_days",
	);
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
	const dates = new Set([...before.map((r) => r.date), ...Object.keys(days)]);
	for (const date of dates) await markDirty(`day:${date}`);
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
	await markDirty("custom_exercises");
}

export async function deleteCustomExercise(id: string): Promise<void> {
	await getDb().runAsync("DELETE FROM custom_exercises WHERE id = ?", id);
	await markDirty("custom_exercises");
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
	await markDirty("routines");
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
	await markDirty("custom_exercises");
}

/** Removes every row the app has written. Used by "Delete account" and "Erase all data". */
export async function wipeAll(): Promise<void> {
	await getDb().execAsync(`
		DELETE FROM kv;
		DELETE FROM workout_days;
		DELETE FROM custom_exercises;
		DELETE FROM routines;
		DELETE FROM sync_dirty;
	`);
}

// ---- cloud sync access ---------------------------------------------------------------

/** Runs writes that should not be uploaded (seeding defaults, applying a download). */
export async function silentWrite<T>(task: () => Promise<T>): Promise<T> {
	const before = silent;
	silent = true;
	try {
		return await task();
	} finally {
		silent = before;
	}
}

export async function listDirty(): Promise<{ key: string; ts: number }[]> {
	await migrate();
	return getDb().getAllAsync<{ key: string; ts: number }>(
		"SELECT key, ts FROM sync_dirty",
	);
}

/** Clears a dirty flag only if the record hasn't changed again since `ts`. */
export async function clearDirty(key: string, ts: number): Promise<void> {
	await getDb().runAsync(
		"DELETE FROM sync_dirty WHERE key = ? AND ts <= ?",
		key,
		ts,
	);
}

/** Flags every record as changed, `ts` old so that a newer remote copy wins a conflict. */
export async function markAllDirty(ts = 0): Promise<void> {
	await migrate();
	const database = getDb();
	const keys: string[] = [];
	for (const r of await database.getAllAsync<{ date: string }>(
		"SELECT date FROM workout_days",
	))
		keys.push(`day:${r.date}`);
	keys.push("routines", "custom_exercises");
	for (const r of await database.getAllAsync<{ key: string }>(
		"SELECT key FROM kv",
	))
		if (!LOCAL_ONLY_KV.has(r.key)) keys.push(`kv:${r.key}`);
	await silentWrite(async () => {
		for (const key of keys)
			await database.runAsync(
				"INSERT INTO sync_dirty (key, ts) VALUES (?, ?) ON CONFLICT(key) DO NOTHING",
				key,
				ts,
			);
	});
}

export interface SyncRecordData {
	data: unknown;
	deleted: boolean;
}

export async function readRecord(key: string): Promise<SyncRecordData> {
	const database = getDb();
	if (key.startsWith("day:")) {
		const row = await database.getFirstAsync<{ data: string }>(
			"SELECT data FROM workout_days WHERE date = ?",
			key.slice(4),
		);
		return row
			? { data: JSON.parse(row.data), deleted: false }
			: { data: null, deleted: true };
	}
	if (key === "routines") return { data: await loadRoutines(), deleted: false };
	if (key === "custom_exercises")
		return { data: await loadCustomExercises(), deleted: false };
	if (key.startsWith("kv:")) {
		const value = await getKV<unknown>(key.slice(3));
		return value === null
			? { data: null, deleted: true }
			: { data: value, deleted: false };
	}
	return { data: null, deleted: true };
}

/** Writes a downloaded record into the local database without flagging it for upload. */
export async function applyRecord(
	key: string,
	data: unknown,
	deleted: boolean,
): Promise<void> {
	await migrate();
	await silentWrite(async () => {
		const database = getDb();
		if (key.startsWith("day:")) {
			const date = key.slice(4);
			if (deleted || !data) {
				await database.runAsync(
					"DELETE FROM workout_days WHERE date = ?",
					date,
				);
			} else {
				await database.runAsync(
					"INSERT INTO workout_days (date, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
					date,
					JSON.stringify(data),
					Date.now(),
				);
			}
		} else if (key === "routines") {
			await saveRoutines((data as Routine[]) ?? []);
		} else if (key === "custom_exercises") {
			await replaceCustomExercises((data as Exercise[]) ?? []);
		} else if (key.startsWith("kv:")) {
			const k = key.slice(3);
			if (deleted || data === null || data === undefined) await deleteKV(k);
			else if (k === "settings") {
				// Theme, language and the biometric lock belong to this phone, not the account.
				const local = (await getKV<Record<string, unknown>>("settings")) ?? {};
				const merged = { ...(data as Record<string, unknown>) };
				for (const own of ["theme", "language", "biometricLock"])
					if (own in local) merged[own] = local[own];
					else delete merged[own];
				await setKV(k, merged);
			} else await setKV(k, data);
		}
	});
}
