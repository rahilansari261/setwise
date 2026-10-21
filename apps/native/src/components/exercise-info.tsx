import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { Card, T } from "@/src/components/ui";
import {
	exerciseGifUrl,
	exerciseInstructions,
	libraryIdOf,
	libraryInfo,
	MEDIA_CREDIT,
} from "@/src/data/exercise-library";
import { resolveLocale } from "@/src/lib/i18n";
import { equipmentOf } from "@/src/lib/sets";
import { useWorkouts } from "@/src/state/workout-store";
import { colors } from "@/src/theme";
import type { Exercise } from "@/src/types";

/** Target muscles, equipment, how-to steps and (when licensed media is configured) the GIF. */
export function ExerciseInfo({ exercise }: { exercise: Exercise }) {
	const { settings } = useWorkouts();
	const libraryId = libraryIdOf(exercise);
	const info = libraryId ? libraryInfo(libraryId) : undefined;
	const gif = libraryId ? exerciseGifUrl(libraryId) : null;
	const steps = useMemo(
		() => (libraryId ? exerciseInstructions(libraryId) : null),
		[libraryId],
	);
	const hindi = resolveLocale(settings.language) === "hi";
	const text = steps ? (hindi && steps.hi ? steps.hi : steps.en) : "";

	const target = exercise.target ?? info?.target;
	const secondary = exercise.secondary ?? info?.secondary;
	if (!gif && !text && !target && !exercise.notes) return null;

	return (
		<View style={{ marginTop: 16, gap: 10 }}>
			{gif ? (
				<View>
					<Image
						source={{ uri: gif }}
						style={styles.gif}
						contentFit="contain"
						accessibilityLabel={`${exercise.name} demonstration`}
					/>
					<T variant="small" style={{ textAlign: "center", marginTop: 4 }}>
						{MEDIA_CREDIT}
					</T>
				</View>
			) : null}
			<Card style={{ gap: 6 }}>
				<T variant="label">{equipmentOf(exercise).toUpperCase()}</T>
				{target ? <T>{`Target: ${target}`}</T> : null}
				{secondary ? <T variant="small">{`Also works: ${secondary}`}</T> : null}
			</Card>
			{text ? (
				<Card style={{ gap: 6 }}>
					<T variant="label">How to</T>
					<T variant="body">{text}</T>
				</Card>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	gif: {
		width: "100%",
		aspectRatio: 1,
		maxHeight: 280,
		borderRadius: 16,
		backgroundColor: colors.surface,
	},
});
