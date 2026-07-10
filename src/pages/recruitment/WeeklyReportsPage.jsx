import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Header from "../../components/layout/Header";
import {
  Mail,
  Search,
  Eye,
  Copy,
  Download,
  Send,
  X,
  CalendarDays,
  FileText,
  FileClock,
  BarChart3,
  ListChecks,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ClipboardList,
  UsersRound,
  UserCheck,
  BriefcaseBusiness,
  ShieldCheck,
  Layers3,
  Activity,
  Timer,
} from "lucide-react";

const WEEKLY_REPORTS_STORAGE_KEY = "ta_weekly_reports";
const ACTION_ITEMS_STORAGE_KEY = "ta_action_items";
const PUBLIC_SUBMISSIONS_KEY = "ta_public_candidate_submissions";
const INTERNAL_CANDIDATES_KEY = "ta_internal_candidates";
const CANDIDATE_APPLICATIONS_KEY = "ta_candidate_applications";
const PIPELINE_CANDIDATES_KEY = "ta_pipeline_candidates";
const OFFER_RECORDS_KEY = "ta_offer_records";
const ONBOARDING_RECORDS_KEY = "ta_onboarding_records";
const HIRING_NEEDS_KEY = "ta_hiring_needs";
const WORKFORCE_HIRING_PLAN_KEY = "ta_workforce_hiring_plan";

const REPORTS_PER_PAGE = 8;

const fallbackWeeklyReports = [
  {
    id: 1,
    reportId: "WR-2026-W18",
    weekLabel: "Week 18, 2026",
    dateRange: "Apr 29 - May 5, 2026",
    status: "Generated",
    generatedDate: "2026-05-06",
    generatedBy: "System",
    totalOpenRoles: 5,
    totalRequirement: 35,
    totalFilled: 20,
    atRiskRoles: 2,
    delayedRoles: 2,
    dropOffs: 32,
    sourced: 181,
    screened: 103,
    interviewed: 49,
    offered: 21,
    accepted: 15,
    hired: 20,
    missingDataCount: 2,
    actionItemsCount: 5,
    publicApplicants: 0,
    talentPoolCount: 0,
    pendingHiringNeeds: 0,
    pendingOffers: 0,
    pendingOnboarding: 0,
    summary:
      "Hiring delivery is progressing but CSR, QA, and System Developer roles require immediate action due to risk and delay flags.",
    roles: [
      {
        role: "CSR",
        account: "SIBS Operations",
        requirement: 20,
        filled: 12,
        status: "At Risk",
        owner: "Maria Reyes",
      },
      {
        role: "QA Specialist",
        account: "SIBS Operations",
        requirement: 5,
        filled: 2,
        status: "Delayed",
        owner: "John Dela Cruz",
      },
      {
        role: "RCM Analyst",
        account: "SIBS RCM",
        requirement: 5,
        filled: 3,
        status: "On Track",
        owner: "Kim Domingo",
      },
    ],
    actionItems: [
      "Add 50 sourced candidates for CSR role before Friday.",
      "Schedule pending QA interviews within 48 hours.",
      "Review compensation range for System Developer applicants.",
    ],
    missingData: [
      "QA interview feedback is incomplete for 2 candidates.",
      "System Developer offer decline reason needs confirmation.",
    ],
  },
  {
    id: 2,
    reportId: "WR-2026-W17",
    weekLabel: "Week 17, 2026",
    dateRange: "Apr 22 - Apr 28, 2026",
    status: "Sent",
    generatedDate: "2026-04-29",
    generatedBy: "System",
    totalOpenRoles: 4,
    totalRequirement: 28,
    totalFilled: 16,
    atRiskRoles: 2,
    delayedRoles: 1,
    dropOffs: 26,
    sourced: 150,
    screened: 92,
    interviewed: 41,
    offered: 18,
    accepted: 12,
    hired: 16,
    missingDataCount: 1,
    actionItemsCount: 4,
    publicApplicants: 0,
    talentPoolCount: 0,
    pendingHiringNeeds: 0,
    pendingOffers: 0,
    pendingOnboarding: 0,
    summary:
      "Previous week showed stronger sourcing volume but interview conversion remained a concern.",
    roles: [
      {
        role: "CSR",
        account: "SIBS Operations",
        requirement: 18,
        filled: 10,
        status: "At Risk",
        owner: "Maria Reyes",
      },
      {
        role: "QA Specialist",
        account: "SIBS Operations",
        requirement: 5,
        filled: 1,
        status: "Delayed",
        owner: "John Dela Cruz",
      },
    ],
    actionItems: [
      "Increase sourcing for QA role.",
      "Review interview schedule delays.",
    ],
    missingData: ["One candidate drop-off reason was not categorized."],
  },
  {
    id: 3,
    reportId: "WR-2026-W16",
    weekLabel: "Week 16, 2026",
    dateRange: "Apr 15 - Apr 21, 2026",
    status: "Archived",
    generatedDate: "2026-04-22",
    generatedBy: "System",
    totalOpenRoles: 3,
    totalRequirement: 20,
    totalFilled: 14,
    atRiskRoles: 1,
    delayedRoles: 1,
    dropOffs: 18,
    sourced: 120,
    screened: 74,
    interviewed: 35,
    offered: 15,
    accepted: 10,
    hired: 14,
    missingDataCount: 0,
    actionItemsCount: 3,
    publicApplicants: 0,
    talentPoolCount: 0,
    pendingHiringNeeds: 0,
    pendingOffers: 0,
    pendingOnboarding: 0,
    summary:
      "Hiring progress was stable with fewer missing data issues compared to later weeks.",
    roles: [
      {
        role: "CSR",
        account: "SIBS Operations",
        requirement: 15,
        filled: 11,
        status: "On Track",
        owner: "Maria Reyes",
      },
    ],
    actionItems: ["Maintain CSR sourcing pipeline."],
    missingData: [],
  },
];

const statusOptions = ["All Status", "Generated", "Sent", "Archived"];

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
    // Frontend-only fallback.
  }
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentWeekLabel() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.ceil(diff / oneWeek);

  return `Week ${weekNumber}, ${now.getFullYear()}`;
}

function getCurrentWeekDateRange() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })} - ${sunday.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function generateReportId() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.ceil(diff / oneWeek);

  return `WR-${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
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

function getRoleFromRecord(record) {
  return normalizeText(
    record?.roleTitle ||
      record?.positionTitle ||
      record?.openPosition ||
      record?.roleCapability ||
      record?.appliedRole ||
      record?.jobDescriptionTitle ||
      record?.job_description_title ||
      "Not assigned",
  );
}

function getAccountFromRecord(record) {
  return normalizeText(
    record?.account ||
      record?.appliedAccount ||
      record?.departmentAccount ||
      record?.department_account ||
      record?.accountName ||
      record?.roleAccount ||
      "Not assigned",
  );
}

function getOwnerFromRecord(record) {
  return normalizeText(
    record?.owner ||
      record?.taOwner ||
      record?.assignedTo ||
      record?.preparedBy ||
      record?.createdBy ||
      "Unassigned",
  );
}

function getStatusClass(status) {
  switch (status) {
    case "Generated":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Sent":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Archived":
      return "border-gray-200 bg-gray-50 text-gray-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getRoleStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getPriorityStatus(required, filled) {
  const req = Number(required || 0);
  const done = Number(filled || 0);

  if (req <= 0) return "On Track";

  const percentage = Math.round((done / req) * 100);

  if (percentage >= 100) return "On Track";
  if (percentage >= 70) return "At Risk";
  return "Delayed";
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
  const actionItems = safeReadArray(ACTION_ITEMS_STORAGE_KEY);

  const allCandidates = [...publicSubmissions, ...internalCandidates];
  const allPipeline = [...candidateApplications, ...pipelineCandidates];

  const sourced = allCandidates.length + allPipeline.length;

  const screened = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("screen") ||
      status.includes("interview") ||
      status.includes("offer") ||
      status.includes("accepted") ||
      status.includes("hired")
    );
  }).length;

  const interviewed = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("interview") ||
      status.includes("offer") ||
      status.includes("accepted") ||
      status.includes("hired")
    );
  }).length;

  const offeredFromPipeline = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return (
      status.includes("offer") ||
      status.includes("offered") ||
      status.includes("accepted") ||
      status.includes("hired")
    );
  }).length;

  const offered = Math.max(offers.length, offeredFromPipeline);

  const accepted = offers.filter((item) => {
    const status = normalizeText(
      item.status || item.offerStatus || item.approvalStatus || item.finalStatus,
    ).toLowerCase();

    return status.includes("accepted") || status.includes("approved");
  }).length;

  const hiredFromPipeline = allPipeline.filter((item) => {
    const status = getCandidateStatus(item).toLowerCase();
    return status.includes("hired") || status.includes("active");
  }).length;

  const trueHires = onboarding.filter((item) => {
    const status = normalizeText(
      item.finalOutcome ||
        item.showStatus ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return status.includes("true hire") || status.includes("show");
  }).length;

  const hired = Math.max(hiredFromPipeline, trueHires);

  const dropOffs =
    allPipeline.filter((item) => {
      const status = getCandidateStatus(item).toLowerCase();
      return (
        status.includes("failed") ||
        status.includes("drop") ||
        status.includes("withdraw") ||
        status.includes("declined") ||
        status.includes("rejected") ||
        status.includes("cancelled")
      );
    }).length +
    offers.filter((item) => {
      const status = normalizeText(
        item.status || item.offerStatus || item.finalStatus,
      ).toLowerCase();

      return (
        status.includes("declined") ||
        status.includes("rejected") ||
        status.includes("withdraw")
      );
    }).length +
    onboarding.filter((item) => {
      const status = normalizeText(
        item.finalOutcome ||
          item.showStatus ||
          item.status ||
          item.onboardingStatus,
      ).toLowerCase();

      return (
        status.includes("no show") ||
        status.includes("withdraw") ||
        status.includes("pre-start")
      );
    }).length;

  const pendingHiringNeeds = hiringNeeds.filter((item) => {
    const status = normalizeText(item.approvalStatus || item.status).toLowerCase();

    return (
      !status ||
      status.includes("for approval") ||
      status.includes("pending") ||
      status.includes("under review")
    );
  });

  const pendingOffers = offers.filter((item) => {
    const status = normalizeText(
      item.status || item.offerStatus || item.approvalStatus || item.finalStatus,
    ).toLowerCase();

    return (
      status.includes("pending") ||
      status.includes("for review") ||
      status.includes("for approval") ||
      status.includes("offered")
    );
  });

  const pendingOnboarding = onboarding.filter((item) => {
    const status = normalizeText(
      item.finalOutcome ||
        item.showStatus ||
        item.status ||
        item.onboardingStatus,
    ).toLowerCase();

    return status.includes("pending") || status.includes("waiting");
  });

  const openActionItems = actionItems.filter(
    (item) => normalizeText(item.status) !== "Completed",
  );

  const missingData = [];

  if (pendingHiringNeeds.length > 0) {
    missingData.push(
      `${pendingHiringNeeds.length} hiring need/s still pending approval.`,
    );
  }

  if (pendingOffers.length > 0) {
    missingData.push(
      `${pendingOffers.length} offer record/s still pending review or acceptance.`,
    );
  }

  if (pendingOnboarding.length > 0) {
    missingData.push(
      `${pendingOnboarding.length} onboarding record/s still pending start confirmation.`,
    );
  }

  if (openActionItems.length > 0) {
    missingData.push(`${openActionItems.length} action item/s remain open.`);
  }

  const weeklyRoles =
    weeklyPlan.length > 0
      ? weeklyPlan.map((item, index) => {
          const role = getRoleFromRecord(item);
          const account = getAccountFromRecord(item);

          const requirement = Number(
            item.requiredHeadcount || item.requirement || item.headcount || 0,
          );

          const filled = Number(
            item.actualHeadcount || item.filled || item.currentFilled || 0,
          );

          const status = normalizeText(
            item.overallStatus || item.pipelineStatus || item.status,
          );

          return {
            id: item.id || item.weeklyPlanItemId || index + 1,
            role,
            account,
            requirement,
            filled,
            status: status || getPriorityStatus(requirement, filled),
            owner: getOwnerFromRecord(item),
          };
        })
      : hiringNeeds.map((item, index) => {
          const role = getRoleFromRecord(item);
          const account = getAccountFromRecord(item);
          const requirement = Number(
            item.headcount || item.requiredHeadcount || 0,
          );

          return {
            id: item.id || item.hiringNeedId || index + 1,
            role,
            account,
            requirement,
            filled: 0,
            status: getPriorityStatus(requirement, 0),
            owner: getOwnerFromRecord(item),
          };
        });

  const totalRequirement = weeklyRoles.reduce(
    (sum, item) => sum + Number(item.requirement || 0),
    0,
  );

  const totalFilled = weeklyRoles.reduce(
    (sum, item) => sum + Number(item.filled || 0),
    0,
  );

  const atRiskRoles = weeklyRoles.filter((item) => item.status === "At Risk")
    .length;

  const delayedRoles = weeklyRoles.filter((item) => item.status === "Delayed")
    .length;

  const actionItemTitles =
    openActionItems.length > 0
      ? openActionItems.slice(0, 8).map((item) => item.actionItem)
      : ["No open action items recorded for the current week."];

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
    actionItems,
    sourced,
    screened,
    interviewed,
    offered,
    accepted,
    hired,
    dropOffs,
    pendingHiringNeeds,
    pendingOffers,
    pendingOnboarding,
    openActionItems,
    missingData,
    weeklyRoles,
    totalRequirement,
    totalFilled,
    atRiskRoles,
    delayedRoles,
    actionItemTitles,
  };
}

function buildCurrentReportFromModules(context) {
  const hasLiveData =
    context.publicSubmissions.length > 0 ||
    context.internalCandidates.length > 0 ||
    context.candidateApplications.length > 0 ||
    context.pipelineCandidates.length > 0 ||
    context.offers.length > 0 ||
    context.onboarding.length > 0 ||
    context.hiringNeeds.length > 0 ||
    context.weeklyPlan.length > 0 ||
    context.actionItems.length > 0;

  if (!hasLiveData) return null;

  const summaryParts = [];

  if (context.totalRequirement > 0) {
    summaryParts.push(
      `Current filled headcount is ${context.totalFilled}/${context.totalRequirement}.`,
    );
  }

  if (context.atRiskRoles > 0) {
    summaryParts.push(`${context.atRiskRoles} role/account group/s are at risk.`);
  }

  if (context.delayedRoles > 0) {
    summaryParts.push(`${context.delayedRoles} role/account group/s are delayed.`);
  }

  if (context.openActionItems.length > 0) {
    summaryParts.push(
      `${context.openActionItems.length} action item/s require follow-up.`,
    );
  }

  if (context.pendingOffers.length > 0) {
    summaryParts.push(
      `${context.pendingOffers.length} offer/s are pending review or acceptance.`,
    );
  }

  if (context.pendingOnboarding.length > 0) {
    summaryParts.push(
      `${context.pendingOnboarding.length} onboarding record/s need start confirmation.`,
    );
  }

  return {
    id: Date.now(),
    reportId: generateReportId(),
    weekLabel: getCurrentWeekLabel(),
    dateRange: getCurrentWeekDateRange(),
    status: "Generated",
    generatedDate: getTodayDate(),
    generatedBy: "System",
    totalOpenRoles: context.weeklyRoles.length,
    totalRequirement: context.totalRequirement,
    totalFilled: context.totalFilled,
    atRiskRoles: context.atRiskRoles,
    delayedRoles: context.delayedRoles,
    dropOffs: context.dropOffs,
    sourced: context.sourced,
    screened: context.screened,
    interviewed: context.interviewed,
    offered: context.offered,
    accepted: context.accepted,
    hired: context.hired,
    missingDataCount: context.missingData.length,
    actionItemsCount: context.openActionItems.length,
    publicApplicants: context.publicSubmissions.length,
    talentPoolCount: context.allCandidates.length,
    pendingHiringNeeds: context.pendingHiringNeeds.length,
    pendingOffers: context.pendingOffers.length,
    pendingOnboarding: context.pendingOnboarding.length,
    summary:
      summaryParts.length > 0
        ? summaryParts.join(" ")
        : "No major recruitment risk detected from the current local module data.",
    roles:
      context.weeklyRoles.length > 0
        ? context.weeklyRoles
        : [
            {
              role: "No active weekly plan",
              account: "Recruitment",
              requirement: 0,
              filled: 0,
              status: "On Track",
              owner: "System",
            },
          ],
    actionItems: context.actionItemTitles,
    missingData:
      context.missingData.length > 0
        ? context.missingData
        : ["No missing data recorded."],
    generatedFromModules: true,
  };
}

function buildEmailPreview(report) {
  if (!report) return "";

  const roleSummary = report.roles
    .map(
      (role) =>
        `- ${role.role} / ${role.account}: ${role.filled}/${role.requirement} filled, ${role.status}, Owner: ${role.owner}`,
    )
    .join("\n");

  const actionItems = report.actionItems.map((item) => `- ${item}`).join("\n");

  const missingData =
    report.missingData.length > 0
      ? report.missingData.map((item) => `- ${item}`).join("\n")
      : "- No missing data recorded.";

  return `Subject: Weekly Hiring Report - ${report.weekLabel}

Hi Team,

Please see the auto-generated weekly hiring report for ${report.dateRange}.

1. Summary
${report.summary}

2. Hiring Plan Snapshot
Total Open Roles: ${report.totalOpenRoles}
Approved Hiring Requirement: ${report.totalRequirement}
Current Filled: ${report.totalFilled}
At-Risk Roles: ${report.atRiskRoles}
Delayed Roles: ${report.delayedRoles}

3. Weekly KPI Snapshot
Sourced: ${report.sourced}
Screened: ${report.screened}
Interviewed: ${report.interviewed}
Offered: ${report.offered}
Accepted: ${report.accepted}
Hired: ${report.hired}
Drop-offs: ${report.dropOffs}

4. Recruitment Module Signals
Public Applicants: ${report.publicApplicants || 0}
Talent Pool Records: ${report.talentPoolCount || 0}
Pending Hiring Needs: ${report.pendingHiringNeeds || 0}
Pending Offers: ${report.pendingOffers || 0}
Pending Onboarding: ${report.pendingOnboarding || 0}

5. Current Status by Role / Account
${roleSummary}

6. Action Items
${actionItems}

7. Missing Data Explanation
${missingData}

Thank you.`;
}

function getModuleSignalCards(context) {
  return [
    {
      title: "Public Talent Pool",
      value: context.publicSubmissions.length,
      description: "Public applicants",
      icon: UsersRound,
      hasRisk: context.publicSubmissions.some(
        (item) => getCandidateStatus(item) === "New Applicant",
      ),
    },
    {
      title: "Talent Pool",
      value: context.allCandidates.length,
      description: "Candidate records",
      icon: UserCheck,
      hasRisk: context.allCandidates.some(
        (item) => getCandidateStatus(item) === "New Applicant",
      ),
    },
    {
      title: "Hiring Needs",
      value: context.hiringNeeds.length,
      description: `${context.pendingHiringNeeds.length} pending approval`,
      icon: BriefcaseBusiness,
      hasRisk: context.pendingHiringNeeds.length > 0,
    },
    {
      title: "Candidate Pipeline",
      value:
        context.candidateApplications.length + context.pipelineCandidates.length,
      description: "Pipeline records",
      icon: Layers3,
      hasRisk: context.dropOffs > 0,
    },
    {
      title: "Offers",
      value: context.offers.length,
      description: `${context.pendingOffers.length} pending offer`,
      icon: ShieldCheck,
      hasRisk: context.pendingOffers.length > 0,
    },
    {
      title: "Onboarding",
      value: context.onboarding.length,
      description: `${context.pendingOnboarding.length} pending start`,
      icon: CheckCircle2,
      hasRisk: context.pendingOnboarding.length > 0,
    },
    {
      title: "Action Items",
      value: context.openActionItems.length,
      description: "Open follow-ups",
      icon: ListChecks,
      hasRisk: context.openActionItems.length > 0,
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

function ModuleSignalCard({ item, delay = 0 }) {
  const Icon = item.icon;

  return (
    <div
      className="sibs-page-card-in group rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {item.title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold ${
              item.hasRisk ? "text-red-600" : "text-sibs-primary-1"
            }`}
          >
            {formatNumber(item.value)}
          </p>

          <p
            className={`mt-1 truncate text-xs font-semibold ${
              item.hasRisk ? "text-red-600" : "text-sibs-tertiary-5"
            }`}
          >
            {item.description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
            item.hasRisk
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

function MovementBar({ label, value, max, delay = 0 }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="sibs-page-card-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-sm font-bold text-[#344054]">
          {label}
        </p>

        <p className="shrink-0 text-sm font-bold text-sibs-primary-1">
          {value}
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

      <div className="max-w-[60%] break-words text-right text-sm font-bold text-[#344054]">
        {value || "—"}
      </div>
    </div>
  );
}

function WeeklyReportMobileCard({ report, onView, delay = 0 }) {
  return (
    <button
      type="button"
      onClick={onView}
      className="sibs-page-card-in w-full rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-sibs-primary-1">
            {report.reportId}
          </p>

          <h3 className="mt-1 text-sm font-bold text-[#101828]">
            {report.weekLabel}
          </h3>

          <p className="mt-1 break-words text-xs font-semibold text-sibs-tertiary-5">
            {report.dateRange}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
            report.status,
          )}`}
        >
          {report.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Requirement
          </p>

          <p className="mt-1 text-xs font-bold text-[#344054]">
            {report.totalRequirement}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-bold uppercase text-sibs-tertiary-5">
            Filled
          </p>

          <p className="mt-1 text-xs font-bold text-emerald-600">
            {report.totalFilled}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
          {report.atRiskRoles} At Risk
        </span>

        <span className="inline-flex rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
          {report.delayedRoles} Delayed
        </span>

        <span className="inline-flex rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#344054]">
          {formatDate(report.generatedDate)}
        </span>
      </div>

      <div className="mt-4">
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1">
          <Eye size={15} />
          Preview Report
        </span>
      </div>
    </button>
  );
}

function ReportDetailsModal({ open, report, onClose, onMarkSent }) {
  const [copied, setCopied] = useState(false);

  if (!open || !report) return null;

  const maxMovement = Math.max(
    report.sourced,
    report.screened,
    report.interviewed,
    report.offered,
    report.accepted,
    report.hired,
    report.dropOffs,
    1,
  );

  const emailPreview = buildEmailPreview(report);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emailPreview);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Failed to copy email preview");
    }
  }

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
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                  report.status,
                )}`}
              >
                {report.status}
              </span>

              {report.generatedFromModules && (
                <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  Generated from Recruitment Data
                </span>
              )}
            </div>

            <h2 className="mt-3 text-lg font-bold text-sibs-primary-1 sm:text-xl">
              Weekly Report Preview
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Auto-generated weekly hiring report and email format.
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
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_430px]">
            <div className="space-y-5">
              <div className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#101828] sm:text-xl">
                      {report.weekLabel}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-sibs-tertiary-5">
                      {report.dateRange}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-[#344054]">
                      {report.summary}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-primary-1/70">
                      Filled
                    </p>

                    <p className="mt-1 text-2xl font-bold text-sibs-primary-1">
                      {report.totalFilled}/{report.totalRequirement}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                style={{ animationDelay: "60ms" }}
              >
                <h3 className="mb-5 text-sm font-bold text-[#101828]">
                  Weekly KPI Snapshot
                </h3>

                <div className="space-y-4">
                  <MovementBar
                    label="Sourced"
                    value={report.sourced}
                    max={maxMovement}
                    delay={0}
                  />
                  <MovementBar
                    label="Screened"
                    value={report.screened}
                    max={maxMovement}
                    delay={40}
                  />
                  <MovementBar
                    label="Interviewed"
                    value={report.interviewed}
                    max={maxMovement}
                    delay={80}
                  />
                  <MovementBar
                    label="Offered"
                    value={report.offered}
                    max={maxMovement}
                    delay={120}
                  />
                  <MovementBar
                    label="Accepted"
                    value={report.accepted}
                    max={maxMovement}
                    delay={160}
                  />
                  <MovementBar
                    label="Hired"
                    value={report.hired}
                    max={maxMovement}
                    delay={200}
                  />
                  <MovementBar
                    label="Drop-offs"
                    value={report.dropOffs}
                    max={maxMovement}
                    delay={240}
                  />
                </div>
              </div>

              <div
                className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                style={{ animationDelay: "120ms" }}
              >
                <h3 className="mb-4 text-sm font-bold text-[#101828]">
                  Role / Account Summary
                </h3>

                <div className="space-y-3">
                  {report.roles.map((role, index) => (
                    <div
                      key={`${role.role}-${index}`}
                      className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#101828]">
                            {role.role}
                          </p>

                          <p className="text-xs font-semibold text-sibs-tertiary-5">
                            {role.account} · Owner: {role.owner}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-[#344054]">
                            {role.filled}/{role.requirement} filled
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getRoleStatusClass(
                              role.status,
                            )}`}
                          >
                            {role.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5"
                style={{ animationDelay: "180ms" }}
              >
                <h3 className="text-sm font-bold text-sibs-primary-1">
                  Report Generation Rule
                </h3>

                <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                  Weekly reports should be generated from Hiring Needs, Weekly
                  Hiring Plan, Candidate Pipeline, Offers, Onboarding, Missing
                  Data, and Action Items. Do not manually reconstruct the weekly
                  report.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Report Summary
                </h3>

                <div className="mt-4">
                  <DetailRow label="Report ID" value={report.reportId} />
                  <DetailRow label="Week" value={report.weekLabel} />
                  <DetailRow label="Date Range" value={report.dateRange} />
                  <DetailRow label="Status" value={report.status} />
                  <DetailRow
                    label="Generated Date"
                    value={formatDate(report.generatedDate)}
                  />
                  <DetailRow label="Generated By" value={report.generatedBy} />
                  <DetailRow
                    label="Action Items"
                    value={report.actionItemsCount}
                  />
                  <DetailRow
                    label="Missing Data"
                    value={report.missingDataCount}
                  />
                  <DetailRow
                    label="Public Applicants"
                    value={report.publicApplicants}
                  />
                  <DetailRow
                    label="Pending Offers"
                    value={report.pendingOffers}
                  />
                  <DetailRow
                    label="Pending Onboarding"
                    value={report.pendingOnboarding}
                  />
                </div>
              </div>

              <div
                className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                style={{ animationDelay: "80ms" }}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#101828]">
                      Email Preview
                    </h3>

                    <p className="text-xs font-semibold text-sibs-tertiary-5">
                      Copy-ready weekly report format.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 py-2 text-xs font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                  >
                    <Copy size={14} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#F8FAFC] p-4 text-xs leading-6 text-[#344054]">
                  {emailPreview}
                </pre>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 py-3 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                >
                  <Download size={16} />
                  Export
                </button>

                <button
                  type="button"
                  onClick={() => onMarkSent(report)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
                >
                  <Send size={16} />
                  Mark as Sent
                </button>
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

export default function WeeklyReportsPage() {
  const mainRef = useRef(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [savedReports, setSavedReports] = useState(() => {
    const stored = safeReadArray(WEEKLY_REPORTS_STORAGE_KEY, []);
    return stored.length > 0 ? stored : fallbackWeeklyReports;
  });

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
    safeWriteArray(WEEKLY_REPORTS_STORAGE_KEY, savedReports);
  }, [savedReports]);

  useEffect(() => {
    function refreshFromStorage() {
      setRefreshKey((prev) => prev + 1);
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

  const generatedCurrentReport = useMemo(
    () => buildCurrentReportFromModules(moduleContext),
    [moduleContext],
  );

  const reports = useMemo(() => {
    if (!generatedCurrentReport) return savedReports;

    const withoutSameWeek = savedReports.filter(
      (report) => report.reportId !== generatedCurrentReport.reportId,
    );

    return [generatedCurrentReport, ...withoutSameWeek];
  }, [generatedCurrentReport, savedReports]);

  const moduleSignalCards = useMemo(
    () => getModuleSignalCards(moduleContext),
    [moduleContext],
  );

  const filteredReports = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !keyword ||
        report.reportId.toLowerCase().includes(keyword) ||
        report.weekLabel.toLowerCase().includes(keyword) ||
        report.dateRange.toLowerCase().includes(keyword) ||
        report.status.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All Status" || report.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / REPORTS_PER_PAGE),
  );

  const paginatedReports = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * REPORTS_PER_PAGE;
    const end = start + REPORTS_PER_PAGE;

    return filteredReports.slice(start, end);
  }, [filteredReports, currentPage, totalPages]);

  const showingFrom =
    filteredReports.length > 0 ? (currentPage - 1) * REPORTS_PER_PAGE + 1 : 0;

  const showingTo = Math.min(
    currentPage * REPORTS_PER_PAGE,
    filteredReports.length,
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
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      scrollToTop("auto");
    }
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const current = reports[0];

    const totalReports = reports.length;

    const generated = reports.filter(
      (report) => report.status === "Generated",
    ).length;

    const sent = reports.filter((report) => report.status === "Sent").length;

    const archived = reports.filter(
      (report) => report.status === "Archived",
    ).length;

    return {
      current,
      totalReports,
      generated,
      sent,
      archived,
    };
  }, [reports]);

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

  function handleGenerateCurrentWeek() {
    const report = buildCurrentReportFromModules(moduleContext);

    if (!report) {
      alert("No recruitment module data is available to generate a weekly report.");
      scrollToTop("auto");
      return;
    }

    setSavedReports((prev) => [
      report,
      ...prev.filter((item) => item.reportId !== report.reportId),
    ]);

    setSelectedReport(report);
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  function handleMarkSent(report) {
    const updated = {
      ...report,
      status: "Sent",
    };

    setSavedReports((prev) => [
      updated,
      ...prev.filter((item) => item.reportId !== report.reportId),
    ]);

    setSelectedReport(updated);
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All Status");
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

  function handleRefreshData() {
    setRefreshKey((prev) => prev + 1);
    setCurrentPage(1);
    scrollToTop("auto");

    window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);
  }

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
                Weekly Reports
              </h1>

              <p className="mt-1 max-w-5xl text-sm font-medium text-sibs-tertiary-5">
                Generate weekly hiring reports from Hiring Needs, Weekly Hiring
                Plan, Candidate Pipeline, Offers, Onboarding, Action Items,
                Talent Pool, and Public Talent Pool data.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleRefreshData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <RefreshCcw size={17} />
                Refresh Data
              </button>

              <button
                type="button"
                onClick={handleGenerateCurrentWeek}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <FileClock size={18} />
                Generate Current Week
              </button>
            </div>
          </div>

          <section
            className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="text-base font-bold text-[#101828]">
              Weekly Reports Summary
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <SummaryCard
                title="Reports"
                value={stats.totalReports}
                icon={FileText}
                description="Weekly reports created"
                delay={0}
              />

              <SummaryCard
                title="Generated"
                value={stats.generated}
                icon={Clock3}
                description="Pending send"
                valueClassName="text-blue-600"
                iconClassName="bg-blue-50 text-blue-600"
                delay={60}
              />

              <SummaryCard
                title="Sent"
                value={stats.sent}
                icon={CheckCircle2}
                description="Already distributed"
                valueClassName="text-emerald-600"
                iconClassName="bg-emerald-50 text-emerald-600"
                delay={120}
              />

              <SummaryCard
                title="Archived"
                value={stats.archived}
                icon={ClipboardList}
                description="Historical reports"
                delay={180}
              />

              <SummaryCard
                title="Action Items"
                value={stats.current?.actionItemsCount || 0}
                icon={ListChecks}
                description="Current week actions"
                valueClassName="text-amber-600"
                iconClassName="bg-amber-50 text-amber-600"
                delay={240}
              />

              <SummaryCard
                title="Missing Data"
                value={stats.current?.missingDataCount || 0}
                icon={AlertTriangle}
                description="Needs explanation"
                valueClassName="text-red-600"
                iconClassName="bg-red-50 text-red-600"
                delay={300}
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
                    Current Weekly Report Snapshot
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Hiring plan, KPI snapshot, current status, and action items.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
                  <BarChart3 size={22} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Requirement
                  </p>

                  <p className="mt-2 text-2xl font-bold text-sibs-primary-1">
                    {stats.current?.totalRequirement || 0}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Filled
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {stats.current?.totalFilled || 0}
                  </p>
                </div>

                <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
                    Drop-offs
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {stats.current?.dropOffs || 0}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                <h3 className="text-sm font-bold text-[#101828]">
                  Current Week Summary
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#344054]">
                  {stats.current?.summary || "No weekly report data available."}
                </p>
              </div>
            </section>

            <section
              className="sibs-profile-tab-panel rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6"
              style={{ animationDelay: "180ms" }}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-3 text-sibs-primary-1">
                  <Mail size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-sibs-primary-1">
                    Weekly Email Requirement
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
                    The system should automatically generate the weekly report
                    format with summary per role/account, hiring plan snapshot,
                    weekly KPI snapshot, current status, action items, and
                    missing data explanations.
                  </p>
                </div>
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
              These values are pulled from other recruitment module local records.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {moduleSignalCards.map((item, index) => (
                <ModuleSignalCard
                  key={item.title}
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
                    Weekly Report List
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Search and filter generated, sent, and archived reports.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                  {filteredReports.length} Records
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_320px_auto] xl:items-end">
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
                      placeholder="Search report, week, status..."
                      className={inputClass("pl-11 pr-4")}
                    />
                  </div>
                </div>

                <CustomSelect
                  label="Status"
                  value={statusFilter}
                  options={statusOptions}
                  onChange={setStatusFilter}
                  zIndex="z-50"
                />

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                >
                  <Activity size={17} />
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-3 lg:hidden">
                {paginatedReports.length > 0 ? (
                  paginatedReports.map((report, index) => (
                    <WeeklyReportMobileCard
                      key={report.reportId}
                      report={report}
                      onView={() => setSelectedReport(report)}
                      delay={index * 60}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
                    No weekly reports found.
                  </div>
                )}
              </div>

              <div className="hidden lg:block">
                <div className="overflow-x-auto p-0">
                  <table className="w-full min-w-[1180px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
                    <thead>
                      <tr className="bg-[#F5F7FA] text-xs font-bold uppercase tracking-wide text-[#174A7C]">
                        <th className="px-5 py-4 first:rounded-tl-2xl">
                          Report ID
                        </th>
                        <th className="px-5 py-4">Week</th>
                        <th className="px-5 py-4">Date Range</th>
                        <th className="px-5 py-4">Generated Date</th>
                        <th className="px-5 py-4 text-center">Req.</th>
                        <th className="px-5 py-4 text-center">Filled</th>
                        <th className="px-5 py-4 text-center">At Risk</th>
                        <th className="px-5 py-4 text-center">Delayed</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right last:rounded-tr-2xl">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedReports.length > 0 ? (
                        paginatedReports.map((report) => (
                          <tr
                            key={report.reportId}
                            className="transition-all duration-200 hover:bg-[#FAFBFC]"
                          >
                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-bold text-sibs-primary-1">
                              {report.reportId}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <p className="text-sm font-bold text-[#101828]">
                                {report.weekLabel}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                                Generated by {report.generatedBy}
                              </p>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                              {report.dateRange}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-sm font-semibold text-[#344054]">
                              <div className="flex items-center gap-2">
                                <CalendarDays
                                  size={15}
                                  className="text-gray-400"
                                />
                                {formatDate(report.generatedDate)}
                              </div>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-[#344054]">
                              {report.totalRequirement}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-emerald-600">
                              {report.totalFilled}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-amber-600">
                              {report.atRiskRoles}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-center text-sm font-bold text-red-600">
                              {report.delayedRoles}
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                  report.status,
                                )}`}
                              >
                                {report.status}
                              </span>
                            </td>

                            <td className="border-b border-[#E6ECF2] px-5 py-5 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedReport(report)}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                              >
                                <Eye size={15} />
                                Preview
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
                            No weekly reports found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm font-semibold text-sibs-tertiary-5">
                  Showing {showingFrom} to {showingTo} of{" "}
                  {filteredReports.length} weekly reports
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
                    Weekly Reports Rule
                  </h3>

                  <p className="mt-2 max-w-5xl text-sm leading-6 text-sibs-primary-1/80">
                    The weekly hiring email should be auto-generated from raw
                    HRIS data: Hiring Plan snapshot, Weekly KPI Snapshot,
                    Current Status, Action Items, and Missing Data explanations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateCurrentWeek}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                <RefreshCcw size={18} />
                Generate Report
              </button>
            </div>
          </section>
        </div>
      </main>

      <ReportDetailsModal
        open={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onMarkSent={handleMarkSent}
      />
    </div>
  );
}