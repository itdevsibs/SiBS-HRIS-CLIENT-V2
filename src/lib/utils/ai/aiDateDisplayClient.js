/**
 * Presentation-only date formatter for Ask SiBS AI. Never apply this to tool
 * arguments, reporting filters, stored records, or authorization decisions.
 * ISO dates are parsed by their calendar components (not browser timezone).
 * Explicit timestamp offsets are displayed in Asia/Manila.
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

export function formatAiDisplayDates(value) {
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
  return isoFormatted.replace(UNAMBIGUOUS_SLASH_DATE, (original, firstText, secondText, yearText) => {
    const first = Number(firstText);
    const second = Number(secondText);
    // 11/11/2026 and 12/25/2026 are unambiguous. 11/01/2026 isn't.
    if (first <= 12 && second <= 12 && first !== second) return original;
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    const year = Number(yearText);
    return validDate(year, month, day) ? longDate(year, month, day) : original;
  });
}
