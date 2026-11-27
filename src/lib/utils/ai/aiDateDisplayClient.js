/**
 * Presentation-only date and clock formatter for Ask SiBS AI. Never apply this to tool
 * arguments, reporting filters, stored records, or authorization decisions.
 * ISO dates are parsed by their calendar components (not browser timezone).
 * Explicit timestamp offsets are displayed in Asia/Manila. Unzoned HRIS
 * clock values are already Philippine wall-clock time; never add eight hours.
 */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ISO_DATE_IN_TEXT = /(?<![\w])([0-9]{4})([-/])([0-9]{2})\2([0-9]{2})(?:[Tt ]([0-9]{2}):([0-9]{2})(?::([0-9]{2})(?:\.[0-9]{1,9})?)?(Z|[+-][0-9]{2}:?[0-9]{2})?)?(?![\w])/g;
// en-PH commonly uses month/day/year in numeric dates. Never guess a date
// that has two plausible interpretations: keep those untouched.
const UNAMBIGUOUS_SLASH_DATE = /(?<![\w/])([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})(?![\w/])/g;

function validDate(year, month, day) {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function longDate(year, month, day) {
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function longTime(hour, minute, seconds = "") {
  const h = Number(hour);
  const displayedSeconds = seconds && Number(seconds) ? `:${seconds}` : "";
  return `${h % 12 || 12}:${minute}${displayedSeconds} ${h >= 12 ? "PM" : "AM"}`;
}

// Clock values in HRIS are already Manila-local unless a source supplies an
// explicit timestamp offset. Never reinterpret durations or numeric ratios.
const CLOCK_IN_TEXT = /(?<![\w:/])(?:(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?|(\d{1,2})(?=[ \t]*[ap]\.?m(?!\w)))(?:[ \t]*([ap]\.?m))?(?![\w:/])/gi;
const DURATION_LABEL = /\b(?:duration|elapsed|latency|ratio|work(?:ed)? hours|overtime(?: hours)?|ot (?:hrs|hours)|total hours|hours worked|hours|hrs|aht|asa)\s*(?:\([^)]*\))?\s*[:=]?\s*$/i;
const DURATION_PREFIX = /\b(?:duration|elapsed|latency|ratio|work(?:ed)? hours|overtime(?: hours)?|ot (?:hrs|hours)|total hours|hours worked|aht|asa)\s*(?:\([^)]*\))?\s*[:=]?\s*$/i;
const DURATION_SUFFIX = /^[ \t]*(?:hours?|hrs?\b|minutes?\b|mins?\b|seconds?\b|secs?\b|elapsed\b|duration\b)/i;

// A bare UTC/GMT clock has a known offset. For a named date plus clock,
// carry the date rollover too. Other ambiguous zone abbreviations are retained.
const UTC_CLOCK = new RegExp(
  `(?<![\\w:/])(?:(${MONTHS.join("|")}) (\\d{1,2}), (\\d{4})(?:,?\\s+at\\s+|,?\\s+))?(\\d{1,2}):(\\d{2})(?::(\\d{2}))?(?:[ \\t]*([ap]m))?[ \\t]+(?:UTC|GMT)(?![\\w+-])`, "gi"
);
function formatUtcClocks(value) {
  return value.replace(UTC_CLOCK, (original, monthName, dayText, yearText, hourText, minutes, seconds, meridiem) => {
    const hour = Number(hourText);
    if (Number(minutes) > 59 || (seconds && Number(seconds) > 59) || (meridiem ? hour < 1 || hour > 12 : hour > 23)) return original;
    const h24 = meridiem ? hour % 12 + (/^p/i.test(meridiem) ? 12 : 0) : hour;
    if (!monthName) return `${longTime((h24 + 8) % 24, minutes, seconds)} PHT`;
    const month = MONTHS.findIndex((m) => m.toLowerCase() === monthName.toLowerCase()) + 1;
    const day = Number(dayText), year = Number(yearText);
    if (!validDate(year, month, day)) return original;
    const local = new Date(Date.UTC(year, month - 1, day, h24 + 8, Number(minutes), Number(seconds || 0)));
    return `${longDate(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate())}, ${longTime(local.getUTCHours(), minutes, seconds)} PHT`;
  });
}

function formatClockText(value) {
  return formatUtcClocks(value).replace(CLOCK_IN_TEXT, (original, hourText, minutes, seconds, hourOnly, meridiem, index, full) => {
    const hour = Number(hourText ?? hourOnly);
    const minute = Number(minutes ?? "00");
    if (minute > 59 || (seconds && Number(seconds) > 59)) return original;
    if (meridiem ? hour < 1 || hour > 12 : hour > 23) return original;
    const before = full.slice(0, index);
    const after = full.slice(index + original.length);
    if (/(?:UTC|GMT)[+-]$/i.test(before) || /\d[+-]$/.test(before) && before.endsWith("+")) return original;
    if (/^\+\d{2}:?\d{2}(?!\d)/.test(after)) return original;
    if (!meridiem && (DURATION_PREFIX.test(before) || DURATION_SUFFIX.test(after))) return original;
    // Leave standalone explicitly foreign-zone times intact rather than guess
    // the source date, offset, or DST. ISO timestamps are converted above.
    if (/^[ \t]*(?:UTC|GMT|Z|EST|EDT|CST|CDT|MST|MDT|PST|PDT|CET|CEST|IST|JST|KST|AEST|AEDT)(?![\w])/i.test(after)) return original;
    const h24 = meridiem ? hour % 12 + (/^p/i.test(meridiem) ? 12 : 0) : hour;
    return longTime(h24, minutes ?? "00", seconds);
  });
}

// Field labels disambiguate clock-shaped duration values in report tables.
function isDurationField(label) {
  return typeof label === "string" && DURATION_LABEL.test(label.trim());
}

function formatDateText(value) {
  if (typeof value !== "string" || !value) return value;
  const isoFormatted = value.replace(ISO_DATE_IN_TEXT,
    (original, yearText, separator, monthText, dayText, hours, minutes, seconds, zone) => {
      const year = Number(yearText);
      const month = Number(monthText);
      const day = Number(dayText);
      if (!validDate(year, month, day)) return original;
      const formattedDate = longDate(year, month, day);
      if (hours == null) return formattedDate;
      if (Number(hours) > 23 || Number(minutes) > 59 || (seconds && Number(seconds) > 59)) return original;
      if (!zone) return `${formattedDate}, ${longTime(hours, minutes, seconds)}`;
      const offset = zone.length === 5 && zone !== "Z" ? `${zone.slice(0, 3)}:${zone.slice(3)}` : zone;
      const standard = `${yearText}-${monthText}-${dayText}T${hours}:${minutes}:${seconds || "00"}${offset}`;
      const instant = new Date(standard);
      if (Number.isNaN(instant.getTime())) return original;
      const local = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila", year: "numeric", month: "long", day: "numeric",
        hour: "numeric", minute: "2-digit", second: seconds && Number(seconds) ? "2-digit" : undefined,
        hour12: true,
      }).format(instant);
      return `${local} PHT`;
    });
  const numericFormatted = isoFormatted.replace(UNAMBIGUOUS_SLASH_DATE, (original, firstText, secondText, yearText) => {
    const first = Number(firstText);
    const second = Number(secondText);
    // 11/11/2026 and 12/25/2026 are unambiguous. 11/01/2026 isn't.
    if (first <= 12 && second <= 12 && first !== second) return original;
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    const year = Number(yearText);
    return validDate(year, month, day) ? longDate(year, month, day) : original;
  });
  const monthNames = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec";
  const monthFirst = new RegExp(`(?<![\\w])(${monthNames})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,\\s*|\\s+)(\\d{4})(?![\\w])`, "gi");
  const dayFirst = new RegExp(`(?<![\\w])(\\d{1,2})(?:st|nd|rd|th)?[ -]+(${monthNames})\\.?[ , -]+(\\d{4})(?![\\w])`, "gi");
  const formatNamedDate = (original, monthName, dayText, yearText) => {
    const month = MONTHS.findIndex((name) => name.slice(0, 3).toLowerCase() === monthName.slice(0, 3).toLowerCase()) + 1;
    const day = Number(dayText);
    const year = Number(yearText);
    return validDate(year, month, day) ? longDate(year, month, day) : original;
  };
  return numericFormatted
    .replace(monthFirst, formatNamedDate)
    .replace(dayFirst, (original, day, month, year) => formatNamedDate(original, month, day, year));
}

// Protect literal URLs and email addresses even when rendered as plain text.
// Formatting is restricted to presentation; originals remain in conversation state.
export function formatAiDisplayDates(value, fieldLabel) {
  if (typeof value !== "string" || !value) return value;
  const protectedToken = /((?:https?:\/\/|mailto:|www\.)[^\s<>]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/gi;
  return value.split(protectedToken).map((part, index) => {
    if (index % 2) return part;
    const dates = formatDateText(part);
    return isDurationField(fieldLabel) ? dates : formatClockText(dates);
  }).join("");
}

// Run after GFM parsing, so dates in headings, prose, lists, table cells,
// and inline date literals are formatted without changing Markdown syntax,
// link destinations, or fenced code. No extra dependency is needed.
export function remarkFormatAiDisplayDates() {
  return (tree) => {
    function nodeText(node) {
      return typeof node.value === "string" ? node.value : (node.children || []).map(nodeText).join("");
    }
    function walk(node, fieldLabel) {
      if (node.type === "code" || node.type === "html") return;
      if (node.type === "text" || node.type === "inlineCode") {
        node.value = formatAiDisplayDates(node.value, fieldLabel);
      }
      if (node.type === "table" && node.children?.length) {
        const [header, ...rows] = node.children;
        const labels = (header.children || []).map(nodeText);
        walk(header);
        rows.forEach((row) => (row.children || []).forEach((cell, i) => walk(cell, labels[i])));
        return;
      }
      if (Array.isArray(node.children)) node.children.forEach((child) => walk(child, fieldLabel));
    }
    walk(tree);
  };
}
