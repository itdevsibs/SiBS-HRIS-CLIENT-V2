import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getAssessmentResult,
  getAssessmentResultClass,
  getInterviewStatusClass,
  inputClass,
  textareaClass,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import { interviewTypeOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  X,
} from "lucide-react";

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

  return parsed.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
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
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-3 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/50 hover:bg-[#F8FAFC]"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400 opacity-70"
            : "text-sibs-primary-1"
        } ${buttonClassName}`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
          }`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-[99999] max-h-[260px] w-full overflow-hidden rounded-xl border border-[#D6DEE8] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] ${menuClassName}`}
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
                  className={`flex min-h-[42px] w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold transition ${
                    option.disabled
                      ? "cursor-not-allowed bg-white text-slate-300"
                      : active
                        ? "bg-[#EAF2FB] text-sibs-primary-1"
                        : "bg-white text-[#475467] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
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

    if (!isTimeWithinInterviewWindow(nextHour, minute, period)) return;

    setHour12(nextHour);
    commitValue(activeDate, nextHour, minute, period);
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
    <div ref={pickerRef} className="relative">
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
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/50 hover:bg-[#F8FAFC]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            displayValue ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
          }`}
        >
          {formatDateTimeDisplay(displayValue)}
        </span>

        <CalendarDays size={18} className="shrink-0 text-sibs-primary-1" />
      </button>

      {open && (
        <div className="mt-3 overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.13)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[#E6ECF2] p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handlePreviousMonth}
                  disabled={disablePreviousMonth}
                  className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white sm:flex"
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
                  className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:flex"
                >
                  <ChevronRight size={18} />
                </button>

                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={handlePreviousMonth}
                    disabled={disablePreviousMonth}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-white text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-white text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
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
                    className="py-2 text-[11px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5"
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
                      className={`flex h-9 items-center justify-center rounded-xl text-xs font-extrabold transition ${
                        disabledDay
                          ? "cursor-not-allowed text-slate-300 opacity-45"
                          : active
                            ? "bg-sibs-primary-1 text-white shadow-sm"
                            : today
                              ? "border border-sibs-primary-1/25 bg-[#EAF4FF] text-sibs-primary-1"
                              : item.currentMonth
                                ? "text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                                : "text-sibs-tertiary-5/60 hover:bg-[#F8FAFC]"
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
                  className="text-xs font-extrabold text-red-500 transition hover:text-red-600"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={setToday}
                  className="text-xs font-extrabold text-sibs-primary-1 transition hover:opacity-80"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-4">
              <div className="mb-3 flex items-center gap-2 text-sibs-primary-1">
                <Clock size={17} />
                <p className="text-sm font-extrabold">Select Time</p>
              </div>

              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    Hour
                  </label>

                  <PickerDropdown
                    dropdownId="hour"
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    value={hour12}
                    options={HOUR_OPTIONS.map((option) => ({
                      ...option,
                      disabled: !isTimeWithinInterviewWindow(
                        option.value,
                        minute,
                        period,
                      ),
                    }))}
                    onChange={handleHourChange}
                    placeholder="Hour"
                    buttonClassName="h-11"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
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
                    buttonClassName="h-11"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    AM/PM
                  </label>

                  <div className="flex h-11 overflow-hidden rounded-xl border border-[#D0D5DD] bg-white">
                    {["AM", "PM"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePeriodChange(item)}
                        className={`w-12 text-xs font-extrabold transition ${
                          period === item
                            ? "bg-sibs-primary-1 text-white"
                            : "bg-white text-sibs-primary-1 hover:bg-[#F5F9FF]"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#D9E2EC] bg-white p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                  Selected Schedule
                </p>

                <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
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
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90"
              >
                <Check size={16} />
                Apply Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewTypeDropdown({ value, onChange }) {
  const selectedValue = cleanText(value);

  const options = interviewTypeOptions.map((type) => ({
    value: type,
    label: type,
  }));

  return (
    <PickerDropdown
      value={selectedValue}
      options={options}
      onChange={onChange}
      placeholder="Select interview type"
      buttonClassName="h-12 px-4"
      menuClassName="z-[10050]"
    />
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
}) => {
  const [processSubmitting, setProcessSubmitting] = useState(false);

  if (!open || !candidate) return null;

  const isUpdatingSchedule = candidate.currentStage === "Interview Scheduled";

  async function handleProcessSubmit(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (isSaving || processSubmitting) return;

    setProcessSubmitting(true);

    try {
      await onSubmit?.(event);
    } finally {
      setProcessSubmitting(false);
    }
  }

  return (
    <div
      className="sibs-modal-blur fixed inset-0 z-[10001] flex h-dvh items-center justify-center px-4 py-4"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
<div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-lg font-bold text-sibs-primary-1 sm:text-xl">
              {isUpdatingSchedule
                ? "Update Interview Schedule"
                : "Schedule Interview"}
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-primary-1">
              {isUpdatingSchedule
                ? "Update the interview date, time, and interview type."
                : "Only candidates tagged as Assessment Fit can be scheduled."}
            </p>
          </div>

          <button
            type="button"
            disabled={isSaving || processSubmitting}
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleProcessSubmit}
          className={`flex-1 overflow-y-auto p-4 sm:p-6 ${
            isSaving || processSubmitting ? "pointer-events-none opacity-70" : ""
          }`}
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <h3 className="text-lg font-bold text-sibs-primary-1">
                {candidate.name}
              </h3>

              <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                {candidate.roleAccount}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getAssessmentResultClass(
                    getAssessmentResult(candidate),
                  )}`}
                >
                  {getAssessmentResult(candidate) || "No Result"}
                </span>

                {isUpdatingSchedule && (
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getInterviewStatusClass(
                      candidate.interviewStatus,
                    )}`}
                  >
                    {candidate.interviewStatus || "Scheduled"}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1">
                Interview Date and Time <span className="text-red-500">*</span>
              </label>

              <DateTimePicker
                value={form.interviewDate}
                onChange={(nextValue) =>
                  setForm({ ...form, interviewDate: nextValue })
                }
              />

              <p className="mt-2 text-xs font-semibold leading-5 text-sibs-tertiary-5">
                Monday to Friday only. Available interview times are from
                10:00 AM through 5:00 PM.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1">
                Interview Type <span className="text-red-500">*</span>
              </label>

              <InterviewTypeDropdown
                value={form.interviewType}
                onChange={(nextValue) =>
                  setForm({
                    ...form,
                    interviewType: nextValue,
                    onlineInterviewLink:
                      nextValue === "Online" ? form.onlineInterviewLink : "",
                  })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1">
                Online Interview Link{" "}
                {form.interviewType === "Online" && (
                  <span className="text-red-500">*</span>
                )}
              </label>

              <input
                type="text"
                disabled={form.interviewType !== "Online"}
                placeholder="Paste Online Interview Link Here..."
                value={form.onlineInterviewLink}
                onChange={(e) =>
                  setForm({ ...form, onlineInterviewLink: e.target.value })
                }
                className={`${inputClass()} ${
                  form.interviewType !== "Online"
                    ? "cursor-not-allowed bg-[#F8FAFC] text-gray-400"
                    : ""
                }`}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1">
                Remarks
              </label>

              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className={textareaClass()}
                placeholder={
                  isUpdatingSchedule
                    ? "Example: Candidate requested to reschedule."
                    : "Example: Initial interview schedule created."
                }
              />
            </div>
          </div>
        </form>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              type="button"
              disabled={isSaving || processSubmitting}
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving || processSubmitting}
              aria-busy={isSaving || processSubmitting}
              onClick={handleProcessSubmit}
              className="inline-flex h-11 min-w-[154px] items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving || processSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CalendarDays size={16} />
              )}
              {isSaving || processSubmitting
                ? isUpdatingSchedule
                  ? "Updating Schedule..."
                  : "Saving Schedule..."
                : isUpdatingSchedule
                  ? "Update Schedule"
                  : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
