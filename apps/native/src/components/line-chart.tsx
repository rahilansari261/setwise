import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { colors, fonts } from "@/src/theme";

const PAD_TOP = 10;
const PAD_BOTTOM = 10;
const LABEL_W = 30;

function niceTicks(min: number, max: number, count = 3): number[] {
	if (min === max) return [min];
	const raw = (max - min) / count;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const step =
		[1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
	const start = Math.ceil(min / step) * step;
	const ticks: number[] = [];
	for (let v = start; v <= max + 1e-9; v += step)
		ticks.push(Math.round(v * 100) / 100);
	return ticks;
}

/** Minimal trend line: hairline grid, accent stroke, ringed latest point. */
export function LineChart({
	values,
	height = 160,
	formatTick = (v: number) => String(v),
	accessibilityLabel,
}: {
	values: number[];
	height?: number;
	formatTick?: (v: number) => string;
	accessibilityLabel: string;
}) {
	const [width, setWidth] = useState(0);
	const plotW = Math.max(0, width - LABEL_W - 8);
	const lo = Math.min(...values);
	const hi = Math.max(...values);
	const span = hi - lo || Math.max(1, hi * 0.1);
	const min = lo - span * 0.1;
	const max = hi + span * 0.1;
	const y = (v: number) =>
		PAD_TOP + ((max - v) / (max - min)) * (height - PAD_TOP - PAD_BOTTOM);
	const x = (i: number) =>
		LABEL_W +
		(values.length === 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
	const points = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
	const lastValue = values.at(-1) ?? 0;

	return (
		<View
			style={{ height }}
			onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
			accessible
			accessibilityRole="image"
			accessibilityLabel={accessibilityLabel}
		>
			{width > 0 && values.length > 0 ? (
				<Svg width={width} height={height}>
					{niceTicks(min, max).map((t) => (
						<Line
							key={`g${t}`}
							x1={LABEL_W}
							x2={width}
							y1={y(t)}
							y2={y(t)}
							stroke={colors.hairline}
							strokeWidth={1}
						/>
					))}
					{niceTicks(min, max).map((t) => (
						<SvgText
							key={`l${t}`}
							x={0}
							y={y(t) + 3}
							fill={colors.faint}
							fontSize={10}
							fontFamily={fonts.mono}
						>
							{formatTick(t)}
						</SvgText>
					))}
					{values.length > 1 ? (
						<Polyline
							points={points}
							fill="none"
							stroke={colors.accent}
							strokeWidth={2.5}
							strokeLinejoin="round"
							strokeLinecap="round"
						/>
					) : null}
					<Circle
						cx={x(values.length - 1)}
						cy={y(lastValue)}
						r={5}
						fill={colors.bg}
						stroke={colors.accent}
						strokeWidth={2.5}
					/>
				</Svg>
			) : null}
		</View>
	);
}
