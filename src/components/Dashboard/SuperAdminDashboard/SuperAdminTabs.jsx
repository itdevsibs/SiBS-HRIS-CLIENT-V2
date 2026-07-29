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
      className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 no-scrollbar sm:px-4"
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
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition sm:px-5 ${
              active
                ? "rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                : "border-transparent text-[#667085] hover:text-[#042C51]"
            }`}
          >
            {createElement(tab.icon, {
              size: 15,
              className: "text-[#FF5C28]",
            })}
            {tab.label}
            {Number.isFinite(Number(count)) ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] ${
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
