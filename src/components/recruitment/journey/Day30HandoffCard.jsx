/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useJourney } from "./JourneyContext";
import { ModalShell } from "@/components/ui";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  FileText,
  Edit3,
  Check,
  Send,
  Building2
} from "lucide-react";
const AVAILABLE_TEAM_LEADERS = [
  { id: "TL-001", name: "Anton Reyes", title: "Operations Team Leader", pod: "Pod 4 \u2022 US Visa Operations", email: "anton.reyes@sibs.com" },
  { id: "TL-002", name: "Sarah Santos", title: "Customer Care Lead", pod: "Pod 2 \u2022 Customer Care Operations", email: "sarah.santos@sibs.com" },
  { id: "TL-003", name: "Rico Torres", title: "Technical Support Lead", pod: "Pod 1 \u2022 Technical Support", email: "rico.torres@sibs.com" },
  { id: "TL-004", name: "Mark Sarmiento", title: "Healthcare Operations Lead", pod: "Pod 3 \u2022 Healthcare Operations", email: "mark.sarmiento@sibs.com" },
  { id: "TL-005", name: "Renz Torres", title: "BPO Operations Lead", pod: "Pod 5 \u2022 BPO Operations", email: "renz.torres@sibs.com" },
  { id: "TL-006", name: "Patricia Gomez", title: "Fintech Support Lead", pod: "Pod 6 \u2022 Financial Services", email: "patricia.gomez@sibs.com" },
  { id: "TL-007", name: "Karlo Dela Rosa", title: "Escalations Team Leader", pod: "Pod 7 \u2022 Tier 2 Support", email: "karlo.delarosa@sibs.com" }
];
const AVAILABLE_STRENGTHS = [
  "High Customer Empathy",
  "Quick Systems Navigation",
  "Accurate Dispositioning",
  "Active Listening",
  "Fast Problem Solving",
  "Compliance Adherence",
  "Punctual Attendance",
  "Positive Team Attitude"
];
const AVAILABLE_FOCUS_AREAS = [
  "Average Handle Time (AHT) Pacing",
  "Complex Inquiry Navigation",
  "Multi-tab Software Speed",
  "Edge-case Escalation Protocols",
  "Knowledge Base Search Efficiency",
  "Call De-escalation Confidence"
];
function Day30HandoffCard({
  journey,
  onUpdateSuccess,
  compact = false
}) {
  const {
    submitTrainerToTlHandoff,
    acceptTrainerToTlHandoff,
    phaseTrainingScores,
    evidence,
    attendance,
    simulatedCurrentDate
  } = useJourney();
  const currentHandoff = journey.day30Handoff || journey.day30?.handoff;
  const status = currentHandoff?.status || "Pending";
  const empKey = journey.sibsEmployeeId || journey.id;
  const fstScoreObj = phaseTrainingScores.find((s) => (s.emp === empKey || s.emp === journey.id) && s.phase === "FST");
  const pstScoreObj = phaseTrainingScores.find((s) => (s.emp === empKey || s.emp === journey.id) && s.phase === "PST");
  const fstVal = currentHandoff?.fstScore ?? fstScoreObj?.score ?? 84;
  const pstVal = currentHandoff?.pstScore ?? pstScoreObj?.score ?? 88;
  const qaEvid = evidence.filter((e) => (e.emp === empKey || e.emp === journey.id) && e.type === "QDS / QA");
  const qaVal = currentHandoff?.qaScore ?? (journey.id === "SIBS-2906" ? 62 : qaEvid.length ? 88 : 84);
  const attVal = currentHandoff?.attendanceRate ?? 96.5;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [trainerName, setTrainerName] = useState(currentHandoff?.trainerName || journey.trainerName || "Maria Cruz (Senior Trainer)");
  const [targetTlName, setTargetTlName] = useState(currentHandoff?.targetTlName || journey.tl || "Anton Reyes");
  const [readinessRating, setReadinessRating] = useState(
    currentHandoff?.readinessRating || (qaVal >= 80 ? "Floor Ready" : "Developing with Support")
  );
  const [coreStrengths, setCoreStrengths] = useState(
    currentHandoff?.coreStrengths && currentHandoff.coreStrengths.length > 0 ? currentHandoff.coreStrengths : ["Quick Systems Navigation", "High Customer Empathy", "Accurate Dispositioning"]
  );
  const [focusAreas, setFocusAreas] = useState(
    currentHandoff?.focusAreas && currentHandoff.focusAreas.length > 0 ? currentHandoff.focusAreas : ["Average Handle Time (AHT) Pacing"]
  );
  const [trainerNotes, setTrainerNotes] = useState(
    currentHandoff?.trainerNotes || `${journey.fullName} has successfully concluded Fundamental Skill Training (FST Days 1\u201314). Trainee shows strong technical foundation and adherence to standard protocols. Ready for Product Skills Training (PST Days 15\u201328).`
  );
  const [tlAcceptanceNotes, setTlAcceptanceNotes] = useState(
    currentHandoff?.tlAcceptanceNotes || `Operational custody and PST training readiness accepted by ${targetTlName}. Trainee cleared to begin Product Skills Training (PST Days 15\u201328).`
  );
  const selectedTlObj = AVAILABLE_TEAM_LEADERS.find(
    (t) => t.name.toLowerCase() === targetTlName.toLowerCase() || targetTlName.toLowerCase().includes(t.name.toLowerCase())
  ) || AVAILABLE_TEAM_LEADERS[0];
  const handleQuickTlChange = (newTlName) => {
    setTargetTlName(newTlName);
    submitTrainerToTlHandoff(journey.id, {
      status: currentHandoff?.status || "Pending",
      trainerName,
      targetTlName: newTlName,
      readinessRating,
      coreStrengths,
      focusAreas,
      fstScore: fstVal,
      pstScore: pstVal,
      qaScore: qaVal,
      attendanceRate: attVal,
      trainerNotes
    });
    onUpdateSuccess?.(`Incoming Team Leader set to ${newTlName}!`);
  };
  const toggleStrength = (st) => {
    setCoreStrengths(
      (prev) => prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]
    );
  };
  const toggleFocusArea = (fa) => {
    setFocusAreas(
      (prev) => prev.includes(fa) ? prev.filter((x) => x !== fa) : [...prev, fa]
    );
  };
  const handleSubmitHandoff = (e) => {
    e.preventDefault();
    submitTrainerToTlHandoff(journey.id, {
      status: "Submitted",
      trainerName,
      targetTlName,
      readinessRating,
      coreStrengths,
      focusAreas,
      fstScore: fstVal,
      pstScore: pstVal,
      qaScore: qaVal,
      attendanceRate: attVal,
      trainerNotes
    });
    setIsFormOpen(false);
    onUpdateSuccess?.(`Post-FST Handoff endorsed by Trainer ${trainerName} to Team Leader ${targetTlName}!`);
  };
  const handleAcceptHandoff = () => {
    acceptTrainerToTlHandoff(journey.id, targetTlName, tlAcceptanceNotes);
    onUpdateSuccess?.(`Post-FST Handoff accepted! Custody formally transferred to ${targetTlName} for PST.`);
  };
  return <div className="bg-white rounded-xl border border-sibs-border shadow-xs overflow-hidden transition-all">
      {
    /* Top Accent Gradient Bar */
  }
      <div className="h-[3px] w-full bg-gradient-to-r from-sibs-navy via-[#c24b30] to-sibs-orange" />

      <div className="p-4 sm:p-5 space-y-4">
        {
    /* Header with Alert & Status */
  }
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sibs-border pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sibs-navy text-white">
                Post-FST Checkpoint (Day 14)
              </span>
              <h3 className="text-sm sm:text-base font-black text-sibs-navy">
                Employee Training Handoff: FST → PST Transition
              </h3>
            </div>
            <p className="text-xs text-sibs-muted">
              Formal transition and readiness endorsement upon completion of Fundamental Skill Training (FST Days 1–14) prior to Product Skills Training (PST Days 15–28).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {status === "Pending" && <span className="px-2.5 py-1 rounded-full text-xs font-black bg-orange-100 text-sibs-orange border border-orange-200 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Handoff Action Due
              </span>}
            {status === "Submitted" && <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Awaiting TL Acceptance
              </span>}
            {status === "Accepted" && <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Custody Transferred
              </span>}
          </div>
        </div>

        {
    /* Transition Visual Track: Trainer -> Handover -> Team Leader */
  }
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 items-center p-3 sm:p-4 rounded-xl bg-sibs-surface border border-sibs-border">
          {
    /* Trainer Card */
  }
          <div className="md:col-span-3 bg-white p-3 rounded-xl border border-sibs-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-sibs-faint">
                Departing Supervisor (FST Fundamentals)
              </span>
              <span className="sibs-text-micro font-bold text-sibs-muted bg-sibs-surface px-1.5 py-0.5 rounded">
                Trainer
              </span>
            </div>
            <div className="flex items-center gap-2.5 pt-0.5">
              <div className="w-8 h-8 rounded-full bg-sibs-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(currentHandoff?.trainerName || journey.trainerName || "MC").split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-extrabold text-sibs-navy block truncate">
                  {currentHandoff?.trainerName || journey.trainerName || "Maria Cruz"}
                </strong>
                <span className="text-[10.5px] text-sibs-muted block truncate">
                  Assigned Nesting Trainer
                </span>
              </div>
            </div>
            {currentHandoff?.submittedAt && <span className="sibs-text-micro text-emerald-700 font-semibold block pt-1 border-t border-sibs-border">
                ✓ Endorsed on {currentHandoff.submittedAt}
              </span>}
          </div>

          {
    /* Transfer Flow Center Indicator */
  }
          <div className="md:col-span-1 flex flex-col items-center justify-center py-1">
            <div className="w-7 h-7 rounded-full bg-sibs-orange text-white flex items-center justify-center shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-black uppercase text-sibs-navy tracking-wider mt-1 text-center">
              FST ➔ PST Handoff
            </span>
          </div>

          {
    /* Team Leader Card */
  }
          <div className="md:col-span-3 bg-white p-3 rounded-xl border border-sibs-border shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-sibs-faint">
                Incoming Supervisor (PST &amp; Operations)
              </span>
              <span className="sibs-text-micro font-bold text-sibs-muted bg-sibs-surface px-1.5 py-0.5 rounded">
                Team Leader
              </span>
            </div>
            <div className="flex items-center gap-2.5 pt-0.5">
              <div className="w-8 h-8 rounded-full bg-sibs-orange text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(targetTlName || "AR").split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                {status !== "Accepted" ? <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <select
    aria-label="Choose Team Leader for Handoff"
    value={targetTlName}
    onChange={(e) => handleQuickTlChange(e.target.value)}
    className="w-full text-xs font-black text-sibs-navy bg-sibs-surface border border-sibs-border-subtle rounded-lg px-2 py-1 outline-none focus:border-sibs-orange cursor-pointer hover:border-sibs-navy transition-colors"
  >
                        {AVAILABLE_TEAM_LEADERS.map((tl) => <option key={tl.id} value={tl.name}>
                            {tl.name} — {tl.pod.split("\u2022")[0].trim()}
                          </option>)}
                      </select>
                    </div>
                    <span className="text-[10px] text-sibs-muted block truncate">
                      {selectedTlObj?.title || "Operations Team Leader"} • {selectedTlObj?.pod || "Production Operations"}
                    </span>
                  </div> : <div>
                    <strong className="text-xs font-extrabold text-sibs-navy block truncate">
                      {targetTlName}
                    </strong>
                    <span className="text-[10.5px] text-sibs-muted block truncate">
                      {selectedTlObj?.title || "Operations Team Leader"} • {selectedTlObj?.pod || "Production Operations"}
                    </span>
                  </div>}
              </div>
            </div>
            {currentHandoff?.acceptedAt ? <span className="sibs-text-micro text-emerald-700 font-semibold block pt-1 border-t border-sibs-border">
                ✓ Accepted on {currentHandoff.acceptedAt}
              </span> : <span className="sibs-text-micro text-amber-700 font-semibold block pt-1 border-t border-sibs-border">
                ⏳ Pending formal acceptance • Target TL: <strong className="text-sibs-navy">{targetTlName}</strong>
              </span>}
          </div>
        </div>

        {
    /* FST Performance Summary at Day 14 */
  }
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-sibs-faint block">
            FST Performance &amp; Readiness Evidence (Post-FST Checkpoint • Day 14)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 text-xs">
            <div className="p-2.5 bg-sibs-surface border border-sibs-border rounded-xl text-center">
              <span className="sibs-text-micro font-semibold text-sibs-muted block">FST (Fundamentals)</span>
              <strong className="text-base font-black text-sibs-navy block mt-0.5">{fstVal}%</strong>
              <span className="text-[9px] text-sibs-faint">Days 1–14 (Target ≥ 80%)</span>
            </div>

            <div className="p-2.5 bg-sibs-surface border border-sibs-border rounded-xl text-center">
              <span className="sibs-text-micro font-semibold text-sibs-muted block">PST Target Readiness</span>
              <strong className="text-base font-black text-sibs-navy block mt-0.5">{pstVal}%</strong>
              <span className="text-[9px] text-sibs-faint">Curriculum Pre-test</span>
            </div>

            <div className="p-2.5 bg-sibs-surface border border-sibs-border rounded-xl text-center">
              <span className="sibs-text-micro font-semibold text-sibs-muted block">Initial QA Audit</span>
              <strong className="text-base font-black text-sibs-navy block mt-0.5">{qaVal}%</strong>
              <span className="text-[9px] text-sibs-faint">Audit Evidence</span>
            </div>

            <div className="p-2.5 bg-sibs-surface border border-sibs-border rounded-xl text-center">
              <span className="sibs-text-micro font-semibold text-sibs-muted block">14-Day Attendance</span>
              <strong className="text-base font-black text-[#2ECC71] block mt-0.5">{attVal}%</strong>
              <span className="text-[9px] text-sibs-faint">Punctuality</span>
            </div>

            <div className="p-2.5 bg-sibs-surface border border-sibs-border rounded-xl text-center col-span-2 sm:col-span-1">
              <span className="sibs-text-micro font-semibold text-sibs-muted block">Readiness Rating</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black mt-1 ${readinessRating === "Floor Ready" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : readinessRating === "Developing with Support" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-rose-100 text-rose-800 border border-rose-200"}`}>
                {currentHandoff?.readinessRating || readinessRating}
              </span>
            </div>
          </div>
        </div>

        {
    /* Strengths & Focus Areas */
  }
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              Verified Core Competencies &amp; Strengths
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(currentHandoff?.coreStrengths || coreStrengths).map((st) => <span key={st} className="px-2 py-0.5 bg-white border border-sibs-border-subtle text-sibs-navy font-semibold text-[10.5px] rounded-lg">
                  {st}
                </span>)}
            </div>
          </div>

          <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              PST Curriculum Focus Areas (For Team Leader)
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(currentHandoff?.focusAreas || focusAreas).map((fa) => <span key={fa} className="px-2 py-0.5 bg-white border border-amber-200 text-amber-900 font-semibold text-[10.5px] rounded-lg">
                  {fa}
                </span>)}
            </div>
          </div>
        </div>

        {
    /* Notes from Trainer & Team Leader */
  }
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-sibs-navy font-extrabold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sibs-navy" />
                Trainer Endorsement & Handover Remarks
              </strong>
              <span className="text-[10px] text-sibs-faint">By {currentHandoff?.trainerName || journey.trainerName || "Trainer"}</span>
            </div>
            <p className="text-sibs-secondary leading-relaxed text-[11.5px] italic">
              "{currentHandoff?.trainerNotes || trainerNotes}"
            </p>
          </div>

          {currentHandoff?.tlAcceptanceNotes && <div className="p-3 bg-[#F0FDF4] border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-emerald-900 font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Team Leader Operational Acceptance Confirmation
                </strong>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {currentHandoff.acceptedBy || targetTlName} • {currentHandoff.acceptedAt}
                </span>
              </div>
              <p className="text-emerald-800 leading-relaxed text-[11.5px]">
                "{currentHandoff.tlAcceptanceNotes}"
              </p>
            </div>}
        </div>

        {
    /* Workstation & Station Allocation */
  }
        <div className="p-3 bg-sibs-surface border border-sibs-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-sibs-navy flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-sibs-navy" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-sibs-faint uppercase">Operational Workstation Allocation</span>
              <div className="font-extrabold text-sibs-navy text-xs">
                {journey.wfmSeating ? `${journey.wfmSeating.wing} \u2022 ${journey.wfmSeating.seatNumber}` : "Main Operations Floor \u2022 Pod 4 Station"}
              </div>
            </div>
          </div>
          <span className="text-[10.5px] font-semibold text-sibs-muted bg-white border border-sibs-border px-2.5 py-1 rounded-lg">
            Account: <strong className="text-sibs-navy">{journey.account}</strong> • Site: <strong className="text-sibs-navy">{journey.siteLocation}</strong>
          </span>
        </div>

        {
    /* Action Controls & Interactive Modals */
  }
        <div className="border-t border-sibs-border pt-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-[11px] text-sibs-muted font-medium">
            {status === "Pending" && <span className="text-sibs-orange font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Action required: Trainer must endorse readiness to initiate TL transition.
              </span>}
            {status === "Submitted" && <span className="text-amber-800 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Action required: Team Leader must accept operational custody to conclude handoff.
              </span>}
            {status === "Accepted" && <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Handoff cycle finalized. Trainee is under active operational ramp.
              </span>}
          </div>

          <div className="flex items-center gap-2">
            {status === "Pending" && <button
    type="button"
    onClick={() => setIsFormOpen(true)}
    className="px-3.5 py-2 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
  >
                <Send className="w-3.5 h-3.5" />
                <span>Endorse & Submit Handoff to TL</span>
              </button>}

            {status === "Submitted" && <>
                <button
    type="button"
    onClick={() => setIsFormOpen(true)}
    className="px-3 py-1.5 rounded-xl border border-sibs-border-subtle text-sibs-navy font-semibold text-xs hover:bg-sibs-surface cursor-pointer"
  >
                  <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                  Edit Endorsement
                </button>
                <button
    type="button"
    onClick={handleAcceptHandoff}
    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
  >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Accept Handoff as TL ({targetTlName})</span>
                </button>
              </>}

            {status === "Accepted" && <button
    type="button"
    onClick={() => setIsFormOpen(true)}
    className="px-3 py-1.5 rounded-xl border border-sibs-border-subtle text-sibs-navy font-semibold text-xs hover:bg-sibs-surface cursor-pointer"
  >
                <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                Amend Handoff Notes
              </button>}
          </div>
        </div>
      </div>

      {
    /* Interactive Form Modal for Endorsing / Amending Handoff */
  }
      <ModalShell
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        variant="navy"
        maxWidth="max-w-xl"
        icon={Send}
        title={`Day 30 Handoff: ${journey.fullName}`}
        badge="Trainer Endorsement Form"
        subtitle="Trainer Endorsement & Custody Transition to Operations"
        bodyClassName="sibs-scrollbar min-h-0 flex-1 overflow-y-auto bg-white p-5 font-jakarta space-y-4"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="sibs-modal-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="handoff-endorsement-form"
              className="sibs-modal-btn-primary"
            >
              Endorse & Save Handoff
            </button>
          </div>
        }
      >
        <form id="handoff-endorsement-form" onSubmit={handleSubmitHandoff} className="space-y-4 text-xs font-jakarta">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="sibs-modal-field-label">Assigned Trainer</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                className="sibs-modal-input"
                required
              />
            </div>

            <div>
              <label className="sibs-modal-field-label">Target Team Leader (TL)</label>
              <select
                value={targetTlName}
                onChange={(e) => setTargetTlName(e.target.value)}
                className="sibs-modal-input"
                required
              >
                {AVAILABLE_TEAM_LEADERS.map((tl) => (
                  <option key={tl.id} value={tl.name}>
                    {tl.name} ({tl.pod})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-sibs-muted">
                Target Pod: <strong className="text-sibs-navy">{selectedTlObj?.pod}</strong>
              </p>
            </div>
          </div>

          <div>
            <label className="sibs-modal-field-label">Overall Operational Readiness Rating</label>
            <select
              value={readinessRating}
              onChange={(e) => setReadinessRating(e.target.value)}
              className="sibs-modal-input"
            >
              <option value="Floor Ready">Floor Ready (Fully endorsed for production queue)</option>
              <option value="Developing with Support">Developing with Support (Requires bi-weekly spot checks)</option>
              <option value="Conditional Ramp">Conditional Ramp (Paired buddy nesting required)</option>
              <option value="At Risk">At Risk (Action plan required)</option>
            </select>
          </div>

          {/* Strengths Selector */}
          <div>
            <label className="sibs-modal-field-label">
              Observed Core Strengths (Click to select/unselect)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_STRENGTHS.map((st) => {
                const selected = coreStrengths.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => toggleStrength(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                      selected
                        ? "bg-sibs-navy text-white shadow-2xs"
                        : "bg-sibs-surface border border-sibs-border text-sibs-secondary hover:border-sibs-navy"
                    }`}
                  >
                    {selected ? "✓ " : "+ "}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus Areas Selector */}
          <div>
            <label className="sibs-modal-field-label">
              Transition Focus Areas for Team Leader
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_FOCUS_AREAS.map((fa) => {
                const selected = focusAreas.includes(fa);
                return (
                  <button
                    key={fa}
                    type="button"
                    onClick={() => toggleFocusArea(fa)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                      selected
                        ? "bg-sibs-orange text-white shadow-2xs"
                        : "bg-sibs-surface border border-sibs-border text-sibs-secondary hover:border-sibs-orange"
                    }`}
                  >
                    {selected ? "✓ " : "+ "}
                    {fa}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="sibs-modal-field-label">
              Trainer's Transition Notes & Recommendations for TL
            </label>
            <textarea
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
              rows={3}
              className="sibs-modal-textarea"
              placeholder="Detail agent strengths, handling habits, and specific guidance for the incoming supervisor."
              required
            />
          </div>
        </form>
      </ModalShell>
    </div>;
}
export {
  AVAILABLE_TEAM_LEADERS,
  Day30HandoffCard as default
};
