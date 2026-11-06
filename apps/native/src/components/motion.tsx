import { type ReactNode, useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";

// Motion is kept small and quick: things settle, they don't perform. Reanimated's timings
// follow the system "remove animations" setting, so all of this switches off with it.

const EASE_OUT = Easing.out(Easing.cubic);

/** A bar fill that grows to `fraction` (0–1) on mount and glides when the value changes. */
export function FillBar({
	fraction,
	style,
	duration = 650,
	delay = 0,
	linear,
}: {
	fraction: number;
	style?: StyleProp<ViewStyle>;
	duration?: number;
	delay?: number;
	/** For values that tick steadily, like a timer. */
	linear?: boolean;
}) {
	const target = Math.max(0, Math.min(1, fraction || 0));
	const p = useSharedValue(0);
	useEffect(() => {
		p.set(
			withDelay(
				delay,
				withTiming(target, {
					duration,
					easing: linear ? Easing.linear : EASE_OUT,
				}),
			),
		);
	}, [p, target, duration, delay, linear]);
	const anim = useAnimatedStyle(() => ({ width: `${p.get() * 100}%` }));
	return <Animated.View style={[style, anim]} />;
}

/** Gives its child a small pop each time `on` turns true (not on first render). */
export function Pop({
	on,
	children,
	style,
}: {
	on: boolean;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}) {
	const scale = useSharedValue(1);
	const was = useRef(on);
	useEffect(() => {
		if (on && !was.current) {
			scale.set(
				withSequence(
					withTiming(0.8, { duration: 70 }),
					withSpring(1, { damping: 9, stiffness: 340 }),
				),
			);
		}
		was.current = on;
	}, [on, scale]);
	const anim = useAnimatedStyle(() => ({
		transform: [{ scale: scale.get() }],
	}));
	return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Press feedback: a slight scale-down while held, a quick settle on release. */
export function usePressScale(to = 0.97) {
	const scale = useSharedValue(1);
	const style = useAnimatedStyle(() => ({
		transform: [{ scale: scale.get() }],
	}));
	return {
		style,
		onPressIn: () => scale.set(withTiming(to, { duration: 90 })),
		onPressOut: () =>
			scale.set(withSpring(1, { damping: 14, stiffness: 320, mass: 0.6 })),
	};
}
