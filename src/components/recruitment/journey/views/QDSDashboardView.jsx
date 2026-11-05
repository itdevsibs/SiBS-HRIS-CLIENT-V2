/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useDemoAuth } from "@/lib/utils/journey/hrisRoleAdapter";
import TrainerCoachingDetailsModal from "../TrainerCoachingDetailsModal";
import {
  coachingForEmployee,
  coachingSummary,
  coachingStatus,
  evaluationFor,
  averageAvailable,
  displayPercent,
} from "../trainerCoachingUtils";
import { useJourney } from "../JourneyContext";
import { MetricCard, MetricGrid, ModalShell } from "@/components/ui";
import {
  CheckCircle2,
  ShieldCheck,
  Plus,
  Layers,
  X,
  GraduationCap,
  ClipboardCheck,
  Award,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Users,
} from "lucide-react";

function QDSDashboardView({ onSwitchModule }) {
  const { user } = useDemoAuth();
  const canManageQdsRequests = ["QDS", "Super Admin", "HR Admin", "HR", "TA"].includes(user?.role || "");
  const {
    journeys,
    phaseTrainingScores,
    assessmentGrades,
    assessments,
    evidence,
    qdsRequests,
    esepSessions,
    esepEvaluations,
    attendance,
    assignments,
    progress,
    addQDSRequest,
    updateQDSRequestStatus,
    simulatedCurrentDate,
    setSelectedJourney,
  } = useJourney();

  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState("All trainers");
  const [coachingEmployee, setCoachingEmployee] = useState(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [targetEmp, setTargetEmp] = useState(journeys[0]?.sibsEmployeeId || journeys[0]?.id || "SIBS-2901");
  const [requestType, setRequestType] = useState("Independent QA recheck");
  const [assignedTo, setAssignedTo] = useState("Elena Santos (Quality Lead)");
  const [requestNotes, setRequestNotes] = useState("");
  const [dueDate, setDueDate] = useState("2026-10-25");
  const [toastMessage, setToastMessage] = useState(null);

  const allTrainers = Array.from(new Set(journeys.map((j) => j.trainerName).filter(Boolean)));

  const dayOffset = (dateStr, numDays) => {
    const d = new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + numDays);
    return d.toISOString().slice(0, 10);
  };

  const getTraineePerf = (j) => {
    const ids = [j.sibsEmployeeId, j.id];
    const phaseScore = (phase) => {
      const stored = phaseTrainingScores.filter((s) => ids.includes(s.emp) && s.phase === phase);
      const scored = assessmentGrades.flatMap((g) => {
        const item = assessments.find((a) => a.id === g.assessmentId && a.phase === phase);
        return item && ids.includes(g.emp) ? [{ score: g.score, date: g.date }] : [];
      });
      return [...stored, ...scored].sort((a, b) => b.date.localeCompare(a.date))[0]?.score ?? null;
    };

    const trScore = averageAvailable([phaseScore("FST"), phaseScore("PST")]);
    const qaEvid = evidence.filter(
      (e) => ids.includes(e.emp) && e.type === "QDS / QA" && typeof e.score === "number" && Number.isFinite(e.score)
    );
    const qaScore = qaEvid.sort((a, b) => b.date.localeCompare(a.date))[0]?.score ?? j.day30?.nestingQaScore ?? null;
    const simScore = j.day60?.coreProductionScore ?? null;
    const composite =
      trScore !== null && qaScore !== null && simScore !== null
        ? Math.round(trScore * 0.35 + qaScore * 0.4 + simScore * 0.25)
        : null;

    const attRecords = attendance.filter((a) => ids.includes(a.emp));
    const dates = Array.from({ length: 14 }, (_, i) => dayOffset(simulatedCurrentDate, -i)).filter((date) => {
      if (!j.hireDate || date < j.hireDate) return false;
      return ![0, 6].includes(new Date(date + "T12:00:00Z").getUTCDay());
    });

    let present = 0,
      late = 0,
      absent = 0,
      excused = 0,
      missing = 0;
    dates.forEach((date) => {
      const status = attRecords.find((a) => a.date === date)?.status ?? "Unrecorded";
      if (status === "Present") present++;
      else if (status === "Late") late++;
      else if (status === "Absent") absent++;
      else if (status === "Excused") excused++;
      else missing++;
    });

    const recorded = present + late + absent + excused;
    const attRate = recorded ? Math.round(((present + late) / recorded) * 100) : null;

    return { trScore, qaScore, simScore, composite, attRate, absentCount: absent + excused, missingAttCount: missing };
  };

  const trainerSummaries = allTrainers.map((tName) => {
    const trainees = journeys.filter((j) => j.trainerName === tName);
    const perfs = trainees.map((j) => getTraineePerf(j));
    const meanComp = averageAvailable(perfs.map((p) => p.composite));
    const meanQA = averageAvailable(perfs.map((p) => p.qaScore));
    const meanTR = averageAvailable(perfs.map((p) => p.trScore));
    const highCount = perfs.filter((p) => p.composite !== null && p.composite >= 85).length;
    const supportCount = perfs.filter((p) => p.composite !== null && p.composite < 70).length;
    const attMean = averageAvailable(perfs.map((p) => p.attRate));
    const totalAbsences = perfs.reduce((a, p) => a + p.absentCount, 0);
    const totalMissing = perfs.reduce((a, p) => a + p.missingAttCount, 0);
    const pendingReqs = qdsRequests.filter((q) => q.trainer === tName && q.status !== "Closed").length;
    const gap = meanTR !== null && meanQA !== null ? meanTR - meanQA : null;

    return {
      tName,
      trainees,
      scoredCount: perfs.filter((p) => p.composite !== null).length,
      meanComp,
      meanQA,
      meanTR,
      gap,
      highCount,
      supportCount,
      attMean,
      totalAbsences,
      totalMissing,
      pendingReqs,
    };
  });

  const displayedTrainees =
    selectedTrainerFilter === "All trainers"
      ? journeys
      : journeys.filter((j) => j.trainerName === selectedTrainerFilter);

  const allPerfs = journeys.map((j) => getTraineePerf(j));
  const overallScored = allPerfs.filter((p) => p.composite !== null).length;
  const overallHigh = allPerfs.filter((p) => p.composite !== null && p.composite >= 85).length;
  const overallLow = allPerfs.filter((p) => p.composite !== null && p.composite < 70).length;

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!canManageQdsRequests) return;
    const targetJourney = journeys.find((j) => (j.sibsEmployeeId || j.id) === targetEmp);
    addQDSRequest({
      emp: targetEmp,
      trainer: targetJourney?.trainerName || "Maria Cruz",
      assignedTo,
      type: requestType,
      notes: requestNotes,
      due: dueDate,
    });
    setToastMessage("QDS follow-up request created successfully!");
    setShowNewRequestModal(false);
    setRequestNotes("");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-5 font-jakarta">
      {toastMessage && (
        <div className="sibs-tone-green-bg border sibs-tone-green-border sibs-tone-green-text text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 4 Standard HRIS Metric Cards */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Trainers Monitored"
          value={allTrainers.length}
          description="Active trainer assignments"
          tone="navy"
          icon={GraduationCap}
          delay={0}
        />
        <MetricCard
          label="Eligible Scorecards"
          value={overallScored}
          description={`of ${journeys.length} with recorded sources`}
          tone="orange"
          icon={ClipboardCheck}
          delay={50}
        />
        <MetricCard
          label="High Performance"
          value={overallScored ? `${Math.round((100 * overallHigh) / overallScored)}%` : "Not assessed"}
          description={`${overallHigh} of ${overallScored} scored ≥ 85%`}
          tone="green"
          icon={Award}
          delay={100}
        />
        <MetricCard
          label="Low Performance"
          value={overallScored ? `${Math.round((100 * overallLow) / overallScored)}%` : "Not assessed"}
          description={`${overallLow} of ${overallScored} scored < 70%`}
          tone={overallLow > 0 ? "red" : "amber"}
          icon={AlertTriangle}
          delay={150}
        />
      </MetricGrid>

      {/* Trainer Effectiveness Signals Section */}
      <div className="sibs-card bg-white p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sibs-border pb-3">
          <div>
            <h2 className="sibs-section-title font-extrabold text-sibs-navy">Trainer Effectiveness Signals</h2>
            <p className="sibs-section-subtitle text-sibs-muted">
              Independent QA performance, composite results, cohort size, and variation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">
              Trainer Filter:
            </span>
            <select
              value={selectedTrainerFilter}
              onChange={(e) => setSelectedTrainerFilter(e.target.value)}
              className="sibs-dashboard-input h-8 text-xs font-bold text-sibs-navy bg-sibs-surface border border-sibs-border rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-sibs-orange"
            >
              <option value="All trainers">All trainers</option>
              {allTrainers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Trainer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainerSummaries
            .filter((t) => selectedTrainerFilter === "All trainers" || t.tName === selectedTrainerFilter)
            .map((t) => (
              <div
                key={t.tName}
                className="p-4 rounded-xl border border-sibs-border bg-white hover:border-sibs-border-strong transition-all shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-sibs-border/60 pb-2">
                  <strong className="text-sm font-extrabold text-sibs-navy">{t.tName}</strong>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      t.supportCount
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {t.supportCount ? `${t.supportCount} trainee(s) need support` : "No low scores identified"}
                  </span>
                </div>

                <p className="sibs-text-micro text-sibs-muted font-medium">
                  {t.trainees.length} assigned trainees • {t.scoredCount} complete scorecards
                </p>

                {/* Attendance Strip */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-sibs-surface border border-sibs-border rounded-lg text-xs text-center">
                  <div>
                    <span className="sibs-text-micro text-sibs-muted font-bold block">Attendance rate</span>
                    <strong className="font-extrabold tabular-nums text-sibs-navy">{displayPercent(t.attMean)}</strong>
                  </div>
                  <div>
                    <span className="sibs-text-micro text-sibs-muted font-bold block">Absences</span>
                    <strong className="font-extrabold tabular-nums text-sibs-navy">{t.totalAbsences}</strong>
                  </div>
                  <div>
                    <span className="sibs-text-micro text-sibs-muted font-bold block">Unrecorded shifts</span>
                    <strong className="font-extrabold tabular-nums text-sibs-navy">{t.totalMissing}</strong>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 border border-sibs-border rounded-lg bg-sibs-surface/50">
                    <span className="text-[10px] text-sibs-muted font-semibold block">Average QA audit</span>
                    <strong className="text-sm font-black tabular-nums text-sibs-navy mt-0.5 block">
                      {displayPercent(t.meanQA)}
                    </strong>
                  </div>
                  <div className="p-2.5 border border-sibs-border rounded-lg bg-sibs-surface/50">
                    <span className="text-[10px] text-sibs-muted font-semibold block">Avg. composite</span>
                    <strong className="text-sm font-black tabular-nums text-sibs-navy mt-0.5 block">
                      {displayPercent(t.meanComp)}
                    </strong>
                  </div>
                  <div className="p-2.5 border border-sibs-border rounded-lg bg-sibs-surface/50">
                    <span className="text-[10px] text-sibs-muted font-semibold block">High / Needs support</span>
                    <strong className="text-sm font-black tabular-nums text-sibs-navy mt-0.5 block">
                      {t.highCount} / {t.supportCount}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-sibs-muted leading-relaxed bg-sibs-surface p-2.5 rounded-lg border border-sibs-border">
                  High performer rate:{" "}
                  {t.scoredCount ? Math.round((100 * t.highCount) / t.scoredCount) + "%" : "Not assessed"} • Trainer
                  score minus independent QA:{" "}
                  <strong
                    className={t.gap !== null && t.gap >= 10 ? "text-rose-600 font-black" : "text-sibs-navy font-bold"}
                  >
                    {t.gap === null ? "Insufficient data" : `${t.gap > 0 ? "+" : ""}${t.gap} pp`}
                  </strong>
                  . {t.gap !== null && t.gap >= 10 ? "A large gap warrants calibration review." : "Comparison requires two recorded sources."}
                </p>

                <div className="flex items-center justify-between text-xs font-semibold text-sibs-muted pt-1">
                  <span>
                    Composite trend: <strong className="text-sibs-navy font-bold">No comparable baseline</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      t.pendingReqs
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {t.pendingReqs} open follow-up(s)
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* QDS Trainee Audit Matrix Table */}
      <div className="sibs-card bg-white overflow-hidden">
        <div className="p-4 border-b border-sibs-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="sibs-section-title font-extrabold text-sibs-navy">QDS Trainee Audit Matrix</h2>
            <p className="sibs-section-subtitle text-sibs-muted">
              Cross-cohort trainee performance, QA variance, and quality audit details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="sibs-text-micro font-bold text-sibs-muted bg-sibs-surface px-2.5 py-1 rounded-md border border-sibs-border">
              {displayedTrainees.length} trainees shown
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sibs-surface text-sibs-muted font-extrabold text-[10px] uppercase tracking-wider border-b border-sibs-border">
              <tr>
                <th className="py-3 px-4">Trainee</th>
                <th className="py-3 px-3">Trainer</th>
                <th className="py-3 px-3">Trainer Score</th>
                <th className="py-3 px-3">Independent QA</th>
                <th className="py-3 px-3">Work Simulation</th>
                <th className="py-3 px-3">Composite</th>
                <th className="py-3 px-3">QA Variance</th>
                <th className="py-3 px-3">Attendance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-border/60 text-slate-700">
              {displayedTrainees.map((j) => {
                const perf = getTraineePerf(j);
                const gap = perf.trScore !== null && perf.qaScore !== null ? perf.trScore - perf.qaScore : null;
                const initials = j.fullName
                  ? j.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                  : "TR";
                return (
                  <tr key={j.id} className="hover:bg-sibs-surface/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-sibs-navy">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-sibs-navy/10 text-sibs-navy text-[11px] font-extrabold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-extrabold text-sibs-navy text-xs leading-tight">{j.fullName}</div>
                          <div className="sibs-text-micro text-sibs-muted font-normal mt-0.5">
                            {j.sibsEmployeeId || j.id} • {j.account}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{j.trainerName || "Unassigned"}</td>
                    <td className="py-3 px-3 font-extrabold text-sibs-navy tabular-nums">{displayPercent(perf.trScore)}</td>
                    <td className="py-3 px-3 font-extrabold text-sibs-navy tabular-nums">{displayPercent(perf.qaScore)}</td>
                    <td className="py-3 px-3 font-extrabold text-sibs-navy tabular-nums">{displayPercent(perf.simScore)}</td>
                    <td className="py-3 px-3 font-black text-sibs-navy tabular-nums">{displayPercent(perf.composite)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                          gap !== null && gap >= 10
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {gap === null ? "N/A" : `${gap > 0 ? "+" : ""}${gap} pp`}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 tabular-nums">{displayPercent(perf.attRate)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedJourney(j)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sibs-orange hover:text-[#e04f20] hover:underline cursor-pointer"
                      >
                        <span>View Record</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quality Follow-up Queue */}
      <div className="sibs-card bg-white p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-sibs-border pb-3">
          <div>
            <h2 className="sibs-section-title font-extrabold text-sibs-navy">Quality &amp; Coaching Follow-up Queue</h2>
            <p className="sibs-section-subtitle text-sibs-muted">
              Active QDS recheck requests and trainer coaching follow-ups.
            </p>
          </div>
          {canManageQdsRequests && (
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="sibs-btn-primary h-8 text-xs font-bold gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus size={14} />
              <span>Create Follow-up</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {qdsRequests.map((req) => {
            const empJ = journeys.find((j) => (j.sibsEmployeeId || j.id) === req.emp);
            return (
              <div
                key={req.id}
                className="p-3.5 rounded-xl border border-sibs-border bg-sibs-surface/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange bg-orange-50 border border-orange-100 rounded px-1.5 py-0.5">
                      {req.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        req.status === "Closed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-sibs-navy">
                    {empJ?.fullName || req.emp} — Trainer: {req.trainer}
                  </h3>
                  <p className="text-xs text-sibs-muted">{req.notes}</p>
                  <span className="sibs-text-micro text-slate-400 block mt-0.5">
                    Assigned: {req.assignedTo} • Due: {req.due}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canManageQdsRequests && req.status !== "Closed" && (
                    <button
                      onClick={() => {
                        updateQDSRequestStatus(req.id, "Closed", "Quality review complete.");
                        setToastMessage("Closed QDS request.");
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="sibs-btn-secondary h-7 text-xs font-bold"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Independent QDS visibility of recorded ESEP sessions. No QA scores are modified. */}
      <section className="sibs-card bg-white p-4 sm:p-5 space-y-4" aria-label="QDS coaching evidence">
        <div>
          <span className="sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-orange block">
            ESEP · DEVELOPMENT EVIDENCE
          </span>
          <h2 className="sibs-section-title font-extrabold text-sibs-navy">Trainee Coaching Results</h2>
          <p className="sibs-section-subtitle text-sibs-muted">
            Recorded sessions and follow-up outcomes; facilitator attribution remains with the actual Team Leader or QDS,
            not the assigned trainer.
          </p>
        </div>

        {(() => {
          const summary = coachingSummary(displayedTrainees, esepSessions, esepEvaluations, simulatedCurrentDate);
          return (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Trainees coached", `${summary.coached} / ${summary.total}`],
                ["Evaluated follow-ups", `${summary.evaluated} / ${summary.sessions.length}`],
                ["Numeric KPI comparisons", summary.measured],
                ["Overdue reviews", summary.overdue],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-sibs-border bg-sibs-surface p-3">
                  <div className="sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-muted">{label}</div>
                  <div className="mt-1 text-xl font-black tabular-nums text-sibs-navy">{value}</div>
                </div>
              ))}
            </div>
          );
        })()}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {displayedTrainees.map((j) => {
            const rows = coachingForEmployee(esepSessions, j);
            const evaluated = rows.filter((r) => evaluationFor(r, esepEvaluations)).length;
            const overdue = rows.filter((r) => coachingStatus(r, esepEvaluations, simulatedCurrentDate) === "Overdue").length;
            return (
              <div
                key={j.id}
                className="rounded-xl border border-sibs-border bg-white hover:border-sibs-border-strong p-3.5 transition-all shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs font-extrabold text-sibs-navy">{j.fullName}</strong>
                  <span className="sibs-text-micro text-sibs-muted font-medium">{rows.length} sessions</span>
                </div>
                <p className="text-[11px] text-sibs-muted">
                  {evaluated} evaluated · {overdue} overdue · {j.trainerName ?? "Trainer not assigned"}
                </p>
                <button
                  type="button"
                  onClick={() => setCoachingEmployee(j)}
                  className="sibs-btn-secondary w-full justify-center h-7 text-xs font-bold mt-2"
                >
                  <span>View coaching results →</span>
                </button>
              </div>
            );
          })}
        </div>

        <p className="sibs-text-micro text-sibs-muted leading-relaxed">
          These recorded coaching outcomes must not be averaged into QDS audit grades or used as automatic Trainer
          ratings.
        </p>
      </section>

      {coachingEmployee && (
        <TrainerCoachingDetailsModal
          employee={coachingEmployee}
          sessions={esepSessions}
          evaluations={esepEvaluations}
          asOf={simulatedCurrentDate}
          onClose={() => setCoachingEmployee(null)}
        />
      )}

      {/* New QDS Request Modal */}
      <ModalShell
        open={canManageQdsRequests && showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        variant="navy"
        maxWidth="max-w-lg"
        icon={ShieldCheck}
        title="Create Quality Follow-Up Request"
        subtitle="Escalate to Quality Lead for independent audit or calibration"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowNewRequestModal(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-qds-request-form"
              className="sibs-modal-btn-primary"
            >
              <span>Create Request</span>
            </button>
          </div>
        }
      >
        <form id="create-qds-request-form" onSubmit={handleCreateRequest} className="space-y-4 text-xs font-jakarta">
          <div>
            <label className="sibs-modal-field-label">Select Trainee</label>
            <select
              value={targetEmp}
              onChange={(e) => setTargetEmp(e.target.value)}
              className="sibs-modal-input"
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.sibsEmployeeId || j.id}>
                  {j.fullName} ({j.sibsEmployeeId || j.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="sibs-modal-field-label">Request Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="sibs-modal-input"
            >
              <option value="Independent QA recheck">Independent QA recheck</option>
              <option value="Trainer coaching review">Trainer coaching review</option>
              <option value="Targeted trainee support">Targeted trainee support</option>
            </select>
          </div>

          <div>
            <label className="sibs-modal-field-label">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="sibs-modal-input"
              required
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">Notes / Instructions</label>
            <textarea
              rows={3}
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="Specify audit focal points or calibration notes..."
              className="sibs-modal-textarea"
              required
            />
          </div>
        </form>
      </ModalShell>
    </div>
  );
}

export { QDSDashboardView as default };
