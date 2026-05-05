import api from "./api-template";

/* ================================
   📥 GET
================================ */
export async function apiGet(endpoint) {
  try {
    const res = await api.get(endpoint);
    return res.data;
  } catch (error) {
    console.error("GET Error:", error.response?.data || error.message);
    throw error;
  }
}

/* ================================
   📤 POST
================================ */
export async function apiPost(endpoint, body) {
  try {
    const res = await api.post(endpoint, body);
    return res.data;
  } catch (error) {
    console.error("POST Error:", error.response?.data || error.message);
    throw error;
  }
}

/* ================================
   ✏️ PUT
================================ */
export async function apiPut(endpoint, body) {
  try {
    const res = await api.put(endpoint, body);
    return res.data;
  } catch (error) {
    console.error("PUT Error:", error.response?.data || error.message);
    throw error;
  }
}

/* ================================
   ❌ DELETE
================================ */
export async function apiDelete(endpoint) {
  try {
    const res = await api.delete(endpoint);
    return res.data;
  } catch (error) {
    console.error("DELETE Error:", error.response?.data || error.message);
    throw error;
  }
}

/* ================================
   📁 FILE UPLOAD
================================ */
export async function apiUpload(endpoint, formData, onProgress) {
  try {
    const res = await api.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
    });

    return res.data;
  } catch (error) {
    console.error("UPLOAD Error:", error.response?.data || error.message);
    throw error;
  }
}

export default api;