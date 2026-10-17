import { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
	Card,
	Chip,
	Field,
	Row,
	Screen,
	Segmented,
	T,
} from "@/src/components/ui";
import {
	brzycki1RM,
	calculatePlates,
	estimate1RM,
	fmt,
	percentTable,
	warmupSets,
} from "@/src/lib/calc";
import { useRestTimerActions } from "@/src/state/rest-timer";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";

type Tool = "plates" | "1rm" | "warmup" | "timer";

const num = (t: string) => {
	const n = Number.parseFloat(t.replace(",", "."));
	return Number.isFinite(n) ? n : 0;
};

export default function Tools() {
	const { settings } = useWorkouts();
	const [tool, setTool] = useState<Tool>("plates");
	return (
		<Screen bottomInset={32}>
			<T variant="label">GYM TOOLS</T>
			<T variant="display" style={{ marginTop: 4 }}>
				Tools
			</T>
			<Segmented<Tool>
				fill
				style={{ marginTop: 14 }}
				options={[
					{ value: "plates", label: "PLATES" },
					{ value: "1rm", label: "1RM" },
					{ value: "warmup", label: "WARM-UP" },
					{ value: "timer", label: "TIMER" },
				]}
				value={tool}
				onChange={setTool}
			/>
			<View style={{ marginTop: 16 }}>
				{tool === "plates" && (
					<Plates
						unit={settings.unit}
						defaultBar={settings.defaultBarbellWeight}
					/>
				)}
				{tool === "1rm" && <OneRepMax unit={settings.unit} />}
				{tool === "warmup" && (
					<Warmup
						unit={settings.unit}
						defaultBar={settings.defaultBarbellWeight}
					/>
				)}
				{tool === "timer" && <TimerPresets />}
			</View>
		</Screen>
	);
}

function Plates({
	unit,
	defaultBar,
}: {
	unit: "kg" | "lbs";
	defaultBar: number;
}) {
	const [target, setTarget] = useState(unit === "kg" ? "100" : "225");
	const [bar, setBar] = useState(String(defaultBar));
	const result = calculatePlates(num(target), num(bar), unit);
	const plates = result.perSide.flatMap(({ plate, count }) =>
		Array.from({ length: count }, () => plate),
	);
	return (
		<View style={{ gap: 14 }}>
			<Row gap={10}>
				<Field
					label={`Target (${unit})`}
					value={target}
					onChangeText={setTarget}
					keyboardType="decimal-pad"
					style={{ flex: 1 }}
				/>
				<Field
					label={`Bar (${unit})`}
					value={bar}
					onChangeText={setBar}
					keyboardType="decimal-pad"
					style={{ flex: 1 }}
				/>
			</Row>
			<Card>
				<T variant="label">
					LOAD PER SIDE · {fmt(result.perSideWeight)} {unit}
				</T>
				<View
					style={styles.barbell}
					accessibilityLabel={`Per side: ${result.perSide.map((p) => `${p.count} × ${p.plate.weight}`).join(", ") || "nothing"}`}
				>
					<View style={styles.sleeveStop} />
					{plates.map((p, i) => (
						<View
							// biome-ignore lint/suspicious/noArrayIndexKey: identical plates repeat; their slot on the bar is the identity
							key={`${p.weight}-${i}`}
							style={[
								styles.plate,
								{
									backgroundColor: p.color,
									height:
										30 + Math.min(70, p.weight * (unit === "kg" ? 2.6 : 1.4)),
								},
							]}
						/>
					))}
					<View style={styles.sleeve} />
				</View>
				<View style={{ gap: 6 }}>
					{result.perSide.map(({ plate, count }) => (
						<Row key={plate.weight} gap={10}>
							<View style={[styles.swatch, { backgroundColor: plate.color }]} />
							<T style={{ flex: 1, fontFamily: fonts.monoMedium }}>
								{fmt(plate.weight, 2)} {unit}
							</T>
							<T style={{ fontFamily: fonts.monoBold }}>× {count}</T>
						</Row>
					))}
					{result.perSide.length === 0 ? (
						<T variant="small">Just the bar.</T>
					) : null}
					{result.remainder > 0 ? (
						<T variant="small" style={{ color: colors.streak }}>
							{fmt(result.remainder, 2)} {unit} can't be loaded with standard
							plates.
						</T>
					) : null}
				</View>
			</Card>
		</View>
	);
}

function OneRepMax({ unit }: { unit: string }) {
	const [weight, setWeight] = useState(unit === "kg" ? "80" : "185");
	const [reps, setReps] = useState("5");
	const w = num(weight);
	const r = Math.round(num(reps));
	const epley = estimate1RM(w, r);
	return (
		<View style={{ gap: 14 }}>
			<Row gap={10}>
				<Field
					label={`Weight (${unit})`}
					value={weight}
					onChangeText={setWeight}
					keyboardType="decimal-pad"
					style={{ flex: 1 }}
				/>
				<Field
					label="Reps"
					value={reps}
					onChangeText={setReps}
					keyboardType="number-pad"
					style={{ flex: 1 }}
				/>
			</Row>
			<Row gap={10}>
				<Card style={{ flex: 1 }}>
					<T variant="label">EPLEY</T>
					<T variant="mono" style={{ fontSize: 30, marginTop: 4 }}>
						{fmt(epley)}
					</T>
				</Card>
				<Card style={{ flex: 1 }}>
					<T variant="label">BRZYCKI</T>
					<T variant="mono" style={{ fontSize: 30, marginTop: 4 }}>
						{fmt(brzycki1RM(w, r))}
					</T>
				</Card>
			</Row>
			<Card>
				<T variant="label">WORKING PERCENTAGES</T>
				<View style={{ marginTop: 8 }}>
					{percentTable(epley).map((p) => (
						<Row key={p.percent} style={styles.tableRow}>
							<T
								style={{ flex: 1, fontFamily: fonts.mono, color: colors.muted }}
							>
								{p.percent}%
							</T>
							<T style={{ fontFamily: fonts.monoMedium }}>
								{fmt(p.weight)} {unit}
							</T>
						</Row>
					))}
				</View>
			</Card>
		</View>
	);
}

function Warmup({
	unit,
	defaultBar,
}: {
	unit: "kg" | "lbs";
	defaultBar: number;
}) {
	const [working, setWorking] = useState(unit === "kg" ? "100" : "225");
	const sets = warmupSets(num(working), defaultBar, unit);
	return (
		<View style={{ gap: 14 }}>
			<Field
				label={`Working weight (${unit})`}
				value={working}
				onChangeText={setWorking}
				keyboardType="decimal-pad"
			/>
			<Card>
				<T variant="label">
					RAMP-UP · BAR {defaultBar} {unit}
				</T>
				<View style={{ marginTop: 8 }}>
					{sets.map((s) => (
						<Row key={s.label} style={styles.tableRow}>
							<T
								style={{ flex: 1, fontFamily: fonts.mono, color: colors.muted }}
							>
								{s.label}
							</T>
							<T style={{ fontFamily: fonts.monoMedium }}>
								{fmt(s.weight)} {unit} × {s.reps}
							</T>
						</Row>
					))}
				</View>
			</Card>
		</View>
	);
}

function TimerPresets() {
	const timer = useRestTimerActions();
	const presets = [30, 60, 90, 120, 180, 300];
	return (
		<View style={{ gap: 12 }}>
			<T variant="small">
				Starts the rest bar above the tabs. You'll get a notification if the app
				is in the background.
			</T>
			<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
				{presets.map((s) => (
					<Chip
						key={s}
						mono
						label={
							s < 60
								? `${s}s`
								: `${Math.floor(s / 60)}${s % 60 ? ":30" : ""} min`
						}
						onPress={() => timer.start(s)}
						style={{ flexBasis: "30%", flexGrow: 1, minHeight: 56 }}
					/>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	barbell: {
		height: 110,
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 12,
	},
	sleeveStop: {
		width: 8,
		height: 34,
		borderRadius: 2,
		backgroundColor: colors.muted,
		marginRight: 2,
	},
	plate: { width: 13, borderRadius: 3, marginRight: 2 },
	sleeve: {
		flex: 1,
		height: 10,
		borderRadius: 2,
		backgroundColor: colors.control,
	},
	swatch: { width: 14, height: 14, borderRadius: 3 },
	tableRow: {
		height: 36,
		borderBottomWidth: 1,
		borderBottomColor: colors.hairline,
	},
});
