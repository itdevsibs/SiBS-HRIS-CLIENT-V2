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
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {cards.map((card, index) => (
        <article
          key={card.title}
          className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-5"
          style={{ animationDelay: `${index * 55}ms` }}
        >
          <div className="flex items-center justify-between border-b border-[#EEF2F6] pb-3">
            <h3 className="sibs-section-title flex items-center gap-2">
              {createElement(ICONS[card.iconKey] || Users, {
                size: 16,
                className: "text-[#FF5C28]",
              })}
              {card.title}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate(card.path)}
              className="text-[10px] font-extrabold text-[#FF5C28] hover:underline"
            >
              Open Module →
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {card.metrics.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#F8FAFC] p-3">
                <span className="block text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
                  {label}
                </span>
                <strong className="mt-1 block text-sm font-extrabold text-[#042C51]">
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
