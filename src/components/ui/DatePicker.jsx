<<<<<<< HEAD
import React, { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import DropdownPortal from "./DropdownPortal.jsx";

const MONTH_LABELS = [
=======
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
>>>>>>> origin/dev
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
<<<<<<< HEAD
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function parseDateKey(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function formatDateValue(value) {
  const parsed = parseDateKey(value);
  if (!parsed) return "";

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

function getCalendarCells(viewDate) {
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const firstCell = new Date(firstDay);
  firstCell.setDate(1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(firstCell);
    cell.setDate(firstCell.getDate() + index);
    return cell;
  });
}

function getYearOptions({ query, viewYear, minYear, maxYear }) {
  const cleanQuery = String(query || "").replace(/\D/g, "").slice(0, 4);

  if (!cleanQuery) {
    const startYear = Math.max(minYear, viewYear - 5);
    const endYear = Math.min(maxYear, startYear + 11);
    const adjustedStart = Math.max(minYear, endYear - 11);

    return Array.from(
      { length: Math.max(endYear - adjustedStart + 1, 0) },
      (_, index) => adjustedStart + index,
    );
  }

  const matches = [];
  for (let year = minYear; year <= maxYear && matches.length < 12; year += 1) {
    if (String(year).startsWith(cleanQuery)) matches.push(year);
  }

  const exactYear = Number(cleanQuery);
  if (
    cleanQuery.length === 4 &&
    Number.isInteger(exactYear) &&
    exactYear >= minYear &&
    exactYear <= maxYear &&
    !matches.includes(exactYear)
  ) {
    matches.unshift(exactYear);
  }

  return matches.slice(0, 12);
}

export default function DatePicker({
  label,
  hideLabel = false,
  labelClassName = "",
  leadingLabel = "",
  value,
  displayValue,
  min,
  max,
  onChange,
  placeholder = "Select date",
  disabled = false,
  required = false,
  clearable = true,
  showToday = true,
  className = "",
  buttonClassName = "",
}) {
  const anchorRef = useRef(null);
  const yearInputRef = useRef(null);
  const selectedDate = parseDateKey(value);
  const minDate = parseDateKey(min);
  const maxDate = parseDateKey(max);
  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate || minDate || today);
  const [yearSearchOpen, setYearSearchOpen] = useState(false);
  const [yearSearch, setYearSearch] = useState("");

  const cells = useMemo(() => getCalendarCells(viewDate), [viewDate]);
  const renderedValue = displayValue || formatDateValue(value);
  const minYear = minDate?.getFullYear() ?? 1900;
  const maxYear = maxDate?.getFullYear() ?? 2100;
  const yearOptions = useMemo(
    () =>
      getYearOptions({
        query: yearSearch,
        viewYear: viewDate.getFullYear(),
        minYear,
        maxYear,
      }),
    [yearSearch, viewDate, minYear, maxYear],
  );

  function isDisabled(date) {
    const key = toDateKey(date);
    return Boolean((min && key < min) || (max && key > max));
  }

  function selectDate(date) {
    if (isDisabled(date)) return;
    onChange?.(toDateKey(date));
    setOpen(false);
  }

  function clearDate() {
=======

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
>>>>>>> origin/dev
    onChange?.("");
    setOpen(false);
  }

<<<<<<< HEAD
  function selectToday() {
    if (isDisabled(today)) return;
    onChange?.(toDateKey(today));
    setViewDate(today);
    setOpen(false);
    setYearSearchOpen(false);
    setYearSearch("");
  }

  function openYearSearch() {
    setYearSearch("");
    setYearSearchOpen(true);

    window.requestAnimationFrame(() => {
      yearInputRef.current?.focus();
    });
  }

  function closeYearSearch() {
    setYearSearchOpen(false);
    setYearSearch("");
  }

  function selectYear(year) {
    const nextYear = Number(year);
    if (!Number.isInteger(nextYear) || nextYear < minYear || nextYear > maxYear) return;

    setViewDate(
      (previous) => new Date(nextYear, previous.getMonth(), 1),
    );
    closeYearSearch();
  }

  function handleYearSearchKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeYearSearch();
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();
    const requestedYear = Number(yearSearch);
    if (String(yearSearch).length === 4) selectYear(requestedYear);
  }

  const triggerClasses = `flex h-8.5 2xl:h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left font-jakarta sibs-text-xs 2xl:sibs-text-sm font-semibold text-sibs-navy shadow-sm outline-none transition-all duration-200 ${
    disabled
      ? "cursor-not-allowed border-sibs-border bg-sibs-canvas text-sibs-faint opacity-70"
      : open
        ? "border-sibs-orange ring-4 ring-sibs-orange/10"
        : "border-slate-300 hover:border-sibs-orange/50 hover:bg-white"
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
        aria-label={label || leadingLabel || placeholder}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setViewDate(selectedDate || minDate || today);
          setYearSearchOpen(false);
          setYearSearch("");
          setOpen((current) => !current);
        }}
        className={triggerClasses}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <CalendarDays size={15} className="shrink-0 text-sibs-orange" />
          {leadingLabel ? (
            <span className="shrink-0 font-extrabold text-sibs-navy">{leadingLabel}</span>
          ) : null}
          <span
            className={`truncate ${
              renderedValue ? "text-sibs-primary-1" : "font-normal text-sibs-faint"
            }`}
          >
            {renderedValue || placeholder}
          </span>
        </span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-sibs-navy transition-transform duration-200 ${
            open ? "rotate-180 text-sibs-orange" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => {
          setOpen(false);
          setYearSearchOpen(false);
          setYearSearch("");
        }}
        width={300}
        matchAnchorWidth={false}
        maxHeight={430}
      >
        <div className="w-full font-jakarta">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-2.5">
            {yearSearchOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Back to calendar"
                  onClick={closeYearSearch}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                >
                  <ChevronLeft size={17} />
                </button>

                <input
                  ref={yearInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={yearSearch}
                  onChange={(event) =>
                    setYearSearch(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  onKeyDown={handleYearSearchKeyDown}
                  placeholder="Search year..."
                  aria-label="Search year"
                  className="mx-2 h-8 min-w-0 flex-1 rounded-lg border border-sibs-orange bg-white px-3 text-center sibs-text-xs font-extrabold text-sibs-navy outline-none ring-2 ring-sibs-orange/10 placeholder:font-semibold placeholder:text-sibs-faint"
                />

                <button
                  type="button"
                  onClick={() => {
                    const requestedYear = Number(yearSearch);
                    if (String(yearSearch).length === 4) selectYear(requestedYear);
                  }}
                  disabled={
                    String(yearSearch).length !== 4 ||
                    Number(yearSearch) < minYear ||
                    Number(yearSearch) > maxYear
                  }
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-2.5 sibs-text-micro font-extrabold text-sibs-orange transition hover:bg-sibs-cream-light disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Go
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() =>
                    setViewDate((previous) =>
                      new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={openYearSearch}
                  title="Click to search year"
                  className="rounded-lg px-3 py-1.5 sibs-text-xs 2xl:sibs-text-sm font-extrabold text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                >
                  {MONTH_LABELS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </button>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setViewDate((previous) =>
                      new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange focus:outline-none focus:ring-2 focus:ring-sibs-orange/20"
                >
                  <ChevronRight size={17} />
                </button>
              </>
            )}
          </div>

          {yearSearchOpen ? (
            <div className="p-3 2xl:p-4">
              <p className="mb-2 sibs-text-micro font-bold text-sibs-muted">
                Type a year, then select it below or press Enter.
              </p>
              {yearOptions.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {yearOptions.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => selectYear(year)}
                      className={`flex h-9 items-center justify-center rounded-lg border sibs-text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-sibs-orange/20 ${
                        year === viewDate.getFullYear()
                          ? "border-sibs-orange bg-sibs-cream-subtle text-sibs-orange"
                          : "border-sibs-border bg-white text-sibs-navy hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-sibs-border px-3 py-6 text-center sibs-text-xs font-semibold text-sibs-muted">
                  No year matches your search.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 2xl:p-4">
              <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="flex h-7 items-center justify-center sibs-text-micro font-extrabold text-[#7B8DB3]"
                >
                  {day}
                </div>
              ))}

              {cells.map((date) => {
                const key = toDateKey(date);
                const currentMonth = date.getMonth() === viewDate.getMonth();
                const selected = Boolean(value && key === value);
                const isToday = key === toDateKey(today);
                const disabledDate = isDisabled(date);

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabledDate}
                    onClick={() => selectDate(date)}
                    className={`flex h-8 items-center justify-center rounded-lg sibs-text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-sibs-orange/20 ${
                      selected
                        ? "bg-sibs-orange text-white shadow-sm"
                        : isToday
                          ? "bg-sibs-cream-subtle font-extrabold text-sibs-orange"
                          : currentMonth
                            ? "text-sibs-navy hover:bg-sibs-cream-light hover:text-sibs-orange"
                            : "text-slate-400 hover:bg-slate-50"
                    } ${
                      disabledDate
                        ? "cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50"
                        : ""
                    }`}
                  >
                    {date.getDate()}
=======
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
>>>>>>> origin/dev
                  </button>
                );
              })}
            </div>

<<<<<<< HEAD
            {(clearable || showToday) && (
              <div className="mt-2 flex items-center justify-between border-t border-[#E6ECF2] pt-2.5">
                {clearable ? (
                  <button
                    type="button"
                    onClick={clearDate}
                    className="rounded-full px-2.5 py-1 sibs-text-micro font-extrabold text-sibs-muted transition hover:bg-sibs-cream-light hover:text-sibs-orange"
=======
            {/* Footer */}
            {(showClear || showToday) && (
              <div className="mt-2.5 flex items-center justify-between border-t border-sibs-border pt-2">
                {showClear ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="font-jakarta text-xs font-bold text-sibs-muted transition hover:text-red-600"
>>>>>>> origin/dev
                  >
                    Clear
                  </button>
                ) : (
<<<<<<< HEAD
                  <span />
                )}
                {showToday ? (
                  <button
                    type="button"
                    disabled={isDisabled(today)}
                    onClick={selectToday}
                    className="rounded-full px-2.5 py-1 sibs-text-micro font-extrabold text-sibs-navy transition hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Today
                  </button>
                ) : null}
              </div>
            )}
            </div>
          )}
        </div>
      </DropdownPortal>
=======
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
>>>>>>> origin/dev
    </div>
  );
}
