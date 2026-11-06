import {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
	JetBrainsMono_400Regular,
	JetBrainsMono_500Medium,
	JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import {
	SpaceGrotesk_600SemiBold,
	SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { type ReactNode, useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppLock } from "@/src/components/app-lock";
import { resolveLocale, setLocale } from "@/src/lib/i18n";
import { LocaleContext } from "@/src/lib/locale-context";
import { setupChannels } from "@/src/lib/notifications";
import { AuthProvider, useAuth } from "@/src/state/auth";
import { ExtrasProvider } from "@/src/state/extras";
import { PremiumProvider } from "@/src/state/premium";
import { RestTimerProvider } from "@/src/state/rest-timer";
import { SyncProvider } from "@/src/state/sync";
import { ToastProvider } from "@/src/state/toast";
import { useWorkouts, WorkoutProvider } from "@/src/state/workout-store";
import { colors, resolvedTheme } from "@/src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const BASE_THEME = resolvedTheme === "light" ? DefaultTheme : DarkTheme;
const NAV_THEME = {
	...BASE_THEME,
	colors: {
		...BASE_THEME.colors,
		background: colors.bg,
		card: colors.bg,
		border: colors.hairline,
		text: colors.text,
		primary: colors.accent,
		notification: colors.streak,
	},
};

/** Keeps the module-level locale (Alerts, toasts) and the React context in step with Settings. */
function LocaleBridge({ children }: { children: ReactNode }) {
	const { settings } = useWorkouts();
	const locale = resolveLocale(settings.language);
	setLocale(locale);
	return (
		<LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
	);
}

function RootNavigator() {
	const auth = useAuth();
	const { ready, profile } = useWorkouts();
	const loaded = auth.ready && ready;

	useEffect(() => {
		if (loaded) SplashScreen.hideAsync().catch(() => {});
	}, [loaded]);

	if (!loaded) return null;
	const onboarded = Boolean(profile?.onboardedAt);

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: colors.bg },
				animation: "fade",
			}}
		>
			<Stack.Protected guard={!auth.signedIn}>
				<Stack.Screen name="sign-in" />
			</Stack.Protected>
			<Stack.Protected guard={auth.signedIn && !onboarded}>
				<Stack.Screen name="onboarding" />
			</Stack.Protected>
			<Stack.Protected guard={auth.signedIn && onboarded}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen
					name="add-exercise"
					options={{ animation: "slide_from_bottom" }}
				/>
				<Stack.Screen
					name="exercise/[id]"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="routines"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="settings"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="vtaper"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="paywall"
					options={{ animation: "slide_from_bottom" }}
				/>
				<Stack.Screen
					name="measurements"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="photos"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="goals"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="recovery"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="recap"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen
					name="achievements"
					options={{ animation: "slide_from_right" }}
				/>
				<Stack.Screen name="gyms" options={{ animation: "slide_from_right" }} />
				<Stack.Screen name="help" options={{ animation: "slide_from_right" }} />
			</Stack.Protected>
		</Stack>
	);
}

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		SpaceGrotesk_600SemiBold,
		SpaceGrotesk_700Bold,
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		JetBrainsMono_400Regular,
		JetBrainsMono_500Medium,
		JetBrainsMono_700Bold,
	});

	useEffect(() => {
		setupChannels().catch(() => {});
	}, []);

	if (!fontsLoaded) return null;

	return (
		<GestureHandlerRootView style={styles.root}>
			<SafeAreaProvider>
				<KeyboardProvider>
					<ThemeProvider value={NAV_THEME}>
						<StatusBar style={resolvedTheme === "light" ? "dark" : "light"} />
						<AuthProvider>
							<WorkoutProvider>
								<ExtrasProvider>
									<LocaleBridge>
										<PremiumProvider>
											<SyncProvider>
												<RestTimerProvider>
													<ToastProvider>
														<AppLock>
															<RootNavigator />
														</AppLock>
													</ToastProvider>
												</RestTimerProvider>
											</SyncProvider>
										</PremiumProvider>
									</LocaleBridge>
								</ExtrasProvider>
							</WorkoutProvider>
						</AuthProvider>
					</ThemeProvider>
				</KeyboardProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: colors.bg },
});
