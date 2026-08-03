import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

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
}) {
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [menuStyle, setMenuStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 224,
  });

  const normalizedOptions = useMemo(
    () => normalizeDropdownOptions(options),
    [options],
  );

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value ?? ""),
  );

  const displayLabel =
    selectedOption?.label ||
    cleanText(displayValue) ||
    cleanText(value) ||
    "";

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

    if (!excludeSelectedOption) return matchesSearch;

    return matchesSearch.filter((option) => {
      const isSelectedValue =
        String(option.value) === String(value ?? "");
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

  const inputDisplayValue =
    open && searchable ? dropdownSearch : displayLabel;

  const hasDisplayValue = Boolean(displayLabel);

  function getBoundaryRect() {
    const explicitBoundary = boundaryRef?.current;
    const closestBoundary = dropdownRef.current?.closest?.(
      '[data-dropdown-boundary="true"]',
    );

    return (explicitBoundary || closestBoundary)?.getBoundingClientRect?.() || null;
  }

  function updateMenuPosition() {
    if (!dropdownRef.current) return;

    const rect = dropdownRef.current.getBoundingClientRect();
    const boundaryRect = getBoundaryRect();
    const gap = 8;
    const viewportPadding = 12;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;

    const boundaryTop = Math.max(
      viewportPadding,
      boundaryRect?.top ?? viewportPadding,
    );
    const boundaryBottom = Math.min(
      viewportHeight - viewportPadding,
      boundaryRect?.bottom ?? viewportHeight - viewportPadding,
    );
    const boundaryLeft = Math.max(
      viewportPadding,
      boundaryRect?.left ?? viewportPadding,
    );
    const boundaryRight = Math.min(
      viewportWidth - viewportPadding,
      boundaryRect?.right ?? viewportWidth - viewportPadding,
    );

    const availableBelow = Math.max(
      0,
      boundaryBottom - rect.bottom - gap,
    );
    const availableAbove = Math.max(
      0,
      rect.top - boundaryTop - gap,
    );

    const preferredHeight = Math.max(
      120,
      Number(maxMenuHeight) || 224,
    );
    const shouldOpenUp =
      availableBelow < 160 && availableAbove > availableBelow;
    const availableHeight = shouldOpenUp
      ? availableAbove
      : availableBelow;
    const cleanMaxHeight = Math.max(
      72,
      Math.min(preferredHeight, availableHeight || preferredHeight),
    );

    const boundaryWidth = Math.max(0, boundaryRight - boundaryLeft);
    const cleanWidth = Math.min(rect.width, boundaryWidth || rect.width);
    const left = Math.min(
      Math.max(rect.left, boundaryLeft),
      Math.max(boundaryRight - cleanWidth, boundaryLeft),
    );

    const preferredTop = shouldOpenUp
      ? rect.top - gap - cleanMaxHeight
      : rect.bottom + gap;
    const top = Math.min(
      Math.max(preferredTop, boundaryTop),
      Math.max(boundaryBottom - cleanMaxHeight, boundaryTop),
    );

    setMenuStyle({
      left,
      top,
      width: cleanWidth,
      maxHeight: cleanMaxHeight,
    });
  }

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();

    function handleScrollOrResize() {
      updateMenuPosition();
    }

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [
    open,
    filteredOptions.length,
    maxMenuHeight,
    boundaryRef,
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target;
      const clickedInput = dropdownRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedInput && !clickedMenu) {
        setOpen(false);
        setDropdownSearch("");
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setDropdownSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openDropdown() {
    if (disabled) return;

    setOpen(true);

    window.setTimeout(() => {
      updateMenuPosition();

      if (searchable) {
        inputRef.current?.focus?.();
      }
    }, 0);
  }

  function toggleDropdown() {
    if (disabled) return;

    setOpen((previous) => {
      const nextOpen = !previous;

      if (!nextOpen) {
        setDropdownSearch("");
      }

      window.setTimeout(updateMenuPosition, 0);

      return nextOpen;
    });
  }

  function handleSelect(option) {
    onChange?.(option.value, option);
    onSelectOption?.(option);
    setOpen(false);
    setDropdownSearch("");
  }

  function handleInputKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      setDropdownSearch("");
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    }
  }

  const menu =
    open && !disabled && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              left: `${menuStyle.left}px`,
              top: `${menuStyle.top}px`,
              width: `${menuStyle.width}px`,
              zIndex: 30000,
            }}
            className={`sibs-dropdown-pop-in overflow-hidden rounded-[10px] border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${menuClassName}`}
          >
            <div
              className="sibs-scrollbar overflow-y-auto overscroll-contain"
              style={{
                maxHeight: `${menuStyle.maxHeight}px`,
              }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id || option.value}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                    className="block w-full bg-white px-3 py-2.5 text-left text-xs font-semibold text-[#344054] transition hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>

                    {option.description ? (
                      <span className="mt-0.5 block min-w-0 truncate text-[10px] font-bold text-[#98A2B3]">
                        {option.description}
                      </span>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-xs font-semibold text-[#98A2B3]">
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  const sharedControlClass = `flex h-10 w-full min-w-0 items-center rounded-[10px] border px-3 text-left text-xs font-semibold outline-none transition ${
    open
      ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
      : "border-[#D7DEE8] bg-[#F8FAFC] hover:border-[#FF5C28]/40 hover:bg-white"
  } ${
    disabled
      ? "cursor-not-allowed bg-[#F2F4F7] text-[#98A2B3] opacity-70"
      : "text-[#344054]"
  }`;

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      {label ? (
        <FieldLabel required={required}>{label}</FieldLabel>
      ) : null}

      {searchable ? (
        <div
          className={`${sharedControlClass} cursor-text`}
          onClick={openDropdown}
        >
          <input
            ref={inputRef}
            value={inputDisplayValue}
            readOnly={!open}
            disabled={disabled}
            onFocus={openDropdown}
            onChange={(event) => {
              setDropdownSearch(event.target.value);
              setOpen(true);
              window.setTimeout(updateMenuPosition, 0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={searchPlaceholder || placeholder}
            aria-expanded={open}
            aria-haspopup="listbox"
            autoComplete="off"
            className={`h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-semibold outline-none placeholder:text-[#98A2B3] ${
              hasDisplayValue || open
                ? "text-[#344054]"
                : "text-[#98A2B3]"
            } disabled:cursor-not-allowed disabled:text-[#98A2B3]`}
          />

          <ChevronDown
            size={16}
            className={`shrink-0 text-[#042C51] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`${sharedControlClass} justify-between gap-3`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              hasDisplayValue ? "text-[#344054]" : "text-[#98A2B3]"
            }`}
          >
            {displayLabel || placeholder}
          </span>

          <ChevronDown
            size={16}
            className={`shrink-0 text-[#042C51] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {menu}
    </div>
  );
}