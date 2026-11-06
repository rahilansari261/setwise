import { Check, FolderPlus, Search, Star, Trash, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
	FlatList,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
	Button,
	Chip,
	Field,
	IconButton,
	Row,
	Sheet,
	T,
} from "@/src/components/ui";
import { CATEGORIES, CATEGORY_COLOR } from "@/src/data/exercises";
import { PICK_ORDER } from "@/src/data/vtaper-picks";
import { EQUIPMENT, equipmentOf } from "@/src/lib/sets";
import { extraId, useExtras } from "@/src/state/extras";
import { useT } from "@/src/state/i18n";
import { usePremium, useProGate } from "@/src/state/premium";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";
import type { Category, Equipment, Exercise, MetricType } from "@/src/types";

const METRICS: { value: MetricType; label: string }[] = [
	{ value: "weight_reps", label: "Weight × reps" },
	{ value: "reps_only", label: "Reps only" },
	{ value: "time_only", label: "Time" },
	{ value: "distance_time", label: "Distance + time" },
];

/** Lower is better: name starts with the query, then a word does, then a V-taper pick, then the rest. */
function searchRank(e: Exercise, q: string): number {
	const name = e.name.toLowerCase();
	const base = name.startsWith(q) ? 0 : name.includes(` ${q}`) ? 2 : 4;
	return base + (PICK_ORDER.has(e.id) || e.isCustom ? 0 : 1);
}

export function ExerciseList({
	selected,
	onPress,
	header,
	bottomPadding = 24,
}: {
	selected?: Set<string>;
	onPress: (exercise: Exercise) => void;
	header?: React.ReactNode;
	bottomPadding?: number;
}) {
	const { exercises } = useWorkouts();
	const extras = useExtras();
	const t = useT();
	const { isPro } = usePremium();
	const gate = useProGate();
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<Category | "All">("All");
	const [equipment, setEquipment] = useState<Equipment | "All">("All");
	const [scope, setScope] = useState<"vtaper" | "all" | "favorites" | string>(
		"vtaper",
	);
	const [menuFor, setMenuFor] = useState<Exercise | null>(null);
	const [foldersOpen, setFoldersOpen] = useState(false);
	const [newFolder, setNewFolder] = useState("");

	const favorites = useMemo(
		() => new Set(extras.favorites),
		[extras.favorites],
	);
	const folder = extras.exerciseFolders.find((f) => f.id === scope);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		const inFolder = folder ? new Set(folder.exerciseIds) : null;
		// The short list is only the starting view: typing a search looks through everything.
		const picksOnly = scope === "vtaper" && !q;
		return exercises
			.filter(
				(e) =>
					(!picksOnly || PICK_ORDER.has(e.id) || e.isCustom) &&
					(category === "All" || e.category === category) &&
					(equipment === "All" || equipmentOf(e) === equipment) &&
					(scope !== "favorites" || favorites.has(e.id)) &&
					(!inFolder || inFolder.has(e.id)) &&
					(!q ||
						e.name.toLowerCase().includes(q) ||
						(e.target ?? "").includes(q)),
			)
			.sort(
				(a, b) =>
					(picksOnly
						? (PICK_ORDER.get(a.id) ?? 999) - (PICK_ORDER.get(b.id) ?? 999)
						: 0) ||
					(q ? searchRank(a, q) - searchRank(b, q) : 0) ||
					Number(favorites.has(b.id)) - Number(favorites.has(a.id)) ||
					Number(Boolean(b.isCustom)) - Number(Boolean(a.isCustom)) ||
					a.name.localeCompare(b.name),
			);
	}, [exercises, query, category, equipment, scope, favorites, folder]);

	return (
		<>
			<FlatList
				data={filtered}
				keyExtractor={(e) => e.id}
				keyboardShouldPersistTaps="handled"
				initialNumToRender={14}
				windowSize={7}
				contentContainerStyle={{
					paddingHorizontal: 16,
					paddingBottom: bottomPadding,
				}}
				ListHeaderComponent={
					<View style={{ gap: 12, paddingBottom: 8 }}>
						{header}
						<View style={styles.search}>
							<Search size={18} color={colors.muted} />
							<TextInput
								value={query}
								onChangeText={setQuery}
								placeholder={t("Search exercises")}
								placeholderTextColor={colors.faint}
								selectionColor={colors.accent}
								style={styles.searchInput}
								autoCorrect={false}
							/>
							{query ? (
								<IconButton
									icon={X}
									label="Clear search"
									bordered={false}
									size={16}
									onPress={() => setQuery("")}
								/>
							) : null}
						</View>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 6 }}
						>
							{(["All", ...CATEGORIES] as const).map((c) => (
								<Chip
									key={c}
									label={c}
									raw={c !== "All"}
									selected={category === c}
									onPress={() => setCategory(c)}
									style={{ minHeight: 38 }}
								/>
							))}
						</ScrollView>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 6 }}
						>
							{(["All", ...EQUIPMENT] as const).map((c) => (
								<Chip
									key={c}
									label={c === "All" ? "Any equipment" : c}
									selected={equipment === c}
									onPress={() => setEquipment(c)}
									style={{ minHeight: 34 }}
								/>
							))}
						</ScrollView>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 6, alignItems: "center" }}
						>
							<Chip
								label="V-taper picks"
								selected={scope === "vtaper"}
								onPress={() => setScope("vtaper")}
								style={{ minHeight: 34 }}
							/>
							<Chip
								label="All"
								selected={scope === "all"}
								onPress={() => setScope("all")}
								style={{ minHeight: 34 }}
							/>
							<Chip
								label="★ Favorites"
								selected={scope === "favorites"}
								onPress={() => setScope("favorites")}
								style={{ minHeight: 34 }}
							/>
							{extras.exerciseFolders.map((f) => (
								<Chip
									key={f.id}
									label={f.name}
									selected={scope === f.id}
									onPress={() => setScope(f.id)}
									style={{ minHeight: 34 }}
								/>
							))}
							<Chip
								label={isPro ? "+ Folder" : "+ Folder · PRO"}
								onPress={() =>
									gate("exerciseFolders", () => setFoldersOpen(true))
								}
								style={{ minHeight: 34 }}
							/>
						</ScrollView>
					</View>
				}
				ListEmptyComponent={
					<T variant="small" style={{ textAlign: "center", marginTop: 32 }}>
						{scope === "favorites"
							? "Tap the star on an exercise to pin it here."
							: query
								? `No exercise matches “${query}”.`
								: "Nothing here yet."}
					</T>
				}
				renderItem={({ item }) => {
					const isSelected = selected?.has(item.id) ?? false;
					return (
						<Pressable
							accessibilityRole={selected ? "checkbox" : "button"}
							accessibilityState={
								selected ? { checked: isSelected } : undefined
							}
							onPress={() => onPress(item)}
							onLongPress={() => setMenuFor(item)}
							style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
						>
							<View
								style={[
									styles.catBar,
									{ backgroundColor: CATEGORY_COLOR[item.category] },
								]}
							/>
							<View style={{ flex: 1, gap: 2 }}>
								<T style={{ fontFamily: fonts.bodyMedium }}>{item.name}</T>
								<T variant="label" style={{ fontSize: 10, letterSpacing: 1 }}>
									{item.category} · {equipmentOf(item).toUpperCase()}
									{item.isCustom ? " · CUSTOM" : ""}
								</T>
							</View>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={
									favorites.has(item.id)
										? `Remove ${item.name} from favorites`
										: `Favorite ${item.name}`
								}
								hitSlop={8}
								onPress={() => extras.toggleFavorite(item.id)}
								style={{ padding: 6 }}
							>
								<Star
									size={20}
									color={favorites.has(item.id) ? colors.accent : colors.faint}
									fill={favorites.has(item.id) ? colors.accent : "transparent"}
								/>
							</Pressable>
							{selected ? (
								<View
									style={[
										styles.tick,
										isSelected && {
											backgroundColor: colors.accent,
											borderColor: colors.accent,
										},
									]}
								>
									{isSelected ? (
										<Check size={14} color={colors.accentInk} strokeWidth={3} />
									) : null}
								</View>
							) : null}
						</Pressable>
					);
				}}
			/>
			<Sheet
				visible={menuFor !== null}
				title={menuFor?.name.toUpperCase()}
				onClose={() => setMenuFor(null)}
			>
				{menuFor ? (
					<View style={{ gap: 8 }}>
						<Button
							title={
								favorites.has(menuFor.id)
									? "Remove favorite"
									: "Add to favorites"
							}
							variant="secondary"
							compact
							icon={Star}
							onPress={() => {
								extras.toggleFavorite(menuFor.id);
								setMenuFor(null);
							}}
						/>
						<T variant="label" style={{ marginTop: 8 }}>
							FOLDERS {isPro ? "" : "· PRO"}
						</T>
						<Row gap={6} style={{ flexWrap: "wrap" }}>
							{extras.exerciseFolders.map((f) => {
								const on = f.exerciseIds.includes(menuFor.id);
								return (
									<Chip
										key={f.id}
										label={f.name}
										selected={on}
										onPress={() =>
											gate("exerciseFolders", () =>
												extras.saveExerciseFolder({
													...f,
													exerciseIds: on
														? f.exerciseIds.filter((x) => x !== menuFor.id)
														: [...f.exerciseIds, menuFor.id],
												}),
											)
										}
									/>
								);
							})}
							{extras.exerciseFolders.length === 0 ? (
								<T variant="small">Create a folder with “+ Folder”.</T>
							) : null}
						</Row>
					</View>
				) : null}
			</Sheet>
			<Sheet
				visible={foldersOpen}
				title="EXERCISE FOLDERS"
				onClose={() => setFoldersOpen(false)}
			>
				<View style={{ gap: 6 }}>
					{extras.exerciseFolders.map((f) => (
						<Row key={f.id}>
							<T style={{ flex: 1 }}>
								{f.name} · {f.exerciseIds.length}
							</T>
							<IconButton
								icon={Trash}
								label={`Delete folder ${f.name}`}
								bordered={false}
								size={18}
								color={colors.muted}
								onPress={() => {
									extras.deleteExerciseFolder(f.id);
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
					placeholder="e.g. Home workout"
				/>
				<Button
					title="Create folder"
					icon={FolderPlus}
					style={{ marginTop: 12 }}
					disabled={!newFolder.trim()}
					onPress={() => {
						extras.saveExerciseFolder({
							id: extraId("xf"),
							name: newFolder.trim(),
							exerciseIds: [],
						});
						setNewFolder("");
					}}
				/>
			</Sheet>
		</>
	);
}

export function CreateExerciseSheet({
	visible,
	onClose,
	onCreated,
}: {
	visible: boolean;
	onClose: () => void;
	onCreated?: (id: string) => void;
}) {
	const { addCustomExercise } = useWorkouts();
	const insets = useSafeAreaInsets();
	const [name, setName] = useState("");
	const [category, setCategory] = useState<Category>("Chest");
	const [metric, setMetric] = useState<MetricType>("weight_reps");
	const [equipment, setEquipment] = useState<Equipment>("Barbell");

	const save = () => {
		if (!name.trim()) return;
		const id = addCustomExercise({
			name: name.trim(),
			category,
			metricType: metric,
			equipment,
		});
		setName("");
		onClose();
		onCreated?.(id);
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			<Pressable
				style={{ flex: 1, backgroundColor: colors.overlay }}
				onPress={onClose}
				accessibilityLabel="Close"
			/>
			<View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
				<T variant="title">New exercise</T>
				<Field
					label="Name"
					value={name}
					onChangeText={setName}
					placeholder="e.g. Landmine Press"
					autoFocus
				/>
				<View style={{ gap: 8 }}>
					<T variant="label">Muscle group</T>
					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
						{CATEGORIES.map((c) => (
							<Chip
								key={c}
								label={c}
								raw
								selected={category === c}
								onPress={() => setCategory(c)}
								style={{ minHeight: 38 }}
							/>
						))}
					</View>
				</View>
				<View style={{ gap: 8 }}>
					<T variant="label">Equipment</T>
					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
						{EQUIPMENT.map((e) => (
							<Chip
								key={e}
								label={e}
								selected={equipment === e}
								onPress={() => setEquipment(e)}
								style={{ minHeight: 38 }}
							/>
						))}
					</View>
				</View>
				<View style={{ gap: 8 }}>
					<T variant="label">Track</T>
					<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
						{METRICS.map((m) => (
							<Chip
								key={m.value}
								label={m.label}
								selected={metric === m.value}
								onPress={() => setMetric(m.value)}
								style={{ minHeight: 38 }}
							/>
						))}
					</View>
				</View>
				<Button title="Save exercise" onPress={save} disabled={!name.trim()} />
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	search: {
		height: 48,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 14,
		gap: 8,
	},
	searchInput: {
		flex: 1,
		color: colors.text,
		fontFamily: fonts.body,
		fontSize: 16,
		height: 48,
	},
	row: {
		minHeight: 58,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.hairline,
	},
	catBar: { width: 3, height: 26, borderRadius: 2 },
	tick: {
		width: 26,
		height: 26,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: colors.lineStrong,
		alignItems: "center",
		justifyContent: "center",
	},
	sheet: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 20,
		gap: 16,
	},
});
