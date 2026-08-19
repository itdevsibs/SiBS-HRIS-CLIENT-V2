import { useMemo } from "react";
import { ChevronRight } from "lucide-react";

import { formatDisplayDate } from "../../../../lib/utils/employees/employeeProfileHelpers.js";

export const DEFAULT_QUICK_ACTIONS = [
  { label: "Request COE (Certificate of Employment)", action: "sync" },
  { label: "Export Profile", action: "print" },
  { label: "Synchronize Employee Record", action: "sync" },
  { label: "Generate Performance Snapshot", action: "print" },
];

function ContextCard({ title, children }) {
  return (
    <section className="sibs-page-card-in sibs-card p-3.5 2xl:p-4">
      <h3 className="mb-2.5 2xl:mb-3 border-b border-[#F1F5F9] pb-2 text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
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
    };
  }

  return {
    label: item?.label || "Profile Action",
    action: item?.action || "",
    target: item?.target || "",
  };
}

export default function EmployeeProfileContextPanel({
  employee,
  onNavigate,
  onAction,
  showAuditTrail = true,
  quickActions = DEFAULT_QUICK_ACTIONS,
  healthNavigateTarget = "documents",
}) {
  const score = useMemo(() => {
    let total = 75;
    if (employee?.spouseSurname || employee?.spouseFirstName) total += 5;
    if (Array.isArray(employee?.education) && employee.education.length > 0)
      total += 5;
    if (Array.isArray(employee?.experience) && employee.experience.length > 0)
      total += 5;
    if (Array.isArray(employee?.eligibility) && employee.eligibility.length > 0)
      total += 5;
    if (Array.isArray(employee?.documents) && employee.documents.length > 3)
      total += 5;
    return Math.min(total, 100);
  }, [employee]);

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

  return (
    <aside className="space-y-4 2xl:space-y-5 xl:sticky xl:top-4">
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
                stroke="#042C51"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>

            <div className="absolute text-center">
              <p className="text-lg 2xl:text-xl font-extrabold tabular-nums text-[#042C51]">{score}%</p>
              <p className="sibs-text-micro font-extrabold uppercase tracking-wider text-[#667085]">
                Completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.(healthNavigateTarget)}
            className="w-full rounded-xl border border-slate-100 bg-[#F8FAFC] p-2 2xl:p-2.5 text-center transition hover:bg-[#E9F0FC]"
          >
            <p className="sibs-text-xs font-extrabold text-[#042C51]">
              Primary records complete
            </p>
            <p className="mt-0.5 sibs-text-micro font-semibold text-[#667085]">
              Review the employee&apos;s attached documents and declarations.
            </p>
          </button>
        </div>
      </ContextCard>

      <ContextCard title="Profile Quick Actions">
        <div className="space-y-1.5">
          {quickActions.map((item, index) => {
            const action = normalizeQuickAction(item);

            return (
              <button
                key={`${action.label}-${index}`}
                type="button"
                onClick={() => handleQuickAction(item)}
                className="flex w-full items-center justify-between rounded-lg bg-[#F8FAFC] border border-[#E6ECF2] px-2.5 py-1.5 2xl:px-3 2xl:py-2 text-left sibs-text-micro 2xl:sibs-text-xs font-bold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:text-[#FF5C28]"
              >
                <span className="truncate pr-2">{action.label}</span>
                <ChevronRight size={14} className="shrink-0 text-[#FF5C28]" />
              </button>
            );
          })}
        </div>
      </ContextCard>

      {showAuditTrail ? (
        <ContextCard title="Audit Trail Logs">
          <div className="space-y-2.5 text-[9px] font-semibold text-[#667085]">
            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5C28]" />
              <div>
                <p className="font-bold text-slate-800">Employee record opened</p>
                <p className="text-slate-400">Current HRIS session</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <div>
                <p className="font-bold text-slate-800">
                  Profile state synchronized
                </p>
                <p className="text-slate-400">
                  {formatDisplayDate(employee?.updatedAt || employee?.updated_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              <div>
                <p className="font-bold text-slate-800">
                  Official profile available
                </p>
                <p className="text-slate-400">
                  Access is controlled by the existing HRIS permissions.
                </p>
              </div>
            </div>
          </div>
        </ContextCard>
      ) : null}
    </aside>
  );
}