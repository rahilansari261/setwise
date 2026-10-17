import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button, Card, IconButton, Row, Screen, T } from "@/src/components/ui";
import { CATEGORY_COLOR } from "@/src/data/exercises";
import { fmt } from "@/src/lib/calc";
import {
	fromISO,
	monthName,
	shortDate,
	todayISO,
	toISO,
} from "@/src/lib/dates";
import { dayStats, hasLogged } from "@/src/lib/stats";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

const HEAD = ["M", "T", "W", "T", "F", "S", "S"];

export default function CalendarScreen() {
	const router = useRouter();
	const { workouts, setCurrentDate, settings } = useWorkouts();
	const today = todayISO();
	const [cursor, setCursor] = useState(() => {
		const d = new Date();
		return { y: d.getFullYear(), m: d.getMonth() };
	});
	const [selected, setSelected] = useState(today);

	const cells = useMemo(() => {
		const first = new Date(cursor.y, cursor.m, 1);
		const lead = (first.getDay() + 6) % 7;
		const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
		const out: (string | null)[] = Array.from({ length: lead }, () => null);
		for (let d = 1; d <= daysInMonth; d++)
			out.push(toISO(new Date(cursor.y, cursor.m, d)));
		while (out.length % 7) out.push(null);
		return out;
	}, [cursor]);

	const monthStats = useMemo(() => {
		let sessions = 0;
		let volume = 0;
		for (const iso of cells) {
			if (!iso || !hasLogged(workouts[iso])) continue;
			sessions++;
			volume += dayStats(workouts[iso]).volume;
		}
		return { sessions, volume };
	}, [cells, workouts]);

	const shift = (delta: number) =>
		setCursor(({ y, m }) => {
			const d = new Date(y, m + delta, 1);
			return { y: d.getFullYear(), m: d.getMonth() };
		});

	const day = workouts[selected];
	const stats = dayStats(day);

	return (
		<Screen bottomInset={32}>
			<T variant="label">CALENDAR</T>
			<Row style={{ marginTop: 4 }}>
				<T variant="display" style={{ flex: 1 }}>
					{monthName(cursor.m)} {cursor.y}
				</T>
				<IconButton
					icon={ChevronLeft}
					label="Previous month"
					onPress={() => shift(-1)}
				/>
				<IconButton
					icon={ChevronRight}
					label="Next month"
					onPress={() => shift(1)}
				/>
			</Row>
			<T variant="small" style={{ marginTop: 4 }}>
				{monthStats.sessions}{" "}
				{monthStats.sessions === 1 ? "session" : "sessions"} ·{" "}
				{fmt(monthStats.volume, 0)} {settings.unit} moved
			</T>

			<View style={styles.grid}>
				{HEAD.map((h, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed weekday header, position is the identity
					<T key={`${h}-${i}`} style={styles.head}>
						{h}
					</T>
				))}
				{cells.map((iso, i) => {
					// biome-ignore lint/suspicious/noArrayIndexKey: blank padding cells have no date to key on
					if (!iso) return <View key={`e-${i}`} style={styles.cell} />;
					const logged = hasLogged(workouts[iso]);
					const isSel = iso === selected;
					const isToday = iso === today;
					const cats = [
						...new Set(
							workouts[iso]?.exercises
								.filter((e) => e.sets.some((s) => s.completed))
								.map((e) => e.category) ?? [],
						),
					].slice(0, 3);
					return (
						<Pressable
							key={iso}
							accessibilityRole="button"
							accessibilityLabel={`${shortDate(iso)}${logged ? ", workout logged" : ""}`}
							onPress={() => setSelected(iso)}
							style={[
								styles.cell,
								isSel && {
									backgroundColor: colors.surface,
									borderColor: colors.accent,
									borderWidth: 1.5,
								},
								!isSel &&
									isToday && { borderColor: colors.border, borderWidth: 1 },
							]}
						>
							<T
								style={{
									fontFamily: fonts.monoMedium,
									fontSize: 14,
									color:
										iso > today
											? colors.faint
											: logged
												? colors.text
												: colors.muted,
								}}
							>
								{fromISO(iso).getDate()}
							</T>
							<View style={{ flexDirection: "row", gap: 2, height: 5 }}>
								{logged
									? cats.map((c) => (
											<View
												key={c}
												style={[
													styles.dot,
													{ backgroundColor: CATEGORY_COLOR[c] },
												]}
											/>
										))
									: null}
							</View>
						</Pressable>
					);
				})}
			</View>

			<Card style={{ marginTop: 16 }}>
				<T variant="label">{shortDate(selected).toUpperCase()}</T>
				{stats.exercises > 0 ? (
					<>
						<T variant="heading" style={{ marginTop: 6 }}>
							{day?.title ??
								`${stats.exercises} exercise${stats.exercises > 1 ? "s" : ""}`}
						</T>
						<T variant="small" style={{ marginTop: 2 }}>
							{stats.done} {stats.done === 1 ? "set" : "sets"} ·{" "}
							{fmt(stats.volume, 0)} {settings.unit}
						</T>
						<View style={{ marginTop: 10, gap: 4 }}>
							{day?.exercises.map((we) => (
								<Row key={we.id} gap={8}>
									<View
										style={[
											styles.dot,
											{
												backgroundColor: CATEGORY_COLOR[we.category],
												width: 6,
												height: 6,
											},
										]}
									/>
									<T style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
										{we.exerciseName}
									</T>
									<T
										style={{
											fontFamily: fonts.mono,
											fontSize: 12,
											color: colors.muted,
										}}
									>
										{we.sets.filter((s) => s.completed).length}/{we.sets.length}
									</T>
								</Row>
							))}
						</View>
					</>
				) : (
					<T variant="small" style={{ marginTop: 6 }}>
						{selected === today
							? "Nothing logged yet today."
							: selected > today
								? "Nothing planned for this day yet."
								: "Rest day — nothing logged."}
					</T>
				)}
				<Button
					title={stats.exercises > 0 ? "Open workout" : "Log a workout"}
					variant="secondary"
					compact
					style={{ marginTop: 14 }}
					onPress={() => {
						setCurrentDate(selected);
						router.navigate("/");
					}}
				/>
			</Card>
		</Screen>
	);
}

const styles = StyleSheet.create({
	grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
	head: {
		width: `${100 / 7}%`,
		textAlign: "center",
		fontFamily: fonts.mono,
		fontSize: 10,
		color: colors.muted,
		paddingBottom: 8,
	},
	cell: {
		width: `${100 / 7}%`,
		height: 48,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	dot: { width: 5, height: 5, borderRadius: 3 },
});
