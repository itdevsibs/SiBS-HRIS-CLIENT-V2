
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

  return date.toLocaleDateString("en-PH", {
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
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-[#F8FAFC] px-3 text-left text-xs font-bold outline-none transition ${
          open
            ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
            : "border-[#D7DEE8] hover:border-[#FF5C28]/40 hover:bg-white"
        } ${
          disabled
            ? "cursor-not-allowed bg-[#F2F4F7] text-[#98A2B3] opacity-70"
            : "text-[#042C51]"
        }`}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={15}
          className={`shrink-0 text-[#315B7E] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[130] max-h-[220px] w-full overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_20px_25px_-5px_rgba(4,44,81,0.16),0_8px_10px_-6px_rgba(4,44,81,0.14)]">
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
                      ? "cursor-not-allowed bg-white text-[#C8D2DE]"
                      : active
                        ? "bg-[#FFF4EF] text-[#FF5C28]"
                        : "bg-white text-[#31465B] hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
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
    <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
            NHO Time
          </p>
          <p className="mt-1 text-xs font-extrabold text-[#042C51]">
            {formatNhoTime(value)}
          </p>
        </div>

      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <div>
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#7D8FA5]">
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
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#7D8FA5]">
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
          <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-[#7D8FA5]">
            AM/PM
          </label>

          <div className="flex h-10 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white">
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
                    ? "bg-[#FF5C28] text-white"
                    : "bg-white text-[#315B7E] hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold text-[#667085]">
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

  return date.toLocaleDateString("en-PH", {
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
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold text-[#0D4676] outline-none transition duration-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
          open
            ? "border-[#FF5A2A] ring-4 ring-[#FF5A2A]/10"
            : "border-[#D0D5DD] hover:border-[#0D4676]/30 hover:bg-[#F8FAFC]"
        }`}
      >
        <span className={value ? "text-[#0D4676]" : "text-slate-400"}>
          {formatDatePickerValue(value)}
        </span>
        <CalendarDays size={18} className="shrink-0 text-[#FF5A2A]" />
      </button>

      {open && !disabled && (
        <div
          role="dialog"
          aria-label="Select another Friday"
          className="absolute left-0 top-[calc(100%+8px)] z-[100] w-[320px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
        >
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
            <button
              type="button"
              disabled={previousMonthDisabled}
              onClick={goPreviousMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#0D4676] transition hover:bg-[#EAF2FB] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <p className="text-sm font-extrabold text-[#0D4676]">
              {displayDate.toLocaleDateString("en-PH", {
                month: "long",
                year: "numeric",
              })}
            </p>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#0D4676] transition hover:bg-[#EAF2FB]"
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
                    className="pb-2 text-[11px] font-extrabold text-[#174A7C]"
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
                        ? "cursor-default text-[#C5CED8]"
                        : isSelected
                          ? "bg-[#FFF0EA] text-[#FF5A2A]"
                          : selectable
                            ? "text-[#0D4676] hover:bg-[#EAF2FB]"
                            : "cursor-not-allowed text-[#B5C0CC]"
                    } ${
                      isToday && !isSelected
                        ? "ring-1 ring-inset ring-[#D0D5DD]"
                        : ""
                    }`}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E6ECF2] px-4 py-3">
            <button
              type="button"
              onClick={clearDate}
              className="rounded-lg px-2 py-1.5 text-xs font-extrabold text-[#0D4676] transition hover:bg-[#F2F6FA]"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={!todaySelectable}
              onClick={selectToday}
              className="rounded-lg px-2 py-1.5 text-xs font-extrabold text-[#0D4676] transition hover:bg-[#F2F6FA] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
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
    <main className="min-h-screen bg-slate-100 px-4 py-10 font-jakarta">
      <section className="mx-auto max-w-3xl overflow-visible rounded-2xl border border-slate-200 bg-white shadow-xl">
        <header className="rounded-t-2xl bg-[#042C51] px-6 py-6 text-white">
          <img
            src="/SiBSLogoWhite.png"
            alt="SiBS"
            className="mx-auto h-24 w-auto max-w-[360px] sm:h-28"
          />
          <h1 className="mt-4 text-center text-2xl font-extrabold">
            NHO Schedule Response
          </h1>
        </header>

        <div className="p-6 sm:p-8">
          {state.loading && (
            <div className="flex items-center justify-center gap-2 py-12 font-bold text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Loading NHO schedule...
            </div>
          )}

          {state.error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              {state.error}
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={38} />
              <p className="mt-3 font-extrabold text-emerald-800">{result}</p>
            </div>
          )}

          {!state.loading && !result && state.data && (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-extrabold text-[#042C51]">
                  Hi {state.data.candidateName},
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Your New Hire Orientation has been scheduled. You may accept
                  the proposed schedule or choose another available Friday.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  {action === "reschedule" ? "Requested NHO Schedule" : "Proposed NHO Schedule"}
                </p>
                <p className="mt-2 text-xl font-extrabold text-[#042C51]">
                  {formatFriday(displayedNhoDate)}
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#344054]">
                  {formatNhoTime(displayedNhoTime)}
                </p>
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#53708D]">
                    Employment Start Date
                  </p>
                  <p className="mt-1 text-base font-extrabold text-[#042C51]">
                    {formatFriday(displayedEmploymentStartDate)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Automatically set to the Monday immediately after NHO.
                  </p>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  {state.data.roleTitle || "Position"}
                  {state.data.account ? ` · ${state.data.account}` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAction("accept")}
                  className={`rounded-2xl border p-5 text-left transition ${
                    action === "accept"
                      ? "border-[#042C51] bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <CheckCircle2 size={22} className="text-[#042C51]" />
                  <p className="mt-3 font-extrabold text-[#042C51]">
                    Accept Schedule
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Confirm the proposed Friday.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAction("reschedule")}
                  className={`rounded-2xl border p-5 text-left transition ${
                    action === "reschedule"
                      ? "border-[#042C51] bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <RotateCcw size={22} className="text-[#042C51]" />
                  <p className="mt-3 font-extrabold text-[#042C51]">
                    Reschedule
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose another Friday and available time.
                  </p>
                </button>
              </div>

              {action === "reschedule" && (
                <div className="block">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
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

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    NHO scheduling is available on Fridays only, from 8:00 AM through 6:00 PM. If the approved NHO date changes, your employment start date automatically moves to the following Monday.
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={submitResponse}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#042C51] px-5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
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
