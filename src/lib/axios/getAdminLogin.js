import api from "./api-template";

export async function getAdminLogin(password) {
  try {
    const res = await api.post(
      "/api/users/admin-login",
      {
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
    return {
      success: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Admin login failed",
      user: null,
      expiresAt: null,
    };
  }
}