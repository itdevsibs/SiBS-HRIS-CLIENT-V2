import api from "./api-template";

export async function getLeaves({
  page = 1,
  limit = 15,
  search = "",
  status = "All",
  account = "All",
  dateFrom = "",
  dateTo = "",
} = {}) {
  try {
    const res = await api.get("/api/leaves", {
      params: {
        page,
        limit,
        search,
        status,
        account,
        dateFrom,
        dateTo,
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