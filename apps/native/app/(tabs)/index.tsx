import { useRouter } from "expo-router";
import {
	ChevronLeft,
	ChevronRight,
	Flame,
	ListPlus,
	Plus,
	Settings,
} from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { ExerciseCard } from "@/src/components/exercise-card";
import { Button, Card, IconButton, Row, Screen, T } from "@/src/components/ui";
import { fmt, fmtDuration } from "@/src/lib/calc";
import {
	addDays,
	fromISO,
	headerDate,
	startOfWeek,
	todayISO,
} from "@/src/lib/dates";
import { dayStats, hasLogged, weekStreak } from "@/src/lib/stats";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts, TAP } from "@/src/theme";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function Today() {
	const router = useRouter();
	const store = useWorkouts();
	const { currentDate: date, setCurrentDate, workouts, settings } = store;
	const today = todayISO();
	const day = workouts[date];
	const stats = dayStats(day);
	const streak = useMemo(() => weekStreak(workouts, today), [workouts, today]);
	const monday = startOfWeek(date);

	const routine = store.activeRoutine
		? store.routines.find((r) => r.id === store.activeRoutine?.routineId)
		: undefined;
	const nextIndex = routine
		? (store.activeRoutine?.nextDayIndex ?? 0) % routine.days.length
		: 0;
	const nextDay = routine?.days[nextIndex];

	const title = day?.title ?? (date === today ? "Today" : "Workout");

	return (
		<Screen bottomInset={32}>
			<Row style={{ alignItems: "flex-start" }} gap={10}>
				<View style={{ flex: 1, gap: 4 }}>
					<Row gap={8}>
						<T variant="label">{headerDate(date)}</T>
						{date !== today ? (
							<Pressable
								onPress={() => setCurrentDate(today)}
								hitSlop={10}
								accessibilityRole="button"
							>
								<T variant="label" style={{ color: colors.accent }}>
									· BACK TO TODAY
								</T>
							</Pressable>
						) : null}
					</Row>
					<T variant="display" numberOfLines={1}>
						{title}
					</T>
				</View>
				{streak > 0 ? (
					<View
						style={styles.streak}
						accessibilityLabel={`${streak} week streak`}
					>
						<Flame size={15} color={colors.streak} />
						<T
							style={{
								fontFamily: fonts.monoBold,
								fontSize: 13,
								color: colors.streak,
							}}
						>
							{streak}W
						</T>
					</View>
				) : null}
				<IconButton
					icon={Settings}
					label="Settings"
					onPress={() => router.push("/settings")}
				/>
			</Row>

			<View style={styles.week}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Previous week"
					onPress={() => setCurrentDate(addDays(date, -7))}
					style={styles.weekArrow}
				>
					<ChevronLeft size={16} color={colors.muted} />
				</Pressable>
				{LETTERS.map((letter, i) => {
					const d = addDays(monday, i);
					const selected = d === date;
					const logged = hasLogged(workouts[d]);
					return (
						<Pressable
							key={d}
							accessibilityRole="button"
							accessibilityState={{ selected }}
							onPress={() => setCurrentDate(d)}
							style={[
								styles.dayCell,
								selected && { backgroundColor: colors.surface },
							]}
						>
							<T style={styles.dayLetter}>{letter}</T>
							<T
								style={{
									fontFamily: fonts.monoMedium,
									fontSize: 15,
									color: selected
										? colors.text
										: d > today
											? colors.faint
											: colors.textSoft,
								}}
							>
								{fromISO(d).getDate()}
							</T>
							<View
								style={[
									styles.dayMark,
									{
										backgroundColor: selected
											? colors.accent
											: logged
												? colors.faint
												: "transparent",
									},
								]}
							/>
						</Pressable>
					);
				})}
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Next week"
					onPress={() => setCurrentDate(addDays(date, 7))}
					style={styles.weekArrow}
				>
					<ChevronRight size={16} color={colors.muted} />
				</Pressable>
			</View>

			<View style={styles.stats}>
				<Stat
					label="VOLUME"
					value={fmt(stats.volume, 0)}
					unit={` ${settings.unit}`}
				/>
				<Stat
					label="SETS"
					value={String(stats.done)}
					unit={`/${stats.total}`}
					divider
				/>
				<Stat
					label="TIME"
					value={stats.durationSec ? fmtDuration(stats.durationSec) : "—"}
					divider
				/>
			</View>

			{stats.exercises === 0 ? (
				<View style={{ gap: 10, marginTop: 14 }}>
					{nextDay && routine ? (
						<Card>
							<T variant="label">UP NEXT · {routine.name}</T>
							<T variant="title" style={{ marginTop: 6 }}>
								{nextDay.name}
							</T>
							<T variant="small" style={{ marginTop: 6 }} numberOfLines={3}>
								{nextDay.exerciseIds
									.map((id) => store.exerciseById.get(id)?.name)
									.filter(Boolean)
									.join(" · ")}
							</T>
							<Button
								title={`Start ${nextDay.name}`}
								style={{ marginTop: 14 }}
								onPress={() =>
									store.startRoutineDay(date, routine.id, nextIndex)
								}
							/>
						</Card>
					) : (
						<Card>
							<T variant="heading">
								Nothing logged{date === today ? " yet" : " on this day"}
							</T>
							<T variant="small" style={{ marginTop: 4 }}>
								Add exercises one by one, or load a day from a routine.
							</T>
						</Card>
					)}
					<Row gap={8}>
						<Button
							title="Add exercise"
							icon={Plus}
							variant="secondary"
							compact
							style={{ flex: 1 }}
							onPress={() =>
								router.push({ pathname: "/add-exercise", params: { date } })
							}
						/>
						<Button
							title="Routines"
							icon={ListPlus}
							variant="secondary"
							compact
							style={{ flex: 1 }}
							onPress={() =>
								router.push({ pathname: "/routines", params: { date } })
							}
						/>
					</Row>
				</View>
			) : (
				<View style={{ gap: 10, marginTop: 14 }}>
					{day?.exercises.map((we, i, all) => (
						<ExerciseCard
							key={we.id}
							date={date}
							we={we}
							isFirst={i === 0}
							isLast={i === all.length - 1}
							exercise={store.exerciseById.get(we.exerciseId)}
							last={store.lastPerformance(we.exerciseId, date)}
							unit={settings.unit}
							autoRest={settings.autoRestTimer}
							vibration={settings.vibrationEnabled}
						/>
					))}
					<Button
						title="Add exercise"
						icon={Plus}
						variant="secondary"
						compact
						onPress={() =>
							router.push({ pathname: "/add-exercise", params: { date } })
						}
					/>
					<TextInput
						value={day?.notes ?? ""}
						onChangeText={(t) => store.setDayNotes(date, t)}
						placeholder="Workout notes — how did it feel?"
						placeholderTextColor={colors.faint}
						multiline
						style={styles.notes}
					/>
				</View>
			)}
		</Screen>
	);
}

function Stat({
	label,
	value,
	unit,
	divider,
}: {
	label: string;
	value: string;
	unit?: string;
	divider?: boolean;
}) {
	return (
		<View
			style={[
				styles.stat,
				divider && {
					borderLeftWidth: 1,
					borderLeftColor: colors.hairline,
					paddingLeft: 12,
				},
			]}
		>
			<T variant="label" style={{ fontSize: 10 }}>
				{label}
			</T>
			<T
				variant="mono"
				style={{ fontSize: 20 }}
				numberOfLines={1}
				adjustsFontSizeToFit
			>
				{value}
				{unit ? (
					<T
						style={{
							fontFamily: fonts.mono,
							fontSize: 12,
							color: colors.muted,
						}}
					>
						{unit}
					</T>
				) : null}
			</T>
		</View>
	);
}

const styles = StyleSheet.create({
	streak: {
		height: 34,
		paddingHorizontal: 10,
		borderRadius: 17,
		backgroundColor: colors.streakTint,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 4,
	},
	week: { flexDirection: "row", alignItems: "center", marginTop: 14 },
	weekArrow: {
		width: 24,
		height: TAP,
		alignItems: "center",
		justifyContent: "center",
	},
	dayCell: {
		flex: 1,
		height: 54,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
	},
	dayLetter: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
	dayMark: { width: 14, height: 3, borderRadius: 2 },
	stats: {
		flexDirection: "row",
		marginTop: 12,
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: colors.hairline,
	},
	stat: { flex: 1, paddingVertical: 10, gap: 4 },
	notes: {
		minHeight: 56,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: colors.text,
		fontFamily: fonts.body,
		fontSize: 14,
		textAlignVertical: "top",
	},
});
