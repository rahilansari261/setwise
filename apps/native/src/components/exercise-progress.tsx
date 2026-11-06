import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { LineChart } from "@/src/components/line-chart";
import { Chip, T } from "@/src/components/ui";
import { distanceUnit, fmt, fmtSetTime } from "@/src/lib/calc";
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
	setSummary,
} from "@/src/lib/stats";
import { usePremium, useProGate } from "@/src/state/premium";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";
import type { MetricType, Unit } from "@/src/types";

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
	reps: "MOST REPS IN A SET",
	time: "LONGEST SET",
	distance: "LONGEST DISTANCE",
};

/** Which metrics make sense for an exercise type; the first one is the default. */
const METRICS_FOR: Record<MetricType, ProgressMetric[]> = {
	weight_reps: ["e1rm", "weight", "volume"],
	reps_only: ["reps"],
	time_only: ["time"],
	distance_time: ["distance", "time"],
};

const METRIC_CHIP: Record<ProgressMetric, string> = {
	e1rm: "e1RM",
	weight: "Max weight",
	volume: "Volume",
	reps: "Reps",
	time: "Time",
	distance: "Distance",
};

function formatMetric(value: number, metric: ProgressMetric, _unit: Unit) {
	const sign = value < 0 ? "−" : "";
	const v = Math.abs(value);
	if (metric === "time") return `${sign}${fmtSetTime(v)}`;
	if (metric === "reps") return `${sign}${fmt(v, 0)}`;
	if (metric === "distance") return `${sign}${fmt(v, 2)}`;
	return `${sign}${fmt(v, metric === "volume" ? 0 : 1)}`;
}

function metricUnit(metric: ProgressMetric, unit: Unit) {
	if (metric === "time") return "";
	if (metric === "reps") return "reps";
	if (metric === "distance") return distanceUnit(unit);
	return unit;
}

export function ExerciseProgress({ exerciseId }: { exerciseId: string }) {
	const { workouts, settings, personalRecords, exerciseById } = useWorkouts();
	const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("3M");
	const [picked, setMetric] = useState<ProgressMetric>("e1rm");
	const metricType = exerciseById.get(exerciseId)?.metricType ?? "weight_reps";
	const metricChoices = METRICS_FOR[metricType];
	const metric = metricChoices.includes(picked)
		? picked
		: (metricChoices[0] ?? "e1rm");
	const unit = settings.unit;
	const { isPro } = usePremium();
	const gate = useProGate();

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
	const pr =
		metricType === "weight_reps" ? personalRecords[exerciseId] : undefined;
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
			{metricChoices.length > 1 ? (
				<View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
					{metricChoices.map((m) => {
						const free = m === metricChoices[0] || metricType !== "weight_reps";
						return (
							<Chip
								key={m}
								label={METRIC_CHIP[m]}
								selected={metric === m}
								onPress={() =>
									free
										? setMetric(m)
										: gate("advancedCharts", () => setMetric(m))
								}
								style={[
									{ minHeight: 36, flex: 1, paddingHorizontal: 6 },
									!free && !isPro && { opacity: 0.55 },
								]}
							/>
						);
					})}
				</View>
			) : null}

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
					{formatMetric(latest, metric, unit)}
				</T>
				<T
					style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.muted }}
				>
					{metricUnit(metric, unit)}
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
							{formatMetric(delta, metric, unit)} · {range}
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
						onPress={() =>
							r.days > 100
								? gate("advancedCharts", () => setRange(r.key))
								: setRange(r.key)
						}
						style={[
							{ flex: 1, minHeight: 36 },
							r.days > 100 && !isPro && { opacity: 0.55 },
						]}
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
								metric === "time"
									? fmtSetTime(v)
									: metric === "distance"
										? fmt(v, 1)
										: metric === "volume" && v >= 1000
											? `${Math.round(v / 100) / 10}k`
											: String(Math.round(v))
							}
							accessibilityLabel={`${METRIC_LABEL[metric]} over ${sessions.length} sessions, latest ${formatMetric(latest, metric, unit)} ${metricUnit(metric, unit)}`}
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
			) : metricType !== "weight_reps" ? (
				<View style={styles.tiles}>
					<Tile
						label={`BEST ${METRIC_CHIP[metric].toUpperCase()}`}
						value={formatMetric(
							Math.max(0, ...all.map((x) => metricValue(x, metric))),
							metric,
							unit,
						)}
						suffix={metricUnit(metric, unit)}
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
							{metricType === "weight_reps"
								? setSummary(s.bestSet, metricType, unit)
								: metricType === "distance_time"
									? setSummary(
											{ weight: 0, reps: 0, ...s.bestDistanceSet },
											metricType,
											unit,
										)
									: setSummary(
											{ weight: 0, reps: s.maxReps, timeSeconds: s.maxTime },
											metricType,
											unit,
										)}
						</T>
						{metricType === "weight_reps" ? (
							<T style={styles.recentText}>{fmt(s.e1rm)}</T>
						) : null}
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
