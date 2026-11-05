import {
  Clock,
  CheckCircle2,
  ShieldCheck,
  Star,
  Activity,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  MessageSquare,
  Check,
  Zap
} from "lucide-react";
import { ModalShell } from "@/components/ui";

function DayActivityDetailModal({
  isOpen,
  onClose,
  dayRecord,
  journey,
  coachingSession,
  onOpenCoachingModal,
  onPrevDay,
  onNextDay
}) {
  if (!isOpen || !dayRecord || !journey) return null;
  const getDayActivities = (day, phase, isWeekend) => {
    if (isWeekend) {
      return [
        { title: "Scheduled Operational Rest Day", time: "All Day", type: "Rest", completed: true, desc: "Rest day as per 5-day compressed shift schedule." }
      ];
    }
    if (day <= 14) {
      return [
        { title: "Curriculum Lecture & Skill Workshop", time: "08:00 AM \u2013 11:30 AM", type: "Training", completed: true, desc: `Core modules on ${dayRecord.checkIn.topic}. Instructor-led discussion with assigned trainer ${dayRecord.supervisoryOwner}.` },
        { title: "Interactive Roleplay & Practical Simulation", time: "12:30 PM \u2013 03:00 PM", type: "Practical", completed: true, desc: `Simulated handling of real-world scenarios. Evaluated task: "${dayRecord.performance.taskTitle || "Customer Communication Drill"}".` },
        { title: "Daily 1-on-1 Check-In & Action Plan", time: "03:30 PM \u2013 04:15 PM", type: "Check-In", completed: dayRecord.checkIn.status === "Completed", desc: dayRecord.checkIn.notes },
        { title: "Knowledge Check & E-Learning Assessment", time: "04:15 PM \u2013 05:00 PM", type: "Assessment", completed: true, desc: "End-of-day verification quiz submitted to Learning Management Portal." }
      ];
    }
    if (day <= 28) {
      return [
        { title: "Product Knowledge & Tool Navigation Drill", time: "08:00 AM \u2013 10:30 AM", type: "Training", completed: true, desc: `In-depth US Visa account protocols, system workflows, and document handling led by ${dayRecord.supervisoryOwner}.` },
        { title: "Sandboxed Case Processing & Mock Audits", time: "10:30 AM \u2013 02:30 PM", type: "Practical", completed: true, desc: `Processed sample applicant transactions. Practical benchmark assessed at ${dayRecord.performance.score ?? 88}%.` },
        { title: "Daily Supervisor Check-In & Coaching Touchpoint", time: "03:00 PM \u2013 03:45 PM", type: "Check-In", completed: dayRecord.checkIn.status === "Completed", desc: dayRecord.checkIn.notes },
        { title: "Quality Calibration & Compliance Verification", time: "04:00 PM \u2013 05:00 PM", type: "QA", completed: true, desc: "Spot-check verification against compliance and data privacy guidelines." }
      ];
    }
    if (day <= 30) {
      return [
        { title: "Day 30 Milestone Calibration & Scorecard Sign-Off", time: "09:00 AM \u2013 11:30 AM", type: "Milestone", completed: true, desc: "Formal review of FST (84%) and PST (91%) results. Trainer Maria Cruz signed off floor readiness." },
        { title: "Operational Handoff & Custody Transfer", time: "01:30 PM \u2013 03:00 PM", type: "Handoff", completed: true, desc: "Trainer-to-Team Leader custody transfer. Anton Reyes accepted trainee for Ramp." },
        { title: "Floor Walkthrough & Workstation Onboarding", time: "03:30 PM \u2013 05:00 PM", type: "Operations", completed: true, desc: `Confirmed seating at Station RW-042, Davao Floor 3. Credentials and telephony calibrated.` }
      ];
    }
    if (day <= 60) {
      return [
        { title: "Live Production Queue Intake (Supported Operations)", time: "08:00 AM \u2013 02:00 PM", type: "Production", completed: true, desc: "Handling live US Visa customer inquiries under Team Leader Anton Reyes supervision." },
        { title: "Quality Assurance (QA) Monitoring & Transaction Audit", time: "02:30 PM \u2013 03:30 PM", type: "QA", completed: true, desc: `Audit performed on live interaction PAC-24187. Verified score: ${dayRecord.performance.score ?? 89}%.` },
        { title: "Daily 1-on-1 Performance & AHT Touchpoint", time: "03:45 PM \u2013 04:30 PM", type: "Check-In", completed: dayRecord.checkIn.status === "Completed", desc: dayRecord.checkIn.notes },
        coachingSession ? { title: `Formal ESEP GROW Coaching Session (${coachingSession.id})`, time: "04:30 PM \u2013 05:00 PM", type: "Coaching", completed: true, desc: `Coached by ${coachingSession.facilitator}. Reasons: ${coachingSession.reasons.join(", ")}.` } : { title: "Daily Wrap-up & Queue Handoff", time: "04:30 PM \u2013 05:00 PM", type: "Operations", completed: true, desc: "Case notes submitted; queue handoff logged in CRM." }
      ];
    }
    return [
      { title: "Autonomous Live Production Handling", time: "08:00 AM \u2013 03:00 PM", type: "Production", completed: true, desc: "Full-speed production with target SLA adherence and 380s average handle time." },
      { title: "Independent QA Calibration & CSAT Review", time: "03:15 PM \u2013 04:00 PM", type: "QA", completed: true, desc: `Random sampling audit completed at ${dayRecord.performance.score ?? 91}%. Zero fatal infractions.` },
      { title: "Team Leader Regularization Progress Review", time: "04:00 PM \u2013 04:45 PM", type: "Check-In", completed: dayRecord.checkIn.status === "Completed", desc: dayRecord.checkIn.notes },
      { title: "End of Shift Reporting", time: "04:45 PM \u2013 05:00 PM", type: "Operations", completed: true, desc: "Shift attendance punched out cleanly via Kronos." }
    ];
  };
  const activities = getDayActivities(dayRecord.dayNumber, dayRecord.phaseName, dayRecord.isWeekend);
  return <ModalShell
    open={isOpen}
    onClose={onClose}
    variant="navy"
    maxWidth="max-w-4xl"
    zIndex="z-[10020]"
    icon={Activity}
    title={journey.fullName}
    badge={"Day " + dayRecord.dayNumber + " of 90"}
    subtitle={<div className="space-y-1">
      <p>{dayRecord.dayOfWeek}, {dayRecord.formattedDate} • {journey.sibsEmployeeId || journey.id} • {journey.account} ({journey.siteLocation})</p>
      <p>Assigned Lead: <strong className="text-white">{dayRecord.supervisoryOwner}</strong> • <span className={dayRecord.isCurrentDay ? "text-orange-200" : dayRecord.isElapsed ? "text-emerald-200" : "text-white/75"}>{dayRecord.isCurrentDay ? "Today's Active Operational Shift" : dayRecord.isElapsed ? "Completed & Verified" : "Upcoming Scheduled Day"}</span></p>
    </div>}
    headerMeta={<span className="rounded border border-white/15 bg-white/10 px-2 py-0.5 sibs-text-micro font-bold text-white/90">{dayRecord.phaseName}</span>}
    headerActions={<div className="flex items-center rounded-lg border border-white/20 bg-white/10 p-0.5">
      <button type="button" onClick={onPrevDay} disabled={dayRecord.dayNumber <= 1} aria-label="Previous day" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
      <span className="px-1 sibs-text-xs font-bold tabular-nums text-white">{dayRecord.dayNumber}/90</span>
      <button type="button" onClick={onNextDay} disabled={dayRecord.dayNumber >= 90} aria-label="Next day" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
    </div>}
    bodyClassName="bg-sibs-surface p-4 sm:p-5 space-y-4"
    footerMeta={<p className="sibs-text-xs text-sibs-muted">Day {dayRecord.dayNumber} of 90 • {dayRecord.phaseName}</p>}
    footer={<button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Close Day View</button>}
  >
          
          {
    /* ======================================================== */
  }
          {
    /* TOP HIGHLIGHT ROW: ATTENDANCE & QA PERFORMANCE (EMPHASIZED) */
  }
          {
    /* ======================================================== */
  }
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {
    /* ATTENDANCE HIGHLIGHT CARD */
  }
            <div className="bg-white rounded-xl border border-emerald-200 p-4.5 shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Attendance &amp; Punctuality
                    </span>
                    <h4 className="text-sm font-black text-sibs-navy">
                      Kronos Workstream Adherence
                    </h4>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide ${dayRecord.attendance.status === "Present" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : dayRecord.attendance.status === "Late" ? "bg-amber-100 text-amber-800 border border-amber-200" : dayRecord.attendance.status === "Rest day" ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-800 border border-red-200"}`}>
                  {dayRecord.attendance.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Shift Schedule</span>
                  <strong className="text-xs font-bold text-sibs-navy block mt-0.5">
                    {dayRecord.isWeekend ? "Rest Day" : "08:00 AM \u2013 05:00 PM"}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium">9.0 hrs scheduled</span>
                </div>

                <div className="p-2.5 rounded-lg bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Shift Adherence</span>
                  <strong className="text-xs font-bold text-emerald-700 block mt-0.5">
                    {dayRecord.attendance.adherencePercent}% Adherence
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium">Target: ≥ 95.0%</span>
                </div>

                <div className="p-2.5 rounded-lg bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Kronos Punch In</span>
                  <strong className="text-xs font-bold text-sibs-navy block mt-0.5">
                    {dayRecord.attendance.punchIn || "\u2014"}
                  </strong>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {dayRecord.attendance.punchIn ? "Badge verified at turnstile" : "No badge punch required"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Kronos Punch Out</span>
                  <strong className="text-xs font-bold text-sibs-navy block mt-0.5">
                    {dayRecord.attendance.punchOut || "\u2014"}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Station RW-042 • Davao Floor 3
                  </span>
                </div>
              </div>
            </div>

            {
    /* QA & PRACTICAL PERFORMANCE HIGHLIGHT CARD */
  }
            <div className="bg-white rounded-xl border border-blue-200 p-4.5 shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Quality Assurance &amp; Tasks
                    </span>
                    <h4 className="text-sm font-black text-sibs-navy">
                      {dayRecord.performance.scoreType || "Operational Quality Audit"}
                    </h4>
                  </div>
                </div>

                {dayRecord.performance.score ? <div className="flex items-baseline gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    <strong className="text-base font-black text-blue-900 font-mono">
                      {dayRecord.performance.score}%
                    </strong>
                    <span className="text-[10px] font-bold text-blue-700">
                      / {dayRecord.performance.passingTarget || 80}% passing
                    </span>
                  </div> : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    Practice &amp; Calibration
                  </span>}
              </div>

              <div className="p-3 bg-sibs-surface rounded-lg border border-sibs-border space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Assessed Task:</span>
                  <strong className="text-sibs-navy font-bold">{dayRecord.performance.taskTitle || "Practical Simulation Drill"}</strong>
                </div>

                {
    /* Score Progress Bar */
  }
                {dayRecord.performance.score && <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Benchmark Compliance</span>
                      <span className="text-emerald-700 font-bold">
                        {dayRecord.performance.score >= (dayRecord.performance.passingTarget || 80) ? "Passed Standard" : "Remedial Coaching Required"}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
    className={`h-full rounded-full ${dayRecord.performance.score >= 85 ? "bg-emerald-500" : dayRecord.performance.score >= 80 ? "bg-blue-500" : "bg-amber-500"}`}
    style={{ width: `${Math.min(100, dayRecord.performance.score)}%` }}
  />
                    </div>
                  </div>}

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check size={12} className="text-emerald-600" />
                    <span>Call flow compliance: <strong>Passed</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check size={12} className="text-emerald-600" />
                    <span>Privacy &amp; Data Security: <strong>100%</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check size={12} className="text-emerald-600" />
                    <span>Spiel &amp; Script Accuracy: <strong>Passed</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Check size={12} className="text-emerald-600" />
                    <span>Evaluator: <strong>{dayRecord.supervisoryOwner}</strong></span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {
    /* ======================================================== */
  }
          {
    /* COACHING INTERVENTION CARD (IF ACTIVE ON THIS DAY) */
  }
          {
    /* ======================================================== */
  }
          {coachingSession ? <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white rounded-xl border-2 border-sibs-orange p-4.5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-orange-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sibs-orange text-white flex items-center justify-center shadow-2xs">
                    <Zap size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-sibs-orange tracking-wider block">
                      ESEP GROW COACHING INTERVENTION LOGGED
                    </span>
                    <h4 className="text-sm font-black text-sibs-navy">
                      Session ID: ESEP-{coachingSession.id} • {coachingSession.taskOrder || "TO04 PAC"}
                    </h4>
                  </div>
                </div>

                {onOpenCoachingModal && <button
    type="button"
    onClick={() => onOpenCoachingModal(coachingSession.id)}
    className="px-3 py-1.5 rounded-lg bg-sibs-orange hover:bg-[#e04f20] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
  >
                    <span>Open ESEP Coaching Form</span>
                    <ArrowUpRight size={13} />
                  </button>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-orange-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Coaching Reason(s)</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {coachingSession.reasons.map((r, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-900">
                        {r}
                      </span>)}
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-orange-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Coach / Evaluator</span>
                  <strong className="text-sibs-navy font-bold block mt-1">
                    {coachingSession.facilitator} ({coachingSession.coachDesignation || "Team Leader"})
                  </strong>
                  <span className="text-[10px] text-slate-500">Case Audit ID: {coachingSession.qaCallCaseId || "PAC-24187"}</span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-orange-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Follow-Up Status</span>
                  <strong className="text-emerald-700 font-bold block mt-1">
                    Evaluated &amp; Improved (+6 pts QA)
                  </strong>
                  <span className="text-[10px] text-slate-500">GROW commitments cleared</span>
                </div>
              </div>
            </div> : <div className="p-3 bg-white rounded-xl border border-sibs-border flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>
                  <strong>Coaching Status:</strong> Compliant performance. No remedial GROW coaching intervention required for Day {dayRecord.dayNumber}.
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Standard Benchmarks Maintained
              </span>
            </div>}

          {
    /* ======================================================== */
  }
          {
    /* DAILY 1-ON-1 CHECK-IN & SUPERVISOR GUIDANCE */
  }
          {
    /* ======================================================== */
  }
          <div className="bg-white rounded-xl border border-sibs-border p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-sibs-orange">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Daily 1-on-1 Touchpoint
                  </span>
                  <h4 className="text-sm font-black text-sibs-navy">
                    {dayRecord.checkIn.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs font-bold text-amber-700">
                  <span>Confidence: {dayRecord.checkIn.confidenceScore}/5</span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className={i < dayRecord.checkIn.confidenceScore ? "fill-amber-400 text-amber-400" : "text-slate-200"} />)}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${dayRecord.checkIn.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {dayRecord.checkIn.status}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Focus Topic &amp; Objective</span>
                <strong className="text-sm font-bold text-sibs-navy block mt-0.5">
                  {dayRecord.checkIn.topic}
                </strong>
              </div>

              <div className="p-3 bg-sibs-surface rounded-lg border border-sibs-border">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Supervisor Observation &amp; Guidance Notes
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {dayRecord.checkIn.notes}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-sibs-navy text-xs font-bold block">
                    Agreed Actionable Commitment &amp; Next Steps:
                  </strong>
                  <p className="text-emerald-900 text-[11.5px] mt-0.5 font-medium">
                    {dayRecord.checkIn.actionItem}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {
    /* ======================================================== */
  }
          {
    /* DETAILED DAILY ACTIVITY BREAKDOWN (SCHEDULE OF WHAT WAS DONE) */
  }
          {
    /* ======================================================== */
  }
          <div className="bg-white rounded-xl border border-sibs-border p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-sibs-navy" />
                <h4 className="text-xs font-black uppercase text-sibs-navy tracking-wider">
                  Full Day Schedule &amp; Activity Log
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {activities.length} milestones &amp; modules logged
              </span>
            </div>

            <div className="space-y-2.5">
              {activities.map((act, idx) => <div
    key={idx}
    className="p-3 rounded-lg border border-sibs-border bg-sibs-surface hover:bg-white transition-colors flex items-start gap-3"
  >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <Check size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <strong className="text-xs font-bold text-sibs-navy">{act.title}</strong>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-sibs-border">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                      {act.desc}
                    </p>
                  </div>
                </div>)}
            </div>
          </div>

  </ModalShell>;
}
export {
  DayActivityDetailModal as default
};
