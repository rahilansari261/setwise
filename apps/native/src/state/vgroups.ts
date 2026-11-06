import { useMemo } from "react";

import { libraryIdOf, libraryInfo } from "@/src/data/exercise-library";
import type { ExerciseLookup } from "@/src/lib/vmuscle";
import { useWorkouts } from "@/src/state/workout-store";

/** Exercise lookup for V-taper grouping: fills in the target muscle from the bundled library. */
export function useGroupLookup(): ExerciseLookup {
	const { exerciseById } = useWorkouts();
	return useMemo(
		() => ({
			get: (id: string) => {
				const ex = exerciseById.get(id);
				if (!ex) return undefined;
				const lib = libraryIdOf(ex);
				return {
					name: ex.name,
					category: ex.category,
					target: ex.target ?? (lib ? libraryInfo(lib)?.target : undefined),
				};
			},
		}),
		[exerciseById],
	);
}
