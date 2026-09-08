import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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

function ThemedSelectDropdown({
  dropdownId = "",
  activeDropdown = "",
  setActiveDropdown,
  value,
  options = [],
  onChange,
  placeholder = "Select option",
  disabled = false,
  className = "",
  menuClassName = "",
}) {
  const dropdownRef = useRef(null);
  const [localOpen, setLocalOpen] = useState(false);

  const isControlled = typeof setActiveDropdown === "function" && Boolean(dropdownId);
  const open = isControlled ? activeDropdown === dropdownId : localOpen;

  const selectedOption = useMemo(() => {
    return options.find((option) => String(option.value) === String(value));
  }, [options, value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (isControlled) {
          setActiveDropdown("");
        } else {
          setLocalOpen(false);
        }
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        if (isControlled) {
          setActiveDropdown("");
        } else {
          setLocalOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isControlled, setActiveDropdown]);

  function toggleOpen() {
    if (disabled) return;
    if (isControlled) {
      setActiveDropdown(open ? "" : dropdownId);
    } else {
      setLocalOpen((prev) => !prev);
    }
  }

  function handleSelect(optionValue) {
    if (disabled) return;
    onChange(optionValue);
    if (isControlled) {
      setActiveDropdown("");
    } else {
      setLocalOpen(false);
    }
  }

  return (
    <div ref={dropdownRef} className={`relative min-w-0 font-jakarta ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-3 text-left text-xs font-bold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white text-[#042C51] ring-2 ring-[#FF5C28]/10"
            : "border-[#D0D5DD] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${disabled ? "cursor-not-allowed bg-[#EEF2F6] opacity-70" : ""}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? "text-[#042C51]" : "text-[#98A2B3]"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[#215789] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div
          className={`sibs-dropdown-pop-in absolute left-0 top-[calc(100%+6px)] z-[100050] max-h-60 w-full overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl ${menuClassName}`}
        >
          <div className="max-h-60 overflow-y-auto py-1 sibs-scrollbar">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs font-extrabold transition ${
                    active
                      ? "bg-[#FFF0EB] text-[#FF5C28]"
                      : "bg-white text-[#042C51] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active && <Check size={14} className="shrink-0 text-[#FF5C28]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDateInputValue(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateInputValue(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(value) {
  const date = parseDateInputValue(value);
  if (!date) return "";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDate(first, second) {
  if (!first || !second) return false;
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function buildCalendarDays(targetDate) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstDayIndex = firstDay.getDay();

  const calendarStart = new Date(year, month, 1 - firstDayIndex);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    days.push({
      date,
      dateValue: toDateInputValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return days;
}

function ActionItemDatePicker({
  value,
  onChange,
  placeholder = "Select deadline",
  disabled = false,
  dropdownId = "deadline",
  activeDropdown = "",
  setActiveDropdown,
}) {
  const calendarRef = useRef(null);
  const selectedDate = parseDateInputValue(value);
  const today = new Date();

  const isControlled = typeof setActiveDropdown === "function" && Boolean(dropdownId);
  const [localOpen, setLocalOpen] = useState(false);
  const open = isControlled ? activeDropdown === dropdownId : localOpen;

  const [displayDate, setDisplayDate] = useState(
    selectedDate || new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(displayDate),
    [displayDate],
  );

  const displayText = value ? formatDateDisplay(value) : placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        if (isControlled) {
          setActiveDropdown("");
        } else {
          setLocalOpen(false);
        }
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        if (isControlled) {
          setActiveDropdown("");
        } else {
          setLocalOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isControlled, setActiveDropdown]);

  function goPreviousMonth() {
    setDisplayDate(
      (previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setDisplayDate(
      (previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  function handleSelectDate(date) {
    onChange(toDateInputValue(date));
    if (isControlled) {
      setActiveDropdown("");
    } else {
      setLocalOpen(false);
    }
  }

  function handleClear() {
    onChange("");
    if (isControlled) {
      setActiveDropdown("");
    } else {
      setLocalOpen(false);
    }
  }

  function handleToday() {
    onChange(toDateInputValue(today));
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
    if (isControlled) {
      setActiveDropdown("");
    } else {
      setLocalOpen(false);
    }
  }

  function handleToggleOpen() {
    if (disabled) return;
    if (!open && selectedDate) {
      setDisplayDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }

    if (isControlled) {
      setActiveDropdown(open ? "" : dropdownId);
    } else {
      setLocalOpen((previous) => !previous);
    }
  }

  return (
    <div ref={calendarRef} className="relative z-[220] min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`flex h-9 w-full min-w-0 items-center justify-between gap-3 rounded-lg border px-3 text-left text-xs font-bold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white text-[#042C51] ring-2 ring-[#FF5C28]/10"
            : "border-[#D0D5DD] bg-[#F8FAFC] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed border-[#D7DEE8] bg-[#F2F4F7] text-[#667085] opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays size={15} className="shrink-0 text-[#215789]" />
          <span className={`min-w-0 truncate ${value ? "text-[#042C51]" : "text-[#98A2B3]"}`}>
            {displayText}
          </span>
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-[#215789] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="sibs-dropdown-pop-in absolute right-0 top-[calc(100%+6px)] z-[100050] w-[280px] overflow-visible rounded-2xl border border-[#D7DEE8] bg-white p-3.5 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E6ECF2] pb-2.5">
            <button
              type="button"
              onClick={goPreviousMonth}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#D6E0EA] bg-[#F8FAFC] text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="text-xs font-extrabold text-[#042C51]">
              {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
            </span>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#D6E0EA] bg-[#F8FAFC] text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="mt-2.5 grid grid-cols-7 gap-1">
            {weekdayLabels.map((dayLabel) => (
              <div
                key={dayLabel}
                className="flex h-6 items-center justify-center text-[10px] font-extrabold text-[#7B8DB3]"
              >
                {dayLabel}
              </div>
            ))}

            {calendarDays.map((day) => {
              const active = selectedDate && isSameDate(day.date, selectedDate);
              const currentDay = isSameDate(day.date, today);

              return (
                <button
                  key={day.dateValue}
                  type="button"
                  onClick={() => handleSelectDate(day.date)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-150 mx-auto ${
                    active
                      ? "bg-[#FF5C28] text-white shadow-xs"
                      : currentDay
                        ? "border border-[#FF5C28] bg-[#FFF0EB] text-[#FF5C28]"
                        : day.isCurrentMonth
                          ? "text-[#042C51] hover:bg-[#EAF2FB]"
                          : "text-[#C2CEDC] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {day.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-2.5 flex items-center justify-between border-t border-[#E6ECF2] pt-2 text-xs font-extrabold">
            <button
              type="button"
              onClick={handleClear}
              className="text-[#667085] transition hover:text-red-600"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="text-[#FF5C28] transition hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
      {children}
      {required ? <span className="text-[#FF5C28]"> *</span> : null}
    </label>
  );
}

const inputClass =
  "h-8.5 2xl:h-10 w-full rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition placeholder:font-normal placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10";

const selectClass = `${inputClass} min-w-0 pr-8`;

const readOnlyInputClass =
  "h-8.5 2xl:h-10 w-full rounded-xl border border-[#DDE5EE] bg-[#EEF2F6] px-3 2xl:px-3.5 sibs-text-xs font-semibold text-[#475467] outline-none";

const textAreaClass =
  "w-full resize-none rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 2xl:px-3.5 py-2.5 sibs-text-xs font-semibold leading-5 text-[#042C51] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10";

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
    <div className="flex min-h-[50px] 2xl:min-h-[54px] flex-col items-center justify-center px-2 text-center">
      <span className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase leading-3 tracking-wide text-[#98A2B3]">
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

  const [activeDropdown, setActiveDropdown] = useState("");

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
      className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-2 font-jakarta sm:p-4"
      onMouseDown={closeAddModal}
      role="presentation"
    >
      <form
        onSubmit={addActionItem}
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-5xl 2xl:max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-action-item-title"
      >
        <header className="shrink-0 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-2.5 2xl:gap-3">
              <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                <ClipboardList size={16} />
              </span>

              <div className="min-w-0">
                <h2
                  id="add-action-item-title"
                  className="sibs-modal-title text-white"
                >
                  Add Recruitment Action Item
                </h2>

                <p className="sibs-modal-subtitle mt-0.5 text-white/75">
                  Link a hiring gap to one accountable owner, deadline, risk
                  level, and follow-up action.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeAddModal}
              className="sibs-modal-close-btn"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <main className="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch">
            <section className="flex min-w-0 flex-col rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between border-b border-[#E9EEF4] pb-2.5">
                <h3 className="flex items-center gap-1.5 sibs-modal-section-title text-[#042C51]">
                  <BriefcaseBusiness size={14} className="shrink-0 text-[#FF5C28]" />
                  Hiring Gap Source Record
                </h3>

                <span className="rounded-md border border-[#D0DFEE] bg-white px-2 py-0.5 text-[9px] font-black uppercase text-[#042C51]">
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
                <ThemedSelectDropdown
                  dropdownId="roleTarget"
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  value={selectedKey}
                  options={linkedRoleOptions}
                  onChange={(val) => selectLinkedRecord(val)}
                  placeholder="Select role with hiring gap"
                />
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
                <h3 className="flex min-w-0 items-center gap-2 sibs-modal-section-title text-[#042C51]">
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
                  <ThemedSelectDropdown
                    dropdownId="owner"
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    value={actionForm.owner}
                    options={ownerSelectOptions}
                    onChange={(val) => updateField("owner", val)}
                    placeholder="Select owner"
                  />
                </div>

                <div className="min-w-0">
                  <FieldLabel required>Target Deadline</FieldLabel>
                  <ActionItemDatePicker
                    dropdownId="deadline"
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    value={actionForm.deadline}
                    onChange={(val) => updateField("deadline", val)}
                    placeholder="Select deadline"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel required>Initial Status</FieldLabel>
                  <ThemedSelectDropdown
                    dropdownId="status"
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    value={actionForm.status}
                    options={statusSelectOptions}
                    onChange={(val) => updateField("status", val)}
                    placeholder="Select status"
                  />
                </div>

                <div>
                  <FieldLabel required>Assigned Risk Level</FieldLabel>
                  <ThemedSelectDropdown
                    dropdownId="riskLevel"
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    value={actionForm.riskLevel}
                    options={riskSelectOptions}
                    onChange={(val) => updateField("riskLevel", val)}
                    placeholder="Select risk level"
                  />
                </div>
              </div>

              <div className="mt-3">
                <FieldLabel required>Linked Gap Category</FieldLabel>
                <ThemedSelectDropdown
                  dropdownId="linkedGap"
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  value={actionForm.linkedGap}
                  options={gapSelectOptions}
                  onChange={(val) => updateField("linkedGap", val)}
                  placeholder="Select gap category"
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

        <footer className="shrink-0 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleReset}
                className="sibs-modal-btn-secondary gap-1.5"
              >
                <RotateCcw size={13} />
                Reset Form
              </button>

              <div className="flex min-w-0 items-start gap-1.5 text-[8.5px] 2xl:text-[9px] font-medium leading-4 text-[#667085]">
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
                className="sibs-modal-btn-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="sibs-modal-btn-primary gap-1.5"
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