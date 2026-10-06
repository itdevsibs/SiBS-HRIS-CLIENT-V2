import React, { useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import DropdownPortal from "./DropdownPortal.jsx";

function cleanText(value) {
  return String(value ?? "").trim();
}

export default function SelectDropdown({
  label,
  hideLabel = false,
  labelClassName = "",
  value,
  options = [],
  onChange,
  placeholder = "Choose option",
  disabled = false,
  required = false,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No matching options.",
  clearable = true,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  multiple = false,
  optionValue = (opt) =>
    typeof opt === "object" && opt !== null ? opt.value : opt,
  optionLabel = (opt) =>
    typeof opt === "object" && opt !== null ? (opt.label ?? opt.value) : opt,
  optionDescription = (opt) =>
    typeof opt === "object" && opt !== null ? opt.description : null,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const anchorRef = useRef(null);
  const searchInputRef = useRef(null);

  const normalizedOptions = useMemo(
    () =>
      options.map((option) => ({
        raw: option,
        value: String(optionValue(option) ?? ""),
        label: String(optionLabel(option) ?? ""),
        description: optionDescription(option),
        disabled: Boolean(option?.disabled),
      })),
    [options, optionValue, optionLabel, optionDescription],
  );

  const selectedValues = useMemo(() => {
    if (!multiple) return [];
    if (Array.isArray(value)) return value.map((item) => String(item ?? ""));
    return value ? [String(value)] : [];
  }, [multiple, value]);

  const selectedOption = useMemo(() => {
    if (multiple) return null;
    return normalizedOptions.find(
      (option) => String(option.value) === String(value ?? ""),
    );
  }, [multiple, normalizedOptions, value]);

  const displayLabel = useMemo(() => {
    if (multiple) {
      if (selectedValues.length === 0) return "";
      if (selectedValues.length === 1) {
        const selected = normalizedOptions.find(
          (option) => option.value === selectedValues[0],
        );
        return selected?.label || selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    }

    return selectedOption?.label || (value ? String(value) : "");
  }, [multiple, normalizedOptions, selectedOption, selectedValues, value]);

  const filteredOptions = useMemo(() => {
    const query = cleanText(searchQuery).toLowerCase();
    if (!searchable || !query) return normalizedOptions;

    return normalizedOptions.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(query);
      const descriptionMatch = option.description
        ? String(option.description).toLowerCase().includes(query)
        : false;
      return labelMatch || descriptionMatch;
    });
  }, [normalizedOptions, searchable, searchQuery]);

  function closeMenu() {
    setOpen(false);
    setSearchQuery("");
  }

  function openMenu() {
    if (disabled || open) return;
    setOpen(true);

    if (searchable) {
      setSearchQuery("");
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }

  function toggleMenu() {
    if (disabled) return;
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }

  function selectOption(selectedValue, rawOption) {
    if (multiple) {
      if (selectedValue === "All") {
        onChange?.([], rawOption);
        return;
      }

      const normalizedValue = String(selectedValue ?? "");
      const nextValues = selectedValues.includes(normalizedValue)
        ? selectedValues.filter((item) => item !== normalizedValue)
        : [
            ...selectedValues.filter((item) => item !== "All"),
            normalizedValue,
          ];

      onChange?.(nextValues, rawOption);
      return;
    }

    onChange?.(selectedValue, rawOption);
    closeMenu();
  }

  const customClasses = `${buttonClassName || ""} ${className || ""}`;
  const hasCustomHeight = /(?:^|\s)(?:[a-z0-9]+:)*!?(?:h-\S+|min-h-\S+)/.test(customClasses);
  const hasCustomRounded = /(?:^|\s)(?:[a-z0-9]+:)*!?rounded-/.test(customClasses);
  const hasCustomPadding = /(?:^|\s)(?:[a-z0-9]+:)*!?p[xye]?-/.test(customClasses);

  const defaultHeightClass = hasCustomHeight ? "" : "h-8.5 2xl:h-10";
  const defaultRoundedClass = hasCustomRounded ? "" : "rounded-[10px]";
  const defaultPaddingClass = hasCustomPadding ? "" : "px-2.5 2xl:px-3";

  const triggerClasses = `flex w-full min-w-0 items-center justify-between gap-2 border font-jakarta sibs-text-xs 2xl:sibs-text-sm font-semibold outline-none transition text-left ${defaultHeightClass} ${defaultRoundedClass} ${defaultPaddingClass} ${
    disabled
      ? "cursor-not-allowed border-sibs-border bg-sibs-canvas text-sibs-faint opacity-70"
      : open
        ? "border-sibs-orange ring-4 ring-sibs-orange/10"
        : "border-slate-300 hover:border-sibs-orange/50 hover:bg-white"
  } ${buttonClassName || className}`;

  return (
    <div ref={anchorRef} className="relative min-w-0 w-full font-jakarta">
      {label && !hideLabel ? (
        <label
          className={`mb-1 block ${
            labelClassName || "sibs-text-xs font-bold text-sibs-navy"
          }`}
        >
          {label}
          {required ? <span className="text-sibs-orange"> *</span> : null}
        </label>
      ) : null}

      {searchable ? (
        <div className={triggerClasses}>
          <input
            ref={searchInputRef}
            type="text"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-required={required ? "true" : undefined}
            aria-label={
              label ? `${label}: ${displayLabel || placeholder}` : placeholder
            }
            disabled={disabled}
            value={open ? searchQuery : displayLabel}
            placeholder={open ? searchPlaceholder : placeholder}
            onFocus={openMenu}
            onClick={openMenu}
            onChange={(event) => {
              if (!open) openMenu();
              setSearchQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeMenu();
                searchInputRef.current?.blur();
              }
              if (event.key === "ArrowDown" && !open) {
                event.preventDefault();
                openMenu();
              }
            }}
            className={`min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 shadow-none outline-none ring-0 placeholder:text-sibs-faint focus:border-0 focus:outline-none focus:ring-0 ${
              open
                ? "font-semibold text-sibs-navy"
                : displayLabel
                  ? "font-semibold text-sibs-navy"
                  : "font-normal text-sibs-faint"
            }`}
            autoComplete="off"
          />

          <button
            type="button"
            tabIndex={-1}
            aria-label={open ? "Close options" : "Open options"}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggleMenu}
            className="inline-flex shrink-0 items-center justify-center rounded-md"
          >
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform duration-200 ${
                disabled
                  ? "text-sibs-faint"
                  : open
                    ? "rotate-180 text-sibs-orange"
                    : "text-sibs-navy"
              }`}
            />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required ? "true" : undefined}
          aria-label={
            label ? `${label}: ${displayLabel || placeholder}` : placeholder
          }
          disabled={disabled}
          onClick={toggleMenu}
          className={triggerClasses}
        >
          <span
            className={`block min-w-0 flex-1 truncate ${
              displayLabel
                ? "font-semibold text-sibs-navy"
                : "font-normal text-sibs-faint"
            }`}
          >
            {displayLabel || placeholder}
          </span>

          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-200 ${
              disabled
                ? "text-sibs-faint"
                : open
                  ? "rotate-180 text-sibs-orange"
                  : "text-sibs-navy"
            }`}
          />
        </button>
      )}

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={closeMenu}
        maxHeight={320}
        className={menuClassName}
      >
        <div className="sibs-scrollbar max-h-[320px] overflow-y-auto overscroll-contain py-1">
          {clearable && !searchQuery ? (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => selectOption("", null)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-jakarta sibs-text-xs 2xl:sibs-text-sm transition ${
                !value
                  ? "bg-sibs-cream-subtle font-extrabold text-sibs-orange"
                  : "font-semibold text-sibs-faint hover:bg-sibs-cream-light hover:text-sibs-orange"
              }`}
            >
              <span className="truncate">{placeholder}</span>
              {!value ? <Check size={14} className="shrink-0 text-sibs-orange" /> : null}
            </button>
          ) : null}

          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const selected = multiple
                ? option.value === "All"
                  ? selectedValues.length === 0 || selectedValues.includes("All")
                  : selectedValues.includes(option.value)
                : String(option.value) === String(value ?? "");

              return (
                <button
                  key={option.value || option.label}
                  type="button"
                  role="option"
                  disabled={option.disabled}
                  aria-selected={selected}
                  onClick={() => {
                    if (!option.disabled) selectOption(option.value, option.raw);
                  }}
                  className={`flex w-full items-start justify-between gap-2.5 px-3 py-2 text-left font-jakarta transition ${
                    option.disabled
                      ? "cursor-not-allowed text-sibs-faint opacity-50"
                      : selected
                        ? "bg-sibs-cream-subtle font-extrabold text-sibs-orange"
                        : "bg-white font-bold text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate sibs-text-xs 2xl:sibs-text-sm">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="mt-0.5 block truncate text-[9px] 2xl:text-[10px] font-semibold text-sibs-muted">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <Check size={14} className="mt-0.5 shrink-0 text-sibs-orange" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center font-jakarta sibs-text-xs font-semibold text-sibs-faint">
              {emptyMessage}
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
}
