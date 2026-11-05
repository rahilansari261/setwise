import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Ruler } from "@/src/components/ruler";
import { T } from "@/src/components/ui";
import { cmToIn, inToCm } from "@/src/lib/vtaper";
import { colors } from "@/src/theme";
import type { BodyMeasurement, Unit } from "@/src/types";

export type MeasureField = "shouldersCm" | "waistCm" | "chestCm" | "armCm";

interface FieldSpec {
	label: string;
	/** Starting point for the ruler when nothing is logged yet. */
	guessCm: number;
	minCm: number;
	maxCm: number;
	how: string;
}

export const MEASURE_FIELDS: Record<MeasureField, FieldSpec> = {
	shouldersCm: {
		label: "Shoulders",
		guessCm: 115,
		minCm: 80,
		maxCm: 160,
		how: "Around the widest point of both shoulders, arms relaxed at your sides.",
	},
	waistCm: {
		label: "Waist",
		guessCm: 84,
		minCm: 55,
		maxCm: 150,
		how: "At the navel, standing relaxed after a normal breath out. Don't suck in.",
	},
	chestCm: {
		label: "Chest",
		guessCm: 98,
		minCm: 70,
		maxCm: 150,
		how: "Around the fullest part of the chest, under the armpits.",
	},
	armCm: {
		label: "Arm",
		guessCm: 34,
		minCm: 22,
		maxCm: 55,
		how: "Around the peak of the biceps, flexed.",
	},
};

const lengthUnit = (unit: Unit) => (unit === "kg" ? "cm" : "in");

export function fmtLength(cm: number | undefined, unit: Unit): string {
	if (!cm) return "—";
	return unit === "kg" ? cm.toFixed(1) : cmToIn(cm).toFixed(1);
}

/** Tiles for each tape measurement plus one ruler for whichever tile is active. */
export function MeasureInput({
	fields,
	value,
	unit,
	onChange,
}: {
	fields: MeasureField[];
	value: Partial<BodyMeasurement>;
	unit: Unit;
	onChange: (field: MeasureField, cm: number) => void;
}) {
	const [active, setActive] = useState<MeasureField>(
		fields[0] ?? "shouldersCm",
	);
	const spec = MEASURE_FIELDS[active];
	const cm = value[active] ?? spec.guessCm;

	const pick = (field: MeasureField) => {
		setActive(field);
		// A tile with nothing in it starts from a typical value so the ruler has somewhere to sit.
		if (!value[field]) onChange(field, MEASURE_FIELDS[field].guessCm);
	};

	return (
		<View>
			<View style={{ flexDirection: "row", gap: 8 }}>
				{fields.map((field) => {
					const on = field === active;
					return (
						<Pressable
							key={field}
							accessibilityRole="button"
							accessibilityState={{ selected: on }}
							accessibilityLabel={`${MEASURE_FIELDS[field].label} ${fmtLength(value[field], unit)} ${lengthUnit(unit)}`}
							onPress={() => pick(field)}
							style={[
								styles.tile,
								on && { borderColor: colors.accent, borderWidth: 1.5 },
							]}
						>
							<T
								variant="label"
								style={{
									fontSize: 10,
									color: on ? colors.accent : colors.muted,
								}}
								numberOfLines={1}
							>
								{MEASURE_FIELDS[field].label}
							</T>
							<T
								variant="mono"
								style={{
									fontSize: fields.length > 2 ? 20 : 26,
									lineHeight: 30,
								}}
								numberOfLines={1}
								adjustsFontSizeToFit
							>
								{fmtLength(value[field], unit)}
							</T>
							<T variant="small" style={{ fontSize: 12 }}>
								{lengthUnit(unit)}
							</T>
						</Pressable>
					);
				})}
			</View>
			<View style={{ marginTop: 18 }}>
				{unit === "kg" ? (
					<Ruler
						key={`${active}-cm`}
						accessibilityLabel={`${spec.label} in centimetres`}
						value={Math.round(cm * 2) / 2}
						min={spec.minCm}
						max={spec.maxCm}
						step={0.5}
						majorEvery={10}
						onChange={(v) => onChange(active, v)}
					/>
				) : (
					<Ruler
						key={`${active}-in`}
						accessibilityLabel={`${spec.label} in inches`}
						value={Math.round(cmToIn(cm) * 4) / 4}
						min={Math.floor(cmToIn(spec.minCm))}
						max={Math.ceil(cmToIn(spec.maxCm))}
						step={0.25}
						majorEvery={8}
						onChange={(v) => onChange(active, inToCm(v))}
					/>
				)}
			</View>
			<T variant="small" style={{ marginTop: 10 }}>
				{spec.how}
			</T>
		</View>
	);
}

const styles = StyleSheet.create({
	tile: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 12,
		gap: 4,
	},
});
