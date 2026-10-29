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
          className={`flex h-8.5 2xl:h-10 w-full items-center justify-between rounded-[10px] border px-3 text-left sibs-text-xs font-bold outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
            open
              ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10 text-sibs-navy"
              : "border-sibs-border bg-sibs-surface text-sibs-navy hover:border-sibs-orange/40 hover:bg-white"
          }`}
        >
          <span className={value ? "text-sibs-navy truncate" : "text-slate-400 truncate"}>
            {loading ? loadingText : value || placeholder}
          </span>

          <ChevronDown
            size={17}
            className={`shrink-0 text-sibs-muted transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`sibs-animated-dropdown absolute left-0 right-0 top-full z-[9999] mt-1.5 ${
            open && !disabled && !loading ? "open" : "closed"
          }`}
        >
          <div className="sibs-animated-dropdown-inner">
            <div className="sibs-animated-dropdown-box overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
              <div className="max-h-56 overflow-y-auto py-2 sibs-scrollbar">
                {options.length > 0 ? (
                  options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onSelect(option.value, option)}
                      className={`block w-full px-3 py-2 2xl:px-4 2xl:py-2.5 text-left sibs-text-xs transition ${
                        String(selectedValue || "") === String(option.value)
                          ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                          : "font-semibold text-sibs-text-secondary hover:bg-sibs-cream-subtle hover:text-sibs-orange"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSelectDropdown;
