import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";

import { getApprovedHiringNeeds } from "../../../lib/axios/getCandidatePipeline";
import { buildApprovedReprofileOptions } from "../../../lib/utils/candidatePipeline/offerReprofile";
import StatusModal from "../StatusModal";

import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
  CandidateModalSection,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";
import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";


function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ");
}

function formatMoneyInput(value) {
  if (value === null || value === undefined || value === "") return "";

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return cleanText(value);

  return numberValue.toFixed(2);
}

function getHiringNeedId(item = {}) {
  return (
    item.id ??
    item.hiringNeedId ??
    item.hiring_need_id ??
    item.prfId ??
    item.prf_id ??
    ""
  );
}

function getHiringNeedRole(item = {}) {
  return (
    item.roleTitle ||
    item.role_title ||
    item.position ||
    item.positionTitle ||
    item.jobTitle ||
    item.job_title ||
    ""
  );
}

function getHiringNeedAccount(item = {}) {
  return item.account || item.accountName || item.account_name || "";
}

function getHiringNeedDepartment(item = {}) {
  return item.department || item.departmentName || item.department_name || "";
}

function getHiringNeedApprovedRequirement(item = {}) {
  return (
    item.approvedRequirement ??
    item.approved_requirement ??
    item.requiredHeadcount ??
    item.required_headcount ??
    item.requiredHC ??
    item.required_hc ??
    ""
  );
}

function getHiringNeedLabel(item = {}) {
  const id = getHiringNeedId(item);
  const roleTitle = getHiringNeedRole(item);
  const account = getHiringNeedAccount(item);
  const department = getHiringNeedDepartment(item);
  const approvedRequirement = getHiringNeedApprovedRequirement(item);

  const prfLabel = id ? `PRF-${String(id).padStart(4, "0")}` : "PRF";
  const roleAccount = [roleTitle, account].filter(Boolean).join(" / ");
  const departmentPart = department ? ` • ${department}` : "";
  const hcPart =
    approvedRequirement !== "" && approvedRequirement !== null
      ? ` • Approved HC: ${approvedRequirement}`
      : "";

  return `${prfLabel}${roleAccount ? ` — ${roleAccount}` : ""}${departmentPart}${hcPart}`;
}

function normalizeHiringNeed(item = {}) {
  const id = getHiringNeedId(item);
  const roleTitle = getHiringNeedRole(item);
  const account = getHiringNeedAccount(item);
  const department = getHiringNeedDepartment(item);
  const approvedRequirement = getHiringNeedApprovedRequirement(item);

  const label =
    item.label ||
    item.displayLabel ||
    item.display_label ||
    getHiringNeedLabel(item);

  return {
    ...item,
    id: cleanText(id),
    value: cleanText(id),
    label: cleanText(label),
    roleTitle: cleanText(roleTitle),
    account: cleanText(account),
    department: cleanText(department),
    approvedRequirement,
    priority: item.priority || "",
    locationSite: item.locationSite || item.location_site || "",
    requestedStartDate:
      item.requestedStartDate || item.requested_start_date || "",
    dueDate: item.dueDate || item.due_date || "",
    basicPay:
      item.basicPay ??
      item.basic_pay ??
      item.salary ??
      item.compensation ??
      item.offer_basic_pay ??
      "",
    deminimisDailyRate:
      item.deminimisDailyRate ??
      item.deminimis_daily_rate ??
      item.deminimis ??
      item.dailyRate ??
      item.daily_rate ??
      "",
  };
}

function uniqueOptions(options = []) {
  const map = new Map();

  options.forEach((option) => {
    const key = normalizeKey(option.value || option.label);
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, option);
    }
  });

  return Array.from(map.values());
}

function isEmptyMoney(value) {
  return value === null || value === undefined || cleanText(value) === "";
}

function isInvalidMoney(value) {
  if (isEmptyMoney(value)) return true;

  const numericValue = Number(value);

  return !Number.isFinite(numericValue) || numericValue <= 0;
}

function HrisDropdown({
  label,
  required = false,
  placeholder = "Select option",
  value = "",
  options = [],
  onChange,
  disabled = false,
  loading = false,
  searchable = true,
  emptyText = "No options found.",
}) {
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [dropdownRect, setDropdownRect] = useState(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => String(option.value) === String(value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const searchText = normalizeKey(keyword);

    if (!searchText) return options;

    return options.filter((option) => {
      const haystack = normalizeKey(
        [
          option.label,
          option.subLabel,
          option.roleTitle,
          option.account,
          option.department,
          option.searchText,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(searchText);
    });
  }, [options, keyword]);

  const controlText = selectedOption?.label || cleanText(value) || "";
  const inputValue = open ? keyword : controlText;
  const inputPlaceholder = loading
    ? "Loading options..."
    : controlText || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current) return;

      if (
        !wrapperRef.current.contains(event.target) &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setOpen(false);
        setKeyword("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setKeyword("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || !wrapperRef.current) return undefined;

    const updateDropdownPosition = () => {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownRect({
        left: rect.left,
        top: rect.bottom + 6,
        width: rect.width,
      });
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      window.setTimeout(() => searchInputRef.current?.focus?.(), 50);
    }
  }, [open, searchable]);

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
  }

  function toggleDropdown(event) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    setOpen((previous) => {
      const nextOpen = !previous;

      if (nextOpen) {
        setKeyword("");
        window.setTimeout(() => searchInputRef.current?.focus?.(), 50);
      }

      return nextOpen;
    });
  }

  function handleSearchFocus() {
    if (disabled) return;

    setKeyword("");
    setOpen(true);
  }

  function handleSearchChange(event) {
    setKeyword(event.target.value);
    setOpen(true);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      setKeyword("");
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    }
  }

  function handleSelect(option) {
    onChange?.(option);
    setOpen(false);
    setKeyword("");
  }

  return (
    <div ref={wrapperRef} className="relative min-w-0">
      {label && (
        <label className="sibs-modal-field-label mb-1.5 block">
          {label} {required && <span className="text-[#FF5C28]">*</span>}
        </label>
      )}

      {searchable ? (
        <div
          onClick={openDropdown}
          className={`flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg border px-3 text-left font-jakarta text-xs font-bold outline-none transition ${
            open
              ? "border-[#FF5C28] bg-white text-[#042C51] ring-2 ring-[#FF5C28]/10"
              : "border-[#D0D5DD] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
          } ${
            disabled
              ? "cursor-not-allowed bg-[#EEF2F6] opacity-70"
              : "cursor-text bg-white text-[#042C51]"
          }`}
        >
          <Search
            size={15}
            className={`shrink-0 ${
              open ? "text-[#FF5C28]" : disabled ? "text-[#98A2B3]" : "text-[#042C51]"
            }`}
          />

          <input
            ref={searchInputRef}
            value={inputValue}
            disabled={disabled || loading}
            onFocus={handleSearchFocus}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={inputPlaceholder}
            className="h-full min-w-0 flex-1 bg-transparent font-jakarta text-xs font-bold text-[#042C51] outline-none placeholder:text-[#98A2B3] disabled:cursor-not-allowed disabled:text-[#98A2B3]"
          />

          {loading ? (
            <Loader2
              size={15}
              className="shrink-0 animate-spin text-[#FF5C28]"
            />
          ) : (
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={toggleDropdown}
              className="shrink-0 rounded-md p-1 text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDown
                size={15}
                className={`transition-transform duration-200 ${open ? "rotate-180 text-[#FF5C28]" : ""}`}
              />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={`flex h-10 w-full min-w-0 items-center justify-between gap-2.5 rounded-lg border px-3 text-left font-jakarta text-xs font-bold outline-none transition ${
            open
              ? "border-[#FF5C28] bg-white text-[#042C51] ring-2 ring-[#FF5C28]/10"
              : "border-[#D0D5DD] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
          } ${
            disabled
              ? "cursor-not-allowed bg-[#EEF2F6] opacity-70"
              : "bg-white text-[#042C51]"
          }`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedOption ? "text-[#042C51]" : "text-[#98A2B3]"
            }`}
          >
            {loading
              ? "Loading options..."
              : selectedOption?.label || cleanText(value) || placeholder}
          </span>

          {loading ? (
            <Loader2
              size={15}
              className="shrink-0 animate-spin text-[#FF5C28]"
            />
          ) : (
            <ChevronDown
              size={15}
              className={`shrink-0 transition-transform duration-200 ${
                disabled ? "text-[#98A2B3]" : "text-[#042C51]"
              } ${open ? "rotate-180 text-[#FF5C28]" : ""}`}
            />
          )}
        </button>
      )}

      {open && !disabled && dropdownRect && createPortal(
        <div
          ref={dropdownRef}
          style={{
            left: dropdownRect.left,
            top: dropdownRect.top,
            width: dropdownRect.width,
          }}
          className="sibs-dropdown-pop-in fixed z-[11000] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl"
        >
          <div className="sibs-scrollbar max-h-64 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = String(option.value) === String(value);

                return (
                  <button
                    key={`${option.value}-${option.label}`}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-start justify-between gap-2.5 px-3.5 py-2.5 text-left font-jakarta transition ${
                      active
                        ? "bg-[#FFF0EB] text-[#FF5C28]"
                        : "bg-white text-[#042C51] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold">
                        {option.label}
                      </span>

                      {option.subLabel && (
                        <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#667085]">
                          {option.subLabel}
                        </span>
                      )}
                    </span>

                    {active && (
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-[#FF5C28]"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-center font-jakarta text-xs font-bold text-[#98A2B3]">
                {emptyText}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function inputClass() {
  return "h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-sibs-tertiary-5 disabled:opacity-80";
}

function handleNumberInputWheel(event) {
  event.currentTarget.blur();
}

function textareaClass() {
  return "min-h-[92px] w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-4 py-3 text-sm font-bold leading-6 text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10";
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function toDateValue(date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseDateValue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleanText(value));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function isWeekendDateValue(value) {
  const date = parseDateValue(value);
  return !!date && (date.getDay() === 0 || date.getDay() === 6);
}

const monthNamesShort = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const weekdayLabelsShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function CalendarHeaderDropdown({
  value,
  options = [],
  onChange,
  className = "",
  menuClassName = "",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  const displayText = selectedOption?.label || "Select";

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border px-2.5 text-left text-xs font-extrabold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white text-[#042C51] ring-2 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] bg-[#F8FAFC] text-[#042C51] hover:border-[#FF5C28]/40 hover:bg-white"
        }`}
      >
        <span className="min-w-0 flex-1 truncate">{displayText}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-[#215789] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-[calc(100%+6px)] z-[100000] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl ${menuClassName}`}
        >
          <div className="max-h-60 overflow-y-auto py-1 sibs-scrollbar">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left text-xs font-bold transition ${
                    active
                      ? "bg-[#FFF0EB] text-[#FF5C28]"
                      : "bg-white text-[#042C51] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  }`}
                >
                  <span className="block min-w-0 truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function buildRichCalendarDays(displayDate) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();

  const calendarStart = new Date(year, month, 1 - startDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    days.push({
      date,
      dateValue: toDateValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return days;
}

function StartDatePicker({ value, onChange }) {
  const calendarRef = useRef(null);
  const selectedDate = parseDateValue(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = today.getFullYear();
  const minimumYear = currentYear - 5;
  const maximumYear = currentYear + 10;

  const monthOptions = monthNamesShort.map((month, index) => ({
    value: index,
    label: month,
  }));

  const yearOptions = [];
  for (let year = currentYear; year <= maximumYear; year += 1) {
    yearOptions.push({ value: year, label: String(year) });
  }

  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(
    () => selectedDate || new Date(),
  );

  const calendarDays = useMemo(
    () => buildRichCalendarDays(displayDate),
    [displayDate],
  );

  useEffect(() => {
    if (selectedDate) setDisplayDate(selectedDate);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function goPreviousMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  function handleMonthChange(monthIndex) {
    setDisplayDate(
      (previous) => new Date(previous.getFullYear(), Number(monthIndex), 1),
    );
  }

  function handleYearChange(year) {
    setDisplayDate(
      (previous) => new Date(Number(year), previous.getMonth(), 1),
    );
  }

  function handleSelectDate(date) {
    onChange(toDateValue(date));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  function handleToday() {
    onChange(toDateValue(today));
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setOpen(false);
  }

  return (
    <div ref={calendarRef} className="relative z-[220] min-w-0 font-jakarta">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="sibs-modal-input flex items-center justify-between text-left cursor-pointer"
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays size={16} className="shrink-0 text-[#215789]" />

          <span className={`min-w-0 truncate ${value ? "text-[#042C51] font-bold" : "text-[#98A2B3]"}`}>
            {selectedDate
              ? selectedDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "2-digit" })
              : "Select date"}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[#215789] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="sibs-dropdown-pop-in mt-2 w-full max-w-[320px] overflow-visible rounded-2xl border border-[#D7DEE8] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-3.5 py-2.5">
            <button
              type="button"
              onClick={goPreviousMonth}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-[1fr_84px] gap-1.5 px-2">
              <CalendarHeaderDropdown
                value={displayDate.getMonth()}
                options={monthOptions}
                onChange={handleMonthChange}
                className="z-[100002]"
                menuClassName="w-[150px]"
              />

              <CalendarHeaderDropdown
                value={displayDate.getFullYear()}
                options={yearOptions}
                onChange={handleYearChange}
                className="z-[100001]"
                menuClassName="w-[110px]"
              />
            </div>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="px-3.5 py-3">
            <div className="grid grid-cols-7 gap-1">
              {weekdayLabelsShort.map((dayLabel) => (
                <div
                  key={dayLabel}
                  className="flex h-7 items-center justify-center text-xs font-extrabold text-[#042C51]"
                >
                  {dayLabel}
                </div>
              ))}

              {calendarDays.map((day) => {
                const active = selectedDate && isSameDate(day.date, selectedDate);
                const currentDay = isSameDate(day.date, today);
                const disabled = day.date < today || day.date.getDay() === 0 || day.date.getDay() === 6;

                return (
                  <button
                    key={day.dateValue}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectDate(day.date)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all duration-200 ${
                      active
                        ? "bg-[#FF5C28] text-white shadow-sm"
                        : currentDay
                          ? "border border-[#FF5C28]/40 bg-[#FFF0EB] text-[#FF5C28]"
                          : disabled
                            ? "cursor-not-allowed bg-white text-[#C7D2E0]"
                            : day.isCurrentMonth
                              ? "border border-transparent bg-white text-[#042C51] hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                              : "border border-transparent bg-white text-[#C7D2E0] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E6ECF2] px-4 py-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-extrabold text-[#042C51] transition-all duration-200 hover:border-[#FF5C28]/35 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-[#042C51] px-3 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-[#063C69]"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateOfferDetailsModal({
  open,
  candidate,
  form,
  setForm,
  onClose,
  onReprofile,
  onSubmit,
  submitting = false,
}) {
  const [approvedHiringNeeds, setApprovedHiringNeeds] = useState([]);
  const [isLoadingHiringNeeds, setIsLoadingHiringNeeds] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reprofileOpen, setReprofileOpen] = useState(false);
  const [selectedReprofileId, setSelectedReprofileId] = useState("");
  const [isSavingReprofile, setIsSavingReprofile] = useState(false);
  const [startDateInitiated, setStartDateInitiated] = useState(false);

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
  });

  function showStatusModal({
    type = "error",
    title = "Something went wrong",
    message = "Please try again.",
  }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal({
      open: false,
      type: "error",
      title: "",
      message: "",
    });
  }

  useEffect(() => {
    if (!open) {
      setStartDateInitiated(false);
      return;
    }

    /*
     * Every new Offer Details for Approval session must require fresh
     * compensation and start-date input. Do not reuse values from a previous
     * offer, negotiation, candidate record, or previous modal session.
     *
     * Keep role/account/remarks and the rest of the parent form unchanged.
     */
    setForm((previous) => ({
      ...previous,
      basicPay: "",
      deminimisDailyRate: "",
      startDate: "",
    }));

    setStartDateInitiated(false);
  }, [open, setForm]);

  useEffect(() => {
    let active = true;

    async function loadApprovedHiringNeeds() {
      if (!open) return;

      setIsLoadingHiringNeeds(true);
      setLoadError("");

      try {
        const response = await getApprovedHiringNeeds();

        if (!active) return;

        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.hiringNeeds)
            ? response.hiringNeeds
            : Array.isArray(response)
              ? response
              : [];

        const normalizedRows = rows
          .map(normalizeHiringNeed)
          .filter((item) => item.id && item.label);

        setApprovedHiringNeeds(normalizedRows);
      } catch (error) {
        if (!active) return;

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load approved hiring needs.";

        console.error(
          "Load approved hiring needs error:",
          error?.response?.data || error?.message,
        );

        setApprovedHiringNeeds([]);
        setLoadError(message);

        showStatusModal({
          type: "error",
          title: "Hiring Needs Not Loaded",
          message,
        });
      } finally {
        if (active) setIsLoadingHiringNeeds(false);
      }
    }

    loadApprovedHiringNeeds();

    return () => {
      active = false;
    };
  }, [open]);

  const candidateRoleTitle = cleanText(
    form?.roleTitle || candidate?.roleTitle || candidate?.openPosition,
  );

  const reprofileOptions = useMemo(() => {
    return buildApprovedReprofileOptions({
      hiringNeeds: approvedHiringNeeds,
    });
  }, [approvedHiringNeeds]);

  if (!open || !candidate) return null;

  function updateForm(patch) {
    setForm((previous) => ({
      ...previous,
      ...patch,
    }));
  }

  async function handleSaveReprofile() {
    const selected = reprofileOptions.find(
      (option) => String(option.value) === String(selectedReprofileId),
    );

    if (!selected) {
      showStatusModal({
        type: "error",
        title: "Select an Account",
        message: "Select an approved account for the same Role Title.",
      });
      return;
    }

    setIsSavingReprofile(true);
    try {
      const response = await onReprofile?.({
        hiringRequirementId: selected.value,
        account: selected.account,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to reprofile account.");
      }

      updateForm({
        hiringRequirementId: selected.value,
        hiringRequirementLabel: selected.raw?.label || "",
        roleTitle: candidateRoleTitle,
        finalRole: candidateRoleTitle,
        account: selected.account,
        finalAccount: selected.account,
        hiringNeed: selected.raw || null,
      });
      setSelectedReprofileId("");
      setReprofileOpen(false);
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Reprofile Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to reprofile candidate account.",
      });
    } finally {
      setIsSavingReprofile(false);
    }
  }

  async function handleProceedClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const missingFields = [];

    if (!cleanText(form?.roleTitle)) {
      missingFields.push("Final Role Title");
    }

    if (!cleanText(form?.account)) {
      missingFields.push("Final Account");
    }

    if (isInvalidMoney(form?.basicPay)) {
      missingFields.push("Valid Basic Daily Rate");
    }

    if (isInvalidMoney(form?.deminimisDailyRate)) {
      missingFields.push("Valid Daily De Minimis");
    }

    if (cleanText(form?.startDate) && isWeekendDateValue(form.startDate)) {
      missingFields.push("Weekday Start Date");
    }

    if (missingFields.length > 0) {
      showStatusModal({
        type: "error",
        title: "Complete Required Fields",
        message: `Please complete the following before proceeding: ${missingFields.join(
          ", ",
        )}.`,
      });

      return;
    }

    try {
      const result = onSubmit?.(event);

      if (result && typeof result.then === "function") {
        await result;
      }
    } catch (error) {
      showStatusModal({
        type: "error",
        title: "Proceed Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to proceed for approval.",
      });
    }
  }

  const busy = submitting || isSavingReprofile;

  const footer = (
    <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
      <CandidateModalSecondaryButton type="button" onClick={onClose} disabled={busy}>
        Cancel
      </CandidateModalSecondaryButton>
      <CandidateModalPrimaryButton
        type="submit"
        form="candidate-offer-details-form"
        disabled={busy}
        className="min-w-[168px]"
      >
        {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
        {submitting ? "Sending..." : "Proceed for Approval"}
      </CandidateModalPrimaryButton>
    </div>
  );

  return (
    <>
      <CandidatePipelineModalShell
        icon={BriefcaseBusiness}
        title="Candidate Offer Details"
        subtitle="Set the final assignment, compensation, and start date before submitting the offer for approval."
        badge="Offer Preparation"
        onClose={onClose}
        closeDisabled={busy}
        maxWidth="max-w-4xl"
        zIndex="z-[10020]"
        footer={footer}
      >
        {busy && (
          <div className="fixed inset-0 z-[24000] cursor-wait bg-transparent" aria-hidden="true" />
        )}

        <form id="candidate-offer-details-form" onSubmit={handleProceedClick} className="space-y-4">
          <CandidateModalSummary candidate={candidate} stage={candidate?.currentStage || "Offered"} />

          <CandidateModalSection
            title="Final Assignment"
            subtitle="Role title remains fixed. Reprofile only when another approved Hiring Need account is required for the same role."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="sibs-modal-field-label">
                  Final Role Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.roleTitle || ""}
                    disabled
                    readOnly
                    placeholder="Final role title"
                    className="sibs-modal-input pr-28"
                    title="Role Title remains the same during account reprofile."
                  />
                  <button
                    type="button"
                    onClick={() => setReprofileOpen(true)}
                    className="absolute right-1.5 top-1/2 inline-flex h-8 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg border border-[#FF5C28]/35 bg-white px-2.5 text-[10px] font-extrabold text-[#FF5C28] transition hover:bg-[#FFF0EB]"
                  >
                    <RefreshCw size={13} className="text-[#FF5C28]" /> Reprofile
                  </button>
                </div>
              </div>

              <div>
                <label className="sibs-modal-field-label">
                  Final Account <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.account || ""}
                  disabled
                  readOnly
                  placeholder="Final account"
                  className="sibs-modal-input"
                />
              </div>
            </div>

            {!cleanText(form?.hiringRequirementId) && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[10px] font-bold leading-5 text-amber-800">
                No approved Hiring Requirement matches this Role Title and Account. Use Reprofile to select an approved account before proceeding.
              </div>
            )}
          </CandidateModalSection>

          <CandidateModalSection title="Compensation">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="sibs-modal-field-label">
                  Basic Daily Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basicPay || ""}
                  onChange={(event) => updateForm({ basicPay: event.target.value })}
                  onWheel={handleNumberInputWheel}
                  placeholder="0.00"
                  className="sibs-modal-input tabular-nums"
                />
              </div>

              <div>
                <label className="sibs-modal-field-label">
                  Daily De Minimis <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.deminimisDailyRate || ""}
                  onChange={(event) => updateForm({ deminimisDailyRate: event.target.value })}
                  onWheel={handleNumberInputWheel}
                  placeholder="0.00"
                  className="sibs-modal-input tabular-nums"
                />
              </div>
            </div>
          </CandidateModalSection>

          <CandidateModalSection title="Start Date & Remarks">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  if (startDateInitiated) {
                    updateForm({ startDate: "" });
                    setStartDateInitiated(false);
                    return;
                  }
                  setStartDateInitiated(true);
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#FF5C28]/35 bg-white px-4 text-xs font-extrabold text-[#FF5C28] transition hover:bg-[#FFF0EB]"
              >
                <CalendarDays size={14} className="text-[#FF5C28]" />
                {startDateInitiated ? "Hide Start Date" : "Add Start Date"}
              </button>

              {startDateInitiated && (
                <div className="max-w-md">
                  <label className="sibs-modal-field-label">Start Date</label>
                  <StartDatePicker value={form.startDate || ""} onChange={(startDate) => updateForm({ startDate })} />
                </div>
              )}

              <div>
                <label className="sibs-modal-field-label">Remarks</label>
                <textarea
                  value={form.remarks || ""}
                  onChange={(event) => updateForm({ remarks: event.target.value })}
                  placeholder="Example: Offer prepared after passed interview."
                  className="sibs-modal-textarea"
                />
              </div>
            </div>
          </CandidateModalSection>

          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 sibs-text-xs font-semibold leading-5 text-amber-800">
            After proceeding, the candidate will move to Offered and will be available in the Offers page for approval and contract sending.
          </div>
        </form>
      </CandidatePipelineModalShell>

      {reprofileOpen && (
        <CandidatePipelineModalShell
          icon={RefreshCw}
          title="Reprofile Candidate"
          subtitle="Keep the same Role Title and select another approved Hiring Need account."
          badge="Approved PRF"
          onClose={() => setReprofileOpen(false)}
          closeDisabled={isSavingReprofile}
          maxWidth="max-w-lg"
          zIndex="z-[10100]"
          footer={
            <div className="flex justify-end gap-2">
              <CandidateModalSecondaryButton type="button" disabled={isSavingReprofile} onClick={() => setReprofileOpen(false)}>
                Cancel
              </CandidateModalSecondaryButton>
              <CandidateModalPrimaryButton type="button" disabled={isSavingReprofile} onClick={handleSaveReprofile}>
                {isSavingReprofile && <Loader2 size={15} className="animate-spin" />}
                Save Reprofile
              </CandidateModalPrimaryButton>
            </div>
          }
        >
          <div className="space-y-4">
            <CandidateModalSection title="Current Role">
              <input value={candidateRoleTitle} disabled readOnly className="sibs-modal-input" />
            </CandidateModalSection>
            <CandidateModalSection title="Approved Hiring Requirement">
              <HrisDropdown
                label="Hiring Requirement / PRF"
                required
                placeholder="Search approved hiring requirement / PRF"
                value={selectedReprofileId}
                options={reprofileOptions}
                onChange={(option) => setSelectedReprofileId(option?.value || "")}
                loading={isLoadingHiringNeeds}
                emptyText={loadError || "No approved Hiring Needs are available."}
              />
            </CandidateModalSection>
          </div>
        </CandidatePipelineModalShell>
      )}

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={closeStatusModal}
        variant="center"
        lockScroll
      />
    </>
  );
}
