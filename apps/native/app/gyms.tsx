import { Plus, Trash } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";

import { ProScreen } from "@/src/components/pro-screen";
import {
	Button,
	Card,
	Chip,
	Field,
	IconButton,
	Row,
	Sheet,
	T,
} from "@/src/components/ui";
import { fmt } from "@/src/lib/calc";
import { extraId, useExtras } from "@/src/state/extras";
import { useWorkouts } from "@/src/state/workout-store";
import { colors } from "@/src/theme";
import type { Gym } from "@/src/types";

const PLATE_CHOICES = {
	kg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
	lbs: [55, 45, 35, 25, 10, 5, 2.5, 1.25],
};

export default function Gyms() {
	const { gyms, saveGym, deleteGym } = useExtras();
	const { settings, updateSettings } = useWorkouts();
	const [editing, setEditing] = useState<Gym | null>(null);
	const choices = PLATE_CHOICES[settings.unit];

	const startNew = () =>
		setEditing({
			id: extraId("gym"),
			name: "",
			barWeight: settings.defaultBarbellWeight,
			plates:
				settings.unit === "kg"
					? [25, 20, 15, 10, 5, 2.5, 1.25]
					: [45, 35, 25, 10, 5, 2.5],
		});

	return (
		<ProScreen
			feature="gyms"
			title="Gym profiles"
			right={<IconButton icon={Plus} label="New gym" onPress={startNew} />}
		>
			<T variant="small" style={{ marginTop: 12 }}>
				Each gym remembers its bar weight and which plates it has. The plate
				calculator and warm-up sets use the active gym.
			</T>
			<View style={{ gap: 10, marginTop: 16 }}>
				{gyms.map((g) => {
					const active = settings.activeGymId === g.id;
					return (
						<Card key={g.id} active={active}>
							<Row>
								<View style={{ flex: 1 }}>
									<T variant="heading">{g.name}</T>
									<T variant="small">
										Bar {fmt(g.barWeight)} {settings.unit} · plates{" "}
										{g.plates.map((p) => fmt(p, 2)).join(", ")}
									</T>
								</View>
								<IconButton
									icon={Trash}
									label={`Delete ${g.name}`}
									bordered={false}
									size={18}
									color={colors.muted}
									onPress={() =>
										Alert.alert(`Delete ${g.name}?`, undefined, [
											{ text: "Cancel", style: "cancel" },
											{
												text: "Delete",
												style: "destructive",
												onPress: () => {
													deleteGym(g.id);
													if (active)
														updateSettings({ activeGymId: undefined });
												},
											},
										])
									}
								/>
							</Row>
							<Row gap={8} style={{ marginTop: 10 }}>
								<Button
									title={active ? "Active" : "Use this gym"}
									variant={active ? "primary" : "secondary"}
									compact
									style={{ flex: 1 }}
									onPress={() =>
										updateSettings({ activeGymId: active ? undefined : g.id })
									}
								/>
								<Button
									title="Edit"
									variant="secondary"
									compact
									style={{ flex: 1 }}
									onPress={() => setEditing(g)}
								/>
							</Row>
						</Card>
					);
				})}
				{gyms.length === 0 ? (
					<Card>
						<T variant="heading">No gyms yet</T>
						<Button
							title="Add your gym"
							style={{ marginTop: 12 }}
							onPress={startNew}
						/>
					</Card>
				) : null}
			</View>

			{editing ? (
				<Sheet visible title="GYM" onClose={() => setEditing(null)}>
					<Field
						label="Name"
						value={editing.name}
						onChangeText={(name) => setEditing({ ...editing, name })}
						placeholder="e.g. Home garage"
					/>
					<Field
						style={{ marginTop: 12 }}
						label={`Bar weight (${settings.unit})`}
						value={String(editing.barWeight)}
						onChangeText={(t) =>
							setEditing({
								...editing,
								barWeight: Number.parseFloat(t.replace(",", ".")) || 0,
							})
						}
						keyboardType="decimal-pad"
					/>
					<T variant="label" style={{ marginTop: 14, marginBottom: 8 }}>
						PLATES AVAILABLE
					</T>
					<Row gap={6} style={{ flexWrap: "wrap" }}>
						{choices.map((p) => {
							const on = editing.plates.includes(p);
							return (
								<Chip
									key={p}
									mono
									label={fmt(p, 2)}
									selected={on}
									onPress={() =>
										setEditing({
											...editing,
											plates: on
												? editing.plates.filter((x) => x !== p)
												: [...editing.plates, p],
										})
									}
								/>
							);
						})}
					</Row>
					<Button
						title="Save gym"
						style={{ marginTop: 16 }}
						disabled={!editing.name.trim()}
						onPress={() => {
							saveGym({ ...editing, name: editing.name.trim() });
							setEditing(null);
						}}
					/>
				</Sheet>
			) : null}
		</ProScreen>
	);
}
