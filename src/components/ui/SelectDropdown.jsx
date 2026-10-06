import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

function cleanText(value) {
  return String(value ?? "").trim();
}

function DropdownPortal({
  open,
  anchorRef,
  onClose,
  children,
  className = "",
  maxHeight = 224,
  offset = 4,
}) {
  const [style, setStyle] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      const clickedAnchor = anchorRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, anchorRef, onClose]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      if (!anchorRef.current) return;

      const rect = anchorRef.current.getBoundingClientRect();
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - rect.bottom - offset;
      const spaceAbove = rect.top - offset;

      const shouldFlipUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const availableHeight = shouldFlipUp
        ? Math.max(120, spaceAbove - viewportPadding)
        : Math.max(120, spaceBelow - viewportPadding);

      const panelMaxHeight = Math.min(maxHeight, availableHeight);
      const renderedHeight = dropdownRef.current?.offsetHeight || panelMaxHeight;

      const top = shouldFlipUp
        ? Math.max(viewportPadding, rect.top - renderedHeight - offset)
        : rect.bottom + offset;

      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - rect.width - viewportPadding,
      );

      setStyle({
        top,
        left,
        width: rect.width,
        maxHeight: panelMaxHeight,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef, maxHeight, offset]);

  if (!open || !style || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      role="listbox"
      className={`sibs-dropdown-pop-in fixed z-[999999] overflow-hidden rounded-xl border border-sibs-border-subtle bg-white font-jakarta shadow-2xl ${className}`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="sibs-scrollbar overflow-y-auto overscroll-contain py-1"
        style={{ maxHeight: `${style.maxHeight}px` }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
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

  const normalizedOptions = useMemo(() => {
    return options.map((option) => ({
      raw: option,
      value: String(optionValue(option) ?? ""),
      label: String(optionLabel(option) ?? ""),
      description: optionDescription(option),
      disabled: Boolean(option?.disabled),
    }));
  }, [options, optionValue, optionLabel, optionDescription]);

  const selectedValues = useMemo(() => {
    if (!multiple) return [];
    if (Array.isArray(value)) return value.map((v) => String(v ?? ""));
    return value ? [String(value)] : [];
  }, [multiple, value]);

  const selectedOption = useMemo(() => {
    if (multiple) return null;
    return normalizedOptions.find(
      (opt) => String(opt.value) === String(value ?? ""),
    );
  }, [multiple, normalizedOptions, value]);

  const displayLabel = useMemo(() => {
    if (multiple) {
      if (selectedValues.length === 0) return "";
      if (selectedValues.length === 1) {
        const found = normalizedOptions.find((opt) => opt.value === selectedValues[0]);
        return found ? found.label : selectedValues[0];
      }
      return `${selectedValues.length} selected`;
    }
    return selectedOption?.label || (value ? String(value) : "");
  }, [multiple, selectedValues, normalizedOptions, selectedOption, value]);

  const filteredOptions = useMemo(() => {
    const query = cleanText(searchQuery).toLowerCase();
    if (!searchable || !query) return normalizedOptions;

    return normalizedOptions.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(query);
      const descMatch = opt.description
        ? String(opt.description).toLowerCase().includes(query)
        : false;
      return labelMatch || descMatch;
    });
  }, [normalizedOptions, searchable, searchQuery]);

  function handleOpen() {
    if (disabled) return;
    setOpen((prev) => !prev);
    if (!open && searchable) {
      setSearchQuery("");
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }

  function handleClose() {
    setOpen(false);
    setSearchQuery("");
  }

  function handleSelect(selectedValue, optionRaw) {
    if (multiple) {
      if (selectedValue === "All") {
        onChange?.([], optionRaw);
        return;
      }

      const cleanVal = String(selectedValue ?? "");
      const nextValues = selectedValues.includes(cleanVal)
        ? selectedValues.filter((item) => item !== cleanVal)
        : [...selectedValues.filter((item) => item !== "All"), cleanVal];

      onChange?.(nextValues, optionRaw);
      return;
    }

    onChange?.(selectedValue, optionRaw);
    handleClose();
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
      ? "cursor-not-allowed border-sibs-border-subtle bg-sibs-canvas text-sibs-faint opacity-70"
      : open
        ? "border-sibs-orange bg-white text-sibs-navy ring-2 ring-sibs-orange/10"
        : "border-sibs-border-subtle bg-sibs-surface text-sibs-navy hover:border-sibs-orange/40 hover:bg-white"
  } ${buttonClassName || className}`;

  return (
    <div ref={anchorRef} className="relative min-w-0 w-full font-jakarta">
      {label && !hideLabel && (
        <label
          className={`mb-1 block font-jakarta ${
            labelClassName || "sibs-text-xs font-bold text-sibs-navy"
          }`}
        >
          {label}
          {required && <span className="text-sibs-orange"> *</span>}
        </label>
      )}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required ? "true" : undefined}
        aria-label={label ? `${label}: ${displayLabel || placeholder}` : placeholder}
        disabled={disabled}
        onClick={handleOpen}
        className={triggerClasses}
      >
        <span
          className={`block min-w-0 flex-1 truncate ${
            displayLabel ? "text-sibs-navy font-semibold" : "text-sibs-faint font-normal"
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

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={handleClose}
        className={menuClassName}
      >
        {searchable && (
          <div className="border-b border-sibs-border px-2.5 py-1.5">
            <div className="flex items-center gap-2 rounded-lg border border-sibs-border-subtle bg-sibs-surface px-2 py-1">
              <Search size={13} className="text-sibs-faint" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent font-jakarta sibs-text-xs font-semibold text-sibs-navy outline-none placeholder:text-sibs-faint"
              />
            </div>
          </div>
        )}

        {clearable && !searchQuery && (
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect("", null)}
            className={`flex w-full items-center justify-between px-3 py-1.5 2xl:py-2 text-left font-jakarta sibs-text-xs 2xl:sibs-text-sm transition ${
              !value
                ? "bg-sibs-cream-subtle font-extrabold text-sibs-orange"
                : "font-semibold text-sibs-faint hover:bg-sibs-cream-light hover:text-sibs-orange"
            }`}
          >
            <span className="truncate">{placeholder}</span>
            {!value && <Check size={14} className="text-sibs-orange shrink-0" />}
          </button>
        )}

        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => {
            const isSelected = multiple
              ? (opt.value === "All"
                  ? selectedValues.length === 0 || selectedValues.includes("All")
                  : selectedValues.includes(String(opt.value)))
              : String(opt.value) === String(value ?? "");

            return (
              <button
                key={opt.value || opt.label}
                type="button"
                role="option"
                disabled={opt.disabled}
                aria-selected={isSelected}
                onClick={() => {
                  if (opt.disabled) return;
                  handleSelect(opt.value, opt.raw);
                }}
                className={`flex w-full items-start justify-between gap-2.5 px-3 py-1.5 2xl:py-2 text-left font-jakarta transition ${
                  opt.disabled
                    ? "cursor-not-allowed text-sibs-faint opacity-50"
                    : isSelected
                      ? "bg-sibs-cream-subtle font-extrabold text-sibs-orange"
                      : "bg-white font-bold text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate sibs-text-xs 2xl:sibs-text-sm">
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="mt-0.5 block truncate text-[9px] 2xl:text-[10px] font-semibold text-sibs-muted">
                      {opt.description}
                    </span>
                  )}
                </span>

                {isSelected && (
                  <Check size={14} className="mt-0.5 shrink-0 text-sibs-orange" />
                )}
              </button>
            );
          })
        ) : (
          <div className="px-3 py-2 text-center font-jakarta sibs-text-xs font-semibold text-sibs-faint">
            {emptyMessage}
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}
