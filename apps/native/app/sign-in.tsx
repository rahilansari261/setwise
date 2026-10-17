import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { Button, Screen, T } from "@/src/components/ui";
import { ENV } from "@/src/env";
import { AuthError, secretLoginEnabled, useAuth } from "@/src/state/auth";
import { colors, fonts } from "@/src/theme";

const SECRET_TAPS = 5;
const SECRET_WINDOW_MS = 3000;

function GoogleMark() {
	return (
		<Svg width={18} height={18} viewBox="0 0 48 48" accessibilityElementsHidden>
			<Path
				fill="#FFC107"
				d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
			/>
			<Path
				fill="#FF3D00"
				d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
			/>
			<Path
				fill="#4CAF50"
				d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
			/>
			<Path
				fill="#1976D2"
				d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
			/>
		</Svg>
	);
}

/** The Setwise mark: three stacked plates, the last one in accent. Doubles as the secret button. */
function Logo() {
	return (
		<Svg width={72} height={72} viewBox="0 0 72 72" accessibilityElementsHidden>
			<Rect x={0} y={0} width={72} height={72} rx={20} fill={colors.surface} />
			<Rect x={14} y={20} width={8} height={32} rx={3} fill={colors.textSoft} />
			<Rect x={26} y={16} width={8} height={40} rx={3} fill={colors.textSoft} />
			<Rect x={38} y={12} width={8} height={48} rx={3} fill={colors.accent} />
			<Rect x={50} y={34} width={10} height={4} rx={2} fill={colors.muted} />
		</Svg>
	);
}

export default function SignIn() {
	const { signInWithGoogle, signInWithApple, enterAsGuest, appleAvailable } =
		useAuth();
	const [busy, setBusy] = useState<"google" | "apple" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const taps = useRef<number[]>([]);

	const onLogoPress = () => {
		if (!secretLoginEnabled) return;
		const now = Date.now();
		taps.current = [
			...taps.current.filter((t) => now - t < SECRET_WINDOW_MS),
			now,
		];
		if (taps.current.length >= SECRET_TAPS) {
			taps.current = [];
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
				() => {},
			);
			enterAsGuest();
		} else {
			Haptics.selectionAsync().catch(() => {});
		}
	};

	const run = async (provider: "google" | "apple") => {
		setError(null);
		setBusy(provider);
		try {
			await (provider === "google" ? signInWithGoogle() : signInWithApple());
		} catch (e) {
			setError(
				e instanceof AuthError ? e.message : "Something went wrong. Try again.",
			);
		} finally {
			setBusy(null);
		}
	};

	const site = ENV.EXPO_PUBLIC_SITE_URL ?? "https://setwise.app";

	return (
		<Screen stack scroll={false} contentStyle={styles.container}>
			<View style={{ flex: 1, justifyContent: "center", gap: 28 }}>
				<Pressable
					onPress={onLogoPress}
					accessibilityLabel="Setwise"
					hitSlop={12}
					style={{ alignSelf: "flex-start" }}
				>
					<Logo />
				</Pressable>
				<View style={{ gap: 12 }}>
					<T variant="label">SETWISE · GYM LOG</T>
					<T style={styles.headline}>
						Every set,{"\n"}counted
						<T style={[styles.headline, { color: colors.accent }]}>.</T>
					</T>
					<T style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
						Log lifts in seconds, see your PRs climb. Your workouts stay on this
						phone.
					</T>
				</View>
			</View>

			<View style={{ gap: 12 }}>
				{error ? (
					<View style={styles.error}>
						<T style={{ color: colors.danger, fontSize: 14 }}>{error}</T>
					</View>
				) : null}
				<Pressable
					accessibilityRole="button"
					onPress={() => run("google")}
					disabled={busy !== null}
					style={({ pressed }) => [
						styles.google,
						(pressed || busy === "google") && { opacity: 0.8 },
					]}
				>
					<GoogleMark />
					<T
						style={{
							color: "#1F1F1F",
							fontFamily: fonts.bodySemi,
							fontSize: 16,
						}}
					>
						{busy === "google" ? "Signing in…" : "Continue with Google"}
					</T>
				</Pressable>
				{appleAvailable ? (
					<Button
						title={busy === "apple" ? "Signing in…" : "Continue with Apple"}
						variant="secondary"
						onPress={() => run("apple")}
						disabled={busy !== null}
					/>
				) : null}
				<T variant="small" style={{ textAlign: "center", marginTop: 4 }}>
					By continuing you agree to the{" "}
					<T
						variant="small"
						style={styles.link}
						onPress={() => WebBrowser.openBrowserAsync(`${site}/terms`)}
						accessibilityRole="link"
					>
						Terms
					</T>{" "}
					and{" "}
					<T
						variant="small"
						style={styles.link}
						onPress={() => WebBrowser.openBrowserAsync(`${site}/privacy`)}
						accessibilityRole="link"
					>
						Privacy Policy
					</T>
					.
				</T>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: { paddingHorizontal: 24, paddingBottom: 24 },
	headline: {
		fontFamily: fonts.display,
		fontSize: 40,
		lineHeight: 42,
		letterSpacing: -1,
		color: colors.text,
	},
	google: {
		height: 54,
		borderRadius: 16,
		backgroundColor: "#FFFFFF",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},
	error: { backgroundColor: colors.dangerTint, borderRadius: 12, padding: 12 },
	link: { color: colors.textSoft, textDecorationLine: "underline" },
});
