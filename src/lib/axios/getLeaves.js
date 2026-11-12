import api from "./api-template";
import { getTodayDate } from "./dateFormatter";
import { SUPER_ADMIN_LEAVES_RANGE_DAYS } from "../utils/leaves/leaveHelpers";

function getLocalCalendarDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getLeaves({
  page = 1,
  limit = 15,
  search = "",
  status = "All",
  department = "All",
  account = "All",
  dateFrom = "",
  dateTo = "",
  includeDepartments = false,
  includeAccounts = false,
  useDefaultDateRange = true,
} = {}) {
  try {
    const defaultDateTo = new Date();
    const defaultDateFrom = new Date(defaultDateTo);
    defaultDateFrom.setDate(defaultDateTo.getDate() - 6);

    const res = await api.get("/api/leaves", {
      params: {
        page,
        limit,
        search,
        status,
        department,
        account,
        dateFrom:
          dateFrom ||
          (useDefaultDateRange ? getLocalCalendarDate(defaultDateFrom) : ""),
        dateTo:
          dateTo ||
          (useDefaultDateRange ? getLocalCalendarDate(defaultDateTo) : ""),
        includeDepartments: includeDepartments ? 1 : 0,
        includeAccounts: includeAccounts ? 1 : 0,
      },
      timeout: 30000,
    });

    return res.data;
  } catch (err) {
    console.error("GET LEAVES API ERROR:", err);

    return {
      success: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch leave records.",
      data: [],
      departmentOptions: [],
      accountOptions: [],
      pagination: {
        currentPage: 1,
        limit,
        returned: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    };
  }
}

// Single-flight and short backoff across React StrictMode remounts. Scope is
// keyed by authenticated user+role to prevent another user's counts leaking.
const sidebarSummaryRequests = new Map();
const recentSummaryRequests = new Map();

export function getLeaveSummaryCacheKey(user, { requireIdentifier = false } = {}) {
  if (!user || typeof user !== "object") return "";

  const identifier = String(
    user.sibs_id ||
    user.sibsId ||
    user.employee_sibs_id ||
    user.employeeSibsId ||
    user.gy_emp_code ||
    user.gy_user_code ||
    user.userCode ||
    user.user_code ||
    user.employee_id ||
    user.employeeId ||
    user.employeeCode ||
    user.employee_code ||
    user.user_id ||
    user.userId ||
    user.id ||
    user.username ||
    user.email ||
    "",
  ).trim();

  const access = user.admin_access ?? user.adminAccess ?? "";
  const role = user.role ?? user.userRole ?? user.tokenType ?? "";

  if (!identifier && !access && !role) return "";
  if (requireIdentifier && (!identifier || (!access && !role))) return "";

  return `${identifier || "anonymous"}|${access}|${role}`;
}

export async function getLeavesSummary({
  cacheKey = "", forceRefresh = false, window: summaryWindow, signal,
} = {}) {
  const recent = summaryWindow === "recent";
  const dateTo = recent ? getTodayDate() : "";
  const identity = String(cacheKey || "");
  const key = recent
    ? identity && !identity.startsWith("anonymous|") && JSON.stringify([identity, dateTo])
    : identity;
  const cache = recent ? recentSummaryRequests : sidebarSummaryRequests;
  const now = Date.now();
  const entry = key ? cache.get(key) : null;
  if (entry?.pending) return entry.pending;
  if (entry && entry.expiresAt > now && (!forceRefresh || entry.backoff)) return entry.result;

  function remember(result, ttl, backoff = false) {
    if (key && !signal?.aborted && (!recent || dateTo === getTodayDate())) {
      cache.set(key, { result, expiresAt: Date.now() + ttl, backoff });
    }
  }

  const pending = api.get("/api/leaves/summary/sidebar", {
    timeout: 10000,
    ...(recent && {
      params: { window: "recent" },
      // Dashboard polling already serializes requests within its identity and
      // window. The Axios bridge must not join a previous window's request.
      skipInFlightDeduplication: true,
    }),
    ...(signal && { signal }),
  })
    .then((res) => {
      const result = res.data;
      if (recent) {
        if (result?.success && result.ready === true && result.stale !== true) {
          const summary = result.data?.recentPendingLeaves;
          const start = new Date(`${dateTo}T00:00:00Z`);
          start.setUTCDate(start.getUTCDate() - SUPER_ADMIN_LEAVES_RANGE_DAYS + 1);
          if (summary?.dateTo !== dateTo || summary?.dateFrom !== start.toISOString().slice(0, 10)) {
            return { success: false, ready: false, data: null };
          }
          remember(result, 30_000);
        }
      } else {
        remember(result, result?.success && result.ready === false
          ? 1_500 : result?.success ? 30_000 : 2 * 60_000);
      }
      return result;
    })
    .catch((err) => {
      // Network failures and 503 remain failures. Do not invent a count of 0.
      const result = {
        success: false,
        ready: false,
        status: err?.response?.status ?? null,
        code: err?.response?.data?.code || "LEAVE_SUMMARY_REQUEST_FAILED",
        retryAfterSeconds: err?.response?.data?.retryAfterSeconds || 120,
        message: err?.response?.data?.message || err?.message || "Failed to fetch leave summary.",
        data: null,
      };
      if (!recent) {
        remember(result, Math.max(60, Number(result.retryAfterSeconds) || 120) * 1000);
      } else if (result.status === 503) {
        const retryAfter = Number(result.retryAfterSeconds);
        remember(result, (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 120) * 1000, true);
      }
      return result;
    })
    .finally(() => {
      const current = cache.get(key);
      if (current?.pending === pending) cache.delete(key);
      // Limit the size of this short-lived client cache.
      if (cache.size > 60) {
        const time = Date.now();
        for (const [id, value] of cache) {
          if (!value.pending && value.expiresAt <= time) cache.delete(id);
        }
      }
    });
  if (key && !recent) cache.set(key, { pending });
  return pending;
}
