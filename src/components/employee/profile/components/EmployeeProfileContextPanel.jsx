import { useMemo } from "react";
import {
  ChevronRight,
  FileText,
  HeartPulse,
  Printer,
  RefreshCw,
} from "lucide-react";

import { formatDisplayDate } from "../../../../lib/utils/employees/employeeProfileHelpers.js";

export const DEFAULT_QUICK_ACTIONS = [
  { label: "Synchronize Record", action: "sync", icon: RefreshCw },
  { label: "Export / Print Profile", action: "print", icon: Printer },
  { label: "Review Documents", target: "documents", icon: FileText },
  { label: "View CHWCP Coverage", target: "chwcp", icon: HeartPulse },
];

function ContextCard({ title, children }) {
  return (
    <section className="sibs-page-card-in sibs-card p-3.5 2xl:p-4">
      <h3 className="mb-2.5 2xl:mb-3 border-b border-sibs-border pb-2 font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
        {title}
      </h3>
      {children}
    </section>
  );
}

function normalizeQuickAction(item) {
  if (Array.isArray(item)) {
    return {
      label: item[0],
      action: item[1],
      target: item[2] || "",
      icon: null,
    };
  }

  return {
    label: item?.label || "Profile Action",
    action: item?.action || "",
    target: item?.target || "",
    icon: item?.icon || null,
  };
}

export function calculateProfileHealth(employee) {
  if (!employee) {
    return {
      score: 0,
      label: "No Profile Data",
      feedback: "Employee record is empty.",
      navigateTarget: "personal.basic",
    };
  }

  let points = 0;
  const missing = [];

  // 1. Basic Identity (25 pts)
  let basicPts = 0;
  if (employee.firstName && employee.lastName) basicPts += 10;
  if (employee.birthdate || employee.birthDate || employee.dateOfBirth) basicPts += 5;
  if (employee.gender || employee.sex) basicPts += 5;
  if (employee.civilStatus || employee.maritalStatus) basicPts += 5;
  points += basicPts;
  if (basicPts < 25) missing.push("Basic Identity");

  // 2. Contact & Address (20 pts)
  let contactPts = 0;
  if (employee.email || employee.emailAddress || employee.email_address) contactPts += 10;
  if (employee.contact || employee.contactNumber || employee.mobileNumber) contactPts += 5;
  if (employee.residentialAddress || employee.permanentAddress || employee.address) contactPts += 5;
  points += contactPts;
  if (contactPts < 20) missing.push("Contact & Address");

  // 3. Government IDs (20 pts)
  let govPts = 0;
  if (employee.sss || employee.sssNo || employee.sss_no) govPts += 5;
  if (employee.tin || employee.tinNo || employee.tin_no) govPts += 5;
  if (employee.phic || employee.philhealth || employee.philhealthNo) govPts += 5;
  if (employee.hdmf || employee.pagibig || employee.pagibigNo) govPts += 5;
  points += govPts;
  if (govPts < 20) missing.push("Government IDs");

  // 4. Job & Organizational Data (15 pts)
  let jobPts = 0;
  if (employee.department || employee.departmentName) jobPts += 5;
  if (employee.position || employee.positionName || employee.jobTitle) jobPts += 5;
  if (employee.hireDate || employee.dateHired) jobPts += 5;
  points += jobPts;
  if (jobPts < 15) missing.push("Role & Department");

  // 5. Background / Education / Experience (10 pts)
  let bgPts = 0;
  if (Array.isArray(employee.education) && employee.education.length > 0) bgPts += 5;
  if (Array.isArray(employee.experience) && employee.experience.length > 0) bgPts += 5;
  points += bgPts;

  // 6. Documents (10 pts)
  let docPts = 0;
  if (Array.isArray(employee.documents) && employee.documents.length > 0) {
    docPts = Math.min(10, employee.documents.length * 5);
  }
  points += docPts;
  if (docPts === 0) missing.push("Attached Documents");

  const score = Math.min(100, Math.max(0, points));

  let label = "Records Complete";
  let feedback = "All primary and secondary records are in order.";
  let navigateTarget = "documents";

  if (score === 100) {
    label = "100% — Records Complete";
    feedback = "All primary personal, organizational, and government records are filled.";
    navigateTarget = "personal.basic";
  } else if (score >= 80) {
    label = "Good Standing";
    feedback = missing.length > 0 ? `Consider reviewing: ${missing.slice(0, 2).join(", ")}.` : "Primary records complete.";
    navigateTarget = "documents";
  } else if (score >= 50) {
    label = "Partially Complete";
    feedback = `Missing: ${missing.slice(0, 2).join(", ")}.`;
    navigateTarget = "personal.basic";
  } else {
    label = "Incomplete Profile";
    feedback = "Essential personal, contact, and government records are missing.";
    navigateTarget = "personal.basic";
  }

  return { score, label, feedback, navigateTarget };
}

export default function EmployeeProfileContextPanel({
  employee,
  onNavigate,
  onAction,
  showAuditTrail = true,
  quickActions = DEFAULT_QUICK_ACTIONS,
  healthNavigateTarget,
}) {
  const health = useMemo(() => calculateProfileHealth(employee), [employee]);
  const score = health.score;

  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference * (1 - score / 100);

  function handleQuickAction(item) {
    const action = normalizeQuickAction(item);

    if (action.target) {
      onNavigate?.(action.target);
      return;
    }

    onAction?.(action.action, action);
  }

  const targetTab = healthNavigateTarget || health.navigateTarget;

  return (
    <aside className="space-y-4 2xl:space-y-5 xl:sticky xl:top-4 font-jakarta">
      <ContextCard title="Profile Health Check">
        <div className="space-y-3 2xl:space-y-4 text-center">
          <div className="relative mx-auto flex h-24 w-24 2xl:h-28 2xl:w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 112 112">
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth="8"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="transparent"
                stroke={score >= 80 ? "#1B804B" : score >= 50 ? "#042C51" : "#FF5C28"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>

            <div className="absolute text-center">
              <p className="font-heading text-xl 2xl:text-2xl font-bold tabular-nums tracking-tight text-sibs-navy">
                {score}%
              </p>
              <p className="font-heading text-[10px] font-bold uppercase tracking-wider text-sibs-muted">
                Completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.(targetTab)}
            className="w-full rounded-xl border border-sibs-border-subtle bg-[#F8FAFC] p-2.5 text-center transition hover:border-sibs-orange/40 hover:bg-[#FFF7F3]"
          >
            <p className="font-heading text-xs 2xl:text-sm font-bold text-sibs-navy tracking-tight">
              {health.label}
            </p>
            <p className="mt-0.5 sibs-text-micro font-semibold text-sibs-muted">
              {health.feedback}
            </p>
          </button>
        </div>
      </ContextCard>

      <ContextCard title="Profile Quick Actions">
        <div className="space-y-1.5">
          {quickActions.map((item, index) => {
            const action = normalizeQuickAction(item);
            const Icon = action.icon;

            return (
              <button
                key={`${action.label}-${index}`}
                type="button"
                onClick={() => handleQuickAction(item)}
                className="group flex w-full items-center justify-between rounded-lg border border-sibs-border bg-[#F8FAFC] px-2.5 py-1.5 2xl:px-3 2xl:py-2 text-left sibs-text-micro 2xl:sibs-text-xs font-bold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-[#FFF9F6] hover:text-sibs-orange"
              >
                <div className="flex min-w-0 items-center gap-2 pr-2">
                  {Icon ? <Icon size={14} className="shrink-0 text-sibs-muted group-hover:text-sibs-orange" /> : null}
                  <span className="truncate">{action.label}</span>
                </div>
                <ChevronRight size={14} className="shrink-0 text-sibs-orange" />
              </button>
            );
          })}
        </div>
      </ContextCard>

      {showAuditTrail ? (
        <ContextCard title="Audit Trail & Status History">
          <div className="space-y-2.5 text-[9.5px] font-semibold text-sibs-muted">
            {Array.isArray(employee?.statusHistory) && employee.statusHistory.length > 0 ? (
              employee.statusHistory.slice(0, 3).map((item, idx) => (
                <div key={item.id || idx} className="flex items-start gap-2">
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      idx === 0 ? "bg-sibs-orange" : "bg-slate-300"
                    }`}
                  />
                  <div>
                    <p className="font-bold text-sibs-navy">
                      {item.status || item.stage || "Status Update"}
                    </p>
                    <p className="text-slate-400">
                      {item.date ? formatDisplayDate(item.date) : "Recorded in HRIS"}
                      {item.remarks ? ` • ${item.remarks}` : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sibs-orange" />
                  <div>
                    <p className="font-bold text-sibs-navy">
                      Employment Status: {employee?.status || "Active"}
                    </p>
                    <p className="text-slate-400">
                      {employee?.hireDate || employee?.dateHired
                        ? `Hired ${formatDisplayDate(employee?.hireDate || employee?.dateHired)}`
                        : "Current HRIS Active Record"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <div>
                    <p className="font-bold text-sibs-navy">
                      Record Synchronization
                    </p>
                    <p className="text-slate-400">
                      {employee?.updatedAt || employee?.updated_at
                        ? `Last modified ${formatDisplayDate(employee?.updatedAt || employee?.updated_at)}`
                        : "Real-time state synchronized"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <div>
                    <p className="font-bold text-sibs-navy">
                      HRIS Governance & Security
                    </p>
                    <p className="text-slate-400">
                      Access authorized under role-based HRIS security controls.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ContextCard>
      ) : null}
    </aside>
  );
}