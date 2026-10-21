import { Trophy } from "lucide-react-native";
import { View } from "react-native";

import { Card, Row, Screen, ScreenHeader, T } from "@/src/components/ui";
import { todayISO } from "@/src/lib/dates";
import { achievements } from "@/src/lib/insights";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

export default function Achievements() {
	const { workouts, settings } = useWorkouts();
	const list = achievements(workouts, settings.unit, todayISO());
	const done = list.filter((a) => a.done).length;

	return (
		<Screen stack bottomInset={40}>
			<ScreenHeader title="Achievements" />
			<T variant="small" style={{ marginTop: 12 }}>
				{done} of {list.length} unlocked
			</T>
			<View style={{ gap: 8, marginTop: 14 }}>
				{[...list]
					.sort((a, b) => Number(b.done) - Number(a.done))
					.map((a) => (
						<Card key={a.id} active={a.done}>
							<Row gap={12}>
								<Trophy
									size={22}
									color={a.done ? colors.accent : colors.faint}
								/>
								<View style={{ flex: 1 }}>
									<T
										style={{
											fontFamily: fonts.bodyMedium,
											color: a.done ? colors.text : colors.textSoft,
										}}
									>
										{a.title}
									</T>
									<T variant="small">{a.desc}</T>
								</View>
								{!a.done ? (
									<T
										style={{
											fontFamily: fonts.mono,
											fontSize: 12,
											color: colors.muted,
										}}
									>
										{Math.floor(a.progress).toLocaleString()}/
										{a.target.toLocaleString()}
									</T>
								) : null}
							</Row>
						</Card>
					))}
			</View>
		</Screen>
	);
}
