import React, { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import DropdownPortal from "./DropdownPortal.jsx";

const MONTH_LABELS = [
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
    onChange?.("");
    setOpen(false);
  }

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
                  </button>
                );
              })}
            </div>

            {(clearable || showToday) && (
              <div className="mt-2 flex items-center justify-between border-t border-[#E6ECF2] pt-2.5">
                {clearable ? (
                  <button
                    type="button"
                    onClick={clearDate}
                    className="rounded-full px-2.5 py-1 sibs-text-micro font-extrabold text-sibs-muted transition hover:bg-sibs-cream-light hover:text-sibs-orange"
                  >
                    Clear
                  </button>
                ) : (
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
    </div>
  );
}
