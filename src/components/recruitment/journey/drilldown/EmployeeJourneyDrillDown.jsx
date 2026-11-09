/* eslint-disable no-unused-vars */
import { useState } from "react";
import TrainerCoachingDetailsModal from "../TrainerCoachingDetailsModal";
import { coachingForEmployee, coachingStatus, evaluationFor, kpiComparison } from "../trainerCoachingUtils";
import { useJourney } from "../JourneyContext";
import Day30HandoffCard from "../Day30HandoffCard";
import {
  X,
  Check,
  CheckCircle2,
  User,
  Link as LinkIcon,
  ShieldCheck,
  Lock,
  Eye,
  Clock,
  Calendar,
  CheckSquare,
  HeartHandshake,
  Award,
  ArrowRightLeft,
  TrendingUp,
  AlertTriangle,
  FileText,
  Send,
  Plus,
  ChevronRight
} from "lucide-react";
import { ModalShell, MetricCard, MetricGrid, SelectDropdown, StatusFilterTabs } from "@/components/ui";
import { useDemoAuth } from "@/lib/utils/journey/hrisRoleAdapter";
import { getEmphasizedEmployeeStatus } from "../employeeStatusUtils";
import TrainingProcessDetailModal from "../views/TrainingProcessDetailModal";
import Review306090Modal from "../views/Review306090Modal";
function EmployeeJourneyDrillDown({
  journey,
  isOpen,
  onClose,
  initialTab = "timeline",
  initialPhaseIndex,
  onUpdateStage,
  profileMode = false
}) {
  const {
    updateDay30Milestone,
    updateDay60Milestone,
    updateDay90Milestone,
    updateJourneyReview,
    setFinalEmploymentOutcome,
    acknowledgeReview,
    addTouchpoint,
    linkEmployeeProfile,
    attendance,
    addAttendanceRecord,
    evidence,
    addEvidenceItem,
    checkIns,
    addCheckIn,
    coachingActions,
    esepSessions,
    esepEvaluations,
    addCoachingAction,
    toggleCoachingAction,
    assignments,
    progress,
    phaseTrainingScores,
    assessments,
    assessmentGrades,
    simulatedCurrentDate
  } = useJourney();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(() => {
    if (initialPhaseIndex !== void 0) return initialPhaseIndex;
    const d = journey.daysElapsed || 1;
    return d <= 14 ? 0 : d <= 28 ? 1 : d <= 30 ? 2 : d <= 59 ? 3 : d === 60 ? 4 : d <= 89 ? 5 : 6;
  });
  const { user } = useDemoAuth();
  const [coachModeOverride, setCoachModeOverride] = useState("auto");
  const coachRoles = ["Trainer", "Team Leader", "Manager", "SOM", "QDS", "HR", "HR Admin", "Super Admin"];
  const userIsCoach = !user || coachRoles.includes(user.role);
  const isViewingAsCoach = coachModeOverride === "auto" ? userIsCoach : coachModeOverride === "coach";
  const emphasizedStatus = getEmphasizedEmployeeStatus(journey);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSibsId, setLinkSibsId] = useState(journey.sibsEmployeeId || "");
  const [linkTrainerId, setLinkTrainerId] = useState(journey.trainerId || "TRN-001");
  const [linkTrainerName, setLinkTrainerName] = useState(journey.trainerName || "Maria Cruz (Senior Trainer)");
  const [linkHireDate, setLinkHireDate] = useState(journey.hireDate || "");
  const [linkStartDate, setLinkStartDate] = useState(journey.startDate || "2026-10-15");
  const [showAddAttendance, setShowAddAttendance] = useState(false);
  const [attDate, setAttDate] = useState(simulatedCurrentDate || "2026-10-14");
  const [attStatus, setAttStatus] = useState("Present");
  const [attSource, setAttSource] = useState("Kronos Biometric Punch");
  const [attNotes, setAttNotes] = useState("Standard operational shift");
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evType, setEvType] = useState("Training");
  const [evTitle, setEvTitle] = useState("");
  const [evOwner, setEvOwner] = useState("Maria Cruz (Assigned Trainer)");
  const [evNotes, setEvNotes] = useState("");
  const [showAddCheckIn, setShowAddCheckIn] = useState(false);
  const [ciType, setCiType] = useState("Trainer");
  const [ciOwner, setCiOwner] = useState("Maria Cruz");
  const [ciConfidence, setCiConfidence] = useState(4);
  const [ciNotes, setCiNotes] = useState("");
  const [showAddCoaching, setShowAddCoaching] = useState(false);
  const [showEsepDetails, setShowEsepDetails] = useState(false);
  const [coachTitle, setCoachTitle] = useState("");
  const [coachOwner, setCoachOwner] = useState("Anton Reyes (Team Leader)");
  const [coachDue, setCoachDue] = useState("2026-10-25");
  const [coachNotes, setCoachNotes] = useState("");
  const [day30Qa, setDay30Qa] = useState(journey.day30.nestingQaScore || 85);
  const [day30Attendance, setDay30Attendance] = useState(journey.day30.attendancePunctualityScore || 98);
  const [day30Endorsement, setDay30Endorsement] = useState(journey.day30.trainerEndorsement || "Floor Ready");
  const [day30Notes, setDay30Notes] = useState(journey.day30.trainerNotes || "");
  const [day60Prod, setDay60Prod] = useState(journey.day60.coreProductionScore || 89);
  const [day60Aht, setDay60Aht] = useState(journey.day60.averageHandleTimeSeconds || 380);
  const [day60Decision, setDay60Decision] = useState(journey.day60.midProbationDecision || "Progressing Well");
  const [day60Notes, setDay60Notes] = useState(journey.day60.supervisorNotes || "");
  const [day90Composite, setDay90Composite] = useState(journey.day90.compositeScore || 91);
  const [day90Rating, setDay90Rating] = useState(journey.day90.overallPerformanceRating || 4);
  const [officialDecision, setOfficialDecision] = useState(journey.finalOutcome || "Endorse for Regularization");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedProcessModal, setSelectedProcessModal] = useState(null);
  if (!isOpen) return null;
  const empKey = journey.sibsEmployeeId || journey.id;
  const employeeAttendance = attendance.filter((a) => a.emp === empKey || a.emp === journey.id);
  const employeeEvidence = evidence.filter((e) => e.emp === empKey || e.emp === journey.id);
  const employeeCheckIns = checkIns.filter((c) => c.emp === empKey || c.emp === journey.id);
  const employeeCoaching = coachingActions.filter((c) => c.emp === empKey || c.emp === journey.id);
  const employeeEsepSessions = coachingForEmployee(esepSessions, journey);
  const evaluatedEsepCount = employeeEsepSessions.filter((s) => evaluationFor(s, esepEvaluations)).length;
  const employeeAssignments = assignments.filter((a) => a.emp === empKey || a.emp === journey.id);
  const dayOffset = (dateStr, numDays) => {
    const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + numDays);
    return d.toISOString().slice(0, 10);
  };
  const dateLabel = (dStr) => {
    if (!dStr) return "\u2014";
    return (/* @__PURE__ */ new Date(dStr + "T12:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const hire = journey.hireDate || journey.startDate || "2026-09-01";
  const recent14 = Array.from({ length: 14 }, (_, i) => dayOffset(simulatedCurrentDate, -i)).filter((dStr) => {
    if (dStr < hire) return false;
    const w = (/* @__PURE__ */ new Date(dStr + "T12:00:00Z")).getUTCDay();
    return w !== 0 && w !== 6;
  });
  let attPresent = 0, attLate = 0, attAbsent = 0, attExcused = 0, attMissing = 0;
  recent14.forEach((dStr) => {
    const match = employeeAttendance.find((a) => a.date === dStr);
    const st = match?.status || "Unrecorded";
    if (st === "Present") attPresent++;
    else if (st === "Late") attLate++;
    else if (st === "Absent") attAbsent++;
    else if (st === "Excused") attExcused++;
    else attMissing++;
  });
  const attRecorded = attPresent + attLate + attAbsent + attExcused;
  const attRate = attRecorded ? Math.round((attPresent + attLate) / attRecorded * 100) : 100;
  const fstScoreObj = phaseTrainingScores.find((s) => (s.emp === empKey || s.emp === journey.id) && s.phase === "FST");
  const pstScoreObj = phaseTrainingScores.find((s) => (s.emp === empKey || s.emp === journey.id) && s.phase === "PST");
  const fstScoreVal = fstScoreObj?.score ?? null;
  const pstScoreVal = pstScoreObj?.score ?? null;
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
  const qaEvid = employeeEvidence.filter((e) => e.type === "QDS / QA");
  const qaScoreVal = journey.id === "SIBS-2906" ? 62 : qaEvid.length ? 88 : 84;
  const empProg = progress.filter((p) => p.emp === empKey || p.emp === journey.id);
  const verifiedAssigns = empProg.filter((p) => p.status === "Verified").length;
  const learningPct = employeeAssignments.length ? Math.round(100 * verifiedAssigns / employeeAssignments.length) : 0;
  const day30Score = journey.daysElapsed >= 30 ? Math.round((fstScoreVal || 85) * 0.35 + qaScoreVal * 0.4 + 85 * 0.25) : null;
  const day60Score = journey.daysElapsed >= 60 ? journey.day60.coreProductionScore || 89 : null;
  const day90Score = journey.daysElapsed >= 90 ? journey.day90.compositeScore || 91 : null;
  const timelinePhases = [
    ["Days 1\u201314", "FST \u2014 Fundamental Skill Training", "Assigned Trainer + QDS/QA Lead", 1, 14],
    ["Days 15\u201328", "PST \u2014 Product Skills Training", "Team Leader + Assigned Trainer", 15, 28],
    ["Day 30", "Day 30 Milestone Checkpoint", "Operations Manager + HR Coordinator", 29, 30],
    ["Days 31\u201359", "Supported Operations (Ramp)", "Team Leader", 31, 59],
    ["Day 60", "Day 60 Mid-Probation Checkpoint", "Operations Manager + HR Coordinator", 60, 60],
    ["Days 61\u201389", "Performance Consistency", "Team Leader + Operations Manager", 61, 89],
    ["Day 90+", "Day 90 Onboarding Disposition", "HR Process Owner + Operations Manager", 90, 120]
  ];
  const activePhaseDef = timelinePhases[selectedPhaseIndex];
  const activePhaseInfo = {
    start: dayOffset(hire, activePhaseDef[3] - 1),
    end: dayOffset(hire, activePhaseDef[4] - 1),
    future: dayOffset(hire, activePhaseDef[3] - 1) > simulatedCurrentDate
  };
  const getCheckpointScore = (day) => {
    if (day === 30) return day30Score;
    if (day === 60) return day60Score;
    if (day === 90) return day90Score;
    return null;
  };
  const handleLinkSubmit = (e) => {
    e.preventDefault();
    linkEmployeeProfile(journey.id, linkSibsId, linkTrainerId, linkTrainerName, linkHireDate, linkStartDate);
    setToastMessage("Linked employee profile successfully!");
    setShowLinkModal(false);
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const handleAddAttendanceSubmit = (e) => {
    e.preventDefault();
    addAttendanceRecord({
      emp: empKey,
      date: attDate,
      status: attStatus,
      source: attSource,
      notes: attNotes
    });
    setToastMessage(`Recorded ${attStatus} for ${attDate}`);
    setShowAddAttendance(false);
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const handleAddEvidenceSubmit = (e) => {
    e.preventDefault();
    addEvidenceItem({
      emp: empKey,
      type: evType,
      title: evTitle,
      owner: evOwner,
      notes: evNotes,
      date: simulatedCurrentDate
    });
    setToastMessage(`Added evidence "${evTitle}"`);
    setShowAddEvidence(false);
    setEvTitle("");
    setEvNotes("");
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const handleAddCheckInSubmit = (e) => {
    e.preventDefault();
    addCheckIn({
      emp: empKey,
      date: simulatedCurrentDate,
      type: ciType,
      owner: ciOwner,
      confidence: ciConfidence,
      notes: ciNotes
    });
    setToastMessage("Logged 1-on-1 check-in!");
    setShowAddCheckIn(false);
    setCiNotes("");
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const handleAddCoachingSubmit = (e) => {
    e.preventDefault();
    addCoachingAction({
      emp: empKey,
      title: coachTitle,
      owner: coachOwner,
      due: coachDue,
      status: "Open",
      notes: coachNotes
    });
    setToastMessage("Created coaching support action!");
    setShowAddCoaching(false);
    setCoachTitle("");
    setCoachNotes("");
    setTimeout(() => setToastMessage(null), 3e3);
  };
  const plotY = (val) => Math.round(184 - val / 100 * 150);
  const plotX = [120, 270, 420];
  const trendScores = [day30Score, day60Score, day90Score];
  const points = trendScores.map((sc, idx) => sc !== null ? { x: plotX[idx], score: sc } : null).filter(Boolean);
  if (!isOpen || !journey) return null;

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      variant="navy"
      maxWidth="max-w-[1600px]"
      className="h-[94dvh] !max-h-[94dvh]"
      icon={User}
      title={journey.fullName}
      badge={emphasizedStatus.label}
      subtitle={`SIB ID: ${journey.sibsEmployeeId || "Not Linked"} • Kronos ID: ${journey.kronosId || "Not Linked"} • Account: ${journey.account} • Trainer: ${journey.trainerName || "Unassigned"} • WFM Station: ${journey.wfmSeating ? `${journey.wfmSeating.wing} • ${journey.wfmSeating.seatNumber}` : "Pending"}`}
      headerActions={
        onUpdateStage ? <button type="button" onClick={onUpdateStage} className="sibs-modal-btn-primary">Update Stage</button> : journey.isAwaitingLinkage ? (
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="sibs-btn-primary h-8 px-3 text-xs font-bold gap-1.5"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Authorize Linkage</span>
          </button>
        ) : null
      }
      bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-sibs-surface p-0 font-jakarta flex flex-col"
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between font-jakarta">
          <p className="sibs-text-xs leading-relaxed text-sibs-muted sm:max-w-xl">
            Employee journey milestone records are authoritative across L&amp;D, QDS, and Operations.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-btn-secondary"
          >
            Close Journey
          </button>
        </div>
      }
    >
      {/* 7 Horizontal Navigation Tabs */}
      <StatusFilterTabs
        tabs={[
          { id: "timeline", icon: Clock, label: "Journey Timeline" },
          { id: "attendance", icon: Calendar, label: "Attendance & Absenteeism" },
          { id: "evidence", icon: ShieldCheck, label: "Evidence Library" },
          { id: "checkins", icon: CheckSquare, label: "Check-ins" },
          { id: "coaching", icon: HeartHandshake, label: "Coaching & Support" },
          { id: "reviews", icon: Award, label: "30 / 60 / 90 Reviews" },
          { id: "handoffs", icon: ArrowRightLeft, label: "Handoffs", count: emphasizedStatus.isHandoffDue ? 1 : undefined, showCount: emphasizedStatus.isHandoffDue },
        ].filter((tab) => !profileMode || ["timeline", "coaching", "handoffs"].includes(tab.id))}
        activeValue={activeTab}
        onChange={setActiveTab}
        layoutId="employeeJourneyProfileTabs"
        className="shrink-0 flex-wrap !overflow-visible"
      />

      {
    /* Post-FST Handoff High-Priority Alert Banner for HR and Supervisors */
  }
        {emphasizedStatus.isHandoffDue && emphasizedStatus.handoffStatus === "Pending" && <div className="border-b border-sibs-border bg-sibs-cream-light px-4 py-3 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sibs-text-xs text-sibs-navy shrink-0">
            <div className="flex items-start sm:items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sibs-orange text-white font-black text-xs shadow-xs animate-pulse">
                !
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sibs-orange font-black uppercase tracking-wider text-[11px]">
                    Post-FST Checkpoint Handoff Due • HR &amp; Supervisor Action Required
                  </strong>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-sibs-orange border border-orange-200">
                    FST Fundamentals Complete (Days 1–14)
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-600 mt-0.5">
                  Trainee has completed Fundamental Skill Training (FST Days 1–14). Trainer {journey.trainerName || "Maria Cruz"} must endorse custody transfer to Team Leader {journey.tl || "Anton Reyes"} before Product Skills Training (PST Days 15–28). HR has been notified.
                </p>
              </div>
            </div>
            <button
    type="button"
    onClick={() => setActiveTab("handoffs")}
    className="sibs-modal-btn-primary shrink-0 self-start lg:self-center"
  >
              <span>Perform Handoff</span>
              <span>→</span>
            </button>
          </div>}

        {emphasizedStatus.isHandoffDue && emphasizedStatus.handoffStatus === "Submitted" && <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sibs-text-xs text-sibs-navy shrink-0">
            <div className="flex items-start sm:items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-xs shadow-xs">
                ⏳
              </span>
              <div>
                <strong className="text-amber-800 font-black uppercase tracking-wider text-[11px] block">
                  Awaiting Team Leader Sign-Off & Custody Acceptance
                </strong>
                <p className="text-[11.5px] text-amber-900/80 mt-0.5">
                  Endorsed by Trainer {journey.day30Handoff?.trainerName || journey.trainerName}. Team Leader {journey.day30Handoff?.targetTlName || journey.tl || "Anton Reyes"} must sign off and accept custody into Ramp operations.
                </p>
              </div>
            </div>
            <button
    type="button"
    onClick={() => setActiveTab("handoffs")}
    className="sibs-modal-btn-primary shrink-0 self-start lg:self-center"
  >
              <span>Accept Custody</span>
              <span>→</span>
            </button>
          </div>}

        {
    /* Toast Feedback */
  }
        {toastMessage && <div className="sibs-tone-green-bg border-b sibs-tone-green-border sibs-tone-green-text text-xs px-6 py-2 flex items-center justify-between shrink-0">
            <span className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {toastMessage}
            </span>
          </div>}

        {
    /* Scrollable Container */
  }
        <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6 space-y-4">

          {
    /* Overview belongs to Journey Timeline, not every drilldown tab. */
  }
          {profileMode && activeTab === "timeline" && <Review306090Modal journey={journey} isOpen={isOpen} onClose={onClose} embedded />}
          {!profileMode && activeTab === "timeline" && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-sibs-orange tracking-widest block">EMPLOYEE PERFORMANCE RESULTS</span>
                <h3 className="text-base font-extrabold text-sibs-navy">Training & Milestone Performance</h3>
                <p className="text-xs text-slate-500">Phase assessment results, independent quality evidence, attendance, and 30–60–90 checkpoint trends for {journey.fullName}.</p>
              </div>
              <button
    onClick={() => setActiveTab("reviews")}
    className="px-3 py-1.5 rounded-xl border border-sibs-border-subtle bg-sibs-surface hover:bg-slate-100 font-semibold text-xs text-sibs-navy cursor-pointer shadow-xs self-start sm:self-auto transition-colors"
  >
                Open Checkpoint Reviews
              </button>
            </div>

            {
    /* 4 KPI Cards */
            }
            <MetricGrid columns={4}>
              <MetricCard
                label="Latest Assessed Checkpoint"
                value={day30Score ? `${day30Score}%` : "N/A"}
                description={day30Score ? "Day 30 checkpoint • High" : "No completed checkpoint"}
                tone="navy"
                icon={Clock}
              />
              <MetricCard
                label="Latest Independent QA"
                value={`${qaScoreVal}%`}
                description="Audited recently"
                tone="green"
                icon={ShieldCheck}
              />
              <MetricCard
                label="Attendance • Last 14 Days"
                value={`${attRate}%`}
                description={`${attAbsent} absent • ${attExcused} excused • ${attMissing} missing`}
                tone={attAbsent > 0 ? "amber" : "navy"}
                icon={Calendar}
              />
              <MetricCard
                label="Learning Activities Verified"
                value={employeeAssignments.length ? `${verifiedAssigns} / ${employeeAssignments.length}` : "N/A"}
                description={`${learningPct}% verified by assigned owner`}
                tone="orange"
                icon={Award}
              />
            </MetricGrid>

            {
    /* Main Viz & FST/PST Split */
  }
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {
    /* SVG Trend Line Panel */
  }
              <div className="border border-sibs-border rounded-xl p-4 bg-sibs-surface space-y-3">
                <h4 className="text-xs font-bold text-sibs-navy">30 / 60 / 90 Performance Trend</h4>
                <p className="text-[11px] text-slate-500">Checkpoint composite scores from eligible, complete phase scorecards only.</p>

                {
    /* SVG Chart */
  }
                <svg className="w-full h-auto max-h-48 overflow-visible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 222">
                  <line x1="57" x2="496" y1={plotY(85)} y2={plotY(85)} stroke="var(--color-sibs-border, #e6ecf2)" strokeDasharray="4 5" />
                  <text x="12" y={plotY(85) + 4} fill="var(--color-sibs-muted, #667085)" fontSize="12">85%</text>

                  <line x1="57" x2="496" y1={plotY(70)} y2={plotY(70)} stroke="var(--color-sibs-border, #e6ecf2)" strokeDasharray="4 5" />
                  <text x="12" y={plotY(70) + 4} fill="var(--color-sibs-muted, #667085)" fontSize="12">70%</text>

                  <line x1="57" x2="496" y1={plotY(0)} y2={plotY(0)} stroke="var(--color-sibs-border, #e6ecf2)" />
                  <text x="12" y={plotY(0) + 4} fill="var(--color-sibs-muted, #667085)" fontSize="12">0%</text>

                  {points.length > 1 && <polyline
    points={points.map((pt) => `${pt.x},${plotY(pt.score)}`).join(" ")}
    fill="none"
    stroke="var(--color-sibs-navy, #042c51)"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  />}

                  {[
    { day: 30, score: day30Score, x: plotX[0], rev: journey.day30.status },
    { day: 60, score: day60Score, x: plotX[1], rev: journey.day60.status },
    { day: 90, score: day90Score, x: plotX[2], rev: journey.day90.status }
  ].map((pt) => {
    const valid = pt.score !== null;
    const y = valid ? plotY(pt.score) : 184;
    return <g key={pt.day}>
                        {valid ? <>
                            <circle cx={pt.x} cy={y} r="7" fill="var(--color-sibs-orange, #ff5c28)" stroke="#fff" strokeWidth="3" />
                            <text textAnchor="middle" x={pt.x} y={Math.max(17, y - 17)} fill="var(--color-sibs-navy, #042c51)" fontSize="14" fontWeight="800">
                              {pt.score}%
                            </text>
                          </> : <circle cx={pt.x} cy="184" r="5" fill="var(--color-sibs-border-subtle, #d7dee8)" />}
                        <text textAnchor="middle" x={pt.x} y="210" fill="var(--color-sibs-navy, #042c51)" fontSize="12" fontWeight="700">
                          Day {pt.day}
                        </text>
                      </g>;
  })}
                </svg>

                {
    /* Benchmark Strip */
  }
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
    { day: 30, score: day30Score, status: journey.day30.status },
    { day: 60, score: day60Score, status: journey.day60.status },
    { day: 90, score: day90Score, status: journey.day90.status }
  ].map((b) => <button
    key={b.day}
    onClick={() => {
      setActiveTab("reviews");
    }}
    className="p-2 border border-sibs-border rounded-lg bg-white text-left hover:bg-sibs-surface cursor-pointer transition-colors"
  >
                      <span className="text-[10px] text-slate-500 font-bold block">DAY {b.day}</span>
                      <strong className="text-base font-extrabold text-sibs-navy block my-0.5">
                        {b.score ? b.score + "%" : "Upcoming"}
                      </strong>
                      <span className="sibs-text-micro text-slate-400 block">{b.status}</span>
                      <div className="w-full h-1.5 bg-[#E6EAF0] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-sibs-orange rounded-full" style={{ width: `${b.score || 0}%` }} />
                      </div>
                    </button>)}
                </div>
              </div>

              {
    /* FST & PST Progress Bars Panel */
  }
              <div className="border border-sibs-border rounded-xl p-4 bg-sibs-surface space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-sibs-navy">First 30 Days • FST & PST</h4>
                  <p className="text-[11px] text-slate-500">Individual training phase assessments. These remain separate from the Day 30 checkpoint composite.</p>

                  <div className="space-y-3 mt-3">
                    {
    /* FST */
  }
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-sibs-navy">FST <span className="text-[10px] font-normal text-slate-500">Fundamental Skill Training</span></strong>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sibs-navy">{fstScoreVal !== null ? fstScoreVal + "%" : "Not scored"}</span>
                          <button
    type="button"
    onClick={() => setSelectedProcessModal("FST")}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-sibs-navy bg-white border border-sibs-border-subtle hover:border-sibs-orange hover:text-sibs-orange shadow-2xs transition-colors cursor-pointer"
    title="Open Full View of FST Process"
  >
                            <Eye size={10} className="text-sibs-orange" />
                            <span>Full View</span>
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#E6EAF0] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-sibs-navy rounded-full" style={{ width: `${fstScoreVal || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Phase 1 (Days 1–14) assessment</span>
                    </div>

                    {
    /* PST */
  }
                    <div>
                      <div className="flex justify-between items-center text-xs">
                        <strong className="text-sibs-navy">PST <span className="text-[10px] font-normal text-slate-500">Product Skills Training</span></strong>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sibs-orange">{pstScoreVal !== null ? pstScoreVal + "%" : "Not scored"}</span>
                          <button
    type="button"
    onClick={() => setSelectedProcessModal("PST")}
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-sibs-navy bg-white border border-sibs-border-subtle hover:border-sibs-orange hover:text-sibs-orange shadow-2xs transition-colors cursor-pointer"
    title="Open Full View of PST Process"
  >
                            <Eye size={10} className="text-sibs-orange" />
                            <span>Full View</span>
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#E6EAF0] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-sibs-orange rounded-full" style={{ width: `${pstScoreVal || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Phase 2 (Days 15–28) assessment</span>
                    </div>
                  </div>
                </div>

                {
    /* Verified Completion Bar */
  }
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <strong className="text-sibs-navy">Verified learning completion</strong>
                    <span className="font-bold text-sibs-orange">{learningPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E6EAF0] rounded-full overflow-hidden">
                    <div className="h-full bg-sibs-orange rounded-full" style={{ width: `${learningPct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {verifiedAssigns} of {employeeAssignments.length} assigned activities verified by owner.
                  </span>
                </div>
              </div>
            </div>
          </div>}

          {
    /* TAB 1: JOURNEY TIMELINE (WITH 7 CLICKABLE TIMELINE PHASES) */
  }
          {!profileMode && activeTab === "timeline" && <div className="space-y-6">
              
              {
    /* 7 CLICKABLE JOURNEY PHASES STRIP */
  }
              <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-sibs-navy uppercase tracking-wider">7 Journey Timeline Phases</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Click any phase to inspect details</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[
    ["Days 1\u201314", "FST \u2013 Fundamental", "Trainer + QDS/QA", 14],
    ["Days 15\u201328", "PST \u2013 Product", "Team Leader + Trainer", 28],
    ["Day 30", "Checkpoint", "Manager + HR", 30],
    ["Days 31\u201359", "Operations", "Team Leader", 59],
    ["Day 60", "Checkpoint", "Manager + HR", 60],
    ["Days 61\u201389", "Consistency", "TL / Manager", 89],
    ["Day 90+", "HR disposition", "Manager + HR", 90]
  ].map(([date, name, owner, last], i) => {
    const daysElapsed = journey.daysElapsed || 1;
    const prevEnd = i === 0 ? 0 : [14, 28, 30, 59, 60, 89][i - 1];
    const active = daysElapsed >= (i === 2 ? 29 : i === 0 ? 1 : prevEnd + 1) && daysElapsed <= Number(last);
    const isSelected = selectedPhaseIndex === i;
    const isFstHandoffDue = i === 0 && (journey.day30Handoff?.status !== "Accepted" && daysElapsed >= 14);
    return <button
      key={i}
      type="button"
      onClick={() => setSelectedPhaseIndex(i)}
      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative min-h-[110px] ${isSelected ? "bg-[#E9F0FC] border-2 border-sibs-navy shadow-xs" : active ? "bg-sibs-surface border-2 border-sibs-navy" : "bg-sibs-surface border-sibs-border hover:border-sibs-orange"}`}
    >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-500 block">{date}</span>
                            {isFstHandoffDue && <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-sibs-orange text-white">
                                Handoff Due
                              </span>}
                          </div>
                          <strong className="text-xs font-extrabold text-sibs-navy block mt-1 leading-snug">{name}</strong>
                          <span className="sibs-text-micro text-slate-500 block mt-1">{owner}</span>
                        </div>

                        <span className="text-[10px] font-extrabold text-sibs-orange mt-2 block">
                          {isSelected ? "Viewing \u2192" : "Inspect \u2192"}
                        </span>
                      </button>;
  })}
                </div>
                <p className="text-[10px] text-slate-400">
                  Days 1–14: FST (Fundamental Skill Training). Days 15–28: PST (Product Skills Training). Day 29 prepares for the Day 30 checkpoint. Select a phase to view its specific training materials, assessments, audits, or review outcomes.
                </p>
              </div>

              {
    /* ACTIVE PHASE DETAILS PANEL */
  }
              <div className="bg-white rounded-2xl border border-sibs-border p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-sibs-orange tracking-widest block">
                      SELECTED JOURNEY PHASE • {dateLabel(activePhaseInfo.start)} – {dateLabel(activePhaseInfo.end)}
                    </span>
                    <h3 className="text-lg font-black text-sibs-navy mt-0.5">{activePhaseDef[0]}</h3>
                    <p className="text-xs text-slate-500 mt-1">{activePhaseDef[1]}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${activePhaseInfo.future ? "bg-slate-100 text-slate-600" : "sibs-tone-blue-bg sibs-tone-blue-text border sibs-tone-blue-border"}`}>
                    {activePhaseInfo.future ? "Upcoming Phase" : "Phase Records"}
                  </span>
                </div>

                {
    /* Phase Specific Content */
  }
                {selectedPhaseIndex === 0 || selectedPhaseIndex === 1 ? <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block">Phase Assessment</span>
                        <strong className="text-2xl font-black text-sibs-navy my-1 block">
                          {selectedPhaseIndex === 0 ? fstScoreVal !== null ? fstScoreVal + "%" : "Not scored" : pstScoreVal !== null ? pstScoreVal + "%" : "Not scored"}
                        </strong>
                        <span className="text-[10px] text-slate-400">Recorded phase score</span>
                      </div>

                      <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block">Training Activities</span>
                        <strong className="text-2xl font-black text-sibs-navy my-1 block">
                          {employeeAssignments.length}
                        </strong>
                        <span className="text-[10px] text-slate-400">{verifiedAssigns} verified</span>
                      </div>

                      <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block">Independent QA Audits</span>
                        <strong className="text-2xl font-black text-sibs-navy my-1 block">
                          {qaEvid.length}
                        </strong>
                        <span className="text-[10px] text-slate-400">Audits recorded</span>
                      </div>
                    </div>

                    <div className="p-4 bg-sibs-surface border border-sibs-border rounded-xl space-y-2">
                      <h4 className="text-xs font-extrabold text-sibs-navy">
                        {selectedPhaseIndex === 0 ? "FST Phase Materials & Tasks" : "PST Phase Materials & Tasks"}
                      </h4>
                      {employeeAssignments.length === 0 ? <p className="text-xs text-slate-400 italic">No training materials assigned in this phase.</p> : <div className="space-y-2 text-xs">
                          {employeeAssignments.slice(0, 4).map((a) => <div key={a.id} className="p-2.5 bg-white border border-sibs-border rounded-lg flex items-center justify-between">
                              <div>
                                <strong className="text-sibs-navy">{a.title}</strong>
                                <span className="text-[10px] text-slate-400 block">{a.type} • {a.duration} • By {a.owner}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {a.priority}
                              </span>
                            </div>)}
                        </div>}
                    </div>
                  </div> : [2, 4, 6].includes(selectedPhaseIndex) ? <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block">Checkpoint Result</span>
                        <strong className="text-2xl font-black text-sibs-navy my-1 block">
                          {getCheckpointScore(selectedPhaseIndex === 2 ? 30 : selectedPhaseIndex === 4 ? 60 : 90) ? getCheckpointScore(selectedPhaseIndex === 2 ? 30 : selectedPhaseIndex === 4 ? 60 : 90) + "%" : "Not scored"}
                        </strong>
                        <span className="text-[10px] text-slate-400">Formal milestone score</span>
                      </div>

                      <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block">Independent QA</span>
                        <strong className="text-2xl font-black text-sibs-navy my-1 block">{qaScoreVal}%</strong>
                        <span className="text-[10px] text-slate-400">QDS / QA evidence</span>
                      </div>

                      <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold block">Review Status</span>
                        <strong className="text-base font-black text-sibs-navy my-1 block">
                          {journey.reviews?.[selectedPhaseIndex === 2 ? 30 : selectedPhaseIndex === 4 ? 60 : 90]?.decision || "Pending Review"}
                        </strong>
                        <span className="text-[10px] text-slate-400">Manager & HR outcome</span>
                      </div>
                    </div>

                    {
    /* Day 30 Specific: Trainer to Team Leader Handoff Feature */
  }
                    {selectedPhaseIndex === 2 && <div className="pt-2">
                        <Day30HandoffCard
    journey={journey}
    onUpdateSuccess={(msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    }}
  />
                      </div>}
                  </div> : <div className="p-4 bg-sibs-surface border border-sibs-border rounded-xl text-xs text-slate-600 space-y-2">
                    <strong className="text-sibs-navy block">Operational Support Phase</strong>
                    <p>Production monitoring, coaching check-ins, and performance consistency tracking.</p>
                  </div>}
              </div>
            </div>}

          {
    /* TAB 2: ATTENDANCE */
  }
          {activeTab === "attendance" && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-sibs-navy">Attendance & Biometric History</h3>
                  <p className="text-xs text-slate-500">Log and verify attendance records for {journey.fullName}.</p>
                </div>
                <button
    onClick={() => setShowAddAttendance(true)}
    className="px-3 py-1.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
  >
                  + Record Attendance
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-sibs-border bg-sibs-surface text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">14-Day Rate</span>
                  <strong className="text-xl font-black text-sibs-navy block mt-0.5">{attRate}%</strong>
                </div>
                <div className="p-3 rounded-xl border border-sibs-border bg-sibs-surface text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Present</span>
                  <strong className="text-xl font-black text-[#2ECC71] block mt-0.5">{attPresent}</strong>
                </div>
                <div className="p-3 rounded-xl border border-sibs-border bg-sibs-surface text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Late</span>
                  <strong className="text-xl font-black text-[#E67E22] block mt-0.5">{attLate}</strong>
                </div>
                <div className="p-3 rounded-xl border border-sibs-border bg-sibs-surface text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Absent / Excused</span>
                  <strong className="text-xl font-black text-[#E74C3C] block mt-0.5">{attAbsent + attExcused}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sibs-surface text-slate-500 font-bold text-[10px] uppercase border-b border-sibs-border">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeeAttendance.map((a) => <tr key={a.id} className="hover:bg-sibs-cream-light transition-colors">
                        <td className="py-2.5 px-3 font-bold text-sibs-navy">{a.date}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === "Present" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : a.status === "Late" ? "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border" : "sibs-tone-red-bg sibs-tone-red-text border sibs-tone-red-border"}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{a.source}</td>
                        <td className="py-2.5 px-3 text-slate-500">{a.notes || "\u2014"}</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>}

          {
    /* TAB 3: EVIDENCE */
  }
          {activeTab === "evidence" && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-sibs-navy">Evidence Library</h3>
                  <p className="text-xs text-slate-500">Scored quality audits, training records, and coaching artifacts.</p>
                </div>
                <button
    onClick={() => setShowAddEvidence(true)}
    className="px-3 py-1.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
  >
                  + Add Evidence
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {employeeEvidence.map((ev) => <div key={ev.id} className="p-4 rounded-xl border border-sibs-border bg-white space-y-1 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-sibs-orange">{ev.type}</span>
                      <span className="text-[10px] text-slate-400">{ev.date}</span>
                    </div>
                    <strong className="text-xs font-bold text-sibs-navy block">{ev.title}</strong>
                    <p className="text-xs text-slate-600">{ev.notes}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">Owner: {ev.owner}</span>
                  </div>)}
              </div>
            </div>}

          {
    /* TAB 4: CHECKINS */
  }
          {activeTab === "checkins" && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-sibs-navy">1-on-1 Touchpoints & Check-ins</h3>
                  <p className="text-xs text-slate-500">Logged conversations between employee and supervisors.</p>
                </div>
                <button
    onClick={() => setShowAddCheckIn(true)}
    className="px-3 py-1.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
  >
                  + Log Check-in
                </button>
              </div>

              <div className="space-y-3">
                {employeeCheckIns.map((c) => <div key={c.id} className="p-4 rounded-xl border border-sibs-border bg-sibs-surface space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-sibs-navy">{c.type} Touchpoint</span>
                      <span className="text-[10px] text-slate-400">{c.date}</span>
                    </div>
                    <p className="text-xs text-sibs-navy font-medium">{c.notes}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Owner: {c.owner}</span>
                      <span>Confidence Score: <strong>{c.confidence} / 5</strong></span>
                    </div>
                  </div>)}
              </div>
            </div>}

          {
    /* TAB 5: COACHING & SUPPORT */
  }
          {activeTab === "coaching" && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-5">
              {
    /* Top Bar with Role View Mode Toggle */
  }
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-sibs-orange tracking-widest block">
                      GROW FRAMEWORK & PERFORMANCE RECOVERY
                    </span>
                    {isViewingAsCoach && <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-sibs-navy text-white flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-sibs-orange" />
                        Coach-Only Mode
                      </span>}
                  </div>
                  <h3 className="text-base font-extrabold text-sibs-navy">Coaching & Corrective Support</h3>
                  <p className="text-xs text-slate-500">
                    Supervisory GROW diagnostics, 23 QA parameters, KPI impact, and action items.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {
    /* Interactive Coach / Trainee Role Switcher */
  }
                  <div className="flex items-center rounded-xl bg-sibs-surface border border-sibs-border-subtle p-1 text-xs shadow-2xs">
                    <button
    type="button"
    onClick={() => setCoachModeOverride("coach")}
    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${isViewingAsCoach ? "bg-sibs-navy text-white shadow-2xs" : "text-slate-600 hover:text-sibs-navy"}`}
    title="Switch to Coach/Supervisor Confidential View"
  >
                      <ShieldCheck className="w-3.5 h-3.5 text-sibs-orange" />
                      <span>Coach Overview</span>
                    </button>
                    <button
    type="button"
    onClick={() => setCoachModeOverride("trainee")}
    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${!isViewingAsCoach ? "bg-sibs-orange text-white shadow-2xs" : "text-slate-600 hover:text-sibs-navy"}`}
    title="Switch to Trainee View (Employee Action Items)"
  >
                      <User className="w-3.5 h-3.5" />
                      <span>Trainee View</span>
                    </button>
                  </div>

                  {isViewingAsCoach && <button
    type="button"
    onClick={() => setShowAddCoaching(true)}
    className="px-3 py-1.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
  >
                      + Add Action
                    </button>}
                </div>
              </div>

              {
    /* COACH-ONLY CONFIDENTIAL OVERVIEW (Visible only to Coaches, Trainers, TLs, Managers, QDS, and HR) */
  }
              {isViewingAsCoach ? <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-sibs-navy/20 bg-gradient-to-b from-sibs-surface to-white p-5 shadow-xs space-y-4 relative overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-sibs-navy via-[#c24b30] to-sibs-orange absolute top-0 left-0" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sibs-navy text-white">
                            <Lock className="w-3 h-3 text-sibs-orange" />
                          </span>
                          <h4 className="text-sm font-black text-sibs-navy tracking-tight">
                            Coaches & Supervisors Confidential Overview
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Authorized Access
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Private facilitator notes, GROW framework diagnostics, 23 QA parameter flags, and pre/post KPI impact. Shielded from standard employee view.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
    type="button"
    onClick={() => setShowEsepDetails(true)}
    className="rounded-xl border border-sibs-navy bg-sibs-navy text-white px-3.5 py-1.5 text-xs font-bold hover:bg-sibs-tertiary-2 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
  >
                          <ShieldCheck className="w-3.5 h-3.5 text-sibs-orange" />
                          <span>View Full GROW Form & Results →</span>
                        </button>
                      </div>
                    </div>

                    {
    /* 4 Coaching Impact KPI Metrics */
  }
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 rounded-xl border border-sibs-border bg-white">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Documented Sessions</span>
                        <strong className="text-xl font-black text-sibs-navy my-0.5 block">{employeeEsepSessions.length}</strong>
                        <span className="text-[10px] text-slate-500">Read-only ESEP records</span>
                      </div>
                      <div className="p-3 rounded-xl border border-sibs-border bg-white">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Evaluated Follow-ups</span>
                        <strong className="text-xl font-black text-emerald-700 my-0.5 block">{evaluatedEsepCount} / {employeeEsepSessions.length}</strong>
                        <span className="text-[10px] text-slate-500">Effectiveness verified</span>
                      </div>
                      <div className="p-3 rounded-xl border border-sibs-border bg-white">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">QA Parameters Evaluated</span>
                        <strong className="text-xl font-black text-sibs-navy my-0.5 block">23 Matrix</strong>
                        <span className="text-[10px] text-slate-500">Root-cause mapping</span>
                      </div>
                      <div className="p-3 rounded-xl border border-sibs-border bg-white">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Latest QA Trigger</span>
                        <strong className="text-xl font-black text-sibs-orange my-0.5 block">{qaScoreVal}%</strong>
                        <span className="text-[10px] text-slate-500">Target benchmark: 85%</span>
                      </div>
                    </div>

                    {
    /* Active ESEP Session Summary Cards */
  }
                    {employeeEsepSessions.length > 0 ? <div className="space-y-3 pt-1">
                        {employeeEsepSessions.map((session) => {
    const effect = evaluationFor(session, esepEvaluations);
    const comparison = kpiComparison(effect);
    const status = coachingStatus(session, esepEvaluations, simulatedCurrentDate);
    return <div key={session.id} className="rounded-xl border border-[#DBE8F4] bg-white p-4 text-xs space-y-2 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                    ESEP-{session.id}
                                  </span>
                                  <strong className="text-xs font-black text-sibs-navy">{session.type}</strong>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-slate-500 font-semibold">{session.date}</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${status === "Evaluated" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : status === "Overdue" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                  {status}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-slate-600">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Facilitator / Supervisor</span>
                                  <strong className="text-sibs-navy">{session.facilitator}</strong> ({session.facilitatorRole})
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Coaching Reason(s)</span>
                                  <span className="font-semibold text-slate-700">{session.reasons?.join(", ") || "QA Calibration & Efficiency"}</span>
                                </div>
                              </div>

                              {
      /* GROW Summary Compact Grid */
    }
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                <div className="p-2 rounded-lg bg-sibs-surface border border-sibs-border">
                                  <strong className="text-sibs-navy block text-[10px] uppercase">G • Goal</strong>
                                  <p className="line-clamp-2 text-slate-600 mt-0.5">{session.goal || "Floor accuracy & adherence"}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-sibs-surface border border-sibs-border">
                                  <strong className="text-sibs-navy block text-[10px] uppercase">R • Reality</strong>
                                  <p className="line-clamp-2 text-slate-600 mt-0.5">{session.reality || "Observed pacing variance"}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-sibs-surface border border-sibs-border">
                                  <strong className="text-sibs-navy block text-[10px] uppercase">O • Options</strong>
                                  <p className="line-clamp-2 text-slate-600 mt-0.5">{session.options || "Knowledgebase drills & call shadowing"}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-sibs-surface border border-sibs-border">
                                  <strong className="text-sibs-navy block text-[10px] uppercase">W • Will</strong>
                                  <p className="line-clamp-2 text-slate-600 mt-0.5">{session.will || "Trainee commits to script checklist"}</p>
                                </div>
                              </div>

                              {comparison && <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-emerald-900">Recorded KPI Impact Delta:</span>
                                  <span className="font-mono font-bold text-emerald-800">
                                    Before: {comparison.before} → After: {comparison.after} ({comparison.differenceLabel})
                                  </span>
                                </div>}
                            </div>;
  })}
                      </div> : <div className="rounded-xl border border-dashed border-sibs-border-subtle p-5 text-center text-xs text-slate-500">
                        No ESEP coaching records currently logged for this trainee. Coaches may log a new session using the GROW form.
                      </div>}
                  </div>
                </div> : (
    /* TRAINEE-FACING VIEW: Safe from confidential notes and private supervisor evaluations */
    <div className="space-y-4">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-sibs-navy space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-sibs-orange" />
                      <strong className="font-black text-sm">My Personalized Growth & Action Plan</strong>
                    </div>
                    <p className="text-slate-600 text-[11.5px]">
                      Here are your actionable growth items and practice assignments assigned by your Trainer and Team Leader. Complete each item to strengthen your floor readiness.
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-[10.5px] text-slate-500">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Confidential supervisor diagnostic evaluations and calibration notes are kept private to authorized coaches.</span>
                    </div>
                  </div>
                </div>
  )}

              {
    /* ACTION ITEMS SECTION (Visible in both views, with appropriate controls) */
  }
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-sibs-navy tracking-wider">
                    Assigned Action Items & Follow-ups ({employeeCoaching.length})
                  </h4>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {employeeCoaching.filter((c) => c.status === "Done").length} of {employeeCoaching.length} completed
                  </span>
                </div>

                {employeeCoaching.length > 0 ? employeeCoaching.map((co) => <div key={co.id} className="p-4 rounded-xl border border-sibs-border bg-white flex items-center justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-sibs-navy">{co.title}</strong>
                          <span className={`px-2 py-0.2 rounded sibs-text-micro font-bold ${co.status === "Done" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border"}`}>
                            {co.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{co.notes}</p>
                        <span className="text-[10px] text-slate-400 block">Owner: {co.owner} • Due: {co.due}</span>
                      </div>

                      <button
    onClick={() => toggleCoachingAction(co.id)}
    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs ${co.status === "Done" ? "bg-white border border-sibs-border-subtle text-sibs-navy hover:bg-sibs-surface" : "bg-sibs-orange hover:bg-sibs-button-hover text-white"}`}
  >
                        {co.status === "Done" ? "Reopen Action" : "Mark Complete"}
                      </button>
                    </div>) : <p className="rounded-xl border border-dashed border-sibs-border-subtle p-4 text-xs text-slate-500 text-center">
                    No open action items assigned to this employee.
                  </p>}
              </div>

              {showEsepDetails && <TrainerCoachingDetailsModal
    employee={journey}
    sessions={esepSessions}
    evaluations={esepEvaluations}
    asOf={simulatedCurrentDate}
    onClose={() => setShowEsepDetails(false)}
  />}
            </div>}

          {
    /* TAB 6: REVIEWS (30 / 60 / 90) */
  }
          {activeTab === "reviews" && <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-sibs-navy">30 / 60 / 90 Milestone Evaluations</h3>
                <p className="text-xs text-slate-500">Formal manager and HR checkpoint sign-offs.</p>
              </div>

              {
    /* Day 30 Review Card */
  }
              <div className="p-5 rounded-2xl border border-sibs-border bg-sibs-surface space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black text-sibs-navy">Day 30 Checkpoint</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${journey.day30.status === "Completed" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border"}`}>
                    {journey.day30.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Nesting QA Score</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day30.nestingQaScore || 85}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Attendance Adherence</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day30.attendancePunctualityScore || 98}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Trainer Endorsement</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day30.trainerEndorsement || "Floor Ready"}</strong>
                  </div>
                </div>
              </div>

              {
    /* Day 60 Review Card */
  }
              <div className="p-5 rounded-2xl border border-sibs-border bg-sibs-surface space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black text-sibs-navy">Day 60 Checkpoint</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${journey.day60.status === "Completed" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border"}`}>
                    {journey.day60.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Core Production Score</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day60.coreProductionScore || 89}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Average Handle Time (AHT)</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day60.averageHandleTimeSeconds || 380}s</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Supervisor Decision</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day60.midProbationDecision || "Progressing Well"}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">ESEP Coaching Undergone:</span>
                  <span className="font-bold text-sibs-navy">
                    {employeeEsepSessions.length > 0 ? `${employeeEsepSessions.length} Session(s) Recorded \u2022 Measured KPI Lift: 78 \u2192 84 (+6)` : "0 Remedial Sessions Required (Clean Ramp)"}
                  </span>
                </div>
              </div>

              {
    /* Day 90 Review Card */
  }
              <div className="p-5 rounded-2xl border border-sibs-border bg-sibs-surface space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black text-sibs-navy">Day 90 Regularization Disposition</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${journey.day90.status === "Completed" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border"}`}>
                    {journey.day90.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Composite Score</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day90.compositeScore || 91}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Performance Rating</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.day90.overallPerformanceRating || 4} / 5</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-bold block">Final Recommendation</span>
                    <strong className="text-base font-black text-sibs-navy">{journey.finalOutcome || "Endorse for Regularization"}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold">Probationary Coaching Clearance:</span>
                  <span className="font-bold text-emerald-700">
                    {employeeEsepSessions.length > 0 ? "All GROW Commitments Cleared with Measured Improvement" : "Met All Benchmarks Autonomously"}
                  </span>
                </div>
              </div>
            </div>}

          {
    /* TAB 7: HANDOFFS */
  }
          {activeTab === "handoffs" && <div className="space-y-4">
              {
    /* Day 30 Trainer -> Team Leader Handoff Card */
  }
              <Day30HandoffCard
    journey={journey}
    onUpdateSuccess={(msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    }}
  />

              {
    /* Complete Journey Handoff Lifecycle Overview */
  }
              <div className="bg-white rounded-2xl border border-sibs-border p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-sibs-navy">Employee Transition Lifecycle</h3>
                  <p className="text-xs text-slate-500">Track onboarding stages from NHO through 90-day regularization.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-sibs-border bg-sibs-surface flex items-center justify-between">
                    <div>
                      <strong className="text-sibs-navy block">1. NHO → Employee Journey Handoff</strong>
                      <span className="text-slate-500 text-[11px]">Accepted by HR Coordinator: {journey.nhoAcceptedBy || "System"}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border">
                      Completed
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-sibs-border bg-sibs-surface flex items-center justify-between">
                    <div>
                      <strong className="text-sibs-navy block">2. Training → Operations Handoff (Day 30 Checkpoint)</strong>
                      <span className="text-slate-500 text-[11px]">
                        Trainer: {journey.day30Handoff?.trainerName || journey.trainerName || "Trainer"} ➔ Team Leader: {journey.day30Handoff?.targetTlName || journey.tl || "Team Leader"}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${journey.day30Handoff?.status === "Accepted" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : journey.day30Handoff?.status === "Submitted" ? "sibs-tone-blue-bg sibs-tone-blue-text border sibs-tone-blue-border" : "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border"}`}>
                      {journey.day30Handoff?.status || "Pending"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-sibs-border bg-sibs-surface flex items-center justify-between">
                    <div>
                      <strong className="text-sibs-navy block">3. Day 90 Regularization Contract Issuance</strong>
                      <span className="text-slate-500 text-[11px]">Operations Manager & HR Sign-off</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${journey.daysElapsed >= 90 && journey.day90?.status === "Completed" ? "sibs-tone-green-bg sibs-tone-green-text border sibs-tone-green-border" : "sibs-tone-amber-bg sibs-tone-amber-text border sibs-tone-amber-border"}`}>
                      {journey.daysElapsed >= 90 ? "Under Review" : "Upcoming"}
                    </span>
                  </div>
                </div>
              </div>
            </div>}

        </div>

      {/* Authorized Linkage Modal */}
      <ModalShell
        open={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        variant="navy"
        maxWidth="max-w-md"
        icon={LinkIcon}
        title="Authorize Profile Linkage"
        subtitle="Link SiBS HRIS Employee Profile"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="link-employee-form"
              className="sibs-modal-btn-primary"
            >
              Link &amp; Authorize
            </button>
          </div>
        }
      >
        <form id="link-employee-form" onSubmit={handleLinkSubmit} className="space-y-3 text-xs font-jakarta">
          <div>
            <label className="sibs-modal-field-label">SiBS Employee ID</label>
            <input
              type="text"
              value={linkSibsId}
              onChange={(e) => setLinkSibsId(e.target.value)}
              placeholder="e.g. SIBS-2901"
              className="sibs-modal-input font-bold"
              required
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">Assigned Trainer Name</label>
            <input
              type="text"
              value={linkTrainerName}
              onChange={(e) => setLinkTrainerName(e.target.value)}
              className="sibs-modal-input font-bold"
              required
            />
          </div>
        </form>
      </ModalShell>

      {/* Record Attendance Modal */}
      <ModalShell
        open={showAddAttendance}
        onClose={() => setShowAddAttendance(false)}
        variant="navy"
        maxWidth="max-w-md"
        icon={Calendar}
        title="Record Attendance Entry"
        subtitle="Update Daily Attendance Record"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddAttendance(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-attendance-form"
              className="sibs-modal-btn-primary"
            >
              Save Attendance
            </button>
          </div>
        }
      >
        <form id="add-attendance-form" onSubmit={handleAddAttendanceSubmit} className="space-y-3 text-xs font-jakarta">
          <div>
            <label className="sibs-modal-field-label">Shift Date</label>
            <input
              type="date"
              value={attDate}
              onChange={(e) => setAttDate(e.target.value)}
              className="sibs-modal-input font-bold"
              required
            />
          </div>

          <SelectDropdown
            label="Status"
            value={attStatus}
            onChange={setAttStatus}
            options={[
              { value: "Present", label: "Present" },
              { value: "Late", label: "Late" },
              { value: "Absent", label: "Absent" },
              { value: "Excused", label: "Excused" },
            ]}
          />

          <div>
            <label className="sibs-modal-field-label">Source</label>
            <input
              type="text"
              value={attSource}
              onChange={(e) => setAttSource(e.target.value)}
              className="sibs-modal-input"
              required
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">Notes</label>
            <input
              type="text"
              value={attNotes}
              onChange={(e) => setAttNotes(e.target.value)}
              className="sibs-modal-input"
            />
          </div>
        </form>
      </ModalShell>

      {/* Add Evidence Modal */}
      <ModalShell
        open={showAddEvidence}
        onClose={() => setShowAddEvidence(false)}
        variant="navy"
        maxWidth="max-w-md"
        icon={ShieldCheck}
        title="Add Quality / Training Evidence"
        subtitle="Attach Artifact to Trainee Record"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddEvidence(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-evidence-form"
              className="sibs-modal-btn-primary"
            >
              Add Evidence
            </button>
          </div>
        }
      >
        <form id="add-evidence-form" onSubmit={handleAddEvidenceSubmit} className="space-y-3 text-xs font-jakarta">
          <SelectDropdown
            label="Evidence Type"
            value={evType}
            onChange={setEvType}
            options={[
              { value: "Training", label: "Training" },
              { value: "QDS / QA", label: "QDS / QA" },
              { value: "Performance", label: "Performance" },
              { value: "Coaching", label: "Coaching" },
              { value: "Work quality", label: "Work quality" },
            ]}
          />

          <div>
            <label className="sibs-modal-field-label">Title</label>
            <input
              type="text"
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              placeholder="e.g. Side-by-side call audit scorecard"
              className="sibs-modal-input font-bold"
              required
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">Notes / Score</label>
            <textarea
              rows={3}
              value={evNotes}
              onChange={(e) => setEvNotes(e.target.value)}
              placeholder="Enter detailed audit findings..."
              className="sibs-modal-textarea"
              required
            />
          </div>
        </form>
      </ModalShell>

      {/* Add Check-in Modal */}
      <ModalShell
        open={showAddCheckIn}
        onClose={() => setShowAddCheckIn(false)}
        variant="navy"
        maxWidth="max-w-md"
        icon={CheckSquare}
        title="Log 1-on-1 Touchpoint"
        subtitle="Record Coaching or Supervisor Meeting"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddCheckIn(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-checkin-form"
              className="sibs-modal-btn-primary"
            >
              Log Touchpoint
            </button>
          </div>
        }
      >
        <form id="add-checkin-form" onSubmit={handleAddCheckInSubmit} className="space-y-3 text-xs font-jakarta">
          <SelectDropdown
            label="Touchpoint Role"
            value={ciType}
            onChange={setCiType}
            options={[
              { value: "Trainer", label: "Trainer" },
              { value: "Team Leader", label: "Team Leader" },
              { value: "Manager", label: "Manager" },
              { value: "HR Coordinator", label: "HR Coordinator" },
            ]}
          />

          <div>
            <label className="sibs-modal-field-label">Confidence Score (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={ciConfidence}
              onChange={(e) => setCiConfidence(Number(e.target.value))}
              className="sibs-modal-input font-bold"
              required
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">Discussion Notes</label>
            <textarea
              rows={3}
              value={ciNotes}
              onChange={(e) => setCiNotes(e.target.value)}
              placeholder="Record summary of 1-on-1 check-in..."
              className="sibs-modal-textarea"
              required
            />
          </div>
        </form>
      </ModalShell>

      {/* Add Coaching Action Modal */}
      <ModalShell
        open={showAddCoaching}
        onClose={() => setShowAddCoaching(false)}
        variant="navy"
        maxWidth="max-w-md"
        icon={HeartHandshake}
        title="Create Coaching Action"
        subtitle="Targeted Performance Support"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddCoaching(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-coaching-form"
              className="sibs-modal-btn-primary"
            >
              Create Action
            </button>
          </div>
        }
      >
        <form id="add-coaching-form" onSubmit={handleAddCoachingSubmit} className="space-y-3 text-xs font-jakarta">
          <div>
            <label className="sibs-modal-field-label">Action Title</label>
            <input
              type="text"
              value={coachTitle}
              onChange={(e) => setCoachTitle(e.target.value)}
              placeholder="e.g. Targeted AHT reduction practice"
              className="sibs-modal-input font-bold"
              required
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">Due Date</label>
            <input
              type="date"
              value={coachDue}
              onChange={(e) => setCoachDue(e.target.value)}
              className="sibs-modal-input"
              required
            />
          </div>

          <div>
            <label className="sibs-modal-field-label">Notes / Strategy</label>
            <textarea
              rows={3}
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Describe coaching steps..."
              className="sibs-modal-textarea"
              required
            />
          </div>
        </form>
      </ModalShell>

      {/* Full View Process Detail Modal */}
      {selectedProcessModal && (
        <TrainingProcessDetailModal
          isOpen={Boolean(selectedProcessModal)}
          onClose={() => setSelectedProcessModal(null)}
          processType={selectedProcessModal}
          journey={journey}
          scoreVal={selectedProcessModal === "FST" ? fstScoreVal || 82 : pstScoreVal || 84}
          evaluatorName={
            selectedProcessModal === "FST"
              ? fstScoreObj?.owner || journey.trainerName || "Maria Cruz"
              : pstScoreObj?.owner || journey.tl || "Anton Reyes"
          }
          items={selectedProcessModal === "FST" ? fstItems : pstItems}
        />
      )}
    </ModalShell>
  );
}
export {
  EmployeeJourneyDrillDown as default
};
