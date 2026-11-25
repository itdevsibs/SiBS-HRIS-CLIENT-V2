import api from "@/lib/axios/api-template";
import { currentHrisCacheScope } from "@/lib/axios/hrisQueryCache";

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001";

const PROFILE_METADATA_KEYS = [
  "profilePictureUrl",
  "profile_picture_url",
  "profileUrl",
  "profile_url",
  "employeeProfileUrl",
  "employee_profile_url",
  "profile_filename",
  "profileFilename",
  "profilePicture",
  "profile_picture",
  "employeeProfilePicture",
  "employee_profile_picture",
  "profileImage",
  "profile_image",
];

const MAX_CACHE_ENTRIES = 250;
const resolvedProfileCache = new Map();
const inFlightProfileRequests = new Map();

export function getProfileImageUrl(item) {
  const directUrl =
    item?.profilePictureUrl ||
    item?.profile_picture_url ||
    item?.profileUrl ||
    item?.profile_url ||
    item?.employeeProfileUrl ||
    item?.employee_profile_url ||
    "";

  if (directUrl) return directUrl;

  const filename =
    item?.profile_filename ||
    item?.profileFilename ||
    item?.profilePicture ||
    item?.profile_picture ||
    item?.employeeProfilePicture ||
    item?.employee_profile_picture ||
    item?.profileImage ||
    item?.profile_image ||
    "";

  if (!filename) return "";

  if (String(filename).startsWith("http")) return filename;

  return `${String(API_URL).replace(
    /\/$/,
    "",
  )}/api/employee-profile/file/${encodeURIComponent(filename)}`;
}

export function hasResolvedProfileMetadata(item) {
  if (!item || typeof item !== "object") return false;
  if (item.profilePictureResolved === true) return true;
  return PROFILE_METADATA_KEYS.some((key) =>
    Object.prototype.hasOwnProperty.call(item, key),
  );
}

function getCacheKey(sibsId) {
  const scope = currentHrisCacheScope() || "anon";
  return `${scope}::${String(sibsId || "").trim()}`;
}

function setCachedProfile(cacheKey, value) {
  if (resolvedProfileCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = resolvedProfileCache.keys().next().value;
    if (oldestKey !== undefined) {
      resolvedProfileCache.delete(oldestKey);
    }
  }
  resolvedProfileCache.set(cacheKey, value);
}

function withCallerAbort(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) {
    const err = new Error("Aborted");
    err.name = "AbortError";
    return Promise.reject(err);
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      const err = new Error("Aborted");
      err.name = "AbortError";
      reject(err);
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

export async function fetchEmployeeProfileCached(sibsId, { signal } = {}) {
  const cleanId = String(sibsId || "").trim();
  if (!cleanId || cleanId === "--") return null;

  const cacheKey = getCacheKey(cleanId);
  if (resolvedProfileCache.has(cacheKey)) {
    return resolvedProfileCache.get(cacheKey);
  }

  let pending = inFlightProfileRequests.get(cacheKey);
  if (!pending) {
    pending = api
      .get(`/api/employees/${encodeURIComponent(cleanId)}`)
      .then((response) => {
        const result = response?.data;
        const resolved =
          result?.success && result?.data
            ? { ...result.data, profilePictureResolved: true }
            : { sibsId: cleanId, profilePictureUrl: "", profilePictureResolved: true };
        setCachedProfile(cacheKey, resolved);
        return resolved;
      })
      .finally(() => {
        inFlightProfileRequests.delete(cacheKey);
      });
    inFlightProfileRequests.set(cacheKey, pending);
  }

  return withCallerAbort(pending, signal);
}

export function clearEmployeeProfileAvatarCache() {
  resolvedProfileCache.clear();
  inFlightProfileRequests.clear();
}
