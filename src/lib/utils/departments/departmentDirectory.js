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

function normalizeProfileFields(row = {}) {
  return {
    employeeProfileId: toText(
      row.employeeProfileId ?? row.employee_profile_id,
    ),
    employee_profile_id: toText(
      row.employee_profile_id ?? row.employeeProfileId,
    ),
    profileFilename: toText(
      row.profileFilename ?? row.profile_filename,
    ),
    profile_filename: toText(
      row.profile_filename ?? row.profileFilename,
    ),
    profilePicture: toText(
      row.profilePicture ??
        row.profile_picture ??
        row.profileFilename ??
        row.profile_filename,
    ),
    profile_picture: toText(
      row.profile_picture ??
        row.profilePicture ??
        row.profile_filename ??
        row.profileFilename,
    ),
    profilePictureUrl: toText(
      row.profilePictureUrl ?? row.profile_picture_url,
    ),
    profile_picture_url: toText(
      row.profile_picture_url ?? row.profilePictureUrl,
    ),
  };
}

function normalizeDepartment(row = {}) {
  const lead = row.lead && typeof row.lead === "object"
    ? {
        sibsId: toText(row.lead.sibsId),
        name: toText(row.lead.name, "Supervisor unavailable"),
        email: toText(row.lead.email),
        title: toText(row.lead.title, "Primary Department Supervisor"),
        supervisedStaff: toNumber(row.lead.supervisedStaff),
        ...normalizeProfileFields(row.lead),
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
          employeeCount: toNumber(account.employeeCount),
          activeEmployeeCount: toNumber(account.activeEmployeeCount),
          lobCount: toNumber(account.lobCount),
          lobNames: Array.isArray(account.lobNames)
            ? account.lobNames.map((name) => toText(name)).filter(Boolean)
            : [],
          teamLeaderCount: toNumber(
            account.teamLeaderCount ??
              (Array.isArray(account.teamLeaders) ? account.teamLeaders.length : 0),
          ),
          teamLeaders: Array.isArray(account.teamLeaders)
            ? account.teamLeaders.map((leader) => ({
                sibsId: toText(leader.sibsId),
                userId: toNumber(leader.userId),
                name: toText(leader.name, "Team Leader"),
                email: toText(leader.email),
                title: toText(leader.title, "Team Leader"),
                teamMemberCount: toNumber(leader.teamMemberCount),
                ...normalizeProfileFields(leader),
              }))
            : [],
          operationsManagerCount: toNumber(
            account.operationsManagerCount ??
              (Array.isArray(account.operationsManagers) ? account.operationsManagers.length : 0),
          ),
          operationsManagers: Array.isArray(account.operationsManagers)
            ? account.operationsManagers.map((manager) => ({
                sibsId: toText(manager.sibsId),
                userId: toNumber(manager.userId),
                name: toText(manager.name, "Operations Manager"),
                email: toText(manager.email),
                title: toText(manager.title, "Operations Manager"),
                ...normalizeProfileFields(manager),
              }))
            : [],
          seniorOperationsManagerCount: toNumber(
            account.seniorOperationsManagerCount ??
              (Array.isArray(account.seniorOperationsManagers)
                ? account.seniorOperationsManagers.length
                : 0),
          ),
          seniorOperationsManagers: Array.isArray(account.seniorOperationsManagers)
            ? account.seniorOperationsManagers.map((manager) => ({
                sibsId: toText(manager.sibsId),
                userId: toNumber(manager.userId),
                name: toText(manager.name, "Senior Operations Manager"),
                email: toText(manager.email),
                title: toText(manager.title, "Senior Operations Manager"),
                ...normalizeProfileFields(manager),
              }))
            : [],
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
