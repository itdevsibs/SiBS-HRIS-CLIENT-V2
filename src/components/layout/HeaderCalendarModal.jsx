import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
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
import useHeaderCalendarPortal from "../../hooks/useHeaderCalendarPortal";
import HeaderCalendarModalShell from "./HeaderCalendarModalShell";

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
  peacock: "border-sky-200 bg-sky-50 text-[#075985]",
  amber: "border-amber-200 bg-amber-50 text-[#713F12]",
  emerald: "border-emerald-200 bg-emerald-50 text-[#065F46]",
  tomato: "border-orange-200 bg-orange-50 text-[#9A3412]",
  grape: "border-violet-200 bg-violet-50 text-[#5B21B6]",
  graphite: "border-slate-200 bg-slate-50 text-[#334155]",
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

const AVAILABILITY_OPTIONS = ["Busy", "Free"];
const VISIBILITY_OPTIONS = ["Default visibility", "Public", "Private"];
const GOOGLE_CALENDAR_UI_SYNC_TIMEOUT_MS = 20000;

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

  const meetLink =
    event.hangoutLink ||
    event?.conferenceData?.entryPoints?.find(
      (entryPoint) => entryPoint.entryPointType === "video",
    )?.uri ||
    "";

  return {
    id: event.id || `google-${Date.now()}`,
    googleEventId: event.id || "",
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
    summary: form.title?.trim() || "Untitled Schedule",
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
    title: "",
    category: "Talent Acquisition",
    status: "Scheduled",
    date: baseDate,
    startTime: "09:00 AM",
    endTime: "10:00 AM",
    account: "",
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

  const activeType = form.scheduleType || "Event";
  const selectedColorOption = getEventColorOption(form.color || "peacock");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateScheduleType(nextType) {
    setForm((current) => ({
      ...current,
      scheduleType: nextType,
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

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();

    onSave({
      ...form,
      id: form.id || `schedule-${Date.now()}`,
      title: form.title?.trim() || "Untitled Schedule",
      outOfOfficeEndDate: form.outOfOfficeEndDate || form.date,
    });
  }

  const tabItems = ["Event", "Task", "Out of office"];

  return (
    <div
      className="absolute inset-0 z-[2] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="thin-scroll max-h-[82vh] w-full max-w-[660px] overflow-y-auto rounded-[18px] bg-white px-6 py-5 shadow-[0_24px_80px_rgba(2,30,56,0.38)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-[#06325E]">
            <span className="h-1 w-5 rounded-full bg-[#FF5C28]" />
            Google Calendar Event
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#667085] transition hover:cursor-pointer hover:bg-[#F1F5F9] hover:text-[#06325E]"
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
          className="mt-4 h-10 w-full border-b border-[#DDE7F2] bg-transparent text-[22px] font-black leading-tight text-[#06325E] outline-none placeholder:text-[#98A2B3]"
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
                    ? "bg-[#06325E] text-white shadow-sm"
                    : "text-[#667085] hover:cursor-pointer hover:bg-[#EEF4FA] hover:text-[#06325E]",
                ].join(" ")}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {activeType === "Event" ? (
            <>
              <div className="grid grid-cols-[24px_minmax(0,1fr)] items-start gap-3 lg:grid-cols-[24px_minmax(0,1fr)_auto]">
                <Clock className="mt-1.5 h-5 w-5 text-[#FF5C28]" />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={form.date || ""}
                      onChange={(inputEvent) =>
                        updateField("date", inputEvent.target.value)
                      }
                      className="h-9 w-[166px] rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 text-sm font-black text-[#06325E] outline-none transition hover:cursor-pointer focus:border-[#FF5C28]"
                    />

                    <span className="text-xs font-bold text-[#98A2B3]">-</span>

                    <div className="flex h-9 w-fit items-center justify-center gap-2 rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3">
                      <input
                        value={form.startTime || ""}
                        onChange={(inputEvent) =>
                          updateField("startTime", inputEvent.target.value)
                        }
                        className="w-[82px] bg-transparent text-center text-sm font-black text-[#06325E] outline-none"
                      />
                      <span className="text-xs font-black text-[#667085]">
                        -
                      </span>
                      <input
                        value={form.endTime || ""}
                        onChange={(inputEvent) =>
                          updateField("endTime", inputEvent.target.value)
                        }
                        className="w-[82px] bg-transparent text-center text-sm font-black text-[#06325E] outline-none"
                      />
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] font-semibold text-[#667085]">
                    Does not repeat
                  </p>
                </div>

                <div className="col-start-2 flex w-fit items-center gap-1 justify-self-start lg:col-start-auto lg:justify-self-end">
                  <button
                    type="button"
                    onClick={() => updateField("date", addDays(form.date, 1))}
                    className="h-7 rounded-[7px] border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-[#06325E] transition hover:cursor-pointer hover:border-[#FF5C28]"
                  >
                    +1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("date", addDays(form.date, 7))}
                    className="h-7 rounded-[7px] border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-[#06325E] transition hover:cursor-pointer hover:border-[#FF5C28]"
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[24px_1fr] items-start gap-3">
                <svg
                  className="mt-1 h-5 w-5 text-[#FF8A00]"
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
                  <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-[8px] bg-[#EEF4FA] px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-[#06325E]">
                        Join with Google Meet
                      </div>
                      <a
                        href={form.meetLink || form.location}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs font-semibold text-[#52637A] underline-offset-2 transition hover:cursor-pointer hover:text-[#FF5C28] hover:underline"
                      >
                        {form.meetLink || form.location}
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyGoogleMeetLink}
                      className="flex h-8 items-center gap-1.5 rounded-[8px] border border-[#C9D6E4] bg-white px-3 text-xs font-black text-[#06325E] transition hover:cursor-pointer hover:border-[#FF5C28] hover:text-[#FF5C28]"
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
                      className="h-8 rounded-[8px] border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 transition hover:cursor-pointer hover:border-[#FF5C28] hover:text-[#FF5C28]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddGoogleMeetRequest}
                    className="inline-flex h-9 w-fit items-center gap-2 rounded-[9px] bg-[#EEF4FA] px-4 text-sm font-black text-[#06325E] transition hover:cursor-pointer hover:bg-[#E3EDF8]"
                  >
                    <Link2 className="h-4 w-4 text-[#FF5C28]" />
                    Add Google Meet link
                  </button>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(260px,1.15fr)]">
                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#06325E]" />
                  <input
                    value={form.location || ""}
                    onChange={(inputEvent) =>
                      updateField("location", inputEvent.target.value)
                    }
                    placeholder="Location / Google Meet link appears after save"
                    className="h-10 border-b border-[#DDE7F2] bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#98A2B3]"
                  />
                </div>

                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <List className="h-5 w-5 text-[#06325E]" />
                  <input
                    value={form.notes || ""}
                    onChange={(inputEvent) =>
                      updateField("notes", inputEvent.target.value)
                    }
                    placeholder="Add description or agenda"
                    className="h-10 border-b border-[#DDE7F2] bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#98A2B3]"
                  />
                </div>
              </div>

              <div className="space-y-3 border-b border-[#DDE7F2] pb-4">
                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-[#06325E]" />

                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <div className="min-w-[210px] flex-1">
                      <div className="flex items-center gap-1 text-sm font-black text-[#06325E]">
                        {form.organizer || organizerLabel || "Google Calendar"}
                        <span className="h-2 w-2 rounded-full bg-[#FF5C28]" />
                      </div>
                      <p className="text-[11px] font-semibold text-[#667085]">
                        {form.availability || "Busy"} •{" "}
                        {form.visibility || "Default visibility"} •{" "}
                        {form.addNotification ? "Notify" : "Do not notify"}
                      </p>
                    </div>

                    <select
                      value={form.color || "peacock"}
                      onChange={(inputEvent) => {
                        const nextColor = inputEvent.target.value;
                        const nextColorOption = getEventColorOption(nextColor);

                        setForm((current) => ({
                          ...current,
                          color: nextColor,
                          colorId: nextColorOption.googleColorId,
                        }));
                      }}
                      className="h-9 w-fit rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 pr-9 text-[11px] font-black text-[#06325E] outline-none transition hover:cursor-pointer"
                    >
                      {COLOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <span
                      className={[
                        "h-3 w-3 rounded-full",
                        selectedColorOption.dotClass,
                      ].join(" ")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <Tags className="h-5 w-5 text-[#06325E]" />

                  <div className="flex w-fit flex-wrap items-center gap-2">
                    <select
                      value={form.category || "Talent Acquisition"}
                      onChange={(inputEvent) =>
                        updateField("category", inputEvent.target.value)
                      }
                      className="h-9 w-fit rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 pr-9 text-[11px] font-black text-[#06325E] outline-none transition hover:cursor-pointer"
                    >
                      {CATEGORY_OPTIONS.filter(
                        (item) => item !== "All Categories",
                      ).map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>

                    <select
                      value={form.status || "Scheduled"}
                      onChange={(inputEvent) =>
                        updateField("status", inputEvent.target.value)
                      }
                      className="h-9 w-fit rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 pr-9 text-[11px] font-black text-[#06325E] outline-none transition hover:cursor-pointer"
                    >
                      {STATUS_OPTIONS.filter(
                        (item) => item !== "All Statuses",
                      ).map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <Briefcase className="h-5 w-5 text-[#06325E]" />

                  <select
                    value={form.availability || "Busy"}
                    onChange={(inputEvent) =>
                      updateField("availability", inputEvent.target.value)
                    }
                    className="h-9 w-fit rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 pr-9 text-[11px] font-black text-[#06325E] outline-none transition hover:cursor-pointer"
                  >
                    {AVAILABILITY_OPTIONS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#06325E]"
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
                    <select
                      value={form.visibility || "Default visibility"}
                      onChange={(inputEvent) =>
                        updateField("visibility", inputEvent.target.value)
                      }
                      className="h-9 w-fit rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 pr-9 text-[11px] font-black text-[#06325E] outline-none transition hover:cursor-pointer"
                    >
                      {VISIBILITY_OPTIONS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>

                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#98A2B3] text-[11px] font-black text-[#667085]">
                      ?
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#06325E]"
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
                    className="h-9 w-fit rounded-[9px] px-0 text-sm font-black text-[#06325E] transition hover:cursor-pointer hover:text-[#FF5C28]"
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
                <Clock className="mt-1.5 h-5 w-5 text-[#FF5C28]" />
                <div>
                  <input
                    type="date"
                    value={form.date || ""}
                    onChange={(inputEvent) =>
                      updateField("date", inputEvent.target.value)
                    }
                    className="h-8 rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 text-sm font-black text-[#06325E] outline-none transition hover:cursor-pointer focus:border-[#FF5C28]"
                  />
                  <p className="mt-1 text-[11px] font-semibold text-[#667085]">
                    Does not repeat
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateField("startTime", form.startTime || "09:00 AM");
                    updateField("endTime", form.endTime || "10:00 AM");
                  }}
                  className="h-8 rounded-full border border-[#DDE7F2] bg-[#EEF4FA] px-4 text-xs font-black text-[#06325E] transition hover:cursor-pointer hover:border-[#FF5C28]"
                >
                  Add time
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <svg
                    className="h-5 w-5 text-[#FF5C28]"
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
                    className="h-10 border-b border-[#DDE7F2] bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#98A2B3]"
                  />
                </div>

                <div className="grid grid-cols-[24px_1fr] items-center gap-3">
                  <List className="h-5 w-5 text-[#06325E]" />
                  <input
                    value={form.notes || ""}
                    onChange={(inputEvent) =>
                      updateField("notes", inputEvent.target.value)
                    }
                    placeholder="Add task details"
                    className="h-10 border-b border-[#DDE7F2] bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#98A2B3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[24px_1fr] items-center gap-3 border-b border-[#DDE7F2] pb-4">
                <svg
                  className="h-5 w-5 text-[#06325E]"
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

                <select
                  value={form.taskList || "My Tasks"}
                  onChange={(inputEvent) =>
                    updateField("taskList", inputEvent.target.value)
                  }
                  className="h-9 w-full max-w-[220px] rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA] px-4 text-sm font-black text-[#06325E] outline-none transition hover:cursor-pointer"
                >
                  <option>My Tasks</option>
                  <option>Talent Acquisition</option>
                  <option>HR Tasks</option>
                  <option>Operations</option>
                </select>
              </div>
            </>
          ) : null}

          {activeType === "Out of office" ? (
            <>
              <div className="grid grid-cols-[24px_1fr] items-start gap-3">
                <Clock className="mt-1.5 h-5 w-5 text-[#FF5C28]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={form.date || ""}
                      onChange={(inputEvent) =>
                        updateField("date", inputEvent.target.value)
                      }
                      className="h-8 rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 text-sm font-black text-[#06325E] outline-none transition hover:cursor-pointer focus:border-[#FF5C28]"
                    />
                    <span className="text-xs font-bold text-[#98A2B3]">-</span>
                    <input
                      type="date"
                      value={form.outOfOfficeEndDate || form.date || ""}
                      onChange={(inputEvent) =>
                        updateField(
                          "outOfOfficeEndDate",
                          inputEvent.target.value,
                        )
                      }
                      className="h-8 rounded-[9px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 text-sm font-black text-[#06325E] outline-none transition hover:cursor-pointer focus:border-[#FF5C28]"
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#667085]">
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
                  className="mt-1 h-4 w-4 accent-[#06325E] hover:cursor-pointer"
                />

                <div>
                  <div className="text-sm font-black text-[#111827]">
                    Automatically decline meetings
                  </div>

                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#344054]">
                      <input
                        type="radio"
                        checked={form.declineMode === "newOnly"}
                        onChange={() => updateField("declineMode", "newOnly")}
                        className="accent-[#06325E] hover:cursor-pointer"
                      />
                      Only new meeting invitations
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-[#344054]">
                      <input
                        type="radio"
                        checked={form.declineMode !== "newOnly"}
                        onChange={() =>
                          updateField("declineMode", "newAndExisting")
                        }
                        className="accent-[#06325E] hover:cursor-pointer"
                      />
                      New and existing meetings
                    </label>
                  </div>

                  <label className="mt-3 block text-[10px] font-black uppercase text-[#667085]">
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
                      className="mt-1 h-9 w-full rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA] px-3 text-sm font-semibold normal-case text-[#111827] outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-[24px_1fr] items-start gap-3 border-b border-[#DDE7F2] pb-4">
                <svg
                  className="h-5 w-5 text-[#06325E]"
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
                    <select
                      value={form.visibility || "Public"}
                      onChange={(inputEvent) =>
                        updateField("visibility", inputEvent.target.value)
                      }
                      className="h-9 rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA] px-4 text-sm font-black text-[#06325E] outline-none transition hover:cursor-pointer"
                    >
                      <option>Public</option>
                      <option>Private</option>
                      <option>Default visibility</option>
                    </select>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#98A2B3] text-[11px] font-black text-[#667085]">
                      ?
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-[#667085]">
                    Availability might be shown in other Google apps
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

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
              className="h-9 rounded-[10px] px-4 text-xs font-black text-[#06325E] transition hover:cursor-pointer hover:bg-[#F1F5F9]"
            >
              More options
            </button>

            <button
              type="submit"
              className="h-10 rounded-[14px] bg-[#FF5C28] px-8 text-xs font-black text-white shadow-[0_8px_20px_rgba(255,92,40,0.28)] transition hover:cursor-pointer hover:bg-[#E84F1F]"
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
      className={[
        "block w-full rounded-[8px] border px-2 py-1 text-left text-[10px] font-bold leading-4 shadow-sm transition hover:cursor-pointer hover:-translate-y-0.5 hover:border-[#FF5C28] hover:shadow-md",
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
        "w-full rounded-[10px] border px-2 py-2 text-left shadow-sm transition hover:cursor-pointer hover:-translate-y-0.5 hover:border-[#FF5C28] hover:shadow-md",
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

function DisconnectCalendarConfirmModal({
  loading,
  onCancel,
  onConfirm,
  googleCalendarEmail,
}) {
  return (
    <div className="absolute inset-0 z-[40] flex items-center justify-center bg-[#06294A]/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[430px] overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(2,30,56,0.35)]">
        <div className="flex items-center gap-3 bg-[#062F56] px-5 py-4 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FF4F24] text-white shadow-[0_10px_20px_rgba(255,79,36,0.24)]">
            <LogOut className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="sibs-modal-title leading-tight text-white">
              Disconnect Google Calendar?
            </h3>
            <p className="sibs-modal-subtitle mt-0.5 truncate text-white/70">
              {googleCalendarEmail || "Google Calendar Sync"}
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm font-semibold leading-6 text-[#475467]">
            This will unlink the connected Google Calendar account from this
            HRIS account. Existing events in Google Calendar will not be
            deleted.
          </p>

          <div className="flex justify-end gap-3 border-t border-[#E4EAF1] pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-[10px] bg-[#EEF3F8] px-4 py-2 text-sm font-extrabold text-[#06325E] transition hover:bg-[#E2EAF3] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#FF4F24] px-4 py-2 text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(255,79,36,0.24)] transition hover:bg-[#E64620] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {loading ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthCalendarView({
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
                "group flex h-[118px] flex-col border-r border-b border-[#DDE7F2] p-3 text-left transition last:border-r-0 hover:cursor-pointer hover:bg-[#F8FAFC]",
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
            const dayEvents = sortEventsByDateTime(
              eventsByDate[cell.key] || [],
            );
            const isToday = cell.key === todayKey;

            return (
              <div
                key={cell.key}
                className={[
                  "flex min-h-full flex-col rounded-[12px] border bg-[#F8FAFC] p-3",
                  isToday
                    ? "border-[#FF5C28] ring-1 ring-[#FF5C28]"
                    : "border-[#DDE7F2]",
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
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[#06325E] transition hover:cursor-pointer hover:bg-[#EAF0F7] hover:text-[#FF5C28]"
                    aria-label={`Add schedule on ${cell.label}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="thin-scroll mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#F1F5F9] px-3 text-xs font-black text-[#06325E] transition hover:cursor-pointer hover:bg-[#E6ECF2]"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#FF5C28]" />
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => onRescheduleEvent(event, 7)}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#F1F5F9] px-3 text-xs font-black text-[#06325E] transition hover:cursor-pointer hover:bg-[#E6ECF2]"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-[#FF5C28]" />
                  +1 Wk
                </button>
                <button
                  type="button"
                  onClick={() => onEditEvent(event)}
                  className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#06325E] px-3 text-xs font-black text-white transition hover:cursor-pointer hover:bg-[#0A3A63]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit / Resched
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteEvent(event.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#98A2B3] transition hover:cursor-pointer hover:bg-rose-50 hover:text-rose-600"
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
        className="h-3.5 w-3.5 text-[#4285F4]"
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
    <svg className="h-3.5 w-3.5 text-[#FF5C28]" viewBox="0 0 24 24" fill="none">
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
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[#F7F9FC] px-4 py-6 2xl:py-10">
      <section className="w-full max-w-md 2xl:max-w-[500px] rounded-2xl border border-[#DDE7F2] bg-white p-5 sm:p-6 2xl:p-8 text-center shadow-[0_18px_42px_rgba(2,30,56,0.12)]">
        <div className="mx-auto flex h-11 w-11 2xl:h-14 2xl:w-14 items-center justify-center rounded-xl 2xl:rounded-2xl bg-[#EAF2FF] text-[#06325E] shadow-sm">
          <CalendarDays className="h-5 w-5 2xl:h-7 2xl:w-7" />
        </div>

        <div className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#FBBF24] bg-white px-3 py-0.5 text-[9px] 2xl:text-[10px] font-black text-[#92400E]">
          <svg
            className="h-3 w-3 text-[#D97706]"
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

        <h3 className="sibs-modal-title mt-3 2xl:mt-5 text-[#042C51]">
          Connect Google Workspace
        </h3>

        <p className="sibs-modal-subtitle mx-auto mt-2 max-w-[360px] leading-relaxed text-[#667085]">
          To view and synchronize live HR &amp; Talent Acquisition schedules, please
          authenticate with your organization's Google account.
        </p>

        <button
          type="button"
          onClick={onConnect}
          disabled={calendarLoading}
          className="mt-5 2xl:mt-7 inline-flex h-10 2xl:h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#C9D6E4] bg-white px-5 text-xs 2xl:text-sm font-black text-[#1F2937] shadow-[0_4px_10px_rgba(2,30,56,0.12)] transition hover:cursor-pointer hover:border-[#9FB2C8] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleLogoIcon className="h-4.5 w-4.5" />
          {calendarLoading ? "Connecting..." : "Sign in with Google"}
        </button>

        <div className="mt-4 2xl:mt-6 border-t border-[#DDE7F2] pt-3.5 2xl:pt-4">
          <div className="flex flex-wrap items-center justify-center gap-1.5 2xl:gap-2">
            <span className="inline-flex h-6 2xl:h-7 items-center gap-1.5 rounded-lg border border-[#DDE7F2] bg-[#F8FAFC] px-2.5 text-[9px] 2xl:text-[10px] font-extrabold text-[#667085]">
              <SmallFeatureIcon type="shield" />
              OAuth 2.0 Secure
            </span>

            <span className="inline-flex h-6 2xl:h-7 items-center gap-1.5 rounded-lg border border-[#DDE7F2] bg-[#F8FAFC] px-2.5 text-[9px] 2xl:text-[10px] font-extrabold text-[#667085]">
              <SmallFeatureIcon type="video" />
              Meet &amp; Teams Links
            </span>

            <span className="inline-flex h-6 2xl:h-7 items-center gap-1.5 rounded-lg border border-[#DDE7F2] bg-[#F8FAFC] px-2.5 text-[9px] 2xl:text-[10px] font-extrabold text-[#667085]">
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
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);
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
      setDisconnectConfirmOpen(false);
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
        maxResults: 100,
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
        maxResults: 100,
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

  const monthCells = useMemo(() => buildMonthCells(viewDate), [viewDate]);
  const weekCells = useMemo(() => buildWeekCells(viewDate), [viewDate]);
  const todayKey = formatDateKey(new Date());
  const monthLabel = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const periodLabel =
    viewMode === "Week" ? buildRangeLabel(weekCells) : monthLabel;

  const filteredEvents = useMemo(() => events, [events]);

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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-[16px] border-b border-white/10 bg-[#062F56] px-4 py-3 2xl:px-6 2xl:py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <div className="flex min-w-0 items-center gap-3 2xl:gap-4">
            <div className="flex h-9 w-9 2xl:h-11 2xl:w-11 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl border border-white/20 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <CalendarDays className="h-4.5 w-4.5 2xl:h-5.5 2xl:w-5.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 2xl:gap-2">
                <span className="truncate text-[9px] 2xl:text-[11px] font-extrabold text-white/75">
                  HRIS Operational Workspace
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
                HR &amp; Talent Acquisition Calendar
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-2.5">
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
                className="hidden h-8 2xl:h-9 items-center gap-1.5 rounded-lg border border-[#C35D86] bg-[#2B203D] px-3 2xl:px-4 text-xs font-black text-[#FFB2C7] shadow-sm transition hover:cursor-pointer hover:border-[#F472B6] hover:bg-[#3A254F] disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
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
              className="hidden h-8 2xl:h-9 items-center gap-1.5 rounded-lg bg-[#FF5C28] px-3 2xl:px-4 text-xs font-black text-white shadow-sm transition hover:cursor-pointer hover:bg-[#E84F1F] disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
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

            <div className="flex flex-wrap items-center gap-3 border-t border-[#DDE7F2] bg-[#F8FAFC] px-4 py-2.5 2xl:px-6 2xl:py-3 text-[11px] 2xl:text-xs text-[#667085]">
              <strong className="text-[#111827]">
                Google Account Status:{" "}
                <span className="text-[#FF5C28]">Not Connected</span>
              </strong>
              <span className="ml-auto hidden italic md:inline">
                Sign in with Google to enable calendar sync.
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="thin-scroll flex items-center justify-between gap-2 overflow-x-auto border-b border-[#DDE7F2] bg-[#F8FAFC] px-4 py-3 lg:overflow-visible">
              <div className="flex items-center gap-2">
                <div className="flex h-8 shrink-0 overflow-hidden rounded-[10px] border border-[#DDE7F2] bg-[#EEF4FA]">
                  <button
                    type="button"
                    onClick={() => movePeriod(-1)}
                    className="flex w-9 items-center justify-center text-[#06325E] transition hover:cursor-pointer hover:bg-white"
                    aria-label={
                      viewMode === "Week" ? "Previous week" : "Previous month"
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="border-x border-[#DDE7F2] px-4 text-xs font-extrabold text-[#06325E] transition hover:cursor-pointer hover:bg-white"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => movePeriod(1)}
                    className="flex w-9 items-center justify-center text-[#06325E] transition hover:cursor-pointer hover:bg-white"
                    aria-label={
                      viewMode === "Week" ? "Next week" : "Next month"
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <span className="min-w-[100px] shrink-0 px-1 text-sm font-black text-[#06325E]">
                  {periodLabel}
                </span>
              </div>

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
                        : "text-[#667085] hover:cursor-pointer hover:bg-white hover:text-[#06325E]",
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
          </>
        )}

        {editingEvent ? (
          <EventEditorModal
            key={`${editingEvent.id || "new"}-${editingEvent.date || ""}`}
            event={editingEvent}
            organizerLabel={organizerLabel}
            onClose={() => setEditingEvent(null)}
            onDelete={handleDeleteEvent}
            onSave={handleSaveEvent}
          />
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
