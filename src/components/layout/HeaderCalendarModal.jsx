import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Filter,
  Grid3X3,
  Link2,
  List,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  getGoogleCalendarConnectUrl,
  getGoogleCalendarStatus,
  getGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  disconnectGoogleCalendar,
} from "@/lib/axios/googleCalendarApi";

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
  blue: "border-blue-200 bg-blue-50 text-[#06325E]",
  amber: "border-amber-200 bg-amber-50 text-[#713F12]",
  emerald: "border-emerald-200 bg-emerald-50 text-[#065F46]",
};

const STATUS_BADGE_CLASSES = {
  Scheduled: "border-blue-200 bg-blue-50 text-[#06325E]",
  "In Progress": "border-emerald-200 bg-emerald-50 text-[#047857]",
  Rescheduled: "border-amber-200 bg-amber-50 text-[#92400E]",
  Done: "border-slate-200 bg-slate-50 text-[#475467]",
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

  return date.toLocaleTimeString("en-US", {
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

  return {
    id: event.id || `google-${Date.now()}`,
    googleEventId: event.id || "",
    title: event.summary || "Untitled Schedule",
    category: privateProperties.category || "Talent Acquisition",
    status:
      privateProperties.status ||
      (event.status === "cancelled" ? "Done" : "Scheduled"),
    date: formatDateTimeToDateKey(startValue),
    startTime: event?.start?.date ? "All Day" : formatTimeLabel(startValue),
    endTime: event?.end?.date ? "All Day" : formatTimeLabel(endValue),
    account: privateProperties.account || "",
    organizer:
      event?.organizer?.displayName ||
      event?.organizer?.email ||
      privateProperties.organizer ||
      "",
    location: event.location || "",
    notes: event.description || "",
    color: privateProperties.color || "blue",
  };
}

function buildGoogleCalendarPayload(form = {}) {
  return {
    summary: form.title?.trim() || "Untitled Schedule",
    description: form.notes || "",
    location: form.location || "",
    startDateTime: parseTimeLabel(form.date, form.startTime),
    endDateTime: parseTimeLabel(form.date, form.endTime),
    timeZone: "Asia/Manila",
    extendedProperties: {
      private: {
        category: form.category || "Talent Acquisition",
        status: form.status || "Scheduled",
        account: form.account || "",
        organizer: form.organizer || "",
        color: form.color || "blue",
      },
    },
  };
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

  return date.toLocaleDateString("en-US", {
    month: options.month || "short",
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
      label: date.toLocaleDateString("en-US", {
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

  const firstLabel = firstDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const lastLabel = lastDate.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
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

function createBlankEvent(baseDate) {
  return {
    id: "",
    title: "",
    category: "Talent Acquisition",
    status: "Scheduled",
    date: baseDate,
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    account: "",
    organizer: "",
    location: "",
    notes: "",
    color: "blue",
  };
}

function EventEditorModal({ event, onClose, onDelete, onSave }) {
  const [form, setForm] = useState(event);

  useEffect(() => {
    setForm(event);
  }, [event]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    onSave({
      ...form,
      id: form.id || `schedule-${Date.now()}`,
      title: form.title.trim() || "Untitled Schedule",
    });
  }

  return (
    <div className="absolute inset-0 z-[2] flex items-center justify-center bg-[#06294A]/50 px-3 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-h-[86vh] w-full max-w-[512px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_80px_rgba(2,30,56,0.35)]"
      >
        <div className="flex h-14 items-center justify-between bg-[#062F56] px-5 text-white">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Edit3 className="h-4 w-4 text-[#FF5C28]" />
            Edit & Reschedule Event
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="thin-scroll max-h-[calc(86vh-56px)] overflow-y-auto px-5 py-5">
          <label className="block text-[10px] font-black uppercase text-[#1F2937]">
            Event / Schedule Title *
            <input
              value={form.title}
              onChange={(inputEvent) =>
                updateField("title", inputEvent.target.value)
              }
              className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none transition focus:border-[#FF5C28] focus:bg-white"
            />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] font-black uppercase text-[#1F2937]">
              Category
              <select
                value={form.category}
                onChange={(inputEvent) =>
                  updateField("category", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              >
                {CATEGORY_OPTIONS.filter(
                  (item) => item !== "All Categories",
                ).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="text-[10px] font-black uppercase text-[#1F2937]">
              Status
              <select
                value={form.status}
                onChange={(inputEvent) =>
                  updateField("status", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              >
                {STATUS_OPTIONS.filter((item) => item !== "All Statuses").map(
                  (item) => (
                    <option key={item}>{item}</option>
                  ),
                )}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-[10px] font-black uppercase text-[#1F2937]">
              Date *
              <input
                type="date"
                value={form.date}
                onChange={(inputEvent) =>
                  updateField("date", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              />
            </label>
            <label className="text-[10px] font-black uppercase text-[#1F2937]">
              Start Time
              <input
                value={form.startTime}
                onChange={(inputEvent) =>
                  updateField("startTime", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              />
            </label>
            <label className="text-[10px] font-black uppercase text-[#1F2937]">
              End Time
              <input
                value={form.endTime}
                onChange={(inputEvent) =>
                  updateField("endTime", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[10px] border border-blue-100 bg-blue-50 px-3 py-2">
            <span className="text-[11px] font-extrabold text-[#06325E]">
              Quick Reschedule Shortcut:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateField("date", addDays(form.date, 1))}
                className="rounded-md border border-[#DDE7F2] bg-white px-3 py-1 text-[11px] font-extrabold text-[#06325E] shadow-sm hover:border-[#FF5C28]"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => updateField("date", addDays(form.date, 7))}
                className="rounded-md border border-[#DDE7F2] bg-white px-3 py-1 text-[11px] font-extrabold text-[#06325E] shadow-sm hover:border-[#FF5C28]"
              >
                +1 Week
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 text-[10px] font-black uppercase text-[#1F2937]">
              Account / Participants Involved
              <input
                value={form.account}
                onChange={(inputEvent) =>
                  updateField("account", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              />
            </label>
            <label className="text-[10px] font-black uppercase text-[#1F2937]">
              Organizer / Host
              <input
                value={form.organizer}
                onChange={(inputEvent) =>
                  updateField("organizer", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              />
            </label>
            <label className="text-[10px] font-black uppercase text-[#1F2937]">
              Location / Link
              <input
                value={form.location}
                onChange={(inputEvent) =>
                  updateField("location", inputEvent.target.value)
                }
                className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 text-xs font-semibold normal-case text-[#111827] outline-none"
              />
            </label>
            <label className="sm:col-span-2 text-[10px] font-black uppercase text-[#1F2937]">
              Schedule Agenda / Operational Notes
              <textarea
                value={form.notes}
                onChange={(inputEvent) =>
                  updateField("notes", inputEvent.target.value)
                }
                className="mt-1 min-h-[50px] w-full resize-none rounded-[10px] border border-[#DDE7F2] bg-[#F3F6F9] px-3 py-2 text-xs font-semibold normal-case text-[#111827] outline-none"
              />
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[#E6ECF2] pt-3">
            <button
              type="button"
              onClick={() => form.id && onDelete(form.id)}
              disabled={!form.id}
              className="text-xs font-extrabold text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-[10px] bg-[#F1F5F9] px-4 text-xs font-extrabold text-[#06325E] transition hover:bg-[#E6ECF2]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-[10px] bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E84F1F]"
              >
                Save Schedule
              </button>
            </div>
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
      className={[
        "block w-full rounded-[8px] border px-2 py-1 text-left text-[10px] font-bold leading-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5C28] hover:shadow-md",
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
        "w-full rounded-[10px] border px-2 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5C28] hover:shadow-md",
        EVENT_COLORS[event.color] || EVENT_COLORS.blue,
      ].join(" ")}
    >
      <span className="line-clamp-3 text-[11px] font-black leading-4 text-[#102033]">
        {event.title}
      </span>
      <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#52637A]">
        <Clock className="h-3 w-3 text-[#FF5C28]" />
        {event.startTime} - {event.endTime}
      </span>
      <span className="mt-2 block truncate text-[9px] font-semibold text-[#667085]">
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

function MonthCalendarView({
  calendarLoading,
  monthCells,
  eventsByDate,
  todayKey,
  onCreateEvent,
  onEditEvent,
}) {
  return (
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="grid grid-cols-7 border-b border-[#DDE7F2] bg-[#06325E]">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="border-r border-[#17456F] px-3 py-3 text-center text-[10px] font-black uppercase text-white last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid min-w-[720px] grid-cols-7">
        {monthCells.map((cell) => {
          const dayEvents = eventsByDate[cell.key] || [];
          const isToday = cell.key === todayKey;

          return (
            <div
              key={cell.key}
              onClick={() => onCreateEvent(cell.key)}
              className={[
                "group flex h-[118px] flex-col border-r border-b border-[#DDE7F2] p-3 text-left transition last:border-r-0 hover:bg-[#F8FAFC]",
                cell.inMonth ? "bg-white" : "bg-[#EEF2F6]",
                isToday ? "ring-2 ring-inset ring-[#FF5C28]" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black",
                  isToday
                    ? "bg-[#FF5C28] text-white"
                    : cell.inMonth
                      ? "text-[#111827]"
                      : "text-[#667085]",
                ].join(" ")}
              >
                {cell.date.getDate()}
              </span>

              <div className="mt-2 space-y-1.5">
                {calendarLoading && dayEvents.length === 0 ? (
                  <div className="h-8 animate-pulse rounded-[8px] bg-slate-200" />
                ) : null}

                {dayEvents.slice(0, 3).map((event) => (
                  <CompactScheduleCard
                    key={event.id}
                    event={event}
                    onEdit={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onEditEvent(event);
                    }}
                  />
                ))}

                {dayEvents.length > 3 ? (
                  <span className="text-[10px] font-black text-[#06325E]">
                    +{dayEvents.length - 3} more
                  </span>
                ) : null}
              </div>
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
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#E8EEF5] p-4">
      <section className="flex min-h-full flex-col rounded-[14px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#DDE7F2] pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-[#06325E]">
            <CalendarDays className="h-4 w-4 text-[#FF5C28]" />
            7-Day Operational HR & TA Weekly Schedule View
          </div>
          <span className="text-xs font-bold text-[#667085]">
            Active Week Window
          </span>
        </div>

        <div className="mt-4 grid min-h-0 flex-1 min-w-[880px] grid-cols-7 gap-3">
          {weekCells.map((cell) => {
            const dayEvents = sortEventsByDateTime(eventsByDate[cell.key] || []);
            const isToday = cell.key === todayKey;

            return (
              <div
                key={cell.key}
                className={[
                  "flex min-h-full flex-col rounded-[12px] border bg-[#F8FAFC] p-3",
                  isToday ? "border-[#FF5C28] ring-1 ring-[#FF5C28]" : "border-[#DDE7F2]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between border-b border-[#E6ECF2] pb-2">
                  <span
                    className={[
                      "text-xs font-black",
                      isToday ? "text-[#FF5C28]" : "text-[#06325E]",
                    ].join(" ")}
                  >
                    {cell.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCreateEvent(cell.key)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[#06325E] transition hover:bg-[#EAF0F7] hover:text-[#FF5C28]"
                    aria-label={`Add schedule on ${cell.label}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="thin-scroll mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {calendarLoading && dayEvents.length === 0 ? (
                    <div className="h-14 animate-pulse rounded-[10px] bg-slate-200" />
                  ) : null}

                  {!calendarLoading && dayEvents.length === 0 ? (
                    <div className="flex h-full min-h-[260px] items-center justify-center text-center text-[11px] font-semibold italic text-[#667085]">
                      No events scheduled
                    </div>
                  ) : null}

                  {dayEvents.map((event) => (
                    <WeekScheduleCard
                      key={event.id}
                      event={event}
                      onEdit={() => onEditEvent(event)}
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
    <div className="thin-scroll min-h-0 flex-1 overflow-y-auto bg-[#E8EEF5] p-4">
      <section className="flex min-h-full flex-col rounded-[14px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#DDE7F2] pb-3">
          <div className="flex items-center gap-2 text-sm font-black text-[#06325E]">
            <List className="h-4 w-4" />
            Agenda Schedule Directory ({sortedEvents.length} Items)
          </div>
          <span className="text-xs font-bold text-[#667085]">
            Chronological View
          </span>
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {sortedEvents.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[12px] border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-4 py-10 text-center text-sm font-bold text-[#667085]">
              No schedules match the selected filters.
            </div>
          ) : null}

          {sortedEvents.map((event) => (
            <article
              key={event.id}
              className="flex gap-4 rounded-[12px] border border-[#DDE7F2] bg-white p-4 shadow-sm"
            >
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[12px] bg-[#06325E] text-white">
                <span className="text-[10px] font-black uppercase">
                  {formatDayLabel(event.date, { month: "short" }).split(" ")[0]}
                </span>
                <span className="text-xl font-black">
                  {formatDayLabel(event.date, { month: "short" }).split(" ")[1]}
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
                  <span className="flex items-center gap-1 text-sm font-black text-[#06325E]">
                    <Clock className="h-3.5 w-3.5 text-[#FF5C28]" />
                    {event.startTime} - {event.endTime}
                  </span>
                </div>

                <h3 className="mt-2 truncate text-sm font-black text-[#101828]">
                  {event.title}
                </h3>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#52637A]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-[#06325E]" />
                    Account: {event.account || "Not specified"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-[#06325E]" />
                    Host: {event.organizer || "Not specified"}
                  </span>
                  {event.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#FF5C28]" />
                      {event.location}
                    </span>
                  ) : null}
                </div>

                {event.notes ? (
                  <p className="mt-3 max-w-[560px] rounded-[8px] bg-[#EEF4FA] px-3 py-2 text-[11px] font-semibold italic text-[#667085]">
                    {event.notes}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-center">
                <button
                  type="button"
                  onClick={() => onRescheduleEvent(event, 1)}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#F1F5F9] px-3 text-xs font-black text-[#06325E] transition hover:bg-[#E6ECF2]"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#FF5C28]" />
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => onRescheduleEvent(event, 7)}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#F1F5F9] px-3 text-xs font-black text-[#06325E] transition hover:bg-[#E6ECF2]"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-[#FF5C28]" />
                  +1 Wk
                </button>
                <button
                  type="button"
                  onClick={() => onEditEvent(event)}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#06325E] px-3 text-xs font-black text-white transition hover:bg-[#0A3A63]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit / Resched
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(event.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#98A2B3] transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Delete ${event.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function HeaderCalendarModal({ open, onClose }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Statuses");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("Month");
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  async function loadGoogleCalendarStatus() {
    try {
      const payload = await getGoogleCalendarStatus();

      if (payload?.success === false) {
        setCalendarConnected(false);
        setGoogleCalendarEmail("");
        return false;
      }

      setCalendarConnected(Boolean(payload?.connected));
      setGoogleCalendarEmail(payload?.googleEmail || "");

      return Boolean(payload?.connected);
    } catch {
      setCalendarConnected(false);
      setGoogleCalendarEmail("");
      return false;
    }
  }

  useEffect(() => {
    if (!open) return undefined;

    loadGoogleCalendarStatus();

    function handleGoogleCalendarMessage(event) {
      if (event.data?.type === "GOOGLE_CALENDAR_CONNECTED") {
        loadGoogleCalendarStatus();
        loadGoogleCalendarEvents();
      }

      if (event.data?.type === "GOOGLE_CALENDAR_FAILED") {
        setCalendarConnected(false);
        setGoogleCalendarEmail("");
        setCalendarError("Google Calendar connection failed.");
      }
    }

    window.addEventListener("message", handleGoogleCalendarMessage);

    return () => {
      window.removeEventListener("message", handleGoogleCalendarMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadGoogleCalendarEvents() {
    if (!open) return;

    setCalendarLoading(true);
    setCalendarError("");

    try {
      const isConnected = await loadGoogleCalendarStatus();

      if (!isConnected) {
        setEvents([]);
        return;
      }

      const { timeMin, timeMax } = getMonthRange(viewDate);

      const payload = await getGoogleCalendarEvents({
        timeMin,
        timeMax,
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

      setEvents(googleEvents.map(normalizeGoogleCalendarEvent));
      setCalendarConnected(true);
    } catch (error) {
      setCalendarError(
        error?.message || "Unable to load Google Calendar events.",
      );
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    loadGoogleCalendarEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viewDate]);

  const monthCells = useMemo(() => buildMonthCells(viewDate), [viewDate]);
  const weekCells = useMemo(() => buildWeekCells(viewDate), [viewDate]);
  const todayKey = formatDateKey(new Date());
  const monthLabel = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const periodLabel = viewMode === "Week" ? buildRangeLabel(weekCells) : monthLabel;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const matchesCategory =
          category === "All Categories" || event.category === category;
        const matchesStatus =
          status === "All Statuses" || event.status === status;
        const searchable = [
          event.title,
          event.account,
          event.organizer,
          event.location,
          event.notes,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesCategory &&
          matchesStatus &&
          searchable.includes(normalizedQuery)
        );
      }),
    [category, events, normalizedQuery, status],
  );

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce((grouped, event) => {
      grouped[event.date] = grouped[event.date] || [];
      grouped[event.date].push(event);
      return grouped;
    }, {});
  }, [filteredEvents]);

  if (!open) return null;

  function openGoogleCalendarConnection() {
    const popup = window.open(
      getGoogleCalendarConnectUrl(),
      "google-calendar-connect",
      "width=520,height=720",
    );

    if (!popup) {
      window.location.href = getGoogleCalendarConnectUrl();
      return;
    }

    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer);
        loadGoogleCalendarEvents();
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

      setCalendarConnected(true);
      setEditingEvent(null);
    } catch (error) {
      setCalendarError(
        error?.message || "Unable to save Google Calendar event.",
      );
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleDeleteEvent(eventId) {
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
    void handleSaveEvent({
      ...event,
      date: addDays(event.date, days),
      status: event.status === "Done" ? "Rescheduled" : event.status,
    });
  }

  async function handleDisconnectGoogleCalendar() {
    const confirmed = window.confirm(
      "Disconnect Google Calendar from this HRIS account?",
    );

    if (!confirmed) return;

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

      setCalendarConnected(false);
      setGoogleCalendarEmail("");
      setEvents([]);
      setEditingEvent(null);
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
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center overflow-hidden bg-[#06294A]/75 px-3 py-6 font-jakarta backdrop-blur-sm sm:px-4">
      <section className="relative flex h-[min(852px,calc(100vh-48px))] w-full max-w-[min(1120px,calc(100vw-24px))] flex-col overflow-hidden rounded-[16px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(2,30,56,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#062F56] px-4 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FF5C28]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#FF5C28] px-2 py-0.5 text-[10px] font-black uppercase">
                  HRIS Operational Workspace
                </span>
                <span
                  className={[
                    "inline-flex items-center gap-1 text-[10px] font-black uppercase",
                    calendarConnected ? "text-emerald-300" : "text-amber-300",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      calendarConnected ? "bg-emerald-300" : "bg-amber-300",
                    ].join(" ")}
                  />
                  {calendarConnected
                    ? googleCalendarEmail || "Google Calendar Sync"
                    : "Calendar Not Connected"}
                </span>
              </div>
              <h2 className="mt-1 truncate text-base font-extrabold sm:text-lg">
                HR & Talent Acquisition Calendar
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={loadGoogleCalendarEvents}
              disabled={calendarLoading || !calendarConnected}
              className="hidden h-9 items-center gap-2 rounded-[12px] bg-white/10 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  calendarLoading ? "animate-spin" : "",
                ].join(" ")}
              />
              Sync
            </button>

            {!calendarConnected ? (
              <button
                type="button"
                onClick={openGoogleCalendarConnection}
                className="hidden h-9 items-center gap-2 rounded-[12px] bg-emerald-500 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-600 sm:inline-flex"
              >
                <Link2 className="h-4 w-4" />
                Connect
              </button>
            ) : null}

            {calendarConnected ? (
              <button
                type="button"
                onClick={handleDisconnectGoogleCalendar}
                disabled={calendarLoading}
                className="hidden h-9 items-center gap-2 rounded-[12px] bg-rose-500 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
              >
                Disconnect
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setEditingEvent(createBlankEvent(todayKey))}
              className="hidden h-9 items-center gap-2 rounded-[12px] bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E84F1F] sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              New Schedule
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#082744] text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close calendar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="thin-scroll flex items-center gap-2 overflow-x-auto border-b border-[#DDE7F2] bg-[#F8FAFC] px-4 py-3 lg:overflow-visible">
          <div className="flex h-8 shrink-0 overflow-hidden rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA]">
            <button
              type="button"
              onClick={() => movePeriod(-1)}
              className="flex w-9 items-center justify-center text-[#06325E] transition hover:bg-white"
              aria-label={viewMode === "Week" ? "Previous week" : "Previous month"}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="border-x border-[#DDE7F2] px-4 text-xs font-extrabold text-[#06325E] transition hover:bg-white"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => movePeriod(1)}
              className="flex w-9 items-center justify-center text-[#06325E] transition hover:bg-white"
              aria-label={viewMode === "Week" ? "Next week" : "Next month"}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="min-w-[100px] shrink-0 px-1 text-sm font-black text-[#06325E]">
            {periodLabel}
          </span>

          <label className="relative shrink-0">
            <Tags className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-8 w-[190px] rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA] pl-9 pr-3 text-xs font-extrabold text-[#1F2937] outline-none transition hover:bg-white"
            >
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="relative shrink-0">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-8 w-[140px] rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA] pl-9 pr-3 text-xs font-extrabold text-[#1F2937] outline-none transition hover:bg-white"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#667085]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter schedules..."
              className="h-8 w-full rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA] pl-9 pr-3 text-xs font-semibold text-[#1F2937] outline-none transition placeholder:text-[#98A2B3] hover:bg-white focus:bg-white"
            />
          </label>

          <div className="flex h-8 shrink-0 overflow-hidden rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA]">
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
                    ? "bg-[#06325E] text-white"
                    : "text-[#667085] hover:bg-white hover:text-[#06325E]",
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
                className="ml-3 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-extrabold text-amber-800 transition hover:bg-amber-200"
              >
                Connect Google Calendar
              </button>
            ) : null}
          </div>
        ) : null}

        {viewMode === "Month" ? (
          <MonthCalendarView
            calendarLoading={calendarLoading}
            monthCells={monthCells}
            eventsByDate={eventsByDate}
            todayKey={todayKey}
            onCreateEvent={(dateKey) => setEditingEvent(createBlankEvent(dateKey))}
            onEditEvent={setEditingEvent}
          />
        ) : null}

        {viewMode === "Week" ? (
          <WeekCalendarView
            calendarLoading={calendarLoading}
            weekCells={weekCells}
            eventsByDate={eventsByDate}
            todayKey={todayKey}
            onCreateEvent={(dateKey) => setEditingEvent(createBlankEvent(dateKey))}
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

        <div className="flex flex-wrap items-center gap-4 border-t border-[#DDE7F2] bg-[#F8FAFC] px-6 py-3 text-xs text-[#667085]">
          <strong className="text-[#111827]">
            Google Calendar Events: {filteredEvents.length}
          </strong>
          <span className="h-4 w-px bg-[#DDE7F2]" />
          <span>TA Drives: {taDrives}</span>
          <span className="h-4 w-px bg-[#DDE7F2]" />
          <span>HR Syncs: {hrSyncs}</span>
          <span className="ml-auto hidden items-center gap-1 italic md:flex">
            <Clock className="h-3.5 w-3.5" />
            Click any schedule block to edit or reschedule timelines.
          </span>
        </div>

        {editingEvent ? (
          <EventEditorModal
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
            onDelete={handleDeleteEvent}
            onSave={handleSaveEvent}
          />
        ) : null}
      </section>
    </div>
  );

  if (typeof document === "undefined") {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}
