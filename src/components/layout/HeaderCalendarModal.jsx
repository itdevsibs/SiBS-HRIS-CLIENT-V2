import { formatHrisDateLocalized, formatHrisTimeLocalized } from "@/lib/axios/dateFormatter";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Filter,
  Grid3X3,
  Link2,
  LogOut,
  List,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  getGoogleCalendarConnectUrl,
  getGoogleCalendarStatus,
  getGoogleCalendarEvents,
  previewHrisCalendarOrphans,
  cleanupHrisCalendarOrphans,
  getGoogleCalendarBusyTimes,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  disconnectGoogleCalendar,
} from "@/lib/axios/googleCalendarApi";
import useHeaderCalendarPortal from "../../hooks/useHeaderCalendarPortal";
import HeaderCalendarModalShell from "./HeaderCalendarModalShell";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { buildCalendarDisplayEvents, sourceCalendarEvent } from "./calendarAvailabilityVisibility";
import DatePicker from "@/components/ui/DatePicker.jsx";
import { getManilaClock } from "@/lib/axios/getAuditNotifications";

const MONTH_NAMES = [
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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CATEGORY_OPTIONS = [
  "All Categories",
  "Talent Acquisition",
  "Human Resources",
  "Operations",
  "HR Sync",
  "Training & Onboarding",
];

const STATUS_OPTIONS = [
  "All Statuses",
  "Scheduled",
  "In Progress",
  "Rescheduled",
  "Done",
];

// Match event indicators to existing Google Calendar theme colors without
// duplicating the full desktop event chips in narrow mobile day cells.
const EVENT_DOT_COLORS = {
  blue: "bg-blue-500",
  peacock: "bg-sky-500",
  amber: "bg-amber-400",
  emerald: "bg-emerald-500",
  tomato: "bg-orange-500",
  grape: "bg-violet-500",
  graphite: "bg-slate-500",
};

const EVENT_COLORS = {
  blue: "border-blue-200 bg-blue-50 text-sibs-navy",
  peacock: "border-sky-200 bg-sky-50 text-sky-700",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  tomato: "border-orange-200 bg-orange-50 text-orange-800",
  grape: "border-violet-200 bg-violet-50 text-violet-800",
  graphite: "border-slate-200 bg-slate-50 text-slate-700",
};

const COLOR_OPTIONS = [
  {
    value: "blue",
    label: "Blue",
    dotClass: "bg-blue-500",
    googleColorId: "1",
  },
  {
    value: "peacock",
    label: "Peacock Blue",
    dotClass: "bg-sky-500",
    googleColorId: "7",
  },
  {
    value: "emerald",
    label: "Sage Green",
    dotClass: "bg-emerald-500",
    googleColorId: "2",
  },
  {
    value: "grape",
    label: "Grape Purple",
    dotClass: "bg-violet-500",
    googleColorId: "3",
  },
  {
    value: "tomato",
    label: "Tomato Orange",
    dotClass: "bg-orange-500",
    googleColorId: "6",
  },
  {
    value: "amber",
    label: "Banana Yellow",
    dotClass: "bg-amber-400",
    googleColorId: "5",
  },
  {
    value: "graphite",
    label: "Graphite",
    dotClass: "bg-slate-500",
    googleColorId: "8",
  },
];

const EVENT_COLOR_BY_GOOGLE_COLOR_ID = COLOR_OPTIONS.reduce(
  (mappedColors, option) => ({
    ...mappedColors,
    [option.googleColorId]: option.value,
  }),
  {},
);

// Fixed SiBS HRIS branch/site options shared by all Calendar schedule types.
const SITE_OPTIONS = [
  { value: "", label: "Select site" },
  { value: "Davao Branch", label: "Davao Branch" },
  { value: "Tagum Branch", label: "Tagum Branch" },
  { value: "Mabini Branch", label: "Mabini Branch" },
];

// Read previously saved site values without changing existing schedule records.
function normalizeCalendarSite(value) {
  const site = String(value || "").trim();
  if (/^davao(?:\s+(?:site|branch))?$/i.test(site)) return "Davao Branch";
  if (/^tagum(?:\s+(?:site|branch))?$/i.test(site)) return "Tagum Branch";
  if (/^mabini(?:\s+(?:site|branch))?$/i.test(site)) return "Mabini Branch";
  return site;
}
const AVAILABILITY_OPTIONS = ["Busy", "Free"];
const VISIBILITY_OPTIONS = ["Default visibility", "Public", "Private"];
const GOOGLE_CALENDAR_UI_SYNC_TIMEOUT_MS = 20000;
// Google OAuth can isolate the popup using Cross-Origin-Opener-Policy. Never
// inspect its closed property; use the OAuth message and status API.
const GOOGLE_CALENDAR_CONNECT_POLL_MS = 2000;
const GOOGLE_CALENDAR_CONNECT_MAX_POLLS = 90;

// Use one consistent SIBS prefix in new and edited HRIS calendar schedules.
const SIBS_HRIS_CALENDAR_TITLE_PREFIX = "SiBS HRIS - ";

function calendarTitleSuffix(value) {
  return String(value || "")
    .trim()
    .replace(/^(?:SiBS\s+HRIS\s*-\s*)+/i, "")
    .trim();
}

function withSibsHrisCalendarTitle(value, fallback = "Untitled Schedule") {
  return `${SIBS_HRIS_CALENDAR_TITLE_PREFIX}${calendarTitleSuffix(value) || fallback}`;
}


// Offer suggested times and an editable 12-hour time with an explicit AM/PM choice.
// Interview availability stays within 10:00 AM–5:30 PM; custom minutes are allowed.
// Standard event proposals use 30-minute defaults with 8 AM–5 PM boundaries.
// Interview availability can span hours and is intentionally not forced to 30 minutes.
const EVENT_FIRST_MINUTE = 8 * 60;
const EVENT_LAST_MINUTE = 17 * 60;
const EVENT_DEFAULT_DURATION = 30;
const INTERVIEW_AVAILABILITY_START_MINUTES = 10 * 60;
const INTERVIEW_AVAILABILITY_END_MINUTES = 17 * 60 + 30;

function timeLabelToMinutes(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hour = Number(match[1]);
  const minutes = Number(match[2]);
  if (hour < 1 || hour > 12 || minutes > 59) return null;
  return (hour % 12) * 60 + minutes + (match[3].toUpperCase() === "PM" ? 720 : 0);
}

function minutesToTimeLabel(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

// Calendar cutoffs are calculated from Manila instants, independent of the
// browser's timezone. The header/calendar clock is synchronized with HRIS.
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function getManilaDateKey(epochMs) {
  return new Date(epochMs + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

function isPastCalendarDay(dateKey, epochMs) {
  return Boolean(dateKey) && dateKey < getManilaDateKey(epochMs);
}

function isPastCalendarTime(dateKey, timeLabel, epochMs) {
  if (!dateKey) return true;
  if (timeLabel === "All Day") return isPastCalendarDay(dateKey, epochMs);
  const value = calendarLocalTimeMs(dateKey, timeLabel);
  return !Number.isFinite(value) || value < epochMs;
}

function isPastCalendarEvent(event, epochMs) {
  return isPastCalendarTime(event?.date, event?.startTime || "All Day", epochMs);
}

// Preset intervals are 15 minutes. Give each new schedule a future slot;
// don't silently choose an earlier hour when adding an event today.
function getNextAvailableStartMinute(dateKey, epochMs) {
  if (dateKey !== getManilaDateKey(epochMs)) return 9 * 60;
  const midnight = Date.parse(`${dateKey}T00:00:00+08:00`);
  const nextQuarter = Math.ceil((epochMs - midnight + 1) / (15 * 60_000)) * 15;
  return Math.max(EVENT_FIRST_MINUTE, nextQuarter);
}

function canCreateCalendarEventOnDate(dateKey, epochMs) {
  if (!dateKey || isPastCalendarDay(dateKey, epochMs)) return false;
  if (dateKey > getManilaDateKey(epochMs)) return true;
  return getNextAvailableStartMinute(dateKey, epochMs) <= EVENT_LAST_MINUTE - EVENT_DEFAULT_DURATION;
}

// Empty historical dates are inert. Historical dates with visible schedule
// records can be opened only for viewing those records (never for creation).
function canOpenCalendarDay(dateKey, eventCount, epochMs) {
  return canCreateCalendarEventOnDate(dateKey, epochMs) || eventCount > 0;
}

// Shared clock with the HRIS header: use server epoch when available, and
// continue ticking locally while disconnected. Re-sync on tab focus.
function useManilaCalendarClock(enabled) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const offsetRef = useRef(0);
  const getNowMs = useCallback(() => Date.now() + offsetRef.current, []);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const tick = () => { if (!cancelled) setNowMs(getNowMs()); };
    const sync = async () => {
      try {
        const began = Date.now();
        const result = await getManilaClock();
        const received = Date.now();
        const serverEpoch = Number(result?.serverEpochMs);
        if (!cancelled && Number.isFinite(serverEpoch) && serverEpoch > 0) {
          offsetRef.current = serverEpoch + (received - began) / 2 - received;
          tick();
        }
      } catch {
        // Offline clock fallback; final validation still uses a live instant.
      }
    };
    tick();
    void sync();
    const interval = window.setInterval(tick, 5000);
    const resync = window.setInterval(sync, 5 * 60_000);
    const onFocus = () => { tick(); void sync(); };
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearInterval(resync);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, getNowMs]);
  return { nowMs, getNowMs };
}

/** Turn hand-typed times into the existing API's HH:MM AM/PM format. */
function normalizeTypedTime(input, fallbackMeridiem = "AM") {
  const value = String(input || "").trim().toUpperCase().replace(/\./g, "");
  const match = value.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM|A|P)?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (minute > 59 || hour > 23 || hour < 0) return null;
  const typedMeridiem = match[3]?.startsWith("P") ? "PM" : match[3]?.startsWith("A") ? "AM" : null;
  if (hour > 12 || hour === 0) {
    if (typedMeridiem) return null;
    return minutesToTimeLabel(hour * 60 + minute);
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${typedMeridiem || fallbackMeridiem}`;
}

function getTimeSelectionError(value, { isInterviewAvailability, isEventTime, isEndTime, startTime, date, nowMs }) {
  const minutes = timeLabelToMinutes(value);
  if (minutes === null) return "Enter a valid time, such as 02:15 PM.";
  if (date && Number.isFinite(nowMs) && isPastCalendarTime(date, value, nowMs)) {
    return "This time has already passed in Philippine time. Choose a future time.";
  }
  if (isInterviewAvailability) {
    const earliest = INTERVIEW_AVAILABILITY_START_MINUTES + (isEndTime ? 30 : 0);
    const latest = INTERVIEW_AVAILABILITY_END_MINUTES - (isEndTime ? 0 : 30);
    if (minutes < earliest || minutes > latest) {
      return `Choose a time from ${minutesToTimeLabel(earliest)} to ${minutesToTimeLabel(latest)}.`;
    }
  }
  if (isEventTime) {
    const earliest = EVENT_FIRST_MINUTE + (isEndTime ? EVENT_DEFAULT_DURATION : 0);
    const latest = EVENT_LAST_MINUTE - (isEndTime ? 0 : EVENT_DEFAULT_DURATION);
    if (minutes < earliest || minutes > latest) {
      return `Choose a time from ${minutesToTimeLabel(earliest)} to ${minutesToTimeLabel(latest)}.`;
    }
  }
  if (!isEndTime && minutes >= 23 * 60 + 59) {
    return "Start time must be before 11:59 PM.";
  }
  if (isEndTime) {
    const start = timeLabelToMinutes(startTime);
    const minGap = isInterviewAvailability || isEventTime ? 30 : 1;
    if (start !== null && minutes < start + minGap) {
      return `End time must be at least ${minGap} minute${minGap > 1 ? "s" : ""} after the start.`;
    }
  }
  return "";
}

// Conflict checks use the authoritative Asia/Manila wall-clock date, not the browser timezone.
function calendarLocalTimeMs(date, time) {
  const sqlTime = parseTimeLabel(date, time);
  return Date.parse(`${sqlTime}+08:00`);
}

function calendarTimeOverlaps(busy, start, end) {
  return Array.isArray(busy) && busy.some((entry) => start < Number(entry.end) && Number(entry.start) < end);
}

function isTimeOptionTaken({ time, isEndTime, startTime, date, busy, isInterviewAvailability, isEventTime = false }) {
  const minutes = timeLabelToMinutes(time);
  if (minutes === null || !date) return false;
  if (isEndTime) {
    const start = calendarLocalTimeMs(date, startTime);
    const end = calendarLocalTimeMs(date, time);
    return Number.isFinite(start) && Number.isFinite(end) && calendarTimeOverlaps(busy, start, end);
  }
  const duration = isInterviewAvailability || isEventTime ? 30 : 15;
  const start = calendarLocalTimeMs(date, time);
  return Number.isFinite(start) && calendarTimeOverlaps(busy, start, start + duration * 60000);
}

/** Editable, searchable select: type in the time field, not inside the dropdown. */
function CalendarTimePicker({
  label,
  value,
  options,
  isInterviewAvailability,
  isEventTime = false,
  isEndTime = false,
  startTime,
  date,
  nowMs,
  getNowMs,
  busy = [],
  busyLoading = false,
  isOpen,
  onToggle,
  onChange,
  onClose,
}) {
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const optionsRef = useRef(null);
  const listId = React.useId();
  const [search, setSearch] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [meridiem, setMeridiem] = useState("AM");
  const [error, setError] = useState("");
  const [placement, setPlacement] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return;
    // Keep the selected time visible in the trigger and search in the popover,
    // just like the shared calendar date picker.
    setSearch("");
    setIsFiltering(false);
    setError("");
    const matching = String(value || "").match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
    setManualTime(matching?.[1] || "");
    setMeridiem(matching?.[2]?.toUpperCase() || "AM");
    // Search receives focus after opening; the trigger continues to show its value.
    const frame = requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const updatePlacement = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = Math.min(300, window.innerWidth - 16);
    const panelHeight = Math.min(panelRef.current?.offsetHeight || 410, window.innerHeight - 16);
    const availableBelow = window.innerHeight - rect.bottom - 8;
    const availableAbove = rect.top - 8;
    const showAbove = availableBelow < panelHeight + 6 && availableAbove > availableBelow;
    const top = showAbove ? rect.top - panelHeight - 6 : rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8));
    setPlacement({ top: Math.max(8, Math.min(top, window.innerHeight - panelHeight - 8)), left });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePlacement();
    const onOutsidePointer = (event) => {
      if (!triggerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", onOutsidePointer);
    window.addEventListener("resize", updatePlacement);
    const onPageScroll = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      updatePlacement();
    };
    window.addEventListener("scroll", onPageScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointer);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", onPageScroll, true);
    };
  }, [isOpen, onClose, updatePlacement]);

  const filteredOptions = useMemo(() => {
    if (!isFiltering) return options;
    const needle = search.toLowerCase().replace(/\s+/g, "");
    return options.filter((time) => time.toLowerCase().replace(/\s+/g, "").includes(needle));
  }, [options, search, isFiltering]);

  useEffect(() => {
    if (!isOpen || isFiltering) return;
    const list = optionsRef.current;
    const selected = list?.querySelector('[data-current="true"]');
    if (list && selected) {
      const offset = selected.getBoundingClientRect().top - list.getBoundingClientRect().top;
      list.scrollTop = Math.max(0, list.scrollTop + offset - list.clientHeight / 2);
    }
  }, [isOpen, isFiltering]);

  function selectTime(candidate) {
    const normalized = normalizeTypedTime(candidate, meridiem);
    const nextError = getTimeSelectionError(normalized, {
      isInterviewAvailability, isEventTime, isEndTime, startTime, date, nowMs: getNowMs(),
    });
    if (nextError) {
      setError(nextError);
      return;
    }
    if (busyLoading) {
      setError("Checking your calendar availability. Please wait.");
      return;
    }
    if (isTimeOptionTaken({
      time: normalized, isEndTime, startTime, date, busy, isInterviewAvailability, isEventTime,
    })) {
      setError("This time overlaps another schedule on your calendar.");
      return;
    }
    onChange(normalized);
    onClose();
  }

  function applyManualTime() {
    selectTime(manualTime);
  }

  function handleInputKeyDown(event) {
    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        onClose();
        inputRef.current?.blur();
        event.stopPropagation();
      }
    } else if (event.key === "ArrowDown" && !isOpen) {
      event.preventDefault();
      onToggle();
    } else if (event.key === "Enter") {
      event.preventDefault(); // Do not submit the enclosing event form.
      if (!isOpen) { onToggle(); return; }
      if (!search.trim()) return;
      // A complete typed HH:MM (with optional AM/PM) is a custom selection.
      // A partial query selects its first matching suggestion.
      const typedTime = normalizeTypedTime(search, meridiem);
      const exactMatch = filteredOptions.find((time) => time.toUpperCase() === search.trim().toUpperCase());
      if (isFiltering && typedTime && (search.includes(":") || /(?:AM|PM|A|P)$/i.test(search.trim()))) {
        selectTime(typedTime);
      } else if (exactMatch) {
        selectTime(exactMatch);
      } else if (filteredOptions.length) {
        const firstAvailable = filteredOptions.find((time) =>
          !isPastCalendarTime(date, time, nowMs) && !isTimeOptionTaken({
            time, isEndTime, startTime, date, busy, isInterviewAvailability, isEventTime,
          }));
        if (firstAvailable) selectTime(firstAvailable);
        else setError("All matching times are already scheduled.");
      } else if (typedTime) {
        selectTime(typedTime);
      } else {
        setError("Enter a valid time, such as 02:15 PM, or choose a suggestion.");
      }
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        role="group"
        aria-label={`${label}: ${value || "Select time"}`}
        onClick={(event) => { if (event.target === event.currentTarget) onToggle(); }}
        className={`sibs-calendar-dropdown-trigger flex h-9 w-[132px] min-w-0 items-center justify-between gap-1 rounded-[10px] border px-3 text-left font-jakarta text-[12px] font-bold text-sibs-navy shadow-sm outline-none transition-all duration-200 ${isOpen ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10" : "border-sibs-border bg-sibs-surface hover:border-sibs-orange/40 hover:bg-white"}`}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-label={`${label}: search or type a time`}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          value={isOpen ? search : (value || "")}
          placeholder={isOpen ? "Search time..." : "Select time"}
          onClick={() => { if (!isOpen) onToggle(); }}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsFiltering(true);
            setError("");
            if (!isOpen) onToggle();
          }}
          onKeyDown={handleInputKeyDown}
          className="sibs-calendar-dropdown-input h-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 font-jakarta text-[12px] font-bold text-sibs-navy outline-none ring-0 shadow-none placeholder:text-sibs-muted"
        />
        <button
          type="button"
          aria-label={`${isOpen ? "Close" : "Open"} ${label.toLowerCase()} suggestions`}
          aria-expanded={isOpen}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onToggle}
          className="sibs-calendar-dropdown-arrow flex h-6 w-4 shrink-0 items-center justify-center rounded text-sibs-muted hover:cursor-pointer hover:text-sibs-orange"
        >
          <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="sibs-dropdown-pop-in fixed z-[2147483600] w-[282px] overflow-hidden rounded-xl border border-sibs-border-subtle bg-white font-jakarta text-sibs-navy shadow-[0_16px_36px_rgba(4,44,81,0.16)]"
          style={{ top: placement.top, left: placement.left, width: Math.min(282, typeof window !== "undefined" ? window.innerWidth - 16 : 282) }}
        >
          <div id={listId} ref={optionsRef} className="sibs-scrollbar max-h-[155px] overflow-y-auto overscroll-contain py-1" role="listbox" aria-label={`${label} suggested times`}>
            {busyLoading ? (
              <p className="px-3 py-3 text-xs font-semibold text-sibs-muted">Checking booked times...</p>
            ) : filteredOptions.length ? filteredOptions.map((time) => {
              const expired = isPastCalendarTime(date, time, nowMs);
              const taken = isTimeOptionTaken({
                time, isEndTime, startTime, date, busy, isInterviewAvailability, isEventTime,
              });
              return (
              <button
                key={time}
                disabled={taken || expired}
                title={expired ? "This time has passed (Asia/Manila)" : taken ? "Already scheduled for your account" : "Select time"}
                type="button"
                role="option"
                aria-selected={time === value}
                data-current={time === value}
                onClick={() => selectTime(time)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left font-jakarta text-[12px] transition ${taken || expired ? "cursor-not-allowed bg-slate-50 text-slate-400 opacity-70" : "hover:cursor-pointer hover:bg-sibs-cream-subtle hover:text-sibs-orange"} ${!taken && !expired && time === value ? "bg-sibs-cream-light font-extrabold text-sibs-orange" : "font-semibold"}`}
              >
                <span>{time}</span>
                {expired ? <span className="text-[10px] font-bold text-slate-500">Passed</span> : taken ? <span className="text-[10px] font-bold text-rose-500">Booked</span> : null}
              </button>
            );}) : <div className="px-3 py-3 text-xs text-sibs-text-secondary">No preset match. Press Enter for a custom time or use the editor below.</div>}
          </div>
          <div className="border-t border-sibs-border-subtle bg-sibs-canvas p-2.5">
            <label htmlFor={`${label.replace(/\s+/g, "-")}-custom-time`} className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-sibs-text-secondary">Custom time</label>
            <div className="flex items-center gap-1.5">
              <input
                id={`${label.replace(/\s+/g, "-")}-custom-time`}
                type="text"
                inputMode="numeric"
                aria-label={`${label} custom hours and minutes`}
                placeholder="HH:MM"
                value={manualTime}
                onChange={(event) => { setManualTime(event.target.value); setError(""); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); applyManualTime(); }
                }}
                className="h-9 min-w-0 flex-1 rounded-[8px] border border-sibs-border-subtle bg-white px-2.5 text-xs font-bold outline-none focus:border-sibs-orange"
              />
              <div className="flex h-9 overflow-hidden rounded-[8px] border border-sibs-border-subtle bg-white" role="group" aria-label={`${label} AM or PM`}>
                {["AM", "PM"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={meridiem === option}
                    onClick={() => { setMeridiem(option); setError(""); }}
                    className={`px-1.5 text-[10px] font-black transition hover:cursor-pointer ${meridiem === option ? "bg-sibs-navy text-white" : "text-sibs-text-secondary hover:bg-sibs-canvas"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={applyManualTime}
                className="h-9 rounded-[8px] bg-sibs-navy px-3 text-[11px] font-black text-white transition hover:cursor-pointer hover:brightness-95"
              >
                Apply
              </button>
            </div>
            {error && <p role="alert" className="mt-2 text-[11px] font-semibold leading-snug text-red-600">{error}</p>}
            <p className="mt-1.5 text-[10px] font-medium text-sibs-text-secondary">Search above or enter HH:MM and choose AM/PM.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** Same single-border searchable dropdown design used for Department in Employee Directory. */
function CalendarOptionDropdown({ label, value, options, onChange, widthClass = "w-[160px]", searchable = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState({ top: 0, left: 0, width: 160, maxHeight: 250 });
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const listId = React.useId();

  const normalized = useMemo(() => options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  ), [options]);
  const displayValue = normalized.find((option) => option.value === value)?.label || String(value || "");
  const filtered = useMemo(() => normalized.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  ), [normalized, query]);

  const close = useCallback(() => { setIsOpen(false); setQuery(""); }, []);
  const toggle = () => { if (isOpen) close(); else setIsOpen(true); };
  const choose = (nextValue) => { onChange(nextValue); close(); };

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(Math.max(rect.width, 260), window.innerWidth - 20);
    const maxHeight = Math.min(295, Math.max(130, window.innerHeight - 20));
    const below = window.innerHeight - rect.bottom - 10;
    const above = rect.top - 10;
    const flip = below < Math.min(maxHeight, 180) && above > below;
    const availableHeight = Math.max(95, Math.min(maxHeight, (flip ? above : below) - 6));
    const panelHeight = Math.min(panelRef.current?.offsetHeight || maxHeight, availableHeight);
    setPlacement({
      top: Math.max(8, flip ? rect.top - panelHeight - 6 : rect.bottom + 6),
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      maxHeight: availableHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    setQuery("");
    updatePosition();
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    const onOutside = (event) => {
      if (!triggerRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) close();
    };
    const onEscape = (event) => {
      if (event.key === "Escape") { event.preventDefault(); close(); inputRef.current?.blur(); }
    };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, close, updatePosition]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`sibs-calendar-dropdown-trigger flex h-9 min-w-0 items-center gap-2 rounded-[10px] border px-3 font-jakarta text-[12px] font-bold text-sibs-navy shadow-sm transition-all duration-200 ${widthClass} ${isOpen ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10" : "border-sibs-border bg-sibs-surface hover:border-sibs-orange/40 hover:bg-white"}`}
      >
        {searchable ? (
          <input
            ref={inputRef}
            type="text"
            className="sibs-calendar-dropdown-input h-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 font-jakarta text-[12px] font-bold text-sibs-navy outline-none ring-0 shadow-none placeholder:text-sibs-muted"
            autoComplete="off"
            spellCheck={false}
            value={isOpen ? query : displayValue}
            placeholder={isOpen ? `Search ${label.toLowerCase()}...` : label}
            aria-label={`${label} selection`}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listId : undefined}
            onFocus={() => { if (!isOpen) setIsOpen(true); }}
            onClick={() => { if (!isOpen) setIsOpen(true); }}
            onChange={(event) => { setQuery(event.target.value); if (!isOpen) setIsOpen(true); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && !isOpen) { event.preventDefault(); setIsOpen(true); }
              if (event.key === "Enter" && isOpen) {
                event.preventDefault();
                if (filtered.length) choose(filtered[0].value);
              }
            }}
          />
        ) : (
          <button
            ref={inputRef}
            type="button"
            aria-label={`${label}: ${displayValue}`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listId : undefined}
            onClick={toggle}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && !isOpen) { event.preventDefault(); setIsOpen(true); }
            }}
            className="flex h-full min-w-0 flex-1 items-center truncate text-left font-jakarta text-[12px] font-bold text-sibs-navy outline-none"
          >
            {displayValue}
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          className="sibs-calendar-dropdown-arrow flex h-6 w-4 shrink-0 items-center justify-center rounded text-sibs-muted hover:text-sibs-orange"
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggle}
          aria-label={`${isOpen ? "Close" : "Open"} ${label.toLowerCase()} dropdown`}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="sibs-dropdown-pop-in fixed z-[2147483600] overflow-hidden rounded-xl border border-sibs-border-subtle bg-white font-jakarta shadow-[0_16px_36px_rgba(4,44,81,0.16)]"
          style={{ top: placement.top, left: placement.left, width: placement.width, maxHeight: placement.maxHeight }}
        >
          <div className="border-b border-[#E6ECF2] px-4 py-2.5 text-xs font-extrabold text-[#06325E]">Select {label.toLowerCase()}</div>
          <div id={listId} className="sibs-scrollbar max-h-[250px] overflow-y-auto overscroll-contain p-1.5" role="listbox" aria-label={`${label} options`}>
            {filtered.length ? filtered.map((option) => (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => choose(option.value)}
                className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-jakarta text-[12px] transition hover:bg-[#F3F7FC] hover:text-sibs-orange ${option.value === value ? "bg-[#FFF1E9] font-extrabold text-[#E75522]" : "font-semibold text-sibs-text-secondary"}`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check size={14} className="ml-2 shrink-0 text-sibs-orange" />}
              </button>
            )) : (
              <p className="px-3 py-3 text-center text-[11px] font-semibold text-sibs-muted">No matching options</p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function buildTimeSelectOptions({ isInterviewAvailability, isEventTime = false, isEndTime, startTime, selectedTime }) {
  const increment = isInterviewAvailability ? 30 : 15;
  const start = isInterviewAvailability
    ? INTERVIEW_AVAILABILITY_START_MINUTES + (isEndTime ? increment : 0)
    : isEventTime ? EVENT_FIRST_MINUTE + (isEndTime ? EVENT_DEFAULT_DURATION : 0) : 0;
  const end = isInterviewAvailability
    ? INTERVIEW_AVAILABILITY_END_MINUTES - (isEndTime ? 0 : increment)
    : isEventTime ? EVENT_LAST_MINUTE - (isEndTime ? 0 : EVENT_DEFAULT_DURATION)
    : 23 * 60 + 45 - (isEndTime ? 0 : increment);
  const minimumEnd = isEndTime ? timeLabelToMinutes(startTime) : null;
  const gap = isInterviewAvailability || isEventTime ? 30 : 1;
  const values = [];

  for (let minute = start; minute <= end; minute += increment) {
    if (minimumEnd !== null && minute < minimumEnd + gap) continue;
    values.push(minutesToTimeLabel(minute));
  }

  // Keep existing Google events (which may use non-standard minutes) editable.
  // Once changed, new selections follow the configured time increments.
  if (selectedTime && !values.includes(selectedTime)) {
    values.push(selectedTime);
    values.sort((a, b) => (timeLabelToMinutes(a) ?? -1) - (timeLabelToMinutes(b) ?? -1));
  }

  return values;
}

function getEventColorOption(value) {
  return (
    COLOR_OPTIONS.find((option) => option.value === value) || COLOR_OPTIONS[0]
  );
}

function getGoogleVisibilityValue(value) {
  if (value === "Public") return "public";
  if (value === "Private") return "private";
  return "default";
}

function getVisibilityLabel(value) {
  if (value === "public") return "Public";
  if (value === "private") return "Private";
  return "Default visibility";
}

const STATUS_BADGE_CLASSES = {
  Scheduled: "border-blue-200 bg-blue-50 text-sibs-navy",
  "In Progress": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rescheduled: "border-amber-200 bg-amber-50 text-amber-800",
  Done: "border-slate-200 bg-slate-50 text-sibs-text-secondary",
};

function formatDateTimeToDateKey(value) {
  if (!value) return formatDateKey(new Date());

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return formatDateKey(new Date());

  return formatDateKey(date);
}

function formatTimeLabel(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return formatHrisTimeLocalized(date, "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseTimeLabel(dateKey, timeLabel) {
  const cleanTimeLabel = String(timeLabel || "").trim();

  if (!cleanTimeLabel || cleanTimeLabel === "All Day")
    return `${dateKey}T09:00:00`;

  const meridiemMatch = cleanTimeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (meridiemMatch) {
    let hour = Number(meridiemMatch[1]);
    const minute = Number(meridiemMatch[2]);
    const meridiem = meridiemMatch[3].toUpperCase();

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    return `${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  }

  const twentyFourHourMatch = cleanTimeLabel.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    return `${dateKey}T${String(twentyFourHourMatch[1]).padStart(2, "0")}:${twentyFourHourMatch[2]}:00`;
  }

  return `${dateKey}T09:00:00`;
}

function getMonthRange(viewDate) {
  const cells = buildMonthCells(viewDate);
  const firstCell = cells[0];
  const lastCell = cells[cells.length - 1];

  return {
    timeMin: `${firstCell.key}T00:00:00+08:00`,
    timeMax: `${addDays(lastCell.key, 1)}T00:00:00+08:00`,
  };
}

// Google events are not editable simply because they appear on the HRIS calendar.
// New SiBS HRIS events carry an explicit source marker. Older events created by
// this editor carry the full HRIS-only private metadata set; a matching title
// by itself is never enough to grant edit/delete access.
function isHrisOwnedGoogleEvent(event = {}) {
  const properties = event?.extendedProperties?.private || {};
  if (properties.source === "sibs-hris-calendar") return true;
  if (properties.source === "sibs-hris-recruitment") return true;
  const own = (key) => Object.prototype.hasOwnProperty.call(properties, key);
  return /^SiBS\s+HRIS\s*[-–—]/i.test(String(event.summary || "")) &&
    own("scheduleType") && own("category") && own("organizer") &&
    own("addNotification") && own("colorId");
}

// HRIS recruitment sync events remain view-only: edit them in Candidate Pipeline.
// Missing identifiers or outside calendar events cannot be updated from this UI.
function isEditableHrisCalendarEvent(event = {}) {
  if (!event.id && !event.googleEventId) return true; // New HRIS event draft.
  return event.hrisManaged === true && !event.recruitmentEventType;
}

function normalizeGoogleCalendarEvent(event = {}, googleAccount = {}) {
  const privateProperties = event?.extendedProperties?.private || {};
  const startValue = event?.start?.dateTime || event?.start?.date;
  const endValue = event?.end?.dateTime || event?.end?.date || startValue;

  const meetLink =
    event.hangoutLink ||
    event?.conferenceData?.entryPoints?.find(
      (entryPoint) => entryPoint.entryPointType === "video",
    )?.uri ||
    "";

  return {
    id: event.id || `google-${Date.now()}`,
    googleEventId: event.id || "",
    hrisManaged: isHrisOwnedGoogleEvent(event),
    googleHtmlLink: /^https:\/\/calendar\.google\.com\//.test(event.htmlLink || "") ? event.htmlLink : "",
    meetLink,
    // Preserve Google data for guest profiles, RSVPs, recurrence and reminders.
    // The Calendar Events API supplies names/emails/status, but NOT other users'
    // Google profile photographs. Only use real pictures actually supplied by
    // Google or the connected account's existing OAuth profile permission.
    googleAttendees: Array.isArray(event.attendees) ? event.attendees.map((attendee) => ({
      email: String(attendee.email || "").trim(),
      displayName: String(attendee.displayName || "").trim(),
      responseStatus: attendee.responseStatus || "needsAction",
      organizer: Boolean(attendee.organizer),
      self: Boolean(attendee.self),
      optional: Boolean(attendee.optional),
      photoUrl: attendee.photoUrl || attendee.picture || "",
    })) : [],
    googleOrganizer: {
      displayName: event?.organizer?.displayName || "",
      email: event?.organizer?.email || "",
    },
    googleCreator: {
      displayName: event?.creator?.displayName || "",
      email: event?.creator?.email || "",
    },
    googleAccount: {
      email: String(googleAccount.email || "").trim(),
      photoUrl: String(googleAccount.photoUrl || "").trim(),
    },
    isRecurring: Boolean(event.recurringEventId || (Array.isArray(event.recurrence) && event.recurrence.length)),
    recurrenceRules: Array.isArray(event.recurrence) ? event.recurrence : [],
    googleReminders: event.reminders || null,
    title: event.summary || "Untitled Schedule",
    category: privateProperties.category || "Talent Acquisition",
    status:
      privateProperties.status ||
      (event.status === "cancelled" ? "Done" : "Scheduled"),
    date: formatDateTimeToDateKey(startValue),
    startTime: event?.start?.date ? "All Day" : formatTimeLabel(startValue),
    endTime: event?.end?.date ? "All Day" : formatTimeLabel(endValue),
    account: privateProperties.account || "",
    site: normalizeCalendarSite(privateProperties.site),
    organizer:
      event?.organizer?.displayName ||
      event?.organizer?.email ||
      privateProperties.organizer ||
      "",
    location: event.location || meetLink || "",
    notes: event.description || "",
    color:
      privateProperties.color ||
      EVENT_COLOR_BY_GOOGLE_COLOR_ID[event.colorId] ||
      "blue",
    colorId:
      privateProperties.colorId ||
      event.colorId ||
      getEventColorOption(
        privateProperties.color ||
          EVENT_COLOR_BY_GOOGLE_COLOR_ID[event.colorId] ||
          "blue",
      ).googleColorId,
    recruitmentEventType: privateProperties.source === "sibs-hris-recruitment" ? (privateProperties.eventType || "MANAGED") : "",
    // HRIS writes these identifiers into the Google event. Retain them so the
    // event details link can open the correct Candidate Pipeline record.
    candidatePipelineId: privateProperties.source === "sibs-hris-recruitment"
      ? String(privateProperties.candidatePipelineId || "").trim() : "",
    candidateId: privateProperties.source === "sibs-hris-recruitment"
      ? String(privateProperties.candidateId || "").trim() : "",
    scheduleType: privateProperties.scheduleType || "Event",
    deadline: privateProperties.deadline || "",
    taskList: privateProperties.taskList || "My Tasks",
    outOfOfficeEndDate:
      privateProperties.outOfOfficeEndDate || formatDateTimeToDateKey(endValue),
    declineMeetings:
      privateProperties.declineMeetings === "false" ? false : true,
    declineMode: privateProperties.declineMode || "newAndExisting",
    outOfOfficeMessage:
      privateProperties.outOfOfficeMessage ||
      "Declined because I am out of office",
    visibility:
      privateProperties.visibility || getVisibilityLabel(event.visibility),
    availability:
      privateProperties.availability ||
      (event.transparency === "transparent" ? "Free" : "Busy"),
    addNotification: privateProperties.addNotification === "true",
    addGoogleMeet: privateProperties.addGoogleMeet === "true",
  };
}

function buildGoogleCalendarPayload(form = {}) {
  return {
    summary: withSibsHrisCalendarTitle(form.title),
    description: form.notes || "",
    location: form.location || "",
    startDateTime: parseTimeLabel(form.date, form.startTime),
    endDateTime: parseTimeLabel(
      form.scheduleType === "Out of office"
        ? form.outOfOfficeEndDate || form.date
        : form.date,
      form.scheduleType === "Out of office" ? "05:00 PM" : form.endTime,
    ),
    timeZone: "Asia/Manila",
    colorId: getEventColorOption(form.color || "blue").googleColorId,
    visibility: getGoogleVisibilityValue(form.visibility),
    transparency: form.availability === "Free" ? "transparent" : "opaque",
    addGoogleMeet: form.scheduleType === "Event" && Boolean(form.addGoogleMeet),
    extendedProperties: {
      private: {
        source: "sibs-hris-calendar",
        category: form.category || "Talent Acquisition",
        status: form.status || "Scheduled",
        account: form.account || "",
        site: normalizeCalendarSite(form.site),
        organizer: form.organizer || "",
        color: form.color || "blue",
        colorId: getEventColorOption(form.color || "blue").googleColorId,
        availability: form.availability || "Busy",
        scheduleType: form.scheduleType || "Event",
        deadline: form.deadline || "",
        taskList: form.taskList || "My Tasks",
        outOfOfficeEndDate: form.outOfOfficeEndDate || form.date || "",
        declineMeetings: String(form.declineMeetings ?? true),
        declineMode: form.declineMode || "newAndExisting",
        outOfOfficeMessage:
          form.outOfOfficeMessage || "Declined because I am out of office",
        visibility: form.visibility || "Default visibility",
        addNotification: String(Boolean(form.addNotification)),
        addGoogleMeet: String(Boolean(form.addGoogleMeet)),
      },
    },
  };
}

function formatCalendarShortDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : "";
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function dateFromKey(dateKey) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map(Number);
  return new Date(year, month - 1, day);
}

function formatDayLabel(dateKey, options = {}) {
  const date = dateFromKey(dateKey);

  if (Number.isNaN(date.getTime())) return "";

  return formatHrisDateLocalized(date, "en-US", {
    month: options.month || "long",
    day: "numeric",
    ...(options.weekday ? { weekday: options.weekday } : {}),
    ...(options.year ? { year: "numeric" } : {}),
  });
}

function getEventSortValue(event = {}) {
  const startValue = parseTimeLabel(event.date, event.startTime);
  const date = new Date(startValue);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortEventsByDateTime(events = []) {
  return [...events].sort(
    (first, second) => getEventSortValue(first) - getEventSortValue(second),
  );
}

function buildWeekCells(viewDate) {
  const start = new Date(viewDate);
  start.setDate(viewDate.getDate() - viewDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      key: formatDateKey(date),
      label: formatHrisDateLocalized(date, "en-US", {
        weekday: "short",
        day: "numeric",
      }),
    };
  });
}

function buildRangeLabel(cells = []) {
  if (!cells.length) return "";

  const firstDate = cells[0].date;
  const lastDate = cells[cells.length - 1].date;
  const sameYear = firstDate.getFullYear() === lastDate.getFullYear();
  const sameMonth = firstDate.getMonth() === lastDate.getMonth();

  const firstLabel = formatHrisDateLocalized(firstDate, "en-US", {
    month: "long",
    day: "numeric",
  });
  const lastLabel = formatHrisDateLocalized(lastDate, "en-US", {
    month: sameMonth ? undefined : "long",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });

  return `${firstLabel} - ${lastLabel}${sameYear ? `, ${firstDate.getFullYear()}` : ""}`;
}

function buildMonthCells(viewDate) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      key: formatDateKey(date),
      inMonth: date.getMonth() === viewDate.getMonth(),
    };
  });
}

function firstCalendarValue(...values) {
  return values.find((value) => String(value ?? "").trim()) || "";
}

function formatCalendarUserName(user) {
  const lastName = String(
    firstCalendarValue(user?.lastName, user?.last_name, user?.gy_emp_lname),
  ).trim();
  const firstName = String(
    firstCalendarValue(user?.firstName, user?.first_name, user?.gy_emp_fname),
  ).trim();
  const middleName = String(
    firstCalendarValue(user?.middleName, user?.middle_name, user?.gy_emp_mname),
  ).trim();

  if (lastName || firstName || middleName) {
    return `${firstName} ${middleName} ${lastName}`
      .replace(/\s+/g, " ")
      .trim();
  }

  return String(
    firstCalendarValue(
      user?.fullName,
      user?.full_name,
      user?.gy_emp_fullname,
      user?.name,
      user?.displayName,
    ),
  ).trim();
}

function formatGoogleEmailDisplayName(email) {
  const localPart = String(email || "").split("@")[0]?.trim();

  if (!localPart) return "";

  const nameParts = localPart
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part && !/^\d+$/.test(part));

  if (!nameParts.length) return "";

  return nameParts
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function createBlankEvent(baseDate, organizer = "", nowMs = Date.now()) {
  const firstMinute = getNextAvailableStartMinute(baseDate, nowMs);
  return {
    id: "",
    title: withSibsHrisCalendarTitle("Event"),
    category: "Talent Acquisition",
    status: "Scheduled",
    date: baseDate,
    startTime: minutesToTimeLabel(firstMinute),
    endTime: minutesToTimeLabel(firstMinute + EVENT_DEFAULT_DURATION),
    account: "",
    site: "",
    organizer,
    location: "",
    notes: "",
    color: "peacock",
    colorId: getEventColorOption("peacock").googleColorId,
    availability: "Busy",
    scheduleType: "Event",
    deadline: "",
    taskList: "My Tasks",
    outOfOfficeEndDate: baseDate,
    declineMeetings: true,
    declineMode: "newAndExisting",
    outOfOfficeMessage: "Declined because I am out of office",
    visibility: "Default visibility",
    addNotification: false,
    addGoogleMeet: false,
  };
}

function EventEditorModal({
  event,
  organizerLabel = "",
  onClose,
  onDelete,
  onSave,
  nowMs,
  getNowMs,
}) {
  const initialForm = useMemo(
    () => ({
      ...createBlankEvent(getManilaDateKey(nowMs), organizerLabel, nowMs),
      ...event,
      organizer: event?.organizer || organizerLabel,
      // Legacy interview availability entries remain readable, but this editor
      // now offers only Event, Task, and Out of office.
      scheduleType: event?.scheduleType === "Interview availability"
        ? "Event"
        : event?.scheduleType || "Event",
    }),
    [event, organizerLabel],
  );
  const [form, setForm] = useState(initialForm);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [moreOptionsFeedback, setMoreOptionsFeedback] = useState("");
  const moreOptionsRef = useRef(null);
  const [openTimePicker, setOpenTimePicker] = useState(null);
  const closeTimePicker = useCallback(() => setOpenTimePicker(null), []);

  useEffect(() => {
    if (!showMoreOptions) return undefined;
    const frame = requestAnimationFrame(() => {
      moreOptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [showMoreOptions]);

  const [busyState, setBusyState] = useState({ date: "", intervals: [], loading: true, error: "" });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const date = form.date;
    if (!date) return;
    let cancelled = false;
    setBusyState({ date, intervals: [], loading: true, error: "" });
    setValidationError("");
    getGoogleCalendarBusyTimes({ date, excludeEventId: form.googleEventId || "" })
      .then((result) => {
        if (cancelled) return;
        if (result?.success !== true) {
          setBusyState({ date, intervals: [], loading: false, error: result?.message || result?.error || "Cannot check calendar availability." });
        } else {
          setBusyState({ date, intervals: result.busy || [], loading: false, error: "" });
        }
      })
      .catch(() => {
        if (!cancelled) setBusyState({ date, intervals: [], loading: false, error: "Cannot check calendar availability." });
      });
    return () => { cancelled = true; };
  }, [form.date, form.googleEventId]);

  const busyReady = busyState.date === form.date && !busyState.loading && !busyState.error;
  const busyIntervals = busyReady ? busyState.intervals : [];


  const activeType = form.scheduleType || "Event";
  const selectedColorOption = getEventColorOption(form.color || "peacock");
  const moreOptionsTimedEvent = activeType === "Event" || activeType === "Interview availability";
  const selectedStartMinutes = timeLabelToMinutes(form.startTime);
  const selectedEndMinutes = timeLabelToMinutes(form.endTime);
  const currentDurationMinutes =
    selectedStartMinutes !== null && selectedEndMinutes !== null
      ? selectedEndMinutes - selectedStartMinutes
      : null;

  const durationPresets = [30, 45, 60, 90, 120];

  function canUseDuration(durationMinutes) {
    if (!moreOptionsTimedEvent || !busyReady || selectedStartMinutes === null ||
        isPastCalendarTime(form.date, form.startTime, getNowMs())) return false;
    const proposedEnd = selectedStartMinutes + durationMinutes;
    if (proposedEnd > 23 * 60 + 59) return false;
    if (activeType === "Event" && (durationMinutes < EVENT_DEFAULT_DURATION || proposedEnd > EVENT_LAST_MINUTE)) return false;
    if (activeType === "Interview availability" &&
        (durationMinutes < 30 || proposedEnd > INTERVIEW_AVAILABILITY_END_MINUTES)) return false;
    const start = calendarLocalTimeMs(form.date, form.startTime);
    const end = start + durationMinutes * 60000;
    return Number.isFinite(start) && !calendarTimeOverlaps(busyIntervals, start, end);
  }

  function selectDuration(durationMinutes) {
    if (!canUseDuration(durationMinutes)) return;
    updateField("endTime", minutesToTimeLabel(selectedStartMinutes + durationMinutes));
    setValidationError("");
    setMoreOptionsFeedback("");
  }

  async function copyScheduleSummary() {
    const lines = [
      withSibsHrisCalendarTitle(form.title),
      `Date: ${formatDayLabel(form.date, { year: true })}`,
      activeType === "Out of office"
        ? `Until: ${formatDayLabel(form.outOfOfficeEndDate || form.date, { year: true })}`
        : moreOptionsTimedEvent && form.startTime !== "All Day"
          ? `Time: ${form.startTime} – ${form.endTime} (Asia/Manila)`
          : "All day",
      form.site ? `Site: ${form.site}` : "",
      form.account ? `Account: ${form.account}` : "",
      form.location ? `Location: ${form.location}` : "",
      form.notes ? `Details: ${form.notes}` : "",
    ].filter(Boolean);
    const text = lines.join("\n");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      setMoreOptionsFeedback("Schedule details copied.");
    } catch {
      // Support non-HTTPS local development where the Clipboard API may be unavailable.
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);
        setMoreOptionsFeedback(copied ? "Schedule details copied." : "Unable to copy schedule details.");
      } catch {
        setMoreOptionsFeedback("Unable to copy schedule details.");
      }
    }
  }

  function restoreUnsavedChanges() {
    setForm({ ...initialForm });
    setOpenTimePicker(null);
    setValidationError("");
    setMoreOptionsFeedback("Unsaved changes restored to the original values.");
  }

  function updateField(field, value) {
    if (field === "date") {
      if (isPastCalendarDay(value, getNowMs())) {
        setValidationError("Past dates are view-only. Choose today or a future date.");
        return;
      }
      setForm((current) => {
        const next = {
          ...current,
          date: value,
          outOfOfficeEndDate: current.outOfOfficeEndDate && current.outOfOfficeEndDate >= value
            ? current.outOfOfficeEndDate : value,
        };
        const previousStart = calendarLocalTimeMs(value, current.startTime);
        if (!Number.isFinite(previousStart) || previousStart < getNowMs()) {
          const firstMinute = getNextAvailableStartMinute(value, getNowMs());
          if (firstMinute <= EVENT_LAST_MINUTE - EVENT_DEFAULT_DURATION) {
            next.startTime = minutesToTimeLabel(firstMinute);
            next.endTime = minutesToTimeLabel(firstMinute + EVENT_DEFAULT_DURATION);
          }
        }
        return next;
      });
      setValidationError("");
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateStartTime(value) {
    setForm((current) => {
      const newStart = timeLabelToMinutes(value);
      const previousEnd = timeLabelToMinutes(current.endTime);
      if (current.scheduleType === "Event" && newStart !== null) {
        // Changing a regular event start always resets the end to +30 minutes.
        // This prevents stale 15-minute (or previous-day) end times.
        return {
          ...current,
          startTime: value,
          endTime: minutesToTimeLabel(newStart + EVENT_DEFAULT_DURATION),
        };
      }
      if (newStart === null || (previousEnd !== null && previousEnd > newStart)) {
        return { ...current, startTime: value };
      }
      const isInterviewAvailability = current.scheduleType === "Interview availability";
      const increment = isInterviewAvailability ? 30 : 15;
      const maxEnd = isInterviewAvailability ? INTERVIEW_AVAILABILITY_END_MINUTES : 23 * 60 + 45;
      return {
        ...current,
        startTime: value,
        endTime: minutesToTimeLabel(Math.min(newStart + increment, maxEnd)),
      };
    });
  }

  const isInterviewAvailability = activeType === "Interview availability";
  const isEventTime = activeType === "Event";
  const startTimeOptions = buildTimeSelectOptions({
    isInterviewAvailability,
    isEventTime,
    isEndTime: false,
    selectedTime: form.startTime,
  });
  const endTimeOptions = buildTimeSelectOptions({
    isInterviewAvailability,
    isEventTime,
    isEndTime: true,
    startTime: form.startTime,
    selectedTime: form.endTime,
  });

  function updateScheduleType(nextType) {
    if (!["Event", "Task", "Out of office"].includes(nextType)) return;
    setForm((current) => {
      // Re-clicking the active tab must not overwrite a title the user renamed.
      if (current.scheduleType === nextType) return current;
      return {
        ...current,
        scheduleType: nextType,
        // Each new type starts with an editable, type-specific SiBS HRIS title.
        title: withSibsHrisCalendarTitle(nextType),
        status: nextType === "Event" ? current.status || "Scheduled" : "Scheduled",
        outOfOfficeEndDate: current.outOfOfficeEndDate || current.date,
        addGoogleMeet: nextType === "Event" ? (current.addGoogleMeet ?? true) : false,
      };
    });
    setValidationError("");
    setOpenTimePicker(null);
  }

  function handleAddGoogleMeetRequest() {
    updateField("scheduleType", "Event");
    updateField("addGoogleMeet", true);
    setCopySuccess(false);
  }

  async function handleCopyGoogleMeetLink() {
    const link = form.meetLink || form.location || "";

    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 1600);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 1600);
    }
  }

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    setValidationError("");
    const submissionNow = getNowMs();
    if (isPastCalendarDay(form.date, submissionNow)) {
      setValidationError("Past dates are view-only. Please choose today or a future date.");
      return;
    }
    if (activeType === "Out of office" && (form.outOfOfficeEndDate || form.date) < form.date) {
      setValidationError("Out of office end date must not be before its start date.");
      return;
    }
    if (!busyReady) {
      setValidationError(busyState.error || "Please wait while your calendar availability is checked.");
      return;
    }
    if (["Event", "Task", "Out of office", "Interview availability"].includes(activeType)) {
      const start = calendarLocalTimeMs(form.date, form.startTime);
      const end = calendarLocalTimeMs(form.date, form.endTime);
      const finalEnd = activeType === "Out of office"
        ? calendarLocalTimeMs(form.outOfOfficeEndDate || form.date, "05:00 PM")
        : end;
      if (!Number.isFinite(start) || !Number.isFinite(finalEnd) || finalEnd <= start) {
        setValidationError("Select a valid start and end time.");
        return;
      }
      if (start < submissionNow || finalEnd <= submissionNow) {
        setValidationError("Start and end time must be in the future (Asia/Manila). Select a later time.");
        return;
      }
      if (activeType === "Event" && calendarTimeOverlaps(busyIntervals, start, end)) {
        setValidationError("This time is already scheduled on your calendar. Choose another time.");
        return;
      }
    }
    if (activeType === "Interview availability") {
      const startMinutes = timeLabelToMinutes(form.startTime);
      const endMinutes = timeLabelToMinutes(form.endTime);
      const day = new Date(`${form.date}T12:00:00Z`).getUTCDay();
      if ([0, 6].includes(day) || startMinutes === null || endMinutes === null ||
          endMinutes - startMinutes < 30) {
        window.alert("Choose a weekday with an availability window of at least 30 minutes.");
        return;
      }
      if (startMinutes < 600 || endMinutes > 1050) {
        window.alert("Interview availability must be between 10:00 AM and 5:30 PM.");
        return;
      }
    }
    const result = await onSave({
      ...form,
      id: form.id || `schedule-${Date.now()}`,
      title: withSibsHrisCalendarTitle(form.title),
      outOfOfficeEndDate: form.outOfOfficeEndDate || form.date,
    });
    if (result?.success === false) {
      setValidationError(result.message || "Unable to save the calendar schedule.");
    }
  }

  const tabItems = ["Event", "Task", "Out of office"];

  return (
    <div
      className="sibs-action-backdrop-in absolute inset-0 z-[2] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[3px] font-jakarta"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Google Calendar schedule editor"
        className="sibs-modal-pop-in flex max-h-[86vh] w-full max-w-[660px] min-h-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(2,30,56,0.38)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-sibs-navy px-5 py-3.5 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-sibs-orange text-white shadow-sm">
              <CalendarDays className="h-[19px] w-[19px]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-white/75">SiBS HRIS Operational Workspace</p>
              <h2 className="truncate text-[17px] font-black leading-tight text-white">
                {`SiBS Calendar · ${activeType}`}
              </h2>
              <p className="truncate text-[10px] font-medium text-white/75">HR &amp; Talent Acquisition · Asia/Manila</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white/85 transition hover:bg-white/20 hover:text-white"
            aria-label="Close schedule editor"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6">
        <input
          value={form.title || ""}
          onChange={(inputEvent) =>
            updateField("title", inputEvent.target.value)
          }
          placeholder={`SiBS HRIS - ${activeType}`}
          aria-label={`${activeType} title (editable)`}
          className="mt-4 h-10 w-full border-b border-sibs-border bg-transparent text-[22px] font-black leading-tight text-sibs-navy outline-none placeholder:text-sibs-muted"
        />

        <div className="mt-4 flex items-center gap-2">
          {tabItems.map((item) => {
            const isActive = activeType === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => updateScheduleType(item)}
                className={[
                  "h-8 rounded-[9px] px-5 text-xs font-black transition hover:cursor-pointer",
                  isActive
                    ? "bg-sibs-navy text-white shadow-sm"
                    : "text-sibs-text-secondary hover:cursor-pointer hover:bg-sibs-canvas hover:text-sibs-navy",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {activeType === "Event" || activeType === "Interview availability" ? (
            <>
              <div className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-3 lg:grid-cols-[24px_minmax(0,1fr)_auto]">
                <Clock className="mt-1.5 h-5 w-5 text-sibs-orange" />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-[188px] shrink-0">
                      <DatePicker
                        value={form.date || ""}
                        displayValue={formatCalendarShortDate(form.date)}
                        min={getManilaDateKey(nowMs)}
                        clearable={false}
                        onChange={(date) => updateField("date", date)}
                        label="Schedule date"
                        hideLabel
                        placeholder="Select date"
                        buttonClassName="sibs-calendar-date-trigger !h-9 !rounded-[9px] !px-2.5 !text-[12px]"
                        portalClassName="sibs-calendar-date-panel"
                      />
                    </div>

                    <span className="text-xs font-bold text-sibs-muted">-</span>

                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <CalendarTimePicker
                        label="Start time"
                        value={form.startTime}
                        options={startTimeOptions}
                        isInterviewAvailability={isInterviewAvailability}
                        isEventTime={isEventTime}
                        date={form.date}
                        nowMs={nowMs}
                        getNowMs={getNowMs}
                        busy={busyIntervals}
                        busyLoading={!busyReady}
                        isEndTime={false}
                        isOpen={openTimePicker === "start"}
                        onToggle={() => setOpenTimePicker((current) => current === "start" ? null : "start")}
                        onChange={updateStartTime}
                        onClose={closeTimePicker}
                      />
                      <span className="text-xs font-black text-sibs-text-secondary">–</span>
                      <CalendarTimePicker
                        label="End time"
                        value={form.endTime}
                        options={endTimeOptions}
                        isInterviewAvailability={isInterviewAvailability}
                        isEventTime={isEventTime}
                        date={form.date}
                        nowMs={nowMs}
                        getNowMs={getNowMs}
                        busy={busyIntervals}
                        busyLoading={!busyReady}
                        isEndTime
                        startTime={form.startTime}
                        isOpen={openTimePicker === "end"}
                        onToggle={() => setOpenTimePicker((current) => current === "end" ? null : "end")}
                        onChange={(value) => updateField("endTime", value)}
                        onClose={closeTimePicker}
                      />
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] font-semibold text-sibs-text-secondary">
                    Does not repeat
                  </p>
                </div>

                <div className="col-start-2 flex w-fit items-center gap-1 justify-self-start lg:col-start-auto lg:justify-self-end">
                  <button
                    type="button"
                    onClick={() => updateField("date", addDays(form.date, 1))}
                    className="h-7 rounded-[7px] border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-sibs-navy transition hover:cursor-pointer hover:border-sibs-orange"
                  >
                    +1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("date", addDays(form.date, 7))}
                    className="h-7 rounded-[7px] border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-sibs-navy transition hover:cursor-pointer hover:border-sibs-orange"
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              {activeType === "Event" && <div className="grid grid-cols-[24px_1fr] items-start gap-3">
                <svg
                  className="mt-1 h-5 w-5 text-sibs-orange"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M4.5 7.5h10v9h-10v-9Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m14.5 10.25 5-2.75v9l-5-2.75v-3.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>

                {form.meetLink || form.location?.includes("meet.google.com") ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-[8px] bg-sibs-canvas px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-sibs-navy">
                        Join with Google Meet
                      </div>
                      <a
                        href={form.meetLink || form.location}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs font-semibold text-sibs-text-secondary underline-offset-2 transition hover:cursor-pointer hover:text-sibs-orange hover:underline"
                      >
                        {form.meetLink || form.location}
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyGoogleMeetLink}
                      className="flex h-8 items-center gap-1.5 rounded-[8px] border border-sibs-border bg-white px-3 text-xs font-black text-sibs-navy transition hover:cursor-pointer hover:border-sibs-orange hover:text-sibs-orange"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copySuccess ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : form.addGoogleMeet ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-emerald-700">
                        Google Meet will be added after Save
                      </div>
                      <p className="text-xs font-semibold text-emerald-700/75">
                        The event is not saved yet. Click Save to create the
                        calendar event and generate the Meet link.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateField("addGoogleMeet", false)}
                      className="h-8 rounded-[8px] border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 transition hover:cursor-pointer hover:border-sibs-orange hover:text-sibs-orange"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddGoogleMeetRequest}
                    className="inline-flex h-9 w-fit items-center gap-2 rounded-[9px] bg-sibs-canvas px-4 text-sm font-black text-sibs-navy transition hover:cursor-pointer hover:bg-sibs-canvas/80"
                  >
                    <Link2 className="h-4 w-4 text-sibs-orange" />
                    Add Google Meet link
                  </button>
                )}
              </div>}

              <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(260px,1.15fr)]">
                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <MapPin className="h-5 w-5 text-sibs-navy" />
                  <input
                    value={form.location || ""}
                    onChange={(inputEvent) =>
                      updateField("location", inputEvent.target.value)
                    }
                    placeholder="Location / Google Meet link appears after save"
                    className="h-10 border-b border-sibs-border bg-transparent text-sm font-semibold text-sibs-primary-1 outline-none placeholder:text-sibs-muted"
                  />
                </div>

                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <List className="h-5 w-5 text-sibs-navy" />
                  <input
                    value={form.notes || ""}
                    onChange={(inputEvent) =>
                      updateField("notes", inputEvent.target.value)
                    }
                    placeholder="Add description or agenda"
                    className="h-10 border-b border-sibs-border bg-transparent text-sm font-semibold text-sibs-primary-1 outline-none placeholder:text-sibs-muted"
                  />
                </div>
              </div>

              <div className="space-y-3 border-b border-sibs-border pb-4">
                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-sibs-navy" />

                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <div className="min-w-[210px] flex-1">
                      <div className="flex items-center gap-1 text-sm font-black text-sibs-navy">
                        {form.organizer || organizerLabel || "Google Calendar"}
                        <span className="h-2 w-2 rounded-full bg-sibs-orange" />
                      </div>
                      <p className="text-[11px] font-semibold text-sibs-text-secondary">
                        {form.availability || "Busy"} •{" "}
                        {form.visibility || "Default visibility"} •{" "}
                        {form.addNotification ? "Notify" : "Do not notify"}
                      </p>
                    </div>

                    <CalendarOptionDropdown
                      label="Color"
                      searchable={false}
                      widthClass="w-[158px]"
                      value={form.color || "peacock"}
                      options={COLOR_OPTIONS}
                      onChange={(nextColor) => {
                        const nextColorOption = getEventColorOption(nextColor);
                        setForm((current) => ({ ...current, color: nextColor, colorId: nextColorOption.googleColorId }));
                      }}
                    />

                    <span
                      className={[
                        "h-3 w-3 rounded-full",
                        selectedColorOption.dotClass,
                      ].join(" ")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <Tags className="h-5 w-5 text-sibs-navy" />

                  <div className="flex w-fit flex-wrap items-center gap-2">
                    <CalendarOptionDropdown
                      label="Category"
                      widthClass="w-[196px]"
                      value={form.category || "Talent Acquisition"}
                      options={CATEGORY_OPTIONS.filter((item) => item !== "All Categories")}
                      onChange={(value) => updateField("category", value)}
                    />

                    <CalendarOptionDropdown
                      label="Status"
                      widthClass="w-[146px]"
                      value={form.status || "Scheduled"}
                      options={STATUS_OPTIONS.filter((item) => item !== "All Statuses")}
                      onChange={(value) => updateField("status", value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <MapPin className="h-5 w-5 text-sibs-navy" aria-hidden="true" />
                  <CalendarOptionDropdown
                    label="Site"
                    widthClass="w-[196px]"
                    value={form.site || ""}
                    options={SITE_OPTIONS}
                    onChange={(site) => updateField("site", site)}
                  />
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <Briefcase className="h-5 w-5 text-sibs-navy" />

                  <CalendarOptionDropdown
                    label="Availability"
                    widthClass="w-[125px]"
                    searchable={false}
                    value={form.availability || "Busy"}
                    options={AVAILABILITY_OPTIONS}
                    onChange={(value) => updateField("availability", value)}
                  />
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <svg
                    className="h-5 w-5 text-sibs-navy"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M17 10V8a5 5 0 0 0-10 0v2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 10h14v10H5V10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <div className="flex w-fit flex-wrap items-center gap-2">
                    <CalendarOptionDropdown
                      label="Visibility"
                      widthClass="w-[180px]"
                      value={form.visibility || "Default visibility"}
                      options={VISIBILITY_OPTIONS}
                      onChange={(value) => updateField("visibility", value)}
                    />

                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-sibs-muted text-[11px] font-black text-sibs-text-secondary">
                      ?
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <svg
                    className="h-5 w-5 text-sibs-navy"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M18 9.5a6 6 0 1 0-12 0c0 7-2.5 7-2.5 7h17s-2.5 0-2.5-7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13.75 20a2 2 0 0 1-3.5 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <button
                    type="button"
                    onClick={() =>
                      updateField("addNotification", !form.addNotification)
                    }
                    className="h-9 w-fit rounded-[9px] px-0 text-sm font-black text-sibs-navy transition hover:cursor-pointer hover:text-sibs-orange"
                  >
                    {form.addNotification
                      ? "Notification enabled"
                      : "Add notification"}
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {activeType === "Task" ? (
            <>
              <div className="grid grid-cols-[24px_1fr_auto] items-start gap-3">
                <Clock className="mt-1.5 h-5 w-5 text-sibs-orange" />
                <div>
                  <div className="w-[188px]">
                    <DatePicker
                      value={form.date || ""}
                      displayValue={formatCalendarShortDate(form.date)}
                      min={getManilaDateKey(nowMs)}
                      clearable={false}
                      onChange={(date) => updateField("date", date)}
                      label="Task date"
                      hideLabel
                      placeholder="Select date"
                      buttonClassName="sibs-calendar-date-trigger !h-9 !rounded-[9px] !px-2.5 !text-[12px]"
                      portalClassName="sibs-calendar-date-panel"
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-sibs-text-secondary">
                    Does not repeat
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateField("startTime", form.startTime || "09:00 AM");
                    updateField("endTime", form.endTime || "10:00 AM");
                  }}
                  className="h-8 rounded-full border border-sibs-border bg-sibs-canvas px-4 text-xs font-black text-sibs-navy transition hover:cursor-pointer hover:border-sibs-orange"
                >
                  Add time
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <svg
                    className="h-5 w-5 text-sibs-orange"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <input
                    value={form.deadline || ""}
                    onChange={(inputEvent) =>
                      updateField("deadline", inputEvent.target.value)
                    }
                    placeholder="Add deadline"
                    className="h-10 border-b border-sibs-border bg-transparent text-sm font-semibold text-sibs-primary-1 outline-none placeholder:text-sibs-muted"
                  />
                </div>

                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <List className="h-5 w-5 text-sibs-navy" />
                  <input
                    value={form.notes || ""}
                    onChange={(inputEvent) =>
                      updateField("notes", inputEvent.target.value)
                    }
                    placeholder="Add task details"
                    className="h-10 border-b border-sibs-border bg-transparent text-sm font-semibold text-sibs-primary-1 outline-none placeholder:text-sibs-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[24px_1fr] items-center gap-3 border-b border-sibs-border pb-4">
                <svg
                  className="h-5 w-5 text-sibs-navy"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M8 6h13M8 12h13M8 18h13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="m3 6 .8.8L5.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m3 12 .8.8 1.7-1.8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <CalendarOptionDropdown
                  label="Task list"
                  widthClass="w-[220px]"
                  value={form.taskList || "My Tasks"}
                  options={["My Tasks", "Talent Acquisition", "HR Tasks", "Operations"]}
                  onChange={(value) => updateField("taskList", value)}
                />
              </div>
            </>
          ) : null}

          {activeType === "Out of office" ? (
            <>
              <div className="grid grid-cols-[24px_1fr] items-start gap-3">
                <Clock className="mt-1.5 h-5 w-5 text-sibs-orange" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-[188px] shrink-0">
                      <DatePicker
                        value={form.date || ""}
                        displayValue={formatCalendarShortDate(form.date)}
                        min={getManilaDateKey(nowMs)}
                        clearable={false}
                        onChange={(date) => {
                          if (isPastCalendarDay(date, getNowMs())) return;
                          setForm((current) => ({
                            ...current,
                            date,
                            outOfOfficeEndDate:
                              current.outOfOfficeEndDate && date && current.outOfOfficeEndDate >= date
                                ? current.outOfOfficeEndDate : date,
                          }));
                        }}
                        label="Out of office from date"
                        hideLabel
                        placeholder="From date"
                        buttonClassName="sibs-calendar-date-trigger !h-9 !rounded-[9px] !px-2.5 !text-[12px]"
                        portalClassName="sibs-calendar-date-panel"
                      />
                    </div>
                    <span className="text-xs font-bold text-sibs-muted">-</span>
                    <div className="w-[188px] shrink-0">
                      <DatePicker
                        value={form.outOfOfficeEndDate || form.date || ""}
                        displayValue={formatCalendarShortDate(form.outOfOfficeEndDate || form.date)}
                        min={form.date > getManilaDateKey(nowMs) ? form.date : getManilaDateKey(nowMs)}
                        clearable={false}
                        onChange={(date) => updateField("outOfOfficeEndDate", date)}
                        label="Out of office to date"
                        hideLabel
                        placeholder="To date"
                        buttonClassName="sibs-calendar-date-trigger !h-9 !rounded-[9px] !px-2.5 !text-[12px]"
                        portalClassName="sibs-calendar-date-panel"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-sibs-text-secondary">
                    Does not repeat
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[24px_1fr] items-start gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(form.declineMeetings)}
                  onChange={(inputEvent) =>
                    updateField("declineMeetings", inputEvent.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-sibs-navy hover:cursor-pointer"
                />

                <div>
                  <div className="text-sm font-black text-sibs-primary-1">
                    Automatically decline meetings
                  </div>

                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-sibs-text-secondary">
                      <input
                        type="radio"
                        checked={form.declineMode === "newOnly"}
                        onChange={() => updateField("declineMode", "newOnly")}
                        className="accent-sibs-navy hover:cursor-pointer"
                      />
                      Only new meeting invitations
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-sibs-text-secondary">
                      <input
                        type="radio"
                        checked={form.declineMode !== "newOnly"}
                        onChange={() =>
                          updateField("declineMode", "newAndExisting")
                        }
                        className="accent-sibs-navy hover:cursor-pointer"
                      />
                      New and existing meetings
                    </label>
                  </div>

                  <label className="mt-3 block text-[10px] font-black uppercase text-sibs-text-secondary">
                    Message
                    <input
                      value={
                        form.outOfOfficeMessage ||
                        "Declined because I am out of office"
                      }
                      onChange={(inputEvent) =>
                        updateField(
                          "outOfOfficeMessage",
                          inputEvent.target.value,
                        )
                      }
                      className="mt-1 h-9 w-full rounded-[10px] border border-sibs-border bg-sibs-canvas px-3 text-sm font-semibold normal-case text-sibs-primary-1 outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[24px_1fr] items-start gap-3 border-b border-sibs-border pb-4">
                <svg
                  className="h-5 w-5 text-sibs-navy"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M17 10V8a5 5 0 0 0-10 0v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 10h14v10H5V10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>

                <div>
                  <div className="flex items-center gap-2">
                    <CalendarOptionDropdown
                      label="Visibility"
                      widthClass="w-[180px]"
                      value={form.visibility || "Public"}
                      options={["Public", "Private", "Default visibility"]}
                      onChange={(value) => updateField("visibility", value)}
                    />
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-sibs-muted text-[11px] font-black text-sibs-text-secondary">
                      ?
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-sibs-text-secondary">
                    Availability might be shown in other Google apps
                  </p>
                </div>
              </div>
            </>
          ) : null}
          {(activeType === "Task" || activeType === "Out of office") && (
            <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
              <MapPin className="h-5 w-5 text-sibs-navy" aria-hidden="true" />
              <CalendarOptionDropdown
                label="Site"
                widthClass="w-[196px]"
                value={form.site || ""}
                options={SITE_OPTIONS}
                onChange={(site) => updateField("site", site)}
              />
            </div>
          )}
        </div>

        {(validationError || busyState.error) && (
          <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {validationError || busyState.error}
          </p>
        )}
        {showMoreOptions && (
          <section
            ref={moreOptionsRef}
            id="sibs-calendar-more-options"
            aria-label="Additional calendar options"
            className="mt-4 space-y-3 rounded-[12px] border border-sibs-border bg-sibs-canvas px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-sibs-navy">Additional schedule options</h3>
                <p className="mt-0.5 text-[11px] font-semibold text-sibs-text-secondary">
                  Update optional details here, then click Save to apply them.
                </p>
              </div>
              <span className="rounded-md bg-white px-2.5 py-1 text-[10px] font-bold text-sibs-text-secondary">
                Asia/Manila (GMT+8)
              </span>
            </div>

            {moreOptionsTimedEvent && form.startTime !== "All Day" && (
              <div>
                <label className="mb-2 block text-[11px] font-black text-sibs-navy">Quick duration</label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Choose event duration">
                  {durationPresets.map((duration) => {
                    const permitted = canUseDuration(duration);
                    const active = currentDurationMinutes === duration;
                    const label = duration < 60 ? `${duration} min` : `${duration / 60} ${duration === 60 ? "hour" : "hours"}`;
                    return (
                      <button
                        key={duration}
                        type="button"
                        disabled={!permitted}
                        onClick={() => selectDuration(duration)}
                        aria-pressed={active}
                        className={`h-8 rounded-[8px] border px-3 text-[11px] font-extrabold transition ${active ? "border-sibs-navy bg-sibs-navy text-white" : "border-sibs-border bg-white text-sibs-navy hover:border-sibs-orange"} disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10px] font-medium text-sibs-text-secondary">
                  Conflicting durations are disabled to prevent overlapping calendar events.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] font-black text-sibs-navy">
                Account / Reference (optional)
                <input
                  value={form.account || ""}
                  onChange={(event) => updateField("account", event.target.value)}
                  placeholder="Enter account or reference"
                  className="mt-1.5 h-9 w-full rounded-[9px] border border-sibs-border bg-white px-3 text-xs font-semibold text-sibs-navy outline-none focus:border-sibs-orange"
                />
              </label>
              <div className="flex flex-col justify-end gap-1.5 text-[11px] font-semibold text-sibs-text-secondary">
                <span className="font-black text-sibs-navy">Saved event details</span>
                <span>{form.googleEventId ? "Editing existing Google Calendar event" : "New calendar schedule (not saved yet)"}</span>
              </div>
            </div>

            <label className="block text-[11px] font-black text-sibs-navy">
              Full description / agenda
              <textarea
                value={form.notes || ""}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={3}
                placeholder="Add additional event details"
                className="mt-1.5 w-full resize-y rounded-[9px] border border-sibs-border bg-white px-3 py-2 text-xs font-semibold text-sibs-navy outline-none focus:border-sibs-orange"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2 border-t border-sibs-border pt-3">
              <button
                type="button"
                onClick={copyScheduleSummary}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-sibs-border bg-white px-3 text-[11px] font-extrabold text-sibs-navy transition hover:border-sibs-orange"
              >
                <Copy className="h-3.5 w-3.5" /> Copy details
              </button>
              <button
                type="button"
                onClick={restoreUnsavedChanges}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-sibs-border bg-white px-3 text-[11px] font-extrabold text-sibs-navy transition hover:border-sibs-orange"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset changes
              </button>
              {form.googleHtmlLink && (
                <a
                  href={form.googleHtmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center rounded-[8px] border border-sibs-border bg-white px-3 text-[11px] font-extrabold text-sibs-navy transition hover:border-sibs-orange"
                >
                  Open in Google Calendar
                </a>
              )}
              {moreOptionsFeedback && <span role="status" className="text-[11px] font-semibold text-emerald-700">{moreOptionsFeedback}</span>}
            </div>
          </section>
        )}

        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-sibs-border bg-white px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => form.id && onDelete(form.id)}
            disabled={!form.id}
            className="inline-flex h-9 items-center gap-1.5 rounded-[9px] px-1 text-xs font-black text-rose-600 transition hover:cursor-pointer hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={showMoreOptions}
              aria-controls="sibs-calendar-more-options"
              onClick={() => {
                setShowMoreOptions((previous) => !previous);
                setMoreOptionsFeedback("");
              }}
              className={`h-9 rounded-[10px] px-4 text-xs font-black transition hover:cursor-pointer hover:bg-sibs-canvas ${showMoreOptions ? "bg-sibs-canvas text-sibs-orange" : "text-sibs-navy"}`}
            >
              {showMoreOptions ? "Fewer options" : "More options"}
            </button>

            <button
              type="submit"
              disabled={!busyReady}
              className="h-10 rounded-[14px] disabled:cursor-not-allowed disabled:opacity-50 bg-sibs-orange px-8 text-xs font-black text-white shadow-[0_8px_20px_rgba(255,92,40,0.28)] transition hover:cursor-pointer hover:bg-sibs-button-hover"
            >
              Save
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function CompactScheduleCard({ event, onEdit }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      title={`${event.startTime} - ${event.title}${event.account ? ` • ${event.account}` : ""}`}
      className={[
        "block w-full rounded-[8px] border px-2 py-1 text-left text-[10px] font-bold leading-4 shadow-sm transition hover:cursor-pointer hover:-translate-y-0.5 hover:border-sibs-orange hover:shadow-md",
        EVENT_COLORS[event.color] || EVENT_COLORS.blue,
      ].join(" ")}
    >
      <span className="block truncate">
        {event.startTime} - {event.title}
      </span>
      <span className="block truncate text-[9px] font-semibold opacity-75">
        {event.account}
      </span>
    </button>
  );
}

function WeekScheduleCard({ event, onEdit }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className={[
        "w-full rounded-[10px] border px-2 py-2 text-left shadow-sm transition hover:cursor-pointer hover:-translate-y-0.5 hover:border-sibs-orange hover:shadow-md",
        EVENT_COLORS[event.color] || EVENT_COLORS.blue,
      ].join(" ")}
    >
      <span className="line-clamp-3 text-[11px] font-black leading-4 text-sibs-navy">
        {event.title}
      </span>
      <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-sibs-text-secondary">
        <Clock className="h-3 w-3 text-sibs-orange" />
        {event.startTime} - {event.endTime}
      </span>
      <span className="mt-2 block truncate text-[9px] font-semibold text-sibs-text-secondary">
        {event.account || event.location || "No account specified"}
      </span>
      <span
        className={[
          "mt-2 inline-flex rounded-md border px-2 py-0.5 text-[9px] font-extrabold",
          STATUS_BADGE_CLASSES[event.status] || STATUS_BADGE_CLASSES.Scheduled,
        ].join(" ")}
      >
        {event.status}
      </span>
    </button>
  );
}

function DisconnectCalendarConfirmModal({
  loading,
  onCancel,
  onConfirm,
  googleCalendarEmail,
}) {
  return (
    <ConfirmModal
      open={true}
      title="Disconnect Google Calendar?"
      subtitle={googleCalendarEmail || "Google Calendar Sync"}
      description="This will unlink the connected Google Calendar account from this HRIS account. Existing events in Google Calendar will not be deleted."
      confirmLabel={loading ? "Disconnecting..." : "Disconnect"}
      cancelLabel="Cancel"
      variant="danger"
      loading={loading}
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function GoogleCalendarDayDetails({ date, events, nowMs, onClose, onCreateEvent, onEditEvent }) {
  return (
    <div className="sibs-action-backdrop-in absolute inset-0 z-[2] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[3px]" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label="Google Calendar day details"
        onClick={(e) => e.stopPropagation()}
        className="sibs-modal-pop-in flex max-h-[80vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[18px] bg-white font-jakarta shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#E8EAED] px-5 py-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A73E8]">Google Calendar</span>
            <h3 className="mt-1 text-base font-black text-[#202124]">{formatDayLabel(date, { weekday: "long", year: true })}</h3>
            <p className="text-[11px] text-[#5F6368]">{events.length} schedule{events.length === 1 ? "" : "s"} · Asia/Manila</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close day details"><X size={18} /></button>
        </div>
        <div className="thin-scroll min-h-0 space-y-2 overflow-y-auto p-4">
          {sortEventsByDateTime(events).map((event) => (
            <button key={event.id} type="button"
              onClick={() => { onClose(); onEditEvent(sourceCalendarEvent(event)); }}
              className="flex w-full items-center gap-3 rounded-xl border border-[#E8EAED] bg-white p-3 text-left hover:border-[#A8C7FA] hover:bg-[#F8FBFF]">
              <span className="h-9 w-1.5 shrink-0 rounded-full bg-[#1A73E8]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-[#202124]">{event.title}</span>
                <span className="mt-0.5 block text-[11px] text-[#5F6368]">{event.startTime} – {event.endTime}{event.site ? ` · ${event.site}` : ""}</span>
              </span>
              {event.recruitmentEventType ? <span className="rounded bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">HRIS</span> : null}
            </button>
          ))}
        </div>
        <div className="border-t border-[#E8EAED] px-5 py-4">
          {canCreateCalendarEventOnDate(date, nowMs) ? (
            <button type="button"
              onClick={() => { onClose(); onCreateEvent(date); }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A73E8] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1558B0]">
              <Plus size={16} /> Create event on this date
            </button>
          ) : (
            <p className="text-center text-[11px] font-semibold text-sibs-text-secondary">
              Past schedules are available for viewing only.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// Only render genuine Google-hosted profile images. External guests do not have
// photo URLs in the Calendar Events API; those guests use initials instead.
function trustedGoogleCalendarPhoto(url) {
  try {
    const parsed = new URL(String(url || ""));
    return parsed.protocol === "https:" &&
      (parsed.hostname === "googleusercontent.com" || parsed.hostname.endsWith(".googleusercontent.com") ||
       parsed.hostname === "gstatic.com" || parsed.hostname.endsWith(".gstatic.com"))
      ? parsed.href : "";
  } catch {
    return "";
  }
}

function googleCalendarGuestLabel(guest = {}) {
  if (guest.displayName) return guest.displayName;
  const emailName = String(guest.email || "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return emailName || guest.email || "Guest";
}

function googleCalendarGuestInitials(guest = {}) {
  const words = googleCalendarGuestLabel(guest).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase();
}

function GoogleCalendarGuestAvatar({ guest, account }) {
  const [imageBroken, setImageBroken] = useState(false);
  const ownPhoto = guest.email && account?.email &&
    guest.email.toLowerCase() === account.email.toLowerCase() ? account.photoUrl : "";
  const photo = trustedGoogleCalendarPhoto(guest.photoUrl || ownPhoto);
  const status = guest.responseStatus;
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7EFF7] text-xs font-black text-sibs-navy" aria-label={`Profile of ${googleCalendarGuestLabel(guest)}`}>
      {photo && !imageBroken ? (
        <img src={photo} alt="" loading="lazy" referrerPolicy="no-referrer"
          onError={() => setImageBroken(true)} className="h-full w-full rounded-full object-cover" />
      ) : googleCalendarGuestInitials(guest)}
      {status === "accepted" ? (
        <span title="Accepted" aria-label="Accepted" className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-emerald-500 text-white"><Check size={9} strokeWidth={3} /></span>
      ) : status === "declined" ? (
        <span title="Declined" aria-label="Declined" className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-rose-500 text-white"><X size={9} strokeWidth={3} /></span>
      ) : status === "tentative" ? (
        <span title="Maybe" aria-label="Maybe" className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-amber-500 text-[9px] font-black text-white">?</span>
      ) : null}
    </span>
  );
}

function calendarGuestStatus(status) {
  return { accepted: "Accepted", declined: "Declined", tentative: "Maybe", needsAction: "Awaiting response" }[status] || "Awaiting response";
}

function getSafeCalendarWebLink(link) {
  try {
    const parsed = new URL(String(link || ""));
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch { return ""; }
}

function detectCalendarMeeting(event = {}) {
  const sources = [event.meetLink, event.location, event.notes];
  for (const source of sources) {
    const match = String(source || "").match(/https?:\/\/(?:meet\.google\.com|teams\.(?:microsoft|live)\.com|[^\s<>/]*zoom\.us)\/[^\s<>\"']+/i);
    const link = getSafeCalendarWebLink(match?.[0]?.replace(/[.,;)}\]]+$/, ""));
    if (!link) continue;
    const hostname = new URL(link).hostname;
    if (hostname === "meet.google.com") return { link, service: "Google Meet" };
    if (hostname === "teams.microsoft.com" || hostname === "teams.live.com") return { link, service: "Microsoft Teams" };
    if (hostname.endsWith("zoom.us")) return { link, service: "Zoom" };
  }
  return null;
}

function getCalendarRepeatLabel(event) {
  const rule = (event.recurrenceRules || []).find((item) => /RRULE:/i.test(item));
  const frequency = /(?:RRULE:|;)FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i.exec(rule || "")?.[1]?.toUpperCase();
  if (frequency === "WEEKLY") return "Repeats weekly";
  if (frequency === "DAILY") return "Repeats daily";
  if (frequency === "MONTHLY") return "Repeats monthly";
  if (frequency === "YEARLY") return "Repeats yearly";
  return event.isRecurring ? "Recurring event" : "";
}

// Preserve each original line and clickable URLs. Render React text, not HTML,
// so forwarded invitations cannot inject scripts or markup into the modal.
function GoogleCalendarOriginalDescription({ text }) {
  const parts = String(text || "").replace(/\r\n?/g, "\n").split(/(https?:\/\/[^\s<>]+|mailto:[^\s<>]+)/gi);
  return <div className="min-w-0 whitespace-pre-wrap break-words text-[13px] font-normal leading-[1.75] text-[#344054] [overflow-wrap:anywhere]">
    {parts.map((part, index) => {
      if (!/^(https?:\/\/|mailto:)/i.test(part)) return <React.Fragment key={index}>{part}</React.Fragment>;
      const urlPart = part.replace(/[.,;)}\]]+$/, "");
      const trailing = part.slice(urlPart.length);
      const href = urlPart.toLowerCase().startsWith("mailto:")
        ? (/^mailto:[^\s@<>]+@[^\s@<>]+$/i.test(urlPart) ? urlPart : "") : getSafeCalendarWebLink(urlPart);
      if (!href) return <React.Fragment key={index}>{part}</React.Fragment>;
      return <React.Fragment key={index}>
        <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"}
          rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          className="text-[#1967D2] underline underline-offset-2 hover:text-[#174EA6]">{urlPart}</a>{trailing}
      </React.Fragment>;
    })}
  </div>;
}

function ExternalGoogleCalendarReadOnlyDetails({ event, onClose, historical = false }) {
  const description = String(event.notes || "").trim();
  const meeting = detectCalendarMeeting(event);
  const googleGuests = Array.isArray(event.googleAttendees) ? event.googleAttendees : [];
  const organizer = event.googleOrganizer?.email
    ? event.googleOrganizer
    : { email: event.organizer || "", displayName: event.googleOrganizer?.displayName || "" };
  const organizerInGuests = organizer.email && googleGuests.some((guest) => guest.email.toLowerCase() === organizer.email.toLowerCase());
  const guests = organizerInGuests || !organizer.email ? googleGuests : [
    { email: organizer.email, displayName: organizer.displayName, organizer: true, responseStatus: "needsAction" }, ...googleGuests,
  ];
  const accepted = googleGuests.filter((guest) => guest.responseStatus === "accepted").length;
  const tentative = googleGuests.filter((guest) => guest.responseStatus === "tentative").length;
  const awaiting = googleGuests.filter((guest) => guest.responseStatus === "needsAction" || !guest.responseStatus).length;
  const declined = googleGuests.filter((guest) => guest.responseStatus === "declined").length;
  const repeatLabel = getCalendarRepeatLabel(event);
  const meetingLocation = event.location && !/^https?:\/\//i.test(String(event.location)) ? event.location : "";
  const reminder = event.googleReminders;

  return (
    <div className="sibs-action-backdrop-in absolute inset-0 z-[2] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[3px] font-jakarta"
      onMouseDown={(clickEvent) => { if (clickEvent.target === clickEvent.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={historical ? "Past calendar event (read-only)" : "External Google Calendar event (read-only)"}
        className="sibs-modal-pop-in flex max-h-[86vh] w-full max-w-[660px] min-h-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(2,30,56,0.38)]">
        {/* Keep the established SiBS modal header and footer. */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-sibs-navy px-5 py-3.5 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-sibs-orange text-white shadow-sm">
              <CalendarDays className="h-[19px] w-[19px]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-white/75">{historical ? "SIBS CALENDAR · PAST EVENT" : "GOOGLE CALENDAR · READ-ONLY"}</p>
              <h2 className="truncate text-[17px] font-black leading-tight text-white">{historical ? "Past Calendar Event" : "Google Calendar Event"}</h2>
              <p className="truncate text-[10px] font-medium text-white/75">{historical ? "Historical schedule · Asia/Manila" : "Not managed by SiBS HRIS · Asia/Manila"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close event details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white/85 transition hover:bg-white/20 hover:text-white">
            <X className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="thin-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6">
          <div className="border-b border-sibs-border pb-4">
            <h3 className="break-words text-[22px] font-black leading-tight text-sibs-navy">{event.title}</h3>
            <p className="mt-1 text-[13px] font-medium text-sibs-text-secondary">
              {formatDayLabel(event.date, { weekday: "long", year: true })} · {event.startTime === "All Day" ? "All day" : `${event.startTime} – ${event.endTime}`}
            </p>
            {repeatLabel ? <p className="mt-1 text-[12px] text-sibs-text-secondary">{repeatLabel}</p> : null}
          </div>

          {meetingLocation || meeting ? (
            <div className="flex min-w-0 items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sibs-navy" />
              <div className="min-w-0 space-y-1 text-[13px] font-medium text-sibs-navy">
                {meetingLocation ? <p className="break-words">{meetingLocation}</p> : null}
                {meeting ? <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#1967D2] hover:underline">
                  <Link2 size={15} /> Join {meeting.service}
                </a> : null}
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-sibs-navy" />
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-black text-sibs-navy">{googleGuests.length ? `${googleGuests.length} guest${googleGuests.length === 1 ? "" : "s"}` : "Guests & organizer"}</h4>
              {googleGuests.length ? (
                <p className="mt-1 text-[11px] font-medium text-sibs-text-secondary">
                  {accepted ? `${accepted} accepted` : ""}{tentative ? ` · ${tentative} maybe` : ""}{declined ? ` · ${declined} declined` : ""}{awaiting ? ` · ${awaiting} awaiting` : ""}
                </p>
              ) : null}
              <div className="mt-3 space-y-3">
                {guests.map((guest, index) => {
                  const isOrganizer = guest.organizer || Boolean(organizer.email && guest.email.toLowerCase() === organizer.email.toLowerCase());
                  return <div key={`${guest.email || guest.displayName}-${index}`} className="flex min-w-0 items-center gap-3">
                    <GoogleCalendarGuestAvatar guest={guest} account={event.googleAccount} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-[13px] font-semibold leading-5 text-sibs-navy">{googleCalendarGuestLabel(guest)}</p>
                      {guest.displayName && guest.email ? <p className="break-all text-[11px] text-sibs-text-secondary">{guest.email}</p> : null}
                      <p className="text-[11px] text-sibs-text-secondary">{isOrganizer ? "Organizer" : calendarGuestStatus(guest.responseStatus)}{guest.optional ? " · Optional" : ""}</p>
                    </div>
                  </div>;
                })}
                {!guests.length ? <p className="text-[12px] font-medium text-sibs-text-secondary">Google Calendar has not provided a guest list for this event.</p> : null}
              </div>
            </div>
          </div>

          {description ? (
            <div className="flex min-w-0 items-start gap-3 border-t border-sibs-border pt-4">
              <List className="mt-0.5 h-5 w-5 shrink-0 text-sibs-navy" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h4 className="mb-3 text-[12px] font-black text-sibs-navy">Description / agenda</h4>
                <GoogleCalendarOriginalDescription text={description} />
              </div>
            </div>
          ) : null}

          {reminder ? (
            <div className="flex min-w-0 items-start gap-3 border-t border-sibs-border pt-4 text-[12px] text-sibs-text-secondary">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sibs-navy" />
              <div>{reminder.useDefault ? "Google Calendar default reminders" : Array.isArray(reminder.overrides) && reminder.overrides.length
                ? reminder.overrides.map((entry) => `${entry.minutes} minutes before (${entry.method === "email" ? "email" : "notification"})`).join(" · ")
                : "No notifications"}</div>
            </div>
          ) : null}

          <p className="rounded-[10px] border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
            {historical ? "This schedule has already started or its date has passed. Historical events are view-only in SiBS HRIS."
              : "This event is not registered as a SiBS HRIS-managed schedule. It can be viewed here but cannot be edited, rescheduled, or deleted from SiBS HRIS."}
          </p>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-sibs-border bg-white px-5 py-3 sm:px-6">
          {event.googleHtmlLink ? (
            <a href={event.googleHtmlLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-[10px] border border-sibs-border px-4 text-xs font-black text-sibs-navy hover:bg-sibs-canvas">
              View in Google Calendar
            </a>
          ) : null}
          <button type="button" onClick={onClose} className="h-10 rounded-[12px] bg-sibs-orange px-6 text-xs font-black text-white shadow-sm transition hover:bg-sibs-button-hover">Close</button>
        </footer>
      </section>
    </div>
  );
}

function ManagedRecruitmentCalendarDetails({ event, onClose, onOpenCandidate }) {
  // Numeric candidate_pipeline.id is the canonical link. Older managed events
  // may carry only the public PUB-... ID in metadata or their description.
  const pipelineId = String(event.candidatePipelineId || "").trim();
  const storedCandidateId = String(event.candidateId || "").trim();
  const descriptionCandidateId = String(event.notes || "").match(/^Candidate ID:\s*(\S+)/im)?.[1] || "";
  const candidateId = storedCandidateId || descriptionCandidateId;
  const candidateRoute = /^\d+$/.test(pipelineId)
    ? `/recruitment/candidate-pipeline?pipelineId=${encodeURIComponent(pipelineId)}`
    : candidateId
      ? `/recruitment/candidate-pipeline?candidateId=${encodeURIComponent(candidateId)}`
      : "";

  return (
    <div
      className="sibs-action-backdrop-in absolute inset-0 z-[2] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[3px] font-jakarta"
      onMouseDown={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="SiBS HRIS recruitment schedule details (read-only)"
        className="sibs-modal-pop-in flex max-h-[86vh] w-full max-w-[660px] min-h-0 flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(2,30,56,0.38)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-sibs-navy px-5 py-3.5 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-sibs-orange text-white shadow-sm">
              <CalendarDays className="h-[19px] w-[19px]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-white/75">SiBS HRIS Operational Workspace</p>
              <h2 className="truncate text-[17px] font-black leading-tight text-white">Recruitment Schedule Details</h2>
              <p className="truncate text-[10px] font-medium text-white/75">HR &amp; Talent Acquisition · Asia/Manila</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close recruitment schedule details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-white/85 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="thin-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6">
          <div>
            <h3 className="break-words border-b border-sibs-border pb-3 text-[22px] font-black leading-tight text-sibs-navy">
              {event.title}
            </h3>
            <p className="mt-3 inline-flex rounded-[9px] border border-sibs-border bg-sibs-canvas px-3 py-2 text-[11px] font-bold text-sibs-text-secondary">
              SiBS HRIS managed · View only
            </p>
          </div>

          <div className="space-y-4 text-sm font-semibold text-sibs-navy">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-sibs-orange" aria-hidden="true" />
              <div>
                <p className="text-sibs-navy">{formatDayLabel(event.date, { year: true })}</p>
                <p className="mt-1 text-xs text-sibs-text-secondary">
                  {event.startTime === "All Day" ? "All day" : `${event.startTime} – ${event.endTime}`} · Asia/Manila
                </p>
              </div>
            </div>
            {event.site ? (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sibs-navy" aria-hidden="true" />
                <div><span className="text-xs text-sibs-text-secondary">Site</span><p className="break-words">{event.site}</p></div>
              </div>
            ) : null}
            {event.location ? (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sibs-navy" aria-hidden="true" />
                <div><span className="text-xs text-sibs-text-secondary">Location</span><p className="break-words">{event.location}</p></div>
              </div>
            ) : null}
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-sibs-orange" aria-hidden="true" />
              <div><span className="text-xs text-sibs-text-secondary">Status</span><p>{event.status}</p></div>
            </div>
          </div>

          <p className="rounded-[10px] border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-semibold text-blue-800">
            This is a confirmed SiBS HRIS recruitment schedule. Changes and candidate reschedule requests must be managed through the Candidate Pipeline, not directly through Google Calendar.
          </p>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-sibs-border bg-white px-5 py-3 sm:px-6">
          {event.googleHtmlLink ? (
            <a
              href={event.googleHtmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-[10px] border border-sibs-border px-4 text-xs font-black text-sibs-navy transition hover:bg-sibs-canvas"
            >
              View in Google Calendar
            </a>
          ) : null}
          {candidateRoute ? (
            <Link
              to={candidateRoute}
              onClick={onOpenCandidate}
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-sibs-orange px-5 text-xs font-black text-white shadow-sm transition hover:bg-sibs-button-hover"
            >
              Open Candidate Pipeline
            </Link>
          ) : (
            <span
              title="This older Google Calendar event has no linked HRIS candidate ID"
              className="inline-flex h-10 cursor-not-allowed items-center rounded-[10px] bg-slate-200 px-4 text-xs font-bold text-slate-500"
            >
              Candidate record not linked
            </span>
          )}
        </footer>
      </section>
    </div>
  );
}

function MonthCalendarView({
  monthCells,
  eventsByDate,
  todayKey,
  nowMs,
  onCreateEvent,
  onEditEvent,
  onViewDay,
}) {
  // On phones, tapping a date reveals its schedules below the month rather
  // than accidentally creating an event or cutting off event names.
  const [mobileDaySelection, setMobileDaySelection] = useState(todayKey);
  const mobileSelectedDay = monthCells.some(
    (cell) => cell.key === mobileDaySelection &&
      canOpenCalendarDay(cell.key, (eventsByDate[cell.key] || []).length, nowMs),
  )
    ? mobileDaySelection
    : (monthCells.find((cell) => cell.inMonth &&
        canOpenCalendarDay(cell.key, (eventsByDate[cell.key] || []).length, nowMs))?.key ||
      monthCells.find((cell) =>
        canOpenCalendarDay(cell.key, (eventsByDate[cell.key] || []).length, nowMs))?.key || "");
  const mobileDayEvents = sortEventsByDateTime(eventsByDate[mobileSelectedDay] || []);

  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white">
      {/* Compact mobile month + readable, selectable daily schedule list. */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 border-b border-sibs-border bg-sibs-canvas px-1.5 py-2">
          {WEEKDAY_LABELS.map((day) => (
            <span key={day} className="text-center text-[10px] font-black uppercase text-sibs-text-secondary">
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px border-b border-sibs-border bg-sibs-border-subtle px-px pb-px">
          {monthCells.map((cell) => {
            const dayEvents = eventsByDate[cell.key] || [];
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === mobileSelectedDay;
            const canOpenDay = canOpenCalendarDay(cell.key, dayEvents.length, nowMs);
            return (
              <button
                key={cell.key}
                type="button"
                disabled={!canOpenDay}
                onClick={() => setMobileDaySelection(cell.key)}
                aria-pressed={canOpenDay && isSelected}
                aria-controls={canOpenDay ? "sibs-mobile-calendar-day-events" : undefined}
                aria-label={`${formatDayLabel(cell.key, { weekday: "long", year: true })}: ${dayEvents.length} schedule${dayEvents.length === 1 ? "" : "s"}${!canOpenDay ? ", unavailable" : ""}`}
                title={!canOpenDay ? "No schedules to view on this past date" : undefined}
                className={[
                  "flex min-h-[53px] min-w-0 flex-col items-center justify-start gap-1 bg-white px-0.5 py-1.5 text-center transition-colors focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-sibs-orange",
                  !cell.inMonth ? "bg-sibs-canvas text-sibs-muted" : "text-sibs-navy",
                  isPastCalendarDay(cell.key, nowMs) && !canOpenDay ? "opacity-60" : "",
                  !canOpenDay ? "cursor-default" : isSelected ? "bg-blue-50 ring-2 ring-inset ring-sibs-navy" : "hover:bg-sibs-canvas",
                ].join(" ")}
              >
                <span className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold tabular-nums",
                  isToday ? "bg-sibs-orange text-white" : "",
                ].join(" ")}>
                  {cell.date.getDate()}
                </span>
                {dayEvents.length ? (
                  <span className="flex h-2 items-center justify-center gap-0.5" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((event, index) => (
                      <span key={`${event.id}-${index}`} className={`h-1.5 w-1.5 rounded-full ${EVENT_DOT_COLORS[event.color] || EVENT_DOT_COLORS.blue}`} />
                    ))}
                    {dayEvents.length > 3 ? <span className="text-[9px] font-black leading-none text-sibs-text-secondary">+</span> : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {mobileSelectedDay ? (
        <section id="sibs-mobile-calendar-day-events" className="min-w-0 bg-sibs-canvas px-3 py-4" aria-live="polite">
          <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[13px] font-black leading-5 text-sibs-navy">
                {formatDayLabel(mobileSelectedDay, { weekday: "long", year: true })}
              </h3>
              <p className="text-[11px] font-medium text-sibs-text-secondary">
                {mobileDayEvents.length} schedule{mobileDayEvents.length === 1 ? "" : "s"} · Philippine time
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCreateEvent(mobileSelectedDay)}
              disabled={!canCreateCalendarEventOnDate(mobileSelectedDay, nowMs)}
              title={!canCreateCalendarEventOnDate(mobileSelectedDay, nowMs) ? "Past date or no future time slots remaining" : "Add schedule"}
              className="inline-flex h-9 disabled:cursor-not-allowed disabled:opacity-40 shrink-0 items-center gap-1 rounded-lg border border-sibs-border bg-white px-3 text-[11px] font-black text-sibs-navy shadow-sm transition hover:border-sibs-orange hover:text-sibs-orange"
              aria-label={`Create schedule on ${formatDayLabel(mobileSelectedDay, { year: true })}`}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {mobileDayEvents.length ? (
            <div className="space-y-2">
              {mobileDayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEditEvent(sourceCalendarEvent(event))}
                  className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-sibs-border bg-white p-3 text-left shadow-sm transition hover:border-sibs-orange/50 hover:bg-white"
                  aria-label={`View ${event.title}, ${event.startTime}`}
                >
                  <span className={`mt-1 h-8 w-1 shrink-0 rounded-full ${EVENT_DOT_COLORS[event.color] || EVENT_DOT_COLORS.blue}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-xs font-black leading-5 text-sibs-navy">{event.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-sibs-text-secondary">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-sibs-orange" />
                      {event.startTime === "All Day" ? "All day" : `${event.startTime} – ${event.endTime}`}
                    </span>
                    {event.account || event.site || event.location ? (
                      <span className="mt-1 block break-words text-[11px] text-sibs-text-secondary">
                        {event.account || event.site || event.location}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-sibs-muted" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-sibs-border bg-white px-4 py-6 text-center">
              <CalendarDays className="mx-auto h-6 w-6 text-sibs-muted" aria-hidden="true" />
              <p className="mt-2 text-xs font-bold text-sibs-navy">No schedules for this day</p>
              <p className="mt-1 text-[11px] text-sibs-text-secondary">Select another date or add a new schedule.</p>
            </div>
          )}
        </section>
        ) : null}
      </div>

      {/* Preserve the full-size interactive event grid for desktop. */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-sibs-border bg-sibs-navy">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="border-r border-sibs-navy/80 px-3 py-3 text-center text-[10px] font-black uppercase text-white last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid min-w-[720px] grid-cols-7">
          {monthCells.map((cell) => {
            const dayEvents = sortEventsByDateTime(eventsByDate[cell.key] || []);
            const isToday = cell.key === todayKey;
            const canCreateDay = canCreateCalendarEventOnDate(cell.key, nowMs);
            const canOpenDay = canOpenCalendarDay(cell.key, dayEvents.length, nowMs);

            return (
              <div
                key={cell.key}
                onClick={canOpenDay ? () => {
                  if (canCreateDay) onCreateEvent(cell.key);
                  else onViewDay(cell.key);
                } : undefined}
                title={canCreateDay ? "Add schedule" : dayEvents.length ? "View existing schedules (read only)" : undefined}
                className={[
                  "group flex min-h-[118px] flex-col border-r border-b border-sibs-border p-3 text-left transition last:border-r-0",
                  canOpenDay ? "cursor-pointer hover:bg-sibs-canvas" : "cursor-default",
                  isPastCalendarDay(cell.key, nowMs) ? "bg-slate-50/80" : "",
                  cell.inMonth ? "bg-white" : "bg-sibs-canvas",
                  isToday ? "ring-2 ring-inset ring-sibs-orange" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black",
                    isToday
                      ? "bg-sibs-orange text-white"
                      : cell.inMonth
                        ? "text-sibs-primary-1"
                        : "text-sibs-text-secondary",
                  ].join(" ")}
                >
                  {cell.date.getDate()}
                </span>

                <div className="mt-1.5 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <CompactScheduleCard
                      key={event.id}
                      event={event}
                      onEdit={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onEditEvent(sourceCalendarEvent(event));
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <button
                      type="button"
                      className="block w-full rounded px-1 text-left text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
                      onClick={(clickEvent) => { clickEvent.stopPropagation(); onViewDay(cell.key); }}
                      title={`View all Google Calendar events on ${cell.key}`}
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
                {canCreateDay ? (
                  <span className="mt-auto hidden pt-1 text-[10px] text-sibs-text-secondary group-hover:block">+ Create event</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekCalendarView({
  calendarLoading,
  weekCells,
  eventsByDate,
  todayKey,
  nowMs,
  onCreateEvent,
  onEditEvent,
}) {
  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-sibs-canvas p-3 sm:p-4">
      <section className="flex min-h-full min-w-0 flex-col rounded-[14px] bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-sibs-navy">
            <CalendarDays className="h-4 w-4 text-sibs-orange" />
            7-Day Operational HR & TA Weekly Schedule View
          </div>
          <span className="text-xs font-bold text-sibs-text-secondary">
            Active Week Window
          </span>
        </div>

        <div className="mt-4 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[880px] xl:grid-cols-7">
          {weekCells.map((cell) => {
            const dayEvents = sortEventsByDateTime(
              eventsByDate[cell.key] || [],
            );
            const isToday = cell.key === todayKey;

            return (
              <div
                key={cell.key}
                className={[
                  "flex min-h-[120px] flex-col rounded-[12px] border bg-sibs-canvas p-3 xl:min-h-full",
                  isToday
                    ? "border-sibs-orange ring-1 ring-sibs-orange"
                    : "border-sibs-border",
                  isPastCalendarDay(cell.key, nowMs) ? "opacity-70" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between border-b border-sibs-border-subtle pb-2">
                  <span
                    className={[
                      "text-xs font-black",
                      isToday ? "text-sibs-orange" : "text-sibs-navy",
                    ].join(" ")}
                  >
                    {cell.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCreateEvent(cell.key)}
                    disabled={!canCreateCalendarEventOnDate(cell.key, nowMs)}
                    title={!canCreateCalendarEventOnDate(cell.key, nowMs) ? "Past date or elapsed time slots · view only" : "Add schedule"}
                    className="flex h-6 w-6 disabled:cursor-not-allowed disabled:opacity-30 items-center justify-center rounded-md text-sibs-navy transition hover:cursor-pointer hover:bg-sibs-canvas hover:text-sibs-orange"
                    aria-label={`Add schedule on ${cell.label}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="thin-scroll mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {!calendarLoading && dayEvents.length === 0 ? (
                    <div className="flex min-h-[58px] items-center justify-center text-center text-[11px] font-semibold italic text-sibs-text-secondary xl:min-h-[260px]">
                      No events scheduled
                    </div>
                  ) : null}

                  {dayEvents.map((event) => (
                    <WeekScheduleCard
                      key={event.id}
                      event={event}
                      onEdit={() => onEditEvent(sourceCalendarEvent(event))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// Google Calendar descriptions sometimes contain an entire forwarded email or
// meeting invitation, including attendees, reply headers, URLs, and RSVP data.
// Keep the ORIGINAL notes on the event for the details modal; Agenda only needs
// a short, readable preview so one imported event cannot fill the whole view.
function summarizeAgendaDescription(notes) {
  const original = String(notes || "").trim();
  if (!original) return "";

  const forwardedHeader = /(?:-{2,}\s*(?:original appointment|original message|forwarded message)\s*-{2,}|(?:^|\n)\s*(?:begin forwarded message|from:\s*google calendar|on .{6,100} wrote:))/im;
  const forwardedMatch = forwardedHeader.exec(original);
  const plainText = (forwardedMatch ? original.slice(0, forwardedMatch.index) : original)
    // Remove pasted email HTML and long URLs from the compact summary only.
    .replace(/<[^>]*>/g, " ")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ")
    .replace(/\bmailto:\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText && forwardedMatch) {
    return "Imported invitation · Open details to read the original message.";
  }
  if (!plainText) return "";

  const limit = 160;
  if (plainText.length <= limit) return plainText;
  const lastSpace = plainText.lastIndexOf(" ", limit);
  return `${plainText.slice(0, lastSpace > 105 ? lastSpace : limit).trimEnd()}…`;
}

function formatAgendaLocation(location) {
  const value = String(location || "").trim();
  if (/^https?:\/\/meet\.google\.com\//i.test(value)) return "Google Meet";
  if (/^https?:\/\//i.test(value)) return "Online meeting link";
  return value;
}

function AgendaNotePreview({ notes }) {
  const preview = summarizeAgendaDescription(notes);
  if (!preview) return null;
  return (
    <p className="mt-2 max-w-full break-words rounded-lg border border-sibs-border bg-sibs-canvas px-3 py-2 text-[11px] font-medium leading-relaxed text-sibs-text-secondary">
      {preview}
    </p>
  );
}

function AgendaCalendarView({
  events,
  nowMs,
  onEditEvent,
  onDeleteEvent,
  onRescheduleEvent,
}) {
  const sortedEvents = sortEventsByDateTime(events);

  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-sibs-canvas p-3 sm:p-4">
      <section className="flex min-h-full min-w-0 flex-col rounded-[14px] bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-sibs-navy">
            <List className="h-4 w-4" />
            Agenda Schedule Directory ({sortedEvents.length} Items)
          </div>
          <span className="text-xs font-bold text-sibs-text-secondary">
            Chronological View
          </span>
        </div>

        <div className="mt-3 min-w-0 flex-1 space-y-3">
          {sortedEvents.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[12px] border border-dashed border-sibs-border bg-sibs-canvas px-4 py-10 text-center text-sm font-bold text-sibs-text-secondary">
              No schedules match the selected filters.
            </div>
          ) : null}

          {sortedEvents.map((event) => (
            <article
              key={event.id}
              className="flex min-w-0 flex-wrap items-start gap-3 rounded-[12px] border border-sibs-border bg-white p-3 shadow-sm sm:flex-nowrap sm:gap-4 sm:p-4"
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[12px] bg-sibs-navy text-white">
                <span className="text-[10px] font-black uppercase">
                  {formatDayLabel(event.date, { month: "long" }).split(" ")[0]}
                </span>
                <span className="text-xl font-black">
                  {formatDayLabel(event.date, { month: "long" }).split(" ")[1]}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "rounded-md border px-2 py-0.5 text-[10px] font-extrabold",
                      EVENT_COLORS[event.color] || EVENT_COLORS.blue,
                    ].join(" ")}
                  >
                    {event.category}
                  </span>
                  <span
                    className={[
                      "rounded-md border px-2 py-0.5 text-[10px] font-extrabold",
                      STATUS_BADGE_CLASSES[event.status] ||
                        STATUS_BADGE_CLASSES.Scheduled,
                    ].join(" ")}
                  >
                    {event.status}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-sibs-navy sm:text-sm">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-sibs-orange" />
                    {event.startTime === "All Day" ? "All day" : `${event.startTime} – ${event.endTime}`}
                  </span>
                </div>

                <h3 className="mt-2 break-words text-sm font-black text-sibs-primary-1">
                  {event.title}
                </h3>
                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-sibs-text-secondary">
                  {event.account ? (
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                      <Users className="h-3.5 w-3.5 shrink-0 text-sibs-navy" />
                      <span className="min-w-0 break-words">Account: {event.account}</span>
                    </span>
                  ) : null}
                  {event.organizer ? (
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                      <Users className="h-3.5 w-3.5 shrink-0 text-sibs-navy" />
                      <span className="min-w-0 break-all sm:max-w-[300px] sm:truncate" title={event.organizer}>
                        Host: {event.organizer}
                      </span>
                    </span>
                  ) : null}
                  {event.location ? (
                    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-sibs-orange" />
                      <span className="min-w-0 break-words sm:max-w-[260px] sm:truncate" title={event.location}>
                        {formatAgendaLocation(event.location)}
                      </span>
                    </span>
                  ) : null}
                </div>

                <AgendaNotePreview notes={event.notes} />
              </div>

              <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:w-auto">
                {isEditableHrisCalendarEvent(sourceCalendarEvent(event)) && !isPastCalendarEvent(sourceCalendarEvent(event), nowMs) && <>
                <button
                  type="button"
                  onClick={() => onRescheduleEvent(sourceCalendarEvent(event), 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-sibs-canvas px-3 text-xs font-black text-sibs-navy transition hover:cursor-pointer hover:brightness-95"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-sibs-orange" />
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => onRescheduleEvent(sourceCalendarEvent(event), 7)}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-sibs-canvas px-3 text-xs font-black text-sibs-navy transition hover:cursor-pointer hover:brightness-95"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-sibs-orange" />
                  +1 Wk
                </button>
                </>}
                <button
                  type="button"
                  onClick={() => onEditEvent(sourceCalendarEvent(event))}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-sibs-navy px-3 text-xs font-black text-white transition hover:cursor-pointer hover:brightness-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {isEditableHrisCalendarEvent(sourceCalendarEvent(event)) && !isPastCalendarEvent(sourceCalendarEvent(event), nowMs) ? "Edit / Resched" : "View details"}
                </button>
                {isEditableHrisCalendarEvent(sourceCalendarEvent(event)) && !isPastCalendarEvent(sourceCalendarEvent(event), nowMs) && <button
                  type="button"
                  onClick={() => onDeleteEvent(sourceCalendarEvent(event).id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-sibs-muted transition hover:cursor-pointer hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Delete ${event.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function GoogleLogoIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.281-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function SmallFeatureIcon({ type }) {
  if (type === "shield") {
    return (
      <svg
        className="h-3.5 w-3.5 text-emerald-500"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 3.75 18.25 6v5.25c0 4.1-2.55 7.75-6.25 9-3.7-1.25-6.25-4.9-6.25-9V6L12 3.75Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m9.5 12 1.6 1.6 3.65-3.85"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "video") {
    return (
      <svg
        className="h-3.5 w-3.5 text-blue-500"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4.5 7.5h10v9h-10v-9Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m14.5 10.25 5-2.75v9l-5-2.75v-3.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="h-3.5 w-3.5 text-sibs-orange" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 9.5a6 6 0 1 0-12 0c0 7-2.5 7-2.5 7h17s-2.5 0-2.5-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.75 20a2 2 0 0 1-3.5 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleCalendarAuthRequiredScreen({
  onConnect,
  calendarLoading,
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-sibs-canvas px-4 py-6 2xl:py-10">
      <section className="w-full max-w-md 2xl:max-w-[500px] rounded-2xl border border-sibs-border bg-white p-5 sm:p-6 2xl:p-8 text-center shadow-[0_18px_42px_rgba(2,30,56,0.12)]">
        <div className="mx-auto flex h-11 w-11 2xl:h-14 2xl:w-14 items-center justify-center rounded-xl 2xl:rounded-2xl bg-blue-50 text-sibs-navy shadow-sm">
          <CalendarDays className="h-5 w-5 2xl:h-7 2xl:w-7" />
        </div>

        <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-white px-3 py-0.5 text-[9px] 2xl:text-[10px] font-black text-amber-800">
          <svg
            className="h-3 w-3 text-amber-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M7 10V8a5 5 0 0 1 10 0v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M6 10h12v10H6V10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          Google Calendar Access Required
        </div>

        <h3 className="sibs-modal-title mt-3 2xl:mt-5 text-sibs-navy">
          Connect Google Workspace
        </h3>

        <p className="sibs-modal-subtitle mx-auto mt-2 max-w-[360px] leading-relaxed text-sibs-text-secondary">
          To view and synchronize live HR &amp; Talent Acquisition schedules, please
          authenticate with your organization's Google account.
        </p>

        <button
          type="button"
          onClick={onConnect}
          disabled={calendarLoading}
          className="mt-5 2xl:mt-7 inline-flex h-10 2xl:h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-sibs-border bg-white px-5 text-xs 2xl:text-sm font-black text-sibs-primary-1 shadow-[0_4px_10px_rgba(2,30,56,0.12)] transition hover:cursor-pointer hover:border-sibs-border hover:bg-sibs-canvas disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleLogoIcon className="h-4.5 w-4.5" />
          {calendarLoading ? "Connecting..." : "Sign in with Google"}
        </button>

        <div className="mt-4 2xl:mt-6 border-t border-sibs-border pt-3.5 2xl:pt-4">
          <div className="flex flex-wrap items-center justify-center gap-1.5 2xl:gap-2">
            <span className="inline-flex h-6 2xl:h-7 items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-canvas px-2.5 text-[9px] 2xl:text-[10px] font-extrabold text-sibs-text-secondary">
              <SmallFeatureIcon type="shield" />
              OAuth 2.0 Secure
            </span>

            <span className="inline-flex h-6 2xl:h-7 items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-canvas px-2.5 text-[9px] 2xl:text-[10px] font-extrabold text-sibs-text-secondary">
              <SmallFeatureIcon type="video" />
              Meet &amp; Teams Links
            </span>

            <span className="inline-flex h-6 2xl:h-7 items-center gap-1.5 rounded-lg border border-sibs-border bg-sibs-canvas px-2.5 text-[9px] 2xl:text-[10px] font-extrabold text-sibs-text-secondary">
              <SmallFeatureIcon type="bell" />
              Real-Time Sync
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function waitForGoogleCalendarSync(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export default function HeaderCalendarModal({ open, user, onClose, onSyncComplete }) {
  const { nowMs, getNowMs } = useManilaCalendarClock(open);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState("");
  const [googleCalendarProfile, setGoogleCalendarProfile] = useState({
    name: "",
    givenName: "",
    familyName: "",
  });
  const [viewMode, setViewMode] = useState("Month");
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);
  const [orphanDialogOpen, setOrphanDialogOpen] = useState(false);
  const [orphanPreview, setOrphanPreview] = useState(null);
  const [orphanBusy, setOrphanBusy] = useState(false);
  const [orphanMessage, setOrphanMessage] = useState("");
  const [selectedLegacyIds, setSelectedLegacyIds] = useState([]);
  const orphanDialogRef = useRef(null);
  const orphanPreviousFocusRef = useRef(null);
  const calendarLoadRequestRef = useRef(0);
  const googleConnectPopupTimerRef = useRef(null);
  const wasOpenRef = useRef(false);
  const calendarConnectedRef = useRef(false);
  const calendarSyncedRef = useRef(false);
  const lastLoadedRangeRef = useRef("");
  const googleConnectFinalizingRef = useRef(false);
  const calendarLoadingTimeoutRef = useRef(null);

  const handlePortalCleanup = useCallback(() => {
    calendarLoadRequestRef.current += 1;
  }, []);

  const renderCalendarPortal = useHeaderCalendarPortal({
    open,
    onClose,
    onCleanup: handlePortalCleanup,
  });

  // A cleanup preview is a nested modal. Keep keyboard focus within it and
  // prevent Escape from dismissing the entire calendar behind the dialog.
  useEffect(() => {
    if (!orphanDialogOpen) return undefined;
    orphanPreviousFocusRef.current = document.activeElement;
    orphanDialogRef.current?.focus({ preventScroll: true });
    return () => {
      if (orphanPreviousFocusRef.current?.isConnected) {
        orphanPreviousFocusRef.current.focus({ preventScroll: true });
      }
    };
  }, [orphanDialogOpen]);

  useEffect(() => {
    if (!orphanDialogOpen) return undefined;

    const handleCleanupDialogKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation?.();
        event.stopPropagation();
        if (!orphanBusy) closeOrphanCleanup();
        return;
      }
      if (event.key !== "Tab" || !orphanDialogRef.current) return;
      const focusable = [...orphanDialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === orphanDialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !orphanDialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleCleanupDialogKeydown, true);
    return () => document.removeEventListener("keydown", handleCleanupDialogKeydown, true);
    // The cleanup handlers are component-local functions; only active dialog state matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orphanDialogOpen, orphanBusy]);

  const organizerLabel = useMemo(() => {
    const googleProfileName = firstCalendarValue(
      googleCalendarProfile.name,
      `${googleCalendarProfile.givenName || ""} ${
        googleCalendarProfile.familyName || ""
      }`,
    );

    return (
      firstCalendarValue(
        googleProfileName,
        formatGoogleEmailDisplayName(googleCalendarEmail),
        formatCalendarUserName(user),
        googleCalendarEmail,
        user?.email,
        user?.gy_user_email,
      ) || "Google Calendar"
    );
  }, [googleCalendarEmail, googleCalendarProfile, user]);

  const clearCalendarLoadingTimeout = useCallback(() => {
    if (calendarLoadingTimeoutRef.current) {
      window.clearTimeout(calendarLoadingTimeoutRef.current);
      calendarLoadingTimeoutRef.current = null;
    }
  }, []);

  const startCalendarLoading = useCallback(() => {
    clearCalendarLoadingTimeout();
    setCalendarLoading(true);

    calendarLoadingTimeoutRef.current = window.setTimeout(() => {
      calendarLoadingTimeoutRef.current = null;
      googleConnectFinalizingRef.current = false;
      setCalendarLoading(false);
      setCalendarError(
        "Google Calendar sync took too long. Please click Sync again.",
      );
    }, GOOGLE_CALENDAR_UI_SYNC_TIMEOUT_MS);
  }, [clearCalendarLoadingTimeout]);

  const stopCalendarLoading = useCallback(() => {
    clearCalendarLoadingTimeout();
    setCalendarLoading(false);
  }, [clearCalendarLoadingTimeout]);

  useLayoutEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      calendarLoadRequestRef.current += 1;
      lastLoadedRangeRef.current = "";
      calendarSyncedRef.current = false;
      setCalendarSynced(false);
      setViewDate(new Date());
      setEditingEvent(null);
      setSelectedDay("");
      setDisconnectConfirmOpen(false);
      setOrphanDialogOpen(false);
      setOrphanPreview(null);
      setOrphanMessage("");
      setCalendarError("");
      window.setTimeout(() => {
        loadGoogleCalendarEvents({
          force: true,
          checkStatus: true,
        });
      }, 0);
      return;
    }

    if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
      calendarLoadRequestRef.current += 1;
      clearGoogleCalendarPopupTimer();
      googleConnectFinalizingRef.current = false;
      stopCalendarLoading();
      setDisconnectConfirmOpen(false);
      setOrphanDialogOpen(false);
    }
    // The open reset must run exactly when `open` flips; `loadGoogleCalendarEvents`
    // is invoked after the reset so the modal always syncs on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stopCalendarLoading]);

  async function loadGoogleCalendarStatus() {
    try {
      const payload = await getGoogleCalendarStatus();

      if (payload?.success === false) {
        calendarConnectedRef.current = false;
        calendarSyncedRef.current = false;
        setCalendarSynced(false);
        lastLoadedRangeRef.current = "";
        setCalendarConnected(false);
        setGoogleCalendarEmail("");
        setGoogleCalendarProfile({ name: "", givenName: "", familyName: "" });
        return {
          connected: false,
          googleEmail: "",
          googleName: "",
          googleGivenName: "",
          googleFamilyName: "",
        };
      }

      const connected = Boolean(payload?.connected);
      const googleEmail = payload?.googleEmail || "";
      const googleProfile = {
        name: payload?.googleName || "",
        givenName: payload?.googleGivenName || "",
        familyName: payload?.googleFamilyName || "",
      };

      calendarConnectedRef.current = connected;
      calendarSyncedRef.current = connected && Boolean(payload?.synced);
      setCalendarSynced(calendarSyncedRef.current);

      if (!connected) {
        lastLoadedRangeRef.current = "";
      }

      setCalendarConnected(connected);
      setGoogleCalendarEmail(googleEmail);
      setGoogleCalendarProfile(googleProfile);

      return {
        connected,
        synced: calendarSyncedRef.current,
        googleEmail,
        googleName: googleProfile.name,
        googleGivenName: googleProfile.givenName,
        googleFamilyName: googleProfile.familyName,
      };
    } catch {
      calendarConnectedRef.current = false;
      calendarSyncedRef.current = false;
      setCalendarSynced(false);
      lastLoadedRangeRef.current = "";
      setCalendarConnected(false);
      setGoogleCalendarEmail("");
      setGoogleCalendarProfile({ name: "", givenName: "", familyName: "" });

      return {
        connected: false,
        googleEmail: "",
      };
    }
  }

  function clearGoogleCalendarPopupTimer() {
    if (googleConnectPopupTimerRef.current) {
      window.clearInterval(googleConnectPopupTimerRef.current);
      googleConnectPopupTimerRef.current = null;
    }
  }

  async function finishGoogleCalendarConnection() {
    if (!open || googleConnectFinalizingRef.current) return;

    googleConnectFinalizingRef.current = true;
    clearGoogleCalendarPopupTimer();

    const requestId = calendarLoadRequestRef.current + 1;
    calendarLoadRequestRef.current = requestId;

    startCalendarLoading();
    setCalendarError("");

    try {
      let statusResult = {
        connected: false,
        googleEmail: "",
      };

      for (let attempt = 0; attempt < 12; attempt += 1) {
        statusResult = await loadGoogleCalendarStatus();

        if (calendarLoadRequestRef.current !== requestId) return;

        if (statusResult.connected) break;

        await waitForGoogleCalendarSync(500);
      }

      if (!statusResult.connected) {
        throw new Error(
          "Google Calendar connection is still finalizing. Please click Sync again.",
        );
      }

      const { timeMin, timeMax } = getMonthRange(viewDate);
      const rangeKey = `${timeMin}|${timeMax}`;

      const payload = await getGoogleCalendarEvents({
        timeMin,
        timeMax,
        maxResults: 250,
      });

      if (payload?.success === false || payload?.connected === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Google Calendar is disconnected or could not complete synchronization.",
        );
      }

      if (calendarLoadRequestRef.current !== requestId) return;
      const googleEvents = Array.isArray(payload?.events)
        ? payload.events
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      lastLoadedRangeRef.current = rangeKey;
      calendarConnectedRef.current = true;
      calendarSyncedRef.current = true;
      setCalendarSynced(true);
      setCalendarConnected(true);
      setGoogleCalendarEmail(statusResult.googleEmail || "");
      setGoogleCalendarProfile({
        name: statusResult.googleName || "",
        givenName: statusResult.googleGivenName || "",
        familyName: statusResult.googleFamilyName || "",
      });
      setEvents(googleEvents.map((event) => normalizeGoogleCalendarEvent(event, {
        email: payload?.googleAccountEmail || googleCalendarEmail || "",
        photoUrl: payload?.googleProfilePicture || "",
      })));
      // Resume the interview only after the first successful event sync.
      onSyncComplete?.();
    } catch (error) {
      if (calendarLoadRequestRef.current !== requestId) return;

      setCalendarError(
        error?.message || "Unable to finish Google Calendar sync.",
      );
    } finally {
      stopCalendarLoading();
      googleConnectFinalizingRef.current = false;
    }
  }

  useEffect(() => {
    if (!open) return undefined;

    function handleGoogleCalendarMessage(event) {
      if (event.data?.type === "GOOGLE_CALENDAR_CONNECTED") {
        clearGoogleCalendarPopupTimer();
        finishGoogleCalendarConnection();
      }

      if (event.data?.type === "GOOGLE_CALENDAR_FAILED") {
        clearGoogleCalendarPopupTimer();
        googleConnectFinalizingRef.current = false;
        stopCalendarLoading();
        setCalendarConnected(false);
        calendarSyncedRef.current = false;
        setCalendarSynced(false);
        setGoogleCalendarEmail("");
        setGoogleCalendarProfile({ name: "", givenName: "", familyName: "" });
        setCalendarError("Google Calendar connection failed.");
      }
    }

    window.addEventListener("message", handleGoogleCalendarMessage);

    return () => {
      window.removeEventListener("message", handleGoogleCalendarMessage);
      clearGoogleCalendarPopupTimer();
      clearCalendarLoadingTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadGoogleCalendarEvents(options = {}) {
    if (!open) return;

    const { force = false, checkStatus = false } = options;
    const requestId = calendarLoadRequestRef.current + 1;
    calendarLoadRequestRef.current = requestId;

    setCalendarError("");

    try {
      let isConnected = calendarConnectedRef.current;

      if (checkStatus || !isConnected) {
        const statusResult = await loadGoogleCalendarStatus();

        isConnected = statusResult.connected;
      }

      if (!isConnected) {
        setEvents([]);
        stopCalendarLoading();
        return;
      }

      const { timeMin, timeMax } = getMonthRange(viewDate);
      const rangeKey = `${timeMin}|${timeMax}`;

      if (!force && lastLoadedRangeRef.current === rangeKey && calendarSyncedRef.current) {
        stopCalendarLoading();
        return;
      }

      startCalendarLoading();

      const payload = await getGoogleCalendarEvents({
        timeMin,
        timeMax,
        maxResults: 250,
      });

      if (payload?.success === false || payload?.connected === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Google Calendar is disconnected or could not complete synchronization.",
        );
      }

      if (calendarLoadRequestRef.current !== requestId) return;
      const googleEvents = Array.isArray(payload?.events)
        ? payload.events
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      lastLoadedRangeRef.current = rangeKey;
      calendarConnectedRef.current = true;
      calendarSyncedRef.current = true;
      setCalendarSynced(true);
      setEvents(googleEvents.map((event) => normalizeGoogleCalendarEvent(event, {
        email: payload?.googleAccountEmail || googleCalendarEmail || "",
        photoUrl: payload?.googleProfilePicture || "",
      })));
      setCalendarConnected(true);
      // Covers both a newly connected account and an existing account needing Sync.
      // The Header decides whether this calendar was launched by interview scheduling.
      onSyncComplete?.();
      const recruitment = payload?.recruitmentSync;
      const firstSyncError = recruitment?.results?.flatMap((candidate) => [
        ...(candidate?.results || []),
        ...(candidate?.error ? [{ error: candidate.error, status: "FAILED" }] : []),
      ])?.find((entry) => entry?.error && ["FAILED", "PENDING"].includes(entry.status))?.error;
      if (recruitment?.error || Number(recruitment?.failedCandidates || 0) > 0) {
        setCalendarError(`SiBS HRIS Google sync needs attention: ${Number(recruitment?.failedCandidates || 0)} failed candidate schedule(s). ${recruitment?.error || firstSyncError || "Review recruitment_calendar_sync.last_sync_error and retry after fixing the Google connection."}`);
      } else if (Number(recruitment?.pendingCandidates || 0) > 0) {
        setCalendarError(`${Number(recruitment.pendingCandidates)} approved HRIS schedule(s) are still pending Google synchronization. Use Sync to retry.`);
      } else if (Number(recruitment?.publishedInOtherAccountCandidates || 0) > 0) {
        setCalendarError(`${Number(recruitment.publishedInOtherAccountCandidates)} HRIS interview schedule(s) belong to a different connected Google account. Switch to the schedule owner's account or use a shared calendar; this view will not duplicate events.`);
      }
    } catch (error) {
      if (calendarLoadRequestRef.current !== requestId) return;

      calendarSyncedRef.current = false;
      setCalendarSynced(false);
      setCalendarError(
        error?.message || "Unable to load Google Calendar events.",
      );
    } finally {
      stopCalendarLoading();
    }
  }

  useEffect(() => {
    if (!open) return;

    loadGoogleCalendarEvents({
      checkStatus: !calendarConnectedRef.current,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]);

  // A candidate may confirm a reschedule in another browser tab while the
  // Google view remains open. Refresh when staff returns to this tab.
  useEffect(() => {
    if (!open) return undefined;
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible" && calendarConnectedRef.current) {
        void loadGoogleCalendarEvents({ force: true });
      }
    };
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viewDate]);

  const monthCells = useMemo(() => buildMonthCells(viewDate), [viewDate]);
  const weekCells = useMemo(() => buildWeekCells(viewDate), [viewDate]);
  const todayKey = getManilaDateKey(nowMs);
  const monthLabel = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const periodLabel =
    viewMode === "Week" ? buildRangeLabel(weekCells) : monthLabel;

  const filteredEvents = useMemo(() => buildCalendarDisplayEvents(events), [events]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce((grouped, event) => {
      grouped[event.date] = grouped[event.date] || [];
      grouped[event.date].push(event);
      return grouped;
    }, {});
  }, [filteredEvents]);

  if (!open) return null;

  function openGoogleCalendarConnection() {
    clearGoogleCalendarPopupTimer();
    const connectUrl = getGoogleCalendarConnectUrl();
    // When reconnecting an existing account, simply seeing connected=true is
    // not evidence that the NEW authorization has completed. In that case the
    // existing GOOGLE_CALENDAR_CONNECTED postMessage remains authoritative.
    const wasConnected = calendarConnectedRef.current;

    const popup = window.open(
      connectUrl,
      "google-calendar-connect",
      "width=520,height=720",
    );

    if (!popup) {
      window.location.href = connectUrl;
      return;
    }

    // Chrome may isolate the OAuth popup with Cross-Origin-Opener-Policy.
    // Repeatedly checking the popup's closed property logs a warning even when
    // caught in a try/catch. Instead, fall back to the server's connection
    // status if the OAuth callback cannot postMessage to this window.
    if (wasConnected) return;

    let pollCount = 0;
    let pollInFlight = false;
    const pollId = window.setInterval(async () => {
      if (googleConnectPopupTimerRef.current !== pollId ||
          googleConnectFinalizingRef.current || pollInFlight) return;

      pollCount += 1;
      if (pollCount > GOOGLE_CALENDAR_CONNECT_MAX_POLLS) {
        clearGoogleCalendarPopupTimer();
        setCalendarError(
          "Google sign-in has not completed. Finish the Google sign-in window, then click Sync to refresh your connection.",
        );
        return;
      }

      pollInFlight = true;
      try {
        const status = await getGoogleCalendarStatus();
        // The user may have closed the calendar or received the OAuth message
        // while this network request was in flight.
        if (googleConnectPopupTimerRef.current !== pollId) return;
        if (status?.success !== false && status?.connected) {
          clearGoogleCalendarPopupTimer();
          void finishGoogleCalendarConnection();
        }
      } catch {
        // A temporary status-check failure should not interrupt Google OAuth.
      } finally {
        pollInFlight = false;
      }
    }, GOOGLE_CALENDAR_CONNECT_POLL_MS);
    googleConnectPopupTimerRef.current = pollId;
  }

  function moveMonth(direction) {
    setViewDate((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + direction);
      return next;
    });
  }

  function movePeriod(direction) {
    if (viewMode === "Week") {
      setViewDate((current) => {
        const next = new Date(current);
        next.setDate(current.getDate() + direction * 7);
        return next;
      });
      return;
    }

    moveMonth(direction);
  }

  function handleToday() {
    setViewDate(new Date());
  }

  function openNewEvent(dateKey) {
    if (!calendarConnectedRef.current || !calendarSyncedRef.current) {
      setCalendarError("Connect and sync your Google account before creating calendar schedules.");
      return;
    }
    if (!canCreateCalendarEventOnDate(dateKey, getNowMs())) return;
    setEditingEvent(createBlankEvent(dateKey, organizerLabel, getNowMs()));
  }

  async function handleSaveEvent(nextEvent) {
    if (!calendarConnectedRef.current || !calendarSyncedRef.current) {
      return { success: false, message: "Connect and sync Google Calendar before saving." };
    }
    const currentMs = getNowMs();
    if (isPastCalendarDay(nextEvent.date, currentMs) ||
        isPastCalendarTime(nextEvent.date, nextEvent.startTime, currentMs) ||
        (nextEvent.scheduleType !== "Out of office" && isPastCalendarTime(nextEvent.date, nextEvent.endTime, currentMs))) {
      return { success: false, message: "Past schedules and elapsed times are read-only (Asia/Manila)." };
    }
    const originalEvent = events.find((item) => item.id === (nextEvent.googleEventId || nextEvent.id));
    if (originalEvent && isPastCalendarEvent(originalEvent, currentMs)) {
      return { success: false, message: "Historical events are view-only. Changes to past schedules are not permitted." };
    }
    // Do not permit updates to third-party events even if the editor is opened
    // programmatically. Newly created HRIS events are not present in `events`.
    if (nextEvent?.googleEventId || (nextEvent?.id && events.some((item) => item.id === nextEvent.id))) {
      const existing = events.find((item) => item.id === (nextEvent.googleEventId || nextEvent.id));
      if (!existing || !isEditableHrisCalendarEvent(existing)) {
        const message = "This Google Calendar event is read-only in SiBS HRIS.";
        setCalendarError(message);
        return { success: false, message };
      }
    }
    setCalendarLoading(true);
    setCalendarError("");

    try {
      const payload = buildGoogleCalendarPayload(nextEvent);
      const isExistingGoogleEvent = Boolean(nextEvent.googleEventId);

      const response = isExistingGoogleEvent
        ? await updateGoogleCalendarEvent(nextEvent.googleEventId, payload)
        : await createGoogleCalendarEvent(payload);

      if (response?.success === false) {
        throw new Error(
          response?.message ||
            response?.error ||
            "Unable to save Google Calendar event.",
        );
      }

      const savedEvent = response?.event || response?.data || response;
      const normalizedEvent = normalizeGoogleCalendarEvent(savedEvent);

      setEvents((current) => {
        const exists = current.some((event) => event.id === normalizedEvent.id);

        if (exists) {
          return current.map((event) =>
            event.id === normalizedEvent.id ? normalizedEvent : event,
          );
        }

        return [...current, normalizedEvent];
      });

      calendarConnectedRef.current = true;
      setCalendarConnected(true);
      setEditingEvent(null);
      return { success: true };
    } catch (error) {
      const message = error?.message || "Unable to save Google Calendar event.";
      setCalendarError(message);
      return { success: false, message };
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handlePreviewOrphanCleanup() {
    // Keep the confirmation window visible even when preview API is unavailable.
    setOrphanDialogOpen(true);
    setOrphanBusy(true);
    setOrphanMessage("");
    setOrphanPreview(null);
    setSelectedLegacyIds([]);
    try {
      const result = await previewHrisCalendarOrphans();
      if (result?.success === false) {
        throw new Error(result.error || result.message || "Unable to verify HRIS events.");
      }
      setOrphanPreview(result);
    } catch (error) {
      const status = error?.response?.status;
      setOrphanMessage(status === 404
        ? "Cleanup preview is unavailable (404). The HRIS server does not have the required calendar cleanup endpoint. Deploy the updated server, then retry. No events were deleted."
        : error?.response?.data?.error || error?.response?.data?.message || error?.message || "Unable to verify HRIS events. No events were deleted.");
    } finally {
      setOrphanBusy(false);
    }
  }

  function closeOrphanCleanup() {
    if (orphanBusy) return;
    setOrphanDialogOpen(false);
    setOrphanPreview(null);
    setOrphanMessage("");
    setSelectedLegacyIds([]);
  }

  async function handleConfirmOrphanCleanup() {
    setOrphanBusy(true);
    setOrphanMessage("");
    try {
      const result = await cleanupHrisCalendarOrphans({ legacyEventIds: selectedLegacyIds });
      if (result?.success === false && !Array.isArray(result?.failed)) {
        throw new Error(result.error || result.message || "Cleanup failed.");
      }
      setOrphanMessage(`${result.deleted || 0} selected/verified orphan Google Calendar event(s) removed. ${result.retained || 0} verified database-backed events preserved.${result.failed?.length ? ` ${result.failed.length} failed or need ledger reconciliation; review details and retry.` : ""}`);
      setOrphanPreview(null);
      await loadGoogleCalendarEvents({ force: true });
    } catch (error) {
      setOrphanMessage(error?.response?.data?.error || error?.message || "Cleanup failed; no other Google events were targeted.");
    } finally {
      setOrphanBusy(false);
    }
  }

  async function handleDeleteEvent(eventId) {
    const sourceEvent = events.find((event) => event.id === eventId);
    if (!sourceEvent || !isEditableHrisCalendarEvent(sourceEvent) || isPastCalendarEvent(sourceEvent, getNowMs())) {
      if (sourceEvent) setEditingEvent(sourceEvent);
      else setCalendarError("The selected event cannot be changed from SiBS HRIS.");
      return;
    }
    setCalendarLoading(true);
    setCalendarError("");

    try {
      const response = await deleteGoogleCalendarEvent(eventId);

      if (response?.success === false) {
        throw new Error(
          response?.message ||
            response?.error ||
            "Unable to delete Google Calendar event.",
        );
      }

      setEvents((current) => current.filter((event) => event.id !== eventId));
      setEditingEvent(null);
    } catch (error) {
      setCalendarError(
        error?.message || "Unable to delete Google Calendar event.",
      );
    } finally {
      setCalendarLoading(false);
    }
  }

  function handleRescheduleEvent(event, days) {
    if (!isEditableHrisCalendarEvent(event) || isPastCalendarEvent(event, getNowMs())) {
      setEditingEvent(event);
      return;
    }
    void handleSaveEvent({
      ...event,
      date: addDays(event.date, days),
      status: event.status === "Done" ? "Rescheduled" : event.status,
    });
  }

  async function handleDisconnectGoogleCalendar() {
    setCalendarLoading(true);
    setCalendarError("");

    try {
      const payload = await disconnectGoogleCalendar();

      if (payload?.success === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Unable to disconnect Google Calendar.",
        );
      }

      calendarConnectedRef.current = false;
      calendarSyncedRef.current = false;
      setCalendarSynced(false);
      lastLoadedRangeRef.current = "";
      setCalendarConnected(false);
      setGoogleCalendarEmail("");
      setGoogleCalendarProfile({ name: "", givenName: "", familyName: "" });
      setEvents([]);
      setEditingEvent(null);
      setDisconnectConfirmOpen(false);
    } catch (error) {
      setCalendarError(
        error?.message || "Unable to disconnect Google Calendar.",
      );
    } finally {
      setCalendarLoading(false);
    }
  }

  const taDrives = filteredEvents.filter(
    (event) => event.category === "Talent Acquisition",
  ).length;
  const hrSyncs = filteredEvents.filter(
    (event) => event.category === "HR Sync",
  ).length;

  const modalContent = (
    <HeaderCalendarModalShell>
        <div className="relative flex shrink-0 flex-col gap-3 border-b border-white/10 bg-sibs-navy px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between 2xl:px-6 2xl:py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4 2xl:right-6 2xl:top-4"
            aria-label="Close calendar modal"
            title="Close SiBS Calendar"
          >
            <X size={18} />
          </button>
          <div className="flex w-full min-w-0 items-center gap-2.5 pr-10 sm:w-auto sm:gap-3 2xl:gap-4">
            <div className="flex h-9 w-9 2xl:h-11 2xl:w-11 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl border border-white/20 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <CalendarDays className="h-4.5 w-4.5 2xl:h-5.5 2xl:w-5.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 2xl:gap-2">
                <span className="truncate text-[9px] 2xl:text-[11px] font-extrabold text-white/75">
                  SiBS HRIS Operational Workspace
                </span>

                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />

                <span
                  className={[
                    "inline-flex min-w-0 items-center gap-1.5 truncate text-[9px] 2xl:text-[11px] font-extrabold",
                    calendarConnected ? "text-emerald-300" : "text-amber-300",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 2xl:h-2 2xl:w-2 shrink-0 rounded-full",
                      calendarConnected ? "bg-emerald-300" : "bg-amber-300",
                    ].join(" ")}
                  />
                  <span className="truncate">
                    {calendarConnected
                      ? googleCalendarEmail || "Google Calendar Sync"
                      : "Calendar Not Connected"}
                  </span>
                </span>
              </div>

              <h2 className="sibs-modal-title mt-0.5 truncate text-white">
                SiBS Calendar · HR &amp; Talent Acquisition
              </h2>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-white/70">
                Powered by Google Calendar · Asia/Manila
              </p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:flex-wrap sm:justify-end sm:gap-2.5">
            {calendarConnected && (
              <a href="https://calendar.google.com/calendar/u/0/r/month" target="_blank" rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-2.5 text-[11px] font-bold text-white hover:bg-white/15 sm:hidden lg:inline-flex lg:h-8 lg:px-3 lg:text-xs"
                title="Open Google Calendar in a new tab (choose your connected Google account if asked)">
                <Link2 size={14} /> <span className="lg:inline">Google</span><span className="hidden lg:inline"> Calendar</span>
              </a>
            )}
            <button
              type="button"
              onClick={() =>
                loadGoogleCalendarEvents({
                  force: true,
                  checkStatus: true,
                })
              }
              disabled={calendarLoading || !calendarConnected}
              className="hidden h-8 2xl:h-9 items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 2xl:px-4 text-xs font-black text-white shadow-sm transition hover:cursor-pointer hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
            >
              <RefreshCw
                className={[
                  "h-3.5 w-3.5 2xl:h-4 2xl:w-4",
                  calendarLoading ? "animate-spin" : "",
                ].join(" ")}
              />
              Sync
            </button>

            {calendarConnected ? (
              <button
                type="button"
                onClick={() => loadGoogleCalendarEvents({ force: true, checkStatus: true })}
                disabled={calendarLoading}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 sm:hidden"
                aria-label="Sync Google Calendar"
                title="Sync Google Calendar"
              >
                <RefreshCw className={`h-4 w-4 ${calendarLoading ? "animate-spin" : ""}`} />
              </button>
            ) : null}

            {calendarConnected ? (
              <button
                type="button"
                disabled={calendarLoading || orphanBusy}
                onClick={handlePreviewOrphanCleanup}
                className="hidden h-8 2xl:h-9 items-center rounded-lg border border-white/30 bg-white/10 px-3 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50 sm:inline-flex"
                title="Preview SiBS HRIS Google events not linked to the HRIS database"
              >
                Clean Old HRIS Events
              </button>
            ) : null}

            {!calendarConnected ? (
              <button
                type="button"
                onClick={openGoogleCalendarConnection}
                className="inline-flex h-8 2xl:h-9 items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-500 px-3 2xl:px-4 text-xs font-black text-white shadow-sm transition hover:cursor-pointer hover:bg-emerald-600"
              >
                <Link2 className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                Connect
              </button>
            ) : null}

            {calendarConnected ? (
              <button
                type="button"
                onClick={() => setDisconnectConfirmOpen(true)}
                disabled={calendarLoading}
                className="hidden h-8 2xl:h-9 items-center gap-1.5 rounded-lg border border-rose-300/40 bg-rose-950/40 px-3 2xl:px-4 text-xs font-black text-rose-200 shadow-sm transition hover:cursor-pointer hover:border-rose-400 hover:bg-rose-900/50 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
              >
                <LogOut className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                Disconnect
              </button>
            ) : null}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openNewEvent(canCreateCalendarEventOnDate(todayKey, getNowMs()) ? todayKey : addDays(todayKey, 1));
              }}
              disabled={!calendarConnected || !calendarSynced || calendarLoading}
              title={!calendarSynced ? "Sync Google Calendar before creating schedules" : "Create a new calendar schedule"}
              className="order-first inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sibs-orange px-3 text-xs font-black text-white shadow-sm transition hover:cursor-pointer hover:bg-sibs-button-hover disabled:cursor-not-allowed disabled:opacity-50 sm:order-none sm:h-8 sm:flex-none 2xl:h-9 2xl:px-4"
            >
              <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
              New Schedule
            </button>

          </div>
        </div>

        {!calendarConnected ? (
          <>
            <GoogleCalendarAuthRequiredScreen
              onConnect={openGoogleCalendarConnection}
              calendarLoading={calendarLoading}
            />

            <div className="flex flex-wrap items-center gap-3 border-t border-sibs-border bg-sibs-canvas px-4 py-2.5 2xl:px-6 2xl:py-3 text-[11px] 2xl:text-xs text-sibs-text-secondary">
              <strong className="text-sibs-primary-1">
                Google Account Status:{" "}
                <span className="text-sibs-orange">Not Connected</span>
              </strong>
              <span className="ml-auto hidden italic md:inline">
                Sign in with Google to enable calendar sync.
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex shrink-0 flex-col gap-2.5 border-b border-sibs-border bg-sibs-canvas px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-4">
              <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start">
                <div className="flex h-9 shrink-0 overflow-hidden rounded-[10px] border border-sibs-border bg-white sm:h-8">
                  <button
                    type="button"
                    onClick={() => movePeriod(-1)}
                    className="flex w-9 items-center justify-center text-sibs-navy transition hover:cursor-pointer hover:bg-sibs-canvas"
                    aria-label={viewMode === "Week" ? "Previous week" : "Previous month"}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="border-x border-sibs-border px-3 text-xs font-extrabold text-sibs-navy transition hover:cursor-pointer hover:bg-sibs-canvas sm:px-4"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => movePeriod(1)}
                    className="flex w-9 items-center justify-center text-sibs-navy transition hover:cursor-pointer hover:bg-sibs-canvas"
                    aria-label={viewMode === "Week" ? "Next week" : "Next month"}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <span className="min-w-0 text-right text-sm font-black leading-4 text-sibs-navy sm:shrink-0 sm:px-1 sm:text-left">
                  {periodLabel}
                </span>
                <span className="hidden items-center gap-1.5 rounded-lg border border-sibs-border bg-white px-2.5 py-1.5 text-[10px] font-semibold text-sibs-text-secondary xl:inline-flex">
                  <span className={`h-2 w-2 rounded-full ${calendarSynced ? "bg-emerald-500" : "bg-amber-500"}`} /> {calendarSynced ? "Google-synced" : "Sync required"} · Asia/Manila
                </span>
              </div>

              <div className="flex h-9 w-full shrink-0 overflow-hidden rounded-[10px] border border-sibs-border bg-white sm:h-8 sm:w-auto">
                {[
                  ["Month", Grid3X3],
                  ["Week", CalendarDays],
                  ["Agenda", List],
                ].map(([label, Icon]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setViewMode(label)}
                    aria-pressed={viewMode === label}
                    className={[
                      "flex min-w-0 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-extrabold transition sm:flex-none",
                      viewMode === label
                        ? "bg-sibs-navy text-white"
                        : "text-sibs-text-secondary hover:cursor-pointer hover:bg-sibs-canvas hover:text-sibs-navy",
                    ].join(" ")}
                  >
                    {React.createElement(Icon, { className: "h-3.5 w-3.5" })}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {!calendarSynced ? (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs font-semibold text-amber-900">
                <span><strong>Calendar sync required.</strong> Your Google account is connected, but SiBS Calendar must successfully sync events before you can create schedules or use the interview calendar.</span>
                <button type="button" onClick={() => loadGoogleCalendarEvents({ force: true, checkStatus: true })}
                  disabled={calendarLoading}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 font-extrabold text-sibs-navy hover:bg-amber-100 disabled:opacity-60">
                  <RefreshCw size={14} className={calendarLoading ? "animate-spin" : ""} /> {calendarLoading ? "Syncing…" : "Sync account"}
                </button>
              </div>
            ) : null}

            {calendarError ? (
              <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs font-bold text-amber-700">
                {calendarError}
                {!calendarConnected ? (
                  <button
                    type="button"
                    onClick={openGoogleCalendarConnection}
                    className="ml-3 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-extrabold text-amber-800 transition hover:cursor-pointer hover:bg-amber-200"
                  >
                    Connect Google Calendar
                  </button>
                ) : null}
              </div>
            ) : null}

            {!calendarSynced ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-2 bg-sibs-canvas px-6 py-10 text-center" role="status">
                <CalendarDays className="h-8 w-8 text-sibs-orange" />
                <strong className="text-sm text-sibs-navy">Google Calendar sync is required</strong>
                <p className="max-w-md text-xs leading-relaxed text-sibs-text-secondary">{calendarLoading ? "Checking your connected Google Calendar account…" : "Click Sync account above to finish synchronizing before viewing or creating schedules."}</p>
              </div>
            ) : null}

            {calendarSynced && viewMode === "Month" ? (
              <MonthCalendarView
                monthCells={monthCells}
                eventsByDate={eventsByDate}
                todayKey={todayKey}
                nowMs={nowMs}
                onCreateEvent={openNewEvent}
                onEditEvent={setEditingEvent}
                onViewDay={setSelectedDay}
              />
            ) : null}

            {calendarSynced && viewMode === "Week" ? (
              <WeekCalendarView
                calendarLoading={calendarLoading}
                weekCells={weekCells}
                eventsByDate={eventsByDate}
                todayKey={todayKey}
                nowMs={nowMs}
                onCreateEvent={openNewEvent}
                onEditEvent={setEditingEvent}
              />
            ) : null}

            {calendarSynced && viewMode === "Agenda" ? (
              <AgendaCalendarView
                events={filteredEvents}
                nowMs={nowMs}
                onEditEvent={setEditingEvent}
                onDeleteEvent={handleDeleteEvent}
                onRescheduleEvent={handleRescheduleEvent}
              />
            ) : null}

            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-sibs-border bg-sibs-canvas px-3 py-2.5 text-[11px] text-sibs-text-secondary sm:gap-4 sm:px-6 sm:py-3 sm:text-xs">
              <strong className="text-sibs-primary-1">
                SiBS Calendar Events: {events.length}
              </strong>
              <span className="hidden h-4 w-px bg-sibs-border sm:inline" />
              <span>TA Drives: {taDrives}</span>
              <span className="hidden h-4 w-px bg-sibs-border sm:inline" />
              <span>HR Syncs: {hrSyncs}</span>
              <span className="ml-auto hidden items-center gap-1 italic md:flex">
                <Clock className="h-3.5 w-3.5" />
                Past dates are view-only. Choose today or later to create an event. Candidate reschedules use the SiBS interview calendar.
              </span>
            </div>
          </>
        )}

        {selectedDay && !editingEvent && canOpenCalendarDay(
          selectedDay, (eventsByDate[selectedDay] || []).length, nowMs,
        ) ? (
          <GoogleCalendarDayDetails
            date={selectedDay}
            events={eventsByDate[selectedDay] || []}
            nowMs={nowMs}
            onClose={() => setSelectedDay("")}
            onCreateEvent={openNewEvent}
            onEditEvent={setEditingEvent}
          />
        ) : null}

        {editingEvent?.recruitmentEventType ? (
          <ManagedRecruitmentCalendarDetails event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onOpenCandidate={() => { setEditingEvent(null); onClose?.(); }} />
        ) : editingEvent && (isPastCalendarEvent(editingEvent, nowMs) || (editingEvent?.googleEventId && !isEditableHrisCalendarEvent(editingEvent))) ? (
          <ExternalGoogleCalendarReadOnlyDetails
            event={editingEvent}
            historical={isPastCalendarEvent(editingEvent, nowMs)}
            onClose={() => setEditingEvent(null)}
          />
        ) : editingEvent ? (
          <EventEditorModal
            key={`${editingEvent.id || "new"}-${editingEvent.date || ""}`}
            event={editingEvent}
            organizerLabel={organizerLabel}
            nowMs={nowMs}
            getNowMs={getNowMs}
            onClose={() => setEditingEvent(null)}
            onDelete={handleDeleteEvent}
            onSave={handleSaveEvent}
          />
        ) : null}

        {orphanDialogOpen ? (
          <div
            className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[10000] flex items-center justify-center p-3 font-jakarta sm:p-5"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <section
              ref={orphanDialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sibs-calendar-cleanup-title"
              aria-describedby="sibs-calendar-cleanup-description"
              className="sibs-modal-pop-in flex max-h-[min(88dvh,760px)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white text-sibs-navy shadow-[0_28px_90px_rgba(2,30,56,0.34)]"
            >
              <header className="shrink-0 bg-sibs-navy px-4 py-4 text-white sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sibs-orange">
                      <Trash2 className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="sibs-modal-subtitle text-white/70">
                        SiBS Calendar <span className="mx-1 text-white/35">·</span> Powered by Google Calendar
                      </p>
                      <h3 id="sibs-calendar-cleanup-title" className="sibs-modal-title mt-0.5 text-white">
                        Clean Old HRIS Events
                      </h3>
                      <p className="mt-1 text-[10px] font-medium text-white/70 sm:text-[11px]">
                        Review and reconcile outdated calendar schedules
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeOrphanCleanup}
                    disabled={orphanBusy}
                    className="sibs-modal-close-btn shrink-0"
                    aria-label="Close cleanup modal"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              <div className="thin-scroll min-h-0 flex-1 space-y-4 overflow-y-auto bg-white p-4 sm:p-5">
                <div id="sibs-calendar-cleanup-description">
                  <p className="text-xs font-semibold leading-relaxed text-sibs-muted sm:text-[12.5px]">
                    Compare Google Calendar events with SiBS HRIS records before removing old schedules.
                    Events linked to active HRIS schedules remain protected.
                  </p>
                </div>

                {orphanBusy ? (
                  <div role="status" className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs font-semibold text-sibs-navy">
                    <RefreshCw size={17} className="shrink-0 animate-spin text-sibs-orange" />
                    {orphanPreview ? "Removing verified or selected events…" : "Checking HRIS records and Google Calendar…"}
                  </div>
                ) : null}

                {orphanPreview ? (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {[
                        { label: "Events Scanned", value: orphanPreview.scanned || 0, tone: "text-sibs-navy", surface: "bg-slate-50" },
                        { label: "Confirmed Orphans", value: orphanPreview.count || 0, tone: "text-orange-600", surface: "bg-orange-50" },
                        { label: "Manual Review", value: orphanPreview.legacyCount || 0, tone: "text-amber-700", surface: "bg-amber-50" },
                        { label: "Active / Protected", value: orphanPreview.retained || 0, tone: "text-emerald-700", surface: "bg-emerald-50" },
                      ].map((metric) => (
                        <div key={metric.label} className={`rounded-xl border border-sibs-border-subtle px-3 py-3 ${metric.surface}`}>
                          <p className="text-[10px] font-bold leading-snug text-sibs-muted">{metric.label}</p>
                          <p className={`mt-1.5 text-[23px] font-extrabold leading-none ${metric.tone}`}>
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-[#F5F9FE] p-3.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-[11px] font-semibold leading-relaxed text-slate-700">
                        <strong className="text-sibs-navy">Your HRIS database is the source of truth.</strong>{" "}
                        Confirmed database orphans can be removed. Older HRIS-titled or generic “Interview”
                        events are unverified and will only be deleted if you select them manually.
                        Unrelated Google Calendar events are excluded.
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-sibs-border-subtle bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border-subtle bg-[#F8FAFC] px-3.5 py-3">
                        <h4 className="sibs-modal-section-title">Confirmed Database Orphans</h4>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold text-orange-700">
                          {orphanPreview.count || 0} found
                        </span>
                      </div>
                      {orphanPreview.orphans?.length ? (
                        <div className="thin-scroll max-h-40 divide-y divide-sibs-border-subtle overflow-y-auto px-3.5">
                          {orphanPreview.orphans.map((item) => (
                            <p key={item.id} className="break-words py-2.5 text-[11px] font-semibold text-slate-700">
                              {item.start ? <span className="text-sibs-muted">{item.start} — </span> : null}
                              {item.title}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 px-3.5 py-4 text-[11px] font-semibold text-emerald-700">
                          <Check className="h-4 w-4 shrink-0" />
                          No confirmed orphaned events found.
                        </div>
                      )}
                      {orphanPreview.truncatedPreview ? (
                        <p className="border-t border-sibs-border-subtle px-3.5 py-2 text-[10px] text-sibs-muted">
                          Showing the first 100 of {orphanPreview.count} events.
                        </p>
                      ) : null}
                    </div>

                    {orphanPreview.legacyCount > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3.5 py-3">
                          <h4 className="sibs-modal-section-title text-amber-900">Older Events · Manual Review</h4>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-amber-800">
                            {selectedLegacyIds.length} selected
                          </span>
                        </div>
                        <p className="px-3.5 pt-3 text-[11px] font-semibold leading-relaxed text-amber-900">
                          Select an event only if you have confirmed it belongs to an obsolete HRIS schedule.
                          Generic “Interview” events are never automatically selected.
                        </p>
                        <div className="thin-scroll mx-3.5 my-3 max-h-48 divide-y divide-amber-100 overflow-y-auto rounded-lg border border-amber-100">
                          {orphanPreview.legacy?.map((item) => (
                            <label key={item.id} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-amber-50/70">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF5C28]"
                                checked={selectedLegacyIds.includes(item.id)}
                                disabled={orphanBusy}
                                onChange={(event) => setSelectedLegacyIds((ids) =>
                                  event.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id)
                                )}
                              />
                              <span className="min-w-0 break-words">
                                {item.start ? <span className="text-sibs-muted">{item.start} — </span> : null}
                                {item.title}
                              </span>
                            </label>
                          ))}
                        </div>
                        {orphanPreview.truncatedLegacy ? (
                          <p className="px-3.5 pb-3 text-[10px] text-amber-900">
                            Showing the first 100 events. Review the remaining events after cleanup.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : !orphanBusy && !orphanMessage ? (
                  <div className="rounded-xl border border-sibs-border-subtle bg-slate-50 px-4 py-5 text-center">
                    <CalendarDays className="mx-auto h-6 w-6 text-sibs-muted" />
                    <p className="mt-2 text-xs font-semibold text-sibs-muted">No preview available yet.</p>
                  </div>
                ) : null}

                {orphanMessage ? (
                  <div role="status" className="rounded-xl border border-sibs-border-subtle bg-slate-50 px-3.5 py-3 text-[11px] font-semibold leading-relaxed text-sibs-navy">
                    {orphanMessage}
                  </div>
                ) : null}
              </div>

              <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-sibs-border-subtle bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
                {!orphanPreview && !orphanBusy ? (
                  <button type="button" className="sibs-modal-btn-secondary" onClick={handlePreviewOrphanCleanup}>
                    <RefreshCw className="h-3.5 w-3.5" /> Retry Preview
                  </button>
                ) : null}
                <button type="button" className="sibs-modal-btn-secondary" disabled={orphanBusy} onClick={closeOrphanCleanup}>
                  Close
                </button>
                {orphanPreview?.count > 0 || selectedLegacyIds.length > 0 ? (
                  <button
                    type="button"
                    disabled={orphanBusy}
                    onClick={handleConfirmOrphanCleanup}
                    className="sibs-modal-btn-primary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete selected ({(orphanPreview?.count || 0) + selectedLegacyIds.length})
                  </button>
                ) : null}
              </footer>
            </section>
          </div>
        ) : null}

        {disconnectConfirmOpen ? (
          <DisconnectCalendarConfirmModal
            loading={calendarLoading}
            googleCalendarEmail={googleCalendarEmail}
            onCancel={() => setDisconnectConfirmOpen(false)}
            onConfirm={handleDisconnectGoogleCalendar}
          />
        ) : null}
    </HeaderCalendarModalShell>
  );

  return renderCalendarPortal(modalContent);
}
