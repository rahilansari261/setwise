import Svg, { Circle, Path } from "react-native-svg";

import { colors } from "@/src/theme";

/**
 * Front-view torso. The filled shape is you at `ratio`; the dashed outline is the 1.618 ideal at the
 * same waist, so the gap in the shoulders is visible at a glance.
 */
export function VTaperFigure({
	ratio,
	ideal,
	height = 190,
}: {
	ratio: number;
	ideal: number;
	height?: number;
}) {
	const W = 220;
	const H = 200;
	const cx = W / 2;
	const waist = 64; // fixed drawing width of the waist
	const maxHalf = 96;
	const half = (r: number) => Math.min(maxHalf, (waist * r) / 2);

	const torso = (r: number) => {
		const s = half(r);
		const w = waist / 2;
		const hip = w + 6;
		// shoulders → armpit curve → waist → hips
		return [
			`M ${cx - s} 52`,
			`Q ${cx - s - 4} 64 ${cx - s + 10} 80`,
			`C ${cx - w - 10} 108 ${cx - w - 2} 130 ${cx - w} 146`,
			`L ${cx - hip} 190`,
			`L ${cx + hip} 190`,
			`L ${cx + w} 146`,
			`C ${cx + w + 2} 130 ${cx + w + 10} 108 ${cx + s - 10} 80`,
			`Q ${cx + s + 4} 64 ${cx + s} 52`,
			`Q ${cx} 40 ${cx - s} 52 Z`,
		].join(" ");
	};

	return (
		<Svg
			width="100%"
			height={height}
			viewBox={`0 0 ${W} ${H}`}
			accessibilityLabel="Torso outline compared with the ideal V-taper"
		>
			<Path
				d={torso(ideal)}
				fill="none"
				stroke={colors.accent}
				strokeWidth={1.5}
				strokeDasharray="5 4"
			/>
			<Path
				d={torso(ratio > 0 ? ratio : 1.2)}
				fill={colors.surfaceRaised}
				stroke={colors.lineStrong}
				strokeWidth={1.5}
			/>
			<Circle
				cx={cx}
				cy={30}
				r={15}
				fill={colors.surfaceRaised}
				stroke={colors.lineStrong}
				strokeWidth={1.5}
			/>
		</Svg>
	);
}
