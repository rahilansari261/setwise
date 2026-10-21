import { Trash } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";

import { LineChart } from "@/src/components/line-chart";
import { ProScreen } from "@/src/components/pro-screen";
import {
	Button,
	Card,
	Chip,
	Field,
	IconButton,
	Row,
	T,
} from "@/src/components/ui";
import { kgToLb, lbToKg } from "@/src/lib/calc";
import { shortDate, todayISO } from "@/src/lib/dates";
import { useExtras } from "@/src/state/extras";
import { useToast } from "@/src/state/toast";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";
import type { Measurement } from "@/src/types";

type FieldKey = Exclude<keyof Measurement, "date">;

const FIELDS: { key: FieldKey; label: string; unit: "weight" | "%" | "cm" }[] =
	[
		{ key: "weightKg", label: "Body weight", unit: "weight" },
		{ key: "bodyFat", label: "Body fat", unit: "%" },
		{ key: "chest", label: "Chest", unit: "cm" },
		{ key: "waist", label: "Waist", unit: "cm" },
		{ key: "hips", label: "Hips", unit: "cm" },
		{ key: "arm", label: "Arm", unit: "cm" },
		{ key: "thigh", label: "Thigh", unit: "cm" },
		{ key: "neck", label: "Neck", unit: "cm" },
	];

export default function Measurements() {
	const { measurements, saveMeasurement, deleteMeasurement } = useExtras();
	const { settings } = useWorkouts();
	const toast = useToast();
	const lbs = settings.unit === "lbs";
	const [draft, setDraft] = useState<Partial<Record<FieldKey, string>>>({});
	const [chartKey, setChartKey] = useState<FieldKey>("weightKg");

	const unitLabel = (u: (typeof FIELDS)[number]["unit"]) =>
		u === "weight" ? settings.unit : u;
	const show = (key: FieldKey, v: number) =>
		key === "weightKg" && lbs ? Math.round(kgToLb(v) * 10) / 10 : v;

	const save = () => {
		const entry: Measurement = { date: todayISO() };
		let any = false;
		for (const f of FIELDS) {
			const raw = Number.parseFloat((draft[f.key] ?? "").replace(",", "."));
			if (!Number.isFinite(raw) || raw <= 0) continue;
			any = true;
			entry[f.key] =
				f.key === "weightKg" && lbs ? Math.round(lbToKg(raw) * 10) / 10 : raw;
		}
		if (!any) return;
		saveMeasurement(entry);
		setDraft({});
		toast("Measurements saved");
	};

	const series = measurements
		.map((m) => m[chartKey])
		.filter((v): v is number => typeof v === "number")
		.map((v) => show(chartKey, v));
	const chartField = FIELDS.find((f) => f.key === chartKey);

	return (
		<ProScreen feature="measurements" title="Measurements">
			<Card style={{ marginTop: 16, gap: 12 }}>
				<T variant="label">LOG TODAY · {shortDate(todayISO()).toUpperCase()}</T>
				<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
					{FIELDS.map((f) => (
						<Field
							key={f.key}
							style={{ width: "47%" }}
							label={`${f.label} (${unitLabel(f.unit)})`}
							value={draft[f.key] ?? ""}
							onChangeText={(t) => setDraft((d) => ({ ...d, [f.key]: t }))}
							keyboardType="decimal-pad"
							placeholder="—"
						/>
					))}
				</View>
				<Button title="Save" onPress={save} />
			</Card>

			<T variant="label" style={{ marginTop: 24 }}>
				TREND
			</T>
			<Row gap={6} style={{ marginTop: 10, flexWrap: "wrap" }}>
				{FIELDS.map((f) => (
					<Chip
						key={f.key}
						label={f.label}
						selected={chartKey === f.key}
						onPress={() => setChartKey(f.key)}
					/>
				))}
			</Row>
			<Card style={{ marginTop: 10 }}>
				{series.length >= 2 ? (
					<LineChart
						values={series}
						accessibilityLabel={`${chartField?.label} over time`}
					/>
				) : (
					<T variant="small">
						Log {chartField?.label.toLowerCase()} on at least two days to see a
						trend.
					</T>
				)}
			</Card>

			<T variant="label" style={{ marginTop: 24 }}>
				HISTORY
			</T>
			<View style={{ gap: 8, marginTop: 10 }}>
				{[...measurements].reverse().map((m) => (
					<Card key={m.date}>
						<Row>
							<T style={{ flex: 1, fontFamily: fonts.bodyMedium }}>
								{shortDate(m.date)}
							</T>
							<IconButton
								icon={Trash}
								label={`Delete ${m.date}`}
								bordered={false}
								size={18}
								color={colors.muted}
								onPress={() =>
									Alert.alert("Delete this entry?", undefined, [
										{ text: "Cancel", style: "cancel" },
										{
											text: "Delete",
											style: "destructive",
											onPress: () => deleteMeasurement(m.date),
										},
									])
								}
							/>
						</Row>
						<T variant="small">
							{FIELDS.filter((f) => m[f.key] !== undefined)
								.map(
									(f) =>
										`${f.label} ${show(f.key, m[f.key] as number)} ${unitLabel(f.unit)}`,
								)
								.join(" · ")}
						</T>
					</Card>
				))}
				{measurements.length === 0 ? (
					<T variant="small">Nothing logged yet.</T>
				) : null}
			</View>
		</ProScreen>
	);
}
