import { useRouter } from "expo-router";
import {
	CalendarPlus,
	ChevronLeft,
	ChevronRight,
	CircleCheck,
	Flame,
	ListPlus,
	MoonStar,
	Plus,
	Settings,
	SkipForward,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { DatePickSheet } from "@/src/components/date-pick-sheet";
import { ExerciseCard } from "@/src/components/exercise-card";
import { FinishSheet } from "@/src/components/finish-sheet";
import { Button, Card, IconButton, Row, Screen, T } from "@/src/components/ui";
import { fmt, fmtDuration } from "@/src/lib/calc";
import {
	addDays,
	addDays as addDaysISO,
	fromISO,
	headerDate,
	startOfWeek,
	todayISO,
} from "@/src/lib/dates";
import { dayStats, hasLogged, weekStreak } from "@/src/lib/stats";
import { useExtras } from "@/src/state/extras";
import { useT } from "@/src/state/i18n";
import { useToast } from "@/src/state/toast";
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

	const t = useT();
	const extras = useExtras();
	const toast = useToast();
	const [finishOpen, setFinishOpen] = useState(false);
	const [scheduleOpen, setScheduleOpen] = useState(false);
	const [moveFrom, setMoveFrom] = useState<string | null>(null);

	const plan = extras.planned[date];
	const planRoutine = plan
		? store.routines.find((r) => r.id === plan.routineId)
		: undefined;
	const planDay = planRoutine?.days[plan?.dayIndex ?? 0];

	// Planned workouts from the last two weeks that were neither logged nor skipped.
	const missed = useMemo(
		() =>
			Object.entries(extras.planned)
				.filter(
					([d, p]) =>
						d < today &&
						d >= addDaysISO(today, -14) &&
						!p.skipped &&
						!hasLogged(workouts[d]),
				)
				.sort(([a], [b]) => b.localeCompare(a)),
		[extras.planned, workouts, today],
	);

	const gym = extras.gyms.find(
		(g) => g.id === (day?.gymId ?? settings.activeGymId),
	);
	const barWeight = gym?.barWeight ?? settings.defaultBarbellWeight;

	const doPlanned = (planDate: string, p: typeof plan) => {
		if (!p) return;
		store.startRoutineDay(date, p.routineId, p.dayIndex);
		extras.clearPlan(planDate);
	};

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
					label={t("Volume").toUpperCase()}
					value={fmt(stats.volume, 0)}
					unit={` ${settings.unit}`}
				/>
				<Stat
					label={t("Sets").toUpperCase()}
					value={String(stats.done)}
					unit={`/${stats.total}`}
					divider
				/>
				<Stat
					label={t("Time").toUpperCase()}
					value={stats.durationSec ? fmtDuration(stats.durationSec) : "—"}
					divider
				/>
			</View>

			{stats.exercises === 0 ? (
				<View style={{ gap: 10, marginTop: 14 }}>
					{day?.restDay ? (
						<Card>
							<Row gap={10}>
								<MoonStar size={20} color={colors.accent} />
								<T variant="heading">{t("Rest day")}</T>
							</Row>
							<T variant="small" style={{ marginTop: 6 }}>
								Recovery is where the gains happen. Sleep, eat, come back
								stronger.
							</T>
							<Button
								title="Actually, I'll train"
								variant="secondary"
								compact
								style={{ marginTop: 12 }}
								onPress={() => store.setRestDay(date, false)}
							/>
						</Card>
					) : null}

					{date === today && missed.length > 0 && !day?.restDay
						? missed.slice(0, 2).map(([d, p]) => {
								const r = store.routines.find((x) => x.id === p.routineId);
								const rd = r?.days[p.dayIndex];
								if (!r || !rd) return null;
								return (
									<Card key={d} style={{ borderColor: colors.streak }}>
										<T variant="label" style={{ color: colors.streak }}>
											MISSED · {headerDate(d)}
										</T>
										<T variant="heading" style={{ marginTop: 4 }}>
											{rd.name}
										</T>
										<Row gap={8} style={{ marginTop: 12 }}>
											<Button
												title={t("Do it now")}
												compact
												style={{ flex: 1 }}
												onPress={() => doPlanned(d, p)}
											/>
											<Button
												title={t("Move")}
												variant="secondary"
												compact
												style={{ flex: 1 }}
												onPress={() => setMoveFrom(d)}
											/>
											<Button
												title={t("Skip")}
												variant="secondary"
												compact
												style={{ flex: 1 }}
												onPress={() =>
													extras.planWorkout(d, { ...p, skipped: true })
												}
											/>
										</Row>
									</Card>
								);
							})
						: null}

					{plan && !plan.skipped && planRoutine && planDay && !day?.restDay ? (
						<Card active>
							<T variant="label" style={{ color: colors.accent }}>
								PLANNED {date === today ? "FOR TODAY" : `· ${headerDate(date)}`}
							</T>
							<T variant="title" style={{ marginTop: 6 }}>
								{planDay.name}
							</T>
							<T variant="small" style={{ marginTop: 6 }}>
								{planRoutine.name}
							</T>
							<Row gap={8} style={{ marginTop: 14 }}>
								<Button
									title={t("Start")}
									style={{ flex: 1 }}
									onPress={() => doPlanned(date, plan)}
								/>
								<Button
									title={t("Move")}
									variant="secondary"
									style={{ flex: 1 }}
									onPress={() => setMoveFrom(date)}
								/>
							</Row>
						</Card>
					) : null}

					{!day?.restDay && !plan && nextDay && routine ? (
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
							<Row gap={8} style={{ marginTop: 8 }}>
								<Button
									title={t("Skip day")}
									icon={SkipForward}
									variant="secondary"
									compact
									style={{ flex: 1 }}
									onPress={() => {
										store.skipRoutineDay();
										toast("Skipped — next day is up");
									}}
								/>
								<Button
									title={t("Schedule")}
									icon={CalendarPlus}
									variant="secondary"
									compact
									style={{ flex: 1 }}
									onPress={() => setScheduleOpen(true)}
								/>
							</Row>
						</Card>
					) : null}

					{!day?.restDay && !plan && !nextDay ? (
						<Card>
							<T variant="heading">
								Nothing logged{date === today ? " yet" : " on this day"}
							</T>
							<T variant="small" style={{ marginTop: 4 }}>
								Add exercises one by one, or load a day from a routine.
							</T>
						</Card>
					) : null}

					<Row gap={8}>
						<Button
							title={t("Add exercise")}
							icon={Plus}
							variant="secondary"
							compact
							style={{ flex: 1 }}
							onPress={() =>
								router.push({ pathname: "/add-exercise", params: { date } })
							}
						/>
						<Button
							title={t("Routines")}
							icon={ListPlus}
							variant="secondary"
							compact
							style={{ flex: 1 }}
							onPress={() =>
								router.push({ pathname: "/routines", params: { date } })
							}
						/>
					</Row>
					{!day?.restDay ? (
						<Button
							title={t("Mark as rest day")}
							icon={MoonStar}
							variant="ghost"
							compact
							onPress={() => store.setRestDay(date, true)}
						/>
					) : null}
				</View>
			) : (
				<View style={{ gap: 10, marginTop: 14 }}>
					{day?.finished ? (
						<Card active>
							<Row gap={10}>
								<CircleCheck size={20} color={colors.accent} />
								<View style={{ flex: 1 }}>
									<T variant="heading">{t("Workout finished")}</T>
									<T variant="small">
										{[
											day.finished.activity,
											day.finished.durationMin
												? `${day.finished.durationMin} min`
												: null,
											day.finished.rpe ? `RPE ${day.finished.rpe}` : null,
										]
											.filter(Boolean)
											.join(" · ")}
									</T>
								</View>
								<Button
									title="Edit"
									variant="secondary"
									compact
									onPress={() => setFinishOpen(true)}
								/>
							</Row>
						</Card>
					) : null}
					{day?.exercises.map((we, i, all) => {
						const group = we.supersetId;
						const next = all[i + 1];
						const inGroup = Boolean(group);
						let letter: string | undefined;
						if (group) {
							let n = 0;
							for (let j = i - 1; j >= 0 && all[j]?.supersetId === group; j--)
								n++;
							letter = String.fromCharCode(65 + n);
						}
						const tail = !(group && next?.supersetId === group);
						return (
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
								supersetLabel={inGroup ? letter : undefined}
								restAfterSet={tail}
								canLinkNext={
									Boolean(next) && !(group && next?.supersetId === group)
								}
								barWeight={barWeight}
								gymPlates={gym?.plates}
							/>
						);
					})}
					<Button
						title={t("Add exercise")}
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
						placeholder={t("Workout notes — how did it feel?")}
						placeholderTextColor={colors.faint}
						multiline
						style={styles.notes}
					/>
					{!day?.finished && stats.done > 0 ? (
						<Button
							title={t("Finish workout")}
							icon={CircleCheck}
							onPress={() => setFinishOpen(true)}
						/>
					) : null}
				</View>
			)}

			{finishOpen ? (
				<FinishSheet
					visible
					initial={day?.finished}
					suggestedMinutes={Math.round(stats.durationSec / 60)}
					onClose={() => setFinishOpen(false)}
					onSave={(info) => {
						store.finishWorkout(date, info);
						setFinishOpen(false);
						toast("Workout saved");
					}}
				/>
			) : null}
			<DatePickSheet
				visible={scheduleOpen}
				title="SCHEDULE THIS DAY FOR…"
				onClose={() => setScheduleOpen(false)}
				onPick={(d) => {
					if (!routine) return;
					extras.planWorkout(d, { routineId: routine.id, dayIndex: nextIndex });
					toast(`Scheduled for ${headerDate(d)}`);
				}}
			/>
			<DatePickSheet
				visible={moveFrom !== null}
				title="MOVE WORKOUT TO…"
				onClose={() => setMoveFrom(null)}
				onPick={(d) => {
					if (moveFrom) extras.movePlan(moveFrom, d);
					toast(`Moved to ${headerDate(d)}`);
				}}
			/>
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
