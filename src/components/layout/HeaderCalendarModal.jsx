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

function getTimeSelectionError(value, { isInterviewAvailability, isEventTime, isEndTime, startTime }) {
  const minutes = timeLabelToMinutes(value);
  if (minutes === null) return "Enter a valid time, such as 02:15 PM.";
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
      isInterviewAvailability, isEventTime, isEndTime, startTime,
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
        const firstAvailable = filteredOptions.find((time) => !isTimeOptionTaken({
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
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${value || "Select time"}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        onClick={onToggle}
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
              const taken = isTimeOptionTaken({
                time, isEndTime, startTime, date, busy, isInterviewAvailability, isEventTime,
              });
              return (
              <button
                key={time}
                disabled={taken}
                title={taken ? "Already scheduled for your account" : "Select time"}
                type="button"
                role="option"
                aria-selected={time === value}
                data-current={time === value}
                onClick={() => selectTime(time)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left font-jakarta text-[12px] transition ${taken ? "cursor-not-allowed bg-slate-50 text-slate-400 opacity-70" : "hover:cursor-pointer hover:bg-sibs-cream-subtle hover:text-sibs-orange"} ${!taken && time === value ? "bg-sibs-cream-light font-extrabold text-sibs-orange" : "font-semibold"}`}
              >
                <span>{time}</span>
                {taken && <span className="text-[10px] font-bold text-rose-500">Booked</span>}
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

function normalizeGoogleCalendarEvent(event = {}) {
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
    googleHtmlLink: /^https:\/\/calendar\.google\.com\//.test(event.htmlLink || "") ? event.htmlLink : "",
    meetLink,
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

function createBlankEvent(baseDate, organizer = "") {
  return {
    id: "",
    title: SIBS_HRIS_CALENDAR_TITLE_PREFIX,
    category: "Talent Acquisition",
    status: "Scheduled",
    date: baseDate,
    startTime: "09:00 AM",
    endTime: "10:00 AM",
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
}) {
  const initialForm = useMemo(
    () => ({
      ...createBlankEvent(formatDateKey(new Date()), organizerLabel),
      ...event,
      organizer: event?.organizer || organizerLabel,
      scheduleType: event?.scheduleType || "Event",
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
    if (!moreOptionsTimedEvent || !busyReady || selectedStartMinutes === null) return false;
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
    setForm((current) => ({
      ...current,
      scheduleType: nextType,
      ...(nextType === "Interview availability" ? {
        title: withSibsHrisCalendarTitle(
          current.title,
          "Available for Candidate Interviews",
        ),
        startTime: current.scheduleType === "Event" && current.startTime !== "09:00 AM" ? current.startTime : "10:00 AM",
        endTime: current.scheduleType === "Event" && current.endTime !== "10:00 AM" ? current.endTime : "11:00 AM",
        availability: "Free", color: "emerald", category: "Talent Acquisition",
      } : {}),
      status:
        nextType === "Task"
          ? "Scheduled"
          : nextType === "Out of office"
            ? "Scheduled"
            : current.status || "Scheduled",
      outOfOfficeEndDate: current.outOfOfficeEndDate || current.date,
      addGoogleMeet:
        nextType === "Event" ? (current.addGoogleMeet ?? true) : false,
    }));
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
    if (!busyReady) {
      setValidationError(busyState.error || "Please wait while your calendar availability is checked.");
      return;
    }
    if (activeType === "Event" || activeType === "Interview availability") {
      const start = calendarLocalTimeMs(form.date, form.startTime);
      const end = calendarLocalTimeMs(form.date, form.endTime);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        setValidationError("Select a valid start and end time.");
        return;
      }
      if (calendarTimeOverlaps(busyIntervals, start, end)) {
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

  const tabItems = ["Event", "Interview availability", "Task", "Out of office"];

  return (
    <div
      className="sibs-action-backdrop-in absolute inset-0 z-[2] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[3px] font-jakarta"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="sibs-modal-pop-in thin-scroll max-h-[82vh] w-full max-w-[660px] overflow-y-auto rounded-[18px] bg-white px-6 py-5 shadow-[0_24px_80px_rgba(2,30,56,0.38)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-sibs-navy">
            <span className="h-1 w-5 rounded-full bg-sibs-orange" />
            {activeType === "Interview availability" ? "Interview Availability" : "Google Calendar Event"}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-sibs-text-secondary transition hover:cursor-pointer hover:bg-sibs-canvas hover:text-sibs-navy"
            aria-label="Close schedule editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          value={form.title || ""}
          onChange={(inputEvent) =>
            updateField("title", inputEvent.target.value)
          }
          placeholder="Add title"
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

        {activeType === "Interview availability" && (
          <p className="mt-3 rounded-[9px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            This block will offer 30-minute interview slots to you in Candidate Pipeline and in candidate reschedule links.
            Only open, unbooked slots can be selected.
          </p>
        )}
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
                        onChange={(date) => {
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
                        min={form.date || ""}
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
                  Conflicting durations are disabled. Interview availability must end by 5:30 PM.
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

        <div className="mt-4 flex items-center justify-between gap-4">
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
        </div>
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

function MonthCalendarView({
  monthCells,
  eventsByDate,
  todayKey,
  onCreateEvent,
  onEditEvent,
  onViewDay,
}) {
  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-white">
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

          return (
            <div
              key={cell.key}
              onClick={() => onCreateEvent(cell.key)}
              className={[
                "group flex min-h-[118px] flex-col border-r border-b border-sibs-border p-3 text-left transition last:border-r-0 hover:cursor-pointer hover:bg-sibs-canvas",
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
                    className="block w-full rounded px-1 text-left text-[11px] font-semibold text-[#1A73E8] hover:bg-[#E8F0FE]"
                    onClick={(clickEvent) => { clickEvent.stopPropagation(); onViewDay(cell.key); }}
                    title={`View all Google Calendar events on ${cell.key}`}
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
              <span className="mt-auto hidden pt-1 text-[10px] text-[#5F6368] group-hover:block">+ Create event</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekCalendarView({
  calendarLoading,
  weekCells,
  eventsByDate,
  todayKey,
  onCreateEvent,
  onEditEvent,
}) {
  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-sibs-canvas p-4">
      <section className="flex min-h-full flex-col rounded-[14px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-sibs-border pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-sibs-navy">
            <CalendarDays className="h-4 w-4 text-sibs-orange" />
            7-Day Operational HR & TA Weekly Schedule View
          </div>
          <span className="text-xs font-bold text-sibs-text-secondary">
            Active Week Window
          </span>
        </div>

        <div className="mt-4 grid min-h-0 flex-1 min-w-[880px] grid-cols-7 gap-3">
          {weekCells.map((cell) => {
            const dayEvents = sortEventsByDateTime(
              eventsByDate[cell.key] || [],
            );
            const isToday = cell.key === todayKey;

            return (
              <div
                key={cell.key}
                className={[
                  "flex min-h-full flex-col rounded-[12px] border bg-sibs-canvas p-3",
                  isToday
                    ? "border-sibs-orange ring-1 ring-sibs-orange"
                    : "border-sibs-border",
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
                    className="flex h-6 w-6 items-center justify-center rounded-md text-sibs-navy transition hover:cursor-pointer hover:bg-sibs-canvas hover:text-sibs-orange"
                    aria-label={`Add schedule on ${cell.label}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="thin-scroll mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {!calendarLoading && dayEvents.length === 0 ? (
                    <div className="flex h-full min-h-[260px] items-center justify-center text-center text-[11px] font-semibold italic text-sibs-text-secondary">
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

function AgendaCalendarView({
  events,
  onEditEvent,
  onDeleteEvent,
  onRescheduleEvent,
}) {
  const sortedEvents = sortEventsByDateTime(events);

  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-sibs-canvas p-4">
      <section className="flex min-h-full flex-col rounded-[14px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-sibs-border pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-sibs-navy">
            <List className="h-4 w-4" />
            Agenda Schedule Directory ({sortedEvents.length} Items)
          </div>
          <span className="text-xs font-bold text-sibs-text-secondary">
            Chronological View
          </span>
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {sortedEvents.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[12px] border border-dashed border-sibs-border bg-sibs-canvas px-4 py-10 text-center text-sm font-bold text-sibs-text-secondary">
              No schedules match the selected filters.
            </div>
          ) : null}

          {sortedEvents.map((event) => (
            <article
              key={event.id}
              className="flex gap-4 rounded-[12px] border border-sibs-border bg-white p-4 shadow-sm"
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
                  <span className="flex items-center gap-1 text-sm font-black text-sibs-navy">
                    <Clock className="h-3.5 w-3.5 text-sibs-orange" />
                    {event.startTime} - {event.endTime}
                  </span>
                </div>

                <h3 className="mt-2 truncate text-sm font-black text-sibs-primary-1">
                  {event.title}
                </h3>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-sibs-text-secondary">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-sibs-navy" />
                    Account: {event.account || "Not specified"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-sibs-navy" />
                    Host: {event.organizer || "Not specified"}
                  </span>
                  {event.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-sibs-orange" />
                      {event.location}
                    </span>
                  ) : null}
                </div>

                {event.notes ? (
                  <p className="mt-3 max-w-[560px] rounded-[8px] bg-sibs-canvas px-3 py-2 text-[11px] font-semibold italic text-sibs-text-secondary">
                    {event.notes}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-center">
                {!sourceCalendarEvent(event).recruitmentEventType && <>
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
                  {sourceCalendarEvent(event).recruitmentEventType ? "View details" : "Edit / Resched"}
                </button>
                {!sourceCalendarEvent(event).recruitmentEventType && <button
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

export default function HeaderCalendarModal({ open, user, onClose }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarConnected, setCalendarConnected] = useState(false);
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
  const [orphanPreview, setOrphanPreview] = useState(null);
  const [orphanBusy, setOrphanBusy] = useState(false);
  const [orphanMessage, setOrphanMessage] = useState("");
  const [selectedLegacyIds, setSelectedLegacyIds] = useState([]);
  const calendarLoadRequestRef = useRef(0);
  const googleConnectPopupTimerRef = useRef(null);
  const wasOpenRef = useRef(false);
  const calendarConnectedRef = useRef(false);
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
      setViewDate(new Date());
      setEditingEvent(null);
      setSelectedDay("");
      setDisconnectConfirmOpen(false);
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

      if (!connected) {
        lastLoadedRangeRef.current = "";
      }

      setCalendarConnected(connected);
      setGoogleCalendarEmail(googleEmail);
      setGoogleCalendarProfile(googleProfile);

      return {
        connected,
        googleEmail,
        googleName: googleProfile.name,
        googleGivenName: googleProfile.givenName,
        googleFamilyName: googleProfile.familyName,
      };
    } catch {
      calendarConnectedRef.current = false;
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

      if (payload?.success === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Unable to load Google Calendar events.",
        );
      }

      const googleEvents = Array.isArray(payload?.events)
        ? payload.events
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      lastLoadedRangeRef.current = rangeKey;
      calendarConnectedRef.current = true;
      setCalendarConnected(true);
      setGoogleCalendarEmail(statusResult.googleEmail || "");
      setGoogleCalendarProfile({
        name: statusResult.googleName || "",
        givenName: statusResult.googleGivenName || "",
        familyName: statusResult.googleFamilyName || "",
      });
      setEvents(googleEvents.map(normalizeGoogleCalendarEvent));
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

      if (!force && lastLoadedRangeRef.current === rangeKey) {
        stopCalendarLoading();
        return;
      }

      startCalendarLoading();

      const payload = await getGoogleCalendarEvents({
        timeMin,
        timeMax,
        maxResults: 250,
      });

      if (payload?.success === false) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Unable to load Google Calendar events.",
        );
      }

      const googleEvents = Array.isArray(payload?.events)
        ? payload.events
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      lastLoadedRangeRef.current = rangeKey;
      calendarConnectedRef.current = true;
      setEvents(googleEvents.map(normalizeGoogleCalendarEvent));
      setCalendarConnected(true);
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
  const todayKey = formatDateKey(new Date());
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

    const popup = window.open(
      connectUrl,
      "google-calendar-connect",
      "width=520,height=720",
    );

    if (!popup) {
      window.location.href = connectUrl;
      return;
    }

    googleConnectPopupTimerRef.current = window.setInterval(() => {
      if (popup.closed) {
        clearGoogleCalendarPopupTimer();
        finishGoogleCalendarConnection();
      }
    }, 800);
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

  async function handleSaveEvent(nextEvent) {
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
    setOrphanBusy(true);
    setOrphanMessage("");
    setOrphanPreview(null);
    setSelectedLegacyIds([]);
    try {
      const result = await previewHrisCalendarOrphans();
      setOrphanPreview(result);
    } catch (error) {
      setCalendarError(error?.response?.data?.error || error?.message || "Unable to verify HRIS events.");
    } finally {
      setOrphanBusy(false);
    }
  }

  async function handleConfirmOrphanCleanup() {
    setOrphanBusy(true);
    setOrphanMessage("");
    try {
      const result = await cleanupHrisCalendarOrphans({ legacyEventIds: selectedLegacyIds });
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
    if (sourceEvent?.recruitmentEventType) {
      setEditingEvent(sourceEvent);
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
    if (event?.recruitmentEventType) {
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[14px] border-b border-white/10 bg-sibs-navy px-4 py-3 2xl:px-6 2xl:py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <div className="flex min-w-0 items-center gap-3 2xl:gap-4">
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
                Google Calendar · HR &amp; Talent Acquisition
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-2.5">
            {calendarConnected && (
              <a href="https://calendar.google.com/calendar/u/0/r/month" target="_blank" rel="noopener noreferrer"
                className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15 lg:inline-flex"
                title="Open Google Calendar in a new tab (choose your connected Google account if asked)">
                <Link2 size={14} /> Open Google Calendar
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
                className="hidden h-8 2xl:h-9 items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-500 px-3 2xl:px-4 text-xs font-black text-white shadow-sm transition hover:cursor-pointer hover:bg-emerald-600 sm:inline-flex"
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
                setEditingEvent(createBlankEvent(todayKey, organizerLabel));
              }}
              disabled={!calendarConnected}
              className="hidden h-8 2xl:h-9 items-center gap-1.5 rounded-lg bg-sibs-orange px-3 2xl:px-4 text-xs font-black text-white shadow-sm transition hover:cursor-pointer hover:bg-sibs-button-hover disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
              New Schedule
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-[0.97]"
              aria-label="Close calendar modal"
            >
              <X size={18} />
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
            <div className="thin-scroll flex items-center justify-between gap-2 overflow-x-auto border-b border-sibs-border bg-sibs-canvas px-4 py-3 lg:overflow-visible">
              <div className="flex items-center gap-2">
                <div className="flex h-8 shrink-0 overflow-hidden rounded-[10px] border border-sibs-border bg-sibs-canvas">
                  <button
                    type="button"
                    onClick={() => movePeriod(-1)}
                    className="flex w-9 items-center justify-center text-sibs-navy transition hover:cursor-pointer hover:bg-white"
                    aria-label={
                      viewMode === "Week" ? "Previous week" : "Previous month"
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="border-x border-sibs-border px-4 text-xs font-extrabold text-sibs-navy transition hover:cursor-pointer hover:bg-white"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => movePeriod(1)}
                    className="flex w-9 items-center justify-center text-sibs-navy transition hover:cursor-pointer hover:bg-white"
                    aria-label={
                      viewMode === "Week" ? "Next week" : "Next month"
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <span className="min-w-[100px] shrink-0 px-1 text-sm font-black text-sibs-navy">
                  {periodLabel}
                </span>
                <span className="hidden items-center gap-1.5 rounded-lg border border-[#DADCE0] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#5F6368] md:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-[#34A853]" /> Google-synced · Asia/Manila
                </span>
              </div>

              <div className="flex h-8 shrink-0 overflow-hidden rounded-[10px] border border-sibs-border bg-sibs-canvas">
                {[
                  ["Month", Grid3X3],
                  ["Week", CalendarDays],
                  ["Agenda", List],
                ].map(([label, Icon]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setViewMode(label)}
                    className={[
                      "flex items-center gap-1.5 px-3 text-xs font-extrabold transition",
                      viewMode === label
                        ? "bg-sibs-navy text-white"
                        : "text-sibs-text-secondary hover:cursor-pointer hover:bg-white hover:text-sibs-navy",
                    ].join(" ")}
                  >
                    {React.createElement(Icon, { className: "h-3.5 w-3.5" })}
                    {label}
                  </button>
                ))}
              </div>
            </div>

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

            {viewMode === "Month" ? (
              <MonthCalendarView
                monthCells={monthCells}
                eventsByDate={eventsByDate}
                todayKey={todayKey}
                onCreateEvent={(dateKey) =>
                  setEditingEvent(createBlankEvent(dateKey, organizerLabel))
                }
                onEditEvent={setEditingEvent}
                onViewDay={setSelectedDay}
              />
            ) : null}

            {viewMode === "Week" ? (
              <WeekCalendarView
                calendarLoading={calendarLoading}
                weekCells={weekCells}
                eventsByDate={eventsByDate}
                todayKey={todayKey}
                onCreateEvent={(dateKey) =>
                  setEditingEvent(createBlankEvent(dateKey, organizerLabel))
                }
                onEditEvent={setEditingEvent}
              />
            ) : null}

            {viewMode === "Agenda" ? (
              <AgendaCalendarView
                events={filteredEvents}
                onEditEvent={setEditingEvent}
                onDeleteEvent={handleDeleteEvent}
                onRescheduleEvent={handleRescheduleEvent}
              />
            ) : null}

            <div className="flex flex-wrap items-center gap-4 border-t border-sibs-border bg-sibs-canvas px-6 py-3 text-xs text-sibs-text-secondary">
              <strong className="text-sibs-primary-1">
                Google Calendar Events: {events.length}
              </strong>
              <span className="h-4 w-px bg-sibs-border" />
              <span>TA Drives: {taDrives}</span>
              <span className="h-4 w-px bg-sibs-border" />
              <span>HR Syncs: {hrSyncs}</span>
              <span className="ml-auto hidden items-center gap-1 italic md:flex">
                <Clock className="h-3.5 w-3.5" />
                Click a date to create a Google event. Candidate reschedules use the SiBS interview calendar.
              </span>
            </div>
          </>
        )}

        {selectedDay && !editingEvent ? (
          <GoogleCalendarDayDetails
            date={selectedDay}
            events={eventsByDate[selectedDay] || []}
            onClose={() => setSelectedDay("")}
            onCreateEvent={(dateKey) => setEditingEvent(createBlankEvent(dateKey, organizerLabel))}
            onEditEvent={setEditingEvent}
          />
        ) : null}

        {editingEvent?.recruitmentEventType ? (
          <ManagedRecruitmentCalendarDetails event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onOpenCandidate={() => { setEditingEvent(null); onClose?.(); }} />
        ) : editingEvent ? (
          <EventEditorModal
            key={`${editingEvent.id || "new"}-${editingEvent.date || ""}`}
            event={editingEvent}
            organizerLabel={organizerLabel}
            onClose={() => setEditingEvent(null)}
            onDelete={handleDeleteEvent}
            onSave={handleSaveEvent}
          />
        ) : null}

        {(orphanPreview || orphanMessage || orphanBusy) ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#031C33]/65 p-4 backdrop-blur-sm"
            onMouseDown={(event) => { if (event.target === event.currentTarget && !orphanBusy) { setOrphanPreview(null); setOrphanMessage(""); } }}>
            <section role="dialog" aria-modal="true" aria-label="Clean unmatched HRIS Google Calendar events"
              className="w-full max-w-xl rounded-2xl border border-[#DDE7F2] bg-white p-6 text-[#06325E] shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-black">Reconcile SiBS HRIS Google events</h3>
                <button type="button" disabled={orphanBusy} onClick={() => { setOrphanPreview(null); setOrphanMessage(""); }}
                  aria-label="Close cleanup preview"><X className="h-5 w-5" /></button>
              </div>
              {orphanBusy ? <p className="mt-4 text-sm">Checking HRIS database and Google Calendar…</p> : null}
              {orphanPreview ? (
                <>
                  <p className="mt-3 text-sm">Scanned {orphanPreview.scanned} Google events. <strong>{orphanPreview.count} confirmed orphaned HRIS events</strong> and <strong>{orphanPreview.legacyCount || 0} older HRIS-titled or generic Interview events needing manual review</strong>. {orphanPreview.retained || 0} events remain linked to active HRIS schedules.</p>
                  <p className="mt-2 text-xs text-slate-600">The HRIS database is authoritative. Confirmed orphans can be deleted. Older SiBS HRIS-titled events and events simply named “Interview” are unverified: they are never removed automatically. Select each one only if you know it belongs to an obsolete HRIS schedule. Other Google events are excluded.</p>
                  <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-[#DDE7F2] bg-[#F8FAFC] p-3 text-xs">
                    <p className="mb-2 font-bold">Confirmed database orphans (will be deleted)</p>
                    {orphanPreview.orphans?.length ? orphanPreview.orphans.map((item) => (
                      <p key={item.id} className="border-b border-slate-200 py-1 last:border-0">{item.start ? `${item.start} — ` : ""}{item.title}</p>
                    )) : "No confirmed orphans."}
                    {orphanPreview.truncatedPreview ? <p>Showing first 100 of {orphanPreview.count}.</p> : null}
                  </div>
                  {orphanPreview.legacyCount > 0 ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <strong>Legacy HRIS / generic Interview events (manual review)</strong>
                      </div>
                      <p className="mt-1 text-amber-900">These may include unrelated Google meetings. Review the date and title carefully, then check each obsolete event individually. Generic “Interview” events are never selected or deleted automatically.</p>
                      <div className="mt-2 max-h-44 overflow-y-auto">
                        {orphanPreview.legacy?.map((item) => (
                          <label key={item.id} className="flex cursor-pointer items-start gap-2 border-b border-amber-200 py-2 last:border-0">
                            <input type="checkbox" className="mt-0.5 accent-[#FF5C28]" checked={selectedLegacyIds.includes(item.id)}
                              onChange={(e) => setSelectedLegacyIds((ids) => e.target.checked ? [...ids, item.id] : ids.filter((id) => id !== item.id))} />
                            <span>{item.start ? `${item.start} — ` : ""}{item.title}</span>
                          </label>
                        ))}
                      </div>
                      {orphanPreview.truncatedLegacy ? <p>Showing first 100; rerun after cleanup to review remaining events.</p> : null}
                    </div>
                  ) : null}
                </>
              ) : null}
              {orphanMessage ? <p className="mt-4 text-sm">{orphanMessage}</p> : null}
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" disabled={orphanBusy} onClick={() => { setOrphanPreview(null); setOrphanMessage(""); }}
                  className="rounded-lg border px-4 py-2 text-xs font-bold">Close</button>
                {(orphanPreview?.count > 0 || selectedLegacyIds.length > 0) ? <button type="button" disabled={orphanBusy} onClick={handleConfirmOrphanCleanup}
                  className="rounded-lg bg-[#FF5C28] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  Delete selected ({(orphanPreview?.count || 0) + selectedLegacyIds.length})
                </button> : null}
              </div>
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
