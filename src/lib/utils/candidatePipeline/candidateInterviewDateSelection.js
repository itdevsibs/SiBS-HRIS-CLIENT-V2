const TIME_PATTERN = /^(\d{2}):(\d{2})$/;
const MIN_TIME_MINUTES = 10 * 60;
const MAX_TIME_MINUTES = 17 * 60;

function cleanText(value) {
  return String(value ?? "").trim();
}

function startOfLocalDay(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toCandidateInterviewDateValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseCandidateInterviewDateValue(value) {
  const match = cleanText(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }

  return date;
}

export function isSelectableCandidateInterviewDate(
  date,
  today = new Date(),
) {
  const target = startOfLocalDay(date);
  const todayStart = startOfLocalDay(today);

  if (!target || !todayStart || target < todayStart) return false;

  const weekday = target.getDay();
  return weekday !== 0 && weekday !== 6;
}

export function validateCandidateInterviewTime(value) {
  const normalized = cleanText(value);
  const match = normalized.match(TIME_PATTERN);

  if (!match) {
    return {
      valid: false,
      message: "Select a valid interview time.",
    };
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return {
      valid: false,
      message: "Select a valid interview time.",
    };
  }

  const totalMinutes = hour * 60 + minute;

  if (totalMinutes < MIN_TIME_MINUTES || totalMinutes > MAX_TIME_MINUTES) {
    return {
      valid: false,
      message: "Interview time must be between 10:00 AM and 5:00 PM.",
    };
  }

  return {
    valid: true,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

export function buildCandidateInterviewCalendarDays(displayDate) {
  const source = displayDate instanceof Date ? displayDate : new Date();
  const year = source.getFullYear();
  const month = source.getMonth();
  const firstDay = new Date(year, month, 1);
  const calendarStart = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      dateValue: toCandidateInterviewDateValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

export function formatCandidateInterviewTime(value) {
  const validation = validateCandidateInterviewTime(value);

  if (!validation.valid) return cleanText(value) || "—";

  const [hourText, minute] = validation.time.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

export const CANDIDATE_INTERVIEW_MIN_TIME = "10:00";
export const CANDIDATE_INTERVIEW_MAX_TIME = "17:00";
