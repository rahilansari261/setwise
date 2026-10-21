import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AppState } from "react-native";

import * as db from "@/src/db/database";
import { runSync } from "@/src/lib/sync-engine";
import { supabaseRemote } from "@/src/lib/sync-remote";
import { useAuth } from "@/src/state/auth";
import { useExtras } from "@/src/state/extras";
import { usePremium } from "@/src/state/premium";
import { useWorkouts } from "@/src/state/workout-store";

const STATE_KEY = "sync_state";
const DEBOUNCE_MS = 8000;

interface PersistedState {
	enabled: boolean;
	/** Server time of the newest record already downloaded. */
	cursor: number;
	lastSyncAt?: number;
	userId?: string;
}

interface SyncValue {
	enabled: boolean;
	syncing: boolean;
	lastSyncAt?: number;
	error?: string;
	/** Pro plus a signed-in account: the two things cloud sync needs. */
	available: boolean;
	setEnabled: (on: boolean) => Promise<void>;
	syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncValue | null>(null);

const localAdapter = {
	dirty: db.listDirty,
	read: db.readRecord,
	apply: db.applyRecord,
	clearDirty: db.clearDirty,
};

export function SyncProvider({ children }: { children: ReactNode }) {
	const auth = useAuth();
	const premium = usePremium();
	const workouts = useWorkouts();
	const extras = useExtras();
	const [state, setState] = useState<PersistedState>({
		enabled: false,
		cursor: 0,
	});
	const [loaded, setLoaded] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [error, setError] = useState<string | undefined>();
	const running = useRef(false);
	const stateRef = useRef(state);
	stateRef.current = state;

	const userId = auth.user?.id;
	const available = premium.isPro && Boolean(userId);

	useEffect(() => {
		db.getKV<PersistedState>(STATE_KEY)
			.then((s) => s && setState(s))
			.finally(() => setLoaded(true));
	}, []);

	const persist = useCallback(async (next: PersistedState) => {
		stateRef.current = next;
		setState(next);
		await db.setKV(STATE_KEY, next);
	}, []);

	const syncNow = useCallback(async () => {
		if (running.current || !userId || !premium.isPro) return;
		running.current = true;
		setSyncing(true);
		setError(undefined);
		try {
			let cur = stateRef.current;
			if (cur.userId !== userId) {
				// A different account than last time: treat every local record as older than the server's.
				await db.markAllDirty(0);
				cur = { ...cur, userId, cursor: 0 };
			}
			const result = await runSync(
				localAdapter,
				supabaseRemote(userId),
				cur.cursor,
			);
			await persist({ ...cur, cursor: result.cursor, lastSyncAt: Date.now() });
			if (result.pulled > 0) {
				await workouts.reload();
				await extras.reloadExtras();
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			running.current = false;
			setSyncing(false);
		}
	}, [userId, premium.isPro, persist, workouts, extras]);

	const syncRef = useRef(syncNow);
	syncRef.current = syncNow;

	const enabled = loaded && state.enabled && available;

	// Sync when switched on, when the app comes back to the foreground, and shortly after edits.
	useEffect(() => {
		if (!enabled) return;
		syncRef.current();
		const sub = AppState.addEventListener("change", (s) => {
			if (s === "active") syncRef.current();
		});
		let timer: ReturnType<typeof setTimeout> | undefined;
		const off = db.onDirty(() => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => syncRef.current(), DEBOUNCE_MS);
		});
		return () => {
			sub.remove();
			off();
			if (timer) clearTimeout(timer);
		};
	}, [enabled]);

	const setEnabled = useCallback(
		async (on: boolean) => {
			if (on) await db.markAllDirty(0);
			await persist({ ...stateRef.current, enabled: on });
			setError(undefined);
		},
		[persist],
	);

	const value = useMemo<SyncValue>(
		() => ({
			enabled: state.enabled,
			syncing,
			lastSyncAt: state.lastSyncAt,
			error,
			available,
			setEnabled,
			syncNow,
		}),
		[
			state.enabled,
			state.lastSyncAt,
			syncing,
			error,
			available,
			setEnabled,
			syncNow,
		],
	);

	return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncValue {
	const ctx = useContext(SyncContext);
	if (!ctx) throw new Error("useSync must be used inside SyncProvider");
	return ctx;
}
