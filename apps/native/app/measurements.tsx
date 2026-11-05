import { useRouter } from "expo-router";
import { Check, ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import {
	fmtLength,
	MEASURE_FIELDS,
	type MeasureField,
	MeasureInput,
} from "@/src/components/measure-input";
import { Button, IconButton, Row, Screen, T } from "@/src/components/ui";
import { RatioCard } from "@/src/components/vtaper";
import { shortDate, todayISO } from "@/src/lib/dates";
import { GOLDEN_RATIO, vTaperRatio } from "@/src/lib/vtaper";
import { useToast } from "@/src/state/toast";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";
import type { BodyMeasurement } from "@/src/types";

const FIELDS: MeasureField[] = ["shouldersCm", "waistCm", "chestCm", "armCm"];

export default function Measurements() {
	const router = useRouter();
	const toast = useToast();
	const { measurements, saveMeasurement, deleteMeasurement, settings } =
		useWorkouts();
	const unit = settings.unit;
	const today = todayISO();
	const existing = measurements.find((m) => m.date === today);
	const last = measurements.at(-1);

	// Today's entry if there is one, otherwise start from the last check-in so only changes need a drag.
	const [draft, setDraft] = useState<Partial<BodyMeasurement>>(() => {
		const from = existing ?? last;
		return from
			? {
					shouldersCm: from.shouldersCm,
					waistCm: from.waistCm,
					chestCm: from.chestCm,
					armCm: from.armCm,
				}
			: {};
	});
	const draftRatio = vTaperRatio({ date: today, ...draft });

	const save = () => {
		saveMeasurement({ ...draft, date: today });
		toast(existing ? "Today's measurements updated" : "Measurements saved");
	};

	const history = [...measurements].reverse();

	return (
		<Screen stack bottomInset={32}>
			<Row gap={12}>
				<IconButton
					icon={ChevronLeft}
					label="Back"
					onPress={() => router.back()}
				/>
				<T variant="title" style={{ flex: 1 }}>
					Measurements
				</T>
			</Row>

			<View style={{ marginTop: 16 }}>
				<RatioCard linked={false} />
			</View>

			<T variant="label" style={{ marginTop: 28 }}>
				{existing ? "TODAY · EDIT" : "NEW CHECK-IN · TODAY"}
			</T>
			<View style={{ marginTop: 10 }}>
				<MeasureInput
					fields={FIELDS}
					value={draft}
					unit={unit}
					onChange={(field, cm) =>
						setDraft((prev) => ({ ...prev, [field]: cm }))
					}
				/>
			</View>
			<Row style={{ marginTop: 14, justifyContent: "space-between" }}>
				<T variant="small">
					Ratio{" "}
					<T style={{ fontFamily: fonts.monoMedium, color: colors.text }}>
						{draftRatio === null ? "—" : draftRatio.toFixed(2)}
					</T>{" "}
					· target {GOLDEN_RATIO}
				</T>
				<T variant="small">Same time of day each check-in</T>
			</Row>
			<Button
				title={existing ? "Update today" : "Save check-in"}
				icon={Check}
				style={{ marginTop: 14 }}
				disabled={!draft.shouldersCm && !draft.waistCm}
				onPress={save}
			/>

			{history.length > 0 ? (
				<>
					<T variant="label" style={{ marginTop: 28 }}>
						HISTORY
					</T>
					<View style={{ marginTop: 4 }}>
						{history.map((m) => {
							const ratio = vTaperRatio(m);
							return (
								<Pressable
									key={m.date}
									accessibilityRole="button"
									accessibilityLabel={`${shortDate(m.date)}. Hold to delete.`}
									onLongPress={() =>
										Alert.alert(`Delete ${shortDate(m.date)}?`, undefined, [
											{ text: "Cancel", style: "cancel" },
											{
												text: "Delete",
												style: "destructive",
												onPress: () => deleteMeasurement(m.date),
											},
										])
									}
									style={styles.row}
								>
									<View style={{ flex: 1, gap: 3 }}>
										<T style={{ fontFamily: fonts.bodyMedium }}>
											{shortDate(m.date)}
										</T>
										<T
											variant="label"
											style={{ fontSize: 10, letterSpacing: 1 }}
										>
											{FIELDS.filter((f) => m[f])
												.map(
													(f) =>
														`${MEASURE_FIELDS[f].label} ${fmtLength(m[f], unit)}`,
												)
												.join(" · ")}
										</T>
									</View>
									<T variant="mono">
										{ratio === null ? "—" : ratio.toFixed(2)}
									</T>
								</Pressable>
							);
						})}
					</View>
					<T variant="small" style={{ marginTop: 8 }}>
						Hold a check-in to delete it.
					</T>
				</>
			) : null}
		</Screen>
	);
}

const styles = StyleSheet.create({
	row: {
		minHeight: 58,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		borderBottomWidth: 1,
		borderBottomColor: colors.hairline,
	},
});
