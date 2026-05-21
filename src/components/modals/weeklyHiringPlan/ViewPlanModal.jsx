import React, { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  Paperclip,
  RotateCcw,
  Save,
  Upload,
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="break-words text-sm font-bold text-[#344054]">
        {value ?? "—"}
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
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ExternalLink size={15} />
            {openingFile ? "Opening..." : "View"}
          </button>
        )}
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
  const [showActionItemModal, setShowActionItemModal] = useState(false);

  const [headcountDraft, setHeadcountDraft] = useState({
    requiredHeadcount: "",
    remarks: "",
    supportingFile: null,
  });

  const [actionItemForm, setActionItemForm] = useState({
    actionItem: "",
    owner: "",
    deadline: "",
    status: "Pending",
    remarks: "",
  });

  useEffect(() => {
    if (!open || !item) return;

    setHeadcountDraft({
      requiredHeadcount:
        requiredInputValue !== undefined &&
        requiredInputValue !== null &&
        requiredInputValue !== ""
          ? String(requiredInputValue)
          : String(item.requiredHeadcount || ""),
      remarks: item.headcountRemarks || item.statusNote || "",
      supportingFile: null,
    });

    setActionItemForm({
      actionItem: "",
      owner: item.owner || "-",
      deadline: "",
      status: "Pending",
      remarks: "",
    });
  }, [open, item, requiredInputValue]);

  if (!open || !item) return null;

  const previousLeadsNeeded = Number(previousWeekItem?.leadsToInterview || 0);
  const currentLeadsNeeded = Number(item.leadsToInterview || 0);
  const remaining = Math.max(currentLeadsNeeded - previousLeadsNeeded, 0);

  const existingUploadName = existingUploadedFile || item.uploadedFile || "";
  const selectedUpdateFileName = headcountDraft.supportingFile?.name || "";

  const submittingViewModal =
    savingRequiredId === item.id || savingFileId === item.id;

  const submitDisabled = !canEditRequiredHeadcount || submittingViewModal;

  async function handleSubmitViewModal() {
    if (submitDisabled) return;

    if (weeklyPlanFile) {
      await onUpdateWeeklyPlanFile?.(item);
      return;
    }

    await onSaveRequiredHeadcount?.(item);
  }

  function handleHeadcountChange(value) {
    setHeadcountDraft((prev) => ({
      ...prev,
      requiredHeadcount: value,
    }));

    onRequiredInputChange?.(item.id, value);
  }

  function handleSupportingFileChange(file) {
    setHeadcountDraft((prev) => ({
      ...prev,
      supportingFile: file || null,
    }));

    onWeeklyPlanFileChange?.(item.id, file || null);
  }

  async function handleSaveHeadcountUpdate() {
    if (submitDisabled) return;

    const finalItem = {
      ...item,
      requiredHeadcount: headcountDraft.requiredHeadcount,
      headcountRemarks: headcountDraft.remarks || null,
    };

    if (headcountDraft.supportingFile || weeklyPlanFile) {
      await onUpdateWeeklyPlanFile?.(finalItem);
    } else {
      await onSaveRequiredHeadcount?.(finalItem);
    }

    setShowHeadcountModal(false);
  }

  function handleOpenActionItem() {
    setActionItemForm({
      actionItem: "",
      owner: item.owner || "-",
      deadline: "",
      status: "Pending",
      remarks: "",
    });

    setShowActionItemModal(true);
  }

  function handleSaveActionItem(e) {
    e.preventDefault();

    onOpenActionItem?.({
      ...item,
      actionItemDraft: actionItemForm,
    });

    setShowActionItemModal(false);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4">
      <style>
        {`
          @keyframes whpModalPop {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes whpFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>

      <div
        className="relative flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ animation: "whpModalPop 160ms ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
                Weekly Hiring Plan Details
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                {item.account} / {item.cluster}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleOpenActionItem}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md active:scale-[0.98]"
                title="Add Action Item"
                aria-label="Add Action Item"
              >
                <ClipboardList size={19} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-5">
            <section className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
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
                        item.pipelineStatus,
                      )}`}
                    >
                      {item.pipelineStatus || "Pending"}
                    </span>

                    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                      Owner: {item.owner || "-"}
                    </span>

                    {locked ? (
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                        Locked Version
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Editable Version
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                    Leads Gap vs Previous Week
                  </p>

                  <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                    {formatNumber(remaining)}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-sibs-primary-1/70">
                    Prev: {formatNumber(previousLeadsNeeded)} / This Week:{" "}
                    {formatNumber(currentLeadsNeeded)}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoBox
                label="Required Headcount"
                value={formatNumber(
                  requiredInputValue !== undefined &&
                    requiredInputValue !== null &&
                    requiredInputValue !== ""
                    ? requiredInputValue
                    : item.requiredHeadcount || 0,
                )}
              />

              <ViewOnlyFileBox
                fileName={existingUploadName}
                openingFile={openingFile}
                onOpen={() =>
                  onOpenUploadedFile?.({
                    sibsId: uploadedBySibsId,
                    filename: existingUploadName,
                  })
                }
              />
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoBox
                label="Actual Headcount"
                value={formatNumber(item.actualHeadcount)}
              />

              <InfoBox
                label="Buffer"
                value={`${formatNumber(item.bufferHeadcount)} / ${formatPercent(
                  item.bufferPercent,
                )}`}
              />

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

              <InfoBox
                label="Absenteeism"
                value={`${formatNumber(item.absenteeismCount)} / ${formatPercent(
                  item.absenteeismPercent,
                )}`}
              />

              <InfoBox
                label="Attrition Past 6 Weeks"
                value={`${formatNumber(item.attritionPastCount)} / ${formatPercent(
                  item.attritionPastPercent,
                )}`}
              />

              <InfoBox label="OPS PRF" value={formatNumber(item.opsPrf)} />

              <InfoBox
                label="Projected Employee Needs"
                value={formatNumber(item.projectedEmployeeNeeds)}
              />

              <InfoBox
                label="FST to PST"
                value={`${formatNumber(
                  item.attritionFstToPstCount,
                )} / ${formatPercent(item.attritionFstToPstPercent)}`}
              />

              <InfoBox
                label="NHO to FST-PST"
                value={`${formatNumber(
                  item.attritionNhoToFstPstCount,
                )} / ${formatPercent(item.attritionNhoToFstPstPercent)}`}
              />

              <InfoBox
                label="Interview to NHO"
                value={`${formatNumber(
                  item.attritionInterviewToNhoCount,
                )} / ${formatPercent(item.attritionInterviewToNhoPercent)}`}
              />

              <InfoBox
                label="Leads to Interview"
                value={formatNumber(item.leadsToInterview)}
              />

              <InfoBox
                label="Hiring Rate"
                value={formatPercent(item.hiringRate)}
              />

              <InfoBox label="Status Note" value={item.statusNote || "—"} />
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={!canEditRequiredHeadcount || submittingViewModal}
              onClick={() => setShowHeadcountModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-blue-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BarChart3 size={17} />
              Update Headcount
            </button>

            <button
              type="button"
              onClick={handleSubmitViewModal}
              disabled={submitDisabled}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingViewModal ? (
                weeklyPlanFile || selectedUpdateFileName ? (
                  "Uploading..."
                ) : (
                  "Saving..."
                )
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
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Close
            </button>
          </div>
        </div>

        {showHeadcountModal && (
          <div className="absolute inset-0 z-[20] flex items-center justify-center bg-black/35 px-4 py-4">
            <button
              type="button"
              aria-label="Close update headcount modal"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setShowHeadcountModal(false)}
            />

            <div
              className="relative flex max-h-[88%] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              style={{ animation: "whpModalPop 160ms ease-out" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 border-b border-[#E6ECF2] px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <BarChart3 size={14} />
                      Update Headcount
                    </div>

                    <h3 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
                      Required Headcount Update
                    </h3>

                    <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
                      Enter the new required headcount, details or remarks, and
                      upload supporting documents.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowHeadcountModal(false)}
                    className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close update headcount"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5">
                <div className="space-y-4 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                  <div>
                    <FieldLabel required>
                      How many required headcount?
                    </FieldLabel>

                    <TextInput
                      type="number"
                      min="0"
                      value={headcountDraft.requiredHeadcount}
                      onChange={(e) => handleHeadcountChange(e.target.value)}
                      placeholder="Enter required headcount"
                    />
                  </div>

                  <div>
                    <FieldLabel>Details / Remarks</FieldLabel>

                    <TextAreaInput
                      value={headcountDraft.remarks}
                      onChange={(e) =>
                        setHeadcountDraft((prev) => ({
                          ...prev,
                          remarks: e.target.value,
                        }))
                      }
                      placeholder="Add reason, details, remarks, or business justification..."
                    />
                  </div>

                  <div>
                    <FieldLabel>Supporting Documents</FieldLabel>

                    <label className="flex min-h-[58px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]">
                      <div className="flex min-w-0 items-center gap-3">
                        {selectedUpdateFileName ? (
                          <FileTypeIcon filename={selectedUpdateFileName} />
                        ) : (
                          <Paperclip
                            size={20}
                            className="shrink-0 text-sibs-primary-1"
                          />
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#344054]">
                            {selectedUpdateFileName ||
                              "Upload supporting document"}
                          </p>

                          <p className="mt-0.5 text-xs font-semibold text-sibs-tertiary-5">
                            PDF, Word, Excel, CSV, or image
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg bg-[#D6DEE8] px-3 text-xs font-bold text-sibs-primary-1">
                        <Upload size={14} />
                        Browse
                      </span>

                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,image/heic,image/heif"
                        onChange={(e) =>
                          handleSupportingFileChange(
                            e.target.files?.[0] || null,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-4">
                <div className="flex flex-col justify-end gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setHeadcountDraft({
                        requiredHeadcount:
                          requiredInputValue !== undefined &&
                          requiredInputValue !== null
                            ? String(requiredInputValue)
                            : String(item.requiredHeadcount || ""),
                        remarks: item.headcountRemarks || item.statusNote || "",
                        supportingFile: null,
                      });

                      onWeeklyPlanFileChange?.(item.id, null);
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98]"
                  >
                    <RotateCcw size={17} />
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHeadcountModal(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 active:scale-[0.98]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={submitDisabled}
                    onClick={handleSaveHeadcountUpdate}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={17} />
                    {submittingViewModal ? "Saving..." : "Save Update"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ActionItemModal
          open={showActionItemModal}
          item={item}
          form={actionItemForm}
          setForm={setActionItemForm}
          onClose={() => setShowActionItemModal(false)}
          onSubmit={handleSaveActionItem}
        />
      </div>
    </div>
  );
}