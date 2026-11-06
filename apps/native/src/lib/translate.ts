import { HI, HI_PATTERNS } from "@/src/lib/hi";

const DATE_WORDS: Record<string, string> = {
	sun: "रवि",
	mon: "सोम",
	tue: "मंगल",
	wed: "बुध",
	thu: "गुरु",
	fri: "शुक्र",
	sat: "शनि",
	jan: "जन॰",
	feb: "फ़र॰",
	mar: "मार्च",
	apr: "अप्रै॰",
	may: "मई",
	jun: "जून",
	jul: "जुला॰",
	aug: "अग॰",
	sep: "सित॰",
	oct: "अक्टू॰",
	nov: "नव॰",
	dec: "दिस॰",
};

const DATE_IN_TEXT =
	/\b(?:(?:sun|mon|tue|wed|thu|fri|sat)\s+)?\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi;

/** Translates dates inside a longer sentence, e.g. the date in "Moved to Mon 2 Nov". */
function datesInside(text: string): string {
	return text.replace(DATE_IN_TEXT, (d) => dateWords(d) ?? d);
}

/** "FRI 6 NOV", "Thu 15 Oct", "Nov 2026": every word is a weekday or month name. */
function dateWords(text: string): string | null {
	const words = text.match(/[A-Za-z]+/g);
	if (!words || !words.every((w) => DATE_WORDS[w.toLowerCase()])) return null;
	if (!/\d/.test(text) && words.length < 2) return null; // a lone "May" or "Sat" stays a word
	return text.replace(/[A-Za-z]+/g, (w) => DATE_WORDS[w.toLowerCase()] ?? w);
}

/**
 * English UI text to Hindi. The English text is the key, so anything without a Hindi entry simply stays
 * English. Sentences with numbers or names go through HI_PATTERNS. No React Native imports, so the
 * coverage check (scripts/check-hindi.ts) can run it in Node.
 */
export function toHindi(text: string): string {
	if (!text) return text;
	const trimmed = text.trim();
	if (!trimmed) return text;
	const hit = HI[trimmed.toLowerCase()];
	if (hit) return text.replace(trimmed, hit);
	for (const [re, fn] of HI_PATTERNS) {
		const m = trimmed.match(re);
		if (m) return text.replace(trimmed, datesInside(fn(...m.slice(1))));
	}
	const unit = trimmed.match(/^(.+) \(([^()]+)\)$/);
	if (unit?.[1] && unit[2]) {
		const head = toHindi(unit[1]);
		if (head !== unit[1]) return text.replace(trimmed, `${head} (${unit[2]})`);
	}
	const date = dateWords(trimmed);
	if (date) return text.replace(trimmed, date);
	if (trimmed.includes(" · ")) {
		const parts = trimmed.split(" · ");
		const out = parts.map((p) => toHindi(p));
		if (out.some((p, i) => p !== parts[i]))
			return text.replace(trimmed, out.join(" · "));
	}
	return text;
}
