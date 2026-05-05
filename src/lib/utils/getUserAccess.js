import api from "../axios/api-template";

export async function getUserAccess(page = 1, search = "") {
  try{
    const res = await api.get("/api/assigned-accounts/users", {
      params: { page, search },
    });
    const data = res.data;

    return data;

  }catch(err){
    console.error("Axios API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" }; 
  };
};

export async function searchUserAccessEmployees(search = "") {
  try {
    const res = await api.get("/api/assigned-accounts/employee-search", {
      params: { search },
    });
    const data = res.data;
      
    return data;

  }catch(err){
    console.error("Axios searchUserAccessEmployees API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };    
  };
};

export async function addUserAccess(payload) {
  try{
    const res = await api.post("/api/assigned-accounts/users", payload);
    const data = res.data;
      
    return data;

  }catch(err){
    console.error("Axios addUserAccess API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" }; 
  };
};

export async function updateUserAccess(id, payload) {
  try{
    const res = await api.put(`/api/assigned-accounts/users/${id}`, payload);
    const data = res.data;
      
    return data;

  }catch(err){
    console.error("Axios updateUserAccess API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" }; 
  };
};

export async function deleteUserAccess(id) {
  try{
    const res = await api.delete(`/api/assigned-accounts/users/${id}`);
    const data = res.data;
      
    return data;
    
  }catch(err){
    console.error("Axios deleteUserAccess API Error: ", err?.response?.status, err?.message);
    return { success: false, status: err.response?.status || 500, message: err?.message || "An error occurred" };
  };
};