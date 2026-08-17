import {
  AlertTriangle,
  ClipboardList,
  UsersRound,
  UserRoundPlus,
  UserRoundX,
} from "lucide-react";
import { TALENT_POOL_TABS } from "../../../lib/utils/talentPool/talentPoolTabs";

const tabs = [
  { key: TALENT_POOL_TABS.ALL, label: "All", icon: UsersRound },
  { key: TALENT_POOL_TABS.NEW_APPLICANT, label: "New Applicant", icon: UserRoundPlus },
  { key: TALENT_POOL_TABS.APPLICANT_PIPELINE, label: "Applicant Pipeline", icon: ClipboardList },
  { key: TALENT_POOL_TABS.BELOW_18, label: "Below 18", icon: UserRoundX },
  { key: TALENT_POOL_TABS.INCOMPLETE_REQUIREMENTS, label: "Incomplete Requirements", icon: ClipboardList },
  { key: TALENT_POOL_TABS.DROP_OFF, label: "Drop Off List", icon: AlertTriangle },
];

export default function TalentPoolTabs({ activeTab, onChange, counts = {} }) {
  return (
    <div className="overflow-x-auto border-b border-[#E6ECF2] bg-white px-4 sm:px-5">
      <div className="flex min-w-max items-end gap-1" role="tablist" aria-label="Talent Pool candidate groups">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange?.(tab.key)}
              className={`relative inline-flex h-12 items-center gap-2 px-3 text-[11px] font-extrabold uppercase tracking-normal transition ${active ? "text-sibs-primary-1" : "text-[#7B87A3] hover:text-sibs-primary-1"}`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              <span className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${active ? "bg-sibs-primary-1 text-white" : "bg-[#E9EEF5] text-[#667085]"}`}>
                {counts[tab.key] ?? 0}
              </span>
              {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FF5C28]" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
