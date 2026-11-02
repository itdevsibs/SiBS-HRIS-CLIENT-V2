/**
 * SiBS HRIS — Developer Collectible Avatar Border & Accessory Registry
 *
 * Mappings for the collectible developer avatar titles, accessories, and glowing rings.
 * Adapts the Mr. Sibs accessory architecture while preserving each developer's thematic crest.
 * Strictly keyed to the canonical SiBS IDs.
 */

export const DEVELOPER_BORDERS = Object.freeze({
  "6496": {
    id: "6496",
    developer: "Crister",
    title: "THE ENGINEER",
    headerTitle: "ENGINEER",
    accessoryKey: "engineer",
    ringClass: "ring-2 ring-orange-500 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(249,115,22,0.4)]",
    previewRingClass: "ring-2 ring-orange-500 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(249,115,22,0.4)]",
    badgeGradient: "from-amber-600 via-orange-600 to-amber-700",
    glowColor: "rgba(249, 115, 22, 0.45)",
    ringColor: "#f97316",
  },
  "6495": {
    id: "6495",
    developer: "Allen",
    title: "BACKEND GOD",
    headerTitle: "BACKEND",
    accessoryKey: "backend_god",
    ringClass: "ring-2 ring-emerald-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(52,211,153,0.4)]",
    previewRingClass: "ring-2 ring-emerald-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(52,211,153,0.4)]",
    badgeGradient: "from-emerald-600 via-teal-600 to-emerald-700",
    glowColor: "rgba(52, 211, 153, 0.45)",
    ringColor: "#34d399",
  },
  "6099": {
    id: "6099",
    developer: "Miss",
    title: "THE QUEEN MANAGER",
    headerTitle: "QUEEN MGR",
    accessoryKey: "queen_manager",
    ringClass: "ring-2 ring-fuchsia-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(232,121,249,0.4)]",
    previewRingClass: "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(232,121,249,0.4)]",
    badgeGradient: "from-purple-600 via-fuchsia-600 to-purple-700",
    glowColor: "rgba(232, 121, 249, 0.45)",
    ringColor: "#e879f9",
  },
  "6892": {
    id: "6892",
    developer: "Dwight",
    title: "THE GAMBLER",
    headerTitle: "GAMBLER",
    accessoryKey: "gambler",
    ringClass: "ring-2 ring-rose-500 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(251,113,133,0.4)]",
    previewRingClass: "ring-2 ring-rose-500 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(251,113,133,0.4)]",
    badgeGradient: "from-red-600 via-rose-600 to-red-700",
    glowColor: "rgba(251, 113, 133, 0.45)",
    ringColor: "#fb7185",
  },
  "6890": {
    id: "6890",
    developer: "Paul",
    title: "THE SLEEPER",
    headerTitle: "SLEEPER",
    accessoryKey: "sleeper",
    ringClass: "ring-2 ring-sky-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(56,189,248,0.4)]",
    previewRingClass: "ring-2 ring-sky-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(56,189,248,0.4)]",
    badgeGradient: "from-sky-600 via-indigo-600 to-sky-700",
    glowColor: "rgba(56, 189, 248, 0.45)",
    ringColor: "#38bdf8",
  },
  "6891": {
    id: "6891",
    developer: "Mars",
    title: "CARZIQO DONATER",
    headerTitle: "CARZIQO",
    accessoryKey: "carziqo_donater",
    ringClass: "ring-2 ring-cyan-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(34,211,238,0.4)]",
    previewRingClass: "ring-2 ring-cyan-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(34,211,238,0.4)]",
    badgeGradient: "from-cyan-600 via-blue-600 to-violet-600",
    glowColor: "rgba(34, 211, 238, 0.45)",
    ringColor: "#22d3ee",
  },
});

/**
 * MR. SIBS Canonical Reference Profile (Ralph Dulla / ID 6784)
 */
export const MR_SIBS_BORDER = Object.freeze({
  id: "6784",
  developer: "Ralph Dulla",
  title: "MR. SIBS",
  accessoryKey: "mrsibs",
  ringClass: "ring-2 ring-amber-400 ring-offset-1 ring-offset-white shadow-[0_0_8px_rgba(245,158,11,0.35)]",
  previewRingClass: "ring-2 ring-amber-400 ring-offset-2 ring-offset-white shadow-[0_0_12px_rgba(245,158,11,0.35)]",
  badgeGradient: "from-amber-500 via-orange-500 to-amber-500",
  glowColor: "rgba(245, 158, 11, 0.45)",
  ringColor: "#fbbf24",
});

/**
 * Normalizes and extracts canonical identity codes from a user / employee object.
 *
 * @param {Object} user
 * @returns {string[]}
 */
export function extractUserAccountIdentifiers(user = {}) {
  if (!user || typeof user !== "object") return [];

  // An explicit employee code wins over login aliases, even when unassigned.
  const candidates = [
    user.sibs_id,
    user.sibsId,
    user.employeeSibsId,
    user.employee_sibs_id,
    user.gy_emp_code,
    user.gy_user_code,
    user.username,
  ];
  const identifier = candidates
    .filter((value) => typeof value === "string" || typeof value === "number")
    .map((value) => String(value).trim())
    .find(Boolean);

  return identifier && /^\d+$/.test(identifier) ? [identifier] : [];
}

/**
 * Resolves whether the current user is assigned one of the collectible developer borders.
 * Strict ID-based resolution with zero name-based inference.
 *
 * @param {Object} user
 * @returns {Object|null}
 */
export function getDeveloperBorder(user) {
  const identifiers = extractUserAccountIdentifiers(user);
  for (const id of identifiers) {
    if (Object.hasOwn(DEVELOPER_BORDERS, id)) {
      return DEVELOPER_BORDERS[id];
    }
  }
  return null;
}

/** Resolves all seven collectible frames by canonical employee code only. */
export function getActiveCollectibleProfile(user) {
  const border = getDeveloperBorder(user);
  if (border) return border;
  return extractUserAccountIdentifiers(user).includes("6784") ? MR_SIBS_BORDER : null;
}
