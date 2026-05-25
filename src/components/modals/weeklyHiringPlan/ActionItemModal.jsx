import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Plus, X } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Not Started", value: "Not Started" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
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
      className={`h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#667085] ${className}`}
    />
  );
}

function TextAreaInput({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[115px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#667085] ${className}`}
    />
  );
}

function AnimatedDropdown({ open, children }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full z-[9999] mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100 translate-y-0"
          : "pointer-events-none grid-rows-[0fr] opacity-0 -translate-y-1"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="overflow-hidden rounded-xl border border-[#D0D5DD] bg-white shadow-xl">
          <div className="max-h-56 overflow-y-auto py-2">{children}</div>
        </div>
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
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/40 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#667085] ${
          open ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10" : ""
        }`}
      >
        <span className="truncate">{selected.label}</span>

        <ChevronDown
          size={18}
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
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                isSelected
                  ? "bg-[#EAF2FB] font-extrabold text-sibs-primary-1"
                  : "font-semibold text-[#344054] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? "border-sibs-primary-1 bg-sibs-primary-1"
                    : "border-[#D0D5DD] bg-white"
                }`}
              >
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
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
      className={`absolute inset-0 z-[30] overflow-hidden bg-black/30 ${
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
        <div className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ClipboardList size={14} />
                Action Item
              </div>

              <h2 className="mt-3 text-xl font-extrabold text-sibs-primary-1">
                Add Action Item
              </h2>

              <p className="mt-1 text-sm font-semibold leading-6 text-sibs-tertiary-5">
                Add a weekly action item for {item.account || "—"} /{" "}
                {item.cluster || "—"}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAnimatedClose}
              disabled={isClosing || submitting}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close action item drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-extrabold text-sibs-primary-1">
              {item.account || "—"} / {item.cluster || "—"}
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-primary-1/75">
              Required: {formatNumber(item.requiredHeadcount)} / Actual:{" "}
              {formatNumber(item.actualHeadcount)} / Leads:{" "}
              {formatNumber(item.leadsToInterview)}
            </p>
          </div>

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

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-4">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAnimatedClose}
              disabled={isClosing || submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isClosing || submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />
              {submitting ? "Saving..." : "Save Action Item"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}