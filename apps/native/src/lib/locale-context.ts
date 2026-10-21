import { createContext } from "react";

import type { SupportedLocale } from "@/src/lib/i18n";

/** Primitives (T, Button, Chip…) read this so they re-render when the language changes. */
export const LocaleContext = createContext<SupportedLocale>("en");
