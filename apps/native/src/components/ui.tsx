import { useRouter } from "expo-router";
import { ChevronLeft, Crown, type LucideIcon } from "lucide-react-native";
import { type ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Keyboard,
	Modal,
	Pressable,
	type PressableProps,
	ScrollView,
	type StyleProp,
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	type TextProps,
	type TextStyle,
	View,
	type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Reanimated, {
	Easing,
	FadeInDown,
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";

import { usePressScale } from "@/src/components/motion";
import { haptic } from "@/src/lib/haptics";
import { translate } from "@/src/lib/i18n";
import { LocaleContext } from "@/src/lib/locale-context";
import { colors, fonts, radius, TAP } from "@/src/theme";

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);
const EASE_OUT = Easing.out(Easing.cubic);
/** Sheets rise a little as they fade in. */
const SHEET_IN = FadeInDown.duration(240).easing(EASE_OUT);

/** Translates a string label for the current language; re-renders on language change. */
function useTr() {
	const locale = useContext(LocaleContext);
	return (text: string) => translate(text, locale);
}

/** Translates string children, including JSX like {"Log "}{name}{" sets"} built from several parts. */
function translateChildren(
	children: ReactNode,
	tr: (s: string) => string,
): ReactNode {
	if (typeof children === "string") return tr(children);
	if (Array.isArray(children)) {
		const flat = children.flat(Number.POSITIVE_INFINITY) as ReactNode[];
		if (flat.every((c) => typeof c === "string" || typeof c === "number")) {
			const joined = flat.join("");
			const out = tr(joined);
			return out === joined ? children : out;
		}
		return children.map((c) => (typeof c === "string" ? tr(c) : c));
	}
	return children;
}

/** Height of the on-screen keyboard while `active`, else 0. */
function useKeyboardHeight(active: boolean) {
	const [height, setHeight] = useState(0);
	useEffect(() => {
		if (!active) {
			setHeight(0);
			return;
		}
		const show = Keyboard.addListener("keyboardDidShow", (e) =>
			setHeight(e.endCoordinates.height),
		);
		const hide = Keyboard.addListener("keyboardDidHide", () => setHeight(0));
		return () => {
			show.remove();
			hide.remove();
		};
	}, [active]);
	return height;
}

// ---- text ----------------------------------------------------------------------

type Variant =
	| "display"
	| "title"
	| "heading"
	| "body"
	| "small"
	| "label"
	| "mono"
	| "monoLarge";

const variantStyle: Record<Variant, TextStyle> = {
	display: {
		fontFamily: fonts.display,
		fontSize: 30,
		lineHeight: 33,
		letterSpacing: -0.6,
		color: colors.text,
	},
	title: {
		fontFamily: fonts.display,
		fontSize: 24,
		lineHeight: 28,
		letterSpacing: -0.4,
		color: colors.text,
	},
	heading: {
		fontFamily: fonts.display,
		fontSize: 17,
		lineHeight: 22,
		color: colors.text,
	},
	body: {
		fontFamily: fonts.body,
		fontSize: 15,
		lineHeight: 22,
		color: colors.text,
	},
	small: {
		fontFamily: fonts.body,
		fontSize: 13,
		lineHeight: 18,
		color: colors.muted,
	},
	label: {
		fontFamily: fonts.mono,
		fontSize: 11,
		letterSpacing: 1.5,
		color: colors.muted,
		textTransform: "uppercase",
	},
	mono: {
		fontFamily: fonts.monoMedium,
		fontSize: 16,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	monoLarge: {
		fontFamily: fonts.monoBold,
		fontSize: 52,
		lineHeight: 56,
		letterSpacing: -2,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
};

export function T({
	variant = "body",
	style,
	children,
	...rest
}: TextProps & { variant?: Variant }) {
	const tr = useTr();
	return (
		<Text
			maxFontSizeMultiplier={1.3}
			style={[variantStyle[variant], style]}
			{...rest}
		>
			{translateChildren(children, tr)}
		</Text>
	);
}

/** Back arrow + title row used at the top of every pushed screen. */
export function ScreenHeader({
	title,
	right,
}: {
	title: string;
	right?: ReactNode;
}) {
	const router = useRouter();
	return (
		<Row gap={12}>
			<IconButton
				icon={ChevronLeft}
				label="Back"
				onPress={() => router.back()}
			/>
			<T variant="title" style={{ flex: 1 }} numberOfLines={1}>
				{title}
			</T>
			{right}
		</Row>
	);
}

/** Small "PRO" tag for rows and tiles that need a subscription. */
export function ProBadge({ locked = true }: { locked?: boolean }) {
	return (
		<View style={[styles.proBadge, !locked && { opacity: 0.55 }]}>
			<Crown size={10} color={colors.accent} />
			<Text style={styles.proText}>PRO</Text>
		</View>
	);
}

// ---- layout ----------------------------------------------------------------------

export function Screen({
	children,
	scroll = true,
	padded = true,
	bottomInset = 24,
	contentStyle,
	stack = false,
}: {
	children: ReactNode;
	scroll?: boolean;
	padded?: boolean;
	bottomInset?: number;
	contentStyle?: StyleProp<ViewStyle>;
	/** Full-screen stack routes have no tab bar below them, so they also inset for the system nav bar. */
	stack?: boolean;
}) {
	const inner = [padded && styles.padded, contentStyle];
	return (
		<SafeAreaView
			edges={stack ? ["top", "bottom"] : ["top"]}
			style={styles.screen}
		>
			{scroll ? (
				<KeyboardAwareScrollView
					bottomOffset={24}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={[inner, { paddingBottom: bottomInset }]}
					showsVerticalScrollIndicator={false}
				>
					{children}
				</KeyboardAwareScrollView>
			) : (
				<View style={[{ flex: 1 }, inner]}>{children}</View>
			)}
		</SafeAreaView>
	);
}

export function Card({
	children,
	style,
	active,
}: {
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
	active?: boolean;
}) {
	return (
		<View
			style={[
				styles.card,
				active && { borderColor: colors.accent, borderWidth: 1.5 },
				style,
			]}
		>
			{children}
		</View>
	);
}

export function Row({
	children,
	gap = 8,
	style,
}: {
	children: ReactNode;
	gap?: number;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>
			{children}
		</View>
	);
}

// ---- buttons ---------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
	title,
	onPress,
	variant = "primary",
	icon: Icon,
	iconRight,
	loading,
	disabled,
	style,
	compact,
}: {
	title: string;
	onPress?: () => void;
	variant?: ButtonVariant;
	icon?: LucideIcon;
	iconRight?: boolean;
	loading?: boolean;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	compact?: boolean;
}) {
	const tr = useTr();
	const palette = {
		primary: { bg: colors.accent, fg: colors.accentInk, border: colors.accent },
		secondary: { bg: "transparent", fg: colors.text, border: colors.border },
		ghost: { bg: "transparent", fg: colors.text, border: "transparent" },
		danger: {
			bg: colors.dangerTint,
			fg: colors.danger,
			border: colors.dangerTint,
		},
	}[variant];
	const press = usePressScale();
	const iconEl = Icon ? (
		<Icon size={18} color={palette.fg} strokeWidth={2.2} />
	) : null;
	return (
		<AnimatedPressable
			accessibilityRole="button"
			onPress={onPress}
			onPressIn={press.onPressIn}
			onPressOut={press.onPressOut}
			disabled={disabled || loading}
			style={[
				styles.button,
				compact && { height: TAP, borderRadius: 12 },
				{
					backgroundColor: palette.bg,
					borderColor: palette.border,
					opacity: disabled ? 0.4 : 1,
				},
				style,
				press.style,
			]}
		>
			{loading ? (
				<ActivityIndicator color={palette.fg} />
			) : (
				<>
					{!iconRight && iconEl}
					<Text
						maxFontSizeMultiplier={1.2}
						style={{
							fontFamily:
								variant === "primary" ? fonts.display : fonts.bodyMedium,
							fontSize: compact ? 14 : 16,
							color: palette.fg,
						}}
					>
						{tr(title)}
					</Text>
					{iconRight && iconEl}
				</>
			)}
		</AnimatedPressable>
	);
}

export function IconButton({
	icon: Icon,
	label,
	onPress,
	bordered = true,
	color = colors.text,
	size = 20,
	style,
}: {
	icon: LucideIcon;
	label: string;
	onPress?: () => void;
	bordered?: boolean;
	color?: string;
	size?: number;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={4}
			onPress={onPress}
			style={({ pressed }) => [
				styles.iconButton,
				bordered && styles.iconButtonBorder,
				pressed && { opacity: 0.6 },
				style,
			]}
		>
			<Icon size={size} color={color} strokeWidth={2} />
		</Pressable>
	);
}

/** Selectable chip. Selection shows as an accent outline; the accent fill is reserved for primary actions. */
export function Chip({
	label,
	selected,
	onPress,
	style,
	mono,
	raw,
}: {
	label: string;
	selected?: boolean;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
	mono?: boolean;
	/** Show the label as is, untranslated (muscle names stay English). */
	raw?: boolean;
}) {
	const tr = useTr();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ selected }}
			onPress={onPress}
			style={({ pressed }) => [
				styles.chip,
				selected
					? {
							borderColor: colors.accent,
							borderWidth: 1.5,
							backgroundColor: colors.surface,
						}
					: null,
				pressed && { opacity: 0.7 },
				style,
			]}
		>
			<Text
				maxFontSizeMultiplier={1.2}
				style={{
					fontFamily: mono
						? fonts.mono
						: selected
							? fonts.bodyMedium
							: fonts.body,
					fontSize: mono ? 12 : 14,
					color: selected ? colors.text : colors.textSoft,
				}}
			>
				{raw ? label : tr(label)}
			</Text>
		</Pressable>
	);
}

export function Segmented<T extends string>({
	options,
	value,
	onChange,
	style,
	fill,
}: {
	options: { value: T; label: string }[];
	value: T;
	onChange: (v: T) => void;
	style?: StyleProp<ViewStyle>;
	/** Stretch the segments across the full width. */
	fill?: boolean;
}) {
	const tr = useTr();
	// Where each segment sits, so the highlight can glide to the picked one.
	const [boxes, setBoxes] = useState<Record<string, { x: number; w: number }>>(
		{},
	);
	const box = boxes[value];
	const bx = box?.x;
	const bw = box?.w;
	const x = useSharedValue(0);
	const w = useSharedValue(0);
	const placed = useRef(false);
	useEffect(() => {
		if (bx === undefined || bw === undefined) return;
		if (!placed.current) {
			placed.current = true;
			x.set(bx);
			w.set(bw);
			return;
		}
		const cfg = { duration: 220, easing: EASE_OUT };
		x.set(withTiming(bx, cfg));
		w.set(withTiming(bw, cfg));
	}, [bx, bw, x, w]);
	const pill = useAnimatedStyle(() => ({
		width: w.get(),
		transform: [{ translateX: x.get() }],
	}));
	return (
		<View style={[styles.segmented, style]}>
			<View style={[{ flexDirection: "row" }, fill && { flex: 1 }]}>
				{box ? (
					<Reanimated.View
						pointerEvents="none"
						style={[styles.segmentPill, pill]}
					/>
				) : null}
				{options.map((o) => {
					const active = o.value === value;
					return (
						<Pressable
							key={o.value}
							accessibilityRole="button"
							accessibilityState={{ selected: active }}
							onLayout={(e) => {
								const { x: lx, width } = e.nativeEvent.layout;
								setBoxes((b) =>
									b[o.value]?.x === lx && b[o.value]?.w === width
										? b
										: { ...b, [o.value]: { x: lx, w: width } },
								);
							}}
							onPress={() => {
								if (active) return;
								haptic.tick();
								onChange(o.value);
							}}
							style={[
								styles.segment,
								fill && { flex: 1 },
								// Until the segments are measured, the picked one gets a plain fill.
								active && !box && { backgroundColor: colors.control },
							]}
						>
							<Text
								maxFontSizeMultiplier={1.2}
								style={{
									fontFamily: fonts.mono,
									fontSize: 11,
									color: active ? colors.text : colors.muted,
								}}
							>
								{tr(o.label)}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

// ---- inputs -------------------------------------------------------------------------

export function Field({
	label,
	style,
	inputStyle,
	...rest
}: Omit<TextInputProps, "style"> & {
	label?: string;
	style?: StyleProp<ViewStyle>;
	inputStyle?: StyleProp<TextStyle>;
}) {
	const tr = useTr();
	return (
		<View style={[{ gap: 8 }, style]}>
			{label ? <T variant="label">{label}</T> : null}
			<TextInput
				placeholderTextColor={colors.faint}
				selectionColor={colors.accent}
				cursorColor={colors.accent}
				maxFontSizeMultiplier={1.2}
				style={[styles.input, inputStyle]}
				{...rest}
				placeholder={rest.placeholder ? tr(rest.placeholder) : undefined}
			/>
		</View>
	);
}

export function Stepper({
	value,
	onChange,
	step = 1,
	min = 0,
	max = 999,
	format = (v: number) => String(v),
	suffix,
}: {
	value: number;
	onChange: (v: number) => void;
	step?: number;
	min?: number;
	max?: number;
	format?: (v: number) => string;
	suffix?: string;
}) {
	const clamp = (v: number) =>
		Math.min(max, Math.max(min, Math.round(v * 100) / 100));
	const go = (v: number) => {
		const next = clamp(v);
		if (next === value) return;
		haptic.tick();
		onChange(next);
	};
	return (
		<Row gap={6}>
			<StepButton label="Decrease" sign="−" onPress={() => go(value - step)} />
			<View style={{ minWidth: 48, alignItems: "center" }}>
				<T variant="mono" style={{ fontSize: 22 }}>
					{format(value)}
					{suffix ? <T variant="small"> {suffix}</T> : null}
				</T>
			</View>
			<StepButton label="Increase" sign="+" onPress={() => go(value + step)} />
		</Row>
	);
}

function StepButton({
	label,
	sign,
	onPress,
}: {
	label: string;
	sign: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={onPress}
			style={({ pressed }) => [
				styles.iconButton,
				styles.iconButtonBorder,
				pressed && { opacity: 0.6 },
			]}
		>
			<Text
				style={{
					color: colors.text,
					fontSize: 20,
					fontFamily: fonts.monoMedium,
				}}
			>
				{sign}
			</Text>
		</Pressable>
	);
}

export function Toggle({
	value,
	onChange,
	label,
}: {
	value: boolean;
	onChange: (v: boolean) => void;
	label: string;
}) {
	const on = useSharedValue(value ? 1 : 0);
	useEffect(() => {
		on.set(withTiming(value ? 1 : 0, { duration: 180, easing: EASE_OUT }));
	}, [value, on]);
	const track = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			on.get(),
			[0, 1],
			[colors.surfaceRaised, colors.accent],
		),
		borderColor: interpolateColor(
			on.get(),
			[0, 1],
			[colors.border, colors.accent],
		),
	}));
	const knob = useAnimatedStyle(() => ({
		transform: [{ translateX: on.get() * 18 }],
		backgroundColor: interpolateColor(
			on.get(),
			[0, 1],
			[colors.muted, colors.accentInk],
		),
	}));
	return (
		<AnimatedPressable
			accessibilityRole="switch"
			accessibilityLabel={label}
			accessibilityState={{ checked: value }}
			onPress={() => {
				haptic.toggle(!value);
				onChange(!value);
			}}
			hitSlop={8}
			style={[styles.toggle, track]}
		>
			<Reanimated.View style={[styles.knob, knob]} />
		</AnimatedPressable>
	);
}

/** One settings-style row: label on the left, control on the right. */
export function ListRow({
	label,
	detail,
	children,
	onPress,
	last,
}: {
	label: string;
	detail?: string;
	children?: ReactNode;
	onPress?: () => void;
	last?: boolean;
}) {
	const rowStyle = [
		styles.listRow,
		!last && { borderBottomWidth: 1, borderBottomColor: colors.hairline },
	];
	const body = (
		<>
			<View style={{ flex: 1, gap: 2 }}>
				<T style={{ fontFamily: fonts.bodyMedium }}>{label}</T>
				{detail ? <T variant="small">{detail}</T> : null}
			</View>
			{children}
		</>
	);
	return onPress ? (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
		>
			{body}
		</Pressable>
	) : (
		<View style={rowStyle}>{body}</View>
	);
}

// ---- overlays ----------------------------------------------------------------------

export interface SheetAction {
	label: string;
	icon?: LucideIcon;
	destructive?: boolean;
	onPress: () => void;
}

export function ActionSheet({
	visible,
	title,
	actions,
	onClose,
}: {
	visible: boolean;
	title?: string;
	actions: SheetAction[];
	onClose: () => void;
}) {
	const insets = useSafeAreaInsets();
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<Pressable
				style={styles.backdrop}
				onPress={onClose}
				accessibilityLabel="Close menu"
			/>
			<Reanimated.View
				entering={SHEET_IN}
				style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
			>
				{title ? (
					<T
						variant="label"
						style={{ paddingHorizontal: 20, paddingBottom: 8 }}
					>
						{title}
					</T>
				) : null}
				{actions.map((a) => {
					const Icon = a.icon;
					const color = a.destructive ? colors.danger : colors.text;
					return (
						<Pressable
							key={a.label}
							accessibilityRole="button"
							onPress={() => {
								onClose();
								a.onPress();
							}}
							style={({ pressed }) => [
								styles.sheetItem,
								pressed && { backgroundColor: colors.surfaceRaised },
							]}
						>
							{Icon ? <Icon size={20} color={color} /> : null}
							<T style={{ color, fontFamily: fonts.bodyMedium }}>{a.label}</T>
						</Pressable>
					);
				})}
			</Reanimated.View>
		</Modal>
	);
}

/** Bottom sheet that holds arbitrary content (grids, forms, calculators). */
export function Sheet({
	visible,
	title,
	onClose,
	children,
}: {
	visible: boolean;
	title?: string;
	onClose: () => void;
	children: ReactNode;
}) {
	const insets = useSafeAreaInsets();
	const keyboard = useKeyboardHeight(visible);
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<Pressable
				style={styles.backdrop}
				onPress={onClose}
				accessibilityLabel="Close"
			/>
			{/* A Modal sits outside the activity's keyboard resizing, so lift the sheet by hand. */}
			<Reanimated.View
				entering={SHEET_IN}
				style={[
					styles.sheet,
					{
						paddingBottom: (keyboard > 0 ? 0 : insets.bottom) + 16,
						paddingHorizontal: 20,
						marginBottom: keyboard,
						maxHeight: "92%",
					},
				]}
			>
				{title ? (
					<T variant="label" style={{ paddingBottom: 12 }}>
						{title}
					</T>
				) : null}
				<ScrollView
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
					bounces={false}
				>
					{children}
				</ScrollView>
			</Reanimated.View>
		</Modal>
	);
}

/** Slides in from the top, used for PR celebrations and quick confirmations. */
export function Toast({
	message,
	onHide,
}: {
	message: string | null;
	onHide: () => void;
}) {
	const anim = useRef(new Animated.Value(0)).current;
	const insets = useSafeAreaInsets();
	useEffect(() => {
		if (!message) return;
		Animated.sequence([
			Animated.timing(anim, {
				toValue: 1,
				duration: 220,
				useNativeDriver: true,
			}),
			Animated.delay(2200),
			Animated.timing(anim, {
				toValue: 0,
				duration: 220,
				useNativeDriver: true,
			}),
		]).start(({ finished }) => finished && onHide());
	}, [message, anim, onHide]);
	if (!message) return null;
	return (
		<Animated.View
			pointerEvents="none"
			style={[
				styles.toast,
				{
					top: insets.top + 8,
					opacity: anim,
					transform: [
						{
							translateY: anim.interpolate({
								inputRange: [0, 1],
								outputRange: [-20, 0],
							}),
						},
					],
				},
			]}
		>
			<T
				style={{
					color: colors.accentInk,
					fontFamily: fonts.display,
					fontSize: 15,
				}}
			>
				{message}
			</T>
		</Animated.View>
	);
}

export function PressableCard({
	children,
	style,
	onPressIn,
	onPressOut,
	...rest
}: Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle> }) {
	const press = usePressScale(0.98);
	return (
		<AnimatedPressable
			{...rest}
			onPressIn={(e) => {
				press.onPressIn();
				onPressIn?.(e);
			}}
			onPressOut={(e) => {
				press.onPressOut();
				onPressOut?.(e);
			}}
			style={[styles.card, style, press.style]}
		>
			{children}
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.bg },
	padded: { paddingHorizontal: 16, paddingTop: 12 },
	card: {
		backgroundColor: colors.surface,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.hairline,
		padding: 14,
	},
	button: {
		height: 54,
		borderRadius: 16,
		borderWidth: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 16,
	},
	iconButton: {
		width: TAP,
		height: TAP,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	iconButtonBorder: { borderWidth: 1, borderColor: colors.border },
	chip: {
		minHeight: TAP,
		paddingHorizontal: 14,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	segmented: {
		flexDirection: "row",
		padding: 3,
		borderRadius: 10,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
	},
	segmentPill: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		borderRadius: 7,
		backgroundColor: colors.control,
	},
	segment: {
		minHeight: 32,
		paddingHorizontal: 12,
		borderRadius: 7,
		alignItems: "center",
		justifyContent: "center",
	},
	input: {
		height: 52,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		color: colors.text,
		paddingHorizontal: 16,
		fontFamily: fonts.body,
		fontSize: 17,
	},
	toggle: {
		width: 46,
		height: 28,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surfaceRaised,
		padding: 3,
	},
	knob: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: colors.muted,
	},
	listRow: {
		minHeight: 60,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 10,
	},
	proBadge: {
		flexDirection: "row",
		alignItems: "center",
		gap: 3,
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 6,
		backgroundColor: colors.accentTint,
	},
	proText: { fontFamily: fonts.monoBold, fontSize: 9, color: colors.accent },
	backdrop: { flex: 1, backgroundColor: colors.overlay },
	sheet: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		borderWidth: 1,
		borderColor: colors.border,
		paddingTop: 16,
	},
	sheetItem: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		paddingHorizontal: 20,
	},
	toast: {
		position: "absolute",
		alignSelf: "center",
		backgroundColor: colors.accent,
		paddingHorizontal: 18,
		paddingVertical: 12,
		borderRadius: 14,
		zIndex: 100,
		elevation: 12,
	},
});
