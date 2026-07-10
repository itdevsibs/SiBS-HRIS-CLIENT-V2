import { FULL_WEEKLY_ACCESS_ROLES } from "./workforceHiringPlanConstants";

export function getText(value) {
  return String(value || "").trim();
}

export function normalizeRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function getLocalStorageValue(keys = []) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

export function getFirstFilledValue(values = []) {
  for (const value of values) {
    const cleanValue = String(value ?? "").trim();

    if (cleanValue) return cleanValue;
  }

  return "";
}

export function getUserRoleCandidates(user) {
  return [
    user?.role,
    user?.userRole,
    user?.user_role,
    user?.adminRole,
    user?.admin_role,
    user?.roleName,
    user?.role_name,
    user?.userRoleName,
    user?.user_role_name,
    user?.position,
    user?.positionName,
    user?.position_name,
    user?.jobTitle,
    user?.job_title,
    user?.designation,
    user?.employeeRole,
    user?.employee_role,
    user?.department,
    user?.departmentName,
    user?.department_name,
    user?.deptName,
    user?.dept_name,
    getLocalStorageValue([
      "role",
      "userRole",
      "user_role",
      "adminRole",
      "admin_role",
      "roleName",
      "role_name",
      "userRoleName",
      "user_role_name",
      "position",
      "positionName",
      "position_name",
      "jobTitle",
      "job_title",
      "designation",
      "employeeRole",
      "employee_role",
      "department",
      "departmentName",
      "department_name",
      "deptName",
      "dept_name",
    ]),
  ].filter((value) => String(value ?? "").trim() !== "");
}

export function getCurrentRoleKey(user) {
  return normalizeRoleKey(getFirstFilledValue(getUserRoleCandidates(user)));
}

export function getCurrentAdminAccess(user) {
  const value =
    user?.adminAccess ??
    user?.admin_access ??
    user?.gy_user_access ??
    user?.access ??
    user?.adminLevel ??
    user?.admin_level ??
    user?.adminAccessLevel ??
    user?.admin_access_level ??
    user?.isAdmin ??
    user?.is_admin ??
    getLocalStorageValue([
      "adminAccess",
      "admin_access",
      "gy_user_access",
      "access",
      "adminLevel",
      "admin_level",
      "adminAccessLevel",
      "admin_access_level",
      "isAdmin",
      "is_admin",
    ]) ??
    0;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function isHrRoleValue(value) {
  const role = normalizeRoleKey(value);

  if (!role) return false;

  if (
    [
      "hr",
      "hr_admin",
      "hradmin",
      "hr_manager",
      "hr_staff",
      "human_resources",
      "human_resource",
      "human_resources_admin",
      "human_resource_admin",
      "super_admin",
      "superadmin",
    ].includes(role)
  ) {
    return true;
  }

  if (role.includes("human_resource")) return true;
  if (role.includes("human_resources")) return true;

  return role.startsWith("hr_") || role.endsWith("_hr");
}

export function isHrEditorByUser(user) {
  const roleCandidates = getUserRoleCandidates(user);
  const adminAccess = getCurrentAdminAccess(user);

  return roleCandidates.some(isHrRoleValue) || adminAccess === 7;
}

export function canManageHiringPlanByRole(user) {
  return isHrEditorByUser(user);
}

export function canViewAllWeeklyAccounts(user) {
  const roleCandidates = getUserRoleCandidates(user);
  const adminAccess = getCurrentAdminAccess(user);

  return (
    roleCandidates.some((value) => {
      const role = normalizeRoleKey(value);

      return (
        FULL_WEEKLY_ACCESS_ROLES.includes(role) ||
        role.includes("human_resource") ||
        role.includes("human_resources")
      );
    }) || adminAccess === 7
  );
}

export function getAccountIdFromAny(item) {
  return getText(
    item?.backendAccountId ||
      item?.accountId ||
      item?.account_id ||
      item?.gy_acc_id ||
      item?.id ||
      "",
  );
}

export function getAccountNameFromAny(item) {
  return getText(
    item?.accountName ||
      item?.account ||
      item?.gy_acc_name ||
      item?.account_name ||
      item?.name ||
      "",
  );
}

export function getGhlNameFromAny(item) {
  return getText(
    item?.ghlName || item?.gy_acc_ghl_name || item?.ghl_name || "",
  );
}

export function getClusterFromAny(item) {
  const accountName = getAccountNameFromAny(item);
  const ghlName = getGhlNameFromAny(item);
  const text = `${accountName} ${ghlName}`.toLowerCase();

  if (
    text.includes("cd -") ||
    text.includes("cd-") ||
    text.includes("coast dental")
  ) {
    return "Coast Dental";
  }

  if (text.includes("us visa")) return "US Visa";

  if (
    text.includes("sme-") ||
    text.includes("sme -") ||
    text.includes("frontsteps") ||
    text.includes("front steps")
  ) {
    return "SME";
  }

  if (text.includes("yomdel")) return "Yomdel";

  const explicitCluster = getText(item?.clusterName || item?.cluster);

  if (explicitCluster) return explicitCluster;

  return "Corporate";
}

export function getBackendNumber(record, keys, fallback = 0) {
  for (const key of keys) {
    const rawValue = record?.[key];

    if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
      const cleanValue = String(rawValue)
        .replace(/,/g, "")
        .replace(/%/g, "")
        .trim();
      const numberValue = Number(cleanValue);

      if (Number.isFinite(numberValue)) return numberValue;
    }
  }

  const fallbackNumber = Number(fallback || 0);

  return Number.isFinite(fallbackNumber) ? fallbackNumber : 0;
}

export function getBackendArrayValue(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function getBackendSixWeekSeries(record = {}, type = "absenteeism") {
  const arrayKeys =
    type === "absenteeism"
      ? [
          "absenteeismTrend",
          "absenteeism_trend",
          "absenteeismWeeklyCounts",
          "absenteeism_weekly_counts",
          "absenteeismPastSixWeeksTrend",
          "absenteeism_past_six_weeks_trend",
          "absenteeismSixWeeksBreakdown",
          "absenteeism_six_weeks_breakdown",
          "absenteeismPastSixWeeksBreakdown",
          "absenteeism_past_six_weeks_breakdown",
          "weeklyAbsenteeism",
          "weekly_absenteeism",
        ]
      : [
          "attritionTrend",
          "attrition_trend",
          "attritionWeeklyCounts",
          "attrition_weekly_counts",
          "attritionPastSixWeeksTrend",
          "attrition_past_six_weeks_trend",
          "attritionSixWeeksBreakdown",
          "attrition_six_weeks_breakdown",
          "attritionPastSixWeeksBreakdown",
          "attrition_past_six_weeks_breakdown",
          "weeklyAttrition",
          "weekly_attrition",
        ];

  for (const key of arrayKeys) {
    const series = getBackendArrayValue(record?.[key])
      .map((value) => Number(value || 0))
      .filter((value) => Number.isFinite(value));

    if (series.length > 0) {
      return series.length >= 6
        ? series.slice(-6)
        : [...Array.from({ length: 6 - series.length }, () => 0), ...series];
    }
  }

  const prefix = type === "absenteeism" ? "absenteeism" : "attrition";

  return [1, 2, 3, 4, 5, 6].map((weekNumber) =>
    getBackendNumber(record, [
      `${prefix}Week${weekNumber}`,
      `${prefix}_week_${weekNumber}`,
      `week${weekNumber}${type === "absenteeism" ? "Absenteeism" : "Attrition"}`,
      `week_${weekNumber}_${type}`,
      `w${weekNumber}${type === "absenteeism" ? "Absenteeism" : "Attrition"}`,
      `${prefix}W${weekNumber}`,
    ]),
  );
}

export function calculateActualHiringRatePercent({
  fstCount = 0,
  interviewCount = 0,
}) {
  const cleanFstCount = Number(fstCount || 0);
  const cleanInterviewCount = Number(interviewCount || 0);

  if (!Number.isFinite(cleanFstCount) || !Number.isFinite(cleanInterviewCount)) {
    return 0;
  }

  if (cleanFstCount <= 0 || cleanInterviewCount <= 0) return 0;

  return cleanFstCount / cleanInterviewCount;
}

export function calculateLeadsFromInterview({
  interviewCount = 0,
  hiringRate = 0,
}) {
  const cleanInterviewCount = Math.max(0, Number(interviewCount || 0));
  const cleanHiringRate = Number(hiringRate || 0);

  if (!Number.isFinite(cleanInterviewCount) || cleanInterviewCount <= 0) {
    return 0;
  }

  if (!Number.isFinite(cleanHiringRate) || cleanHiringRate <= 0) {
    return cleanInterviewCount;
  }

  return Math.ceil(cleanInterviewCount / cleanHiringRate);
}

export function normalizeStatusValue(value, fallback = "") {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return fallback;

  const normalized = rawValue.toLowerCase();

  if (normalized === "approved") return "Approved";
  if (normalized === "rejected" || normalized === "declined") return "Rejected";
  if (normalized === "pending") return "Pending";

  return rawValue;
}

export function getRecruitmentSettingsStatus(record = {}) {
  return normalizeStatusValue(
    record?.recruitmentSettingsStatus ||
      record?.recruitment_settings_status ||
      record?.recruitmentStatus ||
      record?.recruitment_status ||
      record?.baseHeadcountStatus ||
      record?.base_headcount_status ||
      record?.status ||
      "Kronos",
    "Kronos",
  );
}

export function getUpdateHeadcountStatus(record = {}) {
  const rawStatus =
    record?.updateHeadcountStatus ||
    record?.update_headcount_status ||
    record?.managerUpdateStatus ||
    record?.manager_update_status ||
    "";

  if (!rawStatus) return "";

  return normalizeStatusValue(rawStatus, "");
}

export function hasPendingUpdateHeadcountRequest(record = {}) {
  return String(getUpdateHeadcountStatus(record)).toLowerCase() === "pending";
}

export function getHeadcountApprovalStatus(record = {}) {
  return (
    getUpdateHeadcountStatus(record) ||
    getRecruitmentSettingsStatus(record) ||
    "Kronos"
  );
}

export function isApprovedRecruitmentSettingsRequest(item = {}) {
  return (
    String(getRecruitmentSettingsStatus(item)).trim().toLowerCase() ===
    "approved"
  );
}

export function hasActiveRecruitmentSettingsRequest(items = []) {
  return (items || []).some((item) => {
    const recruitmentStatus = String(getRecruitmentSettingsStatus(item))
      .trim()
      .toLowerCase();

    const updateStatus = String(getUpdateHeadcountStatus(item))
      .trim()
      .toLowerCase();

    return recruitmentStatus === "pending" || updateStatus === "pending";
  });
}

export function canManagerUpdateApprovedHeadcount({
  item,
  canEditRequiredHeadcount,
  weeklyAccess,
}) {
  if (!canEditRequiredHeadcount) return false;
  if (!item || weeklyAccess?.hasFullAccess) return false;

  return isApprovedRecruitmentSettingsRequest(item);
}

export function getDisplayRequiredHeadcount(record = {}) {
  const recruitmentStatus = getRecruitmentSettingsStatus(record);

  const kronosRequiredHeadcount = getBackendNumber(
    record,
    [
      "kronosRequiredHeadcount",
      "kronos_required_headcount",
      "kronosBasedRequiredHeadcount",
      "kronos_based_required_headcount",
      "kronosHeadcount",
      "kronos_headcount",
    ],
    getBackendNumber(record, ["requiredHeadcount", "required_headcount"]),
  );

  const approvedRequiredHeadcount = getBackendNumber(record, [
    "approvedRequiredHeadcount",
    "approved_required_headcount",
    "requiredHeadcount",
    "required_headcount",
  ]);

  if (String(recruitmentStatus).trim().toLowerCase() === "approved") {
    return approvedRequiredHeadcount;
  }

  return kronosRequiredHeadcount;
}

export function getLoggedInOwnerDisplay(user) {
  const sibsId = String(
    user?.username ||
      user?.sibsId ||
      user?.sibs_id ||
      user?.gy_user_code ||
      getLocalStorageValue(["username", "sibsId", "sibs_id", "userCode"]) ||
      "",
  ).trim();

  const lastName = String(
    user?.gy_emp_lname || user?.lastName || user?.last_name || "",
  ).trim();

  const firstName = String(
    user?.gy_emp_fname || user?.firstName || user?.first_name || "",
  ).trim();

  const middleName = String(
    user?.gy_emp_mname || user?.middleName || user?.middle_name || "",
  ).trim();

  const fallbackFullName = getLocalStorageValue(["fullName", "full_name"]);

  const fullName =
    `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ""}`
      .replace(/\s+/g, " ")
      .trim() || fallbackFullName;

  if (!sibsId && !fullName) return "-";
  if (!fullName) return sibsId.toUpperCase();

  return `${sibsId} - ${fullName}`.toUpperCase();
}

export function calculatePipelineStatus(item) {
  const requiredHeadcount = Number(item.requiredHeadcount || 0);
  const hiringNeeded = Number(
    item.hiringNeeded ||
      item.hiring_needed ||
      item.actualHeadcountNeeds ||
      item.actual_headcount_needs ||
      0,
  );
  const leadsToInterview = Number(item.leadsToInterview || 0);

  if (requiredHeadcount <= 0) return "Pending";
  if (hiringNeeded <= 0) return "Completed";
  if (leadsToInterview > 0) return "At Risk";

  return "Delayed";
}

export function buildWeekKey(week) {
  const startDate = String(week?.startDate || week?.weekStart || "").trim();
  const endDate = String(week?.endDate || week?.weekEnd || "").trim();

  return `${startDate}__${endDate}`;
}

export function getWeekHiringPlanPercent(week) {
  const value =
    week?.hiringPlanPercent ??
    week?.hiring_plan_percent ??
    week?.hiringRate ??
    week?.hiring_rate ??
    5;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 5;
}

export function buildWeeklyAccess(user) {
  const role = getCurrentRoleKey(user);
  const hasFullAccess = FULL_WEEKLY_ACCESS_ROLES.includes(role);

  const assignedAccounts = Array.isArray(user?.assignedAccounts)
    ? user.assignedAccounts
    : [];

  const assignedAccountIds = new Set(
    assignedAccounts.map((account) => getAccountIdFromAny(account)).filter(Boolean),
  );

  const assignedAccountNames = new Set(
    assignedAccounts
      .map((account) => getAccountNameFromAny(account))
      .filter(Boolean),
  );

  const assignedClusterNames = new Set(
    assignedAccounts.map((account) => getClusterFromAny(account)).filter(Boolean),
  );

  return {
    role,
    hasFullAccess,
    assignedAccounts,
    assignedAccountIds,
    assignedAccountNames,
    assignedClusterNames,
  };
}
