import Constants from "expo-constants";
import { Linking, View } from "react-native";

import { Button, Card, Screen, ScreenHeader, T } from "@/src/components/ui";
import { ENV } from "@/src/env";
import { useAuth } from "@/src/state/auth";
import { usePremium } from "@/src/state/premium";
import { fonts } from "@/src/theme";

const FAQ = [
	{
		q: "Where is my data stored?",
		a: "Workouts, routines and measurements live only on this phone. Export a backup from Settings before switching phones.",
	},
	{
		q: "How do I move to a new phone?",
		a: "Settings → Export backup, send the file to the new phone, then Settings → Import backup. Progress photos are not included in backups.",
	},
	{
		q: "What does Pro include?",
		a: "Analytics (strength ranking, recovery, zones, recap), measurements, photos, goals, folders, gym profiles and biometric lock. Logging stays free.",
	},
	{
		q: "How do I cancel Pro?",
		a: "Open Google Play → Payments & subscriptions → Subscriptions → Setwise, then cancel. You keep Pro until the period ends.",
	},
	{
		q: "What is RPE?",
		a: "Rate of perceived exertion, 1–10. A set at RPE 9 left about one rep in the tank; RPE 10 was a maximum effort.",
	},
];

export default function Help() {
	const auth = useAuth();
	const premium = usePremium();
	const email = ENV.EXPO_PUBLIC_SUPPORT_EMAIL ?? "support@setwise.app";

	const contact = () => {
		const body = [
			"",
			"",
			"— Please keep the details below —",
			`App ${Constants.expoConfig?.version ?? "?"}`,
			`Pro: ${premium.isPro ? "yes" : "no"}`,
			`Account: ${auth.user?.email ?? "guest"}`,
		].join("\n");
		Linking.openURL(
			`mailto:${email}?subject=${encodeURIComponent("Setwise support")}&body=${encodeURIComponent(body)}`,
		);
	};

	return (
		<Screen stack bottomInset={40}>
			<ScreenHeader title="Help & support" />
			<View style={{ gap: 10, marginTop: 16 }}>
				{FAQ.map((f) => (
					<Card key={f.q}>
						<T style={{ fontFamily: fonts.bodyMedium }}>{f.q}</T>
						<T variant="small" style={{ marginTop: 4 }}>
							{f.a}
						</T>
					</Card>
				))}
			</View>
			<Button
				title="Email support"
				style={{ marginTop: 20 }}
				onPress={contact}
			/>
		</Screen>
	);
}
