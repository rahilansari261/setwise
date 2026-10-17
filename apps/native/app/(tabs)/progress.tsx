import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ExerciseProgress } from "@/src/components/exercise-progress";
import { Chip, Screen, T } from "@/src/components/ui";
import { CATEGORY_COLOR } from "@/src/data/exercises";
import { fmt } from "@/src/lib/calc";
import { addDays, shortDate, todayISO } from "@/src/lib/dates";
import { setsByCategory } from "@/src/lib/stats";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

export default function Progress() {
	const { workouts, personalRecords, settings } = useWorkouts();

	// Exercises with history, most recently trained first.
	const trained = useMemo(() => {
		const lastSeen = new Map<string, { name: string; date: string }>();
		for (const date of Object.keys(workouts).sort()) {
			for (const we of workouts[date]?.exercises ?? []) {
				if (we.sets.some((s) => s.completed))
					lastSeen.set(we.exerciseId, { name: we.exerciseName, date });
			}
		}
		return [...lastSeen.entries()]
			.map(([id, v]) => ({ id, ...v }))
			.sort((a, b) => b.date.localeCompare(a.date));
	}, [workouts]);

	const [picked, setPicked] = useState<string | null>(null);
	const selected = picked ?? trained[0]?.id ?? null;
	const split = useMemo(
		() => setsByCategory(workouts, addDays(todayISO(), -30)),
		[workouts],
	);
	const maxSets = Math.max(1, ...split.map((s) => s.sets));
	const records = Object.values(personalRecords)
		.filter((r) => r.maxEstimated1RM.value > 0)
		.sort((a, b) =>
			b.maxEstimated1RM.date.localeCompare(a.maxEstimated1RM.date),
		)
		.slice(0, 8);

	return (
		<Screen bottomInset={32}>
			<T variant="label">PROGRESS</T>
			<T variant="display" style={{ marginTop: 4 }}>
				Your lifts
			</T>

			{trained.length === 0 ? (
				<View style={styles.empty}>
					<T variant="heading">Nothing to chart yet</T>
					<T variant="small">
						Log a few sets and your strength trend, records and muscle split
						appear here.
					</T>
				</View>
			) : (
				<>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 6 }}
						style={{ marginTop: 14 }}
					>
						{trained.slice(0, 15).map((t) => (
							<Chip
								key={t.id}
								label={t.name}
								selected={selected === t.id}
								onPress={() => setPicked(t.id)}
								style={{ minHeight: 38 }}
							/>
						))}
					</ScrollView>
					{selected ? (
						<View style={{ marginTop: 12 }}>
							<ExerciseProgress key={selected} exerciseId={selected} />
						</View>
					) : null}

					<T variant="label" style={{ marginTop: 28 }}>
						MUSCLE SPLIT · LAST 30 DAYS · SETS
					</T>
					<View style={{ marginTop: 10, gap: 8 }}>
						{split.map((s) => (
							<View key={s.category} style={styles.barRow}>
								<T style={styles.barLabel}>{s.category}</T>
								<View style={styles.barTrack}>
									<View
										style={{
											width: `${(s.sets / maxSets) * 100}%`,
											height: 10,
											borderRadius: 3,
											backgroundColor: CATEGORY_COLOR[s.category],
										}}
									/>
								</View>
								<T style={styles.barValue}>{s.sets}</T>
							</View>
						))}
						{split.length === 0 ? (
							<T variant="small">No sets in the last 30 days.</T>
						) : null}
					</View>

					<T variant="label" style={{ marginTop: 28 }}>
						RECORDS · BEST e1RM
					</T>
					<View style={{ marginTop: 4 }}>
						{records.map((r) => (
							<View key={r.exerciseId} style={styles.record}>
								<View style={{ flex: 1, gap: 2 }}>
									<T style={{ fontFamily: fonts.bodyMedium }} numberOfLines={1}>
										{r.exerciseName}
									</T>
									<T variant="label" style={{ fontSize: 10, letterSpacing: 1 }}>
										{shortDate(r.maxEstimated1RM.date)} ·{" "}
										{fmt(r.maxEstimated1RM.weight)} × {r.maxEstimated1RM.reps}
									</T>
								</View>
								<T variant="mono">
									{fmt(r.maxEstimated1RM.value)}
									<T
										style={{
											fontFamily: fonts.mono,
											fontSize: 12,
											color: colors.muted,
										}}
									>
										{" "}
										{settings.unit}
									</T>
								</T>
							</View>
						))}
					</View>
				</>
			)}
		</Screen>
	);
}

const styles = StyleSheet.create({
	empty: {
		marginTop: 24,
		gap: 6,
		padding: 16,
		borderRadius: 18,
		backgroundColor: colors.surface,
	},
	barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	barLabel: {
		width: 76,
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textSoft,
	},
	barTrack: {
		flex: 1,
		height: 10,
		borderRadius: 3,
		backgroundColor: colors.hairline,
	},
	barValue: {
		width: 30,
		textAlign: "right",
		fontFamily: fonts.monoMedium,
		fontSize: 13,
		color: colors.text,
	},
	record: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderBottomWidth: 1,
		borderBottomColor: colors.hairline,
	},
});
