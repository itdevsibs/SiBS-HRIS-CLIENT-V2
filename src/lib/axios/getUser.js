import api from "./api-template";

export async function loginUser({ sibsId, password }) {
  try{
    const res = await api.post(
      "/api/users/login",
      {
        sibsId: sibsId.trim(),
        password: password.trim(),
      }
    );
    const data = res.data;

    return data;

  }catch(err){
    console.error("Axios loginUser API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  }
}

export async function loginAdmin({ password }) {
  try{
  const res = await api.post("/api/users/admin-login", {
    password: password.trim(),
  });
  const data = res.data;

  return data;

  }catch(err){
    console.error("Axios loginAdmin API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  };
};

export async function getUser() {
  try {
    const res = await api.get("/api/users/me");
    const data = res.data;

    return data.user;

  } catch (err) {
    console.error("Axios getUser API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  };
};

