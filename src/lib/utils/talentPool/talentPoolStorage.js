import {
  AVAILABLE_POSITIONS_STORAGE_KEY,
  fallbackAvailablePositions,
} from "./talentPoolConstants";

export function readLocalStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalStorage(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Temporary frontend-only storage.
  }
}

export function dispatchTalentPoolSync() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event("ta-public-submissions-updated"));
  window.dispatchEvent(new Event("ta-pipeline-candidates-updated"));
  window.dispatchEvent(new Event("ta-available-positions-updated"));
}

export function normalizeAvailablePosition(position) {
  return {
    ...position,
    id: position?.id || position?.positionId || position?.positionTitle,
    positionId: position?.positionId || position?.id || "",
    positionTitle:
      position?.positionTitle ||
      position?.title ||
      position?.name ||
      position?.roleTitle ||
      "",
    department: position?.department || "",
    locationSite:
      position?.locationSite || position?.location || position?.site || "",
    status: position?.status || "Active",
  };
}

export function getAvailablePositions() {
  const storedPositions = readLocalStorage(
    AVAILABLE_POSITIONS_STORAGE_KEY,
    fallbackAvailablePositions,
  );

  const sourcePositions =
    Array.isArray(storedPositions) && storedPositions.length > 0
      ? storedPositions
      : fallbackAvailablePositions;

  return sourcePositions
    .map(normalizeAvailablePosition)
    .filter((position) => position.positionTitle);
}

export function getActiveAvailablePositions() {
  return getAvailablePositions().filter(
    (position) => String(position.status).toLowerCase() === "active",
  );
}
