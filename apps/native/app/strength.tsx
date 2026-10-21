import { View } from "react-native";

import { ProScreen } from "@/src/components/pro-screen";
import { Card, Row, T } from "@/src/components/ui";
import { fmt, kgToLb } from "@/src/lib/calc";
import {
	LEVELS,
	latestBodyweightKg,
	strengthRanking,
} from "@/src/lib/insights";
import { useExtras } from "@/src/state/extras";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

export default function Strength() {
	const { workouts, settings, profile } = useWorkouts();
	const { measurements } = useExtras();
	const bw = latestBodyweightKg(measurements, profile?.weightKg ?? 0);
	const ranked = strengthRanking(
		workouts,
		settings.unit,
		bw,
		profile?.gender ?? "male",
	);
	const lbs = settings.unit === "lbs";
	const show = (kg: number) => fmt(lbs ? kgToLb(kg) : kg, 0);

	return (
		<ProScreen feature="strength" title="Strength ranking">
			<T variant="small" style={{ marginTop: 12 }}>
				Your best estimated 1RM compared with your body weight (
				{fmt(lbs ? kgToLb(bw) : bw)} {settings.unit}). Levels are approximate
				rules of thumb.
			</T>
			<View style={{ gap: 10, marginTop: 16 }}>
				{ranked.map((r) => (
					<Card key={r.key}>
						<Row>
							<T variant="heading" style={{ flex: 1 }}>
								{r.name}
							</T>
							<T
								style={{
									fontFamily: fonts.monoBold,
									fontSize: 12,
									color: r.level === "Untrained" ? colors.muted : colors.accent,
								}}
							>
								{r.level.toUpperCase()}
							</T>
						</Row>
						<T variant="small">
							{r.e1rmKg > 0
								? `e1RM ${show(r.e1rmKg)} ${settings.unit} · ${r.ratio.toFixed(2)}× bodyweight`
								: "Not logged yet"}
						</T>
						<View style={{ flexDirection: "row", gap: 3, marginTop: 10 }}>
							{LEVELS.map((lvl, i) => {
								const reached = LEVELS.indexOf(r.level as never) >= i;
								return (
									<View
										key={lvl}
										style={{
											flex: 1,
											height: 6,
											borderRadius: 3,
											backgroundColor: reached
												? colors.accent
												: colors.hairline,
										}}
									/>
								);
							})}
						</View>
						{r.nextLevel && r.nextTargetKg ? (
							<T variant="small" style={{ marginTop: 8 }}>
								Next: {r.nextLevel} at {show(r.nextTargetKg)} {settings.unit}
							</T>
						) : r.level === "Elite" ? (
							<T variant="small" style={{ marginTop: 8 }}>
								Top of the scale.
							</T>
						) : null}
					</Card>
				))}
			</View>
		</ProScreen>
	);
}
