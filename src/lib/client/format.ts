// Display helpers. A fixed time zone keeps server-rendered and browser-rendered
// dates identical (no hydration mismatch) and matches the users' local time.

const TIME_ZONE = "Asia/Dhaka";
const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: TIME_ZONE,
});

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

// en-GB writes September as "Sept"; every other month has three letters.
const threeLetterMonth = (text: string) => text.replace(/\bSept\b/, "Sep");

/** 16 Oct 2026 */
export function formatDate(value: Date | string | null | undefined): string {
  return value ? threeLetterMonth(dateFormatter.format(toDate(value))) : "—";
}

/** 16 Oct, 3:30 pm */
export function formatDateTime(value: Date | string | null | undefined): string {
  return value ? threeLetterMonth(dateTimeFormatter.format(toDate(value))) : "—";
}

/** "today", "in 3 days", "5 days ago" */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000; // Asia/Dhaka is UTC+6 all year

/** Calendar day number in Dhaka, so "yesterday" means the previous date, not "24 hours ago". */
const dhakaDay = (date: Date) => Math.floor((date.getTime() + DHAKA_OFFSET_MS) / DAY_MS);

export function formatRelativeDays(value: Date | string, now: Date = new Date()): string {
  const days = dhakaDay(toDate(value)) - dhakaDay(now);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

const bdt = new Intl.NumberFormat("en-IN"); // 1,00,000 grouping, as used in Bangladesh

/** "৳30,000 – ৳40,000", "৳30,000+", "Up to ৳40,000" or null */
export function formatSalary(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `৳${bdt.format(min)} – ৳${bdt.format(max)}`;
  if (min != null) return `৳${bdt.format(min)}+`;
  if (max != null) return `Up to ৳${bdt.format(max)}`;
  return null;
}

/** Value for <input type="date"> in Dhaka time. */
export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(toDate(value));
}

/** Value for <input type="datetime-local"> in the browser's local time. */
export function toDateTimeInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = toDate(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** "1 job", "3 jobs"; pass the plural when it isn't just +s ("1 company", "2 companies"). */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

/** { day: "20", month: "Oct" } in Dhaka time, for date anchors. */
export function formatDayMonth(value: Date | string): { day: string; month: string } {
  const parts = dayMonthFormatter.formatToParts(toDate(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return { day: part("day"), month: threeLetterMonth(part("month")) };
}
