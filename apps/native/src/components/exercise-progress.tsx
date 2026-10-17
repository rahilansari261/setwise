import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { LineChart } from "@/src/components/line-chart";
import { Chip, T } from "@/src/components/ui";
import { fmt } from "@/src/lib/calc";
import {
	addDays,
	fromISO,
	monthName,
	shortDate,
	todayISO,
} from "@/src/lib/dates";
import {
	exerciseSessions,
	metricValue,
	type ProgressMetric,
} from "@/src/lib/stats";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

const RANGES = [
	{ key: "1M", days: 30 },
	{ key: "3M", days: 91 },
	{ key: "6M", days: 182 },
	{ key: "ALL", days: Number.POSITIVE_INFINITY },
] as const;

const METRIC_LABEL: Record<ProgressMetric, string> = {
	e1rm: "ESTIMATED 1RM · EPLEY",
	weight: "HEAVIEST SET",
	volume: "SESSION VOLUME",
};

export function ExerciseProgress({ exerciseId }: { exerciseId: string }) {
	const { workouts, settings, personalRecords } = useWorkouts();
	const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("3M");
	const [metric, setMetric] = useState<ProgressMetric>("e1rm");
	const unit = settings.unit;

	const all = useMemo(
		() => exerciseSessions(workouts, exerciseId),
		[workouts, exerciseId],
	);
	const days = RANGES.find((r) => r.key === range)?.days ?? 91;
	const from = Number.isFinite(days)
		? addDays(todayISO(), -days)
		: "0000-00-00";
	const sessions = all.filter((s) => s.date >= from);
	const values = sessions.map((s) => metricValue(s, metric));
	const latest = values.at(-1) ?? 0;
	const delta = values.length > 1 ? latest - (values[0] ?? 0) : 0;
	const pr = personalRecords[exerciseId];
	const totalSets = sessions.reduce((n, s) => n + s.sets, 0);

	if (all.length === 0) {
		return (
			<View style={styles.empty}>
				<T variant="heading">No sets logged yet</T>
				<T variant="small">
					Tick off a set of this exercise and its progress shows up here.
				</T>
			</View>
		);
	}

	const first = sessions[0]?.date;
	const last = sessions.at(-1)?.date;

	return (
		<View>
			<View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
				{(["e1rm", "weight", "volume"] as ProgressMetric[]).map((m) => (
					<Chip
						key={m}
						label={
							m === "e1rm" ? "e1RM" : m === "weight" ? "Max weight" : "Volume"
						}
						selected={metric === m}
						onPress={() => setMetric(m)}
						style={{ minHeight: 36, flex: 1, paddingHorizontal: 6 }}
					/>
				))}
			</View>

			<T variant="label" style={{ marginTop: 18 }}>
				{METRIC_LABEL[metric]}
			</T>
			<View
				style={{
					flexDirection: "row",
					alignItems: "baseline",
					gap: 8,
					marginTop: 4,
				}}
			>
				<T
					variant="monoLarge"
					numberOfLines={1}
					adjustsFontSizeToFit
					style={{ flexShrink: 1 }}
				>
					{fmt(latest, metric === "volume" ? 0 : 1)}
				</T>
				<T
					style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.muted }}
				>
					{unit}
				</T>
				{delta !== 0 ? (
					<View
						style={[
							styles.delta,
							{
								backgroundColor:
									delta > 0 ? colors.accentTint : colors.dangerTint,
							},
						]}
					>
						<T
							style={{
								fontFamily: fonts.monoBold,
								fontSize: 12,
								color: delta > 0 ? colors.accent : colors.danger,
							}}
						>
							{delta > 0 ? "+" : ""}
							{fmt(delta, metric === "volume" ? 0 : 1)} · {range}
						</T>
					</View>
				) : null}
			</View>

			<View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
				{RANGES.map((r) => (
					<Chip
						key={r.key}
						label={r.key}
						mono
						selected={range === r.key}
						onPress={() => setRange(r.key)}
						style={{ flex: 1, minHeight: 36 }}
					/>
				))}
			</View>

			<View style={{ marginTop: 14 }}>
				{values.length > 0 ? (
					<>
						<LineChart
							values={values}
							height={150}
							formatTick={(v) =>
								metric === "volume" && v >= 1000
									? `${Math.round(v / 100) / 10}k`
									: String(Math.round(v))
							}
							accessibilityLabel={`${METRIC_LABEL[metric]} over ${sessions.length} sessions, latest ${fmt(latest)} ${unit}`}
						/>
						{first && last ? (
							<View
								style={{
									flexDirection: "row",
									// A single session is plotted in the middle, so its date sits there too.
									justifyContent: last !== first ? "space-between" : "center",
									paddingLeft: 30,
									marginTop: 4,
								}}
							>
								<T style={styles.axis}>{axisDate(first)}</T>
								{last !== first ? (
									<T style={styles.axis}>{axisDate(last)}</T>
								) : null}
							</View>
						) : null}
					</>
				) : (
					<T variant="small">No sessions in this range.</T>
				)}
			</View>

			{pr ? (
				<View style={styles.tiles}>
					<Tile
						label="HEAVIEST"
						value={`${fmt(pr.maxWeight.value)} × ${pr.maxWeight.reps}`}
						fresh={all.length > 1 && pr.maxWeight.date === todayISO()}
					/>
					<Tile
						label="BEST e1RM"
						value={fmt(pr.maxEstimated1RM.value)}
						fresh={all.length > 1 && pr.maxEstimated1RM.date === todayISO()}
					/>
					<Tile
						label="BEST SESSION"
						value={`${fmt(pr.maxVolume.value, 0)}`}
						suffix={unit}
					/>
					<Tile label={`SETS · ${range}`} value={String(totalSets)} />
				</View>
			) : null}

			<T variant="label" style={{ marginTop: 20 }}>
				RECENT
			</T>
			{[...all]
				.reverse()
				.slice(0, 6)
				.map((s) => (
					<View key={s.date} style={styles.recent}>
						<T
							style={[
								styles.recentText,
								{ width: 100, color: colors.muted, fontSize: 12 },
							]}
						>
							{shortDate(s.date).toUpperCase()}
						</T>
						<T style={[styles.recentText, { flex: 1 }]}>
							{fmt(s.bestSet.weight)} × {s.bestSet.reps}
						</T>
						<T style={styles.recentText}>{fmt(s.e1rm)}</T>
					</View>
				))}
		</View>
	);
}

function axisDate(iso: string) {
	const d = fromISO(iso);
	return `${d.getDate()} ${monthName(d.getMonth())}`.toUpperCase();
}

function Tile({
	label,
	value,
	suffix,
	fresh,
}: {
	label: string;
	value: string;
	suffix?: string;
	fresh?: boolean;
}) {
	return (
		<View style={styles.tile}>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<T
					variant="label"
					style={{ fontSize: 10, letterSpacing: 1, textTransform: "none" }}
				>
					{label}
				</T>
				{fresh ? (
					<View style={styles.newTag}>
						<T
							style={{
								fontFamily: fonts.monoBold,
								fontSize: 9,
								color: colors.streak,
							}}
						>
							NEW
						</T>
					</View>
				) : null}
			</View>
			<T
				variant="mono"
				style={{ fontSize: 20 }}
				numberOfLines={1}
				adjustsFontSizeToFit
			>
				{value}
				{suffix ? (
					<T
						style={{
							fontFamily: fonts.mono,
							fontSize: 12,
							color: colors.muted,
						}}
					>
						{" "}
						{suffix}
					</T>
				) : null}
			</T>
		</View>
	);
}

const styles = StyleSheet.create({
	empty: { paddingVertical: 32, gap: 6 },
	delta: {
		marginLeft: "auto",
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 8,
		alignSelf: "center",
	},
	axis: {
		fontFamily: fonts.mono,
		fontSize: 10,
		letterSpacing: 1,
		color: colors.muted,
	},
	tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
	tile: {
		flexBasis: "47%",
		flexGrow: 1,
		backgroundColor: colors.surface,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.hairline,
		padding: 12,
		gap: 6,
	},
	newTag: {
		paddingHorizontal: 5,
		paddingVertical: 2,
		borderRadius: 4,
		backgroundColor: colors.streakTint,
	},
	recent: {
		height: 44,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		borderBottomWidth: 1,
		borderBottomColor: colors.hairline,
	},
	recentText: {
		fontFamily: fonts.monoMedium,
		fontSize: 14,
		color: colors.text,
	},
});
