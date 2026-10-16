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
        <label className="mb-1 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
          {label} {required && <span className="text-sibs-orange">*</span>}
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
          className="flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-lg 2xl:rounded-xl border border-sibs-border-subtle bg-sibs-canvas px-3 text-left sibs-text-xs font-semibold text-sibs-navy outline-none transition hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={value ? "text-sibs-navy truncate" : "text-slate-400 truncate"}>
            {loading ? loadingText : value || placeholder}
          </span>

          <ChevronDown
            className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 text-sibs-navy transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && !disabled && !loading && (
          <div className="absolute left-0 right-0 top-full z-[9999] mt-1.5 max-h-56 overflow-hidden rounded-xl border border-sibs-border-subtle bg-white shadow-2xl sibs-scrollbar">
            <div className="max-h-56 overflow-y-auto py-1">
              {options.length > 0 ? (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value, option)}
                    className={`block w-full px-3 py-1.5 2xl:py-2 text-left sibs-text-xs transition ${
                      String(selectedValue || "") === String(option.value)
                        ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                        : "text-sibs-navy hover:bg-sibs-canvas"
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400">
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
