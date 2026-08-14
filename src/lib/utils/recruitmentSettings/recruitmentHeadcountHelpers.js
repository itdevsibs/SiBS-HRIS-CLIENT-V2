export const RECRUITMENT_HEADCOUNT_PAGE_LIMIT = 15;

export const RECRUITMENT_HEADCOUNT_CLUSTER_OPTIONS = [
  { label: "All Clusters", value: "All" },
  { label: "Coast Dental", value: "Coast Dental" },
  { label: "US Visa", value: "US Visa" },
  { label: "SME", value: "SME" },
  { label: "Yomdel", value: "Yomdel" },
  { label: "Corporate", value: "Corporate" },
];

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

export function canEditRequiredHeadcountByRole(user) {
  const roleCandidates = getUserRoleCandidates(user);
  const adminAccess = getCurrentAdminAccess(user);

  return roleCandidates.some(isHrRoleValue) || adminAccess === 7;
}

export function normalizeStatusValue(value, fallback = "Pending") {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return fallback;

  const normalized = rawValue.toLowerCase();

  if (normalized === "approved") return "Approved";
  if (normalized === "rejected" || normalized === "declined") return "Rejected";
  if (normalized === "pending") return "Pending";
  if (normalized === "for review") return "For Review";
  if (normalized === "no request") return "No Request";
  if (normalized === "kronos") return "Kronos";

  return rawValue;
}

export function getRecruitmentSettingsStatus(item = {}) {
  return normalizeStatusValue(
    item?.recruitmentSettingsStatus ||
      item?.recruitment_settings_status ||
      item?.recruitmentStatus ||
      item?.recruitment_status ||
      item?.baseHeadcountStatus ||
      item?.base_headcount_status ||
      item?.status ||
      "Pending",
    "Pending",
  );
}

export function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Kronos":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}


export function formatDateOnly(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRecruitmentWeekOption(week = {}) {
  const label =
    week.label ||
    week.weekLabel ||
    week.week_label ||
    (week.year && week.weekNumber
      ? `${week.year} Week ${week.weekNumber}`
      : "Weekly Version");

  const range =
    week.weekRange ||
    week.week_range ||
    (week.startDate || week.weekStart
      ? `${formatDateOnly(week.startDate || week.weekStart)} - ${formatDateOnly(
          week.endDate || week.weekEnd,
        )}`
      : "");

  return range ? `${label} — ${range}` : label;
}

export function getActualHeadcount(item) {
  return item?.actualHeadcount ?? item?.actual_headcount ?? 0;
}

export function getOpsPrf(item) {
  return item?.opsPrf ?? item?.ops_prf ?? 0;
}

export function getActualHeadcountNeeds(item) {
  return item?.actualHeadcountNeeds ?? item?.actual_headcount_needs ?? 0;
}

export function getHeadcountNumberValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      const numberValue = Number(value);

      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }
  }

  return 0;
}

export function formatHeadcountPercent(value) {
  const numberValue = Number(value || 0);

  if (Math.abs(numberValue) > 0 && Math.abs(numberValue) <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

export function formatHeadcountNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

export function getActualBufferClass(value) {
  return Number(value || 0) < 0 ? "text-red-700" : "text-emerald-700";
}

export function getRecruitmentAccountName(item = {}) {
  return String(
    item.accountName ||
      item.account ||
      item.account_name ||
      item.gy_acc_name ||
      "Unassigned Account",
  ).trim();
}

export function getRecruitmentClusterName(item = {}) {
  const accountName = getRecruitmentAccountName(item);
  const ghlName = String(
    item.ghlName || item.gy_acc_ghl_name || item.ghl_name || "",
  ).trim();

  const combinedText = `${accountName} ${ghlName}`.toLowerCase();

  if (
    combinedText.includes("cd -") ||
    combinedText.includes("cd-") ||
    combinedText.includes("coast dental")
  ) {
    return "Coast Dental";
  }

  if (combinedText.includes("us visa")) {
    return "US Visa";
  }

  if (
    combinedText.includes("sme-") ||
    combinedText.includes("sme -") ||
    combinedText.includes("frontsteps") ||
    combinedText.includes("front steps")
  ) {
    return "SME";
  }

  if (combinedText.includes("yomdel")) {
    return "Yomdel";
  }

  return String(
    item.clusterName || item.cluster || item.cluster_name || "Corporate",
  ).trim();
}

export function getRecruitmentWeekPercent(week = {}) {
  const value =
    week.hiringPlanPercent ??
    week.hiring_plan_percent ??
    week.displayHiringPlanPercent ??
    week.display_hiring_plan_percent ??
    week.hiringRate ??
    week.hiring_rate ??
    5;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 5;
}

export function getRecruitmentStatusForHeadcountTable(item = {}) {
  const hasExplicitStatus = Boolean(
    item?.recruitmentSettingsStatus ||
      item?.recruitment_settings_status ||
      item?.recruitmentStatus ||
      item?.recruitment_status ||
      item?.baseHeadcountStatus ||
      item?.base_headcount_status ||
      item?.status,
  );

  if (!hasExplicitStatus) return "Kronos";

  return getRecruitmentSettingsStatus(item);
}

export function getRecruitmentHeadcountMetrics(item = {}) {
  const requiredHeadcount = getHeadcountNumberValue(
    item.requiredHeadcount,
    item.required_headcount,
    item.kronosRequiredHeadcount,
    item.kronos_required_headcount,
  );

  const actualHeadcount = getHeadcountNumberValue(
    item.actualHeadcount,
    item.actual_headcount,
  );

  const requiredBufferHeadcount = getHeadcountNumberValue(
    item.requiredBufferHeadcount,
    item.required_buffer_headcount,
    item.bufferHeadcount,
    item.buffer_headcount,
    Math.round(requiredHeadcount * 0.1),
  );

  const requiredBufferPercent = getHeadcountNumberValue(
    item.requiredBufferPercent,
    item.required_buffer_percent,
    item.bufferPercent,
    item.buffer_percent,
    requiredHeadcount > 0
      ? (requiredBufferHeadcount / requiredHeadcount) * 100
      : 0,
  );

  const actualBufferCount = getHeadcountNumberValue(
    item.actualBufferCount,
    item.actual_buffer_count,
    item.missingHeadcount,
    item.missing_headcount,
    actualHeadcount - requiredHeadcount,
  );

  const actualBufferPercent = getHeadcountNumberValue(
    item.actualBufferPercent,
    item.actual_buffer_percent,
    requiredHeadcount > 0 ? (actualBufferCount / requiredHeadcount) * 100 : 0,
  );

  const requiredActualHeadcountWithBuffer = getHeadcountNumberValue(
    item.requiredActualHeadcountWithBuffer,
    item.required_actual_headcount_with_buffer,
    requiredHeadcount + requiredBufferHeadcount,
  );

  const absenteeismPastSixWeeksAverage = getHeadcountNumberValue(
    item.absenteeismPastSixWeeksAverage,
    item.absenteeism_past_six_weeks_average,
    item.absenteeismOpsCount,
    item.absenteeism_ops_count,
    item.absenteeismCount,
    item.absenteeism_count,
  );

  const attritionPastSixWeeksAverage = getHeadcountNumberValue(
    item.attritionPastSixWeeksAverage,
    item.attrition_past_six_weeks_average,
    item.attritionPastCount,
    item.attrition_past_count,
  );

  const opsPrf = getHeadcountNumberValue(item.opsPrf, item.ops_prf);

  const actualHeadcountNeeds = getHeadcountNumberValue(
    item.actualHeadcountNeeds,
    item.actual_headcount_needs,
    requiredBufferHeadcount +
      absenteeismPastSixWeeksAverage +
      attritionPastSixWeeksAverage +
      opsPrf,
  );

  const hiringRate = getHeadcountNumberValue(
    item.hiringRate,
    item.hiring_rate,
    item.hiringPlanPercent,
    item.hiring_plan_percent,
    5,
  );

  const leadsToInterview = getHeadcountNumberValue(
    item.leadsToInterview,
    item.leads_to_interview,
    actualHeadcountNeeds > 0 && hiringRate > 0
      ? Math.round(actualHeadcountNeeds / (hiringRate / 100))
      : 0,
  );

  return {
    requiredHeadcount,
    actualHeadcount,
    requiredBufferHeadcount,
    requiredBufferPercent,
    actualBufferCount,
    actualBufferPercent,
    requiredActualHeadcountWithBuffer,
    absenteeismPastSixWeeksAverage,
    attritionPastSixWeeksAverage,
    opsPrf,
    actualHeadcountNeeds,
    leadsToInterview,
    hiringRate,
  };
}

