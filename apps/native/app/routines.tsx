import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash, X } from "lucide-react-native";
import { useState } from "react";
import {
	Alert,
	Modal,
	Pressable,
	StyleSheet,
	TextInput,
	View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExerciseList } from "@/src/components/exercise-list";
import {
	Button,
	Card,
	Field,
	IconButton,
	Row,
	Screen,
	T,
} from "@/src/components/ui";
import { todayISO } from "@/src/lib/dates";
import { newId, useWorkouts } from "@/src/state/workout-store";
import { colors, fonts, TAP } from "@/src/theme";
import type { Routine, RoutineDay } from "@/src/types";

export default function Routines() {
	const router = useRouter();
	const { date = todayISO() } = useLocalSearchParams<{ date?: string }>();
	const store = useWorkouts();
	const [editing, setEditing] = useState<Routine | null>(null);

	return (
		<Screen stack bottomInset={32}>
			<Row gap={12}>
				<IconButton
					icon={ChevronLeft}
					label="Back"
					onPress={() => router.back()}
				/>
				<T variant="title" style={{ flex: 1 }}>
					Routines
				</T>
				<IconButton
					icon={Plus}
					label="New routine"
					onPress={() =>
						setEditing({
							id: newId("routine"),
							name: "",
							description: "",
							days: [],
						})
					}
				/>
			</Row>

			<View style={{ gap: 12, marginTop: 16 }}>
				{store.routines.map((routine) => {
					const active = store.activeRoutine?.routineId === routine.id;
					return (
						<Card key={routine.id} active={active}>
							<Row style={{ alignItems: "flex-start" }}>
								<View style={{ flex: 1, gap: 4 }}>
									{active ? (
										<T
											variant="label"
											style={{ color: colors.accent, fontSize: 10 }}
										>
											ACTIVE · NEXT:{" "}
											{
												routine.days[store.activeRoutine?.nextDayIndex ?? 0]
													?.name
											}
										</T>
									) : null}
									<T variant="heading">{routine.name}</T>
									{routine.description ? (
										<T variant="small">{routine.description}</T>
									) : null}
								</View>
								<IconButton
									icon={Trash}
									label={`Delete ${routine.name}`}
									bordered={false}
									size={18}
									color={colors.muted}
									onPress={() =>
										Alert.alert(
											`Delete ${routine.name}?`,
											"Workouts you already logged are kept.",
											[
												{ text: "Cancel", style: "cancel" },
												{
													text: "Delete",
													style: "destructive",
													onPress: () => store.deleteRoutine(routine.id),
												},
											],
										)
									}
								/>
							</Row>
							<View style={{ marginTop: 10, gap: 6 }}>
								{routine.days.map((day, i) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: routine days have no id; their order is the identity
									<Row key={`${day.name}-${i}`} style={styles.dayRow}>
										<View style={{ flex: 1 }}>
											<T style={{ fontFamily: fonts.bodyMedium }}>{day.name}</T>
											<T variant="small" numberOfLines={1}>
												{day.exerciseIds.length} exercises ·{" "}
												{day.exerciseIds
													.map((id) => store.exerciseById.get(id)?.name)
													.filter(Boolean)
													.join(", ")}
											</T>
										</View>
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={`Load ${day.name} into this workout`}
											onPress={() => {
												store.startRoutineDay(date, routine.id, i);
												router.back();
											}}
											style={styles.loadBtn}
										>
											<T
												style={{
													fontFamily: fonts.mono,
													fontSize: 12,
													color: colors.accentInk,
												}}
											>
												LOAD
											</T>
										</Pressable>
									</Row>
								))}
							</View>
							<Row gap={8} style={{ marginTop: 12 }}>
								{!active ? (
									<Button
										title="Make active"
										variant="secondary"
										compact
										style={{ flex: 1 }}
										onPress={() =>
											store.setActiveRoutine({
												routineId: routine.id,
												nextDayIndex: 0,
											})
										}
									/>
								) : null}
								<Button
									title="Edit"
									variant="secondary"
									compact
									style={{ flex: 1 }}
									onPress={() => setEditing(routine)}
								/>
							</Row>
						</Card>
					);
				})}
			</View>

			{editing ? (
				<RoutineEditor
					initial={editing}
					onClose={() => setEditing(null)}
					onSave={(r) => {
						store.saveRoutine(r);
						setEditing(null);
					}}
				/>
			) : null}
		</Screen>
	);
}

function RoutineEditor({
	initial,
	onClose,
	onSave,
}: {
	initial: Routine;
	onClose: () => void;
	onSave: (routine: Routine) => void;
}) {
	const { exerciseById } = useWorkouts();
	const [name, setName] = useState(initial.name);
	const [days, setDays] = useState<RoutineDay[]>(
		initial.days.length ? initial.days : [{ name: "Day 1", exerciseIds: [] }],
	);
	const [pickingFor, setPickingFor] = useState<number | null>(null);

	const updateDay = (i: number, patch: Partial<RoutineDay>) =>
		setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

	const valid = name.trim() && days.some((d) => d.exerciseIds.length > 0);

	return (
		<Modal
			visible
			animationType="slide"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<SafeAreaView
				style={{ flex: 1, backgroundColor: colors.bg }}
				edges={["top", "bottom"]}
			>
				<Row style={{ paddingHorizontal: 16, paddingVertical: 8 }} gap={10}>
					<IconButton icon={X} label="Close editor" onPress={onClose} />
					<T variant="title" style={{ flex: 1 }}>
						{initial.name ? "Edit routine" : "New routine"}
					</T>
				</Row>
				<KeyboardAwareScrollView
					bottomOffset={24}
					contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}
					keyboardShouldPersistTaps="handled"
				>
					<Field
						label="Name"
						value={name}
						onChangeText={setName}
						placeholder="e.g. My PPL"
					/>
					{days.map((day, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: routine days have no id and inputs are controlled
						<Card key={`day-${i}`}>
							<Row>
								<TextInput
									value={day.name}
									onChangeText={(t) => updateDay(i, { name: t })}
									style={styles.dayName}
									placeholder={`Day ${i + 1}`}
									placeholderTextColor={colors.faint}
									accessibilityLabel={`Name of day ${i + 1}`}
								/>
								<IconButton
									icon={Trash}
									label={`Remove day ${i + 1}`}
									bordered={false}
									size={18}
									color={colors.muted}
									onPress={() => setDays((ds) => ds.filter((_, j) => j !== i))}
								/>
							</Row>
							<View style={{ gap: 4, marginTop: 6 }}>
								{day.exerciseIds.map((id) => (
									<Row key={id}>
										<T style={{ flex: 1, fontSize: 14 }}>
											{exerciseById.get(id)?.name ?? id}
										</T>
										<IconButton
											icon={X}
											label="Remove exercise"
											bordered={false}
											size={16}
											color={colors.muted}
											onPress={() =>
												updateDay(i, {
													exerciseIds: day.exerciseIds.filter((x) => x !== id),
												})
											}
										/>
									</Row>
								))}
							</View>
							<Button
								title="Pick exercises"
								variant="secondary"
								compact
								icon={Plus}
								style={{ marginTop: 8 }}
								onPress={() => setPickingFor(i)}
							/>
						</Card>
					))}
					<Button
						title="Add day"
						variant="ghost"
						icon={Plus}
						onPress={() =>
							setDays((ds) => [
								...ds,
								{ name: `Day ${ds.length + 1}`, exerciseIds: [] },
							])
						}
					/>
				</KeyboardAwareScrollView>
				<View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
					<Button
						title="Save routine"
						disabled={!valid}
						onPress={() =>
							onSave({
								...initial,
								name: name.trim(),
								days: days
									.filter((d) => d.exerciseIds.length > 0)
									.map((d, i) => ({
										...d,
										name: d.name.trim() || `Day ${i + 1}`,
									})),
							})
						}
					/>
				</View>

				{pickingFor !== null ? (
					<Modal
						visible
						animationType="slide"
						onRequestClose={() => setPickingFor(null)}
						statusBarTranslucent
					>
						<SafeAreaView
							style={{ flex: 1, backgroundColor: colors.bg }}
							edges={["top", "bottom"]}
						>
							<Row
								style={{ paddingHorizontal: 16, paddingVertical: 8 }}
								gap={10}
							>
								<T variant="title" style={{ flex: 1 }}>
									{days[pickingFor]?.name}
								</T>
								<Button
									title="Done"
									compact
									style={{ paddingHorizontal: 20 }}
									onPress={() => setPickingFor(null)}
								/>
							</Row>
							<ExerciseList
								selected={new Set(days[pickingFor]?.exerciseIds ?? [])}
								onPress={(e) => {
									const ids = days[pickingFor]?.exerciseIds ?? [];
									updateDay(pickingFor, {
										exerciseIds: ids.includes(e.id)
											? ids.filter((x) => x !== e.id)
											: [...ids, e.id],
									});
								}}
							/>
						</SafeAreaView>
					</Modal>
				) : null}
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	dayRow: {
		minHeight: 52,
		borderTopWidth: 1,
		borderTopColor: colors.hairline,
		paddingTop: 6,
	},
	loadBtn: {
		height: 36,
		paddingHorizontal: 14,
		borderRadius: 10,
		backgroundColor: colors.accent,
		alignItems: "center",
		justifyContent: "center",
		minWidth: TAP,
	},
	dayName: {
		flex: 1,
		color: colors.text,
		fontFamily: fonts.display,
		fontSize: 17,
		height: TAP,
	},
});
