import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NHOProvider, useNHO } from "@/components/recruitment/nho/NHOContext";
import { JourneyProvider } from "@/components/recruitment/journey/JourneyContext";
import NHOApplicantPortal from "@/components/recruitment/nho/applicant/NHOApplicantPortal";
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronRight, ClipboardList, FileText, GraduationCap, Lock, LockKeyhole, Menu, PenLine, UserRound, X } from "lucide-react";
const CORE_SECTIONS = [
  { id: "orientation", title: "Orientation & quiz", subtitle: "View slides and complete knowledge check", Icon: GraduationCap },
  { id: "majors", title: "Major requirements", subtitle: "Upload and verify your documents", Icon: FileText },
  { id: "agreements", title: "Essential agreements", subtitle: "Sign the required documents", Icon: PenLine },
  { id: "requirements", title: "Additional requirements", subtitle: "Submit your remaining documents", Icon: ClipboardList }
];
const formatDate = (date) => {
  if (!date) return "Not scheduled";
  const parsed = /* @__PURE__ */ new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
function PublicApplicantPortalInner({ onBackToWorkspace }) {
  const {
    activeApplicant,
    simulatedCurrentDate,
    showToast
  } = useNHO();
  const [activeSection, setActiveSection] = useState(
    () => activeApplicant?.orientationStatus === "Completed" ? "overview" : "orientation"
  );
  const [mobileChecklistOpen, setMobileChecklistOpen] = useState(false);
  const navigate = useNavigate();
  const handleReturnWorkspace = onBackToWorkspace || (() => navigate("/recruitment/new-hire-orientation"));
  const hasDemoTools = false;
  const majorDocs = activeApplicant.documents.filter((doc) => doc.isMajor);
  const agreementDocs = activeApplicant.documents.filter((doc) => doc.isEssentialAgreement);
  const nonMajorDocs = activeApplicant.documents.filter((doc) => !doc.isMajor && !doc.isEssentialAgreement);
  const majorVerified = majorDocs.filter((doc) => doc.status === "Verified").length;
  const agreementVerified = agreementDocs.filter((doc) => doc.status === "Verified").length;
  const nonMajorVerified = nonMajorDocs.filter((doc) => doc.status === "Verified").length;
  const majorComplete = majorDocs.length > 0 && majorVerified === majorDocs.length;
  const orientationComplete = activeApplicant.orientationStatus === "Completed";
  const agreementComplete = agreementDocs.length > 0 && agreementVerified === agreementDocs.length;
  const nonMajorComplete = nonMajorDocs.length === 0 || nonMajorVerified === nonMajorDocs.length;
  const completedSections = [orientationComplete, majorComplete, agreementComplete, nonMajorComplete].filter(Boolean).length;
  const requiresSubmission = (docs) => docs.some((doc) => ["Not Submitted", "Needs Correction", "Draft"].includes(doc.status));
  const actionableSectionId = !orientationComplete ? "orientation" : requiresSubmission(majorDocs) ? "majors" : requiresSubmission(agreementDocs) ? "agreements" : requiresSubmission(nonMajorDocs) ? "requirements" : void 0;
  const progressPercentage = Math.round(completedSections / CORE_SECTIONS.length * 100);
  const pendingNonMajor = nonMajorDocs.length - nonMajorVerified;
  const overdueNonMajor = requiresSubmission(nonMajorDocs) && Boolean(activeApplicant.nonMajorDeadlineDate) && simulatedCurrentDate > (activeApplicant.nonMajorDeadlineDate || "");
  const sectionDetails = {
    overview: { status: "Overview", complete: false },
    orientation: {
      status: orientationComplete ? `Completed (${activeApplicant.orientationQuizScore ?? 6}/${activeApplicant.orientationQuizTotal ?? 6})` : activeApplicant.orientationStatus,
      complete: orientationComplete
    },
    majors: { status: `${majorVerified}/${majorDocs.length} verified`, complete: majorComplete },
    agreements: { status: `${agreementVerified}/${agreementDocs.length} verified`, complete: agreementComplete },
    requirements: {
      status: nonMajorComplete ? "All verified" : overdueNonMajor ? `${pendingNonMajor} overdue` : `${pendingNonMajor} to resolve`,
      complete: nonMajorComplete,
      urgent: overdueNonMajor
    },
    profile: { status: "Reference", complete: false },
    "login-sim": { status: "Testing only", complete: false }
  };
  const nextSection = CORE_SECTIONS.find((section) => section.id === actionableSectionId) || CORE_SECTIONS.find((section) => !sectionDetails[section.id].complete);
  const waitingForVerification = completedSections < CORE_SECTIONS.length && !actionableSectionId;
  const nextActionTitle = waitingForVerification ? "Submitted items are awaiting TA verification" : nextSection?.id === "orientation" ? "Complete your orientation and knowledge check quiz" : nextSection?.id === "majors" ? "Submit your mandatory major requirements" : nextSection?.id === "agreements" ? "Review and sign your essential agreements" : nextSection?.id === "requirements" ? "Submit your remaining additional requirements" : "Your NHO checklist is complete";
  const selectSection = (section) => {
    setActiveSection(section);
    setMobileChecklistOpen(false);
  };

  const checklist = <div className="space-y-1.5" aria-label="NHO checklist">
      {CORE_SECTIONS.map((section, index) => {
    const { status, complete, urgent } = sectionDetails[section.id];
    const isLocked = !orientationComplete && section.id !== "orientation";
    const selected = activeSection === section.id;
    const Icon = section.Icon;
    return <button
      type="button"
      key={section.id}
      onClick={() => {
        if (isLocked) {
          showToast("Please complete the orientation and quiz checkpoints before proceeding to requirements.", "error");
          return;
        }
        selectSection(section.id);
      }}
      aria-current={selected ? "step" : void 0}
      className={`group w-full rounded-xl px-3 py-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sibs-orange ${selected ? "bg-sibs-blue-tint text-sibs-navy" : isLocked ? "text-slate-400 hover:bg-slate-50 opacity-80" : "text-sibs-secondary hover:bg-sibs-surface"}`}
    >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${complete ? "bg-[#E8F6EE] text-[#17814D]" : selected ? "bg-sibs-navy text-white" : isLocked ? "bg-slate-100 text-slate-400" : "bg-sibs-canvas text-sibs-muted"}`}>
                {complete ? <Check size={15} strokeWidth={2.6} /> : isLocked ? <Lock size={13} /> : <Icon size={15} />}
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="block text-[13px] font-bold leading-tight">{index + 1}. {section.title}</span>
                  {isLocked && <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Locked
                    </span>}
                </div>
                <span className="block text-[11px] leading-snug text-sibs-muted">{section.subtitle}</span>
                <span className={`block text-[11px] font-semibold ${complete ? "text-[#17814D]" : isLocked ? "text-amber-700" : urgent ? "text-[#C43B35]" : "text-sibs-muted"}`}>{isLocked ? "Step 1 (Orientation) required first" : status}</span>
              </span>
              <ChevronRight size={15} className={`mt-1 shrink-0 ${selected ? "text-sibs-navy" : "text-[#C0C9D4]"}`} />
            </div>
          </button>;
  })}
    </div>;
  return <div className="flex min-h-screen flex-col bg-sibs-surface font-jakarta text-sibs-navy">
      <header className="sticky top-0 z-40 border-b border-sibs-border bg-white shadow-xs">
        <div className="h-[3px] bg-gradient-to-r from-sibs-navy via-sibs-tertiary-2 to-sibs-orange" />
        <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B3D] to-sibs-orange flex items-center justify-center shadow-lg shadow-sibs-orange/25 shrink-0">
              <span className="text-xl font-extrabold text-white tracking-tighter">S</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FFA488] border-2 border-sibs-navy shadow-xs" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-extrabold tracking-tight">
                  <span className="text-sibs-orange">SiBS</span>{" "}
                  <span className="text-sibs-navy">HRIS</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0E9] border border-orange-200/60 text-sibs-orange text-[9.5px] font-extrabold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                  Employee Onboarding
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-sibs-muted">New Hire Orientation · Candidate Portal</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
    type="button"
    onClick={() => selectSection("profile")}
    className="max-w-[320px] rounded-xl bg-sibs-surface border border-sibs-border px-3.5 py-2 text-left transition hover:bg-sibs-blue-tint"
    title="View your personal information"
  >
              <span className="block truncate text-xs font-bold text-sibs-navy">{activeApplicant.fullName}</span>
              <span className="block truncate text-[10px] text-sibs-muted font-medium">{activeApplicant.position}</span>
            </button>
            {onBackToWorkspace && <button
    type="button"
    onClick={handleReturnWorkspace}
    className="sibs-btn-secondary"
  >
                <ArrowLeft size={14} /> <span className="hidden sm:inline">Staff Workspace</span><span className="sm:hidden">Exit</span>
              </button>}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1640px] flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div
          className="sibs-page-header-in sibs-page-card-in mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
          style={{ animationDelay: "0ms", animationFillMode: "both" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy">
                <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                My Onboarding Workspace
              </span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-sibs-navy tracking-tight sm:text-3xl">Welcome, {activeApplicant.firstName}!</h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-sibs-muted font-medium">Follow your onboarding checklist, complete outstanding tasks, and revisit submitted requirements whenever you need.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-sibs-muted bg-white border border-sibs-border rounded-xl px-3.5 py-2 shadow-xs">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-sibs-orange" /> NHO: <strong className="text-sibs-navy">{formatDate(activeApplicant.scheduledNhoDate)}</strong></span>
            {activeApplicant.nonMajorDeadlineDate && <span className={`inline-flex items-center gap-1.5 ${overdueNonMajor ? "font-semibold text-[#E74C3C]" : ""}`}>
                <CalendarDays size={15} className={overdueNonMajor ? "text-[#E74C3C]" : "text-sibs-navy"} /> Additional docs: <strong className={overdueNonMajor ? "text-[#E74C3C]" : "text-sibs-navy"}>{formatDate(activeApplicant.nonMajorDeadlineDate)}</strong>
                {overdueNonMajor ? "(overdue)" : ""}
              </span>}
          </div>
        </div>

        <div
          className="sibs-page-card-in mb-5 rounded-2xl border border-sibs-border bg-white p-5 shadow-xs relative overflow-hidden"
          style={{ animationDelay: "80ms", animationFillMode: "both" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sibs-navy via-sibs-tertiary-2 to-sibs-orange" />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-sibs-navy">Your NHO Progress</p>
              <p className="mt-0.5 text-xs text-sibs-muted font-medium">{completedSections} of 4 task groups complete · {nextSection ? nextActionTitle : "All tasks verified"}</p>
            </div>
            <span className="text-2xl font-extrabold tabular-nums text-sibs-navy">{progressPercentage}%</span>
          </div>
          <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-[#E9EEF5]" role="progressbar" aria-valuenow={progressPercentage} aria-valuemin={0} aria-valuemax={100} aria-label="NHO progress">
            <div className="h-full rounded-full bg-sibs-orange transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        {
    /* When viewing orientation presentation, show whole-screen with no sidebar distraction */
  }
        {activeSection === "orientation" ? <div
            className="sibs-page-card-in w-full space-y-4"
            style={{ animationDelay: "160ms", animationFillMode: "both" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sibs-border bg-white px-5 py-3.5 shadow-xs">
              <button
    type="button"
    onClick={() => selectSection("overview")}
    className="sibs-btn-secondary"
  >
                <ArrowLeft size={14} /> Back to NHO Checklist
              </button>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-sibs-navy text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                  Orientation presentation
                </span>
                <span className={`rounded-lg px-3 py-1 text-[11px] font-bold ${sectionDetails.orientation.complete ? "bg-[#E8F6EE] text-[#157347]" : "bg-[#EEF3F8] text-[#526A83]"}`}>
                  {sectionDetails.orientation.status}
                </span>
              </div>
            </div>

            <section className="min-w-0" aria-label="Interactive SiBS Orientation">
              <NHOApplicantPortal subTab="orientation" onSubTabChange={(section) => selectSection(section)} />
            </section>
          </div> : <div className="grid items-start gap-5 lg:grid-cols-[292px_minmax(0,1fr)]">
            <div className="lg:hidden">
              <button
    type="button"
    onClick={() => setMobileChecklistOpen((open) => !open)}
    aria-expanded={mobileChecklistOpen}
    aria-controls="applicant-checklist"
    className="flex w-full items-center justify-between rounded-xl border border-sibs-border bg-white px-4 py-3 text-sm font-bold"
  >
                <span className="flex items-center gap-2"><Menu size={18} /> NHO checklist</span>
                {mobileChecklistOpen ? <X size={17} /> : <ChevronDown size={17} />}
              </button>
            </div>
            <aside
              id="applicant-checklist"
              aria-label="Onboarding checklist"
              className={`sibs-page-card-in ${mobileChecklistOpen ? "block" : "hidden"} rounded-2xl border border-sibs-border bg-white p-3 shadow-[0_3px_14px_rgba(4,44,81,0.025)] lg:sticky lg:top-24 lg:block`}
              style={{ animationDelay: "160ms", animationFillMode: "both" }}
            >
              <button
    type="button"
    onClick={() => selectSection("overview")}
    className={`mb-3 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-[13px] font-bold transition ${activeSection === "overview" ? "bg-sibs-navy text-white" : "text-sibs-navy hover:bg-sibs-surface"}`}
  >
                <ClipboardList size={16} /> My overview <ChevronRight size={14} className="ml-auto" />
              </button>
              <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.11em] text-sibs-muted">Your tasks</p>
              {checklist}
              <div className="mt-3 border-t border-[#E8EEF4] pt-3">
                <button
    type="button"
    onClick={() => selectSection("profile")}
    className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-[12px] font-bold transition ${activeSection === "profile" ? "bg-sibs-blue-tint" : "hover:bg-sibs-surface"}`}
  >
                  <UserRound size={16} /> Personal information <ChevronRight size={14} className="ml-auto" />
                </button>
                {hasDemoTools && activeSection === "login-sim" && <p className="mt-2 flex items-center gap-2 px-3 text-[11px] text-sibs-muted"><LockKeyhole size={14} /> Previewing temporary access simulation</p>}
              </div>
            </aside>

            <section
              className="sibs-page-card-in min-w-0 space-y-4"
              aria-label="Selected NHO task"
              style={{ animationDelay: "240ms", animationFillMode: "both" }}
            >
              {activeSection !== "overview" && activeSection !== "profile" && activeSection !== "login-sim" && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sibs-border bg-white px-5 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A8B9C]">NHO task</p>
                    <h2 className="mt-1 text-[15px] font-extrabold">{CORE_SECTIONS.find((section) => section.id === activeSection)?.title}</h2>
                  </div>
                  <span className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${sectionDetails[activeSection].complete ? "bg-[#E8F6EE] text-[#157347]" : sectionDetails[activeSection].urgent ? "bg-[#FCECEB] text-[#B83D36]" : "bg-[#EEF3F8] text-[#526A83]"}`}>{sectionDetails[activeSection].status}</span>
                </div>}
              {activeSection === "login-sim" && !hasDemoTools ? <div className="rounded-2xl bg-white p-6 text-sm text-[#65778C]">This screen is available only in prototype preview mode.</div> : <NHOApplicantPortal subTab={activeSection} onSubTabChange={(section) => selectSection(section)} />}
            </section>
          </div>}
      </main>

      <footer className="mt-auto border-t border-sibs-border bg-white px-6 py-4 text-[11px] text-sibs-muted">
        <div className="mx-auto flex max-w-[1640px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SiBS Human Resource Information System · Employee Onboarding Portal</span>
          <span>Need assistance? Contact your Talent Acquisition representative.</span>
        </div>
      </footer>
    </div>;
}
function PublicApplicantPortalPage(props) {
  try {
    const context = useNHO();
    if (context?.applicants) return <PublicApplicantPortalInner {...props} />;
  } catch (e) { void e; /* empty */
  }
  return <JourneyProvider><NHOProvider><PublicApplicantPortalInner {...props} /></NHOProvider></JourneyProvider>;
}
export {
  PublicApplicantPortalPage as default
};
