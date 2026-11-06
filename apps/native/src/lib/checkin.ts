import type { Pose, ProgressPhoto } from "@/src/types";

export const CHECKIN_EVERY_DAYS = 14;

export const POSES: { pose: Pose; name: string; tip: string }[] = [
	{
		pose: "front",
		name: "Front",
		tip: "Face the camera, arms relaxed, feet together.",
	},
	{
		pose: "side",
		name: "Side",
		tip: "Turn 90°, arms by your sides, stand tall.",
	},
	{
		pose: "back",
		// "Rear" rather than "Back" so it isn't mistaken for the Back muscle group (and translates cleanly).
		name: "Rear",
		tip: "Back to the camera, spread your lats, arms slightly out.",
	},
];

export const poseOf = (p: Pick<ProgressPhoto, "pose">): Pose =>
	p.pose ?? "front";

const dayMs = 86_400_000;
const toTime = (iso: string) => {
	const [y, m, d] = iso.split("-").map(Number);
	return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

/** Days until the next check-in is due: 0 or less means it's due now. null if there's none yet. */
export function daysUntilCheckIn(
	photos: Pick<ProgressPhoto, "date">[],
	today: string,
	every = CHECKIN_EVERY_DAYS,
): number | null {
	if (photos.length === 0) return null;
	const last = photos.reduce(
		(a, p) => (p.date > a ? p.date : a),
		photos[0]?.date ?? today,
	);
	return every - Math.round((toTime(today) - toTime(last)) / dayMs);
}

/** Photos of one pose, oldest first. */
export function photosOfPose<
	T extends Pick<ProgressPhoto, "pose" | "date" | "id">,
>(photos: T[], pose: Pose): T[] {
	return photos
		.filter((p) => poseOf(p) === pose)
		.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/** Default before/after: the first and the latest photo of the pose (null when there are fewer than two). */
export function defaultPair<
	T extends Pick<ProgressPhoto, "pose" | "date" | "id">,
>(photos: T[], pose: Pose): { before: T; after: T } | null {
	const list = photosOfPose(photos, pose);
	const before = list[0];
	const after = list.at(-1);
	return before && after && before !== after ? { before, after } : null;
}

export const daysBetweenISO = (a: string, b: string) =>
	Math.round((toTime(b) - toTime(a)) / dayMs);
