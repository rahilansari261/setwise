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
import { DarkTheme, ThemeProvider } from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { setupChannels } from "@/src/lib/notifications";
import { AuthProvider, useAuth } from "@/src/state/auth";
import { RestTimerProvider } from "@/src/state/rest-timer";
import { ToastProvider } from "@/src/state/toast";
import { useWorkouts, WorkoutProvider } from "@/src/state/workout-store";
import { colors } from "@/src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const NAV_THEME = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		background: colors.bg,
		card: colors.bg,
		border: colors.hairline,
		text: colors.text,
		primary: colors.accent,
		notification: colors.streak,
	},
};

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
						<StatusBar style="light" />
						<AuthProvider>
							<WorkoutProvider>
								<RestTimerProvider>
									<ToastProvider>
										<RootNavigator />
									</ToastProvider>
								</RestTimerProvider>
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
