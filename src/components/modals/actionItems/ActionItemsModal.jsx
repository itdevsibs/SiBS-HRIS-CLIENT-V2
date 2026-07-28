import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Plus,
  RotateCcw,
  Target,
  X,
} from "lucide-react";

const activeHiringGaps = [
  {
    weeklyPlanItemId: 1,
    hiringNeedId: 101,
    roleAccount: "CSR - SIBS Operations",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    requirement: 20,
    filled: 12,
    suggestedGap: "Pipeline",
    suggestedRisk: "High",
    taOwner: "Maria Reyes",
    roleStatus: "At Risk",
  },
  {
    weeklyPlanItemId: 2,
    hiringNeedId: 102,
    roleAccount: "QA - SIBS Operations",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    requirement: 5,
    filled: 2,
    suggestedGap: "Interview",
    suggestedRisk: "High",
    taOwner: "John Dela Cruz",
    roleStatus: "Delayed",
  },
  {
    weeklyPlanItemId: 3,
    hiringNeedId: 103,
    roleAccount: "System Developer - SIBS IT",
    roleTitle: "System Developer",
    account: "SIBS IT",
    requirement: 3,
    filled: 1,
    suggestedGap: "Offer",
    suggestedRisk: "Medium",
    taOwner: "Kim Domingo",
    roleStatus: "At Risk",
  },
  {
    weeklyPlanItemId: 4,
    hiringNeedId: 104,
    roleAccount: "RCM Analyst - SIBS RCM",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    requirement: 5,
    filled: 3,
    suggestedGap: "Pipeline",
    suggestedRisk: "Medium",
    taOwner: "Paul Garcia",
    roleStatus: "On Track",
  },
  {
    weeklyPlanItemId: 5,
    hiringNeedId: 105,
    roleAccount: "HR Assistant - SIBS HR",
    roleTitle: "HR Assistant",
    account: "SIBS HR",
    requirement: 2,
    filled: 0,
    suggestedGap: "Approval",
    suggestedRisk: "Medium",
    taOwner: "Maria Reyes",
    roleStatus: "Delayed",
  },
];

const actionStatusOptions = ["Planned", "Ongoing", "Completed"];
const actionRiskOptions = ["High", "Medium", "Low"];

const actionGapOptions = [
  "Pipeline",
  "Screening",
  "Interview",
  "Offer",
  "JD",
  "Approval",
  "Capacity / Manpower",
];

const actionOwnerOptions = [
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
];

const emptyActionForm = {
  weeklyPlanItemId: "",
  hiringNeedId: "",
  roleAccount: "",
  roleTitle: "",
  account: "",
  requirement: 0,
  filled: 0,
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Planned",
  riskLevel: "Medium",
  linkedGap: "Pipeline",
  remarks: "",
};

function textareaClass(extra = "") {
  return `w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function formatDateDisplay(value) {
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

function DateDropdown({
  label,
  value,
  onChange,
  required = false,
  placeholder = "Select deadline",
  zIndex = "z-30",
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

  const displayValue = value ? formatDateDisplay(value) : placeholder;

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E6ECF2] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/30 hover:bg-slate-50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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

      <AnimatedDropdown open={open}>
        <div className="bg-white p-3">
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-slate-50 px-3 py-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <ChevronLeft size={16} />
            </button>

            <p className="text-sm font-extrabold text-sibs-primary-1">
              {monthTitle}
            </p>

            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
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
                  className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
                    active
                      ? "bg-sibs-primary-1 text-white shadow-sm"
                      : isToday
                        ? "border border-blue-200 bg-blue-50 text-sibs-primary-1"
                        : currentMonth
                          ? "border border-transparent bg-white text-[#344054] hover:bg-slate-50"
                          : "border border-transparent bg-white text-sibs-tertiary-5/50 hover:bg-slate-50"
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
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-sibs-tertiary-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-sibs-primary-1 hover:shadow-sm active:scale-[0.98]"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleTodayClick}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              Today
            </button>
          </div>
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  required = false,
  zIndex = "z-30",
  optionValue = (option) => option,
  optionLabel = (option) => option,
  optionDescription = null,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(optionValue(option)) === String(value),
  );

  const displayValue = selectedOption ? optionLabel(selectedOption) : placeholder;

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
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <span
          className={`truncate ${
            selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
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

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {options.map((option) => {
            const currentValue = optionValue(option);
            const currentLabel = optionLabel(option);
            const currentDescription = optionDescription
              ? optionDescription(option)
              : "";
            const selected = String(value) === String(currentValue);

            return (
              <button
                key={currentValue}
                type="button"
                onClick={() => {
                  onChange(currentValue, option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="block truncate">{currentLabel}</span>

                {currentDescription && (
                  <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                    {currentDescription}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

export function AddActionItemModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  onReset,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const selectedRole = activeHiringGaps.find(
    (role) => String(role.weeklyPlanItemId) === String(form.weeklyPlanItemId),
  );

  const requirement = Number(form.requirement || 0);
  const filled = Number(form.filled || 0);
  const remainingGap = Math.max(requirement - filled, 0);
  const completionPercent =
    requirement > 0
      ? Math.min(100, Math.max(0, Math.round((filled / requirement) * 100)))
      : 0;

  function handleRoleChange(weeklyPlanItemId) {
    const selectedGap = activeHiringGaps.find(
      (role) => String(role.weeklyPlanItemId) === String(weeklyPlanItemId),
    );

    if (!selectedGap) {
      setForm(emptyActionForm);
      return;
    }

    setForm({
      ...form,
      weeklyPlanItemId: selectedGap.weeklyPlanItemId,
      hiringNeedId: selectedGap.hiringNeedId,
      roleAccount: selectedGap.roleAccount,
      roleTitle: selectedGap.roleTitle,
      account: selectedGap.account,
      requirement: selectedGap.requirement,
      filled: selectedGap.filled,
      owner: selectedGap.taOwner,
      linkedGap: selectedGap.suggestedGap,
      riskLevel: selectedGap.suggestedRisk,
      status: "Planned",
    });
  }

  function handleResetClick() {
    if (onReset) {
      onReset();
      return;
    }

    setForm(emptyActionForm);
  }

  function getRoleStatusClass(status) {
    switch (status) {
      case "On Track":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "At Risk":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "Delayed":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  }

  function getRiskClass(risk) {
    switch (risk) {
      case "High":
        return "border-red-200 bg-red-50 text-red-700";
      case "Medium":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "Low":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10000] flex h-dvh items-center justify-center p-3 font-jakarta sm:p-5"
      onMouseDown={onClose}
      role="presentation"
    >
      <form
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-action-item-modal-title"
      >
        <header className="shrink-0 border-b border-[#E6ECF2] bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <ClipboardList size={14} />
                Recruitment Action
              </div>

              <h2
                id="add-action-item-modal-title"
                className="mt-3 text-xl font-extrabold text-sibs-primary-1"
              >
                Add Action Item
              </h2>

              <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Create a clear next step for an active hiring gap and assign its
                owner, deadline, status, risk level, and expected follow-up.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-[#F1F5F9] hover:text-gray-700 active:scale-[0.98]"
              aria-label="Close add action item modal"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA] p-4 sibs-scrollbar sm:p-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            <div className="space-y-4">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Link to Hiring Gap
                    </h3>

                    <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                      Select the role or account that needs a tracked action.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <BriefcaseBusiness size={19} />
                  </div>
                </div>

                <CustomSelect
                  label="Role / Account with Hiring Gap"
                  required
                  value={form.weeklyPlanItemId}
                  options={activeHiringGaps}
                  onChange={handleRoleChange}
                  placeholder="Select role with hiring gap"
                  zIndex="z-50"
                  optionValue={(role) => role.weeklyPlanItemId}
                  optionLabel={(role) => role.roleAccount}
                  optionDescription={(role) => {
                    const gap = role.requirement - role.filled;

                    return `${role.filled}/${role.requirement} filled • ${gap} remaining • ${role.roleStatus}`;
                  }}
                />

                <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-sibs-tertiary-5">
                        Selected Role Summary
                      </p>

                      <p className="mt-2 truncate text-sm font-extrabold text-[#101828]">
                        {selectedRole?.roleTitle || "No hiring gap selected"}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
                        {selectedRole?.account ||
                          "Choose a role to populate its hiring details."}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-[10px] font-extrabold ${
                        selectedRole
                          ? getRoleStatusClass(selectedRole.roleStatus)
                          : "border-gray-200 bg-white text-gray-500"
                      }`}
                    >
                      {selectedRole?.roleStatus || "Not Selected"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border border-[#E6ECF2] bg-white px-3 py-2.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Requirement
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                        {selectedRole ? requirement : "—"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#E6ECF2] bg-white px-3 py-2.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Filled
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-emerald-600">
                        {selectedRole ? filled : "—"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#E6ECF2] bg-white px-3 py-2.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Remaining
                      </p>
                      <p className="mt-1 text-sm font-extrabold text-red-600">
                        {selectedRole ? remainingGap : "—"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#E6ECF2] bg-white px-3 py-2.5">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                        Suggested Gap
                      </p>
                      <p className="mt-1 truncate text-sm font-extrabold text-sibs-primary-1">
                        {selectedRole?.suggestedGap || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Action Details
                    </h3>

                    <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                      Define the action, responsible owner, deadline, and
                      reporting classification.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <Target size={19} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Action Item <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      required
                      value={form.actionItem}
                      onChange={(event) =>
                        setForm({ ...form, actionItem: event.target.value })
                      }
                      rows={4}
                      placeholder="Example: Add 50 sourced candidates for the CSR role before Friday."
                      className={textareaClass("min-h-[112px]")}
                    />
                  </div>

                  <CustomSelect
                    label="Owner"
                    required
                    value={form.owner}
                    options={actionOwnerOptions}
                    onChange={(value) => setForm({ ...form, owner: value })}
                    placeholder="Select owner"
                    zIndex="z-40"
                  />

                  <DateDropdown
                    label="Deadline"
                    required
                    value={form.deadline}
                    onChange={(value) =>
                      setForm({ ...form, deadline: value })
                    }
                    placeholder="Select deadline"
                    zIndex="z-40"
                  />

                  <CustomSelect
                    label="Status"
                    required
                    value={form.status}
                    options={actionStatusOptions}
                    onChange={(value) => setForm({ ...form, status: value })}
                    placeholder="Select status"
                    zIndex="z-30"
                  />

                  <CustomSelect
                    label="Risk Level"
                    required
                    value={form.riskLevel}
                    options={actionRiskOptions}
                    onChange={(value) =>
                      setForm({ ...form, riskLevel: value })
                    }
                    placeholder="Select risk level"
                    zIndex="z-20"
                  />

                  <div className="md:col-span-2">
                    <CustomSelect
                      label="Linked Gap"
                      required
                      value={form.linkedGap}
                      options={actionGapOptions}
                      onChange={(value) =>
                        setForm({ ...form, linkedGap: value })
                      }
                      placeholder="Select linked gap"
                      zIndex="z-10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Remarks
                    </label>

                    <textarea
                      value={form.remarks}
                      onChange={(event) =>
                        setForm({ ...form, remarks: event.target.value })
                      }
                      rows={3}
                      placeholder="Optional notes for the weekly hiring call or report."
                      className={textareaClass("min-h-[96px]")}
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-0">
              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Selected Hiring Gap
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Current delivery position for the selected role.
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${
                      selectedRole
                        ? getRiskClass(form.riskLevel)
                        : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                  >
                    {selectedRole ? `${form.riskLevel} Risk` : "No Risk"}
                  </span>
                </div>

                {selectedRole ? (
                  <>
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-sm font-extrabold leading-5 text-sibs-primary-1">
                        {form.roleTitle}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-sibs-primary-1/75">
                        {form.account}
                      </p>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                            Filled Progress
                          </p>

                          <p className="text-xs font-extrabold text-sibs-primary-1">
                            {completionPercent}%
                          </p>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-sibs-primary-1 transition-[width] duration-500"
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <DetailRow label="Role / Account" value={form.roleAccount} />
                      <DetailRow label="Requirement" value={requirement} />
                      <DetailRow label="Filled" value={filled} />
                      <DetailRow
                        label="Remaining Gap"
                        value={`${remainingGap} headcount`}
                      />
                      <DetailRow label="Linked Gap" value={form.linkedGap} />
                      <DetailRow label="Risk Level" value={form.riskLevel} />
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D7E0E9] bg-[#F8FAFC] px-4 py-8 text-center">
                    <BriefcaseBusiness
                      size={24}
                      className="mx-auto text-sibs-tertiary-8"
                    />

                    <p className="mt-3 text-sm font-bold text-[#344054]">
                      No hiring gap selected
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                      Select a role on the left to display its requirement,
                      filled headcount, and remaining gap.
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <CheckCircle2 size={19} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Action Guidelines
                    </h3>

                    <p className="mt-1 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                      Make every action easy to own, monitor, and include in the
                      weekly report.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    "Use a specific and measurable next step.",
                    "Assign one accountable owner.",
                    "Set a realistic deadline before the report cut-off.",
                    "Link the action to the correct recruitment gap.",
                  ].map((guideline) => (
                    <div
                      key={guideline}
                      className="flex items-start gap-2.5 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5"
                    >
                      <CheckCircle2
                        size={15}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />

                      <p className="text-[11px] font-semibold leading-5 text-[#344054]">
                        {guideline}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <p className="text-[11px] font-semibold leading-5 text-amber-800">
                    Every role where Current Filled is lower than Approved
                    Requirement should have at least one Planned or Ongoing
                    action before the weekly report is generated.
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-red-100 bg-red-50 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                    <AlertTriangle size={19} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-red-700">
                        Backend Later
                      </h3>

                      <span className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-red-600">
                        Temporary
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-semibold leading-5 text-red-700/90">
                      This form should later call POST
                      /api/recruitment/action-items and save
                      weekly_plan_item_id, hiring_need_id, linked_gap, owner,
                      deadline, status, and risk level.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </main>

        <footer className="shrink-0 border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleResetClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98]"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 active:scale-[0.98]"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={17} />
                Save Action Item
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  );
}
