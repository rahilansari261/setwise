import * as LocalAuthentication from "expo-local-authentication";
import { Fingerprint } from "lucide-react-native";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { AppState, StyleSheet, View } from "react-native";

import { Button, T } from "@/src/components/ui";
import { usePremium } from "@/src/state/premium";
import { useWorkouts } from "@/src/state/workout-store";
import { colors } from "@/src/theme";

/** Re-lock after the app has been in the background this long. */
const RELOCK_MS = 15_000;

/** Covers the app with a biometric prompt when the lock is on (Pro). */
export function AppLock({ children }: { children: ReactNode }) {
	const { settings, ready } = useWorkouts();
	const { isPro } = usePremium();
	const enabled = settings.biometricLock && isPro;
	const [locked, setLocked] = useState(true);
	const leftAt = useRef<number | null>(null);
	const trying = useRef(false);

	const unlock = useCallback(async () => {
		if (trying.current) return;
		trying.current = true;
		try {
			const res = await LocalAuthentication.authenticateAsync({
				promptMessage: "Unlock Adonis",
				fallbackLabel: "Use passcode",
			});
			if (res.success) setLocked(false);
		} finally {
			trying.current = false;
		}
	}, []);

	useEffect(() => {
		if (!ready) return;
		if (!enabled) {
			setLocked(false);
			return;
		}
		setLocked(true);
		unlock();
	}, [enabled, ready, unlock]);

	useEffect(() => {
		if (!enabled) return;
		const sub = AppState.addEventListener("change", (state) => {
			if (state === "background") leftAt.current = Date.now();
			if (state === "active" && leftAt.current) {
				const away = Date.now() - leftAt.current;
				leftAt.current = null;
				if (away > RELOCK_MS) {
					setLocked(true);
					unlock();
				}
			}
		});
		return () => sub.remove();
	}, [enabled, unlock]);

	return (
		<>
			{children}
			{enabled && locked ? (
				<View style={styles.cover}>
					<Fingerprint size={48} color={colors.accent} />
					<T variant="title" style={{ marginTop: 16 }}>
						Adonis is locked
					</T>
					<Button
						title="Unlock"
						style={{ marginTop: 24, minWidth: 180 }}
						onPress={unlock}
					/>
				</View>
			) : null}
		</>
	);
}

const styles = StyleSheet.create({
	cover: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: colors.bg,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 1000,
		elevation: 1000,
	},
});
