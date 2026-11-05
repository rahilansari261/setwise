import * as Haptics from "expo-haptics";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";

import { colors, fonts } from "@/src/theme";

const TICK = 10;
const HEIGHT = 58;

interface RulerProps {
	value: number;
	min: number;
	max: number;
	step: number;
	/** A labelled long tick every N steps. */
	majorEvery: number;
	onChange: (value: number) => void;
	formatMajor?: (value: number) => string;
	accessibilityLabel: string;
}

/** Drawn as a single SVG path so hundreds of ticks stay cheap on older phones. */
const Ticks = memo(function Ticks({
	min,
	count,
	step,
	majorEvery,
	formatMajor,
}: {
	min: number;
	count: number;
	step: number;
	majorEvery: number;
	formatMajor: (v: number) => string;
}) {
	const { minor, major, labels } = useMemo(() => {
		let minorPath = "";
		let majorPath = "";
		const out: { x: number; text: string }[] = [];
		for (let i = 0; i < count; i++) {
			const x = i * TICK + TICK / 2;
			if (i % majorEvery === 0) {
				majorPath += `M${x} 0V24`;
				out.push({ x, text: formatMajor(min + i * step) });
			} else if (majorEvery % 2 === 0 && i % (majorEvery / 2) === 0) {
				minorPath += `M${x} 0V15`;
			} else {
				minorPath += `M${x} 0V8`;
			}
		}
		return { minor: minorPath, major: majorPath, labels: out };
	}, [min, count, step, majorEvery, formatMajor]);

	return (
		<Svg width={count * TICK} height={HEIGHT}>
			<Path d={minor} stroke="#454B56" strokeWidth={1.5} />
			<Path d={major} stroke={colors.text} strokeWidth={1.5} />
			{labels.map((l) => (
				<SvgText
					key={l.x}
					x={l.x}
					y={42}
					fill={colors.muted}
					fontSize={10}
					fontFamily={fonts.mono}
					textAnchor="middle"
				>
					{l.text}
				</SvgText>
			))}
		</Svg>
	);
});

export function Ruler({
	value,
	min,
	max,
	step,
	majorEvery,
	onChange,
	formatMajor,
	accessibilityLabel,
}: RulerProps) {
	const [width, setWidth] = useState(0);
	const scrollRef = useRef<ScrollView>(null);
	const lastIndex = useRef(Math.round((value - min) / step));
	const count = Math.round((max - min) / step) + 1;
	const format = useMemo(
		() => formatMajor ?? ((v: number) => String(Math.round(v))),
		[formatMajor],
	);

	// Follow external value changes (unit switch, picking a different tile). Changes that came from
	// scrolling already match lastIndex, so this never fights the user's drag or momentum.
	useEffect(() => {
		if (!width) return;
		const index = Math.round((value - min) / step);
		if (index === lastIndex.current) return;
		lastIndex.current = index;
		scrollRef.current?.scrollTo({ x: index * TICK, animated: false });
	}, [value, min, step, width]);

	const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const index = Math.max(
			0,
			Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.x / TICK)),
		);
		if (index === lastIndex.current) return;
		lastIndex.current = index;
		Haptics.selectionAsync().catch(() => {});
		onChange(Math.round((min + index * step) * 100) / 100);
	};

	return (
		<View
			style={styles.wrap}
			onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
			accessible
			accessibilityRole="adjustable"
			accessibilityLabel={accessibilityLabel}
			accessibilityValue={{ text: String(value) }}
			accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
			onAccessibilityAction={(e) => {
				const delta = e.nativeEvent.actionName === "increment" ? step : -step;
				onChange(
					Math.min(max, Math.max(min, Math.round((value + delta) * 100) / 100)),
				);
			}}
		>
			{width > 0 ? (
				<ScrollView
					ref={scrollRef}
					horizontal
					showsHorizontalScrollIndicator={false}
					snapToInterval={TICK}
					decelerationRate="fast"
					onScroll={onScroll}
					scrollEventThrottle={16}
					contentContainerStyle={{ paddingHorizontal: width / 2 - TICK / 2 }}
					contentOffset={{ x: Math.round((value - min) / step) * TICK, y: 0 }}
				>
					<Ticks
						min={min}
						count={count}
						step={step}
						majorEvery={majorEvery}
						formatMajor={format}
					/>
				</ScrollView>
			) : null}
			<View
				pointerEvents="none"
				style={[styles.needle, { left: width / 2 - 1.5 }]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { height: HEIGHT, justifyContent: "flex-start" },
	needle: {
		position: "absolute",
		top: -4,
		width: 3,
		height: 34,
		borderRadius: 2,
		backgroundColor: colors.accent,
	},
});
