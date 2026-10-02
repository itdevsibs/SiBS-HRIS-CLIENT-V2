import React from "react";
import { Search, X } from "lucide-react";

export default function SearchInput({
  value = "",
  onChange,
  onClear,
  placeholder = "Search...",
  label = null,
  hideLabel = false,
  labelClassName = "",
  disabled = false,
  className = "",
  inputClassName = "",
  inputRef = null,
  ariaLabel,
  "aria-label": ariaLabelProp,
  ...props
}) {
  const handleChange = (e) => {
    onChange?.(e.target.value, e);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange?.("", null);
    }
  };

  const hasValue = Boolean(value && String(value).trim().length > 0);

  return (
    <div className={`w-full font-jakarta ${className}`.trim()}>
      {label && !hideLabel && (
        <label
          className={`mb-1 block font-jakarta ${
            labelClassName || "sibs-text-xs font-bold text-sibs-navy"
          }`}
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3 text-sibs-muted pointer-events-none shrink-0"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabelProp || ariaLabel || label || placeholder}
          className={`sibs-dashboard-input h-8.5 2xl:h-10 w-full rounded-[10px] pl-9 pr-8 text-xs font-semibold text-sibs-navy placeholder:text-sibs-faint transition disabled:cursor-not-allowed disabled:opacity-50 ${inputClassName}`.trim()}
          {...props}
        />

        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-sibs-muted hover:bg-sibs-surface hover:text-sibs-orange transition"
            aria-label="Clear search input"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
