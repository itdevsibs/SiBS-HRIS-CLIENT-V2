import api from "./api-template";

function getLocalCalendarDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getAttendance(
  page = 1,
  search = "",
  account = "All",
  options = {},
) {
  try {
    const defaultDate = getLocalCalendarDate();

    const res = await api.get("/api/attendance", {
      params: {
        page,
        search,
        dateFrom: options?.dateFrom || defaultDate,
        dateTo: options?.dateTo || defaultDate,
        department: options?.department || "All",
        account: account || "All",
        includeDepartments: options?.includeDepartments ? 1 : 0,
        includeAccounts: options?.includeAccounts ? 1 : 0,
        fast: options?.fast ? 1 : 0,
      },
      withCredentials: true,
      timeout: 30000,
    });

    return res.data;
  } catch (err) {
    console.error("GET ATTENDANCE API ERROR:", err);

    return {
      success: false,
      status: err?.response?.status,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch attendance records.",
      error: err,
    };
  }
}
// Exact count is requested AFTER the fast page response. The UI stays usable
// while this potentially expensive query runs in the background.
export async function getAttendanceCount(search = "", account = "All", options = {}) {
  try {
    const res = await api.get("/api/attendance", {
      params: {
        countOnly: 1,
        search,
        account,
        dateFrom: options?.dateFrom || "",
        dateTo: options?.dateTo || "",
        department: options?.department || "All",
      },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("GET ATTENDANCE COUNT API ERROR:", err);
    return { success: false, message: err?.response?.data?.message || err?.message };
  }
}

// Filter dropdown metadata is intentionally independent of the table rows.
export async function getAttendanceOptions(options = {}) {
  try {
    const res = await api.get("/api/attendance", {
      params: {
        optionsOnly: 1,
        department: options?.department || "All",
        includeDepartments: options?.includeDepartments ? 1 : 0,
        includeAccounts: options?.includeAccounts ? 1 : 0,
      },
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("GET ATTENDANCE OPTIONS API ERROR:", err);
    return { success: false, message: err?.response?.data?.message || err?.message };
  }
}
