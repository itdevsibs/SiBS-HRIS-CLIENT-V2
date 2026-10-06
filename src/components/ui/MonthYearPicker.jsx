import React, { useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import DropdownPortal from "./DropdownPortal.jsx";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

function parseMonthValue(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return { year, month };
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthValue(value) {
  const parsed = parseMonthValue(value);
  return parsed ? `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}` : "";
}

export default function MonthYearPicker({
  label,
  hideLabel = false,
  labelClassName = "",
  value,
  onChange,
  placeholder = "Select month and year",
  disabled = false,
  required = false,
  clearable = true,
  showThisMonth = true,
  className = "",
  buttonClassName = "",
}) {
  const anchorRef = useRef(null);
  const parsed = parseMonthValue(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year || new Date().getFullYear());

  function selectMonth(monthIndex) {
    onChange?.(`${viewYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setOpen(false);
  }

  function selectCurrentMonth() {
    const valueNow = currentMonthValue();
    const current = parseMonthValue(valueNow);
    if (current) setViewYear(current.year);
    onChange?.(valueNow);
    setOpen(false);
  }

  const triggerClasses = `flex h-8.5 2xl:h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left font-jakarta sibs-text-xs 2xl:sibs-text-sm font-semibold text-sibs-navy shadow-sm outline-none transition-all duration-200 ${
    disabled
      ? "cursor-not-allowed border-sibs-border bg-sibs-canvas text-sibs-faint opacity-70"
      : open
        ? "border-sibs-orange ring-4 ring-sibs-orange/10"
        : "border-slate-300 hover:border-sibs-orange/50"
  } ${buttonClassName} ${className}`;

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

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label || placeholder}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setViewYear(parsed?.year || new Date().getFullYear());
          setOpen((current) => !current);
        }}
        className={triggerClasses}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={`truncate ${
              value ? "text-sibs-navy" : "font-normal text-sibs-faint"
            }`}
          >
            {formatMonthValue(value) || placeholder}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <CalendarDays
            size={14}
            className={open ? "text-sibs-orange" : "text-sibs-secondary"}
          />
          <ChevronDown
            size={13}
            className={`text-sibs-navy transition-transform ${
              open ? "rotate-180 text-sibs-orange" : ""
            }`}
          />
        </span>
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        width={250}
        matchAnchorWidth={false}
        maxHeight={360}
      >
        <div className="w-full font-jakarta">
          <div className="flex items-center justify-between border-b border-sibs-border px-3 py-2.5">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => setViewYear((year) => year - 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="sibs-text-xs 2xl:sibs-text-sm font-extrabold text-sibs-navy">
              {viewYear}
            </span>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => setViewYear((year) => year + 1)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-3">
            {MONTHS.map((month, index) => {
              const selected = parsed?.year === viewYear && parsed?.month === index + 1;
              return (
                <button
                  key={month}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectMonth(index)}
                  className={`h-10 rounded-lg sibs-text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-sibs-orange/20 ${
                    selected
                      ? "bg-sibs-orange text-white shadow-sm"
                      : "text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>

          {(clearable || showThisMonth) && (
            <div className="flex items-center justify-between border-t border-sibs-border px-3 py-2.5">
              {clearable ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  className="rounded-full px-2.5 py-1 sibs-text-micro font-extrabold text-sibs-muted transition hover:bg-sibs-cream-light hover:text-sibs-orange"
                >
                  Clear
                </button>
              ) : (
                <span />
              )}
              {showThisMonth ? (
                <button
                  type="button"
                  onClick={selectCurrentMonth}
                  className="rounded-full px-2.5 py-1 sibs-text-micro font-extrabold text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange"
                >
                  This month
                </button>
              ) : null}
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
}
