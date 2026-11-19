import {
  createSystemDateTimeFormatter,
  formatHrisDateLocalized,
} from "@/lib/axios/dateFormatter";
import { getAssignedSite } from "@/lib/utils/attendance/attendanceHelpers";
import { normalizeVerifiedPersonalBalance } from "@/lib/utils/leaves/leaveBalanceDisplayClient";

const MANILA_TIME_ZONE = "Asia/Manila";
const PLACEHOLDER_VALUES = new Set([
  "",
  "-",
  "—",
  "n/a",
  "na",
  "null",
  "undefined",
  "none",
  "0000-00-00",
  "0000-00-00 00:00:00",
]);

export function cleanDashboardText(value) {
  return String(value ?? "").trim();
}

export function isPlaceholderValue(value) {
  const raw = cleanDashboardText(value);
  if (!raw) return true;
  if (raw.startsWith("0000-00-00")) return true;
  return PLACEHOLDER_VALUES.has(raw.toLowerCase());
}

function firstValue(...values) {
  return values.find((value) => cleanDashboardText(value)) || "";
}

function firstDisplayValue(...values) {
  for (const value of values) {
    if (!isPlaceholderValue(value)) {
      return cleanDashboardText(value);
    }
  }
  return "";
}

export function formatAssignedLocation(value) {
  if (isPlaceholderValue(value)) return "";
  const resolved = getAssignedSite({ site: value });
  return resolved === "—" ? "" : resolved;
}

export function toManilaDateKey(value = new Date()) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const parts = createSystemDateTimeFormatter("en-CA", {
      timeZone: MANILA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const record = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${record.year}-${record.month}-${record.day}`;
  }

  const raw = cleanDashboardText(value);
  if (!raw || raw.startsWith("0000-00-00")) return "";

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? "" : toManilaDateKey(parsed);
  }

  const dateMatch = raw.match(/^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/);
  if (dateMatch) return dateMatch[1];

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : toManilaDateKey(parsed);
}

function shiftDateKey(dateKey, deltaDays = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDashboardText(dateKey))) return "";
  const anchor = new Date(`${dateKey}T12:00:00.000Z`);
  anchor.setUTCDate(anchor.getUTCDate() + deltaDays);
  return anchor.toISOString().slice(0, 10);
}

function parseTimeStringParts(raw, { allowMidnight = false } = {}) {
  const clean = cleanDashboardText(raw);
  if (!clean || (!allowMidnight && clean === "00:00:00")) return null;

  const amPmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = Number(amPmMatch[2]);
    const second = Number(amPmMatch[3] || 0);
    const meridiem = amPmMatch[4].toUpperCase();
    if (hour < 1 || hour > 12 || minute > 59 || second > 59) return null;
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return { hour, minute, second };
  }

  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hour = Number(match24[1]);
    const minute = Number(match24[2]);
    const second = Number(match24[3] || 0);
    if (hour > 23 || minute > 59 || second > 59) return null;
    return { hour, minute, second };
  }

  return null;
}

export function parseManilaTimestamp(
  value,
  fallbackDateKey = "",
  { allowMidnight = false } = {},
) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = cleanDashboardText(value);
  if (isPlaceholderValue(raw)) return null;

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateTimeMatch = raw.match(
    /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)$/,
  );
  if (dateTimeMatch) {
    const timePart =
      dateTimeMatch[2].length === 5 ? `${dateTimeMatch[2]}:00` : dateTimeMatch[2];
    const parsed = new Date(`${dateTimeMatch[1]}T${timePart}+08:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateOnlyMatch = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnlyMatch) {
    const parsed = new Date(`${dateOnlyMatch[1]}T00:00:00+08:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const timeParts = parseTimeStringParts(raw, { allowMidnight });
  if (timeParts && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDateKey)) {
    const hh = String(timeParts.hour).padStart(2, "0");
    const mm = String(timeParts.minute).padStart(2, "0");
    const ss = String(timeParts.second).padStart(2, "0");
    const parsed = new Date(`${fallbackDateKey}T${hh}:${mm}:${ss}+08:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallbackParsed = new Date(raw);
  return Number.isNaN(fallbackParsed.getTime()) ? null : fallbackParsed;
}

export function formatDashboardDate(value, fallback = "—") {
  if (isPlaceholderValue(value)) return fallback;

  const raw = cleanDashboardText(value);
  const dateOnly = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  const date = dateOnly
    ? new Date(`${dateOnly[1]}T12:00:00+08:00`)
    : parseManilaTimestamp(raw);

  if (!date || Number.isNaN(date.getTime())) return raw || fallback;

  return formatHrisDateLocalized(date, "en-US", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPhtTime(date = new Date()) {
  const targetDate =
    date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();

  return createSystemDateTimeFormatter("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(targetDate);
}

export function formatPhtDate(date = new Date()) {
  const targetDate =
    date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();

  return createSystemDateTimeFormatter("en-US", {
    timeZone: MANILA_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(targetDate);
}

export function getProgressPercent(value, max) {
  const numValue = Number(value);
  const numMax = Number(max);

  if (!Number.isFinite(numValue) || !Number.isFinite(numMax) || numMax <= 0) {
    return 0;
  }

  return Math.min(Math.max(Math.round((numValue / numMax) * 100), 0), 100);
}

function resolveEmploymentStatusLabel(user = {}) {
  const explicit = firstDisplayValue(
    user?.employmentStatus,
    user?.employment_status,
  );
  if (explicit) return explicit;

  const empStatusRaw = cleanDashboardText(user?.gy_emp_status);
  if (empStatusRaw && !["0", "1", "2"].includes(empStatusRaw)) {
    return empStatusRaw;
  }

  const userStatus = user?.userStatus ?? user?.gy_user_status;
  if (userStatus !== undefined && userStatus !== null && String(userStatus) !== "") {
    return Number(userStatus) === 0 ? "Active" : "Inactive";
  }

  return cleanDashboardText(user?.role) ? "Active" : "Employee";
}

export function getEmployeeDashboardProfile(user = {}, { employeeLoading = false } = {}) {
  const firstName = firstDisplayValue(
    user?.firstName,
    user?.first_name,
    user?.gy_emp_fname,
  ) || "Employee";
  const middleName = firstDisplayValue(
    user?.middleName,
    user?.middle_name,
    user?.gy_emp_mname,
  );
  const lastName = firstDisplayValue(
    user?.lastName,
    user?.last_name,
    user?.gy_emp_lname,
  );

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const sibsId = firstDisplayValue(
    user?.sibsId,
    user?.sibs_id,
    user?.employeeSibsId,
    user?.gy_emp_code,
    user?.username,
  );

  const initials =
    [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "EP";

  const position = firstDisplayValue(
    user?.position,
    user?.positionTitle,
    user?.position_title,
    user?.designation,
    user?.gy_emp_designation,
    user?.jobTitle,
    user?.job_title,
    user?.roleTitle,
    user?.role_title,
  );

  const department = firstDisplayValue(
    user?.department,
    user?.departmentName,
    user?.department_name,
    user?.account,
    user?.accountName,
    user?.account_name,
    user?.gy_acc_name,
  );

  const location =
    formatAssignedLocation(
      firstDisplayValue(
        user?.site,
        user?.location,
        user?.gy_assignedloc,
      ),
    ) || "";

  const workSetup =
    firstDisplayValue(
      user?.workSetup,
      user?.work_setup,
      user?.workArrangement,
      user?.work_arrangement,
    ) || (location === "Hybrid" ? "Hybrid" : "");

  const manager = firstDisplayValue(
    user?.immediateSupervisor,
    user?.immediate_supervisor,
    user?.supervisor,
    user?.supervisorName,
    user?.supervisor_name,
    user?.manager,
    user?.managerName,
    user?.manager_name,
    user?.reportsTo,
    user?.reports_to,
    user?.accountManager,
    user?.account_manager,
  );

  const managerDisplay = manager || (employeeLoading ? "Loading…" : "Not assigned");

  return {
    firstName,
    middleName,
    lastName,
    fullName,
    sibsId,
    initials,
    position: position || (employeeLoading ? "Loading…" : "Not specified"),
    department: department || (employeeLoading ? "Loading…" : "Not assigned"),
    account: firstDisplayValue(
      user?.account,
      user?.accountName,
      user?.account_name,
    ),
    location: location || (employeeLoading ? "Loading…" : "Not specified"),
    workSetup: workSetup || (employeeLoading ? "Loading…" : "Not specified"),
    status: resolveEmploymentStatusLabel(user),
    manager: managerDisplay,
    managerPosition: firstDisplayValue(
      user?.supervisorPosition,
      user?.supervisor_position,
      user?.managerPosition,
      user?.manager_position,
      user?.supervisorDepartment,
      user?.supervisor_department,
      department,
    ),
    profilePictureUrl: firstDisplayValue(
      user?.profilePictureUrl,
      user?.profile_picture_url,
    ),
  };
}

export function formatAttendanceTime(value, { allowMidnight = false } = {}) {
  const raw = cleanDashboardText(value);
  if (isPlaceholderValue(raw) || (!allowMidnight && raw === "00:00:00")) return "";

  const timeParts = parseTimeStringParts(raw, { allowMidnight });
  if (timeParts) {
    const meridiem = timeParts.hour >= 12 ? "PM" : "AM";
    const hour12 = timeParts.hour % 12 || 12;
    return `${String(hour12).padStart(2, "0")}:${String(timeParts.minute).padStart(2, "0")} ${meridiem}`;
  }

  const parsed = parseManilaTimestamp(raw, "", { allowMidnight });
  if (!parsed) return "";

  return createSystemDateTimeFormatter("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}

function getFinitePositiveNumber(value) {
  if (value === null || value === undefined || cleanDashboardText(value) === "") {
    return null;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

function calculateBreakHours(breakoutDate, breakinDate, rawBreakHours) {
  if (breakoutDate && breakinDate) {
    let diffMs = breakinDate.getTime() - breakoutDate.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
    if (Number.isFinite(diffMs) && diffMs >= 0 && diffMs <= 6 * 60 * 60 * 1000) {
      return diffMs / (1000 * 60 * 60);
    }
  }
  const fallbackBreak = getFinitePositiveNumber(rawBreakHours);
  return fallbackBreak && fallbackBreak <= 6 ? fallbackBreak : 0;
}

function computeElapsedHours(
  startDate,
  endDate,
  breakHours = 0,
  { allowOvernightWrap = false } = {},
) {
  if (!startDate || !endDate) return null;
  let diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) {
    if (!allowOvernightWrap) return 0;
    diffMs += 24 * 60 * 60 * 1000;
  }
  if (!Number.isFinite(diffMs) || diffMs < 0 || diffMs > 24 * 60 * 60 * 1000) {
    return null;
  }
  const netHours = Math.max(0, diffMs / (1000 * 60 * 60) - breakHours);
  return Number.isFinite(netHours) ? netHours : null;
}

function formatLoginPunchStatus(loginStatus, fallbackWorkflowStatus) {
  const normalized = cleanDashboardText(loginStatus).toLowerCase();
  if (normalized === "late") return "Late";
  if (normalized === "on-time") return "On-Time";
  return firstDisplayValue(fallbackWorkflowStatus) || "Recorded";
}

function formatBreakPunchStatus(breakinStatus) {
  const normalized = cleanDashboardText(breakinStatus).toLowerCase();
  if (normalized === "over-break") return "Over Break";
  if (normalized === "on-time") return "On-Time";
  return "Logged";
}

function formatLogoutPunchStatus(logoutStatus) {
  const normalized = cleanDashboardText(logoutStatus).toLowerCase();
  if (normalized === "early-out" || normalized === "early") return "Undertime";
  if (normalized === "on-time") return "On-Time";
  return "Recorded";
}

function extractRecordsArray(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response)) return response;
  return [];
}

function findMatchingScheduleForDate(scheduleRecords = [], dateKey) {
  const matches = scheduleRecords.filter(
    (item) =>
      toManilaDateKey(item?.gy_sched_day || item?.date || item?.schedule_date) ===
      dateKey,
  );
  if (!matches.length) return null;
  return matches.reduce((best, candidate) =>
    Number(candidate?.gy_sched_id || 0) >= Number(best?.gy_sched_id || 0)
      ? candidate
      : best,
  );
}

function selectTodayOrOpenOvernightRecord(rawRecords = [], todayKey, yesterdayKey, now) {
  const todayMatch = rawRecords.find(
    (item) =>
      item &&
      toManilaDateKey(item.gy_tracker_date || item.gy_tracker_login) === todayKey,
  );
  if (todayMatch) {
    return { record: todayMatch, isOvernight: false, recordDateKey: todayKey };
  }

  const yesterdayOpen = rawRecords.find((item) => {
    if (!item) return false;
    const itemDateKey = toManilaDateKey(item.gy_tracker_date || item.gy_tracker_login);
    if (itemDateKey !== yesterdayKey) return false;

    const loginRaw = firstDisplayValue(item.gy_tracker_login, item.login, item.clock_in);
    const logoutRaw = firstDisplayValue(item.gy_tracker_logout, item.logout, item.clock_out);
    if (!loginRaw || logoutRaw) return false;

    const loginDate = parseManilaTimestamp(loginRaw, yesterdayKey);
    if (!loginDate) return false;

    const ageHours = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
    return Number.isFinite(ageHours) && ageHours >= 0 && ageHours <= 20;
  });

  if (yesterdayOpen) {
    return {
      record: yesterdayOpen,
      isOvernight: true,
      recordDateKey: yesterdayKey,
    };
  }

  return { record: null, isOvernight: false, recordDateKey: todayKey };
}

export function normalizeScheduleMode(mode) {
  const value = String(mode ?? "").trim();
  if (value === "0") return "Day Off";
  if (value === "1") return "Regular";
  if (value === "2") return "Rest Day";
  if (value === "3") return "Holiday";
  return value || "—";
}

export function getAttendanceSummaryFromResponses({
  attendanceResponse,
  kronosResponse,
  scheduleResponse,
  holidaysResponse,
  user = {},
  now = new Date(),
}) {
  const todayKey = toManilaDateKey(now);
  const yesterdayKey = shiftDateKey(todayKey, -1);

  const rawRecords = [
    ...extractRecordsArray(attendanceResponse),
    ...extractRecordsArray(kronosResponse),
  ];

  const scheduleRecords = extractRecordsArray(scheduleResponse);
  const holidayList = getDashboardHolidays(holidaysResponse, todayKey, {
    limit: null,
  });
  const todayHoliday = holidayList.find((holiday) => holiday.date === todayKey) || null;
  const todaySchedule = findMatchingScheduleForDate(scheduleRecords, todayKey);
  const todayScheduleMode = todaySchedule
    ? normalizeScheduleMode(todaySchedule.gy_sched_mode ?? todaySchedule.mode)
    : "";

  const schedLoginRaw = firstDisplayValue(
    todaySchedule?.gy_sched_login,
    todaySchedule?.login,
  );
  const schedLogoutRaw = firstDisplayValue(
    todaySchedule?.gy_sched_logout,
    todaySchedule?.logout,
  );
  const allowMidnightForToday =
    Boolean(schedLoginRaw && schedLogoutRaw) &&
    (schedLoginRaw !== "00:00:00" || schedLogoutRaw !== "00:00:00");

  const scheduledLogin = formatAttendanceTime(schedLoginRaw, {
    allowMidnight: allowMidnightForToday,
  });
  const scheduledLogout = formatAttendanceTime(schedLogoutRaw, {
    allowMidnight: allowMidnightForToday,
  });

  const { record, isOvernight, recordDateKey } = selectTodayOrOpenOvernightRecord(
    rawRecords,
    todayKey,
    yesterdayKey,
    now,
  );

  if (record) {
    const rawLogin = firstDisplayValue(
      record.gy_tracker_login,
      record.login,
      record.time_in,
      record.clock_in,
    );
    const rawBreakout = firstDisplayValue(
      record.gy_tracker_breakout,
      record.breakout,
      record.start_break,
    );
    const rawBreakin = firstDisplayValue(
      record.gy_tracker_breakin,
      record.breakin,
      record.end_break,
    );
    const rawLogout = firstDisplayValue(
      record.gy_tracker_logout,
      record.logout,
      record.time_out,
      record.clock_out,
    );

    const clockIn = formatAttendanceTime(rawLogin);
    const breakout = formatAttendanceTime(rawBreakout);
    const breakin = formatAttendanceTime(rawBreakin);
    const clockOut = formatAttendanceTime(rawLogout);

    const loginDate = parseManilaTimestamp(rawLogin, recordDateKey);
    const breakoutDate = parseManilaTimestamp(rawBreakout, recordDateKey);
    const breakinDate = parseManilaTimestamp(rawBreakin, recordDateKey);
    const logoutDate = parseManilaTimestamp(rawLogout, recordDateKey);

    const location =
      formatAssignedLocation(
        firstDisplayValue(
          record.site,
          record.assignedSite,
          record.location,
          record.gy_assignedloc,
          user?.site,
          user?.location,
          user?.gy_assignedloc,
        ),
      ) || "—";

    const device = firstDisplayValue(record.device) || "Biometrics / Web Portal";
    const workflowStatus = firstDisplayValue(record.gy_tracker_status);
    const isLate = cleanDashboardText(record.login_status).toLowerCase() === "late";
    const isUndertime =
      cleanDashboardText(record.logout_status).toLowerCase() === "early-out" ||
      cleanDashboardText(record.logout_status).toLowerCase() === "early";

    const logCandidates = [];
    if (clockIn) {
      logCandidates.push({
        id: `punch-in-${record.gy_tracker_id || "1"}`,
        order: 1,
        epochMs: loginDate?.getTime() ?? 0,
        type: "Clock In",
        timestamp: clockIn,
        location,
        status: formatLoginPunchStatus(record.login_status, workflowStatus),
        device,
      });
    }
    if (breakout) {
      logCandidates.push({
        id: `punch-bo-${record.gy_tracker_id || "2"}`,
        order: 2,
        epochMs: breakoutDate?.getTime() ?? 0,
        type: "Start Break",
        timestamp: breakout,
        location,
        status: "Logged",
        device,
      });
    }
    if (breakin) {
      logCandidates.push({
        id: `punch-bi-${record.gy_tracker_id || "3"}`,
        order: 3,
        epochMs: breakinDate?.getTime() ?? 0,
        type: "End Break",
        timestamp: breakin,
        location,
        status: formatBreakPunchStatus(record.breakin_status),
        device,
      });
    }
    if (clockOut) {
      logCandidates.push({
        id: `punch-out-${record.gy_tracker_id || "4"}`,
        order: 4,
        epochMs: logoutDate?.getTime() ?? 0,
        type: "Clock Out",
        timestamp: clockOut,
        location,
        status: formatLogoutPunchStatus(record.logout_status),
        device,
      });
    }

    const logs = logCandidates
      .sort((a, b) => a.epochMs - b.epochMs || a.order - b.order)
      .map(({ id, type, timestamp, location: logLocation, status: logStatus, device: logDevice }) => ({
        id,
        type,
        timestamp,
        location: logLocation,
        status: logStatus,
        device: logDevice,
      }));

    const breakHours = calculateBreakHours(
      breakoutDate,
      breakinDate,
      record.gy_tracker_bh,
    );
    const verifiedWh = getFinitePositiveNumber(record.gy_tracker_wh);
    const approvedOt = getFinitePositiveNumber(record.approved_ot_hours);

    let status = "Not Clocked In";
    let renderedHours = "—";
    let renderedHoursDetail = "";
    let isPendingHours = false;

    if (clockIn && clockOut) {
      status = isUndertime ? "Shift Completed · Undertime" : "Shift Completed";
      const computed =
        verifiedWh ??
        computeElapsedHours(loginDate, logoutDate, breakHours, {
          allowOvernightWrap: true,
        });
      if (computed !== null && Number.isFinite(computed)) {
        renderedHours = `${computed.toFixed(2)} hrs`;
        renderedHoursDetail =
          approvedOt !== null ? `+${approvedOt.toFixed(2)} OT hrs approved` : "";
      } else {
        renderedHours = "Unavailable";
      }
    } else if (clockIn) {
      isPendingHours = true;
      if (breakout && !breakin) {
        status = "On Break · Pending Out";
      } else if (isOvernight) {
        status = isLate ? "Overnight Shift · Late" : "Overnight Shift · Active";
      } else if (isLate) {
        status = "Clocked In · Late";
      } else {
        status = "Clocked In · Pending Out";
      }

      if (verifiedWh !== null) {
        renderedHours = `${verifiedWh.toFixed(2)} hrs`;
        renderedHoursDetail = "Pending clock-out";
      } else {
        renderedHours = "Pending clock-out";
        const activeElapsed = computeElapsedHours(loginDate, now, breakHours, {
          allowOvernightWrap: false,
        });
        if (activeElapsed !== null && Number.isFinite(activeElapsed)) {
          renderedHoursDetail = `${activeElapsed.toFixed(2)} hrs elapsed`;
        }
      }
    }

    const adjustmentParts = [];
    if (workflowStatus && workflowStatus !== "Approved") {
      adjustmentParts.push(`Record: ${workflowStatus}`);
    } else if (workflowStatus === "Approved") {
      adjustmentParts.push("Daily Log: Approved");
    }
    if (record.ot_approval_status) {
      adjustmentParts.push(`OT: ${record.ot_approval_status}`);
    } else if (approvedOt !== null) {
      adjustmentParts.push(`OT: ${approvedOt.toFixed(2)} hrs`);
    }
    if (
      cleanDashboardText(record.attendance_status_source) === "schedule_adjustment"
    ) {
      adjustmentParts.push("Schedule Adjustment");
    }
    if (isLate) adjustmentParts.push("Late");
    if (isUndertime) adjustmentParts.push("Undertime");

    return {
      status,
      workflowStatus,
      clockIn: clockIn || "—",
      clockOut: clockOut || (clockIn ? "Pending" : "—"),
      scheduledShift:
        scheduledLogin && scheduledLogout
          ? `${scheduledLogin} - ${scheduledLogout}`
          : "",
      renderedHours,
      renderedHoursDetail,
      isPendingHours,
      isOvernight,
      isLate,
      isUndertime,
      location,
      adjustmentSummary: adjustmentParts.join(" · "),
      logs,
    };
  }

  const modeLower = todayScheduleMode.toLowerCase();
  let emptyStatus = "Not Clocked In";
  let emptyDetail = "";

  if (modeLower === "rest day" || modeLower === "day off") {
    emptyStatus = todayScheduleMode;
    emptyDetail = "Scheduled rest day";
  } else if (modeLower === "holiday" || todayHoliday) {
    emptyStatus = "Holiday";
    emptyDetail = todayHoliday?.name || "Scheduled holiday";
  }

  return {
    status: emptyStatus,
    workflowStatus: "",
    clockIn: "—",
    clockOut: "—",
    scheduledShift:
      scheduledLogin && scheduledLogout
        ? `${scheduledLogin} - ${scheduledLogout}`
        : "",
    renderedHours: "—",
    renderedHoursDetail: emptyDetail,
    isPendingHours: false,
    isOvernight: false,
    isLate: false,
    isUndertime: false,
    location: formatAssignedLocation(
      firstDisplayValue(user?.site, user?.location, user?.gy_assignedloc),
    ) || "—",
    adjustmentSummary: "",
    logs: [],
  };
}

function computeShiftHoursText(
  rawLogin,
  rawLogout,
  rawBreakout,
  rawBreakin,
  dateKey,
  { allowMidnight = false } = {},
) {
  const loginDate = parseManilaTimestamp(rawLogin, dateKey, { allowMidnight });
  const logoutDate = parseManilaTimestamp(rawLogout, dateKey, { allowMidnight });
  if (!loginDate || !logoutDate) return "";

  const breakoutDate = parseManilaTimestamp(rawBreakout, dateKey);
  const breakinDate = parseManilaTimestamp(rawBreakin, dateKey);
  const breakHours =
    breakoutDate && breakinDate
      ? calculateBreakHours(breakoutDate, breakinDate, 0)
      : 0;

  const hours = computeElapsedHours(loginDate, logoutDate, breakHours, {
    allowOvernightWrap: true,
  });
  if (hours === null || !Number.isFinite(hours)) return "";
  return `${hours.toFixed(1)} hrs`;
}

export function getWeeklyScheduleFromResponse({
  scheduleResponse,
  holidaysResponse,
  scheduleAvailable = true,
  scheduleLoading = false,
  user = {},
  now = new Date(),
}) {
  const todayKey = toManilaDateKey(now);
  const anchor = new Date(`${todayKey}T12:00:00.000Z`);
  const dayIndex = anchor.getUTCDay();
  const offsetToMonday = dayIndex === 0 ? 6 : dayIndex - 1;

  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - offsetToMonday);

  const rawRecords = extractRecordsArray(scheduleResponse);
  const holidaysByDate = new Map(
    getDashboardHolidays(holidaysResponse, monday.toISOString().slice(0, 10), {
      limit: null,
    }).map((h) => [h.date, h]),
  );

  const workSetup = firstDisplayValue(user?.workSetup, user?.work_setup);
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return DAYS.map((dayName, index) => {
    const currentDay = new Date(monday);
    currentDay.setUTCDate(monday.getUTCDate() + index);
    const dateKey = currentDay.toISOString().slice(0, 10);
    const isToday = dateKey === todayKey;

    const dateLabel = formatHrisDateLocalized(currentDay, "en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const record = findMatchingScheduleForDate(rawRecords, dateKey);
    const holidayForDay = holidaysByDate.get(dateKey) || null;

    if (record) {
      const mode = normalizeScheduleMode(record.gy_sched_mode ?? record.mode);
      const modeLower = mode.toLowerCase();
      const isOff = modeLower === "day off" || modeLower === "rest day";
      const isHolidayMode = modeLower === "holiday";

      const rawLogin = firstDisplayValue(
        record.gy_sched_login,
        record.login,
        record.time_in,
        record.gy_sched_start,
      );
      const rawLogout = firstDisplayValue(
        record.gy_sched_logout,
        record.logout,
        record.time_out,
        record.gy_sched_end,
      );
      const rawBreakout = firstDisplayValue(
        record.gy_sched_breakout,
        record.breakout,
      );
      const rawBreakin = firstDisplayValue(
        record.gy_sched_breakin,
        record.breakin,
      );

      const allowMidnight =
        !isOff &&
        Boolean(rawLogin && rawLogout) &&
        (rawLogin !== "00:00:00" || rawLogout !== "00:00:00");

      const login = formatAttendanceTime(rawLogin, { allowMidnight });
      const logout = formatAttendanceTime(rawLogout, { allowMidnight });
      const shiftText = login && logout ? `${login} - ${logout}` : "";

      const hoursText = isOff
        ? "0.0 hrs"
        : computeShiftHoursText(
            rawLogin,
            rawLogout,
            rawBreakout,
            rawBreakin,
            dateKey,
            { allowMidnight },
          ) || "—";

      const isOvernight = (() => {
        const start = parseManilaTimestamp(rawLogin, dateKey, { allowMidnight });
        const end = parseManilaTimestamp(rawLogout, dateKey, { allowMidnight });
        return Boolean(start && end && end.getTime() <= start.getTime());
      })();

      return {
        id: `sched-${dateKey}`,
        dateKey,
        day: dayName,
        date: dateLabel,
        shift: isOff
          ? mode.toUpperCase()
          : isHolidayMode && !shiftText
            ? holidayForDay?.name || "HOLIDAY"
            : shiftText || (holidayForDay ? holidayForDay.name : "Schedule posted"),
        hours: hoursText,
        status: isHolidayMode
          ? "Holiday"
          : isOff
            ? mode
            : [mode !== "—" ? mode : workSetup || "Regular", isOvernight ? "Overnight" : ""]
                .filter(Boolean)
                .join(" · "),
        isToday,
        isOff,
        isHoliday: isHolidayMode || Boolean(holidayForDay),
        isOvernight,
      };
    }

    if (holidayForDay) {
      return {
        id: `sched-${dateKey}`,
        dateKey,
        day: dayName,
        date: dateLabel,
        shift: holidayForDay.name,
        hours: "Holiday",
        status: "Holiday",
        isToday,
        isOff: true,
        isHoliday: true,
        isOvernight: false,
      };
    }

    return {
      id: `sched-${dateKey}`,
      dateKey,
      day: dayName,
      date: dateLabel,
      shift: scheduleLoading
        ? "Loading…"
        : scheduleAvailable
          ? "No Shift Plotted"
          : "Unavailable",
      hours: scheduleLoading || !scheduleAvailable ? "—" : "0.0 hrs",
      status: scheduleLoading
        ? "Loading"
        : scheduleAvailable
          ? "Unscheduled"
          : "Unavailable",
      isToday,
      isOff: true,
      isHoliday: false,
      isOvernight: false,
    };
  });
}

export function normalizeLeaveType(type) {
  const value = Number(type);
  switch (value) {
    case 1:
      return "Vacation / Personal";
    case 2:
      return "Sick";
    case 3:
      return "Maternal";
    case 4:
      return "Paternal";
    case 5:
      return "Solo Parent";
    case 6:
      return "Force";
    case 7:
      return "Indefinite";
    case 8:
      return "Quarantine";
    case 9:
      return "Emergency";
    default:
      return cleanDashboardText(type) || "Leave Request";
  }
}

export function normalizeLeaveStatus(status) {
  const value = String(status ?? "").trim();
  if (value === "") return "Pending";
  const lower = value.toLowerCase();
  if (["approved", "approve", "1"].includes(lower)) return "Approved";
  if (
    ["rejected", "declined", "not approved", "not_approved", "2"].includes(
      lower,
    )
  ) {
    return "Rejected";
  }
  if (["pending", "for approval", "for_approval", "0"].includes(lower)) {
    return "Pending";
  }
  return value;
}

export function getLeaveDashboardDataFromResponses({
  leavesResponse,
  balanceResponse,
  summaryResponse,
  leavesLoading = false,
  balanceLoading = false,
  balanceAvailable = false,
  balanceError = "",
  sibsId = "",
  user = {},
}) {
  const resolvedSibsId = firstDisplayValue(
    sibsId,
    user?.sibsId,
    user?.sibs_id,
    user?.gy_emp_code,
    user?.username,
  );
  const rawRecent = extractRecordsArray(leavesResponse);

  const recent = rawRecent.map((item, index) => {
    const rawType = firstDisplayValue(
      item.leave_type_label,
      item.gy_leave_type,
      item.type,
      item.leave_type,
      item.leaveType,
    );
    const type = item.leave_type_label
      ? cleanDashboardText(item.leave_type_label)
      : normalizeLeaveType(rawType);
    const rawStatus = firstValue(
      item.gy_leave_status,
      item.status,
      item.leave_status,
      item.leaveStatus,
    );
    const status = normalizeLeaveStatus(rawStatus);

    const dateFrom = firstDisplayValue(
      item.gy_leave_date_from,
      item.dates,
      item.date_from,
      item.dateFrom,
      item.start_date,
      item.leave_date,
    );
    const dateTo = firstDisplayValue(
      item.gy_leave_date_to,
      item.date_to,
      item.dateTo,
      item.end_date,
    );

    const formattedFrom = formatDashboardDate(dateFrom, "");
    const formattedTo = formatDashboardDate(dateTo, "");

    const dates =
      formattedFrom && formattedTo && formattedFrom !== formattedTo
        ? `${formattedFrom} - ${formattedTo}`
        : formattedFrom ||
          formattedTo ||
          cleanDashboardText(item.dates) ||
          "Pending Review";

    const rawDays =
      item.gy_leave_day ??
      item.gy_leave_day_type ??
      item.days ??
      item.leave_days ??
      item.no_of_days ??
      "";
    const numDays = Number(rawDays);
    const days =
      rawDays !== "" && Number.isFinite(numDays) && numDays > 0
        ? `${numDays} ${numDays === 1 ? "day" : "days"}`
        : "";

    return {
      id: item.gy_leave_id || item.id || `leave-${index}`,
      type,
      dates,
      days,
      numericDays: Number.isFinite(numDays) && numDays > 0 ? numDays : 0,
      status,
    };
  });

  const verifiedBalance = normalizeVerifiedPersonalBalance(
    balanceResponse ?? summaryResponse,
    resolvedSibsId,
  );

  let balanceStatus = "unavailable";
  if (balanceLoading) {
    balanceStatus = "loading";
  } else if (verifiedBalance) {
    balanceStatus = "verified";
  } else if (balanceAvailable && (balanceResponse?.success === true)) {
    balanceStatus = "missing";
  }

  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let approvedDays = 0;

  for (const row of recent) {
    if (row.status === "Approved") {
      approvedCount += 1;
      approvedDays += row.numericDays;
    } else if (row.status === "Rejected") {
      rejectedCount += 1;
    } else {
      pendingCount += 1;
    }
  }

  return {
    balanceStatus,
    balanceError: balanceError || balanceResponse?.message || "",
    creditsRemaining: verifiedBalance?.leave_remaining ?? null,
    creditsTotal: verifiedBalance?.total_leave_credits ?? null,
    creditSource: verifiedBalance ? "gy_employee" : "",
    requestSummary: {
      loading: leavesLoading,
      total: recent.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      approvedDays,
    },
    recent,
  };
}

export function getDashboardAnnouncements(user = {}) {
  return Array.isArray(user?.announcements) && user.announcements.length
    ? user.announcements
    : [];
}

function normalizeDashboardHoliday(item = {}, index = 0) {
  const date = firstDisplayValue(item?.date, item?.holidayDate, item?.holiday_date);
  const isActive = item?.isActive ?? item?.is_active ?? true;

  return {
    id: firstDisplayValue(item?.id, item?.holidayId, item?.holiday_id) || `holiday-${index}`,
    name: firstDisplayValue(
      item?.name,
      item?.holidayName,
      item?.holiday_name,
      item?.title,
    ) || "Holiday",
    type: firstDisplayValue(item?.type, item?.holidayType, item?.holiday_type),
    date: toManilaDateKey(date) || String(date || "").slice(0, 10),
    isActive: Boolean(isActive),
    upcoming: true,
  };
}

export function getDashboardHolidays(
  source = {},
  now = new Date(),
  { limit = 5 } = {},
) {
  const rows = Array.isArray(source)
    ? source
    : Array.isArray(source?.data)
      ? source.data
      : Array.isArray(source?.holidays)
        ? source.holidays
        : [];
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(now || ""))
    ? String(now)
    : toManilaDateKey(now);

  const sorted = rows
    .map(normalizeDashboardHoliday)
    .filter(
      (holiday) =>
        holiday.isActive &&
        /^\d{4}-\d{2}-\d{2}$/.test(holiday.date) &&
        holiday.date >= today,
    )
    .sort((left, right) => left.date.localeCompare(right.date));

  return Number.isInteger(limit) && limit >= 0
    ? sorted.slice(0, limit)
    : sorted;
}
