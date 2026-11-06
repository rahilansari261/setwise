import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Haptics are kept to a few moments: picking a value, flipping a switch, logging a set,
 * and the big ones (a PR, rest over, a workout finished). Settings › Vibration turns all of it off.
 *
 * On Android the light ones go through the system haptics engine (View.performHapticFeedback),
 * which feels crisper than the vibrator and also respects the phone's own touch-feedback switch.
 */
let enabled = true;

export function setHapticsEnabled(on: boolean) {
	enabled = on;
}

const A = Haptics.AndroidHaptics;
const ignore = () => {};

/** Newer constants (toggle, segment) exist from Android 14; older phones get the fallback. */
function android(
	type: Haptics.AndroidHaptics,
	fallback: Haptics.AndroidHaptics,
) {
	Haptics.performAndroidHapticsAsync(type).catch(() =>
		Haptics.performAndroidHapticsAsync(fallback).catch(ignore),
	);
}

const isAndroid = Platform.OS === "android";

export const haptic = {
	/** A light tick: a segment picked, a stepper step, a ruler notch. */
	tick() {
		if (!enabled) return;
		if (isAndroid) android(A.Segment_Tick, A.Clock_Tick);
		else Haptics.selectionAsync().catch(ignore);
	},
	/** A switch flipped. */
	toggle(on: boolean) {
		if (!enabled) return;
		if (isAndroid) android(on ? A.Toggle_On : A.Toggle_Off, A.Context_Click);
		else Haptics.selectionAsync().catch(ignore);
	},
	/** A set ticked off. */
	confirm() {
		if (!enabled) return;
		if (isAndroid) android(A.Confirm, A.Context_Click);
		else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(ignore);
	},
	/** Worth feeling from the bench: a PR, rest over, a workout finished. */
	success() {
		if (!enabled) return;
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
			ignore,
		);
	},
};
