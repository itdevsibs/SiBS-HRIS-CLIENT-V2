import api from "./api-template";

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
    const res = await api.get("/api/leaves", {
      params: {
        page,
        limit,
        search,
        status,
        department,
        account,
        dateFrom,
        dateTo,
        includeDepartments: includeDepartments ? 1 : 0,
        includeAccounts: includeAccounts ? 1 : 0,
      },
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
    const res = await api.get("/api/leaves/summary");
    return res.data;
  } catch (err) {
    console.error("GET LEAVES SUMMARY API ERROR:", err);

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
