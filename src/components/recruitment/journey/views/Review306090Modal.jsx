import { useState } from "react";
import { useJourney } from "../JourneyContext";
import {
  X,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Star,
  Check,
  Edit3,
  Save,
  ChevronRight,
  BookOpen,
  Eye,
  ArrowUpRight
} from "lucide-react";
import { ModalShell, MetricCard, MetricGrid, SelectDropdown } from "@/components/ui";
import { useDemoAuth } from "@/lib/utils/journey/hrisRoleAdapter";
import { getEmphasizedEmployeeStatus } from "../employeeStatusUtils";
import TrainingProcessDetailModal from "./TrainingProcessDetailModal";
import TrainerCoachingDetailsModal from "../TrainerCoachingDetailsModal";
import DailyPerformanceCalendarView from "./DailyPerformanceCalendarView";
import {
  coachingForEmployee,
  evaluationFor,
  kpiComparison
} from "../trainerCoachingUtils";
function ReviewLayout({ embedded, children, ...props }) {
  return embedded ? <section aria-label="Milestone evaluations">{children}</section> : <ModalShell {...props}>{children}</ModalShell>;
}

function Review306090Modal({
  journey,
  isOpen,
  onClose,
  initialMilestone = 30,
  embedded = false
}) {
  const {
    updateDay30Milestone,
    updateDay60Milestone,
    updateDay90Milestone,
    setFinalEmploymentOutcome,
    phaseTrainingScores,
    assessments,
    assessmentGrades,
    evidence,
    esepSessions,
    esepEvaluations,
    simulatedCurrentDate
  } = useJourney();
  const { user } = useDemoAuth();
  const coachRoles = ["Trainer", "Team Leader", "Manager", "SOM", "QDS", "HR", "HR Admin", "Super Admin"];
  const canEditReviews = !user || coachRoles.includes(user.role);
  const [activeMilestoneTab, setActiveMilestoneTab] = useState(() => {
    if (embedded) return "all";
    if (journey.daysElapsed >= 90) return 90;
    if (journey.daysElapsed >= 60) return 60;
    return initialMilestone;
  });
  const [selectedGrowSessionId, setSelectedGrowSessionId] = useState(null);
  const employeeEsepSessions = coachingForEmployee(esepSessions, journey);
  const [isEditingDay30, setIsEditingDay30] = useState(false);
  const [day30Qa, setDay30Qa] = useState(journey.day30?.nestingQaScore ?? 88);
  const [day30Att, setDay30Att] = useState(journey.day30?.attendancePunctualityScore ?? 98.5);
  const [day30Endorsement, setDay30Endorsement] = useState(journey.day30?.trainerEndorsement || "Floor Ready");
  const [day30Notes, setDay30Notes] = useState(journey.day30?.trainerNotes || "");
  const [isEditingDay60, setIsEditingDay60] = useState(false);
  const [day60Prod, setDay60Prod] = useState(journey.day60?.coreProductionScore ?? 89);
  const [day60Aht, setDay60Aht] = useState(journey.day60?.averageHandleTimeSeconds ?? 380);
  const [day60Decision, setDay60Decision] = useState(journey.day60?.midProbationDecision || "Progressing Well");
  const [day60Notes, setDay60Notes] = useState(journey.day60?.supervisorNotes || "");
  const [isEditingDay90, setIsEditingDay90] = useState(false);
  const [day90Composite, setDay90Composite] = useState(journey.day90?.compositeScore ?? 91);
  const [day90Rating, setDay90Rating] = useState(journey.day90?.overallPerformanceRating ?? 4);
  const [day90Recommendation, setDay90Recommendation] = useState(journey.finalOutcome || "Endorse for Regularization");
  const [day90HrNotes, setDay90HrNotes] = useState(journey.day90?.hrOperationsSignOff?.remarks || "");
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedProcessModal, setSelectedProcessModal] = useState(null);
  if (!isOpen) return null;
  const empKey = journey.sibsEmployeeId || journey.id;
  const fstScoreObj = phaseTrainingScores.find((s) => (s.emp === empKey || s.emp === journey.id) && s.phase === "FST");
  const pstScoreObj = phaseTrainingScores.find((s) => (s.emp === empKey || s.emp === journey.id) && s.phase === "PST");
  const fstScoreVal = fstScoreObj?.score ?? journey.day30Handoff?.fstScore ?? 82;
  const pstScoreVal = pstScoreObj?.score ?? journey.day30Handoff?.pstScore ?? (journey.daysElapsed >= 15 ? 84 : null);
  const employeeGrades = (assessmentGrades || []).filter((g) => g.emp === empKey || g.emp === journey.id);
  const fstItems = (assessments || []).filter((a) => a.phase === "FST").map((a) => {
    const g = employeeGrades.find((gr) => gr.assessmentId === a.id);
    return {
      id: a.id,
      title: a.title,
      skill: a.skill,
      max: a.max,
      passing: a.passing,
      score: g ? g.score : a.id === 8103 ? 85 : 41,
      grader: g?.grader || journey.trainerName || "Maria Cruz",
      date: g?.date || "2026-09-28"
    };
  });
  const pstItems = (assessments || []).filter((a) => a.phase === "PST").map((a) => {
    const g = employeeGrades.find((gr) => gr.assessmentId === a.id);
    return {
      id: a.id,
      title: a.title,
      skill: a.skill,
      max: a.max,
      passing: a.passing,
      score: g ? g.score : a.id === 8101 ? 86 : a.id === 8102 ? 89 : 88,
      grader: g?.grader || journey.trainerName || "Maria Cruz",
      date: g?.date || "2026-10-10"
    };
  });
  const qaEvid = evidence.filter((e) => (e.emp === empKey || e.emp === journey.id) && e.type === "QDS / QA");
  const qaScoreVal = qaEvid.length > 0 ? Math.round(qaEvid.reduce((acc, ev) => acc + (ev.score || 85), 0) / qaEvid.length) : journey.day30?.nestingQaScore ?? 88;
  const emphasizedStatus = getEmphasizedEmployeeStatus(journey);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const handleSaveDay30 = () => {
    updateDay30Milestone(journey.id, {
      status: "Completed",
      nestingQaScore: Number(day30Qa),
      attendancePunctualityScore: Number(day30Att),
      trainerEndorsement: day30Endorsement,
      trainerNotes: day30Notes,
      completedDate: journey.day30?.completedDate || simulatedCurrentDate
    });
    setIsEditingDay30(false);
    showToast("Day 30 Milestone Review updated successfully!");
  };
  const handleSaveDay60 = () => {
    updateDay60Milestone(journey.id, {
      status: "Completed",
      coreProductionScore: Number(day60Prod),
      averageHandleTimeSeconds: Number(day60Aht),
      midProbationDecision: day60Decision,
      supervisorNotes: day60Notes,
      completedDate: journey.day60?.completedDate || simulatedCurrentDate
    });
    setIsEditingDay60(false);
    showToast("Day 60 Milestone Review updated successfully!");
  };
  const handleSaveDay90 = () => {
    updateDay90Milestone(journey.id, {
      status: "Completed",
      compositeScore: Number(day90Composite),
      overallPerformanceRating: Number(day90Rating),
      finalRecommendation: day90Recommendation,
      hrOperationsSignOff: {
        approved: true,
        signedBy: user?.name || "HR Operations Lead",
        signedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        remarks: day90HrNotes
      }
    });
    setFinalEmploymentOutcome(journey.id, day90Recommendation, day90HrNotes, user?.name || "HR Operations Lead");
    setIsEditingDay90(false);
    showToast("Day 90 Regularization Review & Outcome updated successfully!");
  };
  return (
    <ReviewLayout
      embedded={embedded}
      open={isOpen}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-5xl 2xl:max-w-6xl"
      icon={Award}
      title={journey.fullName}
      badge="30 / 60 / 90 Review"
      subtitle={`${journey.sibsEmployeeId || journey.id} • ${journey.roleTitle || "Trainee Advocate"} • ${journey.account} (${journey.siteLocation}) • Day ${journey.daysElapsed || 1} of 90`}
      headerActions={
        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${emphasizedStatus.badgeClass}`}>
          {emphasizedStatus.label}
        </span>
      }
      bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-sibs-surface p-0 font-jakarta flex flex-col"
      footer={
        <div className="flex items-center justify-between w-full font-jakarta">
          <p className="text-[11px] text-sibs-muted">
            30/60/90 reviews are governance records for probationary tracking and official regularization decisions.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-btn-secondary"
          >
            Close Review
          </button>
        </div>
      }
    >
      {toastMessage && (
        <div className="sibs-tone-green-bg border-b sibs-tone-green-border sibs-tone-green-text text-xs px-6 py-2 flex items-center justify-between shrink-0 font-semibold">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            {toastMessage}
          </span>
        </div>
      )}
      {
    /* 30/60/90 Navigation & Subheader */
  }
        <div className={`sibs-card flex min-w-0 shrink-0 flex-col gap-3 p-4 sm:p-5 ${embedded ? "mb-4" : "mx-4 mt-4 sm:mx-5"}`}>
          <div className="flex items-center gap-2 border-b border-sibs-border pb-3">
            <Award aria-hidden="true" className="h-4 w-4 shrink-0 text-sibs-orange" />
            <h3 className="sibs-modal-section-title text-sibs-navy">Milestone Evaluations</h3>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-sibs-border bg-sibs-surface p-1">
            <button
    type="button"
    onClick={() => setActiveMilestoneTab("all")}
    aria-pressed={activeMilestoneTab === "all"}
    className={`min-h-9 px-3 py-1.5 rounded-lg sibs-text-xs font-bold transition-colors cursor-pointer shrink-0 ${activeMilestoneTab === "all" ? "bg-sibs-navy text-white" : "text-sibs-navy hover:bg-slate-100"}`}
  >
              All 30 / 60 / 90
            </button>
            <button
    type="button"
    onClick={() => setActiveMilestoneTab(30)}
    aria-pressed={activeMilestoneTab === 30}
    className={`min-h-9 px-3 py-1.5 rounded-lg sibs-text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${activeMilestoneTab === 30 ? "bg-sibs-orange text-white" : "text-sibs-navy hover:bg-slate-100"}`}
  >
              Day 30 Checkpoint
              {journey.day30?.status === "Completed" && <Check className="w-3 h-3" />}
            </button>
            <button
    type="button"
    onClick={() => setActiveMilestoneTab(60)}
    aria-pressed={activeMilestoneTab === 60}
    className={`min-h-9 px-3 py-1.5 rounded-lg sibs-text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${activeMilestoneTab === 60 ? "bg-sibs-orange text-white" : "text-sibs-navy hover:bg-slate-100"}`}
  >
              Day 60 Mid-Probation
              {journey.day60?.status === "Completed" && <Check className="w-3 h-3" />}
            </button>
            <button
    type="button"
    onClick={() => setActiveMilestoneTab(90)}
    aria-pressed={activeMilestoneTab === 90}
    className={`min-h-9 px-3 py-1.5 rounded-lg sibs-text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${activeMilestoneTab === 90 ? "bg-sibs-orange text-white" : "text-sibs-navy hover:bg-slate-100"}`}
  >
              Day 90 Regularization
              {journey.day90?.status === "Completed" && <Check className="w-3 h-3" />}
            </button>
            <div aria-hidden="true" className="mx-1 hidden h-4 w-px shrink-0 bg-sibs-border lg:block" />
            <button
    type="button"
    onClick={() => setActiveMilestoneTab("calendar")}
    aria-pressed={activeMilestoneTab === "calendar"}
    className={`flex min-h-9 max-w-full flex-wrap items-center gap-1.5 rounded-lg px-3 py-1.5 text-left sibs-text-xs font-bold transition-colors cursor-pointer ${activeMilestoneTab === "calendar" ? "bg-sibs-orange text-white shadow-xs" : "text-sibs-navy hover:bg-orange-50 hover:text-sibs-orange"}`}
    title="Daily Performance & 1-on-1 Check-Ins Calendar (Days 1–90)"
  >
              <Calendar className="w-3.5 h-3.5" />
              <span>Daily Performance Calendar</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${activeMilestoneTab === "calendar" ? "bg-white/20 text-white" : "bg-orange-100 text-sibs-orange"}`}>
                FST → 90 Days
              </span>
            </button>
          </div>
        </div>

        {
    /* Modal Body */
  }
        <div className={embedded ? "space-y-4" : "min-h-0 flex-1 p-4 sm:p-5 space-y-4"}>
          {activeMilestoneTab === "calendar" ? <DailyPerformanceCalendarView
    journey={journey}
    onOpenCoachingModal={(sessionId) => setSelectedGrowSessionId(sessionId)}
    onClose={() => setActiveMilestoneTab("all")}
  /> : <>
              {
    /* 30-60-90 Score Summary Cards Banner */
  }
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {
    /* Day 30 Summary */
  }
            <div
    onClick={() => setActiveMilestoneTab(30)}
    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${activeMilestoneTab === 30 ? "ring-2 ring-sibs-orange border-transparent bg-white shadow-md" : "bg-white border-sibs-border hover:border-sibs-orange/40"}`}
  >
              <div className="flex items-center justify-between border-b border-sibs-border pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sibs-navy" />
                  <h4 className="text-xs font-black text-sibs-navy">Day 30 Checkpoint</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full sibs-text-micro font-extrabold ${journey.day30?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {journey.day30?.status || "In Progress"}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Nesting QA Score:</span>
                  <strong className="text-base font-black text-sibs-navy">
                    {journey.day30?.nestingQaScore ?? qaScoreVal}%
                  </strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Attendance Adherence:</span>
                  <strong className="text-xs font-bold text-sibs-navy">
                    {journey.day30?.attendancePunctualityScore ?? 98.5}%
                  </strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Endorsement:</span>
                  <span className="text-[10.5px] font-bold text-sibs-orange">
                    {journey.day30?.trainerEndorsement || "Floor Ready"}
                  </span>
                </div>
              </div>
            </div>

            {
    /* Day 60 Summary */
  }
            <div
    onClick={() => setActiveMilestoneTab(60)}
    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${activeMilestoneTab === 60 ? "ring-2 ring-sibs-orange border-transparent bg-white shadow-md" : "bg-white border-sibs-border hover:border-sibs-orange/40"}`}
  >
              <div className="flex items-center justify-between border-b border-sibs-border pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sibs-tertiary-2" />
                  <h4 className="text-xs font-black text-sibs-navy">Day 60 Mid-Probation</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full sibs-text-micro font-extrabold ${journey.day60?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : journey.daysElapsed >= 60 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-sibs-secondary"}`}>
                  {journey.day60?.status || (journey.daysElapsed >= 60 ? "Pending Review" : "Upcoming")}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Core Production:</span>
                  <strong className="text-base font-black text-sibs-navy">
                    {journey.day60?.coreProductionScore || 89}%
                  </strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Average Handle Time:</span>
                  <strong className="text-xs font-bold text-sibs-navy">
                    {journey.day60?.averageHandleTimeSeconds || 380}s
                  </strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Supervisor Decision:</span>
                  <span className="text-[10.5px] font-bold text-emerald-700 truncate">
                    {journey.day60?.midProbationDecision || "Progressing Well"}
                  </span>
                </div>
              </div>
            </div>

            {
    /* Day 90 Summary */
  }
            <div
    onClick={() => setActiveMilestoneTab(90)}
    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${activeMilestoneTab === 90 ? "ring-2 ring-sibs-orange border-transparent bg-white shadow-md" : "bg-white border-sibs-border hover:border-sibs-orange/40"}`}
  >
              <div className="flex items-center justify-between border-b border-sibs-border pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sibs-orange" />
                  <h4 className="text-xs font-black text-sibs-navy">Day 90 Regularization</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full sibs-text-micro font-extrabold ${journey.day90?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : journey.daysElapsed >= 90 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-sibs-secondary"}`}>
                  {journey.day90?.status || (journey.daysElapsed >= 90 ? "Pending Decision" : "Upcoming")}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Composite Score:</span>
                  <strong className="text-base font-black text-sibs-navy">
                    {journey.day90?.compositeScore || 91}%
                  </strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Performance Rating:</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < (journey.day90?.overallPerformanceRating || 4) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}
                  </div>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-sibs-muted font-medium">Final Outcome:</span>
                  <span className="text-[10.5px] font-black text-indigo-700 truncate">
                    {journey.finalOutcome || "Endorse for Regularization"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {
    /* ======================================================== */
  }
          {
    /* FIRST 30 DAYS: FST & PST TRAINING FOUNDATIONS DETAILS */
  }
          {
    /* ======================================================== */
  }
          {(activeMilestoneTab === "all" || activeMilestoneTab === 30) && <section className="sibs-card space-y-4 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sibs-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sibs-navy shadow-xs">
                    <BookOpen size={15} className="text-sibs-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="sibs-modal-section-title text-sibs-navy">
                        First 30 Days: FST &amp; PST Training Details
                      </h3>
                      <span className="px-2 py-0.5 rounded-full sibs-text-micro font-black uppercase tracking-wider bg-orange-100 text-sibs-orange border border-orange-200">
                        Prerequisites to Day 30 Checkpoint
                      </span>
                    </div>
                    <p className="text-[11px] text-sibs-muted">
                      Curriculum phase evaluations completed during Fundamental and Product Skills Training prior to operational nesting.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    Training Foundations Verified
                  </span>
                </div>
              </div>

              {
    /* FST & PST 2-Column Split Cards */
  }
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {
    /* 1. FST Card */
  }
                <div className="flex min-w-0 flex-col justify-between space-y-3.5 rounded-xl border border-sibs-border bg-sibs-surface p-3 sm:p-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-2.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sibs-navy text-white">
                          Phase 1 • Days 1–14
                        </span>
                        <h4 className="text-xs font-black text-sibs-navy">
                          FST — Fundamental Skill Training
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                        <button
    type="button"
    onClick={() => setSelectedProcessModal("FST")}
    className="sibs-btn-secondary whitespace-nowrap shrink-0"
    title="Open Full View of FST Process"
  >
                          <Eye size={12} className="text-sibs-orange" />
                          <span>Full View</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-sibs-muted font-medium">Phase Assessment Score:</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <strong className="text-2xl font-black text-sibs-navy">
                            {fstScoreVal}%
                          </strong>
                          <span className="text-[11px] text-sibs-faint font-medium">
                            / Target ≥ 80% Passing
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-sibs-navy border border-blue-200">
                        Trainer: {fstScoreObj?.owner || journey.trainerName || "Maria Cruz"}
                      </span>
                    </div>

                    {
    /* Progress Bar */
  }
                    <div className="w-full h-2 bg-[#E6EAF0] rounded-full overflow-hidden mt-2">
                      <div
    className="h-full bg-sibs-navy rounded-full transition-all duration-500"
    style={{ width: `${Math.min(100, fstScoreVal)}%` }}
  />
                    </div>
                  </div>

                  {
    /* FST Assessment Modules Breakdown */
  }
                  <div className="space-y-2 pt-1 border-t border-sibs-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-sibs-muted block">
                        FST Assessment Modules &amp; Practicals
                      </span>
                      <button
    type="button"
    onClick={() => setSelectedProcessModal("FST")}
    className="text-[10.5px] font-bold text-sibs-orange hover:underline inline-flex items-center gap-1 cursor-pointer"
  >
                        <span>View All 4</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {fstItems.slice(0, 2).map((item) => <div key={item.id} className="p-2.5 rounded-lg bg-white border border-sibs-border flex items-center justify-between shadow-2xs">
                          <div className="min-w-0 pr-2">
                            <strong className="text-[11.5px] text-sibs-navy block truncate">{item.title}</strong>
                            <span className="text-[10px] text-sibs-faint">Skill: {item.skill} • Evaluator: {item.grader}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <strong className="text-xs font-black text-sibs-navy">{item.score}%</strong>
                            <span className="sibs-text-micro text-emerald-600 block font-bold">Passed (≥{item.passing}%)</span>
                          </div>
                        </div>)}
                    </div>

                    <button
    type="button"
    onClick={() => setSelectedProcessModal("FST")}
    className="w-full mt-2 py-1.5 px-3 rounded-lg border border-sibs-border-subtle bg-white hover:bg-sibs-surface text-sibs-navy text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs group"
  >
                      <Eye size={12} className="text-sibs-orange group-hover:scale-110 transition-transform" />
                      <span>Full View FST Process Details</span>
                    </button>
                  </div>
                </div>

                {
    /* 2. PST Card */
  }
                <div className="flex min-w-0 flex-col justify-between space-y-3.5 rounded-xl border border-sibs-border bg-sibs-surface p-3 sm:p-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sibs-border pb-2.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sibs-orange text-white">
                          Phase 2 • Days 15–28
                        </span>
                        <h4 className="text-xs font-black text-sibs-navy">
                          PST — Product Skills Training
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${pstScoreVal !== null ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100"}`}>
                          {pstScoreVal !== null ? "Completed" : "In Progress"}
                        </span>
                        <button
    type="button"
    onClick={() => setSelectedProcessModal("PST")}
    className="sibs-btn-secondary whitespace-nowrap shrink-0"
    title="Open Full View of PST Process"
  >
                          <Eye size={12} className="text-sibs-orange" />
                          <span>Full View</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-sibs-muted font-medium">Phase Assessment Score:</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <strong className="text-2xl font-black text-sibs-orange">
                            {pstScoreVal !== null ? `${pstScoreVal}%` : "Not Scored"}
                          </strong>
                          <span className="text-[11px] text-sibs-faint font-medium">
                            / Target ≥ 80% Passing
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-900 border border-orange-200">
                        Evaluator: {pstScoreObj?.owner || journey.tl || "Anton Reyes"}
                      </span>
                    </div>

                    {
    /* Progress Bar */
  }
                    <div className="w-full h-2 bg-[#E6EAF0] rounded-full overflow-hidden mt-2">
                      <div
    className="h-full bg-sibs-orange rounded-full transition-all duration-500"
    style={{ width: `${Math.min(100, pstScoreVal || 0)}%` }}
  />
                    </div>
                  </div>

                  {
    /* PST Assessment Modules Breakdown */
  }
                  <div className="space-y-2 pt-1 border-t border-sibs-border/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-sibs-muted block">
                        PST Product Assessments &amp; Simulation
                      </span>
                      <button
    type="button"
    onClick={() => setSelectedProcessModal("PST")}
    className="text-[10.5px] font-bold text-sibs-orange hover:underline inline-flex items-center gap-1 cursor-pointer"
  >
                        <span>View All 4</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {pstItems.slice(0, 2).map((item) => <div key={item.id} className="p-2.5 rounded-lg bg-white border border-sibs-border flex items-center justify-between shadow-2xs">
                          <div className="min-w-0 pr-2">
                            <strong className="text-[11.5px] text-sibs-navy block truncate">{item.title}</strong>
                            <span className="text-[10px] text-sibs-faint">Account: {journey.account} • Evaluator: {item.grader}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <strong className="text-xs font-black text-sibs-orange">{item.score}%</strong>
                            <span className="sibs-text-micro text-emerald-600 block font-bold">Passed (≥{item.passing}%)</span>
                          </div>
                        </div>)}
                    </div>

                    <button
    type="button"
    onClick={() => setSelectedProcessModal("PST")}
    className="w-full mt-2 py-1.5 px-3 rounded-lg border border-sibs-border-subtle bg-white hover:bg-sibs-surface text-sibs-navy text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs group"
  >
                      <Eye size={12} className="text-sibs-orange group-hover:scale-110 transition-transform" />
                      <span>Full View PST Process Details</span>
                    </button>
                  </div>
                </div>
              </div>

              {
    /* Explanatory footer linking FST/PST into Day 30 Nesting */
  }
              <div className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-700 shrink-0" />
                  <span>
                    <strong>Training Foundation Endorsement:</strong> FST and PST phase scores evaluate foundational curriculum competence and directly substantiate the <strong>Day 30 Checkpoint Trainer Endorsement</strong> below.
                  </span>
                </div>
                <div className="font-mono text-[11px] font-bold shrink-0 text-amber-800">
                  Combined Avg: {Math.round(((fstScoreVal || 80) + (pstScoreVal || 80)) / 2)}%
                </div>
              </div>
            </section>}

          {
    /* ======================================================== */
  }
          {
    /* SECTION 1: DAY 30 CHECKPOINT REVIEW DETAILS */
  }
          {
    /* ======================================================== */
  }
          {(activeMilestoneTab === "all" || activeMilestoneTab === 30) && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-sibs-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-sibs-navy text-white font-black text-xs flex items-center justify-center">
                    30
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-sibs-navy">Day 30 Checkpoint Review</h3>
                    <p className="text-[11px] text-sibs-muted">
                      Evaluates Nesting phase performance, quality standards, and initial floor readiness.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${journey.day30?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {journey.day30?.status || "In Progress"}
                  </span>
                  {canEditReviews && !isEditingDay30 && <button
    type="button"
    onClick={() => setIsEditingDay30(true)}
    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface text-xs font-semibold cursor-pointer transition-colors"
  >
                      <Edit3 size={12} />
                      Edit Review
                    </button>}
                </div>
              </div>

              {isEditingDay30 ? <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border-subtle space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-sibs-navy mb-1">Nesting QA Score (%)</label>
                      <input
    type="number"
    min={0}
    max={100}
    value={day30Qa}
    onChange={(e) => setDay30Qa(Number(e.target.value))}
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs font-bold text-sibs-navy"
  />
                    </div>
                    <div>
                      <label className="block font-bold text-sibs-navy mb-1">Attendance Adherence (%)</label>
                      <input
    type="number"
    min={0}
    max={100}
    step={0.5}
    value={day30Att}
    onChange={(e) => setDay30Att(Number(e.target.value))}
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs font-bold text-sibs-navy"
  />
                    </div>
                    <SelectDropdown
                        label="Trainer Endorsement"
                        value={day30Endorsement}
                        onChange={setDay30Endorsement}
                        options={[
                          { value: "Floor Ready", label: "Floor Ready" },
                          { value: "Developing with Support", label: "Developing with Support" },
                          { value: "Extended Nesting Required", label: "Extended Nesting Required" },
                        ]}
                      />
                  </div>

                  <div>
                    <label className="block font-bold text-sibs-navy mb-1">Trainer Evaluation Notes & Recommendations</label>
                    <textarea
    rows={2}
    value={day30Notes}
    onChange={(e) => setDay30Notes(e.target.value)}
    placeholder="Add specific comments regarding candidate proficiency..."
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs text-sibs-navy"
  />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
    type="button"
    onClick={() => setIsEditingDay30(false)}
    className="px-3 py-1.5 rounded-lg border border-sibs-border-subtle text-sibs-secondary hover:bg-slate-100 text-xs font-semibold"
  >
                      Cancel
                    </button>
                    <button
    type="button"
    onClick={handleSaveDay30}
    className="px-3.5 py-1.5 rounded-lg bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
  >
                      <Save size={13} />
                      Save Day 30 Review
                    </button>
                  </div>
                </div> : <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Nesting QA Score</span>
                      <strong className="text-lg font-black text-sibs-navy mt-0.5 block">
                        {journey.day30?.nestingQaScore ?? qaScoreVal}%
                      </strong>
                      <span className="sibs-text-micro text-emerald-600 font-semibold">Quality target: 85%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Attendance Adherence</span>
                      <strong className="text-lg font-black text-sibs-navy mt-0.5 block">
                        {journey.day30?.attendancePunctualityScore ?? 98.5}%
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-semibold">Target: 95%+</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Trainer Endorsement</span>
                      <strong className="text-sm font-black text-sibs-orange mt-1 block">
                        {journey.day30?.trainerEndorsement || "Floor Ready"}
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-medium">Evaluated by {journey.trainerName || "L&D Trainer"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Review Date</span>
                      <strong className="text-xs font-black text-sibs-navy mt-1 block">
                        {journey.day30?.completedDate || (journey.daysElapsed >= 30 ? "Completed on Day 30" : "Pending Day 30")}
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-medium">Sign-off: Recorded</span>
                    </div>
                  </div>

                  {journey.day30?.trainerNotes && <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border text-xs">
                      <strong className="text-sibs-navy block text-[11px] mb-0.5">Trainer Assessment Notes:</strong>
                      <p className="text-sibs-secondary italic">{journey.day30.trainerNotes}</p>
                    </div>}
                </div>}
            </div>}

          {
    /* ======================================================== */
  }
          {
    /* SECTION 2: DAY 60 MID-PROBATION REVIEW DETAILS */
  }
          {
    /* ======================================================== */
  }
          {(activeMilestoneTab === "all" || activeMilestoneTab === 60) && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-sibs-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-sibs-tertiary-2 text-white font-black text-xs flex items-center justify-center">
                    60
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-sibs-navy">Day 60 Mid-Probation Review</h3>
                    <p className="text-[11px] text-sibs-muted">
                      Evaluates live production ramp, SLA adherence, and supervisor performance validation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${journey.day60?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : journey.daysElapsed >= 60 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-sibs-secondary"}`}>
                    {journey.day60?.status || (journey.daysElapsed >= 60 ? "Pending Review" : "Upcoming")}
                  </span>
                  {canEditReviews && !isEditingDay60 && <button
    type="button"
    onClick={() => setIsEditingDay60(true)}
    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface text-xs font-semibold cursor-pointer transition-colors"
  >
                      <Edit3 size={12} />
                      Edit Review
                    </button>}
                </div>
              </div>

              {isEditingDay60 ? <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border-subtle space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-sibs-navy mb-1">Core Production Score (%)</label>
                      <input
    type="number"
    min={0}
    max={100}
    value={day60Prod}
    onChange={(e) => setDay60Prod(Number(e.target.value))}
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs font-bold text-sibs-navy"
  />
                    </div>
                    <div>
                      <label className="block font-bold text-sibs-navy mb-1">Average Handle Time (Seconds)</label>
                      <input
    type="number"
    min={0}
    max={1200}
    value={day60Aht}
    onChange={(e) => setDay60Aht(Number(e.target.value))}
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs font-bold text-sibs-navy"
  />
                    </div>
                    <SelectDropdown
                        label="Supervisor Mid-Probation Decision"
                        value={day60Decision}
                        onChange={setDay60Decision}
                        options={[
                          { value: "Progressing Well", label: "Progressing Well" },
                          { value: "On Track", label: "On Track" },
                          { value: "Performance Improvement Plan", label: "Performance Improvement Plan" },
                        ]}
                      />
                  </div>

                  <div>
                    <label className="block font-bold text-sibs-navy mb-1">Supervisor Review Notes & Feedback</label>
                    <textarea
    rows={2}
    value={day60Notes}
    onChange={(e) => setDay60Notes(e.target.value)}
    placeholder="Enter supervisor mid-probation comments..."
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs text-sibs-navy"
  />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
    type="button"
    onClick={() => setIsEditingDay60(false)}
    className="px-3 py-1.5 rounded-lg border border-sibs-border-subtle text-sibs-secondary hover:bg-slate-100 text-xs font-semibold"
  >
                      Cancel
                    </button>
                    <button
    type="button"
    onClick={handleSaveDay60}
    className="px-3.5 py-1.5 rounded-lg bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
  >
                      <Save size={13} />
                      Save Day 60 Review
                    </button>
                  </div>
                </div> : <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Production Score</span>
                      <strong className="text-lg font-black text-sibs-navy mt-0.5 block">
                        {journey.day60?.coreProductionScore || 89}%
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-semibold">Account target: 85%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Average Handle Time</span>
                      <strong className="text-lg font-black text-sibs-navy mt-0.5 block">
                        {journey.day60?.averageHandleTimeSeconds || 380}s
                      </strong>
                      <span className="sibs-text-micro text-emerald-600 font-semibold">Within target range</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Mid-Probation Decision</span>
                      <strong className="text-sm font-black text-emerald-700 mt-1 block">
                        {journey.day60?.midProbationDecision || "Progressing Well"}
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-medium">By {journey.tl || "Team Leader"}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Review Date</span>
                      <strong className="text-xs font-black text-sibs-navy mt-1 block">
                        {journey.day60?.completedDate || (journey.daysElapsed >= 60 ? "Completed on Day 60" : "Pending Day 60")}
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-medium">Supervisor Sign-off</span>
                    </div>
                  </div>

                  {journey.day60?.supervisorNotes && <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border text-xs">
                      <strong className="text-sibs-navy block text-[11px] mb-0.5">Supervisor Evaluation Notes:</strong>
                      <p className="text-sibs-secondary italic">{journey.day60.supervisorNotes}</p>
                    </div>}
                </div>}

              {
    /* Day 60 Coaching Record / Table: Undergone ESEP Coaching History */
  }
              <div className="pt-3 border-t border-sibs-border space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sibs-orange" />
                    <h4 className="text-xs font-black uppercase text-sibs-navy tracking-wider">
                      Day 31–60 Ramp Coaching &amp; Intervention Record
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${employeeEsepSessions.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-sibs-secondary"}`}>
                    {employeeEsepSessions.length > 0 ? `${employeeEsepSessions.length} Undergone Coaching Session(s)` : "No Remedial Coaching Required"}
                  </span>
                </div>

                {employeeEsepSessions.length > 0 ? <div className="space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-sibs-border bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-sibs-border bg-sibs-surface text-sibs-muted font-bold text-[10px] uppercase">
                            <th className="py-2.5 px-3">Date &amp; ID</th>
                            <th className="py-2.5 px-3">Coach / Facilitator</th>
                            <th className="py-2.5 px-3">Session Type</th>
                            <th className="py-2.5 px-3">Goal &amp; Agreed Action (GROW)</th>
                            <th className="py-2.5 px-3">Follow-up &amp; Measured Result</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {employeeEsepSessions.map((session) => {
    const evalObj = evaluationFor(session, esepEvaluations);
    const comp = kpiComparison(evalObj);
    return <tr key={session.id} className="hover:bg-sibs-cream-light transition-colors">
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="font-bold text-sibs-navy block text-xs">{session.date}</span>
                                  <span className="font-mono text-[10px] text-sibs-muted">ESEP-{session.id}</span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <strong className="text-sibs-navy block text-xs">{session.facilitator}</strong>
                                  <span className="text-[10px] text-sibs-muted">{session.facilitatorRole}</span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-sibs-navy">
                                    {session.type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 max-w-xs">
                                  <strong className="text-sibs-navy block text-xs line-clamp-1">{session.goal}</strong>
                                  <p className="text-[11px] text-sibs-muted line-clamp-1 mt-0.5">{session.will || session.actionPlan}</p>
                                </td>
                                <td className="py-2.5 px-3">
                                  {evalObj ? <div>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block mb-0.5">
                                        {comp ? `KPI Lift: ${comp.before} \u2192 ${comp.after} (${comp.differenceLabel})` : "Evaluated"}
                                      </span>
                                      <p className="text-[10px] text-sibs-secondary line-clamp-1">{evalObj.notes}</p>
                                    </div> : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      Due {session.due || "Pending"}
                                    </span>}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <button
      type="button"
      onClick={() => setSelectedGrowSessionId(session.id)}
      className="px-2.5 py-1 rounded-lg border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
    >
                                    <Eye size={12} />
                                    <span>View GROW</span>
                                  </button>
                                </td>
                              </tr>;
  })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-sibs-navy flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-sibs-orange shrink-0" />
                        <span className="font-medium text-[11.5px]">
                          <strong>Supervisor Coaching Validation:</strong> Documented GROW coaching intervention directly supported production readiness, evidencing positive performance recovery (+6%) prior to Day 60 sign-off.
                        </span>
                      </div>
                      <button
    type="button"
    onClick={() => setSelectedGrowSessionId(employeeEsepSessions[0]?.id ?? 1)}
    className="text-sibs-orange hover:text-[#e04f20] hover:underline font-bold text-xs shrink-0 pl-2 cursor-pointer transition-colors"
  >
                        View Coaching Details →
                      </button>
                    </div>
                  </div> : <div className="p-3.5 rounded-xl bg-sibs-surface border border-sibs-border text-xs flex items-center justify-between">
                    <p className="text-sibs-secondary">
                      <strong>No coaching interventions required:</strong> Employee performed within acceptable quality and production benchmarks during Days 31–60 without needing escalated 1:1 or QA coaching.
                    </p>
                    <button
    type="button"
    onClick={() => setSelectedGrowSessionId(employeeEsepSessions[0]?.id ?? 1)}
    className="px-2.5 py-1 rounded-lg bg-white border border-sibs-border-subtle text-sibs-navy font-bold hover:bg-sibs-surface text-[11px] cursor-pointer"
  >
                      Browse Coaching Records
                    </button>
                  </div>}
              </div>
            </div>}

          {
    /* ======================================================== */
  }
          {
    /* SECTION 3: DAY 90 REGULARIZATION DISPOSITION DETAILS */
  }
          {
    /* ======================================================== */
  }
          {(activeMilestoneTab === "all" || activeMilestoneTab === 90) && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-sibs-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-sibs-orange text-white font-black text-xs flex items-center justify-center">
                    90
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-sibs-navy">Day 90 Regularization Review & Final Disposition</h3>
                    <p className="text-[11px] text-sibs-muted">
                      Comprehensive 90-day probationary review and formal employment regularization recommendation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${journey.day90?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : journey.daysElapsed >= 90 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-sibs-secondary"}`}>
                    {journey.day90?.status || (journey.daysElapsed >= 90 ? "Pending Decision" : "Upcoming")}
                  </span>
                  {canEditReviews && !isEditingDay90 && <button
    type="button"
    onClick={() => setIsEditingDay90(true)}
    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface text-xs font-semibold cursor-pointer transition-colors"
  >
                      <Edit3 size={12} />
                      Edit Review
                    </button>}
                </div>
              </div>

              {isEditingDay90 ? <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border-subtle space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-sibs-navy mb-1">Composite Score (%)</label>
                      <input
    type="number"
    min={0}
    max={100}
    value={day90Composite}
    onChange={(e) => setDay90Composite(Number(e.target.value))}
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs font-bold text-sibs-navy"
  />
                    </div>
                    <SelectDropdown
                        label="Performance Rating (1–5 Stars)"
                        value={day90Rating}
                        onChange={(val) => setDay90Rating(Number(val))}
                        options={[
                          { value: 5, label: "5 — Outstanding (Exceeds Expectations)" },
                          { value: 4, label: "4 — Commendable (Consistently Meets & Exceeds)" },
                          { value: 3, label: "3 — Proficient (Meets Expectations)" },
                          { value: 2, label: "2 — Marginal (Developing with Gaps)" },
                          { value: 1, label: "1 — Unsatisfactory" },
                        ]}
                      />
                    <SelectDropdown
                        label="Final Regularization Recommendation"
                        value={day90Recommendation}
                        onChange={setDay90Recommendation}
                        options={[
                          { value: "Endorse for Regularization", label: "Endorse for Regularization" },
                          { value: "Extend Probation (30 Days)", label: "Extend Probation (30 Days)" },
                          { value: "Non-regularization Separation", label: "Non-regularization Separation" },
                        ]}
                      />
                  </div>

                  <div>
                    <label className="block font-bold text-sibs-navy mb-1">HR Operations Sign-Off Comments</label>
                    <textarea
    rows={2}
    value={day90HrNotes}
    onChange={(e) => setDay90HrNotes(e.target.value)}
    placeholder="Enter HR operations review remarks and regularization sign-off justification..."
    className="w-full p-2 rounded-lg border border-sibs-border-subtle text-xs text-sibs-navy"
  />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
    type="button"
    onClick={() => setIsEditingDay90(false)}
    className="px-3 py-1.5 rounded-lg border border-sibs-border-subtle text-sibs-secondary hover:bg-slate-100 text-xs font-semibold"
  >
                      Cancel
                    </button>
                    <button
    type="button"
    onClick={handleSaveDay90}
    className="px-3.5 py-1.5 rounded-lg bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
  >
                      <Save size={13} />
                      Save Regularization Review
                    </button>
                  </div>
                </div> : <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Final Composite Score</span>
                      <strong className="text-lg font-black text-sibs-navy mt-0.5 block">
                        {journey.day90?.compositeScore || 91}%
                      </strong>
                      <span className="sibs-text-micro text-emerald-600 font-semibold">Regularization threshold: 85%</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Overall Rating</span>
                      <div className="flex items-center gap-1 mt-1">
                        <strong className="text-sm font-black text-sibs-navy">
                          {journey.day90?.overallPerformanceRating || 4} / 5
                        </strong>
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className={i < (journey.day90?.overallPerformanceRating || 4) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}
                        </div>
                      </div>
                      <span className="sibs-text-micro text-sibs-muted font-semibold">Formal appraisal</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">Regularization Endorsement</span>
                      <strong className="text-sm font-black text-indigo-700 mt-1 block">
                        {journey.finalOutcome || "Endorse for Regularization"}
                      </strong>
                      <span className="sibs-text-micro text-sibs-muted font-medium">Formal HR Recommendation</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border">
                      <span className="text-[10px] text-sibs-muted font-bold block">HR Operations Sign-off</span>
                      <strong className="text-xs font-black text-sibs-navy mt-1 block">
                        {journey.day90?.hrOperationsSignOff?.signedBy || "HR Operations Lead"}
                      </strong>
                      <span className="sibs-text-micro text-emerald-600 font-medium">
                        {journey.day90?.hrOperationsSignOff?.signedAt || "Sign-off Recorded"}
                      </span>
                    </div>
                  </div>

                  {journey.day90?.hrOperationsSignOff?.remarks && <div className="p-3 rounded-xl bg-sibs-surface border border-sibs-border text-xs">
                      <strong className="text-sibs-navy block text-[11px] mb-0.5">HR Operations Remarks:</strong>
                      <p className="text-sibs-secondary italic">{journey.day90.hrOperationsSignOff.remarks}</p>
                    </div>}
                </div>}

              {
    /* Day 90 Coaching History & Evidence: Undergone ESEP Coaching across 90-Day Lifecycle */
  }
              <div className="pt-3 border-t border-sibs-border space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sibs-orange" />
                    <h4 className="text-xs font-black uppercase text-sibs-navy tracking-wider">
                      Day 1–90 Probationary Coaching &amp; Regularization Evidence
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${employeeEsepSessions.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-sibs-secondary"}`}>
                    {employeeEsepSessions.length > 0 ? `${employeeEsepSessions.length} Lifetime Coaching Record(s) Evaluated` : "Probation Completed with 0 Remedial Actions"}
                  </span>
                </div>

                {employeeEsepSessions.length > 0 ? <div className="space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-sibs-border bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-sibs-border bg-sibs-surface text-sibs-muted font-bold text-[10px] uppercase">
                            <th className="py-2.5 px-3">Date &amp; ID</th>
                            <th className="py-2.5 px-3">Coach / Facilitator</th>
                            <th className="py-2.5 px-3">Session Type</th>
                            <th className="py-2.5 px-3">Coaching Focus (GROW)</th>
                            <th className="py-2.5 px-3">Measured Outcome &amp; Evidence</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {employeeEsepSessions.map((session) => {
    const evalObj = evaluationFor(session, esepEvaluations);
    const comp = kpiComparison(evalObj);
    return <tr key={session.id} className="hover:bg-sibs-cream-light transition-colors">
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="font-bold text-sibs-navy block text-xs">{session.date}</span>
                                  <span className="font-mono text-[10px] text-sibs-muted">ESEP-{session.id}</span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <strong className="text-sibs-navy block text-xs">{session.facilitator}</strong>
                                  <span className="text-[10px] text-sibs-muted">{session.facilitatorRole}</span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-sibs-navy">
                                    {session.type}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 max-w-xs">
                                  <strong className="text-sibs-navy block text-xs line-clamp-1">{session.goal}</strong>
                                  <p className="text-[11px] text-sibs-muted line-clamp-1 mt-0.5">{session.will || session.actionPlan}</p>
                                </td>
                                <td className="py-2.5 px-3">
                                  {evalObj ? <div>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block mb-0.5">
                                        {comp ? `Verified KPI Lift: ${comp.before} \u2192 ${comp.after} (${comp.differenceLabel})` : "Evaluated & Cleared"}
                                      </span>
                                      <p className="text-[10px] text-sibs-secondary line-clamp-1">{evalObj.notes}</p>
                                    </div> : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                      Follow-up Due: {session.due}
                                    </span>}
                                </td>
                                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                  <button
      type="button"
      onClick={() => setSelectedGrowSessionId(session.id)}
      className="px-2.5 py-1 rounded-lg border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
    >
                                    <Eye size={12} />
                                    <span>View GROW</span>
                                  </button>
                                </td>
                              </tr>;
  })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-[11.5px]">
                          <strong>Regularization Coaching Clearance:</strong> All coaching commitments documented under the ESEP framework have verified follow-up outcomes, supporting the regularization recommendation.
                        </span>
                      </div>
                      <button
    type="button"
    onClick={() => setSelectedGrowSessionId(employeeEsepSessions[0]?.id ?? 1)}
    className="text-emerald-800 hover:text-emerald-950 hover:underline font-bold text-xs shrink-0 pl-2 cursor-pointer transition-colors"
  >
                        Review Coaching Evidence →
                      </button>
                    </div>
                  </div> : <div className="p-3.5 rounded-xl bg-sibs-surface border border-sibs-border text-xs flex items-center justify-between">
                    <p className="text-sibs-secondary">
                      <strong>Clean Probationary Record:</strong> No corrective or remedial coaching sessions were logged. The candidate met all independent QA and production standards autonomously.
                    </p>
                    <button
    type="button"
    onClick={() => setSelectedGrowSessionId(employeeEsepSessions[0]?.id ?? 1)}
    className="px-2.5 py-1 rounded-lg bg-white border border-sibs-border-subtle text-sibs-navy font-bold hover:bg-sibs-surface text-[11px] cursor-pointer"
  >
                      Browse Coaching Records
                    </button>
                  </div>}
              </div>
            </div>}

          {
    /* ======================================================== */
  }
          {
    /* SECTION 4: 30 / 60 / 90 PROGRESSION COMPARISON TABLE */
  }
          {
    /* ======================================================== */
  }
          <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-3">
              <div className="border-b border-sibs-border pb-2">
                <h4 className="text-xs font-black uppercase text-sibs-navy tracking-wider">
                  30 / 60 / 90 Progression Comparison Summary
                </h4>
                <p className="text-[11px] text-sibs-muted">
                  Official trajectory across all three probationary milestone evaluations.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-sibs-border text-sibs-muted font-bold text-[10px] uppercase">
                      <th className="py-2 px-3">Evaluation Parameter</th>
                      <th className="py-2 px-3">Day 30 Review</th>
                      <th className="py-2 px-3">Day 60 Review</th>
                      <th className="py-2 px-3">Day 90 Review</th>
                      <th className="py-2 px-3">Trajectory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-sibs-navy">Performance Metric</td>
                      <td className="py-2.5 px-3">QA: {journey.day30?.nestingQaScore ?? qaScoreVal}%</td>
                      <td className="py-2.5 px-3">Production: {journey.day60?.coreProductionScore || 89}%</td>
                      <td className="py-2.5 px-3 font-bold text-sibs-navy">Composite: {journey.day90?.compositeScore || 91}%</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">▲ Upward (+3%)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-sibs-navy">Evaluation Focus</td>
                      <td className="py-2.5 px-3 text-sibs-secondary">Nesting &amp; Quality Floor Readiness</td>
                      <td className="py-2.5 px-3 text-sibs-secondary">Live Production Ramp &amp; AHT</td>
                      <td className="py-2.5 px-3 text-sibs-secondary">90-Day Regularization Appraisal</td>
                      <td className="py-2.5 px-3 text-sibs-muted font-semibold">Standard Lifecycle</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-sibs-navy">Sign-off Authority</td>
                      <td className="py-2.5 px-3">{journey.trainerName || "Assigned Trainer"}</td>
                      <td className="py-2.5 px-3">{journey.tl || "Team Leader"}</td>
                      <td className="py-2.5 px-3 font-semibold text-sibs-navy">Operations Manager &amp; HR</td>
                      <td className="py-2.5 px-3 text-indigo-600 font-bold">HR Verified</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-sibs-navy">Coaching Undergone</td>
                      <td className="py-2.5 px-3 text-sibs-muted">0 Remedial Actions (FST/PST)</td>
                      <td className="py-2.5 px-3">
                        {employeeEsepSessions.length > 0 ? <span className="font-semibold text-emerald-700">
                            {employeeEsepSessions.length} Session(s) • Evaluated (+6 pts)
                          </span> : <span className="text-sibs-muted">0 Remedial Sessions</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        {employeeEsepSessions.length > 0 ? <span className="font-semibold text-emerald-700">
                            GROW Commitments Cleared
                          </span> : <span className="text-sibs-muted">Standard Benchmarks Met</span>}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">Verified</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-sibs-navy">Milestone Status</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          {journey.day30?.status || "Completed"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${journey.day60?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {journey.day60?.status || "In Progress"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${journey.day90?.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {journey.day90?.status || "Under Review"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">
                        {journey.finalOutcome ? "Endorsed" : "Active"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {
    /* Callout to Expand into Per-Day Performance Calendar */
  }
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-sibs-navy via-sibs-tertiary-2 to-[#13406D] text-white border border-[#1A4C7B] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                    <Calendar className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Per-Day Performance & Daily Check-Ins View</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sibs-orange text-white tracking-wide">
                        Full 90-Day Trajectory
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-200 mt-1 max-w-2xl leading-relaxed">
                      Expand this milestone summary into an interactive day-by-day calendar tracking daily 1-on-1 check-ins, confidence scoring (1–5), facilitator notes, and key takeaways from FST through Day 90 regularization.
                    </p>
                  </div>
                </div>
                <button
    type="button"
    onClick={() => setActiveMilestoneTab("calendar")}
    className="shrink-0 px-4 py-2.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start md:self-auto"
  >
                  <Calendar className="w-4 h-4" />
                  <span>Expand Calendar View</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>}
      </div>

        {
    /* Full View Process Detail Modal */
  }
      {selectedProcessModal && <TrainingProcessDetailModal
    isOpen={Boolean(selectedProcessModal)}
    onClose={() => setSelectedProcessModal(null)}
    processType={selectedProcessModal}
    journey={journey}
    scoreVal={selectedProcessModal === "FST" ? fstScoreVal : pstScoreVal}
    evaluatorName={selectedProcessModal === "FST" ? fstScoreObj?.owner || journey.trainerName || "Maria Cruz" : pstScoreObj?.owner || journey.tl || "Anton Reyes"}
    items={selectedProcessModal === "FST" ? fstItems : pstItems}
  />}

      {
    /* GROW Coaching Detail Modal */
  }
      {selectedGrowSessionId && <TrainerCoachingDetailsModal
    employee={journey}
    sessions={esepSessions}
    evaluations={esepEvaluations}
    asOf={simulatedCurrentDate}
    onClose={() => setSelectedGrowSessionId(null)}
    initialSessionId={selectedGrowSessionId}
  />}
    </ReviewLayout>
  );
}
export {
  Review306090Modal as default
};
