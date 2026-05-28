import api from "./api-template";

export async function getLeaves({
  page = 1,
  search = "",
  status = "All",
} = {}) {
  try {
    const res = await api.get("/api/leaves", {
      params: {
        page,
        search,
        status,
      },
    });

    return res.data;
  } catch (err) {
    console.error("GET LEAVES API ERROR:", err);
    throw err;
  }
}

export async function getMyLeaveBalance() {
  try {
    const res = await api.get("/api/leaves/my-balance");
    return res.data;
  } catch (err) {
    console.error("GET MY LEAVE BALANCE API ERROR:", err);
    throw err;
  }
}