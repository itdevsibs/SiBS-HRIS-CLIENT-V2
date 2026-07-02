import { useEffect, useMemo, useRef, useState } from "react";
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
    selectedOption?.label || cleanText(displayValue) || cleanText(value) || "";

  const filteredOptions = useMemo(() => {
    const keyword = cleanText(dropdownSearch).toLowerCase();

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
  }, [normalizedOptions, dropdownSearch]);

  const inputDisplayValue = open && searchable ? dropdownSearch : displayLabel;
  const hasDisplayValue = Boolean(displayLabel);

  function updateMenuPosition() {
    if (!dropdownRef.current) return;

    const rect = dropdownRef.current.getBoundingClientRect();
    const gap = 8;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;

    const availableBelow = viewportHeight - rect.bottom - gap - 16;
    const availableAbove = rect.top - gap - 16;

    const preferredHeight = 224;
    const shouldOpenUp =
      availableBelow < 160 && availableAbove > availableBelow;

    const maxHeight = Math.max(
      120,
      Math.min(preferredHeight, shouldOpenUp ? availableAbove : availableBelow),
    );

    const left = Math.min(
      Math.max(rect.left, 12),
      Math.max(viewportWidth - rect.width - 12, 12),
    );

    const top = shouldOpenUp
      ? Math.max(rect.top - gap - maxHeight, 12)
      : Math.min(rect.bottom + gap, viewportHeight - maxHeight - 12);

    setMenuStyle({
      left,
      top,
      width: rect.width,
      maxHeight,
    });
  }

  useEffect(() => {
    if (!open) return;

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
  }, [open, filteredOptions.length]);

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
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    open && !disabled
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
            className={`overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${menuClassName}`}
          >
            <div
              className="overflow-y-auto"
              style={{ maxHeight: `${menuStyle.maxHeight}px` }}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const active = String(option.value) === String(value ?? "");

                  return (
                    <button
                      key={option.id || option.value}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option)}
                      className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                        active
                          ? "bg-[#EAF4FF] text-sibs-primary-1"
                          : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                      }`}
                    >
                      <span className="block min-w-0 truncate">
                        {option.label}
                      </span>

                      {option.description && (
                        <span
                          className={`mt-0.5 block min-w-0 truncate text-xs font-bold ${
                            active
                              ? "text-sibs-primary-1/70"
                              : "text-sibs-tertiary-5"
                          }`}
                        >
                          {option.description}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3.5 text-sm font-semibold text-sibs-tertiary-5">
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      {label && <FieldLabel required={required}>{label}</FieldLabel>}

      {searchable ? (
        <div
          className={`flex h-11 w-full min-w-0 items-center rounded-xl border bg-white px-4 shadow-sm transition ${
            open
              ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
              : "border-[#D0D5DD] hover:border-sibs-primary-1"
          } ${
            disabled
              ? "cursor-not-allowed bg-gray-50 opacity-70"
              : "cursor-text"
          }`}
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
            className={`h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-bold outline-none placeholder:text-sibs-tertiary-5 ${
              hasDisplayValue || open
                ? "text-[#344054]"
                : "text-sibs-tertiary-5"
            } disabled:cursor-not-allowed disabled:text-gray-400`}
          />

          <ChevronDown
            size={18}
            className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
            open
              ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
              : "border-[#D0D5DD] hover:border-sibs-primary-1"
          } ${
            disabled
              ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
              : "text-[#344054]"
          }`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              hasDisplayValue ? "text-[#344054]" : "text-sibs-tertiary-5"
            }`}
          >
            {displayLabel || placeholder}
          </span>

          <ChevronDown
            size={18}
            className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {menu}
    </div>
  );
}
