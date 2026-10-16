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

/** 16 Oct 2026 */
export function formatDate(value: Date | string | null | undefined): string {
  return value ? dateFormatter.format(toDate(value)) : "—";
}

/** 16 Oct, 3:30 pm */
export function formatDateTime(value: Date | string | null | undefined): string {
  return value ? dateTimeFormatter.format(toDate(value)) : "—";
}

/** "today", "in 3 days", "5 days ago" */
export function formatRelativeDays(value: Date | string, now: Date = new Date()): string {
  const days = Math.round((toDate(value).getTime() - now.getTime()) / DAY_MS);
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
