import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  X,
} from "lucide-react";

import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { useUser } from "../../../services/context/UserContext";
import { createHiringNeed } from "../../../lib/axios/getHiringNeeds";
import { getTalentPoolOpenPositions } from "../../../lib/axios/getTalentPool";

const VALID_LOCATION_SITES = ["Davao Site", "Tagum Site", "Mabini Site"];

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1 block text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10 disabled:cursor-not-allowed disabled:border-[#D0D5DD] disabled:bg-[#F2F4F7] disabled:text-[#667085] ${className}`}
    />
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function upperText(value) {
  return cleanText(value).toUpperCase();
}

function stripLeadingSibsId(value) {
  return cleanText(value).replace(/^\d+\s*-\s*/i, "").trim();
}

function normalizeLocationSite(value) {
  const raw = cleanText(value);
  const lower = raw.toLowerCase();

  if (!lower) return "Davao Site";

  if (lower === "davao" || lower === "davao site") return "Davao Site";
  if (lower === "tagum" || lower === "tagum site") return "Tagum Site";
  if (lower === "mabini" || lower === "mabini site") return "Mabini Site";

  return raw;
}

function normalizeDbId(value) {
  if (value === null || value === undefined || value === "") return "";

  const raw = cleanText(value);

  if (!raw) return "";

  const numericValue = Number(raw);

  if (Number.isNaN(numericValue) || numericValue <= 0) return "";

  return String(numericValue);
}

function getJobDescriptionDbId(row = {}) {
  return normalizeDbId(
    row.jobDescriptionDbId ||
      row.job_description_db_id ||
      row.jobDescriptionId ||
      row.job_description_id ||
      row.jdId ||
      row.jd_id ||
      row.jdDbId ||
      row.jd_db_id ||
      row.jdID ||
      row.job_description?.id ||
      row.jobDescription?.id ||
      "",
  );
}

function getJobDescriptionCode(row = {}) {
  return cleanText(
    row.jobDescriptionCode ||
      row.job_description_code ||
      row.jdCode ||
      row.jd_code ||
      row.job_description?.jdCode ||
      row.job_description?.jd_code ||
      row.jobDescription?.jdCode ||
      row.jobDescription?.jd_code ||
      row.code ||
      row.positionCode ||
      row.position_code ||
      row.positionId ||
      row.position_id ||
      "",
  );
}

function getJobDescriptionTitle(row = {}) {
  return cleanText(
    row.jobDescriptionTitle ||
      row.job_description_title ||
      row.jdRoleTitle ||
      row.jd_role_title ||
      row.jdTitle ||
      row.jd_title ||
      row.job_description?.roleTitle ||
      row.job_description?.document_title ||
      row.jobDescription?.roleTitle ||
      row.jobDescription?.document_title ||
      row.positionTitle ||
      row.position_title ||
      row.title ||
      row.name ||
      "",
  );
}

function getUserSibsId(user = {}) {
  return cleanText(
    user.sibsId ||
      user.sibs_id ||
      user.userCode ||
      user.user_code ||
      user.employeeId ||
      user.employee_id ||
      user.empCode ||
      user.emp_code ||
      user.gyEmpCode ||
      user.gy_emp_code ||
      user.sibs_id_creator ||
      user.username ||
      "",
  );
}

function getUserDisplayName(user = {}) {
  const lastName = cleanText(
    user.lastName ||
      user.last_name ||
      user.lastname ||
      user.surname ||
      "",
  );

  const firstName = cleanText(
    user.firstName ||
      user.first_name ||
      user.firstname ||
      user.givenName ||
      user.given_name ||
      "",
  );

  const middleName = cleanText(
    user.middleName ||
      user.middle_name ||
      user.middlename ||
      user.middleInitial ||
      user.middle_initial ||
      "",
  );

  if (lastName || firstName || middleName) {
    return upperText(
      `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
        middleName ? ` ${middleName}` : ""
      }`,
    );
  }

  const fullName = stripLeadingSibsId(
    user.fullName ||
      user.full_name ||
      user.employeeName ||
      user.employee_name ||
      user.name ||
      "",
  );

  if (fullName.includes(",")) {
    return upperText(fullName);
  }

  const nameParts = fullName.split(/\s+/).filter(Boolean);

  if (nameParts.length >= 2) {
    const fallbackLastName = nameParts[nameParts.length - 1];
    const fallbackFirstName = nameParts[0];
    const fallbackMiddleName = nameParts.slice(1, -1).join(" ");

    return upperText(
      `${fallbackLastName}, ${fallbackFirstName}${
        fallbackMiddleName ? ` ${fallbackMiddleName}` : ""
      }`,
    );
  }

  return upperText(fullName || user.username || "SYSTEM USER");
}

function formatPreparedByUser(user = {}) {
  const sibsId = getUserSibsId(user);
  const displayName = getUserDisplayName(user);

  return upperText([sibsId, displayName].filter(Boolean).join(" - "));
}

function formatShortDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return "";

  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const calendarStart = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return date;
  });
}

function isSameDate(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function normalizePosition(row = {}) {
  const positionTitle =
    row.positionTitle ||
    row.position_title ||
    row.title ||
    row.name ||
    "";

  const positionId =
    row.positionId ||
    row.position_id ||
    row.code ||
    row.positionCode ||
    row.position_code ||
    "";

  const accountName =
    row.accountName ||
    row.account_name ||
    row.accountGhlName ||
    row.account_ghl_name ||
    row.account ||
    "";

  const department =
    row.department || row.departmentName || row.department_name || "";

  const departmentAccount = [department, accountName]
    .map(cleanText)
    .filter(Boolean)
    .join(" / ");

  const jobDescriptionDbId = getJobDescriptionDbId(row);
  const jobDescriptionCode = getJobDescriptionCode(row);
  const jobDescriptionTitle = getJobDescriptionTitle(row);

  return {
    raw: row,

    id: row.id || row.openPositionId || row.open_position_id || positionId,
    openPositionDbId: row.id || row.openPositionId || row.open_position_id || "",

    positionId,
    positionTitle,

    department,
    departmentId: row.departmentId || row.department_id || "",
    accountId: row.accountId || row.account_id || "",
    accountName,
    accountGhlName: row.accountGhlName || row.account_ghl_name || "",

    locationSite: normalizeLocationSite(row.locationSite || row.location_site),

    jobDescriptionDbId,
    jobDescriptionId: jobDescriptionDbId,
    jobDescriptionCode,
    jobDescriptionTitle,

    status: row.status || "Active",
    departmentAccount,
    description: row.description || "",
    preferredSkills: row.preferredSkills || row.preferred_skills || "",
    remarks: row.remarks || "",
  };
}

function unwrapOpenPositionsPayload(response) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.positions)) return payload.positions;
  if (Array.isArray(payload?.openPositions)) return payload.openPositions;
  if (Array.isArray(payload?.open_positions)) return payload.open_positions;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.positions)) return payload.data.positions;

  return [];
}

function DropdownPortal({
  open,
  anchorRef,
  children,
  onClose,
  maxHeight = 256,
}) {
  const dropdownRef = useRef(null);
  const [style, setStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect();

      setStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      const clickedAnchor = anchorRef.current?.contains(e.target);
      const clickedDropdown = dropdownRef.current?.contains(e.target);

      if (!clickedAnchor && !clickedDropdown) {
        onClose?.();
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[999999] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        width: `${style.width}px`,
      }}
    >
      <div
        className="overflow-y-auto py-2 sibs-scrollbar"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  optionValue = (option) => option,
  optionLabel = (option) => option,
  optionDescription = null,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(optionValue(option)) === String(value),
  );

  const displayValue = selectedOption ? optionLabel(selectedOption) : placeholder;

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold outline-none transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-sibs-primary-1 bg-white text-[#344054] ring-4 ring-sibs-primary-1/10"
              : "border-[#D0D5DD] bg-white text-[#344054] hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
        }`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-[#344054]" : "text-sibs-tertiary-5"
          }`}
        >
          {displayValue}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
      >
        {options.length > 0 ? (
          options.map((option) => {
            const currentValue = optionValue(option);
            const currentLabel = optionLabel(option);
            const currentDescription = optionDescription
              ? optionDescription(option)
              : "";
            const selected = String(value) === String(currentValue);

            return (
              <button
                key={currentValue || currentLabel}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;

                  onChange(currentValue, option);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-3 text-left text-sm transition ${
                  option.disabled
                    ? "cursor-not-allowed text-sibs-tertiary-5"
                    : selected
                      ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                      : "text-[#344054] hover:bg-[#F8FAFC]"
                }`}
              >
                <span className="block truncate">{currentLabel}</span>

                {currentDescription && (
                  <span className="mt-1 block truncate text-xs font-semibold text-sibs-tertiary-5">
                    {currentDescription}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
            No options available.
          </div>
        )}
      </DropdownPortal>
    </div>
  );
}

function DateDropdown({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedDate = useMemo(() => {
    if (!value) return null;

    const [year, month, day] = String(value).split("-").map(Number);

    if (!year || !month || !day) return null;

    const parsed = new Date(year, month - 1, day);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const today = new Date();

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  function goToPreviousMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function handleSelectDate(date) {
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  function handleTodayClick() {
    const currentDate = new Date();

    onChange(toDateInputValue(currentDate));
    setViewDate(currentDate);
    setOpen(false);
  }

  const monthTitle = viewDate.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const displayValue = value ? formatShortDate(value) : placeholder;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold outline-none transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed border-[#D0D5DD] bg-[#F2F4F7] text-[#667085]"
            : open
              ? "border-sibs-primary-1 bg-white text-[#344054] ring-4 ring-sibs-primary-1/10"
              : "border-[#E6ECF2] bg-white text-[#344054] hover:border-sibs-primary-1/30 hover:bg-slate-50 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays size={17} className="shrink-0 text-sibs-tertiary-5" />

          <span
            className={`truncate ${
              value ? "text-[#344054]" : "text-sibs-tertiary-5"
            }`}
          >
            {displayValue}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-sibs-tertiary-5 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-out ${
          open && !disabled
            ? "mt-2 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`rounded-xl border border-[#D7DEE8] bg-white p-3 shadow-xl transition-all duration-300 ease-out ${
              open && !disabled
                ? "translate-y-0 scale-100"
                : "-translate-y-2 scale-[0.98]"
            }`}
          >
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#E6ECF2] bg-slate-50 px-3 py-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
              >
                <ChevronLeft size={16} />
              </button>

              <p className="text-sm font-extrabold text-sibs-primary-1">
                {monthTitle}
              </p>

              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[10px] font-extrabold uppercase tracking-wide text-sibs-tertiary-5"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((date) => {
                const currentMonth = date.getMonth() === viewDate.getMonth();
                const active = selectedDate && isSameDate(date, selectedDate);
                const isToday = isSameDate(date, today);

                return (
                  <button
                    key={toDateInputValue(date)}
                    type="button"
                    onClick={() => handleSelectDate(date)}
                    className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
                      active
                        ? "bg-sibs-primary-1 text-white shadow-sm"
                        : isToday
                          ? "border border-blue-200 bg-blue-50 text-sibs-primary-1"
                          : currentMonth
                            ? "border border-transparent bg-white text-[#344054] hover:bg-slate-50"
                            : "border border-transparent bg-white text-sibs-tertiary-5/50 hover:bg-slate-50"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#E6ECF2] pt-3">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E6ECF2] bg-white px-3 text-xs font-bold text-sibs-tertiary-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-sibs-primary-1 hover:shadow-sm active:scale-[0.98]"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleTodayClick}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const initialForm = {
  openPositionDbId: "",
  positionId: "",
  positionTitle: "",
  departmentAccount: "",
  accountId: "",
  departmentId: "",
  accountName: "",
  department: "",
  locationSite: "Davao Site",

  jobDescriptionDbId: "",
  jobDescriptionId: "",
  jobDescriptionCode: "",
  jobDescriptionTitle: "",

  headcount: "",
  reasonForHiring: "",
  assignment: "Probationary",
  assignmentOther: "",
  dateNeeded: "",
  preparedBy: "",
  preparedById: "",
  sibsIdManager: "",
  hiringManager: "",
  approvalStatus: "For Approval",
};

export default function AddHiringNeedsModal({ open, onClose, onStatus }) {
  const { user } = useUser();
  const { fetchList, reasonForHiringOptions } = useHiringNeeds();

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPositions, setOpenPositions] = useState([]);
  const [positionLoading, setPositionLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    const sibsId = getUserSibsId(user);
    const hiringManager = getUserDisplayName(user);
    const preparedBy = formatPreparedByUser(user);

    setForm((prev) => ({
      ...prev,
      locationSite: normalizeLocationSite(prev.locationSite),
      preparedBy,
      preparedById: sibsId,
      sibsIdManager: sibsId,
      hiringManager,
    }));
  }, [open, user]);

  useEffect(() => {
    let isActive = true;

    async function loadOpenPositions() {
      if (!open) return;

      setPositionLoading(true);

      try {
        const response = await getTalentPoolOpenPositions({
          page: 1,
          limit: 500,
          status: "Active",
        });

        if (!isActive) return;

        const rows = unwrapOpenPositionsPayload(response)
          .map(normalizePosition)
          .filter((item) => item.positionTitle);

        setOpenPositions(rows);
      } catch (error) {
        if (!isActive) return;

        setOpenPositions([]);

        onStatus?.({
          type: "error",
          title: "Unable to Load Positions",
          message:
            error?.message ||
            "Failed to load positions from talent_pool_open_positions.",
        });
      } finally {
        if (isActive) {
          setPositionLoading(false);
        }
      }
    }

    loadOpenPositions();

    return () => {
      isActive = false;
    };
  }, [open, onStatus]);

  if (!open) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: field === "locationSite" ? normalizeLocationSite(value) : value,
    }));
  }

  function handleReset() {
    const sibsId = getUserSibsId(user);
    const hiringManager = getUserDisplayName(user);
    const preparedBy = formatPreparedByUser(user);

    setForm({
      ...initialForm,
      locationSite: "Davao Site",
      preparedBy,
      preparedById: sibsId,
      sibsIdManager: sibsId,
      hiringManager,
    });
  }

  function handlePositionChange(positionKey, selectedPosition) {
    const position =
      selectedPosition ||
      openPositions.find((item) => String(item.id) === String(positionKey));

    if (!position) {
      handleReset();
      return;
    }

    const jobDescriptionDbId = normalizeDbId(
      position.jobDescriptionDbId || position.jobDescriptionId || "",
    );

    setForm((prev) => ({
      ...prev,

      openPositionDbId: position.openPositionDbId || position.id || "",
      positionId: position.positionId || "",
      positionTitle: position.positionTitle || "",

      department: position.department || "",
      departmentId: position.departmentId || "",
      accountId: position.accountId || "",
      accountName: position.accountName || "",
      departmentAccount: position.departmentAccount || "",

      locationSite: normalizeLocationSite(
        position.locationSite || prev.locationSite || "Davao Site",
      ),

      jobDescriptionDbId,
      jobDescriptionId: jobDescriptionDbId,

      jobDescriptionCode: position.jobDescriptionCode || position.positionId || "",
      jobDescriptionTitle:
        position.jobDescriptionTitle || position.positionTitle || "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.openPositionDbId && !form.positionId && !form.positionTitle) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Position Title is required.",
      });
      return;
    }

    if (!form.headcount || Number(form.headcount) <= 0) {
      onStatus?.({
        type: "error",
        title: "Invalid",
        message: "Headcount must be greater than 0.",
      });
      return;
    }

    if (!form.reasonForHiring) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Reason for Hiring is required.",
      });
      return;
    }

    if (!form.dateNeeded) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Date Needed is required.",
      });
      return;
    }

    if (form.assignment === "Other" && !cleanText(form.assignmentOther)) {
      onStatus?.({
        type: "error",
        title: "Required",
        message: "Please enter other assignment information.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const jobDescriptionDbId = normalizeDbId(
        form.jobDescriptionDbId || form.jobDescriptionId || "",
      );

      const payload = {
        ...form,

        locationSite: normalizeLocationSite(form.locationSite),

        preparedBy: form.preparedBy || formatPreparedByUser(user),
        preparedById: form.preparedById || getUserSibsId(user),
        sibsIdManager: form.sibsIdManager || form.preparedById || getUserSibsId(user),
        sibs_id_manager: form.sibsIdManager || form.preparedById || getUserSibsId(user),
        hiringManager: form.hiringManager || getUserDisplayName(user),
        hiring_manager: form.hiringManager || getUserDisplayName(user),

        jobDescriptionDbId,
        jobDescriptionId: jobDescriptionDbId,
        jobDescriptionCode: form.jobDescriptionCode || form.positionId,
        jobDescriptionTitle: form.jobDescriptionTitle || form.positionTitle,

        departmentAccount:
          form.departmentAccount ||
          [form.department, form.accountName].filter(Boolean).join(" / "),
      };

      const res = await createHiringNeed(payload);

      if (res?.success || res?.id || res?.data?.id) {
        onStatus?.({
          type: "success",
          title: "Submitted",
          message: "Personnel Requisition submitted successfully.",
        });

        fetchList();
        handleReset();
        onClose();
      } else {
        throw new Error(res?.message || "Failed to submit request.");
      }
    } catch (err) {
      onStatus?.({
        type: "error",
        title: "Submission Failed",
        message: err?.message || "Failed to submit personnel requisition.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAssignmentChange(value) {
    setForm((prev) => ({
      ...prev,
      assignment: value,
      assignmentOther: value === "Other" ? prev.assignmentOther : "",
    }));
  }

  const currentLocationSite = normalizeLocationSite(form.locationSite);

  const positionOptions = [
    {
      value: "",
      label: positionLoading ? "Loading positions..." : "Select Position Title",
      description: "",
      disabled: true,
    },
    ...openPositions.map((item) => ({
      value: item.id,
      label: `${item.positionTitle}${
        item.positionId ? ` (${item.positionId})` : ""
      }`,
      description:
        item.departmentAccount ||
        item.locationSite ||
        item.accountName ||
        item.department ||
        "",
      raw: item,
    })),
  ];

  const reasonOptions = [
    {
      value: "",
      label: "Select Reason",
    },
    ...reasonForHiringOptions.map((reason) => ({
      value: reason,
      label: reason,
    })),
  ];

  const assignmentOptions = [
    {
      value: "Probationary",
      label: "Probationary",
    },
    {
      value: "Permanent/Regular",
      label: "Permanent / Regular",
    },
    {
      value: "Other",
      label: "Other",
    },
  ];

  const locationOptions = [
    {
      value: "Davao Site",
      label: "Davao Site",
    },
    {
      value: "Tagum Site",
      label: "Tagum Site",
    },
    {
      value: "Mabini Site",
      label: "Mabini Site",
    },
    ...(currentLocationSite &&
    !VALID_LOCATION_SITES.includes(currentLocationSite)
      ? [
          {
            value: currentLocationSite,
            label: currentLocationSite,
          },
        ]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-dvh items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-[#E6ECF2] bg-gradient-to-r from-[#F8FAFC] via-white to-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1">
                <FileText size={14} />
                New Personnel Request
              </div>

              <h2 className="mt-3 text-2xl font-extrabold text-sibs-primary-1">
                PERSONNEL REQUISITION
              </h2>

              <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-sibs-tertiary-5">
                Select a position from Talent Pool Open Positions. Department,
                account, site, and position reference will auto-populate.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close modal"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6">
          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-1">
              <h3 className="text-base font-extrabold text-[#101828]">
                Request Details
              </h3>

              <p className="text-sm font-medium text-sibs-tertiary-5">
                Fields marked with an asterisk are required.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <FieldLabel required>Position Title</FieldLabel>
                <CustomSelect
                  value={form.openPositionDbId || ""}
                  options={positionOptions}
                  onChange={(value, option) =>
                    handlePositionChange(value, option?.raw)
                  }
                  disabled={positionLoading || isSubmitting}
                  placeholder={
                    positionLoading ? "Loading positions..." : "Select Position"
                  }
                  optionValue={(option) => option.value}
                  optionLabel={(option) => option.label}
                  optionDescription={(option) => option.description}
                />

                {!positionLoading && openPositions.length === 0 && (
                  <p className="mt-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                    No active positions found from talent_pool_open_positions.
                    Please add or activate a position first.
                  </p>
                )}
              </div>

              <div>
                <FieldLabel>Position ID</FieldLabel>
                <TextInput
                  value={form.positionId || ""}
                  readOnly
                  disabled
                  placeholder="Auto-generated from selected position"
                />
              </div>

              <div>
                <FieldLabel required>Department / Account</FieldLabel>
                <TextInput
                  value={form.departmentAccount || ""}
                  readOnly
                  disabled
                  placeholder="Auto-populated after selecting position"
                />
              </div>

              <div>
                <FieldLabel>Department ID</FieldLabel>
                <TextInput
                  value={form.departmentId || ""}
                  readOnly
                  disabled
                  placeholder="Auto-populated"
                />
              </div>

              <div>
                <FieldLabel>Account ID</FieldLabel>
                <TextInput
                  value={form.accountId || ""}
                  readOnly
                  disabled
                  placeholder="Auto-populated"
                />
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>Position Reference</FieldLabel>
                <TextInput
                  value={
                    form.jobDescriptionCode
                      ? `${form.jobDescriptionCode} — ${form.jobDescriptionTitle}`
                      : form.jobDescriptionTitle || ""
                  }
                  readOnly
                  disabled
                  placeholder="Auto-populated after selecting position"
                />
              </div>

              <div>
                <FieldLabel>Job Description ID</FieldLabel>
                <TextInput
                  value={form.jobDescriptionDbId || ""}
                  readOnly
                  disabled
                  placeholder="Auto-populated if position has linked JD"
                />
              </div>

              <div>
                <FieldLabel required>Headcount</FieldLabel>
                <TextInput
                  type="number"
                  min="1"
                  value={form.headcount || ""}
                  onChange={(e) => updateField("headcount", e.target.value)}
                  placeholder="Enter requested headcount"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <FieldLabel required>Reason for Hiring</FieldLabel>
                <CustomSelect
                  value={form.reasonForHiring || ""}
                  options={reasonOptions}
                  onChange={(value) => updateField("reasonForHiring", value)}
                  placeholder="Select Reason"
                  disabled={isSubmitting}
                  optionValue={(option) => option.value}
                  optionLabel={(option) => option.label}
                />
              </div>

              <div>
                <FieldLabel required>Assignment</FieldLabel>
                <CustomSelect
                  value={form.assignment || "Probationary"}
                  options={assignmentOptions}
                  onChange={handleAssignmentChange}
                  placeholder="Select Assignment"
                  disabled={isSubmitting}
                  optionValue={(option) => option.value}
                  optionLabel={(option) => option.label}
                />
              </div>

              <div>
                <FieldLabel required>Location / Site</FieldLabel>
                <CustomSelect
                  value={currentLocationSite}
                  options={locationOptions}
                  onChange={(value) => updateField("locationSite", value)}
                  placeholder="Select Location"
                  disabled={isSubmitting}
                  optionValue={(option) => option.value}
                  optionLabel={(option) => option.label}
                />
              </div>

              {form.assignment === "Other" && (
                <div className="lg:col-span-2">
                  <FieldLabel required>Other Assignment Information</FieldLabel>
                  <TextInput
                    value={form.assignmentOther || ""}
                    onChange={(e) =>
                      updateField("assignmentOther", e.target.value)
                    }
                    placeholder="Enter other assignment information"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  <div>
                    <FieldLabel required>Date Needed</FieldLabel>
                    <DateDropdown
                      value={form.dateNeeded || ""}
                      onChange={(value) => updateField("dateNeeded", value)}
                      placeholder="Select Date Needed"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <FieldLabel required>SIBS ID Manager</FieldLabel>
                    <TextInput
                      value={form.sibsIdManager || form.preparedById || ""}
                      readOnly
                      disabled
                      placeholder="Logged-in SIBS ID"
                    />
                  </div>

                  <div>
                    <FieldLabel required>Hiring Manager</FieldLabel>
                    <TextInput
                      value={form.hiringManager || ""}
                      readOnly
                      disabled
                      placeholder="Logged-in manager name"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <FieldLabel>Approval Status</FieldLabel>
                <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-amber-700">
                      {form.approvalStatus || "For Approval"}
                    </p>

                    <p className="mt-0.5 text-xs font-semibold text-amber-600">
                      This request will be routed for approval after submission.
                    </p>
                  </div>

                  <Clock size={20} className="shrink-0 text-amber-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-sibs-primary-1">
              Approval Notice
            </p>

            <p className="mt-1 text-sm font-semibold leading-6 text-sibs-primary-1/80">
              After submission, this personnel requisition will be marked as
              <span className="font-extrabold"> For Approval</span>. The request
              list will show whether it is Approved or Not Approved with the
              approval date.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Plus size={17} />
              )}
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}