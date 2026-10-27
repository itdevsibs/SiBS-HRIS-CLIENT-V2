import api from "./api-template";

function getLocalCalendarDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getSchedule(page = 1, search = "", options = {}) {
  try {
    const defaultDateTo = new Date();
    const defaultDateFrom = new Date(defaultDateTo);
    defaultDateFrom.setDate(defaultDateTo.getDate() - 6);

    const res = await api.get("/api/employee-schedule", {
      params: {
        page,
        search: search || "",
        dateFrom:
          options?.dateFrom || getLocalCalendarDate(defaultDateFrom),
        dateTo: options?.dateTo || getLocalCalendarDate(defaultDateTo),
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
