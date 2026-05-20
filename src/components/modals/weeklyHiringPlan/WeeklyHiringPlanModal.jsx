import React, { useEffect } from "react";
import {
  ClipboardList,
  ExternalLink,
  Lock,
  Paperclip,
  Plus,
  Unlock,
  Upload,
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

function formatPercent(value) {
  const numberValue = Number(value || 0);

  if (numberValue > 0 && numberValue <= 1) {
    return `${(numberValue * 100).toFixed(2)}%`;
  }

  return `${numberValue.toFixed(2)}%`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
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
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(ext)) {
    return "IMAGE";
  }

  return "FILE";
}

function getFileTypeIconClass(filename) {
  const ext = getFileExtension(filename);

  if (["doc", "docx"].includes(ext)) return "bg-blue-600";
  if (["xls", "xlsx", "csv"].includes(ext)) return "bg-green-600";
  if (ext === "pdf") return "bg-red-600";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(ext)) {
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="text-sm font-bold text-[#344054]">{value ?? "—"}</div>
    </div>
  );
}

export function ActionItemModal({
  open,
  item,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  useLockBodyScroll(open);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4">
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Add Action Item
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Add a weekly action item for {item.account} / {item.cluster}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              {item.account} / {item.cluster}
            </p>
            <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
              Required: {item.requiredHeadcount} / Actual: {item.actualHeadcount} / Leads: {item.leadsToInterview}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Action Item <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.actionItem}
                onChange={(e) => setForm({ ...form, actionItem: e.target.value })}
                placeholder="Example: Increase sourcing volume."
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Owner <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="TA Owner"
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-11 w-full rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              >
                <option value="Not Started">Not Started</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                Remarks
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Add notes or next steps."
                className="w-full resize-none rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <Plus size={17} />
              Save Action Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ViewPlanModal({
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

  if (!open || !item) return null;

  const previousLeadsNeeded = Number(previousWeekItem?.leadsToInterview || 0);
  const currentLeadsNeeded = Number(item.leadsToInterview || 0);
  const remaining = Math.max(currentLeadsNeeded - previousLeadsNeeded, 0);
  const requiredHeadcountDisabled =
    !canEditRequiredHeadcount || savingRequiredId === item.id;
  const selectedUploadName = weeklyPlanFile?.name || "";
  const existingUploadName = existingUploadedFile || item.uploadedFile || "";
  const hasExistingUpload = !!existingUploadName;
  const submittingViewModal = savingRequiredId === item.id || savingFileId === item.id;
  const submitDisabled = !canEditRequiredHeadcount || submittingViewModal;

  async function handleSubmitViewModal() {
    if (submitDisabled) return;

    if (weeklyPlanFile) {
      await onUpdateWeeklyPlanFile(item);
      return;
    }

    await onSaveRequiredHeadcount(item);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4">
      <div
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Weekly Hiring Plan Details
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {item.account} / {item.cluster}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {item.account}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {item.week} / {item.cluster}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                          item.pipelineStatus
                        )}`}
                      >
                        {item.pipelineStatus}
                      </span>
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        Owner: {item.owner}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Leads Gap vs Previous Week
                    </p>
                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {remaining}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
                      Prev: {previousLeadsNeeded} / This Week: {currentLeadsNeeded}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Required Headcount
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={requiredInputValue ?? ""}
                      disabled={requiredHeadcountDisabled}
                      onChange={(e) => onRequiredInputChange(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!requiredHeadcountDisabled) {
                            onSaveRequiredHeadcount(item);
                          }
                        }
                      }}
                      className="h-10 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-bold text-[#1E293B] outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>
                  {!canEditRequiredHeadcount && (
                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      View only. TA and HR cannot edit required headcount.
                    </p>
                  )}
                  {locked && !canEditRequiredHeadcount && (
                    <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                      This historical weekly version is locked.
                    </p>
                  )}
                  {locked && canEditRequiredHeadcount && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Historical week. Required Headcount is editable for authorized managers.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-white p-4 md:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Upload File
                      </p>
                      <p className="text-xs font-semibold leading-5 text-sibs-tertiary-5">
                        Upload weekly hiring plan support file. Accepted file types: PDF, Word, Excel, CSV, and images.
                      </p>
                    </div>
                    {hasExistingUpload && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenUploadedFile({
                            sibsId: uploadedBySibsId,
                            filename: existingUploadName,
                          })
                        }
                        disabled={openingFile}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ExternalLink size={15} />
                        {openingFile ? "Opening..." : "View File"}
                      </button>
                    )}
                  </div>

                  <label
                    className={`mt-3 flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      canEditRequiredHeadcount
                        ? "cursor-pointer border-[#D7DEE8] bg-white hover:border-sibs-primary-1 hover:bg-[#F8FAFC]"
                        : "cursor-not-allowed border-[#E6ECF2] bg-gray-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {selectedUploadName || existingUploadName ? (
                        <FileTypeIcon filename={selectedUploadName || existingUploadName} />
                      ) : (
                        <Paperclip size={18} className="shrink-0 text-sibs-tertiary-5" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#344054]">
                          {selectedUploadName || existingUploadName || "Choose weekly hiring plan file"}
                        </p>
                        {selectedUploadName && (
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            New file selected. Click Update File to upload.
                          </p>
                        )}
                        {!selectedUploadName && existingUploadName && (
                          <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                            Existing uploaded file
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-sibs-tertiary-9 px-3 py-1.5 text-xs font-bold text-sibs-primary-1">
                      <Upload size={14} />
                      Browse
                    </span>
                    <input
                      type="file"
                      disabled={!canEditRequiredHeadcount}
                      onChange={(e) => onWeeklyPlanFileChange(item.id, e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,image/heic,image/heif"
                    />
                  </label>
                </div>

                <InfoBox label="Actual Headcount" value={item.actualHeadcount} />
                <InfoBox label="Buffer" value={`${item.bufferHeadcount} / ${formatPercent(item.bufferPercent)}`} />
                <InfoBox
                  label="Missing Headcount"
                  value={
                    <div>
                      <div>{formatNumber(item.missingHeadcount)}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                        Required + Buffer Count - Actual Headcount
                      </div>
                    </div>
                  }
                />
                <InfoBox label="Absenteeism" value={`${item.absenteeismCount} / ${formatPercent(item.absenteeismPercent)}`} />
                <InfoBox label="Attrition Past 6 Weeks" value={`${item.attritionPastCount} / ${formatPercent(item.attritionPastPercent)}`} />
                <InfoBox label="OPS PRF" value={item.opsPrf} />
                <InfoBox label="Projected Employee Needs" value={item.projectedEmployeeNeeds} />
                <InfoBox label="FST to PST" value={`${item.attritionFstToPstCount} / ${formatPercent(item.attritionFstToPstPercent)}`} />
                <InfoBox label="NHO to FST-PST" value={`${item.attritionNhoToFstPstCount} / ${formatPercent(item.attritionNhoToFstPstPercent)}`} />
                <InfoBox label="Interview to NHO" value={`${item.attritionInterviewToNhoCount} / ${formatPercent(item.attritionInterviewToNhoPercent)}`} />
                <InfoBox label="Leads to Interview" value={item.leadsToInterview} />
                <InfoBox label="Hiring Rate" value={formatPercent(item.hiringRate)} />
                <InfoBox label="Status Note" value={item.statusNote} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Excel Logic
                </h3>
                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Required HC vs Actual HC plus buffer, absenteeism, attrition, and conversion attrition determines OPS PRF and leads to interview.
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">Record State</h3>
                <div className="mt-4 flex items-center gap-2">
                  {locked ? (
                    <>
                      <Lock size={17} className="text-gray-500" />
                      <p className="text-sm font-bold text-gray-600">
                        Locked historical version
                      </p>
                    </>
                  ) : (
                    <>
                      <Unlock size={17} className="text-emerald-600" />
                      <p className="text-sm font-bold text-emerald-700">
                        Editable current version
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Last Required Headcount Edit</h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      SIBS ID
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-sibs-primary-1">
                      {item.lastEditSibsId || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Name
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-[#344054]">
                      {item.lastEditName || "—"}
                    </p>
                  </div>
                  {!item.lastEditSibsId && !item.lastEditName && (
                    <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-sibs-tertiary-5">
                      No required headcount edit record yet.
                    </p>
                  )}
                </div>
              </div>

              {!locked && (
                <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#101828]">Actions</h3>
                  <div className="mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => onOpenActionItem(item)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5"
                    >
                      <ClipboardList size={16} />
                      Add Action Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleSubmitViewModal}
              disabled={submitDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingViewModal ? (
                weeklyPlanFile ? "Uploading..." : "Saving..."
              ) : (
                <>
                  <Upload size={16} />
                  Submit
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D6DEE8] bg-white px-5 py-2.5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function KpiSnapshotModal({ open, week, records, onClose }) {
  useLockBodyScroll(open);

  if (!open || !week) return null;

  const required = records.reduce(
    (sum, item) => sum + Number(item.requiredHeadcount || 0),
    0
  );
  const actual = records.reduce(
    (sum, item) => sum + Number(item.actualHeadcount || 0),
    0
  );
  const opsPrf = records.reduce((sum, item) => sum + Number(item.opsPrf || 0), 0);
  const leads = records.reduce(
    (sum, item) => sum + Number(item.leadsToInterview || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4">
      <div
        className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Weekly KPI Snapshot
            </h2>
            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Weekly manpower requirement, OPS PRF, and leads needed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <InfoBox label="Required Headcount" value={formatNumber(required)} />
            <InfoBox label="Actual Headcount" value={formatNumber(actual)} />
            <InfoBox label="OPS PRF" value={formatNumber(opsPrf)} />
            <InfoBox label="Leads to Interview" value={formatNumber(leads)} />
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[var(--sibs-primary-1)] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
