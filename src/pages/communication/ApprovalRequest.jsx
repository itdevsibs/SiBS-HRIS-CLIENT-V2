import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  ListChecks,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Search,
  UserRoundCheck,
  X,
  XCircle,
} from "lucide-react";

import Header from "../../components/layout/Header";
import StatusModal from "../../components/modals/StatusModal";
import JobDescriptionRequestTable from "../../components/tables/jobDescription/JobDescriptionRequestTable";
import PaginationTable from "@/services/pagination/PaginationTable";
import { useJobDescription } from "../../services/context/JobDescriptionContext";
import { useUser } from "../../services/context/UserContext";
import { getJobDescriptionApprovalUsers } from "../../lib/axios/getJobDescriptionApprovalSettings";
import { getHiringNeedsApprovalUsers } from "../../lib/axios/getHiringNeedsApprovalSettings";
import { getAvailablePositionApprovalUsers } from "../../lib/axios/getAvailablePositionApprovalSettings";

import {
  getApprovalRequestsByModule,
  approveRequestByModule,
  rejectRequestByModule,
} from "../../lib/axios/getApprovalRequest";

const REQUEST_MODULES = [
  "Attrition",
  "Job Description",
  "Hiring Needs",
  "Available Positions",
];

const STATUS_OPTIONS = ["All", "Pending", "For Review", "Approved", "Rejected"];

const TYPE_OPTIONS_BY_MODULE = {
  Attrition: ["All", "Resignation", "Attrition"],
  "Job Description": ["All", "Job Description"],
  "Hiring Needs": ["All", "Requisition", "Downsize"],
  "Available Positions": ["All", "Available Position"],
};

const APPROVAL_NOTIFICATION_TYPES_BY_MODULE = {
  Attrition: ["Resignation", "Attrition"],
  "Job Description": ["Job Description"],
  "Hiring Needs": ["Hiring Needs"],
  "Available Positions": ["Available Position"],
};

const moduleIconMap = {
  Attrition: UserRoundCheck,
  "Job Description": FileText,
  "Hiring Needs": BriefcaseBusiness,
  "Available Positions": ClipboardList,
};

function getApprovalApiModuleName(moduleName = "") {
  return moduleName === "Available Positions"
    ? "Available Position"
    : moduleName;
}

const DEFAULT_COUNTS = {
  total: 0,
  pending: 0,
  forReview: 0,
  approved: 0,
  rejected: 0,
};

const DEFAULT_MODULE_NOTIFICATION_COUNTS = REQUEST_MODULES.reduce(
  (acc, moduleName) => ({
    ...acc,
    [moduleName]: 0,
  }),
  {},
);

const PAGE_LIMIT = 15;

const EDGE = "rounded-[10px]";
const PANEL_BORDER = "border border-[#E1E7EF]";
const SOFT_PANEL_BORDER = "border border-[#E8EEF5]";
const FLAT_BG = "bg-inherit";

const API_URL = String(
  import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000",
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function safeText(value, fallback = "--") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function collectSearchableValues(value, output = [], depth = 0) {
  if (depth > 4 || value === null || value === undefined) return output;

  const valueType = typeof value;

  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    const text = String(value).trim();

    if (text) output.push(text);

    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectSearchableValues(item, output, depth + 1));
    return output;
  }

  if (valueType === "object") {
    Object.entries(value).forEach(([key, item]) => {
      if (["children", "ref", "current"].includes(key)) return;
      collectSearchableValues(item, output, depth + 1);
    });
  }

  return output;
}

function buildRequestSearchText(request = {}) {
  const raw = request?.raw || {};
  const meta = request?.meta || {};

  const knownValues = [
    request?.id,
    request?.rawId,
    request?.raw_id,
    request?.module,
    request?.source,
    request?.title,
    request?.requester,
    request?.employeeName,
    request?.employeeSibsId,
    request?.department,
    request?.type,
    getRequestType(request),
    isHiringNeedsRequest(request) ? getHiringNeedsRequestDisplayType(request) : "",
    getNormalizedRequestStatus(request),
    getRecruitmentSettingsStatus(request),
    getUpdateHeadcountStatus(request),
    request?.priority,
    request?.approver,
    request?.reason,
    request?.remarks,
    request?.account,
    request?.accountName,
    request?.account_name,
    request?.clusterName,
    request?.cluster_name,
    request?.weekLabel,
    request?.week_label,
    request?.weekNumber,
    request?.week_number,
    request?.jdCode,
    request?.jd_code,
    request?.roleTitle,
    request?.positionTitle,
    request?.position_title,
    request?.documentTitle,
    request?.document_title,
    request?.linkedHiringRequirement,
    request?.hiringManager,
    request?.hiring_manager,
    request?.approvedRequirement,
    request?.approved_requirement,
    request?.requestedStartDate,
    request?.requested_start_date,
    request?.dueDate,
    request?.due_date,
    request?.locationSite,
    request?.location_site,
    request?.owner,
    request?.requestedBy,
    request?.createdBy,
    request?.updatedBy,
    raw?.account,
    raw?.accountName,
    raw?.account_name,
    raw?.clusterName,
    raw?.cluster_name,
    raw?.weekLabel,
    raw?.week_label,
    raw?.jdCode,
    raw?.jd_code,
    raw?.roleTitle,
    raw?.positionTitle,
    raw?.position_title,
    raw?.documentTitle,
    raw?.document_title,
    raw?.linkedHiringRequirement,
    raw?.hiringManager,
    raw?.hiring_manager,
    raw?.approvedRequirement,
    raw?.approved_requirement,
    raw?.requestedStartDate,
    raw?.requested_start_date,
    raw?.dueDate,
    raw?.due_date,
    raw?.locationSite,
    raw?.location_site,
    raw?.description,
    raw?.responsibilities,
    raw?.qualifications,
    meta?.tlFullName,
    meta?.tlSibsId,
    meta?.omFullName,
    meta?.omSibsId,
    meta?.somFullName,
    meta?.somSibsId,
  ];

  return [...knownValues, ...collectSearchableValues(request)]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" ")
    .toLowerCase();
}

function requestBelongsToActiveModule(request = {}, activeModule = "") {
  const cleanActiveModule = String(activeModule || "")
    .trim()
    .toLowerCase();
  const cleanRequestModule = String(request?.module || "")
    .trim()
    .toLowerCase();
  const cleanType = String(getRequestType(request) || request?.type || "")
    .trim()
    .toLowerCase();

  if (!cleanActiveModule) return true;
  if (cleanRequestModule === cleanActiveModule) return true;

  if (cleanActiveModule === "attrition") {
    return cleanType === "resignation" || cleanType === "attrition";
  }

  if (cleanActiveModule === "workforce hiring plan") {
    return isWorkforceHiringPlanRequest(request);
  }

  if (cleanActiveModule === "job description") {
    return cleanType === "job description";
  }

  if (cleanActiveModule === "hiring needs") {
    return cleanType === "hiring needs";
  }

  if (cleanActiveModule === "available positions") {
    return isAvailablePositionRequest(request);
  }

  return false;
}

function getApprovalNotificationStatus(item = {}) {
  const raw = item?.raw || {};

  return normalizeStatus(
    getNormalizedRequestStatus(item) ||
      item?.status ||
      item?.recruitmentSettingsStatus ||
      item?.recruitment_settings_status ||
      item?.updateHeadcountStatus ||
      item?.update_headcount_status ||
      raw?.status ||
      raw?.recruitmentSettingsStatus ||
      raw?.recruitment_settings_status ||
      raw?.updateHeadcountStatus ||
      raw?.update_headcount_status ||
      "Pending",
    "Pending",
  );
}

function getApprovalNotificationKey(moduleName, item = {}) {
  return [
    moduleName,
    item?.source || item?.module || "approval",
    item?.rawId || item?.raw_id || item?.id || "",
    getRequestType(item) ||
      item?.type ||
      item?.requestType ||
      item?.request_type ||
      "",
  ].join("::");
}

function countApprovalNotificationData(moduleName, data = []) {
  const uniqueItems = new Map();

  data.forEach((item) => {
    const key = getApprovalNotificationKey(moduleName, item);

    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  });

  return Array.from(uniqueItems.values()).filter((item) => {
    const status = getApprovalNotificationStatus(item);

    return status === "Pending" || status === "For Review";
  }).length;
}

async function getApprovalTabNotificationCountByModule(moduleName) {
  const types = APPROVAL_NOTIFICATION_TYPES_BY_MODULE[moduleName] || [""];

  const results = await Promise.allSettled(
    types.map((type) =>
      getApprovalRequestsByModule(getApprovalApiModuleName(moduleName), {
        page: 1,
        limit: 500,
        search: "",
        status: "",
        type,
      }),
    ),
  );

  const fulfilledResults = results
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value)
    .filter((result) => result?.success);

  const mergedData = fulfilledResults.flatMap((result) =>
    Array.isArray(result?.data) ? result.data : [],
  );

  if (mergedData.length > 0) {
    return countApprovalNotificationData(moduleName, mergedData);
  }

  return fulfilledResults.reduce((sum, result) => {
    const counts = result?.counts || {};

    return sum + Number(counts.pending || 0) + Number(counts.forReview || 0);
  }, 0);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getFileUrl(url) {
  const value = String(url || "").trim();

  if (!value || value === "#") return "#";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "--";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(status, fallback = "Pending") {
  const cleanStatus = String(status || "").trim();

  if (!cleanStatus) return fallback;
  if (cleanStatus === "Declined") return "Rejected";
  if (cleanStatus === "Retained") return "Rejected";
  if (cleanStatus === "Rejected") return "Rejected";
  if (cleanStatus === "Not Approved") return "Rejected";
  if (cleanStatus === "Approved") return "Approved";
  if (cleanStatus === "For Review") return "For Review";
  if (cleanStatus === "Pending") return "Pending";

  const lower = cleanStatus.toLowerCase();

  if (lower === "declined") return "Rejected";
  if (lower === "rejected") return "Rejected";
  if (lower === "not approved") return "Rejected";
  if (lower === "not_approved") return "Rejected";
  if (lower === "disapproved") return "Rejected";
  if (lower === "approved") return "Approved";
  if (lower === "for review") return "For Review";
  if (lower === "pending") return "Pending";

  return fallback;
}

function normalizeRequestType(value) {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) return "";
  if (lower.includes("update headcount")) return "Update Headcount";
  if (lower.includes("headcount update")) return "Update Headcount";
  if (lower.includes("recruitment settings")) return "Recruitment Settings";
  if (lower.includes("weekly hiring")) return "Workforce Hiring Plan";
  if (lower.includes("available position")) return "Available Position";
  if (lower.includes("job opening")) return "Available Position";
  if (lower.includes("hiring needs")) return "Hiring Needs";
  if (lower.includes("personnel requisition")) return "Hiring Needs";
  if (lower === "prf" || lower.includes("prf")) return "Hiring Needs";
  if (lower.includes("resignation")) return "Resignation";
  if (lower.includes("attrition")) return "Attrition";

  return raw;
}

function getRequestType(request) {
  return normalizeRequestType(
    request?.requestType ||
      request?.request_type ||
      request?.type ||
      request?.raw?.requestType ||
      request?.raw?.request_type ||
      "",
  );
}

function getHiringNeedsRequestDisplayType(request = {}) {
  const raw = request?.raw || {};

  const value = String(
    request?.hiringNeedRequestType ||
      request?.hiring_need_request_type ||
      request?.hiringRequestType ||
      request?.hiring_request_type ||
      request?.requestSubType ||
      request?.request_sub_type ||
      request?.requestTypeLabel ||
      request?.request_type_label ||
      request?.requestType ||
      request?.request_type ||
      raw?.hiringNeedRequestType ||
      raw?.hiring_need_request_type ||
      raw?.hiringRequestType ||
      raw?.hiring_request_type ||
      raw?.requestSubType ||
      raw?.request_sub_type ||
      raw?.requestTypeLabel ||
      raw?.request_type_label ||
      raw?.requestType ||
      raw?.request_type ||
      "",
  )
    .trim()
    .toLowerCase();

  if (value === "downsize") return "Downsize";
  if (value === "requisition") return "Requisition";

  const titleText = String(request?.title || raw?.title || "").toLowerCase();
  const reasonText = String(
    request?.downsizeReason ||
      request?.downsize_reason ||
      request?.reason ||
      raw?.downsizeReason ||
      raw?.downsize_reason ||
      raw?.reason ||
      "",
  ).toLowerCase();

  if (titleText.includes("downsize") || reasonText.includes("downsize")) {
    return "Downsize";
  }

  return "Requisition";
}

function getApprovalRequestDisplayType(request = {}) {
  if (isHiringNeedsRequest(request)) {
    return getHiringNeedsRequestDisplayType(request);
  }

  const requestType = getRequestType(request);

  if (requestType) return requestType;

  return request?.type || request?.raw?.type || "--";
}

function getApprovalRequestDisplayTypeClass(type = "") {
  const value = String(type || "").trim().toLowerCase();

  if (value === "downsize") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value === "requisition") {
    return "border-blue-100 bg-blue-50 text-sibs-primary-1";
  }

  if (value === "job description") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (value === "available position") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (value === "resignation" || value === "attrition") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-[#E6ECF2] bg-[#F8FAFC] text-[#344054]";
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "No Request":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getPriorityClass(priority) {
  switch (priority) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Low":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case "Approved":
      return CheckCircle2;
    case "Rejected":
      return XCircle;
    case "For Review":
      return AlertCircle;
    default:
      return Clock3;
  }
}

function StatusBadge({ status, emptyText = "--" }) {
  const displayStatus = status || emptyText;
  const StatusIcon = getStatusIcon(displayStatus);

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
        displayStatus,
      )}`}
    >
      {displayStatus !== "No Request" && <StatusIcon size={14} />}
      {displayStatus}
    </span>
  );
}

function getRawRequestId(request) {
  return (
    request?.attritionId ||
    request?.raw?.id ||
    request?.rawId ||
    request?.raw_id ||
    String(request?.id || "").replace(
      /^RES-ATT-|^RES-|^ATT-|^WHP-|^HN-|^PRF-|^AVP-|^AP-/i,
      "",
    )
  );
}

function isResignationRequest(request) {
  return (
    String(request?.type || "").toLowerCase() === "resignation" ||
    String(request?.source || "")
      .toLowerCase()
      .includes("resignation") ||
    String(request?.id || "").startsWith("RES")
  );
}

function isAttritionRequest(request) {
  const moduleName = String(request?.module || "").trim().toLowerCase();
  const type = String(getRequestType(request) || request?.type || "")
    .trim()
    .toLowerCase();
  const source = String(request?.source || "").trim().toLowerCase();
  const id = String(request?.id || "").trim().toUpperCase();

  return (
    moduleName === "attrition" ||
    type === "attrition" ||
    source.includes("attrition") ||
    id.startsWith("ATT-") ||
    id.startsWith("ATR-")
  );
}

function isWorkforceHiringPlanRequest(request) {
  return (
    String(request?.module || "").toLowerCase() === "workforce hiring plan" ||
    String(request?.source || "")
      .toLowerCase()
      .includes("weekly") ||
    String(request?.source || "")
      .toLowerCase()
      .includes("headcount") ||
    String(request?.id || "").startsWith("WHP") ||
    getRequestType(request).toLowerCase().includes("headcount") ||
    getRequestType(request).toLowerCase().includes("recruitment settings")
  );
}

function isHiringNeedsRequest(request) {
  const moduleName = String(request?.module || "").trim().toLowerCase();
  const type = String(getRequestType(request) || request?.type || "")
    .trim()
    .toLowerCase();
  const source = String(request?.source || "").trim().toLowerCase();
  const id = String(request?.id || "").trim().toUpperCase();

  return (
    moduleName === "hiring needs" ||
    type === "hiring needs" ||
    type === "personnel requisition" ||
    source.includes("hiring") ||
    source.includes("requisition") ||
    id.startsWith("HN-") ||
    id.startsWith("PRF-")
  );
}

function isAvailablePositionRequest(request = {}) {
  const moduleName = String(request?.module || "").trim().toLowerCase();
  const type = String(getRequestType(request) || request?.type || "")
    .trim()
    .toLowerCase();
  const source = String(request?.source || "").trim().toLowerCase();
  const id = String(request?.id || "").trim().toUpperCase();

  return (
    moduleName === "available positions" ||
    moduleName === "available position" ||
    type === "available position" ||
    source.includes("available-position") ||
    source.includes("available position") ||
    source.includes("job opening") ||
    id.startsWith("AP-") ||
    id.startsWith("AVP-")
  );
}

function getRequestValue(request, keys = [], fallback = "--") {
  const raw = request?.raw || {};

  for (const key of keys) {
    const value = request?.[key] ?? raw?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return fallback;
}

function getHiringNeedsHeadcountDisplay(request) {
  const value = getRequestValue(
    request,
    [
      "headcount",
      "head_count",
      "approvedRequirement",
      "approved_requirement",
      "requestedHeadcount",
      "requested_headcount",
      "requiredHeadcount",
      "required_headcount",
    ],
    "",
  );

  if (value === null || value === undefined || String(value).trim() === "") {
    return "--";
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? formatNumber(numberValue) : safeText(value);
}

function getHiringNeedsPreparedBy(request) {
  return (
    request?.requester ||
    request?.employeeName ||
    getRequestValue(
      request,
      [
        "hiringManager",
        "hiring_manager",
        "preparedBy",
        "prepared_by",
        "preparedByName",
        "requestedBy",
        "requested_by",
      ],
      "--",
    )
  );
}

function splitRequesterIdentity(value = "") {
  const text = safeText(value, "");

  if (!text) {
    return {
      sibsId: "",
      name: "",
    };
  }

  const match = text.match(/^([A-Za-z]*[-_ ]*)?(\d{2,})\s*[-–—]\s*(.+)$/);

  if (match) {
    return {
      sibsId: normalizeSibsId(match[2]),
      name: safeText(match[3], ""),
    };
  }

  return {
    sibsId: "",
    name: text,
  };
}

function getRequesterDisplayInfo(request = {}) {
  const raw = request?.raw || {};
  const combinedRequester = isHiringNeedsRequest(request)
    ? getHiringNeedsPreparedBy(request)
    : request?.requester || request?.employeeName || "--";

  const parsedRequester = splitRequesterIdentity(combinedRequester);

  const explicitSibsId = normalizeSibsId(
    request?.employeeSibsId ||
      request?.employee_sibs_id ||
      request?.sibsIdManager ||
      request?.sibs_id_manager ||
      request?.requestedBySibsId ||
      request?.requested_by_sibs_id ||
      raw?.employeeSibsId ||
      raw?.employee_sibs_id ||
      raw?.preparedBySibsId ||
      raw?.prepared_by_sibs_id ||
      raw?.sibsIdManager ||
      raw?.sibs_id_manager ||
      raw?.requestedBySibsId ||
      raw?.requested_by_sibs_id ||
      parsedRequester.sibsId ||
      "",
  );

  const requesterName = safeText(parsedRequester.name || combinedRequester, "--");

  const displayNameWithSibs =
    explicitSibsId && explicitSibsId !== "--"
      ? `${explicitSibsId} - ${requesterName}`
      : requesterName;

  return {
    sibsId: explicitSibsId || "--",
    name: requesterName,
    displayNameWithSibs,
  };
}

function isWorkforceRecruitmentSettingsRequest(request) {
  return (
    isWorkforceHiringPlanRequest(request) &&
    getRequestType(request) === "Recruitment Settings"
  );
}

function isWorkforceUpdateHeadcountRequest(request) {
  return (
    isWorkforceHiringPlanRequest(request) &&
    getRequestType(request) === "Update Headcount"
  );
}

function canEditRequiredHeadcountOnWorkforceApproval(request) {
  return (
    isWorkforceHiringPlanRequest(request) &&
    !isWorkforceUpdateHeadcountRequest(request)
  );
}

function getAccountName(request) {
  const raw = request?.raw || {};

  return (
    request?.accountName ||
    request?.account_name ||
    request?.account ||
    raw?.accountName ||
    raw?.account_name ||
    raw?.account ||
    "--"
  );
}

function getRecruitmentSettingsStatus(request) {
  const raw = request?.raw || {};

  return normalizeStatus(
    request?.recruitmentSettingsStatus ||
      request?.recruitment_settings_status ||
      request?.recruitmentStatus ||
      request?.recruitment_status ||
      raw?.recruitmentSettingsStatus ||
      raw?.recruitment_settings_status ||
      raw?.recruitmentStatus ||
      raw?.recruitment_status ||
      request?.baseHeadcountStatus ||
      request?.base_headcount_status ||
      raw?.baseHeadcountStatus ||
      raw?.base_headcount_status ||
      request?.status ||
      raw?.status,
    "Pending",
  );
}

function getUpdateHeadcountStatus(request) {
  const raw = request?.raw || {};

  const value =
    request?.updateHeadcountStatus ||
    request?.update_headcount_status ||
    request?.managerUpdateStatus ||
    request?.manager_update_status ||
    raw?.updateHeadcountStatus ||
    raw?.update_headcount_status ||
    raw?.managerUpdateStatus ||
    raw?.manager_update_status ||
    "";

  if (!value) {
    const requestType = getRequestType(request);

    if (requestType === "Update Headcount") {
      return normalizeStatus(request?.status || raw?.status, "Pending");
    }

    return "";
  }

  return normalizeStatus(value, "");
}

function getNormalizedRequestStatus(request) {
  if (isWorkforceHiringPlanRequest(request)) {
    const requestType = getRequestType(request);

    if (requestType === "Update Headcount") {
      return (
        getUpdateHeadcountStatus(request) || normalizeStatus(request?.status)
      );
    }

    return getRecruitmentSettingsStatus(request);
  }

  return normalizeStatus(request?.status);
}

function getRequestedRequiredHeadcount(request) {
  const raw = request?.raw || {};

  return (
    request?.requestedRequiredHeadcount ??
    request?.requested_required_headcount ??
    request?.pendingRequiredHeadcount ??
    request?.pending_required_headcount ??
    raw?.requestedRequiredHeadcount ??
    raw?.requested_required_headcount ??
    raw?.pendingRequiredHeadcount ??
    raw?.pending_required_headcount ??
    null
  );
}

function getRequiredHeadcount(request) {
  const raw = request?.raw || {};

  return (
    request?.requiredHeadcount ??
    request?.required_headcount ??
    raw?.requiredHeadcount ??
    raw?.required_headcount ??
    0
  );
}

function getFinalRequiredHeadcount(request) {
  const raw = request?.raw || {};

  return (
    request?.finalRequiredHeadcount ??
    request?.final_required_headcount ??
    request?.approvedRequiredHeadcount ??
    request?.approved_required_headcount ??
    raw?.finalRequiredHeadcount ??
    raw?.final_required_headcount ??
    raw?.approvedRequiredHeadcount ??
    raw?.approved_required_headcount ??
    getRequestedRequiredHeadcount(request) ??
    getRequiredHeadcount(request) ??
    ""
  );
}

function getEditableRequiredHeadcountDefault(request) {
  const value = getFinalRequiredHeadcount(request);

  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(Number(value || 0));
}

function normalizeHeadcountInput(value) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) return "";

  const numberValue = Number(cleanValue);

  if (!Number.isFinite(numberValue) || numberValue < 0) return "";

  return Math.round(numberValue);
}

function normalizeRoleValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getCurrentUserRoleValues() {
  if (typeof window === "undefined") return [];

  const keys = [
    "role",
    "userRole",
    "user_role",
    "tokenType",
    "accountType",
    "userType",
    "user_type",
    "adminRole",
    "admin_role",
  ];

  return keys
    .map((key) => window.localStorage.getItem(key))
    .map(normalizeRoleValue)
    .filter(Boolean);
}

function canCurrentUserApproveWorkforceHiringPlan() {
  const roles = getCurrentUserRoleValues();

  if (!roles.length) {
    return true;
  }

  return roles.some((role) =>
    [
      "hr",
      "hr_admin",
      "hradmin",
      "human_resources",
      "human_resource",
      "human_resources_admin",
      "human_resource_admin",
    ].includes(role),
  );
}

function buildApprovalPayload(request, action, remarks = "", extra = {}) {
  const raw = request?.raw || {};
  const meta = request?.meta || {};

  const requestedRequiredHeadcount = getRequestedRequiredHeadcount(request);
  const approvedRequiredHeadcount = normalizeHeadcountInput(
    extra.approvedRequiredHeadcount ??
      extra.finalRequiredHeadcount ??
      getFinalRequiredHeadcount(request),
  );

  return {
    module: request?.module || "",
    type: request?.type || "",
    requestType: getRequestType(request),
    source: request?.source || "",
    remarks: remarks || "",
    action,

    personallySpoken: extra.personallySpoken || "",
    employeeRetained: extra.employeeRetained || "",
    actionTaken: extra.actionTaken || "",

    employeeSibsId:
      request?.employeeSibsId ||
      raw?.sibsId ||
      raw?.sibs_id ||
      raw?.employeeSibsId ||
      "",

    recruitmentSettingsStatus: getRecruitmentSettingsStatus(request),
    updateHeadcountStatus: getUpdateHeadcountStatus(request),

    requiredHeadcount: getRequiredHeadcount(request),
    requestedRequiredHeadcount,
    requested_required_headcount: requestedRequiredHeadcount,
    approvedRequiredHeadcount,
    approved_required_headcount: approvedRequiredHeadcount,
    finalRequiredHeadcount: approvedRequiredHeadcount,
    final_required_headcount: approvedRequiredHeadcount,
    hrEditedRequiredHeadcount: approvedRequiredHeadcount,
    hr_edited_required_headcount: approvedRequiredHeadcount,

    tlIsApproved: Number(meta.tlIsApproved || raw.tlIsApproved || 0),
    tlIsDeclined: Number(meta.tlIsDeclined || raw.tlIsDeclined || 0),
    tlRemarks: meta.tlRemarks || raw.tlRemarks || "",

    omIsApproved: Number(meta.omIsApproved || raw.omIsApproved || 0),
    omIsDeclined: Number(meta.omIsDeclined || raw.omIsDeclined || 0),
    omRemarks: meta.omRemarks || raw.omRemarks || "",

    somIsApproved: Number(meta.somIsApproved || raw.somIsApproved || 0),
    somIsDeclined: Number(meta.somIsDeclined || raw.somIsDeclined || 0),
    somRemarks: meta.somRemarks || raw.somRemarks || "",
  };
}

function getApprovalSteps(request) {
  const meta = request?.meta || {};

  return [
    {
      key: "tl",
      label: "TL / Manager",
      hidden: !!meta.hideTl,
      name: meta.tlFullName || meta.tlSibsId || "--",
      sibsId: meta.tlSibsId || "",
      approved: Number(meta.tlIsApproved || 0) === 1,
      declined: Number(meta.tlIsDeclined || 0) === 1,
      remarks: meta.tlRemarks || "",
      personallySpoken: meta.tlPersonallySpoken || "",
      employeeRetained: meta.tlEmployeeRetained || "",
      actionTaken: meta.tlActionTaken || "",
    },
    {
      key: "om",
      label: "OM",
      hidden: false,
      name: meta.omFullName || meta.omSibsId || "--",
      sibsId: meta.omSibsId || "",
      approved: Number(meta.omIsApproved || 0) === 1,
      declined: Number(meta.omIsDeclined || 0) === 1,
      remarks: meta.omRemarks || "",
      personallySpoken: meta.omPersonallySpoken || "",
      employeeRetained: meta.omEmployeeRetained || "",
      actionTaken: meta.omActionTaken || "",
    },
    {
      key: "som",
      label: "SOM",
      hidden: false,
      name: meta.somFullName || meta.somSibsId || "--",
      sibsId: meta.somSibsId || "",
      approved: Number(meta.somIsApproved || 0) === 1,
      declined: Number(meta.somIsDeclined || 0) === 1,
      remarks: meta.somRemarks || "",
      personallySpoken: meta.somPersonallySpoken || "",
      employeeRetained: meta.somEmployeeRetained || "",
      actionTaken: meta.somActionTaken || "",
    },
  ].filter((step) => !step.hidden);
}

function getStepStatus(step) {
  if (step.declined) return "Rejected";
  if (step.approved) return "Approved";
  return "Pending";
}

function getActiveApprovalStepKey(request) {
  const steps = getApprovalSteps(request);
  const activeStep = steps.find((step) => !step.approved && !step.declined);
  return activeStep?.key || "";
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();

      setStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[999999] overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-lg"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="overflow-y-auto py-2 sibs-scrollbar"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function normalizeSibsId(value = "") {
  return String(value ?? "")
    .trim()
    .replace(/^SIBS[-_ ]?/i, "");
}

function getLocalStorageValue(keys = []) {
  if (typeof window === "undefined") return "";

  for (const key of keys) {
    const value = window.localStorage.getItem(key);

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return value;
    }
  }

  return "";
}

function getCurrentUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.sibsId ||
      user?.sibs_id ||
      user?.employeeSibsId ||
      user?.employee_sibs_id ||
      user?.gy_emp_code ||
      user?.gy_user_code ||
      user?.userCode ||
      user?.user_code ||
      user?.employeeCode ||
      user?.employee_code ||
      user?.username ||
      getLocalStorageValue([
        "sibsId",
        "sibs_id",
        "employeeSibsId",
        "employee_sibs_id",
        "gy_emp_code",
        "gy_user_code",
        "userCode",
        "user_code",
        "employeeCode",
        "employee_code",
        "username",
      ]) ||
      "",
  );
}

function getApprovalSettingsRows(responseData) {
  const rows =
    responseData?.data?.users ||
    responseData?.data?.rows ||
    responseData?.data ||
    responseData?.users ||
    responseData?.rows ||
    responseData ||
    [];

  return Array.isArray(rows) ? rows : [];
}

function getApprovalSettingsSibsId(row = {}) {
  return normalizeSibsId(
    row?.sibsId ||
      row?.sibs_id ||
      row?.employeeSibsId ||
      row?.employee_sibs_id ||
      row?.gy_emp_code ||
      row?.gy_user_code ||
      row?.userCode ||
      row?.user_code ||
      row?.username ||
      "",
  );
}

function CustomSelect({ label, value, options = [], onChange, allLabel = "" }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const displayValue =
    value === "All" && allLabel ? allLabel : value || allLabel || "Select";

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 w-full items-center justify-between rounded-[10px] border bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD]"
        }`}
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        {options.map((option) => {
          const optionLabel = option === "All" && allLabel ? allLabel : option;
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm transition ${
                selected
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "text-[#344054] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="block truncate">{optionLabel}</span>
            </button>
          );
        })}
      </DropdownPortal>
    </div>
  );
}

export default function ApprovalRequest() {
  const { user } = useUser();

  const [activeModule, setActiveModule] = useState("Attrition");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("Resignation");
  const [page, setPage] = useState(1);

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 200,
  });
  const [moduleNotificationCounts, setModuleNotificationCounts] = useState(
    DEFAULT_MODULE_NOTIFICATION_COUNTS,
  );

  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [decisionModal, setDecisionModal] = useState({
    open: false,
    action: "",
    request: null,
    remarks: "",
    personallySpoken: "",
    employeeRetained: "No",
    actionTaken: "",
    editableRequiredHeadcount: "",
    loading: false,
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [jdApprovalAccessLoading, setJdApprovalAccessLoading] = useState(true);
  const [canViewJobDescriptionApproval, setCanViewJobDescriptionApproval] =
    useState(false);
  const [hiringNeedsApprovalAccessLoading, setHiringNeedsApprovalAccessLoading] =
    useState(true);
  const [canViewHiringNeedsApproval, setCanViewHiringNeedsApproval] =
    useState(false);
  const [
    availablePositionApprovalAccessLoading,
    setAvailablePositionApprovalAccessLoading,
  ] = useState(true);
  const [canViewAvailablePositionApproval, setCanViewAvailablePositionApproval] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { updateSelectedJobDescription, closeJobDescriptionDetails } =
    useJobDescription();

  const typeOptions = TYPE_OPTIONS_BY_MODULE[activeModule] || ["All"];

  const currentUserSibsId = useMemo(() => {
    return getCurrentUserSibsId(user);
  }, [user]);

  const approvalAccessLoading =
    jdApprovalAccessLoading ||
    hiringNeedsApprovalAccessLoading ||
    availablePositionApprovalAccessLoading;

  const visibleRequestModules = useMemo(() => {
    if (approvalAccessLoading) return [];

    return REQUEST_MODULES.filter((moduleName) => {
      if (moduleName === "Job Description") {
        return canViewJobDescriptionApproval;
      }

      if (moduleName === "Hiring Needs") {
        return canViewHiringNeedsApproval;
      }

      if (moduleName === "Available Positions") {
        return canViewAvailablePositionApproval;
      }

      return true;
    });
  }, [
    approvalAccessLoading,
    canViewJobDescriptionApproval,
    canViewHiringNeedsApproval,
    canViewAvailablePositionApproval,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function checkJobDescriptionApprovalAccess() {
      const cleanUserSibsId = normalizeSibsId(currentUserSibsId);

      if (!cleanUserSibsId) {
        if (!cancelled) {
          setCanViewJobDescriptionApproval(false);
          setJdApprovalAccessLoading(false);
        }

        return;
      }

      try {
        setJdApprovalAccessLoading(true);

        const result = await getJobDescriptionApprovalUsers();
        const rows = getApprovalSettingsRows(result);

        const isAllowed = rows.some((row) => {
          return (
            getApprovalSettingsSibsId(row).toLowerCase() ===
            cleanUserSibsId.toLowerCase()
          );
        });

        if (!cancelled) {
          setCanViewJobDescriptionApproval(isAllowed);
        }
      } catch (error) {
        console.error("CHECK JD APPROVAL ACCESS ERROR:", error);

        if (!cancelled) {
          setCanViewJobDescriptionApproval(false);
        }
      } finally {
        if (!cancelled) {
          setJdApprovalAccessLoading(false);
        }
      }
    }

    checkJobDescriptionApprovalAccess();

    return () => {
      cancelled = true;
    };
  }, [currentUserSibsId]);

  useEffect(() => {
    let cancelled = false;

    async function checkHiringNeedsApprovalAccess() {
      const cleanUserSibsId = normalizeSibsId(currentUserSibsId);

      if (!cleanUserSibsId) {
        if (!cancelled) {
          setCanViewHiringNeedsApproval(false);
          setHiringNeedsApprovalAccessLoading(false);
        }

        return;
      }

      try {
        setHiringNeedsApprovalAccessLoading(true);

        const result = await getHiringNeedsApprovalUsers();
        const rows = getApprovalSettingsRows(result);

        const isAllowed = rows.some((row) => {
          return (
            getApprovalSettingsSibsId(row).toLowerCase() ===
            cleanUserSibsId.toLowerCase()
          );
        });

        if (!cancelled) {
          setCanViewHiringNeedsApproval(isAllowed);
        }
      } catch (error) {
        console.error("CHECK HIRING NEEDS APPROVAL ACCESS ERROR:", error);

        if (!cancelled) {
          setCanViewHiringNeedsApproval(false);
        }
      } finally {
        if (!cancelled) {
          setHiringNeedsApprovalAccessLoading(false);
        }
      }
    }

    checkHiringNeedsApprovalAccess();

    return () => {
      cancelled = true;
    };
  }, [currentUserSibsId]);

  useEffect(() => {
    let cancelled = false;

    async function checkAvailablePositionApprovalAccess() {
      const cleanUserSibsId = normalizeSibsId(currentUserSibsId);

      if (!cleanUserSibsId) {
        if (!cancelled) {
          setCanViewAvailablePositionApproval(false);
          setAvailablePositionApprovalAccessLoading(false);
        }

        return;
      }

      try {
        setAvailablePositionApprovalAccessLoading(true);

        const result = await getAvailablePositionApprovalUsers();
        const rows = getApprovalSettingsRows(result);

        const isAllowed = rows.some((row) => {
          return (
            getApprovalSettingsSibsId(row).toLowerCase() ===
            cleanUserSibsId.toLowerCase()
          );
        });

        if (!cancelled) {
          setCanViewAvailablePositionApproval(isAllowed);
        }
      } catch (error) {
        console.error("CHECK AVAILABLE POSITION APPROVAL ACCESS ERROR:", error);

        if (!cancelled) {
          setCanViewAvailablePositionApproval(false);
        }
      } finally {
        if (!cancelled) {
          setAvailablePositionApprovalAccessLoading(false);
        }
      }
    }

    checkAvailablePositionApprovalAccess();

    return () => {
      cancelled = true;
    };
  }, [currentUserSibsId]);

  useEffect(() => {
    const stateModule = location.state?.activeModule;
    const requestedModule =
      stateModule === "Available Position" ? "Available Positions" : stateModule;

    if (!requestedModule || !REQUEST_MODULES.includes(requestedModule)) return;

    if (requestedModule === "Job Description") {
      if (jdApprovalAccessLoading) return;

      if (!canViewJobDescriptionApproval) {
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
    }

    if (requestedModule === "Hiring Needs") {
      if (hiringNeedsApprovalAccessLoading) return;

      if (!canViewHiringNeedsApproval) {
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
    }

    if (requestedModule === "Available Positions") {
      if (availablePositionApprovalAccessLoading) return;

      if (!canViewAvailablePositionApproval) {
        navigate(location.pathname, { replace: true, state: {} });
        return;
      }
    }

    setActiveModule(requestedModule);
    setSearch("");
    setSearchInput("");
    setStatusFilter("All");
    setTypeFilter(requestedModule === "Attrition" ? "Resignation" : "All");
    setPage(1);

    navigate(location.pathname, { replace: true, state: {} });
  }, [
    location.pathname,
    location.state,
    navigate,
    jdApprovalAccessLoading,
    canViewJobDescriptionApproval,
    hiringNeedsApprovalAccessLoading,
    canViewHiringNeedsApproval,
    availablePositionApprovalAccessLoading,
    canViewAvailablePositionApproval,
  ]);

  useEffect(() => {
    if (approvalAccessLoading) return;
    if (visibleRequestModules.includes(activeModule)) return;

    const fallbackModule = visibleRequestModules[0] || "Attrition";

    setActiveModule(fallbackModule);
    setSearch("");
    setSearchInput("");
    setStatusFilter("All");
    setTypeFilter(fallbackModule === "Attrition" ? "Resignation" : "All");
    setPage(1);
    setSelectedRequest(null);
    updateSelectedJobDescription?.(null);
    closeJobDescriptionDetails?.();
  }, [
    approvalAccessLoading,
    visibleRequestModules,
    activeModule,
    updateSelectedJobDescription,
    closeJobDescriptionDetails,
  ]);

  const hasActiveFilters =
    search || searchInput || statusFilter !== "All" || typeFilter !== "All";

  const loadApprovalTabNotifications = useCallback(async () => {
    try {
      const entries = await Promise.all(
        visibleRequestModules.map(async (moduleName) => {
          const count =
            await getApprovalTabNotificationCountByModule(moduleName);
          return [moduleName, Number(count || 0)];
        }),
      );

      setModuleNotificationCounts({
        ...DEFAULT_MODULE_NOTIFICATION_COUNTS,
        ...Object.fromEntries(entries),
      });
    } catch (error) {
      console.error("Approval Request tab notification error:", error);
      setModuleNotificationCounts(DEFAULT_MODULE_NOTIFICATION_COUNTS);
    }
  }, [visibleRequestModules]);

  const loadApprovalRequests = useCallback(
    async ({ showError = false } = {}) => {
      if (
        (activeModule === "Job Description" && !canViewJobDescriptionApproval) ||
        (activeModule === "Hiring Needs" && !canViewHiringNeedsApproval) ||
        (activeModule === "Available Positions" &&
          !canViewAvailablePositionApproval)
      ) {
        setRequests([]);
        setCounts(DEFAULT_COUNTS);
        setPagination({
          total: 0,
          totalPages: 1,
          currentPage: 1,
          limit: 200,
        });
        return;
      }

      const buildParams = (requestType = typeFilter) => ({
        page: 1,
        // Load the active module records first, then search locally so the
        // search bar always filters the currently opened tab/table below.
        search: "",
        status: statusFilter === "All" ? "" : statusFilter,
        type:
          requestType === "All" || activeModule === "Hiring Needs"
            ? ""
            : activeModule === "Workforce Hiring Plan"
              ? normalizeRequestType(requestType)
              : requestType,
        limit: 500,
      });

      const getResultData = (result) =>
        Array.isArray(result?.data) ? result.data : [];

      const buildCountsFromRequests = (items = []) => {
        const nextCounts = {
          ...DEFAULT_COUNTS,
          total: items.length,
        };

        items.forEach((item) => {
          const status = getNormalizedRequestStatus(item);

          if (status === "Approved") {
            nextCounts.approved += 1;
          } else if (status === "Rejected") {
            nextCounts.rejected += 1;
          } else if (status === "For Review") {
            nextCounts.forReview += 1;
          } else {
            nextCounts.pending += 1;
          }
        });

        return nextCounts;
      };

      const mergeUniqueRequests = (lists = []) => {
        const map = new Map();

        lists.flat().forEach((item) => {
          const key = [
            item?.source || item?.module || "request",
            item?.rawId || item?.raw_id || item?.id || "",
            getRequestType(item) || item?.type || "",
          ].join("::");

          if (!map.has(key)) {
            map.set(key, item);
          }
        });

        return Array.from(map.values());
      };

      try {
        setLoading(true);

        let result = await getApprovalRequestsByModule(
          getApprovalApiModuleName(activeModule),
          buildParams(),
        );

        let data = getResultData(result);
        let counts = result?.counts || DEFAULT_COUNTS;
        let paginationData = result?.pagination || {
          total: data.length,
          totalPages: 1,
          currentPage: 1,
          limit: 200,
        };

        /*
        Workforce Hiring Plan has multiple request types.
        Some backend filters return empty when type is blank/All,
        so fetch each type and merge them.
      */
        if (
          activeModule === "Workforce Hiring Plan" &&
          typeFilter === "All" &&
          data.length === 0
        ) {
          const workforceTypes = [
            "Recruitment Settings",
            "Update Headcount",
            "Workforce Hiring Plan",
          ];

          const workforceResults = await Promise.allSettled(
            workforceTypes.map((requestType) =>
              getApprovalRequestsByModule(
                getApprovalApiModuleName(activeModule),
                buildParams(requestType),
              ),
            ),
          );

          const successfulResults = workforceResults
            .filter((item) => item.status === "fulfilled")
            .map((item) => item.value)
            .filter((item) => item?.success);

          data = mergeUniqueRequests(
            successfulResults.map((item) => getResultData(item)),
          );

          counts = data.length
            ? buildCountsFromRequests(data)
            : result?.counts || DEFAULT_COUNTS;

          paginationData = {
            total: data.length,
            totalPages: 1,
            currentPage: 1,
            limit: 200,
          };

          result = {
            success: data.length > 0 || result?.success,
            message: result?.message,
          };
        }

        if (!result?.success) {
          setRequests([]);
          setCounts(DEFAULT_COUNTS);
          setPagination({
            total: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 200,
          });

          if (showError) {
            setStatusModal({
              open: true,
              type: "error",
              title: "Load Failed",
              message:
                result?.message || "Failed to load approval request records.",
            });
          }

          return;
        }

        setRequests(data);
        setCounts(counts);
        setPagination(paginationData);
      } catch (error) {
        console.error("LOAD APPROVAL REQUESTS ERROR:", error);

        setRequests([]);
        setCounts(DEFAULT_COUNTS);
        setPagination({
          total: 0,
          totalPages: 1,
          currentPage: 1,
          limit: 200,
        });

        if (showError) {
          setStatusModal({
            open: true,
            type: "error",
            title: "Load Failed",
            message:
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              "Something went wrong while loading approval requests.",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [
      activeModule,
      statusFilter,
      typeFilter,
      canViewJobDescriptionApproval,
      canViewHiringNeedsApproval,
      canViewAvailablePositionApproval,
    ],
  );

  useEffect(() => {
    loadApprovalRequests();
  }, [loadApprovalRequests]);

  useEffect(() => {
    loadApprovalTabNotifications();

    const interval = window.setInterval(() => {
      loadApprovalTabNotifications();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadApprovalTabNotifications]);

  function handleClearFilters() {
    setSearch("");
    setSearchInput("");
    setStatusFilter("All");
    setTypeFilter(activeModule === "Attrition" ? "Resignation" : "All");
    setPage(1);
  }

  function handleChangeModule(moduleName) {
    if (!visibleRequestModules.includes(moduleName)) return;

    setActiveModule(moduleName);
    setSearch("");
    setSearchInput("");
    setStatusFilter("All");
    setTypeFilter(moduleName === "Attrition" ? "Resignation" : "All");
    setPage(1);
    setSelectedRequest(null);
    updateSelectedJobDescription?.(null);
    closeJobDescriptionDetails?.();
  }

  function handleRefresh() {
    loadApprovalRequests({ showError: true });
  }

  function handleSearchInputChange(value) {
    setSearchInput(value);
    setSearch(value);
    setPage(1);
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    setSearch(searchInput);
    setPage(1);
  }

  function handleSearchSubmit() {
    setSearch(searchInput);
    setPage(1);
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(value || "All");
    setPage(1);
  }

  function handleTypeFilterChange(value) {
    setTypeFilter(value || "All");
    setPage(1);
  }

  function scrollApprovalTableToTop() {
    window.requestAnimationFrame(() => {
      const tableTop = document.querySelector("[data-approval-table-top]");
      const tableScroll = document.querySelector(
        "[data-approval-table-scroll]",
      );
      const mobileScroll = document.querySelector(
        "[data-approval-mobile-scroll]",
      );

      tableTop?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      tableScroll?.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      mobileScroll?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  function handlePreviousPage() {
    if (loading || page <= 1) return;

    setPage((prev) => Math.max(Number(prev || 1) - 1, 1));
    scrollApprovalTableToTop();
  }

  function handleNextPage() {
    if (loading || page >= totalFilteredPages) return;

    setPage((prev) => Math.min(Number(prev || 1) + 1, totalFilteredPages));
    scrollApprovalTableToTop();
  }

  // function parseRevisionHistoryJson(value) {
  //   if (Array.isArray(value)) return value;
  //   if (!value) return [];

  //   try {
  //     const parsed = JSON.parse(value);
  //     return Array.isArray(parsed) ? parsed : [];
  //   } catch {
  //     return [];
  //   }
  // }

  // function mapJobDescriptionApprovalToModalItem(request) {
  //   const raw = request?.raw || {};

  //   const competencies = Array.isArray(request?.competencies)
  //     ? request.competencies
  //     : Array.isArray(request?.desiredCompetencies)
  //       ? request.desiredCompetencies
  //       : Array.isArray(raw?.competencies)
  //         ? raw.competencies
  //         : Array.isArray(raw?.desiredCompetencies)
  //           ? raw.desiredCompetencies
  //           : [];

  //   return {
  //     id: request?.rawId || raw?.id || request?.id,
  //     jdCode: request?.jdCode || raw?.jdCode || request?.id || "—",

  //     roleTitle:
  //       request?.roleTitle ||
  //       raw?.roleTitle ||
  //       request?.title ||
  //       "Job Description",

  //     title:
  //       request?.roleTitle ||
  //       raw?.roleTitle ||
  //       request?.title ||
  //       "Job Description",

  //     jdStatus: request?.jdStatus || raw?.jdStatus || request?.status,
  //     status: request?.status,

  //     department:
  //       request?.departmentName ||
  //       request?.department ||
  //       raw?.departmentName ||
  //       raw?.department ||
  //       raw?.departmentId ||
  //       "—",

  //     account:
  //       request?.accountName ||
  //       request?.account ||
  //       raw?.accountName ||
  //       raw?.account ||
  //       raw?.accountId ||
  //       "—",

  //     linkedHiringRequirement:
  //       request?.linkedHiringRequirement || raw?.linkedHiringRequirement || "—",

  //     dateRequested:
  //       request?.dateRequested ||
  //       request?.requestDate ||
  //       raw?.dateRequested ||
  //       raw?.createdAt ||
  //       "",

  //     createdBy:
  //       request?.createdByName ||
  //       request?.createdBy ||
  //       raw?.createdByName ||
  //       raw?.createdBy ||
  //       raw?.createdBySibsId ||
  //       request?.requester ||
  //       "—",

  //     owner:
  //       request?.ownerName ||
  //       request?.owner ||
  //       raw?.ownerName ||
  //       raw?.owner ||
  //       raw?.ownerSibsId ||
  //       request?.approver ||
  //       "—",

  //     preparedFor: request?.preparedFor || raw?.preparedFor || "—",
  //     reportsTo: request?.reportsTo || raw?.reportsTo || "—",
  //     supervisory: request?.supervisory || raw?.supervisory || "No",

  //     version:
  //       request?.version ||
  //       request?.jdVersion ||
  //       request?.currentVersion ||
  //       raw?.version ||
  //       raw?.jdVersion ||
  //       raw?.currentVersion ||
  //       "2.0",

  //     currentVersion:
  //       request?.currentVersion ||
  //       request?.jdVersion ||
  //       request?.version ||
  //       raw?.currentVersion ||
  //       raw?.jdVersion ||
  //       raw?.version ||
  //       "2.0",

  //     effectiveDate: request?.effectiveDate || raw?.effectiveDate || "",

  //     lastReviewed:
  //       request?.approveDate ||
  //       request?.updatedAt ||
  //       raw?.approveDate ||
  //       raw?.updatedAt ||
  //       request?.dateRequested ||
  //       "",

  //     description: request?.description || raw?.description || "",
  //     responsibilities:
  //       request?.responsibilities || raw?.responsibilities || "",
  //     qualifications: request?.qualifications || raw?.qualifications || "",
  //     remarks: request?.jdRemarks || request?.remarks || raw?.remarks || "",

  //     revisionHistory:
  //       request?.revisionHistory ||
  //       raw?.revisionHistory ||
  //       parseRevisionHistoryJson(
  //         request?.revisionHistoryJson || raw?.revisionHistoryJson,
  //       ),

  //     competencies,
  //     desiredCompetencies: competencies,
  //   };
  // }

  function parseRevisionHistoryJson(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function mapJobDescriptionApprovalToFullPageItem(request = {}) {
    const raw = request?.raw || {};

    const competencies = Array.isArray(request?.competencies)
      ? request.competencies
      : Array.isArray(request?.desiredCompetencies)
        ? request.desiredCompetencies
        : Array.isArray(raw?.competencies)
          ? raw.competencies
          : Array.isArray(raw?.desiredCompetencies)
            ? raw.desiredCompetencies
            : [];

    return {
      ...request,
      raw,
      rawId: request?.rawId || request?.raw_id || raw?.id || request?.id,
      id: request?.rawId || request?.raw_id || raw?.id || request?.id,
      jdCode: request?.jdCode || raw?.jdCode || request?.id || "—",

      roleTitle:
        request?.roleTitle ||
        raw?.roleTitle ||
        request?.title ||
        raw?.title ||
        "Job Description",

      title:
        request?.roleTitle ||
        raw?.roleTitle ||
        request?.title ||
        raw?.title ||
        "Job Description",

      jdStatus: request?.jdStatus || raw?.jdStatus || request?.status,
      jd_status: request?.jd_status || raw?.jd_status || request?.status,
      status: request?.status || raw?.status,

      department:
        request?.departmentName ||
        request?.department ||
        raw?.departmentName ||
        raw?.department ||
        raw?.departmentId ||
        "—",

      account:
        request?.accountName ||
        request?.account ||
        raw?.accountName ||
        raw?.account ||
        raw?.accountId ||
        "—",

      linkedHiringRequirement:
        request?.linkedHiringRequirement || raw?.linkedHiringRequirement || "—",

      dateRequested:
        request?.dateRequested ||
        request?.requestDate ||
        raw?.dateRequested ||
        raw?.createdAt ||
        "",

      createdBy:
        request?.createdByName ||
        request?.createdBy ||
        raw?.createdByName ||
        raw?.createdBy ||
        raw?.createdBySibsId ||
        request?.requester ||
        "—",

      owner:
        request?.ownerName ||
        request?.owner ||
        raw?.ownerName ||
        raw?.owner ||
        raw?.ownerSibsId ||
        request?.approver ||
        "—",

      preparedFor:
        request?.preparedFor ||
        raw?.preparedFor ||
        request?.accountName ||
        request?.account ||
        raw?.accountName ||
        raw?.account ||
        "—",

      reportsTo: request?.reportsTo || raw?.reportsTo || "—",
      supervisory: request?.supervisory || raw?.supervisory || "No",

      version:
        request?.version ||
        request?.jdVersion ||
        request?.currentVersion ||
        raw?.version ||
        raw?.jdVersion ||
        raw?.currentVersion ||
        "1",

      currentVersion:
        request?.currentVersion ||
        request?.jdVersion ||
        request?.version ||
        raw?.currentVersion ||
        raw?.jdVersion ||
        raw?.version ||
        "1",

      revisionNo:
        request?.revisionNo ||
        request?.revision_no ||
        raw?.revisionNo ||
        raw?.revision_no ||
        request?.currentVersion ||
        raw?.currentVersion ||
        "1",

      effectiveDate: request?.effectiveDate || raw?.effectiveDate || "",

      lastUpdated:
        request?.approveDate ||
        request?.updatedAt ||
        raw?.approveDate ||
        raw?.updatedAt ||
        request?.dateRequested ||
        "",

      description: request?.description || raw?.description || "",
      responsibilities:
        request?.responsibilities || raw?.responsibilities || "",
      qualifications: request?.qualifications || raw?.qualifications || "",
      personalityType:
        request?.personalityType ||
        request?.personality_type ||
        request?.preferredPersonalityType ||
        request?.preferred_personality_type ||
        raw?.personalityType ||
        raw?.personality_type ||
        raw?.preferredPersonalityType ||
        raw?.preferred_personality_type ||
        "",
      remarks: request?.jdRemarks || request?.remarks || raw?.remarks || "",

      revisionHistory:
        request?.revisionHistory ||
        raw?.revisionHistory ||
        parseRevisionHistoryJson(
          request?.revisionHistoryJson || raw?.revisionHistoryJson,
        ),

      competencies,
      desiredCompetencies: competencies,
    };
  }

  function handleViewRequest(request) {
    if (activeModule === "Job Description") {
      const jdItem = mapJobDescriptionApprovalToFullPageItem(request);
      const jdId = jdItem?.rawId || jdItem?.raw?.id || jdItem?.id;

      if (!jdId) {
        openStatus({
          type: "error",
          title: "Invalid Job Description",
          message: "Unable to identify the selected job description.",
        });
        return;
      }

      setSelectedRequest(null);
      closeJobDescriptionDetails?.();
      updateSelectedJobDescription?.(null);

      navigate(`/approval-request/job-description/view/${jdId}`, {
        state: {
          jobDescription: jdItem,
        },
      });

      return;
    }

    closeJobDescriptionDetails?.();
    updateSelectedJobDescription?.(null);
    setSelectedRequest(request);
  }

  function openStatus({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal({
      open: false,
      type: "success",
      title: "",
      message: "",
    });
  }

  function openDecisionModal(request, action, extra = {}) {
    setSelectedRequest(null);

    const passedRequiredHeadcount =
      extra?.editableRequiredHeadcount ??
      extra?.approvedRequiredHeadcount ??
      extra?.finalRequiredHeadcount ??
      "";

    const editableRequiredHeadcount = canEditRequiredHeadcountOnWorkforceApproval(
      request,
    )
      ? String(passedRequiredHeadcount ?? "")
      : "";

    setDecisionModal({
      open: true,
      action,
      request,
      remarks: "",
      personallySpoken: "",
      employeeRetained: "No",
      actionTaken: "",
      editableRequiredHeadcount,
      loading: false,
    });
  }

  function closeDecisionModal() {
    if (decisionModal.loading) return;

    setDecisionModal({
      open: false,
      action: "",
      request: null,
      remarks: "",
      personallySpoken: "",
      employeeRetained: "No",
      actionTaken: "",
      editableRequiredHeadcount: "",
      loading: false,
    });
  }

  async function handleSubmitDecision(e) {
    e.preventDefault();

    const action = decisionModal.action;
    const request = decisionModal.request;

    if (!request) return;

    if (action === "reject" && !String(decisionModal.remarks || "").trim()) {
      openStatus({
        type: "error",
        title: "Remarks Required",
        message: "Please enter remarks before rejecting this approval request.",
      });

      return;
    }

    if (isResignationRequest(request)) {
      if (!decisionModal.personallySpoken) {
        openStatus({
          type: "error",
          title: "Required Field",
          message:
            "Please select if you have personally spoken to the resigning employee.",
        });

        return;
      }

      if (!decisionModal.employeeRetained) {
        openStatus({
          type: "error",
          title: "Required Field",
          message: "Please select if the employee was retained.",
        });

        return;
      }

      if (
        decisionModal.personallySpoken === "Yes" &&
        !String(decisionModal.actionTaken || "").trim()
      ) {
        openStatus({
          type: "error",
          title: "Required Field",
          message: "Please enter what you have done.",
        });

        return;
      }
    }

    if (
      isWorkforceHiringPlanRequest(request) &&
      !canCurrentUserApproveWorkforceHiringPlan()
    ) {
      openStatus({
        type: "error",
        title: "Not Allowed",
        message:
          "Only HR and HR Admin can approve or decline Workforce Hiring Plan requests.",
      });

      return;
    }

    if (isHiringNeedsRequest(request) && !canViewHiringNeedsApproval) {
      openStatus({
        type: "error",
        title: "Not Allowed",
        message:
          "Only users added in Recruitment Settings > Approval Rules > Hiring Needs can approve or reject Hiring Needs requests.",
      });

      return;
    }

    if (
      isAvailablePositionRequest(request) &&
      !canViewAvailablePositionApproval
    ) {
      openStatus({
        type: "error",
        title: "Not Allowed",
        message:
          "Only users added in Recruitment Settings > Approval Rules > Available Positions can approve or reject Available Position requests.",
      });

      return;
    }

    if (
      canEditRequiredHeadcountOnWorkforceApproval(request) &&
      action === "approve"
    ) {
      const approvedRequiredHeadcount = normalizeHeadcountInput(
        decisionModal.editableRequiredHeadcount,
      );

      if (approvedRequiredHeadcount === "") {
        openStatus({
          type: "error",
          title: "Required Headcount Required",
          message:
            "Please enter the final Required Headcount before approving this Recruitment Settings request.",
        });

        return;
      }
    }

    const requestId = getRawRequestId(request);

    if (!requestId) {
      openStatus({
        type: "error",
        title: "Invalid Request",
        message: "Approval request ID is missing.",
      });

      return;
    }

    try {
      setDecisionModal((prev) => ({
        ...prev,
        loading: true,
      }));

      const payload = buildApprovalPayload(
        request,
        action,
        decisionModal.remarks,
        {
          personallySpoken: decisionModal.personallySpoken,
          employeeRetained: decisionModal.employeeRetained,
          actionTaken: decisionModal.actionTaken,
          approvedRequiredHeadcount: canEditRequiredHeadcountOnWorkforceApproval(
            request,
          )
            ? normalizeHeadcountInput(decisionModal.editableRequiredHeadcount)
            : getFinalRequiredHeadcount(request),
        },
      );

      const result =
        action === "approve"
          ? await approveRequestByModule(
              getApprovalApiModuleName(activeModule),
              requestId,
              payload,
            )
          : await rejectRequestByModule(
              getApprovalApiModuleName(activeModule),
              requestId,
              payload,
            );

      if (!result?.success) {
        throw new Error(
          result?.message ||
            `Failed to ${action === "approve" ? "approve" : "reject"} request.`,
        );
      }

      setDecisionModal({
        open: false,
        action: "",
        request: null,
        remarks: "",
        personallySpoken: "",
        employeeRetained: "No",
        actionTaken: "",
        editableRequiredHeadcount: "",
        loading: false,
      });

      await Promise.all([
        loadApprovalRequests(),
        loadApprovalTabNotifications(),
      ]);

      openStatus({
        type: "success",
        title: action === "approve" ? "Request Approved" : "Request Rejected",
        message:
          result?.message ||
          `Approval request has been ${
            action === "approve" ? "approved" : "rejected"
          } successfully.`,
      });
    } catch (error) {
      console.error("SUBMIT APPROVAL DECISION ERROR:", error);

      setDecisionModal((prev) => ({
        ...prev,
        loading: false,
      }));

      openStatus({
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong while updating the approval request.",
      });
    }
  }

  const frontendFilteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((request) => {
      const status = getNormalizedRequestStatus(request);
      const requestType =
        activeModule === "Hiring Needs"
          ? getHiringNeedsRequestDisplayType(request)
          : getRequestType(request);

      const matchesCurrentModule = requestBelongsToActiveModule(
        request,
        activeModule,
      );

      const searchableText = buildRequestSearchText(request);
      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus = statusFilter === "All" || status === statusFilter;

      const normalizedTypeFilter =
        activeModule === "Hiring Needs"
          ? typeFilter
          : normalizeRequestType(typeFilter);
      const matchesType =
        typeFilter === "All" || requestType === normalizedTypeFilter;

      return (
        matchesCurrentModule && matchesSearch && matchesStatus && matchesType
      );
    });
  }, [requests, activeModule, search, statusFilter, typeFilter]);

  const totalFilteredRecords = frontendFilteredRequests.length;

  const totalFilteredPages = Math.max(
    Math.ceil(totalFilteredRecords / PAGE_LIMIT),
    1,
  );

  const currentPage = Math.min(
    Math.max(Number(page || 1), 1),
    totalFilteredPages,
  );

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_LIMIT;
    const end = start + PAGE_LIMIT;

    return frontendFilteredRequests.slice(start, end);
  }, [frontendFilteredRequests, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [activeModule, search, statusFilter, typeFilter]);

  useEffect(() => {
    if (page > totalFilteredPages) {
      setPage(totalFilteredPages);
    }
  }, [page, totalFilteredPages]);

  return (
    <div className={`flex h-screen flex-1 flex-col ${FLAT_BG} font-jakarta`}>
      <Header />

      <main className="min-w-0 flex-1 overflow-y-scroll overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="sibs-page-header-in mb-6 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <MessageSquareText size={14} />
              Communication
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Approval Request
            </h1>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Review resignation approvals, job descriptions, hiring needs,
              and available position approvals.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-[10px] bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCcw size={17} />
            )}
            Refresh
          </button>
        </div>

        <div className="space-y-5">
          {/* <div className="relative z-[20] sibs-profile-tab-panel">
            <ApprovalSummaryCards
              stats={counts}
              activeModule={activeModule}
              loading={loading}
            />
          </div> */}

          <div className="relative z-[10] sibs-profile-tab-panel">
            <ApprovalPaginationToolbar
              loading={loading}
              searchInput={searchInput}
              onSearchInputChange={handleSearchInputChange}
              onSearchKeyDown={handleSearchKeyDown}
              onSearchSubmit={handleSearchSubmit}
              statusFilter={statusFilter}
              setStatusFilter={handleStatusFilterChange}
              typeFilter={typeFilter}
              setTypeFilter={handleTypeFilterChange}
              typeOptions={typeOptions}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />
          </div>

          <div className="relative z-[0] sibs-profile-tab-panel">
            <ApprovalRequestTable
              activeModule={activeModule}
              requestModules={visibleRequestModules}
              requests={paginatedRequests}
              loadedCount={paginatedRequests.length}
              totalRecords={totalFilteredRecords}
              currentPage={currentPage}
              totalPages={totalFilteredPages}
              moduleNotificationCounts={moduleNotificationCounts}
              loading={loading}
              onView={handleViewRequest}
              onChangeModule={handleChangeModule}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
            />
          </div>
        </div>
      </main>

      {activeModule !== "Job Description" && (
        <ViewApprovalRequestModal
          open={!!selectedRequest}
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={(extra = {}) =>
            openDecisionModal(selectedRequest, "approve", extra)
          }
          onReject={() => openDecisionModal(selectedRequest, "reject")}
          onValidationError={openStatus}
          canViewHiringNeedsApproval={canViewHiringNeedsApproval}
          canViewAvailablePositionApproval={
            canViewAvailablePositionApproval
          }
        />
      )}

      <DecisionModal
        open={decisionModal.open}
        action={decisionModal.action}
        request={decisionModal.request}
        remarks={decisionModal.remarks}
        personallySpoken={decisionModal.personallySpoken}
        employeeRetained={decisionModal.employeeRetained}
        actionTaken={decisionModal.actionTaken}
        editableRequiredHeadcount={decisionModal.editableRequiredHeadcount}
        loading={decisionModal.loading}
        onChangeRemarks={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            remarks: value,
          }))
        }
        onChangePersonallySpoken={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            personallySpoken: value,
            actionTaken: value === "Yes" ? prev.actionTaken : "",
          }))
        }
        onChangeEmployeeRetained={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            employeeRetained: value,
          }))
        }
        onChangeActionTaken={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            actionTaken: value,
          }))
        }
        onChangeEditableRequiredHeadcount={(value) =>
          setDecisionModal((prev) => ({
            ...prev,
            editableRequiredHeadcount: value,
          }))
        }
        onClose={closeDecisionModal}
        onSubmit={handleSubmitDecision}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
      />
    </div>
  );
}

function ApprovalPaginationToolbar({
  loading,
  searchInput,
  onSearchInputChange,
  onSearchKeyDown,
  onSearchSubmit,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  typeOptions,
  hasActiveFilters,
  onClearFilters,
}) {
  const statusOptions = STATUS_OPTIONS;
  const requestTypeOptions = typeOptions || ["All"];

  return (
    <div className={`${EDGE} ${PANEL_BORDER} bg-white p-5`}>
      <div className="mb-5">
        <h2 className="text-base font-extrabold text-sibs-primary-1">
          Approval Request Filters
        </h2>

        <p className="mt-2 text-sm font-medium text-[#2F6CA5]">
          Search and filter submitted approval requests before review.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px_240px_auto] lg:items-end">
        <div className="min-w-0">
          <label className="mb-2 block text-sm font-extrabold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2F6CA5]"
            />

            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              disabled={loading}
              placeholder="Search request, requester, department, type, status, approver..."
              className="h-11 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/40 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]"
            />
          </div>
        </div>

        <CustomSelect
          label="Approval Status"
          value={statusFilter}
          options={statusOptions}
          allLabel="All Status"
          onChange={setStatusFilter}
        />

        <CustomSelect
          label="Request Type"
          value={typeFilter}
          options={requestTypeOptions}
          allLabel="All Types"
          onChange={setTypeFilter}
        />

        <button
          type="button"
          onClick={onClearFilters}
          disabled={loading || !hasActiveFilters}
          className={`inline-flex h-11 w-full items-center justify-center rounded-[10px] border px-4 text-sm font-extrabold transition active:scale-[0.98] lg:w-auto lg:min-w-[116px] ${
            hasActiveFilters
              ? "border-[#D6DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
              : "cursor-not-allowed border-[#E6ECF2] bg-[#F8FAFC] text-[#98A2B3]"
          }`}
        >
          Clear Filters
        </button>
      </div>

      <div className="mt-4 block sm:hidden">
        <button
          type="button"
          onClick={onSearchSubmit}
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search size={17} />
          Search
        </button>
      </div>
    </div>
  );
}

function ApprovalSearchTable({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  typeOptions,
  hasActiveFilters,
  onClearFilters,
}) {
  return (
    <div className={`${EDGE} ${PANEL_BORDER} bg-white p-5`}>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px_240px] xl:items-end">
        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search request, requester, department, type, status, approver..."
              className="h-11 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <CustomSelect
          label="Approval Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          allLabel="All Status"
          onChange={setStatusFilter}
        />

        <CustomSelect
          label="Request Type"
          value={typeFilter}
          options={typeOptions}
          allLabel="All Types"
          onChange={setTypeFilter}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

function ApprovalSummaryCards({ stats, activeModule, loading }) {
  const normalizedStats = {
    ...DEFAULT_COUNTS,
    ...(stats || {}),
  };

  const cards = [
    {
      title: "Total Requests",
      value: normalizedStats.total,
      icon: FileCheck2,
      className: "bg-blue-50 text-sibs-primary-1",
    },
    {
      title: "Pending",
      value: normalizedStats.pending,
      icon: Clock3,
      className: "bg-amber-50 text-amber-700",
    },
    {
      title: "For Review",
      value: normalizedStats.forReview,
      icon: AlertCircle,
      className: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Approved",
      value: normalizedStats.approved,
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Rejected",
      value: normalizedStats.rejected,
      icon: XCircle,
      className: "bg-red-50 text-red-700",
    },
  ];

  return (
    <section className={`${EDGE} ${PANEL_BORDER} overflow-hidden bg-white`}>
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`${EDGE} ${SOFT_PANEL_BORDER} bg-white p-4 transition hover:bg-[#FAFBFC]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-extrabold text-sibs-primary-1">
                    {loading ? "..." : card.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${card.className}`}
                >
                  <Icon size={21} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ApprovalModuleTabs({
  activeModule,
  onChangeModule,
  moduleNotificationCounts,
  requestModules = REQUEST_MODULES,
}) {
  if (!requestModules.length) return null;

  return (
    <div className="border-t border-[#E6ECF2] bg-white px-5">
      <div className="flex min-w-0 gap-8 overflow-x-auto">
        {requestModules.map((moduleName) => {
          const isActive = activeModule === moduleName;
          const ModuleIcon = moduleIconMap[moduleName] || FileCheck2;
          const notificationCount = Number(
            moduleNotificationCounts?.[moduleName] || 0,
          );
          const hasNotification = notificationCount > 0;

          return (
            <button
              key={moduleName}
              type="button"
              onClick={() => onChangeModule(moduleName)}
              className={`relative inline-flex h-14 shrink-0 items-center justify-center gap-2 border-b-2 px-1 text-sm font-extrabold transition ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-[#344054] hover:border-[#D0D5DD] hover:text-sibs-primary-1"
              }`}
            >
              <ModuleIcon
                size={16}
                strokeWidth={2.4}
                className={isActive ? "text-blue-600" : "text-sibs-tertiary-5"}
              />

              <span>{moduleName}</span>

              {hasNotification && (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold leading-none shadow-sm ${
                    isActive
                      ? "bg-red-500 text-white"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200"
                  }`}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalRequestTable({
  activeModule,
  requestModules = REQUEST_MODULES,
  requests,
  loadedCount,
  totalRecords,
  currentPage,
  totalPages,
  moduleNotificationCounts,
  loading,
  onView,
  onChangeModule,
  onPrevious,
  onNext,
}) {
  const isWorkforceModule = activeModule === "Workforce Hiring Plan";
  const colSpan = isWorkforceModule ? 11 : 9;

  return (
    <section className={`${EDGE} ${PANEL_BORDER} overflow-hidden bg-white`}>
      <div className="border-b border-[#E6ECF2] px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ListChecks size={14} />
              Request List
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1">
              Approval Requests
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Review submitted approval requests and check their current
              approval status.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Showing: {loadedCount} / {totalRecords}
          </div>
        </div>
      </div>

      <ApprovalModuleTabs
        activeModule={activeModule}
        requestModules={requestModules}
        onChangeModule={onChangeModule}
        moduleNotificationCounts={moduleNotificationCounts}
      />

      <div className="p-5" data-approval-table-top>
        {activeModule === "Job Description" ? (
          <JobDescriptionRequestTable
            requests={requests}
            loading={loading}
            totalRecords={totalRecords}
            onView={onView}
          />
        ) : activeModule === "Available Positions" ? (
          <AvailablePositionApprovalTable
            requests={requests}
            loading={loading}
            onView={onView}
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden lg:block">
              <div data-approval-table-scroll className="overflow-x-auto">
                <table
                  className={`w-full ${
                    isWorkforceModule ? "min-w-[1840px]" : "min-w-[1420px]"
                  } border-separate border-spacing-0 overflow-hidden rounded-[14px] border border-[#D9E2EC] bg-white text-left`}
                >
                  <thead>
                    <tr className="whitespace-nowrap bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                      <th className="px-5 py-4 first:rounded-tl-[14px]">
                        Request
                      </th>

                      <th className="px-5 py-4">SIBS ID</th>

                      <th className="px-5 py-4">Requester</th>

                      {isWorkforceModule && (
                        <th className="px-5 py-4">Account</th>
                      )}

                      <th className="px-5 py-4 text-center">Type</th>

                      <th className="px-5 py-4 text-center">
                        Date Requested
                      </th>

                      <th className="px-5 py-4 text-center">Priority</th>

                      {isWorkforceModule ? (
                        <>
                          <th className="px-5 py-4 text-center">
                            Recruitment Settings Status
                          </th>

                          <th className="px-5 py-4 text-center">
                            Update Headcount Status
                          </th>
                        </>
                      ) : (
                        <th className="px-5 py-4 text-center">Status</th>
                      )}

                      <th className="px-5 py-4">Approver</th>

                      <th className="px-5 py-4 text-right last:rounded-tr-[14px]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={colSpan}
                          className="px-5 py-12 text-center"
                        >
                          <Loader2
                            size={30}
                            className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                          />

                          <p className="text-sm font-bold text-gray-500">
                            Loading approval requests...
                          </p>
                        </td>
                      </tr>
                    ) : requests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={colSpan}
                          className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                        >
                          No approval requests found for {activeModule}.
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <ApprovalRequestRow
                          key={`${request.source || "request"}-${request.id}`}
                          request={request}
                          isWorkforceModule={isWorkforceModule}
                          onView={() => onView(request)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile */}
            <div className="block lg:hidden" data-approval-mobile-scroll>
              {loading ? (
                <div className="rounded-[14px] border border-[#D9E2EC] bg-white px-5 py-10 text-center shadow-sm">
                  <Loader2
                    size={30}
                    className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                  />

                  <p className="text-sm font-bold text-gray-500">
                    Loading approval requests...
                  </p>
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-[14px] border border-[#D9E2EC] bg-white px-5 py-10 text-center shadow-sm">
                  <p className="text-sm font-bold text-gray-500">
                    No approval requests found for {activeModule}.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <ApprovalRequestMobileCard
                      key={`${request.source || "request"}-${request.id}`}
                      request={request}
                      isWorkforceModule={isWorkforceModule}
                      onView={() => onView(request)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <PaginationTable
          loading={loading}
          showSearch={false}
          showPagination
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={loadedCount}
          totalRecords={totalRecords}
          recordLabel="approval requests"
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </div>
    </section>
  );
}

function AvailablePositionApprovalTable({
  requests = [],
  loading = false,
  onView,
}) {
  const desktopColumns = 10;
  const tableScrollRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
  });
  const [isTableDragging, setIsTableDragging] = useState(false);

  function handleTablePointerDown(event) {
    /*
      Keep buttons, links, and form controls clickable.
      Mouse users can drag anywhere else inside the table to scroll horizontally.
      Touch devices continue using their normal swipe behavior.
    */
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const interactiveElement = event.target.closest(
      "button, a, input, select, textarea, [role='button']",
    );

    if (interactiveElement) return;

    const container = tableScrollRef.current;

    if (!container || container.scrollWidth <= container.clientWidth) return;

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    };

    container.setPointerCapture?.(event.pointerId);
    setIsTableDragging(true);
    event.preventDefault();
  }

  function handleTablePointerMove(event) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (
      !container ||
      !dragState.active ||
      dragState.pointerId !== event.pointerId
    ) {
      return;
    }

    const distance = event.clientX - dragState.startX;

    container.scrollLeft = dragState.scrollLeft - distance;
    event.preventDefault();
  }

  function stopTableDragging(event) {
    const container = tableScrollRef.current;
    const pointerId = dragStateRef.current.pointerId;

    if (
      container &&
      pointerId !== null &&
      container.hasPointerCapture?.(pointerId)
    ) {
      try {
        container.releasePointerCapture(pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }

    dragStateRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      scrollLeft: container?.scrollLeft || 0,
    };

    setIsTableDragging(false);
  }

  return (
    <>
      <div className="hidden lg:block">
        <div
          ref={tableScrollRef}
          data-approval-table-scroll
          onPointerDown={handleTablePointerDown}
          onPointerMove={handleTablePointerMove}
          onPointerUp={stopTableDragging}
          onPointerCancel={stopTableDragging}
          onLostPointerCapture={stopTableDragging}
          className={`overflow-x-auto overscroll-x-contain pb-2 sibs-scrollbar ${
            isTableDragging
              ? "cursor-grabbing select-none"
              : "cursor-grab"
          }`}
          aria-label="Available Positions table. Drag left or right to view more columns."
        >
          <table className="min-w-[1640px] w-full border-separate border-spacing-0 overflow-hidden rounded-[14px] border border-[#D9E2EC] bg-white text-left">
            <thead>
              <tr className="whitespace-nowrap bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                <th className="px-5 py-4 first:rounded-tl-[14px]">Position</th>
                <th className="px-5 py-4">JD / Document</th>
                <th className="px-5 py-4">Department / Account</th>
                <th className="px-5 py-4">Location / Site</th>
                <th className="px-5 py-4 text-center">Availability</th>
                <th className="px-5 py-4 text-center">Approval Status</th>
                <th className="px-5 py-4">Requested By</th>
                <th className="px-5 py-4 text-center">Date Requested</th>
                <th className="px-5 py-4">Approver</th>
                <th className="px-5 py-4 text-right last:rounded-tr-[14px]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={desktopColumns} className="px-5 py-12 text-center">
                    <Loader2
                      size={30}
                      className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                    />
                    <p className="text-sm font-bold text-gray-500">
                      Loading Available Position requests...
                    </p>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={desktopColumns}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    No approval requests found for Available Positions.
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  const requesterInfo = getRequesterDisplayInfo(request);
                  const approvalStatus = getNormalizedRequestStatus(request);
                  const positionStatus = getRequestValue(
                    request,
                    ["positionStatus", "position_status"],
                    "Inactive",
                  );

                  return (
                    <tr
                      key={`${request.source || "available-position"}-${request.id}`}
                      className="transition hover:bg-[#FAFBFC]"
                    >
                      <td className="border-b border-[#E6ECF2] px-5 py-5">
                        <p className="max-w-[280px] truncate text-sm font-extrabold text-[#101828]">
                          {getRequestValue(
                            request,
                            ["positionTitle", "position_title", "title"],
                            "--",
                          )}
                        </p>
                        <p className="mt-1 max-w-[280px] truncate text-xs font-semibold text-sibs-tertiary-5">
                          {getRequestValue(
                            request,
                            ["positionId", "position_id"],
                            request.id || "--",
                          )}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5">
                        <p className="max-w-[220px] truncate text-sm font-extrabold text-sibs-primary-1">
                          {getRequestValue(request, ["jdCode", "jd_code"], "--")}
                        </p>
                        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
                          {getRequestValue(
                            request,
                            ["documentTitle", "document_title"],
                            "--",
                          )}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5">
                        <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
                          {getRequestValue(request, ["department"], "--")}
                        </p>
                        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
                          {getRequestValue(
                            request,
                            ["accountName", "account_name", "account"],
                            "--",
                          )}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-[#344054]">
                        {getRequestValue(
                          request,
                          ["locationSite", "location_site"],
                          "--",
                        )}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                        <PositionAvailabilityBadge status={positionStatus} />
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
                        <StatusBadge status={approvalStatus} />
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5">
                        <p className="max-w-[220px] truncate text-sm font-bold text-[#344054]">
                          {requesterInfo.name || "--"}
                        </p>
                        <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-sibs-tertiary-5">
                          {requesterInfo.sibsId || "--"}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                        {formatDate(request.dateRequested || request.requestDate)}
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5">
                        <p className="max-w-[260px] truncate text-sm font-bold text-[#344054]">
                          {request.approver || "--"}
                        </p>
                      </td>

                      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => onView(request)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block lg:hidden" data-approval-mobile-scroll>
        {loading ? (
          <div className="rounded-[14px] border border-[#D9E2EC] bg-white px-5 py-10 text-center shadow-sm">
            <Loader2
              size={30}
              className="mx-auto mb-3 animate-spin text-sibs-primary-1"
            />
            <p className="text-sm font-bold text-gray-500">
              Loading Available Position requests...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-[14px] border border-[#D9E2EC] bg-white px-5 py-10 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-500">
              No approval requests found for Available Positions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const requesterInfo = getRequesterDisplayInfo(request);
              const approvalStatus = getNormalizedRequestStatus(request);
              const positionStatus = getRequestValue(
                request,
                ["positionStatus", "position_status"],
                "Inactive",
              );

              return (
                <button
                  key={`${request.source || "available-position"}-${request.id}`}
                  type="button"
                  onClick={() => onView(request)}
                  className="w-full rounded-[14px] border border-[#D9E2EC] bg-white p-4 text-left shadow-sm transition hover:bg-[#F8FAFC]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold leading-tight text-[#101828]">
                        {getRequestValue(
                          request,
                          ["positionTitle", "position_title", "title"],
                          "--",
                        )}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        {getRequestValue(
                          request,
                          ["positionId", "position_id"],
                          request.id || "--",
                        )}
                      </p>
                    </div>
                    <StatusBadge status={approvalStatus} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MobileMetric
                      label="JD Code"
                      value={getRequestValue(
                        request,
                        ["jdCode", "jd_code"],
                        "--",
                      )}
                    />
                    <MobileMetric
                      label="Availability"
                      value={positionStatus}
                    />
                    <MobileMetric
                      label="Department"
                      value={getRequestValue(request, ["department"], "--")}
                    />
                    <MobileMetric
                      label="Account"
                      value={getRequestValue(
                        request,
                        ["accountName", "account_name", "account"],
                        "--",
                      )}
                    />
                    <MobileMetric
                      label="Location"
                      value={getRequestValue(
                        request,
                        ["locationSite", "location_site"],
                        "--",
                      )}
                    />
                    <MobileMetric
                      label="Requester"
                      value={requesterInfo.displayNameWithSibs}
                    />
                    <MobileMetric
                      label="Date Requested"
                      value={formatDate(
                        request.dateRequested || request.requestDate,
                      )}
                    />
                    <MobileMetric label="Approver" value={request.approver} />
                  </div>

                  <div className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1">
                    <Eye size={16} />
                    View Details
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function PositionAvailabilityBadge({ status }) {
  const normalized = String(status || "").trim().toLowerCase();

  const className = normalized === "active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : normalized === "archived"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${className}`}
    >
      {status || "Inactive"}
    </span>
  );
}

function ApprovalRequestRow({ request, isWorkforceModule, onView }) {
  const status = getNormalizedRequestStatus(request);
  const StatusIcon = getStatusIcon(status);
  const requestType = getRequestType(request);
  const displayRequestType = getApprovalRequestDisplayType(request);
  const recruitmentSettingsStatus = getRecruitmentSettingsStatus(request);
  const updateHeadcountStatus = getUpdateHeadcountStatus(request);
  const accountName = getAccountName(request);
  const isHiringNeeds = isHiringNeedsRequest(request);
  const isAvailablePosition = isAvailablePositionRequest(request);
  const isAttrition = isAttritionRequest(request);
  const requesterInfo = getRequesterDisplayInfo(request);

  const requesterSubtitle = isHiringNeeds
    ? `HC: ${getHiringNeedsHeadcountDisplay(request)} - ${
        getHiringNeedsDepartmentDisplay(request) || "--"
      }`
    : isAvailablePosition
      ? getRequestValue(
          request,
          ["locationSite", "location_site", "department"],
          "--",
        )
      : request.department || "--";

  return (
    <tr className="transition hover:bg-[#FAFBFC]">
      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[280px] truncate text-sm font-extrabold text-[#101828]">
          {request.title || "--"}
        </p>

        <p className="mt-1 max-w-[280px] truncate text-xs font-semibold text-sibs-tertiary-5">
          {request.id || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[120px] truncate text-sm font-extrabold text-sibs-primary-1">
          {requesterInfo.sibsId || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[240px] truncate text-sm font-bold text-[#344054]">
          {requesterInfo.name || "--"}
        </p>

        <p className="mt-1 max-w-[240px] truncate text-xs font-semibold text-sibs-tertiary-5">
          {requesterSubtitle}
        </p>
      </td>

      {isWorkforceModule && (
        <td className="border-b border-[#E6ECF2] px-5 py-5">
          <p className="max-w-[240px] truncate text-sm font-extrabold text-sibs-primary-1">
            {accountName}
          </p>

          <p className="mt-1 max-w-[240px] truncate text-xs font-semibold text-sibs-tertiary-5">
            {request.clusterName ||
              request.cluster_name ||
              request.department ||
              "--"}
          </p>
        </td>
      )}

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getApprovalRequestDisplayTypeClass(
            displayRequestType || requestType || request.type,
          )}`}
        >
          {displayRequestType || requestType || request.type || "--"}
        </span>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
        {formatDate(request.dateRequested || request.requestDate)}
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClass(
            request.priority,
          )}`}
        >
          {request.priority || "Normal"}
        </span>
      </td>

      {isWorkforceModule ? (
        <>
          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
            <StatusBadge status={recruitmentSettingsStatus} />
          </td>

          <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
            <StatusBadge
              status={updateHeadcountStatus || "No Request"}
              emptyText="No Request"
            />
          </td>
        </>
      ) : (
        <td className="border-b border-[#E6ECF2] px-5 py-5 text-center">
          <span
            className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
              status,
            )}`}
          >
            <StatusIcon size={14} />
            {status || "--"}
          </span>
        </td>
      )}

      <td className="border-b border-[#E6ECF2] px-5 py-5">
        <p className="max-w-[240px] truncate text-sm font-bold text-[#344054]">
          {request.approver || "--"}
        </p>
      </td>

      <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
        >
          <Eye size={15} />
          View
        </button>
      </td>
    </tr>
  );
}

function ApprovalRequestMobileCard({ request, isWorkforceModule, onView }) {
  const status = getNormalizedRequestStatus(request);
  const StatusIcon = getStatusIcon(status);
  const requestType = getRequestType(request);
  const displayRequestType = getApprovalRequestDisplayType(request);
  const recruitmentSettingsStatus = getRecruitmentSettingsStatus(request);
  const updateHeadcountStatus = getUpdateHeadcountStatus(request);
  const accountName = getAccountName(request);
  const isHiringNeeds = isHiringNeedsRequest(request);
  const requesterInfo = getRequesterDisplayInfo(request);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full rounded-[14px] border border-[#D9E2EC] bg-white p-4 text-left shadow-sm transition hover:bg-[#F8FAFC]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold leading-tight text-[#101828]">
            {request.title || "--"}
          </h3>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            {request.id || "--"}
          </p>
        </div>

        {!isWorkforceModule && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
              status,
            )}`}
          >
            <StatusIcon size={12} />
            {status || "--"}
          </span>
        )}
      </div>

      {isWorkforceModule && (
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={recruitmentSettingsStatus} />
          <StatusBadge
            status={updateHeadcountStatus || "No Request"}
            emptyText="No Request"
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric label="Requester" value={requesterInfo.name} />
        <MobileMetric label="SIBS ID" value={requesterInfo.sibsId} />
        {isWorkforceModule && <MobileMetric label="Account" value={accountName} />}
        {isHiringNeeds && (
          <MobileMetric
            label="Headcount"
            value={getHiringNeedsHeadcountDisplay(request)}
          />
        )}
        <MobileMetric
          label="Department"
          value={
            isHiringNeeds
              ? getHiringNeedsDepartmentDisplay(request)
              : request.department
          }
        />
        <MobileMetric label="Module" value={request.module} />
        <MobileTypeMetric
          label="Type"
          value={displayRequestType || requestType || request.type}
        />
        <MobileMetric label="Priority" value={request.priority || "Normal"} />
        <MobileMetric
          label="Date Requested"
          value={formatDate(request.dateRequested || request.requestDate)}
        />
        <MobileMetric label="Approver" value={request.approver} />
      </div>

      <div className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1">
        <Eye size={16} />
        View Details
      </div>
    </button>
  );
}

function MobileMetric({ label, value }) {
  return (
    <div className="rounded-[10px] bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-sibs-primary-1">
        {value || "--"}
      </p>
    </div>
  );
}

function MobileTypeMetric({ label, value }) {
  return (
    <div className="rounded-[10px] bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <span
        className={`mt-2 inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getApprovalRequestDisplayTypeClass(
          value,
        )}`}
      >
        <span className="truncate">{value || "--"}</span>
      </span>
    </div>
  );
}

function ViewApprovalRequestModal({
  open,
  request,
  onClose,
  onApprove,
  onReject,
  onValidationError,
  canViewHiringNeedsApproval = false,
  canViewAvailablePositionApproval = false,
}) {
  if (!open || !request) return null;

  const status = getNormalizedRequestStatus(request);
  const isResignation = isResignationRequest(request);
  const isWorkforce = isWorkforceHiringPlanRequest(request);
  const isHiringNeeds = isHiringNeedsRequest(request);
  const isAvailablePosition = isAvailablePositionRequest(request);
  const isAttrition = isAttritionRequest(request);
  const hiringNeedsRequestKind = isHiringNeeds
    ? getHiringNeedsRequestKind(request)
    : "";
  const isHiringNeedsDownsize = hiringNeedsRequestKind === "Downsize";
  const baseCanReview = request.canReview === true || request.raw?.canEdit === true;
  const isFinalDecision = status === "Approved" || status === "Rejected";
  const canReview = isHiringNeeds
    ? (baseCanReview || canViewHiringNeedsApproval) && !isFinalDecision
    : isAvailablePosition
      ? (baseCanReview || canViewAvailablePositionApproval) && !isFinalDecision
      : baseCanReview;
  const showHiringNeedsFooterActions =
    isHiringNeeds && canReview && !isFinalDecision;
  const showAvailablePositionFooterActions =
    isAvailablePosition && canReview && !isFinalDecision;
  const isWorkforceRecruitmentSettings =
    isWorkforceRecruitmentSettingsRequest(request);
  const canEditRequiredHeadcount =
    canEditRequiredHeadcountOnWorkforceApproval(request);

  const [workforceEditableRequiredHeadcount, setWorkforceEditableRequiredHeadcount] =
    useState("");

  useEffect(() => {
    if (!open || !request) {
      setWorkforceEditableRequiredHeadcount("");
      return;
    }

    /*
      HR / HR Admin edits Required Headcount directly in this
      Approval Request Workforce Hiring Plan modal.
      Keep it blank on every open so the final value is intentionally entered.
    */
    setWorkforceEditableRequiredHeadcount(
      canEditRequiredHeadcountOnWorkforceApproval(request) ? "" : "",
    );
  }, [open, request]);

  function handleApproveWorkforceHiringPlan() {
    if (canEditRequiredHeadcount) {
      const approvedRequiredHeadcount = normalizeHeadcountInput(
        workforceEditableRequiredHeadcount,
      );

      if (approvedRequiredHeadcount === "") {
        onValidationError?.({
          type: "error",
          title: "Required Headcount Required",
          message:
            "Please enter the final Required Headcount in the Workforce Hiring Plan modal before approving.",
        });
        return;
      }

      onApprove?.({
        editableRequiredHeadcount: approvedRequiredHeadcount,
        approvedRequiredHeadcount,
        finalRequiredHeadcount: approvedRequiredHeadcount,
      });
      return;
    }

    onApprove?.();
  }

  return createPortal(
    <div className="sibs-modal-blur fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[10px] border border-[#E1E7EF] bg-white shadow-xl">
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2FB] text-sibs-primary-1">
                <FileText size={22} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-sibs-primary-1">
                  {isAvailablePosition
                    ? "Available Position Request"
                    : isHiringNeeds
                      ? isHiringNeedsDownsize
                      ? "Downsize Request"
                      : "Personnel Requisition"
                    : isResignation
                      ? "View Resignation Approval"
                      : request.title || "Approval Request"}
                </h2>

                <p className="mt-1 text-sm font-medium text-[#2F6CA5]">
                  {isAvailablePosition
                    ? showAvailablePositionFooterActions
                      ? "Review the available position details, then approve or decline from the footer."
                      : "Review the submitted available position information and current approval status."
                    : isHiringNeeds
                      ? showHiringNeedsFooterActions
                      ? isHiringNeedsDownsize
                        ? "Review the downsize request details, then approve or decline from the footer."
                        : "Review the requisition details, then approve or decline from the footer."
                      : isHiringNeedsDownsize
                        ? "Review submitted downsize request information and current approval status."
                        : "Review submitted requisition information and current approval status."
                    : isWorkforce
                      ? "Workforce hiring plan approval request details"
                      : isResignation
                        ? "Resignation approval request details"
                        : `${request.title || "Approval Request"} details`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sibs-scrollbar">
          <div className="space-y-5">
            {isWorkforce ? (
              <WorkforceHiringPlanRequestDetails request={request} />
            ) : isAvailablePosition ? (
              <AvailablePositionRequestDetails request={request} />
            ) : isHiringNeeds ? (
              <HiringNeedsRequestDetails request={request} />
            ) : isAttrition ? (
              <AttritionRequestDetails request={request} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormLikeBox
                    label={isResignation ? "Resignation Date" : "Notice Date"}
                    value={formatDate(
                      request.dateRequested || request.requestDate,
                    )}
                  />

                  <FormLikeBox
                    label="Last Working Date"
                    value={formatDate(request.lastWorkingDate)}
                  />
                </div>

                <ApprovalProcessCards
                  request={request}
                  canReview={canReview}
                  onApprove={onApprove}
                  onReject={onReject}
                />

                <FormLikeBox
                  label="Reason"
                  value={request.reason || "--"}
                  large
                />
              </>
            )}

            {isWorkforce && (
              <WorkforceHiringPlanApprovalPanel
                request={request}
                canReview={canReview}
                editableRequiredHeadcount={workforceEditableRequiredHeadcount}
                onChangeEditableRequiredHeadcount={
                  setWorkforceEditableRequiredHeadcount
                }
                onApprove={handleApproveWorkforceHiringPlan}
                onReject={onReject}
              />
            )}

            {request.uploadedFileUrl && (
              <div>
                <p className="mb-2 text-sm font-bold text-sibs-primary-1">
                  Uploaded File
                </p>

                <a
                  href={getFileUrl(request.uploadedFileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[74px] items-center gap-3 rounded-[10px] border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold text-[#2F6CA5] transition hover:bg-[#F8FAFC]"
                >
                  <FileTypeMini filename={request.uploadedFile} />

                  <span className="min-w-0 truncate">
                    {request.uploadedFile || "Open Attachment"}
                  </span>
                </a>
              </div>
            )}

            {!isHiringNeeds && !isAvailablePosition && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormLikeBox label="Status" value={status} />
                <FormLikeBox label="Source" value={request.source || "--"} />
                <FormLikeBox label="Raw ID" value={request.rawId || "--"} />
              </div>
            )}

            {request.remarks && (
              <FormLikeBox
                label="Request Remarks"
                value={request.remarks || "--"}
                large
              />
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-sibs-tertiary-5">
              {isAvailablePosition
                ? showAvailablePositionFooterActions
                  ? "You can approve or decline this Available Position request."
                  : isFinalDecision
                    ? `Request status: ${status}`
                    : "Only users added in Recruitment Settings > Approval Rules > Available Positions can approve or decline this request."
                : isHiringNeeds
                  ? showHiringNeedsFooterActions
                    ? "You can approve or decline this Hiring Needs request."
                    : isFinalDecision
                      ? `Request status: ${status}`
                      : "Only users added in Recruitment Settings > Approval Rules > Hiring Needs can approve or decline this request."
                  : "Review the request details before closing."}
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98]"
              >
                Close
              </button>

              {showHiringNeedsFooterActions && (
                <>
                  <button
                    type="button"
                    onClick={onReject}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-5 text-sm font-extrabold text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                  >
                    <XCircle size={17} />
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={onApprove}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>
                </>
              )}

              {showAvailablePositionFooterActions && (
                <>
                  <button
                    type="button"
                    onClick={onReject}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-5 text-sm font-extrabold text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                  >
                    <XCircle size={17} />
                    Decline
                  </button>

                  <button
                    type="button"
                    onClick={onApprove}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                  >
                    <CheckCircle2 size={17} />
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}


function AvailablePositionRequestDetails({ request }) {
  const status = getNormalizedRequestStatus(request);
  const raw = request?.raw || {};

  const positionTitle =
    request?.positionTitle ||
    request?.position_title ||
    request?.title ||
    raw?.positionTitle ||
    raw?.position_title ||
    raw?.title ||
    "--";

  const requesterInfo = getRequesterDisplayInfo(request);

  const description = getRequestValue(
    request,
    ["description"],
    "--",
  );

  const preferredSkills = getRequestValue(
    request,
    ["preferredSkills", "preferred_skills", "qualifications"],
    "--",
  );

  const approvalDate = getRequestValue(
    request,
    ["approvalDate", "approval_date", "approvedAt", "approved_at"],
    "",
  );

  const approvedBy = getRequestValue(
    request,
    [
      "approvedByName",
      "approved_by_name",
      "approvedBy",
      "approved_by",
      "approvedBySibsId",
      "approved_by_sibs_id",
    ],
    "--",
  );

  return (
    <section className="rounded-[10px] border border-[#E1E7EF] bg-white p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#101828]">
            Available Position Request Details
          </h3>

          <p className="mt-1 text-sm font-semibold text-[#2F6CA5]">
            Review the submitted position information before making an approval
            decision.
          </p>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormLikeBox label="Position Title" value={positionTitle} />
        <FormLikeBox
          label="Position ID"
          value={getRequestValue(
            request,
            ["positionId", "position_id"],
            "--",
          )}
        />
        <FormLikeBox
          label="Document Title"
          value={getRequestValue(
            request,
            ["documentTitle", "document_title"],
            "--",
          )}
        />
        <FormLikeBox
          label="JD Code"
          value={getRequestValue(request, ["jdCode", "jd_code"], "--")}
        />
        <FormLikeBox
          label="Department"
          value={getRequestValue(
            request,
            ["department", "departmentName", "department_name"],
            "--",
          )}
        />
        <FormLikeBox
          label="Account"
          value={getRequestValue(
            request,
            ["accountName", "account_name", "account"],
            "--",
          )}
        />
        <FormLikeBox
          label="Account GHL Name"
          value={getRequestValue(
            request,
            ["accountGhlName", "account_ghl_name"],
            "--",
          )}
        />
        <FormLikeBox
          label="Location / Site"
          value={getRequestValue(
            request,
            ["locationSite", "location_site", "location"],
            "--",
          )}
        />
        <FormLikeBox
          label="Position Availability"
          value={getRequestValue(
            request,
            ["positionStatus", "position_status"],
            "Inactive",
          )}
        />
        <FormLikeBox
          label="Requester"
          value={requesterInfo.displayNameWithSibs}
        />
        <FormLikeBox
          label="Date Requested"
          value={formatDate(request.dateRequested || request.requestDate)}
        />
        <FormLikeBox label="Assigned Approver" value={request.approver || "--"} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormLikeBox label="Description" value={description} large />
        <FormLikeBox
          label="Preferred Skills"
          value={preferredSkills}
          large
        />
      </div>

      <div className="mt-6 border-t border-[#E6ECF2] pt-5">
        <h3 className="text-base font-extrabold text-[#101828]">
          Approval Details
        </h3>

        <p className="mt-1 text-sm font-semibold text-[#2F6CA5]">
          Current approval decision and recorded remarks.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormLikeBox label="Approval Status" value={status} />
          <FormLikeBox label="Approval Date" value={formatDate(approvalDate)} />
          <FormLikeBox label="Approved / Rejected By" value={approvedBy} />
          <FormLikeBox
            label="Approval Remarks"
            value={getRequestValue(
              request,
              ["approvalRemarks", "approval_remarks", "remarks"],
              "--",
            )}
            large
          />
        </div>
      </div>
    </section>
  );
}


function getHiringNeedsRequestKind(request = {}) {
  const raw = request?.raw || {};

  const type = String(
    request?.hiringRequestType ||
      request?.hiring_request_type ||
      request?.requestType ||
      request?.request_type ||
      raw?.hiringRequestType ||
      raw?.hiring_request_type ||
      raw?.requestType ||
      raw?.request_type ||
      "",
  )
    .trim()
    .toLowerCase();

  if (type === "downsize") return "Downsize";

  const titleText = String(request?.title || raw?.title || "").toLowerCase();
  const reasonText = String(request?.reason || raw?.reason || "").toLowerCase();

  if (titleText.includes("downsize") || reasonText.includes("downsize")) {
    return "Downsize";
  }

  return "Requisition";
}

function getHiringNeedsWeekRange(request = {}) {
  const raw = request?.raw || {};

  const dateRange =
    request?.weeklyWeekDateRange ||
    request?.weekly_week_date_range ||
    raw?.weeklyWeekDateRange ||
    raw?.weekly_week_date_range ||
    "";

  if (dateRange) return dateRange;

  const start =
    request?.weeklyWeekStart ||
    request?.weekly_week_start ||
    request?.weekStart ||
    request?.week_start ||
    raw?.weeklyWeekStart ||
    raw?.weekly_week_start ||
    raw?.weekStart ||
    raw?.week_start ||
    "";

  const end =
    request?.weeklyWeekEnd ||
    request?.weekly_week_end ||
    request?.weekEnd ||
    request?.week_end ||
    raw?.weeklyWeekEnd ||
    raw?.weekly_week_end ||
    raw?.weekEnd ||
    raw?.week_end ||
    "";

  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);

  if (formattedStart !== "--" && formattedEnd !== "--") {
    return `${formattedStart} - ${formattedEnd}`;
  }

  if (formattedStart !== "--") return formattedStart;
  if (formattedEnd !== "--") return formattedEnd;

  return "--";
}

function getHiringNeedsDepartmentDisplay(request = {}) {
  const raw = request?.raw || {};

  return (
    request?.departmentAccount ||
    request?.department_account ||
    raw?.departmentAccount ||
    raw?.department_account ||
    request?.departmentName ||
    request?.department_name ||
    raw?.departmentName ||
    raw?.department_name ||
    request?.department ||
    raw?.department ||
    "--"
  );
}

function getHiringNeedsAccountDisplay(request = {}) {
  const raw = request?.raw || {};

  return (
    request?.accountName ||
    request?.account_name ||
    raw?.accountName ||
    raw?.account_name ||
    request?.account ||
    raw?.account ||
    "--"
  );
}

function getHiringNeedsDownsizeReason(request = {}) {
  const raw = request?.raw || {};

  return (
    request?.downsizeReason ||
    request?.downsize_reason ||
    raw?.downsizeReason ||
    raw?.downsize_reason ||
    request?.reasonForHiring ||
    request?.reason_for_hiring ||
    raw?.reasonForHiring ||
    raw?.reason_for_hiring ||
    request?.reason ||
    raw?.reason ||
    "--"
  );
}

function getHiringNeedsReasonDisplay(request = {}) {
  const raw = request?.raw || {};

  return (
    request?.reasonForHiring ||
    request?.reason_for_hiring ||
    raw?.reasonForHiring ||
    raw?.reason_for_hiring ||
    request?.reason ||
    raw?.reason ||
    "--"
  );
}

function getHiringNeedsSupportingFileUrl(request = {}) {
  const raw = request?.raw || {};

  return (
    request?.supportingFilePath ||
    request?.supporting_file_path ||
    request?.supportingFileUrl ||
    request?.supporting_file_url ||
    raw?.supportingFilePath ||
    raw?.supporting_file_path ||
    raw?.supportingFileUrl ||
    raw?.supporting_file_url ||
    ""
  );
}

function getHiringNeedsSupportingFileName(request = {}) {
  const raw = request?.raw || {};

  return (
    request?.supportingFileName ||
    request?.supporting_file_name ||
    raw?.supportingFileName ||
    raw?.supporting_file_name ||
    "Supporting file"
  );
}

function getHiringNeedsPreviousRequiredHeadcount(request = {}) {
  return getRequestValue(
    request,
    [
      "previousRequiredHeadcount",
      "previous_required_headcount",
      "previousHeadcount",
      "previous_headcount",
      "previousRequiredHC",
      "previous_required_hc",
    ],
    "0",
  );
}

function HiringNeedsRequestDetails({ request }) {
  const requestKind = getHiringNeedsRequestKind(request);
  const isDownsize = requestKind === "Downsize";

  const headcount = getRequestValue(
    request,
    [
      "headcount",
      "head_count",
      "approvedRequirement",
      "approved_requirement",
      "requestedHeadcount",
      "requested_headcount",
      "requiredHeadcount",
      "required_headcount",
      "hc",
    ],
    "--",
  );

  const previousRequiredHeadcount = getHiringNeedsPreviousRequiredHeadcount(request);

  const headcountNumber = Number(headcount);
  const displayHeadcount = Number.isFinite(headcountNumber)
    ? formatNumber(headcountNumber)
    : safeText(headcount);

  const previousHeadcountNumber = Number(previousRequiredHeadcount);
  const displayPreviousHeadcount = Number.isFinite(previousHeadcountNumber)
    ? formatNumber(previousHeadcountNumber)
    : safeText(previousRequiredHeadcount);

  const status = getNormalizedRequestStatus(request);
  const displayStatus = status === "Rejected" ? "Not Approved" : status;

  const dateNeeded = getRequestValue(
    request,
    [
      "dateNeeded",
      "date_needed",
      "requestedStartDate",
      "requested_start_date",
      "dueDate",
      "due_date",
      "neededDate",
      "needed_date",
      "targetDate",
      "target_date",
    ],
    "",
  );

  const approvalDate = getRequestValue(
    request,
    ["approvalDate", "approval_date", "approvedAt", "approved_at"],
    "",
  );

  const approvedBy = getRequestValue(
    request,
    ["approvedBy", "approved_by", "approvedByName", "approved_by_name"],
    "--",
  );

  const approvalRemarks =
    request.approvalRemarks ||
    request.approval_remarks ||
    request.remarks ||
    getRequestValue(request, ["approveRemarks", "approve_remarks"], "--");

  const requesterInfo = getRequesterDisplayInfo(request);

  const supportingFileUrl = getHiringNeedsSupportingFileUrl(request);
  const supportingFileName = getHiringNeedsSupportingFileName(request);

  return (
    <section className="rounded-[10px] border border-[#E1E7EF] bg-white p-5">
      <div className="mb-5">
        <h3 className="text-base font-extrabold text-[#101828]">
          {isDownsize ? "Downsize Request Details" : "Request Details"}
        </h3>

        <p className="mt-1 text-sm font-semibold text-[#2F6CA5]">
          {isDownsize
            ? "Submitted downsize request information from the selected Workforce Hiring Plan account."
            : "Submitted request information and staffing requirement."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RequestTypeFormLikeBox value={requestKind} />

        <FormLikeBox
          label={isDownsize ? "Headcount to Downsize" : "Headcount"}
          value={displayHeadcount}
        />

        {isDownsize ? (
          <>
            <FormLikeBox
              label="Week Range"
              value={getHiringNeedsWeekRange(request)}
            />

            <FormLikeBox
              label="Previous Required Headcount"
              value={displayPreviousHeadcount}
            />
          </>
        ) : (
          <FormLikeBox label="Date Needed" value={formatDate(dateNeeded)} />
        )}

        <FormLikeBox
          label="Requester Name"
          value={requesterInfo.displayNameWithSibs}
        />

        <FormLikeBox label="Requester SIBS ID" value={requesterInfo.sibsId} />

        <FormLikeBox
          label="Submitted Date"
          value={formatDate(request.dateRequested || request.requestDate)}
        />

        <FormLikeBox label="Account" value={getHiringNeedsAccountDisplay(request)} />

        <FormLikeBox
          label="Department / Account"
          value={getHiringNeedsDepartmentDisplay(request)}
        />

        <FormLikeBox
          label="Location Site"
          value={getRequestValue(request, ["locationSite", "location_site"], "--")}
        />

        <FormLikeBox
          label="Hiring Manager"
          value={getRequestValue(
            request,
            ["hiringManager", "hiring_manager"],
            requesterInfo.name,
          )}
        />

        <FormLikeBox
          label={isDownsize ? "Downsize Reason" : "Reason for Hiring"}
          value={
            isDownsize
              ? getHiringNeedsDownsizeReason(request)
              : getHiringNeedsReasonDisplay(request)
          }
          large
        />
      </div>

      {isDownsize && supportingFileUrl && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-bold text-sibs-primary-1">
            Supporting File
          </p>

          <a
            href={getFileUrl(supportingFileUrl)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[74px] items-center gap-3 rounded-[10px] border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-semibold text-[#2F6CA5] transition hover:bg-[#F8FAFC]"
          >
            <FileTypeMini filename={supportingFileName} />

            <span className="min-w-0 truncate">
              {supportingFileName || "Open supporting file"}
            </span>
          </a>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-base font-extrabold text-[#101828]">
          Approval Details
        </h3>

        <p className="mt-1 text-sm font-semibold text-[#2F6CA5]">
          Current approval information and recorded decision details.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormLikeBox label="Approval Status" value={displayStatus} />

        <FormLikeBox label="Approval Date" value={formatDate(approvalDate)} />

        <FormLikeBox label="Approved By" value={approvedBy} />

        <FormLikeBox
          label="Approval Remarks"
          value={approvalRemarks}
          large
        />
      </div>
    </section>
  );
}


function HiringNeedsApprovalPanel({
  request,
  canReview,
  canViewHiringNeedsApproval = false,
  onApprove,
  onReject,
}) {
  const status = getNormalizedRequestStatus(request);
  const isFinal = status === "Approved" || status === "Rejected";
  const notAuthorized = !canViewHiringNeedsApproval && !isFinal;
  const disabled = !canReview || !canViewHiringNeedsApproval || isFinal;

  return (
    <section
      className={`rounded-[10px] border p-5 ${
        notAuthorized
          ? "border-slate-200 bg-slate-50"
          : "border-emerald-100 bg-emerald-50"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div
            className={`inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
              notAuthorized
                ? "border-slate-200 text-slate-700"
                : "border-emerald-200 text-emerald-700"
            }`}
          >
            <CheckCircle2 size={14} />
            {notAuthorized ? "Approval Rule Required" : "Ready for Decision"}
          </div>

          <h3
            className={`mt-3 text-base font-extrabold ${
              notAuthorized ? "text-slate-800" : "text-emerald-800"
            }`}
          >
            HR Admin Approval
          </h3>

          <p
            className={`mt-1 text-sm font-semibold leading-6 ${
              notAuthorized ? "text-slate-600" : "text-emerald-700"
            }`}
          >
            {notAuthorized
              ? "You can view this PRF, but decision buttons are hidden because your SIBS ID is not added in Recruitment Settings > Approval Rules > Hiring Needs."
              : "Review the PRF details, add remarks if needed, then choose an approval decision."}
          </p>
        </div>

        <StatusBadge status={status === "Rejected" ? "Rejected" : status} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-[#344054]">
          {isFinal
            ? "This Personnel Requisition already has a final HR Admin decision."
            : notAuthorized
              ? "No approval action is available for this account. Add the user first in Hiring Needs approval rules."
              : "Decision buttons are available in this HR Admin Review panel."}
        </p>

        {!notAuthorized && !isFinal && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onReject}
              disabled={disabled}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-5 text-sm font-extrabold transition active:scale-[0.98] ${
                disabled
                  ? "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              <XCircle size={16} />
              Not Approved
            </button>

            <button
              type="button"
              onClick={onApprove}
              disabled={disabled}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-5 text-sm font-extrabold transition active:scale-[0.98] ${
                disabled
                  ? "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                  : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <CheckCircle2 size={16} />
              Approve
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function WorkforceHiringPlanRequestDetails({ request }) {
  const raw = request?.raw || {};
  const requestType = getRequestType(request);
  const recruitmentSettingsStatus = getRecruitmentSettingsStatus(request);
  const updateHeadcountStatus = getUpdateHeadcountStatus(request);
  const requiredHeadcount = getRequiredHeadcount(request);
  const requestedRequiredHeadcount = getRequestedRequiredHeadcount(request);

  const accountName =
    request?.accountName ||
    request?.account_name ||
    raw?.accountName ||
    raw?.account_name ||
    "--";

  const clusterName =
    request?.clusterName ||
    request?.cluster_name ||
    raw?.clusterName ||
    raw?.cluster_name ||
    "--";

  const weekLabel =
    request?.weekLabel ||
    request?.week_label ||
    raw?.weekLabel ||
    raw?.week_label ||
    "--";

  const weekStart =
    request?.weekStart ||
    request?.week_start ||
    raw?.weekStart ||
    raw?.week_start;

  const weekEnd =
    request?.weekEnd || request?.week_end || raw?.weekEnd || raw?.week_end;

  const actualHeadcount =
    request?.actualHeadcount ??
    request?.actual_headcount ??
    raw?.actualHeadcount ??
    raw?.actual_headcount ??
    0;

  const opsPrf =
    request?.opsPrf ?? request?.ops_prf ?? raw?.opsPrf ?? raw?.ops_prf ?? 0;

  const actualHeadcountNeeds =
    request?.actualHeadcountNeeds ??
    request?.actual_headcount_needs ??
    raw?.actualHeadcountNeeds ??
    raw?.actual_headcount_needs ??
    0;

  return (
    <section className="rounded-[10px] border border-[#E1E7EF] bg-white p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-sibs-primary-1">
            Workforce Hiring Plan Request
          </h3>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            HR / HR Admin edits Required Headcount from this approval request.
            After approval, OM can update weekly headcount from the Workforce
            Hiring Plan page and HR / HR Admin reviews that update here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={recruitmentSettingsStatus} />
          <StatusBadge
            status={updateHeadcountStatus || "No Request"}
            emptyText="No Request"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormLikeBox label="Request Type" value={requestType || "--"} />
        <FormLikeBox label="Account" value={accountName} />
        <FormLikeBox label="Cluster" value={clusterName} />
        <FormLikeBox label="Week" value={weekLabel} />
        <FormLikeBox label="Week Start" value={formatDate(weekStart)} />
        <FormLikeBox label="Week End" value={formatDate(weekEnd)} />
        <FormLikeBox
          label="Recruitment Settings Status"
          value={recruitmentSettingsStatus}
        />
        <FormLikeBox
          label="Update Headcount Status"
          value={updateHeadcountStatus || "No Request"}
        />
        <FormLikeBox
          label="Current Required HC"
          value={formatNumber(requiredHeadcount)}
        />
        <FormLikeBox
          label="Requested Required HC"
          value={
            requestedRequiredHeadcount === null ||
            requestedRequiredHeadcount === undefined ||
            requestedRequiredHeadcount === ""
              ? "--"
              : formatNumber(requestedRequiredHeadcount)
          }
        />
        <FormLikeBox label="Actual HC" value={formatNumber(actualHeadcount)} />
        <FormLikeBox label="OPS PRF" value={formatNumber(opsPrf)} />
        <FormLikeBox
          label="Actual Headcount Needs"
          value={formatNumber(actualHeadcountNeeds)}
        />
        <FormLikeBox
          label="Requested By"
          value={request.requester || request.employeeName || "--"}
        />
        <FormLikeBox label="Approver" value={request.approver || "--"} />
        <FormLikeBox
          label="Date Requested"
          value={formatDate(request.dateRequested || request.requestDate)}
        />
      </div>

      {(request.reason || request.remarks) && (
        <div className="mt-4">
          <FormLikeBox
            label="Remarks / Reason"
            value={request.reason || request.remarks || "--"}
            large
          />
        </div>
      )}
    </section>
  );
}

function WorkforceHiringPlanApprovalPanel({
  request,
  canReview,
  editableRequiredHeadcount = "",
  onChangeEditableRequiredHeadcount,
  onApprove,
  onReject,
}) {
  const status = getNormalizedRequestStatus(request);
  const requestType = getRequestType(request);
  const isFinal = status === "Approved" || status === "Rejected";
  const allowedByRole = canCurrentUserApproveWorkforceHiringPlan();
  const disabled = !canReview || !allowedByRole || isFinal;

  const requiredHeadcount = getRequiredHeadcount(request);
  const requestedRequiredHeadcount = getRequestedRequiredHeadcount(request);
  const isRecruitmentSettings = isWorkforceRecruitmentSettingsRequest(request);
  const isUpdateHeadcount = isWorkforceUpdateHeadcountRequest(request);
  const canEditRequiredHeadcount =
    canEditRequiredHeadcountOnWorkforceApproval(request);
  const approvedRequiredHeadcountValue = normalizeHeadcountInput(
    editableRequiredHeadcount,
  );

  const displayRequestedRequiredHeadcount =
    requestedRequiredHeadcount === null ||
    requestedRequiredHeadcount === undefined ||
    requestedRequiredHeadcount === ""
      ? "--"
      : formatNumber(requestedRequiredHeadcount);

  return (
    <section className="rounded-[10px] border border-[#E1E7EF] bg-[#F8FAFC] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
            <UserRoundCheck size={14} />
            HR / HR Admin Approval
          </div>

          <h3 className="mt-3 text-base font-extrabold text-sibs-primary-1">
            Workforce Hiring Plan Approval
          </h3>

          <p className="mt-1 text-sm font-medium leading-6 text-sibs-tertiary-5">
            {canEditRequiredHeadcount
              ? "Edit the final Required Headcount here before approval. This is the value HR / HR Admin will apply to the selected workforce hiring plan account."
              : "OM headcount updates from the Workforce Hiring Plan page are reviewed here. Only HR / HR Admin can approve or decline the update."}
          </p>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormLikeBox label="Approval Owner" value="HR / HR Admin" />
        <FormLikeBox label="Request Type" value={requestType || "--"} />
        <FormLikeBox
          label="Current Required HC"
          value={formatNumber(requiredHeadcount)}
        />
        <FormLikeBox
          label="Requested Required HC"
          value={displayRequestedRequiredHeadcount}
        />
      </div>

      {canEditRequiredHeadcount && (
        <div className="mt-5 rounded-[10px] border border-blue-100 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px] lg:items-start">
            <div>
              <h4 className="text-sm font-extrabold text-sibs-primary-1">
                Edit Required Headcount
              </h4>

              <p className="mt-2 text-sm font-medium leading-6 text-sibs-tertiary-5">
                HR / HR Admin must enter the final Required Headcount before
                clicking Approve. This field is inside the Approval Request
                Workforce Hiring Plan modal.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                Final Required HC <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={editableRequiredHeadcount || ""}
                onChange={(e) =>
                  onChangeEditableRequiredHeadcount?.(e.target.value)
                }
                disabled={disabled}
                placeholder="Enter final Required HC"
                className="h-11 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#667085]"
              />

              {approvedRequiredHeadcountValue === "" && !isFinal && (
                <p className="mt-2 text-xs font-extrabold text-red-600">
                  Required Headcount is required before approval.
                </p>
              )}

              <p className="mt-2 text-xs font-semibold text-[#2F6CA5]">
                Final value to apply:{" "}
                {approvedRequiredHeadcountValue === ""
                  ? "--"
                  : formatNumber(approvedRequiredHeadcountValue)}
              </p>
            </div>
          </div>
        </div>
      )}

      {isUpdateHeadcount && (
        <div className="mt-4 rounded-[10px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-sibs-primary-1">
          This request came from OM updating headcount in the Workforce Hiring Plan
          page. HR / HR Admin approval is required before it becomes final.
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[#344054]">
          {isFinal
            ? "This Workforce Hiring Plan request already has a final HR / HR Admin decision."
            : !allowedByRole
              ? "Only HR and HR Admin can approve or decline this request."
              : canEditRequiredHeadcount
                ? "Enter the final Required Headcount above, then click Approve."
                : "Review the OM headcount update before approving or declining."}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onApprove}
            disabled={disabled}
            className={`inline-flex h-10 items-center justify-center rounded-[10px] border px-5 text-sm font-bold transition active:scale-[0.98] ${
              disabled
                ? "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Approve
          </button>

          <button
            type="button"
            onClick={onReject}
            disabled={disabled}
            className={`inline-flex h-10 items-center justify-center rounded-[10px] border px-5 text-sm font-bold transition active:scale-[0.98] ${
              disabled
                ? "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            Decline
          </button>
        </div>
      </div>
    </section>
  );
}

function ApprovalProcessCards({ request, canReview, onApprove, onReject }) {
  const steps = getApprovalSteps(request);
  const activeStepKey = getActiveApprovalStepKey(request);

  if (!steps.length) return null;

  const gridColumnClass =
    steps.length === 1
      ? "md:grid-cols-1"
      : steps.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridColumnClass}`}>
      {steps.map((step) => {
        const status = getStepStatus(step);
        const isActive = canReview && activeStepKey === step.key;
        const disabled = !isActive || status !== "Pending";

        return (
          <div
            key={step.key}
            className="rounded-[10px] border border-[#E1E7EF] bg-[#F8FAFC] p-4 text-sibs-primary-1"
          >
            <div className="mb-3 flex items-center gap-2">
              <UserRoundCheck size={17} />
              <p className="text-sm font-extrabold">{step.label}</p>
            </div>

            <p className="min-h-[44px] text-sm font-semibold leading-5 text-[#2F6CA5]">
              {step.name || "--"}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onApprove}
                disabled={disabled}
                className={`inline-flex h-10 items-center justify-center rounded-[10px] border px-4 text-sm font-bold transition active:scale-[0.98] ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                }`}
              >
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={disabled}
                className={`inline-flex h-10 items-center justify-center rounded-[10px] border px-4 text-sm font-bold transition active:scale-[0.98] ${
                  isActive
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "cursor-not-allowed border-[#D6DEE8] bg-white text-[#667085] opacity-70"
                }`}
              >
                Decline
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <MiniInfo
                label="Personally Spoken"
                value={step.personallySpoken}
              />

              <MiniInfo
                label="Employee Retained"
                value={step.employeeRetained}
              />

              {step.personallySpoken === "Yes" && (
                <MiniInfo label="What Have You Done" value={step.actionTaken} />
              )}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-sibs-primary-1">
                Remarks
              </p>

              <div className="min-h-[104px] rounded-[10px] border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-medium leading-5 text-[#344054]">
                {step.remarks || (
                  <span className="text-[#98A2B3]">No remarks yet</span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                  status,
                )}`}
              >
                {React.createElement(getStatusIcon(status), { size: 14 })}
                {status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-[10px] border border-[#E6ECF2] bg-white px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-line text-xs font-bold text-sibs-primary-1">
        {safeText(value)}
      </p>
    </div>
  );
}

function FormLikeBox({ label, value, large = false }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-sibs-primary-1">{label}</p>

      <div
        className={`rounded-[10px] border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-medium text-[#344054] ${
          large ? "min-h-[46px] whitespace-pre-line" : "min-h-[43px]"
        }`}
      >
        {safeText(value)}
      </div>
    </div>
  );
}

function RequestTypeFormLikeBox({ label = "Request Type", value }) {
  return (
    <FormLikeBox label={label} value={safeText(value)} />
  );
}

function FileTypeMini({ filename }) {
  const ext = String(filename || "")
    .split(".")
    .pop()
    ?.toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  const isPdf = ext === "pdf";
  const isExcel = ["xls", "xlsx", "csv"].includes(ext);
  const isWord = ["doc", "docx"].includes(ext);

  const label = isImage
    ? "IMG"
    : isPdf
      ? "PDF"
      : isExcel
        ? "XLS"
        : isWord
          ? "DOC"
          : "FILE";

  const badgeClass = isImage
    ? "bg-purple-600"
    : isPdf
      ? "bg-red-600"
      : isExcel
        ? "bg-green-600"
        : isWord
          ? "bg-blue-600"
          : "bg-gray-600";

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-0.5 w-5 bg-gray-300" />

      <div
        className={`absolute bottom-1 left-[-8px] rounded-md px-2 py-1 text-[10px] font-bold leading-none text-white shadow-sm ${badgeClass}`}
      >
        {label}
      </div>
    </div>
  );
}

function DecisionModal({
  open,
  action,
  request,
  remarks,
  personallySpoken,
  employeeRetained,
  actionTaken,
  editableRequiredHeadcount,
  loading,
  onChangeRemarks,
  onChangePersonallySpoken,
  onChangeEmployeeRetained,
  onChangeActionTaken,
  onChangeEditableRequiredHeadcount,
  onClose,
  onSubmit,
}) {
  if (!open || !request) return null;

  const isApprove = action === "approve";
  const requestStatus = getNormalizedRequestStatus(request);
  const isResignation = isResignationRequest(request);
  const isHiringNeeds = isHiringNeedsRequest(request);
  const isAvailablePosition = isAvailablePositionRequest(request);
  const isWorkforce = isWorkforceHiringPlanRequest(request);
  const isWorkforceRecruitmentSettings =
    isWorkforceRecruitmentSettingsRequest(request);
  const isWorkforceUpdateHeadcount = isWorkforceUpdateHeadcountRequest(request);
  const displayRequestType = getApprovalRequestDisplayType(request);
  const canEditRequiredHeadcount =
    canEditRequiredHeadcountOnWorkforceApproval(request);
  const approvedRequiredHeadcountValue = normalizeHeadcountInput(
    editableRequiredHeadcount,
  );

  return createPortal(
    <div className="sibs-modal-blur fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[10px] border border-[#E1E7EF] bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-extrabold uppercase tracking-tight text-sibs-primary-1">
                {isAvailablePosition
                  ? isApprove
                    ? "Approve Available Position"
                    : "Decline Available Position"
                  : isHiringNeeds
                    ? isApprove
                      ? "Approve Hiring Needs"
                      : "Decline Hiring Needs"
                    : isApprove
                    ? "Approve Request"
                    : "Reject Request"}
              </h2>

              <p className="mt-1 truncate text-sm font-semibold text-[#2F6CA5]">
                {request.id || "--"} / {request.title || request.type || "--"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-sibs-tertiary-5 transition hover:bg-[#F2F6FA] hover:text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sibs-scrollbar">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-[10px] border border-[#E1E7EF] bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                      Request
                    </p>

                    <h3 className="mt-2 truncate text-xl font-extrabold text-[#101828]">
                      {request.title || "Approval Request"}
                    </h3>

                    <p className="mt-2 text-sm font-bold text-[#2F6CA5]">
                      {getRequesterDisplayInfo(request).displayNameWithSibs}
                    </p>

                    <p className="mt-1 text-xs font-bold text-sibs-tertiary-5">
                      SIBS ID: {getRequesterDisplayInfo(request).sibsId}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={requestStatus} />

                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getApprovalRequestDisplayTypeClass(
                          displayRequestType || getRequestType(request) || request.type,
                        )}`}
                      >
                        {displayRequestType || getRequestType(request) || request.type || "--"}
                      </span>
                    </div>
                  </div>

                  <div className="flex h-24 w-32 shrink-0 flex-col items-center justify-center rounded-[10px] border border-blue-100 bg-blue-50 text-center">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                      Action
                    </p>

                    <p
                      className={`mt-2 text-2xl font-extrabold ${
                        isApprove ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {isApprove ? "✓" : "×"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DecisionInfoBox
                  label="Request ID"
                  value={request.id || "--"}
                />
                <DecisionInfoBox
                  label="Request Type"
                  value={displayRequestType || getRequestType(request) || request.type || "--"}
                />
                <DecisionInfoBox
                  label="Requester"
                  value={getRequesterDisplayInfo(request).displayNameWithSibs}
                />
                <DecisionInfoBox
                  label="SIBS ID"
                  value={getRequesterDisplayInfo(request).sibsId}
                />
                <DecisionInfoBox
                  label="Date Requested"
                  value={formatDate(
                    request.dateRequested || request.requestDate,
                  )}
                />
                <DecisionInfoBox
                  label="Last Working Date"
                  value={formatDate(request.lastWorkingDate)}
                />
                <DecisionInfoBox
                  label="Current Approver"
                  value={request.approver || "--"}
                />
                <DecisionInfoBox
                  label="Priority"
                  value={request.priority || "Normal"}
                />
                <DecisionInfoBox
                  label="Source"
                  value={request.source || "--"}
                />

                {isWorkforce && (
                  <>
                    <DecisionInfoBox
                      label="Recruitment Settings Status"
                      value={getRecruitmentSettingsStatus(request)}
                    />
                    <DecisionInfoBox
                      label="Update Headcount Status"
                      value={getUpdateHeadcountStatus(request) || "No Request"}
                    />
                    <DecisionInfoBox
                      label="Requested Required HC"
                      value={
                        getRequestedRequiredHeadcount(request) === null ||
                        getRequestedRequiredHeadcount(request) === undefined ||
                        getRequestedRequiredHeadcount(request) === ""
                          ? "--"
                          : formatNumber(getRequestedRequiredHeadcount(request))
                      }
                    />
                  </>
                )}
              </div>

              {canEditRequiredHeadcount && (
                <div className="rounded-[10px] border border-blue-100 bg-blue-50 p-5">
                  <h3 className="text-base font-extrabold text-sibs-primary-1">
                    HR / HR Admin Required Headcount Edit
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-sibs-tertiary-5">
                    Enter the final Required Headcount here. This field is
                    required before HR / HR Admin can approve. After approval,
                    OM can update the weekly headcount in the Workforce Hiring Plan
                    page.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <DecisionInfoBox
                      label="Current Required HC"
                      value={formatNumber(getRequiredHeadcount(request))}
                    />
                    <DecisionInfoBox
                      label="Requested Required HC"
                      value={
                        getRequestedRequiredHeadcount(request) === null ||
                        getRequestedRequiredHeadcount(request) === undefined ||
                        getRequestedRequiredHeadcount(request) === ""
                          ? "--"
                          : formatNumber(getRequestedRequiredHeadcount(request))
                      }
                    />
                    <div>
                      <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                        Final Required HC{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editableRequiredHeadcount || ""}
                        onChange={(e) =>
                          onChangeEditableRequiredHeadcount?.(e.target.value)
                        }
                        placeholder="Required before approve"
                        className="h-11 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        required={isApprove}
                      />
                      {isApprove && approvedRequiredHeadcountValue === "" && (
                        <p className="mt-2 text-xs font-extrabold text-red-600">
                          Required Headcount is required before approval.
                        </p>
                      )}

                      <p className="mt-2 text-xs font-semibold text-[#2F6CA5]">
                        Final value to apply:{" "}
                        {approvedRequiredHeadcountValue === ""
                          ? "--"
                          : formatNumber(approvedRequiredHeadcountValue)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isWorkforceUpdateHeadcount && (
                <div className="rounded-[10px] border border-blue-100 bg-blue-50 p-5">
                  <h3 className="text-base font-extrabold text-sibs-primary-1">
                    OM Headcount Update Review
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-sibs-tertiary-5">
                    This request was created from the Workforce Hiring Plan page.
                    HR / HR Admin can approve or decline it here. The Required
                    Headcount field is not edited in this update request.
                  </p>
                </div>
              )}

              {isResignation && (
                <div className="rounded-[10px] border border-[#E1E7EF] bg-white p-5">
                  <h3 className="text-base font-extrabold text-sibs-primary-1">
                    Resignation Approval Questions
                  </h3>

                  <p className="mt-2 text-sm font-medium text-sibs-tertiary-5">
                    Complete the required decision details before submitting.
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 md:items-start">
                    <div className="flex h-full flex-col">
                      <label className="mb-3 min-h-[40px] text-xs font-extrabold uppercase leading-5 tracking-wide text-sibs-primary-1">
                        Have you personally spoken to the resigning employee?{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={personallySpoken}
                        onChange={(e) =>
                          onChangePersonallySpoken(e.target.value)
                        }
                        className="h-11 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        required
                      >
                        <option value="">Select answer</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="flex h-full flex-col">
                      <label className="mb-3 min-h-[40px] text-xs font-extrabold uppercase leading-5 tracking-wide text-sibs-primary-1">
                        Was the employee retained (Y/N)?{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={employeeRetained}
                        onChange={(e) =>
                          onChangeEmployeeRetained(e.target.value)
                        }
                        className="h-11 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        required
                      >
                        <option value="">Select answer</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {personallySpoken === "Yes" && (
                    <div className="mt-6">
                      <label className="mb-3 block text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                        What have you done?{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        value={actionTaken}
                        onChange={(e) => onChangeActionTaken(e.target.value)}
                        rows={4}
                        placeholder="Enter action taken..."
                        className="w-full resize-none rounded-[10px] border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-[10px] border border-[#E1E7EF] bg-white p-5">
                <label className="mb-3 block text-sm font-extrabold text-[#101828]">
                  Remarks {isApprove ? "(optional)" : "(required)"}
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) => onChangeRemarks(e.target.value)}
                  rows={5}
                  placeholder={
                    isApprove
                      ? "Add approval remarks..."
                      : isHiringNeeds
                        ? "Enter reason for declining..."
                        : "Enter reason for rejecting..."
                  }
                  className="w-full resize-none rounded-[10px] border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[10px] border border-[#E1E7EF] bg-white p-5">
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Approval Checklist
                </h3>

                <div className="mt-4 space-y-3">
                  <DecisionChecklistItem
                    done
                    title="Request selected"
                    subtitle={request.id || "--"}
                  />

                  {isResignation && (
                    <>
                      <DecisionChecklistItem
                        done={!!personallySpoken}
                        title="Personally spoken answer"
                        subtitle={personallySpoken || "Waiting for answer"}
                      />

                      <DecisionChecklistItem
                        done={!!employeeRetained}
                        title="Employee retained answer"
                        subtitle={employeeRetained || "Waiting for answer"}
                      />

                      <DecisionChecklistItem
                        done={
                          personallySpoken !== "Yes" ||
                          !!String(actionTaken || "").trim()
                        }
                        title="Action taken details"
                        subtitle={
                          personallySpoken === "Yes"
                            ? actionTaken || "Required"
                            : "Not required"
                        }
                      />
                    </>
                  )}

                  {canEditRequiredHeadcount && (
                    <DecisionChecklistItem
                      done={!isApprove || approvedRequiredHeadcountValue !== ""}
                      title="Final Required Headcount"
                      subtitle={
                        approvedRequiredHeadcountValue === ""
                          ? "Required before approval"
                          : formatNumber(approvedRequiredHeadcountValue)
                      }
                    />
                  )}

                  <DecisionChecklistItem
                    done={isApprove || !!String(remarks || "").trim()}
                    title="Decision remarks"
                    subtitle={
                      isApprove
                        ? remarks || "Optional"
                        : remarks || (isHiringNeeds ? "Required for decline" : "Required for rejection")
                    }
                  />
                </div>
              </div>

              <div
                className={`rounded-[10px] border p-5 ${
                  isApprove
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-red-100 bg-red-50"
                }`}
              >
                <h3
                  className={`text-base font-extrabold ${
                    isApprove ? "text-emerald-800" : "text-red-800"
                  }`}
                >
                  Approval Rule
                </h3>

                <p
                  className={`mt-3 text-sm font-medium leading-6 ${
                    isApprove ? "text-emerald-800/80" : "text-red-800/80"
                  }`}
                >
                  {canEditRequiredHeadcount
                    ? "Approving this request applies the final Required Headcount entered by HR / HR Admin. OM can update weekly headcount only after that approval."
                    : isWorkforceUpdateHeadcount
                      ? "Approving this request accepts the OM headcount update from the Workforce Hiring Plan page. Declining keeps the update from becoming final."
                      : isHiringNeeds
                        ? "This Hiring Needs approval decision is only available to users listed under Recruitment Settings > Approval Rules > Hiring Needs. Declining will mark the request as not approved."
                        : isAvailablePosition
                          ? "This Available Position approval decision is only available to users listed under Recruitment Settings > Approval Rules > Available Positions. Declining will mark the request as rejected."
                          : "This approval decision will be recorded under your assigned approval level. The request will move to the next approver after approval, or stop the workflow if rejected."}
                </p>
              </div>

              <div className="rounded-[10px] border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-base font-extrabold text-sibs-primary-1">
                  Request Reason
                </h3>

                <p className="mt-3 whitespace-pre-line text-sm font-medium leading-6 text-[#344054]">
                  {request.reason || request.remarks || "--"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-6 py-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#D6DEE8] bg-white px-6 text-sm font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-6 text-sm font-extrabold text-white transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                isApprove
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : isApprove ? (
                <CheckCircle2 size={17} />
              ) : (
                <XCircle size={17} />
              )}

              {isApprove
                ? "Approve"
                : isHiringNeeds || isAvailablePosition
                  ? "Decline"
                  : "Reject"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function DecisionInfoBox({ label, value }) {
  return (
    <div className="rounded-[10px] border border-[#E6ECF2] bg-white p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm font-extrabold leading-6 text-[#344054]">
        {value || "--"}
      </p>
    </div>
  );
}

function DecisionChecklistItem({ done = false, title, subtitle }) {
  return (
    <div className="rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] p-4">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            done
              ? "border-emerald-500 bg-emerald-50 text-emerald-600"
              : "border-amber-500 bg-amber-50 text-amber-600"
          }`}
        >
          {done ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#101828]">{title}</p>

          <p className="mt-1 line-clamp-2 text-xs font-bold text-[#2F6CA5]">
            {subtitle || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
