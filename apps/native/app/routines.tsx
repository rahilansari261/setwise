import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ChevronLeft,
	Download,
	FolderPlus,
	Plus,
	Share2,
	Trash,
	X,
} from "lucide-react-native";
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
	Chip,
	Field,
	IconButton,
	Row,
	Screen,
	Sheet,
	T,
} from "@/src/components/ui";
import { BUILT_IN_ROUTINE_IDS } from "@/src/data/routines";
import {
	parseRoutineBundle,
	pickBackupText,
	shareRoutine,
} from "@/src/lib/backup";
import { todayISO } from "@/src/lib/dates";
import { FREE_ROUTINE_LIMIT } from "@/src/lib/pro";
import { extraId, useExtras } from "@/src/state/extras";
import { usePremium, useProGate } from "@/src/state/premium";
import { useToast } from "@/src/state/toast";
import { newId, useWorkouts } from "@/src/state/workout-store";
import { colors, fonts, TAP } from "@/src/theme";
import type { Routine, RoutineDay } from "@/src/types";

export default function Routines() {
	const router = useRouter();
	const { date = todayISO() } = useLocalSearchParams<{ date?: string }>();
	const store = useWorkouts();
	const extras = useExtras();
	const { isPro } = usePremium();
	const gate = useProGate();
	const toast = useToast();
	const [editing, setEditing] = useState<Routine | null>(null);
	const [scope, setScope] = useState<string>("all");
	const [foldersOpen, setFoldersOpen] = useState(false);
	const [newFolder, setNewFolder] = useState("");
	const [filing, setFiling] = useState<Routine | null>(null);

	const customCount = store.routines.filter(
		(r) => !BUILT_IN_ROUTINE_IDS.has(r.id),
	).length;
	const atLimit = !isPro && customCount >= FREE_ROUTINE_LIMIT;
	const visible = store.routines.filter(
		(r) =>
			scope === "all" ||
			(scope === "none" ? !r.folderId : r.folderId === scope),
	);

	const startNew = () => {
		if (atLimit) return gate("unlimitedRoutines", () => {});
		setEditing({
			id: newId("routine"),
			name: "",
			description: "",
			days: [],
		});
	};

	const importFromFile = async () => {
		if (atLimit) return gate("unlimitedRoutines", () => {});
		try {
			const text = await pickBackupText();
			if (!text) return;
			const bundle = parseRoutineBundle(text);
			store.importRoutine(bundle);
			toast(`Added ${bundle.routine.name}`);
		} catch (e) {
			Alert.alert(
				"Couldn't import",
				e instanceof Error ? e.message : String(e),
			);
		}
	};

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
					icon={Download}
					label="Import a routine file"
					onPress={importFromFile}
				/>
				<IconButton icon={Plus} label="New routine" onPress={startNew} />
			</Row>

			{!isPro ? (
				<T variant="small" style={{ marginTop: 10 }}>
					{customCount}/{FREE_ROUTINE_LIMIT} custom routines on the free plan.
				</T>
			) : null}

			<Row gap={6} style={{ marginTop: 12, flexWrap: "wrap" }}>
				<Chip
					label="All"
					selected={scope === "all"}
					onPress={() => setScope("all")}
					style={{ minHeight: 36 }}
				/>
				{extras.routineFolders.map((f) => (
					<Chip
						key={f.id}
						label={f.name}
						selected={scope === f.id}
						onPress={() => setScope(f.id)}
						style={{ minHeight: 36 }}
					/>
				))}
				{extras.routineFolders.length > 0 ? (
					<Chip
						label="No folder"
						selected={scope === "none"}
						onPress={() => setScope("none")}
						style={{ minHeight: 36 }}
					/>
				) : null}
				<Chip
					label={isPro ? "+ Folder" : "+ Folder · PRO"}
					onPress={() => gate("routineFolders", () => setFoldersOpen(true))}
					style={{ minHeight: 36 }}
				/>
			</Row>

			<View style={{ gap: 12, marginTop: 16 }}>
				{visible.map((routine) => {
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
								<IconButton
									icon={FolderPlus}
									label={`Put ${routine.name} in a folder`}
									onPress={() =>
										gate("routineFolders", () => setFiling(routine))
									}
								/>
								<IconButton
									icon={Share2}
									label={`Share ${routine.name}`}
									onPress={() =>
										gate("routineShare", () =>
											shareRoutine(routine, store.customExercises).catch((e) =>
												Alert.alert(
													"Couldn't share",
													e instanceof Error ? e.message : String(e),
												),
											),
										)
									}
								/>
							</Row>
						</Card>
					);
				})}
			</View>

			<Sheet
				visible={foldersOpen}
				title="ROUTINE FOLDERS"
				onClose={() => setFoldersOpen(false)}
			>
				<View style={{ gap: 6 }}>
					{extras.routineFolders.map((f) => (
						<Row key={f.id}>
							<T style={{ flex: 1 }}>{f.name}</T>
							<IconButton
								icon={Trash}
								label={`Delete folder ${f.name}`}
								bordered={false}
								size={18}
								color={colors.muted}
								onPress={() => {
									for (const r of store.routines)
										if (r.folderId === f.id)
											store.saveRoutine({ ...r, folderId: undefined });
									extras.deleteRoutineFolder(f.id);
									if (scope === f.id) setScope("all");
								}}
							/>
						</Row>
					))}
				</View>
				<Field
					style={{ marginTop: 12 }}
					label="New folder"
					value={newFolder}
					onChangeText={setNewFolder}
					placeholder="e.g. Cutting phase"
				/>
				<Button
					title="Create folder"
					style={{ marginTop: 12 }}
					disabled={!newFolder.trim()}
					onPress={() => {
						extras.saveRoutineFolder({
							id: extraId("rf"),
							name: newFolder.trim(),
						});
						setNewFolder("");
					}}
				/>
			</Sheet>
			<Sheet
				visible={filing !== null}
				title="MOVE TO FOLDER"
				onClose={() => setFiling(null)}
			>
				<Row gap={6} style={{ flexWrap: "wrap" }}>
					<Chip
						label="No folder"
						selected={!filing?.folderId}
						onPress={() => {
							if (filing) store.saveRoutine({ ...filing, folderId: undefined });
							setFiling(null);
						}}
					/>
					{extras.routineFolders.map((f) => (
						<Chip
							key={f.id}
							label={f.name}
							selected={filing?.folderId === f.id}
							onPress={() => {
								if (filing) store.saveRoutine({ ...filing, folderId: f.id });
								setFiling(null);
							}}
						/>
					))}
				</Row>
				{extras.routineFolders.length === 0 ? (
					<T variant="small" style={{ marginTop: 8 }}>
						Create a folder first with “+ Folder”.
					</T>
				) : null}
			</Sheet>

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
