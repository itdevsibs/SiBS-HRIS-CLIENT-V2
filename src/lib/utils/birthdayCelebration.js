const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PUBLIC_PATH_PREFIXES = Object.freeze([
  "/login",
  "/online-assessment",
  "/apply",
  "/job-description",
  "/public",
  "/recruitment/talent-pool/apply",
  "/recruitment/candidate-experience/survey",
]);

function parseDateOnly(value) {
  const match = String(value || "").match(DATE_ONLY_PATTERN);
  if (!match || match[1] === "0000") return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

function businessDateParts(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function isPossibleBirthday(birthdate, now = new Date()) {
  const birth = parseDateOnly(birthdate);
  if (!birth) return false;
  const today = businessDateParts(now);
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(today.year)) {
    return today.month === 2 && today.day === 28;
  }
  return birth.month === today.month && birth.day === today.day;
}

export function isBirthdayCelebrationRoute(pathname = "") {
  if (pathname === "/") return false;
  return !PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
