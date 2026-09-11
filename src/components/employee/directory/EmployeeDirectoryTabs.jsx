import React from "react";
import { UserRoundCheck } from "lucide-react";
import StatusFilterTabs from "@/components/recruitment/StatusFilterTabs";

export default function EmployeeDirectoryTabs({ tabs, activeTab, onTabChange }) {
  if (!Array.isArray(tabs) || tabs.length === 0) return null;

  return (
    <StatusFilterTabs
      tabs={tabs.map((tab) => ({
        key: tab.label,
        label: tab.label === "CHWCP" ? "CHWCP Requests" : tab.label,
        icon: tab.icon || UserRoundCheck,
        count: Number(tab.count || 0) > 0 ? tab.count : null,
      }))}
      activeValue={activeTab}
      onChange={onTabChange}
      layoutId="employeeDirectoryTabIndicator"
    />
  );
}
