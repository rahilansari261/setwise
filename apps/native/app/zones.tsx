import { useState } from "react";
import { View } from "react-native";

import { ProScreen } from "@/src/components/pro-screen";
import { Card, Chip, Row, T } from "@/src/components/ui";
import { addDays, todayISO } from "@/src/lib/dates";
import { trainingZones } from "@/src/lib/insights";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

const RANGES = [
	{ days: 30, label: "30 days" },
	{ days: 90, label: "90 days" },
	{ days: 365, label: "1 year" },
];

const HINT = {
	strength: "Heavy, low-rep work builds maximal strength.",
	hypertrophy: "Moderate reps near failure are the sweet spot for size.",
	endurance: "Higher reps train muscular endurance and conditioning.",
} as const;

export default function Zones() {
	const { workouts } = useWorkouts();
	const [days, setDays] = useState(30);
	const zones = trainingZones(workouts, addDays(todayISO(), -days));
	const total = zones.reduce((n, z) => n + z.sets, 0);

	return (
		<ProScreen feature="zones" title="Training zones">
			<Row gap={6} style={{ marginTop: 14 }}>
				{RANGES.map((r) => (
					<Chip
						key={r.days}
						label={r.label}
						selected={days === r.days}
						onPress={() => setDays(r.days)}
					/>
				))}
			</Row>
			<T variant="small" style={{ marginTop: 10 }}>
				{total} working sets in this period, split by rep range.
			</T>
			<View style={{ gap: 10, marginTop: 14 }}>
				{zones.map((z) => (
					<Card key={z.zone}>
						<Row>
							<View style={{ flex: 1 }}>
								<T variant="heading">{z.label}</T>
								<T variant="label" style={{ fontSize: 10 }}>
									{z.range}
								</T>
							</View>
							<T style={{ fontFamily: fonts.monoBold, fontSize: 20 }}>
								{Math.round(z.pct * 100)}%
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
									width: `${Math.round(z.pct * 100)}%`,
									height: 8,
									borderRadius: 4,
									backgroundColor: colors.accent,
								}}
							/>
						</View>
						<T variant="small" style={{ marginTop: 8 }}>
							{z.sets} sets · {HINT[z.zone]}
						</T>
					</Card>
				))}
			</View>
		</ProScreen>
	);
}
