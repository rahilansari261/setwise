import { useCallback, useContext } from "react";

import { translate } from "@/src/lib/i18n";
import { LocaleContext } from "@/src/lib/locale-context";

/** `const t = useT(); t("Add exercise")`. English text in, translated text out. */
export function useT() {
	const locale = useContext(LocaleContext);
	return useCallback((text: string) => translate(text, locale), [locale]);
}
