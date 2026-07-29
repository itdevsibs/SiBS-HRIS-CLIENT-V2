const CACHE_KEY = "sibs.om-dashboard.bootstrap.v1";
const CACHE_TTL_MS = 10 * 60_000;

const EMPTY_FUNNEL = Object.freeze({
  sourced: 0,
  screened: 0,
  interviewed: 0,
  offered: 0,
  accepted: 0,
  hired: 0,
});

export const EMPTY_METRICS = Object.freeze({
  totalOpenRoles: 0,
  totalRequirement: 0,
  totalFilled: 0,
  filledPercentage: 0,
  atRiskRoles: 0,
  delayedRoles: 0,
  weeklyHired: 0,
  dropOffs: 0,
  recruiterLoad: 0,
  agingRoles: 0,
  funnel: EMPTY_FUNNEL,
});

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

export function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export function safePercentage(value, total) {
  const safeValue = Number(value || 0);
  const safeTotal = Number(total || 0);

  return safeTotal > 0 ? Math.round((safeValue / safeTotal) * 100) : 0;
}

export function normalizeRole(role = {}) {
  return {
    id: role.id,
    role: cleanText(role.role || role.roleTitle) || "Unassigned Role",
    roleTitle: cleanText(role.roleTitle || role.role) || "Unassigned Role",
    roleAccount:
      cleanText(role.roleAccount) ||
      [role.roleTitle || role.role, role.account].filter(Boolean).join(" - "),
    department: cleanText(role.department) || "Unassigned",
    account: cleanText(role.account) || "Unassigned",
    req: Number(role.req || 0),
    filled: Number(role.filled || 0),
    open: Number(role.open || 0),
    dueDate: role.dueDate || null,
    status: cleanText(role.status) || "On Track",
    taOwner: cleanText(role.taOwner) || "Unassigned",
    riskFlag: cleanText(role.riskFlag) || "None",
    aging: Number(role.aging || 0),
    dropOffs: Number(role.dropOffs || 0),
    weeklyHired: Number(role.weeklyHired || 0),
    actionItem:
      cleanText(role.actionItem) ||
      "Maintain current pipeline movement and recruiter follow-up.",
    movement: {
      sourced: Number(role.movement?.sourced || 0),
      screened: Number(role.movement?.screened || 0),
      interviewed: Number(role.movement?.interviewed || 0),
      offered: Number(role.movement?.offered || 0),
      accepted: Number(role.movement?.accepted || 0),
      hired: Number(role.movement?.hired || 0),
    },
  };
}

export function normalizeRecruiter(row = {}) {
  return {
    name: cleanText(row.name || row.recruiter) || "Unassigned",
    activeRoles: Number(row.activeRoles || 0),
    hiredCount: Number(row.hiredCount || 0),
    loadStatus: cleanText(row.loadStatus) || "Normal",
    output: {
      sourced: Number(row.output?.sourced ?? row.sourced ?? 0),
      interviewed: Number(row.output?.interviewed ?? row.interviewed ?? 0),
      hired: Number(row.output?.hired ?? row.hired ?? row.hiredCount ?? 0),
    },
  };
}

export function normalizeMetrics(payload = {}) {
  const metrics = payload?.metrics || {};
  const funnel = metrics.funnel || payload?.funnel || {};

  return {
    ...EMPTY_METRICS,
    ...metrics,
    totalOpenRoles: Number(metrics.totalOpenRoles || 0),
    totalRequirement: Number(metrics.totalRequirement || 0),
    totalFilled: Number(metrics.totalFilled || 0),
    filledPercentage: Number(metrics.filledPercentage || 0),
    atRiskRoles: Number(metrics.atRiskRoles || 0),
    delayedRoles: Number(metrics.delayedRoles || 0),
    weeklyHired: Number(metrics.weeklyHired || 0),
    dropOffs: Number(metrics.dropOffs || 0),
    recruiterLoad: Number(metrics.recruiterLoad || 0),
    agingRoles: Number(metrics.agingRoles || 0),
    funnel: {
      sourced: Number(funnel.sourced || 0),
      screened: Number(funnel.screened || 0),
      interviewed: Number(funnel.interviewed || 0),
      offered: Number(funnel.offered || 0),
      accepted: Number(funnel.accepted || 0),
      hired: Number(funnel.hired || 0),
    },
  };
}

export function readCachedDashboard() {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.payload && typeof parsed.payload === "object"
      ? parsed.payload
      : null;
  } catch {
    return null;
  }
}

export function writeCachedDashboard(payload) {
  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), payload }),
    );
  } catch {
    // Session storage is optional and must not block the dashboard.
  }
}
