import {
  AlertTriangle,
  Archive,
  ClipboardList,
  UsersRound,
  UserRoundPlus,
  UserRoundX,
} from "lucide-react";
import StatusFilterTabs from "../StatusFilterTabs";
import { TALENT_POOL_TABS } from "../../../lib/utils/talentPool/talentPoolTabs";

const tabs = [
  { key: TALENT_POOL_TABS.ALL, label: "All", icon: UsersRound },
  { key: TALENT_POOL_TABS.NEW_APPLICANT, label: "New Applicant", icon: UserRoundPlus },
  { key: TALENT_POOL_TABS.APPLICANT_PIPELINE, label: "Applicant Pipeline", icon: ClipboardList },
  { key: TALENT_POOL_TABS.BELOW_18, label: "Below 18", icon: UserRoundX },
  { key: TALENT_POOL_TABS.INCOMPLETE_REQUIREMENTS, label: "Incomplete Requirements", icon: ClipboardList },
  { key: TALENT_POOL_TABS.DROP_OFF, label: "Drop Off List", icon: AlertTriangle },
  { key: TALENT_POOL_TABS.LEADS_CONVERTED, label: "Leads Converted", icon: Archive },
];

export default function TalentPoolTabs({ activeTab, onChange, counts = {} }) {
  return (
    <StatusFilterTabs
      tabs={tabs}
      activeValue={activeTab}
      counts={counts}
      onChange={onChange}
      showAllCounts
      layoutId="talentPoolTabIndicator"
    />
  );
}
