import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Link2,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
import { buildHiringNeedsAuditTrail } from "../../../lib/utils/hiringNeeds/hiringNeedsAuditTrail.js";
import { useUser } from "../../../services/context/UserContext";
import DropdownField from "../../recruitment/availablePositions/DropdownField";
import { isHiringNeedUnlinkedFromJd } from "../../../lib/utils/hiringNeeds/hiringNeedsHelpers";

const API_BASE_URL = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000",
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

function cleanText(value) {
  return String(value ?? "").trim();
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);

    if (text) return text;
  }

  return "";
}

function getUserDisplayName(user = {}) {
  const candidateSources = [
    user,
    user.employee,
    user.profile,
    user.employeeProfile,
    user.employee_profile,
  ].filter(Boolean);

  for (const source of candidateSources) {
    const lastName = firstText(
      source.lastName,
      source.last_name,
      source.gy_emp_lname,
    );
    const firstName = firstText(
      source.firstName,
      source.first_name,
      source.gy_emp_fname,
    );
    const middleName = firstText(
      source.middleName,
      source.middle_name,
      source.gy_emp_mname,
    );

    if (lastName || firstName || middleName) {
      return `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
        middleName ? ` ${middleName}` : ""
      }`
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
    }
  }

  return firstText(
    user.fullName,
    user.full_name,
    user.gy_emp_fullname,
    user.name,
    user.employeeName,
    user.employee_name,
    user.displayName,
    user.display_name,
    user.employee?.fullName,
    user.employee?.full_name,
    user.employee?.gy_emp_fullname,
    user.employee?.name,
    user.profile?.fullName,
    user.profile?.full_name,
    user.profile?.gy_emp_fullname,
    user.profile?.name,
    user.username,
    user.sibs_id,
    user.sibsId,
    user.userCode,
  );
}

function getUserSibsId(user = {}) {
  return firstText(
    user.employee?.sibsId,
    user.employee?.sibs_id,
    user.employee?.employeeSibsId,
    user.employee?.employee_sibs_id,
    user.employee?.gy_emp_code,
    user.employee?.gy_user_code,
    user.profile?.sibsId,
    user.profile?.sibs_id,
    user.profile?.employeeSibsId,
    user.profile?.employee_sibs_id,
    user.profile?.gy_emp_code,
    user.profile?.gy_user_code,
    user.employeeProfile?.sibsId,
    user.employeeProfile?.sibs_id,
    user.employeeProfile?.employeeSibsId,
    user.employeeProfile?.employee_sibs_id,
    user.employeeProfile?.gy_emp_code,
    user.employeeProfile?.gy_user_code,
    user.sibs_id,
    user.sibsId,
    user.employeeSibsId,
    user.employee_sibs_id,
    user.gy_emp_code,
    user.gy_user_code,
    user.userCode,
    user.user_code,
    user.username,
    user.employeeCode,
    user.employee_code,
  );
}

function normalizeSibsId(value) {
  return cleanText(value).replace(/^SIBS[-_ ]?/i, "").toLowerCase();
}

function isLikelyIdOnly(value = "") {
  return /^\d+$/.test(cleanText(value));
}

function getApprovalUserDisplayById(value = "", approvalUsers = []) {
  const targetId = normalizeSibsId(value);

  if (!targetId || !Array.isArray(approvalUsers)) return "";

  const match = approvalUsers.find((approvalUser) => {
    const ids = [
      approvalUser.sibsId,
      approvalUser.sibs_id,
      approvalUser.employeeSibsId,
      approvalUser.employee_sibs_id,
      approvalUser.gy_emp_code,
      approvalUser.gy_user_code,
      approvalUser.userCode,
      approvalUser.user_code,
      approvalUser.employeeCode,
      approvalUser.employee_code,
      approvalUser.username,
    ];

    return ids.some((id) => normalizeSibsId(id) === targetId);
  });

  if (!match) return "";

  return firstText(
    match.fullName,
    match.full_name,
    match.employeeName,
    match.employee_name,
    match.name,
    match.displayName,
    match.display_name,
    match.approverName,
    match.approver_name,
  );
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(startDate, endDate) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start !== "—" && end !== "—") return `${start} - ${end}`;
  if (start !== "—") return start;
  if (end !== "—") return end;

  return "—";
}

function normalizeStatus(status) {
  if (!status) return "For Approval";

  const value = cleanText(status);
  const lowerValue = value.toLowerCase();

  if (
    lowerValue === "pending" ||
    lowerValue === "for validation" ||
    lowerValue === "under review" ||
    lowerValue === "for review" ||
    lowerValue === "for approval"
  ) {
    return "For Approval";
  }

  if (lowerValue === "approved") return "Approved";

  if (
    lowerValue === "rejected" ||
    lowerValue === "declined" ||
    lowerValue === "not approved"
  ) {
    return "Not Approved";
  }

  return value;
}

function isFinalStatus(status) {
  const normalized = normalizeStatus(status);

  return normalized === "Approved" || normalized === "Not Approved";
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Not Approved":
      return "border-red-200 bg-red-50 text-red-700";
    case "For Approval":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRequestType(item = {}) {
  const type = firstText(item.requestType, item.request_type).toLowerCase();

  if (type === "downsize") return "Downsize";
  if (type === "requisition") return "Requisition";

  return "Requisition";
}

function getRequestTypeClass(type) {
  if (type === "Downsize") {
    return "border-red-300/50 bg-red-400/15 text-red-100";
  }

  return "border-blue-200/30 bg-white/10 text-blue-100";
}

function getWeekRange(item = {}) {
  return (
    firstText(item.weeklyWeekDateRange, item.weekly_week_date_range) ||
    formatDateRange(
      item.weeklyWeekStart || item.weekly_week_start,
      item.weeklyWeekEnd || item.weekly_week_end,
    )
  );
}

function getDepartmentName(item = {}) {
  return (
    firstText(
      item.departmentName,
      item.department_name,
      item.department,
    ) || "—"
  );
}

function getAccountName(item = {}) {
  return (
    firstText(item.accountName, item.account_name, item.account) || "—"
  );
}

function getDepartmentAccount(item = {}) {
  return (
    firstText(item.departmentAccount, item.department_account) ||
    [getDepartmentName(item), getAccountName(item)]
      .filter((value) => value && value !== "—")
      .join(" / ") ||
    "—"
  );
}

function getHeadcount(item = {}) {
  return (
    item.headcount ??
    item.requiredHeadcount ??
    item.required_headcount ??
    item.approvedRequirement ??
    item.approved_requirement ??
    "—"
  );
}

function getPreviousRequiredHeadcount(item = {}) {
  return (
    item.previousRequiredHeadcount ??
    item.previous_required_headcount ??
    item.approvedRequirement ??
    item.approved_requirement ??
    "0"
  );
}

function getDownsizeReason(item = {}) {
  return (
    firstText(
      item.downsizeReason,
      item.downsize_reason,
      item.reasonForHiring,
      item.reason_for_hiring,
      item.reason,
    ) || "—"
  );
}

function getSupportingFileUrl(item = {}) {
  const rawPath = firstText(
    item.supportingFilePath,
    item.supporting_file_path,
    item.supportingFileUrl,
    item.supporting_file_url,
  );

  if (!rawPath) return "";

  const normalizedPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
  if (normalizedPath.startsWith("/uploads")) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  if (normalizedPath.startsWith("uploads")) {
    return `${API_BASE_URL}/${normalizedPath}`;
  }

  return `${API_BASE_URL}/${normalizedPath.replace(/^\/+/, "")}`;
}

function getSupportingFileName(item = {}) {
  return (
    firstText(item.supportingFileName, item.supporting_file_name) ||
    "Supporting file"
  );
}

function isImageFile(item = {}) {
  const mimeType = firstText(
    item.supportingFileMimeType,
    item.supporting_file_mime_type,
  ).toLowerCase();
  const fileName = getSupportingFileName(item).toLowerCase();

  return (
    mimeType.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName)
  );
}

function getFiledByDisplay(item = {}) {
  const filedByName = firstText(
    item.hiringManager,
    item.hiring_manager,
    item.preparedBy,
    item.prepared_by,
    item.filedBy?.name,
    item.filed_by?.name,
  );
  const filedByRole = firstText(
    item.hiringManagerRole,
    item.hiring_manager_role,
    item.preparedByRole,
    item.prepared_by_role,
    item.filedBy?.role,
    item.filed_by?.role,
  );

  if (!filedByName) return "—";
  if (!filedByRole) return filedByName;

  return `${filedByName} (${filedByRole})`;
}

function CompactDetail({
  label,
  value,
  valueClassName = "text-[#042C51]",
  children,
}) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className="min-w-0 font-jakarta">
      <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#98A2B3]">
        {label}
      </p>

      {children || (
        <p
          className={`mt-0.5 break-words text-xs font-extrabold leading-5 ${valueClassName}`}
        >
          {hasValue ? value : "—"}
        </p>
      )}
    </div>
  );
}

function SupportingFilePreview({ url, fileName, image }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!url) return null;

  if (image && !imageFailed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl border border-[#DCE6F1] bg-white font-jakarta"
      >
        <img
          src={url}
          alt={fileName}
          onError={() => setImageFailed(true)}
          className="max-h-64 w-full object-contain"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-white hover:text-[#FF5C28]"
    >
      <FileText size={16} />
      <span className="break-all">{fileName}</span>
    </a>
  );
}

function AuditTrailSection({ entries = [] }) {
  return (
    <section className="font-jakarta">
      <h3 className="text-[10px] font-extrabold uppercase tracking-normal text-[#98A2B3]">
        Form Action Audit Trail
      </h3>

      {entries.length > 0 ? (
        <div className="mt-3 space-y-0 pl-1">
          {entries.map((entry, index) => {
            const isLastEntry = index === entries.length - 1;

            return (
              <div
                key={`${entry.action || "audit"}-${entry.date || "no-date"}-${index}`}
                className="relative flex gap-3 pb-4 last:pb-0"
              >
                {!isLastEntry ? (
                  <span className="absolute bottom-0 left-[8px] top-[18px] w-px bg-[#DCE6F1]" />
                ) : null}

                <span className="relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[#042C51] bg-white text-[#042C51]">
                  <Check size={10} strokeWidth={2.5} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="text-xs font-extrabold leading-5 text-[#042C51]">
                      {entry.action || "Recorded Activity"}
                    </p>

                    <span className="text-[10px] font-bold text-[#98A2B3]">
                      {formatDate(entry.date)}
                    </span>
                  </div>

                  <p className="text-[10px] font-semibold leading-4 text-[#667085]">
                    Actor: {entry.actor || "—"}
                  </p>

                  {entry.remarks ? (
                    <p className="mt-1 whitespace-pre-line break-words text-[10px] font-semibold italic leading-4 text-[#667085]">
                      “{entry.remarks}”
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-[#D7E0E9] bg-[#F8FAFC] px-4 py-5 text-center">
          <Clock size={18} className="mx-auto text-[#94A9C1]" />
          <p className="mt-2 text-xs font-bold text-[#475467]">
            No audit history is available for this request.
          </p>
        </div>
      )}
    </section>
  );
}

export default function ViewHiringNeedsModal({
  open,
  item,
  onClose,
  onStatus,
  canApprove = false,
  approvalAccessLoading = false,
  approvalUsers = [],
  onDecision,
  jobDescriptions = [],
  jobDescriptionLoading = false,
  onRelink,
}) {
  const { user } = useUser();
  const [remarks, setRemarks] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionAction, setDecisionAction] = useState("");
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState("");
  const [relinkLoading, setRelinkLoading] = useState(false);
  const modalBodyRef = useRef(null);

  const safeItem = useMemo(() => item || {}, [item]);

  useEffect(() => {
    if (!open) return;

    setRemarks("");
    setDecisionLoading(false);
    setDecisionAction("");
    setSelectedJobDescriptionId("");
    setRelinkLoading(false);
  }, [item?.id, open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === "Escape" && !decisionLoading && !relinkLoading) {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, decisionLoading, relinkLoading]);

  const status = normalizeStatus(
    safeItem.approvalStatus || safeItem.approval_status,
  );
  const requestType = getRequestType(safeItem);
  const isDownsize = requestType === "Downsize";
  const isRelinkMode = !isDownsize && isHiringNeedUnlinkedFromJd(safeItem);
  const finalStatus = isFinalStatus(status);
  const weekRange = getWeekRange(safeItem);
  const supportingFileUrl = getSupportingFileUrl(safeItem);
  const supportingFileName = getSupportingFileName(safeItem);
  const canShowDecisionControls =
    canApprove && !approvalAccessLoading && !finalStatus && !isRelinkMode;

  const approvedJobDescriptionOptions = useMemo(() => {
    const clearOption = {
      id: "__clear_jd__",
      value: "__clear_jd__",
      label: "—",
      description: "",
      searchText: "clear empty none remove selection",
      raw: { clearSelection: true },
    };

    const options = (Array.isArray(jobDescriptions) ? jobDescriptions : [])
        .filter((jobDescription) => {
          const jdStatus = firstText(
            jobDescription.jdStatus,
            jobDescription.jd_status,
            jobDescription.status,
          ).toLowerCase();

          return !jdStatus || jdStatus === "approved";
        })
        .map((jobDescription) => {
          const id = firstText(
            jobDescription.id,
            jobDescription.rawId,
            jobDescription.raw_id,
          );
          const code = firstText(
            jobDescription.jdCode,
            jobDescription.jd_code,
          );
          const roleTitle = firstText(
            jobDescription.roleTitle,
            jobDescription.role_title,
            jobDescription.title,
            jobDescription.documentTitle,
            jobDescription.document_title,
          );
          const documentTitle = firstText(
            jobDescription.documentTitle,
            jobDescription.document_title,
          );
          const department = firstText(
            jobDescription.department,
            jobDescription.departmentName,
            jobDescription.department_name,
          );
          const account = firstText(
            jobDescription.account,
            jobDescription.accountName,
            jobDescription.account_name,
            jobDescription.preparedFor,
            jobDescription.prepared_for,
          );

          if (!id || !roleTitle) return null;

          return {
            id,
            value: String(id),
            label: `${roleTitle}${code ? ` (${code})` : ""}`,
            description: [documentTitle, department, account]
              .filter(Boolean)
              .join(" • "),
            searchText: [
              id,
              code,
              roleTitle,
              documentTitle,
              department,
              account,
            ]
              .filter(Boolean)
              .join(" "),
            raw: jobDescription,
          };
        })
        .filter(Boolean);

    return [clearOption, ...options];
  }, [jobDescriptions]);

  const positionTitle = firstText(
    safeItem.positionTitle,
    safeItem.position_title,
    safeItem.roleTitle,
    safeItem.role_title,
  );
  const jobDescriptionDisplay = firstText(
    safeItem.jobDescriptionText,
    safeItem.jobDescriptionTitle,
    safeItem.jobDescriptionName,
    safeItem.documentTitle,
    safeItem.jdTitle,
    safeItem.jobDescriptionId,
    safeItem.job_description_title,
    safeItem.job_description_id,
  );
  const locationDisplay = firstText(
    safeItem.locationSite,
    safeItem.location_site,
    safeItem.location,
  );
  const reasonDisplay = isDownsize
    ? getDownsizeReason(safeItem)
    : firstText(
        safeItem.reasonForHiring,
        safeItem.reason_for_hiring,
        safeItem.reason,
      ) || "—";
  const assignmentDisplay =
    safeItem.assignment === "Other"
      ? firstText(
          safeItem.assignmentOther,
          safeItem.assignment_other,
          "Other",
        )
      : firstText(safeItem.assignment) || "—";
  const approvalDate = formatDate(
    safeItem.approvalDate || safeItem.approval_date,
  );
  const approvedBy = firstText(
    safeItem.approverName,
    safeItem.approver_name,
    safeItem.approvedByName,
    safeItem.approved_by_name,
    normalizeSibsId(safeItem.approvedBy) === normalizeSibsId(getUserSibsId(user))
      ? getUserDisplayName(user)
      : "",
    normalizeSibsId(safeItem.approved_by) === normalizeSibsId(getUserSibsId(user))
      ? getUserDisplayName(user)
      : "",
    getApprovalUserDisplayById(safeItem.approvedBy, approvalUsers),
    getApprovalUserDisplayById(safeItem.approved_by, approvalUsers),
    safeItem.approvedBy,
    safeItem.approved_by,
  );
  const recordedApprovalRemarks = firstText(
    safeItem.approvalRemarks,
    safeItem.approval_remarks,
  );
  const requestRemarks = firstText(
    safeItem.remarks,
    safeItem.requestDetails,
    safeItem.request_details,
    safeItem.details,
    safeItem.contextRemarks,
    safeItem.context_remarks,
    recordedApprovalRemarks,
  );
  const submittedDate = formatDate(
    safeItem.createdAt || safeItem.created_at,
  );
  const requestIdRaw = cleanText(safeItem.id);
  const requestIdDisplay = requestIdRaw
    ? requestIdRaw.toUpperCase().startsWith("PR-")
      ? requestIdRaw
      : `PR-${requestIdRaw}`
    : "PR-—";
  const auditTrail = useMemo(
    () => {
      const entries = buildHiringNeedsAuditTrail(safeItem, status, {
        currentUserName: getUserDisplayName(user),
        currentUserSibsId: getUserSibsId(user),
        approvalUsers,
      });

      const approvalActorIds = [
        safeItem.approvedBy,
        safeItem.approved_by,
        safeItem.approverSibsId,
        safeItem.approver_sibs_id,
        safeItem.approvedBySibsId,
        safeItem.approved_by_sibs_id,
      ]
        .map(normalizeSibsId)
        .filter(Boolean);

      if (!approvedBy || isLikelyIdOnly(approvedBy)) return entries;

      return entries.map((entry) => {
        const action = cleanText(entry.action).toLowerCase();
        const actorId = normalizeSibsId(entry.actor);
        const isDecisionEntry =
          action.includes("approved") || action.includes("rejected");

        if (isDecisionEntry && approvalActorIds.includes(actorId)) {
          return {
            ...entry,
            actor: approvedBy,
          };
        }

        return entry;
      });
    },
    [approvalUsers, approvedBy, safeItem, status, user],
  );

  const decisionDescription = useMemo(() => {
    if (approvalAccessLoading) {
      return "Checking your Hiring Needs approval access...";
    }

    if (finalStatus) return "This request already has a final decision.";

    if (!canApprove) {
      return "Only configured Hiring Needs approvers can approve or reject this request.";
    }

    return "Add optional remarks, then approve or reject this request.";
  }, [approvalAccessLoading, canApprove, finalStatus]);

  if (!open || !item) return null;

  async function handleDecision(action) {
    if (!canShowDecisionControls || decisionLoading) return;

    if (typeof onDecision !== "function") {
      onStatus?.({
        type: "error",
        title: "Approval Action Unavailable",
        message: "The approval action is not connected to the page.",
      });
      return;
    }

    try {
      setDecisionLoading(true);
      setDecisionAction(action);

      await onDecision({ action, item, remarks });
    } finally {
      setDecisionLoading(false);
      setDecisionAction("");
    }
  }

  async function handleRelink() {
    if (!isRelinkMode || relinkLoading || !selectedJobDescriptionId) return;

    if (typeof onRelink !== "function") {
      onStatus?.({
        type: "error",
        title: "Relink Unavailable",
        message: "The Job Description relink action is not connected.",
      });
      return;
    }

    const selectedJobDescription = approvedJobDescriptionOptions.find(
      (option) => String(option.value) === String(selectedJobDescriptionId),
    )?.raw;

    try {
      setRelinkLoading(true);
      await onRelink({
        item,
        jobDescriptionId: selectedJobDescriptionId,
        jobDescription: selectedJobDescription,
      });
    } finally {
      setRelinkLoading(false);
    }
  }

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onMouseDown={() => {
        if (!decisionLoading && !relinkLoading) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-hiring-needs-title"
        className="sibs-modal-pop-in flex max-h-[84vh] 2xl:max-h-[86vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#042C51] px-4 py-2.5 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
              <FileText
                className="mt-0.5 h-4.5 w-4.5 2xl:h-5 2xl:w-5 shrink-0 text-[#FF5C28]"
              />

              <div className="min-w-0">
                <h2
                  id="view-hiring-needs-title"
                  className="text-xs 2xl:text-sm font-extrabold uppercase tracking-wide text-white"
                >
                  Personnel Requisition Form Details
                </h2>

                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="sibs-text-micro font-extrabold text-blue-100">
                    {requestIdDisplay}
                  </span>

                  {isRelinkMode ? (
                    <span className="inline-flex rounded-full border border-amber-300/50 bg-amber-400/15 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-amber-100">
                      Relink Required
                    </span>
                  ) : null}

                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${getRequestTypeClass(
                      requestType,
                    )}`}
                  >
                    {requestType}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={decisionLoading || relinkLoading}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-blue-100 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close Personnel Requisition details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main
          ref={modalBodyRef}
          data-dropdown-boundary="true"
          className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-white px-5 py-5 sm:px-6 sm:py-6"
        >
          <div className="space-y-5">
            {isRelinkMode ? (
              <section className="rounded-xl border border-[#F5B942] bg-[#FFF9EE] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FFF0C7] text-[#D97706]">
                    <AlertTriangle size={17} strokeWidth={2.2} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-extrabold text-[#7A3B12]">
                      New Job Description Required
                    </h3>
                    <p className="mt-1 text-[11px] font-semibold leading-5 text-[#A15C24]">
                      This requisition was preserved when its Job Description
                      was removed. Select a new approved Job Description to
                      restore the link without changing its approval status or
                      intake details.
                    </p>

                  </div>
                </div>

                <div className="mt-4 w-full rounded-[12px] border border-[#FF8A5B] bg-white p-3 shadow-[0_0_0_3px_rgba(255,92,40,0.08)]">
                  <DropdownField
                    label="Select Job Description"
                    required
                    value={selectedJobDescriptionId}
                    onChange={(value, option) => {
                      setSelectedJobDescriptionId(
                        option?.raw?.clearSelection ? "" : value,
                      );
                    }}
                    options={approvedJobDescriptionOptions}
                    placeholder={
                      jobDescriptionLoading
                        ? "Loading approved Job Descriptions..."
                        : "Select a new approved Job Description"
                    }
                    searchPlaceholder="Search approved Job Descriptions..."
                    emptyMessage="No approved Job Descriptions found."
                    disabled={jobDescriptionLoading || relinkLoading}
                    searchable
                    boundaryRef={modalBodyRef}
                    maxMenuHeight={260}
                    className="w-full [&>div]:!border-[#FF8A5B]"
                  />
                </div>
              </section>
            ) : null}

            <section className="rounded-xl border border-[#DCE6F1] bg-[#F8FAFC] p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <CompactDetail
                  label="Department"
                  value={getDepartmentName(safeItem)}
                />

                <CompactDetail
                  label="Account Client"
                  value={getAccountName(safeItem)}
                />

                <CompactDetail
                  label={isDownsize ? "Account / Request" : "Job Title"}
                  value={isDownsize ? getAccountName(safeItem) : positionTitle}
                />

                <CompactDetail
                  label={
                    isDownsize
                      ? "Previous Required Headcount"
                      : "JD Code / Specification"
                  }
                  value={
                    isDownsize
                      ? getPreviousRequiredHeadcount(safeItem)
                      : isRelinkMode
                        ? "Unlinked from JD"
                        : jobDescriptionDisplay || "Not selected"
                  }
                  valueClassName={
                    isDownsize ? "text-[#042C51]" : "text-[#FF5C28]"
                  }
                />

                <CompactDetail
                  label={
                    isDownsize
                      ? "Headcount to Downsize"
                      : "Headcount (Required Slots)"
                  }
                  value={`${getHeadcount(safeItem)} ${
                    isDownsize ? "headcount" : "slots"
                  }`}
                  valueClassName="text-sm font-extrabold text-[#042C51]"
                />

                <CompactDetail
                  label="Primary Reason"
                  value={reasonDisplay}
                  valueClassName="text-[#042C51]"
                />

                <CompactDetail
                  label="Location / Site Target"
                  value={locationDisplay ? `${locationDisplay} Site` : "—"}
                />

                <CompactDetail
                  label={isDownsize ? "Selected Week" : "Date Needed By"}
                  value={
                    isDownsize
                      ? weekRange
                      : formatDate(
                          safeItem.dateNeeded || safeItem.date_needed,
                        )
                  }
                  valueClassName="text-[#042C51]"
                />

                <CompactDetail
                  label="Filed By Operator"
                  value={getFiledByDisplay(safeItem)}
                />

                <CompactDetail label="Approval Status">
                  <span
                    className={`mt-1 inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase ${getStatusClass(
                      status,
                    )}`}
                  >
                    {status}
                  </span>
                </CompactDetail>

                {isDownsize ? (
                  <CompactDetail
                    label="Department / Account"
                    value={getDepartmentAccount(safeItem)}
                  />
                ) : (
                  <CompactDetail
                    label="Assignment"
                    value={assignmentDisplay}
                  />
                )}

                <CompactDetail
                  label="Submitted Date"
                  value={submittedDate}
                  valueClassName="text-[#042C51]"
                />

                {finalStatus ? (
                  <>
                    <CompactDetail
                      label="Decision Date"
                      value={approvalDate}
                      valueClassName="text-[#042C51]"
                    />
                    <CompactDetail
                      label="Decision By"
                      value={approvedBy}
                    />
                  </>
                ) : null}
              </div>
            </section>

            {requestRemarks ? (
              <section className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-3">
                <h3 className="text-[9px] font-extrabold uppercase tracking-wide text-indigo-600">
                  HR/OM Remarks Context
                </h3>
                <p className="mt-1 whitespace-pre-line break-words text-xs font-semibold leading-5 text-[#475467]">
                  {requestRemarks}
                </p>
              </section>
            ) : null}

            {isDownsize && supportingFileUrl ? (
              <section className="font-jakarta">
                <h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-normal text-[#98A2B3]">
                  Supporting File
                </h3>
                <SupportingFilePreview
                  url={supportingFileUrl}
                  fileName={supportingFileName}
                  image={isImageFile(safeItem)}
                />
              </section>
            ) : null}

            <AuditTrailSection entries={auditTrail} />

            {!finalStatus && !isRelinkMode ? (
              <section className="border-t border-[#E6ECF2] pt-4 font-jakarta">
                <div className="flex items-start gap-2.5">
                  <Clock size={15} className="mt-0.5 shrink-0 text-[#042C51]" />
                  <div className="min-w-0">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-normal text-[#98A2B3]">
                      Approval Action
                    </h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                      {decisionDescription}
                    </p>
                  </div>
                </div>

                {canShowDecisionControls ? (
                  <div className="mt-3">
                    <label
                      htmlFor="hiring-needs-approval-remarks"
                      className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-normal text-[#98A2B3]"
                    >
                      Decision Remarks
                      <span className="ml-1 font-semibold normal-case tracking-normal text-[#98A2B3]">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      id="hiring-needs-approval-remarks"
                      value={remarks}
                      onChange={(event) => setRemarks(event.target.value)}
                      disabled={decisionLoading}
                      rows={3}
                      placeholder="Add remarks for this approval decision..."
                      className="w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#344054] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7]"
                    />
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={decisionLoading || relinkLoading}
              className="inline-flex h-9 w-full items-center justify-center rounded-[9px] bg-[#EEF3F8] px-4 text-xs font-extrabold text-[#475467] transition hover:bg-[#E4EBF3] hover:text-[#07365F] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Close Panel
            </button>

            {isRelinkMode ? (
              <button
                type="button"
                onClick={handleRelink}
                disabled={relinkLoading || !selectedJobDescriptionId}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[9px] bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:bg-[#98A2B3] disabled:text-white/70 sm:w-auto"
              >
                {relinkLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Link2 size={14} />
                )}
                {relinkLoading ? "Relinking..." : "Relink Job Description"}
              </button>
            ) : canShowDecisionControls ? (
              <>
                <button
                  type="button"
                  onClick={() => handleDecision("reject")}
                  disabled={decisionLoading}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[9px] border border-red-200 bg-red-50 px-4 text-xs font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {decisionLoading && decisionAction === "reject" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  Decline PR Request
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision("approve")}
                  disabled={decisionLoading}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[9px] bg-[#07365F] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {decisionLoading && decisionAction === "approve" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} />
                  )}
                  Approve Requisition
                </button>
              </>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
