import React from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { formatNumber } from "../../../lib/utils/actionItems/actionItemsHelpers.js";

const ICONS = {
  UsersRound,
  UserCheck,
  BriefcaseBusiness,
  Layers3,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
};

function ModuleInsightCard({ item, delay = 0 }) {
  const Icon = ICONS[item.iconKey] || BriefcaseBusiness;
  const hasRisk = Number(item.riskValue || 0) > 0;

  return (
    <div
      className="sibs-page-card-in group rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
            {item.module}
          </p>
          <p
            className={`mt-3 truncate text-3xl font-extrabold ${
              hasRisk ? "text-red-600" : "text-sibs-primary-1"
            }`}
          >
            {formatNumber(item.value)}
          </p>
          <p
            className={`mt-1 truncate text-xs font-semibold ${
              hasRisk ? "text-red-600" : "text-sibs-tertiary-5"
            }`}
          >
            {item.description}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
            hasRisk
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

export default function ActionItemsModuleSignals() {
  const { moduleInsightCards } = useActionItems();

  return (
    <section
      className="sibs-profile-tab-panel rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
      style={{ animationDelay: "240ms" }}
    >
      <h2 className="text-base font-bold text-[#101828]">
        Recruitment Module Signals
      </h2>
      <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
        Data-driven indicators pulled from the recruitment module local records.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {moduleInsightCards.map((item, index) => (
          <ModuleInsightCard
            key={item.module}
            item={item}
            delay={index * 60}
          />
        ))}
      </div>
    </section>
  );
}
