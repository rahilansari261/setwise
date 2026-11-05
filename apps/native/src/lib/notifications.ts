import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { Reminder } from "@/src/types";

const REMINDER_CHANNEL = "reminders";
const REST_CHANNEL = "rest-timer";
const REMINDER_TAG = "workout-reminder";
const REST_TAG = "rest-timer";

Notifications.setNotificationHandler({
	handleNotification: async (notification) => {
		// The in-app rest bar already alerts in the foreground; don't double up with a banner.
		const isRest = notification.request.content.data?.kind === REST_TAG;
		return {
			shouldShowBanner: !isRest,
			shouldShowList: !isRest,
			shouldPlaySound: !isRest,
			shouldSetBadge: false,
		};
	},
});

export async function setupChannels(): Promise<void> {
	if (Platform.OS !== "android") return;
	await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
		name: "Workout reminders",
		importance: Notifications.AndroidImportance.DEFAULT,
		lightColor: "#C6FF3D",
	});
	await Notifications.setNotificationChannelAsync(REST_CHANNEL, {
		name: "Rest timer",
		importance: Notifications.AndroidImportance.HIGH,
		vibrationPattern: [0, 250, 150, 250],
		lightColor: "#C6FF3D",
	});
}

export async function ensurePermission(): Promise<boolean> {
	const current = await Notifications.getPermissionsAsync();
	if (current.granted) return true;
	if (!current.canAskAgain) return false;
	const asked = await Notifications.requestPermissionsAsync();
	return asked.granted;
}

async function cancelByKind(kind: string): Promise<void> {
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	await Promise.all(
		scheduled
			.filter((n) => n.content.data?.kind === kind)
			.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
	);
}

/** Replaces all workout reminders with one weekly notification per selected day. */
export async function scheduleReminders(
	reminder: Reminder,
	name: string,
): Promise<void> {
	await cancelByKind(REMINDER_TAG);
	if (!reminder.enabled || reminder.days.length === 0) return;
	if (!(await ensurePermission())) return;
	const greeting = name ? `${name}, your` : "Your";
	await Promise.all(
		reminder.days.map((day) =>
			Notifications.scheduleNotificationAsync({
				content: {
					title: "Time to train",
					body: `${greeting} session is ready in Setwise.`,
					data: { kind: REMINDER_TAG },
				},
				trigger: {
					type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
					channelId: REMINDER_CHANNEL,
					weekday: day + 1, // expo: 1 = Sunday
					hour: reminder.hour,
					minute: reminder.minute,
				},
			}),
		),
	);
}

export async function scheduleRestDone(
	seconds: number,
	exerciseName?: string,
): Promise<void> {
	await cancelRestDone();
	if (seconds < 1) return;
	await Notifications.scheduleNotificationAsync({
		content: {
			title: "Rest over",
			body: exerciseName
				? `Next set of ${exerciseName}.`
				: "Time for your next set.",
			data: { kind: REST_TAG },
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
			channelId: REST_CHANNEL,
			seconds: Math.round(seconds),
		},
	});
}

export async function cancelRestDone(): Promise<void> {
	await cancelByKind(REST_TAG);
}

export async function cancelAll(): Promise<void> {
	await Notifications.cancelAllScheduledNotificationsAsync();
}
