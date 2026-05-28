import api from "./api-template";

export async function getLeaves({
  page = 1,
  limit = 15,
  search = "",
  status = "All",
  account = "All",
} = {}) {
  try {
    const res = await api.get("/api/leaves", {
      params: {
        page,
        limit,
        search,
        status,
        account,
      },
    });

    return res.data;
  } catch (err) {
    console.error("GET LEAVES API ERROR:", err);
    throw err;
  }
}

export async function getLeavesSummary() {
  try {
    const res = await api.get("/api/leaves/summary");
    return res.data;
  } catch (err) {
    console.error("GET LEAVES SUMMARY API ERROR:", err);
    throw err;
  }
}