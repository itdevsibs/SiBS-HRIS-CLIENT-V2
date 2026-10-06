import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseLocalDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const clean = dateString.trim().slice(0, 10);
  const parts = clean.split("-");
  if (parts.length !== 3) {
    const fallback = new Date(dateString);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateString(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  const parsed = parseLocalDate(dateString);
  if (!parsed) return "";
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${month}/${day}/${year}`;
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function DatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  disabled = false,
  readOnly = false,
  min = "",
  max = "",
  buttonClassName = "",
  className = "",
  label = "",
  labelClassName = "",
  hideLabel = false,
  showClear = true,
  showToday = true,
}) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 290 });

  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const selectedDate = useMemo(() => parseLocalDate(value), [value]);
  const today = useMemo(() => new Date(), []);

  const [viewDate, setViewDate] = useState(() => {
    return selectedDate || new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 290;
    const panelHeight = 310;
    const gutter = 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldFlipUp = spaceBelow < panelHeight && rect.top > panelHeight;

    const top = shouldFlipUp
      ? Math.max(gutter, rect.top - panelHeight - 6)
      : rect.bottom + 6;

    const maxLeft = window.innerWidth - panelWidth - gutter;
    const left = Math.max(gutter, Math.min(rect.left, maxLeft));

    setPanelStyle({
      top,
      left,
      width: panelWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      const inTrigger = triggerRef.current?.contains(event.target);
      const inPanel = panelRef.current?.contains(event.target);
      if (!inTrigger && !inPanel) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, updatePosition]);

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(year, month, 1 - startDayOfWeek + i);
      const cellStr = toLocalDateString(cellDate);
      cells.push({
        date: cellDate,
        dateStr: cellStr,
        dayNumber: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === month,
        isSelected: selectedDate ? isSameDay(cellDate, selectedDate) : false,
        isToday: isSameDay(cellDate, today),
      });
    }
    return cells;
  }, [viewDate, selectedDate, today]);

  function handlePrevMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleSelect(cell) {
    onChange?.(cell.dateStr);
    setOpen(false);
  }

  function handleClear() {
    onChange?.("");
    setOpen(false);
  }

  function handleTodayClick() {
    const todayStr = toLocalDateString(today);
    onChange?.(todayStr);
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setOpen(false);
  }

  const isLocked = disabled || readOnly;

  const customClasses = `${buttonClassName || ""} ${className || ""}`;
  const hasCustomHeight = /(?:^|\s)(?:[a-z0-9]+:)*!?(?:h-\S+|min-h-\S+)/.test(customClasses);
  const hasCustomRounded = /(?:^|\s)(?:[a-z0-9]+:)*!?rounded-/.test(customClasses);
  const hasCustomPadding = /(?:^|\s)(?:[a-z0-9]+:)*!?p[xye]?-/.test(customClasses);

  const defaultHeightClass = hasCustomHeight ? "" : "h-11";
  const defaultRoundedClass = hasCustomRounded ? "" : "rounded-xl";
  const defaultPaddingClass = hasCustomPadding ? "" : "px-3.5";

  const displayText = value ? formatDisplayDate(value) : placeholder;

  return (
    <div className="relative w-full min-w-0">
      {label && !hideLabel && (
        <label
          className={
            labelClassName ||
            "mb-1.5 block font-jakarta text-xs font-bold text-sibs-navy"
          }
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={isLocked}
        onClick={() => {
          if (!isLocked) {
            setOpen((prev) => !prev);
          }
        }}
        className={`flex w-full min-w-0 items-center justify-between gap-2 border font-jakarta text-sm font-semibold outline-none transition text-left ${defaultHeightClass} ${defaultRoundedClass} ${defaultPaddingClass} ${
          isLocked
            ? "cursor-not-allowed border-sibs-border-subtle bg-sibs-canvas text-sibs-faint opacity-70"
            : open
              ? "border-sibs-orange bg-white text-sibs-navy ring-2 ring-sibs-orange/10"
              : "border-sibs-border-subtle bg-white text-sibs-navy hover:border-sibs-orange/40"
        } ${buttonClassName || ""} ${className || ""}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays
            size={16}
            className={`shrink-0 ${
              value ? "text-sibs-navy" : "text-sibs-faint"
            }`}
          />
          <span
            className={`truncate ${
              value
                ? "text-sibs-navy font-semibold"
                : "text-sibs-faint font-normal"
            }`}
          >
            {displayText}
          </span>
        </span>

        {!isLocked && (
          <ChevronDown
            size={16}
            className={`shrink-0 text-sibs-navy transition-transform duration-200 ${
              open ? "rotate-180 text-sibs-orange" : ""
            }`}
          />
        )}
      </button>

      {open &&
        !isLocked &&
        createPortal(
          <div
            ref={panelRef}
            className="sibs-dropdown-pop-in fixed z-[999999] w-[290px] rounded-xl border border-sibs-border-subtle bg-white p-3.5 shadow-2xl"
            style={{
              top: `${panelStyle.top}px`,
              left: `${panelStyle.left}px`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-sibs-border pb-2.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-sibs-border-subtle bg-sibs-surface text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
              >
                <ChevronLeft size={15} />
              </button>

              <span className="font-jakarta text-xs font-extrabold text-sibs-navy">
                {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-sibs-border-subtle bg-sibs-surface text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Weekdays */}
            <div className="mt-2.5 grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((dayLabel) => (
                <div
                  key={dayLabel}
                  className="flex h-6 items-center justify-center font-jakarta text-[10px] font-extrabold text-sibs-muted"
                >
                  {dayLabel}
                </div>
              ))}

              {/* Day cells */}
              {calendarCells.map((cell) => {
                let cellClass =
                  "text-sibs-navy hover:bg-sibs-cream-subtle hover:text-sibs-orange";

                if (cell.isSelected) {
                  cellClass =
                    "bg-sibs-orange text-white font-extrabold shadow-xs hover:bg-sibs-orange";
                } else if (cell.isToday) {
                  cellClass =
                    "border border-sibs-orange bg-sibs-cream-light text-sibs-orange font-extrabold";
                } else if (!cell.isCurrentMonth) {
                  cellClass = "text-sibs-faint hover:bg-sibs-surface";
                }

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleSelect(cell)}
                    className={`flex h-7.5 w-7.5 items-center justify-center rounded-lg font-jakarta text-xs font-bold transition mx-auto ${cellClass}`}
                  >
                    {cell.dayNumber}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            {(showClear || showToday) && (
              <div className="mt-2.5 flex items-center justify-between border-t border-sibs-border pt-2">
                {showClear ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="font-jakarta text-xs font-bold text-sibs-muted transition hover:text-red-600"
                  >
                    Clear
                  </button>
                ) : (
                  <div />
                )}

                {showToday && (
                  <button
                    type="button"
                    onClick={handleTodayClick}
                    className="font-jakarta text-xs font-extrabold text-sibs-orange transition hover:opacity-85"
                  >
                    Today
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
