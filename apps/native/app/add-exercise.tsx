import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
	CreateExerciseSheet,
	ExerciseList,
} from "@/src/components/exercise-list";
import { Button, IconButton, Row, T } from "@/src/components/ui";
import { todayISO } from "@/src/lib/dates";
import { useWorkouts } from "@/src/state/workout-store";
import { colors } from "@/src/theme";

export default function AddExercise() {
	const router = useRouter();
	const { date = todayISO() } = useLocalSearchParams<{ date?: string }>();
	const { addExercises } = useWorkouts();
	const [picked, setPicked] = useState<string[]>([]);
	const [creating, setCreating] = useState(false);

	const toggle = (id: string) =>
		setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

	const add = () => {
		addExercises(date, picked);
		router.back();
	};

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: colors.bg }}
			edges={["top", "bottom"]}
		>
			<Row style={{ paddingHorizontal: 16, paddingVertical: 8 }} gap={10}>
				<IconButton icon={X} label="Close" onPress={() => router.back()} />
				<T variant="title" style={{ flex: 1 }}>
					Add exercise
				</T>
				<IconButton
					icon={Plus}
					label="Create custom exercise"
					onPress={() => setCreating(true)}
				/>
			</Row>
			<View style={{ flex: 1 }}>
				<ExerciseList
					selected={new Set(picked)}
					onPress={(e) => toggle(e.id)}
					bottomPadding={96}
				/>
			</View>
			<View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
				<Button
					title={
						picked.length
							? `Add ${picked.length} exercise${picked.length > 1 ? "s" : ""}`
							: "Pick exercises"
					}
					disabled={!picked.length}
					onPress={add}
				/>
			</View>
			<CreateExerciseSheet
				visible={creating}
				onClose={() => setCreating(false)}
				onCreated={(id) => setPicked((p) => [...p, id])}
			/>
		</SafeAreaView>
	);
}
