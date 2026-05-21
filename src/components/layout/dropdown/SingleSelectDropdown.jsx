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
  options,
  selectedValue,
  onSelect,
  onBeforeOpen,
  zIndex = "z-20",
}) => {
  return (
    <div ref={refBox} className={`relative self-start ${zIndex}`}>
      <label className="mb-1 block text-sm font-medium text-sibs-primary-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
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
          className="flex w-full items-center justify-between rounded-xl border
           border-sibs-tertiary-8 bg-white px-4 py-3 text-left text-sm outline-none 
           transition focus:border-sibs-primary-1 disabled:cursor-not-allowed 
           disabled:opacity-60"
        >
          <span className={value ? "text-sibs-primary-1" : "text-gray-400"}>
            {value || placeholder}
          </span>

          <ChevronDown
            size={18}
            className={`text-sibs-tertiary-5 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-hidden
           rounded-xl border border-sibs-tertiary-8 bg-white shadow-2xl"
          >
            <div className="max-h-60 overflow-y-auto py-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`block w-full px-4 py-3 text-left text-sm transition ${
                    String(selectedValue || "") === String(option.value)
                      ? "bg-[#EAF2FB] font-medium text-sibs-primary-1"
                      : "text-sibs-primary-1 hover:bg-[#F8FAFC]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleSelectDropdown;
