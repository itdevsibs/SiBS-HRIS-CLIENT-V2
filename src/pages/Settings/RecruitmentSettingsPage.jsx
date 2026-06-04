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
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  Loader2,
  Mail,
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
} from "lucide-react";

import FormBuilderCard from "../../components/recruitment/settings/FormBuilderCard";
import FormLaunchRulesCard from "../../components/recruitment/settings/FormLaunchRulesCard";
import PlaceholderSettingsPanel from "../../components/recruitment/settings/PlaceholderSettingsPanel";
import RelatedRecruitmentSettingsCard from "../../components/recruitment/settings/RelatedRecruitmentSettingsCard";
import SettingsInfoCards from "../../components/recruitment/settings/SettingsInfoCards";
import ApprovalRulesSettings from "@/components/recruitment/settings/ApprovalRulesSettings";
import StatusModal from "../../components/modals/StatusModal";

import {
  approveHeadcountUpdateRequest,
  getHeadcountUpdateRequests,
  rejectHeadcountUpdateRequest,
  updateHeadcountRequestStatus,
} from "../../lib/axios/getRecruitment";

import { useRecruitmentSettings } from "../../services/context/RecruitmentSettingsContext";
import Header from "../../components/layout/Header";

const tabIconMap = {
  "Update Headcounts": ClipboardList,
  "Final Interview Form": ClipboardCheck,
  "Pipeline Settings": SlidersHorizontal,
  "Assessment Settings": FileCheck2,
  "Email Templates": Mail,
  "Approval Rules": ShieldCheck,
};

function useLockBodyScroll(open) {
  useEffect(() => {
    if (!open) return undefined;

    /*
      Important:
      Do not set body/html overflow here.
      This page uses an internal <main> scroller. Changing body/html overflow
      can force the browser to recalculate layout and jump to the top.
      The modal is already rendered through createPortal with fixed positioning,
      so it can cover the whole screen without moving the page.
    */

    return undefined;
  }, [open]);
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
    month: "short",
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
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
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
  onClose,
  onApprove,
  onReject,
  onSetPending,
}) {
  const [openingFile, setOpeningFile] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useLockBodyScroll(open);

  if (!open || !item) return null;

  const currentStatus = item.status || "Pending";
  const isRowLoading = actionLoadingId === item.id;

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

  function handleAnimatedClose() {
    if (isClosing || isRowLoading) return;

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
              Headcount Update Details
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
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                currentStatus,
              )}`}
            >
              {currentStatus}
            </span>

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
            <div className="sibs-page-card-in rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">
                Kronos HC
              </p>

              <p className="mt-2 text-3xl font-extrabold text-blue-700">
                {formatNumber(
                  item.kronosRequiredHeadcount ||
                    item.kronos_required_headcount,
                )}
              </p>
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: "60ms" }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                Requested HC
              </p>

              <p className="mt-2 text-3xl font-extrabold text-amber-700">
                {formatNumber(
                  item.requestedRequiredHeadcount ||
                    item.requested_required_headcount,
                )}
              </p>
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: "120ms" }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                Actual HC
              </p>

              <p className="mt-2 text-3xl font-extrabold text-[#344054]">
                {formatNumber(item.actualHeadcount || item.actual_headcount)}
              </p>
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-violet-100 bg-violet-50 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: "180ms" }}
            >
              <p className="text-xs font-extrabold uppercase tracking-wide text-violet-700">
                OPS PRF
              </p>

              <p className="mt-2 text-3xl font-extrabold text-violet-700">
                {formatNumber(item.opsPrf || item.ops_prf)}
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
              <DetailBox label="Request ID" value={item.id} />
              <DetailBox label="Status" value={currentStatus} />

              <DetailBox
                label="Account"
                value={item.accountName || item.account}
              />

              <DetailBox
                label="Cluster"
                value={item.clusterName || item.cluster}
              />

              <DetailBox
                label="Week Number"
                value={item.weekNumber || item.week_number}
              />

              <DetailBox
                label="Week Label"
                value={item.weekLabel || item.week_label}
              />

              <DetailBox
                label="Week Start"
                value={formatDateOnly(item.weekStart || item.week_start)}
              />

              <DetailBox
                label="Week End"
                value={formatDateOnly(item.weekEnd || item.week_end)}
              />

              <DetailBox
                label="Priority Level"
                value={item.priorityLevel || item.priority_level}
              />

              <ViewOnlyFileBox
                fileName={uploadedFileName}
                fileUrl={uploadedFileUrl}
                sibsId={uploadedFileSibsId}
                openingFile={openingFile}
                onOpen={handleOpenUploadedFile}
              />

              <DetailBox
                label="Uploaded By"
                value={
                  item.uploadedByName ||
                  item.uploaded_by_name ||
                  item.uploadedBySibsId ||
                  item.uploaded_by_sibs_id
                }
              />

              <DetailBox
                label="Uploaded By SIBS ID"
                value={item.uploadedBySibsId || item.uploaded_by_sibs_id}
              />

              <DetailBox
                label="Requested By"
                value={
                  item.requestedByName ||
                  item.requested_by_name ||
                  item.lastEditName ||
                  item.last_edit_name ||
                  item.lastEditSibsId ||
                  item.last_edit_sibs_id
                }
              />

              <DetailBox
                label="Requested By SIBS ID"
                value={item.lastEditSibsId || item.last_edit_sibs_id}
              />

              <DetailBox
                label="Approver"
                value={
                  item.approverName ||
                  item.approver_name ||
                  item.sibsIdApprover ||
                  item.sibs_id_approver ||
                  item.approverSibsId ||
                  item.approver_sibs_id
                }
              />

              <DetailBox
                label="Approver SIBS ID"
                value={
                  item.sibsIdApprover ||
                  item.sibs_id_approver ||
                  item.approverSibsId ||
                  item.approver_sibs_id
                }
              />

              <DetailBox
                label="Created At"
                value={formatDateTime(item.createdAt || item.created_at)}
              />

              <DetailBox
                label="Updated At"
                value={formatDateTime(item.updatedAt || item.updated_at)}
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
            onClick={() => onSetPending(item)}
            disabled={isRowLoading || currentStatus === "Pending"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-5 text-sm font-extrabold text-amber-700 transition hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRowLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Clock3 size={17} />
            )}
            Set Pending
          </button>

          <button
            type="button"
            onClick={() => onApprove(item)}
            disabled={isRowLoading || currentStatus === "Approved"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-5 text-sm font-extrabold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRowLoading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Approve
          </button>

          <button
            type="button"
            onClick={() => onReject(item)}
            disabled={isRowLoading || currentStatus === "Rejected"}
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
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
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
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({
    Pending: 0,
    Approved: 0,
    Rejected: 0,
  });

  const [activeStatus, setActiveStatus] = useState("Pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  function openHeadcountDetails(item) {
    savePageScrollPosition();
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

  async function fetchRequests(statusOverride = activeStatus, options = {}) {
    const { showErrorModal = true } = options;

    try {
      setLoading(true);

      const result = await getHeadcountUpdateRequests({
        status: statusOverride,
        search,
        limit: 200,
      });

      setRequests(Array.isArray(result?.data) ? result.data : []);
      setCounts(
        result?.counts || {
          Pending: 0,
          Approved: 0,
          Rejected: 0,
        },
      );
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
    fetchRequests(activeStatus, { showErrorModal: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  async function handleSearchSubmit(e) {
    e.preventDefault();
    await fetchRequests(activeStatus);
  }

  async function handleSetPending(item) {
    if (!item?.id || actionLoadingId) return;

    try {
      setActionLoadingId(item.id);

      await updateHeadcountRequestStatus(item.id, "Pending");

      closeHeadcountDetails();

      openStatusModal({
        type: "success",
        title: "Headcount Set to Pending",
        message: "The headcount update was returned to pending successfully.",
      });

      await fetchRequests(activeStatus, { showErrorModal: false });
    } catch (error) {
      console.error("SET PENDING UPDATE HEADCOUNT ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to set headcount update to pending.",
      });
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleApprove(item) {
    if (!item?.id || actionLoadingId) return;

    try {
      setActionLoadingId(item.id);

      await approveHeadcountUpdateRequest(item.id);

      closeHeadcountDetails();

      openStatusModal({
        type: "success",
        title: "Headcount Approved",
        message: "The headcount update was approved successfully.",
      });

      await fetchRequests(activeStatus, { showErrorModal: false });
    } catch (error) {
      console.error("APPROVE UPDATE HEADCOUNT ERROR:", error);

      openStatusModal({
        type: "error",
        title: "Approval Failed",
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to approve headcount update.",
      });
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleReject(item) {
    if (!item?.id || actionLoadingId) return;

    try {
      setActionLoadingId(item.id);

      await rejectHeadcountUpdateRequest(item.id);

      closeHeadcountDetails();

      openStatusModal({
        type: "success",
        title: "Headcount Rejected",
        message: "The headcount update was rejected successfully.",
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
          "Failed to reject headcount update.",
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
              Review manager-submitted required headcount updates before they
              become visible in the Weekly Hiring Plan headcount table. Pending
              updates will continue showing Kronos-based headcount until
              approved.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchRequests(activeStatus)}
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
            description="Updates waiting for review."
            icon={Clock3}
            active={activeStatus === "Pending"}
            variant="pending"
            onClick={() => setActiveStatus("Pending")}
            delay={0}
          />

          <StatusMetricCard
            label="Approved"
            value={counts.Approved}
            description="Approved updates applied to the table."
            icon={CheckCircle2}
            active={activeStatus === "Approved"}
            variant="approved"
            onClick={() => setActiveStatus("Approved")}
            delay={60}
          />

          <StatusMetricCard
            label="Rejected"
            value={counts.Rejected}
            description="Updates rejected by reviewer."
            icon={XCircle}
            active={activeStatus === "Rejected"}
            variant="rejected"
            onClick={() => setActiveStatus("Rejected")}
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
              placeholder="Search account, cluster, week, or editor..."
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed border-collapse">
              <colgroup>
                <col className="w-[240px]" />
                <col className="w-[170px]" />
                <col className="w-[140px]" />
                <col className="w-[150px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[220px]" />
              </colgroup>

              <thead className="bg-[#F5F7FA]">
                <tr className="text-left text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Cluster</th>
                  <th className="px-5 py-3">Kronos HC</th>
                  <th className="px-5 py-3">Requested HC</th>
                  <th className="px-5 py-3">Actual HC</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Requested By</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEF2F6] bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <Loader2
                        size={28}
                        className="mx-auto mb-3 animate-spin text-sibs-primary-1"
                      />

                      <p className="text-sm font-extrabold text-[#344054]">
                        Loading headcount updates...
                      </p>
                    </td>
                  </tr>
                ) : requests.length > 0 ? (
                  requests.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openHeadcountDetails(item)}
                      className="cursor-pointer text-sm transition hover:bg-[#F8FAFC] active:scale-[0.995]"
                    >
                      <td className="px-5 py-4">
                        <p className="truncate font-extrabold text-[#101828]">
                          {item.accountName || item.account || "—"}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                          {item.weekLabel || item.week_label || "—"} ·{" "}
                          {formatDateOnly(item.weekStart || item.week_start)} -{" "}
                          {formatDateOnly(item.weekEnd || item.week_end)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="truncate font-bold text-[#344054]">
                          {item.clusterName || item.cluster || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-extrabold text-blue-700">
                          {formatNumber(
                            item.kronosRequiredHeadcount ||
                              item.kronos_required_headcount,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-extrabold text-amber-700">
                          {formatNumber(
                            item.requestedRequiredHeadcount ||
                              item.requested_required_headcount,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-extrabold text-[#344054]">
                          {formatNumber(
                            item.actualHeadcount || item.actual_headcount,
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                            item.status,
                          )}`}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="truncate font-bold text-[#344054]">
                          {item.lastEditName ||
                            item.last_edit_name ||
                            item.requestedByName ||
                            item.requested_by_name ||
                            item.lastEditSibsId ||
                            item.last_edit_sibs_id ||
                            "—"}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <ClipboardList
                        size={28}
                        className="mx-auto mb-3 text-sibs-tertiary-5"
                      />

                      <p className="text-sm font-extrabold text-[#344054]">
                        No {activeStatus.toLowerCase()} headcount updates found.
                      </p>

                      <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                        Pending manager updates from Weekly Hiring Plan will
                        appear here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <HeadcountDetailsModal
        open={!!selectedRequest}
        item={selectedRequest}
        actionLoadingId={actionLoadingId}
        onClose={closeHeadcountDetails}
        onApprove={handleApprove}
        onReject={handleReject}
        onSetPending={handleSetPending}
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
              <div className="flex flex-col gap-3 pt-4">
                <div>
                  <h2 className="text-base font-extrabold text-[#101828]">
                    Settings Modules
                  </h2>

                  <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                    Manage recruitment workflows and form setup from one place.
                  </p>
                </div>

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

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div
              className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#101828]">
                  Interview Form Link
                </h3>

                <Copy size={18} className="text-sibs-tertiary-5" />
              </div>

              <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                Used by the Start Interview button in Candidate Pipeline.
              </p>

              <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-xs font-bold text-sibs-primary-1">
                /recruitment/final-interview-form
              </div>
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
              style={{ animationDelay: "240ms" }}
            >
              <h3 className="text-base font-extrabold text-[#101828]">
                Required URL Parameters
              </h3>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
                  candidateId
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#344054]">
                  candidateApplicationId
                </div>
              </div>
            </div>

            <div
              className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
              style={{ animationDelay: "300ms" }}
            >
              <h3 className="text-base font-extrabold text-[#101828]">
                Recommended Next Setup
              </h3>

              <div className="mt-4 space-y-2">
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-sibs-primary-1">
                  Create final interview save logic.
                </p>

                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-sibs-primary-1">
                  Connect interview result to Candidate Pipeline.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}