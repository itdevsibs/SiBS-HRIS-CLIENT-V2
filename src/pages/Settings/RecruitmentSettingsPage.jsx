import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  Loader2,
  Paperclip,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  X,
  XCircle,
  Mail,
} from "lucide-react";

import FormBuilderCard from "../../components/recruitment/settings/FormBuilderCard";
import FormLaunchRulesCard from "../../components/recruitment/settings/FormLaunchRulesCard";
import PlaceholderSettingsPanel from "../../components/recruitment/settings/PlaceholderSettingsPanel";
import RelatedRecruitmentSettingsCard from "../../components/recruitment/settings/RelatedRecruitmentSettingsCard";
import SettingsInfoCards from "../../components/recruitment/settings/SettingsInfoCards";
import ApprovalRulesSettings from "@/components/recruitment/settings/ApprovalRulesSettings";
import StatusModal from "../../components/modals/StatusModal";
import PaginationTable from "@/services/pagination/PaginationTable";

import {
  approveHeadcountUpdateRequest,
  getHeadcountUpdateRequests,
  rejectHeadcountUpdateRequest,
} from "../../lib/axios/getRecruitment";

import api from "../../lib/axios/api-template";
import { useUser } from "../../services/context/UserContext";
import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";
import Header from "../../components/layout/Header";

const HEADCOUNT_PAGE_LIMIT = 15;

const tabIconMap = {
  "Update Headcounts": ClipboardList,
  "Final Interview Form": ClipboardCheck,
  "Pipeline Settings": SlidersHorizontal,
  "Assessment Settings": FileCheck2,
  "Email Templates": Mail,
  "Approval Rules": ShieldCheck,
};

function normalizeRoleKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
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

function getFirstFilledValue(values = []) {
  for (const value of values) {
    const cleanValue = String(value ?? "").trim();

    if (cleanValue) return cleanValue;
  }

  return "";
}

function getUserRoleCandidates(user) {
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

function getCurrentAdminAccess(user) {
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

function isHrRoleValue(value) {
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

function canEditRequiredHeadcountByRole(user) {
  const roleCandidates = getUserRoleCandidates(user);
  const adminAccess = getCurrentAdminAccess(user);

  return roleCandidates.some(isHrRoleValue) || adminAccess === 7;
}

function normalizeStatusValue(value, fallback = "Pending") {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) return fallback;

  const normalized = rawValue.toLowerCase();

  if (normalized === "approved") return "Approved";
  if (normalized === "rejected" || normalized === "declined") return "Rejected";
  if (normalized === "pending") return "Pending";
  if (normalized === "for review") return "For Review";
  if (normalized === "no request") return "No Request";

  return rawValue;
}

function getRecruitmentSettingsStatus(item = {}) {
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

function getUpdateHeadcountStatus(item = {}) {
  const value =
    item?.updateHeadcountStatus ||
    item?.update_headcount_status ||
    item?.managerUpdateStatus ||
    item?.manager_update_status ||
    "";

  if (!value) return "";

  return normalizeStatusValue(value, "");
}

function getDisplayHeadcountStatus(item = {}) {
  return getUpdateHeadcountStatus(item) || getRecruitmentSettingsStatus(item);
}

function getRequestType(item = {}) {
  const rawType = String(
    item?.requestType ||
      item?.request_type ||
      item?.type ||
      item?.headcountRequestType ||
      item?.headcount_request_type ||
      "",
  ).trim();

  const lower = rawType.toLowerCase();

  if (lower.includes("update headcount")) return "Update Headcount";
  if (lower.includes("headcount update")) return "Update Headcount";
  if (lower.includes("recruitment settings")) return "Recruitment Settings";

  if (getUpdateHeadcountStatus(item)) return "Update Headcount";

  return rawType || "Recruitment Settings";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatDateOnly(value) {
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

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "Pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "For Review":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "No Request":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function StatusPill({ status, fallback = "Pending" }) {
  const displayStatus = status || fallback;

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
        displayStatus,
      )}`}
    >
      {displayStatus}
    </span>
  );
}

function getRequiredHeadcount(item) {
  return item?.requiredHeadcount ?? item?.required_headcount ?? 0;
}

function getRequestedRequiredHeadcount(item) {
  return (
    item?.requestedRequiredHeadcount ??
    item?.requested_required_headcount ??
    item?.pendingRequiredHeadcount ??
    item?.pending_required_headcount ??
    null
  );
}

function getDisplayRequestedRequiredHeadcount(item) {
  const value = getRequestedRequiredHeadcount(item);

  if (value === null || value === undefined || value === "") return "—";

  return formatNumber(value);
}

function getActualHeadcount(item) {
  return item?.actualHeadcount ?? item?.actual_headcount ?? 0;
}

function getOpsPrf(item) {
  return item?.opsPrf ?? item?.ops_prf ?? 0;
}

function getActualHeadcountNeeds(item) {
  return item?.actualHeadcountNeeds ?? item?.actual_headcount_needs ?? 0;
}

function DetailBox({ label, value, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-[#E6ECF2] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-sm ${className}`}
    >
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
        {label}
      </p>

      <div className="mt-1 break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function getFileExtension(filename) {
  return String(filename || "").split(".").pop()?.toLowerCase() || "";
}

function getFileTypeLabel(filename) {
  const ext = getFileExtension(filename);

  if (["doc", "docx"].includes(ext)) return "WORD";
  if (["xls", "xlsx", "csv"].includes(ext)) return "EXCEL";
  if (ext === "pdf") return "PDF";

  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(ext)
  ) {
    return "IMAGE";
  }

  return "FILE";
}

function getFileTypeIconClass(filename) {
  const ext = getFileExtension(filename);

  if (["doc", "docx"].includes(ext)) return "bg-blue-600";
  if (["xls", "xlsx", "csv"].includes(ext)) return "bg-green-600";
  if (ext === "pdf") return "bg-red-600";

  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(ext)
  ) {
    return "bg-purple-600";
  }

  return "bg-gray-600";
}

function FileTypeIcon({ filename }) {
  const label = getFileTypeLabel(filename);

  return (
    <div className="relative h-12 w-10 shrink-0">
      <div className="absolute inset-0 rounded-md border-2 border-gray-300 bg-white" />
      <div className="absolute right-0 top-0 h-3 w-3 border-b-2 border-l-2 border-gray-300 bg-gray-100" />
      <div className="absolute left-1 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-gray-300" />
      <div className="absolute left-1 top-[60%] h-[2px] w-5 bg-gray-300" />

      <div
        className={`absolute -left-2 bottom-1 rounded-md px-2 py-1 text-[9px] font-bold text-white shadow ${getFileTypeIconClass(
          filename,
        )}`}
      >
        {label}
      </div>
    </div>
  );
}

function buildWeeklyHiringPlanFileUrl({ sibsId, filename, fileUrl }) {
  const cleanFileUrl = String(fileUrl || "").trim();

  if (cleanFileUrl) {
    if (/^https?:\/\//i.test(cleanFileUrl)) {
      return cleanFileUrl;
    }

    const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(
      /\/$/,
      "",
    );

    return `${baseUrl}${cleanFileUrl.startsWith("/") ? "" : "/"}${cleanFileUrl}`;
  }

  const cleanSibsId = String(sibsId || "").trim();
  const cleanFilename = String(filename || "").trim();

  if (!cleanSibsId || !cleanFilename) return "";

  const relativeUrl = `/api/weekly-hiring-plan/file/${encodeURIComponent(
    cleanSibsId,
  )}/${encodeURIComponent(cleanFilename)}`;

  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return baseUrl ? `${baseUrl}${relativeUrl}` : relativeUrl;
}

async function saveRequiredHeadcountOverride(item, requiredHeadcount) {
  const cleanRequiredHeadcount = Number(requiredHeadcount);

  if (!Number.isFinite(cleanRequiredHeadcount) || cleanRequiredHeadcount < 0) {
    throw new Error("Invalid required headcount.");
  }

  const payload = {
    weekNumber: item?.weekNumber || item?.week_number || null,
    weekLabel: item?.weekLabel || item?.week_label || null,
    weekStart: item?.weekStart || item?.week_start || null,
    weekEnd: item?.weekEnd || item?.week_end || null,
    clusterName: item?.clusterName || item?.cluster || item?.cluster_name,
    accountName: item?.accountName || item?.account || item?.account_name,
    requiredHeadcount: cleanRequiredHeadcount,
    actualHeadcount: Number(getActualHeadcount(item)),
    opsPrf: Number(getOpsPrf(item)),
    actualHeadcountNeeds: Number(getActualHeadcountNeeds(item)),
    priorityLevel: item?.priorityLevel || item?.priority_level || null,
    remarks:
      item?.remarks ||
      item?.headcountRemarks ||
      item?.headcount_remarks ||
      null,
    status: "Pending",
  };

  const res = await api.post("/api/weekly-hiring-plan/headcount", payload, {
    withCredentials: true,
  });

  return res?.data || res;
}

function ViewOnlyFileBox({ fileName, fileUrl, sibsId, openingFile, onOpen }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-sm md:col-span-2 xl:col-span-3">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
        Uploaded Supporting File
      </p>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {fileName ? (
            <FileTypeIcon filename={fileName} />
          ) : (
            <Paperclip size={20} className="shrink-0 text-sibs-tertiary-5" />
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#344054]">
              {fileName || "No uploaded supporting file"}
            </p>

            <p className="mt-0.5 text-xs font-semibold text-sibs-tertiary-5">
              {fileName ? "View only" : "No file attached"}
            </p>
          </div>
        </div>

        {fileName && (
          <button
            type="button"
            disabled={openingFile}
            onClick={() =>
              onOpen?.({
                sibsId,
                filename: fileName,
                fileUrl,
              })
            }
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ExternalLink size={15} />
            {openingFile ? "Opening..." : "View"}
          </button>
        )}
      </div>
    </div>
  );
}

function StatusMetricCard({
  label,
  value,
  description,
  icon: Icon,
  active,
  variant = "pending",
  onClick,
  delay = 0,
}) {
  const styles = {
    pending: {
      active: "border-amber-300 bg-amber-50 ring-4 ring-amber-100",
      idle: "border-amber-100 bg-amber-50",
      text: "text-amber-700",
      icon: "bg-amber-100 text-amber-700",
    },
    approved: {
      active: "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-100",
      idle: "border-emerald-100 bg-emerald-50",
      text: "text-emerald-700",
      icon: "bg-emerald-100 text-emerald-700",
    },
    rejected: {
      active: "border-red-300 bg-red-50 ring-4 ring-red-100",
      idle: "border-red-100 bg-red-50",
      text: "text-red-700",
      icon: "bg-red-100 text-red-700",
    },
  };

  const current = styles[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`sibs-page-card-in rounded-2xl border p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
        active ? current.active : current.idle
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`truncate text-xs font-extrabold uppercase tracking-wide ${current.text}`}
          >
            {label}
          </p>

          <p className={`mt-3 text-3xl font-extrabold ${current.text}`}>
            {formatNumber(value)}
          </p>

          <p
            className={`mt-1 text-sm font-semibold leading-5 ${current.text}/80`}
          >
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${current.icon}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </button>
  );
}

function HeadcountDetailsModal({
  open,
  item,
  actionLoadingId,
  savingRequiredId,
  canEditRequiredHeadcount,
  requiredDrafts,
  onRequiredDraftChange,
  onClose,
  onApprove,
  onReject,
}) {
  const [openingFile, setOpeningFile] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!open || !item) return null;

  const recruitmentSettingsStatus = getRecruitmentSettingsStatus(item);
  const updateHeadcountStatus = getUpdateHeadcountStatus(item);
  const currentStatus = getDisplayHeadcountStatus(item);

  const isRowLoading = actionLoadingId === item.id;
  const isSavingRequired = savingRequiredId === item.id;

  const uploadedFileName =
    item.uploadedFile ||
    item.uploaded_file ||
    item.fileName ||
    item.file_name ||
    "";

  const uploadedFileUrl = item.uploadedFileUrl || item.uploaded_file_url || "";

  const uploadedFileSibsId =
    item.uploadedBySibsId ||
    item.uploaded_by_sibs_id ||
    item.lastEditSibsId ||
    item.last_edit_sibs_id ||
    "";

  const requestedBy =
    item.requestedByName ||
    item.requested_by_name ||
    item.lastEditName ||
    item.last_edit_name ||
    item.lastEditSibsId ||
    item.last_edit_sibs_id ||
    "—";

  const requestedBySibsId = item.lastEditSibsId || item.last_edit_sibs_id || "";

  const editedBy =
    item.editedByName ||
    item.edited_by_name ||
    item.updatedByName ||
    item.updated_by_name ||
    item.lastEditName ||
    item.last_edit_name ||
    item.editedBySibsId ||
    item.edited_by_sibs_id ||
    item.lastEditSibsId ||
    item.last_edit_sibs_id ||
    "—";

  const editedBySibsId =
    item.editedBySibsId ||
    item.edited_by_sibs_id ||
    item.updatedBySibsId ||
    item.updated_by_sibs_id ||
    item.lastEditSibsId ||
    item.last_edit_sibs_id ||
    "";

  const requiredDraft =
    requiredDrafts[item.id] ?? String(getRequiredHeadcount(item) || 0);

  const requestType = getRequestType(item);

  function handleAnimatedClose() {
    if (isClosing || isRowLoading || isSavingRequired) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  }

  function handleOpenUploadedFile({ sibsId, filename, fileUrl }) {
    const finalUrl = buildWeeklyHiringPlanFileUrl({
      sibsId,
      filename,
      fileUrl,
    });

    if (!finalUrl) return;

    setOpeningFile(true);
    window.open(finalUrl, "_blank", "noopener,noreferrer");

    window.setTimeout(() => {
      setOpeningFile(false);
    }, 600);
  }

  const detailItems = [
    ["Request ID", item.id],
    ["Request Type", requestType],
    [
      "Recruitment Settings Status",
      <StatusPill key="rs" status={recruitmentSettingsStatus} />,
    ],
    [
      "Update Headcount Status",
      <StatusPill
        key="uh"
        status={updateHeadcountStatus || "No Request"}
        fallback="No Request"
      />,
    ],
    ["Account", item.accountName || item.account],
    ["Cluster", item.clusterName || item.cluster],
    ["Week Number", item.weekNumber || item.week_number],
    ["Week Label", item.weekLabel || item.week_label],
    ["Week Start", formatDateOnly(item.weekStart || item.week_start)],
    ["Week End", formatDateOnly(item.weekEnd || item.week_end)],
    ["Current Required HC", formatNumber(getRequiredHeadcount(item))],
    ["Requested Required HC", getDisplayRequestedRequiredHeadcount(item)],
    ["Actual HC", formatNumber(getActualHeadcount(item))],
    ["OPS PRF", formatNumber(getOpsPrf(item))],
    ["Actual HC Needs", formatNumber(getActualHeadcountNeeds(item))],
    ["Priority Level", item.priorityLevel || item.priority_level],
    [
      "Uploaded By",
      item.uploadedByName ||
        item.uploaded_by_name ||
        item.uploadedBySibsId ||
        item.uploaded_by_sibs_id,
    ],
    ["Uploaded By SIBS ID", item.uploadedBySibsId || item.uploaded_by_sibs_id],
    ["Requested By", requestedBy],
    ["Requested By SIBS ID", requestedBySibsId],
    ["Edited By", editedBy],
    ["Edited By SIBS ID", editedBySibsId],
    [
      "Approver",
      item.approverName ||
        item.approver_name ||
        item.sibsIdApprover ||
        item.sibs_id_approver ||
        item.approverSibsId ||
        item.approver_sibs_id,
    ],
    [
      "Approver SIBS ID",
      item.sibsIdApprover ||
        item.sibs_id_approver ||
        item.approverSibsId ||
        item.approver_sibs_id,
    ],
    ["Created At", formatDateTime(item.createdAt || item.created_at)],
    ["Updated At", formatDateTime(item.updatedAt || item.updated_at)],
  ];

  return createPortal(
    <div
      className={`fixed inset-0 z-[999999] flex h-[100dvh] w-[100dvw] items-center justify-center bg-sibs-primary-1/45 px-4 py-6 ${
        isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl ${
          isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#D9E2EC] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ClipboardList size={14} />
              Headcount Request Details
            </div>

            <h2 className="mt-3 truncate text-xl font-extrabold text-[#101828]">
              {item.accountName || item.account || "Account"}
            </h2>

            <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
              {item.clusterName || item.cluster || "—"} ·{" "}
              {item.weekLabel || item.week_label || "—"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StatusPill status={currentStatus} />

            <button
              type="button"
              onClick={handleAnimatedClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98]"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sibs-scrollbar">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div
              className="sibs-page-card-in rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: "40ms" }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">
                Current Required HC
              </p>

              {canEditRequiredHeadcount &&
              requestType === "Recruitment Settings" ? (
                <div className="mt-3">
                  <input
                    type="number"
                    min="0"
                    value={requiredDraft}
                    onChange={(e) =>
                      onRequiredDraftChange?.(item.id, e.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-blue-200 bg-white px-3 text-lg font-extrabold text-blue-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <p className="mt-2 text-xs font-bold text-blue-700/70">
                    Click Approve below to save and approve this request.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-3xl font-extrabold text-blue-700">
                  {formatNumber(getRequiredHeadcount(item))}
                </p>
              )}
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: "60ms" }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                Requested HC
              </p>

              <p className="mt-2 text-3xl font-extrabold text-amber-700">
                {getDisplayRequestedRequiredHeadcount(item)}
              </p>
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: "80ms" }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Actual HC
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#344054]">
                {formatNumber(getActualHeadcount(item))}
              </p>
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-violet-100 bg-violet-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: "120ms" }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700">
                OPS PRF
              </p>

              <p className="mt-2 text-3xl font-extrabold text-violet-700">
                {formatNumber(getOpsPrf(item))}
              </p>
            </div>
          </div>

          <section
            className="sibs-profile-tab-panel mt-5 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
            style={{ animationDelay: "80ms" }}
          >
            <h3 className="text-base font-extrabold text-[#101828]">
              Request Information
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {detailItems.map(([label, value]) => (
                <DetailBox key={label} label={label} value={value} />
              ))}

              <ViewOnlyFileBox
                fileName={uploadedFileName}
                fileUrl={uploadedFileUrl}
                sibsId={uploadedFileSibsId}
                openingFile={openingFile}
                onOpen={handleOpenUploadedFile}
              />
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel mt-5 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
            style={{ animationDelay: "140ms" }}
          >
            <h3 className="text-base font-extrabold text-[#101828]">
              Remarks
            </h3>

            <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-[#344054]">
                {item.remarks ||
                  item.headcountRemarks ||
                  item.headcount_remarks ||
                  "No remarks provided."}
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#D9E2EC] bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onApprove(item)}
            disabled={isRowLoading || isSavingRequired || currentStatus === "Approved"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 text-sm font-extrabold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRowLoading || isSavingRequired ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Approve
          </button>

          <button
            type="button"
            onClick={() => onReject(item)}
            disabled={isRowLoading || isSavingRequired || currentStatus === "Rejected"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 text-sm font-extrabold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRowLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <XCircle size={17} />
            )}
            Reject
          </button>

          <button
            type="button"
            onClick={handleAnimatedClose}
            disabled={isSavingRequired || isRowLoading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function UpdateHeadcountsPanel() {
  const { user } = useUser();
  const canEditRequiredHeadcount = canEditRequiredHeadcountByRole(user);

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  });

  const [activeStatus, setActiveStatus] = useState("Pending");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [savingRequiredId, setSavingRequiredId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requiredDrafts, setRequiredDrafts] = useState({});
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const tableScrollRef = useRef(null);

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const pageScrollRef = useRef({
    windowX: 0,
    windowY: 0,
    mainTop: 0,
    mainLeft: 0,
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const totalRecords = requests.length;
  const totalPages = Math.max(Math.ceil(totalRecords / HEADCOUNT_PAGE_LIMIT), 1);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * HEADCOUNT_PAGE_LIMIT;
    const endIndex = startIndex + HEADCOUNT_PAGE_LIMIT;

    return requests.slice(startIndex, endIndex);
  }, [requests, currentPage]);

  function getPageScroller() {
    return document.querySelector("[data-recruitment-settings-main='true']");
  }

  function savePageScrollPosition() {
    const mainScroller = getPageScroller();

    pageScrollRef.current = {
      windowX: window.scrollX || 0,
      windowY: window.scrollY || 0,
      mainTop: mainScroller?.scrollTop || 0,
      mainLeft: mainScroller?.scrollLeft || 0,
    };
  }

  function restorePageScrollPosition() {
    const mainScroller = getPageScroller();

    if (mainScroller) {
      mainScroller.scrollTop = pageScrollRef.current.mainTop;
      mainScroller.scrollLeft = pageScrollRef.current.mainLeft;
    }

    window.scrollTo({
      top: pageScrollRef.current.windowY,
      left: pageScrollRef.current.windowX,
      behavior: "auto",
    });
  }

  function getRequestedBy(item) {
    return (
      item.requestedByName ||
      item.requested_by_name ||
      item.lastEditName ||
      item.last_edit_name ||
      item.lastEditSibsId ||
      item.last_edit_sibs_id ||
      "—"
    );
  }

  function getRequestedBySibsId(item) {
    return item.lastEditSibsId || item.last_edit_sibs_id || "";
  }

  function getEditedBy(item) {
    return (
      item.editedByName ||
      item.edited_by_name ||
      item.updatedByName ||
      item.updated_by_name ||
      item.lastEditName ||
      item.last_edit_name ||
      item.editedBySibsId ||
      item.edited_by_sibs_id ||
      item.lastEditSibsId ||
      item.last_edit_sibs_id ||
      "—"
    );
  }

  function getEditedBySibsId(item) {
    return (
      item.editedBySibsId ||
      item.edited_by_sibs_id ||
      item.updatedBySibsId ||
      item.updated_by_sibs_id ||
      item.lastEditSibsId ||
      item.last_edit_sibs_id ||
      ""
    );
  }

  function handleRequiredDraftChange(id, value) {
    setRequiredDrafts((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function openHeadcountDetails(item) {
    savePageScrollPosition();

    setRequiredDrafts((prev) => {
      if (prev[item.id] !== undefined) return prev;

      return {
        ...prev,
        [item.id]: String(getRequiredHeadcount(item) || 0),
      };
    });

    setSelectedRequest(item);

    requestAnimationFrame(() => {
      restorePageScrollPosition();
    });
  }

  function closeHeadcountDetails() {
    savePageScrollPosition();
    setSelectedRequest(null);

    requestAnimationFrame(() => {
      restorePageScrollPosition();
    });
  }

  function openStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((prev) => ({
      ...prev,
      open: false,
    }));
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea, [data-no-table-drag='true']",
    );

    if (isInteractiveElement) return;

    const container = tableScrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDraggingTable(true);
  }

  function handleDragMove(e) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    e.preventDefault();

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDraggingTable(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  function handleTableRowClick(item) {
    if (dragStateRef.current.moved) return;

    openHeadcountDetails(item);
  }

  async function fetchRequests(statusOverride = activeStatus, options = {}) {
    const { showErrorModal = true } = options;

    try {
      setLoading(true);

      const result = await getHeadcountUpdateRequests({
        status: statusOverride,
        search,
        limit: 200,
      });

      const nextRequests = Array.isArray(result?.data) ? result.data : [];

      setRequests(nextRequests);
      setCounts(
        result?.counts || {
          Pending: 0,
          Approved: 0,
          Rejected: 0,
        },
      );

      setRequiredDrafts((prev) => {
        const next = { ...prev };

        nextRequests.forEach((item) => {
          if (next[item.id] === undefined) {
            next[item.id] = String(getRequiredHeadcount(item) || 0);
          }
        });

        return next;
      });

      if (selectedRequest?.id) {
        const refreshedSelected = nextRequests.find(
          (item) => String(item.id) === String(selectedRequest.id),
        );

        if (refreshedSelected) {
          setSelectedRequest(refreshedSelected);
        }
      }
    } catch (error) {
      console.error("FETCH UPDATE HEADCOUNTS ERROR:", error);

      setRequests([]);
      setCounts({
        Pending: 0,
        Approved: 0,
        Rejected: 0,
      });

      if (showErrorModal) {
        openStatusModal({
          type: "error",
          title: "Load Failed",
          message:
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Failed to load headcount update requests.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentPage(1);
    fetchRequests(activeStatus, { showErrorModal: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!tableScrollRef.current) return;

    tableScrollRef.current.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [currentPage, activeStatus]);

  function handlePreviousPage() {
    if (loading || currentPage <= 1) return;
    setCurrentPage((prev) => Math.max(Number(prev || 1) - 1, 1));
  }

  function handleNextPage() {
    if (loading || currentPage >= totalPages) return;
    setCurrentPage((prev) => Math.min(Number(prev || 1) + 1, totalPages));
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    setCurrentPage(1);
    await fetchRequests(activeStatus);
  }

  async function handleApprove(item) {
    if (!item?.id || actionLoadingId || savingRequiredId) return;

    const requestType = getRequestType(item);

    const shouldSaveRequiredHeadcountBeforeApprove =
      canEditRequiredHeadcount && requestType === "Recruitment Settings";

    let requiredHeadcount = null;

    if (shouldSaveRequiredHeadcountBeforeApprove) {
      const rawValue =
        requiredDrafts[item.id] !== undefined
          ? requiredDrafts[item.id]
          : getRequiredHeadcount(item);

      requiredHeadcount = Number(rawValue);

      if (!Number.isFinite(requiredHeadcount) || requiredHeadcount < 0) {
        openStatusModal({
          type: "error",
          title: "Invalid Required HC",
          message: "Please enter a valid required headcount before approving.",
        });
        return;
      }
    }

    try {
      setActionLoadingId(item.id);

      if (shouldSaveRequiredHeadcountBeforeApprove) {
        setSavingRequiredId(item.id);

        await saveRequiredHeadcountOverride(item, requiredHeadcount);

        setRequiredDrafts((prev) => ({
          ...prev,
          [item.id]: String(requiredHeadcount),
        }));
      }

      await approveHeadcountUpdateRequest(item.id);

      closeHeadcountDetails();

      openStatusModal({
        type: "success",
        title: "Headcount Approved",
        message: shouldSaveRequiredHeadcountBeforeApprove
          ? "The required headcount was updated and approved successfully."
          : "The headcount request was approved successfully.",
      });

      await fetchRequests(activeStatus, { showErrorModal: false });
    } catch (error) {
      console.error("APPROVE HEADCOUNT REQUEST ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Approval Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to approve headcount request.",
      });
    } finally {
      setActionLoadingId("");
      setSavingRequiredId("");
    }
  }

  async function handleReject(item) {
    if (!item?.id || actionLoadingId || savingRequiredId) return;

    try {
      setActionLoadingId(item.id);

      await rejectHeadcountUpdateRequest(item.id);

      closeHeadcountDetails();

      openStatusModal({
        type: "success",
        title: "Headcount Rejected",
        message: "The headcount request was rejected successfully.",
      });

      await fetchRequests(activeStatus, { showErrorModal: false });
    } catch (error) {
      console.error("REJECT UPDATE HEADCOUNT ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Rejection Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to reject headcount request.",
      });
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <div className="bg-[#F5F7FA] p-4">
      <div
        className="sibs-profile-tab-panel rounded-2xl border border-[#E6ECF2] bg-white p-6 shadow-sm"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
              <ClipboardList size={22} />
            </div>

            <h3 className="mt-4 text-xl font-extrabold text-[#101828]">
              Update Headcounts
            </h3>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-sibs-tertiary-5">
              Review Recruitment Settings requests and Manager Update Headcount
              requests separately. Current Required HC stays unchanged until
              approval when the request is from a manager.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentPage(1);
              fetchRequests(activeStatus);
            }}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCcw size={17} />
            )}
            Refresh
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatusMetricCard
            label="Pending"
            value={counts.Pending}
            description="Requests waiting for review."
            icon={Clock3}
            active={activeStatus === "Pending"}
            variant="pending"
            onClick={() => {
              setCurrentPage(1);
              setActiveStatus("Pending");
            }}
            delay={0}
          />

          <StatusMetricCard
            label="Approved"
            value={counts.Approved}
            description="Approved requests applied to the table."
            icon={CheckCircle2}
            active={activeStatus === "Approved"}
            variant="approved"
            onClick={() => {
              setCurrentPage(1);
              setActiveStatus("Approved");
            }}
            delay={60}
          />

          <StatusMetricCard
            label="Rejected"
            value={counts.Rejected}
            description="Requests rejected by reviewer."
            icon={XCircle}
            active={activeStatus === "Rejected"}
            variant="rejected"
            onClick={() => {
              setCurrentPage(1);
              setActiveStatus("Rejected");
            }}
            delay={120}
          />
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="sibs-profile-tab-panel mt-6 flex flex-col gap-3 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center"
          style={{ animationDelay: "120ms" }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account, cluster, week, requester, or editor..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-10 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 text-sm font-extrabold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={17} />
            Search
          </button>
        </form>

        <div
          className="sibs-profile-tab-panel mt-6 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
          style={{ animationDelay: "180ms" }}
        >
          <div
            ref={tableScrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`max-h-[670px] select-none overflow-auto ${
              isDraggingTable ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full min-w-[1680px] table-fixed border-collapse">
              <colgroup>
                <col className="w-[280px]" />
                <col className="w-[170px]" />
                <col className="w-[180px]" />
                <col className="w-[180px]" />
                <col className="w-[150px]" />
                <col className="w-[220px]" />
                <col className="w-[220px]" />
                <col className="w-[220px]" />
                <col className="w-[220px]" />
                <col className="w-[180px]" />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-[#F5F7FA]">
                <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Cluster</th>
                  <th className="px-5 py-3">Current Required HC</th>
                  <th className="px-5 py-3">Requested HC</th>
                  <th className="px-5 py-3">Actual HC</th>
                  <th className="px-5 py-3">Recruitment Settings Status</th>
                  <th className="px-5 py-3">Update Headcount Status</th>
                  <th className="px-5 py-3">Requested By</th>
                  <th className="px-5 py-3">Edited By</th>
                  <th className="px-5 py-3">Date Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEF2F6] bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center">
                      <Loader2
                        size={28}
                        className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                      />

                      <p className="text-sm font-extrabold text-[#344054]">
                        Loading headcount requests...
                      </p>
                    </td>
                  </tr>
                ) : paginatedRequests.length > 0 ? (
                  paginatedRequests.map((item) => {
                    const requestedBy = getRequestedBy(item);
                    const requestedBySibsId = getRequestedBySibsId(item);
                    const editedBy = getEditedBy(item);
                    const editedBySibsId = getEditedBySibsId(item);
                    const recruitmentSettingsStatus =
                      getRecruitmentSettingsStatus(item);
                    const updateHeadcountStatus = getUpdateHeadcountStatus(item);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleTableRowClick(item)}
                        className="cursor-pointer text-sm transition hover:bg-[#F8FAFC] active:scale-[0.995]"
                      >
                        <td className="px-5 py-4">
                          <p className="truncate font-extrabold text-[#101828]">
                            {item.accountName || item.account || "—"}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                            {item.weekLabel || item.week_label || "—"} ·{" "}
                            {formatDateOnly(item.weekStart || item.week_start)}{" "}
                            - {formatDateOnly(item.weekEnd || item.week_end)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate font-bold text-[#344054]">
                            {item.clusterName || item.cluster || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-sibs-primary-1">
                            {formatNumber(getRequiredHeadcount(item))}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-amber-700">
                            {getDisplayRequestedRequiredHeadcount(item)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-extrabold text-[#344054]">
                            {formatNumber(getActualHeadcount(item))}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusPill status={recruitmentSettingsStatus} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusPill
                            status={updateHeadcountStatus || "No Request"}
                            fallback="No Request"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate font-bold text-[#344054]">
                            {requestedBy}
                          </p>

                          {requestedBySibsId && (
                            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                              {requestedBySibsId}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate font-bold text-[#344054]">
                            {editedBy}
                          </p>

                          {editedBySibsId && (
                            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                              {editedBySibsId}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="truncate font-bold text-[#344054]">
                            {formatDateTime(item.createdAt || item.created_at)}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center">
                      <ClipboardList
                        size={28}
                        className="mx-auto mb-3 text-sibs-tertiary-5"
                      />

                      <p className="text-sm font-extrabold text-[#344054]">
                        No {activeStatus.toLowerCase()} headcount requests
                        found.
                      </p>

                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        Recruitment Settings requests and manager Update
                        Headcount requests will appear here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="border-t border-[#EEF2F6] bg-white px-5 py-2 text-xs font-semibold text-sibs-tertiary-5">
            Hold left click and drag left or right to scroll the table.
          </p>
        </div>

        <PaginationTable
          loading={loading}
          showSearch={false}
          showPagination
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={paginatedRequests.length}
          totalRecords={totalRecords}
          recordLabel="headcount requests"
          onPrevious={handlePreviousPage}
          onNext={handleNextPage}
        />
      </div>

      <HeadcountDetailsModal
        open={!!selectedRequest}
        item={selectedRequest}
        actionLoadingId={actionLoadingId}
        savingRequiredId={savingRequiredId}
        canEditRequiredHeadcount={canEditRequiredHeadcount}
        requiredDrafts={requiredDrafts}
        onRequiredDraftChange={handleRequiredDraftChange}
        onClose={closeHeadcountDetails}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
      />
    </div>
  );
}

export default function RecruitmentSettingsPage() {
  const mainRef = useRef(null);

  const {
    activeTab,
    setActiveTab,
    recruitmentTabs,
    saveStatus,
    handleResetFields,
    handleSaveSettings,
  } = useRecruitmentSettings();

  const settingsTabs = useMemo(() => {
    const tabs = Array.isArray(recruitmentTabs) ? recruitmentTabs : [];

    return [
      "Update Headcounts",
      ...tabs.filter(
        (tab) => tab !== "Update Headcounts" && tab !== "Headcount Requests",
      ),
    ];
  }, [recruitmentTabs]);

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }

      if (typeof document !== "undefined") {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }

  function forceScrollToTop() {
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    forceScrollToTop();
  }, []);

  useEffect(() => {
    setActiveTab("Update Headcounts");
  }, [setActiveTab]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainRef}
        data-recruitment-settings-main="true"
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <Settings size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Recruitment Settings
              </h1>

              <p className="mt-1 max-w-5xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Configure recruitment forms, final interview scoring, pipeline
                stages, email templates, approvals, headcount updates, and
                candidate workflow rules.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleResetFields}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <RotateCcw size={18} />
                Reset
              </button>

              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <Eye size={18} />
                Preview Form
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:opacity-95 active:scale-[0.98]"
              >
                <Save size={18} />
                {saveStatus === "Saved" ? "Saved" : "Save Settings"}
              </button>
            </div>
          </div>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <SettingsInfoCards />
          </section>

          <section
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "120ms" }}
          >
            <div className="border-b border-[#E6ECF2] bg-white px-4 sm:px-5">
              <div className="flex min-w-0 gap-8 overflow-x-auto">
                {settingsTabs.map((tab) => {
                  const isActive = activeTab === tab;
                  const TabIcon = tabIconMap[tab] || Settings;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab);
                      }}
                      className={`relative inline-flex h-12 shrink-0 items-center justify-center gap-2 border-b-2 px-1 text-sm font-extrabold transition ${
                        isActive
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-[#344054] hover:border-[#D0D5DD] hover:text-sibs-primary-1"
                      }`}
                    >
                      <TabIcon
                        size={16}
                        strokeWidth={2.4}
                        className={
                          isActive ? "text-blue-600" : "text-sibs-tertiary-5"
                        }
                      />

                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === "Update Headcounts" ? (
              <UpdateHeadcountsPanel />
            ) : activeTab === "Final Interview Form" ? (
              <div className="space-y-5 bg-[#F5F7FA] p-4">
                <FormBuilderCard />

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <FormLaunchRulesCard />
                  <RelatedRecruitmentSettingsCard />
                </div>
              </div>
            ) : activeTab === "Approval Rules" ? (
              <div className="space-y-5 bg-[#F5F7FA] p-4">
                <ApprovalRulesSettings />
              </div>
            ) : (
              <PlaceholderSettingsPanel activeTab={activeTab} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}