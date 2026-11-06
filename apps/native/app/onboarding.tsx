import { ArrowRight, ChevronLeft, Plus } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ruler } from "@/src/components/ruler";
import {
	Button,
	Chip,
	Field,
	IconButton,
	Row,
	Segmented,
	Stepper,
	T,
	Toggle,
} from "@/src/components/ui";
import { VTaperFigure } from "@/src/components/vtaper-figure";
import {
	recommendedSplit,
	SPLITS,
	splitById,
	trainingWeekdays,
} from "@/src/data/routines";
import { cmToFtIn, kgToLb, lbToKg } from "@/src/lib/calc";
import { todayISO } from "@/src/lib/dates";
import { scheduleReminders } from "@/src/lib/notifications";
import { IDEAL_RATIO, stageOf, vtaperRatio } from "@/src/lib/vtaper";
import { useAuth } from "@/src/state/auth";
import { useExtras } from "@/src/state/extras";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts, radius } from "@/src/theme";
import type {
	Experience,
	Gender,
	Goal,
	Profile,
	SplitId,
	Unit,
} from "@/src/types";

const STEPS = [
	"YOU",
	"BODY",
	"MEASURE",
	"PROGRAM",
	"GOAL",
	"REMINDERS",
] as const;
const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
type BodyField = "age" | "height" | "weight";

export default function Onboarding() {
	const { displayName } = useAuth();
	const { completeOnboarding } = useWorkouts();
	const { saveMeasurement } = useExtras();
	const [step, setStep] = useState(0);
	const [saving, setSaving] = useState(false);

	const [name, setName] = useState(displayName.split(" ")[0] ?? "");
	// Adonis is built for men chasing a V-taper, so the profile is male.
	const gender: Gender = "male";
	const [unit, setUnit] = useState<Unit>("kg");
	const [age, setAge] = useState(25);
	const [heightCm, setHeightCm] = useState(172);
	const [weightKg, setWeightKg] = useState(70);
	const [bodyField, setBodyField] = useState<BodyField>("weight");
	const [split, setSplit] = useState<SplitId>(recommendedSplit("intermediate"));
	const [shouldersText, setShouldersText] = useState("");
	const [waistText, setWaistText] = useState("");
	const [experience, setExperience] = useState<Experience>("intermediate");
	const [goal, setGoal] = useState<Goal>("muscle");
	const [daysPerWeek, setDaysPerWeek] = useState(4);
	const [reminderOn, setReminderOn] = useState(true);
	const [hour, setHour] = useState(18);
	const [minute, setMinute] = useState(0);
	const [days, setDays] = useState<number[]>(
		trainingWeekdays(recommendedSplit("intermediate")),
	);

	// Tape measurements are typed in cm, or inches for lb users; stored in cm.
	const toCm = (text: string) => {
		const n = Number.parseFloat(text.replace(",", "."));
		if (!Number.isFinite(n) || n <= 0) return 0;
		return unit === "kg" ? n : Math.round(n * 2.54 * 10) / 10;
	};
	const shouldersCm = toCm(shouldersText);
	const waistCm = toCm(waistText);
	const ratio = vtaperRatio(shouldersCm, waistCm);

	const pickExperience = (value: Experience) => {
		setExperience(value);
		pickSplit(recommendedSplit(value));
	};

	const pickSplit = (id: SplitId) => {
		setSplit(id);
		const trainDays = trainingWeekdays(id);
		if (trainDays.length) {
			setDaysPerWeek(trainDays.length);
			setDays(trainDays);
		}
	};

	const back = () => (step > 0 ? setStep(step - 1) : undefined);

	// Hardware back walks back through the steps instead of leaving the app.
	useBackHandler(step > 0 ? back : null);

	const canContinue = step !== 0 || name.trim().length > 0;

	const finish = async () => {
		setSaving(true);
		const profile: Profile = {
			name: name.trim(),
			gender,
			age,
			heightCm,
			weightKg,
			split,
			experience,
			goal,
			daysPerWeek,
			reminder: { enabled: reminderOn, hour, minute, days },
			onboardedAt: Date.now(),
		};
		try {
			await scheduleReminders(profile.reminder, profile.name).catch(() => {});
			if (ratio > 0)
				saveMeasurement({
					date: todayISO(),
					shoulders: shouldersCm,
					waist: waistCm,
					weightKg,
				});
			await completeOnboarding(profile, unit);
		} finally {
			setSaving(false);
		}
	};

	const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());

	return (
		<SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
			<View style={styles.topBar}>
				<IconButton
					icon={ChevronLeft}
					label="Back"
					onPress={back}
					style={{ opacity: step === 0 ? 0 : 1 }}
				/>
				<View style={{ flex: 1, flexDirection: "row", gap: 4 }}>
					{STEPS.map((s, i) => (
						<View
							key={s}
							style={[
								styles.progress,
								{
									backgroundColor:
										i <= step ? colors.accent : colors.surfaceRaised,
								},
							]}
						/>
					))}
				</View>
				<T variant="label" style={{ letterSpacing: 0 }}>
					{String(step + 1).padStart(2, "0")}/
					{String(STEPS.length).padStart(2, "0")}
				</T>
			</View>

			<KeyboardAwareScrollView
				bottomOffset={24}
				contentContainerStyle={styles.body}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<T variant="label">
					STEP {String(step + 1).padStart(2, "0")} — {STEPS[step]}
				</T>

				{step === 0 && (
					<>
						<Headline text="What should we call you" mark="?" />
						<T style={styles.sub}>
							Your name shows up on your workouts and reminders.
						</T>
						<Field
							label="Name"
							value={name}
							onChangeText={setName}
							placeholder="Your first name"
							autoCapitalize="words"
							returnKeyType="done"
							style={{ marginTop: 24 }}
						/>
					</>
				)}

				{step === 1 && (
					<>
						<Headline text="Tell us about yourself" mark="." />
						<T style={styles.sub}>
							Used to set starting weights and estimate calories. It never
							leaves your phone.
						</T>
						<Row style={{ justifyContent: "space-between", marginTop: 24 }}>
							<T variant="label">Body</T>
							<Segmented
								options={[
									{ value: "kg", label: "KG · CM" },
									{ value: "lbs", label: "LB · FT" },
								]}
								value={unit}
								onChange={setUnit}
							/>
						</Row>
						<View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
							<BodyTile
								label="Age"
								value={String(age)}
								unit="years"
								active={bodyField === "age"}
								onPress={() => setBodyField("age")}
							/>
							<BodyTile
								label="Height"
								value={
									unit === "kg"
										? String(heightCm)
										: `${cmToFtIn(heightCm).ft}'${cmToFtIn(heightCm).inch}"`
								}
								unit={unit === "kg" ? "cm" : "ft · in"}
								active={bodyField === "height"}
								onPress={() => setBodyField("height")}
							/>
							<BodyTile
								label="Weight"
								value={
									unit === "kg"
										? weightKg.toFixed(1)
										: String(Math.round(kgToLb(weightKg)))
								}
								unit={unit === "kg" ? "kg" : "lb"}
								active={bodyField === "weight"}
								onPress={() => setBodyField("weight")}
							/>
						</View>
						<View style={{ marginTop: 18 }}>
							{bodyField === "age" && (
								<Ruler
									key="age"
									accessibilityLabel="Age in years"
									value={age}
									min={13}
									max={90}
									step={1}
									majorEvery={5}
									onChange={setAge}
								/>
							)}
							{bodyField === "height" && unit === "kg" && (
								<Ruler
									key="cm"
									accessibilityLabel="Height in centimetres"
									value={heightCm}
									min={120}
									max={220}
									step={1}
									majorEvery={10}
									onChange={setHeightCm}
								/>
							)}
							{bodyField === "height" && unit === "lbs" && (
								<Ruler
									key="in"
									accessibilityLabel="Height in inches"
									value={Math.round(heightCm / 2.54)}
									min={48}
									max={87}
									step={1}
									majorEvery={12}
									formatMajor={(v) => `${Math.floor(v / 12)}'`}
									onChange={(inches) => setHeightCm(Math.round(inches * 2.54))}
								/>
							)}
							{bodyField === "weight" && unit === "kg" && (
								<Ruler
									key="kg"
									accessibilityLabel="Weight in kilograms"
									value={Math.round(weightKg * 2) / 2}
									min={30}
									max={200}
									step={0.5}
									majorEvery={10}
									onChange={setWeightKg}
								/>
							)}
							{bodyField === "weight" && unit === "lbs" && (
								<Ruler
									key="lb"
									accessibilityLabel="Weight in pounds"
									value={Math.round(kgToLb(weightKg))}
									min={66}
									max={440}
									step={1}
									majorEvery={10}
									onChange={(lb) =>
										setWeightKg(Math.round(lbToKg(lb) * 10) / 10)
									}
								/>
							)}
						</View>
					</>
				)}

				{step === 2 && (
					<>
						<Headline text="Where is your V today" mark="?" />
						<T style={styles.sub}>
							Your shoulder-to-waist ratio is the number Adonis helps you move.
							A tape measure takes a minute — or skip and add it later.
						</T>
						<View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
							<Field
								style={{ flex: 1 }}
								label={`Shoulders (${unit === "kg" ? "cm" : "in"})`}
								value={shouldersText}
								onChangeText={setShouldersText}
								keyboardType="decimal-pad"
								placeholder={unit === "kg" ? "120" : "47"}
							/>
							<Field
								style={{ flex: 1 }}
								label={`Waist (${unit === "kg" ? "cm" : "in"})`}
								value={waistText}
								onChangeText={setWaistText}
								keyboardType="decimal-pad"
								placeholder={unit === "kg" ? "82" : "32"}
							/>
						</View>
						<T variant="small" style={{ marginTop: 10 }}>
							Shoulders: around the widest point over the deltoids, arms
							relaxed. Waist: at the navel, after a normal breath out.
						</T>
						<View
							style={[
								styles.splitCard,
								{ marginTop: 18, alignItems: "center" },
							]}
						>
							<T variant="label">SHOULDER : WAIST</T>
							<T
								style={{
									fontFamily: fonts.monoBold,
									fontSize: 40,
									lineHeight: 46,
									color: ratio > 0 ? colors.text : colors.faint,
								}}
							>
								{ratio > 0 ? ratio.toFixed(2) : "—"}
							</T>
							<T variant="small">
								{ratio > 0
									? `${stageOf(ratio).name} · goal ${IDEAL_RATIO}`
									: `Goal ${IDEAL_RATIO}`}
							</T>
							<View style={{ width: "100%" }}>
								<VTaperFigure ratio={ratio} ideal={IDEAL_RATIO} height={150} />
							</View>
						</View>
					</>
				)}

				{step === 3 && (
					<>
						<Headline text="Pick your program" mark="." />
						<View style={{ gap: 8, marginTop: 20 }}>
							<T variant="label">Training age</T>
							<View style={{ flexDirection: "row", gap: 8 }}>
								{(
									[
										["beginner", "< 1 yr"],
										["intermediate", "1–3 yrs"],
										["advanced", "3+ yrs"],
									] as [Experience, string][]
								).map(([value, label]) => (
									<Chip
										key={value}
										label={label}
										selected={experience === value}
										onPress={() => pickExperience(value)}
										style={{ flex: 1 }}
									/>
								))}
							</View>
						</View>
						<View style={{ gap: 8, marginTop: 20 }}>
							{SPLITS.map((s) => {
								const selected = split === s.id;
								const trainDays = s.week.filter(Boolean).length;
								return (
									<Pressable
										key={s.id}
										accessibilityRole="radio"
										accessibilityState={{ selected }}
										onPress={() => pickSplit(s.id)}
										style={[
											styles.splitCard,
											selected && {
												borderColor: colors.accent,
												borderWidth: 1.5,
												backgroundColor: colors.surface,
											},
											s.id === "custom" &&
												!selected && { borderStyle: "dashed" },
										]}
									>
										<Row gap={12}>
											<View style={{ flex: 1, gap: 2 }}>
												{s.id === recommendedSplit(experience) ? (
													<T
														variant="label"
														style={{ color: colors.accent, fontSize: 10 }}
													>
														RECOMMENDED
													</T>
												) : null}
												<T variant="heading">{s.name}</T>
												<T variant="small">{s.description}</T>
											</View>
											{s.id === "custom" ? (
												<Plus size={18} color={colors.muted} />
											) : (
												<T
													variant="label"
													style={{
														color: selected ? colors.accent : colors.muted,
														letterSpacing: 0.5,
													}}
												>
													{trainDays}D/WK
												</T>
											)}
										</Row>
										{selected && s.id !== "custom" ? (
											<View
												style={{ flexDirection: "row", gap: 4, marginTop: 12 }}
											>
												{s.week.map((label, i) => (
													<View
														// biome-ignore lint/suspicious/noArrayIndexKey: one cell per weekday, position is the identity
														key={`${s.id}-${WEEK_LETTERS[i]}-${i}`}
														style={[styles.weekCell, !label && styles.restCell]}
													>
														<T
															variant="label"
															style={{ fontSize: 9, letterSpacing: 0 }}
														>
															{WEEK_LETTERS[i]}
														</T>
														<T
															style={{
																fontFamily: label ? fonts.monoBold : fonts.mono,
																fontSize: 9,
																color: label ? colors.text : colors.muted,
															}}
														>
															{label ?? "REST"}
														</T>
													</View>
												))}
											</View>
										) : null}
									</Pressable>
								);
							})}
						</View>
					</>
				)}

				{step === 4 && (
					<>
						<Headline text="What are you training for" mark="?" />
						<View style={{ gap: 8, marginTop: 20 }}>
							<T variant="label">Main goal</T>
							<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
								{(
									[
										["muscle", "Build the V — add size"],
										["fat_loss", "Cut the waist"],
										["general", "Hybrid athlete — look and perform"],
									] as [Goal, string][]
								).map(([value, label]) => (
									<Chip
										key={value}
										label={label}
										selected={goal === value}
										onPress={() => setGoal(value)}
										style={{ flexBasis: "100%" }}
									/>
								))}
							</View>
						</View>
						<View style={[styles.splitCard, { marginTop: 20 }]}>
							<Row style={{ justifyContent: "space-between" }}>
								<View style={{ gap: 2 }}>
									<T variant="heading">Days per week</T>
									<T variant="small">{splitById(split).name}</T>
								</View>
								<Stepper
									value={daysPerWeek}
									onChange={setDaysPerWeek}
									min={1}
									max={7}
								/>
							</Row>
						</View>
					</>
				)}

				{step === 5 && (
					<>
						<Headline text="When should we nudge you" mark="?" />
						<T style={styles.sub}>
							A local reminder on your training days. No account needed, nothing
							sent to a server.
						</T>
						<View style={[styles.splitCard, { marginTop: 22 }]}>
							<Row style={{ justifyContent: "space-between" }}>
								<T variant="heading">Workout reminders</T>
								<Toggle
									value={reminderOn}
									onChange={setReminderOn}
									label="Workout reminders"
								/>
							</Row>
						</View>
						{reminderOn ? (
							<>
								<View style={{ gap: 8, marginTop: 18 }}>
									<T variant="label">Time</T>
									<Row style={{ justifyContent: "space-between" }} gap={4}>
										<Stepper
											value={hour}
											onChange={(h) => setHour((h + 24) % 24)}
											min={-1}
											max={24}
											format={(h) => String(h).padStart(2, "0")}
										/>
										<T
											variant="mono"
											style={{ fontSize: 22, color: colors.muted }}
										>
											:
										</T>
										<Stepper
											value={minute}
											onChange={(m) => setMinute((m + 60) % 60)}
											step={15}
											min={-15}
											max={60}
											format={(m) => String(m).padStart(2, "0")}
										/>
									</Row>
								</View>
								<View style={{ gap: 8, marginTop: 18 }}>
									<T variant="label">Days</T>
									<View style={{ flexDirection: "row", gap: 4 }}>
										{WEEK_LETTERS.map((letter, mondayIndex) => {
											const jsDay = (mondayIndex + 1) % 7;
											const on = days.includes(jsDay);
											return (
												<Pressable
													key={`${letter}-${jsDay}`}
													accessibilityRole="checkbox"
													accessibilityState={{ checked: on }}
													accessibilityLabel={
														[
															"Monday",
															"Tuesday",
															"Wednesday",
															"Thursday",
															"Friday",
															"Saturday",
															"Sunday",
														][mondayIndex]
													}
													onPress={() =>
														setDays(
															on
																? days.filter((d) => d !== jsDay)
																: [...days, jsDay],
														)
													}
													style={[
														styles.dayToggle,
														on && {
															borderColor: colors.accent,
															borderWidth: 1.5,
															backgroundColor: colors.surface,
														},
													]}
												>
													<T
														style={{
															fontFamily: fonts.monoMedium,
															color: on ? colors.text : colors.muted,
														}}
													>
														{letter}
													</T>
												</Pressable>
											);
										})}
									</View>
								</View>
							</>
						) : null}
					</>
				)}
			</KeyboardAwareScrollView>

			<View style={styles.footer}>
				<Button
					title={step === STEPS.length - 1 ? "Start training" : "Continue"}
					icon={ArrowRight}
					iconRight
					onPress={next}
					loading={saving}
					disabled={!canContinue}
				/>
			</View>
		</SafeAreaView>
	);
}

function Headline({ text, mark }: { text: string; mark: string }) {
	return (
		<T style={styles.headline}>
			{text}
			<T style={[styles.headline, { color: colors.accent }]}>{mark}</T>
		</T>
	);
}

function BodyTile({
	label,
	value,
	unit,
	active,
	onPress,
}: {
	label: string;
	value: string;
	unit: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ selected: active }}
			accessibilityLabel={`${label} ${value} ${unit}`}
			onPress={onPress}
			style={[
				styles.tile,
				active && { borderColor: colors.accent, borderWidth: 1.5 },
			]}
		>
			<T
				variant="label"
				style={{ fontSize: 10, color: active ? colors.accent : colors.muted }}
			>
				{label}
			</T>
			<T
				variant="mono"
				style={{ fontSize: 26, lineHeight: 30 }}
				numberOfLines={1}
				adjustsFontSizeToFit
			>
				{value}
			</T>
			<T variant="small" style={{ fontSize: 12 }}>
				{unit}
			</T>
		</Pressable>
	);
}

function useBackHandler(handler: (() => void) | null) {
	const ref = useRef(handler);
	ref.current = handler;
	useEffect(() => {
		const sub = BackHandler.addEventListener("hardwareBackPress", () => {
			if (!ref.current) return false;
			ref.current();
			return true;
		});
		return () => sub.remove();
	}, []);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.bg },
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	progress: { flex: 1, height: 4, borderRadius: 2 },
	body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
	headline: {
		fontFamily: fonts.display,
		fontSize: 31,
		lineHeight: 34,
		letterSpacing: -0.6,
		color: colors.text,
		marginTop: 10,
	},
	sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
	tile: {
		flex: 1,
		backgroundColor: colors.surface,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 12,
		gap: 4,
	},
	splitCard: {
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 14,
	},
	weekCell: {
		flex: 1,
		height: 44,
		borderRadius: 9,
		backgroundColor: colors.control,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
	},
	restCell: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderStyle: "dashed",
		borderColor: colors.lineStrong,
	},
	dayToggle: {
		flex: 1,
		height: 44,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
	},
	footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
});
