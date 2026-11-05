import { createPortal } from "react-dom";
import { ModalShell, StatusFilterTabs } from "@/components/ui";
import { useState } from "react";
import { useNHO } from "../NHOContext";
import {
  CheckCircle,
  Clock,
  ShieldCheck,
  Sparkles,
  UserX,
  Eye,
  FileCheck,
  Mail,
  X,
  Award,
  Check
} from "lucide-react";
import NHOSendCredentialsModal from "./NHOSendCredentialsModal";
import { getStoredOrientationDeckConfig, getCurrentOrientationAnswers, calculateQuizScore } from "../nhoInitialData";
function NHOApplicantDetails({
  applicant,
  onClose,
  onOpenAttendance,
  onOpenEndorsement,
  onOpenDocVerification,
  initialTab = "overview"
}) {
  const { withdrawApplicant, checkITEndorsementEligibility, showToast } = useNHO();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [isSendCredentialsOpen, setIsSendCredentialsOpen] = useState(false);
  const { isEligible, checks } = checkITEndorsementEligibility(applicant);
  const orientationConfig = getStoredOrientationDeckConfig();
  const completedOrientation = applicant.orientationStatus === "Completed";
  const quizQuestions = completedOrientation && applicant.orientationQuizQuestions || orientationConfig.quizQuestions || [];
  const quizAnswers = completedOrientation ? applicant.orientationQuizAnswers || {} : getCurrentOrientationAnswers(applicant, orientationConfig);
  const benchmark = completedOrientation && applicant.orientationQuizPassingScorePct !== void 0 ? applicant.orientationQuizPassingScorePct : orientationConfig.passingScorePct;
  const calculatedQuizInfo = calculateQuizScore(quizAnswers, { ...orientationConfig, quizQuestions, passingScorePct: benchmark });
  const quizInfo = completedOrientation ? {
    score: applicant.orientationQuizScore ?? calculatedQuizInfo.score,
    total: applicant.orientationQuizTotal ?? calculatedQuizInfo.total,
    percentage: applicant.orientationQuizPercentage ?? calculatedQuizInfo.percentage,
    passed: applicant.orientationQuizPassed ?? calculatedQuizInfo.passed
  } : calculatedQuizInfo;
  const handleWithdraw = () => {
    if (!withdrawReason.trim()) {
      showToast("Please provide a reason for withdrawal.", "error");
      return;
    }
    withdrawApplicant(applicant.id, withdrawReason);
    setShowWithdrawModal(false);
  };
  return <ModalShell
    open
    onClose={onClose}
    variant="navy"
    icon={FileCheck}
    title={applicant.fullName}
    badge={applicant.applicantNumber}
    subtitle={applicant.position + " • " + applicant.department + " (" + applicant.account + ") • NHO: " + applicant.scheduledNhoDate}
    headerMeta={<span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 sibs-text-micro font-bold text-white">{applicant.outcome}</span>}
    maxWidth="max-w-[1600px]"
    className="h-[94dvh] !max-h-[94dvh]"
    bodyClassName="p-0 flex min-h-0 flex-col overflow-hidden bg-sibs-surface"
    footerMeta={<span className="sibs-text-xs text-sibs-muted">{applicant.applicantNumber} · {applicant.cluster}</span>}
    footer={<button type="button" onClick={onClose} className="sibs-modal-btn-secondary">Close Profile</button>}
  >

        {
    /* Keep existing NHO workflow actions inside the applicant profile. */
  }
        {applicant.outcome === "In Progress" && <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-sibs-border bg-sibs-surface px-4 py-2.5 sm:px-6">
            <button type="button" onClick={() => setIsSendCredentialsOpen(true)} className="sibs-modal-btn-primary">
              <Mail className="h-3.5 w-3.5" /> Send Access Link &amp; Credentials
            </button>
            <button type="button" onClick={onOpenAttendance} className="sibs-modal-btn-secondary">
              Update Attendance / Majors
            </button>
            {isEligible && !applicant.itEndorsed && <button type="button" onClick={onOpenEndorsement} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700">
                <Sparkles className="h-3.5 w-3.5" /> Endorse to IT
              </button>}
            <button type="button" onClick={() => setShowWithdrawModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-700 hover:bg-red-50">
              <UserX className="h-3.5 w-3.5" /> Withdraw Candidate
            </button>
          </div>}

      {
    /* Tabs */
  }
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        <StatusFilterTabs tabs={[
    { id: "overview", label: "Overview" },
    { id: "majors", label: `Major Requirements (${applicant.documents.filter((d) => d.isMajor && d.status === "Verified").length}/4)` },
    {
      id: "orientation",
      label: applicant.orientationStatus === "Completed" ? `Orientation (Score: ${quizInfo.score}/${quizInfo.total} \xB7 ${quizInfo.percentage}%)` : `Orientation (${applicant.orientationStatus})`
    },
    { id: "agreements", label: `Essential Agreements (${applicant.documents.filter((d) => d.isEssentialAgreement && d.status === "Verified").length}/3)` },
    { id: "documents", label: "Other Documents & 14-Day Deadline" },
    { id: "history", label: `Activity History (${applicant.auditLogs.length})` }
  ]} activeValue={activeTab} onChange={setActiveTab} layoutId="nhoApplicantProfileTabs" className="shrink-0 flex-wrap !overflow-visible" />

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {
    /* TAB 1: OVERVIEW */
  }
          {activeTab === "overview" && <div className="space-y-6">
              {
    /* Status summary banner - 5 KPI Cards including prominent Orientation & Quiz Score */
  }
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    NHO Attendance
                  </span>
                  <div className="text-base font-bold text-sibs-navy mt-1">
                    {applicant.attendance}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Scheduled: {applicant.scheduledNhoDate}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Physical Clearance
                  </span>
                  <div className={`text-base font-bold mt-1 ${applicant.physicalClearance === "Cleared" ? "text-green-600" : "text-amber-600"}`}>
                    {applicant.physicalClearance}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {applicant.clearedDate ? `Cleared on ${applicant.clearedDate}` : "4 Majors Incomplete"}
                  </span>
                </div>

                {
    /* Card 3: Orientation & Quiz Score */
  }
                <div className="p-4 rounded-xl bg-white border-2 border-emerald-300 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-sibs-orange" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Orientation &amp; Quiz
                    </span>
                    <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      Benchmark
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-black text-sibs-navy">
                      Score: {quizInfo.score}/{quizInfo.total}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {quizInfo.percentage}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                    {applicant.orientationStatus === "Completed" ? `${applicant.orientationCompletedAt || "Completed"} \u2022 Signed` : `Slide ${applicant.orientationCurrentSlide || 1}/7 in progress`}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Temporary Portal Access
                  </span>
                  <div className={`text-base font-bold mt-1 ${applicant.tempAccessStatus === "Active" ? "text-blue-600" : "text-slate-500"}`}>
                    {applicant.tempAccessStatus}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {applicant.hasChangedPassword ? "Password Activated" : "Awaiting First Login"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-sibs-surface border border-sibs-border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    14-Day Non-Major Deadline
                  </span>
                  <div className="text-base font-bold text-sibs-navy mt-1">
                    {applicant.nonMajorDeadlineDate || "Not Started"}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {applicant.nonMajorDeadlineDate ? "Calculated from clearance" : "Awaiting physical clearance"}
                  </span>
                </div>
              </div>

              {
    /* Endorsement Checklist Snapshot */
  }
              <div className="border border-sibs-border rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sibs-navy" />
                    <h3 className="text-xs font-bold text-sibs-navy uppercase tracking-wider">
                      IT Endorsement Mandatory 9-Point Readiness Checklist
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isEligible ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    {isEligible ? "All 9 Passed \u2014 Ready to Endorse" : "Pending Mandatory Criteria"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {checks.map((chk, i) => <div key={i} className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 ${chk.passed ? "bg-green-50/50 border-green-200 text-green-950" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-semibold">{chk.label}</span>
                        {i === 5 && applicant.orientationStatus === "Completed" && <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              Quiz Score: {quizInfo.score}/{quizInfo.total} ({quizInfo.percentage}%)
                            </span>
                            <span className="font-bold text-emerald-700">✓ Benchmark Met</span>
                          </div>}
                      </div>
                      {chk.passed ? <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" /> : <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
                    </div>)}
                </div>
              </div>

              {
    /* Personal & Appointment Details & Orientation Evaluation */
  }
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-sibs-border space-y-2 bg-white">
                  <h4 className="font-bold text-sibs-navy uppercase tracking-wider text-[11px]">
                    Candidate Record Information
                  </h4>
                  <div className="space-y-1.5 text-slate-700">
                    <div><strong>Registered Email:</strong> {applicant.email}</div>
                    <div><strong>Mobile Number:</strong> {applicant.phone}</div>
                    <div><strong>Reporting Location:</strong> {applicant.reportingLocation}</div>
                    <div><strong>Cluster & Account:</strong> {applicant.cluster} — {applicant.account}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border-2 border-emerald-200 space-y-2 bg-emerald-50/20">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sibs-navy uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Orientation & Quiz Evaluation</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Score: {quizInfo.score}/{quizInfo.total}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-slate-700">
                    <div>
                      <strong>Quiz Result:</strong>{" "}
                      <span className="font-black text-emerald-800">
                        {quizInfo.score} of {quizInfo.total} Correct ({quizInfo.percentage}%)
                      </span>{" "}
                      — <span className="text-emerald-700 font-semibold">Benchmark</span>
                    </div>
                    <div><strong>Modules Reviewed:</strong> {applicant.orientationSlidesViewed?.length || 7} / 7 Interactive Slides (100%)</div>
                    <div><strong>Policy Agreement:</strong> {applicant.orientationAcknowledged ? "Signed & Confirmed" : "Pending Signature"}</div>
                    <div><strong>Completed Timestamp:</strong> {applicant.orientationCompletedAt || "2026-10-09 11:20 AM"}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-sibs-border space-y-2 bg-white">
                  <h4 className="font-bold text-sibs-navy uppercase tracking-wider text-[11px]">
                    NHO Administrative Milestones
                  </h4>
                  <div className="space-y-1.5 text-slate-700">
                    <div><strong>Invitation Sent:</strong> {applicant.invitationSentDate} (7+ days notice validated)</div>
                    <div><strong>Kronos ID:</strong> {applicant.officialKronosId || "Not provisioned yet"}</div>
                    <div><strong>WFM Seat:</strong> {applicant.wfmStatus === "Assigned" ? `${applicant.wfmProductionWing} \u2014 Seat ${applicant.wfmSeatNumber}` : applicant.wfmStatus || "Pending"}</div>
                    <div><strong>Handoff Status:</strong> {applicant.handoffStatus}</div>
                  </div>
                </div>
              </div>
            </div>}

          {
    /* TAB 2: MAJOR REQUIREMENTS */
  }
          {activeTab === "majors" && <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Post-NHO Major Requirements Workflow:</strong> After applicant attends NHO (marked Show), they upload their 4 major requirements via their personal portal. TA audits and verifies each submission below or via the consolidated Document Verification queue.
                </div>
              </div>

              <div className="space-y-3">
                {[
    { code: "MAJOR-MED-01", name: "1. Medical Records / Fit to Work Certificate", desc: "Diagnostic medical clearance issued by accredited clinic." },
    { code: "MAJOR-NBI-02", name: "2. NBI Clearance (Original / Valid)", desc: "Official National Bureau of Investigation clearance certificate." },
    { code: "MAJOR-PSA-03", name: "3. PSA Birth Certificate", desc: "Philippine Statistics Authority (PSA) issued Birth Certificate." },
    { code: "MAJOR-ID-04", name: "4. Valid Government ID", desc: "Passport, UMID, PhilID / National ID, or Driver's License." }
  ].map((item) => {
    const doc = applicant.documents.find((d) => d.templateCode === item.code) || {
      id: `doc-${item.code}`,
      name: item.name,
      category: "Major",
      isMajor: true,
      isEssentialAgreement: false,
      status: "Not Submitted",
      deadlineStatus: "On Time",
      dueDate: applicant.scheduledNhoDate,
      templateCode: item.code,
      documentOwner: "TA"
    };
    const isVer = doc?.status === "Verified";
    const isPending = doc?.status === "For Verification";
    const isNeedsCorr = doc?.status === "Needs Correction";
    return <div key={item.code} className="p-4 rounded-xl border border-sibs-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sibs-navy text-xs">{item.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isVer ? "bg-green-100 text-green-800" : isPending ? "bg-blue-100 text-blue-800" : isNeedsCorr ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{item.desc}</p>
                        {doc.fileName && <div className="text-[11px] text-slate-600 font-mono">
                            File: {doc.fileName} {doc.fileSize ? `(${doc.fileSize})` : ""} • Submitted: {doc.submittedDate || "Session"}
                          </div>}
                        {doc.verifiedBy && <span className="text-[10px] text-green-700 font-medium block">
                            Verified on {doc.verifiedDate} by {doc.verifiedBy}
                          </span>}
                        {doc.correctionRemarks && <span className="text-[10px] text-red-600 font-medium block">
                            Correction Note: {doc.correctionRemarks}
                          </span>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.fileName && <button
      onClick={() => onOpenDocVerification(doc)}
      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer flex items-center gap-1"
    >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>}
                        {!isVer && doc.status !== "Not Submitted" && <button
      onClick={() => onOpenDocVerification(doc)}
      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
    >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Verify / Return</span>
                          </button>}
                        {isVer && <span className="text-green-700 font-bold text-xs flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            <span>Verified</span>
                          </span>}
                      </div>
                    </div>;
  })}
              </div>
            </div>}

          {
    /* TAB 3: ORIENTATION */
  }
          {activeTab === "orientation" && <div className="space-y-5 text-xs">
              {
    /* Scorecard Hero Banner */
  }
              <div className="p-5 rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/60 via-white to-blue-50/40 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-sibs-navy text-white flex items-center justify-center font-black text-lg shadow-xs">
                      {quizInfo.score}/{quizInfo.total}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-sibs-navy">Orientation Knowledge Check Score</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {quizInfo.percentage}% · {quizInfo.passed ? "Benchmark met" : "Below benchmark"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Candidate answered {quizInfo.score} of {quizInfo.total} questions correctly (benchmark: {benchmark}%, or {Math.ceil(quizInfo.total * benchmark / 100)} of {quizInfo.total} correct).
                      </p>
                    </div>
                  </div>
                  {applicant.orientationCompletedAt && <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed On</span>
                      <span className="text-xs font-bold text-sibs-navy">{applicant.orientationCompletedAt}</span>
                    </div>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-sibs-border shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Slides Reviewed</span>
                    <span className="font-extrabold text-sibs-navy text-sm block mt-0.5">
                      {applicant.orientationSlidesViewed?.length || 7} / 7 Modules (100%)
                    </span>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-sibs-orange h-full w-full" />
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Quiz Performance</span>
                    <span className="font-extrabold text-emerald-700 text-sm block mt-0.5">
                      {quizInfo.score} / {quizInfo.total} Correct ({quizInfo.percentage}%)
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                      Performance benchmark only
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-sibs-border shadow-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Policy Acknowledgment</span>
                    <span className={`font-extrabold text-sm block mt-0.5 ${applicant.orientationAcknowledged ? "text-emerald-700" : "text-amber-600"}`}>
                      {applicant.orientationAcknowledged ? "Signed & Validated" : "Pending Signature"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                      Clean Desk, Security & Code of Conduct
                    </span>
                  </div>
                </div>
              </div>

              {
    /* Detailed Question Review */
  }
              <div className="border border-sibs-border rounded-xl bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-sibs-border pb-2.5">
                  <h4 className="font-bold text-sibs-navy text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-sibs-orange" />
                    <span>Knowledge Check Evaluation Audit ({quizQuestions.length} Questions)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600">
                    Total Score: <strong className="text-emerald-700">{quizInfo.score} / {quizInfo.total} ({quizInfo.percentage}%)</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {quizQuestions.map((q, qIdx) => {
    const candidateAnswerIdx = quizAnswers[qIdx];
    const isAnswered = candidateAnswerIdx !== void 0;
    const isCorrect = isAnswered && candidateAnswerIdx === q.correctOptionIndex;
    return <div
      key={q.id}
      className={`p-3.5 rounded-xl border transition-all ${isCorrect ? "bg-emerald-50/30 border-emerald-200" : "bg-amber-50/30 border-amber-200"}`}
    >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-sibs-navy">
                                Question {q.id}: {q.question}
                              </span>
                            </div>

                            <div className="text-[11px] mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-semibold">Candidate Response:</span>
                                <span className={`font-bold ${isCorrect ? "text-emerald-700" : "text-amber-800"}`}>
                                  {isAnswered ? q.options[candidateAnswerIdx] : "Not answered"}
                                </span>
                              </div>
                              {!isCorrect && <div className="flex items-center gap-2">
                                  <span className="text-slate-500 font-semibold">Correct Answer:</span>
                                  <span className="font-bold text-emerald-700">
                                    {q.options[q.correctOptionIndex]}
                                  </span>
                                </div>}
                              <p className="text-[10px] text-slate-500 italic mt-1 bg-white/70 p-2 rounded-lg border border-slate-200">
                                <strong>Policy Rule:</strong> {q.explanation}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCorrect ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                                <Check className="w-3 h-3 text-emerald-600" /> Correct (+1)
                              </span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                                <X className="w-3 h-3 text-amber-600" /> Incorrect (0)
                              </span>}
                          </div>
                        </div>
                      </div>;
  })}
                </div>
              </div>
            </div>}

          {
    /* TAB 4: ESSENTIAL AGREEMENTS */
  }
          {activeTab === "agreements" && <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950">
                <strong>Three Mandatory Essential Agreements:</strong> Required before IT Endorsement. The candidate signs each separately (drawn electronic signature or manual upload).
              </div>

              {[
    { code: "AGR-POL-01", name: "1. Acceptance to Company Policy" },
    { code: "AGR-BOND-02", name: "2. Memo 01.2022 and Training Bond (NHO)" },
    { code: "AGR-NDA-03", name: "3. New NDA (Non-Disclosure Agreement)" }
  ].map((ag) => {
    const doc = applicant.documents.find((d) => d.templateCode === ag.code);
    const isVer = doc?.status === "Verified";
    return <div key={ag.code} className="p-4 rounded-xl border border-sibs-border bg-white flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-sibs-navy text-xs block">{ag.name}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {doc?.submissionMethod ? `Submitted via ${doc.submissionMethod}` : "Not submitted yet"}
                        {doc?.fileName ? ` \u2022 ${doc.fileName}` : ""}
                      </div>
                      {doc?.correctionRemarks && <span className="text-[10px] text-red-600 font-medium block mt-1">
                          Correction Remarks: {doc.correctionRemarks}
                        </span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isVer ? "bg-green-100 text-green-800" : doc?.status === "For Verification" ? "bg-blue-100 text-blue-800" : doc?.status === "Needs Correction" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                        {doc?.status || "Not Submitted"}
                      </span>

                      {doc && <button
      onClick={() => onOpenDocVerification(doc)}
      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer flex items-center gap-1"
    >
                          <Eye className="w-3 h-3" />
                          <span>Review</span>
                        </button>}
                    </div>
                  </div>;
  })}
            </div>}

          {
    /* TAB 5: OTHER DOCUMENTS & 14-DAY DEADLINE */
  }
          {activeTab === "documents" && <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-sibs-border bg-sibs-surface flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-sibs-navy text-xs uppercase tracking-wider block">
                    Standard 14-Calendar-Day Non-Major Deadline
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Calculated strictly 14 days from successfully completed physical NHO clearance.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-sibs-navy">
                    {applicant.nonMajorDeadlineDate || "Not Established"}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {applicant.clearedDate ? `Cleared: ${applicant.clearedDate}` : "Awaiting Clearance"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {applicant.documents.filter((d) => !d.isMajor && !d.isEssentialAgreement).map((d) => <div key={d.id} className="p-3 bg-white border border-sibs-border rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-sibs-navy text-xs block">{d.name}</span>
                      <span className="text-[11px] text-slate-500">{d.category} • Due: {d.dueDate}</span>
                      {d.fileName && <span className="text-[10px] text-slate-400 block">File: {d.fileName}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status === "Verified" ? "bg-green-100 text-green-800" : d.deadlineStatus === "Overdue" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                        {d.status} ({d.deadlineStatus})
                      </span>

                      <button
    onClick={() => onOpenDocVerification(d)}
    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
    title="Review Document"
  >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>)}
              </div>
            </div>}

          {
    /* TAB 6: ACTIVITY HISTORY */
  }
          {activeTab === "history" && <div className="space-y-3 text-xs">
              <span className="font-bold text-sibs-navy text-xs uppercase tracking-wider block">
                Audited NHO Workflow Timeline ({applicant.auditLogs.length} events)
              </span>

              <div className="space-y-2">
                {applicant.auditLogs.map((log) => <div key={log.id} className="p-3 bg-white border border-sibs-border rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-sibs-navy">{log.action}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 leading-normal">{log.details}</p>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Actor: <strong className="text-slate-600">{log.actor}</strong> ({log.role})
                    </div>
                  </div>)}
              </div>
            </div>}
        </div>
      </div>


      {
    /* Withdraw Modal */
  }
      {showWithdrawModal && createPortal(<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[10020]">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-sm font-bold text-red-600 mb-2">Confirm Candidate Withdrawal</h3>
            <p className="text-slate-600 leading-relaxed mb-3">
              Closing this case as Withdrawn will immediately deactivate temporary NHO portal access and suspend pending IT endorsement activities. History will be preserved.
            </p>
            <textarea
    rows={3}
    value={withdrawReason}
    onChange={(e) => setWithdrawReason(e.target.value)}
    placeholder="Mandatory withdrawal reason (e.g. Candidate accepted another job offer, relocation)..."
    className="w-full p-2.5 border border-slate-300 rounded-xl mb-4 focus:outline-none"
  />
            <div className="flex justify-end gap-2">
              <button
    onClick={() => setShowWithdrawModal(false)}
    className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
  >
                Cancel
              </button>
              <button
    onClick={handleWithdraw}
    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
  >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>, document.body)}

      {
    /* Send Credentials Modal */
  }
      {isSendCredentialsOpen && createPortal(<NHOSendCredentialsModal
    applicant={applicant}
    isOpen={isSendCredentialsOpen}
    onClose={() => setIsSendCredentialsOpen(false)}
  />, document.body)}
    </ModalShell>;
}
export {
  NHOApplicantDetails as default
};
