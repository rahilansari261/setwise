import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
	CreateExerciseSheet,
	ExerciseList,
} from "@/src/components/exercise-list";
import { IconButton, Row, T } from "@/src/components/ui";
import { colors } from "@/src/theme";

export default function Exercises() {
	const router = useRouter();
	const [creating, setCreating] = useState(false);
	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: colors.bg }}
			edges={["top"]}
		>
			<View style={{ flex: 1 }}>
				<ExerciseList
					onPress={(e) => router.push(`/exercise/${e.id}`)}
					header={
						<Row style={{ paddingTop: 12 }}>
							<View style={{ flex: 1, gap: 4 }}>
								<T variant="label">LIBRARY</T>
								<T variant="display">Exercises</T>
							</View>
							<IconButton
								icon={Plus}
								label="Create custom exercise"
								onPress={() => setCreating(true)}
							/>
						</Row>
					}
				/>
			</View>
			<CreateExerciseSheet
				visible={creating}
				onClose={() => setCreating(false)}
			/>
		</SafeAreaView>
	);
}
