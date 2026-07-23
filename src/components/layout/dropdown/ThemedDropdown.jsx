import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  getThemedDropdownOptionLabel,
  getThemedDropdownOptionValue,
} from "./themedDropdownUtils";

const labelClass =
  "mb-1.5 flex items-center justify-between gap-3 text-xs font-extrabold text-sibs-primary-1";

const inputClass =
  "h-10 w-full rounded-[10px] border border-sibs-tertiary-8 bg-[#F8FAFC] px-3 text-xs font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 disabled:cursor-not-allowed disabled:bg-[#EEF2F6] disabled:text-sibs-primary-1";

function AnimatedDropdown({ open, children }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full z-[9999] mt-2 grid transition-all duration-200 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-1 scale-[0.99]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ThemedDropdown({
  label,
  helper,
  required = false,
  value,
  options = [],
  placeholder = "Select...",
  disabled = false,
  searchable = true,
  showPlaceholderOption = false,
  emptyText = "No options found.",
  className = "",
  zIndex = "z-[60]",
  onBeforeOpen,
  onChange,
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLabel = useMemo(() => {
    const selectedOption = options.find(
      (option) =>
        String(getThemedDropdownOptionValue(option)) === String(value || ""),
    );

    return getThemedDropdownOptionLabel(selectedOption) || "";
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!searchable || !keyword) return options;

    return options.filter((option) =>
      getThemedDropdownOptionLabel(option).toLowerCase().includes(keyword),
    );
  }, [options, search, searchable]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function openDropdown() {
    onBeforeOpen?.();
    setOpen(true);
  }

  function toggleDropdown() {
    if (open) {
      setOpen(false);
      setSearch("");
      return;
    }

    openDropdown();
  }

  function selectValue(nextValue, option) {
    onChange?.(nextValue, option);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={dropdownRef} className={`relative block min-w-0 ${zIndex} ${className}`}>
      {label ? (
        <span className={labelClass}>
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {helper ? (
            <span className="text-[10px] font-extrabold text-sibs-tertiary-5">
              {helper}
            </span>
          ) : null}
        </span>
      ) : null}

      <div className="group relative">
        {searchable ? (
          <input
            type="text"
            value={open ? search : selectedLabel}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            onFocus={openDropdown}
            onChange={(event) => {
              setSearch(event.target.value);
              openDropdown();
            }}
            className={`${inputClass} pr-10`}
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={toggleDropdown}
            className={`${inputClass} flex items-center justify-between pr-10 text-left`}
            aria-expanded={open}
          >
            <span
              className={`block min-w-0 truncate ${
                selectedLabel ? "" : "text-sibs-tertiary-5"
              }`}
            >
              {selectedLabel || placeholder}
            </span>
          </button>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Toggle ${label || "dropdown"}`}
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatedDropdown open={open && !disabled}>
          <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
            {showPlaceholderOption && placeholder ? (
              <button
                type="button"
                onClick={() => selectValue("", null)}
                className={`block w-full px-4 py-2.5 text-left text-xs transition ${
                  !value
                    ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                    : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                }`}
              >
                <span className="block truncate">{placeholder}</span>
              </button>
            ) : null}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = String(
                  getThemedDropdownOptionValue(option) || "",
                );
                const optionLabel = getThemedDropdownOptionLabel(option);
                const checked = String(value || "") === optionValue;

                return (
                  <button
                    key={`${optionValue || optionLabel}-${index}`}
                    type="button"
                    onClick={() => selectValue(optionValue, option)}
                    className={`block w-full px-4 py-2.5 text-left text-xs transition ${
                      checked
                        ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                        : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                    }`}
                  >
                    <span className="block truncate">{optionLabel}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-xs font-semibold text-[#667085]">
                {emptyText}
              </div>
            )}
          </div>
        </AnimatedDropdown>
      </div>
    </div>
  );
}
