import api from "./api-template";

export async function getResignees({ page = 1, limit = 15, search = "" } = {}, signal) {
  const response = await api.get("/api/resignees", {
    params: { page, limit, search },
    signal,
    timeout: 20000,
  });
  return response.data;
}
