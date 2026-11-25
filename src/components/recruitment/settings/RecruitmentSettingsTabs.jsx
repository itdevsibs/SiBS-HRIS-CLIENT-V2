import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { RECRUITMENT_TABS } from "./recruitmentSettingsConstants";

function RecruitmentSettingsTabs({
  activeTab = "Overview",
  onTabChange,
}) {
  const activeTabRef = useRef(null);

  useEffect(() => {
    const activeNode = activeTabRef.current;
    if (activeNode && typeof activeNode.scrollIntoView === "function") {
      activeNode.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeTab]);

  return (
    <nav
      aria-label="Recruitment Settings"
      className="sibs-card overflow-hidden rounded-2xl border border-sibs-border bg-white p-1.5 shadow-xs font-jakarta"
    >
      <div className="sibs-no-scrollbar flex min-w-0 items-center gap-1.5 overflow-x-auto py-1 px-1">
        {RECRUITMENT_TABS.map((tab) => {
          const isActive =
            activeTab === tab.key ||
            (tab.key === "Application Screening Questionnaires" &&
              activeTab === "Application Questions Form");
          const Icon = tab.icon;
          const targetPath = tab.subpanel
            ? `/settings/recruitment/${tab.subpanel}`
            : "/settings/recruitment";

          return (
            <Link
              key={tab.key}
              ref={isActive ? activeTabRef : undefined}
              to={targetPath}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange?.(tab)}
              className={`relative inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border-b-2 px-3.5 text-xs font-bold transition-colors duration-150 ${
                isActive
                  ? "border-sibs-orange bg-sibs-navy text-white shadow-xs"
                  : "border-transparent bg-transparent text-sibs-secondary hover:bg-slate-100 hover:text-sibs-navy"
              }`}
            >
              <Icon
                size={14}
                strokeWidth={2.4}
                aria-hidden="true"
                className={isActive ? "text-sibs-orange" : "text-sibs-muted"}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(RecruitmentSettingsTabs);
