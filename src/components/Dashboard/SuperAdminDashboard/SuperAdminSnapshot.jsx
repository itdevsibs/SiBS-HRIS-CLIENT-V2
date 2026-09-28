import { createElement } from "react";
import { Briefcase, Building2, DollarSign, Users } from "lucide-react";

const ICONS = {
  employees: Users,
  recruitment: Briefcase,
  operations: Building2,
  finance: DollarSign,
};

export default function SuperAdminSnapshot({ cards, onNavigate }) {
  return (
    <div className="grid grid-cols-1 gap-4 2xl:gap-5 md:grid-cols-2 font-jakarta">
      {cards.map((card, index) => (
        <article
          key={card.title}
          className="sibs-page-card-in rounded-xl border border-sibs-border bg-white p-4 2xl:p-5 shadow-xs transition-all hover:border-sibs-orange/40 hover:shadow-sm"
          style={{
            animationDelay: `${index * 55}ms`,
            animationFillMode: "both",
          }}
        >
          <div className="flex items-center justify-between border-b border-sibs-border pb-2.5 2xl:pb-3">
            <h3 className="font-heading text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight flex items-center gap-1.5 2xl:gap-2">
              {createElement(ICONS[card.iconKey] || Users, {
                size: 15,
                className: "text-sibs-orange",
              })}
              {card.title}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate(card.path)}
              className="sibs-text-xs font-extrabold text-sibs-orange transition-colors hover:text-sibs-navy"
            >
              Open Module →
            </button>
          </div>

          <div className="mt-3 2xl:mt-4 grid grid-cols-2 gap-2.5 2xl:gap-3">
            {card.metrics.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 border border-sibs-border p-2.5 2xl:p-3">
                <span className="block sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-faint">
                  {label}
                </span>
                <strong className="mt-0.5 2xl:mt-1 block text-xs 2xl:text-sm font-extrabold text-sibs-navy">
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

