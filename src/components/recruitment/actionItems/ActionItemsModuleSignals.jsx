import React from "react";
import { BarChart3, BriefcaseBusiness, CheckCircle2, Layers3, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { formatNumber } from "../../../lib/utils/actionItems/actionItemsHelpers.js";

const ICONS = { UsersRound, UserCheck, BriefcaseBusiness, Layers3, ShieldCheck, CheckCircle2, BarChart3 };

function ModuleSignalRow({ item, delay = 0 }) {
  const Icon = ICONS[item.iconKey] || BriefcaseBusiness;
  const hasRisk = Number(item.riskValue || 0) > 0;

  return (
    <div className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF5C28]/30 hover:bg-white hover:shadow-sm" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${hasRisk ? "bg-rose-50 text-rose-600" : "bg-[#E9F0FC] text-[#042C51]"}`}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-[10px] font-black uppercase tracking-wider text-[#667085]">{item.module}</p>
            <p className={`shrink-0 text-base font-black ${hasRisk ? "text-rose-600" : "text-[#042C51]"}`}>{formatNumber(item.value)}</p>
          </div>
          <p className={`mt-1 text-[11px] font-semibold leading-5 ${hasRisk ? "text-rose-700" : "text-[#475467]"}`}>{item.description}</p>
          {item.suggestedAction ? (
            <p className="mt-2 border-t border-[#E6ECF2] pt-2 text-[10px] font-medium leading-4 text-[#667085]">{item.suggestedAction}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ActionItemsModuleSignals() {
  const { moduleInsightCards } = useActionItems();

  return (
    <section className="sibs-profile-tab-panel flex flex-col rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm lg:col-span-4" style={{ animationDelay: "240ms" }}>
      <div>
        <h2 className="text-xs font-black uppercase tracking-wider text-[#042C51]">Data-Driven Module Signals</h2>
        <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">Auto-detected recruitment indicators from current module records.</p>
      </div>
      <div className="mt-4 space-y-3">
        {moduleInsightCards.map((item, index) => <ModuleSignalRow key={item.module} item={item} delay={index * 60} />)}
        {moduleInsightCards.length === 0 ? <div className="sibs-empty-panel">No module signals available.</div> : null}
      </div>
    </section>
  );
}
