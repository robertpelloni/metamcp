const DETERMINISTIC_LOCALE = "en-US";
const DETERMINISTIC_TIME_ZONE = "UTC";

/**
 * Formats a date/time value deterministically for SSR + client hydration consistency.
 *
 * Why this exists:
 * - `toLocaleString()` output can vary by runtime locale/timezone.
 * - Next.js client components can render on the server first, then hydrate in browser.
 * - Using a fixed locale/timezone avoids hydration text mismatches.
 */
export function formatDeterministicDateTime(
  value: Date | string | number,
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(DETERMINISTIC_LOCALE, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: DETERMINISTIC_TIME_ZONE,
  }).format(date);
}
