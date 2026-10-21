import { useState } from "react";
import { ScrollView, View } from "react-native";

import { Button, Chip, Row, Sheet, Stepper, T } from "@/src/components/ui";
import { ACTIVITY_TYPES, SESSION_RPE } from "@/src/lib/sets";
import type { FinishInfo } from "@/src/types";

/** Wrap-up for a workout: how hard it felt, what kind of session it was, how long it took. */
export function FinishSheet({
	visible,
	initial,
	suggestedMinutes,
	onClose,
	onSave,
}: {
	visible: boolean;
	initial?: FinishInfo;
	suggestedMinutes: number;
	onClose: () => void;
	onSave: (info: Omit<FinishInfo, "at">) => void;
}) {
	const [rpe, setRpe] = useState<number | undefined>(initial?.rpe);
	const [activity, setActivity] = useState(
		initial?.activity ?? "Strength training",
	);
	const [minutes, setMinutes] = useState(
		initial?.durationMin ?? Math.max(suggestedMinutes, 5),
	);

	return (
		<Sheet visible={visible} title="FINISH WORKOUT" onClose={onClose}>
			<T variant="label" style={{ marginBottom: 8 }}>
				HOW HARD WAS IT? (RPE)
			</T>
			<Row gap={6} style={{ flexWrap: "wrap" }}>
				{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
					<Chip
						key={n}
						mono
						label={String(n)}
						selected={rpe === n}
						style={{ minWidth: 52 }}
						onPress={() => setRpe(rpe === n ? undefined : n)}
					/>
				))}
			</Row>
			<T variant="small" style={{ marginTop: 6, minHeight: 18 }}>
				{rpe ? SESSION_RPE[rpe] : "Optional"}
			</T>

			<T variant="label" style={{ marginTop: 14, marginBottom: 8 }}>
				ACTIVITY
			</T>
			<View style={{ maxHeight: 150 }}>
				<ScrollView
					contentContainerStyle={{
						flexDirection: "row",
						flexWrap: "wrap",
						gap: 6,
					}}
					showsVerticalScrollIndicator={false}
				>
					{ACTIVITY_TYPES.map((a) => (
						<Chip
							key={a}
							label={a}
							selected={activity === a}
							onPress={() => setActivity(a)}
						/>
					))}
				</ScrollView>
			</View>

			<Row style={{ marginTop: 14, justifyContent: "space-between" }}>
				<T variant="label">DURATION</T>
				<Stepper
					value={minutes}
					step={5}
					min={1}
					max={400}
					suffix="min"
					onChange={setMinutes}
				/>
			</Row>

			<Button
				title="Save workout"
				style={{ marginTop: 18 }}
				onPress={() => onSave({ rpe, activity, durationMin: minutes })}
			/>
		</Sheet>
	);
}
