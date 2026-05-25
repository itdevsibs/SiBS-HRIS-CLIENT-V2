import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Paperclip,
  RotateCcw,
  Save,
  Target,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import ActionItemModal from "./ActionItemModal";

function useLockBodyScroll(open) {
  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);
}

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits,
  });
}

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (Math.abs(numberValue) > 0 && Math.abs(numberValue) <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
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

function getSafeValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

function getNumberValue(...values) {
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

function getStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    case "Completed":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "In Progress":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Pending":
      return "border-gray-200 bg-gray-50 text-gray-700";
    case "Not Started":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
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
          filename
        )}`}
      >
        {label}
      </div>
    </div>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:border-[#D0D5DD] disabled:bg-gray-50 disabled:text-[#667085] ${className}`}
    />
  );
}

function TextAreaInput({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[115px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
    />
  );
}

function InfoBox({ label, value, valueClassName = "text-[#344054]" }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className={`break-words text-sm font-bold ${valueClassName}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
            {title}
          </p>

          <p
            className={`mt-2 truncate text-2xl font-extrabold ${valueClassName}`}
          >
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ViewOnlyFileBox({ fileName, openingFile, onOpen }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
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
              View only
            </p>
          </div>
        </div>

        {fileName && (
          <button
            type="button"
            disabled={openingFile}
            onClick={onOpen}
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

function normalizeActionItems(item) {
  const directActionItem = getSafeValue(item?.actionItem, item?.action_item);
  const directOwner = getSafeValue(
    item?.actionItemOwner,
    item?.action_item_owner,
    item?.owner
  );
  const directOwnerSibsId = getSafeValue(
    item?.actionItemOwnerSibsId,
    item?.action_item_owner_sibs_id,
    item?.ownerSibsId,
    item?.owner_sibs_id
  );
  const directDeadline = getSafeValue(
    item?.actionItemDeadline,
    item?.action_item_deadline,
    item?.deadline
  );
  const directStatus = getSafeValue(
    item?.actionItemStatus,
    item?.action_item_status,
    item?.status
  );
  const directRemarks = getSafeValue(
    item?.actionItemRemarks,
    item?.action_item_remarks,
    item?.remarks
  );

  if (Array.isArray(item?.actionItems) && item.actionItems.length > 0) {
    return item.actionItems
      .map((action, index) => ({
        id: action.id || `${index}-${action.actionItem || action.action_item}`,
        actionItem: getSafeValue(action.actionItem, action.action_item),
        owner: getSafeValue(
          action.owner,
          action.actionItemOwner,
          action.action_item_owner
        ),
        ownerSibsId: getSafeValue(
          action.ownerSibsId,
          action.owner_sibs_id,
          action.actionItemOwnerSibsId,
          action.action_item_owner_sibs_id
        ),
        deadline: getSafeValue(
          action.deadline,
          action.actionItemDeadline,
          action.action_item_deadline
        ),
        status: getSafeValue(
          action.status,
          action.actionItemStatus,
          action.action_item_status,
          "Pending"
        ),
        remarks: getSafeValue(
          action.actionItemRemarks,
          action.action_item_remarks,
          action.remarks
        ),
      }))
      .filter((action) => action.actionItem);
  }

  if (!directActionItem) return [];

  return [
    {
      id: "direct-action-item",
      actionItem: directActionItem,
      owner: directOwner,
      ownerSibsId: directOwnerSibsId,
      deadline: directDeadline,
      status: directStatus || "Pending",
      remarks: directRemarks,
    },
  ];
}

function ActionItemsSection({ item }) {
  const actionItems = normalizeActionItems(item);

  return (
    <section className="mt-5 rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#101828]">
            Action Items
          </h3>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            Saved weekly action item details for this account.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
          {actionItems.length} Item{actionItems.length === 1 ? "" : "s"}
        </span>
      </div>

      {actionItems.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-4 py-8 text-center">
          <ClipboardList
            size={24}
            className="mx-auto mb-2 text-sibs-tertiary-5"
          />

          <p className="text-sm font-extrabold text-[#344054]">
            No action item yet.
          </p>

          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
            Click the action item icon above to add one.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {actionItems.map((action) => (
            <div
              key={action.id}
              className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-6 text-[#101828]">
                    {action.actionItem || "—"}
                  </p>

                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs font-semibold text-sibs-tertiary-5 sm:grid-cols-2">
                    <div className="rounded-lg bg-white px-3 py-2">
                      <span className="font-extrabold uppercase tracking-wide text-[#174A7C]">
                        Owner:
                      </span>{" "}
                      <span className="text-[#344054]">
                        {action.owner || "—"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-white px-3 py-2">
                      <span className="font-extrabold uppercase tracking-wide text-[#174A7C]">
                        Deadline:
                      </span>{" "}
                      <span className="text-[#344054]">
                        {formatDateOnly(action.deadline)}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                    action.status || "Pending"
                  )}`}
                >
                  {action.status || "Pending"}
                </span>
              </div>

              {action.remarks && (
                <div className="mt-3 rounded-lg border border-[#E6ECF2] bg-white px-3 py-3">
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                    Action Item Remarks
                  </p>

                  <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-[#667085]">
                    {action.remarks}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UpdateHeadcountModal({
  open,
  item,
  requiredInputValue,
  weeklyPlanFile,
  savingRequiredId,
  savingFileId,
  onClose,
  onReset,
  onRequiredInputChange,
  onWeeklyPlanFileChange,
  onSave,
}) {
  const [isClosing, setIsClosing] = useState(false);

  if (!open || !item) return null;

  const isSaving = savingRequiredId === item.id || savingFileId === item.id;

  function handleAnimatedClose() {
    if (isClosing || isSaving) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 180);
  }

  return (
    <div
      className={`absolute inset-0 z-[40] flex items-center justify-center bg-black/35 px-4 py-6 ${
        isClosing
          ? "sibs-inner-modal-backdrop-out"
          : "sibs-inner-modal-backdrop-in"
      }`}
    >
      <div
        className={`flex max-h-[92%] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          isClosing ? "sibs-inner-modal-pop-out" : "sibs-inner-modal-pop-in"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <BarChart3 size={13} />
              Update Headcount
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-[#101828]">
              Required Headcount Update
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
              Enter the new required headcount, details or remarks, and upload
              supporting documents.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnimatedClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close update headcount modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5">
          <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
            <div>
              <FieldLabel required>How many required headcount?</FieldLabel>

              <TextInput
                type="number"
                min="0"
                value={requiredInputValue ?? ""}
                onChange={(e) =>
                  onRequiredInputChange?.(item.id, e.target.value)
                }
                placeholder="Enter required headcount"
              />
            </div>

            <div className="mt-4">
              <FieldLabel>Details / Remarks</FieldLabel>

              <TextAreaInput
                value={item.headcountRemarks || item.statusNote || ""}
                readOnly
                placeholder="Add details or remarks"
              />
            </div>

            <div className="mt-4">
              <FieldLabel>Supporting Document</FieldLabel>

              <label className="flex min-h-[58px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 transition hover:bg-[#F8FAFC] hover:shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <Upload size={18} className="shrink-0 text-sibs-primary-1" />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#101828]">
                      {weeklyPlanFile?.name || "Upload supporting document"}
                    </p>

                    <p className="mt-0.5 text-xs font-semibold text-sibs-tertiary-5">
                      PDF, Word, Excel, CSV, or image
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-lg bg-[#EAF2FB] px-4 py-2 text-xs font-extrabold text-sibs-primary-1">
                  Browse
                </span>

                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                  onChange={(e) =>
                    onWeeklyPlanFileChange?.(item.id, e.target.files?.[0])
                  }
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E6ECF2] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || isClosing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            onClick={handleAnimatedClose}
            disabled={isSaving || isClosing}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:text-sibs-primary-1 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isClosing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {isSaving ? "Saving..." : "Save Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ViewPlanModal({
  open,
  item,
  locked,
  canEditRequiredHeadcount,
  previousWeekItem,
  requiredInputValue,
  savingRequiredId,
  savingFileId,
  weeklyPlanFile,
  existingUploadedFile,
  uploadedBySibsId,
  openingFile,
  onRequiredInputChange,
  onWeeklyPlanFileChange,
  onSaveRequiredHeadcount,
  onUpdateWeeklyPlanFile,
  onOpenUploadedFile,
  onClose,
  onOpenActionItem,

  actionItemOpen = false,
  actionItemTarget = null,
  actionItemForm,
  setActionItemForm,
  onCloseActionItem,
  onSubmitActionItem,
  actionItemSubmitting = false,
}) {
  useLockBodyScroll(open);

  const [showHeadcountModal, setShowHeadcountModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const computed = useMemo(() => {
    const projectedEmployeeNeeds = Number(
      getSafeValue(
        item?.projectedEmployeeNeeds,
        item?.projected_employee_needs,
        item?.opsPrf,
        item?.ops_prf,
        0
      )
    );

    const hiringPlanPercent = Number(
      getSafeValue(
        item?.hiringPlanPercent,
        item?.hiring_plan_percent,
        item?.hiringRate,
        item?.hiring_rate,
        5
      )
    );

    const hiringPlanDecimal =
      hiringPlanPercent > 0 ? hiringPlanPercent / 100 : 0.05;

    const leadsToInterview = Number(
      getSafeValue(
        item?.leadsToInterview,
        item?.leads_to_interview,
        hiringPlanDecimal > 0
          ? Math.round(projectedEmployeeNeeds / hiringPlanDecimal)
          : 0
      )
    );

    const requiredHeadcount = getNumberValue(
      item?.requiredHeadcount,
      item?.required_headcount
    );

    const actualHeadcount = getNumberValue(
      item?.actualHeadcount,
      item?.actual_headcount
    );

    const requiredBufferHeadcount = getNumberValue(
      item?.requiredBufferHeadcount,
      item?.required_buffer_headcount,
      item?.bufferHeadcount,
      item?.buffer_headcount
    );

    const requiredBufferPercent = getNumberValue(
      item?.requiredBufferPercent,
      item?.required_buffer_percent,
      item?.bufferPercent,
      item?.buffer_percent
    );

    const actualBufferCount = getNumberValue(
      item?.actualBufferCount,
      item?.actual_buffer_count,
      item?.missingHeadcount,
      item?.missing_headcount
    );

    const actualBufferPercent = getNumberValue(
      item?.actualBufferPercent,
      item?.actual_buffer_percent
    );

    const requiredActualHeadcountWithBuffer = getNumberValue(
      item?.requiredActualHeadcountWithBuffer,
      item?.required_actual_headcount_with_buffer,
      requiredHeadcount + requiredBufferHeadcount
    );

    const absenteeismPastSixWeeksAverage = getNumberValue(
      item?.absenteeismPastSixWeeksAverage,
      item?.absenteeism_past_six_weeks_average,
      item?.absenteeismOpsCount,
      item?.absenteeism_ops_count,
      item?.absenteeismCount,
      item?.absenteeism_count
    );

    const attritionPastSixWeeksAverage = getNumberValue(
      item?.attritionPastSixWeeksAverage,
      item?.attrition_past_six_weeks_average,
      item?.attritionPastCount,
      item?.attrition_past_count
    );

    const opsPrf = getNumberValue(item?.opsPrf, item?.ops_prf);

    const actualHeadcountNeeds = getNumberValue(
      item?.actualHeadcountNeeds,
      item?.actual_headcount_needs,
      requiredBufferHeadcount +
        absenteeismPastSixWeeksAverage +
        attritionPastSixWeeksAverage +
        opsPrf
    );

    return {
      projectedEmployeeNeeds,
      hiringPlanPercent,
      leadsToInterview,
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
    };
  }, [item]);

  if (!open || !item) return null;

  const uploadedFileName =
    existingUploadedFile ||
    item.uploadedFile ||
    item.uploaded_file ||
    item.fileName ||
    "";

  const isSavingRequired = savingRequiredId === item.id;
  const isSavingFile = savingFileId === item.id;
  const isSubmitting = submitting || isSavingRequired || isSavingFile;

  function handleAnimatedClose() {
    if (isClosing || isSubmitting) return;

    setIsClosing(true);

    window.setTimeout(() => {
      setIsClosing(false);
      setShowHeadcountModal(false);
      onClose?.();
    }, 220);
  }

  function handleResetHeadcountModal() {
    onRequiredInputChange?.(item.id, String(item.requiredHeadcount ?? 0));
    onWeeklyPlanFileChange?.(item.id, null);
  }

  async function handleSaveHeadcountUpdate() {
    if (!canEditRequiredHeadcount || isSubmitting) return;

    const currentRequiredHeadcount =
      requiredInputValue !== undefined &&
      requiredInputValue !== null &&
      requiredInputValue !== ""
        ? requiredInputValue
        : item.requiredHeadcount ?? item.required_headcount ?? 0;

    try {
      setSubmitting(true);

      await onSaveRequiredHeadcount?.(item, {
        silent: true,
        overrideRequiredHeadcount: currentRequiredHeadcount,
      });

      if (weeklyPlanFile) {
        await onUpdateWeeklyPlanFile?.(item, currentRequiredHeadcount);
      } else {
        setShowHeadcountModal(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-sibs-primary-1/45 px-4 py-6 ${
        isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl ${
          isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#D9E2EC] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <BarChart3 size={14} />
              Weekly Hiring Plan
            </div>

            <h2 className="mt-3 truncate text-xl font-extrabold text-[#101828]">
              {item.account || "Account Plan"}
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {item.cluster || "Unassigned Cluster"} ·{" "}
              {item.week || "Weekly Plan"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                item.pipelineStatus
              )}`}
            >
              {item.pipelineStatus || "Pending"}
            </span>

            <button
              type="button"
              onClick={() => onOpenActionItem?.(item)}
              title="Add Action Item"
              aria-label="Add Action Item"
              disabled={isClosing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ClipboardList size={19} />
            </button>

            <button
              type="button"
              onClick={handleAnimatedClose}
              title="Close"
              aria-label="Close"
              disabled={isClosing}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sibs-scrollbar">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              title="Required Headcount"
              value={formatNumber(computed.requiredHeadcount)}
              subtitle="Weekly requirement"
              icon={ClipboardList}
            />

            <MetricCard
              title="Actual Headcount"
              value={formatNumber(computed.actualHeadcount)}
              subtitle="Current active HC"
              icon={Users}
            />

            <MetricCard
              title="OPS PRF"
              value={formatNumber(computed.opsPrf)}
              subtitle="Projected PRF need"
              icon={CheckCircle2}
              iconClassName="bg-emerald-50 text-emerald-600"
              valueClassName="text-emerald-600"
            />

            <MetricCard
              title="Hiring Plan"
              value={formatPercent(computed.hiringPlanPercent)}
              subtitle="Selected hiring rate"
              icon={Target}
              iconClassName="bg-blue-50 text-blue-600"
              valueClassName="text-blue-600"
            />

            <MetricCard
              title="Leads Needed"
              value={formatNumber(computed.leadsToInterview)}
              subtitle="Projected need / hiring plan"
              icon={TrendingUp}
              iconClassName="bg-violet-50 text-violet-600"
              valueClassName="text-violet-600"
            />
          </div>

          <section className="mt-5 rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#101828]">
                  Hiring Plan Details
                </h3>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  Review the same Excel-based computation used in the Weekly
                  Hiring Accounts table.
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                  locked
                    ? "border-gray-200 bg-gray-50 text-gray-600"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {locked ? "Locked" : "Editable"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <InfoBox label="Account" value={item.account || "--"} />
              <InfoBox label="Cluster" value={item.cluster || "--"} />
              <InfoBox label="Week" value={item.week || "--"} />

              <InfoBox
                label="Required Headcount"
                value={formatNumber(computed.requiredHeadcount)}
              />

              <InfoBox
                label="Actual Headcount"
                value={formatNumber(computed.actualHeadcount)}
              />

              <InfoBox
                label="Required Buffer Headcount"
                value={formatNumber(computed.requiredBufferHeadcount, 2)}
                valueClassName="text-sibs-primary-1"
              />

              <InfoBox
                label="Required Buffer %"
                value={formatPercent(computed.requiredBufferPercent)}
              />

              <InfoBox
                label="Actual Buffer Count"
                value={formatNumber(computed.actualBufferCount)}
                valueClassName={
                  computed.actualBufferCount < 0
                    ? "text-red-700"
                    : "text-emerald-700"
                }
              />

              <InfoBox
                label="Actual Buffer %"
                value={formatPercent(computed.actualBufferPercent)}
                valueClassName={
                  computed.actualBufferPercent < 0
                    ? "text-red-700"
                    : "text-emerald-700"
                }
              />

              <InfoBox
                label="Required Actual HC with Buffer"
                value={formatNumber(
                  computed.requiredActualHeadcountWithBuffer,
                  2
                )}
                valueClassName="text-sibs-primary-1"
              />

              <InfoBox
                label="Absenteeism Past 6 Weeks Average"
                value={formatNumber(computed.absenteeismPastSixWeeksAverage)}
              />

              <InfoBox
                label="Attrition Past 6 Weeks Average"
                value={formatNumber(computed.attritionPastSixWeeksAverage)}
              />

              <InfoBox
                label="OPS PRF"
                value={formatNumber(computed.opsPrf)}
                valueClassName="text-sibs-primary-1"
              />

              <InfoBox
                label="Actual Headcount Needs"
                value={formatNumber(computed.actualHeadcountNeeds, 2)}
                valueClassName="text-violet-700"
              />

              <InfoBox
                label="Leads to Interview"
                value={formatNumber(computed.leadsToInterview)}
              />

              <InfoBox
                label="Hiring Rate"
                value={formatPercent(computed.hiringPlanPercent)}
              />

              <InfoBox
                label="Status"
                value={
                  <span
                    className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                      item.pipelineStatus
                    )}`}
                  >
                    {item.pipelineStatus || "--"}
                  </span>
                }
              />

              <InfoBox label="Status Note" value={item.statusNote || "--"} />
            </div>
          </section>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
              <h3 className="text-base font-extrabold text-[#101828]">
                Risk Metrics
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoBox
                  label="Absenteeism Count"
                  value={formatNumber(item.absenteeismCount)}
                />

                <InfoBox
                  label="Absenteeism %"
                  value={formatPercent(item.absenteeismPercent)}
                />

                <InfoBox
                  label="Attrition Count"
                  value={formatNumber(item.attritionPastCount)}
                />

                <InfoBox
                  label="Attrition %"
                  value={formatPercent(item.attritionPastPercent)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
              <h3 className="text-base font-extrabold text-[#101828]">
                Weekly Support File
              </h3>

              <div className="mt-4">
                <ViewOnlyFileBox
                  fileName={uploadedFileName}
                  openingFile={openingFile}
                  onOpen={() =>
                    onOpenUploadedFile?.({
                      sibsId: uploadedBySibsId || item.uploadedBySibsId,
                      filename: uploadedFileName,
                    })
                  }
                />
              </div>
            </section>
          </div>

          {previousWeekItem && (
            <section className="mt-5 rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
              <h3 className="text-base font-extrabold text-[#101828]">
                Previous Week Comparison
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox
                  label="Previous Required HC"
                  value={formatNumber(previousWeekItem.requiredHeadcount)}
                />

                <InfoBox
                  label="Previous Actual HC"
                  value={formatNumber(previousWeekItem.actualHeadcount)}
                />

                <InfoBox
                  label="Previous Hiring Plan"
                  value={formatPercent(
                    getSafeValue(
                      previousWeekItem.hiringPlanPercent,
                      previousWeekItem.hiring_plan_percent,
                      previousWeekItem.hiringRate,
                      previousWeekItem.hiring_rate,
                      5
                    )
                  )}
                />

                <InfoBox
                  label="Previous Leads"
                  value={formatNumber(
                    getSafeValue(
                      previousWeekItem.leadsToInterview,
                      previousWeekItem.leads_to_interview,
                      0
                    )
                  )}
                />
              </div>
            </section>
          )}

          <ActionItemsSection item={item} />
        </div>

        <div className="flex justify-end gap-3 border-t border-[#D9E2EC] bg-white px-5 py-4">
          {canEditRequiredHeadcount && (
            <button
              type="button"
              onClick={() => setShowHeadcountModal(true)}
              disabled={isClosing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-extrabold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BarChart3 size={17} />
              Update Headcount
            </button>
          )}

          <button
            type="button"
            onClick={handleAnimatedClose}
            disabled={isClosing}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <UpdateHeadcountModal
          open={showHeadcountModal}
          item={item}
          requiredInputValue={requiredInputValue}
          weeklyPlanFile={weeklyPlanFile}
          savingRequiredId={savingRequiredId}
          savingFileId={savingFileId}
          onClose={() => setShowHeadcountModal(false)}
          onReset={handleResetHeadcountModal}
          onRequiredInputChange={onRequiredInputChange}
          onWeeklyPlanFileChange={onWeeklyPlanFileChange}
          onSave={handleSaveHeadcountUpdate}
        />

        <ActionItemModal
          open={actionItemOpen}
          item={actionItemTarget || item}
          form={actionItemForm}
          setForm={setActionItemForm}
          onClose={onCloseActionItem}
          onSubmit={onSubmitActionItem}
          submitting={actionItemSubmitting}
        />
      </div>
    </div>
  );
}