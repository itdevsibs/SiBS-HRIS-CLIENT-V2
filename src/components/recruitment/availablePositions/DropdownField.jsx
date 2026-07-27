import {
  useCallback,
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
}) {
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] =
    useState("");
  const [menuStyle, setMenuStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 224,
  });
  const [menuPlacement, setMenuPlacement] =
    useState("down");

  const normalizedOptions = useMemo(
    () => normalizeDropdownOptions(options),
    [options],
  );

  const selectedOption = normalizedOptions.find(
    (option) =>
      String(option.value) ===
      String(value ?? ""),
  );

  const displayLabel =
    selectedOption?.label ||
    cleanText(displayValue) ||
    cleanText(value) ||
    "";

  const filteredOptions = useMemo(() => {
    const keyword = cleanText(
      dropdownSearch,
    ).toLowerCase();

    if (!keyword) return normalizedOptions;

    return normalizedOptions.filter((option) =>
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
    );
  }, [
    normalizedOptions,
    dropdownSearch,
  ]);

  const inputDisplayValue =
    open && searchable
      ? dropdownSearch
      : displayLabel;

  const hasDisplayValue =
    Boolean(displayLabel);

  const updateMenuPosition = useCallback(() => {
    if (!dropdownRef.current) return;

    const triggerElement =
      dropdownRef.current.querySelector("[data-dropdown-trigger]") ||
      dropdownRef.current;
    const rect = triggerElement.getBoundingClientRect();
    const gap = 6;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;

    const optionCount = filteredOptions.length || 1;
    const estimatedMenuHeight = Math.min(
      220,
      optionCount * 38 + 8,
    );

    const spaceBelow = viewportHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;

    const shouldOpenUp =
      spaceBelow < estimatedMenuHeight &&
      spaceAbove > spaceBelow;

    const maxHeight = Math.min(
      220,
      shouldOpenUp ? Math.max(120, spaceAbove) : Math.max(120, spaceBelow),
    );
    const renderedHeight = Math.min(
      estimatedMenuHeight,
      maxHeight,
    );

    const left = Math.min(
      Math.max(rect.left, 12),
      Math.max(viewportWidth - rect.width - 12, 12),
    );

    let top = 0;
    if (shouldOpenUp) {
      top = Math.max(12, rect.top - gap - renderedHeight);
    } else {
      top = Math.min(
        rect.bottom + gap,
        viewportHeight - renderedHeight - 12,
      );
    }

    setMenuStyle({
      left,
      top,
      width: rect.width,
      maxHeight,
    });
    setMenuPlacement(shouldOpenUp ? "up" : "down");
  }, [filteredOptions.length]);

  useEffect(() => {
    if (!open) return undefined;

    const frameId = window.requestAnimationFrame(
      updateMenuPosition,
    );

    function handleScrollOrResize() {
      updateMenuPosition();
    }

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target;

      const clickedInput =
        dropdownRef.current?.contains(target);
      const clickedMenu =
        menuRef.current?.contains(target);

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

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );
    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
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

      window.setTimeout(
        updateMenuPosition,
        0,
      );

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
        handleSelect(
          filteredOptions[0],
        );
      }
    }
  }

  const menu =
    typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: `${menuStyle.left}px`,
              top: `${menuStyle.top}px`,
              width: `${menuStyle.width}px`,
              zIndex: 20000,
            }}
            className={`sibs-animated-dropdown ${
              open ? "open" : "closed"
            } ${
              menuPlacement === "up"
                ? "sibs-animated-dropdown-up"
                : ""
            } font-jakarta ${menuClassName}`}
          >
            <div className="sibs-animated-dropdown-inner">
              <div
                className="sibs-animated-dropdown-box rounded-[10px] border-[#D7DEE8] shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
              >
                <div
                  className="sibs-scrollbar overflow-y-auto py-1"
                  style={{
                    maxHeight: `${menuStyle.maxHeight}px`,
                  }}
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                      const active =
                        String(option.value) === String(value ?? "");

                      return (
                        <button
                          key={option.id || option.value}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelect(option)}
                          className={`block w-full px-3 py-2.5 text-left text-xs font-semibold transition ${
                            active
                              ? "bg-[#FFF0EB] text-[#FF5C28]"
                              : "bg-white text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                          }`}
                        >
                          <span className="block min-w-0 truncate">
                            {option.label}
                          </span>

                          {option.description ? (
                            <span
                              className={`mt-0.5 block min-w-0 truncate text-[10px] font-bold ${
                                active
                                  ? "text-[#FF5C28]/80"
                                  : "text-[#98A2B3]"
                              }`}
                            >
                              {option.description}
                            </span>
                          ) : null}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-xs font-semibold text-[#98A2B3]">
                      {emptyMessage}
                    </div>
                  )}
                </div>
              </div>
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
      className={`relative min-w-0 ${
        open ? zIndex : "z-[1]"
      }`}
    >
      {label ? (
        <FieldLabel required={required}>
          {label}
        </FieldLabel>
      ) : null}

      {searchable ? (
        <div
          data-dropdown-trigger
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
              setDropdownSearch(
                event.target.value,
              );
              setOpen(true);
              window.setTimeout(
                updateMenuPosition,
                0,
              );
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={
              searchPlaceholder || placeholder
            }
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
          data-dropdown-trigger
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={`${sharedControlClass} justify-between gap-3`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              hasDisplayValue
                ? "text-[#344054]"
                : "text-[#98A2B3]"
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
