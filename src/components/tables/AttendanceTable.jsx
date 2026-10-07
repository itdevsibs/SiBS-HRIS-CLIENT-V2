import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Check,
  ChevronDown,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  RotateCcw,
  Timer,
  Loader2,
} from "lucide-react";

import { useUser } from "../../services/context/UserContext";
import { getAttendance } from "../../lib/axios/getAttendance";
import {
  usePagination,
  PaginationDateRangeFilter,
} from "@/services/context/PaginationContext";
import { formatDate } from "@/components/layout/FormatDateTime";
import {
  DataCard,
  MetricCard,
  MetricGrid,
  MetricGridSkeleton,
  ResponsiveTableShell,
  SearchInput,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";
import DropdownPortal from "@/components/ui/DropdownPortal.jsx";
import {
  sanitizeDisplayFullName,
  sanitizeMiddleName,
} from "../../lib/utils/employees/employeeNameDisplay.js";
import {
  PAGE_LIMIT,
  LATE_GRACE_MS,
  formatNumber,
  normalizeStatus,
  getNumberValue,
  getValidDate,
  getTimeOnlyParts,
  buildDateTimeFromTrackerDate,
  getHoursBetween,
  getScheduleStart,
  getScheduleEnd,
  isLateBySchedule,
  getBreakHours,
  getComputedWorkHours,
  capWorkHoursFromItem,
  displayCappedWorkHours,
  getLoginIndicator,
  getLogoutIndicator,
  getSiteBadgeClass,
  getAssignedSite,
} from "../../lib/utils/attendance/attendanceHelpers";

const AVATAR_TONES = [
  "border-orange-100 bg-orange-50 text-sibs-orange",
  "border-emerald-100 bg-emerald-50 text-emerald-700",
  "border-blue-100 bg-blue-50 text-sibs-navy",
  "border-pink-100 bg-pink-50 text-pink-700",
  "border-violet-100 bg-violet-50 text-violet-700",
];

function formatEmployeeName(item) {
  const lastName = String(item?.gy_emp_lname || "").trim();
  const firstName = String(item?.gy_emp_fname || "").trim();
  const middleName = sanitizeMiddleName(item?.gy_emp_mname);

  if (lastName || firstName || middleName) {
    return `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
      middleName ? ` ${middleName}` : ""
    }`
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return sanitizeDisplayFullName(item?.gy_emp_fullname).toUpperCase() || "—";
}

function getAttendanceEmployeeDisplayName(item = {}) {
  const cleanFullName = sanitizeDisplayFullName(
    item?.gy_emp_fullname || item?.fullName || item?.name,
  ).trim();

  if (cleanFullName) {
    return cleanFullName.toUpperCase();
  }

  const firstName = String(item?.gy_emp_fname || item?.firstName || "").trim();
  const lastName = String(item?.gy_emp_lname || item?.lastName || "").trim();
  const middleName = sanitizeMiddleName(item?.gy_emp_mname || item?.middleName);

  if (firstName || lastName) {
    return [firstName, middleName, lastName]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return "Unnamed Employee";
}

function getCleanValue(...values) {
  const match = values.find((value) => {
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

  return match === undefined || match === null ? "" : String(match).trim();
}

function getAvatarNameParts(item = {}) {
  return {
    firstName: getCleanValue(
      item.firstName,
      item.first_name,
      item.gy_emp_fname,
    ),
    middleName: sanitizeMiddleName(
      getCleanValue(
        item.middleName,
        item.middle_name,
        item.gy_emp_mname,
      ),
    ),
    lastName: getCleanValue(
      item.lastName,
      item.last_name,
      item.gy_emp_lname,
    ),
  };
}

function getAvatarEmployeeName(item = {}) {
  const { firstName, middleName, lastName } = getAvatarNameParts(item);

  if (firstName || middleName || lastName) {
    const givenNames = [firstName, middleName].filter(Boolean).join(" ");

    return [lastName ? lastName.toUpperCase() : "", givenNames]
      .filter(Boolean)
      .join(lastName && givenNames ? ", " : "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    sanitizeDisplayFullName(
      getCleanValue(
        item.fullName,
        item.full_name,
        item.gy_emp_fullname,
        item.name,
      ),
    ) || "Unnamed Employee"
  );
}

function getEmployeeInitials(item = {}) {
  const { firstName, lastName } = getAvatarNameParts(item);

  if (firstName || lastName) {
    return `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase();
  }

  const tokens = getAvatarEmployeeName(item)
    .replace(",", " ")
    .split(/\s+/)
    .filter(Boolean);

  return `${tokens[0]?.[0] || "E"}${tokens[1]?.[0] || ""}`.toUpperCase();
}

function getAvatarTone(item = {}) {
  const seed = getAvatarEmployeeName(item)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return AVATAR_TONES[seed % AVATAR_TONES.length];
}

function getAttendanceAvatarPreviewPosition(element) {
  if (!element || typeof window === "undefined") return null;

  const rect = element.getBoundingClientRect();
  const previewHeight = 176;
  const gap = 12;
  const placeBelow = rect.top < previewHeight + gap;

  return {
    left: rect.left + rect.width / 2,
    top: placeBelow ? rect.bottom + gap : rect.top - gap,
    placeBelow,
  };
}

function AttendanceEmployeeAvatar({ item, employeeName, className = "h-9 w-9" }) {
  const profilePictureUrl = String(
    item?.profilePictureUrl || item?.profile_picture_url || "",
  ).trim();
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const avatarRef = useRef(null);
  const showImage =
    Boolean(profilePictureUrl) && failedImageUrl !== profilePictureUrl;
  const initials = getEmployeeInitials(item);
  const avatarTone = getAvatarTone(item);

  const showPreview = () => {
    setPreviewPosition(getAttendanceAvatarPreviewPosition(avatarRef.current));
    setPreviewVisible(true);
  };

  const hidePreview = () => {
    setPreviewVisible(false);
  };

  useEffect(() => {
    if (!previewVisible) return undefined;

    const updatePreviewPosition = () => {
      setPreviewPosition(getAttendanceAvatarPreviewPosition(avatarRef.current));
    };

    window.addEventListener("resize", updatePreviewPosition);
    window.addEventListener("scroll", updatePreviewPosition, true);

    return () => {
      window.removeEventListener("resize", updatePreviewPosition);
      window.removeEventListener("scroll", updatePreviewPosition, true);
    };
  }, [previewVisible]);

  const preview =
    previewVisible && previewPosition && typeof document !== "undefined"
      ? createPortal(
          <span
            className="attendance-avatar-preview pointer-events-none fixed z-[9999] rounded-2xl border border-sibs-border bg-white p-2 shadow-[0_18px_45px_rgba(4,44,81,0.22)]"
            style={{
              position: "fixed",
              left: previewPosition.left,
              top: previewPosition.top,
              transform: previewPosition.placeBelow
                ? "translate(-50%, 0)"
                : "translate(-50%, -100%)",
            }}
            aria-hidden="true"
          >
            <span
              className={`relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border text-[24px] font-extrabold ${avatarTone}`}
            >
              <span>{initials}</span>
              {showImage ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setFailedImageUrl(profilePictureUrl)}
                />
              ) : null}
            </span>
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={avatarRef}
        className="relative inline-flex shrink-0 outline-none"
        tabIndex={0}
        aria-label={`${employeeName || "Employee"} profile picture`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
      >
        <span
          className={`relative inline-flex ${className} shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-extrabold shadow-inner ${avatarTone}`}
        >
          <span aria-hidden="true">{initials}</span>
          {showImage ? (
            <img
              src={profilePictureUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setFailedImageUrl(profilePictureUrl)}
            />
          ) : null}
        </span>
      </span>
      {preview}
    </>
  );
}

function normalizeRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getAccessValue(user) {
  return Number(
    user?.admin_access ??
      user?.adminAccess ??
      user?.access ??
      user?.gy_user_access ??
      user?.gyUserAccess ??
      0,
  );
}

function isEmployeeAttendanceSession(user) {
  return normalizeRole(user?.tokenType) === "employee";
}

function getLoggedInSibsId(user) {
  return String(
    user?.username ||
      user?.sibs_id ||
      user?.sibsId ||
      user?.gy_user_code ||
      user?.employeeCode ||
      user?.code ||
      "",
  ).trim();
}

function isOwnAttendanceRow(item, user) {
  const loggedInSibsId = getLoggedInSibsId(user);

  const rowSibsId = String(
    item?.gy_emp_code ||
      item?.sibsId ||
      item?.sibs_id ||
      item?.employeeCode ||
      "",
  ).trim();

  return !!loggedInSibsId && !!rowSibsId && loggedInSibsId === rowSibsId;
}

function isHrAdminUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.includes("hr_admin") || roles.includes("hradmin");
}

function isSuperAdminUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["super_admin", "superadmin", "super_administrator"].includes(role),
  );
}

function isTalentAcquisitionUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    [
      "ta",
      "talent_acquisition",
      "talent_acquisition_admin",
      "ta_admin",
      "recruitment",
      "recruiter",
      "sourcing",
    ].includes(role),
  );
}

function isTeamLeaderUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const access = getAccessValue(user);

  if (access) {
    return access === 8;
  }

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["team_leader", "teamleader", "tl"].includes(role),
  );
}

function isWfmUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const access = getAccessValue(user);

  if (access) {
    return access === 9;
  }

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["wfm", "workforce_management"].includes(role),
  );
}

function isFinanceUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const access = getAccessValue(user);

  if (access) {
    return access === 4;
  }

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    ["finance", "finance_admin", "finance_administrator"].includes(role),
  );
}

function isSomUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const access = getAccessValue(user);

  if (access) {
    return access === 10;
  }

  const roles = [
    user?.role,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.some((role) =>
    [
      "som",
      "senior_operations_manager",
      "senior_operation_manager",
    ].includes(role),
  );
}

function canUseAttendanceFilters(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  return (
    isHrAdminUser(user) ||
    isSuperAdminUser(user) ||
    isTalentAcquisitionUser(user) ||
    isSomUser(user) ||
    isManagerUser(user) ||
    isTeamLeaderUser(user) ||
    isWfmUser(user) ||
    isFinanceUser(user)
  );
}

function isManagerUser(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  const roles = [
    user?.role,
    user?.tokenType,
    user?.userRole,
    user?.accountType,
    user?.user_type,
    user?.gy_user_type,
  ].map(normalizeRole);

  return roles.includes("manager") || getAccessValue(user) === 5;
}

function normalizeDepartmentOption(option) {
  if (typeof option === "string" || typeof option === "number") {
    return {
      label: String(option),
      value: String(option),
    };
  }

  return {
    label:
      option?.label ||
      option?.name_department ||
      option?.departmentName ||
      option?.name ||
      "N/A",
    value: String(
      option?.value ||
        option?.id_department ||
        option?.departmentId ||
        option?.id ||
        "",
    ),
  };
}

function normalizeAccountOption(option) {
  if (typeof option === "string" || typeof option === "number") {
    return {
      label: String(option),
      value: String(option),
    };
  }

  return {
    label: option?.label || option?.account || option?.gy_acc_name || "N/A",
    value: String(option?.value || option?.account || option?.gy_acc_name || ""),
  };
}

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

function getManilaDateParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function formatUtcDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultAttendanceDateRange() {
  const { year, month, day } = getManilaDateParts();
  const today = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = today.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const currentWeekMonday = new Date(today);
  currentWeekMonday.setUTCDate(today.getUTCDate() - daysSinceMonday);

  const previousWeekMonday = new Date(currentWeekMonday);
  previousWeekMonday.setUTCDate(currentWeekMonday.getUTCDate() - 7);

  const currentWeekSunday = new Date(currentWeekMonday);
  currentWeekSunday.setUTCDate(currentWeekMonday.getUTCDate() + 6);

  return {
    dateFrom: formatUtcDateKey(previousWeekMonday),
    dateTo: formatUtcDateKey(currentWeekSunday),
  };
}

function TimeIndicator({ value, label, tone = "neutral" }) {
  const tones = {
    neutral: {
      dot: "bg-slate-400",
      label: "text-slate-500",
    },
    success: {
      dot: "bg-emerald-500",
      label: "text-emerald-600",
    },
    danger: {
      dot: "bg-rose-500",
      label: "text-rose-500",
    },
    warning: {
      dot: "bg-amber-500",
      label: "text-amber-600",
    },
  };

  const selectedTone = tones[tone] || tones.neutral;

  return (
    <div className="flex min-w-[94px] flex-col">
      <span className="text-xs font-extrabold tabular-nums text-sibs-navy">
        {value}
      </span>
      <span
        className={`mt-0.5 inline-flex items-center gap-1 text-[9px] font-extrabold ${selectedTone.label}`}
      >
        <span className={`h-1 w-1 rounded-full ${selectedTone.dot}`} />
        {label}
      </span>
    </div>
  );
}

function AttendanceStatusBadge({ status }) {
  const normalized = String(status || "Pending").trim();

  const tone =
    normalized === "Approved"
      ? {
          wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
          dot: "bg-emerald-500",
        }
      : normalized === "Rejected"
        ? {
            wrap: "border-rose-200 bg-rose-50 text-rose-700",
            dot: "bg-rose-500",
          }
        : {
            wrap: "border-amber-200 bg-amber-50 text-amber-700",
            dot: "bg-amber-500",
          };

  return (
    <span
      className={`inline-flex min-w-[94px] items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${tone.wrap}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {normalized || "Pending"}
    </span>
  );
}

function AttendanceDirectoryFilterDropdown({
  label,
  value,
  values = [],
  options = [],
  onChange,
  multiple = false,
  placeholder = "All",
  searchPlaceholder = "Search...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const anchorRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : [])
        .map((option) => ({
          value: String(option?.value ?? option ?? ""),
          label: String(option?.label ?? option?.value ?? option ?? ""),
        }))
        .filter((option) => option.value && option.label),
    [options],
  );

  const allOption = normalizedOptions.find(
    (option) => option.value === "All",
  );
  const regularOptions = normalizedOptions.filter(
    (option) => option.value !== "All",
  );

  const selectedValues = useMemo(
    () =>
      multiple
        ? [...new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean))]
        : [],
    [multiple, values],
  );

  const selectedLabel = useMemo(() => {
    if (multiple) {
      if (selectedValues.length === 0) {
        return allOption?.label || placeholder;
      }

      if (selectedValues.length === 1) {
        return (
          regularOptions.find(
            (option) => option.value === selectedValues[0],
          )?.label || selectedValues[0]
        );
      }

      return `${selectedValues.length} selected`;
    }

    return (
      normalizedOptions.find(
        (option) => option.value === String(value ?? ""),
      )?.label ||
      (value && value !== "All" ? String(value) : allOption?.label || placeholder)
    );
  }, [
    allOption?.label,
    multiple,
    normalizedOptions,
    placeholder,
    regularOptions,
    selectedValues,
    value,
  ]);

  const filteredOptions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return regularOptions;

    return regularOptions.filter((option) =>
      option.label.toLowerCase().includes(keyword),
    );
  }, [regularOptions, searchQuery]);

  function openMenu() {
    if (disabled) return;
    setOpen(true);
    setSearchQuery("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeMenu() {
    setOpen(false);
    setSearchQuery("");
  }

  function toggleMenu() {
    if (disabled) return;
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }

  function selectValue(nextValue) {
    if (multiple) {
      if (nextValue === "All") {
        onChange?.([]);
        closeMenu();
        return;
      }

      const cleanValue = String(nextValue || "").trim();
      if (!cleanValue) return;

      const nextValues = selectedValues.includes(cleanValue)
        ? selectedValues.filter((item) => item !== cleanValue)
        : [...selectedValues, cleanValue];

      onChange?.(nextValues);
      return;
    }

    onChange?.(nextValue);
    closeMenu();
  }

  const allSelected = multiple
    ? selectedValues.length === 0
    : !value || value === "All";

  return (
    <div ref={anchorRef} className="relative w-full min-w-0 font-jakarta">
      <label className="mb-1 block sibs-text-xs font-bold text-sibs-navy">
        {label}
      </label>

      <div className="group relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label}
          disabled={disabled}
          value={open ? searchQuery : selectedLabel}
          placeholder={open ? searchPlaceholder : placeholder}
          autoComplete="off"
          onFocus={openMenu}
          onClick={openMenu}
          onChange={(event) => {
            if (!open) setOpen(true);
            setSearchQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeMenu();
              inputRef.current?.blur();
            }
          }}
          className={`h-8.5 sm:h-9 2xl:h-10 w-full rounded-[10px] border bg-[#F8FAFC] px-3 pr-10 font-jakarta sibs-text-xs font-bold text-[#042C51] shadow-sm outline-none transition placeholder:text-[#98A2B3] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 ${
            open
              ? "border-[#FF5C28] bg-white ring-4 ring-[#FF5C28]/10"
              : "border-[#E6ECF2] hover:border-[#FF5C28]/40"
          }`}
          style={{ outline: "none", boxShadow: open ? undefined : "none" }}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={`Toggle ${label} dropdown`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleMenu}
          className="absolute right-2 top-1/2 flex h-6.5 w-6.5 2xl:h-7 2xl:w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#667085] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 transition-transform duration-300 ${
              open ? "rotate-180 text-[#FF5C28]" : ""
            }`}
          />
        </button>
      </div>

      <DropdownPortal
        open={open && !disabled}
        anchorRef={anchorRef}
        onClose={closeMenu}
        maxHeight={320}
        offset={6}
        className="!rounded-[10px] !border-[#D7DEE8]"
      >
        <div className="sibs-scrollbar max-h-[320px] overflow-y-auto py-1">
          {allOption ? (
            <button
              type="button"
              role="option"
              aria-selected={allSelected}
              onClick={() => selectValue("All")}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left sibs-text-xs transition ${
                allSelected
                  ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                  : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
              }`}
            >
              <span className="truncate">{allOption.label}</span>
              {!multiple && allSelected ? (
                <Check size={14} className="shrink-0 text-[#FF5C28]" />
              ) : null}
            </button>
          ) : null}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const selected = multiple
                ? selectedValues.includes(option.value)
                : String(value ?? "") === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectValue(option.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left sibs-text-xs transition ${
                    selected
                      ? "bg-[#FFF0EB] font-extrabold text-[#FF5C28]"
                      : "font-semibold text-[#344054] hover:bg-[#FFF7F3] hover:text-[#FF5C28]"
                  }`}
                >
                  {multiple ? (
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-[#FF5C28] bg-[#FF5C28] text-white"
                          : "border-[#D0D5DD] bg-white text-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : null}

                  <span className="block min-w-0 flex-1 truncate">
                    {option.label}
                  </span>

                  {!multiple && selected ? (
                    <Check size={14} className="shrink-0 text-[#FF5C28]" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-4 text-center sibs-text-xs font-semibold text-[#667085]">
              No options found.
            </div>
          )}
        </div>
      </DropdownPortal>
    </div>
  );
}

function InlineDateRangeFilter({ visible }) {
  if (!visible) return null;

  return (
    <div className="attendance-date-filter-inline w-full sm:w-auto">
      <PaginationDateRangeFilter
        entity="attendance"
        visible
        showTopLabels
        className="m-0 w-full"
      />
    </div>
  );
}

export default function AttendanceTable() {
  const [attendance, setAttendance] = useState([]);

  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilters, setAccountFilters] = useState([]);

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);

  const accountFilterKey = useMemo(
    () => accountFilters.join("||"),
    [accountFilters],
  );
  const accountFilterQuery = accountFilters.length
    ? accountFilterKey
    : "All";

  const loadedDepartmentOptionsRef = useRef(false);
  const loadedAccountOptionsKeyRef = useRef("");

  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [searchSubmitVersion, setSearchSubmitVersion] = useState(0);

  const paginationContext = usePagination("attendance");

  const {
    page = 1,
    search = "",
    searchInput = "",
    setSearch,
    setSearchInput,
    loading,
    setLoading,
    setPagination,
    pagination,
    filterValues,
    setPage,
    setCurrentPage,
    handlePageChange,
  } = paginationContext;

  const defaultAttendanceDateRange = useMemo(
    () => getDefaultAttendanceDateRange(),
    [],
  );
  const rawDateFrom = filterValues?.dateFrom || "";
  const rawDateTo = filterValues?.dateTo || "";
  const hasStoredDateRange = Boolean(rawDateFrom || rawDateTo);
  const dateFrom = hasStoredDateRange
    ? rawDateFrom
    : defaultAttendanceDateRange.dateFrom;
  const dateTo = hasStoredDateRange
    ? rawDateTo
    : defaultAttendanceDateRange.dateTo;

  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  const latestRequestIdRef = useRef(0);

  const dragStateRef = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const { user } = useUser();

  const setLoadingRef = useRef(setLoading);
  const setPaginationRef = useRef(setPagination);

  const hrAdminView = isHrAdminUser(user);
  const superAdminView = isSuperAdminUser(user);
  const managerView = isManagerUser(user);
  const talentAcquisitionView = isTalentAcquisitionUser(user);
  const financeView = isFinanceUser(user);

  const attendanceFiltersView = canUseAttendanceFilters(user);
  const attendanceDateRangeView = true;

  const adminView =
    user?.tokenType === "admin" ||
    hrAdminView ||
    superAdminView ||
    managerView ||
    talentAcquisitionView ||
    financeView;

  useEffect(() => {
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
  }, [setLoading, setPagination]);

  // Reset transient Attendance filters whenever the user leaves this page and
  // later returns. The date range always starts again at the approved default:
  // previous week Monday through the current week Sunday.
  useEffect(() => {
    setSearch?.("");
    setSearchInput?.("");
    paginationContext.setDateRange?.(defaultAttendanceDateRange);

    // This intentionally runs once for each AttendanceTable mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safePagination = pagination || {
    currentPage: page || 1,
    totalPages: 1,
    total: null,
    limit: PAGE_LIMIT,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  const currentPage = Number(safePagination.currentPage || page || 1);
  const totalPages = Number(safePagination.totalPages || currentPage || 1);
  const totalRecords =
    safePagination.total === null || safePagination.total === undefined
      ? 0
      : Number(safePagination.total || 0);

  const hasPreviousPage =
    Boolean(safePagination.hasPreviousPage) || currentPage > 1;
  const hasNextPage =
    Boolean(safePagination.hasNextPage) || currentPage < totalPages;

  const departmentDropdownOptions = useMemo(() => {
    return (Array.isArray(departmentOptions) ? departmentOptions : [])
      .map(normalizeDepartmentOption)
      .filter((item) => item.value && item.label);
  }, [departmentOptions]);

  const accountDropdownOptions = useMemo(() => {
    const backendOptions = (Array.isArray(accountOptions) ? accountOptions : [])
      .map(normalizeAccountOption)
      .filter((item) => item.value && item.label);

    const loadedOptions = attendance
      .map((item) => String(item?.gy_emp_account || "").trim())
      .filter(Boolean)
      .map((account) => ({
        label: account,
        value: account,
      }));

    const optionMap = new Map();

    [...backendOptions, ...loadedOptions].forEach((option) => {
      if (!option.value) return;
      optionMap.set(option.value, option);
    });

    return [...optionMap.values()].sort((a, b) =>
      String(a.label).localeCompare(String(b.label)),
    );
  }, [accountOptions, attendance]);

  function goToPage(nextPage) {
    const cleanPage = Math.max(Number(nextPage) || 1, 1);

    if (typeof setPage === "function") {
      setPage(cleanPage);
      return;
    }

    if (typeof setCurrentPage === "function") {
      setCurrentPage(cleanPage);
      return;
    }

    if (typeof handlePageChange === "function") {
      handlePageChange(cleanPage);
      return;
    }

    console.error(
      "Pagination context does not expose setPage, setCurrentPage, or handlePageChange.",
    );
  }

  function goPreviousPage() {
    if (loading || !hasPreviousPage) return;
    goToPage(currentPage - 1);
  }

  function goNextPage() {
    if (loading || !hasNextPage) return;
    goToPage(currentPage + 1);
  }

  function handleAttendanceSearchSubmit() {
    const cleanSearch = String(searchInput || "").trim();

    goToPage(1);

    if (typeof setSearch === "function") {
      setSearch(cleanSearch);
    }

    setSearchSubmitVersion((prev) => prev + 1);
  }

  function handleDepartmentSelect(departmentId) {
    const cleanDepartment = departmentId || "All";

    if (cleanDepartment === departmentFilter) return;

    setDepartmentFilter(cleanDepartment);
    setAccountFilters([]);
    setAccountOptions([]);
    loadedAccountOptionsKeyRef.current = "";

    goToPage(1);
  }

  function handleAccountSelect(nextAccounts) {
    const normalizedAccounts = [
      ...new Set(
        (Array.isArray(nextAccounts) ? nextAccounts : [])
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    ];
    const nextKey = normalizedAccounts.join("||");

    if (nextKey === accountFilterKey) return;

    setAccountFilters(normalizedAccounts);
    goToPage(1);
  }

  function handleAttendanceSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();
    handleAttendanceSearchSubmit();
  }

  const hasCustomDateRange = Boolean(
    dateFrom !== defaultAttendanceDateRange.dateFrom ||
      dateTo !== defaultAttendanceDateRange.dateTo,
  );

  const hasActiveFilters = Boolean(
    String(searchInput || "").trim() ||
    (departmentFilter && departmentFilter !== "All") ||
    accountFilters.length > 0 ||
    hasCustomDateRange
  );

  function handleClearAttendanceFilters() {
    setSearchInput?.("");
    if (typeof setSearch === "function") setSearch("");
    setDepartmentFilter("All");
    setAccountFilters([]);
    const { setDateRange } = paginationContext;
    setDateRange?.(defaultAttendanceDateRange);
    goToPage(1);
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea, [data-no-table-drag='true']",
    );

    if (isInteractiveElement) return;

    const container = tableScrollRef.current;
    if (!container) return;

    dragStateRef.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    setIsDraggingTable(true);
  }

  function handleDragMove(e) {
    const container = tableScrollRef.current;
    const dragState = dragStateRef.current;

    if (!dragState.isDown || !container) return;

    e.preventDefault();

    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragState.startX) * 1.4;

    if (Math.abs(walk) > 4) {
      dragStateRef.current.moved = true;
    }

    container.scrollLeft = dragState.scrollLeft - walk;
  }

  function handleDragEnd() {
    dragStateRef.current.isDown = false;

    window.setTimeout(() => {
      setIsDraggingTable(false);
      dragStateRef.current.moved = false;
    }, 0);
  }

  useEffect(() => {
    if (!attendanceFiltersView) {
      if (departmentFilter !== "All") setDepartmentFilter("All");
      if (accountFilters.length > 0) setAccountFilters([]);

      loadedDepartmentOptionsRef.current = false;
      loadedAccountOptionsKeyRef.current = "";
    }
  }, [attendanceFiltersView, departmentFilter, accountFilterKey, accountFilters.length]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [
    page,
    search,
    searchSubmitVersion,
    dateFrom,
    dateTo,
    departmentFilter,
    accountFilterKey,
  ]);

  useEffect(() => {
    let cancelled = false;
    const requestId = latestRequestIdRef.current + 1;

    latestRequestIdRef.current = requestId;

    const fetchAttendance = async () => {
      try {
        setLoadingRef.current?.(true);

        const accountOptionsKey = `${departmentFilter || "All"}`;

        const shouldLoadDepartmentOptions =
          attendanceFiltersView && !loadedDepartmentOptionsRef.current;

        const shouldLoadAccountOptions =
          attendanceFiltersView &&
          loadedAccountOptionsKeyRef.current !== accountOptionsKey;

        const result = await getAttendance(
          page,
          search,
          attendanceFiltersView ? accountFilterQuery : "All",
          {
            dateFrom,
            dateTo,
            department: attendanceFiltersView ? departmentFilter : "All",
            includeDepartments: shouldLoadDepartmentOptions,
            includeAccounts: shouldLoadAccountOptions,
          },
        );

        if (cancelled || latestRequestIdRef.current !== requestId) return;

        if (!result?.success) {
          setAttendance([]);

          setPaginationRef.current?.({
            currentPage: 1,
            totalPages: 1,
            total: null,
            limit: PAGE_LIMIT,
            hasPreviousPage: false,
            hasNextPage: false,
          });

          return;
        }

        setAttendance(result.data || []);

        if (
          attendanceFiltersView &&
          shouldLoadDepartmentOptions &&
          Array.isArray(result.departmentOptions)
        ) {
          setDepartmentOptions(result.departmentOptions);
          loadedDepartmentOptionsRef.current = true;
        }

        if (
          attendanceFiltersView &&
          shouldLoadAccountOptions &&
          Array.isArray(result.accountOptions)
        ) {
          setAccountOptions(result.accountOptions);
          loadedAccountOptionsKeyRef.current = accountOptionsKey;
        }

        setPaginationRef.current?.(
          result.pagination || {
            currentPage: page,
            totalPages: page,
            total: null,
            limit: PAGE_LIMIT,
            hasPreviousPage: page > 1,
            hasNextPage: false,
          },
        );
      } catch (err) {
        if (cancelled || latestRequestIdRef.current !== requestId) return;

        console.error("Fetch attendance error:", err);

        setAttendance([]);

        setPaginationRef.current?.({
          currentPage: 1,
          totalPages: 1,
          total: null,
          limit: PAGE_LIMIT,
          hasPreviousPage: false,
          hasNextPage: false,
        });
      } finally {
        if (!cancelled && latestRequestIdRef.current === requestId) {
          setLoadingRef.current?.(false);
        }
      }
    };

    fetchAttendance();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    search,
    searchSubmitVersion,
    dateFrom,
    dateTo,
    departmentFilter,
    accountFilterKey,
    accountFilterQuery,
    attendanceFiltersView,
  ]);

  function formatTime(time) {
    if (!time) return "—";

    const parsed = new Date(time);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }


  function renderStatusBadge(status) {
    return <AttendanceStatusBadge status={status} />;
  }

  const pageStats = useMemo(() => {
    const totalLoaded = attendance.length;

    const approvedCount = attendance.filter(
      (item) => item.gy_tracker_status === "Approved",
    ).length;

    const pendingCount = attendance.filter(
      (item) => item.gy_tracker_status !== "Approved",
    ).length;

    const totalWorkHours = attendance.reduce(
      (sum, item) => sum + capWorkHoursFromItem(item),
      0,
    );

    return {
      totalLoaded,
      approvedCount,
      pendingCount,
      totalWorkHours,
    };
  }, [attendance]);

  const emptyColSpan = adminView
    ? attendanceFiltersView
      ? 15
      : 12
    : attendanceFiltersView
      ? 13
      : 10;

  return (
    <div className="space-y-5 sm:space-y-6">
      <style>{`
        @keyframes sibsAttendanceRowReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sibs-attendance-row-reveal {
          animation: sibsAttendanceRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .sibs-attendance-row-reveal {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
      <section
        className="sibs-profile-tab-panel"
        style={getAnimationStyle(60)}
      >
        {loading ? (
          <MetricGridSkeleton
            count={4}
            labels={[
              "Loaded Attendance",
              "Approved",
              "Pending Review",
              "Computed Work Hours",
            ]}
            ariaLabel="Loading attendance metrics"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          />
        ) : (
          <MetricGrid columns={4}>
            <MetricCard
              label="Loaded Attendance"
              value={formatNumber(pageStats.totalLoaded)}
              description="Records loaded on the current page"
              icon={CalendarDays}
              tone="navy"
              delay={0}
            />

            <MetricCard
              label="Approved"
              value={formatNumber(pageStats.approvedCount)}
              description="Ready for payroll processing"
              icon={CircleCheckBig}
              tone="emerald"
              delay={60}
            />

            <MetricCard
              label="Pending Review"
              value={formatNumber(pageStats.pendingCount)}
              description="Awaiting attendance validation"
              icon={CircleX}
              tone="amber"
              delay={120}
            />

            <MetricCard
              label="Computed Work Hours"
              value={`${formatNumber(pageStats.totalWorkHours)} hrs`}
              description="Capped work hours from this page"
              icon={Timer}
              tone="orange"
              delay={180}
            />
          </MetricGrid>
        )}
      </section>

      <section
        className="sibs-profile-tab-panel sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm"
        style={getAnimationStyle(120)}
      >
        <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
          <h3 className="font-heading text-sm sm:text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
            Attendance Records
          </h3>
          <p className="mt-1 sibs-text-xs 2xl:text-sm font-semibold text-sibs-muted">
            {adminView
              ? "Review employee time entries, work hours, breaks, and approval status."
              : "Review your time entries, work hours, breaks, and approval status."}
          </p>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="min-w-0 flex-1 xl:flex-[1_1_220px] 2xl:flex-[1_1_360px]">
              <SearchInput
                label="Search"
                value={searchInput}
                onChange={(e) => setSearchInput?.(typeof e === "string" ? e : e?.target?.value ?? "")}
                onClear={() => {
                  setSearchInput?.("");
                  if (typeof setSearch === "function") setSearch("");
                  goToPage(1);
                }}
                onKeyDown={handleAttendanceSearchKeyDown}
                placeholder={
                  adminView
                    ? "Search by employee, SIBS ID, department, or account..."
                    : "Search attendance records..."
                }
                ariaLabel="Search attendance"
                disabled={loading}
                className="w-full"
              />
            </div>

            {attendanceFiltersView ? (
              <>
                <div className="w-full sm:w-48 xl:w-[170px] 2xl:w-[200px] xl:flex-none">
                  <AttendanceDirectoryFilterDropdown
                    label="Department"
                    value={departmentFilter || "All"}
                    onChange={handleDepartmentSelect}
                    options={[
                      { value: "All", label: "All Departments" },
                      ...departmentDropdownOptions,
                    ]}
                    placeholder="All Departments"
                    searchPlaceholder="Search departments..."
                    disabled={loading}
                  />
                </div>

                <div className="w-full sm:w-48 xl:w-[170px] 2xl:w-[200px] xl:flex-none">
                  <AttendanceDirectoryFilterDropdown
                    label="Account"
                    multiple
                    values={accountFilters}
                    onChange={handleAccountSelect}
                    options={[
                      { value: "All", label: "All Accounts" },
                      ...accountDropdownOptions,
                    ]}
                    placeholder="All Accounts"
                    searchPlaceholder="Search accounts..."
                    disabled={loading}
                  />
                </div>
              </>
            ) : null}

            <div className="w-full xl:w-auto xl:flex-none">
              <InlineDateRangeFilter visible={attendanceDateRangeView} />
            </div>

            {hasActiveFilters && (
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleClearAttendanceFilters}
                  disabled={loading}
                  className="inline-flex h-8.5 2xl:h-10 w-full xl:w-auto items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Clear
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAttendanceSearchSubmit}
            disabled={loading}
            className="mt-3 sibs-btn-primary !h-10 w-full text-xs font-extrabold lg:hidden"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Search size={15} />
            )}
            Apply Search
          </button>
        </div>

        <div className="p-3 sm:p-5 2xl:p-6">
          <ResponsiveTableShell
            desktopContent={
              <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
            <div
              ref={tableScrollRef}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              className={`max-h-[480px] 2xl:max-h-[640px] select-none overflow-auto sibs-scrollbar ${
                isDraggingTable ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <table className="w-full min-w-[1510px] border-collapse bg-white text-left">
                <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                  <tr className="sibs-data-table-head-row">
                      {adminView ? (
                        <th className="sibs-data-table-th">
                          SIBS ID
                        </th>
                      ) : null}

                      {adminView ? (
                        <th className="sibs-data-table-th min-w-[190px]">
                          Employee Name
                        </th>
                      ) : null}

                      {attendanceFiltersView ? (
                        <th className="sibs-data-table-th min-w-[170px]">
                          Department
                        </th>
                      ) : null}

                      {attendanceFiltersView ? (
                        <th className="sibs-data-table-th min-w-[145px]">
                          Account
                        </th>
                      ) : null}

                      {attendanceFiltersView ? (
                        <th className="sibs-data-table-th">
                          Site
                        </th>
                      ) : null}

                      <th className="sibs-data-table-th">
                        Tracker Date
                      </th>
                      <th className="sibs-data-table-th">
                        Login (In)
                      </th>
                      <th className="sibs-data-table-th">
                        Start Break
                      </th>
                      <th className="sibs-data-table-th">
                        End Break
                      </th>
                      <th className="sibs-data-table-th">
                        Logout (Out)
                      </th>
                      <th className="sibs-data-table-th px-3 text-center">
                        WH
                      </th>
                      <th className="sibs-data-table-th px-3 text-center">
                        BH
                      </th>
                      <th className="sibs-data-table-th px-3 text-center">
                        OT
                      </th>
                      <th className="sibs-data-table-th px-3 text-center">
                        ATH
                      </th>
                      <th className="sibs-data-table-th text-center">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    key={`${page}-${search}-${searchSubmitVersion}-${dateFrom}-${dateTo}-${departmentFilter}-${accountFilterKey}-${loading}`}
                    className="divide-y divide-sibs-border"
                  >
                    {loading ? (
                      <TableSkeletonRows
                        count={PAGE_LIMIT}
                        columns={emptyColSpan}
                        cellClassName="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle"
                      />
                    ) : attendance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={emptyColSpan}
                          className="px-5 py-12 text-center sibs-text-xs font-bold text-sibs-muted"
                        >
                          No attendance records found.
                        </td>
                      </tr>
                    ) : (
                      attendance.map((item, index) => {
                        const loginTime = formatTime(item.gy_tracker_login);
                        const breakoutTime = formatTime(item.gy_tracker_breakout);
                        const breakinTime = formatTime(item.gy_tracker_breakin);
                        const logoutTime = formatTime(item.gy_tracker_logout);
                        const employeeName = formatEmployeeName(item);
                        const site = getAssignedSite(item);
                        const loginIndicator = getLoginIndicator(item);
                        const managerOwnRowCompleted =
                          managerView &&
                          isOwnAttendanceRow(item, user) &&
                          getComputedWorkHours(item) >= 8;
                        const logoutIndicator = managerOwnRowCompleted
                          ? { label: "Full shift", tone: "success" }
                          : getLogoutIndicator(item);
                        const ot = getNumberValue(item.gy_tracker_ot);
                        const ath = getNumberValue(item.gy_tracker_ath);

                        return (
                          <tr
                            key={`${
                              item.gy_tracker_id || item.gy_tracker_date || "row"
                            }-${index}`}
                            className="sibs-data-table-row sibs-attendance-row-reveal hover:bg-sibs-cream-light transition-colors"
                            style={{
                              animationDelay: `${Math.min(index, 10) * 36}ms`,
                            }}
                          >
                            {adminView ? (
                              <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-extrabold tabular-nums text-sibs-orange">
                                {item.gy_emp_code || "—"}
                              </td>
                            ) : null}

                            {adminView ? (
                              <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <AttendanceEmployeeAvatar
                                    item={item}
                                    employeeName={employeeName}
                                  />
                                  <p className="max-w-[190px] min-w-0 break-words sibs-text-xs font-extrabold leading-tight text-sibs-navy">
                                    {employeeName}
                                  </p>
                                </div>
                              </td>
                            ) : null}

                            {attendanceFiltersView ? (
                              <td
                                className="max-w-[190px] truncate px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-sibs-secondary"
                                title={item.department || "—"}
                              >
                                {item.department || "—"}
                              </td>
                            ) : null}

                            {attendanceFiltersView ? (
                              <td
                                className="max-w-[160px] truncate px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-sibs-secondary"
                                title={item.gy_emp_account || "—"}
                              >
                                {item.gy_emp_account || "—"}
                              </td>
                            ) : null}

                            {attendanceFiltersView ? (
                              <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5">
                                <span
                                  className={`inline-flex rounded-md border px-2 py-0.5 sibs-text-micro font-extrabold uppercase ${getSiteBadgeClass(
                                    site,
                                  )}`}
                                >
                                  {site}
                                </span>
                              </td>
                            ) : null}

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-sibs-secondary">
                              {formatDate(item.gy_tracker_date)}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5">
                              <TimeIndicator
                                value={loginTime}
                                label={loginIndicator.label}
                                tone={loginIndicator.tone}
                              />
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-extrabold tabular-nums text-sibs-muted">
                              {breakoutTime}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-extrabold tabular-nums text-sibs-muted">
                              {breakinTime}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5">
                              <TimeIndicator
                                value={logoutTime}
                                label={logoutIndicator.label}
                                tone={logoutIndicator.tone}
                              />
                            </td>

                            <td className="bg-slate-50/60 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-extrabold tabular-nums text-sibs-navy">
                              {displayCappedWorkHours(item)}
                            </td>

                            <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-semibold tabular-nums text-sibs-muted">
                              {item.gy_tracker_bh ?? "—"}
                            </td>

                            <td className="bg-blue-50/20 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-extrabold tabular-nums text-blue-600">
                              {ot > 0 ? `+${formatNumber(ot)}` : "—"}
                            </td>

                            <td className="bg-orange-50/20 px-3 2xl:px-4 py-2 2xl:py-2.5 text-center sibs-text-xs font-extrabold tabular-nums text-sibs-orange">
                              {ath > 0 ? formatNumber(ath) : "—"}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                              {renderStatusBadge(item.gy_tracker_status)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          }
          mobileContent={
            <div ref={mobileScrollRef} className="max-h-[650px] overflow-y-auto space-y-3">
              {loading ? (
                <DataCard.Skeleton count={4} />
              ) : attendance.length === 0 ? (
                <DataCard.Empty
                  icon={<CalendarDays size={22} />}
                  title="No attendance records found"
                  description="Adjust your search, department, account, or date range filters."
                />
              ) : (
                attendance.map((item, index) => {
                  const employeeDisplayName = getAttendanceEmployeeDisplayName(item);
                  const loginTime = formatTime(item.gy_tracker_login);
                  const breakoutTime = formatTime(item.gy_tracker_breakout);
                  const breakinTime = formatTime(item.gy_tracker_breakin);
                  const logoutTime = formatTime(item.gy_tracker_logout);
                  const loginIndicator = getLoginIndicator(item);
                  const managerOwnRowCompleted =
                    managerView &&
                    isOwnAttendanceRow(item, user) &&
                    getComputedWorkHours(item) >= 8;
                  const logoutIndicator = managerOwnRowCompleted
                    ? { label: "Full shift", tone: "success" }
                    : getLogoutIndicator(item);
                  const ot = getNumberValue(item.gy_tracker_ot);
                  const ath = getNumberValue(item.gy_tracker_ath);

                  return (
                    <DataCard
                      key={`${
                        item.gy_tracker_id || item.gy_tracker_date || "mobile"
                      }-${index}`}
                      index={index}
                    >
                      <DataCard.Header
                        avatar={
                          adminView ? (
                            <AttendanceEmployeeAvatar
                              item={item}
                              employeeName={employeeDisplayName}
                              className="h-9 w-9"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sibs-navy">
                              <CalendarDays size={15} />
                            </span>
                          )
                        }
                        title={adminView ? employeeDisplayName : formatDate(item.gy_tracker_date)}
                        subtitle={
                          adminView ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-extrabold text-sibs-orange">
                                {item.gy_emp_code || "—"}
                              </span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[11px] font-semibold text-sibs-navy">
                                {formatDate(item.gy_tracker_date)}
                              </span>
                            </div>
                          ) : null
                        }
                        badge={renderStatusBadge(item.gy_tracker_status)}
                      />

                      {(item.department || item.gy_emp_account || (getAssignedSite(item) && getAssignedSite(item) !== "—")) ? (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-sibs-border pt-2">
                          {item.department ? (
                            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {item.department}
                            </span>
                          ) : null}
                          {item.gy_emp_account ? (
                            <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-sibs-primary-1">
                              {item.gy_emp_account}
                            </span>
                          ) : null}
                          {getAssignedSite(item) && getAssignedSite(item) !== "—" ? (
                            <span className="inline-flex items-center rounded-md border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                              {getAssignedSite(item)}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <DataCard.Metrics cols={4}>
                        <DataCard.MetricItem
                          label="Login"
                          value={loginTime}
                          tone={loginIndicator.tone === "danger" ? "amber" : "emerald"}
                        />
                        <DataCard.MetricItem
                          label="Logout"
                          value={logoutTime}
                          tone={logoutIndicator.tone === "warning" ? "amber" : "emerald"}
                        />
                        <DataCard.MetricItem
                          label="WH"
                          value={displayCappedWorkHours(item)}
                          tone="default"
                        />
                        <DataCard.MetricItem
                          label="BH"
                          value={item.gy_tracker_bh ?? "—"}
                          tone="secondary"
                        />
                      </DataCard.Metrics>

                      <div className="mt-2 grid grid-cols-4 divide-x divide-sibs-border rounded-lg border border-sibs-border bg-sibs-surface py-1.5 text-center">
                        <DataCard.MetricItem label="Break Out" value={breakoutTime} tone="dim" />
                        <DataCard.MetricItem label="Break In" value={breakinTime} tone="dim" />
                        <DataCard.MetricItem label="OT" value={ot > 0 ? `+${formatNumber(ot)}` : "—"} tone="blue" />
                        <DataCard.MetricItem label="ATH" value={ath > 0 ? formatNumber(ath) : "—"} tone="orange" />
                      </div>
                    </DataCard>
                  );
                })
              )}
            </div>
          }
        />

          <div className="mt-5">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={PAGE_LIMIT}
              loadedCount={attendance.length}
              onPageChange={goToPage}
              recordLabel="attendance records"
              loading={loading}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
