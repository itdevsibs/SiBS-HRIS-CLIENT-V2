import {
  AlertTriangle,
  ClipboardList,
  UsersRound,
  UserRoundPlus,
  UserRoundX,
} from "lucide-react";
import { motion as Motion } from "framer-motion";
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
    <div className="mb-0 overflow-hidden rounded-t-xl border border-b-0 border-[#E6ECF2] bg-white">
      <div
        className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-2.5 sibs-no-scrollbar sm:px-4"
        role="tablist"
        aria-label="Talent Pool candidate groups"
      >
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
              className={`relative inline-flex h-8.5 2xl:h-9 shrink-0 items-center gap-2 px-3.5 2xl:px-4 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                active
                  ? "rounded-t-xl bg-white text-[#042C51]"
                  : "text-[#667085] hover:text-[#042C51]"
              }`}
            >
              <Icon
                size={14}
                className={`shrink-0 ${active ? "text-[#FF5C28]" : "text-[#98A2B3]"}`}
              />
              <span className="truncate">{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums transition-colors ${
                  active
                    ? "bg-[#042C51] text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {counts[tab.key] ?? 0}
              </span>
              {active ? (
                <Motion.div
                  layoutId="talentPoolTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5C28]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
