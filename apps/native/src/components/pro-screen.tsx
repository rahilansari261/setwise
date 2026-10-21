import { useRouter } from "expo-router";
import { Crown } from "lucide-react-native";
import type { ReactNode } from "react";

import { Button, Card, Screen, ScreenHeader, T } from "@/src/components/ui";
import { PRO_FEATURES, type ProFeature } from "@/src/lib/pro";
import { usePremium } from "@/src/state/premium";
import { colors } from "@/src/theme";

/**
 * Page chrome for a Pro screen. Free users who land here (deep link, old tile) see the pitch
 * instead of the content, so a feature can never be reached around the paywall.
 */
export function ProScreen({
	feature,
	title,
	right,
	children,
	bottomInset = 40,
}: {
	feature: ProFeature;
	title: string;
	right?: ReactNode;
	children: ReactNode;
	bottomInset?: number;
}) {
	const { isPro } = usePremium();
	const router = useRouter();
	const info = PRO_FEATURES[feature];
	return (
		<Screen stack bottomInset={bottomInset}>
			<ScreenHeader title={title} right={isPro ? right : undefined} />
			{isPro ? (
				children
			) : (
				<Card style={{ marginTop: 20 }}>
					<Crown size={24} color={colors.accent} />
					<T variant="heading" style={{ marginTop: 10 }}>
						{info.title} is a Pro feature
					</T>
					<T variant="small" style={{ marginTop: 4 }}>
						{info.blurb}
					</T>
					<Button
						title="See Setwise Pro"
						style={{ marginTop: 16 }}
						onPress={() =>
							router.replace({ pathname: "/paywall", params: { feature } })
						}
					/>
				</Card>
			)}
		</Screen>
	);
}
