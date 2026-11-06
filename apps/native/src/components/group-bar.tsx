import { View } from "react-native";

import { FillBar } from "@/src/components/motion";
import { T } from "@/src/components/ui";
import { statusOf, type VGroupInfo } from "@/src/lib/vmuscle";
import { colors, fonts } from "@/src/theme";

const STATUS_COLOR = {
	low: colors.streak,
	good: colors.accent,
	high: colors.muted,
} as const;

/** One muscle group: sets this week against its target range. */
export function GroupBar({
	info,
	sets,
	showWhy,
}: {
	info: VGroupInfo;
	sets: number;
	showWhy?: boolean;
}) {
	const status = statusOf(info, sets);
	const scaleMax = Math.max(info.max + 4, sets);
	const pct = (n: number) => `${Math.min(100, (n / scaleMax) * 100)}%` as const;
	return (
		<View style={{ gap: 6 }}>
			<View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
				<T style={{ fontFamily: fonts.bodyMedium, flex: 1 }}>{info.group}</T>
				<T style={{ fontFamily: fonts.monoBold, color: STATUS_COLOR[status] }}>
					{sets}
				</T>
				<T variant="small">
					/ {info.min === 0 ? `≤${info.max}` : `${info.min}–${info.max}`}
				</T>
			</View>
			<View
				style={{
					height: 10,
					borderRadius: 5,
					backgroundColor: colors.hairline,
				}}
			>
				{/* target range */}
				<View
					style={{
						position: "absolute",
						left: pct(info.min),
						width: `${((info.max - info.min) / scaleMax) * 100}%`,
						height: 10,
						borderRadius: 5,
						backgroundColor: colors.accentTint,
					}}
				/>
				<FillBar
					fraction={sets / scaleMax}
					style={{
						height: 10,
						borderRadius: 5,
						backgroundColor: STATUS_COLOR[status],
					}}
				/>
			</View>
			{showWhy ? <T variant="small">{info.why}</T> : null}
		</View>
	);
}
