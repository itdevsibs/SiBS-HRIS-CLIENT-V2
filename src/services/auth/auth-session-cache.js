export const SESSION_DURATION_MS = 60 * 60 * 1000;
export const SESSION_EXPIRY_KEY = "accessTokenExpiresAt";
export const PERSISTENT_EXPIRY_KEY = "token_expires_at";
export const CACHED_USER_KEY = "sibsAuthenticatedUser";

function getSessionStorage() {
  return typeof sessionStorage === "undefined" ? null : sessionStorage;
}

function getLocalStorage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function normalizeExpiry(value) {
  if (value === undefined || value === null || value === "") return 0;

  const numericValue = Number(value);

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue < 1_000_000_000_000
      ? numericValue * 1000
      : numericValue;
  }

  const parsedValue = Date.parse(String(value));
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

export function readStoredExpiry() {
  const sessionStore = getSessionStorage();
  const localStore = getLocalStorage();

  const sessionExpiry = normalizeExpiry(
    sessionStore?.getItem(SESSION_EXPIRY_KEY),
  );
  const sharedExpiry = normalizeExpiry(
    localStore?.getItem(PERSISTENT_EXPIRY_KEY),
  );

  const effectiveExpiry = Math.max(sessionExpiry, sharedExpiry);

  if (!effectiveExpiry) return 0;

  /*
   * sessionStorage is tab-scoped, while localStorage is shared by tabs on
   * the same origin. Mirror the newest inactivity deadline so a sidebar
   * link opened in a new tab can validate the already-authenticated cookie
   * instead of treating the missing tab-local value as an expired session.
   */
  if (sessionExpiry !== effectiveExpiry) {
    sessionStore?.setItem(SESSION_EXPIRY_KEY, String(effectiveExpiry));
  }

  if (sharedExpiry !== effectiveExpiry) {
    localStore?.setItem(PERSISTENT_EXPIRY_KEY, String(effectiveExpiry));
  }

  return effectiveExpiry;
}

export function writeStoredExpiry(expiresAt) {
  const normalizedExpiry = normalizeExpiry(expiresAt);

  if (!normalizedExpiry) return 0;

  getSessionStorage()?.setItem(
    SESSION_EXPIRY_KEY,
    String(normalizedExpiry),
  );
  getLocalStorage()?.setItem(
    PERSISTENT_EXPIRY_KEY,
    String(normalizedExpiry),
  );

  return normalizedExpiry;
}

export function readCachedUser() {
  const rawUser = getSessionStorage()?.getItem(CACHED_USER_KEY);

  if (!rawUser) return null;

  try {
    const parsedUser = JSON.parse(rawUser);

    if (!parsedUser || typeof parsedUser !== "object") {
      return null;
    }

    return parsedUser;
  } catch {
    getSessionStorage()?.removeItem(CACHED_USER_KEY);
    return null;
  }
}

export function writeCachedUser(user) {
  if (!user || typeof user !== "object") {
    getSessionStorage()?.removeItem(CACHED_USER_KEY);
    return null;
  }

  try {
    getSessionStorage()?.setItem(CACHED_USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    console.warn("Unable to cache authenticated user:", error);
    return null;
  }
}

export function clearCachedAuthSession() {
  getSessionStorage()?.removeItem(SESSION_EXPIRY_KEY);
  getSessionStorage()?.removeItem(CACHED_USER_KEY);
  getLocalStorage()?.removeItem(PERSISTENT_EXPIRY_KEY);
}

export function readCachedAuthSession(now = Date.now()) {
  const expiresAt = readStoredExpiry();
  const user = readCachedUser();

  if (!expiresAt || expiresAt <= now || !user) {
    if (expiresAt && expiresAt <= now) {
      clearCachedAuthSession();
    }

    return null;
  }

  return {
    user,
    expiresAt,
  };
}

export function shouldEndSessionAfterUserFetchError(error) {
  const status = Number(error?.response?.status || 0);
  return status === 401 || status === 403;
}
