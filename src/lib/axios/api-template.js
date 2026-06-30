import axios from "axios";

function getBaseURL() {
  const rawBaseURL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5001";

  return String(rawBaseURL)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

const BASE_URL = getBaseURL();

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",
  "/public/talent-pool/apply",
  "/recruitment/talent-pool/apply",
];

const IGNORE_AUTH_REDIRECT_ROUTES = [
  "/api/users/login",
  "/api/users/logout",
  "/api/users/refresh",
  "/api/users/admin-login",
  "/api/users/manager-login",

  "/users/login",
  "/users/logout",
  "/users/refresh",
  "/users/admin-login",
  "/users/manager-login",

  "/api/talent-pool/options",
  "/api/talent-pool/open-positions",
  "/api/talent-pool/public-applications",
];

function getCurrentPathname() {
  if (typeof window === "undefined") return "";
  return window.location.pathname || "";
}

function isPublicPath(pathname = getCurrentPathname()) {
  return PUBLIC_PATHS.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function shouldIgnoreAuthRedirect(requestUrl = "") {
  return IGNORE_AUTH_REDIRECT_ROUTES.some((route) =>
    String(requestUrl).includes(route),
  );
}

function normalizeApiUrl(url = "") {
  const textUrl = String(url || "");

  if (!textUrl) return textUrl;

  if (
    textUrl.startsWith("http://") ||
    textUrl.startsWith("https://") ||
    textUrl.startsWith("/api/") ||
    textUrl.startsWith("/uploads/")
  ) {
    return textUrl;
  }

  if (textUrl.startsWith("/")) {
    return `/api${textUrl}`;
  }

  return `/api/${textUrl}`;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const logoutApi = axios.create({
  baseURL: BASE_URL,
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
  const pathname = getCurrentPathname();

  if (redirect && isPublicPath(pathname)) {
    clearClientSession();
    return;
  }

  if (redirect && isRedirecting) return;

  if (redirect) {
    isRedirecting = true;
  }

  try {
    await logoutApi.post("/api/users/logout");
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
    config.url = normalizeApiUrl(config.url);

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
    const pathname = getCurrentPathname();

    const ignoreRedirect =
      isPublicPath(pathname) || shouldIgnoreAuthRedirect(requestUrl);

    if ((status === 401 || status === 403) && !ignoreRedirect) {
      await handleLogout(true);
    }

    return Promise.reject(error);
  },
);

export default api;