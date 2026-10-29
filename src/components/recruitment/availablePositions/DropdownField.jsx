import React, { useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import DropdownPortal from "@/components/ui/DropdownPortal";

import {
  cleanText,
  normalizeDropdownOptions,
} from "../../../lib/utils/availablePositions/availablePositionsHelpers";
import { FieldLabel } from "../../../lib/utils/availablePositions/reactComponents/reactHelpers";

export default function DropdownField({
  label,
  value,
  displayValue = "",
  options = [],
  onChange,
  onSelectOption,
  placeholder = "Select",
  disabled = false,
  required = false,
  zIndex = "z-[100]",
  menuClassName = "",
  searchable = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  excludeSelectedOption = false,
  excludedOptionId = "",
  boundaryRef = null,
  maxMenuHeight = 224,
  controlVariant = "field",
  className = "",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  const normalizedOptions = useMemo(
    () => normalizeDropdownOptions(options),
    [options],
  );

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value ?? ""),
  );

  const displayLabel =
    selectedOption?.label || cleanText(displayValue) || cleanText(value) || "";

  const filteredOptions = useMemo(() => {
    const keyword = cleanText(dropdownSearch).toLowerCase();

    const matchesSearch = keyword
      ? normalizedOptions.filter((option) =>
          [
            option.label,
            option.value,
            option.id,
            option.description,
            option.searchText,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword),
        )
      : normalizedOptions;

    if (!excludeSelectedOption) {
      return matchesSearch;
    }

    return matchesSearch.filter((option) => {
      const isSelectedValue = String(option.value) === String(value ?? "");
      const isExcludedId =
        cleanText(excludedOptionId) &&
        String(option.id) === String(excludedOptionId);

      return !isSelectedValue && !isExcludedId;
    });
  }, [
    normalizedOptions,
    dropdownSearch,
    excludeSelectedOption,
    excludedOptionId,
    value,
  ]);

  function handleSelectOption(option) {
    onChange?.(option.value, option);
    onSelectOption?.(option);
    setOpen(false);
    setDropdownSearch("");
  }

  const isSecondaryAction = controlVariant === "secondaryAction";

  const sharedControlClass = `flex h-9 2xl:h-10 w-full min-w-0 items-center justify-between gap-2 ${
    isSecondaryAction ? "rounded-lg px-3.5" : "rounded-[10px] px-3"
  } border text-left font-jakarta sibs-text-xs font-bold outline-none transition ${
    open
      ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10 text-sibs-navy"
      : isSecondaryAction
        ? "border-sibs-border bg-white text-sibs-navy hover:border-sibs-orange/35 hover:bg-orange-50/50 hover:text-sibs-orange"
        : "border-sibs-border bg-sibs-surface text-sibs-navy hover:border-sibs-orange/40 hover:bg-white"
  } ${
    disabled ? "cursor-not-allowed bg-slate-100 text-sibs-muted opacity-70" : ""
  }`;

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 font-jakarta ${className}`}
    >
      {label ? <FieldLabel required={required}>{label}</FieldLabel> : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={sharedControlClass}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            displayLabel ? "text-sibs-navy" : "text-sibs-muted"
          }`}
        >
          {displayLabel || placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 text-sibs-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open}
        anchorRef={dropdownRef}
        onClose={() => {
          setOpen(false);
          setDropdownSearch("");
        }}
        maxHeight={maxMenuHeight}
        className={zIndex}
      >
        <div
          className={`max-h-64 overflow-y-auto py-2 sibs-scrollbar font-jakarta ${menuClassName}`}
        >
          {searchable && (
            <div className="relative mb-1.5 p-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sibs-muted" />
              <input
                type="text"
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full rounded-[8px] bg-sibs-canvas pl-8 pr-3 py-1.5 text-xs text-sibs-navy placeholder:text-sibs-muted focus:border-sibs-orange focus:outline-none focus:ring-1 focus:ring-sibs-orange border border-sibs-border"
              />
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = String(option.value) === String(value ?? "");

              return (
                <button
                  key={option.value || option.id}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`flex w-full flex-col items-start px-3 py-2 2xl:px-4 2xl:py-2.5 text-left sibs-text-xs transition ${
                    isSelected
                      ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                      : "font-semibold text-sibs-text-secondary hover:bg-sibs-cream-subtle hover:text-sibs-orange"
                  }`}
                >
                  <span className="block min-w-0 truncate">{option.label}</span>

                  {option.description ? (
                    <span
                      className={`mt-0.5 block min-w-0 truncate text-[10px] ${
                        isSelected ? "text-sibs-orange/80" : "text-sibs-muted"
                      }`}
                    >
                      {option.description}
                    </span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2.5 text-xs font-semibold text-sibs-muted">
              {emptyMessage}
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
}
