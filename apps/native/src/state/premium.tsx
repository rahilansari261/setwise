import { useRouter } from "expo-router";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Alert, Linking, Platform } from "react-native";
import Purchases, {
	type CustomerInfo,
	type PurchasesPackage,
} from "react-native-purchases";

import * as db from "@/src/db/database";
import { ENV } from "@/src/env";
import type { ProFeature } from "@/src/lib/pro";

const ENTITLEMENT = "pro";
const DEV_KEY = "dev_pro";

const apiKey =
	Platform.OS === "android"
		? ENV.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
		: undefined;
export const billingConfigured = Boolean(apiKey);

interface Premium {
	isPro: boolean;
	/** "store" = paid via Play Store, "dev" = developer unlock. */
	source: "store" | "dev" | null;
	loading: boolean;
	billingConfigured: boolean;
	packages: PurchasesPackage[];
	purchase: (pkg: PurchasesPackage) => Promise<boolean>;
	restore: () => Promise<boolean>;
	redeemPromo: (code: string) => Promise<void>;
	setDevPro: (on: boolean) => Promise<void>;
}

const PremiumContext = createContext<Premium | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
	const [storePro, setStorePro] = useState(false);
	const [devPro, setDevProState] = useState(false);
	const [packages, setPackages] = useState<PurchasesPackage[]>([]);
	const [loading, setLoading] = useState(true);

	const apply = useCallback((info: CustomerInfo) => {
		setStorePro(Boolean(info.entitlements.active[ENTITLEMENT]));
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setDevProState((await db.getKV<boolean>(DEV_KEY)) === true);
			if (!apiKey) return;
			Purchases.configure({ apiKey });
			Purchases.addCustomerInfoUpdateListener(apply);
			const [info, offerings] = await Promise.all([
				Purchases.getCustomerInfo(),
				Purchases.getOfferings(),
			]);
			if (cancelled) return;
			apply(info);
			setPackages(offerings.current?.availablePackages ?? []);
		})()
			.catch((e) => console.warn("Billing unavailable", e))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [apply]);

	const purchase = useCallback(
		async (pkg: PurchasesPackage) => {
			try {
				const { customerInfo } = await Purchases.purchasePackage(pkg);
				apply(customerInfo);
				return Boolean(customerInfo.entitlements.active[ENTITLEMENT]);
			} catch (e) {
				if ((e as { userCancelled?: boolean }).userCancelled) return false;
				throw e;
			}
		},
		[apply],
	);

	const restore = useCallback(async () => {
		if (!apiKey) return false;
		const info = await Purchases.restorePurchases();
		apply(info);
		return Boolean(info.entitlements.active[ENTITLEMENT]);
	}, [apply]);

	// Promo codes are Google Play promo codes: Play validates and grants them, RevenueCat sees the purchase.
	const redeemPromo = useCallback(async (code: string) => {
		const clean = code.trim();
		if (!clean) return;
		await Linking.openURL(
			`https://play.google.com/redeem?code=${encodeURIComponent(clean)}`,
		);
	}, []);

	const setDevPro = useCallback(async (on: boolean) => {
		setDevProState(on);
		await db.setKV(DEV_KEY, on);
	}, []);

	const value = useMemo<Premium>(
		() => ({
			isPro: storePro || devPro,
			source: storePro ? "store" : devPro ? "dev" : null,
			loading,
			billingConfigured,
			packages,
			purchase,
			restore,
			redeemPromo,
			setDevPro,
		}),
		[
			storePro,
			devPro,
			loading,
			packages,
			purchase,
			restore,
			redeemPromo,
			setDevPro,
		],
	);

	return (
		<PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
	);
}

export function usePremium(): Premium {
	const ctx = useContext(PremiumContext);
	if (!ctx) throw new Error("usePremium must be used inside PremiumProvider");
	return ctx;
}

/**
 * `const requirePro = useProGate()` then `requirePro("goals", () => doThing())`.
 * Pro users run the callback; everyone else lands on the paywall for that feature.
 */
export function useProGate() {
	const { isPro } = usePremium();
	const router = useRouter();
	return useCallback(
		(feature: ProFeature, run: () => void) => {
			if (isPro) run();
			else router.push({ pathname: "/paywall", params: { feature } });
		},
		[isPro, router],
	);
}

export const alertBillingMissing = () =>
	Alert.alert(
		"Billing isn't set up",
		"Add EXPO_PUBLIC_REVENUECAT_ANDROID_KEY and create the 'pro' entitlement in RevenueCat to sell subscriptions.",
	);
