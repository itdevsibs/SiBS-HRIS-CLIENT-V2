/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useJourney } from "./JourneyContext";
import {
  X,
  AlertTriangle,
  Award,
  BookOpen,
  ShieldCheck,
  MessageSquare,
  FileText,
  Activity,
  Building2,
  Plus,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
function EmployeeJourneyDrawer({ journey, isOpen, onClose }) {
  const { updateDay30Milestone, updateDay60Milestone, updateDay90Milestone, addTouchpoint, linkEmployeeProfile } = useJourney();
  const [activeTab, setActiveTab] = useState("roadmap");
  const [selectedMilestoneModal, setSelectedMilestoneModal] = useState(null);
  const [showAddTouchpointModal, setShowAddTouchpointModal] = useState(false);
  const [tpAuthor, setTpAuthor] = useState("Dulla, Ralph Vincent (HR Operations Lead)");
  const [tpType, setTpType] = useState("1-on-1 Check-in");
  const [tpNotes, setTpNotes] = useState("");
  const [tpMood, setTpMood] = useState("Satisfied");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSibsId, setLinkSibsId] = useState(journey.sibsEmployeeId || "SIB-2026-105");
  const [linkStartDate, setLinkStartDate] = useState(journey.startDate || "2026-10-15");
  const [day30Qa, setDay30Qa] = useState(journey.day30.nestingQaScore || 88);
  const [day30Attendance, setDay30Attendance] = useState(journey.day30.attendancePunctualityScore || 98.5);
  const [day30Endorsement, setDay30Endorsement] = useState(journey.day30.trainerEndorsement || "Floor Ready");
  const [day30Notes, setDay30Notes] = useState(journey.day30.trainerNotes || "");
  const [day60ProdScore, setDay60ProdScore] = useState(journey.day60.coreProductionScore || 91);
  const [day60Aht, setDay60Aht] = useState(journey.day60.averageHandleTimeSeconds || 380);
  const [day60Decision, setDay60Decision] = useState(journey.day60.midProbationDecision || "Progressing Well");
  const [day60Notes, setDay60Notes] = useState(journey.day60.supervisorNotes || "");
  const [day90Composite, setDay90Composite] = useState(journey.day90.compositeScore || 92);
  const [day90Rec, setDay90Rec] = useState(journey.day90.finalRecommendation || "Endorse for Regularization");
  if (!isOpen) return null;
  const handleSaveDay30 = () => {
    updateDay30Milestone(journey.id, {
      status: "Completed",
      nestingQaScore: Number(day30Qa),
      attendancePunctualityScore: Number(day30Attendance),
      trainerEndorsement: day30Endorsement,
      trainerNotes: day30Notes,
      completedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setSelectedMilestoneModal(null);
  };
  const handleSaveDay60 = () => {
    updateDay60Milestone(journey.id, {
      status: "Completed",
      coreProductionScore: Number(day60ProdScore),
      averageHandleTimeSeconds: Number(day60Aht),
      midProbationDecision: day60Decision,
      supervisorNotes: day60Notes,
      completedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setSelectedMilestoneModal(null);
  };
  const handleSaveDay90 = () => {
    updateDay90Milestone(journey.id, {
      status: "Completed",
      compositeScore: Number(day90Composite),
      finalRecommendation: day90Rec,
      hrOperationsSignOff: {
        signedBy: "Dulla, Ralph Vincent (HR Operations Lead)",
        signedAt: (/* @__PURE__ */ new Date()).toLocaleString(),
        approved: day90Rec === "Endorse for Regularization",
        regularizationContractIssued: day90Rec === "Endorse for Regularization",
        effectiveRegularDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      completedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setSelectedMilestoneModal(null);
  };
  const handleAddTouchpointSubmit = (e) => {
    e.preventDefault();
    if (!tpNotes.trim()) return;
    addTouchpoint(journey.id, {
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      authorName: tpAuthor,
      authorRole: "HR Operations",
      type: tpType,
      notes: tpNotes.trim(),
      moodRating: tpMood
    });
    setTpNotes("");
    setShowAddTouchpointModal(false);
  };
  const handleSaveLink = () => {
    if (!linkStartDate) return;
    linkEmployeeProfile(journey.id, linkSibsId, linkStartDate);
    setShowLinkModal(false);
  };
  return <div className="fixed inset-0 z-50 bg-[#042C51]/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-4xl bg-[#FAFCFF] h-full shadow-2xl flex flex-col overflow-hidden text-slate-800 animate-in slide-in-from-right duration-200">
        
        {
    /* Top Header - SiBS HRIS Standard */
  }
        <div className="bg-white border-b border-[#E6ECF2] relative shrink-0">
          <div className="h-[3.5px] w-full bg-gradient-to-r from-[#042C51] via-[#c24b30] to-[#FF5C28]" />
          <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#042C51] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {journey.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-[#042C51] tracking-tight">{journey.fullName}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 border border-orange-200 text-[#FF5C28]">
                    Kronos: {journey.kronosId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200 text-[#042C51]">
                    {journey.stage}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>{journey.roleTitle} &bull; <strong className="text-[#042C51]">{journey.account}</strong></span>
                  <span>{journey.siteLocation}</span>
                  <span>Preserved Hire Date: <strong className="text-[#042C51]">{journey.hireDate}</strong></span>
                </div>
                {journey.nhoAcceptedBy && <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>NHO Accepted by {journey.nhoAcceptedBy} on {journey.nhoAcceptedAt}</span>
                  </div>}
              </div>
            </div>

            <button
    onClick={onClose}
    className="p-1.5 rounded-xl text-slate-400 hover:text-[#042C51] hover:bg-slate-100 cursor-pointer transition-colors"
    title="Close drawer"
  >
              <X className="w-5 h-5" />
            </button>
          </div>

          {
    /* Progress bar */
  }
          <div className="px-4 sm:px-5 pb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FF5C28]" />
                <span>Journey Trajectory: <strong className="text-[#042C51]">Day {journey.daysElapsed} of 90</strong></span>
              </div>
              <span className="font-bold text-[#042C51] tabular-nums">{journey.overallProgressPct}% Completed</span>
            </div>
            <div className="w-full bg-[#E6EAF0] h-2 rounded-full overflow-hidden">
              <div
    className="bg-gradient-to-r from-[#042C51] to-[#FF5C28] h-full rounded-full transition-all duration-500"
    style={{ width: `${journey.overallProgressPct}%` }}
  />
            </div>
          </div>
        </div>

        {
    /* Missing Link Banner */
  }
        {journey.isAwaitingLinkage && <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3 px-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Profile Linkage Required:</strong> Official start date or employee directory ID needs confirmation to advance milestone countdowns.
              </span>
            </div>
            <button
    onClick={() => setShowLinkModal(true)}
    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
  >
              Link Employee / Set Start Date
            </button>
          </div>}

        {
    /* Navigation Tabs */
  }
        <div className="bg-white border-b border-[#E6ECF2] px-6 flex items-center gap-2">
          <button
    onClick={() => setActiveTab("roadmap")}
    className={`py-3 px-4 font-bold text-xs border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${activeTab === "roadmap" ? "border-[#FF5C28] text-[#042C51]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
            <Sparkles className="w-4 h-4 text-[#FF5C28]" />
            <span>30 / 60 / 90 Roadmap</span>
          </button>
          <button
    onClick={() => setActiveTab("nho-assets")}
    className={`py-3 px-4 font-bold text-xs border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${activeTab === "nho-assets" ? "border-[#FF5C28] text-[#042C51]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
            <ShieldCheck className="w-4 h-4 text-[#042C51]" />
            <span>Carried-Forward NHO Assets</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              {journey.qdsMaterials?.length || 0} Materials
            </span>
          </button>
          <button
    onClick={() => setActiveTab("touchpoints")}
    className={`py-3 px-4 font-bold text-xs border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${activeTab === "touchpoints" ? "border-[#FF5C28] text-[#042C51]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
  >
            <MessageSquare className="w-4 h-4 text-[#042C51]" />
            <span>Touchpoints & Coaching Logs</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              {journey.touchpoints?.length || 0}
            </span>
          </button>
        </div>

        {
    /* Tab Content Area */
  }
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {
    /* TAB 1: 30 / 60 / 90 ROADMAP */
  }
          {activeTab === "roadmap" && <div className="space-y-6">
              
              {
    /* Day 30 Card */
  }
              <div className="bg-white rounded-2xl border border-[#E6ECF2] shadow-xs overflow-hidden">
                <div className="p-4 bg-[#F7F9FC] border-b border-[#E6ECF2] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF5C28] font-bold flex items-center justify-center text-xs">
                      30
                    </div>
                    <div>
                      <h3 className="font-bold text-[#042C51] text-xs uppercase tracking-wider">
                        Day 1 - 30: Foundation & Nesting Phase
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Classroom knowledge consolidation, initial simulated & live phone handling, compliance adherence.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${journey.day30.status === "Completed" ? "bg-green-100 text-green-800" : journey.day30.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                      {journey.day30.status}
                    </span>
                    <button
    onClick={() => setSelectedMilestoneModal(30)}
    className="px-3 py-1.5 rounded-lg bg-[#042C51] hover:bg-[#0B365F] text-white font-bold text-xs cursor-pointer"
  >
                      Update Day 30
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nesting QA Score</span>
                      <span className="text-base font-extrabold text-[#042C51] mt-0.5 block tabular-nums">
                        {journey.day30.nestingQaScore !== void 0 ? `${journey.day30.nestingQaScore}%` : "\u2014"}
                      </span>
                      <span className="text-[10px] text-green-700 font-medium">Target: &ge; 85%</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Attendance Rate</span>
                      <span className="text-base font-extrabold text-[#042C51] mt-0.5 block tabular-nums">
                        {journey.day30.attendancePunctualityScore !== void 0 ? `${journey.day30.attendancePunctualityScore}%` : "\u2014"}
                      </span>
                      <span className="text-[10px] text-green-700 font-medium">Target: &ge; 95%</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Trainer Endorsement</span>
                      <span className="text-xs font-bold text-[#FF5C28] mt-1 block">
                        {journey.day30.trainerEndorsement || "Pending Review"}
                      </span>
                      <span className="text-[10px] text-slate-400">Assigned Trainer Sign-off</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Milestone Target Date</span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {journey.day30.targetDate || "\u2014"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {journey.day30.completedDate ? `Cleared on ${journey.day30.completedDate}` : "Active"}
                      </span>
                    </div>
                  </div>

                  {
    /* Inherited 14-day Non-Major Document Status from NHO */
  }
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#042C51]" />
                        <span className="font-bold text-[#042C51] text-xs">
                          NHO 14-Day Outstanding Non-Major Requirements Check:
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${journey.outstandingNhoDocuments.length === 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {journey.outstandingNhoDocuments.length === 0 ? "All Clear" : `${journey.outstandingNhoDocuments.length} Pending`}
                      </span>
                    </div>
                    {journey.outstandingNhoDocuments.length > 0 ? <div className="mt-2 space-y-1.5 text-[11px]">
                        {journey.outstandingNhoDocuments.map((doc) => <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100">
                            <span>{doc.name}</span>
                            <span className="text-amber-800 font-semibold">Due: {doc.dueDate} &bull; Owner: {doc.documentOwner}</span>
                          </div>)}
                      </div> : <p className="text-[11px] text-slate-500 mt-1">
                        All secondary requirements from orientation have been verified and cleared by HR Operations.
                      </p>}
                  </div>

                  {journey.day30.trainerNotes && <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <strong className="text-slate-700">Trainer Evaluation Notes:</strong> {journey.day30.trainerNotes}
                    </div>}
                </div>
              </div>

              {
    /* Day 60 Card */
  }
              <div className="bg-white rounded-2xl border border-[#E6ECF2] shadow-xs overflow-hidden">
                <div className="p-4 bg-[#F7F9FC] border-b border-[#E6ECF2] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#042C51] font-bold flex items-center justify-center text-xs">
                      60
                    </div>
                    <div>
                      <h3 className="font-bold text-[#042C51] text-xs uppercase tracking-wider">
                        Day 31 - 60: Operational Ramp & Core Independence
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Handle time optimization, complex call resolution, CSAT targets, independent production floor ramp.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${journey.day60.status === "Completed" ? "bg-green-100 text-green-800" : journey.day60.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                      {journey.day60.status}
                    </span>
                    <button
    onClick={() => setSelectedMilestoneModal(60)}
    className="px-3 py-1.5 rounded-lg bg-[#042C51] hover:bg-[#0B365F] text-white font-bold text-xs cursor-pointer"
  >
                      Update Day 60
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Core Production QA</span>
                      <span className="text-base font-extrabold text-[#042C51] mt-0.5 block tabular-nums">
                        {journey.day60.coreProductionScore !== void 0 ? `${journey.day60.coreProductionScore}%` : "\u2014"}
                      </span>
                      <span className="text-[10px] text-green-700 font-medium">Target: &ge; 88%</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Average Handle Time</span>
                      <span className="text-base font-extrabold text-[#042C51] mt-0.5 block tabular-nums">
                        {journey.day60.averageHandleTimeSeconds !== void 0 ? `${journey.day60.averageHandleTimeSeconds}s` : "\u2014"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Target: &le; 400s</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Mid-Probation Decision</span>
                      <span className="text-xs font-bold text-[#042C51] mt-1 block">
                        {journey.day60.midProbationDecision || "Pending Evaluation"}
                      </span>
                      <span className="text-[10px] text-slate-400">Supervisor Checkpoint</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Date</span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {journey.day60.targetDate || "\u2014"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {journey.day60.completedDate ? `Cleared on ${journey.day60.completedDate}` : "Pending Day 60"}
                      </span>
                    </div>
                  </div>

                  {journey.day60.supervisorNotes && <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <strong className="text-slate-700">Supervisor Evaluation Notes:</strong> {journey.day60.supervisorNotes}
                    </div>}
                </div>
              </div>

              {
    /* Day 90 Card */
  }
              <div className="bg-white rounded-2xl border border-[#E6ECF2] shadow-xs overflow-hidden">
                <div className="p-4 bg-[#F7F9FC] border-b border-[#E6ECF2] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-xs">
                      90
                    </div>
                    <div>
                      <h3 className="font-bold text-[#042C51] text-xs uppercase tracking-wider">
                        Day 61 - 90: Regularization Assessment & Mastery
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Comprehensive probationary performance appraisal, multi-party sign-off, regular contract issuance.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${journey.day90.status === "Completed" ? "bg-green-100 text-green-800" : journey.day90.status === "In Progress" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                      {journey.day90.status}
                    </span>
                    <button
    onClick={() => setSelectedMilestoneModal(90)}
    className="px-3 py-1.5 rounded-lg bg-[#042C51] hover:bg-[#0B365F] text-white font-bold text-xs cursor-pointer"
  >
                      Update Day 90
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Composite Score</span>
                      <span className="text-base font-extrabold text-[#042C51] mt-0.5 block tabular-nums">
                        {journey.day90.compositeScore !== void 0 ? `${journey.day90.compositeScore}%` : "\u2014"}
                      </span>
                      <span className="text-[10px] text-green-700 font-medium">Target: &ge; 90%</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Recommendation</span>
                      <span className="text-xs font-bold text-purple-900 mt-1 block">
                        {journey.day90.finalRecommendation || "Pending Decision"}
                      </span>
                      <span className="text-[10px] text-slate-400">Formal Employment Status</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Operations Sign-off</span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {journey.day90.operationsManagerSignOff?.approved ? "Approved" : "Pending"}
                      </span>
                      <span className="text-[10px] text-slate-400">Account OM Review</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">HR Endorsement</span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {journey.day90.hrOperationsSignOff?.approved ? "Regular Contract Issued" : "Pending HR"}
                      </span>
                      <span className="text-[10px] text-slate-400">Full Regularization</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>}

          {
    /* TAB 2: CARRIED-FORWARD NHO ASSETS */
  }
          {activeTab === "nho-assets" && <div className="space-y-4 text-xs">
              
              {
    /* WFM Seating */
  }
              <div className="p-4 bg-white rounded-2xl border border-[#E6ECF2] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#042C51] font-bold">
                  <Building2 className="w-4 h-4 text-[#FF5C28]" />
                  <span>Workforce Management (WFM) Workstation Assignment</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Production Wing</span>
                    <strong className="text-slate-800">{journey.wfmSeating?.wing || "Unassigned"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Workstation Seat #</span>
                    <strong className="text-slate-800">{journey.wfmSeating?.seatNumber || "Unassigned"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Floor / Pod</span>
                    <strong className="text-slate-800">{journey.wfmSeating?.floor || "Standard Floor"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned By</span>
                    <strong className="text-slate-800">{journey.wfmSeating?.assignedBy || "WFM Dispatch"}</strong>
                  </div>
                </div>
              </div>

              {
    /* Trainer Assignment */
  }
              <div className="p-4 bg-white rounded-2xl border border-[#E6ECF2] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#042C51] font-bold">
                  <Award className="w-4 h-4 text-[#042C51]" />
                  <span>Assigned L&D Trainer & Material Review Verification</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Trainer</span>
                    <strong className="text-slate-800">{journey.trainerName || "Maria Elena Garcia"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Trainer ID</span>
                    <strong className="text-slate-800">{journey.trainerId || "TRN-001"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Material Review Status</span>
                    <strong className="text-green-700">Verified & Acknowledged</strong>
                  </div>
                </div>
              </div>

              {
    /* QDS Training Materials */
  }
              <div className="p-4 bg-white rounded-2xl border border-[#E6ECF2] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-[#042C51] font-bold">
                  <BookOpen className="w-4 h-4 text-[#FF5C28]" />
                  <span>QDS Assigned Curriculum Items ({journey.qdsMaterials?.length || 0})</span>
                </div>
                {journey.qdsMaterials && journey.qdsMaterials.length > 0 ? <div className="divide-y divide-slate-100">
                    {journey.qdsMaterials.map((mat) => <div key={mat.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#042C51]">{mat.title}</p>
                          <span className="text-[11px] text-slate-400">{mat.type} &bull; {mat.fileSize || "Catalog Ref"}</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {mat.fileOrLinkRef}
                        </span>
                      </div>)}
                  </div> : <p className="text-slate-400 italic">No curriculum items recorded.</p>}
              </div>

              {
    /* Audit trail */
  }
              <div className="p-4 bg-white rounded-2xl border border-[#E6ECF2] shadow-xs space-y-3">
                <span className="font-bold text-[#042C51] text-xs uppercase tracking-wider block">
                  Transition & Milestone Audit Log
                </span>
                <div className="divide-y divide-slate-100">
                  {journey.auditTrail.map((log, idx) => <div key={idx} className="py-2.5 flex items-start justify-between gap-3 text-[11px]">
                      <div>
                        <strong className="text-slate-800">{log.action}</strong>
                        {log.details && <p className="text-slate-500 mt-0.5">{log.details}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-slate-400 block">{log.date}</span>
                        <span className="text-slate-600 font-medium block">{log.actor}</span>
                      </div>
                    </div>)}
                </div>
              </div>

            </div>}

          {
    /* TAB 3: TOUCHPOINTS */
  }
          {activeTab === "touchpoints" && <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#042C51]">Employee Touchpoint Logs</h4>
                  <p className="text-slate-500 text-[11px]">Record 1-on-1 feedback, weekly nesting debriefs, and wellness check-ins.</p>
                </div>
                <button
    onClick={() => setShowAddTouchpointModal(true)}
    className="px-3.5 py-2 rounded-xl bg-[#FF5C28] hover:bg-[#e04f20] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
  >
                  <Plus className="w-4 h-4" />
                  <span>Log New Touchpoint</span>
                </button>
              </div>

              <div className="space-y-3">
                {journey.touchpoints.length === 0 ? <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-[#E6ECF2] italic">
                    No touchpoints logged yet. Click "Log New Touchpoint" to document initial check-in.
                  </div> : journey.touchpoints.map((tp) => <div key={tp.id} className="p-4 bg-white rounded-2xl border border-[#E6ECF2] shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#042C51]/10 text-[#042C51]">
                            {tp.type}
                          </span>
                          <span className="text-[11px] text-slate-400">{tp.date}</span>
                        </div>
                        {tp.moodRating && <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tp.moodRating === "Thriving" ? "bg-green-100 text-green-800" : tp.moodRating === "Satisfied" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                            {tp.moodRating}
                          </span>}
                      </div>
                      <p className="text-slate-700 leading-relaxed">{tp.notes}</p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Logged by: <strong>{tp.authorName}</strong> ({tp.authorRole})</span>
                      </div>
                    </div>)}
              </div>
            </div>}

        </div>

        {
    /* Modal: Update Day 30 */
  }
        {selectedMilestoneModal === 30 && <div className="fixed inset-0 z-50 bg-[#042C51]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-[#042C51] text-sm">
                  <Sparkles className="w-5 h-5 text-[#FF5C28]" />
                  <span>Update Day 30 Nesting Milestone</span>
                </div>
                <button onClick={() => setSelectedMilestoneModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nesting QA Score (%)</label>
                  <input
    type="number"
    value={day30Qa}
    onChange={(e) => setDay30Qa(Number(e.target.value))}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attendance & Punctuality (%)</label>
                  <input
    type="number"
    value={day30Attendance}
    onChange={(e) => setDay30Attendance(Number(e.target.value))}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer Floor Readiness Endorsement</label>
                  <select
    value={day30Endorsement}
    onChange={(e) => setDay30Endorsement(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  >
                    <option value="Floor Ready">Floor Ready (Approved for Production)</option>
                    <option value="Requires Coaching">Requires Coaching (Targeted Remediation)</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainer Evaluation Notes</label>
                  <textarea
    rows={3}
    value={day30Notes}
    onChange={(e) => setDay30Notes(e.target.value)}
    placeholder="Document call observation scores, compliance adherence..."
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none"
  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
    onClick={() => setSelectedMilestoneModal(null)}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
  >
                  Cancel
                </button>
                <button
    onClick={handleSaveDay30}
    className="px-5 py-2 rounded-xl bg-[#FF5C28] hover:bg-[#e04f20] text-white font-bold"
  >
                  Save & Complete Day 30
                </button>
              </div>
            </div>
          </div>}

        {
    /* Modal: Update Day 60 */
  }
        {selectedMilestoneModal === 60 && <div className="fixed inset-0 z-50 bg-[#042C51]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-[#042C51] text-sm">
                  <Activity className="w-5 h-5 text-[#042C51]" />
                  <span>Update Day 60 Core Performance</span>
                </div>
                <button onClick={() => setSelectedMilestoneModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Core Production QA Score (%)</label>
                  <input
    type="number"
    value={day60ProdScore}
    onChange={(e) => setDay60ProdScore(Number(e.target.value))}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Average Handle Time (Seconds)</label>
                  <input
    type="number"
    value={day60Aht}
    onChange={(e) => setDay60Aht(Number(e.target.value))}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mid-Probation Decision</label>
                  <select
    value={day60Decision}
    onChange={(e) => setDay60Decision(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  >
                    <option value="Progressing Well">Progressing Well</option>
                    <option value="Action Plan Required">Action Plan Required</option>
                    <option value="Probation Warning">Probation Warning</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supervisor Notes</label>
                  <textarea
    rows={3}
    value={day60Notes}
    onChange={(e) => setDay60Notes(e.target.value)}
    placeholder="Document productivity metrics, team collaboration..."
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none"
  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
    onClick={() => setSelectedMilestoneModal(null)}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
  >
                  Cancel
                </button>
                <button
    onClick={handleSaveDay60}
    className="px-5 py-2 rounded-xl bg-[#042C51] hover:bg-[#0B365F] text-white font-bold"
  >
                  Save & Complete Day 60
                </button>
              </div>
            </div>
          </div>}

        {
    /* Modal: Update Day 90 Regularization */
  }
        {selectedMilestoneModal === 90 && <div className="fixed inset-0 z-50 bg-[#042C51]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-[#042C51] text-sm">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  <span>Day 90 Regularization Endorsement</span>
                </div>
                <button onClick={() => setSelectedMilestoneModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Comprehensive Composite Score (%)</label>
                  <input
    type="number"
    value={day90Composite}
    onChange={(e) => setDay90Composite(Number(e.target.value))}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Final Regularization Recommendation</label>
                  <select
    value={day90Rec}
    onChange={(e) => setDay90Rec(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  >
                    <option value="Endorse for Regularization">Endorse for Full Regularization</option>
                    <option value="Extend Probation (30 Days)">Extend Probation (30 Days)</option>
                    <option value="Non-Regularization (End Employment)">Non-Regularization (End Employment)</option>
                  </select>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-[11px] text-purple-900 leading-relaxed border border-purple-200">
                  Approving regularization will issue the official Regular Employment status and contract via HR Operations.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
    onClick={() => setSelectedMilestoneModal(null)}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
  >
                  Cancel
                </button>
                <button
    onClick={handleSaveDay90}
    className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold"
  >
                  Submit Regularization Endorsement
                </button>
              </div>
            </div>
          </div>}

        {
    /* Modal: Add Touchpoint */
  }
        {showAddTouchpointModal && <div className="fixed inset-0 z-50 bg-[#042C51]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-[#042C51] text-sm">Log Employee Touchpoint</span>
                <button onClick={() => setShowAddTouchpointModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTouchpointSubmit} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Touchpoint Type</label>
                  <select
    value={tpType}
    onChange={(e) => setTpType(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  >
                    <option value="1-on-1 Check-in">1-on-1 Check-in</option>
                    <option value="Trainer Coaching">Trainer Coaching</option>
                    <option value="QA Feedback">QA Feedback</option>
                    <option value="HR Wellness">HR Wellness</option>
                    <option value="Attendance Review">Attendance Review</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trainee Engagement / Mood</label>
                  <select
    value={tpMood}
    onChange={(e) => setTpMood(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
  >
                    <option value="Thriving">Thriving (High Confidence)</option>
                    <option value="Satisfied">Satisfied (Normal Track)</option>
                    <option value="Needs Support">Needs Support</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Debrief & Coaching Notes</label>
                  <textarea
    rows={4}
    required
    value={tpNotes}
    onChange={(e) => setTpNotes(e.target.value)}
    placeholder="Enter discussion summary, action items..."
    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs outline-none"
  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
    type="button"
    onClick={() => setShowAddTouchpointModal(false)}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
  >
                    Cancel
                  </button>
                  <button
    type="submit"
    className="px-5 py-2 rounded-xl bg-[#FF5C28] hover:bg-[#e04f20] text-white font-bold"
  >
                    Record Touchpoint
                  </button>
                </div>
              </form>
            </div>
          </div>}

        {
    /* Modal: Link Profile */
  }
        {showLinkModal && <div className="fixed inset-0 z-50 bg-[#042C51]/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-[#042C51] text-sm">
                  <LinkIcon className="w-5 h-5 text-[#FF5C28]" />
                  <span>Link Employee Profile & Confirm Start Date</span>
                </div>
                <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                Connect <strong>{journey.fullName}</strong> to an official SIB Employee ID and confirm Day 1 to initialize milestone timelines.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SIB Employee ID</label>
                  <input
    type="text"
    value={linkSibsId}
    onChange={(e) => setLinkSibsId(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-[#042C51] text-xs"
  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Day 1 Start Date</label>
                  <input
    type="date"
    value={linkStartDate}
    onChange={(e) => setLinkStartDate(e.target.value)}
    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-[#042C51] text-xs"
  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
    onClick={() => setShowLinkModal(false)}
    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
  >
                  Cancel
                </button>
                <button
    onClick={handleSaveLink}
    className="px-5 py-2 rounded-xl bg-[#042C51] hover:bg-[#0B365F] text-white font-bold"
  >
                  Confirm & Activate Timeline
                </button>
              </div>
            </div>
          </div>}

      </div>
    </div>;
}
export {
  EmployeeJourneyDrawer as default
};
