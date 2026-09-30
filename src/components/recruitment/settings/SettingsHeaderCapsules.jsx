import React from "react";

export default function SettingsHeaderCapsules({ items = [], className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-0.5 text-[9.5px] 2xl:text-[10px] font-extrabold uppercase tracking-wide text-sibs-navy"
        >
          {Icon ? <Icon size={13} className="shrink-0 text-sibs-orange" /> : null}
          {label}
        </span>
      ))}
    </div>
  );
}
