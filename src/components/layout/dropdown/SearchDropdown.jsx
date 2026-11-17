import React, { useId, useMemo, useRef, useState } from "react";
import DropdownPortal from "@/components/ui/DropdownPortal";

const SearchDropdown = ({
  refBox,
  label,
  required = false,
  value,
  searchValue,
  setSearchValue,
  placeholder,
  open,
  setOpen,
  disabled,
  loading,
  loadingText,
  options,
  selectedValue,
  getOptionValue,
  getOptionLabel,
  getOptionSubLabel,
  onSelect,
  onBeforeOpen,
  zIndex = "z-20",
}) => {
  const dropdownId = useId();
  const inputId = `${dropdownId}-input`;
  const internalRef = useRef(null);
  const containerRef = refBox || internalRef;
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filteredOptions = useMemo(() => {
    const keyword = String(searchValue || "")
      .trim()
      .toLowerCase();

    if (!keyword) return options;

    return options.filter((option) => {
      const labelText = String(getOptionLabel(option) || "").toLowerCase();
      const subLabelText = String(
        getOptionSubLabel?.(option) || "",
      ).toLowerCase();

      return labelText.includes(keyword) || subLabelText.includes(keyword);
    });
  }, [options, searchValue, getOptionLabel, getOptionSubLabel]);

  const handleKeyDown = (e) => {
    if (disabled || loading) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlightedIndex(0);
      } else if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
      }
    } else if (e.key === "Enter") {
      if (open && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        const selected = filteredOptions[highlightedIndex];
        onSelect(selected);
        setSearchValue(getOptionLabel(selected) || "");
        setOpen(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.stopPropagation();
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative self-start ${zIndex} font-jakarta`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-muted"
        >
          {label} {required && <span className="text-sibs-orange">*</span>}
        </label>
      )}

      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={Boolean(open && !disabled && !loading)}
        aria-controls={`${dropdownId}-listbox`}
        aria-activedescendant={
          open && highlightedIndex >= 0 ? `${dropdownId}-opt-${highlightedIndex}` : undefined
        }
        aria-label={label || placeholder}
        required={required}
        value={open ? searchValue : value || ""}
        onChange={(e) => {
          setSearchValue(e.target.value);
          setHighlightedIndex(0);
          setOpen(true);
        }}
        onFocus={() => {
          if (disabled || loading) return;

          onBeforeOpen?.();
          setSearchValue(value || "");
          setHighlightedIndex(-1);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={loading ? loadingText : placeholder}
        disabled={disabled || loading}
        autoComplete="off"
        className={`h-8.5 sm:h-9 2xl:h-10 w-full rounded-[10px] border px-3 sibs-text-xs font-bold text-sibs-navy outline-none transition disabled:cursor-not-allowed disabled:bg-sibs-canvas disabled:text-sibs-muted ${
          open
            ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10"
            : "border-sibs-border bg-sibs-surface hover:border-sibs-orange/40 hover:bg-white"
        }`}
      />

      <DropdownPortal
        open={Boolean(open && !disabled && !loading)}
        anchorRef={containerRef}
        onClose={() => {
          setOpen(false);
          setHighlightedIndex(-1);
        }}
        maxHeight={256}
        topLayer
      >
        <div
          id={`${dropdownId}-listbox`}
          role="listbox"
          aria-label={label || placeholder}
          className="max-h-56 overflow-y-auto py-2 sibs-scrollbar font-jakarta"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => {
              const optionValue = getOptionValue(option);
              const optionLabel = getOptionLabel(option);
              const optionSubLabel = getOptionSubLabel?.(option);
              const isSelected =
                String(selectedValue || "") === String(optionValue || "");
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  id={`${dropdownId}-opt-${idx}`}
                  key={String(optionValue)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(option);
                    setSearchValue(optionLabel || "");
                    setOpen(false);
                    setHighlightedIndex(-1);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`block w-full border-b border-sibs-border/40 px-3 py-2 2xl:px-4 2xl:py-2.5 text-left transition last:border-b-0 ${
                    isSelected
                      ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                      : isHighlighted
                        ? "bg-sibs-cream-subtle font-semibold text-sibs-orange"
                        : "font-semibold text-sibs-text-secondary hover:bg-sibs-cream-subtle hover:text-sibs-orange"
                  } ${isHighlighted ? "ring-1 ring-inset ring-sibs-orange/30" : ""}`}
                >
                  <div className="sibs-text-xs font-semibold text-sibs-navy">
                    {optionLabel}
                  </div>

                  {optionSubLabel && (
                    <div className="mt-0.5 text-[9px] font-bold text-sibs-muted">
                      {optionSubLabel}
                    </div>
                  )}
                </button>
              );
            })
          ) : searchValue.trim() ? (
            <div className="px-3 py-2 text-xs font-semibold text-sibs-muted">
              No results found
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-sibs-muted">
              Type to search
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
};

export default SearchDropdown;
