import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

const EDGE = "rounded-[10px]";

function getText(value) {
  return String(value || "").trim();
}

function getOptionLabel(option) {
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  return getText(
    option?.label ||
      option?.name ||
      option?.accountName ||
      option?.account ||
      option?.account_name ||
      option?.gy_acc_name ||
      option?.clusterName ||
      option?.cluster ||
      option?.weeklyVersion ||
      option?.weekly_version ||
      option?.weekRange ||
      option?.value,
  );
}

function getOptionValue(option) {
  if (typeof option === "string" || typeof option === "number") {
    return String(option);
  }

  return getText(
    option?.value ||
      option?.id ||
      option?.accountName ||
      option?.account ||
      option?.account_name ||
      option?.gy_acc_name ||
      option?.clusterName ||
      option?.cluster ||
      option?.label ||
      option?.weeklyVersion ||
      option?.weekly_version,
  );
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
  minWidth = 0,
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight,
    shouldOpenUp: false,
  });
  const [mounted, setMounted] = useState(Boolean(open));
  const [active, setActive] = useState(Boolean(open));

  useEffect(() => {
    let timer;
    let frame;
    if (open) {
      setMounted(true);
      frame = requestAnimationFrame(() => setActive(true));
    } else {
      setActive(false);
      timer = setTimeout(() => setMounted(false), 200);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!mounted || !anchorRef?.current) return undefined;

    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth || 0;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;

      const gap = 8;
      const safePadding = 8;
      const dropdownWidth = Math.max(rect.width, minWidth);
      const spaceBelow = viewportHeight - rect.bottom - gap - safePadding;
      const spaceAbove = rect.top - gap - safePadding;
      const shouldOpenUp = spaceBelow < 180 && spaceAbove > spaceBelow;

      const availableHeight = shouldOpenUp ? spaceAbove : spaceBelow;
      const cleanMaxHeight = Math.max(
        160,
        Math.min(maxHeight, Math.max(availableHeight, 160)),
      );

      const top = shouldOpenUp
        ? Math.max(safePadding, rect.top - cleanMaxHeight - gap)
        : Math.min(
            rect.bottom + gap,
            viewportHeight - cleanMaxHeight - safePadding,
          );

      const maxLeft = Math.max(
        safePadding,
        viewportWidth - dropdownWidth - safePadding,
      );

      const left = Math.min(Math.max(safePadding, rect.left), maxLeft);

      setStyle({
        top,
        left,
        width: dropdownWidth,
        maxHeight: cleanMaxHeight,
        shouldOpenUp,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, maxHeight, minWidth, open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef?.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
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
  }, [anchorRef, onClose, open]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      onMouseDownCapture={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className={`sibs-animated-dropdown ${active ? "open" : "closed"} ${
        style.shouldOpenUp ? "sibs-animated-dropdown-up" : ""
      } fixed z-[999999]`}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div className="sibs-animated-dropdown-inner">
        <div
          className={`sibs-animated-dropdown-box overflow-hidden ${EDGE} border border-sibs-border bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]`}
        >
          <div
            className="sibs-scrollbar overflow-y-auto py-2"
            style={{ maxHeight: `${style.maxHeight}px` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function FilterSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  emptyText = "No options available.",
  disabled = false,
}) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedOptions = useMemo(() => {
    return (options || [])
      .map((option) => ({
        raw: option,
        label: getOptionLabel(option),
        value: getOptionValue(option),
      }))
      .filter((option) => option.label && option.value);
  }, [options]);

  const selectedOption = useMemo(() => {
    const cleanValue = getText(value);

    return (
      normalizedOptions.find((option) => option.value === cleanValue) ||
      normalizedOptions.find((option) => option.label === cleanValue) ||
      null
    );
  }, [normalizedOptions, value]);

  const filteredOptions = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) return normalizedOptions;

    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(cleanSearch),
    );
  }, [normalizedOptions, search]);

  function handleSelect(option) {
    onChange?.(option.value, option.raw);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="relative z-[80] min-w-0 overflow-visible">
      <label className="mb-1 block text-sm font-bold text-sibs-navy">
        {label}
      </label>

      <button
        ref={anchorRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          if (disabled || loading) return;
          setOpen((prev) => !prev);
          setSearch("");
        }}
        className={`flex h-11 w-full items-center justify-between ${EDGE} border px-4 text-left text-sm font-bold outline-none transition disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${
          open
            ? "border-sibs-orange bg-white ring-4 ring-sibs-orange/10 text-sibs-navy"
            : "border-sibs-border bg-sibs-surface text-slate-700 hover:border-sibs-orange/30 hover:bg-white focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10"
        }`}
      >
        <span className="min-w-0 truncate">
          {loading ? "Loading..." : selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={17}
          className={`ml-2 shrink-0 text-sibs-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled && !loading}
        anchorRef={anchorRef}
        maxHeight={288}
        onClose={() => setOpen(false)}
      >
        {searchable ? (
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-3 pb-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-muted"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="h-10 w-full rounded-lg border border-sibs-border bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-sibs-muted focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10"
              />
            </div>
          </div>
        ) : null}

        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => {
            const selected = option.value === value || option.label === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  selected
                    ? "bg-sibs-cream-light font-extrabold text-sibs-orange"
                    : "font-semibold text-sibs-text-secondary hover:bg-sibs-cream-subtle hover:text-sibs-orange"
                }`}
              >
                <span className="block truncate">{option.label}</span>
              </button>
            );
          })
        ) : (
          <div className="px-4 py-4 text-sm font-semibold text-sibs-muted">
            {emptyText}
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}
