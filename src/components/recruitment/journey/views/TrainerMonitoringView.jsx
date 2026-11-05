import QdsRequestModal from "../QdsRequestModal";
import { validateQdsRequest, validateAssessmentGrade } from "@/lib/utils/journey/trainerMonitoringValidation";
/* eslint-disable no-unused-vars */
import { useDemoAuth } from "@/lib/utils/journey/hrisRoleAdapter";
import { ModalShell, SearchInput, SelectDropdown, TableEmptyRow } from "@/components/ui";
import { useState, useMemo, useCallback, useRef } from "react";
import TrainerCoachingDetailsModal from "../TrainerCoachingDetailsModal";
import {
  averageAvailable,
  coachingForEmployee,
  coachingStatus,
  coachingSummary,
  computeTraineePerformance,
  displayPercent,
  evaluationFor,
  kpiComparison,
} from "../trainerCoachingUtils";
import { useJourney } from "../JourneyContext";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Send,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";

export default function TrainerMonitoringView({ onSwitchModule }) {
  const { user } = useDemoAuth();
  const isAssignedTrainer = user?.role === "Trainer";
  const {
    journeys = [],
    assignments = [],
    progress = [],
    assessments = [],
    assessmentGrades = [],
    phaseTrainingScores = [],
    attendance = [],
    evidence = [],
    qdsRequests = [],
    esepSessions = [],
    esepEvaluations = [],
    saveAssessmentGrade,
    addQDSRequest,
    updateQDSRequestStatus,
    simulatedCurrentDate = "",
    setSelectedJourney,
  } = useJourney();

  const [formError, setFormError] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState("Maria Cruz");
  const [riskFilter, setRiskFilter] = useState("all");
  const [coachingEmployee, setCoachingEmployee] = useState(null);
  const [showGradingWorkspace, setShowGradingWorkspace] = useState(false);
  const [activeTraineeId, setActiveTraineeId] = useState(
    journeys[0]?.sibsEmployeeId || journeys[0]?.id || "SIBS-2901"
  );
  const [traineeSearch, setTraineeSearch] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(assessments[0]?.id || 8101);
  const [enteredScore, setEnteredScore] = useState(85);
  const [showQdsModal, setShowQdsModal] = useState(false);
  const [qdsTargetEmp, setQdsTargetEmp] = useState("");
  const [qdsType, setQdsType] = useState("Trainer coaching review");
  const [qdsNotes, setQdsNotes] = useState("");
  const [qdsDue, setQdsDue] = useState("2026-10-25");
  const [toastMessage, setToastMessage] = useState(null);

  const cohortTableRef = useRef(null);

  const trainerNames = Array.from(new Set(journeys.map((j) => j.trainerName).filter(Boolean))).filter(
    (name) => !isAssignedTrainer || name === user?.trainerName || name.toLowerCase() === user?.name?.toLowerCase()
  );

  const activeTrainer = trainerNames.includes(selectedTrainer)
    ? selectedTrainer
    : trainerNames[0] || (isAssignedTrainer ? "Unassigned Trainer" : "Maria Cruz");

  const contextData = useMemo(
    () => ({
      phaseTrainingScores,
      assessmentGrades,
      assessments,
      evidence,
      attendance,
      assignments,
      progress,
      simulatedCurrentDate,
    }),
    [
      phaseTrainingScores,
      assessmentGrades,
      assessments,
      evidence,
      attendance,
      assignments,
      progress,
      simulatedCurrentDate,
    ]
  );

  const getTraineePerf = useCallback(
    (j) => computeTraineePerformance(j, contextData),
    [contextData]
  );

  const scoreCategory = (val) => {
    if (val === null || val === undefined)
      return { label: "Insufficient data", badgeClass: "sibs-badge-neutral", tone: "sibs-badge-neutral" };
    if (val >= 85) return { label: "High", badgeClass: "sibs-badge-success", tone: "sibs-badge-success" };
    if (val >= 70) return { label: "Developing", badgeClass: "sibs-badge-warning", tone: "sibs-badge-warning" };
    return { label: "Needs support", badgeClass: "sibs-badge-danger", tone: "sibs-badge-danger" };
  };

  const trainerSummaries = trainerNames.map((tName) => {
    const tSummary = journeys.filter((j) => j.trainerName === tName);
    const tPerfs = tSummary.map((j) => getTraineePerf(j));
    const meanComp = averageAvailable(tPerfs.map((p) => p.composite));
    const meanQA = averageAvailable(tPerfs.map((p) => p.qaScore));
    const highCount = tPerfs.filter((p) => p.composite !== null && p.composite >= 85).length;
    const supportCount = tPerfs.filter((p) => p.composite !== null && p.composite < 70).length;
    const attMean = averageAvailable(tPerfs.map((p) => p.attRate));
    const pendingReqs = qdsRequests.filter((q) => q.trainer === tName && q.status !== "Closed").length;
    const coachInfo = coachingSummary(tSummary, esepSessions, esepEvaluations, simulatedCurrentDate);
    const accounts = Array.from(new Set(tSummary.map((j) => j.account).filter(Boolean))).join(", ") || "General Operations";

    return {
      tName,
      tSummary,
      accounts,
      meanComp,
      meanQA,
      highCount,
      supportCount,
      attMean,
      pendingReqs,
      coachInfo,
    };
  });

  const cohortTrainees = journeys.filter((j) => j.trainerName === activeTrainer);

  const activeTrainee =
    cohortTrainees.find((j) => (j.sibsEmployeeId || j.id) === activeTraineeId) || cohortTrainees[0];

  const displayedTrainees = cohortTrainees.filter((j) => {
    const perf = getTraineePerf(j);
    const matchesSearch =
      !traineeSearch.trim() ||
      j.fullName.toLowerCase().includes(traineeSearch.toLowerCase()) ||
      (j.sibsEmployeeId || j.id || "").toLowerCase().includes(traineeSearch.toLowerCase()) ||
      (j.account || "").toLowerCase().includes(traineeSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (riskFilter === "high") return perf.composite !== null && perf.composite >= 85;
    if (riskFilter === "developing") return perf.composite !== null && perf.composite >= 70 && perf.composite < 85;
    if (riskFilter === "support") return perf.composite !== null && perf.composite < 70;
    if (riskFilter === "missing") return perf.composite === null;
    return true;
  });

  const handleSelectTrainerRow = (tName) => {
    setSelectedTrainer(tName);
    const firstTrainee = journeys.find((j) => j.trainerName === tName);
    if (firstTrainee) setActiveTraineeId(firstTrainee.sibsEmployeeId || firstTrainee.id);
    if (cohortTableRef.current) {
      cohortTableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    const error = validateAssessmentGrade({ trainees: cohortTrainees, target: activeTraineeId, assessments, assessmentId: selectedAssessmentId, score: enteredScore });
    setFormError(error);
    if (!isAssignedTrainer || error) return;
    saveAssessmentGrade({
      assessmentId: selectedAssessmentId,
      emp: activeTraineeId,
      score: Number(enteredScore),
      date: simulatedCurrentDate,
      grader: activeTrainer,
    });
    setToastMessage(`Saved assessment grade (${enteredScore}%) successfully!`);
    setShowGradingWorkspace(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateQdsRequest = (e) => {
    e.preventDefault();
    const error = validateQdsRequest({ trainees: cohortTrainees, target: qdsTargetEmp, type: qdsType, notes: qdsNotes, due: qdsDue });
    setFormError(error);
    if (error) return;
    addQDSRequest({
      emp: qdsTargetEmp || cohortTrainees[0]?.sibsEmployeeId || cohortTrainees[0]?.id || "SIBS-2901",
      trainer: activeTrainer,
      assignedTo: "Elena Santos (Quality Lead)",
      type: qdsType,
      notes: qdsNotes,
      due: qdsDue,
    });
    setToastMessage("QDS follow-up request submitted successfully!");
    setShowQdsModal(false);
    setQdsNotes("");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const trainerQdsFeedback = qdsRequests.filter((q) => q.trainer === activeTrainer);

  return (
    <div className="space-y-6 font-jakarta">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[3000] sibs-toast-in bg-sibs-navy text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl border border-sibs-orange flex items-center gap-2">
          <Check className="w-4 h-4 text-sibs-orange" />
          <span>{toastMessage}</span>
        </div>
      )}


      {/* TABLE 1: TRAINER DIRECTORY MASTER TABLE */}
      <div className="sibs-card bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-sibs-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="sibs-section-title font-extrabold text-sibs-navy">Trainer Directory &amp; Cohort Overview</h2>
            <p className="sibs-section-subtitle text-sibs-muted">
              Select any trainer to inspect their supervised cohort progression, 35/40/25% composite matrix, and quality calibrations.
            </p>
          </div>
          <span className="sibs-badge-neutral font-bold">
            {trainerSummaries.length} Trainers Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sibs-data-table-head border-b border-sibs-border bg-sibs-surface">
              <tr className="sibs-data-table-head-row">
                <th scope="col" className="sibs-data-table-th text-left py-3 px-4">Trainer</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Assigned Cohort</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">Trainees</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Avg. Composite</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Independent QA</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Attendance</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Cohort Distribution</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Coaching Coverage</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">QDS Tickets</th>
                <th scope="col" className="sibs-data-table-th text-right py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-border/60 text-sibs-navy">
              {trainerSummaries.map((t) => {
                const isActive = t.tName === activeTrainer;
                const initials = t.tName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("");

                return (
                  <tr
                    key={t.tName}
                    onClick={() => handleSelectTrainerRow(t.tName)}
                    className={`transition-colors cursor-pointer ${
                      isActive ? "bg-sibs-orange/5 border-l-4 border-l-sibs-orange" : "hover:bg-sibs-surface/60"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-sibs-navy text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <div>
                          <div className="font-extrabold text-sibs-navy text-xs leading-tight">{t.tName}</div>
                          <div className="sibs-text-micro text-sibs-muted font-medium mt-0.5">L&amp;D Operations</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-sibs-navy text-xs">{t.accounts}</td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="sibs-badge-info">
                        {t.tSummary.length} Trainees
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <div className="font-bold tabular-nums text-sibs-navy text-xs">
                          {displayPercent(t.meanComp)}
                        </div>
                        {t.meanComp !== null && t.meanComp !== undefined ? (
                          <div className="w-24 h-1.5 bg-sibs-surface rounded-full overflow-hidden border border-sibs-border">
                            <div
                              className="h-full bg-gradient-to-r from-sibs-navy to-sibs-orange rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(0, Math.min(100, t.meanComp))}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-bold tabular-nums text-sibs-navy text-xs">
                      {displayPercent(t.meanQA)}
                    </td>

                    <td className="py-3.5 px-3 font-bold tabular-nums text-sibs-navy text-xs">
                      {displayPercent(t.attMean)}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="sibs-badge-success">
                          {t.highCount} High
                        </span>
                        <span
                          className={
                            t.supportCount
                              ? "sibs-badge-danger"
                              : "sibs-badge-neutral"
                          }
                        >
                          {t.supportCount} Support
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-xs">
                      <span className="font-bold text-sibs-navy">
                        {t.coachInfo.coached} / {t.coachInfo.total} coached
                      </span>
                      {t.coachInfo.overdue > 0 && (
                        <span className="block text-[10px] font-extrabold text-[#E74C3C]">
                          {t.coachInfo.overdue} overdue review(s)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={
                          t.pendingReqs
                            ? "sibs-badge-warning"
                            : "sibs-badge-neutral"
                        }
                      >
                        {t.pendingReqs} Open
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTrainerRow(t.tName);
                        }}
                        className={
                          isActive
                            ? "sibs-btn-primary h-8 px-3 text-xs"
                            : "sibs-btn-secondary h-8 px-3 text-xs"
                        }
                      >
                        <span>{isActive ? "Inspecting" : "Inspect Cohort"}</span>
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

      {/* TABLE 2: COHORT TRAINEE AUDIT MATRIX TABLE */}
      <div ref={cohortTableRef} className="sibs-card bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-sibs-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="sibs-kicker text-sibs-orange">
                ACTIVE COHORT AUDIT MATRIX
              </span>
              <span className="sibs-badge-neutral font-bold">
                {activeTrainer}
              </span>
            </div>
            <h2 className="sibs-section-title font-extrabold text-sibs-navy mt-0.5">
              Supervised Trainees for {activeTrainer}
            </h2>
            <p className="sibs-section-subtitle text-sibs-muted">
              Individual trainee evaluation across Fundamental Skills Training, Product Specific Training, QA variance, and attendance reliability.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-56">
              <SearchInput
                value={traineeSearch}
                onChange={(val) => setTraineeSearch(val)}
                onClear={() => setTraineeSearch("")}
                placeholder="Search trainee..."
                aria-label="Search supervised trainees"
              />
            </div>

            <div className="w-52">
              <SelectDropdown
                label="Risk Filter"
                hideLabel
                value={riskFilter}
                onChange={(val) => setRiskFilter(val)}
                options={[
                  { value: "all", label: `All trainees (${cohortTrainees.length})` },
                  { value: "high", label: "High (85%+)" },
                  { value: "developing", label: "Developing (70–84%)" },
                  { value: "support", label: "Needs support (<70%)" },
                  { value: "missing", label: "Insufficient score data" },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sibs-data-table-head border-b border-sibs-border bg-sibs-surface">
              <tr className="sibs-data-table-head-row">
                <th scope="col" className="sibs-data-table-th text-left py-3 px-4">Trainee</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">FST Score</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">PST Score</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">Trainer Avg (35%)</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">QA Audit (40%)</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">Work Sim (25%)</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Composite Score</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">Attendance</th>
                <th scope="col" className="sibs-data-table-th text-center py-3 px-3">Verified Learning</th>
                <th scope="col" className="sibs-data-table-th text-left py-3 px-3">ESEP Coaching</th>
                <th scope="col" className="sibs-data-table-th text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sibs-border/60 text-sibs-navy">
              {displayedTrainees.length === 0 ? (
                <TableEmptyRow
                  colSpan={11}
                  message={`No trainees match the search filter for ${activeTrainer}.`}
                />
              ) : (
                displayedTrainees.map((j) => {
                  const perf = getTraineePerf(j);
                  const cat = scoreCategory(perf.composite);
                  const coaching = coachingForEmployee(esepSessions, j);
                  const evaluated = coaching.filter((row) => evaluationFor(row, esepEvaluations));
                  const latestReviewed = coaching.find((r) => evaluationFor(r, esepEvaluations));
                  const outcome = latestReviewed ? evaluationFor(latestReviewed, esepEvaluations) : null;
                  const comparison = kpiComparison(outcome);

                  const initials = j.fullName
                    ? j.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                    : "TR";

                  return (
                    <tr key={j.id} className="hover:bg-sibs-surface/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-sibs-navy">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-sibs-surface border border-sibs-border text-sibs-navy text-[11px] font-extrabold flex items-center justify-center shrink-0">
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

                      <td className="py-3.5 px-3 text-center tabular-nums font-bold text-sibs-navy">
                        {displayPercent(perf.fst)}
                      </td>

                      <td className="py-3.5 px-3 text-center tabular-nums font-bold text-sibs-navy">
                        {displayPercent(perf.pst)}
                      </td>

                      <td className="py-3.5 px-3 text-center tabular-nums font-bold text-sibs-navy">
                        {displayPercent(perf.trScore)}
                      </td>

                      <td className="py-3.5 px-3 text-center tabular-nums font-bold text-sibs-navy">
                        {displayPercent(perf.qaScore)}
                      </td>

                      <td className="py-3.5 px-3 text-center tabular-nums font-bold text-sibs-navy">
                        {displayPercent(perf.simScore)}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="font-bold tabular-nums text-sibs-navy text-xs block">
                            {displayPercent(perf.composite)}
                          </span>
                          <span className={cat.badgeClass}>
                            {cat.label}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold tabular-nums text-sibs-navy text-xs">
                          {displayPercent(perf.attRate)}
                        </div>
                        <span className="sibs-text-micro text-sibs-muted block font-medium">
                          {perf.absentCount} absent • {perf.missingAttCount} unrecorded
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="sibs-badge-neutral font-bold">
                          {perf.verifiedAssign} / {perf.totalAssign}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {comparison ? (
                          <div className="space-y-0.5">
                            <span
                              className={
                                comparison.difference >= 0
                                  ? "sibs-badge-success"
                                  : "sibs-badge-danger"
                              }
                            >
                              {comparison.difference >= 0 ? (
                                <TrendingUp size={10} />
                              ) : (
                                <TrendingDown size={10} />
                              )}
                              {comparison.differenceLabel} pp
                            </span>
                            <span className="sibs-text-micro text-sibs-muted block font-medium">
                              {comparison.before} → {comparison.after}
                            </span>
                          </div>
                        ) : (
                          <span className="sibs-text-micro text-sibs-muted font-medium">
                            {coaching.length ? `${evaluated.length}/${coaching.length} evaluated` : "No sessions"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAssignedTrainer && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTraineeId(j.sibsEmployeeId || j.id);
                                setFormError("");
              setShowGradingWorkspace(true);
                              }}
                              className="sibs-btn-primary h-8 px-2.5 text-xs font-extrabold cursor-pointer gap-1.5"
                            >
                              <GraduationCap size={13} />
                              <span>Grade</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setCoachingEmployee(j)}
                            className="sibs-btn-secondary h-8 px-2.5 text-xs font-bold cursor-pointer gap-1.5"
                            title="View ESEP Coaching Details"
                          >
                            <BookOpen size={13} className="text-sibs-orange" />
                            <span>Coach</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedJourney(j)}
                            className="sibs-btn-icon h-8 w-8 cursor-pointer text-sibs-navy hover:text-sibs-orange"
                            aria-label="View Full Journey Record"
                            title="View Full Journey Record"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: QUALITY & COACHING FOLLOW-UP QUEUE */}
      <div className="sibs-card bg-white p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-sibs-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sibs-orange" />
              <h2 className="sibs-section-title font-extrabold text-sibs-navy">Quality &amp; Coaching Escalations</h2>
            </div>
            <p className="sibs-section-subtitle text-sibs-muted">
              Independent Quality Development (QDS) review tickets and calibration follow-ups for {activeTrainer}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setQdsTargetEmp(cohortTrainees[0]?.sibsEmployeeId || cohortTrainees[0]?.id || "");
              setFormError("");
              setShowQdsModal(true);
            }}
            className="sibs-btn-primary gap-1.5 cursor-pointer"
          >
            <Plus size={13} />
            <span>New QDS Request</span>
          </button>
        </div>

        {trainerQdsFeedback.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {trainerQdsFeedback.map((req) => {
              const trainee = cohortTrainees.find((j) => [j.id, j.sibsEmployeeId].includes(req.emp));
              return (
                <article
                  key={req.id}
                  className="rounded-xl border border-sibs-border bg-sibs-surface/40 p-4 shadow-2xs space-y-2"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="sibs-badge-info">
                      {req.type}
                    </span>
                    <span
                      className={
                        req.status === "Closed"
                          ? "sibs-badge-success"
                          : "sibs-badge-warning"
                      }
                    >
                      {req.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-sibs-navy">
                    Target Trainee: {trainee?.fullName ?? req.emp}
                  </h3>
                  <p className="text-xs text-sibs-muted">{req.notes}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-sibs-border/60 text-xs">
                    <span className="sibs-text-micro text-sibs-muted">
                      Assigned: <strong className="text-sibs-navy">{req.assignedTo}</strong> • Due: {req.due}
                    </span>
                    {req.status !== "Closed" && (
                      <button
                        type="button"
                        onClick={() => {
                          updateQDSRequestStatus(req.id, "Closed", "Quality review complete.");
                          setToastMessage("Closed QDS follow-up ticket.");
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="sibs-btn-secondary h-8 px-3 text-xs font-bold"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="sibs-empty-panel p-6">
            No active QDS follow-up requests recorded for {activeTrainer}. All trainer reviews are up to date.
          </div>
        )}
      </div>

      {/* ESEP Coaching Details Modal */}
      {coachingEmployee && (
        <TrainerCoachingDetailsModal
          employee={coachingEmployee}
          sessions={esepSessions}
          evaluations={esepEvaluations}
          asOf={simulatedCurrentDate}
          onClose={() => setCoachingEmployee(null)}
        />
      )}

      {/* Modal: Staff-Only Assessment Grading Workspace */}
      <ModalShell
        open={showGradingWorkspace && isAssignedTrainer && !!activeTrainee}
        onClose={() => setShowGradingWorkspace(false)}
        variant="navy"
        maxWidth="max-w-lg"
        icon={GraduationCap}
        badge="Staff-Only"
        title="FST / PST Assessment Grading"
        subtitle={`${activeTrainee?.fullName || ""} (${activeTrainee?.sibsEmployeeId || activeTrainee?.id || ""}) • ${activeTrainee?.account || ""}`}
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowGradingWorkspace(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="grading-workspace-form"
              className="sibs-modal-btn-primary"
            >
              <Check size={14} />
              <span>Save Assessment Grade</span>
            </button>
          </div>
        }
      >
        <form id="grading-workspace-form" onSubmit={handleSaveGrade} className="space-y-4 text-xs font-jakarta">
          {formError && <p role="alert" className="sibs-badge-danger">{formError}</p>}
          <SelectDropdown
            label="Select Skill Assessment"
            value={selectedAssessmentId}
            onChange={(val) => setSelectedAssessmentId(Number(val))}
            searchable
            options={assessments
              .filter((a) => a.status === "Published")
              .map((a) => ({
                value: a.id,
                label: `[${a.phase}] ${a.title} (${a.skill}) — Max ${a.max} pts`,
              }))}
          />

          <div>
            <label className="sibs-modal-field-label">Grade / Score Obtained (points)</label>
            <input
              type="number"
              min={0}
              max={assessments.find((a) => a.id === selectedAssessmentId)?.max ?? 100}
              value={enteredScore}
              onChange={(e) => setEnteredScore(e.target.value)}
              className="sibs-modal-input"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border text-xs space-y-1">
            <span className="sibs-text-micro font-extrabold text-sibs-navy uppercase tracking-wider block">
              Evaluator Identity:
            </span>
            <p className="text-sibs-navy font-bold">{activeTrainer} (Assigned Trainer)</p>
            <p className="sibs-text-micro text-sibs-muted">
              Saving this grade updates the employee's FST / PST records immediately.
            </p>
          </div>
        </form>
      </ModalShell>

      {/* Modal: Create QDS Follow-Up Request */}
      <QdsRequestModal trainees={cohortTrainees} formId="view-qds-request-form" error={formError} showQdsModal={showQdsModal} setShowQdsModal={setShowQdsModal} qdsTargetEmp={qdsTargetEmp} setQdsTargetEmp={setQdsTargetEmp} qdsType={qdsType} setQdsType={setQdsType} qdsNotes={qdsNotes} setQdsNotes={setQdsNotes} qdsDue={qdsDue} setQdsDue={setQdsDue} handleCreateQdsRequest={handleCreateQdsRequest} />
    </div>
  );
}
