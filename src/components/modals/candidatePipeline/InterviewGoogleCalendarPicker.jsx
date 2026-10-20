import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DatePicker from "../../ui/DatePicker.jsx";
import DropdownPortal from "../../ui/DropdownPortal.jsx";
import { Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Link2, List, LockKeyhole, MapPin, RefreshCw, Tags, Video, X } from "lucide-react";
import { getGoogleCalendarEvents, getGoogleCalendarStatus, getGoogleInterviewAvailability } from "../../../lib/axios/googleCalendarApi";
import api from "../../../lib/axios/api-template";
import { interviewTypeOptions } from "../../../lib/utils/candidatePipeline/candidatePipelineConstants";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Match Google Calendar: 15-minute choices, 8 AM–4:30 PM interview starts, ending by 5 PM.
// Both start and end selectors are interactive; server-verified intervals are saved.
const INTERVIEW_FIRST_MINUTE = 8 * 60;
const INTERVIEW_LAST_START_MINUTE = 16 * 60 + 30;
const INTERVIEW_TIME_STEP_MINUTES = 15;
const INTERVIEW_SLOT_DURATION = 30;
// Use the same color names and Google event IDs as HeaderCalendarModal.
// Color selection only updates the HRIS interview proposal; it does not write to Google.
const INTERVIEW_COLOR_OPTIONS = [
  { value: "blue", label: "Blue", dotClass: "bg-blue-500", googleColorId: "1" },
  { value: "peacock", label: "Peacock Blue", dotClass: "bg-sky-500", googleColorId: "7" },
  { value: "emerald", label: "Sage Green", dotClass: "bg-emerald-500", googleColorId: "2" },
  { value: "grape", label: "Grape Purple", dotClass: "bg-violet-500", googleColorId: "3" },
  { value: "tomato", label: "Tomato Orange", dotClass: "bg-orange-500", googleColorId: "6" },
  { value: "amber", label: "Banana Yellow", dotClass: "bg-amber-400", googleColorId: "5" },
  { value: "graphite", label: "Graphite", dotClass: "bg-slate-500", googleColorId: "8" },
];
const INTERVIEW_AVAILABILITY_OPTIONS = ["Busy", "Free"];
const INTERVIEW_VISIBILITY_OPTIONS = ["Default visibility", "Public", "Private"];
const SITE_LABELS = { davao: "Davao Branch", tagum: "Tagum Branch", mabini: "Mabini Branch" };
// Keep these addresses aligned with the Office Locations page. The selected
// Talent Pool branch determines the address; it is not an editable event field.
const SITE_ADDRESSES = {
  davao: "Robinsons Cybergate Delta, Tower 2, 5th Floor, Bajada, Davao City",
  tagum: "Ramos Building, Arellano Street, Tagum City, Davao del Norte, Philippines",
  mabini: "Lagulos Building, Poblacion, Mabini, Davao de Oro, Philippines",
};

function getCandidateSiteKey(candidate = {}) {
  const location = String(
    candidate?.applyingLocation || candidate?.applying_location ||
    candidate?.applicationLocation || candidate?.site || "",
  ).trim().toLowerCase();
  const normalized = location.replace(/\s+(site|branch)$/, "").trim();
  if (/^(davao|davao city)$/.test(normalized)) return "davao";
  if (/^(tagum|tagum city)$/.test(normalized)) return "tagum";
  if (/^(mabini|mabini site|mabini branch)$/.test(normalized)) return "mabini";
  return "";
}
const two = (n) => String(n).padStart(2, "0");
const keyOf = (date) => `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
const makeDate = (dateKey) => new Date(`${dateKey}T12:00:00`);
const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

function initialInterviewCalendarDate(value) {
  // Updated interviews can arrive as ISO dates, MySQL datetimes, Date instances,
  // or older display strings. An invalid form value must never render NaN cells
  // or be sent as an interview-availability request parameter.
  const text = String(value ?? "").trim();
  const dateKey = /^(\d{4}-\d{2}-\d{2})(?:$|[T\s])/.exec(text)?.[1];
  if (dateKey) {
    const wallDate = makeDate(dateKey);
    if (!Number.isNaN(wallDate.getTime()) && keyOf(wallDate) === dateKey) {
      return wallDate;
    }
  }
  if (value) {
    const parsed = value instanceof Date ? value : new Date(text);
    const manila = manilaDateTime(parsed);
    if (manila) return makeDate(manila.dateKey);
  }
  return makeDate(todayKey());
}
// Always compare against Philippine wall time, regardless of the browser's timezone.
const todayKey = () => manilaDateTime(new Date())?.dateKey || keyOf(new Date());

function monthCells(viewDate) {
  const first = monthStart(viewDate);
  const firstCell = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
    return { dateKey: keyOf(date), day: date.getDate(), current: date.getMonth() === viewDate.getMonth() };
  });
}

function manilaDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map(({ type, value: v }) => [type, v]));
  return { dateKey: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

// Dates and clocks are zero-padded Manila wall times, so lexical comparison
// consistently rejects the current minute and anything earlier.
function isPastInterviewStart(dateKey, startClock, nowManila = manilaDateTime(new Date())) {
  if (!nowManila || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !/^\d{2}:\d{2}$/.test(startClock)) return false;
  return `${dateKey} ${startClock}` <= `${nowManila.dateKey} ${nowManila.time}`;
}

// Disable scheduling for an entire date once its final 4:30 PM start
// has passed in Manila. Google event entries remain visible as read-only
// calendar data even when staff cannot create another interview on that day.
function interviewDateIsExpired(dateKey, nowManila = manilaDateTime(new Date())) {
  if (!nowManila || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  return dateKey < nowManila.dateKey || (
    dateKey === nowManila.dateKey &&
    isPastInterviewStart(dateKey, "16:30", nowManila)
  );
}

// Weekend restrictions apply only to interview scheduling. Google Calendar
// events remain visible and accessible as read-only event details on weekends.
function isInterviewWeekend(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey || "")) return false;
  const day = makeDate(dateKey).getDay();
  return day === 0 || day === 6;
}

function nextInterviewWeekday(dateKey) {
  const start = makeDate(dateKey);
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    const candidate = keyOf(date);
    if (!isInterviewWeekend(candidate)) return candidate;
  }
  return dateKey;
}

function firstBookableInterviewDate(nowManila = manilaDateTime(new Date())) {
  const today = nowManila?.dateKey || todayKey();
  if (!interviewDateIsExpired(today, nowManila)) return nextInterviewWeekday(today);
  const date = makeDate(today);
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return nextInterviewWeekday(keyOf(tomorrow));
}

function googleCalendarEvent(event) {
  const allDay = Boolean(event?.start?.date);
  const start = allDay ? { dateKey: event.start.date, time: "" } : manilaDateTime(event?.start?.dateTime);
  if (!start) return null;
  const end = allDay ? null : manilaDateTime(event?.end?.dateTime);
  // Preserve Google metadata for the historical, read-only event editor.
  // Never expose access tokens or provide any write action from this view.
  const privateInfo = event?.extendedProperties?.private || {};
  const meetEntry = event?.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video");
  const meetLink = event?.hangoutLink || meetEntry?.uri ||
    (/^https:\/\/meet\.google\.com\//i.test(event?.location || "") ? event.location : "");
  return {
    id: event.id || `${start.dateKey}-${event.summary}`,
    ...start,
    endDateKey: end?.dateKey || "",
    endTime: end?.time || "",
    allDay,
    title: event.summary || "Busy",
    description: event.description || "",
    location: event.location || "",
    meetLink,
    organizer: event.organizer?.displayName || event.organizer?.email || event.creator?.displayName || event.creator?.email || "",
    calendarColorId: String(event.colorId || ""),
    category: privateInfo.category || privateInfo.scheduleCategory || "",
    scheduleStatus: privateInfo.status || (event.status === "confirmed" ? "Scheduled" : event.status || ""),
    site: privateInfo.site || "",
    isRecurring: Boolean(event.recurringEventId || event.recurrence?.length),
    eventType: event.eventType || "default",
    visibility: event.visibility || "default",
    transparency: event.transparency || "opaque",
    reminders: event.reminders || null,
    isFree: event.transparency === "transparent" || privateInfo.scheduleType === "Interview availability",
    isAvailability: privateInfo.scheduleType === "Interview availability",
  };
}

function pendingHrisCalendarEvent(booking) {
  // An HRIS proposal is NOT yet a registered Google Calendar event.
  const local = String(booking?.scheduled_at || "");
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(local);
  if (!match) return null;
  const startMinutes = Number(match[2].slice(0, 2)) * 60 + Number(match[2].slice(3));
  const endMinutes = startMinutes + INTERVIEW_SLOT_DURATION;
  const clock = (minutes) => `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`;
  const responseStatus = String(booking?.interview_response_status || "").toLowerCase();
  const interviewStatus = String(booking?.interview_status || "").toLowerCase();
  const status = responseStatus === "pending"
    ? "Pending candidate acceptance"
    : interviewStatus.includes("reschedul")
      ? "Pending staff approval" : "Google synchronization pending";
  const site = String(booking?.applying_location || "").trim();
  const branch = getCandidateSiteKey({ applyingLocation: site });
  const location = SITE_ADDRESSES[branch] || site;
  return {
    id: `hris-pending-${booking.candidate_pipeline_id}`,
    dateKey: match[1], time: match[2], endDateKey: match[1], endTime: clock(endMinutes),
    title: `SiBS HRIS – Interview: ${booking.candidate_name || "Candidate"}`,
    description: `Saved in SiBS HRIS. ${status}. Not yet registered in Google Calendar.`,
    location, site: SITE_LABELS[branch] || site,
    interviewType: String(booking?.interview_type || "").trim(),
    scheduleStatus: status, category: "Talent Acquisition",
    calendarColorId: "6", eventType: "INTERVIEW", allDay: false,
    isAvailability: false, isFree: false, visibility: "default",
    organizer: "SiBS HRIS", meetLink: "", transparency: "opaque",
    isPendingHris: true,
  };
}

function timeLabel(time) {
  const [hour, minute] = String(time || "").split(":").map(Number);
  if (!Number.isFinite(hour)) return "";
  return `${two(hour % 12 || 12)}:${two(minute)} ${hour >= 12 ? "PM" : "AM"}`;
}

/** Read-only details for registered Google events and pending HRIS proposals.
 * The description is displayed across the full modal width (not a two-column
 * field), and forwarded invitations are collapsed by default. */
function ReadOnlyCalendarEventsDialog({ dateKey, events, initialEventId, onClose, expired }) {
  const dialogRef = useRef(null);
  const [activeId, setActiveId] = useState(initialEventId || events[0]?.id || "");
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const activeIndex = Math.max(0, events.findIndex((event) => event.id === activeId));
  const activeEvent = events[activeIndex] || null;
  const isPending = Boolean(activeEvent?.isPendingHris);

  const formatDate = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return "Date unavailable";
    const [year, month, day] = date.split("-");
    return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
  };
  const googleColors = {
    "1": { label: "Blue", dot: "bg-blue-500" },
    "7": { label: "Peacock Blue", dot: "bg-sky-500" },
    "2": { label: "Sage Green", dot: "bg-emerald-500" },
    "3": { label: "Grape Purple", dot: "bg-violet-500" },
    "6": { label: "Tomato Orange", dot: "bg-orange-500" },
    "5": { label: "Banana Yellow", dot: "bg-amber-400" },
    "8": { label: "Graphite", dot: "bg-slate-500" },
  };
  const color = googleColors[activeEvent?.calendarColorId] || { label: "Default", dot: "bg-slate-400" };
  const availability = activeEvent?.isFree ? "Free" : "Busy";
  const visibility = activeEvent?.visibility === "private" ? "Private"
    : activeEvent?.visibility === "public" ? "Public" : "Default visibility";
  const notifications = isPending ? "Not registered yet"
    : activeEvent?.reminders?.useDefault ? "Default notifications"
    : activeEvent?.reminders?.overrides?.length
      ? `${activeEvent.reminders.overrides.length} notification(s)`
      : activeEvent?.reminders ? "No notifications" : "Notifications not specified";
  // Legacy interview-availability records remain identifiable, but the obsolete
  // fourth tab is not shown in a view-only event detail dialog.
  const eventType = activeEvent?.isAvailability || isPending ? "Interview availability"
    : activeEvent?.eventType === "outOfOffice" ? "Out of office"
    : activeEvent?.eventType === "focusTime" ? "Task" : "Event";
  const description = String(activeEvent?.description || "").trim();
  const descriptionPreview = description
    .replace(/<\/?(?:mailto|https?):[^>]*>/gi, "")
    .replace(/https?:\/\/\S+/gi, "[Link]")
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[Email]")
    .replace(/\s+/g, " ").trim().slice(0, 260);
  const isLongDescription = description.length > 300 || description.includes("\n");

  useEffect(() => {
    setActiveId(initialEventId || events[0]?.id || "");
  }, [dateKey, initialEventId]);
  useEffect(() => {
    setDescriptionExpanded(false);
  }, [activeId]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  if (!activeEvent) return null;

  return createPortal(
    <div className="sibs-modal-backdrop-in fixed inset-0 z-[10070] flex h-dvh items-center justify-center bg-[#03182C]/60 p-2 font-jakarta backdrop-blur-[3px] motion-reduce:animate-none sm:p-4" role="presentation">
      <section ref={dialogRef} role="dialog" aria-modal="true"
        aria-label={`View ${isPending ? "HRIS proposed interview" : "Google Calendar event"}: ${activeEvent.title}`}
        tabIndex={-1}
        className="sibs-modal-pop-in relative flex max-h-[min(90dvh,860px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl outline-none max-sm:max-h-[calc(100dvh-1rem)] motion-reduce:animate-none">
        <header className="shrink-0 bg-[#062F53] px-4 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF5C28] shadow-[0_6px_16px_rgba(255,92,40,0.22)]" aria-hidden="true"><CalendarDays size={19}/></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold text-white/70">SiBS HRIS Operational Workspace</p>
              <h3 className="mt-0.5 text-[16px] font-black leading-snug sm:text-lg">{isPending ? "SiBS Calendar · Proposed Interview" : "SiBS Calendar · Event Details"}</h3>
              <p className="mt-0.5 text-[11px] font-medium text-white/75">{isPending ? "HRIS proposal" : "Powered by Google Calendar"} · Asia/Manila</p>
            </div>
            <button type="button" aria-label="Close schedule details" onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={18}/></button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F5F8FC] px-3 py-4 sm:px-5 sm:py-5" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#DDE7F2] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#06325E] px-3 py-1.5 text-[11px] font-extrabold text-white">{eventType}</span>
                <span className="rounded-lg border border-[#DDE7F2] bg-[#F7FAFD] px-2.5 py-1.5 text-[10px] font-bold text-[#52637A]">View only</span>
                {activeEvent.isRecurring && <span className="rounded-lg border border-[#DDE7F2] px-2.5 py-1.5 text-[10px] font-bold text-[#52637A]">Recurring</span>}
                {activeEvent.allDay && <span className="rounded-lg border border-[#DDE7F2] px-2.5 py-1.5 text-[10px] font-bold text-[#52637A]">All day</span>}
                <span className={`ml-auto h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} title={color.label}/>
              </div>
              <h4 className="mt-3 break-words text-lg font-black leading-snug text-[#06325E] sm:text-xl">{activeEvent.title}</h4>
              {isPending && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-900">{activeEvent.scheduleStatus}. Saved in SiBS HRIS, not yet registered with Google Calendar.</p>}
              {events.length > 1 && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#DDE7F2] bg-[#F7FAFD] px-3 py-2">
                <span className="text-[11px] font-bold text-[#06325E]">Schedule {activeIndex + 1} of {events.length} · {formatDate(dateKey)}</span>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Previous schedule" disabled={activeIndex === 0} onClick={() => setActiveId(events[activeIndex - 1].id)} className="rounded-lg border border-[#DDE7F2] bg-white p-1.5 text-[#06325E] hover:bg-[#EEF4FA] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16}/></button>
                  <button type="button" aria-label="Next schedule" disabled={activeIndex === events.length - 1} onClick={() => setActiveId(events[activeIndex + 1].id)} className="rounded-lg border border-[#DDE7F2] bg-white p-1.5 text-[#06325E] hover:bg-[#EEF4FA] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16}/></button>
                </div>
              </div>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#E5ECF5] bg-[#F8FAFC] px-3 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]"><CalendarDays size={15} className="text-[#FF5C28]"/>Date</div>
                  <p className="mt-1.5 text-[13px] font-extrabold text-[#06325E]">{formatDate(activeEvent.dateKey)}{activeEvent.endDateKey && activeEvent.endDateKey !== activeEvent.dateKey ? ` – ${formatDate(activeEvent.endDateKey)}` : ""}</p>
                </div>
                <div className="rounded-lg border border-[#E5ECF5] bg-[#F8FAFC] px-3 py-3">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]"><Clock size={15} className="text-[#FF5C28]"/>Time (PHT)</div>
                  <p className="mt-1.5 text-[13px] font-extrabold text-[#06325E]">{activeEvent.allDay ? "All day" : `${timeLabel(activeEvent.time) || "Time unavailable"} – ${timeLabel(activeEvent.endTime) || "Not specified"}`}</p>
                </div>
              </div>
            </div>

            {(activeEvent.meetLink || (isPending && activeEvent.interviewType === "Online")) && <div className="flex min-w-0 items-start gap-3 rounded-xl border border-[#DDE7F2] bg-white p-4">
              <Video size={19} className="mt-0.5 shrink-0 text-[#FF5C28]" aria-hidden="true"/>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-[#06325E]">Google Meet</p>
                {/^https:\/\//i.test(activeEvent.meetLink || "")
                  ? <a className="mt-1 block max-w-full truncate text-xs font-semibold text-blue-700 hover:underline" href={activeEvent.meetLink} target="_blank" rel="noopener noreferrer" title={activeEvent.meetLink}>{activeEvent.meetLink}</a>
                  : <p className="mt-1 text-xs font-medium text-[#667085]">The meeting link will be generated after the online interview is confirmed.</p>}
              </div>
            </div>}

            {(activeEvent.location || activeEvent.site || activeEvent.organizer || activeEvent.category || activeEvent.scheduleStatus || isPending) && <div className="grid gap-3 sm:grid-cols-2">
              {(activeEvent.location || activeEvent.site) && <div className="min-w-0 rounded-xl border border-[#DDE7F2] bg-white p-4">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#667085]"><MapPin size={16} className="text-[#FF5C28]"/>Location / site</div>
                <p className="mt-2 break-words text-[13px] font-bold text-[#06325E] [overflow-wrap:anywhere]">{activeEvent.location || activeEvent.site}</p>
                {activeEvent.site && activeEvent.location && activeEvent.site !== activeEvent.location && <p className="mt-1 break-words text-xs text-[#667085]">{activeEvent.site}</p>}
              </div>}
              {activeEvent.organizer && <div className="min-w-0 rounded-xl border border-[#DDE7F2] bg-white p-4">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#667085]"><CalendarDays size={16} className="text-[#FF5C28]"/>Organizer</div>
                <p className="mt-2 break-words text-[13px] font-bold text-[#06325E] [overflow-wrap:anywhere]">{activeEvent.organizer}</p>
              </div>}
              {(activeEvent.category || activeEvent.scheduleStatus || isPending) && <div className="min-w-0 rounded-xl border border-[#DDE7F2] bg-white p-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#667085]"><Tags size={16} className="text-[#FF5C28]"/>Event information</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-[#06325E]">
                  {activeEvent.category && <span className="rounded-lg bg-[#F0F5FB] px-3 py-1.5">{activeEvent.category}</span>}
                  {activeEvent.scheduleStatus && <span className="rounded-lg bg-[#F0F5FB] px-3 py-1.5">{activeEvent.scheduleStatus}</span>}
                  {isPending && activeEvent.interviewType && <span className="rounded-lg bg-[#F0F5FB] px-3 py-1.5">{activeEvent.interviewType}</span>}
                </div>
              </div>}
            </div>}

            {description && <div className="min-w-0 rounded-xl border border-[#DDE7F2] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[12px] font-extrabold text-[#06325E]"><List size={17} className="text-[#FF5C28]"/>Description / agenda</div>
                {isLongDescription && <button type="button" aria-expanded={descriptionExpanded} onClick={() => setDescriptionExpanded((current) => !current)} className="shrink-0 rounded-lg border border-[#DDE7F2] bg-[#F7FAFD] px-3 py-1.5 text-[11px] font-bold text-[#06325E] transition hover:bg-[#EEF4FA]">{descriptionExpanded ? "Show less" : "Show full description"}</button>}
              </div>
              {descriptionExpanded || !isLongDescription
                ? <div className="mt-3 min-w-0 whitespace-pre-wrap break-words rounded-lg bg-[#F7FAFD] p-3 text-[12px] leading-5 text-[#35465C] [overflow-wrap:anywhere]">{description}</div>
                : <p className="mt-3 min-w-0 break-words rounded-lg bg-[#F7FAFD] p-3 text-[12px] leading-5 text-[#35465C] [overflow-wrap:anywhere]">{descriptionPreview}{descriptionPreview.length < description.length ? "…" : ""}</p>}
            </div>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-1 text-[11px] font-semibold text-[#667085]">
              <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={14}/>{availability}</span>
              <span className="inline-flex items-center gap-1.5"><LockKeyhole size={14}/>{visibility}</span>
              <span className="inline-flex items-center gap-1.5"><Bell size={14}/>{notifications}</span>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#DDE7F2] bg-white px-4 py-3 sm:px-6">
          <span className="max-w-[470px] text-[10px] font-semibold leading-4 text-[#667085]">{isPending
            ? "SiBS HRIS proposal only. Google Calendar registration follows the approved interview schedule."
            : expired ? "Past Google Calendar event · View only. Scheduling changes are disabled here."
            : "Google Calendar event · View only. Make changes in the authorized calendar workflow."}</span>
          <button type="button" onClick={onClose} className="h-10 shrink-0 rounded-xl bg-[#FF5C28] px-6 text-xs font-black text-white transition hover:bg-[#E84F1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C28]">Close</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

/** Same search/list/custom-time layout as HeaderCalendarModal.CalendarTimePicker.
 * The editor is HRIS-only; the API is read-only and checks a custom 30-minute
 * proposal against existing HRIS interview bookings before it can be applied. */
function ProposalTimeDropdown({ value, options, dateKey, candidateId, onChange, onValidationError, kind = "start", disabled = false, open = false, onOpenChange, nowManila }) {
  const [search, setSearch] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [meridiem, setMeridiem] = useState("AM");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const anchorRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const listId = React.useId();
  const pendingCheckRef = useRef(0);
  const requestPendingRef = useRef(false);
  const preservePendingOnCloseRef = useRef(false);
  const openRef = useRef(open);
  openRef.current = open;
  const isEnd = kind === "end";
  const normalized = useMemo(() => options.map((option) => typeof option === "string"
    ? { value: option, label: option } : option), [options]);
  const filtered = useMemo(() => normalized.filter((option) =>
    option.label.toLowerCase().replace(/\s/g, "").includes(search.trim().toLowerCase().replace(/\s/g, ""))), [normalized, search]);
  const current = normalized.find((option) => option.value === value);
  const currentClock = value?.slice(11, 16) || "";
  const selectedLabel = current?.label || (currentClock ? timeLabel(currentClock) : "Select time");

  useEffect(() => {
    if (!open) return undefined;
    setSearch("");
    setError("");
    if (currentClock) {
      const [hours, minutes] = currentClock.split(":").map(Number);
      setCustomTime(`${two(hours % 12 || 12)}:${two(minutes)}`);
      setMeridiem(hours >= 12 ? "PM" : "AM");
    } else {
      setCustomTime("");
    }
    const frame = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView?.({ block: "center" });
  }, [open]);

  useEffect(() => {
    // A date change invalidates an unfinished verification, even if the menu
    // was already dismissed by an outside click.
    pendingCheckRef.current += 1;
    requestPendingRef.current = false;
    preservePendingOnCloseRef.current = false;
    setChecking(false);
  }, [dateKey]);
  useEffect(() => {
    if (open) return;
    if (preservePendingOnCloseRef.current) {
      // Clicking outside hides the menu, but lets an already clicked time
      // finish its server-side conflict check and update the interview form.
      preservePendingOnCloseRef.current = false;
      return;
    }
    // Opening a different picker cancels stale work from this picker.
    pendingCheckRef.current += 1;
    requestPendingRef.current = false;
    setChecking(false);
  }, [open]);
  useEffect(() => () => { pendingCheckRef.current += 1; requestPendingRef.current = false; }, []);

  const close = (allowPendingSelection = false) => {
    if (allowPendingSelection && requestPendingRef.current) {
      preservePendingOnCloseRef.current = true;
    } else {
      pendingCheckRef.current += 1;
      requestPendingRef.current = false;
      preservePendingOnCloseRef.current = false;
      setChecking(false);
    }
    onOpenChange?.(false);
  };
  const reportError = (message) => {
    setError(message);
    if (!openRef.current) onValidationError?.(message);
  };

  // Do not rely exclusively on a possibly empty/stale month-wide response to
  // disable all times. Check the *selected* half-hour with the server instead.
  // The server remains authoritative for past times, weekends, holidays and
  // existing HRIS interviews. Unrelated Google appointments do not block selection.
  // The currently chosen end time can change the start
  // but the existing HRIS interview duration stays at 30 minutes.
  async function verifyAndSelect(displayClock) {
    if (checking || !/^\d{2}:\d{2}$/.test(displayClock)) return;
    const [hour, minute] = displayClock.split(":").map(Number);
    const minuteOfDay = hour * 60 + minute;
    const proposalStart = isEnd ? minuteOfDay - INTERVIEW_SLOT_DURATION : minuteOfDay;
    if (proposalStart < INTERVIEW_FIRST_MINUTE || proposalStart > INTERVIEW_LAST_START_MINUTE ||
        minuteOfDay < 0 || minuteOfDay >= 24 * 60) {
      setError(isEnd ? "End time must be between 8:30 AM and 5:00 PM." : "Start time must be between 8:00 AM and 4:30 PM.");
      return;
    }
    const startClock = `${two(Math.floor(proposalStart / 60))}:${two(proposalStart % 60)}`;
    if (isInterviewWeekend(dateKey)) {
      setError("Candidate interviews cannot be scheduled on Saturdays or Sundays. Select a weekday.");
      return;
    }
    if (isPastInterviewStart(dateKey, startClock)) {
      setError("This interview time has already passed in Manila. Choose a future time or date.");
      return;
    }
    const request = ++pendingCheckRef.current;
    requestPendingRef.current = true;
    setError("");
    setChecking(true);
    try {
      const response = await getGoogleInterviewAvailability({
        from: dateKey, to: dateKey, excludeCandidateId: candidateId,
        mode: "proposal", requestedTime: startClock,
      });
      if (request !== pendingCheckRef.current) return;
      const found = (response?.slots || []).find((slot) => slot.date === dateKey && slot.time === startClock);
      if (!response?.success || !found) {
        reportError(response?.message || "This time is unavailable in SiBS HRIS. Select an unbooked interview time on a future weekday.");
        return;
      }
      // An API response can arrive after the minute boundary. Recheck before
      // applying the verified start, not only when the request begins.
      if (isPastInterviewStart(dateKey, startClock)) {
        reportError("This interview time has already passed in Manila. Choose a future time or date.");
        return;
      }
      // The picker returns the verified start to the parent, whether staff
      // selected the start or the end of this 30-minute booking.
      onChange(found.dateTime, found);
      close();
    } catch (failure) {
      if (request === pendingCheckRef.current) {
        reportError(failure?.response?.data?.message || "Unable to verify this time. Please try again.");
      }
    } finally {
      if (request === pendingCheckRef.current) {
        requestPendingRef.current = false;
        setChecking(false);
      }
    }
  }

  function applyCustom(rawTime = customTime) {
    if (checking) return;
    const match = String(rawTime || "").trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) { setError("Enter a valid time such as 10:15, then select AM or PM."); return; }
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3] || meridiem;
    if (hour < 1 || hour > 12 || minute > 59) { setError("Use a valid 12-hour time."); return; }
    hour = hour % 12 + (period === "PM" ? 12 : 0);
    verifyAndSelect(`${two(hour)}:${two(minute)}`);
  }

  return (
    <div ref={anchorRef} className="min-w-0 w-[132px]" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.stopPropagation(); event.preventDefault(); close(); }
      if (event.key === "ArrowDown" && !open) { event.preventDefault(); onOpenChange?.(true); }
    }}>
      <button type="button" aria-label={`${isEnd ? "End" : "Start"} time: ${selectedLabel}`} aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? listId : undefined} disabled={disabled}
        onClick={() => { if (open) close(); else onOpenChange?.(true); }}
        className={`flex h-9 w-full items-center justify-between gap-1 rounded-[10px] border px-3 text-left font-jakarta text-[12px] font-bold text-[#06325E] shadow-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : "border-[#DDE7F2] bg-[#F7FAFD] hover:border-[#FF5C28]/40 hover:bg-white"}`}>
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-[#FF5C28]" : "text-[#667085]"}`} />
      </button>
      <DropdownPortal open={open && !disabled} anchorRef={anchorRef} onClose={() => close(true)}
        className="sibs-interview-options-panel !z-[2147483600] !flex !flex-col text-[#06325E]"
        width={300} matchAnchorWidth={false} maxHeight={430}>
        <div className="flex shrink-0 items-center justify-between border-b border-[#E6ECF2] px-4 py-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center text-[#FF5C28]"><Clock size={17}/></span>
          <strong className="text-[12px] font-extrabold">Select {isEnd ? "end" : "start"} time</strong>
          <span aria-hidden="true" className="h-8 w-8"/>
        </div>
        <div className="shrink-0 border-b border-[#E6ECF2] px-3 py-2.5">
          <input ref={searchRef} type="search" autoComplete="off" spellCheck={false}
            role="combobox" aria-label={`Search ${isEnd ? "end" : "start"} time`} aria-expanded={open} aria-controls={listId}
            value={search} onChange={(event) => { setSearch(event.target.value); setError(""); }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault(); event.stopPropagation();
              const exact = filtered.find((option) => option.label.toLowerCase() === search.trim().toLowerCase());
              const match = exact || filtered[0];
              if (match) verifyAndSelect(match.value.slice(11, 16));
              else if (/^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(search.trim())) applyCustom(search.trim());
            }}
            placeholder="Search time..."
            className="h-9 w-full rounded-[9px] border border-[#DDE7F2] bg-[#F7FAFD] px-3 text-xs font-bold text-[#06325E] outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-2 focus:ring-[#FF5C28]/10 placeholder:font-semibold placeholder:text-[#98A2B3]"/>
        </div>
        <div id={listId} ref={listRef} role="listbox" aria-label={`${isEnd ? "End" : "Start"} time suggested times`}
          className="sibs-scrollbar min-h-[80px] max-h-[175px] flex-1 overflow-y-auto overscroll-contain p-2.5">
          {filtered.length ? filtered.map((option) => {
            const [hour, minute] = option.value.slice(11, 16).split(":").map(Number);
            const minuteOfDay = hour * 60 + minute;
            const startMinute = isEnd ? minuteOfDay - INTERVIEW_SLOT_DURATION : minuteOfDay;
            const startClock = `${two(Math.floor(startMinute / 60))}:${two(startMinute % 60)}`;
            const isPast = isPastInterviewStart(dateKey, startClock, nowManila);
            const selected = value === option.value;
            return <button key={option.value} type="button" role="option"
              data-selected={selected} aria-selected={selected}
              title={isPast ? "This time has already passed in Manila" : undefined}
              disabled={checking || isPast} onClick={() => verifyAndSelect(option.value.slice(11, 16))}
              className={`mb-0.5 flex min-h-8 w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[12px] font-bold transition-colors ${isPast ? "cursor-not-allowed bg-slate-50 text-slate-400 opacity-60" : selected ? "bg-[#FF5C28] text-white shadow-sm" : "text-[#06325E] hover:bg-[#FFF1E9] hover:text-[#FF5C28]"} disabled:cursor-not-allowed`}>
              <span>{option.label}</span>{selected && !isPast && <Check size={14} className="shrink-0 text-white"/>}
            </button>;
          }) : <p className="px-3 py-3 text-center text-xs font-semibold text-[#667085]">No matching times. Enter a custom time below.</p>}
        </div>
        <div className="shrink-0 border-t border-[#E6ECF2] bg-white px-3 py-3">
          <label htmlFor={`${listId}-custom`} className="mb-2 block text-[11px] font-extrabold">Custom time</label>
          <div className="flex items-center gap-1.5">
            <input id={`${listId}-custom`} type="text" inputMode="numeric" aria-label={`Custom ${isEnd ? "end" : "start"} time`}
              placeholder="HH:MM" value={customTime} onChange={(event) => { setCustomTime(event.target.value); setError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); applyCustom(); } }}
              disabled={checking}
              className="h-9 min-w-0 flex-1 rounded-[9px] border border-[#DDE7F2] bg-[#F7FAFD] px-2.5 text-xs font-bold outline-none transition focus:border-[#FF5C28] focus:bg-white focus:ring-2 focus:ring-[#FF5C28]/10"/>
            <div className="flex h-9 overflow-hidden rounded-[9px] border border-[#DDE7F2] bg-white" role="group" aria-label="Choose AM or PM">
              {["AM", "PM"].map((period) => <button key={period} type="button" aria-pressed={period === meridiem}
                disabled={checking} onClick={() => { setMeridiem(period); setError(""); }}
                className={`px-1.5 text-[10px] font-extrabold transition ${period === meridiem ? "bg-[#FF5C28] text-white" : "text-[#667085] hover:bg-[#FFF1E9] hover:text-[#FF5C28]"}`}>{period}</button>)}
            </div>
            <button type="button" disabled={checking} onClick={() => applyCustom()}
              className="h-9 rounded-[9px] bg-[#FF5C28] px-3 text-[11px] font-extrabold text-white transition hover:bg-[#E85022] disabled:opacity-60">{checking ? "Checking" : "Apply"}</button>
          </div>
          {error && <p role="alert" className="mt-2 text-[11px] font-semibold leading-snug text-red-600">{error}</p>}
          <p className="mt-2 text-[10px] font-medium text-[#667085]">{isEnd ? "8:30 AM–5:00 PM" : "8:00 AM–4:30 PM"} · 30-minute interview · Past times disabled (Manila).</p>
        </div>
      </DropdownPortal>
    </div>
  );
}

/** Google-style color selector without search, matching the main calendar editor. */
function ProposalColorDropdown({ value = "peacock", onChange, open = false, onOpenChange }) {
  const anchorRef = useRef(null);
  const listId = React.useId();
  const selected = INTERVIEW_COLOR_OPTIONS.find((option) => option.value === value) || INTERVIEW_COLOR_OPTIONS[1];
  const close = () => onOpenChange?.(false);

  return (
    <div ref={anchorRef} className="w-[158px] min-w-0" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === "ArrowDown" && !open) { event.preventDefault(); onOpenChange?.(true); }
    }}>
      <button type="button" aria-label={`Color: ${selected.label}`} aria-haspopup="listbox" aria-expanded={open}
        aria-controls={open ? listId : undefined} onClick={() => open ? close() : onOpenChange?.(true)}
        className={`flex h-9 w-full items-center justify-between gap-1 rounded-[10px] border px-3 text-left font-jakarta text-[12px] font-bold text-[#06325E] shadow-sm outline-none transition-all duration-200 ${open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : "border-[#DDE7F2] bg-[#F7FAFD] hover:border-[#FF5C28]/40 hover:bg-white"}`}>
        <span className="truncate">{selected.label}</span>
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-[#FF5C28]" : "text-[#667085]"}`} />
      </button>
      <DropdownPortal open={open} anchorRef={anchorRef} onClose={close}
        className="sibs-interview-options-panel !z-[2147483600] !flex !flex-col text-[#06325E]"
        width={260} matchAnchorWidth={false} maxHeight={310}>
        <div className="shrink-0 border-b border-[#DDE7F2] px-4 py-3 text-[12px] font-extrabold text-[#06325E]">Select color</div>
        <div id={listId} role="listbox" aria-label="Google event colors" className="sibs-scrollbar max-h-[260px] overflow-y-auto overscroll-contain p-2">
          {INTERVIEW_COLOR_OPTIONS.map((option) => <button key={option.value} type="button" role="option"
            aria-selected={selected.value === option.value}
            onClick={() => { onChange(option.value); close(); }}
            className={`mb-0.5 flex min-h-8 w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] font-bold transition-colors ${selected.value === option.value ? "bg-[#FFF1E9] text-[#FF5C28]" : "text-[#06325E] hover:bg-[#FFF1E9] hover:text-[#FF5C28]"}`}>
            <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${option.dotClass}`} />{option.label}</span>
            {selected.value === option.value && <Check size={14} className="shrink-0 text-[#FF5C28]" />}
          </button>)}
        </div>
      </DropdownPortal>
    </div>
  );
}

/** Same availability menu as the main Google Calendar editor. This setting is
 * kept on the HRIS proposal, without making any Google Calendar write here. */
function ProposalAvailabilityDropdown({ value = "Busy", onChange, open = false, onOpenChange }) {
  const anchorRef = useRef(null);
  const listId = React.useId();
  const selected = INTERVIEW_AVAILABILITY_OPTIONS.includes(value) ? value : "Busy";
  const close = () => onOpenChange?.(false);

  const choose = (nextValue) => {
    onChange?.(nextValue);
    close();
  };

  return (
    <div ref={anchorRef} className="w-[162px] min-w-0" onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      if (event.key === "ArrowDown" && !open) {
        event.preventDefault();
        onOpenChange?.(true);
      }
    }}>
      <button type="button" aria-label={`Availability: ${selected}`} aria-haspopup="listbox"
        aria-expanded={open} aria-controls={open ? listId : undefined}
        onClick={() => open ? close() : onOpenChange?.(true)}
        className={`flex h-9 w-full items-center justify-between gap-1 rounded-[10px] border px-3 text-left font-jakarta text-[12px] font-bold text-[#06325E] shadow-sm outline-none transition-all duration-200 ${open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : "border-[#DDE7F2] bg-[#F7FAFD] hover:border-[#FF5C28]/40 hover:bg-white"}`}>
        <span className="truncate">{selected}</span>
        <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-[#FF5C28]" : "text-[#667085]"}`} />
      </button>
      <DropdownPortal open={open} anchorRef={anchorRef} onClose={close}
        className="sibs-interview-options-panel !z-[2147483600] !flex !flex-col text-[#06325E]"
        width={260} matchAnchorWidth={false} maxHeight={190}>
        <div className="shrink-0 border-b border-[#DDE7F2] px-4 py-3 text-[12px] font-extrabold text-[#06325E]">Select availability</div>
        <div id={listId} role="listbox" aria-label="Availability options" className="sibs-scrollbar max-h-[125px] overflow-y-auto overscroll-contain p-2">
          {INTERVIEW_AVAILABILITY_OPTIONS.map((option) => (
            <button key={option} type="button" role="option" aria-selected={selected === option}
              onClick={() => choose(option)}
              className={`mb-0.5 flex min-h-9 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-bold transition-colors ${selected === option ? "bg-[#FFF1E9] text-[#FF5C28]" : "text-[#06325E] hover:bg-[#FFF1E9] hover:text-[#FF5C28]"}`}>
              <span>{option}</span>{selected === option && <Check size={14} className="text-[#FF5C28]" />}
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
}

/** Matches the main Google Calendar visibility selector. This selection is
 * metadata on the HRIS proposal, not a direct Google Calendar write. */
function ProposalVisibilityDropdown({ value = "Default visibility", onChange, open = false, onOpenChange }) {
  const anchorRef = useRef(null);
  const searchRef = useRef(null);
  const [search, setSearch] = useState("");
  const listId = React.useId();
  const selected = INTERVIEW_VISIBILITY_OPTIONS.includes(value) ? value : "Default visibility";
  const filtered = INTERVIEW_VISIBILITY_OPTIONS.filter((option) =>
    option.toLowerCase().includes(search.trim().toLowerCase()));
  const close = () => { setSearch(""); onOpenChange?.(false); };
  const choose = (option) => { onChange?.(option); close(); };

  useEffect(() => {
    if (!open) return undefined;
    setSearch("");
    const frame = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div ref={anchorRef} className="w-[180px] max-w-full min-w-0" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === "ArrowDown" && !open) { event.preventDefault(); onOpenChange?.(true); }
    }}>
      <div className={`flex h-9 w-full items-center gap-1 rounded-[10px] border px-3 font-jakarta text-[12px] font-bold text-[#06325E] shadow-sm transition-all duration-200 ${open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : "border-[#DDE7F2] bg-[#F7FAFD] hover:border-[#FF5C28]/40 hover:bg-white"}`}>
        <input ref={searchRef} type="text" autoComplete="off" spellCheck={false}
          aria-label="Visibility selection" role="combobox" aria-autocomplete="list"
          aria-expanded={open} aria-controls={open ? listId : undefined}
          value={open ? search : selected}
          placeholder={open ? "Search visibility..." : "Visibility"}
          onFocus={() => { if (!open) onOpenChange?.(true); }}
          onClick={() => { if (!open) onOpenChange?.(true); }}
          onChange={(event) => { setSearch(event.target.value); if (!open) onOpenChange?.(true); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && open && filtered.length) {
              event.preventDefault(); event.stopPropagation(); choose(filtered[0]);
            }
          }}
          className="h-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[12px] font-bold text-[#06325E] outline-none placeholder:text-[#98A2B3]" />
        <button type="button" aria-label={open ? "Close visibility options" : "Open visibility options"}
          aria-haspopup="listbox" aria-expanded={open}
          onClick={() => open ? close() : onOpenChange?.(true)}
          className="flex h-7 w-5 shrink-0 items-center justify-center">
          <ChevronDown size={15} className={`transition-transform duration-200 ${open ? "rotate-180 text-[#FF5C28]" : "text-[#667085]"}`} />
        </button>
      </div>
      <DropdownPortal open={open} anchorRef={anchorRef} onClose={close}
        className="sibs-interview-options-panel !z-[2147483600] !flex !flex-col text-[#06325E]"
        width={260} matchAnchorWidth={false} maxHeight={240}>
        <div className="shrink-0 border-b border-[#DDE7F2] px-4 py-3 text-[12px] font-extrabold text-[#06325E]">Select visibility</div>
        <div id={listId} role="listbox" aria-label="Visibility options"
          className="sibs-scrollbar max-h-[170px] overflow-y-auto overscroll-contain p-2">
          {filtered.length ? filtered.map((option) => (
            <button key={option} type="button" role="option" aria-selected={selected === option}
              onClick={() => choose(option)}
              className={`mb-0.5 flex min-h-9 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12px] font-bold transition-colors ${selected === option ? "bg-[#FFF1E9] text-[#FF5C28]" : "text-[#06325E] hover:bg-[#FFF1E9] hover:text-[#FF5C28]"}`}>
              <span>{option}</span>{selected === option && <Check size={14} className="shrink-0 text-[#FF5C28]" />}
            </button>
          )) : <p className="px-3 py-3 text-center text-xs font-semibold text-[#667085]">No matching visibility options.</p>}
        </div>
      </DropdownPortal>
    </div>
  );
}

/** Only interview-specific options appear in the HRIS proposal editor. */
function ProposalInterviewTypeDropdown({ value, onChange, open = false, onOpenChange }) {
  const anchorRef = useRef(null);
  const listId = React.useId();
  const close = () => onOpenChange?.(false);
  return (
    <div ref={anchorRef} className="w-full min-w-0" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === "ArrowDown" && !open) { event.preventDefault(); onOpenChange?.(true); }
    }}>
      <button type="button" aria-label={`Interview type: ${value || "Not selected"}`}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
        onClick={() => onOpenChange?.(!open)}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-[10px] border px-3 text-left text-xs font-bold shadow-sm outline-none transition ${open ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10" : "border-[#DDE7F2] bg-[#F7FAFD] hover:border-[#FF5C28]/40"}`}>
        <span className={value ? "text-[#06325E]" : "text-[#98A2B3]"}>{value || "Select interview type"}</span>
        <ChevronDown size={15} className={`shrink-0 text-[#667085] transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>
      <DropdownPortal open={open} anchorRef={anchorRef} onClose={close}
        className="sibs-interview-options-panel !z-[2147483600] !flex !flex-col text-[#06325E]"
        width={260} matchAnchorWidth={false} maxHeight={190}>
        <div className="border-b border-[#DDE7F2] px-4 py-3 text-xs font-extrabold">Select interview type</div>
        <div id={listId} role="listbox" aria-label="Interview types" className="p-2">
          {interviewTypeOptions.map((option) => (
            <button key={option} type="button" role="option" aria-selected={value === option}
              onClick={() => { onChange(option); close(); }}
              className={`mb-0.5 flex min-h-9 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${value === option ? "bg-[#FFF1E9] text-[#FF5C28]" : "hover:bg-[#FFF1E9] text-[#06325E]"}`}>
              {option}{value === option && <Check size={14} className="text-[#FF5C28]"/>}
            </button>
          ))}
        </div>
      </DropdownPortal>
    </div>
  );
}

/** This editor looks like the HR calendar event editor, but only proposes a time
 * inside SiBS HRIS. It never sends a Google Calendar write request. */
function InterviewProposalEditor({ dateKey, slots, candidateId, candidate, value, remarks = "", interviewType = "", onlineInterviewLink = "", color = "peacock", onColorChange, availability = "Busy", onAvailabilityChange, visibility = "Default visibility", onVisibilityChange, notification = false, onCancel, onDateChange, onSelect }) {
  const daySlots = useMemo(() => slots.filter((slot) => slot.date === dateKey), [slots, dateKey]);
  const selectedPrevious = String(value || "").slice(0, 16);
  const [chosen, setChosen] = useState(() =>
    daySlots.find((slot) => `${slot.date}T${slot.time}` === selectedPrevious)?.dateTime ||
    (selectedPrevious.slice(0, 10) === dateKey && /^\d{2}:\d{2}$/.test(selectedPrevious.slice(11, 16))
      ? `${dateKey} ${selectedPrevious.slice(11, 16)}:00` : "") || daySlots[0]?.dateTime || "",
  );
  // Restore a previously chosen custom proposal if staff reopens this editor.
  // The server performs the authoritative conflict check again on submission.
  const [verifiedCustomSlot, setVerifiedCustomSlot] = useState(() => {
    if (selectedPrevious.slice(0, 10) !== dateKey || daySlots.some((slot) => `${slot.date}T${slot.time}` === selectedPrevious)) return null;
    const time = selectedPrevious.slice(11, 16);
    if (!/^\d{2}:\d{2}$/.test(time)) return null;
    return { date: dateKey, time, dateTime: `${dateKey} ${time}:00` };
  });
  // Keep remarks outside the calendar editor render cycle while staff types.
  // Reading from the input at Save time retains every edit without rerendering
  // the time pickers, dropdowns, or modal on each keystroke.
  const remarksInputRef = useRef(null);
  const [selectedInterviewType, setSelectedInterviewType] = useState(interviewType);
  const [selectedOnlineLink, setSelectedOnlineLink] = useState(onlineInterviewLink);
  const [addNotification, setAddNotification] = useState(Boolean(notification));
  const selectedColor = INTERVIEW_COLOR_OPTIONS.find((option) => option.value === color) || INTERVIEW_COLOR_OPTIONS[1];
  const selectedAvailability = INTERVIEW_AVAILABILITY_OPTIONS.includes(availability) ? availability : "Busy";
  const selectedVisibility = INTERVIEW_VISIBILITY_OPTIONS.includes(visibility) ? visibility : "Default visibility";
  const [error, setError] = useState("");
  const [nowManila, setNowManila] = useState(() => manilaDateTime(new Date()));
  // Keep the UI current if the editor stays open across a minute boundary.
  useEffect(() => {
    const interval = window.setInterval(() => setNowManila(manilaDateTime(new Date())), 15000);
    return () => window.clearInterval(interval);
  }, []);
  const [isClosing, setIsClosing] = useState(false);
  // One shared state controls the time, color, Busy/Free, and Visibility dropdowns.
  // Switching fields closes the previous popup in the same render.
  const [activeDropdown, setActiveDropdown] = useState(null);
  const changeActiveDropdown = (name, shouldOpen) => {
    setActiveDropdown((current) => shouldOpen ? name : (current === name ? null : current));
  };
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const closingRef = useRef(false);
  const choice = daySlots.find((slot) => slot.dateTime === chosen) || (verifiedCustomSlot?.date === dateKey && verifiedCustomSlot?.dateTime === chosen ? verifiedCustomSlot : null);
  const choiceIsPast = Boolean(choice && isPastInterviewStart(dateKey, choice.time || choice.dateTime?.slice(11, 16), nowManila));
  const isWeekend = isInterviewWeekend(dateKey);
  // A Meet URL does not exist until the candidate accepts and Google publishes the event.
  const hasRequiredDetails = interviewTypeOptions.includes(selectedInterviewType);
  // Keep all choices selectable; the server checks a precise proposed time on click.
  const presetTimeOptions = useMemo(() => {
    const result = [];
    for (let minute = INTERVIEW_FIRST_MINUTE; minute <= INTERVIEW_LAST_START_MINUTE; minute += INTERVIEW_TIME_STEP_MINUTES) {
      const clock = `${two(Math.floor(minute / 60))}:${two(minute % 60)}`;
      result.push({ value: `${dateKey} ${clock}:00`, label: timeLabel(clock) });
    }
    return result;
  }, [dateKey]);
  const endTimeOptions = useMemo(() => presetTimeOptions.map((startOption) => {
    const [h, m] = startOption.value.slice(11, 16).split(":").map(Number);
    const minutes = h * 60 + m + INTERVIEW_SLOT_DURATION;
    const clock = `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`;
    return { value: `${dateKey} ${clock}:00`, label: timeLabel(clock) };
  }), [presetTimeOptions, dateKey]);
  const selectedEnd = choice ? (() => {
    const [h, m] = choice.time.split(":").map(Number);
    const minutes = h * 60 + m + INTERVIEW_SLOT_DURATION;
    return `${dateKey} ${two(Math.floor(minutes / 60))}:${two(minutes % 60)}:00`;
  })() : "";
  const rawSite = String(candidate?.applyingLocation || candidate?.applying_location || candidate?.applicationLocation || candidate?.site || "").trim();
  const siteKey = getCandidateSiteKey(candidate);
  const site = SITE_LABELS[siteKey] || rawSite || "From Talent Pool application";
  const siteAddress = SITE_ADDRESSES[siteKey] || rawSite || "Office address not available";
  const candidateName = candidate?.name || candidate?.candidateName || [candidate?.firstName, candidate?.lastName].filter(Boolean).join(" ") || "Candidate";

  // A verified selection is retained if the background month view refreshes.
  // On date change, discard the old start and choose the next known free slot.
  useEffect(() => {
    if (chosen && !chosen.startsWith(`${dateKey} `)) {
      setChosen(daySlots[0]?.dateTime || "");
      setVerifiedCustomSlot(null);
    }
  }, [dateKey, chosen, daySlots]);

  // Keep the editor mounted during the exit animation. The action is performed
  // only afterwards, so Save still updates HRIS without writing to Google here.
  function closeWithAnimation(action) {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsClosing(true);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    exitTimerRef.current = window.setTimeout(action, reducedMotion ? 0 : 220);
  }

  useEffect(() => {
    openerRef.current = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.focus();

    function handleKeydown(event) {
      if (event.key === "Escape") {
        // An open date/time popover consumes Escape before the parent dialog.
        if (document.querySelector(".sibs-interview-options-panel, .sibs-calendar-date-panel")) return;
        event.preventDefault();
        event.stopPropagation();
        if (!closingRef.current) closeWithAnimation(onCancel);
        return;
      }
      if (event.key !== "Tab" || !dialog || closingRef.current) return;

      const focusable = Array.from(dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]:not([tabindex="-1"])',
      ));
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      window.clearTimeout(exitTimerRef.current);
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, []);

  function moveDate(days) {
    // Jump past Saturday/Sunday when advancing to another interview date.
    const current = makeDate(dateKey);
    const target = new Date(current.getFullYear(), current.getMonth(), current.getDate() + days);
    const targetKey = nextInterviewWeekday(keyOf(target));
    if (targetKey < firstBookableInterviewDate()) return;
    setError("");
    setActiveDropdown(null);
    onDateChange(targetKey);
  }

  return createPortal(
    <div className={`fixed inset-0 z-[10060] flex h-dvh items-center justify-center bg-[#03182C]/50 px-2 py-2 font-jakarta sm:px-4 sm:py-4 ${isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"} motion-reduce:animate-none`} role="presentation">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Propose candidate interview on ${dateKey}`} tabIndex={-1} className={`relative flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[14px] border border-white/70 bg-white shadow-2xl outline-none max-sm:max-h-[calc(100dvh-1rem)] ${isClosing ? "sibs-modal-pop-out pointer-events-none" : "sibs-modal-pop-in"} motion-reduce:animate-none`} onClick={(event) => event.stopPropagation()}>
        {/* Same shell as Schedule Candidate Interview: fixed navy title bar, scrollable content, fixed actions. */}
        <header className="relative shrink-0 bg-[#062F53] px-3.5 py-3 text-white sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-[#FF5C28] shadow-[0_6px_16px_rgba(255,92,40,0.22)]" aria-hidden="true"><CalendarDays size={18}/></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-black leading-5 text-white sm:text-base">Schedule Candidate Interview</h3>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">Interview</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-medium text-white/80">SiBS HRIS – Interview: {candidateName}</p>
            </div>
            <button aria-label="Close interview event editor" type="button" onClick={() => closeWithAnimation(onCancel)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/10 text-white transition hover:bg-white/20"><X size={17}/></button>
          </div>
        </header>
        {/* The underlying calendar is not reflowed while this independent form scrolls. */}
        <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain bg-[#F5F8FC] px-3 py-3 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
          <div className="rounded-xl border border-[#DDE7F2] bg-white p-3.5 sm:p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-8 items-center rounded-[9px] bg-[#06325E] px-4 text-xs font-black text-white shadow-sm" aria-current="page">Interview availability</span>
            </div>
            <div className="space-y-4">
          <div className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-3 lg:grid-cols-[24px_minmax(0,1fr)_auto]">
            <Clock size={19} className="mt-1.5 text-[#FF5C28]" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-[188px] max-w-full shrink-0">
                  <DatePicker label="Interview date" hideLabel value={dateKey}
                    displayValue={`${dateKey.slice(5, 7)}/${dateKey.slice(8, 10)}/${dateKey.slice(0, 4)}`}
                    min={firstBookableInterviewDate(nowManila)}
                    disabledDate={(date) => date.getDay() === 0 || date.getDay() === 6}
                    clearable={false} onChange={(nextDate) => { if (isInterviewWeekend(nextDate)) return; setActiveDropdown(null); setError(""); onDateChange(nextDate); }}
                    placeholder="Select interview date" buttonClassName="sibs-calendar-date-trigger !h-9 !rounded-[9px] !px-2.5 !text-[12px]"
                    portalClassName="sibs-calendar-date-panel" />
                </div>
                <span className="text-xs font-bold text-[#98A2B3]">–</span>
                <div className="flex flex-wrap items-center gap-1.5">
                <ProposalTimeDropdown value={choice?.dateTime || ""} dateKey={dateKey} candidateId={candidateId} nowManila={nowManila}
                  open={activeDropdown === "start"} onOpenChange={(nextOpen) => changeActiveDropdown("start", nextOpen)}
                  options={presetTimeOptions} onValidationError={setError}
                  onChange={(nextTime, customSlot) => {
                    if (customSlot) setVerifiedCustomSlot(customSlot);
                    setChosen(nextTime);
                    setError("");
                  }} />
                <span className="text-xs font-black text-[#667085]">–</span>
                <ProposalTimeDropdown kind="end" value={selectedEnd} dateKey={dateKey} candidateId={candidateId} nowManila={nowManila}
                  open={activeDropdown === "end"} onOpenChange={(nextOpen) => changeActiveDropdown("end", nextOpen)}
                  options={endTimeOptions} onValidationError={setError} onChange={(verifiedStart, customSlot) => {
                    if (customSlot) setVerifiedCustomSlot(customSlot);
                    setChosen(verifiedStart);
                    setError("");
                  }} />
                </div>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#667085]">Does not repeat · 30-minute interview · Asia/Manila</p>
              <p className="mt-1 text-[10px] font-medium text-[#52637A]">Google meetings are shown for reference; only existing SiBS HRIS interviews block booking.</p>
            </div>
            <div className="col-start-2 flex w-fit items-center gap-1 justify-self-start lg:col-start-auto lg:justify-self-end">
              <button type="button" onClick={() => moveDate(1)} className="h-7 rounded-[7px] border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-[#06325E] transition hover:border-[#FF5C28]">+1 Day</button>
              <button type="button" onClick={() => moveDate(7)} className="h-7 rounded-[7px] border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-[#06325E] transition hover:border-[#FF5C28]">+1 Week</button>
            </div>
          </div>

          {selectedInterviewType === "Online" && <div className="grid grid-cols-[24px_1fr] items-start gap-3">
            <Video size={19} className="mt-2 text-[#FF8A00]" />
            <div className="rounded-[9px] border border-emerald-200 bg-emerald-50 px-3 py-2.5" role="status">
              <p className="text-sm font-black text-emerald-800">Google Meet will be added after confirmation</p>
              <p className="mt-1 text-[11px] font-medium leading-4 text-emerald-700">Save creates a pending SiBS HRIS proposal only. When the candidate accepts or staff approves a reschedule, Google Calendar creates the Meet link automatically.</p>
            </div>
          </div>}

          <div className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
            <MapPin size={19} className="text-[#06325E]" />
            <span className="min-w-0 break-words border-b border-[#DDE7F2] py-2 text-xs font-semibold leading-5 text-[#06325E]" title={siteAddress}>{siteAddress}</span>
          </div>

          <div className="grid gap-3 rounded-[11px] border border-[#DDE7F2] bg-[#FCFDFE] p-3 sm:grid-cols-2">
            <h3 className="text-xs font-black text-[#06325E] sm:col-span-2">Interview Details</h3>
            <div className="min-w-0">
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">
                Interview Type <span className="text-[#FF5C28]">*</span>
              </label>
              <ProposalInterviewTypeDropdown value={selectedInterviewType}
                open={activeDropdown === "interviewType"}
                onOpenChange={(nextOpen) => changeActiveDropdown("interviewType", nextOpen)}
                onChange={(nextType) => {
                  setSelectedInterviewType(nextType);
                  if (nextType !== "Online") setSelectedOnlineLink("");
                }} />
            </div>
            {selectedInterviewType === "Online" && <div className="min-w-0">
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#667085]">Google Meet Link</p>
              <div className="flex min-h-9 items-center rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700" role="status">
                {selectedOnlineLink ? "Previously generated link will be updated on confirmation" : "Generated automatically after confirmation"}
              </div>
            </div>}
          </div>

          <div className="rounded-[11px] border border-[#DDE7F2] bg-[#FCFDFE] p-3">
            <div className="mb-2 flex items-center gap-2">
              <List size={17} className="text-[#06325E]" aria-hidden="true" />
              <label htmlFor="interview-proposal-remarks" className="text-xs font-black text-[#06325E]">
                Internal Remarks <span className="font-semibold text-[#667085]">(optional)</span>
              </label>
            </div>
            <textarea id="interview-proposal-remarks" ref={remarksInputRef} rows={3} defaultValue={remarks || ""}
              placeholder="Example: Initial interview schedule created."
              className="min-h-[88px] w-full resize-y rounded-[9px] border border-[#DDE7F2] bg-[#F7FAFD] px-3 py-2 text-xs font-semibold leading-5 text-[#06325E] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:bg-white" />
          </div>

          <div className="space-y-3 border-b border-[#DDE7F2] pb-4">
            <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
              <CalendarDays size={19} className="text-[#06325E]"/>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm font-black text-[#06325E]">Talent Acquisition <span className="inline-block h-2 w-2 rounded-full bg-[#FF5C28]"/></p><p className="text-[11px] font-semibold text-[#667085]">{selectedAvailability} • {selectedVisibility} • {addNotification ? "Notify" : "Do not notify"}</p></div>
                <div className="flex shrink-0 items-center gap-2">
                  <ProposalColorDropdown value={selectedColor.value} onChange={onColorChange}
                    open={activeDropdown === "color"} onOpenChange={(nextOpen) => changeActiveDropdown("color", nextOpen)} />
                  <span className={`h-3 w-3 rounded-full ${selectedColor.dotClass}`} aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3"><Tags size={19} className="text-[#06325E]"/><div className="flex flex-wrap gap-2"><span className="rounded-[9px] border border-[#DDE7F2] bg-[#F7FAFD] px-3 py-2 text-xs font-bold text-[#06325E]">Talent Acquisition</span><span className="rounded-[9px] border border-[#DDE7F2] bg-[#F7FAFD] px-3 py-2 text-xs font-bold text-[#06325E]">Pending candidate acceptance</span></div></div>
            <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3"><MapPin size={19} className="text-[#06325E]"/><span className="w-fit min-w-[190px] rounded-[9px] border border-[#DDE7F2] bg-[#F7FAFD] px-3 py-2 text-xs font-bold text-[#06325E]">{site}</span></div>
            <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
              <BriefcaseBusiness size={19} className="text-[#06325E]"/>
              <ProposalAvailabilityDropdown value={selectedAvailability} onChange={onAvailabilityChange}
                open={activeDropdown === "availability"} onOpenChange={(nextOpen) => changeActiveDropdown("availability", nextOpen)} />
            </div>
            <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
              <LockKeyhole size={19} className="text-[#06325E]"/>
              <div className="flex items-center gap-2">
                <ProposalVisibilityDropdown value={selectedVisibility} onChange={onVisibilityChange}
                  open={activeDropdown === "visibility"} onOpenChange={(nextOpen) => changeActiveDropdown("visibility", nextOpen)} />
                <span title="Google Calendar visibility is applied only after the interview is confirmed" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#98A2B3] text-[11px] font-black text-[#667085]">?</span>
              </div>
            </div>
            <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
              <Bell size={19} className="text-[#06325E]"/>
              <button type="button" aria-pressed={addNotification} onClick={() => setAddNotification((current) => !current)}
                className="h-9 w-fit rounded-[9px] px-0 text-left text-sm font-black text-[#06325E] transition hover:cursor-pointer hover:text-[#FF5C28]">
                {addNotification ? "Notification enabled" : "Add notification"}
              </button>
            </div>
          </div>
        </div>
        {!daySlots.length && <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[9px] bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          <span>No free interview times are shown for this date. Past or busy times cannot be booked. Choose another date or check an individual time.</span>
          <button type="button" onClick={() => moveDate(1)} className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-extrabold text-[#06325E] hover:border-[#FF5C28]">Next day <ChevronRight size={13} className="inline"/></button>
        </div>}
        {error && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">{error}</p>}
          {!hasRequiredDetails && <p className="mt-2 text-[11px] font-semibold text-[#667085]" role="status">Select an Interview Type to enable Save.</p>}
          </div>
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#DDE7F2] bg-white px-3.5 py-2.5 shadow-[0_-8px_24px_rgba(4,44,81,0.035)] sm:px-5">
          <span className="max-w-[340px] text-[10px] font-semibold leading-4 text-[#667085]" role="status">SiBS HRIS proposed only · Google Calendar is updated after candidate acceptance or approved reschedule.</span>
          <div className="flex gap-2"><button type="button" onClick={() => closeWithAnimation(onCancel)} className="h-10 rounded-[10px] px-4 text-xs font-black text-[#06325E] hover:bg-slate-100">Cancel</button>
            <button type="button" disabled={!choice || choiceIsPast || isWeekend || !hasRequiredDetails} onClick={() => {
              if (isInterviewWeekend(dateKey)) {
                setError("Interviews cannot be scheduled on Saturdays or Sundays.");
                return;
              }
              if (isPastInterviewStart(dateKey, choice?.time || choice?.dateTime?.slice(11, 16))) {
                setError("This interview time is in the past. Choose a future Manila time.");
                return;
              }
              if (!choice) { setError("Select and verify a free interview start and end time."); return; }
              if (!hasRequiredDetails) { setError("Select an interview type to continue."); return; }
              closeWithAnimation(() => onSelect(`${choice.date}T${choice.time}`, {
                interviewType: selectedInterviewType,
                onlineInterviewLink: selectedInterviewType === "Online" ? selectedOnlineLink.trim() : "",
                remarks: remarksInputRef.current?.value ?? remarks,
                calendarColor: selectedColor.value, calendarColorId: selectedColor.googleColorId,
                calendarAvailability: selectedAvailability, calendarVisibility: selectedVisibility,
                calendarAddNotification: addNotification,
              }));
            }} className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-[#FF5C28] px-6 text-xs font-black text-white shadow-[0_8px_20px_rgba(255,92,40,0.18)] transition hover:bg-[#E84F1F] disabled:cursor-not-allowed disabled:opacity-40"><Check size={15}/>Save</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/** Calendar is a read-only Google view; proposed interview appointments are HRIS-only. */
export default function InterviewGoogleCalendarPicker({ value, onChange, onProposalSaved, onOpenSibsCalendar, candidateId, candidate, remarks = "", interviewType = "", onlineInterviewLink = "", color = "peacock", onColorChange, availability = "Busy", onAvailabilityChange, visibility = "Default visibility", onVisibilityChange, notification = false }) {
  const [viewDate, setViewDate] = useState(() => monthStart(initialInterviewCalendarDate(value)));
  const [nowManila, setNowManila] = useState(() => manilaDateTime(new Date()));
  // Keep day selection in sync with the actual Philippine time without
  // refetching historical Google Calendar events every 15 seconds.
  useEffect(() => {
    const refreshClock = () => setNowManila(manilaDateTime(new Date()));
    const interval = window.setInterval(refreshClock, 15000);
    const onVisibilityChange = () => { if (!document.hidden) refreshClock(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
  const [slots, setSlots] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(null);
  const [googleSynced, setGoogleSynced] = useState(false);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [editorDate, setEditorDate] = useState("");
  const [details, setDetails] = useState(null);
  const closeDetails = React.useCallback(() => setDetails(null), []);
  const [refreshToken, setRefreshToken] = useState(0);
  const [localColor, setLocalColor] = useState(color || "peacock");
  useEffect(() => { setLocalColor(color || "peacock"); }, [color]);
  const changeColor = (nextColor) => {
    setLocalColor(nextColor);
    onColorChange?.(nextColor);
  };
  const cells = useMemo(() => monthCells(viewDate), [viewDate]);
  const availabilityDates = useMemo(() => new Set([
    ...slots.map((slot) => slot.date),
    ...events.filter((event) => event.isAvailability).map((event) => event.dateKey),
  ]), [slots, events]);
  const groupedEvents = useMemo(() => events.reduce((acc, event) => {
    (acc[event.dateKey] ||= []).push(event);
    return acc;
  }, {}), [events]);
  const selectedDate = String(value || "").slice(0, 10);

  useEffect(() => {
    let alive = true;
    const first = cells[0]?.dateKey;
    const last = cells[cells.length - 1]?.dateKey;
    if (!first || !last) return undefined;
    setLoading(true);
    setGoogleConnected(null);
    setGoogleSynced(false);
    setAvailabilityReady(false);
    setGoogleError("");
    setAvailabilityError("");
    setSlots([]);
    setEvents([]);
    setEditorDate("");

    // The account check comes FIRST. A failed/unauthorized Google sync must
    // not leave the HRIS calendar interactive with stale local availability.
    async function load() {
      const status = await getGoogleCalendarStatus();
      if (!alive) return;
      if (status?.success === false || !status?.connected) {
        setGoogleConnected(false);
        setGoogleError(status?.success === false ? status?.message : "Connect your Google account from SiBS Calendar before scheduling interviews.");
        return;
      }
      setGoogleConnected(true);
      if (!status.synced) {
        setGoogleError("Your Google account has not completed its first SiBS Calendar sync. Open SiBS Calendar to sync your account.");
        return;
      }

      const results = await Promise.allSettled([
        getGoogleCalendarEvents({ timeMin: `${first}T00:00:00+08:00`, timeMax: `${keyOf(new Date(makeDate(last).getFullYear(), makeDate(last).getMonth(), makeDate(last).getDate() + 1))}T00:00:00+08:00`, maxResults: 250 }),
        getGoogleInterviewAvailability({ from: first, to: last, excludeCandidateId: candidateId, mode: "proposal" }),
        api.get("/api/candidate-pipeline/interview/calendar-bookings", { params: { from: first, to: last } }),
      ]);
      if (!alive) return;
      const google = results[0].status === "fulfilled" ? results[0].value : null;
      const available = results[1].status === "fulfilled" ? results[1].value : null;
      const bookings = results[2].status === "fulfilled" ? results[2].value?.data?.bookings : [];
      if (!google || google.success === false || google.connected === false) {
        setGoogleError(google?.message || "Google Calendar sync failed. Open SiBS Calendar and sync your account before scheduling.");
        return;
      }
      setGoogleSynced(true);
      if (!available || available.success === false) {
        setAvailabilityError(available?.message || "Unable to verify HRIS interview availability. Retry Sync before scheduling.");
        return;
      }
      const googleEvents = (Array.isArray(google.events) ? google.events : []).map(googleCalendarEvent).filter(Boolean);
      const pendingEvents = (Array.isArray(bookings) ? bookings : []).map(pendingHrisCalendarEvent).filter(Boolean);
      setEvents([...googleEvents, ...pendingEvents]);
      setSlots(Array.isArray(available.slots) ? available.slots : []);
      setAvailabilityReady(true);
    }
    void load().catch((error) => {
      if (alive) setGoogleError(error?.message || "Unable to check Google Calendar synchronization.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [candidateId, viewDate, refreshToken]);

  const changeMonth = (step) => setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + step, 1));
  return (
    <div className="font-jakarta">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#06325E]"><CalendarDays size={16}/><span>Google Calendar view</span><span className={`h-2 w-2 rounded-full ${googleSynced ? "bg-emerald-500" : googleConnected ? "bg-amber-500" : "bg-slate-300"}`}/><span className="text-[#667085]">{googleConnected === null ? "Checking connection" : googleSynced ? "Synced" : googleConnected ? "Sync required" : "Not connected"}</span></div>
        {googleSynced && availabilityReady && (
          <button type="button" onClick={() => setRefreshToken((count) => count + 1)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE7F2] px-3 py-1.5 text-[11px] font-bold text-[#06325E] hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""}/> Sync
          </button>
        )}
      </div>
      {!loading && (!googleSynced || !availabilityReady) && <div role="alert" className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black">{googleSynced ? "Interview availability could not be verified" : "Google Calendar account sync required"}</p>
          <p className="mt-1 text-[11px] font-semibold leading-5">{googleSynced ? "Your Google account is synced, but SiBS HRIS could not confirm available interview slots. Retry before scheduling." : googleConnected ? "Your account is connected but needs synchronization. Open SiBS Calendar; this interview will resume automatically after a successful sync." : "Open SiBS Calendar to connect and sync your Google account before scheduling an interview."}</p>
          {(googleError || availabilityError) && <p className="mt-1 text-[11px] font-semibold">{googleError || availabilityError}</p>}
        </div>
        <button type="button" onClick={googleSynced ? () => setRefreshToken((count) => count + 1) : onOpenSibsCalendar} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-[11px] font-extrabold text-[#06325E] hover:bg-amber-100">{googleSynced ? <RefreshCw size={14}/> : <CalendarDays size={14}/>} {googleSynced ? "Retry availability" : "Open SiBS Calendar"}</button>
      </div>}
      {loading && <p role="status" className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-[#667085]">Verifying your Google Calendar account and interview availability…</p>}
      {googleSynced && availabilityReady && <div className="overflow-hidden rounded-xl border border-[#DDE7F2] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-[#DDE7F2] bg-[#F8FAFC] px-3 py-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" title="View previous registered calendar events (read-only)" className="rounded-lg border border-[#DDE7F2] bg-white p-2 text-[#06325E] hover:bg-[#EEF4FA]"><ChevronLeft size={15}/></button>
            <button type="button" onClick={() => setViewDate(monthStart(makeDate(nowManila?.dateKey || todayKey())))} className="rounded-lg border border-[#DDE7F2] bg-white px-3 py-2 text-[11px] font-bold text-[#06325E]">Today</button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-lg border border-[#DDE7F2] bg-white p-2 text-[#06325E] hover:bg-[#EEF4FA]"><ChevronRight size={15}/></button>
          </div>
          <strong className="text-xs font-extrabold text-[#06325E]">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
        </div>
        {googleError && <p role="status" className="mx-3 mt-2 text-[11px] font-semibold text-amber-700">{googleError}</p>}
        {availabilityError && <p role="alert" className="mx-3 mt-2 text-[11px] font-semibold text-rose-600">{availabilityError}</p>}
        <div className="grid grid-cols-7 border-b border-[#DDE7F2] bg-[#F8FAFC]">{WEEKDAYS.map((day) => <span key={day} className="py-2 text-center text-[10px] font-bold text-[#667085]">{day}</span>)}</div>
        <div className="grid auto-rows-max grid-cols-7">
          {cells.map((cell) => {
            const weekend = isInterviewWeekend(cell.dateKey);
            const available = !weekend && availabilityDates.has(cell.dateKey);
            const selectable = !weekend && slots.some((slot) => slot.date === cell.dateKey);
            const expired = interviewDateIsExpired(cell.dateKey, nowManila);
            const dayEvents = groupedEvents[cell.dateKey] || [];
            const canSchedule = cell.current && !expired && !weekend;
            // Existing Google events can still be inspected individually on weekends.
            const canReview = cell.current && dayEvents.length > 0;
            const canOpenDate = canSchedule || (canReview && expired && !weekend);
            const openDay = () => {
              if (weekend) return; // No date-level scheduling or proposal modal on weekends.
              if (interviewDateIsExpired(cell.dateKey)) {
                if (dayEvents.length) setDetails({ dateKey: cell.dateKey, eventId: null });
              } else if (cell.current) {
                setEditorDate(cell.dateKey);
              }
            };
            const openEvent = (event, click) => {
              click.stopPropagation();
              setDetails({ dateKey: cell.dateKey, eventId: event.id });
            };
            return <div key={cell.dateKey}
              data-interview-disabled={weekend || expired || !cell.current ? "true" : undefined}
              title={weekend ? "Weekend: interview scheduling is disabled. Existing events are read-only." : undefined}
              className={`relative min-h-[71px] min-w-0 border-b border-r border-[#E5ECF5] p-1 text-left align-top transition-colors duration-200 ease-out sm:min-h-[89px] ${weekend ? "bg-[#EDF1F7]" : canSchedule ? "bg-white hover:bg-[#EEF7FF]" : "bg-[#F7F9FC]"} ${selectedDate === cell.dateKey && canSchedule ? "ring-2 ring-inset ring-[#FF5C28]" : ""}`}>
              {canOpenDate && <button type="button" onClick={openDay}
                aria-label={!canSchedule ? `View ${dayEvents.length} registered calendar ${dayEvents.length === 1 ? "event" : "events"} on ${cell.dateKey}; new scheduling is disabled` : `${available ? "Interview available" : "Propose interview"} on ${cell.dateKey}`}
                title={!canSchedule ? "View existing schedules (read-only). New interviews are disabled for this date." : available ? "Click to open the interview event editor" : selectable ? "Click to propose an interview" : "Check this date for available times"}
                className="absolute inset-0 z-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF5C28]"/>}
              <span className={`pointer-events-none relative z-[1] mb-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${cell.dateKey === nowManila?.dateKey ? "bg-[#FF5C28] text-white" : canSchedule ? "text-[#06325E]" : "text-slate-400"}`}>{cell.day}</span>
              {cell.current && weekend && <span className="pointer-events-none relative z-[1] mb-1 block truncate text-[9px] font-bold text-slate-400" aria-hidden="true">Weekend disabled</span>}
              {cell.current && available && <span className={`pointer-events-none relative z-[1] mb-1 block truncate rounded border px-1 py-0.5 text-[9px] font-bold ${expired ? "border-slate-200 bg-slate-100 text-slate-500" : "border-emerald-200 bg-emerald-50 text-emerald-700 underline decoration-emerald-500 underline-offset-2"}`}>{expired ? "Interview availability ended" : "Interview available"}</span>}
              {cell.current && dayEvents.map((event) => <button key={event.id} type="button"
                onClick={(click) => openEvent(event, click)}
                aria-label={`View event details: ${event.allDay ? "All Day" : timeLabel(event.time)} – ${event.title}`}
                title={`${event.allDay ? "All Day" : timeLabel(event.time)} – ${event.title}`}
                className={`relative z-10 mb-0.5 block w-full truncate rounded border px-1 py-0.5 text-left text-[9px] font-semibold transition-colors hover:border-[#FF5C28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF5C28] ${event.isPendingHris ? "border-amber-300 bg-amber-50 text-amber-800" : event.isFree ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-sky-50 text-[#06325E]"}`}>{event.allDay ? "All Day" : timeLabel(event.time)} – {event.title}</button>)}
            </div>;
          })}
        </div>
      </div>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-[#667085]"><span>Saturdays, Sundays, and expired dates are disabled. Google events are view-only and do not block HRIS interviews.</span><span>Green: available · Blue: Google event · Amber: HRIS pending approval</span></div>
      {googleSynced && availabilityReady && selectedDate && <p className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-[#06325E]">Proposed schedule: {selectedDate} · {timeLabel(String(value).slice(11, 16))} — Pending candidate approval (not yet on Google)</p>}
      {googleSynced && availabilityReady && !loading && !availabilityError && slots.length === 0 && <p className="mt-2 text-[11px] font-semibold text-[#667085]">No available HRIS interview times in this period. Check the interview booking calendar or select a later date.</p>}
      {details && <ReadOnlyCalendarEventsDialog dateKey={details.dateKey} events={groupedEvents[details.dateKey] || []}
        initialEventId={details.eventId} onClose={closeDetails} expired={interviewDateIsExpired(details.dateKey, nowManila)} />}
      {googleSynced && availabilityReady && editorDate && <InterviewProposalEditor dateKey={editorDate} slots={slots} candidateId={candidateId} value={value} candidate={candidate} remarks={remarks} interviewType={interviewType} onlineInterviewLink={onlineInterviewLink} color={localColor} onColorChange={changeColor} availability={availability} onAvailabilityChange={onAvailabilityChange} visibility={visibility} onVisibilityChange={onVisibilityChange} notification={notification} onCancel={() => setEditorDate("")} onDateChange={(nextDate) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate) || interviewDateIsExpired(nextDate) || isInterviewWeekend(nextDate)) return;
        if (editorDate !== nextDate) setEditorDate(nextDate);
        const parsed = makeDate(nextDate);
        if (parsed.getMonth() !== viewDate.getMonth() || parsed.getFullYear() !== viewDate.getFullYear()) setViewDate(monthStart(parsed));
      }} onSelect={(next, details) => { onChange(next, details); setEditorDate(""); onProposalSaved?.(); }} />}
    </div>
  );
}
