import { getLocales } from "expo-localization";
import { Alert } from "react-native";

import { HI, HI_PATTERNS } from "@/src/lib/hi";
import type { Language } from "@/src/types";

export type SupportedLocale = "en" | "hi";

export function resolveLocale(pref: Language): SupportedLocale {
	if (pref === "en" || pref === "hi") return pref;
	return getLocales()[0]?.languageCode === "hi" ? "hi" : "en";
}

let current: SupportedLocale = "en";
export const getLocale = () => current;

/**
 * Translates a piece of UI text. The English text is the key, so anything without a Hindi entry
 * simply shows in English. Sentences with numbers or names go through HI_PATTERNS.
 */
export function translate(
	text: string,
	locale: SupportedLocale = current,
): string {
	if (locale !== "hi" || !text) return text;
	const trimmed = text.trim();
	if (!trimmed) return text;
	const hit = HI[trimmed.toLowerCase()];
	if (hit) return text.replace(trimmed, hit);
	for (const [re, fn] of HI_PATTERNS) {
		const m = trimmed.match(re);
		if (m) return text.replace(trimmed, fn(...m.slice(1)));
	}
	const unit = trimmed.match(/^(.+) \(([^()]+)\)$/);
	if (unit?.[1] && unit[2]) {
		const head = translate(unit[1], locale);
		if (head !== unit[1]) return text.replace(trimmed, `${head} (${unit[2]})`);
	}
	if (trimmed.includes(" · ")) {
		const parts = trimmed.split(" · ");
		const out = parts.map((p) => translate(p, locale));
		if (out.some((p, i) => p !== parts[i]))
			return text.replace(trimmed, out.join(" · "));
	}
	return text;
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
