import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Plus, X } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Not Started", value: "Not Started" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function getHeadcountStatusText(item) {
  return String(
    getSafeValue(
      item?.headcountStatus,
      item?.headcount_status,
      item?.approvalStatus,
      item?.approval_status,
      item?.headcountApprovalStatus,
      item?.headcount_approval_status,
      item?.status,
      "Kronos"
    )
  ).trim();
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
      {children}
      {required && <span className="text-[#FF5C28]"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-[#667085] ${className}`}
    />
  );
}

function TextAreaInput({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[85px] w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 py-2.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-[#667085] ${className}`}
    />
  );
}

function AnimatedDropdown({ open, children }) {
  if (!open) return null;
  return (
    <div className="sibs-dropdown-pop-in absolute left-0 right-0 top-full z-[9999] mt-1.5">
      <div className="overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-xl">
        <div className="sibs-scrollbar max-h-56 overflow-y-auto py-1.5">{children}</div>
      </div>
    </div>
  );
}

function StatusDropdown({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected =
    STATUS_OPTIONS.find((option) => option.value === value) ||
    STATUS_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={`flex h-8.5 2xl:h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold text-[#042C51] outline-none transition hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#667085] ${
          open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : ""
        }`}
      >
        <span className="truncate">{selected.label}</span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        {STATUS_OPTIONS.map((option) => {
          const isSelected = option.value === selected.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left sibs-text-xs transition ${
                isSelected
                  ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                  : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? "border-[#FF5C28] bg-[#FF5C28]"
                    : "border-[#D7DEE8] bg-white"
                }`}
              >
                {isSelected && (
                  <span className="h-1 w-1 rounded-full bg-white" />
                )}
              </span>

              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </AnimatedDropdown>
    </div>
  );
}

export default function ActionItemModal({
  open,
  item,
  form,
  setForm,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [shouldRender, setShouldRender] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let timer;

    if (open) {
      setShouldRender(true);
      setIsClosing(false);
      return undefined;
    }

    if (shouldRender) {
      setIsClosing(true);

      timer = window.setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 220);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [open, shouldRender]);

  if (!shouldRender || !item) return null;

  const headcountStatus = getHeadcountStatusText(item);

  const requiredHeadcount = getNumberValue(
    item.requiredHeadcount,
    item.required_headcount
  );

  const actualHeadcount = getNumberValue(
    item.actualHeadcount,
    item.actual_headcount
  );

  const leadsNeeded = getNumberValue(
    item.leadsNeeded,
    item.leads_needed,
    item.leadsToInterview,
    item.leads_to_interview,
    item.leadsRequired,
    item.leads_required,
    item.requiredLeads,
    item.required_leads
  );

  const currentLeadsInterviewed = getNumberValue(
    item.currentLeadsInterviewed,
    item.current_leads_interviewed,
    item.currentInterviewed,
    item.current_interviewed,
    item.currentInterviewCount,
    item.current_interview_count,
    item.interviewCount,
    item.interview_count,
    item.interviewedCount,
    item.interviewed_count,
    item.totalInterviewed,
    item.total_interviewed,
    item.interviews,
    item.interviewed
  );

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleAnimatedClose() {
    if (isClosing || submitting) return;

    setIsClosing(true);

    window.setTimeout(() => {
      onClose?.();
    }, 220);
  }

  return (
    <div
      className={`absolute inset-0 z-[30] overflow-hidden bg-black/30 backdrop-blur-sm ${
        isClosing ? "sibs-action-backdrop-out" : "sibs-action-backdrop-in"
      }`}
    >
      <button
        type="button"
        aria-label="Close action item drawer"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={handleAnimatedClose}
      />

      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className={`absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col bg-white shadow-2xl ${
          isClosing ? "sibs-action-drawer-out" : "sibs-action-drawer-in"
        }`}
      >
        <div className="shrink-0 border-b border-[#E6ECF2] bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="sibs-modal-title truncate text-white">
                  Add Action Item
                </h2>
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-white">
                  Workforce
                </span>
              </div>

              <p className="sibs-modal-subtitle mt-0.5 text-white/75 truncate sm:text-clip">
                Add a weekly action item for {item.account || "—"} /{" "}
                {item.cluster || "—"}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnimatedClose}
              disabled={isClosing || submitting}
              className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close action item drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-sibs-primary-1">
                {item.account || "—"} / {item.cluster || "—"}
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-sibs-primary-1/75">
                Required: {formatNumber(requiredHeadcount)} / Actual:{" "}
                {formatNumber(actualHeadcount)} / Leads Needed:{" "}
                {formatNumber(leadsNeeded)} / Current Interviewed:{" "}
                {formatNumber(currentLeadsInterviewed)}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-white/80 px-3 py-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                  Leads Needed
                </p>

                <p className="mt-1 font-heading text-base 2xl:text-lg font-bold tabular-nums text-sibs-primary-1">
                  {formatNumber(leadsNeeded)}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white/80 px-3 py-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                  Current Leads Interviewed
                </p>

                <p className="mt-1 font-heading text-base 2xl:text-lg font-bold tabular-nums text-sibs-primary-1">
                  {formatNumber(currentLeadsInterviewed)}
                </p>
              </div>
            </div>
          </div>

          {headcountStatus === "Pending" && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-amber-800">
                Pending Headcount Approval
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-amber-700">
                Required headcount is still Kronos-based until the pending
                update is approved.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-4 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
            <div>
              <FieldLabel required>Action Item</FieldLabel>

              <TextAreaInput
                required
                value={form.actionItem || ""}
                onChange={(e) => updateField("actionItem", e.target.value)}
                placeholder="Example: Increase sourcing volume."
                disabled={submitting}
              />
            </div>

            <div>
              <FieldLabel required>Owner</FieldLabel>

              <TextInput
                required
                disabled
                value={form.owner || "-"}
                placeholder="-"
              />

              <p className="mt-1 text-[11px] font-semibold text-sibs-tertiary-5">
                Owner is automatically based on the logged-in user.
              </p>
            </div>

            <div>
              <FieldLabel required>Deadline</FieldLabel>

              <TextInput
                required
                type="date"
                value={form.deadline || ""}
                onChange={(e) => updateField("deadline", e.target.value)}
                disabled={submitting}
              />
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>

              <StatusDropdown
                value={form.status || "Pending"}
                onChange={(value) => updateField("status", value)}
                disabled={submitting}
              />
            </div>

            <div>
              <FieldLabel>Remarks</FieldLabel>

              <TextAreaInput
                value={form.actionItemRemarks || ""}
                onChange={(e) =>
                  updateField("actionItemRemarks", e.target.value)
                }
                placeholder="Add notes or next steps."
                className="min-h-[100px]"
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3 2xl:py-3.5">
          <div className="flex flex-col justify-end gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleAnimatedClose}
              disabled={isClosing || submitting}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isClosing || submitting}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={15} />
              {submitting ? "Saving..." : "Save Action Item"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}