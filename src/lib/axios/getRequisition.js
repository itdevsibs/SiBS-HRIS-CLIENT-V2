import api from "./api-template";

export async function getDepartments() {
  try {
    const res = await api.get("/api/requisitions/departments");
    return res.data;
  } catch (err) {
    console.error("Axios getDepartments API error:", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  }
}

export async function getHiringManagers() {
  try {
    const res = await api.get("/api/requisitions/hiring-managers");
    return res.data;
  } catch (err) {
    console.error("Axios getHiringManagers API error:", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  }
}

export async function submitRequisition(form) {
  try {
    const res = await api.post("/api/requisitions", form);
    return res.data;
  } catch (err) {
    console.error("Axios submitRequisition API error:", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  }
}