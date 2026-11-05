import api from "./api-template";

export async function getResignees({ page = 1, limit = 15, search = "", department = "All", account = "All" } = {}, signal) {
  const params = { page, limit, search };
  if (department && department !== "All") params.department = department;
  if (account && account !== "All") params.account = account;
  const response = await api.get("/api/resignees", {
    params,
    signal,
    timeout: 25000,
  });
  return response.data;
}

// Summary counts are deliberately NOT requested when changing table pages.
export async function getResigneeStats({ search = "", department = "All", account = "All", revision = 0 } = {}, signal) {
  const params = { search, revision };
  if (department && department !== "All") params.department = department;
  if (account && account !== "All") params.account = account;
  const response = await api.get("/api/resignees/stats", {
    params,
    signal,
    timeout: 35000,
  });
  return response.data;
}
