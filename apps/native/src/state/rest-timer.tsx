import * as Haptics from "expo-haptics";
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

import { cancelRestDone, scheduleRestDone } from "@/src/lib/notifications";
import { useWorkouts } from "@/src/state/workout-store";

interface TimerState {
	/** Epoch ms when rest ends; null when paused or idle. */
	endsAt: number | null;
	/** Seconds left while paused. */
	pausedRemaining: number | null;
	total: number;
	label?: string;
}

const IDLE: TimerState = { endsAt: null, pausedRemaining: null, total: 0 };

function useRestTimerValue() {
	const { settings } = useWorkouts();
	const [state, setState] = useState<TimerState>(IDLE);
	const [now, setNow] = useState(Date.now());
	const firedFor = useRef<number | null>(null);

	const running = state.endsAt !== null;
	const active = running || state.pausedRemaining !== null;
	const remaining = running
		? Math.max(0, Math.ceil(((state.endsAt ?? 0) - now) / 1000))
		: (state.pausedRemaining ?? 0);

	useEffect(() => {
		if (!running) return;
		const id = setInterval(() => setNow(Date.now()), 250);
		return () => clearInterval(id);
	}, [running]);

	useEffect(() => {
		if (!running || remaining > 0 || firedFor.current === state.endsAt) return;
		firedFor.current = state.endsAt;
		if (settings.vibrationEnabled) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
				() => {},
			);
		}
		setState(IDLE);
	}, [running, remaining, state.endsAt, settings.vibrationEnabled]);

	const notify = useCallback(
		(seconds: number, label?: string) => {
			if (settings.restNotification)
				scheduleRestDone(seconds, label).catch(() => {});
		},
		[settings.restNotification],
	);

	const start = useCallback(
		(seconds?: number, label?: string) => {
			const total = seconds ?? settings.defaultRestSeconds;
			setNow(Date.now());
			setState({
				endsAt: Date.now() + total * 1000,
				pausedRemaining: null,
				total,
				label,
			});
			notify(total, label);
		},
		[settings.defaultRestSeconds, notify],
	);

	const stop = useCallback(() => {
		setState(IDLE);
		cancelRestDone().catch(() => {});
	}, []);

	const pause = useCallback(() => {
		setState((s) =>
			s.endsAt
				? {
						...s,
						endsAt: null,
						pausedRemaining: Math.max(
							0,
							Math.ceil((s.endsAt - Date.now()) / 1000),
						),
					}
				: s,
		);
		cancelRestDone().catch(() => {});
	}, []);

	const resume = useCallback(() => {
		setState((s) => {
			if (s.pausedRemaining === null) return s;
			notify(s.pausedRemaining, s.label);
			return {
				...s,
				endsAt: Date.now() + s.pausedRemaining * 1000,
				pausedRemaining: null,
			};
		});
		setNow(Date.now());
	}, [notify]);

	const addSeconds = useCallback(
		(delta: number) => {
			setState((s) => {
				if (s.endsAt) {
					const endsAt = Math.max(Date.now(), s.endsAt + delta * 1000);
					const left = (endsAt - Date.now()) / 1000;
					notify(left, s.label);
					return { ...s, endsAt, total: Math.max(s.total, Math.ceil(left)) };
				}
				if (s.pausedRemaining !== null) {
					const left = Math.max(0, s.pausedRemaining + delta);
					return {
						...s,
						pausedRemaining: left,
						total: Math.max(s.total, left),
					};
				}
				return s;
			});
		},
		[notify],
	);

	// Actions stay stable while the countdown ticks, so screens that only start the timer
	// (every exercise card) don't re-render four times a second during rest.
	const actions = useMemo(
		() => ({ start, stop, pause, resume, addSeconds }),
		[start, stop, pause, resume, addSeconds],
	);
	const status = useMemo(
		() => ({
			active,
			running,
			remaining,
			total: state.total,
			label: state.label,
			progress: state.total > 0 ? 1 - remaining / state.total : 0,
		}),
		[active, running, remaining, state.total, state.label],
	);
	return { actions, status };
}

type RestTimerParts = ReturnType<typeof useRestTimerValue>;
type RestTimerActions = RestTimerParts["actions"];
type RestTimer = RestTimerActions & RestTimerParts["status"];

const ActionsContext = createContext<RestTimerActions | null>(null);
const StatusContext = createContext<RestTimerParts["status"] | null>(null);

export function RestTimerProvider({ children }: { children: ReactNode }) {
	const { actions, status } = useRestTimerValue();
	return (
		<ActionsContext.Provider value={actions}>
			<StatusContext.Provider value={status}>{children}</StatusContext.Provider>
		</ActionsContext.Provider>
	);
}

/** Start/stop controls only — doesn't re-render on every tick. */
export function useRestTimerActions(): RestTimerActions {
	const ctx = useContext(ActionsContext);
	if (!ctx)
		throw new Error(
			"useRestTimerActions must be used inside RestTimerProvider",
		);
	return ctx;
}

/** Controls plus the live countdown. Re-renders on every tick while a timer runs. */
export function useRestTimer(): RestTimer {
	const actions = useRestTimerActions();
	const status = useContext(StatusContext);
	if (!status)
		throw new Error("useRestTimer must be used inside RestTimerProvider");
	return useMemo(() => ({ ...actions, ...status }), [actions, status]);
}
