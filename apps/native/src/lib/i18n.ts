import { getLocales } from "expo-localization";
import { Alert } from "react-native";

import { toHindi } from "@/src/lib/translate";
import type { Language } from "@/src/types";

export type SupportedLocale = "en" | "hi";

export function resolveLocale(pref: Language): SupportedLocale {
	if (pref === "en" || pref === "hi") return pref;
	return getLocales()[0]?.languageCode === "hi" ? "hi" : "en";
}

let current: SupportedLocale = "en";
export const getLocale = () => current;

/** Translates a piece of UI text for `locale` (English text in, Hindi out when it's known). */
export function translate(
	text: string,
	locale: SupportedLocale = current,
): string {
	return locale === "hi" ? toHindi(text) : text;
}

const originalAlert = Alert.alert.bind(Alert);
let alertPatched = false;

/** Sets the app language and makes system dialogs (Alert) follow it. */
export function setLocale(next: SupportedLocale) {
	current = next;
	if (alertPatched) return;
	alertPatched = true;
	Alert.alert = (title, message, buttons, options) =>
		originalAlert(
			translate(title),
			message ? translate(message) : message,
			buttons?.map((b) => ({
				...b,
				text: b.text ? translate(b.text) : b.text,
			})),
			options,
		);
}
