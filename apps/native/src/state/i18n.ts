import { useCallback } from "react";

import { i18n, resolveLocale } from "@/src/lib/i18n";
import { useWorkouts } from "@/src/state/workout-store";

/** `const t = useT(); t("settings.title")`. Re-renders when the language changes. */
export function useT() {
	const { settings } = useWorkouts();
	const locale = resolveLocale(settings.language);
	return useCallback(
		(key: string, options?: Record<string, unknown>) =>
			i18n.t(key, { locale, ...options }),
		[locale],
	);
}
