import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Link2, MapPin, RefreshCw, X } from "lucide-react";
import { getGoogleCalendarEvents, getGoogleCalendarStatus } from "../../../lib/axios/googleCalendarApi";

// The NHO calendar shares the visual month-grid model of the Final Interview
// calendar, not its 30-minute interview-slot rules. All Google events are
// read-only; selecting an NHO Friday only updates the existing HRIS form.
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (value) => String(value).padStart(2, "0");
const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const dateFromKey = (value) => isDateKey(value) ? new Date(`${value}T12:00:00`) : null;
const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const dateHeading = (key) => {
  const date = dateFromKey(key);
  return date ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date) : key;
};

function manilaParts(input) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function clockLabel(clock) {
  const match = /^(\d{2}):(\d{2})$/.exec(clock || "");
  if (!match) return "";
  const h = Number(match[1]);
  return `${pad(h % 12 || 12)}:${match[2]} ${h >= 12 ? "PM" : "AM"}`;
}

function normalizeEvent(event) {
  const allDay = Boolean(event?.start?.date);
  const start = allDay ? { date: event.start.date, time: "" } : manilaParts(event?.start?.dateTime);
  if (!start || !isDateKey(start.date)) return null;
  const end = allDay ? null : manilaParts(event?.end?.dateTime);
  const meet = event?.hangoutLink || event?.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri || "";
  return {
    id: event.id || `${start.date}:${start.time}:${event.summary}`,
    date: start.date, time: start.time, endTime: end?.time || "",
    title: event?.summary || "Busy", description: event?.description || "",
    location: event?.location || "", meet, allDay,
  };
}

function calendarCells(viewDate) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const firstCell = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
    return { key: dateKey(date), date, day: date.getDate(), isCurrent: date.getMonth() === viewDate.getMonth() };
  });
}

// Render above the nested Candidate Record and Schedule NHO dialogs. An inline
// z-index avoids relying on a Tailwind utility that may not be in a cached build.
const NHO_EVENT_DETAILS_Z_INDEX = 2147483000;

// Some older Google Calendar events carry a forwarded invitation email inside
// the description. Keep that original available on demand instead of letting it
// occupy the entire event viewer as an unformatted wall of text.
function readableNhoEventDescription(raw) {
  const original = String(raw || "").replace(/\r\n?/g, "\n").trim();
  if (!original) return { summary: "", original: "", containsEmailHistory: false };

  const emailHistory = /(?:^|\n)\s*(?:[-–—]{2,}\s*Original\s+(?:Appointment|Invitation|Message)\s*[-–—]*|From:\s*(?:Google Calendar|[^\n]*calendar-notification@google\.com)|Sent:\s*[^\n]+\n\s*To:)/i;
  const match = emailHistory.exec(original);
  if (match) {
    return { summary: original.slice(0, match.index).trim(), original, containsEmailHistory: true };
  }
  return { summary: original, original, containsEmailHistory: false };
}

function ReadonlyGoogleNhoEvent({ event, onClose }) {
  const dialogRef = useRef(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const description = useMemo(() => readableNhoEventDescription(event.description), [event.description]);
  const hasLongDescription = description.summary.length > 450;
  const hasHiddenDetails = description.containsEmailHistory || hasLongDescription;
  const displayedSummary = hasLongDescription
    ? `${description.summary.slice(0, 450).trimEnd()}…` : description.summary;

  useEffect(() => setShowFullDescription(false), [event.id]);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus({ preventScroll: true });
    function closeOnEscape(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        onClose();
      }
    }
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("keydown", closeOnEscape, true);
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 flex h-dvh items-center justify-center bg-black/60 px-3 py-4 font-jakarta"
      style={{ zIndex: NHO_EVENT_DETAILS_Z_INDEX }}
      role="presentation"
      onMouseDown={(e) => {
        // Portal clicks otherwise bubble through the React parent modal.
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={`View Google Calendar event ${event.title}`} tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-[660px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(2,30,56,0.38)]">
        <header className="flex shrink-0 items-center gap-3 bg-[#06325E] px-5 py-4 text-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#FF5C28]"><CalendarDays size={19}/></span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wide text-sky-100">Google Calendar · Read-only</p><h3 className="truncate text-base font-black">{event.title}</h3></div>
          <button type="button" aria-label="Close Google event details" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"><X size={19}/></button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 text-sm text-[#06325E] sm:px-6">
          <div className="rounded-[11px] border border-[#DDE7F2] bg-[#F7FAFD] px-4 py-3">
            <div className="flex items-center gap-3">
              <CalendarDays size={18} className="shrink-0 text-[#FF5C28]" aria-hidden="true"/>
              <span className="text-[13px] font-black">{dateHeading(event.date)}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Clock size={18} className="shrink-0 text-[#FF5C28]" aria-hidden="true"/>
              <span className="text-xs font-semibold">{event.allDay ? "All day" : `${clockLabel(event.time)} – ${clockLabel(event.endTime) || "Not specified"}`} · Asia/Manila</span>
            </div>
          </div>
          <div className="flex items-start gap-3 border-b border-[#DDE7F2] pb-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-[#06325E]" aria-hidden="true"/>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Location</p>
              <p className="mt-1 break-words text-xs font-semibold">{event.location || "No location specified"}</p>
            </div>
          </div>
          {/^https:\/\//i.test(event.meet || "") && (
            <a href={event.meet} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 rounded-[9px] bg-[#EEF4FA] px-3 py-2 text-xs font-bold text-[#06325E] hover:bg-[#DDEBF8] hover:underline">
              <Link2 size={16} className="shrink-0 text-[#FF5C28]"/>Join with Google Meet
            </a>
          )}
          {description.original && <section className="min-w-0 rounded-[11px] border border-[#DDE7F2] bg-white p-3" aria-label="Google event description">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-black">Description / Agenda</h4>
              {hasHiddenDetails && <button type="button" aria-expanded={showFullDescription} onClick={() => setShowFullDescription((current) => !current)} className="shrink-0 rounded-lg border border-[#DDE7F2] px-2.5 py-1.5 text-[11px] font-extrabold text-[#06325E] hover:bg-[#EEF4FA]">
                {showFullDescription ? "Hide original" : "View original"}
              </button>}
            </div>
            {displayedSummary ? <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-[#52637A]">{displayedSummary}</p>
              : <p className="mt-2 text-xs font-medium text-[#667085]">{description.containsEmailHistory ? "This event includes an imported Google Calendar invitation. Its original text is available above." : "No agenda provided."}</p>}
            {showFullDescription && hasHiddenDetails && <div className="mt-3 max-h-52 overflow-y-auto overscroll-contain whitespace-pre-wrap break-words rounded-lg bg-[#F7FAFD] p-3 text-[11px] leading-5 text-[#52637A]" aria-label="Original Google Calendar description">{description.original}</div>}
          </section>}
          <p className="rounded-lg border border-[#DDE7F2] bg-[#F7FAFD] px-3 py-2 text-[11px] leading-5 text-[#667085]">Registered Google Calendar event · Read-only. Viewing this event does not change its Google Calendar registration or the selected NHO schedule.</p>
        </div>
        <footer className="flex shrink-0 justify-end border-t border-[#DDE7F2] bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-[10px] bg-[#FF5C28] px-6 py-2.5 text-xs font-black text-white">Close</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

export default function NhoGoogleCalendarMonth({ value, onSelectDate, isBookableFriday, disabled = false }) {
  const initial = dateFromKey(value) || dateFromKey(manilaParts(new Date())?.date) || new Date();
  const [viewDate, setViewDate] = useState(() => monthStart(initial));
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [details, setDetails] = useState(null);
  const cells = useMemo(() => calendarCells(viewDate), [viewDate]);
  const byDay = useMemo(() => {
    const result = {};
    for (const item of events) (result[item.date] ||= []).push(item);
    for (const items of Object.values(result)) items.sort((a, b) => a.time.localeCompare(b.time));
    return result;
  }, [events]);
  const today = manilaParts(new Date())?.date;

  useEffect(() => {
    const candidateDate = dateFromKey(value);
    if (candidateDate) setViewDate((prev) => prev.getFullYear() === candidateDate.getFullYear() && prev.getMonth() === candidateDate.getMonth() ? prev : monthStart(candidateDate));
  }, [value]);

  useEffect(() => {
    let alive = true;
    const first = cells[0].key;
    const lastDate = cells[cells.length - 1].date;
    const exclusiveEnd = dateKey(new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1));
    setLoading(true);
    setError("");
    Promise.allSettled([
      getGoogleCalendarStatus(),
      getGoogleCalendarEvents({ timeMin: `${first}T00:00:00+08:00`, timeMax: `${exclusiveEnd}T00:00:00+08:00`, maxResults: 250 }),
    ]).then(([statusResult, calendarResult]) => {
      if (!alive) return;
      const status = statusResult.status === "fulfilled" ? statusResult.value : null;
      const calendar = calendarResult.status === "fulfilled" ? calendarResult.value : null;
      setConnected(Boolean(status?.connected));
      setEvents((Array.isArray(calendar?.events) ? calendar.events : []).map(normalizeEvent).filter(Boolean));
      if (!status?.connected) setError(status?.message || "Google Calendar is not connected. NHO dates can still be selected in HRIS.");
      else if (!calendar || calendar.success === false) setError(calendar?.message || "Unable to load Google Calendar events.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [viewDate, refresh]);

  const switchMonth = (step) => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + step, 1));

  return <div className="mt-4 font-jakarta">
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-[11px] font-bold text-[#06325E]"><CalendarDays size={16}/>Google Calendar view <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`}/><span className="text-[#667085]">{connected === null ? "Checking connection" : connected ? "Connected" : "Not connected"}</span></div>
      <button type="button" onClick={() => setRefresh((count) => count + 1)} disabled={loading || disabled} className="flex items-center gap-1.5 rounded-lg border border-[#DDE7F2] bg-white px-3 py-1.5 text-[11px] font-bold text-[#06325E] hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={13} className={loading ? "animate-spin" : ""}/>Sync</button>
    </div>
    <div className="overflow-hidden rounded-xl border border-[#DDE7F2] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[#DDE7F2] bg-[#F8FAFC] px-3 py-3">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous month" onClick={() => switchMonth(-1)} className="rounded-lg border border-[#DDE7F2] bg-white p-2 text-[#06325E] hover:bg-[#EEF4FA]"><ChevronLeft size={15}/></button>
          <button type="button" onClick={() => setViewDate(monthStart(dateFromKey(today) || new Date()))} className="rounded-lg border border-[#DDE7F2] bg-white px-3 py-2 text-[11px] font-bold text-[#06325E]">Today</button>
          <button type="button" aria-label="Next month" onClick={() => switchMonth(1)} className="rounded-lg border border-[#DDE7F2] bg-white p-2 text-[#06325E] hover:bg-[#EEF4FA]"><ChevronRight size={15}/></button>
        </div>
        <strong className="text-xs font-extrabold text-[#06325E]">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
      </div>
      {error && <p role="status" className="mx-3 mt-2 text-[11px] font-semibold text-amber-700">{error}</p>}
      <div className="grid grid-cols-7 border-b border-[#DDE7F2] bg-[#F8FAFC]">{WEEKDAYS.map((name) => <span key={name} className="py-2 text-center text-[10px] font-bold text-[#667085]">{name}</span>)}</div>
      <div className="grid grid-cols-7 auto-rows-max">
        {cells.map((day) => {
          const isFriday = day.date.getDay() === 5;
          const selectable = day.isCurrent && isFriday && day.key >= today && !disabled && Boolean(isBookableFriday?.(day.date));
          const selected = value === day.key;
          const googleEvents = byDay[day.key] || [];
          return <div key={day.key} className={`min-h-[90px] min-w-0 space-y-1 border-b border-r border-[#DDE7F2] px-1 py-1.5 sm:min-h-[102px] ${!day.isCurrent ? "bg-[#F8FAFC]" : isFriday && selectable ? "bg-emerald-50/40" : day.date.getDay() === 0 || day.date.getDay() === 6 ? "bg-[#EEF3F9]" : "bg-white"} ${selected ? "ring-2 ring-inset ring-[#FF5C28]" : ""}`}>
            <button type="button" onClick={() => selectable && onSelectDate?.(day.key)} disabled={!selectable} aria-label={`${dateHeading(day.key)}${selectable ? ", select NHO date" : ", NHO scheduling unavailable"}`} aria-pressed={selected} className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${selected ? "bg-[#FF5C28] text-white" : selectable ? "text-[#06325E] hover:bg-emerald-100" : "text-[#92A4BF]"} disabled:cursor-not-allowed`}>{day.day}</button>
            {selectable && <button type="button" onClick={() => onSelectDate?.(day.key)} className={`block w-full truncate rounded border px-1 py-0.5 text-left text-[9px] font-bold ${selected ? "border-[#FF5C28] bg-[#FFF1E9] text-[#BD3E12]" : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}>{selected ? "NHO selected" : "NHO available"}</button>}
            {googleEvents.map((event) => <button key={event.id} type="button" onClick={() => setDetails(event)} title={`${event.allDay ? "All day" : clockLabel(event.time)} — ${event.title}`} className="block w-full truncate rounded-[4px] border border-blue-200 bg-blue-50 px-1 py-0.5 text-left text-[9px] font-semibold leading-4 text-[#06325E] hover:bg-blue-100">{event.allDay ? "All Day" : clockLabel(event.time)} – {event.title}</button>)}
          </div>;
        })}
      </div>
    </div>
    <div className="mt-2 space-y-1 text-[10px] font-semibold text-[#667085]">
      <p>Only upcoming Fridays can be selected for NHO. Existing Google events remain viewable, including past dates and weekends.</p>
      <p><span className="text-emerald-700">Green: selectable Friday</span> · <span className="text-blue-700">Blue: Google event</span> · <span className="text-[#FF5C28]">Orange: selected NHO date</span></p>
    </div>
    {details && <ReadonlyGoogleNhoEvent event={details} onClose={() => setDetails(null)}/>}
  </div>;
}
