import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Crown, X } from "lucide-react-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";

import { AdonisMark } from "@/src/components/adonis-mark";
import {
	Button,
	Card,
	Field,
	IconButton,
	Row,
	Screen,
	T,
} from "@/src/components/ui";
import { PAYWALL_ORDER, PRO_FEATURES, type ProFeature } from "@/src/lib/pro";
import { alertBillingMissing, usePremium } from "@/src/state/premium";
import { colors, fonts } from "@/src/theme";

const PLAN_ORDER = ["ANNUAL", "MONTHLY", "LIFETIME"];
const PLAN_NAME: Record<string, string> = {
	ANNUAL: "Yearly",
	MONTHLY: "Monthly",
	LIFETIME: "Lifetime",
};

export default function Paywall() {
	const router = useRouter();
	const { feature } = useLocalSearchParams<{ feature?: string }>();
	const premium = usePremium();
	const [busy, setBusy] = useState<string | null>(null);
	const [promo, setPromo] = useState("");
	const asked = feature ? PRO_FEATURES[feature as ProFeature] : undefined;

	const packages = [...premium.packages].sort(
		(a, b) =>
			PLAN_ORDER.indexOf(a.packageType) - PLAN_ORDER.indexOf(b.packageType),
	);

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

	const buy = (pkg: PurchasesPackage) =>
		run(pkg.identifier, async () => {
			if (await premium.purchase(pkg)) router.back();
		});

	if (premium.isPro) {
		return (
			<Screen stack>
				<Row gap={12}>
					<IconButton icon={X} label="Close" onPress={() => router.back()} />
					<T variant="title">Adonis Pro</T>
				</Row>
				<Card style={{ marginTop: 20 }} active>
					<Row gap={10}>
						<Crown size={20} color={colors.accent} />
						<T variant="heading">You're on Pro</T>
					</Row>
					<T variant="small" style={{ marginTop: 6 }}>
						{premium.source === "dev"
							? "Unlocked with the developer switch."
							: "Thanks for supporting Adonis. Manage the subscription in Google Play."}
					</T>
				</Card>
			</Screen>
		);
	}

	return (
		<Screen stack bottomInset={40}>
			<Row gap={12}>
				<IconButton icon={X} label="Close" onPress={() => router.back()} />
				<T variant="title" style={{ flex: 1 }}>
					Adonis Pro
				</T>
			</Row>

			<View style={{ alignItems: "center", marginTop: 12 }}>
				<AdonisMark size={110} />
			</View>

			{asked ? (
				<Card style={{ marginTop: 16 }} active>
					<T variant="label" style={{ color: colors.accent }}>
						PRO FEATURE
					</T>
					<T variant="heading" style={{ marginTop: 4 }}>
						{asked.title}
					</T>
					<T variant="small" style={{ marginTop: 2 }}>
						{asked.blurb}
					</T>
				</Card>
			) : null}

			<T variant="label" style={{ marginTop: 24 }}>
				EVERYTHING IN PRO
			</T>
			<Card style={{ marginTop: 10, gap: 12 }}>
				{PAYWALL_ORDER.map((k) => PRO_FEATURES[k]).map((f) => (
					<Row key={f.title} gap={10} style={{ alignItems: "flex-start" }}>
						<Check size={16} color={colors.accent} style={{ marginTop: 3 }} />
						<View style={{ flex: 1 }}>
							<T style={{ fontFamily: fonts.bodyMedium }}>{f.title}</T>
							<T variant="small">{f.blurb}</T>
						</View>
					</Row>
				))}
			</Card>
			<T variant="small" style={{ marginTop: 10 }}>
				Logging, rest timer, calculators, records, calendar and backups stay
				free forever.
			</T>

			<T variant="label" style={{ marginTop: 24 }}>
				CHOOSE A PLAN
			</T>
			<View style={{ gap: 10, marginTop: 10 }}>
				{packages.length === 0 ? (
					<Card>
						<T variant="small">
							{premium.loading
								? "Loading plans…"
								: premium.billingConfigured
									? "Plans couldn't be loaded. Check your connection and try again."
									: "Subscriptions aren't enabled in this build yet."}
						</T>
						{!premium.billingConfigured && !premium.loading ? (
							<Button
								title="How to enable billing"
								variant="secondary"
								compact
								style={{ marginTop: 10 }}
								onPress={alertBillingMissing}
							/>
						) : null}
					</Card>
				) : (
					packages.map((pkg) => {
						const trial = pkg.product.introPrice;
						return (
							<Card key={pkg.identifier} active={pkg.packageType === "ANNUAL"}>
								<Row>
									<View style={{ flex: 1 }}>
										<T variant="heading">
											{PLAN_NAME[pkg.packageType] ?? pkg.product.title}
										</T>
										<T variant="small">
											{pkg.product.priceString}
											{pkg.packageType === "MONTHLY" ? " / month" : ""}
											{pkg.packageType === "ANNUAL" ? " / year" : ""}
											{pkg.packageType === "LIFETIME" ? " one time" : ""}
											{trial && trial.price === 0
												? ` · ${trial.periodNumberOfUnits} ${trial.periodUnit.toLowerCase()} free trial`
												: ""}
										</T>
									</View>
									<Button
										title={
											trial && trial.price === 0 ? "Start trial" : "Choose"
										}
										compact
										loading={busy === pkg.identifier}
										onPress={() => buy(pkg)}
									/>
								</Row>
							</Card>
						);
					})
				)}
			</View>

			<Button
				title="Restore purchases"
				variant="ghost"
				compact
				style={{ marginTop: 8 }}
				loading={busy === "restore"}
				onPress={() =>
					run("restore", async () => {
						const ok = await premium.restore();
						Alert.alert(
							ok ? "Pro restored" : "Nothing to restore",
							ok ? "Welcome back." : "No active subscription was found.",
						);
						if (ok) router.back();
					})
				}
			/>

			<T variant="label" style={{ marginTop: 24 }}>
				PROMO CODE
			</T>
			<Row gap={8} style={{ marginTop: 10, alignItems: "flex-end" }}>
				<Field
					style={{ flex: 1 }}
					value={promo}
					onChangeText={setPromo}
					placeholder="Enter code"
					autoCapitalize="characters"
					autoCorrect={false}
				/>
				<Button
					title="Redeem"
					variant="secondary"
					style={{ height: 52 }}
					disabled={!promo.trim()}
					onPress={() => run("promo", () => premium.redeemPromo(promo))}
				/>
			</Row>
			<T variant="small" style={{ marginTop: 6 }}>
				Codes are redeemed in Google Play. Come back and tap Restore purchases.
			</T>
		</Screen>
	);
}
