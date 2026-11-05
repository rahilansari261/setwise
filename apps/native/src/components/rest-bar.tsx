import { Pause, Play } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { T } from "@/src/components/ui";
import { fmtDuration } from "@/src/lib/calc";
import { useRestTimer } from "@/src/state/rest-timer";
import { colors, fonts } from "@/src/theme";

/** Docked above the tab bar whenever a rest timer is running or paused. */
export function RestBar() {
	const timer = useRestTimer();
	if (!timer.active) return null;
	return (
		<View style={styles.bar} accessibilityLiveRegion="polite">
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={
					timer.running ? "Pause rest timer" : "Resume rest timer"
				}
				onPress={timer.running ? timer.pause : timer.resume}
				style={styles.play}
			>
				{timer.running ? (
					<Pause size={18} color={colors.text} />
				) : (
					<Play size={18} color={colors.accent} />
				)}
			</Pressable>
			<View style={{ flex: 1 }}>
				<T variant="label" style={{ fontSize: 10 }} numberOfLines={1}>
					{timer.running ? "REST" : "PAUSED"}
					{timer.label ? ` · ${timer.label}` : ""}
				</T>
				<T style={styles.time}>{fmtDuration(timer.remaining)}</T>
			</View>
			<Pressable
				accessibilityRole="button"
				onPress={() => timer.addSeconds(30)}
				style={styles.btn}
			>
				<T style={styles.btnText}>+30s</T>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				onPress={timer.stop}
				style={[styles.btn, styles.btnSolid]}
			>
				<T style={styles.btnText}>Skip</T>
			</Pressable>
			<View
				style={[
					styles.progress,
					{ width: `${Math.min(100, timer.progress * 100)}%` },
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	bar: {
		marginHorizontal: 10,
		marginBottom: 8,
		height: 62,
		borderRadius: 18,
		backgroundColor: "#1A1E25",
		borderWidth: 1,
		borderColor: "#2E333C",
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingLeft: 6,
		paddingRight: 8,
		overflow: "hidden",
	},
	play: {
		width: 44,
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	time: {
		fontFamily: fonts.monoBold,
		fontSize: 24,
		lineHeight: 28,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	btn: {
		height: 44,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#2E333C",
		alignItems: "center",
		justifyContent: "center",
	},
	btnSolid: { backgroundColor: colors.control, borderColor: colors.control },
	btnText: { fontFamily: fonts.mono, fontSize: 13, color: colors.text },
	progress: {
		position: "absolute",
		left: 0,
		bottom: 0,
		height: 3,
		backgroundColor: colors.accent,
	},
});
