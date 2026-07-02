import api from "./api-template";

export async function getKronosAttendance(
  page = 1,
  search = "",
  account = "All",
  options = {},
) {
  try {
    const res = await api.get("/api/kronos-attendance", {
      params: {
        page,
        search,
        dateFrom: options?.dateFrom || "",
        dateTo: options?.dateTo || "",
        department: options?.department || "All",
        account: account || "All",
        includeDepartments: options?.includeDepartments ? 1 : 0,
        includeAccounts: options?.includeAccounts ? 1 : 0,
        limit: options?.limit || 15,

        _fresh: 1,
        _ts: Date.now(),
      },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error(
      "GET KRONOS ATTENDANCE API ERROR:",
      err?.response?.status,
      err?.response?.data || err?.message,
    );

    return {
      success: false,
      status: err?.response?.status,
      data: [],
      departmentOptions: [],
      accountOptions: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit: options?.limit || 15,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch Kronos attendance records.",
      error: err,
    };
  }
}