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

export const AUTH_LOGOUT_START_EVENT = "sibs-auth-logout-start";

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

let logoutPromise = null;
let redirectAfterLogout = false;
let logoutEventSent = false;

function clearClientSession() {
  sessionStorage.removeItem("accessTokenExpiresAt");
  sessionStorage.removeItem("selectedEmployeeId");

  localStorage.removeItem("token_expires_at");
  localStorage.removeItem("selectedEmployeeId");
  localStorage.removeItem("employeePageState");
}

function dispatchLogoutStart() {
  if (logoutEventSent || typeof window === "undefined") return;

  logoutEventSent = true;
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_START_EVENT));
}

export function handleLogout(redirect = true) {
  redirectAfterLogout = redirectAfterLogout || redirect;

  clearClientSession();
  dispatchLogoutStart();

  const pathname = getCurrentPathname();

  if (redirect && isPublicPath(pathname)) {
    redirectAfterLogout = false;
    logoutEventSent = false;
    return Promise.resolve();
  }

  if (logoutPromise) {
    return logoutPromise;
  }

  logoutPromise = logoutApi
    .post(
      "/api/users/logout",
      {},
      {
        timeout: 5000,
      },
    )
    .catch((err) => {
      console.error("Logout error:", err?.response?.data || err?.message);
    })
    .finally(() => {
      const shouldRedirect = redirectAfterLogout;

      clearClientSession();

      logoutPromise = null;
      redirectAfterLogout = false;
      logoutEventSent = false;

      if (
        shouldRedirect &&
        typeof window !== "undefined" &&
        !isPublicPath(getCurrentPathname())
      ) {
        window.location.replace("/login");
      }
    });

  return logoutPromise;
}

api.interceptors.request.use(
  (config) => {
    config.url = normalizeApiUrl(config.url);
    config.headers = config.headers || {};

    if (config.method?.toLowerCase() === "get") {
      config.params = {
        ...(config.params || {}),
        _t: Date.now(),
      };

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

    /*
     * A 403 response can mean the logged-in user lacks permission for one
     * module. It must not destroy the entire authenticated session.
     * Only a real 401 authentication failure starts global logout.
     */
    if (status === 401 && !ignoreRedirect) {
      void handleLogout(true);
    }

    return Promise.reject(error);
  },
);

export default api;
