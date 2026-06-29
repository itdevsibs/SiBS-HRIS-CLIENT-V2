import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",
  "/public/talent-pool/apply",
  "/recruitment/talent-pool/apply",
];

const PUBLIC_API_ROUTES = [
  "/api/users/login",
  "/api/users/logout",
  "/api/users/admin-login",
  "/api/users/manager-login",

  // Public Talent Pool endpoints
  "/api/talent-pool/options",
  "/api/talent-pool/open-positions",
  "/api/talent-pool/public-applications",
];

function isPublicPath(pathname = "") {
  return PUBLIC_PATHS.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function isPublicApiRoute(requestUrl = "") {
  return PUBLIC_API_ROUTES.some((route) => requestUrl.includes(route));
}

function getCurrentPathname() {
  if (typeof window === "undefined") return "";
  return window.location.pathname || "";
}

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
  const currentPathname = getCurrentPathname();
  const currentlyPublic = isPublicPath(currentPathname);

  /*
    IMPORTANT:
    Never redirect public pages to login.
    This keeps /recruitment/talent-pool/apply usable in incognito.
  */
  if (redirect && currentlyPublic) {
    clearClientSession();
    return;
  }

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
    const currentPathname = getCurrentPathname();

    /*
      Public page should not force auth behavior.
      Still allow the request to continue normally.
    */
    if (isPublicPath(currentPathname)) {
      if (config.method?.toLowerCase() === "get") {
        config.params = {
          ...(config.params || {}),
          _t: Date.now(),
        };

        config.headers["Cache-Control"] = "no-cache";
        config.headers["Pragma"] = "no-cache";
      }

      return config;
    }

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
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const currentPathname = getCurrentPathname();

    const shouldIgnoreAuthRedirect =
      isPublicPath(currentPathname) || isPublicApiRoute(requestUrl);

    if (
      (status === 401 || status === 403) &&
      !shouldIgnoreAuthRedirect
    ) {
      await handleLogout(true);
    }

    return Promise.reject(error);
  },
);

export default api;