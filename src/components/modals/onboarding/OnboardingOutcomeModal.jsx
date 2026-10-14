import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Info,
  UserX,
} from "lucide-react";
import { DatePicker, ModalShell, SelectDropdown } from "@/components/ui";

const reasonCategoryOptions = [
  { label: "No Response", value: "No Response" },
  { label: "Personal Reason", value: "Personal Reason" },
  { label: "Schedule", value: "Schedule" },
  { label: "Accepted Other Offer", value: "Accepted Other Offer" },
  { label: "Location Issue", value: "Location Issue" },
  { label: "Incomplete Requirements", value: "Incomplete Requirements" },
  { label: "Others", value: "Others" },
];

const experienceRatingOptions = [
  { label: "5 — Excellent", value: 5 },
  { label: "4 — Very Good", value: 4 },
  { label: "3 — Average", value: 3 },
  { label: "2 — Poor", value: 2 },
  { label: "1 — Terrible", value: 1 },
];

const themeByType = {
  Show: {
    title: "Mark as True Hire",
    outcome: "True Hire",
    badge: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
    panel: "border-emerald-100 bg-emerald-50",
    text: "text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
    icon: CheckCircle2,
  },
  "No Show": {
    title: "Mark as No Show",
    outcome: "No Show",
    badge: "border-red-300/30 bg-red-300/10 text-red-200",
    panel: "border-red-100 bg-red-50",
    text: "text-red-700",
    button: "bg-red-600 hover:bg-red-700",
    icon: UserX,
  },
  Withdrawn: {
    title: "Mark as Pre-start Withdrawal",
    outcome: "Pre-start Withdrawal",
    badge: "border-orange-300/30 bg-orange-300/10 text-orange-200",
    panel: "border-orange-100 bg-orange-50",
    text: "text-orange-700",
    button: "bg-orange-600 hover:bg-orange-700",
    icon: CircleX,
  },
};

function formatDateDisplay(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return formatHrisDateLocalized(date, "en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function OutcomeModal({
  open,
  record,
  type,
  form,
  setForm,
  onClose,
  onSubmit,
}) {
  if (!open || !record) return null;

  const theme = themeByType[type] || themeByType.Show;
  const Icon = theme.icon;
  const isShow = type === "Show";
  const isNoShow = type === "No Show";
  const isWithdrawn = type === "Withdrawn";

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-2xl"
      icon={Icon}
      badge="Outcome Resolution"
      title={theme.title}
      subtitle="Resolve the candidate’s onboarding start outcome and required notes."
      bodyClassName="bg-sibs-surface p-4 sm:p-5 font-jakarta"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="outcome-form"
            className={`inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-[10px] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition active:scale-[0.98] ${theme.button}`}
          >
            {isShow ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            Confirm Outcome
          </button>
        </div>
      }
    >
      <form
        id="outcome-form"
        onSubmit={onSubmit}
        className="font-jakarta space-y-4"
      >
        <section className={`rounded-[14px] border p-4 ${theme.panel}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted">
                Candidate
              </p>
              <h3 className={`sibs-modal-section-title mt-1 ${theme.text}`}>
                {record.candidateName}
              </h3>
              <p className="sibs-modal-section-subtitle mt-0.5 text-sibs-muted">
                {record.roleTitle || "Not assigned"} • {record.account || "No account"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[9px] font-extrabold text-sibs-muted">
                Expected: {formatDateDisplay(record.expectedStartDate)}
              </span>
              <span className="rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[9px] font-extrabold text-sibs-muted">
                Current: {record.showStatus || "Pending"}
              </span>
            </div>
          </div>
        </section>

        {isShow ? (
          <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm">
            <div>
              <label className="sibs-modal-field-label">
                Actual Start Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={form.actualStartDate}
                onChange={(date) =>
                  setForm((previous) => ({ ...previous, actualStartDate: date }))
                }
                placeholder="Select start date"
              />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                Internal Remarks
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, remarks: event.target.value }))
                }
                placeholder="Optional notes regarding the candidate’s actual start..."
                className="sibs-modal-textarea"
              />
            </div>
          </section>
        ) : null}

        {isNoShow || isWithdrawn ? (
          <section className="rounded-[14px] border border-sibs-border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                  Reason Category <span className="text-sibs-orange">*</span>
                </label>
                <SelectDropdown
                  value={form.reasonCategory}
                  options={reasonCategoryOptions}
                  onChange={(val) =>
                    setForm((previous) => ({ ...previous, reasonCategory: val }))
                  }
                  placeholder="Select reason category"
                  searchable={false}
                  className="w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                  Experience Rating
                </label>
                <SelectDropdown
                  value={form.experienceRating ?? 3}
                  options={experienceRatingOptions}
                  onChange={(val) =>
                    setForm((previous) => ({
                      ...previous,
                      experienceRating: Number(val),
                    }))
                  }
                  placeholder="Select rating"
                  searchable={false}
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                  {isNoShow ? "No Show Reason" : "Withdrawal Reason"}{" "}
                  <span className="text-sibs-orange">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.withdrawalReason}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      withdrawalReason: event.target.value,
                    }))
                  }
                  placeholder={
                    isNoShow
                      ? "Document why the candidate did not report on the expected start date..."
                      : "Document why the candidate withdrew before the expected start date..."
                  }
                  className="sibs-modal-textarea"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                  Feedback Tag
                </label>
                <input
                  value={form.feedbackTag}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, feedbackTag: event.target.value }))
                  }
                  placeholder={isNoShow ? "No Show" : "Pre-start Withdrawal"}
                  className="sibs-modal-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                  Internal Remarks
                </label>
                <input
                  value={form.remarks}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, remarks: event.target.value }))
                  }
                  placeholder="Optional internal notes"
                  className="sibs-modal-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
                  Candidate Feedback
                </label>
                <textarea
                  rows={3}
                  value={form.candidateFeedback}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      candidateFeedback: event.target.value,
                    }))
                  }
                  placeholder="Optional direct feedback provided by the candidate..."
                  className="sibs-modal-textarea"
                />
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[14px] border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-sibs-navy text-sibs-orange">
              <Info size={15} />
            </span>
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy">
                System Action
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-5 text-sibs-muted">
                {isShow
                  ? "Confirming this outcome marks the candidate as a True Hire and allows the record to contribute to the final placement count."
                  : "Confirming this outcome keeps the candidate out of the True Hire count and preserves the reason/experience data for reporting and Candidate Experience workflows."}
              </p>
            </div>
          </div>
        </section>
      </form>
    </ModalShell>
  );
}
