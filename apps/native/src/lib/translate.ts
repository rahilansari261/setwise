import { HI, HI_PATTERNS } from "@/src/lib/hi";

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
		if (m) return text.replace(trimmed, fn(...m.slice(1)));
	}
	const unit = trimmed.match(/^(.+) \(([^()]+)\)$/);
	if (unit?.[1] && unit[2]) {
		const head = toHindi(unit[1]);
		if (head !== unit[1]) return text.replace(trimmed, `${head} (${unit[2]})`);
	}
	if (trimmed.includes(" · ")) {
		const parts = trimmed.split(" · ");
		const out = parts.map((p) => toHindi(p));
		if (out.some((p, i) => p !== parts[i]))
			return text.replace(trimmed, out.join(" · "));
	}
	return text;
}
