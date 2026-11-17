/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Minus,
  TrendingUp,
  X,
} from "lucide-react";
import { MetricCard, MetricGrid, ModalShell } from "@/components/ui";
import {
  coachingForEmployee,
  coachingStatus,
  evaluationFor,
  kpiComparison,
} from "./trainerCoachingUtils";
import { COACHING_QA_GROUPS } from "./coachingQAParameters";

function InfoField({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1">
      <span className="sibs-modal-field-label text-[9px] mb-0">{label}</span>
      <div className="sibs-text-xs font-semibold text-sibs-navy whitespace-pre-wrap break-words leading-relaxed">
        {value === undefined || value === null || value === "" ? "Not recorded" : value}
      </div>
    </div>
  );
}

function TrainerCoachingDetailsModal({
  employee,
  sessions = [],
  evaluations = [],
  asOf = "",
  onClose,
  initialSessionId = null,
}) {
  const records = coachingForEmployee(sessions, employee);
  const selectedSession = sessions.find((s) => s.id === (initialSessionId ?? null));
  const employeeRecordsWithSelected =
    selectedSession && !records.some((r) => r.id === selectedSession.id)
      ? [selectedSession, ...records]
      : records;
  const displayedRecords = employeeRecordsWithSelected;

  const [sessionId, setSessionId] = useState(
    initialSessionId ?? displayedRecords[0]?.id ?? null
  );

  useEffect(() => {
    if (initialSessionId !== undefined && initialSessionId !== null) {
      setSessionId(initialSessionId);
    }
  }, [initialSessionId]);

  const session =
    displayedRecords.find((s) => s.id === sessionId) ??
    sessions.find((s) => s.id === sessionId) ??
    displayedRecords[0] ??
    null;

  const evaluation = session ? evaluationFor(session, evaluations) : null;
  const comparison = kpiComparison(evaluation);
  const selectedParameters = new Set(session?.qaParameters ?? []);
  const hasQaDetails = Boolean(
    session &&
      (session.reasons?.includes("QA Score") ||
        session.qaCallCaseId ||
        session.qaLob ||
        selectedParameters.size)
  );
  const status = session ? coachingStatus(session, evaluations, asOf) : null;
  const recordedCount = displayedRecords.length;
  const evaluatedCount = displayedRecords.filter((s) => evaluationFor(s, evaluations)).length;
  const overdueCount = displayedRecords.filter(
    (s) => coachingStatus(s, evaluations, asOf) === "Overdue"
  ).length;

  if (!employee) return null;

  return (
    <ModalShell
      open={true}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-5xl 2xl:max-w-6xl"
      icon={Award}
      title={employee.fullName}
      badge={employee.sibsEmployeeId || employee.id}
      subtitle={`${employee.account || "Operations"} • Coaching forms and recorded follow-up evaluations`}
      bodyClassName="space-y-4 overscroll-contain bg-sibs-surface p-4 font-jakarta sm:space-y-5 sm:p-6"
      footer={
        <button type="button" onClick={onClose} className="sibs-modal-btn-secondary">
          Close
        </button>
      }
    >
      {/* 1. Summary Metric Strip */}
      <MetricGrid columns={3}>
        <MetricCard
          label="Recorded Sessions"
          value={recordedCount}
          description="Documented GROW logs"
          tone="navy"
          icon={FileText}
          delay={0}
        />
        <MetricCard
          label="Evaluated Follow-ups"
          value={evaluatedCount}
          description="Completed outcome reviews"
          tone="green"
          icon={CheckCircle2}
          delay={50}
        />
        <MetricCard
          label="Overdue Follow-ups"
          value={overdueCount}
          description={overdueCount === 0 ? "Zero pending overdue" : `${overdueCount} past due date`}
          tone={overdueCount > 0 ? "red" : "amber"}
          icon={AlertTriangle}
          delay={100}
        />
      </MetricGrid>

      {/* 2. Main Content Split View */}
      {!session ? (
        <div className="sibs-card rounded-2xl border border-dashed border-sibs-border bg-white p-10 text-center text-xs text-sibs-muted">
          No coaching sessions have been recorded for this employee.
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)] items-start">
          {/* Left Column: Coaching Session History */}
          <aside
            aria-label="Coaching session history"
            className="sibs-card min-w-0 space-y-3 p-4"
          >
            <h3 className="sibs-modal-section-title flex items-center gap-2 border-b border-sibs-border pb-3">
              <Clock size={16} aria-hidden="true" className="shrink-0 text-sibs-orange" />
              Coaching Session History
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {displayedRecords.map((s) => {
                const isSelected = s.id === session.id;
                const sStatus = coachingStatus(s, evaluations, asOf);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSessionId(s.id)}
                    aria-pressed={isSelected}
                    className={`min-w-0 space-y-1.5 break-words rounded-xl border border-sibs-border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-orange ${
                      isSelected
                        ? "border-l-4 border-l-sibs-orange bg-sibs-cream-light"
                        : "bg-sibs-surface hover:bg-white"
                    }`}
                  >
                    <span className="block text-xs font-bold text-sibs-navy">{s.type}</span>
                    <span className="block text-[11px] text-sibs-muted font-medium">
                      {s.date} • ESEP-{s.id}
                    </span>
                    <span className="block text-[11px] text-sibs-navy/80 font-semibold">
                      {s.facilitator}
                    </span>
                    <span
                      className={
                        sStatus === "Evaluated"
                          ? "sibs-badge-success mt-1"
                          : sStatus === "Overdue"
                            ? "sibs-badge-danger mt-1"
                            : "sibs-badge-warning mt-1"
                      }
                    >
                      {sStatus === "Evaluated" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      <span>{sStatus}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Column: Completed Coaching Form Card */}
          <article className="min-w-0 space-y-4">
            {/* Form Header */}
            <header className="sibs-card flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0 break-words">
                <span className="sibs-text-micro font-extrabold text-sibs-orange uppercase tracking-wider block">
                  ESEP-{session.id} • COMPLETED COACHING FORM
                </span>
                <h3 className="sibs-modal-title text-sibs-navy mt-1">
                  {session.type}
                </h3>
                <p className="sibs-modal-subtitle text-sibs-muted mt-0.5">
                  {session.date} • Coach: <strong className="text-sibs-navy">{session.facilitator}</strong> ({session.coachDesignation ?? session.facilitatorRole})
                </p>
              </div>
              <span
                className={
                  status === "Evaluated"
                    ? "sibs-badge-success"
                    : status === "Overdue"
                      ? "sibs-badge-danger"
                      : "sibs-badge-warning"
                }
              >
                {status === "Evaluated" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                <span>{status}</span>
              </span>
            </header>

            {/* Section 1: COACHING INFORMATION */}
            <section className="sibs-card space-y-3 p-4 sm:p-5">
              <h4 className="sibs-modal-section-title border-b border-sibs-border pb-3">
                Coaching Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <InfoField label="Coach's Name (Full Name)" value={session.facilitator} />
                <InfoField
                  label="Coach's Designation"
                  value={session.coachDesignation ?? session.facilitatorRole}
                />
                <InfoField label="Agent / Coachee's Name" value={employee.fullName} />
                <InfoField
                  label="Immediate Supervisor"
                  value={session.coacheeSupervisor ?? session.facilitator}
                />
                <InfoField label="Task Order" value={session.taskOrder ?? "TO04 PAC"} />
                <InfoField label="Coaching Date" value={session.date} />
                <InfoField label="Audit Week #" value={session.auditWeek ?? "Week 2"} />
                <div className="min-w-0 rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1.5">
                  <span className="sibs-modal-field-label text-[9px] mb-0">Reason For Coaching</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(session.reasons && session.reasons.length > 0
                      ? session.reasons
                      : ["QA Score", "Average Handle Time", "Attendance - Tardiness"]
                    ).map((reason, rIdx) => (
                      <span
                        key={rIdx}
                        className="inline-flex items-center rounded-lg border border-sibs-border bg-white px-2.5 py-0.5 text-[10px] font-bold text-sibs-navy shadow-2xs"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: QA SCORE DETAILS */}
            {hasQaDetails && (
              <section className="sibs-card space-y-3 p-4 sm:p-5">
                <h4 className="sibs-modal-section-title border-b border-sibs-border pb-3">
                  QA Score Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <InfoField label="Call / Case ID" value={session.qaCallCaseId ?? "PAC-24187"} />
                  <InfoField label="Line of Business (LOB)" value={session.qaLob ?? "Call"} />
                </div>
                <p className="sibs-text-xs text-sibs-muted">
                  {selectedParameters.size} of 23 QA parameters selected in the coaching record. These selections do not replace an independent QA audit score.
                </p>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  {COACHING_QA_GROUPS.map((group) => (
                    <div
                      key={group.key}
                      className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-2xs"
                    >
                      <div className="bg-sibs-surface px-3 py-2 text-xs font-bold text-sibs-navy border-b border-sibs-border">
                        {group.title} ({group.items.filter((i) => selectedParameters.has(i)).length}/{group.items.length})
                      </div>
                      <div className="space-y-2 p-3">
                        {group.items.map((item) => (
                          <div
                            key={item}
                            className="flex items-start gap-2 text-[11px] leading-snug text-sibs-navy"
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                                selectedParameters.has(item)
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold"
                                  : "border-sibs-border text-sibs-muted/50"
                              }`}
                            >
                              {selectedParameters.has(item) ? <Check size={10} /> : <Minus size={10} />}
                            </span>
                            <span className={selectedParameters.has(item) ? "font-bold text-sibs-navy" : "text-sibs-muted"}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section 3: GROW COACHING RECORD */}
            <section className="sibs-card space-y-3 p-4 sm:p-5">
              <h4 className="sibs-modal-section-title border-b border-sibs-border pb-3">
                GROW Framework Breakdown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1">
                  <span className="sibs-text-micro font-extrabold text-sibs-orange uppercase tracking-wider block">
                    G • Goal
                  </span>
                  <div className="sibs-text-xs font-semibold text-sibs-navy leading-relaxed">
                    {session.goal ?? "Not recorded"}
                  </div>
                </div>
                <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1">
                  <span className="sibs-text-micro font-extrabold text-sibs-orange uppercase tracking-wider block">
                    R • Reality
                  </span>
                  <div className="sibs-text-xs font-semibold text-sibs-navy leading-relaxed">
                    {session.reality ?? "Not recorded"}
                  </div>
                </div>
                <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1">
                  <span className="sibs-text-micro font-extrabold text-sibs-orange uppercase tracking-wider block">
                    O • Options
                  </span>
                  <div className="sibs-text-xs font-semibold text-sibs-navy leading-relaxed">
                    {session.options ?? "Not recorded"}
                  </div>
                </div>
                <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3 space-y-1">
                  <span className="sibs-text-micro font-extrabold text-sibs-orange uppercase tracking-wider block">
                    W • Will
                  </span>
                  <div className="sibs-text-xs font-semibold text-sibs-navy leading-relaxed">
                    {session.will ?? "Not recorded"}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: ACTION PLAN & COMMITMENT */}
            <section className="sibs-card space-y-3 p-4 sm:p-5">
              <h4 className="sibs-modal-section-title border-b border-sibs-border pb-3">
                Coaching Overview, Action Plan & Commitment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <InfoField label="Overview" value={session.overview ?? "Not recorded"} />
                </div>
                <InfoField label="Proposed Action Plan" value={session.actionPlan ?? "Not recorded"} />
                <InfoField label="Coachee Commitment" value={session.commitment ?? "Not recorded"} />
                <InfoField
                  label="Trigger / Evidence Source"
                  value={session.source ?? "Routine TL one-to-one"}
                />
                <InfoField label="Follow-up Due Date" value={session.due ?? "Pending"} />
              </div>
            </section>

            {/* Section 5: COACHING EFFECTIVENESS / FOLLOW-UP */}
            <section className="sibs-card space-y-3 p-4 sm:p-5">
              <h4 className="sibs-modal-section-title border-b border-sibs-border pb-3">
                Coaching Effectiveness & Follow-up Evaluation
              </h4>
              {evaluation ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs leading-relaxed text-sibs-navy space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <strong className="text-emerald-950 font-extrabold">
                        Evaluated {evaluation.date}
                      </strong>
                      <span className="sibs-badge-success">
                        Effective
                      </span>
                    </div>
                    <p className="text-emerald-900 font-medium">{evaluation.notes}</p>
                    <p className="sibs-text-micro text-sibs-muted pt-0.5">
                      Reviewed by <strong className="text-sibs-navy">{evaluation.owner}</strong> • Evidence: {evaluation.source}
                    </p>
                  </div>

                  {comparison && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3">
                        <span className="sibs-text-micro font-bold uppercase text-sibs-muted block mb-0.5">
                          Before
                        </span>
                        <div className="text-lg font-black text-sibs-navy">
                          {comparison.before}{evaluation.unit ?? ""}
                        </div>
                      </div>
                      <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3">
                        <span className="sibs-text-micro font-bold uppercase text-sibs-muted block mb-0.5">
                          After
                        </span>
                        <div className="text-lg font-black text-sibs-navy">
                          {comparison.after}{evaluation.unit ?? ""}
                        </div>
                      </div>
                      <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3">
                        <span className="sibs-text-micro font-bold uppercase text-sibs-muted block mb-0.5">
                          Recorded Lift
                        </span>
                        <div className="text-lg font-black text-emerald-600">
                          {comparison.differenceLabel}{evaluation.unit ?? ""}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-center justify-between">
                  <span>No follow-up evaluation has been recorded yet. Pending does not mean unsuccessful.</span>
                  <span className="sibs-badge-warning">
                    Pending Evaluation
                  </span>
                </div>
              )}
            </section>

            <p className="border-t border-sibs-border pt-3 sibs-text-micro leading-relaxed text-sibs-muted">
              Official SiBS HRIS Employee Coaching Record. Outcomes are integrated directly into employee developmental tracking and performance milestones.
            </p>
          </article>
        </div>
      )}
    </ModalShell>
  );
}

export default TrainerCoachingDetailsModal;
