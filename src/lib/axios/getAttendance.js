import api from "./api-template";

export async function getAttendance(page = 1, search = "") {
    try{
      const res = await api.get("/api/attendance", {
        params: {
          page,
          search,
        },
      });

      const data = res.data;

      return data;
    }catch(err){
      console.error("Axios getAttendance API error:", err?.response?.status, err?.message);
      return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };      
    };
};
