import React from "react";

const SlidingTabs = ({ tabs, activeTab, onChange }) => {
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === activeTab),
  );

  return (
    <div
      className="relative inline-grid overflow-hidden rounded-full bg-white shadow-xs"
      style={{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
      }}
    >
      <div
        className="absolute bottom-0 top-0 rounded-full bg-sibs-primary-1 shadow-sm transition-all duration-300 ease-in-out"
        style={{
          width: `calc(100% / ${tabs.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`relative z-10 inline-flex min-w-[130px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold transition-colors duration-300 ${
              isActive ? "text-white" : "text-sibs-primary-1"
            }`}
          >
            <span>{tab.label}</span>

            {tab.count !== undefined && tab.count !== null && (
              <span
                className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                  isActive
                    ? "bg-white text-sibs-primary-1"
                    : "bg-sibs-primary-1 text-white"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SlidingTabs;
