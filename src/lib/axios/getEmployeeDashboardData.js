import api from "./api-template";

const MANILA_TIME_ZONE = "Asia/Manila";

function getManilaDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const record = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${record.year}-${record.month}-${record.day}`;
}

function getManilaWeekRange(value = new Date()) {
  const dateKey = getManilaDateKey(value);
  const anchor = new Date(`${dateKey}T00:00:00.000Z`);
  const dayIndex = anchor.getUTCDay();
  const offsetToMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - offsetToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    dateFrom: monday.toISOString().slice(0, 10),
    dateTo: sunday.toISOString().slice(0, 10),
  };
}

function normalizeFailure(error, fallbackMessage) {
  return {
    status: error?.response?.status || 0,
    message:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage,
  };
}

function unwrapSettled(result, fallbackMessage) {
  if (result.status === "fulfilled") {
    const payload = result.value?.data ?? result.value;
    const success = payload?.success !== false;

    return {
      available: success,
      data: payload,
      error: success
        ? null
        : {
            status: result.value?.status || 0,
            message: payload?.message || payload?.error || fallbackMessage,
          },
    };
  }

  return {
    available: false,
    data: null,
    error: normalizeFailure(result.reason, fallbackMessage),
  };
}

export async function getEmployeeDashboardSources({
  sibsId = "",
  now = new Date(),
  signal,
} = {}) {
  const employeeId = String(sibsId || "").trim();
  const today = getManilaDateKey(now);
  const week = getManilaWeekRange(now);
  const commonEmployeeSearch = employeeId;

  const requests = [
    api.get("/api/attendance", {
      params: {
        page: 1,
        limit: 10,
        search: commonEmployeeSearch,
        dateFrom: "",
        dateTo: "",
        department: "All",
        account: "All",
        includeDepartments: 0,
        includeAccounts: 0,
      },
      withCredentials: true,
      signal,
    }),
    api.get("/api/kronos-attendance", {
      params: {
        page: 1,
        limit: 10,
        search: commonEmployeeSearch,
        dateFrom: "",
        dateTo: "",
        department: "All",
        account: "All",
        includeDepartments: 0,
        includeAccounts: 0,
        _fresh: 1,
        _ts: Date.now(),
      },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      withCredentials: true,
      signal,
    }),
    api.get("/api/employee-schedule", {
      params: {
        page: 1,
        limit: 50,
        search: "",
        dateFrom: "",
        dateTo: "",
      },
      withCredentials: true,
      signal,
    }),
    api.get("/api/leaves", {
      params: {
        page: 1,
        limit: 10,
        search: "",
        status: "All",
        department: "All",
        account: "All",
        dateFrom: "",
        dateTo: "",
      },
      withCredentials: true,
      signal,
    }),
    api.get("/api/leaves/summary", {
      withCredentials: true,
      signal,
    }),
    employeeId
      ? api.get(`/api/employees/${encodeURIComponent(employeeId)}`, {
          withCredentials: true,
          signal,
        })
      : Promise.resolve({
          data: {
            success: false,
            message: "The logged-in account has no employee SIBS ID.",
          },
        }),
  ];

  const [attendance, kronosAttendance, schedule, leaves, leaveSummary, employee] =
    await Promise.allSettled(requests);

  const sourceResults = {
    attendance: unwrapSettled(attendance, "Attendance data is unavailable."),
    kronosAttendance: unwrapSettled(
      kronosAttendance,
      "Kronos attendance data is unavailable.",
    ),
    schedule: unwrapSettled(schedule, "Schedule data is unavailable."),
    leaves: unwrapSettled(leaves, "Leave records are unavailable."),
    leaveSummary: unwrapSettled(
      leaveSummary,
      "Leave balances are unavailable.",
    ),
    employee: unwrapSettled(employee, "Employee profile data is unavailable."),
  };

  return {
    success: Object.values(sourceResults).some((source) => source.available),
    generatedAt: new Date().toISOString(),
    range: {
      today,
      weekStart: week.dateFrom,
      weekEnd: week.dateTo,
    },
    data: Object.fromEntries(
      Object.entries(sourceResults).map(([key, source]) => [key, source.data]),
    ),
    availability: Object.fromEntries(
      Object.entries(sourceResults).map(([key, source]) => [key, source.available]),
    ),
    errors: Object.fromEntries(
      Object.entries(sourceResults)
        .filter(([, source]) => source.error)
        .map(([key, source]) => [key, source.error]),
    ),
  };
}
