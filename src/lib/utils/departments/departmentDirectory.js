<<<<<<< HEAD
function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeDepartment(department = {}) {
  const departmentId = cleanText(
    department.departmentId || department.department_id || department.id,
  );
  const departmentName = cleanText(
    department.departmentName ||
      department.department ||
      department.name_department,
  );

  return {
    departmentId,
    departmentName: departmentName || "Unassigned Department",
  };
}

function normalizeAccount(account = {}) {
  const accountId = cleanText(
    account.accountId || account.account_id || account.gy_acc_id || account.id,
  );
  const accountName = cleanText(
    account.accountName ||
      account.account_name ||
      account.gy_acc_name ||
      account.account,
  );
  const departmentId = cleanText(
    account.departmentId ||
      account.department_id ||
      account.gy_dept_id,
  );
  const departmentName = cleanText(
    account.departmentName ||
      account.department ||
      account.name_department,
  );
  const ghlName = cleanText(
    account.ghlName || account.ghl_name || account.gy_acc_ghl_name,
  );
  const clusterName = cleanText(account.clusterName || account.cluster_name);
  const employeeCountValue = Number(
    account.employeeCount ?? account.employee_count ?? 0,
  );
  const employeeCount = Number.isFinite(employeeCountValue)
    ? Math.max(0, Math.trunc(employeeCountValue))
    : 0;

  return {
    accountId,
    accountName: accountName || `Account ${accountId || "—"}`,
    departmentId,
    departmentName,
    ghlName,
    clusterName,
    employeeCount,
  };
}

export function buildDepartmentDirectory(departments = [], accounts = []) {
  const grouped = new Map();

  (Array.isArray(departments) ? departments : []).forEach((department) => {
    const normalized = normalizeDepartment(department);
    const key = normalized.departmentId || `name:${normalized.departmentName.toLowerCase()}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...normalized,
        accounts: [],
      });
    }
  });

  (Array.isArray(accounts) ? accounts : []).forEach((account) => {
    const normalized = normalizeAccount(account);
    const departmentKey = normalized.departmentId;
    const nameKey = normalized.departmentName
      ? `name:${normalized.departmentName.toLowerCase()}`
      : "";

    let key = departmentKey && grouped.has(departmentKey) ? departmentKey : "";

    if (!key && nameKey && grouped.has(nameKey)) {
      key = nameKey;
    }

    if (!key) {
      key = departmentKey || nameKey || "unassigned";

      if (!grouped.has(key)) {
        grouped.set(key, {
          departmentId: normalized.departmentId,
          departmentName:
            normalized.departmentName || "Unassigned Department",
          accounts: [],
        });
      }
    }

    grouped.get(key).accounts.push(normalized);
  });

  return Array.from(grouped.values())
    .map((department) => ({
      ...department,
      accounts: [...department.accounts].sort((left, right) =>
        left.accountName.localeCompare(right.accountName, undefined, {
          sensitivity: "base",
        }),
      ),
    }))
    .sort((left, right) =>
      left.departmentName.localeCompare(right.departmentName, undefined, {
        sensitivity: "base",
      }),
    );
}

export function filterDepartmentDirectory(directory = [], search = "") {
  const keyword = cleanText(search).toLowerCase();
  if (!keyword) return Array.isArray(directory) ? directory : [];

  return (Array.isArray(directory) ? directory : []).filter((department) => {
    const departmentSearchText = [
      department.departmentId,
      department.departmentName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (departmentSearchText.includes(keyword)) return true;

    return (department.accounts || []).some((account) =>
      [
        account.accountId,
        account.accountName,
        account.ghlName,
        account.clusterName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  });
}

export function getDepartmentDirectorySummary(directory = []) {
  const rows = Array.isArray(directory) ? directory : [];

  return {
    totalDepartments: rows.length,
    totalActiveAccounts: rows.reduce(
      (sum, department) => sum + (department.accounts?.length || 0),
      0,
    ),
    departmentsWithAccounts: rows.filter(
      (department) => (department.accounts?.length || 0) > 0,
    ).length,
=======
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
>>>>>>> 3051378 (updates)
  };
}
