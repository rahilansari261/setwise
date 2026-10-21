import { Trash } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Button, Chip, Row, Sheet, T } from "@/src/components/ui";
import { calculatePlates, fmt } from "@/src/lib/calc";
import { DUMBBELL_MODES, RPE_LEVELS, SET_TYPES } from "@/src/lib/sets";
import { colors, fonts } from "@/src/theme";
import type { DumbbellMode, SetType, Unit, WorkoutSet } from "@/src/types";

/** Change a set's type and RPE, or delete it. Opened by tapping the set number. */
export function SetSheet({
	set,
	onClose,
	onType,
	onRpe,
	onDelete,
}: {
	set: WorkoutSet | null;
	onClose: () => void;
	onType: (type: SetType) => void;
	onRpe: (rpe: number | undefined) => void;
	onDelete: () => void;
}) {
	return (
		<Sheet
			visible={set !== null}
			title={set ? `SET ${set.setNumber}` : undefined}
			onClose={onClose}
		>
			<View style={styles.grid}>
				{SET_TYPES.map((t) => {
					const on = set?.setType === t.type;
					return (
						<Pressable
							key={t.type}
							accessibilityRole="button"
							accessibilityState={{ selected: on }}
							onPress={() => onType(t.type)}
							style={[styles.typeCell, on && styles.typeOn]}
						>
							<T
								style={{
									fontFamily: fonts.monoBold,
									fontSize: 15,
									color: on ? colors.accent : t.color,
								}}
							>
								{t.short || "•"}
							</T>
							<T style={styles.typeName} numberOfLines={1}>
								{t.name}
							</T>
						</Pressable>
					);
				})}
			</View>
			{set ? (
				<T variant="small" style={{ marginTop: 8 }}>
					{SET_TYPES.find((t) => t.type === set.setType)?.hint}
				</T>
			) : null}

			<T variant="label" style={{ marginTop: 18, marginBottom: 8 }}>
				EFFORT (RPE)
			</T>
			<Row gap={6} style={{ flexWrap: "wrap" }}>
				{RPE_LEVELS.map((r) => (
					<Chip
						key={r.value}
						mono
						label={String(r.value)}
						selected={set?.rpe === r.value}
						onPress={() => onRpe(set?.rpe === r.value ? undefined : r.value)}
					/>
				))}
			</Row>
			{set?.rpe ? (
				<T variant="small" style={{ marginTop: 6 }}>
					{RPE_LEVELS.find((r) => r.value === set.rpe)?.label}
				</T>
			) : null}

			<Button
				title="Delete set"
				variant="danger"
				compact
				icon={Trash}
				style={{ marginTop: 18 }}
				onPress={onDelete}
			/>
		</Sheet>
	);
}

export function PlateSheet({
	visible,
	onClose,
	target,
	bar,
	unit,
	plates,
}: {
	visible: boolean;
	onClose: () => void;
	target: number;
	bar: number;
	unit: Unit;
	plates?: number[];
}) {
	const result = calculatePlates(target, bar, unit, plates);
	return (
		<Sheet visible={visible} title="PLATES PER SIDE" onClose={onClose}>
			<T variant="small">
				{fmt(target)} {unit} on a {fmt(bar)} {unit} bar
			</T>
			<View style={{ gap: 8, marginTop: 12 }}>
				{result.perSide.length === 0 ? (
					<T>{target <= bar ? "Just the bar." : "No plates fit."}</T>
				) : (
					result.perSide.map(({ plate, count }) => (
						<Row key={plate.weight} gap={12}>
							<View
								style={[styles.plateDot, { backgroundColor: plate.color }]}
							/>
							<T style={{ flex: 1, fontFamily: fonts.monoMedium }}>
								{fmt(plate.weight)} {unit}
							</T>
							<T style={{ fontFamily: fonts.monoBold }}>× {count}</T>
						</Row>
					))
				)}
			</View>
			{result.remainder > 0 ? (
				<T variant="small" style={{ color: colors.streak, marginTop: 10 }}>
					{fmt(result.remainder)} {unit} can't be loaded with these plates.
				</T>
			) : null}
		</Sheet>
	);
}

export function DumbbellSheet({
	visible,
	mode,
	onClose,
	onPick,
}: {
	visible: boolean;
	mode: DumbbellMode | undefined;
	onClose: () => void;
	onPick: (mode: DumbbellMode) => void;
}) {
	return (
		<Sheet visible={visible} title="DUMBBELL LOGGING" onClose={onClose}>
			<View style={{ gap: 8 }}>
				{DUMBBELL_MODES.map((m) => {
					const on = (mode ?? "single") === m.value;
					return (
						<Pressable
							key={m.value}
							accessibilityRole="button"
							accessibilityState={{ selected: on }}
							onPress={() => {
								onPick(m.value);
								onClose();
							}}
							style={[styles.modeRow, on && styles.typeOn]}
						>
							<T style={{ fontFamily: fonts.bodyMedium }}>{m.name}</T>
							<T variant="small">{m.hint}</T>
						</Pressable>
					);
				})}
			</View>
		</Sheet>
	);
}

const styles = StyleSheet.create({
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
	typeCell: {
		width: "22.4%",
		minHeight: 62,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
		gap: 2,
		paddingHorizontal: 2,
	},
	typeOn: { borderColor: colors.accent, borderWidth: 1.5 },
	typeName: { fontFamily: fonts.body, fontSize: 11, color: colors.textSoft },
	plateDot: { width: 18, height: 18, borderRadius: 9 },
	modeRow: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 12,
		gap: 2,
	},
});
