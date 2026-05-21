import React from "react";

function DashboardMetric({
  label,
  value,
  icon: Icon,
  description,
  valueClassName = "text-sibs-primary-1",
  active = false,
  onClick,
}) {
  const isClickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`h-[126px] w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
        active
          ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
          : "border-[#E6ECF2]"
      } ${
        isClickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-sibs-primary-1/30 hover:shadow-md"
          : "cursor-default"
      }`}
    >
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate whitespace-nowrap text-xs font-bold uppercase leading-none tracking-wide text-sibs-tertiary-5">
            {label}
          </p>

          <p
            className={`mt-4 truncate text-3xl font-extrabold leading-none ${valueClassName}`}
          >
            {value ?? 0}
          </p>

          {description && (
            <p className="mt-2 truncate whitespace-nowrap text-xs font-semibold leading-none text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>

        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
            <Icon size={22} />
          </div>
        )}
      </div>
    </button>
  );
}

export default DashboardMetric;
