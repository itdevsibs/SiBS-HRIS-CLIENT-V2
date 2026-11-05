import React, { useMemo } from "react";
import { GraduationCap, ArrowRight, Clock, Award } from "lucide-react";
import {
  coachingForEmployee,
  coachingSummary,
  coachingStatus,
  evaluationFor,
} from "@/components/recruitment/journey/trainerCoachingUtils";

export default function QDSEsepEvidence({
  trainees = [],
  sessions = [],
  evaluations = [],
  simulatedCurrentDate = "2026-10-25",
  onViewCoachingDetails,
  className = "",
}) {
  const summary = useMemo(() => {
    return coachingSummary(trainees, sessions, evaluations, simulatedCurrentDate);
  }, [trainees, sessions, evaluations, simulatedCurrentDate]);

  return (
    <section
      className={`sibs-card min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs p-4 sm:p-5 2xl:p-6 space-y-4 font-jakarta ${className}`.trim()}
      aria-label="QDS coaching evidence"
    >
      <div className="border-b border-sibs-border pb-3.5 2xl:pb-4">
        <span className="sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-orange block">
          ESEP · DEVELOPMENT EVIDENCE
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <GraduationCap size={18} className="text-sibs-navy shrink-0" />
          <h2 className="sibs-section-title font-extrabold text-sibs-navy">
            Trainee Coaching Results
          </h2>
        </div>
        <p className="sibs-section-subtitle text-sibs-muted mt-0.5">
          Recorded sessions and follow-up outcomes; facilitator attribution remains with the actual Team Leader or QDS, not the assigned trainer.
        </p>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 sm:p-3.5">
          <div className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Trainees Coached
          </div>
          <div className="mt-1 font-heading text-xl sm:text-2xl font-bold tabular-nums text-sibs-navy">
            {summary.coached} <span className="text-sm font-semibold text-sibs-muted">/ {summary.total}</span>
          </div>
        </div>

        <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 sm:p-3.5">
          <div className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Evaluated Follow-ups
          </div>
          <div className="mt-1 font-heading text-xl sm:text-2xl font-bold tabular-nums text-sibs-navy">
            {summary.evaluated} <span className="text-sm font-semibold text-sibs-muted">/ {summary.sessions.length}</span>
          </div>
        </div>

        <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 sm:p-3.5">
          <div className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Numeric KPI Comparisons
          </div>
          <div className="mt-1 font-heading text-xl sm:text-2xl font-bold tabular-nums text-sibs-navy">
            {summary.measured}
          </div>
        </div>

        <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 sm:p-3.5">
          <div className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
            Overdue Reviews
          </div>
          <div className={`mt-1 font-heading text-xl sm:text-2xl font-bold tabular-nums ${summary.overdue > 0 ? "text-rose-600" : "text-sibs-navy"}`}>
            {summary.overdue}
          </div>
        </div>
      </div>

      {/* Trainee Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trainees.map((trainee) => {
          const rows = coachingForEmployee(sessions, trainee);
          const evaluated = rows.filter((r) => evaluationFor(r, evaluations)).length;
          const overdue = rows.filter(
            (r) => coachingStatus(r, evaluations, simulatedCurrentDate) === "Overdue"
          ).length;

          return (
            <div
              key={trainee.id}
              className="rounded-xl border border-sibs-border bg-white hover:border-sibs-border-strong p-3.5 2xl:p-4 transition-all shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs font-extrabold text-sibs-navy truncate">
                    {trainee.fullName}
                  </strong>
                  <span className="sibs-text-micro text-sibs-muted font-bold shrink-0 bg-sibs-surface px-2 py-0.5 rounded-md border border-sibs-border">
                    {rows.length} {rows.length === 1 ? "session" : "sessions"}
                  </span>
                </div>
                <p className="text-[11px] text-sibs-muted mt-1 leading-normal">
                  <span className="font-semibold text-slate-700">{evaluated}</span> evaluated ·{" "}
                  <span className={overdue > 0 ? "text-rose-600 font-bold" : "text-slate-700 font-semibold"}>
                    {overdue} overdue
                  </span>{" "}
                  · {trainee.trainerName ?? "Trainer not assigned"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onViewCoachingDetails?.(trainee)}
                className="sibs-btn-secondary w-full justify-center h-7.5 sm:h-8 text-xs font-bold mt-2 gap-1.5 cursor-pointer"
                title={`View detailed coaching log for ${trainee.fullName}`}
              >
                <span>View coaching results</span>
                <ArrowRight size={13} className="text-sibs-orange" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Regulatory Footnote */}
      <p className="sibs-text-micro text-sibs-muted leading-relaxed pt-1">
        * Note: These recorded coaching outcomes are formative development records and must not be averaged into formal QDS audit grades or used as automatic Trainer ratings.
      </p>
    </section>
  );
}
