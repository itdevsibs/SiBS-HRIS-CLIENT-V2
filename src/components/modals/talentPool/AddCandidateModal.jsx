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
import StatusModal from "../StatusModal";

const acceptedAudioTypes =
  ".mp3,.wav,.wave,.m4a,.aac,.ogg,.oga,.webm,.mp4,.mpeg,.mpga,.flac,.amr,.3gp,.opus,.aif,.aiff,.caf,.wma,audio/*,video/mp4,video/3gpp";

const acceptedDocumentTypes =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif";

const monthNames = [
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

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const uppercaseCandidateFields = new Set([
  "nickname",
  "referredBy",
  "employeeId",
  "firstName",
  "lastName",
  "middleName",
  "suffix",
  "phoneNumber1",
  "phoneNumber2",
  "physicalAddress",
  "trainingAttended",
  "remarks",
]);

const uppercaseExperienceFields = new Set([
  "industry",
  "industryRelevantExperience",
  "years",
  "role",
  "company",
  "monthlyCompensation",
  "reasonForLeaving",
]);

function cleanText(value) {
  return String(value ?? "").trim();
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUpperText(value) {
  return String(value ?? "").toUpperCase();
}

function normalizeCandidateFieldValue(field, value) {
  if (typeof value !== "string") return value;
  if (!uppercaseCandidateFields.has(field)) return value;
  return normalizeUpperText(value);
}

function normalizeExperienceFieldValue(field, value) {
  if (typeof value !== "string") return value;
  if (!uppercaseExperienceFields.has(field)) return value;
  return normalizeUpperText(value);
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
      const optionValue = getOptionValue(option);
      const optionLabel = getOptionLabel(option);

      if (!cleanText(optionValue) && !cleanText(optionLabel)) return null;

      return {
        id: option?.id || optionValue || optionLabel,
        value: optionValue || optionLabel,
        label: optionLabel || optionValue,
      };
    })
    .filter(Boolean);
}

function getFileExtensionFromName(fileName = "") {
  const name = String(fileName || "");
  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) return "";

  return name.slice(dotIndex).toLowerCase();
}

function formatFileSizeFromBytes(size = 0) {
  const numberSize = Number(size || 0);

  if (!numberSize) return "";

  const sizeInMb = numberSize / (1024 * 1024);

  if (sizeInMb >= 1) return `${sizeInMb.toFixed(2)} MB`;

  return `${Math.max(numberSize / 1024, 1).toFixed(0)} KB`;
}

function getCandidateFileSize(candidateForm = {}, type = "audio") {
  const keys =
    type === "audio"
      ? ["audioFile", "audioFileObject", "audio"]
      : ["attachmentFile", "attachmentFileObject", "attachment"];

  const file = keys.map((key) => candidateForm?.[key]).find(Boolean);

  return file?.size ? formatFileSizeFromBytes(file.size) : "";
}

function getCandidateFileName(candidateForm = {}, type = "audio") {
  if (type === "audio") {
    return (
      candidateForm.audioFileName ||
      candidateForm.audio_file_name ||
      candidateForm.audioName ||
      candidateForm.audio?.name ||
      candidateForm.audioFile?.name ||
      ""
    );
  }

  return (
    candidateForm.attachmentFileName ||
    candidateForm.attachment_file_name ||
    candidateForm.attachmentName ||
    candidateForm.attachment?.name ||
    candidateForm.attachmentFile?.name ||
    ""
  );
}

function inputClass(extra = "", options = {}) {
  const shouldUppercase = options.uppercase !== false;

  return `h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold ${
    shouldUppercase ? "uppercase" : "normal-case"
  } text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-[var(--sibs-primary-1)] focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${extra}`;
}

function textareaInputClass(extra = "") {
  return `w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold uppercase text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-[var(--sibs-primary-1)] focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10 ${extra}`;
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 flex min-h-0 items-end text-xs font-bold uppercase leading-4 tracking-wide text-gray-400 md:min-h-[36px]">
      <span>{children}</span>
    </label>
  );
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        {Icon && (
          <div className="rounded-2xl bg-[var(--sibs-primary-1)]/10 p-3 text-sibs-primary-1">
            <Icon size={18} />
          </div>
        )}

        <div>
          <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>

          {description && (
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function EmptyOptionNotice({ message = "No options configured in database." }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
      {message}
    </div>
  );
}

function HiringNeedsDropdown({
  value,
  onChange,
  options,
  placeholder = "Select option",
  required = true,
  disabled = false,
  zIndex = "z-[90]",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const normalizedOptions = normalizeDropdownOptions(options);
  const selectedOption = normalizedOptions.find(
    (option) => String(option.value) === String(value || ""),
  );

  const displayText = selectedOption?.label || placeholder;

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
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative min-w-0 ${open ? zIndex : "z-[1]"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : "border-gray-200 hover:border-[var(--sibs-primary-1)]"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-gray-800"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-gray-800" : "text-gray-400"
          }`}
        >
          {displayText}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--sibs-primary-1)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {required && (
        <input
          tabIndex={-1}
          value={value || ""}
          onChange={() => {}}
          required
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      )}

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
                        : "bg-white text-gray-700 hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                    }`}
                  >
                    <span className="block min-w-0 truncate">
                      {option.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3.5 text-sm font-semibold text-gray-400">
                No options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DatabaseSelect({
  value,
  onChange,
  options,
  placeholder = "Select option",
  required = true,
  disabled = false,
  zIndex = "z-[90]",
}) {
  return (
    <HiringNeedsDropdown
      required={required}
      value={value}
      disabled={disabled}
      options={options}
      placeholder={placeholder}
      zIndex={zIndex}
      onChange={onChange}
    />
  );
}

function YesNoSelect({ value, onChange, options, required = true }) {
  return (
    <DatabaseSelect
      required={required}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select answer"
    />
  );
}

function CalendarHeaderDropdown({
  value,
  options = [],
  onChange,
  className = "",
  menuClassName = "",
}) {
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  const displayText = selectedOption?.label || "Select";

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
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-xs font-extrabold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : "border-[#D0D5DD] hover:border-[var(--sibs-primary-1)]"
        } text-sibs-primary-1`}
      >
        <span className="min-w-0 flex-1 truncate">{displayText}</span>

        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--sibs-primary-1)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-[100000] overflow-hidden rounded-xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${menuClassName}`}
        >
          <div className="max-h-72 overflow-y-auto">
            {options.map((option) => {
              const active = String(option.value) === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full px-4 py-3.5 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-[#EAF4FF] text-sibs-primary-1"
                      : "bg-white text-gray-700 hover:bg-[#F5F9FF] hover:text-sibs-primary-1"
                  }`}
                >
                  <span className="block min-w-0 truncate">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`;
}

function parseDateInputValue(value) {
  if (!value) return null;

  const parts = String(value).split("-");

  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDateDisplay(value) {
  const date = parseDateInputValue(value);

  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildCalendarDays(displayDate) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = firstDayOfMonth.getDay();

  const calendarStart = new Date(year, month, 1 - startDay);
  const days = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    days.push({
      date,
      dateValue: toDateInputValue(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    });
  }

  return days;
}

function CalendarDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
}) {
  const calendarRef = useRef(null);
  const selectedDate = parseDateInputValue(value);
  const today = new Date();

  const currentYear = today.getFullYear();
  const minimumYear = currentYear - 80;
  const maximumYear = currentYear;

  const monthOptions = useMemo(() => {
    return monthNames.map((month, index) => ({
      value: index,
      label: month,
    }));
  }, []);

  const yearOptions = useMemo(() => {
    const years = [];

    for (let year = maximumYear; year >= minimumYear; year -= 1) {
      years.push({
        value: year,
        label: String(year),
      });
    }

    return years;
  }, [maximumYear, minimumYear]);

  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(
    selectedDate || new Date(currentYear - 18, today.getMonth(), 1),
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(displayDate),
    [displayDate],
  );

  const displayText = value ? formatDateDisplay(value) : placeholder;

  useEffect(() => {
    if (selectedDate) {
      setDisplayDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
      );
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!calendarRef.current) return;

      if (!calendarRef.current.contains(event.target)) {
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

  function goPreviousMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
    );
  }

  function goNextMonth() {
    setDisplayDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
    );
  }

  function handleMonthChange(monthIndex) {
    setDisplayDate(
      (previous) => new Date(previous.getFullYear(), Number(monthIndex), 1),
    );
  }

  function handleYearChange(year) {
    setDisplayDate(
      (previous) => new Date(Number(year), previous.getMonth(), 1),
    );
  }

  function handleSelectDate(date) {
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  function handleToday() {
    onChange(toDateInputValue(today));
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setOpen(false);
  }

  return (
    <div ref={calendarRef} className="relative z-[220] min-w-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-4 text-left text-sm font-bold shadow-sm outline-none transition ${
          open
            ? "border-[var(--sibs-primary-1)] ring-4 ring-[var(--sibs-primary-1)]/10"
            : "border-gray-200 hover:border-[var(--sibs-primary-1)]"
        } ${
          disabled
            ? "cursor-not-allowed bg-gray-50 text-gray-400 opacity-70"
            : "text-gray-800"
        }`}
      >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 truncate">
          <CalendarDays
            size={16}
            className="shrink-0 text-[var(--sibs-primary-1)]"
          />

          <span
            className={`min-w-0 truncate ${
              value ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {displayText}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--sibs-primary-1)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[99999] w-[340px] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-[#E6ECF2] px-4 py-3">
            <button
              type="button"
              onClick={goPreviousMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB]"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-[1fr_96px] gap-2 px-3">
              <CalendarHeaderDropdown
                value={displayDate.getMonth()}
                options={monthOptions}
                onChange={handleMonthChange}
                className="z-[100002]"
                menuClassName="w-[180px]"
              />

              <CalendarHeaderDropdown
                value={displayDate.getFullYear()}
                options={yearOptions}
                onChange={handleYearChange}
                className="z-[100001]"
                menuClassName="w-[120px]"
              />
            </div>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sibs-primary-1 transition hover:bg-[#EAF2FB]"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="grid grid-cols-7 gap-1">
              {weekdayLabels.map((dayLabel) => (
                <div
                  key={dayLabel}
                  className="flex h-8 items-center justify-center text-xs font-extrabold text-[#174A7C]"
                >
                  {dayLabel}
                </div>
              ))}

              {calendarDays.map((day) => {
                const active =
                  selectedDate && isSameDate(day.date, selectedDate);
                const currentDay = isSameDate(day.date, today);

                return (
                  <button
                    key={day.dateValue}
                    type="button"
                    onClick={() => handleSelectDate(day.date)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition ${
                      active
                        ? "bg-[#E7F0FA] text-sibs-primary-1 ring-2 ring-sibs-primary-1/20"
                        : currentDay
                          ? "bg-[#F2F6FA] text-sibs-primary-1"
                          : day.isCurrentMonth
                            ? "text-sibs-primary-1 hover:bg-[#EAF2FB]"
                            : "text-[#98A7BA] hover:bg-[#F7FAFC]"
                    }`}
                  >
                    {day.dayNumber}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E6ECF2] px-5 py-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg px-2 py-1 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F2F6FA]"
            >
              Today
            </button>
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
    return <EmptyOptionNotice />;
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
              className="h-4 w-4 accent-[var(--sibs-primary-1)]"
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

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  extra = "",
  uppercase = true,
}) {
  return (
    <div className={`min-w-0 ${extra}`}>
      <FieldLabel>
        {label} {required && <RequiredMark />}
      </FieldLabel>

      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={inputClass("", { uppercase })}
      />
    </div>
  );
}

function createEmptyExperience(baseExperience = {}) {
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
    const normalizedValue = normalizeExperienceFieldValue(field, value);

    const nextExperience = {
      ...normalizedExperience,
      [field]: normalizedValue,
    };

    if (field === "industryRelevantExperience") {
      nextExperience.industry = normalizedValue;
    }

    if (field === "industry") {
      nextExperience.industryRelevantExperience = normalizedValue;
    }

    onChange(index, nextExperience);
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
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

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel>Industry or Relevant Experience</FieldLabel>
          <input
            value={normalizedExperience.industryRelevantExperience}
            onChange={(event) =>
              updateExperienceField(
                "industryRelevantExperience",
                event.target.value,
              )
            }
            placeholder="Example: BPO, Healthcare, RCM, Finance"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Length of work experience <RequiredMark />
          </FieldLabel>
          <DatabaseSelect
            required
            value={normalizedExperience.lengthOfWorkExperience}
            options={lengthOptions}
            placeholder="Select length"
            onChange={(value) =>
              updateExperienceField("lengthOfWorkExperience", value)
            }
            zIndex="z-[150]"
          />
        </div>

        <div>
          <FieldLabel>
            Years <RequiredMark />
          </FieldLabel>
          <input
            required
            type="number"
            min="0"
            step="0.1"
            value={normalizedExperience.years}
            onChange={(event) => updateExperienceField("years", event.target.value)}
            placeholder="Example: 2"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Role <RequiredMark />
          </FieldLabel>
          <input
            required
            value={normalizedExperience.role}
            onChange={(event) => updateExperienceField("role", event.target.value)}
            placeholder="Previous role"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Company <RequiredMark />
          </FieldLabel>
          <input
            required
            value={normalizedExperience.company}
            onChange={(event) =>
              updateExperienceField("company", event.target.value)
            }
            placeholder="Previous company"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Monthly Compensation <RequiredMark />
          </FieldLabel>
          <input
            required
            type="number"
            min="0"
            value={normalizedExperience.monthlyCompensation}
            onChange={(event) =>
              updateExperienceField("monthlyCompensation", event.target.value)
            }
            placeholder="Example: 20000"
            className={inputClass()}
          />
        </div>

        <div>
          <FieldLabel>
            Reason for leaving <RequiredMark />
          </FieldLabel>
          <input
            required
            value={normalizedExperience.reasonForLeaving}
            onChange={(event) =>
              updateExperienceField("reasonForLeaving", event.target.value)
            }
            placeholder="Reason for leaving"
            className={inputClass()}
          />
        </div>
      </div>
    </div>
  );
}

function PositionInfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-gray-700">
        {value || "—"}
      </p>
    </div>
  );
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
    position.accountId || position.account_id || position.gy_acc_id || "";

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
    position.status || position.positionStatus || position.position_status || "";

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

  const checkRelevantWorkExperience =
    typeof isRelevantWorkExperience === "function"
      ? isRelevantWorkExperience
      : (value) => cleanText(value).toLowerCase().includes("has work");

  const hasRelevantExperience = checkRelevantWorkExperience(
    candidateForm.workExperience,
  );

  const hasOtherExperience =
    hasRelevantExperience && candidateForm.workExperiences?.length > 1;

  const audioFileName = getCandidateFileName(candidateForm, "audio");
  const attachmentFileName = getCandidateFileName(candidateForm, "attachment");
  const audioFileSize = getCandidateFileSize(candidateForm, "audio");
  const attachmentFileSize = getCandidateFileSize(candidateForm, "attachment");

  function updateField(field, value) {
    setCandidateForm({
      ...candidateForm,
      [field]: normalizeCandidateFieldValue(field, value),
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
        itemIndex === index
          ? {
              ...item,
              [field]: normalizeUpperText(value),
            }
          : item,
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
      workExperiences: checkRelevantWorkExperience(value)
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
          className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
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
                  <div>
                    <FieldLabel>
                      Check our open positions <RequiredMark />
                    </FieldLabel>
                    <DatabaseSelect
                      required
                      value={selectedPositionValue}
                      disabled={isSaving || !positionDropdownOptions.length}
                      options={positionDropdownOptions}
                      placeholder={
                        positionDropdownOptions.length
                          ? "Select open position"
                          : "No active positions found"
                      }
                      onChange={handleOpenPositionChange}
                      zIndex="z-[200]"
                    />
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      Only active positions from the database are shown here.
                    </p>
                  </div>

                  <TextField
                    label="Nickname"
                    value={candidateForm.nickname}
                    onChange={(event) =>
                      updateField("nickname", event.target.value)
                    }
                    placeholder="Preferred nickname"
                  />

                  <div>
                    <FieldLabel>
                      Which location are you applying for? <RequiredMark />
                    </FieldLabel>
                    <DatabaseSelect
                      required
                      value={candidateForm.applyingLocation}
                      options={safeFormOptions.locations}
                      placeholder="Select location"
                      onChange={(value) => updateField("applyingLocation", value)}
                      zIndex="z-[190]"
                    />
                  </div>

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
                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
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
                  placeholder="Enter first name"
                  required
                />

                <TextField
                  label="Middle Name"
                  value={candidateForm.middleName}
                  onChange={(event) =>
                    updateField("middleName", event.target.value)
                  }
                  placeholder="Enter middle name"
                />

                <TextField
                  label="Last Name"
                  value={candidateForm.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  placeholder="Enter last name"
                  required
                />

                <TextField
                  label="Suffix"
                  value={candidateForm.suffix}
                  onChange={(event) => updateField("suffix", event.target.value)}
                  placeholder="Jr., Sr., III"
                />

                <div>
                  <FieldLabel>
                    Date of Birth <RequiredMark />
                  </FieldLabel>
                  <CalendarDatePicker
                    value={candidateForm.dateOfBirth}
                    onChange={(value) => updateField("dateOfBirth", value)}
                    placeholder="Select date"
                  />
                </div>

                <TextField
                  label="Email"
                  type="email"
                  value={candidateForm.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Enter email"
                  required
                  uppercase={false}
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
                <div>
                  <FieldLabel>
                    Work experience <RequiredMark />
                  </FieldLabel>
                  <DatabaseSelect
                    required
                    value={candidateForm.workExperience}
                    options={safeFormOptions.workExperience}
                    placeholder="Select work experience"
                    onChange={handleWorkExperienceChange}
                    zIndex="z-[180]"
                  />
                </div>

                {hasRelevantExperience && (
                  <div className="space-y-4">
                    <ExperienceFields
                      index={0}
                      title="Industry or Relevant Experience"
                      experience={workExperiences[0]}
                      onChange={updateExperience}
                      lengthOptions={safeFormOptions.lengthOfExperience}
                    />

                    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px] md:items-end">
                        <div>
                          <FieldLabel>Do you have other experience?</FieldLabel>
                          <YesNoSelect
                            required={false}
                            value={hasOtherExperience ? "Yes" : "No"}
                            options={safeFormOptions.yesNo}
                            onChange={handleOtherExperienceAnswer}
                          />
                        </div>

                        {hasOtherExperience && (
                          <button
                            type="button"
                            onClick={addOtherExperience}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-4 text-sm font-bold text-white transition hover:opacity-90"
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
                <div>
                  <FieldLabel>
                    Highest Educational Attainment <RequiredMark />
                  </FieldLabel>
                  <DatabaseSelect
                    required
                    value={candidateForm.educationalAttainment}
                    options={safeFormOptions.educationalAttainment}
                    placeholder="Select educational attainment"
                    onChange={(value) =>
                      updateField("educationalAttainment", value)
                    }
                    zIndex="z-[170]"
                  />
                </div>

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
                    className={textareaInputClass()}
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
                <div>
                  <FieldLabel>
                    Are you fully vaccinated? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={candidateForm.fullyVaccinated}
                    options={safeFormOptions.yesNo}
                    onChange={(value) => updateField("fullyVaccinated", value)}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you comfortable working on site? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={candidateForm.comfortableOnSite}
                    options={safeFormOptions.yesNo}
                    onChange={(value) => updateField("comfortableOnSite", value)}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to work in graveyard shift? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={candidateForm.willingGraveyard}
                    options={safeFormOptions.yesNo}
                    onChange={(value) => updateField("willingGraveyard", value)}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Full-time, part-time, or either? <RequiredMark />
                  </FieldLabel>
                  <DatabaseSelect
                    required
                    value={candidateForm.employmentInterest}
                    options={safeFormOptions.employmentInterest}
                    placeholder="Select employment preference"
                    onChange={(value) => updateField("employmentInterest", value)}
                    zIndex="z-[160]"
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>
                    If this is a remote position, do you have access to a
                    computer, Internet connection, and a private space to work
                    remotely? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={candidateForm.remoteWorkAccess}
                    options={safeFormOptions.yesNo}
                    onChange={(value) => updateField("remoteWorkAccess", value)}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to undertake a drug test as part of this
                    hiring process? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={candidateForm.willingDrugTest}
                    options={safeFormOptions.yesNo}
                    onChange={(value) => updateField("willingDrugTest", value)}
                  />
                </div>

                <div>
                  <FieldLabel>
                    Are you willing to allow SiBS to undergo a background check
                    as part of this hiring process? <RequiredMark />
                  </FieldLabel>
                  <YesNoSelect
                    value={candidateForm.willingBackgroundCheck}
                    options={safeFormOptions.yesNo}
                    onChange={(value) =>
                      updateField("willingBackgroundCheck", value)
                    }
                  />
                </div>
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
              description="Upload a single audio file and one supporting document/file."
            >
              <div className="space-y-5">
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm font-semibold leading-7 text-amber-800">
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
                  <label
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-8 text-center transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5 ${
                      audioFileName
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <Mic
                      size={26}
                      className={
                        audioFileName ? "text-emerald-700" : "text-sibs-primary-1"
                      }
                    />
                    <p className="mt-2 max-w-full truncate text-sm font-extrabold text-gray-800">
                      {audioFileName || "Choose audio file"}
                    </p>
                    {audioFileName && (
                      <p className="mt-1 text-xs font-bold text-emerald-700">
                        Audio selected
                        {audioFileSize ? ` • ${audioFileSize}` : ""}
                      </p>
                    )}
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      Accepted: MP3, WAV, M4A, AAC, OGG, WEBM, MP4, FLAC,
                      AMR, 3GP, OPUS, AIFF, CAF, WMA
                    </p>
                    <input
                      type="file"
                      accept={acceptedAudioTypes}
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
                  <label
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-8 text-center transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5 ${
                      attachmentFileName
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    <UploadCloud
                      size={26}
                      className={
                        attachmentFileName
                          ? "text-emerald-700"
                          : "text-sibs-primary-1"
                      }
                    />
                    <p className="mt-2 max-w-full truncate text-sm font-extrabold text-gray-800">
                      {attachmentFileName || "Choose file"}
                    </p>
                    {attachmentFileName && (
                      <p className="mt-1 text-xs font-bold text-emerald-700">
                        File selected
                        {attachmentFileSize ? ` • ${attachmentFileSize}` : ""}
                      </p>
                    )}
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF
                    </p>
                    <input
                      type="file"
                      accept={acceptedDocumentTypes}
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
                className={textareaInputClass()}
                placeholder="Candidate notes, screening observations, or other details."
              />
            </SectionCard>

            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(candidateForm.consent)}
                  onChange={(event) =>
                    updateField("consent", event.target.checked)
                  }
                  className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--sibs-primary-1)]"
                />

                <span className="text-sm font-semibold leading-6 text-gray-600">
                  I agree to terms & conditions provided by the company. By
                  providing the candidate phone number, I confirm that the
                  candidate agreed to the collection and use of these details for
                  recruitment processing.
                </span>
              </label>
            </div>
          </form>

          <div className="border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleResetCandidate}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:border-[var(--sibs-primary-1)] hover:bg-[var(--sibs-primary-1)]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="submit"
                form="add-candidate-form"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
