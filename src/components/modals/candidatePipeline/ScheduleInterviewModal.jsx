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

function pad(value) {
  return String(value).padStart(2, "0");
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function getTodayDateOnly() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDateTimeValue(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function toDateTimeInputValue(date, hour12 = 9, minute = "00", period = "AM") {
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
      hour12: 9,
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
  const startYear = Math.min(currentYear - 5, baseYear - 5);
  const endYear = Math.max(currentYear + 10, baseYear + 10);

  return Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => startYear + index,
  );
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

function DateTimePicker({ value, onChange }) {
  const selectedDate = parseDateTimeValue(value);
  const pickerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || getTodayDateOnly());
  const [activeDate, setActiveDate] = useState(
    selectedDate || getTodayDateOnly(),
  );

  const currentTimeParts = useMemo(() => getTimeParts(value), [value]);

  const [hour12, setHour12] = useState(currentTimeParts.hour12);
  const [minute, setMinute] = useState(currentTimeParts.minute);
  const [period, setPeriod] = useState(currentTimeParts.period);

  const yearOptions = useMemo(() => buildYearOptions(viewDate), [viewDate]);
  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  useEffect(() => {
    const nextDate = parseDateTimeValue(value);

    if (nextDate) {
      setActiveDate(nextDate);
      setViewDate(nextDate);

      const nextTimeParts = getTimeParts(value);
      setHour12(nextTimeParts.hour12);
      setMinute(nextTimeParts.minute);
      setPeriod(nextTimeParts.period);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!pickerRef.current) return;

      if (!pickerRef.current.contains(event.target)) {
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

  function commitValue(
    nextDate = activeDate,
    nextHour = hour12,
    nextMinute = minute,
    nextPeriod = period,
  ) {
    if (!nextDate) return;

    onChange?.(toDateTimeInputValue(nextDate, nextHour, nextMinute, nextPeriod));
  }

  function handleDateSelect(nextDate) {
    setActiveDate(nextDate);
    setViewDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    commitValue(nextDate, hour12, minute, period);
  }

  function handleMonthChange(event) {
    const nextMonth = Number(event.target.value);
    const nextViewDate = new Date(viewDate.getFullYear(), nextMonth, 1);

    setViewDate(nextViewDate);

    if (activeDate) {
      const lastDayOfMonth = new Date(
        nextViewDate.getFullYear(),
        nextViewDate.getMonth() + 1,
        0,
      ).getDate();

      const nextActiveDate = new Date(
        nextViewDate.getFullYear(),
        nextViewDate.getMonth(),
        Math.min(activeDate.getDate(), lastDayOfMonth),
      );

      setActiveDate(nextActiveDate);
      commitValue(nextActiveDate, hour12, minute, period);
    }
  }

  function handleYearChange(event) {
    const nextYear = Number(event.target.value);
    const nextViewDate = new Date(nextYear, viewDate.getMonth(), 1);

    setViewDate(nextViewDate);

    if (activeDate) {
      const lastDayOfMonth = new Date(
        nextYear,
        viewDate.getMonth() + 1,
        0,
      ).getDate();

      const nextActiveDate = new Date(
        nextYear,
        viewDate.getMonth(),
        Math.min(activeDate.getDate(), lastDayOfMonth),
      );

      setActiveDate(nextActiveDate);
      commitValue(nextActiveDate, hour12, minute, period);
    }
  }

  function handleHourChange(event) {
    const nextHour = Number(event.target.value);
    setHour12(nextHour);
    commitValue(activeDate, nextHour, minute, period);
  }

  function handleMinuteChange(event) {
    const nextMinute = event.target.value;
    setMinute(nextMinute);
    commitValue(activeDate, hour12, nextMinute, period);
  }

  function handlePeriodChange(nextPeriod) {
    setPeriod(nextPeriod);
    commitValue(activeDate, hour12, minute, nextPeriod);
  }

  function setToday() {
    const today = getTodayDateOnly();
    setActiveDate(today);
    setViewDate(today);
    commitValue(today, hour12, minute, period);
  }

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/50 hover:bg-[#F8FAFC]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            value ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
          }`}
        >
          {formatDateTimeDisplay(value)}
        </span>

        <CalendarDays size={18} className="shrink-0 text-sibs-primary-1" />
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.13)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[#E6ECF2] p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setViewDate(
                      new Date(
                        viewDate.getFullYear(),
                        viewDate.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:flex"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="grid flex-1 grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      value={viewDate.getMonth()}
                      onChange={handleMonthChange}
                      className="h-10 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-3 pr-9 text-sm font-extrabold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1/50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    >
                      {MONTH_OPTIONS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sibs-primary-1"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={viewDate.getFullYear()}
                      onChange={handleYearChange}
                      className="h-10 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-3 pr-9 text-sm font-extrabold text-sibs-primary-1 outline-none transition hover:border-sibs-primary-1/50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sibs-primary-1"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setViewDate(
                      new Date(
                        viewDate.getFullYear(),
                        viewDate.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#D9E2EC] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:flex"
                >
                  <ChevronRight size={18} />
                </button>

                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setViewDate(
                        new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D9E2EC] bg-white text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setViewDate(
                        new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth() + 1,
                          1,
                        ),
                      )
                    }
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

                  return (
                    <button
                      key={item.date.toISOString()}
                      type="button"
                      onClick={() => handleDateSelect(item.date)}
                      className={`flex h-9 items-center justify-center rounded-xl text-xs font-extrabold transition ${
                        active
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

                  <select
                    value={hour12}
                    onChange={handleHourChange}
                    className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-extrabold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  >
                    {Array.from({ length: 12 }, (_, index) => index + 1).map(
                      (hour) => (
                        <option key={hour} value={hour}>
                          {pad(hour)}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5">
                    Minute
                  </label>

                  <select
                    value={minute}
                    onChange={handleMinuteChange}
                    className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm font-extrabold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                  >
                    {[
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
                    ].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
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
                  {formatDateTimeDisplay(value)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  commitValue(activeDate, hour12, minute, period);
                  setOpen(false);
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
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedValue = cleanText(value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(type) {
    onChange?.(type);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/50 hover:bg-[#F8FAFC]"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedValue ? "text-sibs-primary-1" : "text-sibs-tertiary-5"
          }`}
        >
          {selectedValue || "Select interview type"}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[10050] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          {interviewTypeOptions.map((type) => {
            const active = selectedValue === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelect(type)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-extrabold transition ${
                  active
                    ? "bg-[#EAF4FF] text-sibs-primary-1"
                    : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                }`}
              >
                <span>{type}</span>
                {active && <Check size={16} />}
              </button>
            );
          })}
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
  onClose,
  onSubmit,
}) => {
  if (!open || !candidate) return null;

  const isUpdatingSchedule = candidate.currentStage === "Interview Scheduled";

  return (
    <div
      className="fixed inset-0 z-[10001] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
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
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
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
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white px-5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              <CalendarDays size={16} />
              {isUpdatingSchedule ? "Update Schedule" : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;