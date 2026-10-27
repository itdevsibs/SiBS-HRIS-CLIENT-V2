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

export async function getLeavesSummary() {
  try {
    const res = await api.get("/api/leaves/summary/sidebar", { timeout: 10000 });
    return res.data;
  } catch (err) {
    // A temporary Kronos outage should not flood every page console;
    // the existing sidebar effect retains the last verified notification.

    return {
      success: false,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch leave summary.",
      data: null,
    };
  }
}
