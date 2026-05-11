import { ChevronDown, X } from "lucide-react";
import React from "react";

const MultiSelectDropdown = ({
  refBox,
  label,
  required = false,
  values = [],
  placeholder,
  open,
  setOpen,
  disabled,
  options = [],
  onChange,
  onBeforeOpen,
  zIndex = "z-20",
}) => {
  const selectedOptions = options.filter((option) =>
    values.includes(option.value),
  );

  const handleToggleOption = (optionValue) => {
    if (values.includes(optionValue)) {
      onChange(values.filter((value) => value !== optionValue));
      return;
    }

    onChange([...values, optionValue]);
  };

  const handleRemoveOption = (optionValue, e) => {
    e.stopPropagation();
    onChange(values.filter((value) => value !== optionValue));
  };

  return (
    <div
      ref={refBox}
      className={`relative self-start ${open ? "z-[9999]" : zIndex}`}
    >
      <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => {
          if (disabled) return;

          if (!open) {
            onBeforeOpen?.();
          }

          setOpen((prev) => !prev);
        }}
        disabled={disabled}
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-sibs-tertiary-8 bg-white px-3 py-2 text-left text-sm outline-none transition focus:border-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {selectedOptions.length > 0 ? (
            <>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                Clear all
              </span>
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-sibs-primary-1 shadow-2xs"
                >
                  <span className="truncate">{option.label}</span>

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleRemoveOption(option.value, e)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-sibs-primary-1/70 transition hover:bg-sibs-primary-1 hover:text-white"
                  >
                    <X size={12} />
                  </span>
                </span>
              ))}
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-hidden rounded-xl border border-sibs-tertiary-8 bg-white shadow-2xl">
          <div className="max-h-72 overflow-y-auto py-2">
            {options.map((option) => {
              const isSelected = values.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggleOption(option.value)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                    isSelected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span>{option.label}</span>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                      isSelected
                        ? "border-sibs-primary-1 bg-sibs-primary-1 text-white"
                        : "border-sibs-tertiary-8 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
