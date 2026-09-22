function cleanText(value) {
  return String(value ?? "").trim();
}

function firstValue(...values) {
  return values.find((value) => cleanText(value)) ?? "";
}

export function normalizeHiringNeedsStatus(status) {
  const value = cleanText(status);

  if (!value) return "For Approval";
  if (/expired/i.test(value)) return "Expired";
  if (/not\s*approved|rejected|declined/i.test(value)) return "Not Approved";
  if (/approved/i.test(value)) return "Approved";
  if (/pending|for\s*approval|review/i.test(value)) return "For Approval";

  return value;
}

export function getHiringNeedsApprovalStatusLabel(item = {}) {
  const effectiveStatus = normalizeHiringNeedsStatus(
    item.approvalStatus ||
      item.approval_status ||
      item.hiringNeedStatus ||
      item.hiring_need_status,
  );

  const decisionStatus = normalizeHiringNeedsStatus(
    item.approvalDecisionStatus ||
      item.approval_decision_status ||
      item.originalApprovalStatus ||
      item.original_approval_status,
  );

  const isExpired =
    item.isExpired === true ||
    item.is_expired === true ||
    effectiveStatus === "Expired";

  if (isExpired && decisionStatus === "Approved") {
    return "Approved · Expired";
  }

  return effectiveStatus;
}

export function normalizeHiringNeedsJdLinkStatus(status) {
  const value = cleanText(status).toLowerCase();

  if (
    value === "unlinked from jd" ||
    value === "unlinked from job description" ||
    value === "unlinked from job descriptions" ||
    value === "unlinked"
  ) {
    return "Unlinked from JD";
  }

  return "Linked";
}

export function getHiringNeedsJdLinkStatus(item = {}) {
  if (getHiringNeedsRequestType(item).toLowerCase() === "downsize") {
    return "Not Applicable";
  }

  return normalizeHiringNeedsJdLinkStatus(
    item.jdLinkStatus ||
      item.jd_link_status ||
      item.raw?.jdLinkStatus ||
      item.raw?.jd_link_status,
  );
}

export function isHiringNeedUnlinkedFromJd(item = {}) {
  return getHiringNeedsJdLinkStatus(item) === "Unlinked from JD";
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

  if (value === "Expired") {
    return "border-slate-300 bg-slate-100 text-slate-700";
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

export function getHiringNeedsSuccessfulHeadcount(item = {}) {
  const value = firstValue(
    item.successfulHeadcount,
    item.successful_headcount,
    item.fulfilledHeadcount,
    item.fulfilled_headcount,
  );

  const count = Number(value || 0);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

export function getHiringNeedsRemainingHeadcount(item = {}) {
  const explicit = firstValue(
    item.remainingHeadcount,
    item.remaining_headcount,
  );

  if (cleanText(explicit)) {
    const count = Number(explicit);
    return Number.isFinite(count) && count >= 0 ? count : 0;
  }

  return Math.max(
    Number(getHiringNeedsHeadcount(item) || 0) -
      getHiringNeedsSuccessfulHeadcount(item),
    0,
  );
}

export function getHiringNeedsFulfillmentStatus(item = {}) {
  return (
    firstValue(
      item.headcountFulfillmentStatus,
      item.headcount_fulfillment_status,
    ) ||
    (getHiringNeedsRemainingHeadcount(item) === 0 &&
    Number(getHiringNeedsHeadcount(item) || 0) > 0
      ? "Filled"
      : getHiringNeedsSuccessfulHeadcount(item) > 0
        ? "In Progress"
        : "Open")
  );
}

export function getHiringNeedsSuccessfulHeadcountLabel(item = {}) {
  const required = Number(getHiringNeedsHeadcount(item) || 0);
  const successful = getHiringNeedsSuccessfulHeadcount(item);
  return `Successful HC ${successful}/${required}`;
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

function formatHiringNeedsDate(value) {
  const text = cleanText(value);

  if (!text) return "";

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);

  if (!match) return text;

  const [, year, month, day] = match;
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);

  if (
    monthIndex < 0 ||
    monthIndex > 11 ||
    !Number.isInteger(dayNumber) ||
    dayNumber < 1 ||
    dayNumber > 31
  ) {
    return text;
  }

  return `${monthNames[monthIndex]} ${dayNumber}, ${year}`;
}

export function getHiringNeedsDateOrWeek(item = {}) {
  const value = firstValue(
    item.dateNeeded,
    item.date_needed,
    item.weekNeeded,
    item.week_needed,
    item.targetWeek,
    item.target_week,
    item.week,
  );

  return formatHiringNeedsDate(value) || "--";
}

export function getHiringNeedsSearchText(item = {}) {
  return [
    item.id,
    getHiringNeedsRequestType(item),
    getHiringNeedsDepartmentAccount(item),
    getHiringNeedsTitle(item),
    getHiringNeedsSubtitle(item),
    getHiringNeedsHeadcount(item),
    getHiringNeedsSuccessfulHeadcountLabel(item),
    getHiringNeedsFulfillmentStatus(item),
    getHiringNeedsReason(item),
    getHiringNeedsSite(item),
    getHiringNeedsDateOrWeek(item),
    normalizeHiringNeedsStatus(item.approvalStatus || item.approval_status),
    getHiringNeedsJdLinkStatus(item),
  ]
    .map((value) => cleanText(value).toLowerCase())
    .join(" ");
}
