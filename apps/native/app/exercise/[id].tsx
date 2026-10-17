import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Trash } from "lucide-react-native";
import { Alert, View } from "react-native";

import { ExerciseProgress } from "@/src/components/exercise-progress";
import { IconButton, Row, Screen, T } from "@/src/components/ui";
import { useWorkouts } from "@/src/state/workout-store";
import { colors } from "@/src/theme";

export default function ExerciseDetail() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { exerciseById, removeCustomExercise } = useWorkouts();
	const exercise = exerciseById.get(id);

	return (
		<Screen stack>
			<Row gap={12}>
				<IconButton
					icon={ChevronLeft}
					label="Back"
					onPress={() => router.back()}
				/>
				<View style={{ flex: 1, gap: 2 }}>
					<T variant="heading" style={{ fontSize: 20 }} numberOfLines={2}>
						{exercise?.name ?? "Exercise"}
					</T>
					<T variant="label" style={{ fontSize: 10 }}>
						{exercise?.category}
						{exercise?.isCustom ? " · CUSTOM" : ""}
					</T>
				</View>
				{exercise?.isCustom ? (
					<IconButton
						icon={Trash}
						label="Delete custom exercise"
						color={colors.danger}
						onPress={() =>
							Alert.alert(
								`Delete ${exercise.name}?`,
								"It disappears from the library. Logged sets stay in your history.",
								[
									{ text: "Cancel", style: "cancel" },
									{
										text: "Delete",
										style: "destructive",
										onPress: () => {
											removeCustomExercise(exercise.id);
											router.back();
										},
									},
								],
							)
						}
					/>
				) : null}
			</Row>
			<View style={{ marginTop: 16 }}>
				<ExerciseProgress exerciseId={id} />
			</View>
		</Screen>
	);
}
