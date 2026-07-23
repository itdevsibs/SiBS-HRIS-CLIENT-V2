function cleanText(value) {
  return String(value ?? "").trim();
}

function firstValue(...values) {
  return values.find((value) => cleanText(value)) ?? "";
}

export function normalizeHiringNeedsStatus(status) {
  const value = cleanText(status);

  if (!value) return "For Approval";
  if (/not\s*approved|rejected|declined/i.test(value)) return "Not Approved";
  if (/approved/i.test(value)) return "Approved";
  if (/pending|for\s*approval|review/i.test(value)) return "For Approval";

  return value;
}

export function getHiringNeedsRequestType(item = {}) {
  return (
    firstValue(
      item.requestType,
      item.request_type,
      item.type,
      item.prfType,
      item.prf_type,
    ) || "Requisition"
  );
}

export function getHiringNeedsRequestTypeClass(type) {
  const value = cleanText(type).toLowerCase();

  if (value.includes("downsize")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value.includes("replacement")) {
    return "border-blue-200 bg-blue-50 text-[#042C51]";
  }

  return "border-[#D7E8FF] bg-[#EFF6FF] text-[#1D4ED8]";
}

export function getHiringNeedsStatusClass(status) {
  const value = normalizeHiringNeedsStatus(status);

  if (value === "Approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "Not Approved") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function getHiringNeedsDepartmentAccount(item = {}) {
  const department = firstValue(
    item.department,
    item.departmentName,
    item.department_name,
    item.name_department,
  );
  const account = firstValue(
    item.account,
    item.accountName,
    item.account_name,
    item.gy_acc_name,
    item.client,
  );

  if (department && account) return `${department} / ${account}`;
  return department || account || "--";
}

export function getHiringNeedsTitle(item = {}) {
  return (
    firstValue(
      item.positionTitle,
      item.position_title,
      item.jobDescription,
      item.job_description,
      item.jobDescriptionTitle,
      item.job_description_title,
      item.roleTitle,
      item.role_title,
      item.title,
    ) || "Untitled Request"
  );
}

export function getHiringNeedsSubtitle(item = {}) {
  return firstValue(
    item.subtitle,
    item.jdCode,
    item.jd_code,
    item.hiringNeedCode,
    item.hiring_need_code,
    item.description,
  );
}

export function getHiringNeedsHeadcount(item = {}) {
  return (
    firstValue(
      item.headcount,
      item.requiredHeadcount,
      item.required_headcount,
      item.totalPersonnel,
      item.total_personnel,
      item.count,
    ) || 0
  );
}

export function getHiringNeedsReason(item = {}) {
  return (
    firstValue(
      item.reasonForHiring,
      item.reason_for_hiring,
      item.reason,
      item.hiringReason,
      item.hiring_reason,
    ) || "--"
  );
}

export function getHiringNeedsSite(item = {}) {
  return (
    firstValue(
      item.locationSite,
      item.location_site,
      item.site,
      item.location,
      item.workSite,
      item.work_site,
    ) || "--"
  );
}

export function getHiringNeedsDateOrWeek(item = {}) {
  return (
    firstValue(
      item.dateNeeded,
      item.date_needed,
      item.weekNeeded,
      item.week_needed,
      item.targetWeek,
      item.target_week,
      item.week,
    ) || "--"
  );
}

export function getHiringNeedsSearchText(item = {}) {
  return [
    item.id,
    getHiringNeedsRequestType(item),
    getHiringNeedsDepartmentAccount(item),
    getHiringNeedsTitle(item),
    getHiringNeedsSubtitle(item),
    getHiringNeedsHeadcount(item),
    getHiringNeedsReason(item),
    getHiringNeedsSite(item),
    getHiringNeedsDateOrWeek(item),
    normalizeHiringNeedsStatus(item.approvalStatus || item.approval_status),
  ]
    .map((value) => cleanText(value).toLowerCase())
    .join(" ");
}
