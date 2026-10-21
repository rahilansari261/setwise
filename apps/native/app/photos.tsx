import { Directory, File, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Trash } from "lucide-react-native";
import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";

import { ProScreen } from "@/src/components/pro-screen";
import { Button, IconButton, Row, T } from "@/src/components/ui";
import { shortDate, todayISO } from "@/src/lib/dates";
import { extraId, useExtras } from "@/src/state/extras";
import { colors } from "@/src/theme";
import type { ProgressPhoto } from "@/src/types";

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
	const [open, setOpen] = useState<ProgressPhoto | null>(null);
	const [busy, setBusy] = useState(false);

	const take = async (camera: boolean) => {
		setBusy(true);
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
				date: todayISO(),
				uri: persist(asset.uri),
			});
		} catch (e) {
			Alert.alert(
				"Couldn't add the photo",
				e instanceof Error ? e.message : String(e),
			);
		} finally {
			setBusy(false);
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
		<ProScreen feature="photos" title="Progress photos">
			<T variant="small" style={{ marginTop: 12 }}>
				Photos stay on this phone. They aren't uploaded anywhere.
			</T>
			<Row gap={8} style={{ marginTop: 14 }}>
				<Button
					title="Camera"
					icon={Camera}
					compact
					style={{ flex: 1 }}
					loading={busy}
					onPress={() => take(true)}
				/>
				<Button
					title="Gallery"
					icon={ImagePlus}
					variant="secondary"
					compact
					style={{ flex: 1 }}
					onPress={() => take(false)}
				/>
			</Row>

			<View style={styles.grid}>
				{photos.map((p) => (
					<Pressable key={p.id} style={styles.cell} onPress={() => setOpen(p)}>
						<Image
							source={{ uri: p.uri }}
							style={styles.thumb}
							contentFit="cover"
						/>
						<T style={styles.date}>{shortDate(p.date)}</T>
					</Pressable>
				))}
			</View>
			{photos.length === 0 ? (
				<T variant="small" style={{ marginTop: 20 }}>
					Add a photo every few weeks to see the change side by side.
				</T>
			) : null}

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
							{open ? shortDate(open.date) : ""}
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
	grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 },
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
