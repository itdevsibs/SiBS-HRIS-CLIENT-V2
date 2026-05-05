import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRedirecting = false;

function clearClientSession() {
  sessionStorage.removeItem("accessTokenExpiresAt");
  sessionStorage.removeItem("selectedEmployeeId");

  localStorage.removeItem("token_expires_at");
  localStorage.removeItem("selectedEmployeeId");
  localStorage.removeItem("employeePageState");
}

export async function handleLogout(redirect = true) {
  if (redirect && isRedirecting) return;

  if (redirect) {
    isRedirecting = true;
  }

  try {
    await api.post("/api/users/logout");
  } catch (err) {
    console.error("Logout error:", err?.response?.data || err?.message);
  } finally {
    clearClientSession();

    if (redirect) {
      window.location.replace("/login");
    } else {
      isRedirecting = false;
    }
  }
}

api.interceptors.request.use(
  (config) => {
    if (config.method?.toLowerCase() === "get") {
      config.params = {
        ...(config.params || {}),
        _t: Date.now(),
      };

      config.headers["Cache-Control"] = "no-cache";
      config.headers["Pragma"] = "no-cache";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const ignoreAuthRedirectRoutes = [
      "/api/users/login",
      "/api/users/logout",
      "/api/users/admin-login",
      "/api/users/manager-login",
    ];

    const shouldIgnoreAuthRedirect = ignoreAuthRedirectRoutes.some((route) =>
      requestUrl.includes(route)
    );

    if (
      (status === 401 || status === 403) &&
      !shouldIgnoreAuthRedirect
    ) {
      await handleLogout(true);
    }

    return Promise.reject(error);
  }
);

export default api;