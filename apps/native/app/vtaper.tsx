import { useState } from "react";
import { View } from "react-native";

import { LineChart } from "@/src/components/line-chart";
import {
	Button,
	Card,
	Field,
	ProBadge,
	Row,
	Screen,
	ScreenHeader,
	T,
} from "@/src/components/ui";
import { VTaperFigure } from "@/src/components/vtaper-figure";
import { shortDate, todayISO } from "@/src/lib/dates";
import {
	gapAdvice,
	IDEAL_RATIO,
	progressToIdeal,
	stageOf,
	vtaperHistory,
	vtaperRatio,
} from "@/src/lib/vtaper";
import { useExtras } from "@/src/state/extras";
import { usePremium, useProGate } from "@/src/state/premium";
import { useToast } from "@/src/state/toast";
import { colors, fonts } from "@/src/theme";

const num = (t: string) => Number.parseFloat(t.replace(",", "."));

export default function VTaper() {
	const { measurements, saveMeasurement } = useExtras();
	const { isPro } = usePremium();
	const gate = useProGate();
	const toast = useToast();

	const history = vtaperHistory(measurements);
	const latest = history.at(-1);
	const [shoulders, setShoulders] = useState(
		latest ? String(latest.shoulders) : "",
	);
	const [waist, setWaist] = useState(latest ? String(latest.waist) : "");

	const s = num(shoulders);
	const w = num(waist);
	const ratio = vtaperRatio(s, w);
	const stage = stageOf(ratio);
	const advice = ratio > 0 ? gapAdvice(s, w) : null;

	const save = () => {
		if (!(s > 0) || !(w > 0)) return;
		saveMeasurement({ date: todayISO(), shoulders: s, waist: w });
		toast("Saved");
	};

	return (
		<Screen stack bottomInset={40}>
			<ScreenHeader title="V-taper" />

			<Card style={{ marginTop: 16 }}>
				<Row style={{ alignItems: "flex-end" }}>
					<View style={{ flex: 1 }}>
						<T variant="label">SHOULDER : WAIST</T>
						<T
							style={{
								fontFamily: fonts.monoBold,
								fontSize: 44,
								lineHeight: 50,
							}}
						>
							{ratio > 0 ? ratio.toFixed(2) : "—"}
						</T>
					</View>
					<View style={{ alignItems: "flex-end", paddingBottom: 6 }}>
						<T style={{ fontFamily: fonts.monoBold, color: colors.accent }}>
							{ratio > 0 ? stage.name.toUpperCase() : "ENTER BOTH"}
						</T>
						<T variant="small">Goal {IDEAL_RATIO}</T>
					</View>
				</Row>
				<View
					style={{
						height: 8,
						borderRadius: 4,
						backgroundColor: colors.hairline,
						marginTop: 10,
					}}
				>
					<View
						style={{
							width: `${Math.round(progressToIdeal(ratio) * 100)}%`,
							height: 8,
							borderRadius: 4,
							backgroundColor: colors.accent,
						}}
					/>
				</View>
				<VTaperFigure ratio={ratio} ideal={IDEAL_RATIO} />
				<T variant="small" style={{ textAlign: "center" }}>
					Dashed line: the 1.618 ideal at your waist
				</T>
			</Card>

			<Card style={{ marginTop: 12, gap: 12 }}>
				<T variant="label">MEASURE TODAY (CM)</T>
				<Row gap={10}>
					<Field
						style={{ flex: 1 }}
						label="Shoulders"
						value={shoulders}
						onChangeText={setShoulders}
						keyboardType="decimal-pad"
						placeholder="e.g. 120"
					/>
					<Field
						style={{ flex: 1 }}
						label="Waist"
						value={waist}
						onChangeText={setWaist}
						keyboardType="decimal-pad"
						placeholder="e.g. 80"
					/>
				</Row>
				<T variant="small">
					Shoulders: tape around the widest point over the deltoids, arms
					relaxed. Waist: at the navel, relaxed breath out.
				</T>
				<Button title="Save" onPress={save} disabled={!(s > 0) || !(w > 0)} />
			</Card>

			{advice && (advice.cutWaist > 0 || advice.addShoulders > 0) ? (
				<Card style={{ marginTop: 12, gap: 4 }}>
					<T variant="label">TO REACH {IDEAL_RATIO}</T>
					<T>
						{advice.cutWaist > 0 ? `Waist down ${advice.cutWaist} cm` : null}
						{advice.cutWaist > 0 && advice.addShoulders > 0 ? "  or  " : null}
						{advice.addShoulders > 0
							? `shoulders up ${advice.addShoulders} cm`
							: null}
					</T>
					<T variant="small">
						In practice it's a bit of both: build lats and side delts, keep the
						waist lean.
					</T>
				</Card>
			) : null}

			<Row style={{ marginTop: 24 }}>
				<T variant="label" style={{ flex: 1 }}>
					TREND
				</T>
				{isPro ? null : <ProBadge />}
			</Row>
			<Card style={{ marginTop: 10 }}>
				{!isPro ? (
					<>
						<T variant="small">See how your ratio moves week by week.</T>
						<Button
							title="Unlock the trend"
							compact
							style={{ marginTop: 10 }}
							onPress={() => gate("vtaperTrend", () => {})}
						/>
					</>
				) : history.length >= 2 ? (
					<>
						<LineChart
							values={history.map((h) => h.ratio)}
							formatTick={(v) => v.toFixed(2)}
							accessibilityLabel="Shoulder to waist ratio over time"
						/>
						<T variant="small" style={{ marginTop: 6 }}>
							{shortDate(history[0]?.date ?? todayISO())} →{" "}
							{shortDate(history.at(-1)?.date ?? todayISO())}
						</T>
					</>
				) : (
					<T variant="small">
						Save your measurements on two different days to see a trend.
					</T>
				)}
			</Card>
		</Screen>
	);
}
