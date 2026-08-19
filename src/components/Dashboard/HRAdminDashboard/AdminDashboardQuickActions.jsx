import { createElement } from "react";
import { ChevronRight } from "lucide-react";

export default function AdminDashboardQuickActions({
  actions = [],
  onAction,
  delay = 0,
}) {
  return (
    <section
      className="sibs-page-card-in sibs-card p-4 2xl:p-5"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="border-b border-[#E6ECF2] pb-2.5 2xl:pb-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
            Quick Actions
          </h2>
          <p className="sibs-text-xs font-semibold text-[#667085]">
            Instant shortcuts for common admin tasks
          </p>
        </div>
      </div>

      <div className="mt-3 2xl:mt-4 space-y-2.5 2xl:space-y-3">
        {actions.map((action, index) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction?.(action)}
            className="group sibs-page-card-in flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 2xl:p-3 text-left transition-all hover:border-[#FF5C28]/50 hover:bg-[#FFF0EB]"
            style={{
              animationDelay: `${index * 40}ms`,
              animationFillMode: "both",
            }}
          >
            <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF5C28] transition-colors group-hover:bg-[#FF5C28] group-hover:text-white">
              {action.icon ? createElement(action.icon, { className: "h-4 w-4 2xl:h-[18px] 2xl:w-[18px]" }) : null}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block sibs-text-xs font-extrabold text-[#042C51] transition group-hover:text-[#FF5C28]">
                {action.title}
              </span>
              <span className="mt-0.5 block sibs-text-micro text-[#667085]">
                {action.description}
              </span>
            </span>

            <ChevronRight className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#FF5C28]" />
          </button>
        ))}
      </div>
    </section>
  );
}
