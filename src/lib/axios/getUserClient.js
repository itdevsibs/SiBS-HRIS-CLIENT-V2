import api from "./api-template";


// src/lib/getUserClient.js

export async function getUserClient() {
  try {
    const res = await api.get("/api/users/me");
    const data = res.data;

    return data;

  } catch (err) {
    console.error("Axios getUserClient API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" }; 
  };
};