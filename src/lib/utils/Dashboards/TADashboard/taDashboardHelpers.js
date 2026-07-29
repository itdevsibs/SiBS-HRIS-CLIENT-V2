export const EMPTY_FUNNEL = Object.freeze({
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
  const roleName = cleanText(role.role || role.roleTitle) || "Unassigned Role";
  const account = cleanText(role.account) || "Unassigned Account";

  return {
    id: role.id,
    role: roleName,
    roleTitle: cleanText(role.roleTitle || role.role) || roleName,
    roleAccount:
      cleanText(role.roleAccount) ||
      [roleName, account].filter(Boolean).join(" - "),
    account,
    department:
      cleanText(role.department || role.account) || "Unassigned Department",
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

export function normalizeRecruiter(recruiter = {}) {
  return {
    name: cleanText(recruiter.name || recruiter.recruiter) || "Unassigned",
    activeRoles: Number(recruiter.activeRoles || 0),
    hiredCount: Number(recruiter.hiredCount || 0),
    loadStatus: cleanText(recruiter.loadStatus) || "Normal",
    output: {
      sourced: Number(recruiter.output?.sourced ?? recruiter.sourced ?? 0),
      interviewed: Number(
        recruiter.output?.interviewed ?? recruiter.interviewed ?? 0,
      ),
      hired: Number(
        recruiter.output?.hired ??
          recruiter.hired ??
          recruiter.hiredCount ??
          0,
      ),
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

export function buildSummaryMetrics({
  roles = [],
  recruiters = [],
  overviewMetrics = EMPTY_METRICS,
  generatedAt = null,
} = {}) {
  const fallbackFunnel = roles.reduce(
    (totals, role) => ({
      sourced: totals.sourced + Number(role.movement?.sourced || 0),
      screened: totals.screened + Number(role.movement?.screened || 0),
      interviewed:
        totals.interviewed + Number(role.movement?.interviewed || 0),
      offered: totals.offered + Number(role.movement?.offered || 0),
      accepted: totals.accepted + Number(role.movement?.accepted || 0),
      hired: totals.hired + Number(role.movement?.hired || 0),
    }),
    { ...EMPTY_FUNNEL },
  );

  const totalRequirement = roles.reduce(
    (sum, role) => sum + Number(role.req || 0),
    0,
  );
  const totalFilled = roles.reduce(
    (sum, role) => sum + Number(role.filled || 0),
    0,
  );
  const hasBackendMetrics = Boolean(generatedAt);

  return {
    totalOpenRoles: hasBackendMetrics
      ? Number(overviewMetrics.totalOpenRoles || 0)
      : roles.filter((role) => Number(role.open || 0) > 0).length,
    totalReq: hasBackendMetrics
      ? Number(overviewMetrics.totalRequirement || 0)
      : totalRequirement,
    totalFilled: hasBackendMetrics
      ? Number(overviewMetrics.totalFilled || 0)
      : totalFilled,
    filledPercentage: hasBackendMetrics
      ? Math.round(Number(overviewMetrics.filledPercentage || 0))
      : safePercentage(totalFilled, totalRequirement),
    atRisk: hasBackendMetrics
      ? Number(overviewMetrics.atRiskRoles || 0)
      : roles.filter((role) => role.status === "At Risk").length,
    delayed: hasBackendMetrics
      ? Number(overviewMetrics.delayedRoles || 0)
      : roles.filter((role) => role.status === "Delayed").length,
    weeklyHired: hasBackendMetrics
      ? Number(overviewMetrics.weeklyHired || 0)
      : roles.reduce(
          (sum, role) => sum + Number(role.weeklyHired || 0),
          0,
        ),
    dropOffs: hasBackendMetrics
      ? Number(overviewMetrics.dropOffs || 0)
      : roles.reduce((sum, role) => sum + Number(role.dropOffs || 0), 0),
    recruiterLoad: hasBackendMetrics
      ? Number(overviewMetrics.recruiterLoad || 0)
      : recruiters.length,
    agingRoles: hasBackendMetrics
      ? Number(overviewMetrics.agingRoles || 0)
      : roles.filter((role) => Number(role.aging || 0) >= 15).length,
    funnel: hasBackendMetrics ? overviewMetrics.funnel : fallbackFunnel,
  };
}

export function readCachedDashboard(cacheKey, cacheTtlMs) {
  try {
    const raw = window.sessionStorage.getItem(cacheKey);

    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const cachedAt = Number(parsed?.cachedAt || 0);

    if (!cachedAt || Date.now() - cachedAt > cacheTtlMs) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return parsed?.payload && typeof parsed.payload === "object"
      ? parsed.payload
      : null;
  } catch {
    return null;
  }
}

export function writeCachedDashboard(cacheKey, payload) {
  try {
    window.sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ cachedAt: Date.now(), payload }),
    );
  } catch {
    // Session storage is optional and must not block the dashboard.
  }
}
