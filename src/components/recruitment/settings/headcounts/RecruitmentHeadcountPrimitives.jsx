import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { getStatusClass } from "../../../../lib/utils/recruitmentSettings/recruitmentHeadcountHelpers";
export function StatusPill({ status, fallback = "Pending" }) {
  const displayStatus = status || fallback;

  return (
    <span
      className={`inline-flex min-w-[82px] items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(
        displayStatus,
      )}`}
    >
      {displayStatus}
    </span>
  );
}

export function inputClass(extra = "") {
  return `h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-xs font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 ${extra}`;
}

export function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) || null;

  const displayValue = loading
    ? "Loading..."
    : selectedOption?.label || placeholder;

  useEffect(() => {
    if (disabled || loading) {
      setOpen(false);
    }
  }, [disabled, loading]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${zIndex}`}>
      <label className="mb-1 block text-xs font-bold text-[#101828]">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((prev) => !prev);
        }}
        className="flex h-10 w-full items-center justify-between rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-left text-xs font-bold text-[#344054] outline-none transition-all duration-200 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className="truncate">{displayValue}</span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatedDropdown open={open}>
        <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
          {options.length > 0 ? (
            options.map((option) => {
              const selected = String(value) === String(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value, option);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-xs transition ${
                    selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-xs font-bold text-sibs-tertiary-5">
              No options available.
            </div>
          )}
        </div>
      </AnimatedDropdown>
    </div>
  );
}


export function RecruitmentHeadcountMobileMetric({
  label,
  value,
  valueClassName = "text-sibs-primary-1",
}) {
  return (
    <div className="rounded-xl bg-[#F8FAFC] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      <div className={`mt-1 text-xs font-extrabold ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}


