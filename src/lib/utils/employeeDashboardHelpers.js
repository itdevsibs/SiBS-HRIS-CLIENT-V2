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
    manager: firstValue(user?.manager, user?.managerName, user?.reportsTo, "HR Operations Manager"),
    managerPosition: firstValue(user?.managerPosition, "HR Operations"),
    profilePictureUrl: firstValue(user?.profilePictureUrl, user?.profile_picture_url, ""),
  };
}

export function getAttendanceSummaryFromResponses({ attendanceResponse, kronosResponse, user = {}, now = new Date() }) {
  const logs = Array.isArray(user?.attendanceLogs)
    ? user.attendanceLogs
    : Array.isArray(attendanceResponse?.data)
      ? attendanceResponse.data
      : Array.isArray(kronosResponse?.data)
        ? kronosResponse.data
        : [
            {
              id: "log-1",
              type: "Clock In",
              timestamp: "08:54 AM",
              location: "Main Office — Pasig Site",
              status: "On Time",
              device: "Biometrics / Web Portal",
            },
            {
              id: "log-2",
              type: "Lunch Break",
              timestamp: "12:00 PM",
              location: "Main Office — Cafeteria",
              status: "Logged",
              device: "Web Portal",
            },
          ];

  return {
    status: firstValue(attendanceResponse?.status, user?.todayAttendanceStatus, "Clocked In · On Time"),
    clockIn: firstValue(attendanceResponse?.clockIn, user?.todayClockIn, "08:54 AM"),
    clockOut: firstValue(attendanceResponse?.clockOut, user?.todayClockOut, "06:00 PM (Scheduled)"),
    renderedHours: firstValue(attendanceResponse?.renderedHours, user?.todayRenderedHours, "8.00 hrs"),
    logs,
  };
}

export function getWeeklyScheduleFromResponse({ scheduleResponse, user = {}, now = new Date() }) {
  const currentDayIndex = now.getDay();

  if (Array.isArray(scheduleResponse?.data) && scheduleResponse.data.length > 0) {
    return scheduleResponse.data;
  }

  return [
    { id: "mon", day: "Mon", date: "Aug 4", shift: "09:00 AM - 06:00 PM", hours: "9.0 hrs", status: "On-site", isToday: currentDayIndex === 1, isOff: false },
    { id: "tue", day: "Tue", date: "Aug 5", shift: "09:00 AM - 06:00 PM", hours: "9.0 hrs", status: "On-site", isToday: currentDayIndex === 2, isOff: false },
    { id: "wed", day: "Wed", date: "Aug 6", shift: "09:00 AM - 06:00 PM", hours: "9.0 hrs", status: "On-site", isToday: currentDayIndex === 3, isOff: false },
    { id: "thu", day: "Thu", date: "Aug 7", shift: "09:00 AM - 06:00 PM", hours: "9.0 hrs", status: "On-site", isToday: currentDayIndex === 4, isOff: false },
    { id: "fri", day: "Fri", date: "Aug 8", shift: "09:00 AM - 06:00 PM", hours: "9.0 hrs", status: "On-site", isToday: currentDayIndex === 5, isOff: false },
    { id: "sat", day: "Sat", date: "Aug 9", shift: "REST DAY", hours: "0.0 hrs", status: "Off", isToday: currentDayIndex === 6, isOff: true },
    { id: "sun", day: "Sun", date: "Aug 10", shift: "REST DAY", hours: "0.0 hrs", status: "Off", isToday: currentDayIndex === 0, isOff: true },
  ];
}

export function getLeaveDashboardDataFromResponses({ leavesResponse, summaryResponse, user = {} }) {
  const rawRecent = Array.isArray(leavesResponse?.data)
    ? leavesResponse.data
    : Array.isArray(user?.recentLeaves)
      ? user.recentLeaves
      : [
          { id: "leave-1", type: "Vacation Leave", dates: "Aug 15, 2026", days: "1.0 day", status: "Approved" },
          { id: "leave-2", type: "Sick Leave", dates: "Jul 22, 2026", days: "1.0 day", status: "Completed" },
        ];

  const recent = rawRecent.map((item, index) => {
    const type = firstValue(item.type, item.leave_type, item.leaveType, item.gy_leave_type, "Leave Request");
    const status = firstValue(item.status, item.leave_status, item.leaveStatus, item.gy_leave_status, "Pending");

    const dateFrom = firstValue(item.dates, item.date_from, item.dateFrom, item.start_date, item.gy_leave_date_from, item.leave_date);
    const dateTo = firstValue(item.date_to, item.dateTo, item.end_date, item.gy_leave_date_to);

    const formattedFrom = formatDashboardDate(dateFrom, "");
    const formattedTo = formatDashboardDate(dateTo, "");

    const dates = formattedFrom && formattedTo && formattedFrom !== formattedTo
      ? `${formattedFrom} - ${formattedTo}`
      : formattedFrom || formattedTo || cleanDashboardText(item.dates) || "Pending Review";

    const daysCount = item.days || item.leave_days || item.no_of_days || item.gy_leave_day_type || "";
    const days = daysCount ? `${daysCount} ${Number(daysCount) === 1 ? "day" : "days"}` : "";

    return {
      id: item.id || `leave-${index}`,
      type,
      dates,
      days,
      status,
    };
  });

  return {
    vacation: {
      available: Number(summaryResponse?.vacationAvailable ?? user?.vacationLeaveAvailable ?? 12.0),
      total: Number(summaryResponse?.vacationTotal ?? user?.vacationLeaveTotal ?? 15.0),
    },
    sick: {
      available: Number(summaryResponse?.sickAvailable ?? user?.sickLeaveAvailable ?? 10.0),
      total: Number(summaryResponse?.sickTotal ?? user?.sickLeaveTotal ?? 15.0),
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
