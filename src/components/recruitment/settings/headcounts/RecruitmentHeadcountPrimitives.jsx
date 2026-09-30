import React from "react";
import SelectDropdown from "@/components/ui/SelectDropdown";
import { getStatusClass } from "../../../../lib/utils/recruitmentSettings/recruitmentHeadcountHelpers";

export function StatusPill({ status, fallback = "Pending" }) {
  const displayStatus = status || fallback;

  return (
    <span
      className={`inline-flex min-w-[78px] items-center justify-center rounded-full border px-2.5 py-0.5 text-[9.5px] 2xl:text-[10px] font-extrabold uppercase tracking-wide ${getStatusClass(
        displayStatus,
      )}`}
    >
      {displayStatus}
    </span>
  );
}

export function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  zIndex = "z-30",
  disabled = false,
  loading = false,
}) {
  return (
    <div className={`relative ${zIndex}`}>
      <SelectDropdown
        label={label}
        value={value}
        options={options}
        placeholder={loading ? "Loading..." : placeholder}
        disabled={disabled || loading}
        clearable={false}
        searchable={options.length > 6}
        onChange={(nextVal) => {
          const selectedOption = options.find((opt) => String(opt.value) === String(nextVal));
          onChange?.(nextVal, selectedOption);
        }}
      />
    </div>
  );
}

export function RecruitmentHeadcountMobileMetric({
  label,
  value,
  valueClassName = "text-sibs-navy",
}) {
  return (
    <div className="rounded-xl border border-sibs-border bg-sibs-surface p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
        {label}
      </p>

      <div className={`mt-1 text-xs font-extrabold ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}
