import { View } from "react-native";

import { GroupBar } from "@/src/components/group-bar";
import { Card, Screen, ScreenHeader, T } from "@/src/components/ui";
import { addDays, todayISO } from "@/src/lib/dates";
import { countsAsWork } from "@/src/lib/sets";
import { biggestGaps, setsPerGroup, VGROUPS } from "@/src/lib/vmuscle";
import { useGroupLookup } from "@/src/state/vgroups";
import { useWorkouts } from "@/src/state/workout-store";

export default function Volume() {
	const { workouts } = useWorkouts();
	const lookup = useGroupLookup();
	const counts = setsPerGroup(
		workouts,
		lookup,
		addDays(todayISO(), -6),
		countsAsWork,
	);
	const gaps = biggestGaps(counts, 3);
	const total = [...counts.values()].reduce((a, b) => a + b, 0);

	return (
		<Screen stack bottomInset={40}>
			<ScreenHeader title="Weekly sets" />
			<T variant="small" style={{ marginTop: 12 }}>
				Hard sets in the last 7 days, against the range that builds each muscle.
				The first four are what widen your frame.
			</T>

			{total === 0 ? (
				<Card style={{ marginTop: 16 }}>
					<T variant="heading">No sets this week yet</T>
					<T variant="small" style={{ marginTop: 4 }}>
						Log a workout and your lats, side delts and the rest fill in here.
					</T>
				</Card>
			) : gaps.length > 0 ? (
				<Card style={{ marginTop: 16, gap: 4 }} active>
					<T variant="label">BIGGEST GAPS THIS WEEK</T>
					{gaps.map((g) => (
						<T key={g.info.group}>
							{g.info.group}: {g.missing} more{" "}
							{g.missing === 1 ? "set" : "sets"}
						</T>
					))}
				</Card>
			) : (
				<Card style={{ marginTop: 16 }} active>
					<T variant="heading">Every muscle is in range</T>
					<T variant="small">Nice week. Keep it up.</T>
				</Card>
			)}

			<Card style={{ marginTop: 12, gap: 18 }}>
				{VGROUPS.map((g) => (
					<GroupBar
						key={g.group}
						info={g}
						sets={counts.get(g.group) ?? 0}
						showWhy
					/>
				))}
			</Card>
			<T variant="small" style={{ marginTop: 12 }}>
				Ranges are common hypertrophy guidance (roughly 10–20 hard sets per
				muscle per week), not a prescription. Warm-up sets don't count.
			</T>
		</Screen>
	);
}
