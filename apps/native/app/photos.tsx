import { Directory, File, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Trash } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";

import { PoseIcon } from "@/src/components/pose-icon";
import { ProScreen } from "@/src/components/pro-screen";
import {
	Button,
	Card,
	Chip,
	IconButton,
	Row,
	Segmented,
	Sheet,
	T,
} from "@/src/components/ui";
import {
	CHECKIN_EVERY_DAYS,
	daysBetweenISO,
	daysUntilCheckIn,
	defaultPair,
	POSES,
	photosOfPose,
	poseOf,
} from "@/src/lib/checkin";
import { shortDate, todayISO } from "@/src/lib/dates";
import { extraId, useExtras } from "@/src/state/extras";
import { colors, fonts } from "@/src/theme";
import type { Pose, ProgressPhoto } from "@/src/types";

/** Copies a picked image into the app's own storage so it survives the picker's cache being cleared. */
function persist(uri: string): string {
	const dir = new Directory(Paths.document, "progress-photos");
	if (!dir.exists) dir.create();
	const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
	const dest = new File(dir, `${Date.now()}.${ext}`);
	new File(uri).copy(dest);
	return dest.uri;
}

export default function Photos() {
	const { photos, addPhoto, deletePhoto } = useExtras();
	const today = todayISO();
	const [open, setOpen] = useState<ProgressPhoto | null>(null);
	const [adding, setAdding] = useState<Pose | null>(null);
	const [comparePose, setComparePose] = useState<Pose>("front");
	const [beforeId, setBeforeId] = useState<string | null>(null);
	const [afterId, setAfterId] = useState<string | null>(null);

	const due = daysUntilCheckIn(photos, today);
	const todays = (pose: Pose) =>
		photos.find((p) => p.date === today && poseOf(p) === pose);

	const series = useMemo(
		() => photosOfPose(photos, comparePose),
		[photos, comparePose],
	);
	const pair = defaultPair(photos, comparePose);
	const before = series.find((p) => p.id === beforeId) ?? pair?.before;
	const after = series.find((p) => p.id === afterId) ?? pair?.after;

	const take = async (pose: Pose, camera: boolean) => {
		try {
			const perm = camera
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!perm.granted) {
				Alert.alert("Permission needed", "Allow access to add a photo.");
				return;
			}
			const res = camera
				? await ImagePicker.launchCameraAsync({ quality: 0.7 })
				: await ImagePicker.launchImageLibraryAsync({
						mediaTypes: ["images"],
						quality: 0.7,
					});
			const asset = res.canceled ? null : res.assets[0];
			if (!asset) return;
			addPhoto({
				id: extraId("photo"),
				date: today,
				uri: persist(asset.uri),
				pose,
			});
		} catch (e) {
			Alert.alert(
				"Couldn't add the photo",
				e instanceof Error ? e.message : String(e),
			);
		}
	};

	const remove = (photo: ProgressPhoto) =>
		Alert.alert("Delete this photo?", "It's removed from this phone.", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					try {
						new File(photo.uri).delete();
					} catch {
						// The file may already be gone; the entry should still go.
					}
					deletePhoto(photo.id);
					setOpen(null);
				},
			},
		]);

	return (
		<ProScreen feature="photos" title="Check-in">
			<T variant="small" style={{ marginTop: 12 }}>
				Front, side and back every {CHECKIN_EVERY_DAYS} days. Same spot, same
				light, same time of day — that's what makes the comparison honest.
				Photos stay on this phone.
			</T>

			<Card style={{ marginTop: 14 }} active={due !== null && due <= 0}>
				<T
					variant="label"
					style={{
						color: due !== null && due <= 0 ? colors.accent : colors.muted,
					}}
				>
					{due === null
						? "FIRST CHECK-IN"
						: due <= 0
							? "CHECK-IN DUE"
							: `NEXT CHECK-IN IN ${due} DAYS`}
				</T>
				<View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
					{POSES.map(({ pose, name }) => {
						const shot = todays(pose);
						return (
							<Pressable
								key={pose}
								accessibilityRole="button"
								accessibilityLabel={`${name} photo`}
								onPress={() => (shot ? setOpen(shot) : setAdding(pose))}
								style={[styles.slot, shot && { borderColor: colors.accent }]}
							>
								{shot ? (
									<Image
										source={{ uri: shot.uri }}
										style={styles.slotImage}
										contentFit="cover"
									/>
								) : (
									<PoseIcon pose={pose} size={44} />
								)}
								<T style={{ fontFamily: fonts.bodyMedium, fontSize: 13 }}>
									{name}
								</T>
							</Pressable>
						);
					})}
				</View>
			</Card>

			<T variant="label" style={{ marginTop: 24 }}>
				BEFORE · AFTER
			</T>
			<Segmented
				fill
				style={{ marginTop: 10 }}
				options={POSES.map((p) => ({
					value: p.pose,
					label: p.name.toUpperCase(),
				}))}
				value={comparePose}
				onChange={(v) => {
					setComparePose(v);
					setBeforeId(null);
					setAfterId(null);
				}}
			/>
			{before && after ? (
				<>
					<View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
						{[before, after].map((p, i) => (
							<Pressable
								key={p.id}
								style={{ flex: 1, gap: 4 }}
								onPress={() => setOpen(p)}
							>
								<Image
									source={{ uri: p.uri }}
									style={styles.compare}
									contentFit="cover"
								/>
								<T variant="label" style={{ fontSize: 10 }}>
									{i === 0 ? "BEFORE" : "AFTER"} · {shortDate(p.date)}
								</T>
							</Pressable>
						))}
					</View>
					<T variant="small" style={{ marginTop: 6 }}>
						{daysBetweenISO(before.date, after.date)} days apart
					</T>
					{series.length > 2 ? (
						<View style={{ gap: 6, marginTop: 10 }}>
							<Row gap={6} style={{ flexWrap: "wrap" }}>
								<T variant="label" style={{ fontSize: 10, width: 54 }}>
									BEFORE
								</T>
								{series.slice(0, -1).map((p) => (
									<Chip
										key={p.id}
										mono
										label={shortDate(p.date)}
										selected={p.id === before.id}
										onPress={() => setBeforeId(p.id)}
										style={{ minHeight: 32 }}
									/>
								))}
							</Row>
							<Row gap={6} style={{ flexWrap: "wrap" }}>
								<T variant="label" style={{ fontSize: 10, width: 54 }}>
									AFTER
								</T>
								{series.slice(1).map((p) => (
									<Chip
										key={p.id}
										mono
										label={shortDate(p.date)}
										selected={p.id === after.id}
										onPress={() => setAfterId(p.id)}
										style={{ minHeight: 32 }}
									/>
								))}
							</Row>
						</View>
					) : null}
				</>
			) : (
				<Card style={{ marginTop: 10 }}>
					<T variant="small">
						Two check-ins of the same pose and the comparison shows up here.
					</T>
				</Card>
			)}

			{photos.length > 0 ? (
				<>
					<T variant="label" style={{ marginTop: 24 }}>
						ALL PHOTOS
					</T>
					<View style={styles.grid}>
						{photos.map((p) => (
							<Pressable
								key={p.id}
								style={styles.cell}
								onPress={() => setOpen(p)}
							>
								<Image
									source={{ uri: p.uri }}
									style={styles.thumb}
									contentFit="cover"
								/>
								<T style={styles.date}>
									{shortDate(p.date)} ·{" "}
									{POSES.find((x) => x.pose === poseOf(p))?.name}
								</T>
							</Pressable>
						))}
					</View>
				</>
			) : null}

			<Sheet
				visible={adding !== null}
				title={POSES.find((p) => p.pose === adding)?.name.toUpperCase()}
				onClose={() => setAdding(null)}
			>
				<Row gap={14}>
					{adding ? (
						<PoseIcon pose={adding} size={52} color={colors.accent} />
					) : null}
					<T style={{ flex: 1 }}>{POSES.find((p) => p.pose === adding)?.tip}</T>
				</Row>
				<Row gap={8} style={{ marginTop: 16 }}>
					<Button
						title="Take photo"
						icon={Camera}
						compact
						style={{ flex: 1 }}
						onPress={() => {
							const pose = adding;
							setAdding(null);
							if (pose) take(pose, true);
						}}
					/>
					<Button
						title="Gallery"
						icon={ImagePlus}
						variant="secondary"
						compact
						style={{ flex: 1 }}
						onPress={() => {
							const pose = adding;
							setAdding(null);
							if (pose) take(pose, false);
						}}
					/>
				</Row>
			</Sheet>

			<Modal
				visible={open !== null}
				animationType="fade"
				onRequestClose={() => setOpen(null)}
				statusBarTranslucent
			>
				<View style={styles.viewer}>
					{open ? (
						<Image
							source={{ uri: open.uri }}
							style={{ flex: 1 }}
							contentFit="contain"
						/>
					) : null}
					<Row style={styles.viewerBar} gap={12}>
						<T style={{ flex: 1, color: "#fff" }}>
							{open
								? `${shortDate(open.date)} · ${POSES.find((x) => x.pose === poseOf(open))?.name}`
								: ""}
						</T>
						<IconButton
							icon={Trash}
							label="Delete photo"
							color="#fff"
							onPress={() => open && remove(open)}
						/>
						<Button title="Close" compact onPress={() => setOpen(null)} />
					</Row>
				</View>
			</Modal>
		</ProScreen>
	);
}

const styles = StyleSheet.create({
	slot: {
		flex: 1,
		aspectRatio: 3 / 4,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.bg,
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		overflow: "hidden",
	},
	slotImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
	compare: {
		width: "100%",
		aspectRatio: 3 / 4,
		borderRadius: 14,
		backgroundColor: colors.surface,
	},
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
	cell: { width: "31.5%", gap: 4 },
	thumb: {
		width: "100%",
		aspectRatio: 3 / 4,
		borderRadius: 12,
		backgroundColor: colors.surface,
	},
	date: { fontSize: 11, color: colors.muted },
	viewer: { flex: 1, backgroundColor: "#000" },
	viewerBar: { padding: 16, paddingBottom: 32 },
});
