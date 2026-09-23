function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeStatus(value) {
  return String(value ?? "").trim().toLowerCase() === "active"
    ? "active"
    : "inactive";
}

function normalizeDepartment(row = {}) {
  const lead = row.lead && typeof row.lead === "object"
    ? {
        sibsId: toText(row.lead.sibsId),
        name: toText(row.lead.name, "Supervisor unavailable"),
        email: toText(row.lead.email),
        title: toText(row.lead.title, "Primary Department Supervisor"),
        supervisedStaff: toNumber(row.lead.supervisedStaff),
      }
    : null;

  return {
    id: toText(row.id),
    code: toText(row.code, "DEP-000"),
    name: toText(row.name, "Unnamed Department"),
    status: normalizeStatus(row.status),
    totalAccounts: toNumber(row.totalAccounts),
    activeAccounts: toNumber(row.activeAccounts),
    inactiveAccounts: toNumber(row.inactiveAccounts),
    description: toText(
      row.description,
      "Workforce and linked-account reporting from Kronos.",
    ),
    totalStaff: toNumber(row.totalStaff),
    activeStaff: toNumber(row.activeStaff),
    staffCoverage: toNumber(row.staffCoverage),
    locations: Array.isArray(row.locations)
      ? row.locations.map((location) => toText(location)).filter(Boolean)
      : [],
    primaryLocation: toText(row.primaryLocation, "Location unavailable"),
    lead,
    accounts: Array.isArray(row.accounts)
      ? row.accounts.map((account) => ({
          id: toText(account.id),
          code: toText(account.code, "ACC-000"),
          name: toText(account.name, "Unnamed Account"),
          longName: toText(account.longName),
          status: normalizeStatus(account.status),
          statusCode: toNumber(account.statusCode),
        }))
      : [],
    budget: row.budget ?? null,
  };
}

export function normalizeDepartmentDirectoryResponse(payload = {}) {
  const summary = payload.summary || {};
  const pagination = payload.pagination || {};

  return {
    summary: {
      totalDepartments: toNumber(summary.totalDepartments),
      totalAccounts: toNumber(summary.totalAccounts),
      activeAccounts: toNumber(summary.activeAccounts),
      inactiveAccounts: toNumber(summary.inactiveAccounts),
      activeRate: toNumber(summary.activeRate),
    },
    departments: Array.isArray(payload.data)
      ? payload.data.map(normalizeDepartment)
      : [],
    pagination: {
      page: Math.max(1, toNumber(pagination.page) || 1),
      limit: Math.max(1, toNumber(pagination.limit) || 6),
      total: toNumber(pagination.total),
      totalPages: Math.max(1, toNumber(pagination.totalPages) || 1),
    },
  };
}

export function normalizeDepartmentDetailsResponse(payload = {}) {
  const data = payload.data || payload || {};
  const department = normalizeDepartment(data);

  return {
    ...department,
  };
}
