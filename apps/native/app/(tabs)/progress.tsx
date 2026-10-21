import { type Href, useRouter } from "expo-router";
import {
	Award,
	CalendarRange,
	Camera,
	HeartPulse,
	Layers,
	type LucideIcon,
	Medal,
	Ruler,
	Target,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ExerciseProgress } from "@/src/components/exercise-progress";
import { Chip, ProBadge, Screen, T } from "@/src/components/ui";
import { CATEGORY_COLOR } from "@/src/data/exercises";
import { fmt } from "@/src/lib/calc";
import { addDays, shortDate, todayISO } from "@/src/lib/dates";
import type { ProFeature } from "@/src/lib/pro";
import { setsByCategory } from "@/src/lib/stats";
import { useT } from "@/src/state/i18n";
import { usePremium, useProGate } from "@/src/state/premium";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

const TILES: {
	href: Href;
	label: string;
	icon: LucideIcon;
	feature?: ProFeature;
}[] = [
	{ href: "/achievements", label: "Achievements", icon: Award },
	{
		href: "/measurements",
		label: "Measurements",
		icon: Ruler,
		feature: "measurements",
	},
	{
		href: "/photos",
		label: "Photos",
		icon: Camera,
		feature: "photos",
	},
	{ href: "/goals", label: "Goals", icon: Target, feature: "goals" },
	{
		href: "/strength",
		label: "Strength rank",
		icon: Medal,
		feature: "strength",
	},
	{
		href: "/recovery",
		label: "Recovery",
		icon: HeartPulse,
		feature: "recovery",
	},
	{ href: "/zones", label: "Training zones", icon: Layers, feature: "zones" },
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
				{tr("Your lifts")}
			</T>

			<View style={styles.tiles}>
				{TILES.map((t) => {
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
