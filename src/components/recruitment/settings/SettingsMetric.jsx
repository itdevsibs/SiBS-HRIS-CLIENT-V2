import React from "react";

export default function SettingsMetric({
  label,
  value,
  description,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="sibs-card h-[126px] p-5 font-jakarta">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate whitespace-nowrap text-xs font-bold uppercase leading-none tracking-wide text-sibs-grey-4">
            {label}
          </p>

          <p
            className={`mt-4 truncate text-3xl font-extrabold leading-none ${valueClassName}`}
          >
            {value}
          </p>

          <p className="mt-2 truncate whitespace-nowrap text-xs font-semibold leading-none text-sibs-grey-4">
            {description}
          </p>
        </div>

        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sibs-surface text-sibs-primary-1">
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
