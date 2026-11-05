import { useState } from "react";
import { useNHO } from "../NHOContext";
import NHOSignatureModal from "./NHOSignatureModal";
import NHOOrientationViewer from "./NHOOrientationViewer";
import { CheckCircle, PenTool, Upload, ChevronRight, Check, Lock } from "lucide-react";
function NHOApplicantPortal({ subTab = "overview", onSubTabChange }) {
  const {
    activeApplicant,
    simulatedCurrentDate,
    submitOtherDocument,
    simulatePasswordRetrieval,
    simulateLinkExpiration,
    recoverRetrievalLink,
    applicantChangePassword,
    simulateFirstRegularLogin,
    showToast
  } = useNHO();
  const [activeSubTab, setActiveSubTab] = useState(subTab);
  const [expandedMajorDoc, setExpandedMajorDoc] = useState(null);
  const [expandedAgreementDoc, setExpandedAgreementDoc] = useState(null);
  const [signingDoc, setSigningDoc] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const currentTab = onSubTabChange ? subTab : activeSubTab;
  const setTab = onSubTabChange ? onSubTabChange : setActiveSubTab;
  const handleUploadFile = (doc, e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      submitOtherDocument(activeApplicant.id, doc.id, file.name, sizeStr);
    }
  };
  const handlePasswordChangeSubmit = () => {
    if (newPasswordInput.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    applicantChangePassword(activeApplicant.id, newPasswordInput);
    setShowPasswordChangeModal(false);
    setNewPasswordInput("");
  };
  const isOrientationPassed = activeApplicant.orientationStatus === "Completed";
  const majorDocs = activeApplicant.documents.filter((d) => d.isMajor);
  const agreements = activeApplicant.documents.filter((d) => d.isEssentialAgreement);
  const nonMajorDocs = activeApplicant.documents.filter((d) => !d.isMajor && !d.isEssentialAgreement);
  const verifiedMajorsCount = majorDocs.filter((d) => d.status === "Verified").length;
  const verifiedAgreementsCount = agreements.filter((d) => d.status === "Verified").length;
  const verifiedNonMajorsCount = nonMajorDocs.filter((d) => d.status === "Verified").length;
  const nonMajorOutstandingCount = nonMajorDocs.length - verifiedNonMajorsCount;
  const isNonMajorOverdue = nonMajorDocs.some((doc) => ["Not Submitted", "Needs Correction", "Draft"].includes(doc.status)) && Boolean(activeApplicant.nonMajorDeadlineDate) && simulatedCurrentDate > (activeApplicant.nonMajorDeadlineDate || "");
  const overviewTasks = [
    {
      id: "orientation",
      label: "Orientation & knowledge check quiz",
      description: isOrientationPassed ? `Completed & Acknowledged \xB7 Score: ${activeApplicant.orientationQuizScore ?? 6}/${activeApplicant.orientationQuizTotal ?? 6}` : activeApplicant.orientationStatus,
      complete: isOrientationPassed
    },
    {
      id: "majors",
      label: "Major document requirements",
      description: `${verifiedMajorsCount} of ${majorDocs.length} verified`,
      complete: majorDocs.length > 0 && verifiedMajorsCount === majorDocs.length
    },
    {
      id: "agreements",
      label: "Essential employment agreements",
      description: `${verifiedAgreementsCount} of ${agreements.length} verified`,
      complete: agreements.length > 0 && verifiedAgreementsCount === agreements.length
    },
    {
      id: "requirements",
      label: "Additional documents",
      description: `${verifiedNonMajorsCount} of ${nonMajorDocs.length} verified`,
      complete: nonMajorOutstandingCount === 0
    }
  ];
  const needsCandidateUpload = (docs) => docs.some((doc) => ["Not Submitted", "Needs Correction", "Draft"].includes(doc.status));
  const actionableOverviewId = !isOrientationPassed ? "orientation" : needsCandidateUpload(majorDocs) ? "majors" : needsCandidateUpload(agreements) ? "agreements" : needsCandidateUpload(nonMajorDocs) ? "requirements" : void 0;
  const nextOverviewTask = overviewTasks.find((task) => task.id === actionableOverviewId) || overviewTasks.find((t) => !t.complete);
  const waitingForReview = !actionableOverviewId && overviewTasks.some((task) => !task.complete);
  return <div className="space-y-6 font-jakarta">
      {
    /* A clear landing workspace; the checklist belongs to the portal shell. */
  }
      {currentTab === "overview" && <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(260px,1fr)]">
          <div className="rounded-2xl border border-sibs-border bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sibs-orange to-sibs-orange" />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-sibs-orange">
              {waitingForReview ? "Awaiting verification" : nextOverviewTask ? "Your next action" : "Onboarding complete"}
            </p>
            <h2 className="mt-2 max-w-xl text-[21px] font-extrabold tracking-tight text-sibs-navy">
              {waitingForReview ? "Your submitted files are under review" : nextOverviewTask ? nextOverviewTask.label : "All onboarding tasks are verified"}
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-sibs-muted font-medium">
              {waitingForReview ? "You have no pending candidate actions right now. Talent Acquisition must verify the remaining submissions. You can review their status below." : nextOverviewTask?.id === "majors" ? "Submit the required pre-employment documents individually. Talent Acquisition will review each submission before verification." : nextOverviewTask?.id === "orientation" ? "Review the orientation parts and complete their checkpoint questions and final acknowledgment." : nextOverviewTask?.id === "agreements" ? "Review the required agreements and submit an electronic signature or a signed copy for verification." : nextOverviewTask?.id === "requirements" ? "Your mandatory documents and agreements are complete. Finish any remaining additional uploads to close out your checklist." : "There are no outstanding documents or onboarding activities in your current checklist. You can still review your previous submissions."}
            </p>
            {nextOverviewTask && <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
    type="button"
    onClick={() => setTab(nextOverviewTask.id)}
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sibs-orange px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-sibs-button-hover shadow-xs cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-orange"
  >
                  {waitingForReview ? "View submitted items" : nextOverviewTask.id === "orientation" ? "Continue orientation" : nextOverviewTask.id === "agreements" ? "Review agreements" : "Open requirements"}
                  <ChevronRight size={15} />
                </button>
                <span className="text-[12px] font-semibold text-sibs-muted">{nextOverviewTask.description}</span>
              </div>}
            {!nextOverviewTask && <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-[12px] font-bold text-green-700 border border-green-200">
                <CheckCircle size={17} /> All requirements verified
              </div>}
            {isNonMajorOverdue && !waitingForReview && nextOverviewTask?.id === "requirements" && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 border border-red-200">
                The additional-document deadline ({activeApplicant.nonMajorDeadlineDate}) has passed. Please submit the outstanding document and contact TA if an extension is needed.
              </p>}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-sibs-border bg-white p-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sibs-navy via-sibs-tertiary-2 to-sibs-orange" />
              <h3 className="text-sm font-extrabold text-sibs-navy">Important information</h3>
              <div className="mt-4 space-y-3 text-[12px]">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sibs-muted">NHO attendance</span>
                  <span className="text-right font-bold text-sibs-navy">{activeApplicant.attendance}<span className="block font-medium text-sibs-muted">{activeApplicant.scheduledNhoDate}</span></span>
                </div>
                <div className="h-px bg-sibs-border" />
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sibs-muted">Additional document deadline</span>
                  <span className={`text-right font-bold ${isNonMajorOverdue ? "text-red-700" : "text-sibs-navy"}`}>
                    {activeApplicant.nonMajorDeadlineDate || "Not scheduled"}
                    {isNonMajorOverdue && <span className="block text-[10px]">Overdue</span>}
                  </span>
                </div>
                <div className="h-px bg-sibs-border" />
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sibs-muted">Pending additional documents</span>
                  <span className="font-bold text-sibs-navy">{nonMajorOutstandingCount}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-sibs-border bg-white p-5 shadow-xs">
              <h3 className="text-sm font-extrabold text-sibs-navy">Already completed</h3>
              <div className="mt-3 space-y-2.5">
                {overviewTasks.filter((task) => task.complete).length ? overviewTasks.filter((task) => task.complete).map((task) => <button
    type="button"
    key={task.id}
    onClick={() => setTab(task.id)}
    className="flex w-full items-center gap-2 rounded-lg py-1 text-left text-[12px] font-semibold text-sibs-muted hover:text-sibs-navy"
  >
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="min-w-0 flex-1">{task.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sibs-muted" />
                  </button>) : <p className="text-xs text-sibs-muted">Completed tasks will appear here once verified.</p>}
              </div>
            </div>
          </div>
        </div>}

      {
    /* Sequential Lock Enforcement: Orientation must be completed first */
  }
      {["majors", "agreements", "requirements"].includes(currentTab) && activeApplicant.orientationStatus !== "Completed" && <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
              Step 1 Incomplete
            </span>
            <h3 className="text-lg font-extrabold text-sibs-navy">Complete Orientation &amp; Quiz First</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              In accordance with SiBS NHO workflow policy, you must review the orientation presentation modules and complete the knowledge check quiz before submitting pre-employment documents and signing agreements.
            </p>
          </div>
          <div>
            <button
    type="button"
    onClick={() => setTab("orientation")}
    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
  >
              <span>Go to Orientation &amp; Quiz</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>}

            {
    /* Locked screen if attempting to access requirements before orientation is completed */
  }
      {["majors", "agreements", "requirements"].includes(currentTab) && !isOrientationPassed && <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-extrabold text-sibs-navy">Passing of Requirements is Locked</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Complete the orientation slides and quiz checkpoints first to unlock requirement submission.
            </p>
          </div>
          <div className="pt-2">
            <button
    type="button"
    onClick={() => setTab("orientation")}
    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
  >
              <span>Go to Orientation &amp; Quiz →</span>
            </button>
          </div>
        </div>}

      {
    /* Major requirements: compact rows with details on demand. */
  }
      {currentTab === "majors" && isOrientationPassed && <div className="overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sibs-navy via-sibs-tertiary-2 to-sibs-orange" />
          <div className="border-b border-sibs-border px-5 py-5 sm:px-6 pt-6">
            <h2 className="text-[15px] font-extrabold text-sibs-navy">Mandatory pre-employment documents</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-sibs-muted">
              Submit each document individually. Talent Acquisition reviews uploaded files before IT endorsement.
            </p>
            <p className="mt-3 text-[11px] font-bold text-sibs-muted">{verifiedMajorsCount} of {majorDocs.length} verified</p>
          </div>
          <div className="divide-y divide-sibs-border">
            {[
    { code: "MAJOR-MED-01", name: "Medical Records / Fit to Work Certificate", desc: "Medical clearance from an accredited clinic confirming fitness for duty." },
    { code: "MAJOR-NBI-02", name: "NBI Clearance (Original / Valid)", desc: "Valid NBI clearance certificate, including its QR code when provided." },
    { code: "MAJOR-PSA-03", name: "PSA Birth Certificate", desc: "Philippine Statistics Authority Certificate of Live Birth." },
    { code: "MAJOR-ID-04", name: "Valid Government ID", desc: "Passport, UMID, PhilID / National ID, or Driver's License." }
  ].map((item, index) => {
    const doc = activeApplicant.documents.find((d) => d.templateCode === item.code) || {
      id: `doc-${item.code}`,
      name: item.name,
      category: "Major",
      isMajor: true,
      isEssentialAgreement: false,
      status: "Not Submitted",
      deadlineStatus: "On Time",
      dueDate: activeApplicant.scheduledNhoDate,
      templateCode: item.code,
      documentOwner: "TA"
    };
    const isVer = doc.status === "Verified";
    const needsCorrection = doc.status === "Needs Correction";
    const isExpanded = expandedMajorDoc === doc.id;
    return <div key={item.code} className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <button
      type="button"
      onClick={() => setExpandedMajorDoc(isExpanded ? null : doc.id)}
      aria-expanded={isExpanded}
      aria-controls={`major-detail-${item.code}`}
      className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sibs-orange"
    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${isVer ? "bg-green-50 text-green-700" : "bg-sibs-surface text-sibs-muted"}`}>
                        {isVer ? <Check size={17} /> : index + 1}
                      </span>
                      <span className="min-w-0 space-y-1">
                        <span className="block text-[13px] font-bold text-sibs-navy">{item.name}</span>
                        <span className={`block text-[11px] font-bold ${isVer ? "text-green-700" : needsCorrection ? "text-red-700" : doc.status === "For Verification" ? "text-blue-700" : "text-sibs-muted"}`}>{doc.status}</span>
                        {doc.fileName && <span className="block max-w-full break-all text-[11px] text-sibs-muted">{doc.fileName}</span>}
                      </span>
                      <ChevronRight size={15} className={`mt-2 shrink-0 text-sibs-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                      {!isVer ? <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-sibs-orange px-3.5 py-2 text-[11px] font-bold text-white hover:bg-sibs-button-hover">
                          <Upload size={14} /> {needsCorrection ? "Resubmit" : doc.status === "For Verification" ? "Replace file" : "Upload file"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => handleUploadFile(doc, event)} className="sr-only" />
                        </label> : <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-[11px] font-bold text-green-700 border border-green-200"><CheckCircle size={14} /> Verified</span>}
                    </div>
                  </div>
                  {isExpanded && <div id={`major-detail-${item.code}`} className="ml-11 mt-3 space-y-2 rounded-xl bg-sibs-surface px-4 py-3 text-[12px] leading-relaxed text-sibs-muted">
                      <p>{item.desc}</p>
                      {doc.fileSize && <p>File size: {doc.fileSize}</p>}
                      {doc.submittedDate && <p>Submitted: {doc.submittedDate}</p>}
                      {isVer && doc.verifiedBy && <p className="font-semibold text-green-700">Verified by {doc.verifiedBy} on {doc.verifiedDate || activeApplicant.clearedDate || "NHO session"}</p>}
                      {needsCorrection && doc.correctionRemarks && <p className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700 border border-red-200">Correction required: {doc.correctionRemarks}</p>}
                      {!doc.fileName && <p>No file has been submitted yet.</p>}
                    </div>}
                </div>;
  })}
          </div>
        </div>}

      {
    /* Orientation Tab */
  }
      {currentTab === "orientation" && <NHOOrientationViewer onProceedToRequirements={() => setTab("majors")} />}

      {
    /* Agreement signing retains the original electronic signature / upload modal. */
  }
      {currentTab === "agreements" && isOrientationPassed && <div className="overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sibs-navy via-sibs-tertiary-2 to-sibs-orange" />
          <div className="border-b border-sibs-border px-5 py-5 sm:px-6 pt-6">
            <h2 className="text-[15px] font-extrabold text-sibs-navy">Essential employment agreements</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-sibs-muted">Sign electronically or upload a signed copy. Talent Acquisition must verify all agreements before IT endorsement.</p>
            <p className="mt-3 text-[11px] font-bold text-sibs-muted">{verifiedAgreementsCount} of {agreements.length} verified</p>
          </div>
          <div className="divide-y divide-sibs-border">
            {agreements.map((doc, index) => {
    const isVer = doc.status === "Verified";
    const needsCorrection = doc.status === "Needs Correction";
    const isExpanded = expandedAgreementDoc === doc.id;
    return <div key={doc.id} className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <button
      type="button"
      onClick={() => setExpandedAgreementDoc(isExpanded ? null : doc.id)}
      aria-expanded={isExpanded}
      aria-controls={`agreement-detail-${doc.id}`}
      className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sibs-orange"
    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${isVer ? "bg-green-50 text-green-700" : "bg-sibs-surface text-sibs-muted"}`}>
                        {isVer ? <Check size={17} /> : index + 1}
                      </span>
                      <span className="min-w-0 space-y-1">
                        <span className="block text-[13px] font-bold text-sibs-navy">{doc.name}</span>
                        <span className={`block text-[11px] font-bold ${isVer ? "text-green-700" : needsCorrection ? "text-red-700" : doc.status === "For Verification" ? "text-blue-700" : "text-sibs-muted"}`}>{doc.status}</span>
                        {doc.fileName && <span className="block break-all text-[11px] text-sibs-muted">{doc.fileName}</span>}
                      </span>
                      <ChevronRight size={15} className={`mt-2 shrink-0 text-sibs-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                      {!isVer ? <button
      type="button"
      onClick={() => setSigningDoc(doc)}
      className="inline-flex items-center gap-2 rounded-lg bg-sibs-orange px-3.5 py-2 text-[11px] font-bold text-white hover:bg-sibs-button-hover"
    >
                          <PenTool size={14} /> {needsCorrection ? "Correct signing" : doc.status === "Not Submitted" ? "Sign agreement" : "Update signature"}
                        </button> : <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-[11px] font-bold text-green-700 border border-green-200"><CheckCircle size={14} /> Verified</span>}
                    </div>
                  </div>
                  {isExpanded && <div id={`agreement-detail-${doc.id}`} className="ml-11 mt-3 space-y-2 rounded-xl bg-sibs-surface px-4 py-3 text-[12px] leading-relaxed text-sibs-muted">
                      <p>{doc.description || "SiBS employment agreement"}</p>
                      {doc.submissionMethod && <p>Submission method: {doc.submissionMethod}</p>}
                      {doc.submittedDate && <p>Submitted: {doc.submittedDate}</p>}
                      {isVer && doc.verifiedBy && <p className="font-semibold text-green-700">Verified by {doc.verifiedBy}{doc.verifiedDate ? ` on ${doc.verifiedDate}` : ""}</p>}
                      {needsCorrection && doc.correctionRemarks && <p className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-700 border border-red-200">Correction required: {doc.correctionRemarks}</p>}
                    </div>}
                </div>;
  })}
          </div>
        </div>}

      {
    /* Non-Major Requirements Tab */
  }
      {currentTab === "requirements" && isOrientationPassed && <div className="space-y-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-sibs-border shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-sibs-navy">Other Pre-Employment Requirements & NHO Templates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard 14-calendar-day window applies from your physical NHO session date. Pending non-majors do not block IT endorsement.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Deadline</span>
              <span className={`font-bold text-xs ${isNonMajorOverdue ? "text-red-700" : "text-sibs-navy"}`}>
                {activeApplicant.nonMajorDeadlineDate || "Not Started"}{isNonMajorOverdue ? " \xB7 Overdue" : ""}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-sibs-border shadow-xs divide-y divide-sibs-border">
            {[...nonMajorDocs].sort((a, b) => Number(a.status === "Verified") - Number(b.status === "Verified")).map((doc) => {
    const isVer = doc.status === "Verified";
    const isPending = doc.status === "For Verification";
    const deadlineLabel = !isVer && ["Not Submitted", "Needs Correction", "Draft"].includes(doc.status) && isNonMajorOverdue ? "Overdue" : doc.deadlineStatus;
    return <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs">{doc.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isVer ? "bg-green-100 text-green-800" : deadlineLabel === "Overdue" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}`}>
                        {doc.status} ({deadlineLabel})
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{doc.description}</p>
                    {doc.status === "Needs Correction" && doc.correctionRemarks && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">Correction needed: {doc.correctionRemarks}</p>}
                    {doc.fileName && <span className="text-[10px] text-slate-400 block font-mono">
                        Uploaded: {doc.fileName}
                      </span>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isVer && <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{doc.status === "Needs Correction" ? "Resubmit file" : isPending ? "Replace file" : "Upload file"}</span>
                        <input
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      onChange={(e) => handleUploadFile(doc, e)}
      className="hidden"
    />
                      </label>}

                    {isVer && <span className="text-green-700 font-bold text-xs flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>Verified</span>
                      </span>}
                  </div>
                </div>;
  })}
          </div>
        </div>}

      {
    /* Personal Information Tab */
  }
      {currentTab === "profile" && <div className="bg-white rounded-2xl border border-sibs-border p-6 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-sibs-navy">Candidate Personal Information</h2>
          <p className="text-slate-500 text-xs">
            Official HRIS employee profile prefilled from recruitment intake records.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Legal Name</span>
              <span className="font-bold text-slate-800 text-xs block mt-1">{activeApplicant.fullName}</span>
            </div>

            <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Applicant ID</span>
              <span className="font-bold text-slate-800 text-xs block mt-1 font-mono">{activeApplicant.applicantNumber}</span>
            </div>

            <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Official Position</span>
              <span className="font-bold text-slate-800 text-xs block mt-1">{activeApplicant.position}</span>
            </div>

            <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Department & Account</span>
              <span className="font-bold text-slate-800 text-xs block mt-1">{activeApplicant.department} — {activeApplicant.account}</span>
            </div>

            <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Work Location</span>
              <span className="font-bold text-slate-800 text-xs block mt-1">{activeApplicant.reportingLocation}</span>
            </div>

            <div className="p-3 bg-sibs-surface rounded-xl border border-sibs-border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Kronos ID</span>
              <span className="font-bold text-slate-800 text-xs block mt-1 font-mono">{activeApplicant.officialKronosId || "Awaiting IT Provisioning"}</span>
            </div>
          </div>
        </div>}

      {
    /* Simulated Auth & Temporary Access Tab */
  }
      {currentTab === "login-sim" && <div className="bg-white rounded-2xl border border-sibs-border p-6 shadow-xs space-y-5 text-xs">
          <div className="pb-3 border-b border-sibs-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sibs-orange block">
              Authentication Simulation
            </span>
            <h2 className="text-base font-bold text-sibs-navy">
              Simulated Temporary Account & Authentication Lifecycle
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Demonstrates the system-generated temporary password, 24-hour one-time retrieval link dispatched upon Show attendance, mandatory first-login password change, and final transition to normal HRIS login.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-sibs-border bg-sibs-surface space-y-2">
              <span className="font-bold text-sibs-navy text-xs block">1. One-Time Retrieval Link</span>
              <p className="text-slate-500 text-[11px]">
                24-hour expiration token issued after TA marks Show attendance.
              </p>
              <div className="space-y-1.5 pt-1">
                <button
    onClick={() => simulatePasswordRetrieval(activeApplicant.id)}
    disabled={activeApplicant.tempAccessStatus !== "Active"}
    className="w-full py-2 rounded-lg bg-sibs-navy hover:bg-sibs-tertiary-2 disabled:opacity-40 text-white font-bold text-xs cursor-pointer disabled:cursor-not-allowed"
  >
                  Retrieve Password via Link
                </button>
                <div className="flex gap-1.5">
                  <button
    onClick={() => simulateLinkExpiration(activeApplicant.id)}
    className="flex-1 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-semibold cursor-pointer"
    title="Simulate 24-hr link expiry to test expiration restriction"
  >
                    Test Expire
                  </button>
                  <button
    onClick={() => recoverRetrievalLink(activeApplicant.id)}
    className="flex-1 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-semibold cursor-pointer"
    title="Request replacement link: invalidates old and issues new"
  >
                    Recover Link
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-sibs-border bg-sibs-surface space-y-2">
              <span className="font-bold text-sibs-navy text-xs block">2. First-Login Password Change</span>
              <p className="text-slate-500 text-[11px]">
                Temporary password must be replaced with a secure personal password.
              </p>
              <button
    onClick={() => setShowPasswordChangeModal(true)}
    disabled={activeApplicant.tempAccessStatus !== "Active"}
    className="w-full py-2 rounded-lg bg-sibs-orange hover:bg-sibs-button-hover disabled:opacity-40 text-white font-bold text-xs cursor-pointer disabled:cursor-not-allowed"
  >
                Change Initial Password
              </button>
            </div>

            <div className="p-4 rounded-xl border border-sibs-border bg-sibs-surface space-y-2">
              <span className="font-bold text-sibs-navy text-xs block">3. Corporate SSO Transition</span>
              <p className="text-slate-500 text-[11px]">
                First login via Kronos deactivates temporary NHO access for this employee.
              </p>
              <button
    onClick={() => simulateFirstRegularLogin(activeApplicant.id)}
    disabled={!activeApplicant.officialKronosId}
    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs cursor-pointer disabled:cursor-not-allowed"
  >
                Simulate Regular HRIS Login
              </button>
            </div>

            <div className="p-4 rounded-xl border border-sibs-border bg-sibs-surface space-y-1.5 text-[11px]">
              <span className="font-bold text-sibs-navy text-xs block">Simulation Parameters</span>
              <div className="text-slate-600">Registered Email: <span className="font-semibold text-slate-800">{activeApplicant.email}</span></div>
              <div className="text-slate-600">Token: <span className="font-mono font-bold text-slate-800">{activeApplicant.passwordRetrievalToken || "None"}</span></div>
              <div className="text-slate-600">Expires: <span className="font-medium text-slate-800">{activeApplicant.retrievalLinkExpiresAt || "\u2014"}</span></div>
              <div className="text-slate-600">Link Used: <strong className={activeApplicant.retrievalLinkUsed ? "text-amber-700" : "text-green-700"}>{activeApplicant.retrievalLinkUsed ? "Yes (Consumed)" : "No (Available)"}</strong></div>
              <div className="text-slate-600">Link Expired: <strong className={activeApplicant.retrievalLinkExpired ? "text-red-700" : "text-green-700"}>{activeApplicant.retrievalLinkExpired ? "Yes" : "No"}</strong></div>
              <div className="text-slate-600">Recoveries: <strong>{activeApplicant.retrievalRecoveryCount || 0}</strong></div>
            </div>
          </div>

          {
    /* Account status state display */
  }
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
            <span className="font-bold block text-xs">Current Temporary Access State:</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div>Status: <strong>{activeApplicant.tempAccessStatus}</strong></div>
              <div>Password Changed: <strong>{activeApplicant.hasChangedPassword ? "Yes" : "No (Mandatory)"}</strong></div>
              <div>First Regular Login: <strong>{activeApplicant.firstRegularHrisLoginAt || "None"}</strong></div>
              <div>Kronos ID: <strong>{activeApplicant.officialKronosId || "Pending IT Provisioning"}</strong></div>
            </div>
          </div>
        </div>}

      {
    /* Signing Modal */
  }
      {signingDoc && <NHOSignatureModal
    isOpen={!!signingDoc}
    onClose={() => setSigningDoc(null)}
    document={signingDoc}
    applicantId={activeApplicant.id}
  />}

      {
    /* Password Change Modal */
  }
      {showPasswordChangeModal && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <h3 className="text-sm font-bold text-sibs-navy">Set Your Permanent Password</h3>
            <p className="text-slate-600">
              For security, you must replace your temporary system-generated password upon first accessing the SiBS NHO Portal.
            </p>
            <input
    type="password"
    value={newPasswordInput}
    onChange={(e) => setNewPasswordInput(e.target.value)}
    placeholder="Enter new secure password (min 8 chars)..."
    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none"
  />
            <div className="flex justify-end gap-2">
              <button
    onClick={() => setShowPasswordChangeModal(false)}
    className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100"
  >
                Cancel
              </button>
              <button
    onClick={handlePasswordChangeSubmit}
    className="px-4 py-1.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white font-bold"
  >
                Save New Password
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
export {
  NHOApplicantPortal as default
};
