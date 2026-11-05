import type { ConfigContext, ExpoConfig } from "expo/config";

const BG = "#0B0D10";
const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// The Google Sign-In plugin only wires up the iOS URL scheme, and it needs the
// iOS client ID to do that. Android works without it, so skip it until iOS is set up.
const googleSignInPlugin: NonNullable<ExpoConfig["plugins"]> = iosGoogleClientId
	? [
			[
				"@react-native-google-signin/google-signin",
				{
					iosUrlScheme: `com.googleusercontent.apps.${iosGoogleClientId.replace(".apps.googleusercontent.com", "")}`,
				},
			],
		]
	: [];

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: "Setwise",
	slug: "setwise",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/images/icon.png",
	scheme: "setwise",
	userInterfaceStyle: "dark",
	backgroundColor: BG,
	ios: {
		supportsTablet: false,
		bundleIdentifier: "com.setwise.app",
		usesAppleSignIn: true,
	},
	android: {
		package: "com.setwise.app",
		adaptiveIcon: {
			backgroundColor: BG,
			foregroundImage: "./assets/images/android-icon-foreground.png",
			monochromeImage: "./assets/images/android-icon-monochrome.png",
		},
		softwareKeyboardLayoutMode: "resize",
		predictiveBackGestureEnabled: false,
		permissions: [
			"android.permission.VIBRATE",
			"android.permission.POST_NOTIFICATIONS",
		],
	},
	plugins: [
		"expo-router",
		"expo-sqlite",
		"expo-sharing",
		"expo-apple-authentication",
		// Light buttons on a dark bar, so the system nav bar doesn't glare under the dark UI.
		["expo-navigation-bar", { style: "light", enforceContrast: false }],
		[
			"expo-notifications",
			{
				icon: "./assets/images/notification-icon.png",
				color: "#C6FF3D",
			},
		],
		[
			"expo-splash-screen",
			{
				image: "./assets/images/splash-icon.png",
				imageWidth: 120,
				resizeMode: "contain",
				backgroundColor: BG,
			},
		],
		[
			"expo-build-properties",
			{
				android: {
					// Physical test device is arm64; building one ABI keeps local builds ~4x lighter.
					buildArchs: ["arm64-v8a"],
				},
			},
		],
		"./plugins/with-android-build-limits",
		...googleSignInPlugin,
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
});
