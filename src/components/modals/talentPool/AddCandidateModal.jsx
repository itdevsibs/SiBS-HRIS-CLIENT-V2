import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  UploadCloud,
  UserPlus,
  BriefcaseBusiness,
  GraduationCap,
  ShieldCheck,
  Users,
  Mic,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";

import { textareaClass } from "../../../lib/utils/talentPool/talentPoolHelpers";

import { FieldLabel } from "../../recruitment/talentPool/TalentPoolShared";
import StatusModal from "../StatusModal";

const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif";

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MONTH_OPTIONS = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

const FORM_LABEL_ROW_CLASS = "mb-1 flex min-h-[26px] items-end";
const FORM_LABEL_CLASS =
  "block text-[11px] font-extrabold uppercase leading-[14px] tracking-wide text-[#174A7C]";
const FORM_CONTROL_CLASS =
  "h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-sibs-primary-1 shadow-sm outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10";

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function FormLabel({ children }) {
  return (
    <div className={FORM_LABEL_ROW_CLASS}>
      <label className={FORM_LABEL_CLASS}>{children}</label>
    </div>
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toDateOnly(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMinimumAgeCutoffDate(minAge = 18) {
  const today = new Date();

  return new Date(
    today.getFullYear() - minAge,
    today.getMonth(),
    today.getDate(),
  );
}

function isAfterDateOnly(date, maxDate) {
  const normalizedDate = toDateOnly(date);
  const normalizedMaxDate = toDateOnly(maxDate);

  if (!normalizedDate || !normalizedMaxDate) return false;

  return normalizedDate.getTime() > normalizedMaxDate.getTime();
}

function clampVisibleMonth(monthDate, maxSelectableDate) {
  const date = monthDate instanceof Date ? monthDate : new Date();

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const maxMonthStart = new Date(
    maxSelectableDate.getFullYear(),
    maxSelectableDate.getMonth(),
    1,
  );

  if (monthStart.getTime() > maxMonthStart.getTime()) {
    return maxMonthStart;
  }

  return monthStart;
}

function toDateValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

function parseDateValue(value) {
  const text = cleanText(value);

  if (!text) return null;

  const [year, month, day] = text.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatDisplayDate(value) {
  const date = parseDateValue(value);

  if (!date) return "";

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const blanks = Array.from({ length: firstDay.getDay() }, (_, index) => ({
    id: `blank-${index}`,
    blank: true,
  }));

  const days = Array.from({ length: lastDay.getDate() }, (_, index) => {
    const date = new Date(year, month, index + 1);

    return {
      id: toDateValue(date),
      date,
      blank: false,
    };
  });

  return [...blanks, ...days];
}

function isSameDay(a, b) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getYearOptions(maxSelectableDate) {
  const endYear = maxSelectableDate.getFullYear();
  const startYear = endYear - 80;

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => {
    return endYear - index;
  });
}

function normalizePositionOption(position) {
  if (!position) return null;

  if (typeof position === "string") {
    const title = cleanText(position);

    if (!title) return null;

    return {
      id: title,
      positionKey: title,
      positionId: "",
      positionTitle: title,
      departmentId: "",
      department: "",
      accountId: "",
      accountName: "",
      accountGhlName: "",
      locationSite: "",
      status: "",
    };
  }

  const positionId =
    position.positionId ||
    position.position_id ||
    position.positionCode ||
    position.position_code ||
    position.id ||
    "";

  const positionTitle =
    position.positionTitle ||
    position.position_title ||
    position.title ||
    position.position ||
    position.name ||
    position.label ||
    position.value ||
    "";

  const departmentId =
    position.departmentId ||
    position.department_id ||
    position.gy_dept_id ||
    position.id_department ||
    "";

  const department =
    position.department ||
    position.departmentName ||
    position.department_name ||
    position.name_department ||
    "";

  const accountId =
    position.accountId ||
    position.account_id ||
    position.gy_acc_id ||
    "";

  const accountName =
    position.accountName ||
    position.account_name ||
    position.gy_acc_name ||
    position.account ||
    "";

  const accountGhlName =
    position.accountGhlName ||
    position.account_ghl_name ||
    position.gy_acc_ghl_name ||
    "";

  const locationSite =
    position.locationSite ||
    position.location_site ||
    position.location ||
    position.site ||
    "";

  const status =
    position.status ||
    position.positionStatus ||
    position.position_status ||
    "";

  const finalTitle = cleanText(positionTitle);
  const finalId = cleanText(positionId);

  if (!finalTitle && !finalId) return null;

  return {
    id: cleanText(position.id || finalId || finalTitle),
    positionKey: cleanText(finalId || finalTitle),
    positionId: finalId,
    positionTitle: finalTitle || finalId,
    departmentId: cleanText(departmentId),
    department: cleanText(department),
    accountId: cleanText(accountId),
    accountName: cleanText(accountName),
    accountGhlName: cleanText(accountGhlName),
    locationSite: cleanText(locationSite),
    status: cleanText(status),
  };
}

function getUniquePositionOptions(positions = []) {
  const map = new Map();

  positions.forEach((position) => {
    const normalizedPosition = normalizePositionOption(position);

    if (!normalizedPosition) return;

    const key = cleanText(
      normalizedPosition.positionId || normalizedPosition.positionTitle,
    ).toLowerCase();

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, normalizedPosition);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.positionTitle.localeCompare(b.positionTitle),
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="rounded-2xl bg-sibs-primary-1/10 p-3 text-sibs-primary-1">
            <Icon size={18} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-extrabold text-[#101828]">{title}</h3>

          {description && (
            <p className="mt-1 text-sm font-medium leading-6 text-sibs-tertiary-5">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

function PositionInfoItem({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#174A7C]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function getOptionValue(option) {
  if (typeof option === "string") return option;
  return option?.value || "";
}

function getOptionLabel(option) {
  if (typeof option === "string") return option;
  return option?.label || option?.value || "";
}

function normalizeDropdownOptions(options = []) {
  return toArray(options)
    .map((option) => {
      const value = getOptionValue(option);
      const label = getOptionLabel(option);

      if (!cleanText(value) && !cleanText(label)) return null;

      return {
        id: option?.id || value || label,
        value: value || label,
        label: label || value,
      };
    })
    .filter(Boolean);
}

function HiringNeedsDropdown({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = "Select",
  required = false,
  disabled = false,
  zIndex = "z-[120]",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const normalizedOptions = normalizeDropdownOptions(options);

  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value || ""),
  );

  const displayLabel = selectedOption?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(nextValue) {
    onValueChange(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <FormLabel>
        {label} {required && <RequiredMark />}
      </FormLabel>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
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
            selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
          }`}
        >
          {displayLabel}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-primary-1 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="max-h-72 overflow-y-auto">
            {normalizedOptions.length > 0 ? (
              normalizedOptions.map((option) => {
                const active = String(option.value) === String(value || "");

                return (
                  <button
                    key={option.id || option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#EAF4FF] text-sibs-primary-1"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3.5 text-sm font-semibold text-sibs-tertiary-5">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DateMiniSelect({
  value,
  label,
  options = [],
  onChange,
  className = "",
}) {
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);

  const enabledOptions = options.filter((option) => !option.disabled);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ||
    enabledOptions[0] ||
    options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(option) {
    if (option.disabled) return;

    onChange(option.value);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-sm font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-sibs-primary-1 ring-4 ring-sibs-primary-1/10"
            : "border-[#D0D5DD] hover:border-sibs-primary-1/60"
        } text-sibs-primary-1`}
        title={label}
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label || label}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100000] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.2)]">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={`block w-full px-3 py-2.5 text-left text-sm font-bold transition ${
                    option.disabled
                      ? "cursor-not-allowed bg-[#F8FAFC] text-slate-300"
                      : active
                        ? "bg-sibs-primary-1 text-white"
                        : "bg-white text-[#344054] hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                  }`}
                  title={
                    option.disabled
                      ? "Disabled because applicant would be below 18 years old"
                      : option.label
                  }
                >
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "Select date",
}) {
  const wrapperRef = useRef(null);

  const maxSelectableDate = useMemo(() => getMinimumAgeCutoffDate(18), []);
  const selectedDate = parseDateValue(value);

  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const baseDate = selectedDate || maxSelectableDate;
    return clampVisibleMonth(
      new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
      maxSelectableDate,
    );
  });

  const displayValue = formatDisplayDate(value);

  const yearOptions = useMemo(() => {
    return getYearOptions(maxSelectableDate).map((year) => ({
      value: year,
      label: String(year),
      disabled: year > maxSelectableDate.getFullYear(),
    }));
  }, [maxSelectableDate]);

  const monthOptions = useMemo(() => {
    return MONTH_OPTIONS.map((month) => ({
      ...month,
      disabled:
        visibleMonth.getFullYear() === maxSelectableDate.getFullYear() &&
        month.value > maxSelectableDate.getMonth(),
    }));
  }, [maxSelectableDate, visibleMonth]);

  const canGoNextMonth = useMemo(() => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );

    const maxMonth = new Date(
      maxSelectableDate.getFullYear(),
      maxSelectableDate.getMonth(),
      1,
    );

    return nextMonth.getTime() <= maxMonth.getTime();
  }, [maxSelectableDate, visibleMonth]);

  useEffect(() => {
    if (!open) return;

    if (selectedDate) {
      setVisibleMonth(
        clampVisibleMonth(
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
          maxSelectableDate,
        ),
      );
      return;
    }

    setVisibleMonth(
      clampVisibleMonth(
        new Date(
          maxSelectableDate.getFullYear(),
          maxSelectableDate.getMonth(),
          1,
        ),
        maxSelectableDate,
      ),
    );
  }, [open, value, maxSelectableDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function emitChange(nextValue) {
    onChange?.({
      target: {
        value: nextValue,
      },
    });
  }

  function selectDate(date) {
    if (isAfterDateOnly(date, maxSelectableDate)) return;

    emitChange(toDateValue(date));
    setOpen(false);
  }

  function clearDate() {
    emitChange("");
    setOpen(false);
  }

  function goToPreviousMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    if (!canGoNextMonth) return;

    setVisibleMonth((current) =>
      clampVisibleMonth(
        new Date(current.getFullYear(), current.getMonth() + 1, 1),
        maxSelectableDate,
      ),
    );
  }

  function handleMonthChange(nextMonth) {
    setVisibleMonth((current) =>
      clampVisibleMonth(
        new Date(current.getFullYear(), Number(nextMonth), 1),
        maxSelectableDate,
      ),
    );
  }

  function handleYearChange(nextYear) {
    setVisibleMonth((current) =>
      clampVisibleMonth(
        new Date(Number(nextYear), current.getMonth(), 1),
        maxSelectableDate,
      ),
    );
  }

  const calendarDays = getCalendarDays(visibleMonth);

  return (
    <div
      ref={wrapperRef}
      className={`relative min-w-0 ${open ? "z-[99999]" : "z-[1]"}`}
    >
      <FormLabel>
        {label} {required && <RequiredMark />}
      </FormLabel>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
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
            displayValue ? "text-[#344054]" : "text-sibs-tertiary-5"
          }`}
        >
          {displayValue || placeholder}
        </span>

        <CalendarDays size={18} className="shrink-0 text-sibs-primary-1" />
      </button>

      <input
        tabIndex={-1}
        value={value || ""}
        required={required}
        readOnly
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[99999] w-[360px] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.22)]">
          <div className="border-b border-[#E6ECF2] px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_96px] gap-2">
                <DateMiniSelect
                  label="Month"
                  value={visibleMonth.getMonth()}
                  options={monthOptions}
                  onChange={handleMonthChange}
                />

                <DateMiniSelect
                  label="Year"
                  value={visibleMonth.getFullYear()}
                  options={yearOptions}
                  onChange={handleYearChange}
                />
              </div>

              <button
                type="button"
                disabled={!canGoNextMonth}
                onClick={goToNextMonth}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  canGoNextMonth
                    ? "text-sibs-primary-1 hover:bg-[#F2F6FA]"
                    : "cursor-not-allowed text-slate-300"
                }`}
                title={
                  canGoNextMonth
                    ? "Next month"
                    : "Disabled because applicant would be below 18 years old"
                }
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs font-bold text-sibs-tertiary-5">
              Only applicants who are at least 18 years old can be selected.
            </p>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="flex h-8 items-center justify-center text-[11px] font-extrabold text-sibs-tertiary-5"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((item) => {
                if (item.blank) {
                  return <div key={item.id} className="h-9" />;
                }

                const active = isSameDay(item.date, selectedDate);
                const disabledDay = isAfterDateOnly(
                  item.date,
                  maxSelectableDate,
                );

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => selectDate(item.date)}
                    className={`flex h-9 items-center justify-center rounded-xl text-sm font-bold transition ${
                      disabledDay
                        ? "cursor-not-allowed bg-[#F8FAFC] text-slate-300"
                        : active
                          ? "bg-sibs-primary-1 text-white shadow-sm"
                          : "text-[#344054] hover:bg-[#F2F6FA] hover:text-sibs-primary-1"
                    }`}
                    title={
                      disabledDay
                        ? "Disabled because applicant would be below 18 years old"
                        : toDateValue(item.date)
                    }
                  >
                    {item.date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#E6ECF2] pt-3">
              <button
                type="button"
                onClick={clearDate}
                className="text-xs font-extrabold text-sibs-tertiary-5 transition hover:text-red-600"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => selectDate(maxSelectableDate)}
                className="rounded-xl bg-[#F2F6FA] px-3 py-2 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#EAF4FF]"
              >
                Latest allowed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiCheckGroup({ options = [], value = [], onChange }) {
  const safeValue = Array.isArray(value) ? value : [];

  function toggle(optionValue) {
    if (safeValue.includes(optionValue)) {
      onChange(safeValue.filter((item) => item !== optionValue));
      return;
    }

    onChange([...safeValue, optionValue]);
  }

  if (!options.length) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
        No database options configured.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {options.map((option) => {
        const optionValue = getOptionValue(option);
        const optionLabel = getOptionLabel(option);

        return (
          <label
            key={option?.id || optionValue}
            className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
          >
            <input
              type="checkbox"
              checked={safeValue.includes(optionValue)}
              onChange={() => toggle(optionValue)}
              className="h-4 w-4"
            />

            <span className="text-sm font-semibold text-gray-700">
              {optionLabel}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  required = false,
  disabled = false,
}) {
  return (
    <HiringNeedsDropdown
      label={label}
      value={value}
      options={options}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      onValueChange={(nextValue) =>
        onChange?.({
          target: {
            value: nextValue,
          },
        })
      }
    />
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  extra = "",
}) {
  return (
    <div className={`min-w-0 ${extra}`}>
      <FormLabel>
        {label} {required && <RequiredMark />}
      </FormLabel>

      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={FORM_CONTROL_CLASS}
      />
    </div>
  );
}

function YesNoSelect({ label, value, onChange, options, required = true }) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select answer"
      required={required}
    />
  );
}

function createEmptyExperience(baseExperience) {
  return {
    ...baseExperience,
    id: Date.now(),
    industry: "",
    industryRelevantExperience: "",
    lengthOfWorkExperience: "",
    years: "",
    role: "",
    company: "",
    monthlyCompensation: "",
    reasonForLeaving: "",
    hasOtherExperience: "No",
  };
}

function normalizeExperienceForForm(experience = {}) {
  return {
    ...experience,
    industry:
      experience.industry || experience.industryRelevantExperience || "",
    industryRelevantExperience:
      experience.industryRelevantExperience || experience.industry || "",
    lengthOfWorkExperience: experience.lengthOfWorkExperience || "",
    years: experience.years || "",
    role: experience.role || "",
    company: experience.company || "",
    monthlyCompensation: experience.monthlyCompensation || "",
    reasonForLeaving: experience.reasonForLeaving || "",
    hasOtherExperience: experience.hasOtherExperience || "No",
  };
}

function ExperienceFields({
  experience,
  index,
  title,
  onChange,
  lengthOptions,
  showRemove = false,
  onRemove,
}) {
  const normalizedExperience = normalizeExperienceForForm(experience);

  function updateExperienceField(field, value) {
    const nextExperience = {
      ...normalizedExperience,
      [field]: value,
    };

    if (field === "industryRelevantExperience") {
      nextExperience.industry = value;
    }

    if (field === "industry") {
      nextExperience.industryRelevantExperience = value;
    }

    onChange(index, nextExperience);
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-extrabold text-sibs-primary-1">{title}</h4>

        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
        <TextField
          label="Industry or Relevant Experience"
          value={normalizedExperience.industryRelevantExperience}
          onChange={(event) =>
            updateExperienceField(
              "industryRelevantExperience",
              event.target.value,
            )
          }
          placeholder="Example: BPO, Healthcare, RCM, Finance"
          extra="md:col-span-2"
        />

        <SelectField
          label="Length of Work Experience"
          value={normalizedExperience.lengthOfWorkExperience}
          onChange={(event) =>
            updateExperienceField("lengthOfWorkExperience", event.target.value)
          }
          options={lengthOptions}
          placeholder="Select length"
          required
        />

        <TextField
          label="Years"
          type="number"
          value={normalizedExperience.years}
          onChange={(event) =>
            updateExperienceField("years", event.target.value)
          }
          placeholder="Example: 2"
          required
        />

        <TextField
          label="Role"
          value={normalizedExperience.role}
          onChange={(event) =>
            updateExperienceField("role", event.target.value)
          }
          placeholder="Previous role"
          required
        />

        <TextField
          label="Company"
          value={normalizedExperience.company}
          onChange={(event) =>
            updateExperienceField("company", event.target.value)
          }
          placeholder="Previous company"
          required
        />

        <TextField
          label="Monthly Compensation"
          type="number"
          value={normalizedExperience.monthlyCompensation}
          onChange={(event) =>
            updateExperienceField("monthlyCompensation", event.target.value)
          }
          placeholder="Example: 20000"
          required
        />

        <TextField
          label="Reason for Leaving"
          value={normalizedExperience.reasonForLeaving}
          onChange={(event) =>
            updateExperienceField("reasonForLeaving", event.target.value)
          }
          placeholder="Reason for leaving"
          required
        />
      </div>
    </div>
  );
}

export default function AddCandidateModal() {
  const {
    showAddModal,
    candidateForm,
    setCandidateForm,
    closeAddCandidateModal,
    resetCandidateForm,
    addCandidate,
    handleCandidateFileChange,
    formOptions,
    activePositionOptions,
    emptyExperience,
    isRelevantWorkExperience,
    isSaving,
  } = useTalentPool();

  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  function showStatusModal({ type = "success", title = "", message = "" }) {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function closeStatusModal() {
    setStatusModal((previous) => ({
      ...previous,
      open: false,
    }));
  }

  async function handleSubmitCandidate(event) {
    event.preventDefault();

    try {
      await addCandidate(event);

      showStatusModal({
        type: "success",
        title: "Candidate Saved",
        message: "The candidate profile was saved successfully.",
      });
    } catch (error) {
      console.error("Save candidate error:", error);

      showStatusModal({
        type: "error",
        title: "Save Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save candidate. Please check the required fields and try again.",
      });
    }
  }

  function handleResetCandidate() {
    resetCandidateForm();

    showStatusModal({
      type: "success",
      title: "Form Reset",
      message: "The candidate form has been cleared.",
    });
  }

  if (!showAddModal) {
    return (
      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll
      />
    );
  }

  const safeFormOptions = {
    hearAboutUs: toArray(formOptions?.hearAboutUs),
    locations: toArray(formOptions?.locations),
    workExperience: toArray(formOptions?.workExperience),
    lengthOfExperience: toArray(formOptions?.lengthOfExperience),
    educationalAttainment: toArray(formOptions?.educationalAttainment),
    affiliationCertification: toArray(formOptions?.affiliationCertification),
    yesNo: toArray(formOptions?.yesNo),
    employmentInterest: toArray(formOptions?.employmentInterest),
    audioQuestions: toArray(formOptions?.audioQuestions),
  };

  const positionOptions = getUniquePositionOptions(activePositionOptions);

  const positionDropdownOptions = positionOptions.map((position) => ({
    id: position.positionKey,
    value: position.positionKey,
    label: position.positionTitle,
  }));

  const selectedPosition =
    positionOptions.find(
      (position) =>
        cleanText(position.positionId) &&
        cleanText(position.positionId) ===
          cleanText(candidateForm.openPositionId),
    ) ||
    positionOptions.find(
      (position) =>
        cleanText(position.positionKey) ===
        cleanText(candidateForm.openPosition),
    ) ||
    positionOptions.find(
      (position) =>
        cleanText(position.positionTitle).toLowerCase() ===
        cleanText(candidateForm.openPosition).toLowerCase(),
    ) ||
    null;

  const selectedPositionValue =
    selectedPosition?.positionKey ||
    candidateForm.openPositionId ||
    candidateForm.openPosition ||
    "";

  const hasRelevantExperience = isRelevantWorkExperience(
    candidateForm.workExperience,
  );

  const hasOtherExperience =
    hasRelevantExperience && candidateForm.workExperiences?.length > 1;

  function updateField(field, value) {
    setCandidateForm({
      ...candidateForm,
      [field]: value,
    });
  }

  function handleOpenPositionChange(value) {
    const selected =
      positionOptions.find(
        (position) => cleanText(position.positionKey) === cleanText(value),
      ) ||
      positionOptions.find(
        (position) => cleanText(position.positionTitle) === cleanText(value),
      ) ||
      null;

    setCandidateForm({
      ...candidateForm,
      openPosition: selected?.positionTitle || value,
      openPositionId: selected?.positionId || selected?.positionKey || "",
      appliedPosition: selected?.positionTitle || value,
      positionId: selected?.positionId || selected?.positionKey || "",
      positionDepartmentId: selected?.departmentId || "",
      positionDepartment: selected?.department || "",
      positionAccountId: selected?.accountId || "",
      positionAccountName: selected?.accountName || "",
      positionAccountGhlName: selected?.accountGhlName || "",
      positionLocationSite: selected?.locationSite || "",
      positionStatus: selected?.status || "",
    });
  }

  function updateReference(index, field, value) {
    const references = Array.isArray(candidateForm.references)
      ? candidateForm.references
      : [
          { name: "", phone: "" },
          { name: "", phone: "" },
          { name: "", phone: "" },
        ];

    setCandidateForm({
      ...candidateForm,
      references: references.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    });
  }

  function updateExperience(index, nextExperience) {
    const currentExperiences = Array.isArray(candidateForm.workExperiences)
      ? candidateForm.workExperiences
      : [createEmptyExperience(emptyExperience)];

    setCandidateForm({
      ...candidateForm,
      workExperiences: currentExperiences.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...nextExperience,
              industry:
                nextExperience.industry ||
                nextExperience.industryRelevantExperience ||
                "",
              industryRelevantExperience:
                nextExperience.industryRelevantExperience ||
                nextExperience.industry ||
                "",
            }
          : item,
      ),
    });
  }

  function ensurePrimaryExperience() {
    const currentExperiences = Array.isArray(candidateForm.workExperiences)
      ? candidateForm.workExperiences
      : [];

    if (currentExperiences.length > 0) return currentExperiences;

    return [createEmptyExperience(emptyExperience)];
  }

  function handleWorkExperienceChange(value) {
    setCandidateForm({
      ...candidateForm,
      workExperience: value,
      workExperiences: isRelevantWorkExperience(value)
        ? ensurePrimaryExperience()
        : [{ ...emptyExperience }],
    });
  }

  function addOtherExperience() {
    const currentExperiences = ensurePrimaryExperience();

    setCandidateForm({
      ...candidateForm,
      workExperiences: [
        ...currentExperiences,
        {
          ...createEmptyExperience(emptyExperience),
          id: Date.now(),
          hasOtherExperience: "No",
        },
      ],
    });
  }

  function removeExperience(index) {
    const currentExperiences = ensurePrimaryExperience();

    const nextExperiences = currentExperiences.filter(
      (_, itemIndex) => itemIndex !== index,
    );

    setCandidateForm({
      ...candidateForm,
      workExperiences:
        nextExperiences.length > 0
          ? nextExperiences
          : [createEmptyExperience(emptyExperience)],
    });
  }

  function handleOtherExperienceAnswer(value) {
    const currentExperiences = ensurePrimaryExperience();

    if (value === "Yes") {
      setCandidateForm({
        ...candidateForm,
        workExperiences:
          currentExperiences.length > 1
            ? currentExperiences
            : [
                currentExperiences[0],
                {
                  ...createEmptyExperience(emptyExperience),
                  id: Date.now(),
                },
              ],
      });

      return;
    }

    setCandidateForm({
      ...candidateForm,
      workExperiences: [currentExperiences[0]],
    });
  }

  const references = Array.isArray(candidateForm.references)
    ? candidateForm.references
    : [
        { name: "", phone: "" },
        { name: "", phone: "" },
        { name: "", phone: "" },
      ];

  const workExperiences = ensurePrimaryExperience();

  return (
    <>
      <div
        className="fixed inset-0 z-[10001] flex h-dvh items-center justify-center bg-black/40 px-4 py-4"
        onClick={closeAddCandidateModal}
      >
        <div
          className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-xl font-extrabold text-sibs-primary-1">
                Add Candidate
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Create a reusable Talent Pool candidate profile using database
                options and backend storage.
              </p>
            </div>

            <button
              type="button"
              onClick={closeAddCandidateModal}
              disabled={isSaving}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X size={20} />
            </button>
          </div>

          <form
            id="add-candidate-form"
            onSubmit={handleSubmitCandidate}
            className="flex-1 space-y-5 overflow-y-auto bg-[#F8FAFC] px-5 py-5 sm:px-6"
          >
            <SectionCard
              icon={BriefcaseBusiness}
              title="Application Source and Position"
              description="Tell us where the applicant learned about SiBS and what position they are applying for."
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel>
                    How did the applicant first hear about us? <RequiredMark />
                  </FieldLabel>

                  <MultiCheckGroup
                    options={safeFormOptions.hearAboutUs}
                    value={candidateForm.hearAboutUs}
                    onChange={(value) => updateField("hearAboutUs", value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <HiringNeedsDropdown
                    label="Check our open positions"
                    value={selectedPositionValue}
                    onValueChange={handleOpenPositionChange}
                    options={positionDropdownOptions}
                    placeholder="Select open position"
                    required
                    disabled={isSaving}
                    zIndex="z-[180]"
                  />

                  <TextField
                    label="Nickname"
                    value={candidateForm.nickname}
                    onChange={(event) =>
                      updateField("nickname", event.target.value)
                    }
                    placeholder="Preferred nickname"
                  />

                  <SelectField
                    label="Which location are you applying for?"
                    value={candidateForm.applyingLocation}
                    onChange={(event) =>
                      updateField("applyingLocation", event.target.value)
                    }
                    options={safeFormOptions.locations}
                    placeholder="Select location"
                    required
                  />

                  <TextField
                    label="Who referred you to us?"
                    value={candidateForm.referredBy}
                    onChange={(event) =>
                      updateField("referredBy", event.target.value)
                    }
                    placeholder="Referrer name or N/A"
                    required
                  />

                  <TextField
                    label="Employee ID"
                    value={candidateForm.employeeId}
                    onChange={(event) =>
                      updateField("employeeId", event.target.value)
                    }
                    placeholder="Referrer employee ID or N/A"
                    required
                  />
                </div>

                {!positionOptions.length && (
                  <p className="mt-1 text-xs font-bold text-amber-700">
                    No active positions found from the database.
                  </p>
                )}

                {selectedPosition && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                          Selected Position Details
                        </p>
                        <p className="mt-1 text-sm font-semibold text-sibs-primary-1/80">
                          These details are loaded from Available Positions.
                        </p>
                      </div>

                      {selectedPosition.status && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
                          {selectedPosition.status}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <PositionInfoItem
                        label="Position"
                        value={selectedPosition.positionTitle}
                      />
                      <PositionInfoItem
                        label="Department"
                        value={selectedPosition.department}
                      />
                      <PositionInfoItem
                        label="Account"
                        value={selectedPosition.accountName}
                      />
                      <PositionInfoItem
                        label="Account GHL Name"
                        value={selectedPosition.accountGhlName}
                      />
                      <PositionInfoItem
                        label="Location / Site"
                        value={selectedPosition.locationSite}
                      />
                      <PositionInfoItem
                        label="Position ID"
                        value={selectedPosition.positionId}
                      />
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={UserPlus}
              title="Personal Information"
              description="Enter the applicant legal name, contact details, and address."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <TextField
                  label="First Name"
                  value={candidateForm.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  placeholder="Juan"
                  required
                />

                <TextField
                  label="Last Name"
                  value={candidateForm.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  placeholder="Dela Cruz"
                  required
                />

                <TextField
                  label="Middle Name"
                  value={candidateForm.middleName}
                  onChange={(event) =>
                    updateField("middleName", event.target.value)
                  }
                  placeholder="Santos"
                />

                <TextField
                  label="Suffix"
                  value={candidateForm.suffix}
                  onChange={(event) =>
                    updateField("suffix", event.target.value)
                  }
                  placeholder="Jr., Sr., III"
                />

                <DateField
                  label="Date of Birth"
                  value={candidateForm.dateOfBirth}
                  onChange={(event) =>
                    updateField("dateOfBirth", event.target.value)
                  }
                  placeholder="Select date of birth"
                  required
                />

                <TextField
                  label="Email"
                  type="email"
                  value={candidateForm.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="candidate@email.com"
                  required
                />

                <TextField
                  label="Phone 1"
                  value={candidateForm.phoneNumber1}
                  onChange={(event) =>
                    updateField("phoneNumber1", event.target.value)
                  }
                  placeholder="09xxxxxxxxx"
                />

                <TextField
                  label="Phone 2"
                  value={candidateForm.phoneNumber2}
                  onChange={(event) =>
                    updateField("phoneNumber2", event.target.value)
                  }
                  placeholder="Optional"
                />

                <TextField
                  label="Physical Address"
                  value={candidateForm.physicalAddress}
                  onChange={(event) =>
                    updateField("physicalAddress", event.target.value)
                  }
                  placeholder="Complete physical address"
                  required
                  extra="md:col-span-4"
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={BriefcaseBusiness}
              title="Work Experience"
              description="Additional work experience fields will appear when Has work Experience is selected."
            >
              <div className="space-y-4">
                <SelectField
                  label="Work Experience"
                  value={candidateForm.workExperience}
                  onChange={(event) =>
                    handleWorkExperienceChange(event.target.value)
                  }
                  options={safeFormOptions.workExperience}
                  placeholder="Select work experience"
                  required
                />

                {hasRelevantExperience && (
                  <div className="space-y-4">
                    <ExperienceFields
                      index={0}
                      title="Industry or Relevant Experience"
                      experience={workExperiences[0]}
                      onChange={updateExperience}
                      lengthOptions={safeFormOptions.lengthOfExperience}
                    />

                    <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px] md:items-end">
                        <SelectField
                          label="Do you have other experience?"
                          value={hasOtherExperience ? "Yes" : "No"}
                          onChange={(event) =>
                            handleOtherExperienceAnswer(event.target.value)
                          }
                          options={safeFormOptions.yesNo}
                          placeholder="Select answer"
                        />

                        {hasOtherExperience && (
                          <button
                            type="button"
                            onClick={addOtherExperience}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white transition hover:opacity-90"
                          >
                            <Plus size={16} />
                            Add Other Experience
                          </button>
                        )}
                      </div>
                    </div>

                    {hasOtherExperience &&
                      workExperiences.slice(1).map((experience, itemIndex) => {
                        const actualIndex = itemIndex + 1;

                        return (
                          <ExperienceFields
                            key={experience.id || actualIndex}
                            index={actualIndex}
                            title={`Other Experience ${itemIndex + 1}`}
                            experience={experience}
                            onChange={updateExperience}
                            lengthOptions={safeFormOptions.lengthOfExperience}
                            showRemove
                            onRemove={() => removeExperience(actualIndex)}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              icon={GraduationCap}
              title="Education, Affiliations, and Training"
              description="Select educational attainment and any applicable affiliations or certifications."
            >
              <div className="space-y-5">
                <SelectField
                  label="Highest Educational Attainment"
                  value={candidateForm.educationalAttainment}
                  onChange={(event) =>
                    updateField("educationalAttainment", event.target.value)
                  }
                  options={safeFormOptions.educationalAttainment}
                  placeholder="Select educational attainment"
                  required
                />

                <div>
                  <FieldLabel>Affiliations and Certifications</FieldLabel>

                  <MultiCheckGroup
                    options={safeFormOptions.affiliationCertification}
                    value={candidateForm.affiliations}
                    onChange={(value) => updateField("affiliations", value)}
                  />
                </div>

                <div>
                  <FieldLabel>Training Attended</FieldLabel>

                  <textarea
                    value={candidateForm.trainingAttended || ""}
                    onChange={(event) =>
                      updateField("trainingAttended", event.target.value)
                    }
                    placeholder="List trainings attended"
                    rows={4}
                    className={textareaClass()}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="Work Readiness Questions"
              description="These questions help Talent Acquisition review work setup and compliance readiness."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <YesNoSelect
                  label="Are you fully vaccinated?"
                  value={candidateForm.fullyVaccinated}
                  options={safeFormOptions.yesNo}
                  onChange={(event) =>
                    updateField("fullyVaccinated", event.target.value)
                  }
                />

                <YesNoSelect
                  label="Are you comfortable working on site?"
                  value={candidateForm.comfortableOnSite}
                  options={safeFormOptions.yesNo}
                  onChange={(event) =>
                    updateField("comfortableOnSite", event.target.value)
                  }
                />

                <YesNoSelect
                  label="Are you willing to work in graveyard shift?"
                  value={candidateForm.willingGraveyard}
                  options={safeFormOptions.yesNo}
                  onChange={(event) =>
                    updateField("willingGraveyard", event.target.value)
                  }
                />

                <SelectField
                  label="Full-time, part-time, or either?"
                  value={candidateForm.employmentInterest}
                  onChange={(event) =>
                    updateField("employmentInterest", event.target.value)
                  }
                  options={safeFormOptions.employmentInterest}
                  placeholder="Select employment preference"
                  required
                />

                <div className="md:col-span-2">
                  <YesNoSelect
                    label="If this is a remote position, do you have access to a computer, Internet connection, and a private space to work remotely?"
                    value={candidateForm.remoteWorkAccess}
                    options={safeFormOptions.yesNo}
                    onChange={(event) =>
                      updateField("remoteWorkAccess", event.target.value)
                    }
                  />
                </div>

                <YesNoSelect
                  label="Are you willing to undertake a drug test as part of this hiring process?"
                  value={candidateForm.willingDrugTest}
                  options={safeFormOptions.yesNo}
                  onChange={(event) =>
                    updateField("willingDrugTest", event.target.value)
                  }
                />

                <YesNoSelect
                  label="Are you willing to allow SiBS to undergo a background check as part of this hiring process?"
                  value={candidateForm.willingBackgroundCheck}
                  options={safeFormOptions.yesNo}
                  onChange={(event) =>
                    updateField("willingBackgroundCheck", event.target.value)
                  }
                />
              </div>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="References"
              description="Please list at least three references and their contact information."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {references.map((reference, index) => (
                  <div key={`reference-${index}`} className="contents">
                    <TextField
                      label={`Reference ${index + 1}`}
                      value={reference.name}
                      onChange={(event) =>
                        updateReference(index, "name", event.target.value)
                      }
                      placeholder={`Reference ${index + 1} name`}
                      required
                    />

                    <TextField
                      label="Phone"
                      value={reference.phone}
                      onChange={(event) =>
                        updateReference(index, "phone", event.target.value)
                      }
                      placeholder={`Reference ${index + 1} phone`}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={Mic}
              title="Audio and File Upload"
              description="Optional audio file and one supporting document/file."
            >
              <div className="space-y-5">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-800">
                  <p className="font-extrabold">
                    The audio file may answer these questions:
                  </p>

                  {safeFormOptions.audioQuestions.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {safeFormOptions.audioQuestions.map((question) => (
                        <li key={question.id || getOptionValue(question)}>
                          {getOptionLabel(question)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2">
                      No audio questions configured in the database.
                    </p>
                  )}
                </div>

                <div>
                  <FieldLabel>Upload single audio file</FieldLabel>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-5 py-8 text-center transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5">
                    <Mic size={26} className="text-sibs-primary-1" />

                    <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#101828]">
                      {candidateForm.audioFileName || "Choose audio file"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      Accepted: audio files only
                    </p>

                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(event) =>
                        handleCandidateFileChange(
                          event,
                          "audio",
                          candidateForm,
                          setCandidateForm,
                        )
                      }
                    />
                  </label>
                </div>

                <div>
                  <FieldLabel>Upload supporting file</FieldLabel>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C9D6E4] bg-[#F8FAFC] px-5 py-8 text-center transition hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5">
                    <UploadCloud size={26} className="text-sibs-primary-1" />

                    <p className="mt-2 max-w-full truncate text-sm font-extrabold text-[#101828]">
                      {candidateForm.attachmentFileName || "Choose file"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
                      PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF
                    </p>

                    <input
                      type="file"
                      accept={ACCEPTED_DOCUMENT_TYPES}
                      className="hidden"
                      onChange={(event) =>
                        handleCandidateFileChange(
                          event,
                          "attachment",
                          candidateForm,
                          setCandidateForm,
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Remarks"
              description="Optional internal notes, screening observations, or other details."
            >
              <textarea
                rows={4}
                value={candidateForm.remarks || ""}
                onChange={(event) => updateField("remarks", event.target.value)}
                className={textareaClass()}
                placeholder="Candidate notes, screening observations, or other details."
              />
            </SectionCard>

            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-5">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(candidateForm.consent)}
                  onChange={(event) =>
                    updateField("consent", event.target.checked)
                  }
                  className="mt-1 h-4 w-4"
                />

                <span className="text-sm font-medium leading-6 text-[#344054]">
                  I agree to terms & conditions provided by the company. By
                  providing the candidate phone number, I confirm that the
                  candidate agreed to the collection and use of these details for
                  recruitment processing.
                </span>
              </label>
            </div>
          </form>

          <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleResetCandidate}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-extrabold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="submit"
                form="add-candidate-form"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {isSaving ? "Saving..." : "Save Candidate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
        lockScroll
      />
    </>
  );
}