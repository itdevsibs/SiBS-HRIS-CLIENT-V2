import React from "react";

export default function SettingsMetric({
  label,
  value,
  description,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="h-[126px] rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate whitespace-nowrap text-xs font-bold uppercase leading-none tracking-wide text-sibs-tertiary-5">
            {label}
          </p>

          <p
            className={`mt-4 truncate text-3xl font-extrabold leading-none ${valueClassName}`}
          >
            {value}
          </p>

          <p className="mt-2 truncate whitespace-nowrap text-xs font-semibold leading-none text-sibs-tertiary-5">
            {description}
          </p>
        </div>

        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
