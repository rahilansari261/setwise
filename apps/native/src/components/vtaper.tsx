import { useRouter } from "expo-router";
import { ChevronRight, Ruler as RulerIcon } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { LineChart } from "@/src/components/line-chart";
import { fmtLength } from "@/src/components/measure-input";
import { Button, Card, PressableCard, Row, T } from "@/src/components/ui";
import { addDays, shortDate, startOfWeek, todayISO } from "@/src/lib/dates";
import {
	FOCUS_TARGETS,
	focusSets,
	GOLDEN_RATIO,
	goalWaistCm,
	latestWithRatio,
	ratioProgress,
	vTaperRatio,
} from "@/src/lib/vtaper";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

/** Shoulder-to-waist ratio against the golden ratio, with its trend and the waist that would hit it. */
export function RatioCard({ linked = true }: { linked?: boolean }) {
	const router = useRouter();
	const { measurements, settings } = useWorkouts();
	const unit = settings.unit;
	const lengthUnit = unit === "kg" ? "cm" : "in";

	const history = useMemo(
		() =>
			measurements
				.map((m) => ({ date: m.date, ratio: vTaperRatio(m) }))
				.filter((r): r is { date: string; ratio: number } => r.ratio !== null),
		[measurements],
	);
	const latest = latestWithRatio(measurements);
	const ratio = vTaperRatio(latest);

	if (!latest || ratio === null) {
		return (
			<Card>
				<T variant="label">V-TAPER RATIO</T>
				<T variant="title" style={{ marginTop: 6 }}>
					Measure your V
				</T>
				<T variant="small" style={{ marginTop: 6 }}>
					Log your shoulders and waist to get your ratio. The aesthetic target
					is {GOLDEN_RATIO} — shoulders 1.6× your waist.
				</T>
				{linked ? (
					<Button
						title="Log measurements"
						icon={RulerIcon}
						style={{ marginTop: 14 }}
						onPress={() => router.push("/measurements")}
					/>
				) : null}
			</Card>
		);
	}

	const first = history[0];
	const change =
		first && first.date !== latest.date ? ratio - first.ratio : null;
	const goalWaist = latest.shouldersCm ? goalWaistCm(latest.shouldersCm) : 0;
	const waistToGo = latest.waistCm ? latest.waistCm - goalWaist : 0;

	const body = (
		<>
			<Row style={{ justifyContent: "space-between" }}>
				<T variant="label">V-TAPER RATIO · {shortDate(latest.date)}</T>
				{linked ? <ChevronRight size={16} color={colors.muted} /> : null}
			</Row>
			<Row style={{ alignItems: "flex-end", marginTop: 6 }} gap={10}>
				<T style={styles.ratio}>{ratio.toFixed(2)}</T>
				<View style={{ paddingBottom: 8, gap: 2 }}>
					<T variant="small">of {GOLDEN_RATIO}</T>
					{change !== null ? (
						<T
							style={{
								fontFamily: fonts.monoMedium,
								fontSize: 12,
								color: change >= 0 ? colors.accent : colors.danger,
							}}
						>
							{change >= 0 ? "+" : ""}
							{change.toFixed(2)} since {shortDate(first?.date ?? "")}
						</T>
					) : null}
				</View>
			</Row>
			<View style={styles.track}>
				<View
					style={[
						styles.fill,
						{ width: `${Math.round(ratioProgress(ratio) * 100)}%` },
					]}
				/>
			</View>
			<Row style={{ marginTop: 12 }} gap={8}>
				<Metric
					label="SHOULDERS"
					value={fmtLength(latest.shouldersCm, unit)}
					unit={lengthUnit}
				/>
				<Metric
					label="WAIST"
					value={fmtLength(latest.waistCm, unit)}
					unit={lengthUnit}
				/>
				<Metric
					label="GOAL WAIST"
					value={waistToGo > 0 ? fmtLength(goalWaist, unit) : "✓"}
					unit={waistToGo > 0 ? lengthUnit : ""}
					accent
				/>
			</Row>
			{history.length > 1 ? (
				<View style={{ marginTop: 12 }}>
					<LineChart
						values={history.map((h) => h.ratio)}
						height={110}
						formatTick={(v) => v.toFixed(2)}
						accessibilityLabel={`V-taper ratio over ${history.length} check-ins, now ${ratio.toFixed(2)}`}
					/>
				</View>
			) : null}
		</>
	);

	return linked ? (
		<PressableCard
			accessibilityRole="button"
			accessibilityLabel={`V-taper ratio ${ratio.toFixed(2)}, target ${GOLDEN_RATIO}. Open measurements.`}
			onPress={() => router.push("/measurements")}
		>
			{body}
		</PressableCard>
	) : (
		<Card>{body}</Card>
	);
}

function Metric({
	label,
	value,
	unit,
	accent,
}: {
	label: string;
	value: string;
	unit: string;
	accent?: boolean;
}) {
	return (
		<View style={styles.metric}>
			<T variant="label" style={{ fontSize: 9, letterSpacing: 1 }}>
				{label}
			</T>
			<T
				style={{
					fontFamily: fonts.monoMedium,
					fontSize: 16,
					color: accent ? colors.accent : colors.text,
				}}
				numberOfLines={1}
			>
				{value}
				<T
					style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}
				>
					{unit ? ` ${unit}` : ""}
				</T>
			</T>
		</View>
	);
}

/** This week's working sets for each V-taper muscle against its weekly target range. */
export function FocusCard({ compact }: { compact?: boolean }) {
	const { workouts } = useWorkouts();
	const monday = startOfWeek(todayISO());
	const sets = useMemo(
		() => focusSets(workouts, monday, addDays(monday, 7)),
		[workouts, monday],
	);
	const onTarget = FOCUS_TARGETS.filter((t) => sets[t.id] >= t.min).length;

	return (
		<Card>
			<Row style={{ justifyContent: "space-between" }}>
				<T variant="label">V-TAPER FOCUS · THIS WEEK</T>
				<T
					variant="label"
					style={{
						color:
							onTarget === FOCUS_TARGETS.length ? colors.accent : colors.muted,
					}}
				>
					{onTarget}/{FOCUS_TARGETS.length} ON TARGET
				</T>
			</Row>
			<View style={{ marginTop: 12, gap: compact ? 8 : 12 }}>
				{FOCUS_TARGETS.map((t) => {
					const done = sets[t.id];
					const hit = done >= t.min;
					const over = done > t.max;
					// The bar fills to the top of the target range; the tick marks where "enough" starts.
					const fill = Math.min(1, done / t.max);
					return (
						<View key={t.id} style={styles.focusRow}>
							<T style={styles.focusName}>{t.name}</T>
							<View style={styles.focusTrack}>
								<View
									style={{
										width: `${fill * 100}%`,
										height: 10,
										borderRadius: 3,
										backgroundColor: hit ? colors.accent : colors.textSoft,
										opacity: hit ? 1 : 0.55,
									}}
								/>
								<View
									style={[
										styles.minTick,
										{ left: `${(t.min / t.max) * 100}%` },
									]}
								/>
							</View>
							<T
								style={[
									styles.focusValue,
									{ color: over ? colors.streak : colors.text },
								]}
							>
								{done}
								<T style={styles.focusTarget}>
									/{t.min}–{t.max}
								</T>
							</T>
						</View>
					);
				})}
			</View>
			{compact ? null : (
				<T variant="small" style={{ marginTop: 12 }}>
					Working sets, warm-ups excluded. Rows and pulldowns count for lats,
					incline presses for upper chest. Over the range shows orange — more
					isn't better past it.
				</T>
			)}
		</Card>
	);
}

const styles = StyleSheet.create({
	ratio: {
		fontFamily: fonts.displayBold,
		fontSize: 52,
		lineHeight: 56,
		letterSpacing: -1.5,
		color: colors.text,
	},
	track: {
		marginTop: 10,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.control,
		overflow: "hidden",
	},
	fill: { height: 8, borderRadius: 4, backgroundColor: colors.accent },
	metric: {
		flex: 1,
		gap: 4,
		padding: 10,
		borderRadius: 12,
		backgroundColor: colors.bg,
	},
	focusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
	focusName: {
		width: 84,
		fontFamily: fonts.body,
		fontSize: 13,
		color: colors.textSoft,
	},
	focusTrack: {
		flex: 1,
		height: 10,
		borderRadius: 3,
		backgroundColor: colors.hairline,
		justifyContent: "center",
	},
	minTick: {
		position: "absolute",
		width: 2,
		height: 14,
		marginLeft: -1,
		borderRadius: 1,
		backgroundColor: colors.muted,
	},
	focusValue: {
		width: 62,
		textAlign: "right",
		fontFamily: fonts.monoMedium,
		fontSize: 13,
	},
	focusTarget: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
});
