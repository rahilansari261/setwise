import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
	ArrowDown,
	ArrowUp,
	Check,
	EllipsisVertical,
	History,
	StickyNote,
	Trash,
} from "lucide-react-native";
import { memo, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";

import { ActionSheet, T } from "@/src/components/ui";
import { CATEGORY_COLOR } from "@/src/data/exercises";
import { estimate1RM, fmt } from "@/src/lib/calc";
import { useRestTimerActions } from "@/src/state/rest-timer";
import { useToast } from "@/src/state/toast";
import {
	type LastPerformance,
	useWorkoutActions,
} from "@/src/state/workout-store";
import { colors, fonts, TAP } from "@/src/theme";
import type {
	Exercise,
	MetricType,
	Unit,
	WorkoutExercise,
	WorkoutSet,
} from "@/src/types";

const SET_LABEL: Record<WorkoutSet["setType"], string | null> = {
	normal: null,
	warmup: "W",
	drop: "D",
	failure: "F",
};

interface Columns {
	a: {
		label: string;
		field: "weight" | "distance" | "reps" | "timeSeconds";
	} | null;
	b: { label: string; field: "reps" | "timeSeconds" };
	showE1RM: boolean;
}

function columnsFor(metric: MetricType, unit: string): Columns {
	switch (metric) {
		case "reps_only":
			return { a: null, b: { label: "REPS", field: "reps" }, showE1RM: false };
		case "time_only":
			return {
				a: null,
				b: { label: "SEC", field: "timeSeconds" },
				showE1RM: false,
			};
		case "distance_time":
			return {
				a: { label: "KM", field: "distance" },
				b: { label: "SEC", field: "timeSeconds" },
				showE1RM: false,
			};
		default:
			return {
				a: { label: unit.toUpperCase(), field: "weight" },
				b: { label: "REPS", field: "reps" },
				showE1RM: true,
			};
	}
}

export const ExerciseCard = memo(function ExerciseCard({
	date,
	we,
	isFirst,
	isLast,
	exercise,
	last,
	unit,
	autoRest,
	vibration,
}: {
	date: string;
	we: WorkoutExercise;
	isFirst: boolean;
	isLast: boolean;
	exercise: Exercise | undefined;
	last: LastPerformance | null;
	unit: Unit;
	autoRest: boolean;
	vibration: boolean;
}) {
	const router = useRouter();
	const store = useWorkoutActions();
	const timer = useRestTimerActions();
	const toast = useToast();
	const [menuOpen, setMenuOpen] = useState(false);
	const [showNotes, setShowNotes] = useState(Boolean(we.notes));

	const cols = columnsFor(exercise?.metricType ?? "weight_reps", unit);
	const lastTop =
		last?.sets.filter((s) => s.setType !== "warmup").at(-1) ??
		last?.sets.at(-1);
	const done = we.sets.filter((s) => s.completed).length;

	const onToggle = (set: WorkoutSet) => {
		const result = store.toggleSet(date, we.id, set.id);
		if (!result.completed) return;
		if (vibration) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
		}
		if (result.isPR) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
				() => {},
			);
			toast(`New PR · ${we.exerciseName}`);
		}
		if (autoRest) timer.start(undefined, we.exerciseName);
	};

	const fillFromLast = () => {
		if (!last) return;
		const working = last.sets;
		we.sets.forEach((set, i) => {
			const src = working[i];
			if (src && !set.completed) {
				store.updateSet(date, we.id, set.id, {
					weight: src.weight,
					reps: src.reps,
					distance: src.distance,
					timeSeconds: src.timeSeconds,
					setType: src.setType,
				});
			}
		});
	};

	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<View style={{ flex: 1, gap: 4 }}>
					<Pressable
						onPress={() => router.push(`/exercise/${we.exerciseId}`)}
						accessibilityRole="link"
					>
						<T variant="heading" style={{ fontSize: 18 }}>
							{we.exerciseName}
						</T>
					</Pressable>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
						<View
							style={[
								styles.dot,
								{ backgroundColor: CATEGORY_COLOR[we.category] },
							]}
						/>
						<T variant="label" style={{ fontSize: 10, letterSpacing: 1 }}>
							{we.category}
							{lastTop && cols.a?.field === "weight"
								? ` · LAST ${fmt(lastTop.weight)} × ${lastTop.reps}`
								: ""}
						</T>
					</View>
				</View>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`${we.exerciseName} options`}
					onPress={() => setMenuOpen(true)}
					style={styles.menuBtn}
				>
					<EllipsisVertical size={20} color={colors.muted} />
				</Pressable>
			</View>

			<View style={[styles.grid, styles.gridHead]}>
				<T variant="label" style={[styles.headSet, styles.headText]}>
					SET
				</T>
				{cols.a ? (
					<T variant="label" style={[styles.colNum, styles.headText]}>
						{cols.a.label}
					</T>
				) : null}
				<T variant="label" style={[styles.colNum, styles.headText]}>
					{cols.b.label}
				</T>
				{cols.showE1RM ? (
					<T
						variant="label"
						style={[styles.colE1, styles.headText, { textTransform: "none" }]}
					>
						e1RM
					</T>
				) : null}
				<T variant="label" style={[styles.headCheck, styles.headText]}>
					{done}/{we.sets.length}
				</T>
			</View>

			{we.sets.map((set) => (
				<SetRow
					key={set.id}
					set={set}
					cols={cols}
					onChange={(patch) => {
						store.updateSet(date, we.id, set.id, patch);
						// A weight typed into a set carries down to later unlogged sets that were empty or matched it,
						// so typing "6" then "60" doesn't strand them at 6.
						if (patch.weight !== undefined && patch.weight > 0) {
							for (const later of we.sets.slice(set.setNumber)) {
								if (
									!later.completed &&
									(!later.weight || later.weight === set.weight)
								) {
									store.updateSet(date, we.id, later.id, {
										weight: patch.weight,
									});
								}
							}
						}
					}}
					onToggle={() => onToggle(set)}
					onCycleType={() => store.cycleSetType(date, we.id, set.id)}
					onDelete={() =>
						Alert.alert(`Delete set ${set.setNumber}?`, undefined, [
							{ text: "Cancel", style: "cancel" },
							{
								text: "Delete",
								style: "destructive",
								onPress: () => store.deleteSet(date, we.id, set.id),
							},
						])
					}
				/>
			))}

			{showNotes ? (
				<TextInput
					value={we.notes ?? ""}
					onChangeText={(t) => store.setExerciseNotes(date, we.id, t)}
					placeholder="Notes for this exercise"
					placeholderTextColor={colors.faint}
					multiline
					style={styles.notes}
				/>
			) : null}

			<View style={styles.footer}>
				<Pressable
					accessibilityRole="button"
					onPress={() => store.addSet(date, we.id)}
					style={styles.footBtn}
				>
					<T style={styles.footText}>+ Add set</T>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					onPress={fillFromLast}
					disabled={!last}
					style={[styles.footBtn, !last && { opacity: 0.4 }]}
				>
					<T style={styles.footText}>Last session</T>
				</Pressable>
			</View>

			<ActionSheet
				visible={menuOpen}
				title={we.exerciseName}
				onClose={() => setMenuOpen(false)}
				actions={[
					{
						label: "History & records",
						icon: History,
						onPress: () => router.push(`/exercise/${we.exerciseId}`),
					},
					{
						label: showNotes ? "Hide notes" : "Add notes",
						icon: StickyNote,
						onPress: () => setShowNotes(!showNotes),
					},
					...(isFirst
						? []
						: [
								{
									label: "Move up",
									icon: ArrowUp,
									onPress: () => store.moveExercise(date, we.id, -1),
								},
							]),
					...(isLast
						? []
						: [
								{
									label: "Move down",
									icon: ArrowDown,
									onPress: () => store.moveExercise(date, we.id, 1),
								},
							]),
					{
						label: "Remove exercise",
						icon: Trash,
						destructive: true,
						onPress: () =>
							Alert.alert(
								`Remove ${we.exerciseName}?`,
								"Its sets for this day will be deleted.",
								[
									{ text: "Cancel", style: "cancel" },
									{
										text: "Remove",
										style: "destructive",
										onPress: () => store.removeExercise(date, we.id),
									},
								],
							),
					},
				]}
			/>
		</View>
	);
});

function SetRow({
	set,
	cols,
	onChange,
	onToggle,
	onCycleType,
	onDelete,
}: {
	set: WorkoutSet;
	cols: Columns;
	onChange: (patch: Partial<WorkoutSet>) => void;
	onToggle: () => void;
	onCycleType: () => void;
	onDelete: () => void;
}) {
	const typeLabel = SET_LABEL[set.setType];
	const muted = set.setType === "warmup";
	const e1rm = cols.showE1RM && !muted ? estimate1RM(set.weight, set.reps) : 0;
	return (
		<View style={[styles.grid, styles.row]}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Set ${set.setNumber}, ${set.setType}. Tap to change type, hold to delete.`}
				onPress={onCycleType}
				onLongPress={onDelete}
				style={styles.colSet}
			>
				<T
					style={{
						fontFamily: fonts.monoMedium,
						fontSize: 13,
						color: typeLabel
							? set.setType === "warmup"
								? colors.muted
								: colors.streak
							: colors.muted,
					}}
				>
					{typeLabel ?? set.setNumber}
				</T>
			</Pressable>
			{cols.a ? (
				<View
					style={[
						styles.colNum,
						{ flexDirection: "row", alignItems: "center", gap: 4 },
					]}
				>
					<NumberCell
						grow
						value={set[cols.a.field] ?? 0}
						onCommit={(v) => onChange({ [cols.a?.field ?? "weight"]: v })}
						completed={set.completed}
						muted={muted}
						label={`${cols.a.label} for set ${set.setNumber}`}
					/>
					{set.isPersonalRecord ? (
						<View style={styles.pr}>
							<T style={styles.prText}>PR</T>
						</View>
					) : null}
				</View>
			) : null}
			<View style={styles.colNum}>
				<NumberCell
					value={set[cols.b.field] ?? 0}
					onCommit={(v) => onChange({ [cols.b.field]: v })}
					completed={set.completed}
					muted={muted}
					integer
					label={`${cols.b.label} for set ${set.setNumber}`}
				/>
			</View>
			{cols.showE1RM ? (
				<T
					style={[
						styles.colE1,
						{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
					]}
				>
					{e1rm ? fmt(e1rm) : "—"}
				</T>
			) : null}
			<Pressable
				accessibilityRole="checkbox"
				accessibilityState={{ checked: set.completed }}
				accessibilityLabel={`Log set ${set.setNumber}`}
				onPress={onToggle}
				style={styles.colCheck}
			>
				<View
					style={[
						styles.check,
						set.completed ? styles.checkOn : styles.checkOff,
					]}
				>
					{set.completed ? (
						<Check size={15} color={colors.accentInk} strokeWidth={3} />
					) : null}
				</View>
			</Pressable>
		</View>
	);
}

/** Keeps its own text while typing so "82." or an empty field don't get clobbered by re-renders. */
function NumberCell({
	value,
	onCommit,
	completed,
	muted,
	integer,
	label,
	grow,
}: {
	grow?: boolean;
	value: number;
	onCommit: (v: number) => void;
	completed: boolean;
	muted: boolean;
	integer?: boolean;
	label: string;
}) {
	const [text, setText] = useState(value ? String(value) : "");
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		if (!editing) setText(value ? String(value) : "");
	}, [value, editing]);

	// Logged sets show plain text and only become an input when tapped. Fewer live EditTexts keeps
	// long workouts fast on older phones and avoids Android's text clipping on restyled inputs.
	if (completed && !editing) {
		return (
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`${label}: ${value || 0}. Tap to edit.`}
				onPress={() => setEditing(true)}
				style={[styles.doneCell, grow && { flex: 1 }]}
			>
				<T
					style={[
						styles.doneText,
						{ color: muted ? colors.muted : colors.text },
					]}
				>
					{value ? String(value) : "0"}
				</T>
			</Pressable>
		);
	}

	return (
		<TextInput
			accessibilityLabel={label}
			value={text}
			autoFocus={editing}
			onChangeText={(t) => {
				const clean = t.replace(",", ".");
				setText(clean);
				const n = integer
					? Number.parseInt(clean, 10)
					: Number.parseFloat(clean);
				onCommit(Number.isFinite(n) ? n : 0);
			}}
			onFocus={() => setEditing(true)}
			onBlur={() => setEditing(false)}
			keyboardType={integer ? "number-pad" : "decimal-pad"}
			selectTextOnFocus
			placeholder="0"
			placeholderTextColor={colors.faint}
			selectionColor={colors.accent}
			maxFontSizeMultiplier={1.15}
			style={[
				styles.input,
				grow && { flex: 1 },
				editing && { borderColor: colors.accent },
				{ color: muted ? colors.muted : colors.text },
			]}
		/>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.surface,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: colors.hairline,
		paddingTop: 12,
		paddingHorizontal: 12,
		paddingBottom: 8,
	},
	header: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
	dot: { width: 6, height: 6, borderRadius: 3 },
	menuBtn: {
		width: TAP,
		height: TAP,
		marginTop: -8,
		marginRight: -8,
		alignItems: "center",
		justifyContent: "center",
	},
	grid: { flexDirection: "row", alignItems: "center", gap: 6 },
	gridHead: {
		marginTop: 8,
		paddingBottom: 6,
		borderBottomWidth: 1,
		borderBottomColor: "#23272F",
	},
	headText: { fontSize: 10, letterSpacing: 1 },
	row: { minHeight: 48 },
	colSet: { width: 30, height: TAP, justifyContent: "center" },
	headSet: { width: 30 },
	headCheck: { width: TAP, textAlign: "center" },
	colNum: { flex: 1 },
	colE1: { width: 46 },
	colCheck: {
		width: TAP,
		height: TAP,
		alignItems: "center",
		justifyContent: "center",
	},
	input: {
		height: 38,
		minWidth: 0,
		borderRadius: 10,
		borderWidth: 1.5,
		borderColor: "#2E333C",
		backgroundColor: colors.bg,
		paddingHorizontal: 8,
		paddingVertical: 0,
		textAlignVertical: "center",
		includeFontPadding: false,
		fontFamily: fonts.monoMedium,
		fontSize: 16,
	},
	doneCell: { height: 38, justifyContent: "center", paddingHorizontal: 9.5 },
	doneText: { fontFamily: fonts.monoMedium, fontSize: 16 },
	check: {
		width: 26,
		height: 26,
		borderRadius: 13,
		alignItems: "center",
		justifyContent: "center",
	},
	checkOn: { backgroundColor: colors.accent },
	checkOff: { borderWidth: 2, borderColor: "#3A3F48" },
	pr: {
		paddingHorizontal: 4,
		paddingVertical: 2,
		borderRadius: 5,
		backgroundColor: colors.streakTint,
	},
	prText: { fontFamily: fonts.monoBold, fontSize: 9, color: colors.streak },
	notes: {
		marginTop: 8,
		minHeight: 44,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: 12,
		paddingVertical: 10,
		color: colors.text,
		fontFamily: fonts.body,
		fontSize: 14,
	},
	footer: { flexDirection: "row", gap: 8, marginTop: 6 },
	footBtn: {
		flex: 1,
		height: TAP,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#2E333C",
		alignItems: "center",
		justifyContent: "center",
	},
	footText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
});
