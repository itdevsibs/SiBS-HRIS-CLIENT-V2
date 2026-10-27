import api from "./api-template";

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
        dateFrom: dateFrom || getLocalCalendarDate(defaultDateFrom),
        dateTo: dateTo || getLocalCalendarDate(defaultDateTo),
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

export async function getLeavesSummary({ cacheKey = "" } = {}) {
  const key = String(cacheKey || "");
  const now = Date.now();
  const entry = key ? sidebarSummaryRequests.get(key) : null;
  if (entry?.pending) return entry.pending;
  if (entry && entry.expiresAt > now) return entry.result;

  const pending = api.get("/api/leaves/summary/sidebar", { timeout: 10000 })
    .then((res) => {
      const result = res.data;
      if (key) {
        const ttl = result?.success && result?.ready === false
          ? 10_000 : result?.success ? 30_000 : 2 * 60_000;
        sidebarSummaryRequests.set(key, { result, expiresAt: Date.now() + ttl });
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
      if (key) {
        sidebarSummaryRequests.set(key, {
          result,
          expiresAt: Date.now() + Math.max(60, Number(result.retryAfterSeconds) || 120) * 1000,
        });
      }
      return result;
    })
    .finally(() => {
      const current = sidebarSummaryRequests.get(key);
      if (current?.pending === pending) sidebarSummaryRequests.delete(key);
      // Limit the size of this short-lived client cache.
      if (sidebarSummaryRequests.size > 60) {
        const time = Date.now();
        for (const [id, value] of sidebarSummaryRequests) {
          if (!value.pending && value.expiresAt <= time) sidebarSummaryRequests.delete(id);
        }
      }
    });
  if (key) sidebarSummaryRequests.set(key, { pending });
  return pending;
}
