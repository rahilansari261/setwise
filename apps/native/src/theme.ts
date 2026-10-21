import { Appearance } from "react-native";

import { readThemePref } from "@/src/db/database";

// Electric Night — the single source for colors, type and spacing.
const DARK = {
	bg: "#0B0D10",
	surface: "#16191F",
	surfaceRaised: "#1D2128",
	control: "#2A2F38",
	border: "#262A32",
	hairline: "#1D2128",
	line: "#2E333C",
	lineSoft: "#23272F",
	lineStrong: "#3A3F48",
	overlay: "rgba(0,0,0,0.6)",
	text: "#F2F4F7",
	textSoft: "#C4C9D2",
	muted: "#8A919E",
	faint: "#5B616C",
	accent: "#C6FF3D",
	accentInk: "#0B0D10",
	accentTint: "#1C2310",
	streak: "#FF6B2C",
	streakTint: "#2A1A12",
	danger: "#FF5A5F",
	dangerTint: "#2A1415",
};

const LIGHT: typeof DARK = {
	bg: "#F5F6F8",
	surface: "#FFFFFF",
	surfaceRaised: "#EEF0F3",
	control: "#E1E4E9",
	border: "#D9DDE3",
	hairline: "#E6E9ED",
	line: "#CDD2D9",
	lineSoft: "#E3E6EA",
	lineStrong: "#B7BDC6",
	overlay: "rgba(0,0,0,0.4)",
	text: "#14171C",
	textSoft: "#3A4048",
	muted: "#5E6673",
	faint: "#98A0AC",
	accent: "#4C8500",
	accentInk: "#FFFFFF",
	accentTint: "#E8F3D2",
	streak: "#D9500A",
	streakTint: "#FDE9DD",
	danger: "#D92D33",
	dangerTint: "#FCE6E7",
};

/**
 * The theme is chosen once, when the JS bundle loads, because styles are built from these
 * tokens at import time. Changing it in Settings takes effect the next time the app opens.
 */
export const resolvedTheme: "dark" | "light" = (() => {
	const pref = readThemePref();
	if (pref === "light") return "light";
	if (pref === "system")
		return Appearance.getColorScheme() === "light" ? "light" : "dark";
	return "dark";
})();

export const colors = resolvedTheme === "light" ? LIGHT : DARK;

export const fonts = {
	display: "SpaceGrotesk_600SemiBold",
	displayBold: "SpaceGrotesk_700Bold",
	body: "Inter_400Regular",
	bodyMedium: "Inter_500Medium",
	bodySemi: "Inter_600SemiBold",
	mono: "JetBrainsMono_400Regular",
	monoMedium: "JetBrainsMono_500Medium",
	monoBold: "JetBrainsMono_700Bold",
} as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 22 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// Minimum comfortable tap target for sweaty hands.
export const TAP = 44;
