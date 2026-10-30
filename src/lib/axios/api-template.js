import axios from "axios";
import { currentHrisCacheScope, hrisQueryCache } from "./hrisQueryCache";

function getBaseURL() {
  const rawBaseURL =
    import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
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
  "/public/interview-date",
  "/public/offer-response",
  "/public/nho-schedule-response",
  "/public/candidate-experience-survey",
  "/recruitment/candidate-experience/survey",
  "/recruitment/talent-pool/apply",
];

const IGNORE_AUTH_REDIRECT_ROUTES = [
  "/api/users/login",
  "/api/users/logout",
  "/api/users/refresh",
  "/api/users/me",
  "/api/users/admin-login",
  "/api/users/manager-login",
  "/api/google/calendar/disconnect",

  "/users/login",
  "/users/logout",
  "/users/refresh",
  "/users/me",
  "/users/admin-login",
  "/users/manager-login",

  "/api/talent-pool/options",
  "/api/talent-pool/open-positions",
  "/api/talent-pool/public-applications",
  "/api/candidate-pipeline/public/interview-date",
  "/api/candidate-pipeline/public/offer-response",
  "/api/candidate-pipeline/public/nho-response",
  "/api/public/candidate-experience",
  "/api/audit-notifications/clock",
  "/audit-notifications/clock",
  "/api/notifications",
  "/notifications",
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
import { isCancellation } from "./cancellation";
export { isCancellation };

const defaultNetworkAdapter = axios.getAdapter(api.defaults.adapter);
function getNetworkAdapter(config) {
  if (config?.networkAdapter) return config.networkAdapter;
  if (api.defaults.adapter && api.defaults.adapter !== defaultNetworkAdapter) {
    return axios.getAdapter(api.defaults.adapter);
  }
  return defaultNetworkAdapter;
}

function withCancellation(promise, adapterConfig) {
  const signal = adapterConfig.signal;
  const cancelToken = adapterConfig.cancelToken;
  if (!signal && !cancelToken) return promise;
  if (signal?.aborted) {
    return Promise.reject(new axios.CanceledError(signal.reason || "canceled"));
  }
  if (cancelToken?.reason) {
    return Promise.reject(cancelToken.reason);
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      settled = true;
      if (signal) signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      if (settled) return;
      cleanup();
      reject(new axios.CanceledError(signal?.reason || "canceled"));
    };
    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
    if (cancelToken) {
      cancelToken.promise.then((cancel) => {
        if (settled) return;
        cleanup();
        reject(cancel);
      });
    }
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
  });
}

// Explicit read-only allowlist. Transactional, attendance, approval, auth and
// employee records continue to make fresh requests.
function cachePolicy(url = "") {
  const path = String(url).split("?")[0];
  if ([
    "/api/assigned-accounts/departments",
    "/api/assigned-accounts/accounts",
    "/api/departments",
    "/api/departments/account-creation-departments",
    "/api/requisitions/departments",
    "/api/requisitions/hiring-managers",
    "/api/job-description/dropdowns",
    "/api/available-position/meta",
    "/api/available-position/status-options",
    "/api/recruitment-settings/holidays",
    "/api/recruitment-settings",
    "/api/weekly-hiring-plan/weeks",
    "/api/weekly-hiring-plan/filter-options",
    "/api/weekly-hiring-plan/account-options",
    "/api/workforce-hiring-plan/weeks",
    "/api/workforce-hiring-plan/filter-options",
    "/api/workforce-hiring-plan/account-options",
    "/api/office-locations",
    "/api/applicant-leads/options",
    "/api/talent-pool/options",
    "/api/talent-pool/open-positions",
    "/api/sourcing-analytics/options",
  ].includes(path)) {
    return { ttlMs: 60_000, staleMs: 120_000 };
  }
  if (path === "/api/hr-dashboard/overview") return { ttlMs: 15_000, staleMs: 30_000 };
  if (path === "/api/ta-dashboard/overview") return { ttlMs: 10_000, staleMs: 15_000 };
  if (/^\/api\/(ta|om|som|wfm|finance)-dashboard\/bootstrap$/.test(path)) {
    return { ttlMs: 15_000, staleMs: 30_000 };
  }
  if ([
    "/api/sourcing-analytics",
    "/api/weekly-hiring-plan/trends",
    "/api/workforce-hiring-plan/trends",
    "/api/weekly-hiring-plan/accounts/roster-preview",
    "/api/workforce-hiring-plan/accounts/roster-preview",
  ].includes(path)) {
    return { ttlMs: 30_000, staleMs: 60_000 };
  }
  return null;
}

const logoutApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: LOGOUT_TIMEOUT_MS,
});

let isRedirecting = false;
let logoutPromise = null;
export const inFlightRequests = new Map();
const authCredentialRegistry = new Map();
let authCredentialCounter = 0;
const MAX_CREDENTIAL_REGISTRY_SIZE = 100;

export function clearAuthCredentialRegistry() {
  authCredentialRegistry.clear();
  authCredentialCounter = 0;
}

function getEffectiveAuthHeader(config) {
  const reqHeaders = config?.headers;
  let requestAuth =
    reqHeaders?.Authorization ||
    reqHeaders?.authorization ||
    (typeof reqHeaders?.get === "function" ? reqHeaders.get("Authorization") : null);

  if (requestAuth !== undefined && requestAuth !== null) {
    if (typeof requestAuth !== "string") {
      return null;
    }
    return requestAuth;
  }

  if (config?.auth && typeof config.auth === "object") {
    const username = config.auth.username || "";
    const password = config.auth.password || "";
    if (username || password) {
      return `Basic ${username}:${password}`;
    }
  }

  const defaults = api?.defaults?.headers;
  const defaultAuth =
    defaults?.common?.Authorization ||
    defaults?.common?.authorization ||
    defaults?.get?.Authorization ||
    defaults?.get?.authorization ||
    defaults?.Authorization ||
    defaults?.authorization ||
    (typeof defaults?.get === "function" ? defaults.get("Authorization") : null);

  if (defaultAuth !== undefined && defaultAuth !== null) {
    return typeof defaultAuth === "string" ? defaultAuth : String(defaultAuth);
  }

  return "";
}

function getSafeCredentialId(authHeader) {
  if (authHeader === null) return null;
  if (authHeader === undefined || authHeader === "") return "none";
  if (typeof authHeader !== "string") return null;

  const normalized = authHeader.trim();
  if (!normalized) return "none";

  let id = authCredentialRegistry.get(normalized);
  if (!id) {
    if (authCredentialRegistry.size >= MAX_CREDENTIAL_REGISTRY_SIZE) {
      authCredentialRegistry.clear();
    }
    authCredentialCounter += 1;
    id = `auth_${authCredentialCounter}`;
    authCredentialRegistry.set(normalized, id);
  }
  return id;
}

export function getInFlightKey(config) {
  const method = config?.method?.toLowerCase() || "get";
  if (method !== "get") return null;
  if (
    config?.params?.forceRefresh ||
    config?.params?.refresh ||
    config?.skipInFlightDeduplication
  ) {
    return null;
  }
  const rawUrl = config?.url || "";
  const [pathname, queryString] = rawUrl.split("?");
  const searchParams = new URLSearchParams(queryString || "");

  if (config?.params && typeof config.params === "object") {
    Object.entries(config.params).forEach(([k, v]) => {
      if (k === "_t" || k === "forceRefresh" || k === "refresh" || v === undefined) return;
      if (Array.isArray(v)) {
        searchParams.delete(k);
        [...v].map(String).sort().forEach((item) => searchParams.append(k, item));
      } else if (v !== null) {
        searchParams.set(k, String(v));
      }
    });
  }

  const entries = [];
  searchParams.forEach((value, key) => {
    if (key !== "_t" && key !== "forceRefresh" && key !== "refresh") {
      entries.push([key, value]);
    }
  });

  entries.sort(([k1, v1], [k2, v2]) => {
    const keyCompare = k1.localeCompare(k2);
    if (keyCompare !== 0) return keyCompare;
    return v1.localeCompare(v2);
  });

  const canonicalParams = new URLSearchParams();
  entries.forEach(([k, v]) => canonicalParams.append(k, v));
  const serialized = canonicalParams.toString();

  const rawAuthHeader = getEffectiveAuthHeader(config);
  const safeCredentialId = getSafeCredentialId(rawAuthHeader);
  // If safe credential identity cannot be established, bypass request coalescing
  if (safeCredentialId === null) {
    return null;
  }

  const scope = typeof currentHrisCacheScope === "function" ? currentHrisCacheScope() : "";
  // Safe composite authentication context: opaque credential identifier and session scope.
  // Raw bearer tokens are NEVER embedded in generated request keys.
  const authContext = `[auth:${safeCredentialId}#scope:${scope}]#`;

  return authContext + (serialized ? `${pathname}?${serialized}` : pathname);
}

function clearClientSession() {
  inFlightRequests.clear();
  clearAuthCredentialRegistry();
  hrisQueryCache.invalidate();
  if (typeof sessionStorage !== "undefined") {
    /*
     * Session storage is tab-scoped. Clear it completely so an expired
     * session cannot restore stale HRIS page/auth state after redirect.
     */
    sessionStorage.clear();
  }

  if (typeof localStorage !== "undefined") {
    [
      "token_expires_at",
      "server_token_expires_at",
      "session_idle_duration_ms",
      "selectedEmployeeId",
      "employeePageState",
    ].forEach((key) => localStorage.removeItem(key));
  }
}

async function clearBrowserRuntimeCache() {
  if (typeof window === "undefined") return;

  try {
    if ("caches" in window) {
      const cacheNames = await window.caches.keys();

      await Promise.all(
        cacheNames.map((cacheName) =>
          window.caches.delete(cacheName),
        ),
      );
    }
  } catch (error) {
    console.warn(
      "Unable to clear browser Cache Storage during logout:",
      error?.message || error,
    );
  }
}

function getFreshLoginUrl() {
  if (typeof window === "undefined") return "/login";

  const loginUrl = new URL("/login", window.location.origin);
  loginUrl.searchParams.set("_fresh", String(Date.now()));

  return `${loginUrl.pathname}${loginUrl.search}`;
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
      await clearBrowserRuntimeCache();

      if (redirect) {
        /*
         * JavaScript cannot issue the browser's Ctrl+Shift+R command. A
         * cache-busted full document navigation, after clearing Cache Storage,
         * gives HRIS the same clean-start behavior for an expired session.
         */
        window.location.replace(getFreshLoginUrl());
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
      const policy = cachePolicy(config.url);
      if (policy && !config.skipHrisCache) {
        const forceRefresh = Boolean(config.params?.refresh || config.params?.forceRefresh);
        config.adapter = async (adapterConfig) => {
          const currentNetworkAdapter = getNetworkAdapter(config);
          const execute = async () => {
            const cached = await hrisQueryCache.get(
              { path: adapterConfig.url, params: adapterConfig.params, ...policy, forceRefresh },
              async (networkSignal) => {
                const response = await currentNetworkAdapter({ ...adapterConfig, adapter: currentNetworkAdapter, signal: networkSignal });
                return {
                  data: response.data,
                  status: response.status,
                  statusText: response.statusText,
                  headers: response.headers,
                };
              },
            );
            return { ...cached, config: adapterConfig };
          };
          return withCancellation(execute(), adapterConfig);
        };
      } else {
        const inFlightKey = getInFlightKey(config);
        if (inFlightKey) {
          const currentNetworkAdapter = getNetworkAdapter(config);
          config.adapter = async (adapterConfig) => {
            let entry = inFlightRequests.get(inFlightKey);
            if (!entry) {
              const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
              const networkConfig = {
                ...adapterConfig,
                signal: controller ? controller.signal : undefined,
                cancelToken: undefined,
                adapter: currentNetworkAdapter,
              };
              entry = {
                promise: null,
                controller,
                activeCount: 0,
              };
              entry.promise = currentNetworkAdapter(networkConfig).finally(() => {
                if (inFlightRequests.get(inFlightKey) === entry) {
                  inFlightRequests.delete(inFlightKey);
                }
                if (inFlightRequests.size === 0) {
                  clearAuthCredentialRegistry();
                }
              });
              inFlightRequests.set(inFlightKey, entry);
            }

            entry.activeCount += 1;
            try {
              const response = await withCancellation(entry.promise, adapterConfig);
              entry.activeCount = Math.max(0, entry.activeCount - 1);
              return { ...response, config: adapterConfig };
            } catch (error) {
              entry.activeCount = Math.max(0, entry.activeCount - 1);
              if (
                entry.activeCount === 0 &&
                (isCancellation(error) || adapterConfig.signal?.aborted || adapterConfig.cancelToken?.reason)
              ) {
                if (entry.controller && !entry.controller.signal?.aborted) {
                  entry.controller.abort();
                }
                if (inFlightRequests.get(inFlightKey) === entry) {
                  inFlightRequests.delete(inFlightKey);
                }
                if (inFlightRequests.size === 0) {
                  clearAuthCredentialRegistry();
                }
              }
              throw error;
            }
          };
        }
      }
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

const NON_MUTATING_POST_ROUTES = [
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
  "/api/audit-notifications/clock",
  "/audit-notifications/clock",
  "/api/notifications",
  "/notifications",
];

api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    const url = response.config?.url || "";
    if (["post", "put", "patch", "delete"].includes(method)) {
      const isNonMutating = NON_MUTATING_POST_ROUTES.some((route) => url.includes(route));
      if (!isNonMutating) {
        hrisQueryCache.invalidate();
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    const pathname = getCurrentPathname();
    const skipAuthRedirect = Boolean(error.config?.skipAuthRedirect);

    const ignoreRedirect =
      skipAuthRedirect ||
      isPublicPath(pathname) ||
      shouldIgnoreAuthRedirect(requestUrl);

    // An authenticated private request returning 401 means the current JWT
    // is no longer usable (for example, it expired). End the client session
    // immediately so the browser returns to the login page.
    if (status === 401 && !ignoreRedirect) {
      void handleLogout(true);
    }

    return Promise.reject(error);
  },
);

export default api;
