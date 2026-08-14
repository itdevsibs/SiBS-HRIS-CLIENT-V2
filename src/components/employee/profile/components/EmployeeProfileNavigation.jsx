import { PROFILE_TABS } from "../../../../lib/utils/employees/employeeProfileSchemas.js";
import { getActivePrimaryKey } from "../../../../lib/utils/employees/employeeProfileHelpers.js";

export default function EmployeeProfileNavigation({
  activeTab,
  onTabChange,
  tabs = PROFILE_TABS,
}) {
  const activePrimaryKey = getActivePrimaryKey(activeTab);
  const activePrimary = tabs.find((tab) => tab.key === activePrimaryKey);
  const secondaryTabs = activePrimary?.children || [];

  function handlePrimaryClick(tab) {
    const nextKey = tab.children?.[0]?.key || tab.key;
    onTabChange(nextKey);
  }

  return (
    <nav className="sibs-card p-2 2xl:p-2.5" aria-label="Employee profile navigation">
      <div className="flex min-w-0 items-center gap-1 2xl:gap-1.5 overflow-x-auto pb-1 2xl:pb-1.5 sibs-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activePrimaryKey;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handlePrimaryClick(tab)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-8 2xl:h-9 min-w-max items-center justify-center gap-1.5 rounded-lg border px-2.5 2xl:px-3.5 text-[11px] 2xl:text-xs font-bold transition-all ${
                active
                  ? "border-[#BFD3F2] bg-[#E9F0FC] text-[#042C51] shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                size={13}
                className={`2xl:h-[14px] 2xl:w-[14px] ${active ? "text-[#FF5C28]" : "text-slate-400"}`}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {secondaryTabs.length > 0 ? (
        <div className="mt-1.5 2xl:mt-2 flex items-center gap-1.5 overflow-x-auto border-t border-[#F1F5F9] pt-1.5 2xl:pt-2 pb-0.5 sibs-scrollbar">
          <span className="shrink-0 px-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
            Subsections:
          </span>

          {secondaryTabs.map((child) => {
            const active = child.key === activeTab;

            return (
              <button
                key={child.key}
                type="button"
                onClick={() => onTabChange(child.key)}
                aria-selected={active}
                className={`h-6 2xl:h-7 min-w-max rounded-full px-2.5 2xl:px-3 text-[9.5px] 2xl:text-[10px] font-bold transition-all ${
                  active
                    ? "bg-[#042C51] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}