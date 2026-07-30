import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
} from "lucide-react";

import {
  getPublicCandidateInterviewDate,
  submitPublicCandidateInterviewDate,
} from "../../../lib/axios/publicCandidateInterviewDate";
import {
  buildCandidateInterviewCalendarDays,
  CANDIDATE_INTERVIEW_MAX_TIME,
  CANDIDATE_INTERVIEW_MIN_TIME,
  formatCandidateInterviewTime,
  isSelectableCandidateInterviewDate,
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
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
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
  const date = parseCandidateInterviewDateValue(value);

  if (!date) return "—";

  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getFirstSelectableDate(todayDateValue) {
  const today =
    parseCandidateInterviewDateValue(todayDateValue) || new Date();
  const candidate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  while (!isSelectableCandidateInterviewDate(candidate, today)) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

function PublicStateCard({ icon, title, message, tone = "blue" }) {
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
    </div>
  );
}

export default function PublicInterviewDateSelectionPage() {
  const { token = "" } = useParams();
  const [phase, setPhase] = useState("loading");
  const [schedule, setSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
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

        const today =
          parseCandidateInterviewDateValue(data.today) || new Date();
        const proposedDate = parseCandidateInterviewDateValue(
          data.proposedDate,
        );
        const initialDate =
          proposedDate &&
          isSelectableCandidateInterviewDate(proposedDate, today)
            ? proposedDate
            : getFirstSelectableDate(data.today);
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
        setPhase("ready");
      } catch (error) {
        if (!active) return;

        setPhase(getErrorStatus(error));
        setMessage(
          getErrorMessage(
            error,
            "The interview scheduling link could not be loaded.",
          ),
        );
      }
    }

    void loadSchedule();

    return () => {
      active = false;
    };
  }, [token]);

  const today = useMemo(
    () =>
      parseCandidateInterviewDateValue(schedule?.today) || new Date(),
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

    if (
      !selectedDateObject ||
      !isSelectableCandidateInterviewDate(selectedDateObject, today)
    ) {
      setMessage(
        "Select today or a future interview date from Monday to Friday.",
      );
      return;
    }

    if (!timeValidation.valid) {
      setMessage(timeValidation.message);
      return;
    }

    setPhase("submitting");

    try {
      const response = await submitPublicCandidateInterviewDate(
        token,
        selectedDate,
        selectedTime,
      );

      setWarning(response?.notificationWarning || "");
      setSchedule((previous) => ({
        ...(previous || {}),
        selectedInterviewDate: response?.data?.selectedInterviewDate,
      }));
      setPhase("success");
    } catch (error) {
      const status = getErrorStatus(error);
      const errorMessage = getErrorMessage(
        error,
        "The interview schedule could not be saved.",
      );

      if (["expired", "used", "revoked", "invalid"].includes(status)) {
        setPhase(status);
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
          message="Please wait while we verify your secure scheduling link."
        />
      </main>
    );
  }

  if (phase === "success") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F4F7FB] px-4 py-10 font-jakarta">
        <div className="w-full max-w-xl">
          <PublicStateCard
            icon={<CheckCircle2 size={32} />}
            title="Interview Schedule Confirmed"
            message={`Your interview is scheduled for ${formatDateOnly(
              selectedDate,
            )} at ${formatCandidateInterviewTime(selectedTime)}. Talent Acquisition has been notified.`}
            tone="green"
          />
          {warning && (
            <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-700">
              {warning}
            </p>
          )}
        </div>
      </main>
    );
  }

  if (["expired", "used", "revoked", "invalid", "error"].includes(phase)) {
    const title =
      phase === "expired"
        ? "Scheduling Link Expired"
        : phase === "used"
          ? "Schedule Already Submitted"
          : phase === "revoked"
            ? "Scheduling Link Replaced"
            : "Scheduling Link Unavailable";

    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F4F7FB] px-4 py-10 font-jakarta">
        <PublicStateCard
          icon={<AlertCircle size={32} />}
          title={title}
          message={
            message ||
            "Please contact Talent Acquisition at careers@thesiblingssolutions.com."
          }
          tone={phase === "used" ? "amber" : "red"}
        />
      </main>
    );
  }

  const isSubmitting = phase === "submitting";

  return (
    <main className="min-h-dvh bg-[#F4F7FB] px-4 py-8 font-jakarta sm:py-12">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-[#D9E2EC] bg-white shadow-xl">
        <header className="border-b border-[#E6ECF2] bg-white px-5 py-5 sm:px-8">
          <img
            src="/SiBSLogoNavy.png"
            alt="SiBS Contact Center"
            className="h-auto w-[260px] max-w-full"
          />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="border-b border-[#E6ECF2] bg-[#F8FAFC] p-5 sm:p-8 lg:border-b-0 lg:border-r">
            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
              Candidate Scheduling
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
              Choose Interview Date and Time
            </h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#667085]">
              Select today or any future date from Monday to Friday. Available
              interview times are from 10:00 AM to 5:00 PM only.
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
                  TA Proposed Schedule
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

            <p className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-700">
              This secure link expires 30 days after it was sent and can be
              submitted only once.
            </p>
          </section>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8">
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
                );
                const active =
                  selectedDateObject &&
                  isSameDate(item.date, selectedDateObject);
                const weekend = [0, 6].includes(item.date.getDay());

                return (
                  <button
                    key={item.dateValue}
                    type="button"
                    disabled={!selectable || isSubmitting}
                    onClick={() => setSelectedDate(item.dateValue)}
                    title={
                      weekend
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
                Selected Interview Schedule
              </p>
              <p className="mt-1 text-sm font-extrabold text-sibs-primary-1">
                {formatDateOnly(selectedDate)} at{" "}
                {formatCandidateInterviewTime(selectedTime)}
              </p>
            </div>

            {message && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <CalendarDays size={17} />
              )}
              {isSubmitting ? "Saving Schedule..." : "Confirm Interview Schedule"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
