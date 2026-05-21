import api from "./api-template";

export async function getHiringNeeds() {
  try {
    const res = await api.get("/api/hiring-needs/hiring-needs");
    return res.data;
  } catch (err) {
    console.error("GET HIRING NEEDS API ERROR:", err);
    throw err;
  }
}

export async function createHiringNeed(payload) {
  try {
    const res = await api.post("/api/hiring-needs/create-hiring-need", payload);
    return res.data;
  } catch (err) {
    console.error("CREATE HIRING NEED API ERROR:", err);
    throw err;
  }
}

export async function getHiringNeedJobDescriptions() {
  try {
    const res = await api.get("/api/hiring-needs/job-descriptions");
    return res.data;
  } catch (err) {
    console.error("GET HIRING NEED JOB DESCRIPTIONS API ERROR:", err);
    throw err;
  }
}

export async function getHiringNeedById(id) {
  try {
    const res = await api.get(`/api/hiring-needs/${id}`);
    return res.data;
  } catch (err) {
    console.error("GET HIRING NEED BY ID API ERROR:", err);
    throw err;
  }
}