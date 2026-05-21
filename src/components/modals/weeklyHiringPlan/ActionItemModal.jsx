import React from "react";
import { ClipboardList, Plus, X } from "lucide-react";

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
      className={`h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
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

function SelectInput({ children, className = "", ...props }) {
  return (
    <select
      {...props}
      className={`h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${className}`}
    >
      {children}
    </select>
  );
}

export default function ActionItemModal({
  open,
  item,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !item) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div className="absolute inset-0 z-[30] overflow-hidden bg-black/30">
      <style>
        {`
          @keyframes actionItemDrawerIn {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes actionItemFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>

      <button
        type="button"
        aria-label="Close action item drawer"
        className="absolute inset-0 h-full w-full cursor-default"
        style={{ animation: "actionItemFadeIn 160ms ease-out" }}
        onClick={onClose}
      />

      <form
        onSubmit={onSubmit}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col bg-white shadow-2xl"
        style={{ animation: "actionItemDrawerIn 230ms ease-out" }}
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
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
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
              />
            </div>

            <div>
              <FieldLabel required>Owner</FieldLabel>
              <TextInput
                required
                value={form.owner || ""}
                onChange={(e) => updateField("owner", e.target.value)}
                placeholder="Enter owner name"
              />
            </div>

            <div>
              <FieldLabel required>Deadline</FieldLabel>
              <TextInput
                required
                type="date"
                value={form.deadline || ""}
                onChange={(e) => updateField("deadline", e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <SelectInput
                value={form.status || "Pending"}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="Pending">Pending</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </SelectInput>
            </div>

            <div>
              <FieldLabel>Remarks</FieldLabel>
              <TextAreaInput
                value={form.remarks || ""}
                onChange={(e) => updateField("remarks", e.target.value)}
                placeholder="Add notes or next steps."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-4">
          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={17} />
              Save Action Item
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}