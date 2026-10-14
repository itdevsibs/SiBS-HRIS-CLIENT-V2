import { formatHrisDateLocalized } from "@/lib/axios/dateFormatter";
import React, { useEffect, useMemo, useRef, useState } from "react";
import React, { useMemo } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Info,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import {
  GAP_OPTIONS,
  RISK_OPTIONS,
} from "../../../lib/utils/actionItems/actionItemsConstants.js";
import ModalShell from "../../ui/ModalShell";
import SelectDropdown from "../../ui/SelectDropdown";
import DatePicker from "../../ui/DatePicker";

const STATUS_OPTIONS = ["Planned", "Ongoing", "Completed"];

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
      {children}
      {required ? <span className="text-sibs-orange"> *</span> : null}
    </label>
  );
}

const readOnlyInputClass =
  "h-8.5 2xl:h-10 w-full rounded-[10px] border border-sibs-border bg-sibs-surface-subtle px-3 2xl:px-3.5 sibs-text-xs font-semibold text-sibs-muted outline-none";

const textAreaClass =
  "w-full resize-none rounded-[10px] border border-sibs-border bg-sibs-surface px-3 2xl:px-3.5 py-2.5 sibs-text-xs font-semibold leading-5 text-sibs-navy outline-none transition placeholder:text-sibs-muted focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10";

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

function MetricCell({ label, value, valueClass = "text-sibs-navy" }) {
  return (
    <div className="flex min-h-[50px] 2xl:min-h-[54px] flex-col items-center justify-center px-2 text-center">
      <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase leading-3 tracking-wide text-sibs-muted">
        {label}
      </span>
      <span className={`mt-1 font-mono text-sm 2xl:text-base font-black ${valueClass}`}>
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

  const linkedRoleOptions = useMemo(() => {
    return [
      { value: "", label: "Select role with hiring gap" },
      ...linkedActionOptions.map((option) => {
        const gap = Math.max(
          Number(option.requirement || 0) - Number(option.filled || 0),
          0,
        );
        return {
          value: option.key,
          label: `${option.displayLabel} — ${option.filled}/${option.requirement} filled, ${gap} remaining`,
        };
      }),
    ];
  }, [linkedActionOptions]);

  const ownerSelectOptions = useMemo(() => {
    return [
      { value: "", label: "Select owner" },
      ...ownerOptions
        .filter((option) => option !== "All Owners")
        .map((owner) => ({ value: owner, label: owner })),
    ];
  }, [ownerOptions]);

  const statusSelectOptions = useMemo(() => {
    return STATUS_OPTIONS.map((status) => ({ value: status, label: status }));
  }, []);

  const riskSelectOptions = useMemo(() => {
    return RISK_OPTIONS.filter((option) => option !== "All Risk").map(
      (risk) => ({ value: risk, label: risk }),
    );
  }, []);

  const gapSelectOptions = useMemo(() => {
    return GAP_OPTIONS.filter((option) => option !== "All Gaps").map(
      (gap) => ({ value: gap, label: gap }),
    );
  }, []);

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
    <ModalShell
      open={showAddModal}
      onClose={closeAddModal}
      variant="navy"
      maxWidth="max-w-5xl 2xl:max-w-6xl"
      className="rounded-[14px] text-slate-900"
      headerClassName="rounded-t-[14px]"
      icon={ClipboardList}
      title="Add Recruitment Action Item"
      subtitle="Link a hiring gap to one accountable owner, deadline, risk level, and follow-up action."
      bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-5 font-jakarta"
      footerMeta={
        <div className="flex min-w-0 flex-col gap-2 font-jakarta sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleReset}
            className="sibs-modal-btn-secondary gap-1.5"
          >
            <RotateCcw size={13} />
            Reset Form
          </button>

          <div className="flex min-w-0 items-start gap-1.5 text-[8.5px] 2xl:text-[9px] font-medium leading-4 text-sibs-muted">
            <Info size={13} className="mt-0.5 shrink-0 text-sibs-navy" />
            <span>
              Rule: Every role where Current Filled &lt; Requirement must
              have at least one active action item.
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex shrink-0 items-center justify-end gap-2 font-jakarta">
          <button
            type="button"
            onClick={closeAddModal}
            className="sibs-modal-btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="add-action-item-form"
            className="sibs-modal-btn-primary gap-1.5"
          >
            <Plus size={14} />
            Save Action Item
          </button>
        </div>
      }
      footerClassName="shrink-0 border-t border-sibs-border bg-sibs-surface px-5 py-3 2xl:py-3.5 sm:px-6 rounded-b-[14px]"
    >
      <form
        id="add-action-item-form"
        onSubmit={addActionItem}
        className="font-jakarta"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
          <section className="flex min-w-0 flex-col rounded-[14px] border border-sibs-border bg-sibs-surface p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between border-b border-sibs-border pb-2.5">
              <h3 className="flex items-center gap-1.5 sibs-modal-section-title text-sibs-navy">
                <BriefcaseBusiness size={14} className="shrink-0 text-sibs-orange" />
                Hiring Gap Source Record
              </h3>

              <span className="rounded-[10px] border border-sibs-border bg-white px-2 py-0.5 text-[9px] font-black uppercase text-sibs-navy">
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
              <SelectDropdown
                value={selectedKey}
                options={linkedRoleOptions}
                onChange={(val) => selectLinkedRecord(val)}
                placeholder="Select role with hiring gap"
                searchable
                className="w-full"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 divide-x divide-sibs-border rounded-[10px] border border-sibs-border bg-white px-1 py-1.5">
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
                <span className="text-[9px] font-bold text-sibs-muted">
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

              <div className="h-2 overflow-hidden rounded-full border border-sibs-border bg-sibs-surface-subtle">
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
              <div className="mt-4 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2.5">
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
              <div className="mt-3 rounded-[10px] border border-sibs-border bg-white px-3 py-2.5">
                <p className="text-[8px] font-black uppercase tracking-[0.04em] text-sibs-muted">
                  Latest Status Note:
                </p>
                <p className="mt-1 text-[10px] font-semibold italic leading-4 text-sibs-muted">
                  {latestStatusNote}
                </p>
              </div>
            ) : null}

            <div className="mt-auto pt-4">
              <div className="flex flex-col gap-2 border-t border-sibs-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[9px] font-black uppercase tracking-[0.04em] text-sibs-muted">
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

          <section className="flex min-w-0 flex-col rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-sibs-border pb-3">
              <h3 className="flex min-w-0 items-center gap-2 sibs-modal-section-title text-sibs-navy">
                <CheckCircle2
                  size={14}
                  className="shrink-0 text-sibs-orange"
                />
                Action Definition & Assignment
              </h3>

              <span className="shrink-0 text-[9px] font-bold text-sibs-muted">
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
                <SelectDropdown
                  value={actionForm.owner}
                  options={ownerSelectOptions}
                  onChange={(val) => updateField("owner", val)}
                  placeholder="Select owner"
                  searchable
                  className="w-full"
                />
              </div>

              <div className="min-w-0">
                <FieldLabel required>Target Deadline</FieldLabel>
                <DatePicker
                  value={actionForm.deadline}
                  onChange={(val) => updateField("deadline", val)}
                  placeholder="Select deadline"
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel required>Initial Status</FieldLabel>
                <SelectDropdown
                  value={actionForm.status}
                  options={statusSelectOptions}
                  onChange={(val) => updateField("status", val)}
                  placeholder="Select status"
                  className="w-full"
                />
              </div>

              <div>
                <FieldLabel required>Assigned Risk Level</FieldLabel>
                <SelectDropdown
                  value={actionForm.riskLevel}
                  options={riskSelectOptions}
                  onChange={(val) => updateField("riskLevel", val)}
                  placeholder="Select risk level"
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-3">
              <FieldLabel required>Linked Gap Category</FieldLabel>
              <SelectDropdown
                value={actionForm.linkedGap}
                options={gapSelectOptions}
                onChange={(val) => updateField("linkedGap", val)}
                placeholder="Select gap category"
                className="w-full"
              />
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

            <div className="mt-4 rounded-[10px] border border-blue-100 bg-blue-50 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Info
                  size={14}
                  className="mt-0.5 shrink-0 text-sibs-navy"
                />
                <div>
                  <p className="text-[9px] font-black text-sibs-navy">
                    How this connects to TA-HRIS
                  </p>
                  <p className="mt-1 text-[9px] font-semibold leading-4 text-sibs-muted">
                    This action stays linked to the selected weekly hiring plan
                    or hiring need through the existing Action Items context.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </ModalShell>
  );
}