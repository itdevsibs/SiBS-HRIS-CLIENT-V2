import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  ReceiptText,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useSourcingAnalytics } from "../../../services/context/SourcingContext";


const initialForm = {
  source: "",
  description: "",
  amount: "",
  dateFrom: "",
  dateTo: "",
};

function getTodayISO() {
  return toDateInputValue(new Date());
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
      {children}
      {required && <span className="text-sibs-orange"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`sibs-input ${className}`}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`sibs-modal-textarea ${className}`}
    />
  );
}

function formatShortDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return "";

  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function findOverlappingCostEntry(costEntries = [], form = {}) {
  if (!form.source || !form.dateFrom || !form.dateTo) {
    return null;
  }

  const source = String(form.source).trim().toLowerCase();

  return (
    (Array.isArray(costEntries) ? costEntries : []).find((entry) => {
      const entrySource = String(entry?.source || "").trim().toLowerCase();
      const entryDateFrom = entry?.dateFrom || entry?.date_from;
      const entryDateTo = entry?.dateTo || entry?.date_to;

      if (!entrySource || entrySource !== source) return false;
      if (!entryDateFrom || !entryDateTo) return false;

      return entryDateFrom <= form.dateTo && entryDateTo >= form.dateFrom;
    }) || null
  );
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const calendarStart = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
  minWidth = 0,
  placement = "bottom",
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();
      const dropdownWidth = Math.max(rect.width, minWidth);
      const viewportPadding = 12;
      const maxLeft = window.innerWidth - dropdownWidth - viewportPadding;
      const estimatedHeight = Math.min(maxHeight, window.innerHeight - viewportPadding * 2);
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const shouldOpenAbove =
        placement === "top" ||
        (placement === "auto" &&
          spaceBelow < estimatedHeight &&
          spaceAbove > spaceBelow);

      setStyle({
        top: shouldOpenAbove
          ? Math.max(viewportPadding, rect.top - estimatedHeight - 8)
          : Math.min(rect.bottom + 8, window.innerHeight - estimatedHeight - viewportPadding),
        left: Math.max(viewportPadding, Math.min(rect.left, maxLeft)),
        width: dropdownWidth,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, maxHeight, minWidth, placement]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      const clickedAnchor = anchorRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="sibs-dropdown-pop-in fixed z-[999999] overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-2xl"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="overflow-y-auto py-2 sibs-scrollbar"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const displayValue = value || placeholder;

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left sibs-text-xs font-semibold outline-none transition ${
          disabled
            ? "cursor-not-allowed border-sibs-faint bg-sibs-surface-subtle text-sibs-muted"
            : open
              ? "border-sibs-orange bg-white text-sibs-muted ring-4 ring-sibs-orange/10"
              : "border-sibs-border bg-sibs-surface text-sibs-muted hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10"
        }`}
      >
        <span
          className={`truncate ${
            value ? "text-sibs-muted" : "text-sibs-tertiary-5"
          }`}
        >
          {displayValue}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        {options.map((option) => {
          const selected = String(value) === String(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 2xl:py-2 text-left sibs-text-xs transition ${
                selected
                  ? "bg-sibs-surface font-bold text-sibs-primary-1"
                  : "text-sibs-muted hover:bg-sibs-surface"
              }`}
            >
              <span className="block truncate">{option}</span>
            </button>
          );
        })}
      </DropdownPortal>
    </div>
  );
}

function DateDropdown({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const selectedDate = useMemo(() => {
    if (!value) return null;

    const [year, month, day] = String(value).split("-").map(Number);

    if (!year || !month || !day) return null;

    const parsed = new Date(year, month - 1, day);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  function goToPreviousMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleSelectDate(date) {
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleTodayClick() {
    const currentDate = new Date();

    onChange(toDateInputValue(currentDate));
    setViewDate(currentDate);
    setOpen(false);
  }

  const monthTitle = viewDate.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const displayValue = value ? formatShortDate(value) : placeholder;

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) {
            setViewDate(selectedDate || new Date());
          }

          setOpen((prev) => !prev);
        }}
        className={`flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left sibs-text-xs font-semibold outline-none transition ${
          disabled
            ? "cursor-not-allowed border-sibs-faint bg-sibs-surface-subtle text-sibs-muted"
            : open
              ? "border-sibs-orange bg-white text-sibs-muted ring-4 ring-sibs-orange/10"
              : "border-sibs-border bg-sibs-surface text-sibs-muted hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={17} className="shrink-0 text-sibs-tertiary-5" />

          <span
            className={`truncate ${
              value ? "text-sibs-muted" : "text-sibs-tertiary-5"
            }`}
          >
            {displayValue}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        maxHeight={390}
        minWidth={280}
        placement="auto"
      >
          <div className="p-3.5">
            <div className="mb-3 flex items-center justify-between rounded-[10px] border border-sibs-border bg-sibs-surface px-3 py-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
              >
                <ChevronLeft size={15} />
              </button>

              <p className="text-xs font-extrabold text-sibs-navy">
                {monthTitle}
              </p>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-extrabold uppercase tracking-normal text-sibs-faint"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((date) => {
                const currentMonth = date.getMonth() === viewDate.getMonth();
                const active = selectedDate && isSameDate(date, selectedDate);
                const isToday = isSameDate(date, today);

                return (
                  <button
                    key={toDateInputValue(date)}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={`flex h-8 w-full items-center justify-center rounded-[10px] text-xs font-bold transition ${
                      active
                        ? "bg-sibs-orange text-white shadow-sm"
                        : isToday
                          ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                          : currentMonth
                            ? "text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                            : "text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-sibs-border pt-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-sibs-muted transition hover:bg-sibs-cream-light hover:text-sibs-orange"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleTodayClick}
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
              >
                Today
              </button>
            </div>
          </div>
      </DropdownPortal>
    </div>
  );
}

export default function AddSourceCostModal({ open, onClose, onStatus }) {
  const {
    createSourceCostEntry,
    addSourceCost,
    costEntries = [],
    sourcingOptions = [],
    fetchSourcingOptions,
  } = useSourcingAnalytics();

  const sourceOptionValues = useMemo(() => {
    return sourcingOptions
      .map((option) => {
        if (typeof option === "string") {
          return option.trim();
        }

        return String(
          option?.value ||
            option?.optionValue ||
            option?.option_value ||
            option?.label ||
            option?.optionLabel ||
            option?.option_label ||
            "",
        ).trim();
      })
      .filter(Boolean);
  }, [sourcingOptions]);

  const [form, setForm] = useState({
    ...initialForm,
    dateFrom: getTodayISO(),
    dateTo: getTodayISO(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open]);

  useEffect(() => {
    if (
      !open ||
      sourceOptionValues.length > 0 ||
      !fetchSourcingOptions
    ) {
      return;
    }

    let active = true;

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        await fetchSourcingOptions();
      } catch (error) {
        if (!active) return;

        onStatus?.({
          type: "error",
          title: "Unable to Load Options",
          message:
            error?.message ||
            "Unable to load sourcing options from Talent Pool settings.",
        });
      } finally {
        if (active) {
          setIsLoadingOptions(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [
    open,
    sourceOptionValues.length,
    fetchSourcingOptions,
    onStatus,
  ]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleReset() {
    const today = getTodayISO();

    setForm({
      ...initialForm,
      dateFrom: today,
      dateTo: today,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.source) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Sourcing option is required.",
      });
      return;
    }

    if (!form.description.trim()) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Description is required.",
      });
      return;
    }

    if (form.amount === "" || Number(form.amount) <= 0) {
      onStatus?.({
        type: "error",
        title: "Invalid Amount",
        message: "Amount must be greater than 0.",
      });
      return;
    }

    if (!form.dateFrom) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Date From is required.",
      });
      return;
    }

    if (!form.dateTo) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Date To is required.",
      });
      return;
    }

    if (form.dateTo < form.dateFrom) {
      onStatus?.({
        type: "error",
        title: "Invalid Date Range",
        message: "Date To cannot be earlier than Date From.",
      });
      return;
    }

    const conflictingEntry = findOverlappingCostEntry(
      costEntries,
      form,
    );

    if (conflictingEntry) {
      onStatus?.({
        type: "error",
        title: "Campaign Date Conflict",
        message: `This source already has a campaign from ${formatShortDate(conflictingEntry.dateFrom || conflictingEntry.date_from)} to ${formatShortDate(conflictingEntry.dateTo || conflictingEntry.date_to)}. Choose another date range or edit the existing campaign.`,
      });
      return;
    }

    const payload = {
      source: form.source,
      description: form.description.trim(),
      amount: Number(form.amount || 0),
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
    };

    setIsSubmitting(true);

    try {
      const submitter = createSourceCostEntry || addSourceCost;

      if (!submitter) {
        throw new Error(
          "SourcingAnalyticsContext is missing createSourceCostEntry.",
        );
      }

      await submitter(payload);

      onStatus?.({
        type: "success",
        title: "Source Cost Added",
        message: "Source cost entry has been added successfully.",
      });

      handleReset();
      onClose?.();
    } catch (error) {
      onStatus?.({
        type: "error",
        title: "Submission Failed",
        message: error?.message || "Unable to add source cost entry.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[9999] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={isSubmitting ? undefined : onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-cost-modal-title"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] 2xl:max-h-[90dvh] w-full max-w-2xl 2xl:max-w-3xl flex-col overflow-hidden rounded-[14px] border border-sibs-border bg-sibs-surface shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
      >
        <header className="shrink-0 bg-sibs-navy px-4 py-2.5 sm:px-5 2xl:py-3.5 text-white rounded-t-[14px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-sibs-orange">
                <ReceiptText className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" />
              </span>

              <div className="min-w-0">
                <span className="inline-flex rounded bg-sibs-orange px-2 py-0.5 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-white">
                  Sourcing Cost
                </span>

                <h2
                  id="source-cost-modal-title"
                  className="sibs-modal-title mt-0.5 truncate text-white"
                >
                  Register Source Cost Entry
                </h2>

                <p className="sibs-modal-subtitle mt-0.5 text-white/75 truncate sm:text-clip">
                  Record a sourcing expense and the recruiting period covered.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="sibs-modal-close-btn"
                aria-label="Close source cost modal"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sibs-surface p-3 sm:p-4 2xl:p-5">
          <section className="rounded-[14px] border border-sibs-border bg-white p-3.5 sm:p-4 2xl:p-5 shadow-[0_8px_24px_rgba(4,44,81,0.04)]">
            <div className="mb-3 2xl:mb-4 border-b border-sibs-border pb-2.5 2xl:pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-sibs-navy">
                Cost Information
              </h3>

              <p className="mt-0.5 text-xs font-semibold text-sibs-muted">
                Fields marked with an asterisk are required.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <FieldLabel required>Sourcing Option</FieldLabel>

                <CustomSelect
                  value={form.source}
                  options={sourceOptionValues}
                  onChange={(value) =>
                    updateField("source", value)
                  }
                  placeholder={
                    isLoadingOptions
                      ? "Loading sourcing options..."
                      : "Select sourcing option"
                  }
                  disabled={
                    isSubmitting || isLoadingOptions
                  }
                />
              </div>

              <div>
                <FieldLabel required>Description</FieldLabel>

                <TextArea
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  disabled={isSubmitting}
                  placeholder="Example: Facebook Ads - CSR Hiring Campaign"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel required>Amount</FieldLabel>

                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      updateField(
                        "amount",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    placeholder="Example: 10000"
                  />
                </div>

                <div>
                  <FieldLabel required>Date From</FieldLabel>

                  <DateDropdown
                    value={form.dateFrom}
                    onChange={(value) => {
                      updateField("dateFrom", value);

                      if (
                        value &&
                        form.dateTo &&
                        form.dateTo < value
                      ) {
                        updateField("dateTo", value);
                      }
                    }}
                    disabled={isSubmitting}
                    placeholder="Select date from"
                  />
                </div>

                <div>
                  <FieldLabel required>Date To</FieldLabel>

                  <DateDropdown
                    value={form.dateTo}
                    onChange={(value) =>
                      updateField("dateTo", value)
                    }
                    disabled={isSubmitting}
                    placeholder="Select date to"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-[10px] border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-extrabold text-sibs-navy">
              Cost per Hire Formula
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-sibs-navy/75">
              Cost per Hire equals Total Source Cost divided by
              hires from candidates who selected the same source.
              The entry becomes completed automatically after
              Date To.
            </p>
          </section>
        </div>

        <footer className="shrink-0 border-t border-sibs-border bg-sibs-surface px-5 py-3 2xl:py-3.5 sm:px-6 rounded-b-[14px]">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="sibs-modal-btn-secondary w-full sm:w-auto"
                title="Reset cost entry form"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="sibs-modal-btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="sibs-modal-btn-primary w-full sm:w-auto"
                title="Save this cost entry"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Cost Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}
