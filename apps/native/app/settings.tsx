import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ChevronLeft, Crown } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Alert, Pressable, View } from "react-native";

import {
	Button,
	Card,
	Field,
	IconButton,
	ListRow,
	ProBadge,
	Row,
	Screen,
	Segmented,
	Stepper,
	T,
	Toggle,
} from "@/src/components/ui";
import { splitById } from "@/src/data/routines";
import { buildDemoBackup } from "@/src/dev/demo-data";
import { ENV } from "@/src/env";
import { pickBackupText, shareBackup, shareCSV } from "@/src/lib/backup";
import { kgToLb, lbToKg } from "@/src/lib/calc";
import { cancelAll, scheduleReminders } from "@/src/lib/notifications";
import { AuthError, secretLoginEnabled, useAuth } from "@/src/state/auth";
import { useExtras } from "@/src/state/extras";
import { useT } from "@/src/state/i18n";
import { usePremium, useProGate } from "@/src/state/premium";
import { useToast } from "@/src/state/toast";
import { useWorkouts } from "@/src/state/workout-store";
import { colors, fonts } from "@/src/theme";
import type { Profile, Reminder } from "@/src/types";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function SettingsScreen() {
	const router = useRouter();
	const store = useWorkouts();
	const auth = useAuth();
	const toast = useToast();
	const t = useT();
	const extras = useExtras();
	const premium = usePremium();
	const gate = useProGate();
	const { settings, profile } = store;
	const [busy, setBusy] = useState<string | null>(null);
	const site = ENV.EXPO_PUBLIC_SITE_URL ?? "https://setwise.app";

	if (!profile) return null;

	const patchProfile = (patch: Partial<Profile>) =>
		store.saveProfile({ ...profile, ...patch });

	const patchReminder = async (patch: Partial<Reminder>) => {
		const reminder = { ...profile.reminder, ...patch };
		await patchProfile({ reminder });
		await scheduleReminders(reminder, profile.name).catch(() => {});
	};

	const run = async (key: string, task: () => Promise<void>) => {
		setBusy(key);
		try {
			await task();
		} catch (e) {
			Alert.alert(
				"Something went wrong",
				e instanceof Error ? e.message : String(e),
			);
		} finally {
			setBusy(null);
		}
	};

	const switchUnit = (unit: "kg" | "lbs") => {
		if (unit === settings.unit) return;
		Alert.alert(
			`Switch to ${unit}?`,
			"Every weight in your history is converted and rounded (0.5 kg / 1 lb).",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Convert",
					onPress: () => run("unit", () => store.updateSettings({ unit })),
				},
			],
		);
	};

	const importBackup = () =>
		run("import", async () => {
			const text = await pickBackupText();
			if (!text) return;
			await new Promise<void>((resolve) =>
				Alert.alert(
					"Replace your data?",
					"Importing replaces every workout on this phone with the backup.",
					[
						{ text: "Cancel", style: "cancel", onPress: () => resolve() },
						{
							text: "Import",
							style: "destructive",
							onPress: async () => {
								try {
									const count = await store.importBackup(text);
									toast(`Imported ${count} workout days`);
								} catch (e) {
									Alert.alert(
										"Import failed",
										e instanceof Error
											? e.message
											: "That file isn't a Setwise backup.",
									);
								}
								resolve();
							},
						},
					],
				),
			);
		});

	// Dev/preview builds only: fills the phone with ~6 months of PPL history to test performance.
	const loadDemoData = () =>
		Alert.alert(
			"Load 6 months of demo data?",
			"Replaces every workout on this phone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Load",
					style: "destructive",
					onPress: () =>
						run("demo", async () => {
							const t0 = Date.now();
							const json = JSON.stringify(buildDemoBackup(settings));
							const t1 = Date.now();
							const days = await store.importBackup(json);
							const t2 = Date.now();
							const sets = (json.match(/"setNumber"/g) ?? []).length;
							console.log(
								`[demo] ${days} days, ${sets} sets, ${Math.round(json.length / 1024)} KB; build ${t1 - t0} ms, import ${t2 - t1} ms`,
							);
							toast(`${days} days · ${sets} sets · ${t2 - t1} ms`);
						}),
				},
			],
		);

	const eraseAll = () =>
		Alert.alert(
			"Erase all data?",
			"Deletes every workout, routine and setting on this phone. This can't be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Erase",
					style: "destructive",
					onPress: () =>
						run("erase", async () => {
							await cancelAll();
							await store.wipeLocalData();
							await extras.wipeExtras();
						}),
				},
			],
		);

	const deleteAccount = () =>
		Alert.alert(
			"Delete your account?",
			"Your login is removed from our server and every workout on this phone is erased. This can't be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete account",
					style: "destructive",
					onPress: () =>
						run("delete", async () => {
							try {
								await auth.deleteAccount();
							} catch (e) {
								throw new Error(
									e instanceof AuthError
										? e.message
										: "Couldn't reach the server. Try again when you're online.",
								);
							}
							await cancelAll();
							await store.wipeLocalData();
							await extras.wipeExtras();
						}),
				},
			],
		);

	const metric = settings.unit === "kg";

	return (
		<Screen stack bottomInset={40}>
			<Row gap={12}>
				<IconButton
					icon={ChevronLeft}
					label="Back"
					onPress={() => router.back()}
				/>
				<T variant="title">{t("settings.title")}</T>
			</Row>

			<Pressable
				accessibilityRole="button"
				onPress={() => router.push("/paywall")}
				style={{ marginTop: 20 }}
			>
				<Card active={premium.isPro}>
					<Row gap={12}>
						<Crown size={22} color={colors.accent} />
						<View style={{ flex: 1 }}>
							<T variant="heading">{t("settings.pro")}</T>
							<T variant="small">
								{premium.isPro ? t("settings.proOn") : t("settings.proOff")}
							</T>
						</View>
					</Row>
				</Card>
			</Pressable>

			<Section title={t("settings.profile")}>
				<Field
					label="Name"
					value={profile.name}
					onChangeText={(name) => patchProfile({ name })}
				/>
				<ListRow label="Age" detail="years">
					<Stepper
						value={profile.age}
						onChange={(age) => patchProfile({ age })}
						min={13}
						max={90}
					/>
				</ListRow>
				<ListRow label="Height" detail={metric ? "cm" : "inches"}>
					<Stepper
						value={
							metric ? profile.heightCm : Math.round(profile.heightCm / 2.54)
						}
						onChange={(v) =>
							patchProfile({ heightCm: metric ? v : Math.round(v * 2.54) })
						}
						min={metric ? 120 : 48}
						max={metric ? 220 : 87}
					/>
				</ListRow>
				<ListRow label="Body weight" detail={settings.unit} last>
					<Stepper
						value={
							metric ? profile.weightKg : Math.round(kgToLb(profile.weightKg))
						}
						step={metric ? 0.5 : 1}
						onChange={(v) =>
							patchProfile({
								weightKg: metric ? v : Math.round(lbToKg(v) * 10) / 10,
							})
						}
						min={metric ? 30 : 66}
						max={metric ? 200 : 440}
						format={(v) => (metric ? v.toFixed(1) : String(v))}
					/>
				</ListRow>
			</Section>

			<Section title={t("settings.training")}>
				<ListRow
					label="Split"
					detail={splitById(profile.split).name}
					onPress={() => router.push("/routines")}
				>
					<T variant="label" style={{ color: colors.accent }}>
						ROUTINES
					</T>
				</ListRow>
				<ListRow
					label={t("settings.gym")}
					detail={
						extras.gyms.find((g) => g.id === settings.activeGymId)?.name ??
						"Bar weight and plates per gym"
					}
					onPress={() => gate("gyms", () => router.push("/gyms"))}
				>
					{premium.isPro ? null : <ProBadge />}
				</ListRow>
				<ListRow label="Units">
					<Segmented
						options={[
							{ value: "kg", label: "KG" },
							{ value: "lbs", label: "LB" },
						]}
						value={settings.unit}
						onChange={switchUnit}
					/>
				</ListRow>
				<ListRow label="Start rest timer after each set">
					<Toggle
						value={settings.autoRestTimer}
						onChange={(v) => store.updateSettings({ autoRestTimer: v })}
						label="Auto rest timer"
					/>
				</ListRow>
				<ListRow label="Default rest" detail="seconds">
					<Stepper
						value={settings.defaultRestSeconds}
						step={15}
						min={15}
						max={600}
						onChange={(v) => store.updateSettings({ defaultRestSeconds: v })}
					/>
				</ListRow>
				<ListRow
					label="Notify when rest is over"
					detail="Only fires when the app is in the background"
				>
					<Toggle
						value={settings.restNotification}
						onChange={(v) => store.updateSettings({ restNotification: v })}
						label="Rest notification"
					/>
				</ListRow>
				<ListRow label="Vibration" last>
					<Toggle
						value={settings.vibrationEnabled}
						onChange={(v) => store.updateSettings({ vibrationEnabled: v })}
						label="Vibration"
					/>
				</ListRow>
			</Section>

			<Section title={t("settings.app")} note={t("settings.themeNote")}>
				<ListRow label={t("settings.theme")}>
					<Segmented
						options={[
							{ value: "dark", label: t("settings.dark").toUpperCase() },
							{ value: "light", label: t("settings.light").toUpperCase() },
							{ value: "system", label: t("settings.system").toUpperCase() },
						]}
						value={settings.theme}
						onChange={(theme) => store.updateSettings({ theme })}
					/>
				</ListRow>
				<ListRow label={t("settings.language")}>
					<Segmented
						options={[
							{ value: "system", label: "AUTO" },
							{ value: "en", label: "EN" },
							{ value: "hi", label: "हिं" },
						]}
						value={settings.language}
						onChange={(language) => store.updateSettings({ language })}
					/>
				</ListRow>
				<ListRow
					label={t("settings.biometric")}
					detail={t("settings.biometricNote")}
					last
				>
					{premium.isPro ? null : <ProBadge />}
					<Toggle
						value={settings.biometricLock && premium.isPro}
						label={t("settings.biometric")}
						onChange={(on) =>
							gate("biometric", async () => {
								if (on) {
									const ok =
										(await LocalAuthentication.hasHardwareAsync()) &&
										(await LocalAuthentication.isEnrolledAsync());
									if (!ok) {
										Alert.alert(
											"No biometrics set up",
											"Add a fingerprint or face in your phone's settings first.",
										);
										return;
									}
									const res = await LocalAuthentication.authenticateAsync({
										promptMessage: "Confirm to turn on the lock",
									});
									if (!res.success) return;
								}
								store.updateSettings({ biometricLock: on });
							})
						}
					/>
				</ListRow>
			</Section>

			<Section title={t("settings.reminders")}>
				<ListRow label="Workout reminders" last={!profile.reminder.enabled}>
					<Toggle
						value={profile.reminder.enabled}
						onChange={(enabled) => patchReminder({ enabled })}
						label="Workout reminders"
					/>
				</ListRow>
				{profile.reminder.enabled ? (
					<>
						<ListRow label="Hour">
							<Row gap={4}>
								<Stepper
									value={profile.reminder.hour}
									min={-1}
									max={24}
									onChange={(h) => patchReminder({ hour: (h + 24) % 24 })}
									format={(h) => String(h).padStart(2, "0")}
								/>
							</Row>
						</ListRow>
						<ListRow label="Minute">
							<Stepper
								value={profile.reminder.minute}
								step={15}
								min={-15}
								max={60}
								onChange={(m) => patchReminder({ minute: (m + 60) % 60 })}
								format={(m) => String(m).padStart(2, "0")}
							/>
						</ListRow>
						<View style={{ flexDirection: "row", gap: 4, paddingVertical: 12 }}>
							{LETTERS.map((letter, mondayIndex) => {
								const jsDay = (mondayIndex + 1) % 7;
								const on = profile.reminder.days.includes(jsDay);
								return (
									<Pressable
										key={`${letter}-${jsDay}`}
										accessibilityRole="checkbox"
										accessibilityState={{ checked: on }}
										onPress={() =>
											patchReminder({
												days: on
													? profile.reminder.days.filter((d) => d !== jsDay)
													: [...profile.reminder.days, jsDay],
											})
										}
										style={{
											flex: 1,
											height: 44,
											borderRadius: 12,
											borderWidth: on ? 1.5 : 1,
											borderColor: on ? colors.accent : colors.border,
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<T
											style={{
												fontFamily: fonts.monoMedium,
												color: on ? colors.text : colors.muted,
											}}
										>
											{letter}
										</T>
									</Pressable>
								);
							})}
						</View>
					</>
				) : null}
			</Section>

			<Section
				title={t("settings.data")}
				note="Everything is stored only on this phone. Export a backup before switching phones."
			>
				<ListRow
					label="Export backup"
					detail="JSON — can be imported again"
					onPress={() =>
						run("json", () =>
							shareBackup({
								...store.exportBackup(),
								extras: extras.exportExtras(),
							}),
						)
					}
				>
					<T variant="label">{busy === "json" ? "…" : "SHARE"}</T>
				</ListRow>
				<ListRow
					label="Export spreadsheet"
					detail="CSV of every logged set"
					onPress={() =>
						run("csv", () => shareCSV(store.workouts, settings.unit))
					}
				>
					<T variant="label">{busy === "csv" ? "…" : "SHARE"}</T>
				</ListRow>
				<ListRow
					label="Import backup"
					detail="Replaces the data on this phone"
					onPress={importBackup}
					last
				>
					<T variant="label">{busy === "import" ? "…" : "PICK FILE"}</T>
				</ListRow>
			</Section>

			<Section title={t("settings.account")}>
				<ListRow
					label={
						auth.isGuest ? "Guest mode" : (auth.user?.email ?? "Signed in")
					}
					detail={
						auth.isGuest
							? "Entered with the secret button — not linked to an account"
							: "Signed in with Google"
					}
					last
				/>
				<View style={{ gap: 8, marginTop: 4 }}>
					<Button
						title="Sign out"
						variant="secondary"
						compact
						onPress={() => run("signout", auth.signOut)}
					/>
					<Button
						title="Erase all data on this phone"
						variant="secondary"
						compact
						onPress={eraseAll}
					/>
					{!auth.isGuest ? (
						<Button
							title="Delete account"
							variant="danger"
							compact
							loading={busy === "delete"}
							onPress={deleteAccount}
						/>
					) : null}
				</View>
			</Section>

			{secretLoginEnabled ? (
				<Section title="DEVELOPER" note="Only in dev and preview builds.">
					<ListRow
						label="Unlock Pro (developer)"
						detail="Skips billing so Pro screens can be tested"
					>
						<Toggle
							value={premium.source === "dev"}
							label="Developer Pro"
							onChange={(on) => premium.setDevPro(on)}
						/>
					</ListRow>
					<ListRow
						label="Load 6 months of demo data"
						detail="Push / Pull / Legs history ending yesterday"
						onPress={loadDemoData}
						last
					>
						<T variant="label">{busy === "demo" ? "…" : "LOAD"}</T>
					</ListRow>
				</Section>
			) : null}

			<Section title={t("settings.about")}>
				<ListRow
					label={t("settings.help")}
					onPress={() => router.push("/help")}
				/>
				<ListRow
					label="Privacy policy"
					onPress={() => WebBrowser.openBrowserAsync(`${site}/privacy`)}
				/>
				<ListRow
					label="Terms of use"
					onPress={() => WebBrowser.openBrowserAsync(`${site}/terms`)}
				/>
				<ListRow
					label="Version"
					detail={Constants.expoConfig?.version ?? "1.0.0"}
					last
				/>
			</Section>
		</Screen>
	);
}

function Section({
	title,
	note,
	children,
}: {
	title: string;
	note?: string;
	children: ReactNode;
}) {
	return (
		<View style={{ marginTop: 24 }}>
			<T variant="label">{title}</T>
			{note ? (
				<T variant="small" style={{ marginTop: 4 }}>
					{note}
				</T>
			) : null}
			<Card style={{ marginTop: 10, paddingVertical: 4, gap: 0 }}>
				{children}
			</Card>
		</View>
	);
}
