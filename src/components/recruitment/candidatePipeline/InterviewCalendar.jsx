import React, { useEffect, useMemo, useState } from "react";
import {
  getAccount,
  getRoleTitle,
  hasInterviewSchedule,
} from "../../../lib/utils/candidatePipeline/candidatePipelineHelpers";
import {
  formatMonthYear,
  formatTime,
  getDateKey,
} from "../../../lib/utils/candidatePipeline/candidatePipelineFormatters";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const InterviewCalendar = ({ candidates, onViewCandidate }) => {
  const [calendarViewType, setCalendarViewType] = useState("Month");

  const scheduledCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => {
        if (candidate.currentStage !== "Interview Scheduled") return false;
        if (!hasInterviewSchedule(candidate)) return false;
        if (!candidate.interviewDate) return false;
        if (candidate.interviewStatus === "Cancelled") return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.interviewDate).getTime() -
          new Date(b.interviewDate).getTime(),
      );
  }, [candidates]);

  const initialCalendarDate = useMemo(() => {
    if (scheduledCandidates.length > 0) {
      return new Date(scheduledCandidates[0].interviewDate);
    }

    return new Date();
  }, [scheduledCandidates]);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(
      initialCalendarDate.getFullYear(),
      initialCalendarDate.getMonth(),
      1,
    ),
  );
  const [visibleWeekDate, setVisibleWeekDate] = useState(initialCalendarDate);

  useEffect(() => {
    setVisibleMonth(
      new Date(
        initialCalendarDate.getFullYear(),
        initialCalendarDate.getMonth(),
        1,
      ),
    );
    setVisibleWeekDate(initialCalendarDate);
  }, [initialCalendarDate]);

  const candidatesByDate = useMemo(() => {
    return scheduledCandidates.reduce((acc, candidate) => {
      const key = String(candidate.interviewDate).slice(0, 10);
      acc[key] = acc[key] ? [...acc[key], candidate] : [candidate];
      return acc;
    }, {});
  }, [scheduledCandidates]);

  const monthDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstGridDate = new Date(firstDay);
    firstGridDate.setDate(firstGridDate.getDate() - firstGridDate.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstGridDate);
      date.setDate(firstGridDate.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const weekDays = useMemo(() => {
    const start = new Date(visibleWeekDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [visibleWeekDate]);

  const listGroups = useMemo(() => {
    return scheduledCandidates.reduce((acc, candidate) => {
      const key = String(candidate.interviewDate).slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(candidate);
      return acc;
    }, {});
  }, [scheduledCandidates]);

  const activeRangeTitle = useMemo(() => {
    if (calendarViewType === "Week") {
      const firstDay = weekDays[0];
      const lastDay = weekDays[weekDays.length - 1];
      return `${firstDay.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      })} - ${lastDay.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    if (calendarViewType === "List") return "Upcoming Scheduled Interviews";

    return formatMonthYear(visibleMonth);
  }, [calendarViewType, visibleMonth, weekDays]);

  function handlePreviousCalendarRange() {
    if (calendarViewType === "Week") {
      setVisibleWeekDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() - 7);
        return next;
      });
      return;
    }

    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }

  function handleNextCalendarRange() {
    if (calendarViewType === "Week") {
      setVisibleWeekDate((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + 7);
        return next;
      });
      return;
    }

    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  function handleTodayCalendarRange() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setVisibleWeekDate(today);
  }

  function renderCandidateEvent(candidate, compact = false) {
    return (
      <button
        key={candidate.id}
        type="button"
        onClick={() => onViewCandidate(candidate)}
        className="w-full rounded-lg border border-cyan-100 bg-cyan-50 px-2 py-2 text-left text-xs font-semibold text-sibs-primary-1 transition hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-sm"
      >
        <p className="truncate font-bold">{candidate.name}</p>
        <p>{formatTime(candidate.interviewDate)}</p>
        {!compact && (
          <p>
            {candidate.interviewType === "Online" ? "Online" : "Face-to-face"}
          </p>
        )}
        {candidate.interviewType === "Online" &&
          candidate.onlineInterviewLink && (
            <div>
              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Interview Link:{" "}
              </p>
              <p
                title={candidate.onlineInterviewLink}
                className="truncate underline text-sibs-tertiary-5 hover:cursor-pointer hover:text-sibs-primary-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(candidate.onlineInterviewLink, "_blank");
                }}
              >
                {candidate.onlineInterviewLink}
              </p>
            </div>
          )}
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-[#D9E2EC] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-sibs-primary-1" />
            <h2 className="text-base font-extrabold text-[#101828]">
              Interview Calendar
            </h2>
          </div>
          <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
            {activeRangeTitle} · {scheduledCandidates.length} scheduled
            interview{scheduledCandidates.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] p-1">
            {["Month", "Week", "List"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCalendarViewType(type)}
                className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-extrabold transition ${
                  calendarViewType === type
                    ? "bg-sibs-primary-1 text-white shadow-sm"
                    : "text-sibs-primary-1 hover:bg-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {calendarViewType !== "List" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreviousCalendarRange}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                title={
                  calendarViewType === "Week"
                    ? "Previous Week"
                    : "Previous Month"
                }
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={handleTodayCalendarRange}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNextCalendarRange}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                title={calendarViewType === "Week" ? "Next Week" : "Next Month"}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </div>
      </div>

      {calendarViewType === "Month" && (
        <div className="overflow-x-auto">
          <div className="min-w-[1120px] overflow-hidden rounded-xl border border-[#E6ECF2]">
            <div className="grid grid-cols-7 border-b border-[#E6ECF2] bg-[#F8FAFC]">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="border-r border-[#E6ECF2] px-3 py-3 text-center text-xs font-bold text-[#174A7C] last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {monthDays.map((date) => {
                const dateKey = getDateKey(date);
                const dayCandidates = candidatesByDate[dateKey] || [];
                const isCurrentMonth =
                  date.getMonth() === visibleMonth.getMonth() &&
                  date.getFullYear() === visibleMonth.getFullYear();
                const isToday = dateKey === getDateKey(new Date());

                return (
                  <div
                    key={dateKey}
                    className={`min-h-[150px] border-r border-b border-[#E6ECF2] p-3 ${
                      isCurrentMonth ? "bg-white" : "bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? "bg-sibs-primary-1 text-white"
                            : isCurrentMonth
                              ? "text-[#101828]"
                              : "text-[#98A2B3]"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {dayCandidates.length > 0 && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {dayCandidates.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {dayCandidates
                        .slice(0, 3)
                        .map((candidate) => renderCandidateEvent(candidate))}

                      {dayCandidates.length > 3 && (
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-2 text-center text-xs font-bold text-gray-600">
                          +{dayCandidates.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {calendarViewType === "Week" && (
        <div className="overflow-x-auto">
          <div className="grid min-w-[980px] grid-cols-7 overflow-hidden rounded-xl border border-[#E6ECF2]">
            {weekDays.map((date) => {
              const dateKey = getDateKey(date);
              const dayCandidates = candidatesByDate[dateKey] || [];
              const isToday = dateKey === getDateKey(new Date());

              return (
                <div
                  key={dateKey}
                  className="min-h-[360px] border-r border-[#E6ECF2] bg-white p-3 last:border-r-0"
                >
                  <div className="mb-3 rounded-xl bg-[#F8FAFC] px-3 py-3 text-center">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174A7C]">
                      {date.toLocaleDateString("en-PH", { weekday: "short" })}
                    </p>
                    <p
                      className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${
                        isToday
                          ? "bg-sibs-primary-1 text-white"
                          : "text-[#101828]"
                      }`}
                    >
                      {date.getDate()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {dayCandidates.length > 0 ? (
                      dayCandidates.map((candidate) =>
                        renderCandidateEvent(candidate),
                      )
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#D6DEE8] bg-[#F8FAFC] px-3 py-6 text-center text-xs font-bold text-sibs-tertiary-5">
                        No interview
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {calendarViewType === "List" && (
        <div className="space-y-3">
          {Object.keys(listGroups).length > 0 ? (
            Object.keys(listGroups).map((dateKey) => (
              <div
                key={dateKey}
                className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4"
              >
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-extrabold text-sibs-primary-1">
                    {new Date(dateKey).toLocaleDateString("en-PH", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-[#475467]">
                    {listGroups[dateKey].length} interview
                    {listGroups[dateKey].length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {listGroups[dateKey].map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => onViewCandidate(candidate)}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#E6ECF2] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-100 hover:bg-cyan-50 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#101828]">
                          {candidate.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                          {getRoleTitle(candidate.roleAccount)} /{" "}
                          {getAccount(candidate.roleAccount)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-extrabold text-sibs-primary-1">
                          {formatTime(candidate.interviewDate)}
                        </p>
                        <p className="text-xs font-bold text-sibs-tertiary-5">
                          {candidate.interviewType}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-12 text-center text-sm font-bold text-gray-500">
              No scheduled interviews found.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default InterviewCalendar;
