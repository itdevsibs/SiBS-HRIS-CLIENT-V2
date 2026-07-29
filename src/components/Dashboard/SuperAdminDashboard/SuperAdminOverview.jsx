import { AlertTriangle, ArrowRight, ChevronRight } from "lucide-react";

export default function SuperAdminOverview({
  cards,
  exceptionsCount,
  onNavigate,
  onOpenExceptions,
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <article
            key={card.label}
            className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-[#FAFBFC] p-4"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
              {card.label}
            </span>
            <h3 className="mt-2 text-base font-extrabold text-[#042C51]">
              {card.value}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-[#667085]">
              {card.details}
            </p>
            <button
              type="button"
              onClick={() => onNavigate(card.path)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#FF5C28] hover:underline"
            >
              {card.linkLabel}
              <ChevronRight size={14} />
            </button>
          </article>
        ))}
      </div>

      <section className="sibs-page-card-in rounded-2xl bg-[#042C51] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle size={17} className="text-[#FF5C28]" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                Super Admin Operational Focus Items
              </h3>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold">
                {exceptionsCount} Active Desk Exceptions
              </span>
            </div>
            <p className="mt-3 max-w-5xl text-xs font-semibold leading-relaxed text-slate-200">
              There are currently {exceptionsCount} items flagged in the Risk &amp;
              Exceptions Desk requiring Super Admin or HR Director review.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenExceptions}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white hover:bg-[#E95324]"
            >
              View Risk Desk
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("/approval-request")}
              className="h-10 rounded-xl bg-white/10 px-4 text-xs font-extrabold text-white hover:bg-white/20"
            >
              Review Approval Queue
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
