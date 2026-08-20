import { AlertTriangle, ArrowRight, ChevronRight } from "lucide-react";

const OVERVIEW_CARD_TONES = {
  "Core HR Scope": "orange",
  "Talent Acquisition (TA)": "indigo",
  "Operations Management (OM)": "navy",
  "Finance & Payroll": "amber",
};

export default function SuperAdminOverview({
  cards,
  exceptionsCount,
  onNavigate,
  onOpenExceptions,
}) {
  return (
    <div className="space-y-4 2xl:space-y-5 font-jakarta">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-3.5">
        {cards.map((card, index) => {
          const tone = OVERVIEW_CARD_TONES[card.label] || "navy";
          return (
            <article
              key={card.label}
              className="group flex h-[104px] 2xl:h-[116px] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3 2xl:p-3.5 transition-all hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] shadow-2xs"
              style={{
                animationDelay: `${index * 55}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="min-w-0">
                <span
                  className={`block truncate sibs-text-micro font-extrabold uppercase tracking-wide sibs-tone-${tone}-label`}
                >
                  {card.label}
                </span>
                <h3 className="font-heading mt-1 2xl:mt-1.5 truncate text-base sm:text-lg 2xl:text-xl font-bold text-[#042C51] tracking-tight leading-tight">
                  {card.value}
                </h3>
                <p
                  title={card.details}
                  className="mt-0.5 line-clamp-1 truncate sibs-text-micro font-bold text-[#667085] leading-normal"
                >
                  {card.details}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(card.path)}
                className="inline-flex w-fit items-center gap-1 sibs-text-micro 2xl:sibs-text-xs font-extrabold text-[#FF5C28] transition-colors hover:text-[#042C51]"
              >
                {card.linkLabel}
                <ChevronRight size={12} className="shrink-0" />
              </button>
            </article>
          );
        })}
      </div>

      <section
        className="sibs-page-card-in font-jakarta rounded-xl 2xl:rounded-2xl bg-[#042C51] p-4 2xl:p-5 text-white shadow-sm"
        style={{ animationDelay: "240ms", animationFillMode: "both" }}
      >
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AlertTriangle size={15} className="text-[#FF5C28]" />
              <h3 className="font-heading sibs-text-xs 2xl:sibs-text-sm font-bold tracking-wide text-white">
                Super Admin Operational Focus Items
              </h3>
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 sibs-text-micro font-extrabold text-white">
                {exceptionsCount} Active Desk Exceptions
              </span>
            </div>
            <p className="mt-2 2xl:mt-2.5 max-w-5xl sibs-text-xs font-semibold leading-relaxed text-slate-200">
              There are currently {exceptionsCount} items flagged in the Risk &amp;
              Exceptions Desk requiring Super Admin or HR Director review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenExceptions}
              className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg 2xl:rounded-xl bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition-all hover:bg-[#EB3800] active:bg-[#FF8450] hover:shadow-sm"
            >
              View Risk Desk
              <ArrowRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("/approval-request")}
              className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center rounded-lg 2xl:rounded-xl border border-white/20 bg-white/10 px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition-all hover:bg-white/20"
            >
              Review Approval Queue
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


