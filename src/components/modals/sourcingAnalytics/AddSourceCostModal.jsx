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
  Plus,
  ReceiptText,
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
    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] ${className}`}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={`min-h-[110px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] ${className}`}
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

      setStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

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
      className="fixed z-[999999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl"
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
        className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold outline-none transition ${
          disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-sibs-primary-1 bg-white text-[#344054] ring-4 ring-sibs-primary-1/10"
              : "border-[#D0D5DD] bg-white text-[#344054] hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

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
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold outline-none transition ${
          disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-sibs-primary-1 bg-white text-[#344054] ring-4 ring-sibs-primary-1/10"
              : "border-[#E6ECF2] bg-white text-[#344054] hover:border-sibs-primary-1/30 hover:bg-slate-50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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

      <div
        className={`grid transition-all duration-300 ease-out ${
          open && !disabled
            ? "mt-2 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`rounded-xl border border-[#D7DEE8] bg-white p-3 shadow-xl transition-all duration-300 ease-out ${
              open && !disabled
                ? "translate-y-0 scale-100"
                : "-translate-y-2 scale-[0.98]"
            }`}
          >
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>

              <p className="text-sm font-extrabold text-sibs-primary-1">
                {monthTitle}
              </p>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5"
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
                    className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold transition hover:bg-slate-50 ${
                      active
                        ? "bg-sibs-primary-1 text-white shadow-sm"
                        : isToday
                          ? "border border-blue-200 bg-blue-50 text-sibs-primary-1"
                          : currentMonth
                            ? "border border-transparent bg-white text-[#344054]"
                            : "border border-transparent bg-white text-sibs-tertiary-5/50"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E6ECF2] pt-3">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-sibs-tertiary-5 transition hover:bg-slate-50"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleTodayClick}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddSourceCostModal({ open, onClose, onStatus }) {
  const {
    createSourceCostEntry,
    addSourceCost,
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
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={isSubmitting ? undefined : onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ReceiptText size={14} />
                New Source Cost
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
                Add Source Cost
              </h2>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Tag a cost entry to one sourcing option and define the period
                covered by the expense.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-[#101828]">
                Cost Information
              </h3>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Fields marked with an asterisk are required.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <FieldLabel required>Sourcing Option</FieldLabel>

                <CustomSelect
                  value={form.source}
                  options={sourceOptionValues}
                  onChange={(value) => updateField("source", value)}
                  placeholder={
                    isLoadingOptions
                      ? "Loading sourcing options..."
                      : "Select sourcing option"
                  }
                  disabled={isSubmitting || isLoadingOptions}
                />
              </div>

              <div>
                <FieldLabel required>Description</FieldLabel>

                <TextArea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  disabled={isSubmitting}
                  placeholder="Example: Facebook Ads - CSR Hiring Campaign"
                />
              </div>

              <div>
                <FieldLabel required>Amount</FieldLabel>

                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Example: 10000"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                    onChange={(value) => updateField("dateTo", value)}
                    disabled={isSubmitting}
                    placeholder="Select date to"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              Cost per Hire Formula
            </p>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-primary-1/80">
              Cost per Hire = Total Source Cost / Hires from candidates who
              selected that source. The entry becomes completed automatically
              after Date To.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />
              {isSubmitting ? "Saving..." : "Add Source Cost"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}