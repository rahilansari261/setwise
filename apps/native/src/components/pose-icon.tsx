import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/src/theme";
import type { Pose } from "@/src/types";

// Simple silhouettes on a 100 × 140 grid so each check-in slot shows the pose to copy.
const SHAPES: Record<Pose, { body: string; arms: string }> = {
	front: {
		body: "M 26 40 Q 50 33 74 40 L 72 56 L 62 76 L 58 104 L 42 104 L 38 76 L 28 56 Z",
		arms: "M 26 42 L 18 78 L 20 96 M 74 42 L 82 78 L 80 96",
	},
	side: {
		body: "M 42 40 Q 52 36 60 42 L 62 64 L 58 104 L 44 104 L 42 70 L 38 56 Z",
		arms: "M 50 44 L 50 76 L 52 96",
	},
	back: {
		body: "M 22 40 Q 50 32 78 40 L 76 54 L 64 74 L 58 104 L 42 104 L 36 74 L 24 54 Z",
		arms: "M 22 42 L 8 66 L 12 84 M 78 42 L 92 66 L 88 84",
	},
};

export function PoseIcon({
	pose,
	size = 56,
	color = colors.muted,
}: {
	pose: Pose;
	size?: number;
	color?: string;
}) {
	const s = SHAPES[pose];
	return (
		<Svg
			width={size}
			height={size * 1.4}
			viewBox="0 0 100 140"
			accessibilityElementsHidden
		>
			<Circle cx={50} cy={24} r={10} fill={color} />
			<Path d={s.body} fill={color} />
			<Path
				d={s.arms}
				stroke={color}
				strokeWidth={7}
				strokeLinecap="round"
				fill="none"
			/>
			<Path
				d="M 44 104 L 42 134 M 56 104 L 58 134"
				stroke={color}
				strokeWidth={8}
				strokeLinecap="round"
			/>
		</Svg>
	);
}
