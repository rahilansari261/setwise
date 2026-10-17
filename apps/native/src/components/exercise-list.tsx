import { Check, Search, X } from "lucide-react-native";
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

import { Button, Chip, Field, IconButton, T } from "@/src/components/ui";
import { CATEGORIES, CATEGORY_COLOR } from "@/src/data/exercises";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";
import type { Category, Exercise, MetricType } from "@/src/types";

const METRICS: { value: MetricType; label: string }[] = [
	{ value: "weight_reps", label: "Weight × reps" },
	{ value: "reps_only", label: "Reps only" },
	{ value: "time_only", label: "Time" },
	{ value: "distance_time", label: "Distance + time" },
];

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
	const [query, setQuery] = useState("");
	const [category, setCategory] = useState<Category | "All">("All");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return exercises
			.filter(
				(e) =>
					(category === "All" || e.category === category) &&
					(!q || e.name.toLowerCase().includes(q)),
			)
			.sort(
				(a, b) =>
					Number(Boolean(b.isCustom)) - Number(Boolean(a.isCustom)) ||
					a.name.localeCompare(b.name),
			);
	}, [exercises, query, category]);

	return (
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
							placeholder="Search exercises"
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
								selected={category === c}
								onPress={() => setCategory(c)}
								style={{ minHeight: 38 }}
							/>
						))}
					</ScrollView>
				</View>
			}
			ListEmptyComponent={
				<T variant="small" style={{ textAlign: "center", marginTop: 32 }}>
					No exercise matches “{query}”.
				</T>
			}
			renderItem={({ item }) => {
				const isSelected = selected?.has(item.id) ?? false;
				return (
					<Pressable
						accessibilityRole={selected ? "checkbox" : "button"}
						accessibilityState={selected ? { checked: isSelected } : undefined}
						onPress={() => onPress(item)}
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
								{item.category}
								{item.isCustom ? " · CUSTOM" : ""}
							</T>
						</View>
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

	const save = () => {
		if (!name.trim()) return;
		const id = addCustomExercise({
			name: name.trim(),
			category,
			metricType: metric,
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
				style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
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
								selected={category === c}
								onPress={() => setCategory(c)}
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
		borderColor: "#3A3F48",
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
