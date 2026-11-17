import { createSystemDateTimeFormatter } from "@/lib/axios/dateFormatter";
import api from "./api-template";

const MANILA_TIME_ZONE = "Asia/Manila";

export function getManilaDateKey(value = new Date()) {
  const target =
    value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  const parts = createSystemDateTimeFormatter("en-CA", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);
  const record = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${record.year}-${record.month}-${record.day}`;
}

export function shiftManilaDateKey(dateKey, deltaDays = 0) {
  const anchor = new Date(`${dateKey}T12:00:00.000Z`);
  anchor.setUTCDate(anchor.getUTCDate() + deltaDays);
  return anchor.toISOString().slice(0, 10);
}

export function getManilaWeekRange(value = new Date()) {
  const dateKey = getManilaDateKey(value);
  const anchor = new Date(`${dateKey}T12:00:00.000Z`);
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

function isCanceledError(error) {
  return (
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError" ||
    error?.name === "AbortError"
  );
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

function unwrapResponse(response, fallbackMessage) {
  const payload = response?.data ?? response;
  const success = payload?.success !== false;

  return {
    available: success,
    data: payload,
    error: success
      ? null
      : {
          status: response?.status || 0,
          message: payload?.message || payload?.error || fallbackMessage,
        },
  };
}

const SOURCE_CONFIG = {
  attendance: {
    fallbackError: "Attendance data is unavailable.",
    run: ({ yesterday, today, signal }) =>
      api.get("/api/attendance", {
        params: {
          page: 1,
          limit: 10,
          search: "",
          dateFrom: yesterday,
          dateTo: today,
          department: "All",
          account: "All",
          includeDepartments: 0,
          includeAccounts: 0,
          fast: 1,
        },
        withCredentials: true,
        timeout: 30000,
        signal,
      }),
  },
  schedule: {
    fallbackError: "Schedule data is unavailable.",
    run: ({ week, signal }) =>
      api.get("/api/employee-schedule", {
        params: {
          page: 1,
          limit: 50,
          search: "",
          dateFrom: week.dateFrom,
          dateTo: week.dateTo,
        },
        withCredentials: true,
        signal,
      }),
  },
  leaves: {
    fallbackError: "Leave records are unavailable.",
    run: ({ signal }) =>
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
          includeDepartments: 0,
          includeAccounts: 0,
        },
        withCredentials: true,
        timeout: 30000,
        signal,
      }),
  },
  leaveBalance: {
    fallbackError: "Kronos leave credits are unavailable.",
    run: ({ signal }) =>
      api.get("/api/leaves/my-balance", {
        withCredentials: true,
        timeout: 30000,
        signal,
      }),
  },
  holidays: {
    fallbackError: "Holiday calendar data is unavailable.",
    run: ({ signal }) =>
      api.get("/api/recruitment-settings/holidays", {
        params: {
          includeInactive: "0",
        },
        withCredentials: true,
        signal,
      }),
  },
  employee: {
    fallbackError: "Employee profile data is unavailable.",
    run: ({ employeeId, signal }) =>
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
  },
  profilePicture: {
    fallbackError: "Employee profile photo could not be loaded.",
    run: ({ signal }) =>
      api.get("/api/employee-profile", {
        withCredentials: true,
        signal,
      }),
  },
};

export const EMPLOYEE_DASHBOARD_SOURCE_KEYS = Object.freeze(
  Object.keys(SOURCE_CONFIG),
);

export async function fetchEmployeeDashboardSource(
  key,
  { sibsId = "", now = new Date(), signal } = {},
) {
  const config = SOURCE_CONFIG[key];
  if (!config) {
    throw new Error(`Unknown employee dashboard source: ${key}`);
  }

  const employeeId = String(sibsId || "").trim();
  const today = getManilaDateKey(now);
  const yesterday = shiftManilaDateKey(today, -1);
  const week = getManilaWeekRange(now);

  try {
    const response = await config.run({
      employeeId,
      today,
      yesterday,
      week,
      signal,
    });
    return unwrapResponse(response, config.fallbackError);
  } catch (error) {
    if (isCanceledError(error) || signal?.aborted) {
      return { aborted: true, available: false, data: null, error: null };
    }
    return {
      available: false,
      data: null,
      error: normalizeFailure(error, config.fallbackError),
    };
  }
}

export async function getEmployeeDashboardSources({
  sibsId = "",
  now = new Date(),
  signal,
  onSourceSettled,
} = {}) {
  const employeeId = String(sibsId || "").trim();
  const today = getManilaDateKey(now);
  const week = getManilaWeekRange(now);

  const entries = await Promise.all(
    EMPLOYEE_DASHBOARD_SOURCE_KEYS.map(async (key) => {
      const outcome = await fetchEmployeeDashboardSource(key, {
        sibsId: employeeId,
        now,
        signal,
      });

      if (!outcome.aborted && !signal?.aborted && typeof onSourceSettled === "function") {
        onSourceSettled(key, outcome);
      }

      return [key, outcome];
    }),
  );

  const sourceResults = Object.fromEntries(entries);

  return {
    success: Object.values(sourceResults).some((source) => source.available),
    generatedAt: new Date().toISOString(),
    range: {
      today,
      weekStart: week.dateFrom,
      weekEnd: week.dateTo,
    },
    data: Object.fromEntries(
      entries.map(([key, source]) => [key, source.data]),
    ),
    availability: Object.fromEntries(
      entries.map(([key, source]) => [key, source.available]),
    ),
    errors: Object.fromEntries(
      entries
        .filter(([, source]) => source.error)
        .map(([key, source]) => [key, source.error]),
    ),
  };
}
