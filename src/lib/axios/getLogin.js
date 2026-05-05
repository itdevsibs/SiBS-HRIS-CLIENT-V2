import api from "./api-template";

export async function getLogin(sibsId, password) {
  try {
    const res = await api.post(
      "/api/users/login",
      {
        sibsId: sibsId.trim(),
        password: password.trim(),
      },
      {
        withCredentials: true,
      }
    );

    const data = res.data;

    return {
      success: data?.success || false,
      status: res.status,
      message: data?.message || "",
      user: data?.user || null,
      expiresAt: data?.expiresAt || null,
    };
  } catch (err) {
    console.error(
      "Axios getLogin API error:",
      err?.response?.status,
      err?.message
    );

    return {
      success: false,
      status: err?.response?.status || 500,
      message: err?.response?.data?.message || err?.message || "An error occurred",
      user: null,
      expiresAt: null,
    };
  }
}