import { Plus, Trash } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExerciseList } from "@/src/components/exercise-list";
import { FillBar } from "@/src/components/motion";
import { ProScreen } from "@/src/components/pro-screen";
import {
	Button,
	Card,
	Chip,
	Field,
	IconButton,
	Row,
	Sheet,
	T,
} from "@/src/components/ui";
import { fmt, kgToLb } from "@/src/lib/calc";
import { todayISO } from "@/src/lib/dates";
import { goalProgress, latestBodyweightKg } from "@/src/lib/insights";
import { extraId, useExtras } from "@/src/state/extras";
import { useToast } from "@/src/state/toast";
import { useWorkouts } from "@/src/state/workout-store";
import { colors } from "@/src/theme";
import type { TargetGoal, TargetKind } from "@/src/types";

const KINDS: { value: TargetKind; label: string }[] = [
	{ value: "bodyweight", label: "Body weight" },
	{ value: "lift", label: "Lift e1RM" },
	{ value: "weekly_workouts", label: "Workouts / week" },
];

export default function Goals() {
	const { goals, saveGoal, deleteGoal, measurements } = useExtras();
	const { workouts, settings, profile, exerciseById } = useWorkouts();
	const toast = useToast();
	const [adding, setAdding] = useState(false);
	const [kind, setKind] = useState<TargetKind>("bodyweight");
	const [target, setTarget] = useState("");
	const [exerciseId, setExerciseId] = useState<string | null>(null);
	const [picking, setPicking] = useState(false);
	const today = todayISO();

	const ctx = useMemo(
		() => ({
			workouts,
			measurements,
			profileKg: profile?.weightKg ?? 0,
			unit: settings.unit,
			today,
		}),
		[workouts, measurements, profile, settings.unit, today],
	);

	const create = () => {
		const value = Number.parseFloat(target.replace(",", "."));
		if (!Number.isFinite(value) || value <= 0) return;
		if (kind === "lift" && !exerciseId) return;
		const probe: TargetGoal = {
			id: extraId("goal"),
			kind,
			title: "",
			target: value,
			start: 0,
			exerciseId: exerciseId ?? undefined,
			createdAt: today,
		};
		// Where you stand now becomes the starting line, so progress reads 0% at creation.
		const start =
			kind === "weekly_workouts" ? 0 : goalProgress(probe, ctx).current;
		const name = exerciseId ? exerciseById.get(exerciseId)?.name : undefined;
		saveGoal({
			...probe,
			start,
			title:
				kind === "bodyweight"
					? `Reach ${fmt(value)} ${settings.unit}`
					: kind === "lift"
						? `${name} e1RM ${fmt(value)} ${settings.unit}`
						: `Train ${value} days a week`,
		});
		setAdding(false);
		setTarget("");
		setExerciseId(null);
		toast("Goal added");
	};

	const bodyNow =
		settings.unit === "lbs"
			? kgToLb(latestBodyweightKg(measurements, profile?.weightKg ?? 0))
			: latestBodyweightKg(measurements, profile?.weightKg ?? 0);

	return (
		<ProScreen
			feature="goals"
			title="Goals"
			right={
				<IconButton
					icon={Plus}
					label="New goal"
					onPress={() => setAdding(true)}
				/>
			}
		>
			<View style={{ gap: 10, marginTop: 16 }}>
				{goals.map((g) => {
					const p = goalProgress(g, ctx);
					return (
						<Card key={g.id} active={p.done}>
							<Row>
								<View style={{ flex: 1 }}>
									<T variant="heading">{g.title}</T>
									<T variant="small">
										Now {fmt(p.current)}
										{g.kind === "weekly_workouts"
											? " this week"
											: ` ${settings.unit}`}
										{p.done ? " · reached 🎉" : ""}
									</T>
								</View>
								<IconButton
									icon={Trash}
									label={`Delete goal ${g.title}`}
									bordered={false}
									size={18}
									color={colors.muted}
									onPress={() =>
										Alert.alert("Delete this goal?", undefined, [
											{ text: "Cancel", style: "cancel" },
											{
												text: "Delete",
												style: "destructive",
												onPress: () => deleteGoal(g.id),
											},
										])
									}
								/>
							</Row>
							<View
								style={{
									height: 8,
									borderRadius: 4,
									backgroundColor: colors.hairline,
									marginTop: 10,
								}}
							>
								<FillBar
									fraction={p.fraction}
									style={{
										height: 8,
										borderRadius: 4,
										backgroundColor: colors.accent,
									}}
								/>
							</View>
						</Card>
					);
				})}
				{goals.length === 0 ? (
					<Card>
						<T variant="heading">No goals yet</T>
						<T variant="small" style={{ marginTop: 4 }}>
							Set a lift target, a goal weight or a weekly training habit.
						</T>
						<Button
							title="Add a goal"
							style={{ marginTop: 12 }}
							onPress={() => setAdding(true)}
						/>
					</Card>
				) : null}
			</View>

			<Sheet visible={adding} title="NEW GOAL" onClose={() => setAdding(false)}>
				<Row gap={6} style={{ flexWrap: "wrap" }}>
					{KINDS.map((k) => (
						<Chip
							key={k.value}
							label={k.label}
							selected={kind === k.value}
							onPress={() => setKind(k.value)}
						/>
					))}
				</Row>
				{kind === "lift" ? (
					<Button
						title={
							exerciseId
								? (exerciseById.get(exerciseId)?.name ?? "Pick exercise")
								: "Pick exercise"
						}
						variant="secondary"
						compact
						style={{ marginTop: 12 }}
						onPress={() => setPicking(true)}
					/>
				) : null}
				<Field
					style={{ marginTop: 12 }}
					label={
						kind === "weekly_workouts"
							? "Days per week"
							: `Target (${settings.unit})${kind === "bodyweight" ? ` · now ${fmt(bodyNow)}` : ""}`
					}
					value={target}
					onChangeText={setTarget}
					keyboardType="decimal-pad"
				/>
				<Button
					title="Create goal"
					style={{ marginTop: 16 }}
					onPress={create}
				/>
			</Sheet>

			<Modal
				visible={picking}
				animationType="slide"
				onRequestClose={() => setPicking(false)}
				statusBarTranslucent
			>
				<SafeAreaView
					style={{ flex: 1, backgroundColor: colors.bg }}
					edges={["top", "bottom"]}
				>
					<ExerciseList
						onPress={(e) => {
							setExerciseId(e.id);
							setPicking(false);
						}}
					/>
				</SafeAreaView>
			</Modal>
		</ProScreen>
	);
}
