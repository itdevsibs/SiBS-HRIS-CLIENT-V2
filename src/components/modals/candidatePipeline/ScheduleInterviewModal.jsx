import { formatHrisDateLocalized, formatHrisDateTimeLocalized } from "@/lib/axios/dateFormatter";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getInterviewStatusClass } from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { interviewTypeOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

import CandidatePipelineModalShell, {
  CandidateModalPrimaryButton,
  CandidateModalSecondaryButton,
  CandidateModalSection,
} from "../../recruitment/candidatePipeline/CandidatePipelineModalShell";
import CandidateModalSummary from "../../recruitment/candidatePipeline/CandidateModalSummary";
import InterviewGoogleCalendarPicker from "./InterviewGoogleCalendarPicker";
import { getGoogleCalendarStatus } from "../../../lib/axios/googleCalendarApi";

const MONTH_OPTIONS = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

const MIN_INTERVIEW_HOUR = 10;
const MAX_INTERVIEW_HOUR = 17;

const MINUTE_OPTIONS = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
].map((minute) => ({
  value: minute,
  label: minute,
}));

function pad(value) {
  return String(value).padStart(2, "0");
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 1;

  return {
    value: hour,
    label: pad(hour),
  };
});

const SCHEDULE_FIELD_LABEL_CLASS =
  "mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted";
function cleanText(value) {
  return String(value ?? "").trim();
}

function getTodayDateOnly() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isDateBeforeToday(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return true;

  const todayStart = getTodayDateOnly();

  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  return dateStart < todayStart;
}

function isWeekendDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return true;

  return date.getDay() === 0 || date.getDay() === 6;
}

function isSelectableInterviewDate(date) {
  return !isDateBeforeToday(date) && !isWeekendDate(date);
}

function getNextSelectableInterviewDate(value = new Date()) {
  const date = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );

  while (!isSelectableInterviewDate(date)) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function toHour24(hour12, period) {
  let hour = Number(hour12);

  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;

  return hour;
}

function isTimeWithinInterviewWindow(hour12, minute, period) {
  const hour24 = toHour24(hour12, period);
  const minuteNumber = Number(minute);
  const totalMinutes = hour24 * 60 + minuteNumber;

  return (
    Number.isFinite(totalMinutes) &&
    totalMinutes >= MIN_INTERVIEW_HOUR * 60 &&
    totalMinutes <= MAX_INTERVIEW_HOUR * 60
  );
}

function isInterviewHourAvailable(hour12, period) {
  return isTimeWithinInterviewWindow(hour12, "00", period);
}

function parseDateTimeValue(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function toDateTimeInputValue(date, hour12 = 10, minute = "00", period = "AM") {
  if (!date) return "";

  let hour24 = Number(hour12);

  if (period === "AM" && hour24 === 12) hour24 = 0;
  if (period === "PM" && hour24 !== 12) hour24 += 12;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(hour24)}:${pad(minute)}`;
}

function getTimeParts(value) {
  const parsed = parseDateTimeValue(value);

  if (!parsed) {
    return {
      hour12: 10,
      minute: "00",
      period: "AM",
    };
  }

  const hour24 = parsed.getHours();
  const minute = pad(parsed.getMinutes());
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    hour12,
    minute,
    period,
  };
}

function formatDateTimeDisplay(value) {
  const parsed = parseDateTimeValue(value);

  if (!parsed) return "Select interview date and time";

  return formatHrisDateTimeLocalized(parsed, "en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildYearOptions(baseDate) {
  const currentYear = new Date().getFullYear();
  const baseYear = baseDate?.getFullYear?.() || currentYear;
  const endYear = Math.max(currentYear + 10, baseYear + 10);

  return Array.from({ length: endYear - currentYear + 1 }, (_, index) => {
    const year = currentYear + index;

    return {
      value: year,
      label: String(year),
    };
  });
}

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const days = [];

  for (let index = startDay - 1; index >= 0; index -= 1) {
    days.push({
      date: new Date(year, month - 1, previousMonthDays - index),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - (startDay + daysInMonth) + 1;

    days.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });
  }

  return days;
}

function isSameDate(left, right) {
  if (!left || !right) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function PickerDropdown({
  dropdownId = "",
  openDropdown = "",
  setOpenDropdown,
  value,
  options = [],
  onChange,
  placeholder = "Select option",
  disabled = false,
  buttonClassName = "",
  menuClassName = "",
  textClassName = "sibs-text-xs",
}) {
  const dropdownRef = useRef(null);
  const [localOpen, setLocalOpen] = useState(false);

  const isControlled =
    typeof setOpenDropdown === "function" && cleanText(dropdownId);

  const open = isControlled ? openDropdown === dropdownId : localOpen;

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        if (isControlled) {
          setOpenDropdown("");
        } else {
          setLocalOpen(false);
        }
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        if (isControlled) {
          setOpenDropdown("");
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
  }, [isControlled, setOpenDropdown]);

  function toggleOpen() {
    if (disabled) return;

    if (isControlled) {
      setOpenDropdown(open ? "" : dropdownId);
      return;
    }

    setLocalOpen((previous) => !previous);
  }

  function closeDropdown() {
    if (isControlled) {
      setOpenDropdown("");
      return;
    }

    setLocalOpen(false);
  }

  function handleSelect(option) {
    if (disabled || option.disabled) return;

    onChange?.(option.value);
    closeDropdown();
  }

  return (
    <div ref={dropdownRef} className="relative font-jakarta">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-[10px] border bg-sibs-surface px-3 text-left font-jakarta ${textClassName} font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10"
            : "border-sibs-border hover:border-sibs-orange/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-sibs-muted opacity-70"
            : "text-sibs-navy"
        } ${buttonClassName}`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-sibs-navy" : "text-sibs-muted"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-sibs-navy transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div
          className={`sibs-dropdown-pop-in absolute left-0 top-[calc(100%+8px)] z-[99999] max-h-[260px] w-full overflow-hidden rounded-[10px] border border-sibs-border bg-white font-jakarta shadow-[0_20px_25px_-5px_rgba(4,44,81,0.16),0_8px_10px_-6px_rgba(4,44,81,0.14)] ${menuClassName}`}
        >
          <div className="max-h-[260px] overflow-y-auto py-1">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={`flex min-h-[38px] w-full items-center justify-between gap-3 px-3 text-left font-jakarta ${textClassName} font-semibold transition ${
                    option.disabled
                      ? "cursor-not-allowed bg-white text-slate-300"
                      : active
                        ? "bg-sibs-cream-light text-sibs-orange"
                        : "bg-white text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                  }`}
                >
                  <span>{option.label}</span>
                  {active && !option.disabled && <Check size={15} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DateTimePicker({ value, onChange }) {
  const parsedValue = parseDateTimeValue(value);
  const safeInitialDate =
    parsedValue && isSelectableInterviewDate(parsedValue)
      ? parsedValue
      : getNextSelectableInterviewDate(getTodayDateOnly());

  const pickerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState("");
  const [viewDate, setViewDate] = useState(() =>
    getMonthStart(safeInitialDate),
  );
  const [activeDate, setActiveDate] = useState(safeInitialDate);

  const currentTimeParts = useMemo(() => getTimeParts(value), [value]);

  const [hour12, setHour12] = useState(currentTimeParts.hour12);
  const [minute, setMinute] = useState(currentTimeParts.minute);
  const [period, setPeriod] = useState(currentTimeParts.period);

  const todayDateOnly = getTodayDateOnly();
  const currentMonthStart = getMonthStart(todayDateOnly);
  const viewMonthStart = getMonthStart(viewDate);
  const currentYear = todayDateOnly.getFullYear();
  const currentMonth = todayDateOnly.getMonth();
  const disablePreviousMonth = viewMonthStart <= currentMonthStart;

  const yearOptions = useMemo(() => buildYearOptions(viewDate), [viewDate]);

  const monthOptions = useMemo(() => {
    return MONTH_OPTIONS.map((month) => ({
      ...month,
      disabled:
        viewDate.getFullYear() === currentYear && month.value < currentMonth,
    }));
  }, [currentMonth, currentYear, viewDate]);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  const displayValue =
    parsedValue &&
    isSelectableInterviewDate(parsedValue) &&
    isTimeWithinInterviewWindow(
      currentTimeParts.hour12,
      currentTimeParts.minute,
      currentTimeParts.period,
    )
      ? value
      : "";

  useEffect(() => {
    const nextDate = parseDateTimeValue(value);

    if (nextDate && isSelectableInterviewDate(nextDate)) {
      setActiveDate(nextDate);
      setViewDate(getMonthStart(nextDate));

      const nextTimeParts = getTimeParts(value);
      setHour12(nextTimeParts.hour12);
      setMinute(nextTimeParts.minute);
      setPeriod(nextTimeParts.period);
      return;
    }

    if (nextDate && !isSelectableInterviewDate(nextDate)) {
      const today = getNextSelectableInterviewDate(getTodayDateOnly());

      setActiveDate(today);
      setViewDate(getMonthStart(today));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!pickerRef.current) return;

      if (!pickerRef.current.contains(event.target)) {
        setOpen(false);
        setOpenDropdown("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setOpenDropdown("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function commitValue(
    nextDate = activeDate,
    nextHour = hour12,
    nextMinute = minute,
    nextPeriod = period,
  ) {
    if (!nextDate) return;
    if (!isSelectableInterviewDate(nextDate)) return;
    if (!isTimeWithinInterviewWindow(nextHour, nextMinute, nextPeriod)) return;

    onChange?.(toDateTimeInputValue(nextDate, nextHour, nextMinute, nextPeriod));
  }

  function handleDateSelect(nextDate) {
    if (!isSelectableInterviewDate(nextDate)) return;

    setOpenDropdown("");
    setActiveDate(nextDate);
    setViewDate(getMonthStart(nextDate));
    commitValue(nextDate, hour12, minute, period);
  }

  function handlePreviousMonth() {
    if (disablePreviousMonth) return;

    setOpenDropdown("");
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
    );
  }

  function handleNextMonth() {
    setOpenDropdown("");
    setViewDate(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
    );
  }

  function handleMonthChange(nextMonthValue) {
    const nextMonth = Number(nextMonthValue);

    if (viewDate.getFullYear() === currentYear && nextMonth < currentMonth) {
      return;
    }

    const nextViewDate = new Date(viewDate.getFullYear(), nextMonth, 1);

    setViewDate(nextViewDate);

    if (activeDate) {
      const lastDayOfMonth = new Date(
        nextViewDate.getFullYear(),
        nextViewDate.getMonth() + 1,
        0,
      ).getDate();

      const nextActiveDateCandidate = new Date(
        nextViewDate.getFullYear(),
        nextViewDate.getMonth(),
        Math.min(activeDate.getDate(), lastDayOfMonth),
      );

      const nextActiveDate = isSelectableInterviewDate(nextActiveDateCandidate)
        ? nextActiveDateCandidate
        : getNextSelectableInterviewDate(nextActiveDateCandidate);

      setActiveDate(nextActiveDate);
      commitValue(nextActiveDate, hour12, minute, period);
    }
  }

  function handleYearChange(nextYearValue) {
    const nextYear = Number(nextYearValue);
    const nextMonth =
      nextYear === currentYear && viewDate.getMonth() < currentMonth
        ? currentMonth
        : viewDate.getMonth();

    const nextViewDate = new Date(nextYear, nextMonth, 1);

    setViewDate(nextViewDate);

    if (activeDate) {
      const lastDayOfMonth = new Date(
        nextYear,
        nextMonth + 1,
        0,
      ).getDate();

      const nextActiveDateCandidate = new Date(
        nextYear,
        nextMonth,
        Math.min(activeDate.getDate(), lastDayOfMonth),
      );

      const nextActiveDate = isSelectableInterviewDate(nextActiveDateCandidate)
        ? nextActiveDateCandidate
        : getNextSelectableInterviewDate(nextActiveDateCandidate);

      setActiveDate(nextActiveDate);
      commitValue(nextActiveDate, hour12, minute, period);
    }
  }

  function handleHourChange(nextHourValue) {
    const nextHour = Number(nextHourValue);

    if (!isInterviewHourAvailable(nextHour, period)) return;

    const nextMinute = isTimeWithinInterviewWindow(
      nextHour,
      minute,
      period,
    )
      ? minute
      : "00";

    setHour12(nextHour);
    setMinute(nextMinute);
    commitValue(activeDate, nextHour, nextMinute, period);
  }

  function handleMinuteChange(nextMinute) {
    if (!isTimeWithinInterviewWindow(hour12, nextMinute, period)) return;

    setMinute(nextMinute);
    commitValue(activeDate, hour12, nextMinute, period);
  }

  function handlePeriodChange(nextPeriod) {
    setOpenDropdown("");

    const nextHour =
      nextPeriod === "AM"
        ? hour12 >= 10 && hour12 <= 11
          ? hour12
          : 10
        : hour12 === 12 || hour12 <= 5
          ? hour12
          : 12;
    const nextMinute =
      nextPeriod === "PM" && nextHour === 5 ? "00" : minute;

    setPeriod(nextPeriod);
    setHour12(nextHour);
    setMinute(nextMinute);
    commitValue(activeDate, nextHour, nextMinute, nextPeriod);
  }

  function setToday() {
    const today = getNextSelectableInterviewDate(getTodayDateOnly());

    setOpenDropdown("");
    setActiveDate(today);
    setViewDate(getMonthStart(today));
    commitValue(today, hour12, minute, period);
  }

  return (
    <div ref={pickerRef} className="relative font-jakarta text-sibs-navy">
      <button
        type="button"
        onClick={() => {
          setOpen((previous) => {
            const nextOpen = !previous;

            if (!nextOpen) {
              setOpenDropdown("");
            }

            return nextOpen;
          });
        }}
        className={`flex h-10 w-full items-center justify-between gap-3 rounded-[10px] border bg-sibs-surface px-3 text-left font-jakarta sibs-text-xs font-bold shadow-sm outline-none transition ${
          open
            ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10"
            : "border-sibs-border hover:border-sibs-orange/40 hover:bg-white"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            displayValue ? "text-sibs-navy" : "text-sibs-muted"
          }`}
        >
          {formatDateTimeDisplay(displayValue)}
        </span>

        <CalendarDays size={17} className="shrink-0 text-sibs-navy" />
      </button>

      {open && (
        <div className="sibs-dropdown-pop-in mt-3 overflow-visible rounded-[10px] border border-sibs-border bg-white font-jakarta shadow-[0_20px_25px_-5px_rgba(4,44,81,0.16),0_8px_10px_-6px_rgba(4,44,81,0.14)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-sibs-border p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  disabled={disablePreviousMonth}
                  className="hidden h-9 w-9 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-navy sm:flex"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="grid flex-1 grid-cols-2 gap-2">
                  <PickerDropdown
                    dropdownId="month"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={viewDate.getMonth()}
                    options={monthOptions}
                    onChange={handleMonthChange}
                    placeholder="Month"
                  />

                  <PickerDropdown
                    dropdownId="year"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={viewDate.getFullYear()}
                    options={yearOptions}
                    onChange={handleYearChange}
                    placeholder="Year"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="hidden h-9 w-9 items-center justify-center rounded-[10px] border border-sibs-border bg-white text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange sm:flex"
                >
                  <ChevronRight size={18} />
                </button>

                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={handlePreviousMonth}
                    disabled={disablePreviousMonth}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-sibs-border bg-white font-jakarta sibs-text-xs font-bold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-navy"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-sibs-border bg-white font-jakarta sibs-text-xs font-bold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div
                    key={day}
                    className="py-2 font-jakarta sibs-kicker text-sibs-muted"
                  >
                    {day}
                  </div>
                ))}

                {days.map((item) => {
                  const active = isSameDate(item.date, activeDate);
                  const today = isSameDate(item.date, getTodayDateOnly());
                  const disabledDay = !isSelectableInterviewDate(item.date);

                  return (
                    <button
                      key={item.date.toISOString()}
                      type="button"
                      disabled={disabledDay}
                      onClick={() => handleDateSelect(item.date)}
                      className={`flex h-9 items-center justify-center rounded-[10px] font-jakarta sibs-text-xs font-bold tabular-nums transition ${
                        disabledDay
                          ? "cursor-not-allowed text-slate-300 opacity-50"
                          : active
                            ? "bg-sibs-orange text-white shadow-sm"
                            : today
                              ? "border border-sibs-orange/30 bg-sibs-cream-light text-sibs-orange"
                              : item.currentMonth
                                ? "text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                                : "text-sibs-muted hover:bg-sibs-cream-light hover:text-sibs-orange"
                      }`}
                    >
                      {item.date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                    setOpenDropdown("");
                  }}
                  className="font-jakarta sibs-text-xs font-bold text-rose-600 transition hover:text-rose-700"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={setToday}
                  className="font-jakarta sibs-text-xs font-bold text-sibs-orange transition hover:text-sibs-orange-deep"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="bg-sibs-surface p-4">
              <div className="mb-3 flex items-center gap-2 text-sibs-navy">
                <Clock size={15} />
                <p className="font-jakarta sibs-text-xs font-extrabold">Select Time</p>
              </div>

              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <div>
                  <label className="mb-1 block font-jakarta sibs-kicker text-sibs-muted">
                    Hour
                  </label>

                  <PickerDropdown
                    dropdownId="hour"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={hour12}
                    options={HOUR_OPTIONS.map((option) => ({
                      ...option,
                      disabled: !isInterviewHourAvailable(
                        option.value,
                        period,
                      ),
                    }))}
                    onChange={handleHourChange}
                    placeholder="Hour"
                    buttonClassName="h-9 px-2.5"
                    textClassName="sibs-text-micro"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-jakarta sibs-kicker text-sibs-muted">
                    Minute
                  </label>

                  <PickerDropdown
                    dropdownId="minute"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={minute}
                    options={MINUTE_OPTIONS.map((option) => ({
                      ...option,
                      disabled: !isTimeWithinInterviewWindow(
                        hour12,
                        option.value,
                        period,
                      ),
                    }))}
                    onChange={handleMinuteChange}
                    placeholder="Minute"
                    buttonClassName="h-9 px-2.5"
                    textClassName="sibs-text-micro"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-jakarta sibs-kicker text-sibs-muted">
                    AM/PM
                  </label>

                  <div className="flex h-9 overflow-hidden rounded-[10px] border border-sibs-border bg-white">
                    {["AM", "PM"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePeriodChange(item)}
                        className={`w-12 font-jakarta sibs-text-micro font-bold transition ${
                          period === item
                            ? "bg-sibs-orange text-white"
                            : "bg-white text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[10px] border border-sibs-border bg-white p-3">
                <p className="font-jakarta sibs-kicker text-sibs-muted">
                  Selected Schedule
                </p>

                <p className="mt-1 font-jakarta sibs-text-xs font-extrabold text-sibs-navy">
                  {formatDateTimeDisplay(displayValue)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  commitValue(activeDate, hour12, minute, period);
                  setOpen(false);
                  setOpenDropdown("");
                }}
                className="mt-4 inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-sibs-orange px-4 font-jakarta sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-sibs-orange-deep disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Check size={14} />
                Apply Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ScheduleInterviewModal = ({
  open,
  candidate,
  form,
  setForm,
  isSaving = false,
  onClose,
  onSubmit,
  onOpenSibsCalendar,
  onUpdateCandidateSchedule,
}) => {
  const [processSubmitting, setProcessSubmitting] = useState(false);
  const [syncWarning, setSyncWarning] = useState("");
  const [submitAfterEditorSave, setSubmitAfterEditorSave] = useState(false);
  const isUpdatingSchedule = candidate?.currentStage === "Interview Scheduled";
  const busy = isSaving || processSubmitting;
  // Show the primary action only after all required scheduling fields are set.
  // The Google calendar picker verifies slot availability; the server performs
  // the authoritative check again when the proposal is submitted.
  const hasValidInterviewDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(cleanText(form?.interviewDate));
  const hasInterviewType = interviewTypeOptions.includes(cleanText(form?.interviewType));
  // Google Meet is generated by Google Calendar only after the interview is confirmed.
  const canScheduleInterview = hasValidInterviewDate && hasInterviewType;

  // The editor owns all required fields. Submit only on the next render, after
  // the parent-controlled form has received the verified date and details.
  useEffect(() => {
    if (!open || !submitAfterEditorSave || busy || !canScheduleInterview) return;
    setSubmitAfterEditorSave(false);
    void handleProcessSubmit();
  }, [open, submitAfterEditorSave, busy, canScheduleInterview]);

  // A temporary calendar handoff must not retain an obsolete submit warning.
  useEffect(() => {
    if (open) setSyncWarning("");
  }, [open]);

  if (!open || !candidate) return null;

  function handleOpenSibsCalendar() {
    if (busy) return;
    // Parent temporarily hides this modal; it retains candidate + form state.
    onOpenSibsCalendar?.();
  }

  async function handleProcessSubmit(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (busy || !canScheduleInterview) return;

    setProcessSubmitting(true);
    setSyncWarning("");
    try {
      const status = await getGoogleCalendarStatus();
      if (status?.success === false || !status?.connected || !status?.synced) {
        setSyncWarning(status?.connected
          ? "Sync your connected Google account in SiBS Calendar before scheduling an interview."
          : "Connect and sync your Google account in SiBS Calendar before scheduling an interview.");
        return;
      }
      await onSubmit?.(event);
    } finally {
      setProcessSubmitting(false);
    }
  }

  const footer = (
    <div className="flex flex-col-reverse justify-end gap-2.5 sm:gap-3 sm:flex-row">
      <CandidateModalSecondaryButton type="button" disabled={busy} onClick={onClose}>
        Cancel
      </CandidateModalSecondaryButton>
      {(canScheduleInterview || busy) && (
        <CandidateModalPrimaryButton
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={handleProcessSubmit}
          className="min-w-[160px]"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <CalendarDays size={15} />}
          {busy
            ? isUpdatingSchedule
              ? "Updating Schedule..."
              : "Saving Schedule..."
            : isUpdatingSchedule
              ? "Update Schedule"
              : "Schedule Interview"}
        </CandidateModalPrimaryButton>
      )}
    </div>
  );

  return (
    <CandidatePipelineModalShell
      open={open}
      icon={CalendarDays}
      title={isUpdatingSchedule ? "Update Interview Schedule" : "Schedule Candidate Interview"}
      subtitle={
        isUpdatingSchedule
          ? "Update the interview date, time, type, link, and internal scheduling remarks."
          : "Create the interview schedule for a candidate who is ready to proceed from Assessment Fit."
      }
      badge={isUpdatingSchedule ? "Reschedule" : "Interview"}
      onClose={onClose}
      closeDisabled={busy}
      maxWidth="max-w-3xl"
      zIndex="z-[10001]"
      footer={footer}
    >
      <form
        onSubmit={handleProcessSubmit}
        className={`space-y-4 font-jakarta ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        <CandidateModalSummary
          candidate={candidate}
          stage={candidate.currentStage}
          statusClass={getInterviewStatusClass(candidate.interviewStatus || "For Scheduling")}
        />

        {syncWarning && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          <span>{syncWarning}</span>
          <button type="button" onClick={handleOpenSibsCalendar} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 font-extrabold text-sibs-navy hover:bg-amber-100">Open SiBS Calendar</button>
        </div>}

        <CandidateModalSection
          title="Interview Schedule"
          subtitle={isUpdatingSchedule
            ? "Edit the existing final interview date, start time, interview type, and internal remarks. The candidate will be asked to confirm the replacement before Google Calendar is updated."
            : "Select a date to complete the interview type, online link (if needed), and internal remarks in the Google-style editor. The schedule stays pending in HRIS until approved."}
        >
          <div>
            <label className={SCHEDULE_FIELD_LABEL_CLASS}>
              Interview Date and Time <span className="text-sibs-orange"> *</span>
            </label>
            {/* The Google-style editor is the single source for interview type,
                generated online link, site and internal remarks. Do not add
                duplicate fields to this outer scheduling modal. */}
            <InterviewGoogleCalendarPicker
              onOpenSibsCalendar={handleOpenSibsCalendar}
              onUpdateCandidateSchedule={onUpdateCandidateSchedule}
              candidate={candidate}
              candidateId={candidate?.id || candidate?.candidatePipelineId}
              value={form.interviewDate}
              remarks={form.remarks}
              interviewType={form.interviewType}
              onlineInterviewLink={form.onlineInterviewLink}
              color={form.calendarColor || "peacock"}
              onColorChange={(nextColor) => setForm((current) => ({ ...current, calendarColor: nextColor }))}
              availability={form.calendarAvailability || "Busy"}
              onAvailabilityChange={(nextAvailability) => setForm((current) => ({ ...current, calendarAvailability: nextAvailability }))}
              visibility={form.calendarVisibility || "Default visibility"}
              onVisibilityChange={(nextVisibility) => setForm((current) => ({ ...current, calendarVisibility: nextVisibility }))}
              notification={Boolean(form.calendarAddNotification)}
              onChange={(nextValue, details = {}) => setForm((current) => ({
                ...current,
                interviewDate: nextValue,
                interviewType: details.interviewType ?? current.interviewType,
                onlineInterviewLink: details.onlineInterviewLink ?? current.onlineInterviewLink,
                remarks: details.remarks ?? current.remarks,
                calendarColor: details.calendarColor ?? current.calendarColor ?? "peacock",
                calendarColorId: details.calendarColorId ?? current.calendarColorId ?? "7",
                calendarAvailability: details.calendarAvailability ?? current.calendarAvailability ?? "Busy",
                calendarVisibility: details.calendarVisibility ?? current.calendarVisibility ?? "Default visibility",
                calendarAddNotification: details.calendarAddNotification ?? current.calendarAddNotification ?? false,
              }))}
              onProposalSaved={() => setSubmitAfterEditorSave(true)}
            />
          </div>
        </CandidateModalSection>
      </form>
    </CandidatePipelineModalShell>
  );
};

export default ScheduleInterviewModal;
