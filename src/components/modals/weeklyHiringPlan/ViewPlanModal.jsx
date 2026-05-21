import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Paperclip,
  Save,
  Target,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0 && numberValue <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function getSafeValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
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
      className={`min-h-[110px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
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
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
            {title}
          </p>

          <p className={`mt-2 truncate text-2xl font-extrabold ${valueClassName}`}>
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
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ExternalLink size={15} />
            {openingFile ? "Opening..." : "View"}
          </button>
        )}
      </div>
    </div>
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
  onRequiredInputChange,
  onWeeklyPlanFileChange,
  onSaveRequiredHeadcount,
  onUpdateWeeklyPlanFile,
}) {
  if (!open || !item) return null;

  const savingRequired = savingRequiredId === item.id;
  const savingFile = savingFileId === item.id;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-sibs-primary-1/40 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ClipboardList size={14} />
              Update Headcount
            </div>

            <h3 className="mt-3 truncate text-lg font-extrabold text-[#101828]">
              {item.account}
            </h3>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Update required headcount and upload supporting document.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-5 sibs-scrollbar">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel required>Required Headcount</FieldLabel>
              <TextInput
                type="number"
                min="0"
                value={requiredInputValue ?? ""}
                onChange={(e) =>
                  onRequiredInputChange?.(item.id, e.target.value)
                }
                placeholder="Enter required headcount"
              />
              <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                Current actual headcount: {formatNumber(item.actualHeadcount)}
              </p>
            </div>

            <div>
              <FieldLabel>Supporting File</FieldLabel>

              <label className="flex h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]">
                <span className="truncate">
                  {weeklyPlanFile?.name || "Choose weekly hiring plan file"}
                </span>

                <Upload size={17} className="shrink-0" />

                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                  onChange={(e) =>
                    onWeeklyPlanFileChange?.(item.id, e.target.files?.[0])
                  }
                />
              </label>

              <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                Accepted: PDF, Word, Excel, CSV, and images.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel>Remarks</FieldLabel>
            <TextAreaInput
              value={item.headcountRemarks || ""}
              disabled
              placeholder="Remarks are shown here when available."
              className="disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-[#667085]"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#E6ECF2] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={savingFile || !weeklyPlanFile}
            onClick={() => onUpdateWeeklyPlanFile?.(item)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={17} />
            {savingFile ? "Uploading..." : "Upload File"}
          </button>

          <button
            type="button"
            disabled={savingRequired}
            onClick={() => onSaveRequiredHeadcount?.(item)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {savingRequired ? "Saving..." : "Save Headcount"}
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
}) {
  useLockBodyScroll(open);

  const [showHeadcountModal, setShowHeadcountModal] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowHeadcountModal(false);
    }
  }, [open]);

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

    return {
      projectedEmployeeNeeds,
      hiringPlanPercent,
      leadsToInterview,
    };
  }, [item]);

  if (!open || !item) return null;

  const uploadedFileName =
    existingUploadedFile ||
    item.uploadedFile ||
    item.uploaded_file ||
    item.fileName ||
    "";

  const canEdit = canEditRequiredHeadcount && !locked;

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-sibs-primary-1/45 px-4 py-6">
        <div
          role="dialog"
          aria-modal="true"
          className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl"
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
                {item.cluster || "Unassigned Cluster"} · {item.week || "Weekly Plan"}
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
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sibs-scrollbar">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                title="Required Headcount"
                value={formatNumber(item.requiredHeadcount)}
                subtitle="Weekly requirement"
                icon={ClipboardList}
              />

              <MetricCard
                title="Actual Headcount"
                value={formatNumber(item.actualHeadcount)}
                subtitle="Current active HC"
                icon={Users}
              />

              <MetricCard
                title="OPS PRF"
                value={formatNumber(item.opsPrf)}
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

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-[#101828]">
                      Hiring Plan Details
                    </h3>
                    <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                      Review headcount, projected needs, hiring plan percentage,
                      and leads needed for this account.
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoBox label="Account" value={item.account} />
                  <InfoBox label="Cluster" value={item.cluster} />
                  <InfoBox label="Week" value={item.week} />

                  <InfoBox
                    label="Projected Employee Needs"
                    value={formatNumber(computed.projectedEmployeeNeeds)}
                    valueClassName="text-violet-600"
                  />

                  <InfoBox
                    label="Hiring Plan (%)"
                    value={formatPercent(computed.hiringPlanPercent)}
                    valueClassName="text-blue-600"
                  />

                  <InfoBox
                    label="Leads Needed"
                    value={formatNumber(computed.leadsToInterview)}
                    valueClassName="text-sibs-primary-1"
                  />

                  <InfoBox
                    label="Buffer Count"
                    value={formatNumber(item.bufferHeadcount)}
                  />

                  <InfoBox
                    label="Buffer %"
                    value={formatPercent(item.bufferPercent)}
                  />

                  <InfoBox
                    label="Missing Headcount"
                    value={formatNumber(item.missingHeadcount)}
                    valueClassName={
                      Number(item.missingHeadcount || 0) > 0
                        ? "text-orange-600"
                        : "text-emerald-600"
                    }
                  />

                  <InfoBox
                    label="Hiring Rate"
                    value={formatPercent(computed.hiringPlanPercent)}
                    valueClassName="text-blue-600"
                  />

                  <InfoBox
                    label="Pipeline Status"
                    value={item.pipelineStatus || "Pending"}
                  />

                  <InfoBox label="Status Note" value={item.statusNote || "—"} />
                </div>
              </section>

              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-extrabold text-[#101828]">
                    Controls
                  </h3>
                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Actions available for this weekly account plan.
                  </p>
                </div>

                <div className="space-y-3">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setShowHeadcountModal(true)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <Calculator size={17} />
                      Update Headcount
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenActionItem?.(item)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm"
                  >
                    <ClipboardList size={17} />
                    Add Action Item
                  </button>

                  {!canEdit && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs font-bold text-blue-700">
                        View only: Required Headcount
                      </p>
                      <p className="mt-1 text-xs font-semibold text-blue-600">
                        Update Headcount is available only for editable weeks and
                        authorized users.
                      </p>
                    </div>
                  )}

                  {locked && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-bold text-gray-700">
                        This weekly version is locked.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

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

            {Array.isArray(item.actionItems) && item.actionItems.length > 0 && (
              <section className="mt-5 rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <h3 className="text-base font-extrabold text-[#101828]">
                  Action Items
                </h3>

                <div className="mt-4 space-y-3">
                  {item.actionItems.map((action) => (
                    <div
                      key={action.id}
                      className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-[#101828]">
                            {action.actionItem}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                            Owner: {action.owner || "—"} · Deadline:{" "}
                            {action.deadline || "—"}
                          </p>
                        </div>

                        <span className="w-fit rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-[#344054]">
                          {action.status || "Pending"}
                        </span>
                      </div>

                      {action.remarks && (
                        <p className="mt-3 text-sm font-semibold text-[#667085]">
                          {action.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="flex justify-end border-t border-[#D9E2EC] bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <UpdateHeadcountModal
        open={showHeadcountModal}
        item={item}
        requiredInputValue={requiredInputValue}
        weeklyPlanFile={weeklyPlanFile}
        savingRequiredId={savingRequiredId}
        savingFileId={savingFileId}
        onClose={() => setShowHeadcountModal(false)}
        onRequiredInputChange={onRequiredInputChange}
        onWeeklyPlanFileChange={onWeeklyPlanFileChange}
        onSaveRequiredHeadcount={onSaveRequiredHeadcount}
        onUpdateWeeklyPlanFile={onUpdateWeeklyPlanFile}
      />
    </>
  );
}