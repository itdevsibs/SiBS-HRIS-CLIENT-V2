import api from "./api-template";

export async function getAttendance(
  page = 1,
  search = "",
  account = "All",
  options = {},
) {
  try {
    const res = await api.get("/api/attendance", {
      params: {
        page,
        search,
        account: account || "All",
        includeAccounts: options?.includeAccounts ? 1 : 0,
      },
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