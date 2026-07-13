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

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function readonlyInputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-gray-600 outline-none ${extra}`;
}

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
  if (!open) return null;

  const selectedRole = activeHiringGaps.find(
    (role) => String(role.weeklyPlanItemId) === String(form.weeklyPlanItemId),
  );

  const remainingGap =
    Number(form.requirement || 0) - Number(form.filled || 0);

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

  return (
    <div
      className="fixed inset-0 z-[10000] flex h-dvh items-center justify-center bg-black/40 px-4 py-4 font-jakarta"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E6ECF2] px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              <ClipboardList size={14} />
              Recruitment Action
            </div>

            <h2 className="mt-3 text-lg font-extrabold text-sibs-primary-1 sm:text-xl">
              Add Action Item
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Create an action item linked to a hiring gap, role, owner, and
              workforce hiring plan item.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Link to Hiring Gap
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Select the role or account that needs a linked action.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6FA] text-sibs-primary-1">
                    <BriefcaseBusiness size={19} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
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
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Role Title
                    </label>

                    <input
                      readOnly
                      value={form.roleTitle}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Account
                    </label>

                    <input
                      readOnly
                      value={form.account}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Approved Requirement
                    </label>

                    <input
                      readOnly
                      value={form.requirement || ""}
                      className={readonlyInputClass()}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Current Filled
                    </label>

                    <input
                      readOnly
                      value={form.filled || ""}
                      className={readonlyInputClass()}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Action Details
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Add the owner, deadline, status, risk, and linked gap.
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
                      onChange={(e) =>
                        setForm({ ...form, actionItem: e.target.value })
                      }
                      rows={4}
                      placeholder="Example: Add 50 sourced candidates for CSR role before Friday."
                      className={textareaClass()}
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
                    onChange={(value) => setForm({ ...form, riskLevel: value })}
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
                      onChange={(e) =>
                        setForm({ ...form, remarks: e.target.value })
                      }
                      rows={3}
                      placeholder="Optional notes for weekly hiring call or report."
                      className={textareaClass()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1">
                    <ClipboardList size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-sibs-primary-1">
                      How this connects to TA-HRIS
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                      Action Items are created when a role is not fully hired.
                      They connect the workforce hiring plan to execution and make
                      sure every gap has an owner, deadline, and follow-up
                      action.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#101828]">
                    Selected Hiring Gap
                  </h3>

                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                    {selectedRole ? selectedRole.roleStatus : "No Role"}
                  </span>
                </div>

                <div>
                  <DetailRow label="Role / Account" value={form.roleAccount} />
                  <DetailRow label="Requirement" value={form.requirement} />
                  <DetailRow label="Filled" value={form.filled} />
                  <DetailRow
                    label="Remaining Gap"
                    value={
                      selectedRole
                        ? `${Math.max(remainingGap, 0)} headcount`
                        : "—"
                    }
                  />
                  <DetailRow label="Suggested Gap" value={form.linkedGap} />
                  <DetailRow label="Risk Level" value={form.riskLevel} />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-emerald-700">
                      Action Rule
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                      Make sure each open hiring gap has a clear owner,
                      deadline, and next step before it is included in the
                      weekly hiring report.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600">
                    <AlertTriangle size={20} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-amber-700">
                      Required Rule
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-amber-700/90">
                      Every role where Current Filled is lower than Approved
                      Requirement should have at least one Planned or Ongoing
                      action item before the weekly report is generated.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-700">
                  Backend Later
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700/90">
                  This form should later call POST /api/recruitment/action-items
                  and save weekly_plan_item_id, hiring_need_id, linked_gap,
                  owner, deadline, status, and risk level.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-[#E6ECF2] px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleResetClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={17} />
              Save Action Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}