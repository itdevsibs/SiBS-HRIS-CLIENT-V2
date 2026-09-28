export const PAGE_LIMIT = 15;
export const LATE_GRACE_MS = 60 * 1000;

export function formatNumber(value) {
  if (value === "..." || value === null || value === undefined) return "...";

  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  });
}

export function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

export function getNumberValue(value) {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return 0;

  return numberValue;
}

export function getValidDate(value) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

export function getTimeOnlyParts(value) {
  if (!value) return null;

  const raw = String(value).trim();

  const amPmMatch = raw.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );

  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = Number(amPmMatch[2]);
    const second = Number(amPmMatch[3] || 0);
    const meridiem = amPmMatch[4].toUpperCase();

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    return { hour, minute, second };
  }

  const timeMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (timeMatch) {
    return {
      hour: Number(timeMatch[1]),
      minute: Number(timeMatch[2]),
      second: Number(timeMatch[3] || 0),
    };
  }

  const parsed = getValidDate(raw);

  if (!parsed) return null;

  return {
    hour: parsed.getHours(),
    minute: parsed.getMinutes(),
    second: parsed.getSeconds(),
  };
}

export function buildDateTimeFromTrackerDate(trackerDate, timeValue) {
  const baseDate = getValidDate(trackerDate) || new Date();
  const timeParts = getTimeOnlyParts(timeValue);

  if (!timeParts) {
    return getValidDate(timeValue);
  }

  const result = new Date(baseDate);

  result.setHours(timeParts.hour, timeParts.minute, timeParts.second || 0, 0);

  return result;
}

export function getHoursBetween(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const start = getValidDate(startTime);
  const end = getValidDate(endTime);

  if (!start || !end) return 0;

  let diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  return diffMs / (1000 * 60 * 60);
}

export function getScheduleStart(item) {
  return (
    item?.schedule_start ||
    item?.scheduleStart ||
    item?.gy_schedule_start ||
    item?.gy_sched_start ||
    item?.gy_sched_timein ||
    item?.gy_sched_in ||
    item?.shift_start ||
    item?.shiftStart ||
    item?.schedStart ||
    item?.sched_start ||
    item?.gy_sched_login ||
    null
  );
}

export function getScheduleEnd(item) {
  return (
    item?.schedule_end ||
    item?.scheduleEnd ||
    item?.gy_schedule_end ||
    item?.gy_sched_end ||
    item?.gy_sched_timeout ||
    item?.gy_sched_out ||
    item?.shift_end ||
    item?.shiftEnd ||
    item?.schedEnd ||
    item?.sched_end ||
    item?.gy_sched_logout ||
    null
  );
}

export function isLateBySchedule(actualTime, scheduledTime) {
  if (!actualTime || !scheduledTime) return false;

  return actualTime.getTime() - scheduledTime.getTime() >= LATE_GRACE_MS;
}

export function getBreakHours(item) {
  if (item?.gy_tracker_breakout && item?.gy_tracker_breakin) {
    return getHoursBetween(item.gy_tracker_breakout, item.gy_tracker_breakin);
  }

  return getNumberValue(item?.gy_tracker_bh);
}

export function getComputedWorkHours(item) {
  const savedWh = getNumberValue(item?.gy_tracker_wh);

  const actualLogin = getValidDate(item?.gy_tracker_login);
  const actualLogout = getValidDate(item?.gy_tracker_logout);

  if (!actualLogin || !actualLogout) {
    return savedWh;
  }

  const trackerDate = item?.gy_tracker_date;
  const scheduleStartRaw = getScheduleStart(item);
  const scheduleEndRaw = getScheduleEnd(item);

  const scheduleStart = scheduleStartRaw
    ? buildDateTimeFromTrackerDate(trackerDate, scheduleStartRaw)
    : null;

  const scheduleEnd = scheduleEndRaw
    ? buildDateTimeFromTrackerDate(trackerDate, scheduleEndRaw)
    : null;

  if (
    scheduleStart &&
    scheduleEnd &&
    scheduleEnd.getTime() <= scheduleStart.getTime()
  ) {
    scheduleEnd.setDate(scheduleEnd.getDate() + 1);
  }

  const effectiveStart =
    scheduleStart && actualLogin.getTime() < scheduleStart.getTime()
      ? scheduleStart
      : actualLogin;

  const effectiveEnd =
    scheduleEnd && actualLogout.getTime() > scheduleEnd.getTime()
      ? scheduleEnd
      : actualLogout;

  let totalHours = getHoursBetween(effectiveStart, effectiveEnd);

  totalHours -= getBreakHours(item);

  if (totalHours > 0) return Math.max(totalHours, 0);

  return savedWh;
}

export function capWorkHoursFromItem(item) {
  return Math.min(getComputedWorkHours(item), 8);
}

export function displayCappedWorkHours(item) {
  const computedHours = getComputedWorkHours(item);

  if (!computedHours) return "—";

  return formatNumber(Math.min(computedHours, 8));
}

export function getLoginIndicator(item) {
  if (!item?.gy_tracker_login) {
    return { label: "No clock-in", tone: "neutral" };
  }

  const actualLogin = getValidDate(item?.gy_tracker_login);
  const scheduleStartRaw = getScheduleStart(item);
  const scheduledLogin = scheduleStartRaw
    ? buildDateTimeFromTrackerDate(item?.gy_tracker_date, scheduleStartRaw)
    : null;

  if (actualLogin && scheduledLogin) {
    return isLateBySchedule(actualLogin, scheduledLogin)
      ? { label: "Late clock-in", tone: "danger" }
      : { label: "On-Time", tone: "success" };
  }

  const normalized = normalizeStatus(item?.login_status);
  return normalized === "late"
    ? { label: "Late clock-in", tone: "danger" }
    : { label: "On-Time", tone: "success" };
}

export function getLogoutIndicator(item) {
  if (!item?.gy_tracker_logout) {
    return { label: "No clock-out", tone: "neutral" };
  }

  const normalized = normalizeStatus(item?.logout_status);

  if (normalized === "early-out" || normalized === "early") {
    return { label: "Early logout", tone: "warning" };
  }

  return { label: "Full shift", tone: "success" };
}

export function getSiteBadgeClass(site) {
  const normalized = String(site || "").trim().toLowerCase();

  if (normalized === "davao") {
    return "border-violet-100 bg-violet-50 text-violet-700";
  }

  if (normalized === "tagum") {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (normalized === "hybrid") {
    return "border-teal-100 bg-teal-50 text-teal-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function getAssignedSite(item) {
  const value =
    item?.site ??
    item?.assignedSite ??
    item?.gy_assignedloc ??
    item?.assigned_loc ??
    "";

  const raw = String(value ?? "").trim();

  if (!raw) return "—";

  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Both Tagum and Davao";
  if (raw === "3") return "Hybrid";

  return raw;
}
