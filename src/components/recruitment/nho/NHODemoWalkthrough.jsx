/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNHO } from "./NHOContext";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check
} from "lucide-react";
function NHODemoWalkthrough({ isOpen, onClose, onNavigateToTab }) {
  const {
    setRole,
    setSelectedApplicantId,
    applicants,
    activeApplicant,
    resetWalkthroughApplicant,
    showToast
  } = useNHO();
  const [activeStep, setActiveStep] = useState(1);
  if (!isOpen) return null;
  const targetId = "nho-app-01";
  const juanCarlos = applicants.find((a) => a.id === targetId) || activeApplicant;
  const navigateTo = (roleName, subTabName) => {
    setSelectedApplicantId(targetId);
    setRole(roleName);
    if (onNavigateToTab) {
      onNavigateToTab(roleName, subTabName);
    }
    onClose();
  };
  const steps = [
    {
      step: 1,
      title: "TA: Open Scheduled Applicant",
      role: "TA",
      subTab: "attendance",
      description: "Select scheduled applicant Juan Carlos Dela Cruz. Inspect his initial NHO invitation (sent with 8 days notice, satisfying the 7-day Asia/Manila notice policy).",
      actionLabel: "Navigate to TA Attendance",
      actionHint: "Opens TA Attendance with Juan Carlos selected",
      onAction: () => navigateTo("TA", "attendance")
    },
    {
      step: 2,
      title: "TA: Mark Attendance as 'Show'",
      role: "TA",
      subTab: "attendance",
      description: "Click 'Open Attendance Modal for Juan Carlos'. Select 'Show' and save attendance. Under the updated policy, major requirements are no longer verified during attendance. Saving Show immediately triggers the automatic temporary portal invitation to Juan Carlos's registered email.",
      actionLabel: "Go to Attendance View to Mark Show",
      actionHint: "Directs to TA Attendance screen to open the modal",
      onAction: () => navigateTo("TA", "attendance")
    },
    {
      step: 3,
      title: "System: Dispatch Portal Invitation",
      role: "Applicant",
      subTab: "login-sim",
      description: "HRIS generates a secure one-time password retrieval link (valid for 24 hours) associated with Juan Carlos's registered email. Switch to the Applicant portal's Auth simulation tab to inspect the generated token and expiration time.",
      actionLabel: "View Temporary Access in Applicant Portal",
      actionHint: "Opens Applicant Portal Auth & Temporary Access tab",
      onAction: () => navigateTo("Applicant", "login-sim")
    },
    {
      step: 4,
      title: "Applicant: Retrieve Password & Change It",
      role: "Applicant",
      subTab: "login-sim",
      description: "Click 'Retrieve Password via Link' to simulate one-time retrieval. Observe that the link is consumed and cannot be reused. Then click 'Change Initial Password' to set Juan Carlos's permanent password before continuing.",
      actionLabel: "Open Password Simulation Tab",
      actionHint: "Directs to Applicant Auth simulation tab",
      onAction: () => navigateTo("Applicant", "login-sim")
    },
    {
      step: 5,
      title: "Applicant: Upload 4 Major Requirements",
      role: "Applicant",
      subTab: "majors",
      description: "Juan Carlos opens the dedicated Major Requirements section in his portal and uploads each of the 4 major documents individually: 1. Medical Records / Fit to Work, 2. NBI Clearance, 3. PSA Birth Certificate, 4. Valid Government ID. Uploading sets status to 'For Verification' without automatically marking Verified.",
      actionLabel: "Go to Major Requirements Upload Tab",
      actionHint: "Opens Applicant Portal Major Requirements upload section",
      onAction: () => navigateTo("Applicant", "majors")
    },
    {
      step: 6,
      title: "TA: Verify Major Documents in Queue",
      role: "TA",
      subTab: "doc-verification",
      description: "Switch to TA. Open the consolidated Document Verification Queue. Review Juan Carlos's uploaded major requirements, inspect file previews, and click 'Verify' (or test 'Needs Correction' with mandatory remarks).",
      actionLabel: "Open Consolidated Document Verification Queue",
      actionHint: "Directs to TA Document Verification queue",
      onAction: () => navigateTo("TA", "doc-verification")
    },
    {
      step: 7,
      title: "Applicant: Complete Orientation & Quiz",
      role: "Applicant",
      subTab: "orientation",
      description: "Juan Carlos views all 7 presentation slides, answers the 5 interactive workplace knowledge check questions (learning reinforcement mode), and confirms the final policy acknowledgment checkbox.",
      actionLabel: "Open Orientation Viewer",
      actionHint: "Directs to 7-slide orientation and knowledge check",
      onAction: () => navigateTo("Applicant", "orientation")
    },
    {
      step: 8,
      title: "Applicant: Sign 3 Essential Agreements",
      role: "Applicant",
      subTab: "agreements",
      description: "Juan Carlos executes all three essential employment agreements: 1. Acceptance to Company Policy, 2. Training Bond, and 3. NDA. Try both the responsive drawing canvas (Method A) and file upload (Method B).",
      actionLabel: "Open Essential Agreements Tab",
      actionHint: "Directs to Agreement signing cards",
      onAction: () => navigateTo("Applicant", "agreements")
    },
    {
      step: 9,
      title: "TA: Verify Essential Agreements",
      role: "TA",
      subTab: "doc-verification",
      description: "Switch to TA. Review Juan Carlos's submitted agreements in the Document Verification Queue and click 'Verify' on each agreement to certify compliance.",
      actionLabel: "Open TA Document Verification Queue",
      actionHint: "Directs to TA agreement review view",
      onAction: () => navigateTo("TA", "doc-verification")
    },
    {
      step: 10,
      title: "TA: 9-Point Validation & IT Endorsement",
      role: "TA",
      subTab: "it-endorsements",
      description: "Inspect Juan Carlos's 9 mandatory conditions checklist: all 9 mandatory criteria are green and verified (Show attendance, 4 verified majors, completed orientation, 3 verified agreements). Observe that pending non-majors do NOT block endorsement! Click 'Endorse to IT'.",
      actionLabel: "Go to Endorsement Dispatch Screen",
      actionHint: "Directs to TA Endorsement screen to submit",
      onAction: () => navigateTo("TA", "it-endorsements")
    },
    {
      step: 11,
      title: "IT: Provision Manual Kronos ID",
      role: "IT",
      subTab: "provisioning",
      description: "Switch to IT Manager. Select Juan Carlos's request in the IT queue. Authoritative identity is read-only. Test editing permitted fields with an audit reason, enter a unique Kronos ID (e.g. KRN-90841), and click 'Mark Completed & Submit Handoff'. Notice that HRIS automatically creates and dispatches three parallel departmental assignments: Trainer, QDS, and WFM.",
      actionLabel: "Switch to IT Provisioning Queue",
      actionHint: "Directs to IT Manager queue with Juan Carlos selected",
      onAction: () => navigateTo("IT", "provisioning")
    },
    {
      step: 12,
      title: "Step 1 \u2014 Training Curriculum & Schedule Alignment",
      role: "HR",
      subTab: "review",
      description: "Inspect Juan Carlos's assigned 2-week PST & FST training schedule and foundation materials. Curriculum alignment between training operations and workforce planning is automated.",
      actionLabel: "View Training Schedule & Milestones",
      actionHint: "Directs to HR Operations handoff review with schedule matrix",
      onAction: () => navigateTo("HR", "review")
    },
    {
      step: 13,
      title: "Step 2 \u2014 Training Cohort & Trainee Responsibility Confirmation",
      role: "HR",
      subTab: "review",
      description: "Verify assigned session trainer and confirmed training schedule in the 2-week PST & FST matrix before proceeding to WFM workstation assignment.",
      actionLabel: "Confirm Trainee Alignment",
      actionHint: "Directs to HR Operations handoff review",
      onAction: () => navigateTo("HR", "review")
    },
    {
      step: 14,
      title: "Step 3 \u2014 WFM: Production Seat Assignment",
      role: "WFM",
      subTab: "queue",
      description: "Switch to Workforce Management (WFM, admin_access = 9). With Trainer acceptance complete, select Juan Carlos in the Production Seating Queue. Select 'Left Wing', enter workstation 'LW-012', and click 'Confirm Assignment'. Since all post-IT departments are now completed, the handoff automatically transitions to 'Pending HR Acceptance'.",
      actionLabel: "Open WFM Production Seat Assignment",
      actionHint: "Directs to WFM Seating Queue with Juan Carlos selected",
      onAction: () => navigateTo("WFM", "queue")
    },
    {
      step: 15,
      title: "HR: Review & Accept Handoff",
      role: "HR",
      subTab: "review",
      description: "Switch to HR Operations. Select Juan Carlos's completed handoff package in the queue. Review orientation records, verified contracts, assigned Kronos ID, and verify all 3 parallel milestones: Trainer Accepted, QDS Materials Finalized, and WFM Workstation Assigned. Click 'Accept Handoff & Transfer Ownership'. Non-major items are now HR-owned with preserved 14-day due date.",
      actionLabel: "Open HR Handoff Review for Juan Carlos",
      actionHint: "Directs to HR Operations Handoff Review",
      onAction: () => navigateTo("HR", "review")
    },
    {
      step: 16,
      title: "Transition: First Regular HRIS Login",
      role: "Applicant",
      subTab: "login-sim",
      description: "When Juan Carlos logs into the corporate system using his provisioned Kronos ID, simulate his first regular HRIS login. The system automatically deactivates his temporary NHO portal access while preserving all audit history.",
      actionLabel: "Go to Regular HRIS Login Simulation",
      actionHint: "Directs to Applicant Auth simulation to perform regular login",
      onAction: () => navigateTo("Applicant", "login-sim")
    }
  ];
  const current = steps[activeStep - 1];
  return <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {
    /* Header */
  }
        <div className="bg-sibs-navy text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sibs-orange flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Interactive Walkthrough Guide</h2>
              <p className="text-[11px] text-slate-300">
                End-to-End NHO V1 Journey: Candidate <strong>{juanCarlos.fullName}</strong>
              </p>
            </div>
          </div>
          <button
    onClick={onClose}
    className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
  >
            <X className="w-5 h-5" />
          </button>
        </div>

        {
    /* Candidate Context & Dedicated Reset Bar */
  }
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active Candidate:</span>
            <span className="font-bold text-sibs-navy">{juanCarlos.fullName}</span>
            <span className="text-[10px] text-slate-400 font-mono">({juanCarlos.applicantNumber})</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
              Attendance: {juanCarlos.attendance}
            </span>
          </div>

          <button
    type="button"
    onClick={resetWalkthroughApplicant}
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-[11px] transition-colors cursor-pointer border border-orange-200"
    title="Reset Juan Carlos to initial scheduled state for Step 1"
  >
            <RotateCcw className="w-3 h-3 text-sibs-orange" />
            <span>Reset Juan Carlos for Walkthrough (Step 1)</span>
          </button>
        </div>

        {
    /* Step Progress Dots & Tabs */
  }
        <div className="px-6 py-2 bg-sibs-surface border-b border-sibs-border flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {steps.map((s) => {
    const isActive = s.step === activeStep;
    const isCompleted = s.step < activeStep;
    return <button
      key={s.step}
      onClick={() => setActiveStep(s.step)}
      className={`px-2 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${isActive ? "bg-sibs-navy text-white shadow-xs" : isCompleted ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
    >
                <span>{s.step}</span>
                {isCompleted && <Check className="w-2.5 h-2.5 text-green-600" />}
              </button>;
  })}
        </div>

        {
    /* Step Body Content */
  }
        <div className="p-6 md:p-8 overflow-y-auto space-y-5 flex-1 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sibs-orange">
              Step {current.step} of {steps.length} • Role: <strong>{current.role}</strong>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Target Sub-Tab: {current.subTab}
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-sibs-navy">
              {current.title}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-sibs-surface p-4 rounded-xl border border-sibs-border">
              {current.description}
            </p>
          </div>

          {
    /* Action guidance callout */
  }
          <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-orange-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-sibs-orange" />
              <span>Recommended On-Screen Action:</span>
            </div>
            <p className="text-[11px] text-orange-900 leading-relaxed">
              Click the button below to navigate directly to the proper role screen. Then perform the action on-screen using the interactive interface.
            </p>
            <div className="pt-1">
              <button
    type="button"
    onClick={current.onAction}
    className="w-full py-2.5 rounded-xl bg-sibs-orange hover:bg-sibs-button-hover text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2"
  >
                <span>{current.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {
    /* Footer Navigation */
  }
        <div className="px-6 py-4 bg-slate-50 border-t border-sibs-border flex items-center justify-between text-xs">
          <button
    type="button"
    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
    disabled={activeStep === 1}
    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
  >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          <span className="text-[11px] text-slate-400 font-medium">
            Candidate: <strong>{juanCarlos.firstName}</strong> (Maintained across all {steps.length} steps)
          </span>

          <button
    type="button"
    onClick={() => setActiveStep((prev) => Math.min(steps.length, prev + 1))}
    disabled={activeStep === steps.length}
    className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-sibs-navy hover:bg-sibs-tertiary-2 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold cursor-pointer"
  >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>;
}
export {
  NHODemoWalkthrough as default
};
