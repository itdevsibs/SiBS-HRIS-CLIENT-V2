import { createElement } from "react";
import {
  Activity,
  AlertTriangle,
  FileText,
  Layers,
  ShieldCheck,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview & Telemetry", icon: Activity },
  { id: "exceptions", label: "Risk & Exceptions Desk", icon: AlertTriangle },
  { id: "access_roles", label: "Access & Roles Governance", icon: ShieldCheck },
  { id: "snapshot", label: "Cross-Module Snapshot", icon: Layers },
  { id: "activity", label: "System & Module Activity", icon: FileText },
];

export default function SuperAdminTabs({ activeTab, onChange, counts }) {
  return (
    <div
      role="tablist"
      aria-label="Super Admin dashboard sections"
      className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-2.5 pt-2 sm:px-3 sm:pt-2.5 2xl:px-4 2xl:pt-3 sibs-scrollbar font-jakarta"
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        const count = counts?.[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-9 2xl:h-10 shrink-0 items-center gap-1.5 2xl:gap-2 border-b-2 px-3 sm:px-3.5 2xl:px-4.5 sibs-text-micro font-extrabold uppercase tracking-wide transition-all ${
              active
                ? "rounded-t-lg 2xl:rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                : "border-transparent text-[#667085] hover:text-[#042C51]"
            }`}
          >
            {createElement(tab.icon, {
              size: 13,
              className: active ? "text-[#FF5C28]" : "text-[#98A2B3]",
            })}
            <span>{tab.label}</span>
            {Number.isFinite(Number(count)) ? (
              <span
                className={`rounded-full px-1.5 py-0.5 sibs-text-micro font-extrabold tabular-nums ${
                  active
                    ? "bg-[#042C51] text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {Number(count)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

