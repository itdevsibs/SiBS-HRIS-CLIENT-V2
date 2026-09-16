import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { filterEmailLogCategoryOptions } from "@/lib/utils/emailLogs/emailLogsHelpers";

const EDGE = "rounded-[10px]";

export default function EmailLogCategoryDropdown({
  categories = [],
  value = "",
  onChange,
  label = "Template Category",
  placeholder = "Search categories...",
}) {
  const anchorRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);

  const options = useMemo(
    () => filterEmailLogCategoryOptions(categories, search),
    [categories, search],
  );

  useEffect(() => {
    if (!open) return undefined;

    function updateMenuPosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const availableBelow = window.innerHeight - rect.bottom - 16;
      const availableAbove = rect.top - 16;
      const estimatedMenuHeight = Math.min(256, Math.max(128, categories.length * 36 + 16));
      const shouldOpenAbove =
        availableBelow < Math.min(180, estimatedMenuHeight) &&
        availableAbove > availableBelow;
      const maxHeight = Math.max(
        128,
        Math.min(256, shouldOpenAbove ? availableAbove - 8 : availableBelow - 8),
      );

      setMenuPosition({
        left: rect.left,
        top: shouldOpenAbove
          ? Math.max(8, rect.top - Math.min(estimatedMenuHeight, maxHeight) - 8)
          : rect.bottom + 8,
        width: rect.width,
        maxHeight,
      });
    }

    function handlePointerDown(event) {
      const clickedAnchor = anchorRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);

      if (!clickedAnchor && !clickedMenu) {
        setOpen(false);
        setSearch("");
      }
    }

    updateMenuPosition();
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, categories.length]);

  function openDropdown() {
    setSearch("");
    setOpen(true);
  }

  function closeDropdown() {
    setOpen(false);
    setSearch("");
  }

  function toggleDropdown() {
    if (open) {
      closeDropdown();
      return;
    }

    openDropdown();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function selectCategory(category) {
    onChange?.(category);
    closeDropdown();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      closeDropdown();
      return;
    }

    if (event.key === "Enter" && open && options.length === 1) {
      event.preventDefault();
      selectCategory(options[0]);
    }
  }

  const dropdownMenu =
    open && menuPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            id="email-log-template-category-options"
            role="listbox"
            className="fixed z-[10050] overflow-hidden rounded-[10px] border border-[#D7DEE8] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
            style={{
              left: menuPosition.left,
              top: menuPosition.top,
              width: menuPosition.width,
            }}
          >
            <div
              className="overflow-y-auto py-2 sibs-scrollbar"
              style={{ maxHeight: menuPosition.maxHeight }}
            >
              {options.length > 0 ? (
                options.map((category) => {
                  const selected = category === value;

                  return (
                    <button
                      key={category}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => selectCategory(category)}
                      className={`block w-full px-3 py-2 text-left sibs-text-xs transition 2xl:px-4 2xl:py-2.5 ${
                        selected
                          ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                          : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                      }`}
                    >
                      <span className="block truncate">{category}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-4 text-xs font-semibold text-[#667085]">
                  No options found.
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="block">
      <label
        htmlFor="email-log-template-category"
        className="sibs-field-label"
      >
        {label}
      </label>

      <div ref={anchorRef} className="group relative overflow-visible">
        <input
          ref={inputRef}
          id="email-log-template-category"
          type="search"
          name="email_log_category_search"
          value={open ? search : value}
          onChange={(event) => {
            setSearch(event.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={openDropdown}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          className={`h-10 w-full ${EDGE} border border-[#E6ECF2] bg-[#F8FAFC] px-3 pr-10 font-jakarta sibs-text-xs font-bold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-[#FF5C28]/40 hover:bg-white focus:border-[#FF5C28] focus:bg-white focus:ring-4 focus:ring-[#FF5C28]/10 2xl:h-11`}
          role="combobox"
          aria-expanded={open}
          aria-controls="email-log-template-category-options"
          aria-autocomplete="list"
        />

        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleDropdown}
          className="absolute right-2 top-1/2 flex h-6.5 w-6.5 -translate-y-1/2 items-center justify-center rounded-md text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] 2xl:h-7 2xl:w-7"
          aria-label="Toggle Template Category dropdown"
          tabIndex={-1}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-300 2xl:h-4 2xl:w-4 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <input type="hidden" name="templateCategory" value={value} />
      {dropdownMenu}
    </div>
  );
}
