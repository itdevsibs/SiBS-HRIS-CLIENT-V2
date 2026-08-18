import React from "react";

export default function SettingsHeaderCapsules({ items = [], className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 rounded-full border border-[#D9E9F8] bg-[#F2F7FC] px-3 py-1 text-[10px] font-extrabold uppercase tracking-normal text-sibs-primary-1"
        >
          {Icon ? <Icon size={14} className="shrink-0 text-[#FF5C28]" /> : null}
          {label}
        </span>
      ))}
    </div>
  );
}
