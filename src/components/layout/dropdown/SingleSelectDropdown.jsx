import { ChevronDown } from "lucide-react";
import React from "react";

const SingleSelectDropdown = ({
  refBox,
  label,
  required = false,
  value,
  placeholder,
  open,
  setOpen,
  disabled,
  options = [],
  selectedValue,
  onSelect,
  onBeforeOpen,
  zIndex = "z-20",
  loading = false,
  loadingText = "Loading...",
  emptyText = "No options found.",
}) => {
  return (
    <div ref={refBox} className={`relative self-start ${zIndex} font-jakarta`}>
      {label && (
        <label className="mb-1 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
          {label} {required && <span className="text-[#FF5C28]">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (disabled || loading) return;

            if (!open) {
              onBeforeOpen?.();
            }

            setOpen((prev) => !prev);
          }}
          disabled={disabled || loading}
          className="flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-lg 2xl:rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-3 text-left sibs-text-xs font-semibold text-[#042C51] outline-none transition hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={value ? "text-[#042C51] truncate" : "text-[#98A2B3] truncate"}>
            {loading ? loadingText : value || placeholder}
          </span>

          <ChevronDown
            className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 text-[#042C51] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && !disabled && !loading && (
          <div className="absolute left-0 right-0 top-full z-[9999] mt-1.5 max-h-56 overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-2xl sibs-scrollbar">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.length > 0 ? (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value, option)}
                    className={`block w-full px-3 py-1.5 2xl:py-2 text-left sibs-text-xs transition ${
                      String(selectedValue || "") === String(option.value)
                        ? "bg-[#FFF7F3] font-extrabold text-[#FF5C28]"
                        : "text-[#042C51] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs font-semibold text-[#98A2B3]">
                  {emptyText}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleSelectDropdown;
