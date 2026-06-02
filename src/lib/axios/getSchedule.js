import api from "./api-template";

export async function getSchedule(page = 1, search = "", options = {}) {
  try {
    const res = await api.get("/api/employee-schedule", {
      params: {
        page,
        search: search || "",
        dateFrom: options?.dateFrom || "",
        dateTo: options?.dateTo || "",
      },
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getSchedule API Error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred while fetching schedule records.",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 15,
      },
    };
  }
}