import Svg, { Circle, Ellipse, G, Path, Polygon } from "react-native-svg";

import { colors } from "@/src/theme";

// Same geometry as scripts/make-icons.py (1024 grid): V-taper torso inside a laurel wreath.
const TORSO =
	"296,352 448,322 576,322 728,352 752,428 706,508 618,618 572,772 452,772 406,618 318,508 272,428";
const WREATH = { cx: 512, cy: 545, r: 372 };

function branch(side: 1 | -1) {
	const leaves: { x: number; y: number; rot: number; l: number; w: number }[] =
		[];
	const n = 10;
	for (let i = 0; i < n; i++) {
		const t = i / (n - 1);
		const ang = ((90 + side * (8 + t * 118)) * Math.PI) / 180;
		for (const [off, turn] of [
			[-26, -38],
			[26, 38],
		] as const) {
			leaves.push({
				x: WREATH.cx + Math.cos(ang) * (WREATH.r + off),
				y: WREATH.cy + Math.sin(ang) * (WREATH.r + off),
				rot: (ang * 180) / Math.PI + 90 + turn * -side + (side === 1 ? 0 : 180),
				l: 96 - 30 * t,
				w: 40 - 12 * t,
			});
		}
	}
	const stem = Array.from({ length: 21 }, (_, i) => {
		const ang = ((90 + side * (4 + (i / 20) * 124)) * Math.PI) / 180;
		return `${i === 0 ? "M" : "L"} ${WREATH.cx + Math.cos(ang) * WREATH.r} ${WREATH.cy + Math.sin(ang) * WREATH.r}`;
	}).join(" ");
	return { leaves, stem };
}

const BRANCHES = [branch(1), branch(-1)];

export function AdonisMark({
	size = 72,
	color = colors.accent,
	wreath = true,
}: {
	size?: number;
	color?: string;
	wreath?: boolean;
}) {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 1024 1024"
			accessibilityElementsHidden
		>
			{wreath
				? BRANCHES.map((b) => (
						<G key={b.stem.slice(0, 18) + b.leaves.length}>
							<Path d={b.stem} stroke={color} strokeWidth={9} fill="none" />
							{b.leaves.map((l) => (
								<Ellipse
									key={`${l.x}-${l.y}`}
									cx={l.x}
									cy={l.y}
									rx={l.l / 2}
									ry={l.w / 2}
									fill={color}
									transform={`rotate(${l.rot} ${l.x} ${l.y})`}
								/>
							))}
						</G>
					))
				: null}
			<Polygon points={TORSO} fill={color} />
			<Circle cx={284} cy={410} r={54} fill={color} />
			<Circle cx={740} cy={410} r={54} fill={color} />
			<Circle cx={512} cy={232} r={54} fill={color} />
		</Svg>
	);
}
