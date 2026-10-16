import { formatHrisDateLocalized } from "@/lib/axios/dateFormatter";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useParams } from "react-router-dom";

function getPublicApiBaseUrl() {
  const rawBaseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "https://sibs-hris-server.getleadsource.com";

  return String(rawBaseUrl)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

const PUBLIC_API_BASE_URL = getPublicApiBaseUrl();

function getResponseUrl(token = "") {
  return `${PUBLIC_API_BASE_URL}/api/candidate-pipeline/public/nho-response/${encodeURIComponent(
    token,
  )}`;
}

function parseDateOnly(value = "") {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
}

function toDateOnly(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatFriday(value = "") {
  const date = parseDateOnly(value);
  if (!date) return value || "—";

  return formatHrisDateLocalized(date, "en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatNhoTime(value = "") {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return "Time to be confirmed";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "Time to be confirmed";
  }

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;
}

const NHO_MIN_TIME_MINUTES = 8 * 60;
const NHO_MAX_TIME_MINUTES = 18 * 60;

const NHO_TIME_MINUTE_OPTIONS = [
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

const NHO_TIME_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 1;

  return {
    value: hour,
    label: String(hour).padStart(2, "0"),
  };
});

function normalizeNhoTime(value = "") {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

  if (!match) return "";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "";
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toNhoHour24(hour12, period) {
  let hour = Number(hour12);

  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;

  return hour;
}

function isNhoTimePartsAvailable(hour12, minute, period) {
  const hour24 = toNhoHour24(hour12, period);
  const minuteNumber = Number(minute);
  const totalMinutes = hour24 * 60 + minuteNumber;

  return (
    Number.isFinite(totalMinutes) &&
    totalMinutes >= NHO_MIN_TIME_MINUTES &&
    totalMinutes <= NHO_MAX_TIME_MINUTES
  );
}

function isNhoTimeWithinAvailableWindow(value = "") {
  const normalized = normalizeNhoTime(value);
  if (!normalized) return false;

  const [hours, minutes] = normalized.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;

  return (
    totalMinutes >= NHO_MIN_TIME_MINUTES &&
    totalMinutes <= NHO_MAX_TIME_MINUTES
  );
}

function getNhoTimeParts(value = "") {
  const normalized = normalizeNhoTime(value) || "08:00";
  const [hour24, minute] = normalized.split(":").map(Number);

  return {
    hour12: hour24 % 12 || 12,
    minute: String(minute).padStart(2, "0"),
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

function buildNhoTimeValue(hour12, minute, period) {
  const hour24 = toNhoHour24(hour12, period);

  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function PublicNhoTimeDropdown({
  dropdownId = "",
  openDropdown = "",
  setOpenDropdown,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
}) {
  const dropdownRef = useRef(null);
  const open = openDropdown === dropdownId;
  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpenDropdown?.("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpenDropdown?.("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [setOpenDropdown]);

  function handleSelect(option) {
    if (disabled || option.disabled) return;

    onChange?.(option.value);
    setOpenDropdown?.("");
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpenDropdown?.(open ? "" : dropdownId)}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border bg-sibs-surface px-3 text-left text-xs font-bold outline-none transition ${
          open
            ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10"
            : "border-sibs-border hover:border-sibs-orange/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-sibs-faint opacity-70"
            : "text-sibs-navy"
        }`}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={15}
          className={`shrink-0 text-sibs-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[130] max-h-[220px] w-full overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-lg">
          <div className="max-h-[220px] overflow-y-auto py-1">
            {options.map((option) => {
              const active =
                String(option.value) === String(value);

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={`flex min-h-[38px] w-full items-center justify-between gap-2 px-3 text-left text-xs font-semibold transition ${
                    option.disabled
                      ? "cursor-not-allowed bg-white text-slate-300"
                      : active
                        ? "bg-sibs-cream-light text-sibs-orange font-bold"
                        : "bg-white text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                  }`}
                >
                  <span>{option.label}</span>
                  {active && !option.disabled && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PublicNhoTimePicker({
  value = "",
  disabled = false,
  onChange,
}) {
  const [openDropdown, setOpenDropdown] = useState("");
  const { hour12, minute, period } = getNhoTimeParts(value);

  function commitTime(
    nextHour = hour12,
    nextMinute = minute,
    nextPeriod = period,
  ) {
    let safeHour = Number(nextHour);
    let safeMinute = String(nextMinute).padStart(2, "0");
    let safePeriod = nextPeriod;

    if (!isNhoTimePartsAvailable(safeHour, safeMinute, safePeriod)) {
      if (safePeriod === "AM") {
        safeHour = 8;
        safeMinute = "00";
      } else if (safePeriod === "PM") {
        if (safeHour === 6) {
          safeMinute = "00";
        } else if (
          !isNhoTimePartsAvailable(safeHour, "00", safePeriod)
        ) {
          safeHour = 12;
          safeMinute = "00";
        }
      }
    }

    onChange?.(
      buildNhoTimeValue(
        safeHour,
        safeMinute,
        safePeriod,
      ),
    );
  }

  return (
    <div className="rounded-[10px] border border-sibs-border bg-sibs-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-muted">
            NHO Time
          </p>
          <p className="mt-1 text-xs font-extrabold text-sibs-navy">
            {formatNhoTime(value)}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
            Hour
          </label>

          <PublicNhoTimeDropdown
            dropdownId="public-nho-hour"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            value={hour12}
            options={NHO_TIME_HOUR_OPTIONS.map((option) => ({
              ...option,
              disabled: !isNhoTimePartsAvailable(
                option.value,
                period === "PM" && option.value === 6 ? "00" : minute,
                period,
              ),
            }))}
            onChange={(nextHour) =>
              commitTime(nextHour, minute, period)
            }
            placeholder="Hour"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
            Minute
          </label>

          <PublicNhoTimeDropdown
            dropdownId="public-nho-minute"
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            value={minute}
            options={NHO_TIME_MINUTE_OPTIONS.map((option) => ({
              ...option,
              disabled: !isNhoTimePartsAvailable(
                hour12,
                option.value,
                period,
              ),
            }))}
            onChange={(nextMinute) =>
              commitTime(hour12, nextMinute, period)
            }
            placeholder="Minute"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
            AM/PM
          </label>

          <div className="flex h-10 overflow-hidden rounded-[10px] border border-sibs-border bg-white">
            {["AM", "PM"].map((item) => (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => {
                  commitTime(hour12, minute, item);
                  setOpenDropdown("");
                }}
                className={`w-12 text-[10px] font-bold transition ${
                  period === item
                    ? "bg-sibs-orange text-white"
                    : "bg-white text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold text-sibs-muted">
        Available NHO time is from 8:00 AM through 6:00 PM.
      </p>
    </div>
  );
}

function getEmploymentStartDateForNho(value = "") {
  const nhoDate = parseDateOnly(value);
  if (!nhoDate || nhoDate.getDay() !== 5) return "";

  const startDate = new Date(
    nhoDate.getFullYear(),
    nhoDate.getMonth(),
    nhoDate.getDate() + 3,
  );

  return toDateOnly(startDate);
}

function isSameCalendarDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDatePickerValue(value = "") {
  const date = parseDateOnly(value);
  if (!date) return "Select date";

  return formatHrisDateLocalized(date, "en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function isSelectableNhoFriday(value = "", earliestFriday = "") {
  const date = parseDateOnly(value);
  const earliest = parseDateOnly(earliestFriday);

  if (!date || date.getDay() !== 5) return false;
  if (!earliest) return true;

  const selectedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const earliestDate = new Date(
    earliest.getFullYear(),
    earliest.getMonth(),
    earliest.getDate(),
  );

  return selectedDate >= earliestDate;
}

function buildCalendarDays(displayDate) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const calendarStart = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return {
      date,
      value: toDateOnly(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function NhoFridayDatePicker({
  value = "",
  earliestFriday = "",
  disabled = false,
  onChange,
}) {
  const pickerRef = useRef(null);
  const selectedDate = parseDateOnly(value);
  const earliestDate = parseDateOnly(earliestFriday);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(() => {
    const initialDate = selectedDate || earliestDate || today;
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

  useEffect(() => {
    const nextDate = selectedDate || earliestDate;
    if (!nextDate) return;

    setDisplayDate(
      new Date(nextDate.getFullYear(), nextDate.getMonth(), 1),
    );
  }, [value, earliestFriday]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const calendarDays = buildCalendarDays(displayDate);
  const displayMonthStart = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1,
  );
  const earliestMonthStart = earliestDate
    ? new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1)
    : null;
  const previousMonthDisabled = Boolean(
    earliestMonthStart && displayMonthStart <= earliestMonthStart,
  );
  const todayValue = toDateOnly(today);
  const todaySelectable = isSelectableNhoFriday(
    todayValue,
    earliestFriday,
  );

  function goPreviousMonth() {
    if (previousMonthDisabled) return;

    setDisplayDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setDisplayDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  function selectDate(day) {
    if (
      !day.isCurrentMonth ||
      !isSelectableNhoFriday(day.value, earliestFriday)
    ) {
      return;
    }

    onChange?.(day.value);
    setOpen(false);
  }

  function clearDate() {
    onChange?.("");
    setOpen(false);
  }

  function selectToday() {
    if (!todaySelectable) return;

    onChange?.(todayValue);
    setOpen(false);
  }

  return (
    <div ref={pickerRef} className="relative mt-2">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-[10px] border bg-white px-4 text-left text-sm font-bold text-sibs-navy outline-none transition duration-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
          open
            ? "border-sibs-orange ring-4 ring-sibs-orange/10"
            : "border-sibs-border hover:border-sibs-orange/40 hover:bg-sibs-surface"
        }`}
      >
        <span className={value ? "text-sibs-navy" : "text-slate-400"}>
          {formatDatePickerValue(value)}
        </span>
        <CalendarDays size={18} className="shrink-0 text-sibs-orange" />
      </button>

      {open && !disabled && (
        <div
          role="dialog"
          aria-label="Select another Friday"
          className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[320px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-sibs-border px-4 py-3">
            <button
              type="button"
              disabled={previousMonthDisabled}
              onClick={goPreviousMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <p className="text-sm font-extrabold text-sibs-navy">
              {formatHrisDateLocalized(displayDate, "en-PH", {
                month: "long",
                year: "numeric",
              })}
            </p>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="px-4 pb-3 pt-4">
            <div className="grid grid-cols-7 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                (weekday) => (
                  <span
                    key={weekday}
                    className="pb-2 text-[11px] font-extrabold text-sibs-navy"
                  >
                    {weekday}
                  </span>
                ),
              )}
            </div>

            <div className="grid grid-cols-7 place-items-center gap-y-1">
              {calendarDays.map((day) => {
                const selectable =
                  day.isCurrentMonth &&
                  isSelectableNhoFriday(day.value, earliestFriday);
                const isSelected = Boolean(
                  selectedDate && isSameCalendarDate(day.date, selectedDate),
                );
                const isToday = isSameCalendarDate(day.date, today);

                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={!selectable}
                    onClick={() => selectDate(day)}
                    aria-label={formatFriday(day.value)}
                    aria-selected={isSelected}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition ${
                      !day.isCurrentMonth
                        ? "cursor-default text-slate-300"
                        : isSelected
                          ? "bg-sibs-cream-light text-sibs-orange"
                          : selectable
                            ? "text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                            : "cursor-not-allowed text-sibs-faint"
                    } ${
                      isToday && !isSelected
                        ? "ring-1 ring-inset ring-sibs-border"
                        : ""
                    }`}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-sibs-border px-4 py-3">
            <button
              type="button"
              onClick={clearDate}
              className="rounded-lg px-2 py-1.5 text-xs font-extrabold text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={!todaySelectable}
              onClick={selectToday}
              className="rounded-lg px-2 py-1.5 text-xs font-extrabold text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicNhoScheduleResponsePage() {
  const { token = "" } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: "",
    data: null,
  });
  const [action, setAction] = useState("accept");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("08:00");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    let active = true;

    fetch(getResponseUrl(token))
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || "Unable to load the NHO schedule.",
          );
        }

        if (!active) return;

        setState({
          loading: false,
          error: "",
          data: payload.data,
        });

        setRescheduleDate(payload.data?.earliestFriday || "");
        setRescheduleTime(
          normalizeNhoTime(
            payload.data?.scheduledTime ||
              payload.data?.scheduled_time ||
              "08:00",
          ) || "08:00",
        );
      })
      .catch((error) => {
        if (!active) return;

        setState({
          loading: false,
          error: error?.message || "Unable to load the NHO schedule.",
          data: null,
        });
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function submitResponse() {
    if (submitting) return;

    if (action === "reschedule" && !rescheduleDate) {
      setState((current) => ({
        ...current,
        error: "Please select another Friday.",
      }));
      return;
    }

    if (
      action === "reschedule" &&
      !isSelectableNhoFriday(
        rescheduleDate,
        state.data?.earliestFriday || "",
      )
    ) {
      setState((current) => ({
        ...current,
        error: "Please select an available Friday from the calendar.",
      }));
      return;
    }

    if (
      action === "reschedule" &&
      !isNhoTimeWithinAvailableWindow(rescheduleTime)
    ) {
      setState((current) => ({
        ...current,
        error: "Please select an NHO time from 8:00 AM through 6:00 PM.",
      }));
      return;
    }

    setSubmitting(true);
    setState((current) => ({ ...current, error: "" }));

    try {
      const response = await fetch(getResponseUrl(token), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          date: action === "reschedule" ? rescheduleDate : undefined,
          time: action === "reschedule" ? rescheduleTime : undefined,
          startTime: action === "reschedule" ? rescheduleTime : undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || "Unable to save your NHO schedule response.",
        );
      }

      setResult(
        payload?.message ||
          "Your NHO schedule response was saved successfully.",
      );
    } catch (error) {
      setState((current) => ({
        ...current,
        error:
          error?.message || "Unable to save your NHO schedule response.",
      }));
    } finally {
      setSubmitting(false);
    }
  }

  const displayedNhoDate =
    action === "reschedule" && rescheduleDate
      ? rescheduleDate
      : state.data?.scheduledDate || "";
  const displayedNhoTime =
    action === "reschedule"
      ? rescheduleTime
      : state.data?.scheduledTime ||
        state.data?.scheduled_time ||
        "";
  const displayedEmploymentStartDate =
    getEmploymentStartDateForNho(displayedNhoDate);

  return (
    <main className="min-h-screen bg-sibs-canvas px-4 py-10 font-jakarta">
      <section className="mx-auto max-w-3xl overflow-visible rounded-[14px] border border-sibs-border bg-white shadow-xl">
        <header className="relative overflow-hidden rounded-t-[14px] border-t-4 border-sibs-orange bg-sibs-navy px-6 py-6 text-white">
          <img
            src="/SiBSLogoWhite.png"
            alt="SiBS"
            className="mx-auto h-24 w-auto max-w-[360px] sm:h-28"
          />
          <h1 className="mt-4 text-center text-2xl font-extrabold text-white">
            NHO Schedule Response
          </h1>
        </header>

        <div className="p-6 sm:p-8">
          {state.loading && (
            <div className="flex items-center justify-center gap-2 py-12 font-bold text-sibs-muted">
              <Loader2 size={18} className="animate-spin" />
              Loading NHO schedule...
            </div>
          )}

          {state.error && (
            <div className="mb-5 rounded-[10px] border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              {state.error}
            </div>
          )}

          {result && (
            <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={38} />
              <p className="mt-3 font-extrabold text-emerald-800">{result}</p>
            </div>
          )}

          {!state.loading && !result && state.data && (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-extrabold text-sibs-navy">
                  Hi {state.data.candidateName},
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-sibs-muted">
                  Your New Hire Orientation has been scheduled. You may accept
                  the proposed schedule or choose another available Friday.
                </p>
              </div>

              <div className="rounded-[10px] border border-sibs-border bg-sibs-surface p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-muted">
                  {action === "reschedule" ? "Requested NHO Schedule" : "Proposed NHO Schedule"}
                </p>
                <p className="mt-2 text-xl font-extrabold text-sibs-navy">
                  {formatFriday(displayedNhoDate)}
                </p>
                <p className="mt-1 text-sm font-extrabold text-sibs-text-secondary">
                  {formatNhoTime(displayedNhoTime)}
                </p>
                <div className="mt-4 rounded-[10px] border border-sky-100 bg-sky-50/70 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-muted">
                    Employment Start Date
                  </p>
                  <p className="mt-1 text-base font-extrabold text-sibs-navy">
                    {formatFriday(displayedEmploymentStartDate)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-sibs-muted">
                    Automatically set to the Monday immediately after NHO.
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold text-sibs-muted">
                  {state.data.roleTitle || "Position"}
                  {state.data.account ? ` · ${state.data.account}` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAction("accept")}
                  className={`rounded-[10px] border-2 p-5 text-left transition ${
                    action === "accept"
                      ? "border-sibs-orange bg-sibs-cream-subtle text-sibs-navy"
                      : "border-sibs-border bg-white text-sibs-navy hover:bg-sibs-surface"
                  }`}
                >
                  <CheckCircle2 size={22} className={action === "accept" ? "text-sibs-orange" : "text-sibs-navy"} />
                  <p className="mt-3 font-extrabold text-sibs-navy">
                    Accept Schedule
                  </p>
                  <p className="mt-1 text-sm text-sibs-muted">
                    Confirm the proposed Friday.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAction("reschedule")}
                  className={`rounded-[10px] border-2 p-5 text-left transition ${
                    action === "reschedule"
                      ? "border-sibs-orange bg-sibs-cream-subtle text-sibs-navy"
                      : "border-sibs-border bg-white text-sibs-navy hover:bg-sibs-surface"
                  }`}
                >
                  <RotateCcw size={22} className={action === "reschedule" ? "text-sibs-orange" : "text-sibs-navy"} />
                  <p className="mt-3 font-extrabold text-sibs-navy">
                    Reschedule
                  </p>
                  <p className="mt-1 text-sm text-sibs-muted">
                    Choose another Friday and available time.
                  </p>
                </button>
              </div>

              {action === "reschedule" && (
                <div className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-sibs-navy">
                    Select another Friday
                  </span>

                  <NhoFridayDatePicker
                    value={rescheduleDate}
                    earliestFriday={state.data?.earliestFriday || ""}
                    disabled={submitting}
                    onChange={(value) => {
                      setRescheduleDate(value);
                      setState((current) => ({ ...current, error: "" }));
                    }}
                  />

                  <div className="mt-4">
                    <PublicNhoTimePicker
                      value={rescheduleTime}
                      disabled={submitting}
                      onChange={(value) => {
                        setRescheduleTime(value);
                        setState((current) => ({
                          ...current,
                          error: "",
                        }));
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs font-semibold text-sibs-muted">
                    NHO scheduling is available on Fridays only, from 8:00 AM through 6:00 PM. If the approved NHO date changes, your employment start date automatically moves to the following Monday.
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={submitResponse}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-sibs-navy px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CalendarDays size={17} />
                )}
                {submitting
                  ? "Saving Response..."
                  : action === "accept"
                    ? "Confirm NHO Schedule"
                    : "Confirm Reschedule"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
