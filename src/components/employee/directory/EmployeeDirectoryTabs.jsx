export default function EmployeeDirectoryTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="overflow-hidden rounded-t-xl border border-b-0 border-[#E6ECF2] bg-white">
      <div className="flex overflow-x-auto border-b border-[#E6ECF2] bg-[#F8FAFC] px-3 pt-3 no-scrollbar sm:px-4">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.label;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onTabChange(tab.label)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-4 text-[10px] font-extrabold uppercase tracking-wide transition ${
                isActive
                  ? "rounded-t-xl border-[#FF5C28] bg-white text-[#042C51]"
                  : "border-transparent text-[#667085] hover:text-[#042C51]"
              }`}
            >
              <TabIcon size={15} className="shrink-0" />
              <span className="truncate">{tab.label}</span>

              {tab.count > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tabular-nums ${
                    isActive
                      ? "bg-[#042C51] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
