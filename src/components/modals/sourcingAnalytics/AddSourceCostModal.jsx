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
    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] ${className}`}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[96px] w-full resize-none rounded-[10px] border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2.5 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] ${className}`}
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
    month: "short",
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
      className="fixed z-[999999] overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-2xl"
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
        className={`flex h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left text-xs font-bold outline-none transition ${
          disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-[#FF5C28] bg-white text-[#344054] ring-4 ring-[#FF5C28]/10"
              : "border-[#D7DEE8] bg-[#F8FAFC] text-[#344054] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
        }`}
      >
        <span
          className={`truncate ${
            value ? "text-[#344054]" : "text-sibs-tertiary-5"
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
              className={`block w-full px-4 py-3 text-left text-sm transition ${
                selected
                  ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                  : "text-[#344054] hover:bg-[#F8FAFC]"
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
        className={`flex h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left text-xs font-bold outline-none transition ${
          disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-[#FF5C28] bg-white text-[#344054] ring-4 ring-[#FF5C28]/10"
              : "border-[#D7DEE8] bg-[#F8FAFC] text-[#344054] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:ring-4 focus:ring-[#FF5C28]/10"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={17} className="shrink-0 text-sibs-tertiary-5" />

          <span
            className={`truncate ${
              value ? "text-[#344054]" : "text-sibs-tertiary-5"
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
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
              >
                <ChevronLeft size={15} />
              </button>

              <p className="text-xs font-extrabold text-[#042C51]">
                {monthTitle}
              </p>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-extrabold uppercase tracking-normal text-[#98A2B3]"
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
                    className={`flex h-8 w-full items-center justify-center rounded-lg text-xs font-bold transition ${
                      active
                        ? "bg-[#FF5C28] text-white shadow-sm"
                        : isToday
                          ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                          : currentMonth
                            ? "text-[#042C51] hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                            : "text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#E6ECF2] pt-2.5">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleTodayClick}
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
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
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#9FB3C8] bg-[#F7F9FC] shadow-[0_30px_90px_rgba(2,26,48,0.42)]"
      >
        <header className="shrink-0 bg-[#07365F] px-4 py-4 text-white sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#FF5C28]">
                <ReceiptText size={19} />
              </span>

              <div className="min-w-0">
                <span className="inline-flex rounded bg-[#FF5C28] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                  Sourcing Cost
                </span>

                <h2
                  id="source-cost-modal-title"
                  className="mt-1 text-base font-extrabold text-white"
                >
                  Register Source Cost Entry
                </h2>

                <p className="mt-0.5 text-xs font-semibold text-blue-100">
                  Record a sourcing expense and the recruiting
                  period covered.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-white/10 bg-white/10 px-3 text-[10px] font-extrabold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Reset
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#FF5C28] px-3.5 text-[10px] font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#E95324] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}

                {isSubmitting ? "Saving..." : "Save Cost Entry"}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-blue-100 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close source cost modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC] p-3 sm:p-5">
          <section className="rounded-2xl border border-[#DCE6F1] bg-white p-4 shadow-[0_8px_24px_rgba(4,44,81,0.04)] sm:p-5">
            <div className="mb-4 border-b border-[#EEF2F6] pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                Cost Information
              </h3>

              <p className="mt-1 text-xs font-semibold text-[#667085]">
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

          <section className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-extrabold text-[#042C51]">
              Cost per Hire Formula
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-[#042C51]/75">
              Cost per Hire equals Total Source Cost divided by
              hires from candidates who selected the same source.
              The entry becomes completed automatically after
              Date To.
            </p>
          </section>
        </div>
      </form>
    </div>
  );
}
