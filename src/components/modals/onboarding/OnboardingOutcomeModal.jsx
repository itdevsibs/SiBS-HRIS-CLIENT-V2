import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Info,
  UserX,
  X,
} from "lucide-react";

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function OnboardingDateDropdown({ value, onChange, disabled = false }) {
  const anchorRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const [menuStyle, setMenuStyle] = useState(null);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : new Date(viewDate.getFullYear(), viewDate.getMonth(), index - firstDay + 1),
  );

  useEffect(() => {
    if (value) setViewDate(new Date(`${value}T00:00:00`));
  }, [value]);

  useEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    const updatePosition = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const renderedHeight = menuRef.current?.getBoundingClientRect().height || 0;
      const menuHeight = renderedHeight || 290;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setMenuStyle({
        left: rect.left,
        top: openUp ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6,
        width: rect.width,
      });

      if (!renderedHeight) {
        window.requestAnimationFrame(updatePosition);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className="relative min-w-0 font-jakarta">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-8.5 2xl:h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 2xl:px-3.5 text-left font-jakarta sibs-text-xs font-semibold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-2 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] bg-[#F8FAFC] hover:border-[#FF5C28]/45"
        }`}
      >
        <span className={`flex items-center gap-2 truncate ${value ? "text-[#042C51]" : "text-[#98A2B3]"}`}>
          <CalendarDays size={14} className="text-[#FF5C28]" />
          {value || "Select date"}
        </span>
        <ChevronDown
          size={14}
          className={`text-[#FF5C28] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            className="sibs-dropdown-pop-in fixed z-[11000] overflow-visible rounded-xl border border-[#D7DEE8] bg-white p-3 shadow-2xl"
            style={{ left: menuStyle.left, top: menuStyle.top, width: menuStyle.width }}
          >
            <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-1.5">
              <button
                type="button"
                onClick={() =>
                  setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white text-[#042C51]"
              >
                <ChevronLeft size={15} />
              </button>
              <div className="flex-1 text-center text-xs font-extrabold text-[#042C51]">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <button
                type="button"
                onClick={() =>
                  setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white text-[#042C51]"
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((day) => (
                <div key={day} className="py-1 text-center text-[10px] font-extrabold text-[#98A2B3]">
                  {day}
                </div>
              ))}
              {days.map((date, index) =>
                date ? (
                  <button
                    key={toDateInputValue(date)}
                    type="button"
                    onClick={() => {
                      onChange(toDateInputValue(date));
                      setOpen(false);
                    }}
                    className={`flex h-8 items-center justify-center rounded-lg text-xs font-bold ${
                      value === toDateInputValue(date)
                        ? "bg-[#FF5C28] text-white"
                        : "text-[#042C51] hover:bg-[#FFF0EB]"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <span key={`blank-${index}`} />
                ),
              )}
            </div>
            <div className="mt-3 flex justify-between border-t border-[#E6ECF2] pt-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="h-8 rounded-lg border border-[#D7DEE8] px-3 text-xs font-extrabold text-[#042C51]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  onChange(toDateInputValue(today));
                  setViewDate(today);
                  setOpen(false);
                }}
                className="h-8 rounded-lg bg-[#FF5C28] px-3 text-xs font-extrabold text-white"
              >
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

const reasonCategoryOptions = [
  "No Response",
  "Personal Reason",
  "Schedule",
  "Accepted Other Offer",
  "Location Issue",
  "Incomplete Requirements",
  "Others",
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

  return date.toLocaleDateString("en-PH", {
    month: "short",
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
  const theme = themeByType[type] || themeByType.Show;
  const Icon = theme.icon;
  const isShow = type === "Show";
  const isNoShow = type === "No Show";
  const isWithdrawn = type === "Withdrawn";

  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open || !record) return null;

  return (
    <div
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10020] flex h-dvh items-center justify-center px-2 py-2 font-jakarta sm:px-4 sm:py-4"
      onMouseDown={onClose}
    >
      <div
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 bg-[#042C51] px-5 py-4 text-white sm:px-6">
          <div className="min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${theme.badge}`}
            >
              <Icon size={12} />
              Outcome Resolution
            </span>
            <h2 className="sibs-modal-title mt-2 text-white">
              {theme.title}
            </h2>
            <p className="sibs-modal-subtitle mt-0.5 text-white/75">
              Resolve the candidate’s onboarding start outcome and required notes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-close-btn"
            aria-label="Close outcome modal"
          >
            <X size={17} />
          </button>
        </header>

        <form
          id="outcome-form"
          onSubmit={onSubmit}
          className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-4 sm:p-5"
        >
          <div className="space-y-4">
            <section className={`rounded-2xl border p-4 ${theme.panel}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#667085]">
                    Candidate
                  </p>
                  <h3 className={`sibs-modal-section-title mt-1 ${theme.text}`}>
                    {record.candidateName}
                  </h3>
                  <p className="sibs-modal-section-subtitle mt-0.5 text-[#667085]">
                    {record.roleTitle || "Not assigned"} • {record.account || "No account"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className="rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[9px] font-extrabold text-[#475467]">
                    Expected: {formatDateDisplay(record.expectedStartDate)}
                  </span>
                  <span className="rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[9px] font-extrabold text-[#475467]">
                    Current: {record.showStatus || "Pending"}
                  </span>
                </div>
              </div>
            </section>

            {isShow ? (
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <div>
                  <label className="sibs-modal-field-label">
                    Actual Start Date <span className="text-red-500">*</span>
                  </label>
                  <OnboardingDateDropdown
                    value={form.actualStartDate}
                    onChange={(date) =>
                      setForm({ ...form, actualStartDate: date })
                    }
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Internal Remarks</label>
                  <textarea
                    rows={3}
                    value={form.remarks}
                    onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                    placeholder="Optional notes regarding the candidate’s actual start..."
                    className="sibs-modal-textarea"
                  />
                </div>
              </section>
            ) : null}

            {(isNoShow || isWithdrawn) ? (
              <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      Reason Category <span className="text-[#FF5C28]"> *</span>
                    </label>
                    <select
                      required
                      value={form.reasonCategory}
                      onChange={(event) =>
                        setForm({ ...form, reasonCategory: event.target.value })
                      }
                      className="sibs-modal-input cursor-pointer"
                    >
                      <option value="">Select reason category</option>
                      {reasonCategoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Experience Rating</label>
                    <select
                      value={String(form.experienceRating ?? 3)}
                      onChange={(event) =>
                        setForm({ ...form, experienceRating: Number(event.target.value) })
                      }
                      className="sibs-modal-input cursor-pointer"
                    >
                      <option value="5">5 — Excellent</option>
                      <option value="4">4 — Very Good</option>
                      <option value="3">3 — Average</option>
                      <option value="2">2 — Poor</option>
                      <option value="1">1 — Terrible</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                      {isNoShow ? "No Show Reason" : "Withdrawal Reason"}{" "}
                      <span className="text-[#FF5C28]"> *</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={form.withdrawalReason}
                      onChange={(event) =>
                        setForm({ ...form, withdrawalReason: event.target.value })
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
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Feedback Tag</label>
                    <input
                      value={form.feedbackTag}
                      onChange={(event) => setForm({ ...form, feedbackTag: event.target.value })}
                      placeholder={isNoShow ? "No Show" : "Pre-start Withdrawal"}
                      className="sibs-modal-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Internal Remarks</label>
                    <input
                      value={form.remarks}
                      onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                      placeholder="Optional internal notes"
                      className="sibs-modal-input"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">Candidate Feedback</label>
                    <textarea
                      rows={3}
                      value={form.candidateFeedback}
                      onChange={(event) =>
                        setForm({ ...form, candidateFeedback: event.target.value })
                      }
                      placeholder="Optional direct feedback provided by the candidate..."
                      className="sibs-modal-textarea"
                    />
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#042C51] text-[#FF5C28]">
                  <Info size={15} />
                </span>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#042C51]">
                    System Action
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-5 text-[#475467]">
                    {isShow
                      ? "Confirming this outcome marks the candidate as a True Hire and allows the record to contribute to the final placement count."
                      : "Confirming this outcome keeps the candidate out of the True Hire count and preserves the reason/experience data for reporting and Candidate Experience workflows."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </form>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-3.5 sm:px-6">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="outcome-form"
              className={`inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition active:scale-[0.98] ${theme.button}`}
            >
              {isShow ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              Confirm Outcome
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
