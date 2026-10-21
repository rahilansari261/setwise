import { View } from "react-native";

import { ProScreen } from "@/src/components/pro-screen";
import { Card, Row, T } from "@/src/components/ui";
import { CATEGORY_COLOR } from "@/src/data/exercises";
import { muscleRecovery } from "@/src/lib/insights";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

const STATE_LABEL = {
	ready: "Ready",
	almost: "Almost",
	recovering: "Recovering",
	fresh: "Fresh",
} as const;

function ago(hours: number) {
	if (hours < 1) return "just now";
	if (hours < 48) return `${Math.round(hours)}h ago`;
	return `${Math.round(hours / 24)}d ago`;
}

export default function Recovery() {
	const { workouts } = useWorkouts();
	const muscles = muscleRecovery(workouts);

	return (
		<ProScreen feature="recovery" title="Muscle recovery">
			<T variant="small" style={{ marginTop: 12 }}>
				Estimated from when you last trained each muscle group, how many hard
				sets you did and your RPE. It's a guide, not a medical measurement.
			</T>
			<View style={{ gap: 10, marginTop: 16 }}>
				{muscles.map((m) => (
					<Card key={m.category}>
						<Row>
							<View
								style={{
									width: 8,
									height: 8,
									borderRadius: 4,
									backgroundColor: CATEGORY_COLOR[m.category],
								}}
							/>
							<T variant="heading" style={{ flex: 1 }}>
								{m.category}
							</T>
							<T
								style={{
									fontFamily: fonts.monoBold,
									fontSize: 12,
									color:
										m.state === "recovering"
											? colors.streak
											: m.state === "almost"
												? colors.textSoft
												: colors.accent,
								}}
							>
								{STATE_LABEL[m.state].toUpperCase()}
							</T>
						</Row>
						<View
							style={{
								height: 8,
								borderRadius: 4,
								backgroundColor: colors.hairline,
								marginTop: 10,
							}}
						>
							<View
								style={{
									width: `${Math.round(m.recovered * 100)}%`,
									height: 8,
									borderRadius: 4,
									backgroundColor:
										m.state === "recovering" ? colors.streak : colors.accent,
								}}
							/>
						</View>
						<T variant="small" style={{ marginTop: 8 }}>
							{m.hoursSince === undefined
								? "Not trained yet"
								: `${m.sets} sets · ${ago(m.hoursSince)}${
										m.recovered < 1
											? ` · ~${Math.max(1, Math.round(m.needHours - m.hoursSince))}h to go`
											: ""
									}`}
						</T>
					</Card>
				))}
			</View>
		</ProScreen>
	);
}
