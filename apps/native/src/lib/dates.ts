const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toISO(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function fromISO(iso: string): Date {
	const [y, m, d] = iso.split("-").map(Number);
	return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export const todayISO = () => toISO(new Date());

export function addDays(iso: string, days: number): string {
	const date = fromISO(iso);
	date.setDate(date.getDate() + days);
	return toISO(date);
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
	const date = fromISO(iso);
	const offset = (date.getDay() + 6) % 7;
	return addDays(iso, -offset);
}

export function monthName(monthIndex: number): string {
	return MONTHS[monthIndex] ?? "";
}

export function weekdayShort(dayIndex: number): string {
	return WEEKDAYS[dayIndex] ?? "";
}

/** "THU 16 OCT" */
export function headerDate(iso: string): string {
	const d = fromISO(iso);
	return `${weekdayShort(d.getDay())} ${d.getDate()} ${monthName(d.getMonth())}`.toUpperCase();
}

/** "Thu 16 Oct" */
export function shortDate(iso: string): string {
	const d = fromISO(iso);
	return `${weekdayShort(d.getDay())} ${String(d.getDate()).padStart(2, "0")} ${monthName(d.getMonth())}`;
}

export function daysBetween(a: string, b: string): number {
	return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000);
}
