import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  getThemedDropdownOptionLabel,
  getThemedDropdownOptionValue,
} from "./themedDropdownUtils";

const labelClass =
  "mb-1.5 flex items-center justify-between gap-3 text-xs font-extrabold text-sibs-primary-1";

const inputClass =
  "h-10 w-full rounded-[10px] border px-3 font-jakarta text-xs font-bold text-sibs-navy outline-none transition placeholder:text-sibs-muted disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-sibs-muted";

function AnimatedDropdown({ open, children }) {
  return (
    <div
      className={`sibs-animated-dropdown absolute left-0 right-0 top-full z-[9999] mt-2 ${
        open ? "open" : "closed"
      }`}
    >
      <div className="sibs-animated-dropdown-inner">
        <div className="sibs-animated-dropdown-box overflow-hidden rounded-[10px] border border-sibs-border bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
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
            className={`${inputClass} pr-10 ${open ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10" : "border-sibs-border bg-sibs-surface hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10"}`}
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={toggleDropdown}
            className={`${inputClass} flex items-center justify-between pr-10 text-left ${open ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10" : "border-sibs-border bg-sibs-surface hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-4 focus:ring-sibs-orange/10"}`}
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
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-sibs-text-muted transition hover:bg-sibs-cream-subtle hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Toggle ${label || "dropdown"}`}
        >
          <ChevronDown
            size={17}
            className={`shrink-0 text-sibs-muted transition-transform duration-300 ${
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
                    ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                    : "font-semibold text-sibs-text-secondary hover:bg-sibs-cream-subtle hover:text-sibs-orange"
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
                        ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                        : "font-semibold text-sibs-text-secondary hover:bg-sibs-cream-subtle hover:text-sibs-orange"
                    }`}
                  >
                    <span className="block truncate">{optionLabel}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-4 text-xs font-semibold text-sibs-text-muted">
                {emptyText}
              </div>
            )}
          </div>
        </AnimatedDropdown>
      </div>
    </div>
  );
}
