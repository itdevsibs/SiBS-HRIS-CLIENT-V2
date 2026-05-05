import api from "./api-template";

export async function getSchedule(page = 1) {
  try{
    const res = await api.get("/api/employee-schedule", {
      params: {
        page,
      },
    });
    const data = res.data;

    return data;

  }catch(err){
    console.error("Axios getSchedule API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  };
};