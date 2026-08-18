const MANILA_TIME_ZONE = "Asia/Manila";

export function cleanDashboardText(value) {
  return String(value ?? "").trim();
}

function firstValue(...values) {
  return values.find((value) => cleanDashboardText(value)) || "";
}

export function formatDashboardDate(value, fallback = "—") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value).trim() || fallback;

  return date.toLocaleDateString("en-US", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPhtTime(date = new Date()) {
  const targetDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();

  return new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(targetDate);
}

export function formatPhtDate(date = new Date()) {
  const targetDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();

  return new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(targetDate);
}

export function getProgressPercent(value, max) {
  const numValue = Number(value || 0);
  const numMax = Number(max || 0);

  if (numMax <= 0) return 0;

  return Math.min(Math.max(Math.round((numValue / numMax) * 100), 0), 100);
}

export function getEmployeeDashboardProfile(user = {}) {
  const firstName = firstValue(user?.firstName, user?.first_name, user?.gy_emp_fname, "Employee");
  const lastName = firstValue(user?.lastName, user?.last_name, user?.gy_emp_lname, "");
  const middleName = firstValue(user?.middleName, user?.middle_name, user?.gy_emp_mname, "");

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
  const sibsId = firstValue(user?.sibsId, user?.sibs_id, user?.employeeSibsId, user?.gy_emp_code, user?.username, "");

  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "EP";

  const position =
    firstValue(
      user?.position,
      user?.positionTitle,
      user?.position_title,
      user?.designation,
      user?.gy_emp_designation,
      user?.jobTitle,
      user?.job_title,
      user?.roleTitle,
      user?.role_title,
    ) ||
    (cleanDashboardText(user?.role).toLowerCase().includes("admin") ||
    cleanDashboardText(user?.role).toLowerCase().includes("hr")
      ? "HR Admin"
      : "Employee");

  const department =
    firstValue(
      user?.department,
      user?.departmentName,
      user?.department_name,
      user?.account,
      user?.accountName,
      user?.account_name,
      user?.gy_acc_name,
    ) || "Management Team";

  return {
    firstName,
    lastName,
    fullName,
    sibsId,
    initials,
    position,
    department,
    account: firstValue(user?.account, user?.accountName, user?.account_name, "General Account"),
    location: firstValue(user?.location, user?.site, user?.gy_assignedloc, "Davao"),
    workSetup: firstValue(user?.workSetup, user?.work_setup, "On-site"),
    status: firstValue(user?.status, user?.employmentStatus, "Regular"),
    manager: firstValue(
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
      "—",
    ),
    managerPosition: firstValue(
      user?.supervisorPosition,
      user?.supervisor_position,
      user?.managerPosition,
      user?.manager_position,
      user?.supervisorDepartment,
      user?.supervisor_department,
      department,
      "—",
    ),
    profilePictureUrl: firstValue(user?.profilePictureUrl, user?.profile_picture_url, ""),
  };
}

export function formatAttendanceTime(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (
    !raw ||
    raw.startsWith("0000-00-00") ||
    raw === "00:00:00" ||
    raw === "—" ||
    raw === "-"
  ) {
    return "";
  }

  const amPmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (amPmMatch) {
    const hour = amPmMatch[1].padStart(2, "0");
    const minute = amPmMatch[2];
    const meridiem = amPmMatch[3].toUpperCase();
    return `${hour}:${minute} ${meridiem}`;
  }

  const time24Match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (time24Match) {
    let hour = Number(time24Match[1]);
    const minute = time24Match[2];
    const meridiem = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${minute} ${meridiem}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}

export function getAttendanceSummaryFromResponses({
  attendanceResponse,
  kronosResponse,
  scheduleResponse,
  user = {},
  now = new Date(),
}) {
  const rawRecords = [
    ...(Array.isArray(attendanceResponse?.data)
      ? attendanceResponse.data
      : Array.isArray(attendanceResponse?.records)
        ? attendanceResponse.records
        : Array.isArray(attendanceResponse?.data?.records)
          ? attendanceResponse.data.records
          : Array.isArray(attendanceResponse)
            ? attendanceResponse
            : []),
    ...(Array.isArray(kronosResponse?.data)
      ? kronosResponse.data
      : Array.isArray(kronosResponse?.records)
        ? kronosResponse.records
        : Array.isArray(kronosResponse?.data?.records)
          ? kronosResponse.data.records
          : Array.isArray(kronosResponse)
            ? kronosResponse
            : []),
  ];

  const rawSchedRecords = [
    ...(Array.isArray(scheduleResponse?.data)
      ? scheduleResponse.data
      : Array.isArray(scheduleResponse?.data?.records)
        ? scheduleResponse.data.records
        : Array.isArray(scheduleResponse?.records)
          ? scheduleResponse.records
          : Array.isArray(scheduleResponse)
            ? scheduleResponse
            : []),
  ];

  const schedRegular =
    rawSchedRecords.find((item) => {
      const mode = normalizeScheduleMode(item?.gy_sched_mode || item?.mode);
      return (
        mode.toLowerCase() === "regular" &&
        (item?.gy_sched_logout || item?.logout || item?.gy_sched_end)
      );
    }) ||
    rawSchedRecords.find(
      (item) => item?.gy_sched_logout || item?.logout || item?.gy_sched_end,
    ) ||
    null;

  const scheduledLogout = schedRegular
    ? formatAttendanceTime(
        schedRegular.gy_sched_logout ||
          schedRegular.logout ||
          schedRegular.gy_sched_end,
      )
    : "";

  const trackerLogs = Array.isArray(attendanceResponse?.logs)
    ? attendanceResponse.logs
    : Array.isArray(kronosResponse?.logs)
      ? kronosResponse.logs
      : null;

  if (trackerLogs && trackerLogs.length > 0) {
    const logs = trackerLogs.map((log, index) => ({
      id: log.id || `log-${index}`,
      type: log.type || log.event || "Activity",
      timestamp: formatAttendanceTime(log.timestamp || log.time) || "—",
      location: firstValue(log.location, user?.location, "Davao"),
      status: firstValue(log.status, "Recorded"),
      device: firstValue(log.device, "Biometrics / Web Portal"),
    }));

    const loginLog = logs.find((l) => /in|login/i.test(l.type)) || logs[0];
    const logoutLog = logs.find((l) => /out|logout/i.test(l.type));
    return {
      status:
        user?.todayAttendanceStatus ||
        (logoutLog ? "Shift Completed" : "Clocked In · On Time"),
      clockIn: loginLog?.timestamp || "—",
      clockOut:
        logoutLog?.timestamp ||
        (scheduledLogout ? `${scheduledLogout} (Scheduled)` : "—"),
      renderedHours: user?.todayRenderedHours || (logoutLog ? "8.00 hrs" : "—"),
      logs,
    };
  }

  const record =
    rawRecords.find(
      (item) => item && (item.gy_tracker_login || item.login || item.gy_tracker_date),
    ) ||
    rawRecords[0] ||
    null;

  if (record) {
    const rawLogin = firstValue(
      record.gy_tracker_login,
      record.login,
      record.time_in,
      record.clock_in,
    );
    const rawBreakout = firstValue(
      record.gy_tracker_breakout,
      record.breakout,
      record.start_break,
    );
    const rawBreakin = firstValue(
      record.gy_tracker_breakin,
      record.breakin,
      record.end_break,
    );
    const rawLogout = firstValue(
      record.gy_tracker_logout,
      record.logout,
      record.time_out,
      record.clock_out,
    );

    const clockIn = formatAttendanceTime(rawLogin);
    const breakout = formatAttendanceTime(rawBreakout);
    const breakin = formatAttendanceTime(rawBreakin);
    const clockOut = formatAttendanceTime(rawLogout);

    const location = firstValue(
      record.gy_assignedloc,
      record.location,
      record.site,
      user?.location,
      "Davao",
    );
    const device = "Biometrics / Web Portal";

    const logs = [];
    if (clockIn) {
      logs.push({
        id: `punch-in-${record.gy_tracker_id || "1"}`,
        type: "Clock In",
        timestamp: clockIn,
        location,
        status: firstValue(record.gy_tracker_status, "On-Time"),
        device,
      });
    }
    if (breakout) {
      logs.push({
        id: `punch-bo-${record.gy_tracker_id || "2"}`,
        type: "Start Break",
        timestamp: breakout,
        location,
        status: "Logged",
        device: "Web Portal",
      });
    }
    if (breakin) {
      logs.push({
        id: `punch-bi-${record.gy_tracker_id || "3"}`,
        type: "End Break",
        timestamp: breakin,
        location,
        status: "Logged",
        device: "Web Portal",
      });
    }
    if (clockOut) {
      logs.push({
        id: `punch-out-${record.gy_tracker_id || "4"}`,
        type: "Clock Out",
        timestamp: clockOut,
        location,
        status: "Recorded",
        device,
      });
    }

    let status = "Not Clocked In";
    if (clockOut) {
      status = "Shift Completed";
    } else if (breakout && !breakin) {
      status = "On Break";
    } else if (clockIn) {
      status = firstValue(record.gy_tracker_status, "Clocked In · On Time");
    }

    let renderedHours = "0.00 hrs";
    if (record.gy_tracker_wh && Number(record.gy_tracker_wh) > 0) {
      renderedHours = `${Number(record.gy_tracker_wh).toFixed(2)} hrs`;
    } else if (rawLogin) {
      const loginDate = new Date(
        rawLogin.includes("T") || rawLogin.includes("-")
          ? rawLogin
          : `${new Date().toISOString().slice(0, 10)}T${rawLogin}`,
      );
      if (!Number.isNaN(loginDate.getTime())) {
        const isSameDay =
          loginDate.toISOString().slice(0, 10) ===
          now.toISOString().slice(0, 10);
        const endDate = rawLogout
          ? new Date(
              rawLogout.includes("T") || rawLogout.includes("-")
                ? rawLogout
                : `${new Date().toISOString().slice(0, 10)}T${rawLogout}`,
            )
          : isSameDay
            ? now
            : new Date(loginDate.getTime() + 8 * 60 * 60 * 1000);
        const diffHours = Math.min(
          Math.max(
            0,
            (endDate.getTime() - loginDate.getTime()) / (1000 * 60 * 60),
          ),
          12,
        );
        renderedHours = `${diffHours.toFixed(2)} hrs`;
      }
    }

    return {
      status,
      clockIn: clockIn || "—",
      clockOut:
        clockOut ||
        (clockIn
          ? scheduledLogout
            ? `${scheduledLogout} (Scheduled)`
            : "Pending"
          : "—"),
      renderedHours,
      logs,
    };
  }

  return {
    status: firstValue(
      attendanceResponse?.status,
      user?.todayAttendanceStatus,
      "Not Clocked In",
    ),
    clockIn: firstValue(attendanceResponse?.clockIn, user?.todayClockIn, "—"),
    clockOut: firstValue(attendanceResponse?.clockOut, user?.todayClockOut, "—"),
    renderedHours: firstValue(
      attendanceResponse?.renderedHours,
      user?.todayRenderedHours,
      "0.00 hrs",
    ),
    logs: [],
  };
}

export function normalizeScheduleMode(mode) {
  const value = String(mode ?? "").trim();
  if (value === "0") return "Day Off";
  if (value === "1") return "Regular";
  if (value === "2") return "Rest Day";
  if (value === "3") return "Holiday";
  return value || "—";
}

export function getWeeklyScheduleFromResponse({
  scheduleResponse,
  user = {},
  now = new Date(),
}) {
  const targetDate =
    now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();

  // Get current Manila date key YYYY-MM-DD
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(targetDate);
  const dateMap = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const todayKey = `${dateMap.year}-${dateMap.month}-${dateMap.day}`;

  const anchor = new Date(`${todayKey}T00:00:00.000Z`);
  const dayIndex = anchor.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const offsetToMonday = dayIndex === 0 ? 6 : dayIndex - 1;

  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - offsetToMonday);

  const rawRecords = [
    ...(Array.isArray(scheduleResponse?.data)
      ? scheduleResponse.data
      : Array.isArray(scheduleResponse?.data?.records)
        ? scheduleResponse.data.records
        : Array.isArray(scheduleResponse?.records)
          ? scheduleResponse.records
          : Array.isArray(scheduleResponse)
            ? scheduleResponse
            : []),
  ];

  // Extract employee's actual regular schedule timings from backend records (e.g. 11:00 AM - 08:00 PM, mode "1")
  const regularRecord =
    rawRecords.find((item) => {
      const mode = normalizeScheduleMode(item?.gy_sched_mode || item?.mode);
      return (
        mode.toLowerCase() === "regular" &&
        (item?.gy_sched_login || item?.login || item?.gy_sched_start)
      );
    }) ||
    rawRecords.find(
      (item) =>
        item?.gy_sched_login || item?.login || item?.gy_sched_start,
    ) ||
    null;

  const defaultLogin = regularRecord
    ? formatAttendanceTime(
        regularRecord.gy_sched_login ||
          regularRecord.login ||
          regularRecord.gy_sched_start,
      )
    : "09:00 AM";
  const defaultLogout = regularRecord
    ? formatAttendanceTime(
        regularRecord.gy_sched_logout ||
          regularRecord.logout ||
          regularRecord.gy_sched_end,
      )
    : "06:00 PM";
  const defaultShift =
    defaultLogin && defaultLogout
      ? `${defaultLogin} - ${defaultLogout}`
      : "09:00 AM - 06:00 PM";

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return DAYS.map((dayName, index) => {
    const currentDay = new Date(monday);
    currentDay.setUTCDate(monday.getUTCDate() + index);

    const yearStr = currentDay.getUTCFullYear();
    const monthStr = String(currentDay.getUTCMonth() + 1).padStart(2, "0");
    const dayStr = String(currentDay.getUTCDate()).padStart(2, "0");
    const dateKey = `${yearStr}-${monthStr}-${dayStr}`;

    const isToday = dateKey === todayKey;
    const isWeekend = index === 5 || index === 6;

    const shortMonth = currentDay.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
    });
    const dateLabel = `${shortMonth} ${currentDay.getUTCDate()}`;

    // Find any backend record matching this date
    const record = rawRecords.find((item) => {
      const itemDateRaw = cleanDashboardText(
        item?.gy_sched_day || item?.date || item?.schedule_date,
      );
      if (!itemDateRaw) return false;
      const formattedItemDate = !Number.isNaN(new Date(itemDateRaw).getTime())
        ? new Date(itemDateRaw).toISOString().slice(0, 10)
        : "";
      return (
        itemDateRaw.slice(0, 10) === dateKey ||
        formattedItemDate === dateKey
      );
    });

    if (record) {
      const mode = normalizeScheduleMode(record.gy_sched_mode || record.mode);
      const isOff =
        isWeekend ||
        mode.toLowerCase().includes("off") ||
        mode.toLowerCase().includes("rest");

      const rawLogin = firstValue(
        record.gy_sched_login,
        record.login,
        record.time_in,
        record.gy_sched_start,
      );
      const rawLogout = firstValue(
        record.gy_sched_logout,
        record.logout,
        record.time_out,
        record.gy_sched_end,
      );

      const login = formatAttendanceTime(rawLogin);
      const logout = formatAttendanceTime(rawLogout);

      const shift = isOff
        ? "REST DAY"
        : login && logout
          ? `${login} - ${logout}`
          : defaultShift;

      return {
        id: `sched-${dateKey}`,
        day: dayName,
        date: dateLabel,
        shift,
        hours: isOff ? "0.0 hrs" : "9.0 hrs",
        status: mode || (isOff ? "Off" : user?.workSetup || "On-site"),
        isToday,
        isOff,
      };
    }

    // Default weekday / weekend schedule using employee's actual shift hours
    return {
      id: `sched-${dateKey}`,
      day: dayName,
      date: dateLabel,
      shift: isWeekend ? "REST DAY" : defaultShift,
      hours: isWeekend ? "0.0 hrs" : "9.0 hrs",
      status: isWeekend ? "Off" : user?.workSetup || "On-site",
      isToday,
      isOff: isWeekend,
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
  const value = String(status || "").trim();
  if (!value) return "Pending";
  const lower = value.toLowerCase();
  if (["approved", "approve", "1"].includes(lower)) return "Approved";
  if (["rejected", "declined", "not approved", "not_approved", "2"].includes(lower)) {
    return "Rejected";
  }
  if (["pending", "for approval", "for_approval", "0"].includes(lower)) {
    return "Pending";
  }
  return value;
}

export function getLeaveDashboardDataFromResponses({ leavesResponse, summaryResponse, user = {} }) {
  const rawRecent = Array.isArray(leavesResponse?.data)
    ? leavesResponse.data
    : Array.isArray(leavesResponse?.records)
      ? leavesResponse.records
      : Array.isArray(user?.recentLeaves)
        ? user.recentLeaves
        : [];

  const recent = rawRecent.map((item, index) => {
    const rawType = firstValue(item.gy_leave_type, item.type, item.leave_type, item.leaveType);
    const type = normalizeLeaveType(rawType);
    const rawStatus = firstValue(item.gy_leave_status, item.status, item.leave_status, item.leaveStatus);
    const status = normalizeLeaveStatus(rawStatus);

    const dateFrom = firstValue(item.gy_leave_date_from, item.dates, item.date_from, item.dateFrom, item.start_date, item.leave_date);
    const dateTo = firstValue(item.gy_leave_date_to, item.date_to, item.dateTo, item.end_date);

    const formattedFrom = formatDashboardDate(dateFrom, "");
    const formattedTo = formatDashboardDate(dateTo, "");

    const dates = formattedFrom && formattedTo && formattedFrom !== formattedTo
      ? `${formattedFrom} - ${formattedTo}`
      : formattedFrom || formattedTo || cleanDashboardText(item.dates) || "Pending Review";

    const daysCount = item.gy_leave_day_type || item.days || item.leave_days || item.no_of_days || "";
    const days = daysCount ? `${daysCount} ${Number(daysCount) === 1 ? "day" : "days"}` : "";

    return {
      id: item.gy_leave_id || item.id || `leave-${index}`,
      type,
      dates,
      days,
      status,
    };
  });

  const summary = summaryResponse?.data || summaryResponse || {};

  return {
    vacation: {
      available: Number(summary?.vacationAvailable ?? summary?.vacation_available ?? user?.vacationLeaveAvailable ?? 0),
      total: Number(summary?.vacationTotal ?? summary?.vacation_total ?? user?.vacationLeaveTotal ?? 0),
    },
    sick: {
      available: Number(summary?.sickAvailable ?? summary?.sick_available ?? user?.sickLeaveAvailable ?? 0),
      total: Number(summary?.sickTotal ?? summary?.sick_total ?? user?.sickLeaveTotal ?? 0),
    },
    recent,
  };
}

export function getDashboardAnnouncements(user = {}) {
  return Array.isArray(user?.announcements) && user.announcements.length
    ? user.announcements
    : [
        {
          id: "anc-1",
          category: "Company Announcement",
          title: "Mid-Year Town Hall & Employee Appreciation Day",
          summary: "Join us this Friday at 3:00 PM PHT for our virtual All-Hands meeting and employee awards presentation.",
          date: new Date().toISOString(),
          author: "HR Operations",
        },
        {
          id: "anc-2",
          category: "HR Policy Update",
          title: "Updated HMO & Medical Benefit Guidelines",
          summary: "Please review the updated dependent coverage and claim reimbursement procedures on the employee portal.",
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          author: "Benefits Team",
        },
      ];
}

export function getDashboardHolidays(user = {}) {
  return Array.isArray(user?.holidays) && user.holidays.length
    ? user.holidays
    : [
        {
          id: "hol-1",
          name: "Ninoy Aquino Day",
          type: "Special Non-Working Holiday",
          date: "2026-08-21",
          upcoming: true,
        },
        {
          id: "hol-2",
          name: "National Heroes Day",
          type: "Regular Holiday",
          date: "2026-08-31",
          upcoming: true,
        },
      ];
}
