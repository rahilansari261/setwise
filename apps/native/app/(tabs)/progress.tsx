import { type Href, useRouter } from "expo-router";
import {
	Award,
	BarChart3,
	CalendarRange,
	Camera,
	HeartPulse,
	type LucideIcon,
	Ruler,
	Target,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ExerciseProgress } from "@/src/components/exercise-progress";
import { GroupBar } from "@/src/components/group-bar";
import { Chip, ProBadge, Screen, T } from "@/src/components/ui";
import { VTaperFigure } from "@/src/components/vtaper-figure";
import { fmt } from "@/src/lib/calc";
import { addDays, shortDate, todayISO } from "@/src/lib/dates";
import type { ProFeature } from "@/src/lib/pro";
import { countsAsWork } from "@/src/lib/sets";
import {
	CONDITIONING,
	conditioningWeek,
	setsPerGroup,
	VGROUPS,
} from "@/src/lib/vmuscle";
import {
	IDEAL_RATIO,
	progressToIdeal,
	stageOf,
	vtaperHistory,
} from "@/src/lib/vtaper";
import { useExtras } from "@/src/state/extras";
import { useT } from "@/src/state/i18n";
import { usePremium, useProGate } from "@/src/state/premium";
import { useGroupLookup } from "@/src/state/vgroups";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

const TILES: {
	href: Href;
	label: string;
	icon: LucideIcon;
	feature?: ProFeature;
}[] = [
	{ href: "/volume", label: "Weekly sets", icon: BarChart3 },
	{ href: "/achievements", label: "Achievements", icon: Award },
	{
		href: "/measurements",
		label: "Measurements",
		icon: Ruler,
		feature: "measurements",
	},
	{
		href: "/photos",
		label: "Check-in",
		icon: Camera,
		feature: "photos",
	},
	{ href: "/goals", label: "Goals", icon: Target, feature: "goals" },
	{
		href: "/recovery",
		label: "Recovery",
		icon: HeartPulse,
		feature: "recovery",
	},
	{
		href: "/recap",
		label: "Monthly recap",
		icon: CalendarRange,
		feature: "recap",
	},
];

export default function Progress() {
	const router = useRouter();
	const tr = useT();
	const { isPro } = usePremium();
	const gate = useProGate();
	const { workouts, personalRecords, settings } = useWorkouts();
	const { measurements } = useExtras();
	const lookup = useGroupLookup();
	const engine = useMemo(
		() => conditioningWeek(workouts, lookup, addDays(todayISO(), -6)),
		[workouts, lookup],
	);
	const weekSets = useMemo(
		() => setsPerGroup(workouts, lookup, addDays(todayISO(), -6), countsAsWork),
		[workouts, lookup],
	);
	const vt = vtaperHistory(measurements).at(-1);
	const prevVt = vtaperHistory(measurements).at(-2);

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
				{tr("Your lifts")}
			</T>

			<Pressable
				accessibilityRole="button"
				accessibilityLabel="V-taper"
				onPress={() => router.push("/vtaper")}
				style={({ pressed }) => [styles.vt, pressed && { opacity: 0.8 }]}
			>
				<View style={{ flex: 1, gap: 4 }}>
					<T variant="label">V-TAPER</T>
					<T
						style={{ fontFamily: fonts.monoBold, fontSize: 34, lineHeight: 38 }}
					>
						{vt ? vt.ratio.toFixed(2) : "—"}
					</T>
					<T variant="small">
						{vt
							? `${stageOf(vt.ratio).name} · goal ${IDEAL_RATIO}${
									prevVt
										? ` · ${vt.ratio >= prevVt.ratio ? "+" : "−"}${Math.abs(vt.ratio - prevVt.ratio).toFixed(2)}`
										: ""
								}`
							: "Add shoulders and waist to see your score"}
					</T>
					<View style={styles.vtTrack}>
						<View
							style={[
								styles.vtFill,
								{
									width: `${Math.round(progressToIdeal(vt?.ratio ?? 0) * 100)}%`,
								},
							]}
						/>
					</View>
				</View>
				<View style={{ width: 96 }}>
					<VTaperFigure
						ratio={vt?.ratio ?? 0}
						ideal={IDEAL_RATIO}
						height={110}
					/>
				</View>
			</Pressable>

			<View style={styles.tiles}>
				{TILES.map((t, i) => {
					const Icon = t.icon;
					return (
						<Pressable
							key={t.label}
							accessibilityRole="button"
							accessibilityLabel={tr(t.label)}
							onPress={() =>
								t.feature
									? gate(t.feature, () => router.push(t.href))
									: router.push(t.href)
							}
							style={({ pressed }) => [
								styles.tile,
								// Seven tiles: the first spans the row so the rest pair up evenly.
								i === 0 && { width: "100%" },
								pressed && { opacity: 0.7 },
							]}
						>
							<Icon size={20} color={colors.accent} />
							<T style={styles.tileLabel} numberOfLines={1}>
								{tr(t.label)}
							</T>
							{t.feature && !isPro ? (
								<View style={{ position: "absolute", top: 8, right: 8 }}>
									<ProBadge />
								</View>
							) : null}
						</Pressable>
					);
				})}
			</View>

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

					<Pressable
						accessibilityRole="button"
						onPress={() => router.push("/volume")}
						style={{ marginTop: 28 }}
					>
						<T variant="label">THIS WEEK · SETS PER MUSCLE ›</T>
					</Pressable>
					<View style={{ marginTop: 12, gap: 14 }}>
						{VGROUPS.slice(0, 4).map((g) => (
							<GroupBar
								key={g.group}
								info={g}
								sets={weekSets.get(g.group) ?? 0}
							/>
						))}
					</View>
					<Pressable
						accessibilityRole="button"
						onPress={() => router.push("/volume")}
						style={styles.engine}
					>
						<T variant="label" style={{ flex: 1 }}>
							ENGINE
						</T>
						<T
							style={{
								fontFamily: fonts.monoBold,
								color:
									engine.sessions >= CONDITIONING.minSessions
										? colors.accent
										: colors.streak,
							}}
						>
							{`${engine.sessions} cardio · ${engine.minutes} min`}
						</T>
					</Pressable>

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
	engine: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 16,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.hairline,
		backgroundColor: colors.surface,
	},
	vt: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginTop: 16,
		padding: 16,
		borderRadius: 20,
		borderWidth: 1.5,
		borderColor: colors.accent,
		backgroundColor: colors.surface,
	},
	vtTrack: {
		height: 6,
		borderRadius: 3,
		backgroundColor: colors.hairline,
		marginTop: 6,
	},
	vtFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
	tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
	tile: {
		width: "48.5%",
		height: 68,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.hairline,
		backgroundColor: colors.surface,
		paddingHorizontal: 14,
		justifyContent: "center",
		gap: 6,
	},
	tileLabel: { fontFamily: fonts.bodyMedium, fontSize: 14 },
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
