const DEFAULT_STORAGE_NAMESPACE = "sibs.sidebarNotifications.lastSeen";

function normalizePositiveCount(value) {
  const count = Number(value || 0);

  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function isAfterLastSeen(updatedAt, lastSeenAt) {
  if (!updatedAt || !lastSeenAt) return true;

  const updatedTime = new Date(updatedAt).getTime();
  const lastSeenTime = new Date(lastSeenAt).getTime();

  if (!Number.isFinite(updatedTime) || !Number.isFinite(lastSeenTime)) {
    return true;
  }

  return updatedTime > lastSeenTime;
}

function humanizeModuleKey(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

function buildNotificationTitle(definition, badgeText) {
  if (definition.title) return definition.title;

  const count = normalizePositiveCount(definition.count);
  const label = normalizeLabel(definition.label).toLowerCase();
  const moduleName = definition.name || humanizeModuleKey(definition.key);

  if (count && label && moduleName) {
    return `${count} ${label} ${moduleName}`;
  }

  return badgeText;
}

export function buildSidebarBadgeText(notification = {}) {
  const safeNotification = notification || {};
  const count = normalizePositiveCount(safeNotification.count);
  const label = normalizeLabel(safeNotification.label);

  if (!count && label === "RAMPS") return label;
  if (!count) return "";

  const countText = count > 99 ? "99+" : String(count);

  return label ? `${countText} ${label}` : countText;
}

export function getSidebarNotificationStorageKey(userId) {
  return `${DEFAULT_STORAGE_NAMESPACE}.${userId || "anonymous"}`;
}

export function markSidebarNotificationSeen(lastSeen = {}, moduleKey, seenAt) {
  if (!moduleKey) return { ...lastSeen };

  return {
    ...lastSeen,
    [moduleKey]: seenAt || new Date().toISOString(),
  };
}

export function createSidebarNotificationState({
  definitions = [],
  lastSeen = {},
} = {}) {
  return definitions.reduce((state, definition) => {
    const key = definition?.key;
    const badgeText = buildSidebarBadgeText(definition);

    if (!key || !badgeText) return state;
    if (!isAfterLastSeen(definition.updatedAt, lastSeen[key])) return state;

    state[key] = {
      count: normalizePositiveCount(definition.count),
      label: normalizeLabel(definition.label),
      tone: definition.tone || "info",
      title: buildNotificationTitle(definition, badgeText),
      updatedAt: definition.updatedAt || "",
    };

    return state;
  }, {});
}

export function getSidebarNotification(state = {}, moduleKey) {
  return state[moduleKey] || null;
}
