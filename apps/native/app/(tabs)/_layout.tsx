import { type BottomTabBarProps, Tabs } from "expo-router/js-tabs";
import {
	BookOpen,
	Calculator,
	Calendar,
	Dumbbell,
	type LucideIcon,
	TrendingUp,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RestBar } from "@/src/components/rest-bar";
import { colors, fonts } from "@/src/theme";

const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
	index: { icon: Dumbbell, label: "Today" },
	calendar: { icon: Calendar, label: "Calendar" },
	exercises: { icon: BookOpen, label: "Exercises" },
	progress: { icon: TrendingUp, label: "Progress" },
	tools: { icon: Calculator, label: "Tools" },
};

function TabBar({ state, navigation }: BottomTabBarProps) {
	const insets = useSafeAreaInsets();
	return (
		<View style={{ backgroundColor: colors.bg }}>
			<RestBar />
			<View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
				{state.routes.map((route, index) => {
					const meta = ICONS[route.name];
					if (!meta) return null;
					const focused = state.index === index;
					const Icon = meta.icon;
					const color = focused ? colors.accent : colors.muted;
					return (
						<Pressable
							key={route.key}
							accessibilityRole="tab"
							accessibilityState={{ selected: focused }}
							accessibilityLabel={meta.label}
							onPress={() => {
								const event = navigation.emit({
									type: "tabPress",
									target: route.key,
									canPreventDefault: true,
								});
								if (!focused && !event.defaultPrevented)
									navigation.navigate(route.name);
							}}
							style={styles.item}
						>
							<Icon size={22} color={color} strokeWidth={focused ? 2.3 : 1.8} />
							<Text
								maxFontSizeMultiplier={1.1}
								style={{
									fontFamily: focused ? fonts.bodySemi : fonts.body,
									fontSize: 11,
									color,
								}}
							>
								{meta.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

export default function TabsLayout() {
	return (
		<Tabs
			tabBar={(props) => <TabBar {...props} />}
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: colors.bg },
			}}
		>
			<Tabs.Screen name="index" />
			<Tabs.Screen name="calendar" />
			<Tabs.Screen name="exercises" />
			<Tabs.Screen name="progress" />
			<Tabs.Screen name="tools" />
		</Tabs>
	);
}

const styles = StyleSheet.create({
	bar: {
		flexDirection: "row",
		borderTopWidth: 1,
		borderTopColor: colors.hairline,
		paddingTop: 6,
	},
	item: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
		minHeight: 50,
	},
});
