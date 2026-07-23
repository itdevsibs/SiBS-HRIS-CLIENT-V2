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
const LOGOUT_TIMEOUT_MS = 5000;

export const AUTH_LOGOUT_START_EVENT = "sibs-auth-logout-start";

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
  "/api/users/me",
  "/api/users/admin-login",
  "/api/users/manager-login",

  "/users/login",
  "/users/logout",
  "/users/refresh",
  "/users/me",
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
  timeout: LOGOUT_TIMEOUT_MS,
});

let isRedirecting = false;
let logoutPromise = null;

function clearClientSession() {
  sessionStorage.removeItem("accessTokenExpiresAt");
  sessionStorage.removeItem("selectedEmployeeId");
  sessionStorage.removeItem("sibsAuthenticatedUser");

  localStorage.removeItem("token_expires_at");
  localStorage.removeItem("selectedEmployeeId");
  localStorage.removeItem("employeePageState");
}

function dispatchLogoutStart() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_START_EVENT));
}

export async function handleLogout(redirect = true) {
  const pathname = getCurrentPathname();

  if (redirect && isPublicPath(pathname)) {
    clearClientSession();
    return;
  }

  if (redirect && isRedirecting && logoutPromise) {
    return logoutPromise;
  }

  if (logoutPromise) {
    return logoutPromise;
  }

  if (redirect) {
    isRedirecting = true;
  }

  dispatchLogoutStart();

  logoutPromise = (async () => {
    try {
      await logoutApi.post("/api/users/logout", {});
    } catch (error) {
      if (error?.code !== "ECONNABORTED") {
        console.error(
          "Logout error:",
          error?.response?.data || error?.message,
        );
      }
    } finally {
      clearClientSession();

      if (redirect) {
        window.location.replace("/login");
      } else {
        isRedirecting = false;
      }
    }
  })();

  try {
    await logoutPromise;
  } finally {
    logoutPromise = null;
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

      config.headers = config.headers || {};
      config.headers["Cache-Control"] = "no-cache";
      config.headers.Pragma = "no-cache";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const pathname = getCurrentPathname();
    const skipAuthRedirect = Boolean(error.config?.skipAuthRedirect);

    const ignoreRedirect =
      skipAuthRedirect ||
      isPublicPath(pathname) ||
      shouldIgnoreAuthRedirect(requestUrl);

    // A normal 403 can mean missing module permission; do not log out for it.
    if (status === 401 && !ignoreRedirect) {
      void handleLogout(true);
    }

    return Promise.reject(error);
  },
);

export default api;
