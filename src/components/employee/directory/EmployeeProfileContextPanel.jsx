import { useMemo } from "react";
import { ChevronRight } from "lucide-react";

import { formatDisplayDate } from "../../../../lib/utils/EmployeeProfile/employeeProfileHelpers.js";

function ContextCard({ title, children }) {
  return (
    <section className="sibs-page-card-in sibs-card p-4">
      <h3 className="mb-3 border-b border-[#F1F5F9] pb-2 text-[11px] font-black uppercase tracking-wider text-[#042C51]">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function EmployeeProfileContextPanel({
  employee,
  onNavigate,
  onAction,
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
  const quickActions = [
    ["Request COE (Certificate of Employment)", "sync"],
    ["Export Profile", "print"],
    ["Synchronize Employee Record", "sync"],
    ["Generate Performance Snapshot", "print"],
  ];

  return (
    <aside className="space-y-5 xl:sticky xl:top-4">
      <ContextCard title="Profile Health Check">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
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
              <p className="text-xl font-black text-[#042C51]">{score}%</p>
              <p className="text-[8px] font-black uppercase text-slate-400">
                Completed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("documents")}
            className="w-full rounded-xl border border-slate-100 bg-[#F8FAFC] p-2.5 text-center transition hover:bg-[#E9F0FC]"
          >
            <p className="text-xs font-bold text-[#042C51]">
              Primary records complete
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Review the employee&apos;s attached documents and declarations.
            </p>
          </button>
        </div>
      </ContextCard>

      <ContextCard title="Profile Quick Actions">
        <div className="space-y-1.5">
          {quickActions.map(([label, action]) => (
            <button
              key={label}
              type="button"
              onClick={() => onAction(action)}
              className="flex w-full items-center justify-between rounded-lg bg-[#F1F5F9] px-3 py-2 text-left text-[11px] font-bold text-[#042C51] transition hover:bg-[#E9F0FC]"
            >
              <span>{label}</span>
              <ChevronRight size={14} className="shrink-0 text-[#FF5C28]" />
            </button>
          ))}
        </div>
      </ContextCard>

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
    </aside>
  );
}
