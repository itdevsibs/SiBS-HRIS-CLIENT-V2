import React, { useEffect } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import {
  GAP_OPTIONS,
  RISK_OPTIONS,
} from "../../../lib/utils/actionItems/actionItemsConstants.js";

const STATUS_OPTIONS = ["Planned", "Ongoing", "Completed"];

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-[9px] font-black uppercase tracking-[0.04em] text-[#667085]">
      {children}
      {required ? <span className="text-rose-500"> *</span> : null}
    </label>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-[#D0D5DD] bg-[#F8FAFC] px-3 text-xs font-bold text-[#042C51] outline-none transition placeholder:font-medium placeholder:text-[#98A2B3] focus:border-[#042C51] focus:bg-white focus:ring-2 focus:ring-[#042C51]/10";

const selectClass = `${inputClass} min-w-0 pr-8`;

const readOnlyInputClass =
  "h-9 w-full rounded-lg border border-[#DDE5EE] bg-[#EEF2F6] px-3 text-xs font-bold text-[#475467] outline-none";

const textAreaClass =
  "w-full resize-none rounded-lg border border-[#D0D5DD] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold leading-5 text-[#344054] outline-none transition placeholder:text-[#98A2B3] focus:border-[#042C51] focus:bg-white focus:ring-2 focus:ring-[#042C51]/10";

function ContextValue({ label, value, mono = false }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        className={`${readOnlyInputClass} flex items-center overflow-hidden text-ellipsis whitespace-nowrap ${
          mono ? "font-mono" : ""
        }`}
        title={String(value || "")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function MetricCell({ label, value, valueClass = "text-[#042C51]" }) {
  return (
    <div className="flex min-h-[54px] flex-col items-center justify-center px-2 text-center">
      <span className="text-[8px] font-black uppercase leading-3 tracking-[0.04em] text-[#98A2B3]">
        {label}
      </span>
      <span className={`mt-1 font-mono text-base font-black ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export default function AddActionItemModal() {
  const {
    showAddModal,
    closeAddModal,
    actionForm,
    setActionForm,
    linkedActionOptions,
    ownerOptions,
    selectLinkedRecord,
    resetActionForm,
    addActionItem,
  } = useActionItems();

  useEffect(() => {
    if (!showAddModal) return undefined;

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") {
        closeAddModal();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAddModal, closeAddModal]);

  if (!showAddModal) return null;

  const selectedKey = actionForm.weeklyPlanItemId
    ? `weekly-${actionForm.weeklyPlanItemId}`
    : actionForm.hiringNeedId
      ? `hiring-${actionForm.hiringNeedId}`
      : "";

  const selectedRole = linkedActionOptions.find(
    (option) => option.key === selectedKey,
  );

  const requirement = Number(actionForm.requirement || 0);
  const filled = Number(actionForm.filled || 0);
  const remainingGap = Math.max(requirement - filled, 0);
  const currentFillRate =
    requirement > 0 ? Math.round((filled / requirement) * 100) : 0;

  const sourceModule =
    actionForm.sourceModule ||
    selectedRole?.sourceModule ||
    "Workforce Hiring Plan";
  const reportingWeek =
    actionForm.reportingWeek || selectedRole?.reportingWeek || "—";
  const cluster = actionForm.cluster || selectedRole?.cluster || "General";
  const atRiskReason =
    actionForm.atRiskReason || selectedRole?.atRiskReason || "";
  const latestStatusNote =
    actionForm.latestStatusNote || selectedRole?.latestStatusNote || "";

  const filledLabel = sourceModule.toLowerCase().includes("onboarding")
    ? "Confirmed Hired"
    : sourceModule.toLowerCase().includes("current status")
      ? "Accepted"
      : sourceModule.toLowerCase().includes("needs")
        ? "Current Filled"
        : "Current Filled / Accepted";

  function updateField(field, value) {
    setActionForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleReset() {
    resetActionForm();
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-slate-950/65 p-3 font-jakarta backdrop-blur-sm sm:p-5"
      onMouseDown={closeAddModal}
      role="presentation"
    >
      <form
        onSubmit={addActionItem}
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[94dvh] w-full max-w-[1020px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-action-item-title"
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-3.5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2.5">
              <ClipboardList
                size={19}
                className="mt-0.5 shrink-0 text-[#FF5C28]"
              />

              <div className="min-w-0">
                <h2
                  id="add-action-item-title"
                  className="text-sm font-black tracking-tight sm:text-base"
                >
                  Add Recruitment Action Item
                </h2>

                <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-300">
                  Link a hiring gap to one accountable owner, deadline, risk
                  level, and follow-up action.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeAddModal}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20 hover:text-white active:scale-[0.98]"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <main className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <section className="flex min-w-0 flex-col rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E9EEF4] pb-3">
                <h3 className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-[0.04em] text-[#042C51]">
                  <FileText size={14} className="shrink-0 text-[#FF5C28]" />
                  Source Record & Hiring Context
                </h3>

                <span className="shrink-0 rounded-md border border-[#DDE5EE] bg-[#F8FAFC] px-2 py-1 text-[9px] font-black text-[#667085]">
                  {selectedRole ? "Linked Record" : "Global Creation"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ContextValue label="Source Module" value={sourceModule} />
                <ContextValue
                  label="Reporting Week"
                  value={reportingWeek}
                  mono
                />
              </div>

              <div className="mt-3">
                <ContextValue label="Cluster" value={cluster} />
              </div>

              <div className="mt-3 min-w-0">
                <FieldLabel required>Role / Account Target</FieldLabel>
                <select
                  required
                  value={selectedKey}
                  title={selectedRole?.displayLabel || actionForm.roleAccount || ""}
                  onChange={(event) =>
                    selectLinkedRecord(event.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">Select role with hiring gap</option>

                  {linkedActionOptions.map((option) => {
                    const gap = Math.max(
                      Number(option.requirement || 0) -
                        Number(option.filled || 0),
                      0,
                    );

                    return (
                      <option key={option.key} value={option.key}>
                        {option.displayLabel} — {option.filled}/
                        {option.requirement} filled, {gap} remaining
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="mt-3 grid grid-cols-3 divide-x divide-[#DDE5EE] rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] px-1 py-1.5">
                <MetricCell label="Requirement" value={requirement} />
                <MetricCell
                  label={filledLabel}
                  value={filled}
                  valueClass="text-emerald-600"
                />
                <MetricCell
                  label="Remaining Gap"
                  value={remainingGap}
                  valueClass="text-rose-600"
                />
              </div>

              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-[9px] font-bold text-[#667085]">
                    Current Fill Rate Progress
                  </span>
                  <span
                    className={`font-mono text-[10px] font-black ${
                      currentFillRate >= 80
                        ? "text-emerald-600"
                        : currentFillRate >= 50
                          ? "text-amber-600"
                          : "text-rose-600"
                    }`}
                  >
                    {currentFillRate}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full border border-[#DDE5EE] bg-[#EEF2F6]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      currentFillRate >= 80
                        ? "bg-emerald-500"
                        : currentFillRate >= 50
                          ? "bg-amber-500"
                          : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(currentFillRate, 100)}%` }}
                  />
                </div>
              </div>

              {atRiskReason ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[9px] font-black text-rose-700">
                    <AlertTriangle size={12} />
                    Source Risk Trigger:
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-rose-900">
                    {atRiskReason}
                  </p>
                </div>
              ) : null}

              {latestStatusNote ? (
                <div className="mt-3 rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] px-3 py-2.5">
                  <p className="text-[8px] font-black uppercase tracking-[0.04em] text-[#667085]">
                    Latest Status Note:
                  </p>
                  <p className="mt-1 text-[10px] font-semibold italic leading-4 text-[#475467]">
                    {latestStatusNote}
                  </p>
                </div>
              ) : null}

              <div className="mt-auto pt-4">
                <div className="flex flex-col gap-2 border-t border-[#E9EEF4] pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.04em] text-[#667085]">
                    Hiring Gap Link Status:
                  </span>

                  {selectedRole ? (
                    <span className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[9px] font-black text-emerald-800">
                      <CheckCircle2 size={12} />
                      Linked to Selected Requirement
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[9px] font-black text-amber-800">
                      <AlertTriangle size={12} />
                      Select a Hiring Gap
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="flex min-w-0 flex-col rounded-xl border border-[#DDE5EE] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E9EEF4] pb-3">
                <h3 className="flex min-w-0 items-center gap-2 text-[11px] font-black uppercase tracking-[0.04em] text-[#042C51]">
                  <CheckCircle2
                    size={14}
                    className="shrink-0 text-[#FF5C28]"
                  />
                  Action Definition & Assignment
                </h3>

                <span className="shrink-0 text-[9px] font-bold text-[#98A2B3]">
                  * Required fields
                </span>
              </div>

              <div>
                <FieldLabel required>Action Item Description</FieldLabel>
                <textarea
                  required
                  value={actionForm.actionItem}
                  onChange={(event) =>
                    updateField("actionItem", event.target.value)
                  }
                  rows={2}
                  placeholder="Define concrete action (e.g., Expedite medical clearance for 3 candidates...)"
                  className={`${textAreaClass} min-h-[62px]`}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(170px,0.65fr)]">
                <div className="min-w-0">
                  <FieldLabel required>Accountable Owner</FieldLabel>
                  <select
                    required
                    value={actionForm.owner}
                    title={actionForm.owner || ""}
                    onChange={(event) =>
                      updateField("owner", event.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="">Select owner</option>
                    {ownerOptions
                      .filter((option) => option !== "All Owners")
                      .map((owner) => (
                        <option key={owner} value={owner}>
                          {owner}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <FieldLabel required>Target Deadline</FieldLabel>
                  <input
                    required
                    type="date"
                    value={actionForm.deadline}
                    onChange={(event) =>
                      updateField("deadline", event.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Initial Status</FieldLabel>
                  <select
                    required
                    value={actionForm.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                    title={actionForm.status || ""}
                    className={selectClass}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel required>Assigned Risk Level</FieldLabel>
                  <select
                    required
                    value={actionForm.riskLevel}
                    onChange={(event) =>
                      updateField("riskLevel", event.target.value)
                    }
                    title={actionForm.riskLevel || ""}
                    className={selectClass}
                  >
                    {RISK_OPTIONS.filter(
                      (option) => option !== "All Risk",
                    ).map((risk) => (
                      <option key={risk} value={risk}>
                        {risk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <FieldLabel required>Linked Gap Category</FieldLabel>
                <select
                  required
                  value={actionForm.linkedGap}
                  onChange={(event) =>
                    updateField("linkedGap", event.target.value)
                  }
                  title={actionForm.linkedGap || ""}
                  className={selectClass}
                >
                  {GAP_OPTIONS.filter(
                    (option) => option !== "All Gaps",
                  ).map((gap) => (
                    <option key={gap} value={gap}>
                      {gap}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex flex-1 flex-col">
                <FieldLabel>Follow-up Remarks / Action Plan Notes</FieldLabel>
                <textarea
                  value={actionForm.remarks}
                  onChange={(event) =>
                    updateField("remarks", event.target.value)
                  }
                  rows={4}
                  placeholder="Add details regarding root cause, candidate names, or specific escalation steps..."
                  className={`${textAreaClass} min-h-[96px] flex-1`}
                />
              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Info
                    size={14}
                    className="mt-0.5 shrink-0 text-[#042C51]"
                  />
                  <div>
                    <p className="text-[9px] font-black text-[#042C51]">
                      How this connects to TA-HRIS
                    </p>
                    <p className="mt-1 text-[9px] font-semibold leading-4 text-[#475467]">
                      This action stays linked to the selected weekly hiring plan
                      or hiring need through the existing Action Items context.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#D6DEE8] bg-white px-3 text-[10px] font-black text-[#475467] transition hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
              >
                <RotateCcw size={13} />
                Reset Form
              </button>

              <div className="flex min-w-0 items-start gap-1.5 text-[9px] font-medium leading-4 text-[#667085]">
                <Info size={13} className="mt-0.5 shrink-0 text-[#042C51]" />
                <span>
                  Rule: Every role where Current Filled &lt; Requirement must
                  have at least one active action item.
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAddModal}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-[#D0D5DD] bg-white px-4 text-xs font-black text-[#475467] transition hover:bg-[#F8FAFC] active:scale-[0.98]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#FF5C28] px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E04B1D] hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={14} />
                Save Action Item
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}