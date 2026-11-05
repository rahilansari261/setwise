// Electric Night — the single source for colors, type and spacing.
export const colors = {
	bg: "#0B0D10",
	surface: "#16191F",
	surfaceRaised: "#1D2128",
	control: "#2A2F38",
	border: "#262A32",
	hairline: "#1D2128",
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
} as const;

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
