import api from "./api-template";

export async function getResignees({ page = 1, limit = 15, search = "" } = {}, signal) {
  const response = await api.get("/api/resignees", {
    params: { page, limit, search },
    signal,
    timeout: 20000,
  });
  return response.data;
}

// Summary counts are deliberately NOT requested when changing table pages.
export async function getResigneeStats({ search = "", revision = 0 } = {}, signal) {
  const response = await api.get("/api/resignees/stats", {
    params: { search, revision },
    signal,
    timeout: 30_000,
  });
  return response.data;
}
