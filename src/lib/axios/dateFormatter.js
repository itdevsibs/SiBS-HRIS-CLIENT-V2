/**
 * SiBS HRIS GLOBAL date/time presentation policy.
 *
 * Every authenticated and public HRIS frontend screen should use this module
 * for user-facing date/time DISPLAY. Do not use it to write a DB timestamp or
 * to calculate a shift/schedule boundary.
 *
 * Backend writes: getAuthoritativeManilaSqlDateTime().
 * Frontend display: Asia/Manila, independent of the browser timezone; no timezone suffix in displayed text.
 *
 * A zone-less MySQL DATETIME is a Manila wall-clock value. An explicit ISO
 * timestamp with Z or an offset is an instant and must be converted to Manila.
 */
export const HRIS_TIME_ZONE = 'Asia/Manila';
export const HRIS_TIME_ZONE_LABEL = 'GMT+8';
const DEFAULT_LOCALE = 'en-PH';
const MANILA_OFFSET = '+08:00';
const SQL_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const EXPLICIT_TIME_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const wallClockPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: HRIS_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function parseHrisDateTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const result = new Date(value);
    return Number.isNaN(result.getTime()) ? null : result;
  }
  const text = String(value).trim();
  if (!text) return null;

  const matched = SQL_DATETIME.exec(text);
  if (matched) {
    const [, year, month, day, hour, minute, second = '00', fraction = ''] = matched;
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${fraction ? `.${fraction}` : ''}${MANILA_OFFSET}`;
    const instant = new Date(iso);
    if (Number.isNaN(instant.getTime())) return null;
    const parts = Object.fromEntries(wallClockPartsFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
    if (parts.year !== year || parts.month !== month || parts.day !== day ||
        parts.hour !== hour || parts.minute !== minute) return null;
    return instant;
  }
  const dayOnly = DATE_ONLY.exec(text);
  if (dayOnly) {
    const instant = new Date(`${text}T00:00:00${MANILA_OFFSET}`);
    if (Number.isNaN(instant.getTime())) return null;
    const parts = Object.fromEntries(wallClockPartsFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
    return parts.year === dayOnly[1] && parts.month === dayOnly[2] && parts.day === dayOnly[3]
      ? instant : null;
  }
  if (EXPLICIT_TIME_ZONE.test(text)) {
    const instant = new Date(text.replace(' ', 'T'));
    return Number.isNaN(instant.getTime()) ? null : instant;
  }
  // Nonstandard timezone-less strings are ambiguous. Do not guess.
  return null;
}

/** Shared Intl formatter constructor for existing format/formatToParts usage. */
export function createSystemDateTimeFormatter(locale = DEFAULT_LOCALE, options = {}) {
  return new Intl.DateTimeFormat(locale, {
    ...(options || {}),
    // Retain an explicit UTC setting only for date-only calendar algorithms.
    timeZone: options?.timeZone === 'UTC' ? 'UTC' : HRIS_TIME_ZONE,
  });
}

function formatWith(value, locale, options, fallback = 'N/A') {
  const parsed = parseHrisDateTime(value);
  if (!parsed) return fallback;
  try {
    return createSystemDateTimeFormatter(locale || DEFAULT_LOCALE, options).format(parsed);
  } catch {
    return fallback;
  }
}

/** Drop-in date display replacement for Date#toLocaleDateString(locale, options). */
export function formatHrisDateLocalized(value, locale = DEFAULT_LOCALE, options) {
  return formatWith(value, locale, options);
}

/** Drop-in time display replacement for Date#toLocaleTimeString(locale, options). */
export function formatHrisTimeLocalized(value, locale = DEFAULT_LOCALE, options) {
  const opt = options === undefined ? { hour: 'numeric', minute: '2-digit', second: '2-digit' } : options;
  return formatWith(value, locale, opt);
}

/** Drop-in datetime display replacement for Date#toLocaleString(locale, options). */
export function formatHrisDateTimeLocalized(value, locale = DEFAULT_LOCALE, options) {
  const opt = options === undefined
    ? { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }
    : options;
  return formatWith(value, locale, opt);
}

export function getTodayDate() {
  // This is a display-friendly calendar DATE, not a clock or an authoritative DB save.
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: HRIS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDate(value) {
  return formatWith(value, DEFAULT_LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateTime(value) {
  return formatWith(value, DEFAULT_LOCALE, {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function formatSystemDateTime(value) {
  const result = formatWith(value, DEFAULT_LOCALE, {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }, '-');
  return result === '-' ? result : (result.includes(' at ') ? result : result.replace(/ (\d{1,2}:\d{2} [AP]M)$/, ' at $1'));
}

export function formatSystemApprovalDateTime(value) {
  const formatted = formatSystemDateTime(value);
  return formatted;
}

export default formatDateTime;
