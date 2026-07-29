import { createElement } from "react";
import { ChevronRight } from "lucide-react";

export default function AdminDashboardQuickActions({
  actions = [],
  onAction,
  delay = 0,
}) {
  return (
    <section
      className="sibs-page-card-in sibs-card p-5"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="border-b border-[#F1F5F9] pb-3">
        <h2 className="text-base font-extrabold text-[#042C51]">
          Quick Actions
        </h2>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Instant shortcuts for common admin tasks
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction?.(action)}
            className="group flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:border-[#FF5C28]/50 hover:bg-[#FFF0EB]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF5C28] transition-colors group-hover:bg-[#FF5C28] group-hover:text-white">
              {action.icon ? createElement(action.icon, { size: 18 }) : null}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold leading-5 text-[#042C51] transition group-hover:text-[#FF5C28]">
                {action.title}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-[#667085]">
                {action.description}
              </span>
            </span>

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#FF5C28]" />
          </button>
        ))}
      </div>
    </section>
  );
}
