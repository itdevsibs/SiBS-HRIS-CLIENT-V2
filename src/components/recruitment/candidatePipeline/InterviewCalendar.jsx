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
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Video,
} from "lucide-react";

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
    const isOnline = candidate.interviewType === "Online";

    return (
      <button
        key={candidate.id}
        type="button"
        onClick={() => onViewCandidate(candidate)}
        className={`group/event w-full rounded-lg border px-2 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
          isOnline
            ? "border-[#B2DDFF] bg-[#F0F8FF] text-[#004EEB] hover:border-[#80C1FF] hover:bg-[#E0F2FE]"
            : "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708] hover:border-[#FEC84B] hover:bg-[#FEF0C7]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-extrabold text-[#042C51] 2xl:text-[10px]">
              {candidate.name}
            </p>
            <p className="mt-0.5 font-mono text-[8px] font-bold opacity-80 2xl:text-[9px]">
              {formatTime(candidate.interviewDate)}
            </p>
          </div>
          {!compact && (
            <span className="shrink-0 text-[8px] font-extrabold uppercase opacity-85">
              {isOnline ? "Online" : "On-site"}
            </span>
          )}
        </div>

        {!compact && isOnline && candidate.onlineInterviewLink && (
          <span
            role="link"
            tabIndex={0}
            title={candidate.onlineInterviewLink}
            className="mt-1.5 flex items-center gap-1 truncate text-[8px] font-extrabold text-[#FF5C28] underline decoration-[#FF5C28]/40 underline-offset-2 hover:opacity-80"
            onClick={(event) => {
              event.stopPropagation();
              window.open(candidate.onlineInterviewLink, "_blank");
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              window.open(candidate.onlineInterviewLink, "_blank");
            }}
          >
            <ExternalLink size={10} className="shrink-0" />
            <span className="truncate">Open interview link</span>
          </span>
        )}
      </button>
    );
  }

  return (
    <section className="sibs-page-card-in sibs-card overflow-hidden font-jakarta">
      <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FFEADF] bg-[#FFF2EB] text-[#FF5C28]">
              <CalendarDays size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="sibs-section-title">Scheduled Interview Calendar</h2>
              <p className="sibs-section-subtitle">
                {activeRangeTitle} · {scheduledCandidates.length} scheduled interview
                {scheduledCandidates.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-1">
              {["Month", "Week", "List"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCalendarViewType(type)}
                  className={`inline-flex h-8 items-center justify-center rounded-lg px-3.5 sibs-text-xs font-extrabold transition 2xl:h-9 2xl:px-4 ${
                    calendarViewType === type
                      ? "bg-[#FF5C28] text-white shadow-sm"
                      : "text-[#667085] hover:text-[#042C51]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {calendarViewType !== "List" && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePreviousCalendarRange}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
                  title={calendarViewType === "Week" ? "Previous Week" : "Previous Month"}
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleTodayCalendarRange}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white px-3 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={handleNextCalendarRange}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] transition hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
                  title={calendarViewType === "Week" ? "Next Week" : "Next Month"}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#F7F9FC] p-3 sm:p-4 2xl:p-5">
        {calendarViewType === "Month" && (
          <div className="overflow-x-auto">
            <div className="min-w-[980px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white 2xl:min-w-[1120px]">
              <div className="grid grid-cols-7 border-b border-[#E6ECF2] bg-[#F8FAFC]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="border-r border-[#E6ECF2] px-2 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-wider text-[#042C51] last:border-r-0 2xl:px-3 2xl:py-3 2xl:text-[10px]"
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
                      className={`min-h-[112px] border-r border-b border-[#E6ECF2] p-2 2xl:min-h-[145px] 2xl:p-3 ${
                        isCurrentMonth ? "bg-white" : "bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-extrabold 2xl:h-7 2xl:w-7 2xl:text-[10px] ${
                            isToday
                              ? "bg-[#FF5C28] text-white shadow-sm"
                              : isCurrentMonth
                                ? "text-[#042C51]"
                                : "text-[#98A2B3]"
                          }`}
                        >
                          {date.getDate()}
                        </span>

                        {dayCandidates.length > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF5C28] px-1.5 text-[8px] font-extrabold text-white shadow-sm">
                            {dayCandidates.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {dayCandidates
                          .slice(0, 3)
                          .map((candidate) => renderCandidateEvent(candidate, true))}

                        {dayCandidates.length > 3 && (
                          <div className="rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2 py-1.5 text-center text-[8px] font-extrabold text-[#667085]">
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
            <div className="grid min-w-[900px] grid-cols-7 overflow-hidden rounded-xl border border-[#D7DEE8] bg-white 2xl:min-w-[980px]">
              {weekDays.map((date) => {
                const dateKey = getDateKey(date);
                const dayCandidates = candidatesByDate[dateKey] || [];
                const isToday = dateKey === getDateKey(new Date());

                return (
                  <div
                    key={dateKey}
                    className="min-h-[330px] border-r border-[#E6ECF2] bg-white p-2.5 last:border-r-0 2xl:min-h-[360px] 2xl:p-3"
                  >
                    <div className="mb-3 rounded-xl bg-[#F8FAFC] px-2 py-2.5 text-center">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#042C51]">
                        {date.toLocaleDateString("en-PH", { weekday: "short" })}
                      </p>
                      <p
                        className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${
                          isToday ? "bg-[#FF5C28] text-white shadow-sm" : "text-[#042C51]"
                        }`}
                      >
                        {date.getDate()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {dayCandidates.length > 0 ? (
                        dayCandidates.map((candidate) => renderCandidateEvent(candidate))
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-3 py-6 text-center text-[9px] font-semibold text-[#98A2B3]">
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
                  className="rounded-xl border border-[#D7DEE8] bg-white p-3.5 2xl:p-4"
                >
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="sibs-text-xs font-extrabold text-[#042C51]">
                      {new Date(dateKey).toLocaleDateString("en-PH", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                    <span className="w-fit rounded-full border border-[#FFEADF] bg-[#FFF2EB] px-2.5 py-1 text-[9px] font-extrabold text-[#FF5C28]">
                      {listGroups[dateKey].length} interview
                      {listGroups[dateKey].length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:gap-3">
                    {listGroups[dateKey].map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => onViewCandidate(candidate)}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#FF5C28]/35 hover:bg-[#FFF9F6] hover:shadow-sm 2xl:p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate sibs-text-xs font-extrabold text-[#042C51]">
                            {candidate.name}
                          </p>
                          <p className="mt-1 truncate text-[9px] font-semibold text-[#667085] 2xl:text-[10px]">
                            {getRoleTitle(candidate.roleAccount)} / {getAccount(candidate.roleAccount)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="sibs-text-xs font-extrabold text-[#042C51]">
                            {formatTime(candidate.interviewDate)}
                          </p>
                          <p className="mt-1 flex items-center justify-end gap-1 text-[9px] font-semibold text-[#667085]">
                            {candidate.interviewType === "Online" && <Video size={11} />}
                            {candidate.interviewType}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="sibs-empty-panel">
                No scheduled interviews found.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default InterviewCalendar;
