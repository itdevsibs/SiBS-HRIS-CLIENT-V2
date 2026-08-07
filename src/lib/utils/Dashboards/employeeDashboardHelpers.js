const MANILA_TIME_ZONE = "Asia/Manila";

export function cleanDashboardText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function firstDashboardValue(...values) {
  return values.find((value) => cleanDashboardText(value)) ?? "";
}

export function normalizeDashboardCollection(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getNameParts(user = {}) {
  return {
    firstName: cleanDashboardText(
      firstDashboardValue(user.firstName, user.first_name, user.gy_emp_fname),
    ),
    middleName: cleanDashboardText(
      firstDashboardValue(user.middleName, user.middle_name, user.gy_emp_mname),
    ),
    lastName: cleanDashboardText(
      firstDashboardValue(user.lastName, user.last_name, user.gy_emp_lname),
    ),
  };
}

function getInitials(firstName, lastName, fullName) {
  const direct = `${cleanDashboardText(firstName).slice(0, 1)}${cleanDashboardText(
    lastName,
  ).slice(0, 1)}`.toUpperCase();

  if (direct) return direct;

  const words = cleanDashboardText(fullName)
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${words[0]?.[0] || "E"}${words[1]?.[0] || ""}`.toUpperCase();
}

export function getEmployeeDashboardProfile(user = {}) {
  const { firstName, middleName, lastName } = getNameParts(user);
  const assembledName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ");
  const fullName = cleanDashboardText(
    assembledName ||
      firstDashboardValue(
        user.fullName,
        user.full_name,
        user.name,
        user.displayName,
      ) ||
      "Employee",
  );

  return {
    firstName: firstName || fullName.split(/\s+/)[0] || "Employee",
    middleName,
    lastName,
    fullName,
    initials: getInitials(firstName, lastName, fullName),
    sibsId: cleanDashboardText(
      firstDashboardValue(
        user.sibsId,
        user.sibs_id,
        user.employeeSibsId,
        user.employee_sibs_id,
        user.gy_emp_code,
        user.gy_user_code,
        user.username,
      ),
    ),
    email: cleanDashboardText(
      firstDashboardValue(user.email, user.gy_email, user.gy_user_email),
    ),
    position: cleanDashboardText(
      firstDashboardValue(
        user.position,
        user.positionName,
        user.position_name,
        user.jobTitle,
        user.job_title,
        user.roleTitle,
        user.role_title,
        user.designation,
      ),
    ),
    department: cleanDashboardText(
      firstDashboardValue(
        user.department,
        user.departmentName,
        user.department_name,
        user.gy_department,
      ),
    ),
    account: cleanDashboardText(
      firstDashboardValue(
        user.account,
        user.accountName,
        user.account_name,
        user.gy_account,
      ),
    ),
    location: cleanDashboardText(
      firstDashboardValue(
        user.location,
        user.assignedLocation,
        user.assigned_location,
        user.site,
        user.gy_assignedloc,
      ),
    ),
    workSetup: cleanDashboardText(
      firstDashboardValue(user.workSetup, user.work_setup),
    ),
    manager: cleanDashboardText(
      firstDashboardValue(
        user.manager,
        user.managerName,
        user.manager_name,
        user.immediateSupervisor,
        user.immediate_supervisor,
        user.supervisor,
      ),
    ),
    managerPosition: cleanDashboardText(
      firstDashboardValue(
        user.managerPosition,
        user.manager_position,
        user.supervisorPosition,
        user.supervisor_position,
      ),
    ),
    status: cleanDashboardText(
      firstDashboardValue(
        user.employmentStatus,
        user.employment_status,
        user.status,
      ),
    ),
    hireDate: firstDashboardValue(
      user.hireDate,
      user.hire_date,
      user.gy_emp_hiredate,
    ),
    regularizationDate: firstDashboardValue(
      user.regularizationDate,
      user.regularization_date,
      user.regularizedDate,
      user.regularized_date,
    ),
    profilePictureUrl: cleanDashboardText(
      firstDashboardValue(
        user.profilePictureUrl,
        user.profile_picture_url,
        user.profilePicture,
        user.profile_picture,
        user.avatarUrl,
        user.avatar_url,
      ),
    ),
  };
}

function normalizeAttendanceLog(item = {}, index = 0) {
  return {
    id: cleanDashboardText(
      firstDashboardValue(item.id, item.logId, item.log_id, `attendance-${index}`),
    ),
    type: cleanDashboardText(
      firstDashboardValue(item.type, item.activityType, item.activity_type, "Activity"),
    ),
    timestamp: cleanDashboardText(
      firstDashboardValue(
        item.timestamp,
        item.dateTime,
        item.date_time,
        item.time,
        item.createdAt,
        item.created_at,
      ),
    ),
    location: cleanDashboardText(
      firstDashboardValue(
        item.location,
        item.locationName,
        item.location_name,
        item.ipAddress,
        item.ip_address,
      ),
    ),
    status: cleanDashboardText(
      firstDashboardValue(item.status, item.punchStatus, item.punch_status),
    ),
    device: cleanDashboardText(
      firstDashboardValue(item.device, item.deviceName, item.device_name),
    ),
  };
}

export function getAttendanceSummary(user = {}) {
  const logs = normalizeDashboardCollection(
    firstDashboardValue(
      user.attendanceLogs,
      user.attendance_logs,
      user.punchLogs,
      user.punch_logs,
      user.todayPunchLogs,
      user.today_punch_logs,
    ),
  ).map(normalizeAttendanceLog);

  return {
    status: cleanDashboardText(
      firstDashboardValue(
        user.attendanceStatus,
        user.attendance_status,
        user.punchStatus,
        user.punch_status,
        "Not synced",
      ),
    ),
    clockIn: cleanDashboardText(
      firstDashboardValue(
        user.clockInTime,
        user.clock_in_time,
        user.timeIn,
        user.time_in,
        "—",
      ),
    ),
    clockOut: cleanDashboardText(
      firstDashboardValue(
        user.clockOutTime,
        user.clock_out_time,
        user.timeOut,
        user.time_out,
        "—",
      ),
    ),
    renderedHours: cleanDashboardText(
      firstDashboardValue(
        user.renderedHours,
        user.rendered_hours,
        user.workedHours,
        user.worked_hours,
        "—",
      ),
    ),
    logs,
  };
}

function getPhtDateParts(value = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(value);
  const record = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(record.year),
    month: Number(record.month),
    day: Number(record.day),
  };
}

function toDateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanDashboardText(value).slice(0, 10);
  const parts = getPhtDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

function normalizeScheduleItem(item = {}, index = 0, todayKey = "") {
  const rawDate = firstDashboardValue(
    item.date,
    item.scheduleDate,
    item.schedule_date,
    item.dayDate,
    item.day_date,
  );
  const dateKey = toDateKey(rawDate);
  const status = cleanDashboardText(
    firstDashboardValue(item.status, item.scheduleStatus, item.schedule_status),
  );

  return {
    id: cleanDashboardText(firstDashboardValue(item.id, item.key, `schedule-${index}`)),
    day: cleanDashboardText(
      firstDashboardValue(item.day, item.dayLabel, item.day_label),
    ),
    date: cleanDashboardText(rawDate),
    dateKey,
    shift: cleanDashboardText(
      firstDashboardValue(
        item.shift,
        item.shiftTime,
        item.shift_time,
        item.schedule,
        "Schedule not loaded",
      ),
    ),
    status: status || (dateKey === todayKey ? "Today" : "No schedule data"),
    hours: cleanDashboardText(
      firstDashboardValue(item.hours, item.renderedHours, item.rendered_hours),
    ),
    isToday:
      Boolean(item.isToday ?? item.is_today) ||
      (dateKey && dateKey === todayKey) ||
      /today/i.test(status),
    isOff:
      Boolean(item.isOff ?? item.is_off) ||
      /\b(off|rest day)\b/i.test(status) ||
      /\brest day\b/i.test(
        cleanDashboardText(firstDashboardValue(item.shift, item.schedule)),
      ),
  };
}

function buildNeutralWeek(now = new Date(), defaultShift = "") {
  const parts = getPhtDateParts(now);
  const todayAnchor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayIndex = todayAnchor.getUTCDay();
  const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  const monday = new Date(todayAnchor);
  monday.setUTCDate(todayAnchor.getUTCDate() - daysFromMonday);
  const todayKey = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;

  return Array.from({ length: 7 }, (_, index) => {
    const dayDate = new Date(monday);
    dayDate.setUTCDate(monday.getUTCDate() + index);
    const dateKey = dayDate.toISOString().slice(0, 10);
    const isToday = dateKey === todayKey;

    return {
      id: `schedule-${dateKey}`,
      day: new Intl.DateTimeFormat("en-PH", {
        weekday: "short",
        timeZone: "UTC",
      }).format(dayDate),
      date: new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
      }).format(dayDate),
      dateKey,
      shift: cleanDashboardText(defaultShift) || "Schedule not loaded",
      status: isToday ? "Today" : "No schedule data",
      hours: "",
      isToday,
      isOff: false,
    };
  });
}

export function getWeeklySchedule(user = {}, now = new Date()) {
  const defaultShift = firstDashboardValue(
    user.shift,
    user.shiftSchedule,
    user.shift_schedule,
    user.scheduleName,
    user.schedule_name,
  );
  const source = normalizeDashboardCollection(
    firstDashboardValue(
      user.weeklySchedule,
      user.weekly_schedule,
      user.scheduleTimeline,
      user.schedule_timeline,
      user.schedules,
    ),
  );
  const todayParts = getPhtDateParts(now);
  const todayKey = `${todayParts.year}-${String(todayParts.month).padStart(
    2,
    "0",
  )}-${String(todayParts.day).padStart(2, "0")}`;

  if (!source.length) return buildNeutralWeek(now, defaultShift);

  return source.slice(0, 7).map((item, index) => {
    const normalized = normalizeScheduleItem(item, index, todayKey);

    if (!normalized.day && normalized.dateKey) {
      const date = new Date(`${normalized.dateKey}T00:00:00.000Z`);
      normalized.day = new Intl.DateTimeFormat("en-PH", {
        weekday: "short",
        timeZone: "UTC",
      }).format(date);
    }

    if (normalized.date && /^\d{4}-\d{2}-\d{2}/.test(normalized.date)) {
      const date = new Date(`${normalized.date.slice(0, 10)}T00:00:00.000Z`);
      normalized.date = new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
      }).format(date);
    }

    return normalized;
  });
}

function getLeaveBalanceFromSource(source, keys = []) {
  if (Array.isArray(source)) {
    const loweredKeys = keys.map((key) => key.toLowerCase());
    const item = source.find((entry) => {
      const identity = cleanDashboardText(
        firstDashboardValue(entry?.code, entry?.type, entry?.name, entry?.label),
      ).toLowerCase();
      return loweredKeys.some((key) => identity.includes(key));
    });

    if (!item) return { available: null, total: null, used: null };

    return {
      available: normalizeNumber(
        firstDashboardValue(
          item.available,
          item.balance,
          item.remaining,
          item.remainingDays,
          item.remaining_days,
        ),
      ),
      total: normalizeNumber(
        firstDashboardValue(item.total, item.entitlement, item.credits),
      ),
      used: normalizeNumber(firstDashboardValue(item.used, item.consumed)),
    };
  }

  if (source && typeof source === "object") {
    for (const key of keys) {
      const item = source[key] || source[key.toUpperCase()] || source[key.toLowerCase()];
      if (!item) continue;

      if (typeof item === "number" || typeof item === "string") {
        return { available: normalizeNumber(item), total: null, used: null };
      }

      return {
        available: normalizeNumber(
          firstDashboardValue(
            item.available,
            item.balance,
            item.remaining,
            item.remainingDays,
            item.remaining_days,
          ),
        ),
        total: normalizeNumber(
          firstDashboardValue(item.total, item.entitlement, item.credits),
        ),
        used: normalizeNumber(firstDashboardValue(item.used, item.consumed)),
      };
    }
  }

  return { available: null, total: null, used: null };
}

function normalizeLeaveRequest(item = {}, index = 0) {
  return {
    id: cleanDashboardText(firstDashboardValue(item.id, item.requestId, item.request_id, `leave-${index}`)),
    type: cleanDashboardText(
      firstDashboardValue(item.type, item.leaveType, item.leave_type, "Leave Request"),
    ),
    dates: cleanDashboardText(
      firstDashboardValue(
        item.dates,
        item.dateRange,
        item.date_range,
        item.date,
        item.startDate,
        item.start_date,
      ),
    ),
    days: cleanDashboardText(
      firstDashboardValue(item.days, item.totalDays, item.total_days),
    ),
    status: cleanDashboardText(firstDashboardValue(item.status, "Status not loaded")),
  };
}

export function getLeaveDashboardData(user = {}) {
  const balances =
    user.leaveBalances || user.leave_balances || user.leaveCredits || user.leave_credits || {};
  const vacation = getLeaveBalanceFromSource(balances, [
    "vacation",
    "vl",
    "vacation leave",
  ]);
  const sick = getLeaveBalanceFromSource(balances, ["sick", "sl", "sick leave"]);

  if (vacation.available === null) {
    vacation.available = normalizeNumber(
      firstDashboardValue(user.vacationLeaveBalance, user.vacation_leave_balance),
    );
  }
  if (vacation.total === null) {
    vacation.total = normalizeNumber(
      firstDashboardValue(user.vacationLeaveTotal, user.vacation_leave_total),
    );
  }
  if (sick.available === null) {
    sick.available = normalizeNumber(
      firstDashboardValue(user.sickLeaveBalance, user.sick_leave_balance),
    );
  }
  if (sick.total === null) {
    sick.total = normalizeNumber(
      firstDashboardValue(user.sickLeaveTotal, user.sick_leave_total),
    );
  }

  const recent = normalizeDashboardCollection(
    firstDashboardValue(
      user.recentLeaves,
      user.recent_leaves,
      user.leaveRequests,
      user.leave_requests,
    ),
  )
    .slice(0, 4)
    .map(normalizeLeaveRequest);

  return { vacation, sick, recent };
}

function normalizeAnnouncement(item = {}, index = 0) {
  return {
    id: cleanDashboardText(firstDashboardValue(item.id, item.announcementId, item.announcement_id, `announcement-${index}`)),
    title: cleanDashboardText(firstDashboardValue(item.title, item.subject, "Announcement")),
    category: cleanDashboardText(
      firstDashboardValue(item.category, item.type, "Company Update"),
    ),
    date: firstDashboardValue(item.date, item.publishedAt, item.published_at, item.createdAt, item.created_at),
    author: cleanDashboardText(
      firstDashboardValue(item.author, item.createdBy, item.created_by),
    ),
    summary: cleanDashboardText(
      firstDashboardValue(item.summary, item.message, item.description, item.content),
    ),
    important: Boolean(item.isImportant ?? item.is_important ?? item.important),
  };
}

export function getDashboardAnnouncements(user = {}) {
  return normalizeDashboardCollection(
    firstDashboardValue(
      user.dashboardAnnouncements,
      user.dashboard_announcements,
      user.announcements,
      user.notifications,
    ),
  )
    .slice(0, 5)
    .map(normalizeAnnouncement);
}

function normalizeHoliday(item = {}, index = 0) {
  return {
    id: cleanDashboardText(firstDashboardValue(item.id, item.holidayId, item.holiday_id, `holiday-${index}`)),
    name: cleanDashboardText(firstDashboardValue(item.name, item.title, "Holiday")),
    date: firstDashboardValue(item.date, item.holidayDate, item.holiday_date),
    type: cleanDashboardText(firstDashboardValue(item.type, item.holidayType, item.holiday_type)),
    upcoming: Boolean(item.isUpcoming ?? item.is_upcoming ?? false),
  };
}

export function getDashboardHolidays(user = {}) {
  return normalizeDashboardCollection(
    firstDashboardValue(
      user.upcomingHolidays,
      user.upcoming_holidays,
      user.holidays,
      user.holidayCalendar,
      user.holiday_calendar,
    ),
  )
    .slice(0, 5)
    .map(normalizeHoliday);
}

export function formatPhtTime(value = new Date()) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(value);
}

export function formatPhtDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function formatDashboardDate(value, fallback = "—") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return cleanDashboardText(value) || fallback;

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getProgressPercent(available, total) {
  const safeAvailable = normalizeNumber(available);
  const safeTotal = normalizeNumber(total);
  if (safeAvailable === null || safeTotal === null || safeTotal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((safeAvailable / safeTotal) * 100)));
}

/* =====================================================
   API-DRIVEN EMPLOYEE DASHBOARD NORMALIZERS
===================================================== */

export function extractDashboardRows(payload) {
  if (Array.isArray(payload)) return payload.filter(Boolean);

  const candidates = [
    payload?.data,
    payload?.data?.data,
    payload?.data?.rows,
    payload?.data?.records,
    payload?.data?.items,
    payload?.data?.schedules,
    payload?.data?.attendance,
    payload?.data?.leaves,
    payload?.data?.requests,
    payload?.schedules,
    payload?.attendance,
    payload?.leaves,
    payload?.requests,
    payload?.rows,
    payload?.records,
    payload?.items,
    payload?.result,
    payload?.result?.data,
  ];

  return candidates.find(Array.isArray)?.filter(Boolean) || [];
}

function getDashboardSibsId(source = {}) {
  return cleanDashboardText(
    firstDashboardValue(
      source.sibsId,
      source.sibs_id,
      source.employeeSibsId,
      source.employee_sibs_id,
      source.gy_emp_code,
      source.gy_user_code,
      source.employeeCode,
      source.employee_code,
      source.code,
      source.username,
    ),
  );
}

function rowBelongsToEmployee(row = {}, sibsId = "") {
  if (!sibsId) return true;

  const rowId = getDashboardSibsId(row);
  return !rowId || rowId === sibsId;
}

function getAttendanceDateValue(row = {}) {
  return firstDashboardValue(
    row.gy_tracker_date,
    row.trackerDate,
    row.tracker_date,
    row.attendanceDate,
    row.attendance_date,
    row.date,
  );
}

function formatDashboardTimeValue(value, fallback = "—") {
  if (!value) return fallback;

  const raw = cleanDashboardText(value);
  const localMatch = raw.match(
    /^(?:\d{4}-\d{2}-\d{2}[ T])?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i,
  );

  if (localMatch && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    let hour = Number(localMatch[1]);
    const minute = Number(localMatch[2]);
    const meridiem = localMatch[4]?.toUpperCase();

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    const anchor = new Date(Date.UTC(2000, 0, 1, hour, minute));
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(anchor);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return raw || fallback;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getAttendanceTimestamp(row = {}, keys = []) {
  return firstDashboardValue(...keys.map((key) => row?.[key]));
}

function getAttendanceLocation(row = {}) {
  const raw = cleanDashboardText(
    firstDashboardValue(
      row.location,
      row.locationName,
      row.location_name,
      row.site,
      row.assignedSite,
      row.assigned_site,
      row.gy_assignedloc,
      row.assigned_loc,
      row.ipAddress,
      row.ip_address,
    ),
  );

  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Tagum and Davao";
  if (raw === "3") return "Hybrid";
  return raw;
}

function getAttendanceDevice(row = {}) {
  return cleanDashboardText(
    firstDashboardValue(
      row.device,
      row.deviceName,
      row.device_name,
      row.source,
      row.punch_source,
      row.login_source,
      row.gy_tracker_device,
    ),
  );
}

function getAttendanceHours(row = {}) {
  const saved = normalizeNumber(
    firstDashboardValue(
      row.gy_tracker_wh,
      row.workHours,
      row.work_hours,
      row.renderedHours,
      row.rendered_hours,
      row.hours,
    ),
  );

  if (saved !== null) return saved;

  const login = new Date(
    firstDashboardValue(row.gy_tracker_login, row.clockIn, row.clock_in),
  );
  const logout = new Date(
    firstDashboardValue(row.gy_tracker_logout, row.clockOut, row.clock_out),
  );

  if (Number.isNaN(login.getTime()) || Number.isNaN(logout.getTime())) {
    return null;
  }

  let milliseconds = logout.getTime() - login.getTime();
  if (milliseconds < 0) milliseconds += 24 * 60 * 60 * 1000;

  const breakOut = new Date(
    firstDashboardValue(row.gy_tracker_breakout, row.breakOut, row.break_out),
  );
  const breakIn = new Date(
    firstDashboardValue(row.gy_tracker_breakin, row.breakIn, row.break_in),
  );

  if (!Number.isNaN(breakOut.getTime()) && !Number.isNaN(breakIn.getTime())) {
    milliseconds -= Math.max(0, breakIn.getTime() - breakOut.getTime());
  } else {
    const breakHours = normalizeNumber(row.gy_tracker_bh);
    if (breakHours !== null) milliseconds -= breakHours * 60 * 60 * 1000;
  }

  return Math.max(0, milliseconds / (60 * 60 * 1000));
}

function buildAttendanceLog({ row, type, value, status, index }) {
  if (!value) return null;

  return {
    id: `${cleanDashboardText(firstDashboardValue(row.id, row.gy_tracker_id, "attendance"))}-${index}`,
    type,
    timestamp: formatDashboardTimeValue(value),
    location: getAttendanceLocation(row),
    status: cleanDashboardText(status) || "Recorded",
    device: getAttendanceDevice(row),
  };
}

export function getAttendanceSummaryFromResponses({
  attendanceResponse,
  kronosResponse,
  user = {},
  now = new Date(),
} = {}) {
  const sibsId = getDashboardSibsId(user);
  const kronosRows = extractDashboardRows(kronosResponse).filter((row) =>
    rowBelongsToEmployee(row, sibsId),
  );
  const attendanceRows = extractDashboardRows(attendanceResponse).filter((row) =>
    rowBelongsToEmployee(row, sibsId),
  );
  const sourceRows = kronosRows.length ? kronosRows : attendanceRows;
  const todayKey = toDateKey(now);

  const sorted = [...sourceRows].sort((left, right) => {
    const leftDate = toDateKey(getAttendanceDateValue(left));
    const rightDate = toDateKey(getAttendanceDateValue(right));
    return rightDate.localeCompare(leftDate);
  });

  const row =
    sorted.find((item) => toDateKey(getAttendanceDateValue(item)) === todayKey) ||
    sorted[0];

  if (!row) {
    return {
      status: "No attendance record",
      clockIn: "—",
      clockOut: "—",
      renderedHours: "—",
      logs: [],
      source: kronosRows.length ? "kronos" : attendanceRows.length ? "attendance" : "none",
    };
  }

  const login = getAttendanceTimestamp(row, [
    "gy_tracker_login",
    "clockIn",
    "clock_in",
    "timeIn",
    "time_in",
  ]);
  const logout = getAttendanceTimestamp(row, [
    "gy_tracker_logout",
    "clockOut",
    "clock_out",
    "timeOut",
    "time_out",
  ]);
  const breakOut = getAttendanceTimestamp(row, [
    "gy_tracker_breakout",
    "breakOut",
    "break_out",
  ]);
  const breakIn = getAttendanceTimestamp(row, [
    "gy_tracker_breakin",
    "breakIn",
    "break_in",
  ]);
  const trackerStatus = cleanDashboardText(
    firstDashboardValue(
      row.gy_tracker_status,
      row.attendanceStatus,
      row.attendance_status,
      row.status,
    ),
  );
  const loginStatus = cleanDashboardText(
    firstDashboardValue(row.login_status, row.loginStatus),
  );
  const logoutStatus = cleanDashboardText(
    firstDashboardValue(row.logout_status, row.logoutStatus),
  );

  let status = "No attendance record";
  if (login && !logout) status = /late/i.test(loginStatus) ? "Clocked In · Late" : "Clocked In";
  if (login && logout) status = /early/i.test(logoutStatus) ? "Clocked Out · Early" : "Clocked Out";
  if (!login && trackerStatus) status = trackerStatus;

  const hours = getAttendanceHours(row);
  const logs = [
    buildAttendanceLog({
      row,
      type: "Clock In",
      value: login,
      status: loginStatus || trackerStatus || "Recorded",
      index: 1,
    }),
    buildAttendanceLog({
      row,
      type: "Break Start",
      value: breakOut,
      status: "Recorded",
      index: 2,
    }),
    buildAttendanceLog({
      row,
      type: "Break End",
      value: breakIn,
      status: "Recorded",
      index: 3,
    }),
    buildAttendanceLog({
      row,
      type: "Clock Out",
      value: logout,
      status: logoutStatus || trackerStatus || "Recorded",
      index: 4,
    }),
  ].filter(Boolean);

  return {
    status,
    clockIn: formatDashboardTimeValue(login),
    clockOut: formatDashboardTimeValue(logout),
    renderedHours: hours === null ? "—" : `${hours.toFixed(2)} hrs`,
    logs,
    source: kronosRows.length ? "kronos" : "attendance",
    raw: row,
  };
}

function getScheduleDateValue(row = {}) {
  return firstDashboardValue(
    row.date,
    row.scheduleDate,
    row.schedule_date,
    row.gy_schedule_date,
    row.gy_sched_date,
    row.shiftDate,
    row.shift_date,
  );
}

function getScheduleStartValue(row = {}) {
  return firstDashboardValue(
    row.schedule_start,
    row.scheduleStart,
    row.gy_schedule_start,
    row.gy_sched_start,
    row.gy_sched_timein,
    row.gy_sched_in,
    row.shift_start,
    row.shiftStart,
    row.schedStart,
    row.sched_start,
    row.gy_sched_login,
  );
}

function getScheduleEndValue(row = {}) {
  return firstDashboardValue(
    row.schedule_end,
    row.scheduleEnd,
    row.gy_schedule_end,
    row.gy_sched_end,
    row.gy_sched_timeout,
    row.gy_sched_out,
    row.shift_end,
    row.shiftEnd,
    row.schedEnd,
    row.sched_end,
    row.gy_sched_logout,
  );
}

function getShiftLabel(row = {}) {
  const direct = cleanDashboardText(
    firstDashboardValue(row.shift, row.shiftTime, row.shift_time, row.schedule),
  );
  if (direct) return direct;

  const start = getScheduleStartValue(row);
  const end = getScheduleEndValue(row);
  if (!start && !end) return "Schedule not loaded";

  return `${formatDashboardTimeValue(start)} – ${formatDashboardTimeValue(end)}`;
}

function getScheduleHours(row = {}) {
  const explicit = normalizeNumber(
    firstDashboardValue(row.hours, row.shiftHours, row.shift_hours, row.work_hours),
  );
  if (explicit !== null) return `${explicit.toFixed(2)} hrs`;

  const start = getScheduleStartValue(row);
  const end = getScheduleEndValue(row);
  if (!start || !end) return "";

  const parseMinutes = (value) => {
    const match = cleanDashboardText(value).match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  const startMinutes = parseMinutes(start);
  let endMinutes = parseMinutes(end);
  if (startMinutes === null || endMinutes === null) return "";
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return `${((endMinutes - startMinutes) / 60).toFixed(2)} hrs`;
}

export function getWeeklyScheduleFromResponse({
  scheduleResponse,
  user = {},
  now = new Date(),
} = {}) {
  const sibsId = getDashboardSibsId(user);
  const rows = extractDashboardRows(scheduleResponse).filter((row) =>
    rowBelongsToEmployee(row, sibsId),
  );
  const week = buildNeutralWeek(now, "");
  const rowMap = new Map();

  rows.forEach((row) => {
    const dateKey = toDateKey(getScheduleDateValue(row));
    if (dateKey) rowMap.set(dateKey, row);
  });

  return week.map((day) => {
    const row = rowMap.get(day.dateKey);
    if (!row) return day;

    const status = cleanDashboardText(
      firstDashboardValue(
        row.status,
        row.scheduleStatus,
        row.schedule_status,
        row.gy_schedule_status,
      ),
    );
    const shift = getShiftLabel(row);
    const isOff =
      Boolean(row.isOff ?? row.is_off) ||
      /\b(off|rest day)\b/i.test(`${status} ${shift}`);

    return {
      ...day,
      id: cleanDashboardText(
        firstDashboardValue(row.id, row.schedule_id, row.gy_sched_id, day.id),
      ),
      shift: isOff ? "Rest Day" : shift,
      status: status || (day.isToday ? "Today" : "Scheduled"),
      hours: getScheduleHours(row),
      isOff,
      raw: row,
    };
  });
}

function getLeaveTypeLabelFromRow(row = {}) {
  const explicit = cleanDashboardText(
    firstDashboardValue(row.leave_type_label, row.leaveTypeLabel, row.leave_type_name),
  );
  if (explicit) return explicit;

  const type = Number(firstDashboardValue(row.gy_leave_type, row.leave_type, row.type));
  const map = {
    1: "Vacation / Personal Leave",
    2: "Sick Leave",
    3: "Maternal Leave",
    4: "Paternal Leave",
    5: "Solo Parent Leave",
    6: "Force Leave",
    7: "Indefinite Leave",
    8: "Quarantine Leave",
    9: "Emergency Leave",
  };
  return map[type] || cleanDashboardText(firstDashboardValue(row.type, "Leave Request"));
}

function normalizeLeaveStatusValue(value) {
  const raw = cleanDashboardText(value);
  const lower = raw.toLowerCase();
  if (["approved", "approve", "1"].includes(lower)) return "Approved";
  if (["rejected", "declined", "not approved", "not_approved", "2"].includes(lower)) {
    return "Rejected";
  }
  if (["pending", "for approval", "for_approval", "0", ""].includes(lower)) {
    return "Pending";
  }
  return raw;
}

function getLeaveSummaryObject(response) {
  const value = response?.data?.data ?? response?.data ?? response ?? {};
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getLeaveDateRange(row = {}) {
  const from = firstDashboardValue(
    row.gy_leave_from,
    row.leave_from,
    row.startDate,
    row.start_date,
    row.dateFrom,
    row.date_from,
  );
  const to = firstDashboardValue(
    row.gy_leave_to,
    row.leave_to,
    row.endDate,
    row.end_date,
    row.dateTo,
    row.date_to,
  );

  if (!from && !to) return "";
  if (!to || to === from) return formatDashboardDate(from);
  return `${formatDashboardDate(from)} – ${formatDashboardDate(to)}`;
}

export function getLeaveDashboardDataFromResponses({
  leavesResponse,
  summaryResponse,
  user = {},
} = {}) {
  const summary = getLeaveSummaryObject(summaryResponse);
  const balances = firstDashboardValue(
    summary.leaveBalances,
    summary.leave_balances,
    summary.balances,
    summary.summary,
    summary,
  );

  const vacation = getLeaveBalanceFromSource(balances, [
    "vacation",
    "vl",
    "vacation leave",
  ]);
  const sick = getLeaveBalanceFromSource(balances, ["sick", "sl", "sick leave"]);

  if (vacation.available === null) {
    vacation.available = normalizeNumber(
      firstDashboardValue(
        summary.vacationLeaveBalance,
        summary.vacation_leave_balance,
        summary.vlBalance,
        summary.vl_balance,
        summary.vacationAvailable,
        summary.vacation_available,
      ),
    );
  }
  if (vacation.total === null) {
    vacation.total = normalizeNumber(
      firstDashboardValue(
        summary.vacationLeaveTotal,
        summary.vacation_leave_total,
        summary.vlTotal,
        summary.vl_total,
        summary.vacationCredits,
        summary.vacation_credits,
      ),
    );
  }
  if (sick.available === null) {
    sick.available = normalizeNumber(
      firstDashboardValue(
        summary.sickLeaveBalance,
        summary.sick_leave_balance,
        summary.slBalance,
        summary.sl_balance,
        summary.sickAvailable,
        summary.sick_available,
      ),
    );
  }
  if (sick.total === null) {
    sick.total = normalizeNumber(
      firstDashboardValue(
        summary.sickLeaveTotal,
        summary.sick_leave_total,
        summary.slTotal,
        summary.sl_total,
        summary.sickCredits,
        summary.sick_credits,
      ),
    );
  }

  const leaveRows = extractDashboardRows(leavesResponse);
  const vacationRow = leaveRows.find((row) =>
    /vacation|personal|vl/i.test(getLeaveTypeLabelFromRow(row)),
  );
  const sickRow = leaveRows.find((row) =>
    /sick|sl/i.test(getLeaveTypeLabelFromRow(row)),
  );

  const fillBalanceFromRow = (balance, row) => {
    if (!row) return;
    if (balance.available === null) {
      balance.available = normalizeNumber(
        firstDashboardValue(
          row.leave_remaining,
          row.gy_leave_remaining,
          row.remaining,
          row.leave_balance,
          row.balance,
        ),
      );
    }
    if (balance.total === null) {
      balance.total = normalizeNumber(
        firstDashboardValue(
          row.leave_credit,
          row.gy_leave_credit,
          row.credits,
          row.total_credit,
          row.total,
        ),
      );
    }
  };

  fillBalanceFromRow(vacation, vacationRow);
  fillBalanceFromRow(sick, sickRow);

  const fallback = getLeaveDashboardData(user);
  if (vacation.available === null) vacation.available = fallback.vacation.available;
  if (vacation.total === null) vacation.total = fallback.vacation.total;
  if (sick.available === null) sick.available = fallback.sick.available;
  if (sick.total === null) sick.total = fallback.sick.total;

  const sibsId = getDashboardSibsId(user);
  const recent = leaveRows
    .filter((row) => rowBelongsToEmployee(row, sibsId))
    .slice(0, 5)
    .map((row, index) => ({
      id: cleanDashboardText(
        firstDashboardValue(row.id, row.gy_leave_id, row.leave_id, `leave-${index}`),
      ),
      type: getLeaveTypeLabelFromRow(row),
      dates: getLeaveDateRange(row),
      days: (() => {
        const days = normalizeNumber(
          firstDashboardValue(row.gy_leave_day, row.leave_days, row.totalDays, row.total_days),
        );
        return days === null ? "" : `${days.toFixed(days % 1 ? 2 : 0)} day${days === 1 ? "" : "s"}`;
      })(),
      status: normalizeLeaveStatusValue(
        firstDashboardValue(row.gy_leave_status, row.leave_status, row.status),
      ),
      raw: row,
    }));

  return { vacation, sick, recent };
}
