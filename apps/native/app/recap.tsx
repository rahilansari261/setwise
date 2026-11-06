import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { View } from "react-native";

import { ProScreen } from "@/src/components/pro-screen";
import { Card, IconButton, Row, T } from "@/src/components/ui";
import { fmt, kgToLb, plural } from "@/src/lib/calc";
import { monthName, shortDate, todayISO } from "@/src/lib/dates";
import { monthKey, monthRecap, shiftMonth } from "@/src/lib/insights";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

function delta(now: number, before: number) {
	if (before === 0) return now > 0 ? "new" : "—";
	const pct = Math.round(((now - before) / before) * 100);
	return `${pct >= 0 ? "+" : ""}${pct}%`;
}

export default function Recap() {
	const { workouts, settings } = useWorkouts();
	const thisMonth = monthKey(todayISO());
	const [month, setMonth] = useState(thisMonth);
	const cur = useMemo(
		() => monthRecap(workouts, month, settings.unit),
		[workouts, month, settings.unit],
	);
	const prev = useMemo(
		() => monthRecap(workouts, shiftMonth(month, -1), settings.unit),
		[workouts, month, settings.unit],
	);
	const [y, m] = month.split("-").map(Number);
	const lbs = settings.unit === "lbs";
	const vol = (kg: number) => fmt(lbs ? kgToLb(kg) : kg, 0);

	const tiles = [
		{
			label: "WORKOUTS",
			value: String(cur.workouts),
			d: delta(cur.workouts, prev.workouts),
		},
		{ label: "SETS", value: String(cur.sets), d: delta(cur.sets, prev.sets) },
		{
			label: `VOLUME (${settings.unit})`,
			value: vol(cur.volumeKg),
			d: delta(cur.volumeKg, prev.volumeKg),
		},
		{
			label: "MINUTES",
			value: String(cur.minutes),
			d: delta(cur.minutes, prev.minutes),
		},
		{ label: "NEW PRS", value: String(cur.prs), d: delta(cur.prs, prev.prs) },
	];

	return (
		<ProScreen feature="recap" title="Monthly recap">
			<Row style={{ marginTop: 14, justifyContent: "space-between" }}>
				<IconButton
					icon={ChevronLeft}
					label="Previous month"
					onPress={() => setMonth(shiftMonth(month, -1))}
				/>
				<T variant="heading">
					{monthName((m ?? 1) - 1)} {y}
				</T>
				<IconButton
					icon={ChevronRight}
					label="Next month"
					onPress={() => month < thisMonth && setMonth(shiftMonth(month, 1))}
					color={month < thisMonth ? colors.text : colors.faint}
				/>
			</Row>

			{cur.workouts === 0 ? (
				<Card style={{ marginTop: 16 }}>
					<T variant="heading">No workouts this month</T>
					<T variant="small" style={{ marginTop: 4 }}>
						Log a session and your recap fills in.
					</T>
				</Card>
			) : (
				<>
					<View
						style={{
							flexDirection: "row",
							flexWrap: "wrap",
							gap: 10,
							marginTop: 16,
						}}
					>
						{tiles.map((t) => (
							<Card key={t.label} style={{ width: "47.8%" }}>
								<T variant="label" style={{ fontSize: 10 }}>
									{t.label}
								</T>
								<T
									style={{
										fontFamily: fonts.monoBold,
										fontSize: 26,
										marginTop: 4,
									}}
								>
									{t.value}
								</T>
								<T variant="small">{t.d} vs last month</T>
							</Card>
						))}
					</View>
					<Card style={{ marginTop: 10, gap: 8 }}>
						{cur.topExercise ? (
							<T>
								Most trained:{" "}
								<T style={{ fontFamily: fonts.bodyMedium }}>
									{cur.topExercise.name}
								</T>{" "}
								({plural(cur.topExercise.sets, "set")})
							</T>
						) : null}
						{cur.topCategory ? (
							<T>
								Focus muscle:{" "}
								<T style={{ fontFamily: fonts.bodyMedium }}>
									{cur.topCategory.category}
								</T>
							</T>
						) : null}
						{cur.bestDay && cur.bestDay.volumeKg > 0 ? (
							<T>
								Biggest day:{" "}
								<T style={{ fontFamily: fonts.bodyMedium }}>
									{shortDate(cur.bestDay.date)}
								</T>{" "}
								· {vol(cur.bestDay.volumeKg)} {settings.unit}
							</T>
						) : null}
					</Card>
				</>
			)}
		</ProScreen>
	);
}
