import api from "./api-template";

export async function getAttendance(page = 1, search = "", account = "All") {
  try {
    const res = await api.get("/api/attendance", {
      params: {
        page,
        search,
        account,
      },
    });

    return res.data;
  } catch (err) {
    console.error("GET ATTENDANCE API ERROR:", err);
    throw err;
  }
}