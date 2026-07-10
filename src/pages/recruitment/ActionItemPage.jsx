import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Filter,
  Layers3,
  ListChecks,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Target,
  Timer,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { AddActionItemModal } from "../../components/modals/actionItems/ActionItemsModal.jsx";

const ACTION_ITEMS_STORAGE_KEY = "ta_action_items";
const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
const INTERNAL_CANDIDATES_KEY = "ta_internal_candidates";
const CANDIDATE_APPLICATIONS_KEY = "ta_candidate_applications";
const PIPELINE_CANDIDATES_KEY = "ta_pipeline_candidates";
const OFFER_RECORDS_KEY = "ta_offer_records";
const ONBOARDING_RECORDS_KEY = "ta_onboarding_records";
const HIRING_NEEDS_KEY = "ta_hiring_needs";
const WORKFORCE_HIRING_PLAN_KEY = "ta_workforce_hiring_plan";
const WEEKLY_HIRING_ACTION_ITEMS_KEY = "ta_weekly_hiring_action_items";

const ACTION_ITEMS_PER_PAGE = 8;

const initialActionItems = [
  {
    id: 1,
    actionId: "ACT-001",
    actionItem: "Add 50 sourced candidates for CSR role before Friday.",
    roleAccount: "CSR - SIBS Operations",
    roleTitle: "Customer Service Representative",
    account: "SIBS Operations",
    owner: "Maria Reyes",
    deadline: "2026-05-10",
    status: "Ongoing",
    riskLevel: "High",
    linkedGap: "Pipeline",
    module: "Workforce Hiring Plan",
    sourceType: "Manual",
    remarks:
      "Current sourced candidates are not enough to support approved hiring requirement.",
    requirement: 20,
    filled: 12,
    createdDate: "2026-05-03",
    completedDate: null,
  },
  {
    id: 2,
    actionId: "ACT-002",
    actionItem: "Schedule pending QA interviews within 48 hours.",
    roleAccount: "QA - SIBS Operations",
    roleTitle: "QA Specialist",
    account: "SIBS Operations",
    owner: "John Dela Cruz",
    deadline: "2026-05-08",
    status: "Planned",
    riskLevel: "High",
    linkedGap: "Interview",
    module: "Candidate Pipeline",
    sourceType: "Manual",
    remarks:
      "Interview delay is causing QA role to fall behind the workforce hiring plan.",
    requirement: 5,
    filled: 2,
    createdDate: "2026-05-04",
    completedDate: null,
  },
  {
    id: 3,
    actionId: "ACT-003",
    actionItem: "Review compensation range for System Developer applicants.",
    roleAccount: "System Developer - SIBS IT",
    roleTitle: "System Developer",
    account: "SIBS IT",
    owner: "Kim Domingo",
    deadline: "2026-05-09",
    status: "Ongoing",
    riskLevel: "Medium",
    linkedGap: "Offer",
    module: "Offers",
    sourceType: "Manual",
    remarks:
      "Offer declines are connected to compensation mismatch and competing offers.",
    requirement: 3,
    filled: 1,
    createdDate: "2026-05-02",
    completedDate: null,
  },
  {
    id: 4,
    actionId: "ACT-004",
    actionItem: "Finalize revised JD for RCM Analyst role.",
    roleAccount: "RCM Analyst - SIBS RCM",
    roleTitle: "RCM Analyst",
    account: "SIBS RCM",
    owner: "Paul Garcia",
    deadline: "2026-05-12",
    status: "Completed",
    riskLevel: "Low",
    linkedGap: "JD",
    module: "Job Description",
    sourceType: "Manual",
    remarks:
      "JD update completed and role is now aligned with sourcing requirements.",
    requirement: 5,
    filled: 3,
    createdDate: "2026-05-01",
    completedDate: "2026-05-06",
  },
  {
    id: 5,
    actionId: "ACT-005",
    actionItem: "Request approval confirmation for new HR Assistant headcount.",
    roleAccount: "HR Assistant - SIBS HR",
    roleTitle: "HR Assistant",
    account: "SIBS HR",
    owner: "Maria Reyes",
    deadline: "2026-05-11",
    status: "Planned",
    riskLevel: "Medium",
    linkedGap: "Approval",
    module: "Hiring Needs",
    sourceType: "Manual",
    remarks:
      "Hiring movement cannot proceed until approval status is finalized in the system.",
    requirement: 2,
    filled: 0,
    createdDate: "2026-05-05",
    completedDate: null,
  },
];

const statusOptions = ["All Status", "Planned", "Ongoing", "Completed"];
const riskOptions = ["All Risk", "High", "Medium", "Low"];

const moduleOptions = [
  "All Modules",
  "Public Talent Pool",
  "Talent Pool",
  "Hiring Needs",
  "Job Description",
  "Candidate Pipeline",
  "Offers",
  "Onboarding",
  "Workforce Hiring Plan",
  "Reports",
];

const gapOptions = [
  "All Gaps",
  "Pipeline",
  "Screening",
  "Interview",
  "Offer",
  "JD",
  "Approval",
  "Capacity / Manpower",
  "Onboarding",
  "Reporting",
];

const ownerOptions = [
  "All Owners",
  "Maria Reyes",
  "John Dela Cruz",
  "Kim Domingo",
  "Paul Garcia",
  "Current User",
  "System Suggested",
];

const emptyActionForm = {
  weeklyPlanItemId: "",
  hiringNeedId: "",
  roleAccount: "",
  roleTitle: "",
  account: "",
  requirement: 0,
  filled: 0,
  actionItem: "",
  owner: "",
  deadline: "",
  status: "Planned",
  riskLevel: "Medium",
  linkedGap: "Pipeline",
  remarks: "",
};

function inputClass(extra = "") {
  return `h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  zIndex = "z-30",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayValue = value || placeholder;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-sm font-bold text-[#101828]">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-[#D0D5DD] bg-white px-4 text-left text-sm font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {options.map((option) => {
            const selected = value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                    : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="block truncate">{option}</span>
              </button>
            );
          })}
        </div>
      </AnimatedDropdown>
    </div>
  );
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getDateAfterDays(days = 3) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function generateActionId(nextNumber) {
  return `ACT-${String(nextNumber).padStart(3, "0")}`;
}

function safeReadArray(key, fallback = []) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteArray(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(Array.isArray(value) ? value : []),
    );
  } catch {
    // Frontend-only storage fallback.
  }
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getCandidateStatus(record) {
  return normalizeText(
    record?.status ||
      record?.pipelineStatus ||
      record?.currentStage ||
      record?.stage ||
      record?.finalStatus ||
      "",
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Ongoing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Planned":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRiskClass(risk) {
  switch (risk) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getGapClass(gap) {
  switch (gap) {
    case "Pipeline":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Screening":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "Interview":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Offer":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "JD":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Approval":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Capacity / Manpower":
      return "border-red-200 bg-red-50 text-red-700";
    case "Onboarding":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Reporting":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getModuleClass(module) {
  switch (module) {
    case "Public Talent Pool":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "Talent Pool":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Hiring Needs":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Job Description":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Candidate Pipeline":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "Offers":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Onboarding":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Workforce Hiring Plan":
      return "border-red-200 bg-red-50 text-red-700";
    case "Reports":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getDaysLeft(deadline) {
  if (!deadline) return "—";

  const today = new Date();
  const due = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = due.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)} day/s overdue`;
  if (days === 0) return "Due today";
  return `${days} day/s left`;
}

function getDaysLeftValue(deadline) {
  if (!deadline) return 999;

  const today = new Date();
  const due = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getCompletionPercent(filled, requirement) {
  const total = Number(requirement || 0);
  const value = Number(filled || 0);

  if (total <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

function buildModuleContext() {
  const publicSubmissions = safeReadArray(PUBLIC_SUBMISSIONS_KEY);
  const internalCandidates = safeReadArray(INTERNAL_CANDIDATES_KEY);
  const candidateApplications = safeReadArray(CANDIDATE_APPLICATIONS_KEY);
  const pipelineCandidates = safeReadArray(PIPELINE_CANDIDATES_KEY);
  const offers = safeReadArray(OFFER_RECORDS_KEY);
  const onboarding = safeReadArray(ONBOARDING_RECORDS_KEY);
  const hiringNeeds = safeReadArray(HIRING_NEEDS_KEY);
  const weeklyPlan = safeReadArray(WORKFORCE_HIRING_PLAN_KEY);
  const weeklyActionItems = safeReadArray(WEEKLY_HIRING_ACTION_ITEMS_KEY);

  const allCandidates = [...publicSubmissions, ...internalCandidates];

  const newPublicApplicants = publicSubmissions.filter(
    (item) =>
      getCandidateStatus(item) === "New Applicant" ||
      item?.isPublicSubmission,
  );

  const newTalentPoolApplicants = allCandidates.filter(
    (item) => getCandidateStatus(item) === "New Applicant",
  );

  const screeningCandidates = [
    ...candidateApplications,
    ...pipelineCandidates,
  ].filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("screen") || status.includes("initial");
  });

  const interviewCandidates = [
    ...candidateApplications,
    ...pipelineCandidates,
  ].filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("interview");
  });

  const offeredCandidates = [
    ...candidateApplications,
    ...pipelineCandidates,
    ...offers,
  ].filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("offer") || status.includes("offered");
  });

  const pendingOffers = offers.filter((item) => {
    const status = normalizeText(
      item.status ||
        item.offerStatus ||
        item.approvalStatus ||
        item.finalStatus,
    ).toLowerCase();

    return (
      status.includes("for review") ||
      status.includes("pending") ||
      status.includes("offered") ||
      status.includes("for approval")
    );
  });

  const acceptedOffers = offers.filter((item) => {
    const status = normalizeText(
      item.status ||
        item.offerStatus ||
        item.approvalStatus ||
        item.finalStatus,
    ).toLowerCase();

    return status.includes("accepted") || status.includes("approved");
  });

  const pendingOnboarding = onboarding.filter((item) => {
    const status = normalizeText(
      item.showStatus ||
        item.finalOutcome ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return status.includes("pending") || status.includes("waiting");
  });

  const onboardingRisks = onboarding.filter((item) => {
    const status = normalizeText(
      item.showStatus ||
        item.finalOutcome ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return (
      status.includes("no show") ||
      status.includes("withdrawn") ||
      status.includes("withdrawal")
    );
  });

  const pendingHiringNeeds = hiringNeeds.filter((item) => {
    const status = normalizeText(
      item.approvalStatus || item.status,
    ).toLowerCase();

    return (
      !status ||
      status.includes("for approval") ||
      status.includes("pending") ||
      status.includes("under review")
    );
  });

  const weeklyAtRisk = weeklyPlan.filter((item) => {
    const status = normalizeText(
      item.status || item.pipelineStatus || item.overallStatus,
    ).toLowerCase();

    const required = Number(
      item.requiredHeadcount || item.requirement || item.headcount || 0,
    );

    const actual = Number(
      item.actualHeadcount || item.filled || item.currentFilled || 0,
    );

    return (
      status.includes("risk") ||
      status.includes("delay") ||
      (required > 0 && actual < required)
    );
  });

  return {
    publicSubmissions,
    internalCandidates,
    allCandidates,
    candidateApplications,
    pipelineCandidates,
    offers,
    onboarding,
    hiringNeeds,
    weeklyPlan,
    weeklyActionItems,
    newPublicApplicants,
    newTalentPoolApplicants,
    screeningCandidates,
    interviewCandidates,
    offeredCandidates,
    pendingOffers,
    acceptedOffers,
    pendingOnboarding,
    onboardingRisks,
    pendingHiringNeeds,
    weeklyAtRisk,
  };
}

function buildSystemGeneratedActions(context) {
  const actions = [];

  if (context.newPublicApplicants.length > 0) {
    actions.push({
      id: "SYS-PUBLIC-001",
      actionId: "SYS-001",
      actionItem: `Review ${context.newPublicApplicants.length} new public applicant/s and tag them for screening or talent pool status.`,
      roleAccount: "Public Talent Pool Intake",
      roleTitle: "Public Applicants",
      account: "Recruitment",
      owner: "System Suggested",
      deadline: getDateAfterDays(1),
      status: "Planned",
      riskLevel: context.newPublicApplicants.length >= 10 ? "High" : "Medium",
      linkedGap: "Screening",
      module: "Public Talent Pool",
      sourceType: "System Suggested",
      remarks:
        "Public submissions should be reviewed quickly so qualified applicants can move into the Candidate Pipeline or remain in Talent Pool.",
      requirement: context.newPublicApplicants.length,
      filled: 0,
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.newTalentPoolApplicants.length > 0) {
    actions.push({
      id: "SYS-TALENT-002",
      actionId: "SYS-002",
      actionItem: `Classify ${context.newTalentPoolApplicants.length} new talent pool applicant/s into Silver Pool, Recyclable, Do Not Reprocess, or Failed.`,
      roleAccount: "Talent Pool Classification",
      roleTitle: "Talent Pool",
      account: "Recruitment",
      owner: "System Suggested",
      deadline: getDateAfterDays(2),
      status: "Planned",
      riskLevel:
        context.newTalentPoolApplicants.length >= 15 ? "High" : "Medium",
      linkedGap: "Pipeline",
      module: "Talent Pool",
      sourceType: "System Suggested",
      remarks:
        "Talent Pool records must be classified so recruiters can reuse candidates and avoid losing qualified leads.",
      requirement: context.newTalentPoolApplicants.length,
      filled: 0,
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.pendingHiringNeeds.length > 0) {
    actions.push({
      id: "SYS-HIRING-003",
      actionId: "SYS-003",
      actionItem: `Follow up ${context.pendingHiringNeeds.length} hiring need/s still waiting for approval or validation.`,
      roleAccount: "Hiring Needs Approval",
      roleTitle: "Hiring Needs",
      account: "HR / Operations",
      owner: "System Suggested",
      deadline: getDateAfterDays(1),
      status: "Planned",
      riskLevel: "High",
      linkedGap: "Approval",
      module: "Hiring Needs",
      sourceType: "System Suggested",
      remarks:
        "Hiring cannot move properly unless the approved headcount and required roles are confirmed.",
      requirement: context.pendingHiringNeeds.length,
      filled: 0,
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.screeningCandidates.length > 0) {
    actions.push({
      id: "SYS-SCREEN-004",
      actionId: "SYS-004",
      actionItem: `Complete initial screening movement for ${context.screeningCandidates.length} candidate/s in screening stage.`,
      roleAccount: "Candidate Screening",
      roleTitle: "Pipeline Candidates",
      account: "Recruitment",
      owner: "System Suggested",
      deadline: getDateAfterDays(2),
      status: "Planned",
      riskLevel: context.screeningCandidates.length >= 10 ? "High" : "Medium",
      linkedGap: "Screening",
      module: "Candidate Pipeline",
      sourceType: "System Suggested",
      remarks:
        "Candidates in screening should either move forward, be tagged as not fit, or be retained in Talent Pool.",
      requirement: context.screeningCandidates.length,
      filled: 0,
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.interviewCandidates.length > 0) {
    actions.push({
      id: "SYS-INTERVIEW-005",
      actionId: "SYS-005",
      actionItem: `Check interview schedules and feedback for ${context.interviewCandidates.length} candidate/s.`,
      roleAccount: "Interview Queue",
      roleTitle: "Interview Candidates",
      account: "Recruitment / Operations",
      owner: "System Suggested",
      deadline: getDateAfterDays(1),
      status: "Planned",
      riskLevel: "High",
      linkedGap: "Interview",
      module: "Candidate Pipeline",
      sourceType: "System Suggested",
      remarks:
        "Interview delays affect weekly hiring delivery and can cause candidate drop-off.",
      requirement: context.interviewCandidates.length,
      filled: 0,
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.pendingOffers.length > 0 || context.offeredCandidates.length > 0) {
    const count = Math.max(
      context.pendingOffers.length,
      context.offeredCandidates.length,
    );

    actions.push({
      id: "SYS-OFFER-006",
      actionId: "SYS-006",
      actionItem: `Review ${count} offered or pending offer candidate/s and confirm approval, acceptance, or negotiation status.`,
      roleAccount: "Offer Management",
      roleTitle: "Offered Candidates",
      account: "Recruitment / Compensation",
      owner: "System Suggested",
      deadline: getDateAfterDays(1),
      status: "Planned",
      riskLevel: "Medium",
      linkedGap: "Offer",
      module: "Offers",
      sourceType: "System Suggested",
      remarks:
        "Offer records must be monitored to prevent offer delays, declined offers, and inaccurate hiring conversion.",
      requirement: count,
      filled: context.acceptedOffers.length,
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.pendingOnboarding.length > 0 || context.onboardingRisks.length > 0) {
    const total =
      context.pendingOnboarding.length + context.onboardingRisks.length;

    actions.push({
      id: "SYS-ONBOARD-007",
      actionId: "SYS-007",
      actionItem: `Monitor ${total} onboarding record/s for pending start, no-show, or pre-start withdrawal risk.`,
      roleAccount: "Onboarding Monitoring",
      roleTitle: "Accepted Candidates",
      account: "Recruitment / HR",
      owner: "System Suggested",
      deadline: getDateAfterDays(2),
      status: "Planned",
      riskLevel: context.onboardingRisks.length > 0 ? "High" : "Medium",
      linkedGap: "Onboarding",
      module: "Onboarding",
      sourceType: "System Suggested",
      remarks:
        "Accepted candidates should be tracked until confirmed show-up or final onboarding outcome.",
      requirement: total,
      filled: Math.max(0, context.acceptedOffers.length - total),
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  if (context.weeklyAtRisk.length > 0) {
    actions.push({
      id: "SYS-WEEKLY-008",
      actionId: "SYS-008",
      actionItem: `Create or update action items for ${context.weeklyAtRisk.length} workforce hiring plan account/s with headcount gap or risk status.`,
      roleAccount: "Weekly Hiring Delivery",
      roleTitle: "Workforce Hiring Plan",
      account: "Operations / TA",
      owner: "System Suggested",
      deadline: getDateAfterDays(1),
      status: "Planned",
      riskLevel: "High",
      linkedGap: "Capacity / Manpower",
      module: "Workforce Hiring Plan",
      sourceType: "System Suggested",
      remarks:
        "Every role or account not fully hired must have at least one linked action item before reporting.",
      requirement: context.weeklyAtRisk.length,
      filled: 0,
      createdDate: getTodayDate(),
      completedDate: null,
      systemGenerated: true,
    });
  }

  return actions;
}

function getModuleInsightCards(context) {
  return [
    {
      module: "Public Talent Pool",
      icon: UsersRound,
      value: context.publicSubmissions.length,
      riskValue: context.newPublicApplicants.length,
      description: `${context.newPublicApplicants.length} new applicant/s need review`,
    },
    {
      module: "Talent Pool",
      icon: UserCheck,
      value: context.allCandidates.length,
      riskValue: context.newTalentPoolApplicants.length,
      description: `${context.newTalentPoolApplicants.length} new record/s need classification`,
    },
    {
      module: "Hiring Needs",
      icon: BriefcaseBusiness,
      value: context.hiringNeeds.length,
      riskValue: context.pendingHiringNeeds.length,
      description: `${context.pendingHiringNeeds.length} pending approval/s`,
    },
    {
      module: "Candidate Pipeline",
      icon: Layers3,
      value:
        context.candidateApplications.length +
        context.pipelineCandidates.length,
      riskValue:
        context.screeningCandidates.length +
        context.interviewCandidates.length,
      description: `${context.interviewCandidates.length} interview-stage candidate/s`,
    },
    {
      module: "Offers",
      icon: ShieldCheck,
      value: context.offers.length,
      riskValue: context.pendingOffers.length,
      description: `${context.pendingOffers.length} pending offer review/s`,
    },
    {
      module: "Onboarding",
      icon: CheckCircle2,
      value: context.onboarding.length,
      riskValue:
        context.pendingOnboarding.length + context.onboardingRisks.length,
      description: `${context.onboardingRisks.length} onboarding risk/s`,
    },
    {
      module: "Workforce Hiring Plan",
      icon: BarChart3,
      value: context.weeklyPlan.length,
      riskValue: context.weeklyAtRisk.length,
      description: `${context.weeklyAtRisk.length} account/s at risk`,
    },
  ];
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in group rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {title}
          </p>

          <p className={`mt-3 truncate text-3xl font-extrabold ${valueClassName}`}>
            {value}
          </p>

          {description && (
            <p className="mt-1 truncate text-xs font-semibold text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${iconClassName}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, helper, delay = 0 }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#344054]">{label}</p>

          {helper && (
            <p className="truncate text-xs font-medium text-sibs-tertiary-5">
              {helper}
            </p>
          )}
        </div>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {percentage}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
        <div
          className="h-full rounded-full bg-sibs-primary-1 transition-all duration-700 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className="max-w-[62%] whitespace-pre-line break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function ModuleInsightCard({ item, delay = 0 }) {
  const Icon = item.icon;
  const hasRisk = Number(item.riskValue || 0) > 0;

  return (
    <div
      className="sibs-page-card-in group rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {item.module}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${
              hasRisk ? "text-red-600" : "text-sibs-primary-1"
            }`}
          >
            {formatNumber(item.value)}
          </p>

          <p
            className={`mt-1 truncate text-xs font-semibold ${
              hasRisk ? "text-red-600" : "text-sibs-tertiary-5"
            }`}
          >
            {item.description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
            hasRisk
              ? "bg-red-50 text-red-600"
              : "bg-[#F2F6FA] text-sibs-primary-1"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ActionItemMobileCard({ item, onView }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-sibs-primary-1">
              {item.actionId}
            </p>

            {item.systemGenerated && (
              <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                Suggested
              </span>
            )}
          </div>

          <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[#101828]">
            {item.actionItem}
          </h3>

          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {item.roleTitle} / {item.account}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            item.status,
          )}`}
        >
          {item.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Owner
          </p>

          <p className="mt-1 truncate text-xs font-bold text-[#344054]">
            {item.owner}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Deadline
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {formatDate(item.deadline)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getModuleClass(
            item.module,
          )}`}
        >
          {item.module || "Recruitment"}
        </span>

        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getRiskClass(
            item.riskLevel,
          )}`}
        >
          {item.riskLevel} Risk
        </span>

        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getGapClass(
            item.linkedGap,
          )}`}
        >
          {item.linkedGap}
        </span>
      </div>
    </button>
  );
}

function ActionItemDetailsModal({ open, item, onClose, onComplete }) {
  if (!open || !item) return null;

  const progress = getCompletionPercent(item.filled, item.requirement);
  const isCompleted = item.status === "Completed";

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
      onClick={onClose}
    >
      <div
        className="sibs-profile-tab-panel flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getModuleClass(
                  item.module,
                )}`}
              >
                {item.module || "Recruitment"}
              </span>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                  item.status,
                )}`}
              >
                {item.status}
              </span>

              {item.systemGenerated && (
                <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                  System Suggested
                </span>
              )}
            </div>

            <h2 className="mt-3 text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Action Item Details
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Connected recruitment action, linked gap, owner, deadline, and
              progress.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-gray-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:text-gray-700 active:scale-[0.98]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      {item.actionId}
                    </p>

                    <h3 className="mt-2 text-lg font-bold leading-7 text-[#101828] sm:text-xl">
                      {item.actionItem}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-sibs-tertiary-5">
                      {item.roleAccount || `${item.roleTitle} / ${item.account}`}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                          item.riskLevel,
                        )}`}
                      >
                        {item.riskLevel} Risk
                      </span>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getGapClass(
                          item.linkedGap,
                        )}`}
                      >
                        {item.linkedGap}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Deadline
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {formatDate(item.deadline)}
                    </p>

                    <p className="mt-1 text-xs font-bold text-sibs-primary-1/70">
                      {getDaysLeft(item.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828]">
                      Recruitment Link
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      This tells which module created or needs this action.
                    </p>
                  </div>

                  <ArrowRight size={18} className="text-sibs-tertiary-5" />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Module
                    </p>

                    <p className="mt-2 text-sm font-bold text-sibs-primary-1">
                      {item.module || "Recruitment"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Gap Type
                    </p>

                    <p className="mt-2 text-sm font-bold text-sibs-primary-1">
                      {item.linkedGap || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                      Source
                    </p>

                    <p className="mt-2 text-sm font-bold text-sibs-primary-1">
                      {item.sourceType || "Manual"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#101828]">Remarks</h3>

                <p className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 text-sm font-medium leading-6 text-[#344054]">
                  {item.remarks || "No remarks provided."}
                </p>
              </div>

              <div className="rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <h3 className="mb-5 text-sm font-bold text-[#101828]">
                  Related Progress
                </h3>

                <ProgressBar
                  label="Filled vs Required"
                  value={Number(item.filled || 0)}
                  total={Number(item.requirement || 0)}
                  helper={`${Number(item.filled || 0)} filled out of ${Number(
                    item.requirement || 0,
                  )} required`}
                />

                <div className="mt-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#344054]">
                      Current Progress
                    </p>

                    <p className="text-sm font-bold text-sibs-primary-1">
                      {progress}%
                    </p>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                    Progress is based on the filled and required values attached
                    to this action item.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Action Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Action ID" value={item.actionId} />
                  <DetailRow label="Role" value={item.roleTitle} />
                  <DetailRow label="Account" value={item.account} />
                  <DetailRow label="Owner" value={item.owner} />
                  <DetailRow
                    label="Created Date"
                    value={formatDate(item.createdDate)}
                  />
                  <DetailRow
                    label="Deadline"
                    value={formatDate(item.deadline)}
                  />
                  <DetailRow label="Days Left" value={getDaysLeft(item.deadline)} />
                  <DetailRow label="Status" value={item.status} />
                  <DetailRow label="Risk Level" value={item.riskLevel} />
                  <DetailRow label="Linked Gap" value={item.linkedGap} />
                  <DetailRow label="Module" value={item.module} />
                  <DetailRow
                    label="Completed Date"
                    value={formatDate(item.completedDate)}
                  />
                </div>
              </div>

              {!isCompleted && !item.systemGenerated && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                  <h3 className="text-sm font-bold text-emerald-700">
                    Complete Action
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-700/90">
                    Mark this item as completed when the action has already been
                    executed or reported in the weekly hiring call.
                  </p>

                  <button
                    type="button"
                    onClick={() => onComplete(item)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
                  >
                    <CheckCircle2 size={16} />
                    Mark as Completed
                  </button>
                </div>
              )}

              {item.systemGenerated && (
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                  <h3 className="text-sm font-bold text-purple-700">
                    System Suggested
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-purple-700/90">
                    This item is generated from recruitment module data. It will
                    disappear once the related module data no longer triggers
                    the risk or pending condition.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700">
                  Required Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-700/90">
                  Every role that is not fully hired must have at least one
                  active action item connected to a hiring gap.
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-700">
                  Risk Reminder
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700/90">
                  High-risk items should be prioritized before the next weekly
                  report or leadership update.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-sibs-primary-1 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActionItemsPage() {
  const mainRef = useRef(null);

  const [actionItemList, setActionItemList] = useState(() => {
    const stored = safeReadArray(ACTION_ITEMS_STORAGE_KEY, []);
    return stored.length > 0 ? stored : initialActionItems;
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [riskFilter, setRiskFilter] = useState("All Risk");
  const [gapFilter, setGapFilter] = useState("All Gaps");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [actionForm, setActionForm] = useState(emptyActionForm);

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    });
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    safeWriteArray(ACTION_ITEMS_STORAGE_KEY, actionItemList);
  }, [actionItemList]);

  useEffect(() => {
    function refreshFromStorage() {
      setRefreshKey((prev) => prev + 1);
      setCurrentPage(1);
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);
    }

    window.addEventListener("storage", refreshFromStorage);
    window.addEventListener("focus", refreshFromStorage);
    window.addEventListener("ta-public-submission-created", refreshFromStorage);
    window.addEventListener("ta-pipeline-sync-updated", refreshFromStorage);
    window.addEventListener("ta-offers-updated", refreshFromStorage);
    window.addEventListener("ta-onboarding-updated", refreshFromStorage);

    return () => {
      window.removeEventListener("storage", refreshFromStorage);
      window.removeEventListener("focus", refreshFromStorage);
      window.removeEventListener(
        "ta-public-submission-created",
        refreshFromStorage,
      );
      window.removeEventListener("ta-pipeline-sync-updated", refreshFromStorage);
      window.removeEventListener("ta-offers-updated", refreshFromStorage);
      window.removeEventListener("ta-onboarding-updated", refreshFromStorage);
    };
  }, []);

  const moduleContext = useMemo(() => buildModuleContext(), [refreshKey]);

  const moduleInsightCards = useMemo(
    () => getModuleInsightCards(moduleContext),
    [moduleContext],
  );

  const systemGeneratedActions = useMemo(
    () => buildSystemGeneratedActions(moduleContext),
    [moduleContext],
  );

  const combinedItems = useMemo(() => {
    const existingIds = new Set(actionItemList.map((item) => item.actionId));

    const cleanSystemActions = systemGeneratedActions.filter(
      (item) => !existingIds.has(item.actionId),
    );

    return [...cleanSystemActions, ...actionItemList];
  }, [actionItemList, systemGeneratedActions]);

  function handleOpenAddModal() {
    setShowAddModal(true);
    setActionForm(emptyActionForm);
  }

  function handleCloseAddModal() {
    setShowAddModal(false);
    setActionForm(emptyActionForm);
  }

  function handleResetActionForm() {
    setActionForm(emptyActionForm);
  }

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1);
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setRiskFilter("All Risk");
    setGapFilter("All Gaps");
    setModuleFilter("All Modules");
    setOwnerFilter("All Owners");
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  function handleAddActionItem(e) {
    e.preventDefault();

    if (!actionForm.weeklyPlanItemId && !actionForm.hiringNeedId) {
      alert("Role / Account with hiring gap is required.");
      return;
    }

    if (!actionForm.actionItem.trim()) {
      alert("Action item is required.");
      return;
    }

    if (!actionForm.owner) {
      alert("Owner is required.");
      return;
    }

    if (!actionForm.deadline) {
      alert("Deadline is required.");
      return;
    }

    if (!actionForm.linkedGap) {
      alert("Linked gap is required.");
      return;
    }

    const numericIds = actionItemList
      .map((item) => Number(String(item.actionId || "").replace(/\D/g, "")))
      .filter((value) => Number.isFinite(value));

    const nextId =
      numericIds.length > 0
        ? Math.max(...numericIds) + 1
        : actionItemList.length + 1;

    const linkedModule =
      actionForm.linkedGap === "Approval"
        ? "Hiring Needs"
        : actionForm.linkedGap === "JD"
          ? "Job Description"
          : actionForm.linkedGap === "Offer"
            ? "Offers"
            : actionForm.linkedGap === "Onboarding"
              ? "Onboarding"
              : actionForm.weeklyPlanItemId
                ? "Workforce Hiring Plan"
                : "Candidate Pipeline";

    const newActionItem = {
      id: Date.now(),
      actionId: generateActionId(nextId),
      actionItem: actionForm.actionItem.trim(),
      roleAccount: actionForm.roleAccount,
      roleTitle: actionForm.roleTitle,
      account: actionForm.account,
      owner: actionForm.owner,
      deadline: actionForm.deadline,
      status: actionForm.status,
      riskLevel: actionForm.riskLevel,
      linkedGap: actionForm.linkedGap,
      module: linkedModule,
      sourceType: "Manual",
      remarks: actionForm.remarks.trim(),
      requirement: Number(actionForm.requirement || 0),
      filled: Number(actionForm.filled || 0),
      createdDate: getTodayDate(),
      completedDate: actionForm.status === "Completed" ? getTodayDate() : null,
      weeklyPlanItemId: actionForm.weeklyPlanItemId,
      hiringNeedId: actionForm.hiringNeedId,
    };

    setActionItemList((prev) => [newActionItem, ...prev]);
    setSelectedItem(newActionItem);
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    handleCloseAddModal();
  }

  function handleCompleteActionItem(item) {
    if (item.systemGenerated) return;

    const updatedItem = {
      ...item,
      status: "Completed",
      completedDate: getTodayDate(),
      remarks:
        item.remarks ||
        "Action item completed and ready for weekly report update.",
    };

    setActionItemList((prev) =>
      prev.map((record) =>
        record.actionId === item.actionId ? updatedItem : record,
      ),
    );

    setSelectedItem(updatedItem);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return combinedItems.filter((item) => {
      const searchableText = [
        item.actionId,
        item.actionItem,
        item.roleAccount,
        item.roleTitle,
        item.account,
        item.owner,
        item.linkedGap,
        item.module,
        item.status,
        item.riskLevel,
        item.remarks,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);
      const matchesStatus =
        statusFilter === "All Status" || item.status === statusFilter;
      const matchesRisk =
        riskFilter === "All Risk" || item.riskLevel === riskFilter;
      const matchesGap =
        gapFilter === "All Gaps" || item.linkedGap === gapFilter;
      const matchesModule =
        moduleFilter === "All Modules" || item.module === moduleFilter;
      const matchesOwner =
        ownerFilter === "All Owners" || item.owner === ownerFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRisk &&
        matchesGap &&
        matchesModule &&
        matchesOwner
      );
    });
  }, [
    combinedItems,
    search,
    statusFilter,
    riskFilter,
    gapFilter,
    moduleFilter,
    ownerFilter,
  ]);

  const sortedItems = useMemo(() => {
    const riskRank = { High: 1, Medium: 2, Low: 3 };
    const statusRank = { Planned: 1, Ongoing: 2, Completed: 3 };

    return [...filteredItems].sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (a.status !== "Completed" && b.status === "Completed") return -1;

      const riskDiff =
        (riskRank[a.riskLevel] || 9) - (riskRank[b.riskLevel] || 9);

      if (riskDiff !== 0) return riskDiff;

      const dayDiff =
        getDaysLeftValue(a.deadline) - getDaysLeftValue(b.deadline);

      if (dayDiff !== 0) return dayDiff;

      return (statusRank[a.status] || 9) - (statusRank[b.status] || 9);
    });
  }, [filteredItems]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedItems.length / ACTION_ITEMS_PER_PAGE),
  );

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * ACTION_ITEMS_PER_PAGE;
    const end = start + ACTION_ITEMS_PER_PAGE;

    return sortedItems.slice(start, end);
  }, [sortedItems, currentPage, totalPages]);

  const showingFrom =
    sortedItems.length > 0 ? (currentPage - 1) * ACTION_ITEMS_PER_PAGE + 1 : 0;

  const showingTo = Math.min(
    currentPage * ACTION_ITEMS_PER_PAGE,
    sortedItems.length,
  );

  useEffect(() => {
    setCurrentPage(1);
    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    search,
    statusFilter,
    riskFilter,
    gapFilter,
    moduleFilter,
    ownerFilter,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      scrollToTop("auto");
    }
  }, [currentPage, totalPages]);

  function handlePageChange(nextPage) {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);

    if (safePage === currentPage) {
      scrollToTop("auto");

      window.setTimeout(() => {
        scrollToTop("auto");
      }, 0);

      return;
    }

    setCurrentPage(safePage);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  const stats = useMemo(() => {
    const total = combinedItems.length;
    const planned = combinedItems.filter(
      (item) => item.status === "Planned",
    ).length;
    const ongoing = combinedItems.filter(
      (item) => item.status === "Ongoing",
    ).length;
    const completed = combinedItems.filter(
      (item) => item.status === "Completed",
    ).length;
    const highRisk = combinedItems.filter(
      (item) => item.riskLevel === "High",
    ).length;
    const suggested = combinedItems.filter((item) => item.systemGenerated)
      .length;

    const overdue = combinedItems.filter((item) => {
      if (item.status === "Completed") return false;
      return getDaysLeftValue(item.deadline) < 0;
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const active = total - completed;

    return {
      total,
      planned,
      ongoing,
      completed,
      highRisk,
      overdue,
      suggested,
      completionRate,
      active,
    };
  }, [combinedItems]);

  const topRisks = useMemo(() => {
    return combinedItems
      .filter((item) => item.status !== "Completed")
      .sort((a, b) => {
        const riskRank = { High: 1, Medium: 2, Low: 3 };

        return (
          (riskRank[a.riskLevel] || 9) -
            (riskRank[b.riskLevel] || 9) ||
          getDaysLeftValue(a.deadline) - getDaysLeftValue(b.deadline)
        );
      })
      .slice(0, 4);
  }, [combinedItems]);

  const moduleRiskTotal = moduleInsightCards.reduce(
    (sum, item) => sum + Number(item.riskValue || 0),
    0,
  );

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <ClipboardList size={14} />
                Recruitment Setup
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Action Items
              </h1>

              <p className="mt-1 max-w-5xl text-sm font-medium text-sibs-tertiary-5">
                Track manual and system-suggested actions connected to Public
                Talent Pool, Talent Pool, Hiring Needs, Job Description,
                Candidate Pipeline, Offers, Onboarding, Workforce Hiring Plan, and
                Recruitment Reports.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <RefreshCcw size={17} />
                Refresh Signals
              </button>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={18} />
                Add Action Item
              </button>
            </div>
          </div>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="text-base font-bold text-[#101828]">
              Action Items Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
              <SummaryCard
                title="Total Actions"
                value={stats.total}
                icon={FileText}
                description="Manual + suggested"
                delay={0}
              />

              <SummaryCard
                title="Active"
                value={stats.active}
                icon={Activity}
                description="Needs movement"
                valueClassName="text-blue-600"
                iconClassName="bg-blue-50 text-blue-600"
                delay={60}
              />

              <SummaryCard
                title="Planned"
                value={stats.planned}
                icon={Clock3}
                description="Not started"
                valueClassName="text-amber-500"
                iconClassName="bg-amber-50 text-amber-600"
                delay={120}
              />

              <SummaryCard
                title="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                description={`${stats.completionRate}% complete`}
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={180}
              />

              <SummaryCard
                title="High Risk"
                value={stats.highRisk}
                icon={AlertTriangle}
                description="Priority"
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={240}
              />

              <SummaryCard
                title="Overdue"
                value={stats.overdue}
                icon={CircleAlert}
                description="Needs review"
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={300}
              />

              <SummaryCard
                title="Module Signals"
                value={moduleRiskTotal}
                icon={Target}
                description="Recruitment data"
                delay={360}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <section
              className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
              style={{ animationDelay: "120ms" }}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Recruitment Action Health
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Status and risk distribution across all action items.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
                  <ListChecks size={22} />
                </div>
              </div>

              <div className="space-y-5">
                <ProgressBar
                  label="Planned"
                  value={stats.planned}
                  total={stats.total}
                  helper="Actions not yet started"
                  delay={0}
                />

                <ProgressBar
                  label="Ongoing"
                  value={stats.ongoing}
                  total={stats.total}
                  helper="Actions currently in progress"
                  delay={60}
                />

                <ProgressBar
                  label="Completed"
                  value={stats.completed}
                  total={stats.total}
                  helper="Closed and ready for reporting"
                  delay={120}
                />

                <ProgressBar
                  label="High Risk"
                  value={stats.highRisk}
                  total={stats.total}
                  helper="Items that need immediate movement"
                  delay={180}
                />

                <ProgressBar
                  label="Overdue"
                  value={stats.overdue}
                  total={stats.total}
                  helper="Past deadline and still open"
                  delay={240}
                />
              </div>
            </section>

            <section
              className="sibs-profile-tab-panel rounded-xl border border-red-100 bg-red-50 p-5 shadow-sm sm:p-6"
              style={{ animationDelay: "180ms" }}
            >
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-red-700">
                    Priority Watchlist
                  </h3>

                  <p className="mt-1 text-sm font-medium leading-6 text-red-700/80">
                    Most urgent open items based on risk level and deadline.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {topRisks.length > 0 ? (
                  topRisks.map((item, index) => (
                    <button
                      type="button"
                      key={`${item.sourceType}-${item.id}-${item.actionId}`}
                      onClick={() => setSelectedItem(item)}
                      className="sibs-page-card-in w-full rounded-xl border border-red-100 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FAFBFC] hover:shadow-sm active:scale-[0.98]"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-red-600">
                            {item.actionId} · {item.module || "Recruitment"}
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#101828]">
                            {item.actionItem}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getRiskClass(
                            item.riskLevel,
                          )}`}
                        >
                          {item.riskLevel}
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
                        {getDaysLeft(item.deadline)}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-100 bg-white p-5 text-center">
                    <CheckCircle2
                      className="mx-auto text-emerald-600"
                      size={28}
                    />

                    <p className="mt-2 text-sm font-bold text-emerald-700">
                      No open high-priority items.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "240ms" }}
          >
            <h2 className="text-base font-bold text-[#101828]">
              Recruitment Module Signals
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Data-driven indicators pulled from the recruitment module local
              records.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {moduleInsightCards.map((item, index) => (
                <ModuleInsightCard
                  key={item.module}
                  item={item}
                  delay={index * 60}
                />
              ))}
            </div>
          </section>

          <section
            className="relative z-[80] sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "300ms" }}
          >
            <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-sibs-primary-1">
                    Action Item List
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Search and filter manual and system-suggested actions.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  {sortedItems.length} Records
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[1fr_170px_150px_200px_190px_190px_auto] 2xl:items-end">
                <div>
                  <label className="mb-1 block text-sm font-bold text-[#101828]">
                    Search
                  </label>

                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                    />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search action, module, owner..."
                      className={inputClass("pl-11 pr-4")}
                    />
                  </div>
                </div>

                <CustomSelect
                  label="Status"
                  value={statusFilter}
                  options={statusOptions}
                  onChange={setStatusFilter}
                  zIndex="z-60"
                />

                <CustomSelect
                  label="Risk"
                  value={riskFilter}
                  options={riskOptions}
                  onChange={setRiskFilter}
                  zIndex="z-50"
                />

                <CustomSelect
                  label="Module"
                  value={moduleFilter}
                  options={moduleOptions}
                  onChange={setModuleFilter}
                  zIndex="z-40"
                />

                <CustomSelect
                  label="Gap"
                  value={gapFilter}
                  options={gapOptions}
                  onChange={setGapFilter}
                  zIndex="z-30"
                />

                <CustomSelect
                  label="Owner"
                  value={ownerFilter}
                  options={ownerOptions}
                  onChange={setOwnerFilter}
                  zIndex="z-20"
                />

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                >
                  <Filter size={17} />
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3 lg:hidden">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <ActionItemMobileCard
                      key={`${item.sourceType}-${item.id}-${item.actionId}`}
                      item={item}
                      onView={() => setSelectedItem(item)}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                    No action item records found.
                  </div>
                )}
              </div>

              <div className="hidden lg:block">
                <div className="overflow-x-auto p-0">
                  <table className="w-full min-w-[1420px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                        <th className="px-5 py-4 first:rounded-tl-2xl">
                          Action ID
                        </th>
                        <th className="px-5 py-4">Action Item</th>
                        <th className="px-5 py-4">Module</th>
                        <th className="px-5 py-4">Role / Account</th>
                        <th className="px-5 py-4">Owner</th>
                        <th className="px-5 py-4">Deadline</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Risk</th>
                        <th className="px-5 py-4">Gap</th>
                        <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedItems.length > 0 ? (
                        paginatedItems.map((item) => (
                          <tr
                            key={`${item.sourceType}-${item.id}-${item.actionId}`}
                            className="transition-all duration-200 hover:bg-[#FAFBFC]"
                          >
                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <p className="text-sm font-bold text-sibs-primary-1">
                                {item.actionId}
                              </p>

                              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                                {item.sourceType || "Manual"}
                              </p>
                            </td>

                            <td className="max-w-[360px] border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <p className="line-clamp-2 text-sm font-bold leading-6 text-[#101828]">
                                {item.actionItem}
                              </p>

                              {item.systemGenerated && (
                                <span className="mt-2 inline-flex rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700">
                                  System Suggested
                                </span>
                              )}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getModuleClass(
                                  item.module,
                                )}`}
                              >
                                {item.module || "Recruitment"}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <p className="text-sm font-bold text-[#101828]">
                                {item.roleTitle || "—"}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                                {item.account || "—"}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
                                <UserRound
                                  size={15}
                                  className="text-gray-400"
                                />
                                {item.owner}
                              </div>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
                                  <CalendarDays
                                    size={15}
                                    className="text-gray-400"
                                  />
                                  {formatDate(item.deadline)}
                                </div>

                                <p
                                  className={`text-xs font-bold ${
                                    getDaysLeftValue(item.deadline) < 0 &&
                                    item.status !== "Completed"
                                      ? "text-red-600"
                                      : "text-sibs-tertiary-5"
                                  }`}
                                >
                                  {getDaysLeft(item.deadline)}
                                </p>
                              </div>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  item.status,
                                )}`}
                              >
                                {item.status}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                                  item.riskLevel,
                                )}`}
                              >
                                {item.riskLevel}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getGapClass(
                                  item.linkedGap,
                                )}`}
                              >
                                {item.linkedGap}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-right align-top">
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                              >
                                <Eye size={15} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={10}
                            className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                          >
                            No action item records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm font-semibold text-sibs-tertiary-5">
                  Showing {showingFrom} to {showingTo} of {sortedItems.length}{" "}
                  action item records
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    const active = currentPage === pageNumber;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => handlePageChange(pageNumber)}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
                          active
                            ? "bg-sibs-primary-1 text-white shadow-sm"
                            : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5"
            style={{ animationDelay: "360ms" }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                  <Timer size={22} />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-sibs-primary-1">
                    Action Items Rule
                  </h3>

                  <p className="mt-2 max-w-5xl text-sm leading-6 text-sibs-primary-1/80">
                    Every role or account that is not fully hired must have at
                    least one action item. The item must be linked to the correct
                    gap: Pipeline, Screening, Interview, Offer, JD, Approval,
                    Capacity / Manpower, Onboarding, or Reporting.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={18} />
                Add Missing Action
              </button>
            </div>
          </section>
        </div>
      </main>

      <AddActionItemModal
        open={showAddModal}
        form={actionForm}
        setForm={setActionForm}
        onClose={handleCloseAddModal}
        onSubmit={handleAddActionItem}
        onReset={handleResetActionForm}
      />

      <ActionItemDetailsModal
        open={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onComplete={handleCompleteActionItem}
      />
    </div>
  );
}