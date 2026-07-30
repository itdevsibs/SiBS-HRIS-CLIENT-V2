import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";

import {
  getPublicCandidateInterviewDate,
  submitPublicCandidateInterviewResponse,
} from "../../../lib/axios/publicCandidateInterviewDate";
import {
  buildCandidateInterviewCalendarDays,
  CANDIDATE_INTERVIEW_MIN_TIME,
  formatCandidateInterviewTime,
  isSelectableCandidateInterviewDate,
  normalizeCandidateInterviewHolidayDates,
  parseCandidateInterviewDateValue,
  toCandidateInterviewDateValue,
  validateCandidateInterviewTime,
} from "../../../lib/utils/candidatePipeline/candidateInterviewDateSelection";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
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

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function getErrorStatus(error) {
  return error?.response?.data?.status || "error";
}

function isSameDate(left, right) {
  if (!(left instanceof Date) || !(right instanceof Date)) return false;

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDateOnly(value) {
  const date = parseCandidateInterviewDateValue(String(value || "").slice(0, 10));

  if (!date) return "—";

  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const raw = String(value).trim();
  const match = raw.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/,
  );

  if (!match) return raw;

  return `${formatDateOnly(match[1])}${
    match[2] ? ` at ${formatCandidateInterviewTime(match[2])}` : ""
  }`;
}

function getFirstSelectableDate(todayDateValue, holidayDates) {
  const today = parseCandidateInterviewDateValue(todayDateValue) || new Date();
  const candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  while (
    !isSelectableCandidateInterviewDate(candidate, today, holidayDates)
  ) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

function PublicStateCard({ icon, title, message, tone = "blue", children }) {
  const toneClasses = {
    blue: "border-blue-100 bg-blue-50 text-sibs-primary-1",
    red: "border-red-100 bg-red-50 text-red-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-[#D9E2EC] bg-white p-6 text-center shadow-xl sm:p-10">
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}
      >
        {icon}
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-sibs-primary-1">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-[#667085]">
        {message}
      </p>
      {children}
    </div>
  );
}

function ReadOnlyResponse({ schedule, warning = "" }) {
  const status = schedule?.responseStatus || "Submitted";
  const declined = status === "Declined" || status === "No Response";
  const title =
    status === "Accepted"
      ? "Interview Schedule Accepted"
      : status === "Rescheduled"
        ? "Interview Schedule Rescheduled"
        : status === "No Response"
          ? "Response Period Ended"
          : "Interview Declined";
  const message = declined
    ? status === "No Response"
      ? "The response period ended after three follow-ups. Please contact Talent Acquisition for assistance."
      : "Your decline response has been recorded and cannot be changed."
    : `Your final interview schedule is ${formatDateTime(
        schedule?.finalInterviewDate || schedule?.selectedInterviewDate,
      )}.`;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F7FB] px-4 py-10 font-jakarta">
      <PublicStateCard
        icon={declined ? <XCircle size={32} /> : <CheckCircle2 size={32} />}
        title={title}
        message={message}
        tone={declined ? "amber" : "green"}
      >
        <div className="mt-6 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-left">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">
            Response
          </p>
          <p className="mt-1 text-base font-extrabold text-sibs-primary-1">
            {status}
          </p>
          {!declined && (
            <p className="mt-3 text-sm font-bold text-[#344054]">
              {formatDateTime(
                schedule?.finalInterviewDate || schedule?.selectedInterviewDate,
              )}
            </p>
          )}
          {schedule?.responseReason && (
            <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
              {schedule.responseReason}
            </p>
          )}
        </div>
        {warning && (
          <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            {warning}
          </p>
        )}
      </PublicStateCard>
    </main>
  );
}

export default function PublicInterviewDateSelectionPage() {
  const { token = "" } = useParams();
  const [phase, setPhase] = useState("loading");
  const [schedule, setSchedule] = useState(null);
  const [action, setAction] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSchedule() {
      setPhase("loading");
      setMessage("");

      try {
        const response = await getPublicCandidateInterviewDate(token);
        const data = response?.data || {};

        if (!active) return;

        const holidayDates = normalizeCandidateInterviewHolidayDates(
          data.holidayDates,
        );
        const today = parseCandidateInterviewDateValue(data.today) || new Date();
        const proposedDate = parseCandidateInterviewDateValue(data.proposedDate);
        const initialDate =
          proposedDate &&
          isSelectableCandidateInterviewDate(
            proposedDate,
            today,
            holidayDates,
          )
            ? proposedDate
            : getFirstSelectableDate(data.today, holidayDates);
        const proposedTimeValidation = validateCandidateInterviewTime(
          data.proposedTime,
        );

        setSchedule(data);
        setSelectedDate(toCandidateInterviewDateValue(initialDate));
        setSelectedTime(
          proposedTimeValidation.valid
            ? proposedTimeValidation.time
            : CANDIDATE_INTERVIEW_MIN_TIME,
        );
        setViewDate(
          new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
        );
        setPhase(data.readOnly ? "readonly" : "ready");
      } catch (error) {
        if (!active) return;

        const errorData = error?.response?.data?.data;

        if (errorData?.readOnly) {
          setSchedule(errorData);
          setPhase("readonly");
          return;
        }

        setPhase(getErrorStatus(error));
        setMessage(
          getErrorMessage(
            error,
            "The interview response link could not be loaded.",
          ),
        );
      }
    }

    void loadSchedule();

    return () => {
      active = false;
    };
  }, [token]);

  const holidayDates = useMemo(
    () => normalizeCandidateInterviewHolidayDates(schedule?.holidayDates),
    [schedule?.holidayDates],
  );

  const today = useMemo(
    () => parseCandidateInterviewDateValue(schedule?.today) || new Date(),
    [schedule?.today],
  );

  const selectedDateObject = useMemo(
    () => parseCandidateInterviewDateValue(selectedDate),
    [selectedDate],
  );

  const calendarDays = useMemo(
    () => buildCandidateInterviewCalendarDays(viewDate),
    [viewDate],
  );

  const timeValidation = useMemo(
    () => validateCandidateInterviewTime(selectedTime),
    [selectedTime],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setWarning("");

    if (!action) {
      setMessage("Choose Accept, Reschedule, or Decline.");
      return;
    }

    if (action === "reschedule") {
      if (
        !selectedDateObject ||
        !isSelectableCandidateInterviewDate(
          selectedDateObject,
          today,
          holidayDates,
        )
      ) {
        setMessage(
          "Select a future working day that is not a configured holiday.",
        );
        return;
      }

      if (!timeValidation.valid) {
        setMessage(timeValidation.message);
        return;
      }
    }

    setPhase("submitting");

    try {
      const response = await submitPublicCandidateInterviewResponse(token, {
        action,
        selectedDate: action === "reschedule" ? selectedDate : "",
        selectedTime: action === "reschedule" ? selectedTime : "",
        reason: action === "decline" ? declineReason : "",
      });

      const responseData = response?.data || {};

      setWarning(response?.notificationWarning || "");
      setSchedule((previous) => ({
        ...(previous || {}),
        ...responseData,
        readOnly: true,
      }));
      setPhase("success");
    } catch (error) {
      const status = getErrorStatus(error);
      const errorMessage = getErrorMessage(
        error,
        "The interview response could not be saved.",
      );

      if (["expired", "responded", "revoked", "invalid"].includes(status)) {
        const errorData = error?.response?.data?.data;

        if (errorData) setSchedule(errorData);
        setPhase(status === "responded" ? "readonly" : status);
        setMessage(errorMessage);
        return;
      }

      setPhase("ready");
      setMessage(errorMessage);
    }
  }

  if (phase === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F4F7FB] px-4 py-10 font-jakarta">
        <PublicStateCard
          icon={<Loader2 size={30} className="animate-spin" />}
          title="Loading Interview Schedule"
          message="Please wait while we verify your secure response link."
        />
      </main>
    );
  }

  if (phase === "readonly") {
    return <ReadOnlyResponse schedule={schedule} />;
  }

  if (phase === "success") {
    return <ReadOnlyResponse schedule={schedule} warning={warning} />;
  }

  if (["expired", "revoked", "invalid", "error"].includes(phase)) {
    const title =
      phase === "expired"
        ? "Response Link Expired"
        : phase === "revoked"
          ? "Response Link Replaced"
          : "Response Link Unavailable";

    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F4F7FB] px-4 py-10 font-jakarta">
        <PublicStateCard
          icon={<AlertCircle size={32} />}
          title={title}
          message={
            message ||
            "Please contact Talent Acquisition at careers@thesiblingssolutions.com."
          }
          tone="red"
        />
      </main>
    );
  }

  const isSubmitting = phase === "submitting";

  return (
    <main className="min-h-dvh bg-[#F4F7FB] px-4 py-8 font-jakarta sm:py-12">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-[#D9E2EC] bg-white shadow-xl">
        <header className="border-b border-[#E6ECF2] bg-white px-5 py-5 sm:px-8">
          <img
            src="/SiBSLogoNavy.png"
            alt="SiBS Contact Center"
            className="h-auto w-[260px] max-w-full"
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[0.78fr_1.22fr]">
          <section className="border-b border-[#E6ECF2] bg-[#F8FAFC] p-5 sm:p-8 lg:border-b-0 lg:border-r">
            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Interview Response
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Respond to Interview Schedule
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
              Accept the proposed schedule, choose a different date and time, or
              decline the interview. Your response becomes final after
              submission.
            </p>

            <div className="mt-6 space-y-3 rounded-2xl border border-[#D9E2EC] bg-white p-5">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Candidate
                </p>
                <p className="mt-1 text-base font-extrabold text-[#101828]">
                  {schedule?.candidateName}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Position / Account
                </p>
                <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                  {schedule?.roleName} · {schedule?.accountName}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Proposed Schedule
                </p>
                <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                  {formatDateOnly(schedule?.proposedDate)} at{" "}
                  {formatCandidateInterviewTime(schedule?.proposedTime)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#667085]">
                  Interview Type
                </p>
                <p className="mt-1 text-sm font-bold text-sibs-primary-1">
                  {schedule?.interviewType}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-700">
              <p>
                Current response deadline: {formatDateTime(schedule?.responseDeadline)}
              </p>
              <p className="mt-1">
                Follow-ups sent: {Number(schedule?.followUpCount || 0)} of 3.
                Saturdays, Sundays, and configured Philippine holidays are not
                counted as working days.
              </p>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  key: "accept",
                  label: "Accept",
                  description: "Use the proposed schedule",
                  icon: Check,
                },
                {
                  key: "reschedule",
                  label: "Reschedule",
                  description: "Choose another date and time",
                  icon: RotateCcw,
                },
                {
                  key: "decline",
                  label: "Decline",
                  description: "Do not continue with interview",
                  icon: XCircle,
                },
              ].map((option) => {
                const active = action === option.key;
                const Icon = option.icon;

                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setAction(option.key);
                      setMessage("");
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-sibs-primary-1 bg-blue-50 shadow-sm"
                        : "border-[#D9E2EC] bg-white hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC]"
                    } disabled:opacity-60`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active
                          ? "bg-sibs-primary-1 text-white"
                          : "bg-[#F2F4F7] text-sibs-primary-1"
                      }`}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="mt-3 block text-sm font-extrabold text-sibs-primary-1">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#667085]">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {action === "accept" && (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="flex items-center gap-2 text-sm font-extrabold text-emerald-700">
                  <CheckCircle2 size={18} />
                  Accept Proposed Interview Schedule
                </p>
                <p className="mt-2 text-sm font-bold text-[#344054]">
                  {formatDateOnly(schedule?.proposedDate)} at{" "}
                  {formatCandidateInterviewTime(schedule?.proposedTime)}
                </p>
              </div>
            )}

            {action === "reschedule" && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      setViewDate(
                        (previous) =>
                          new Date(
                            previous.getFullYear(),
                            previous.getMonth() - 1,
                            1,
                          ),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9E2EC] text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="text-center text-base font-extrabold text-sibs-primary-1">
                    {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </h2>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      setViewDate(
                        (previous) =>
                          new Date(
                            previous.getFullYear(),
                            previous.getMonth() + 1,
                            1,
                          ),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D9E2EC] text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1">
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="flex h-9 items-center justify-center text-xs font-extrabold text-[#667085]"
                    >
                      {label}
                    </div>
                  ))}

                  {calendarDays.map((item) => {
                    const selectable = isSelectableCandidateInterviewDate(
                      item.date,
                      today,
                      holidayDates,
                    );
                    const active =
                      selectedDateObject &&
                      isSameDate(item.date, selectedDateObject);
                    const weekend = [0, 6].includes(item.date.getDay());
                    const holiday = holidayDates.has(item.dateValue);

                    return (
                      <button
                        key={item.dateValue}
                        type="button"
                        disabled={!selectable || isSubmitting}
                        onClick={() => setSelectedDate(item.dateValue)}
                        title={
                          holiday
                            ? "Configured Philippine holiday"
                            : weekend
                              ? "Saturday and Sunday are unavailable"
                              : selectable
                                ? "Select interview date"
                                : "Past dates are unavailable"
                        }
                        className={`flex h-10 items-center justify-center rounded-xl text-sm font-extrabold transition ${
                          active
                            ? "bg-sibs-primary-1 text-white shadow-sm"
                            : selectable
                              ? item.isCurrentMonth
                                ? "text-[#344054] hover:bg-blue-50 hover:text-sibs-primary-1"
                                : "text-[#98A2B3] hover:bg-[#F8FAFC]"
                              : holiday
                                ? "cursor-not-allowed bg-amber-50 text-amber-300"
                                : weekend
                                  ? "cursor-not-allowed bg-slate-50 text-slate-300"
                                  : "cursor-not-allowed text-slate-300 opacity-50"
                        }`}
                      >
                        {item.dayNumber}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-2xl border border-[#D9E2EC] bg-[#F8FAFC] p-5">
                  <label className="flex items-center gap-2 text-sm font-extrabold text-sibs-primary-1">
                    <Clock3 size={17} />
                    Interview Time
                  </label>
                  <input
                    type="time"
                    min="10:00"
                    max="17:00"
                    step="60"
                    required
                    disabled={isSubmitting}
                    value={selectedTime}
                    onChange={(event) => setSelectedTime(event.target.value)}
                    className="mt-3 h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-extrabold text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:opacity-60"
                  />
                  <p className="mt-2 text-xs font-semibold text-[#667085]">
                    Available from 10:00 AM through 5:00 PM.
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                    New Interview Schedule
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                    {formatDateOnly(selectedDate)} at{" "}
                    {formatCandidateInterviewTime(selectedTime)}
                  </p>
                </div>
              </div>
            )}

            {action === "decline" && (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5">
                <label className="text-sm font-extrabold text-red-700">
                  Reason for declining (optional)
                </label>
                <textarea
                  rows={4}
                  disabled={isSubmitting}
                  value={declineReason}
                  onChange={(event) => setDeclineReason(event.target.value)}
                  placeholder="Share a reason when applicable."
                  className="mt-3 w-full resize-none rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-[#344054] outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:opacity-60"
                />
                <p className="mt-2 text-xs font-semibold leading-5 text-red-600">
                  Declining moves your application to Drop-off and the response
                  cannot be changed.
                </p>
              </div>
            )}

            {message && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !action}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : action === "decline" ? (
                <XCircle size={17} />
              ) : action === "reschedule" ? (
                <CalendarClock size={17} />
              ) : (
                <CalendarDays size={17} />
              )}
              {isSubmitting
                ? "Submitting Response..."
                : action === "decline"
                  ? "Confirm Decline"
                  : action === "reschedule"
                    ? "Confirm New Schedule"
                    : action === "accept"
                      ? "Confirm Acceptance"
                      : "Choose a Response"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
