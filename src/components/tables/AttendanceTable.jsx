import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  Timer,
} from "lucide-react";

import { useUser } from "../../services/context/UserContext";
import { getAttendance } from "../../lib/axios/getAttendance";
import {
  usePagination,
  PaginationDateRangeFilter,
} from "@/services/context/PaginationContext";
import PaginationTable from "@/services/pagination/PaginationTable";
import { formatDate } from "@/components/layout/FormatDateTime";

const PAGE_LIMIT = 15;
const LATE_GRACE_MS = 60 * 1000;

function formatNumber(value) {
  if (value === "..." || value === null || value === undefined) return "...";

  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  });
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function getNumberValue(value) {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return 0;

  return numberValue;
}

function getValidDate(value) {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function getTimeOnlyParts(value) {
  if (!value) return null;

  const raw = String(value).trim();

  const amPmMatch = raw.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );

  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const minute = Number(amPmMatch[2]);
    const second = Number(amPmMatch[3] || 0);
    const meridiem = amPmMatch[4].toUpperCase();

    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    return { hour, minute, second };
  }

  const timeMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (timeMatch) {
    return {
      hour: Number(timeMatch[1]),
      minute: Number(timeMatch[2]),
      second: Number(timeMatch[3] || 0),
    };
  }

  const parsed = getValidDate(raw);

  if (!parsed) return null;

  return {
    hour: parsed.getHours(),
    minute: parsed.getMinutes(),
    second: parsed.getSeconds(),
  };
}

function buildDateTimeFromTrackerDate(trackerDate, timeValue) {
  const baseDate = getValidDate(trackerDate) || new Date();
  const timeParts = getTimeOnlyParts(timeValue);

  if (!timeParts) {
    return getValidDate(timeValue);
  }

  const result = new Date(baseDate);

  result.setHours(timeParts.hour, timeParts.minute, timeParts.second || 0, 0);

  return result;
}

function getHoursBetween(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const start = getValidDate(startTime);
  const end = getValidDate(endTime);

  if (!start || !end) return 0;

  let diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  return diffMs / (1000 * 60 * 60);
}

function getScheduleStart(item) {
  return (
    item?.schedule_start ||
    item?.scheduleStart ||
    item?.gy_schedule_start ||
    item?.gy_sched_start ||
    item?.gy_sched_timein ||
    item?.gy_sched_in ||
    item?.shift_start ||
    item?.shiftStart ||
    item?.schedStart ||
    item?.sched_start ||
    item?.gy_sched_login ||
    null
  );
}

function getScheduleEnd(item) {
  return (
    item?.schedule_end ||
    item?.scheduleEnd ||
    item?.gy_schedule_end ||
    item?.gy_sched_end ||
    item?.gy_sched_timeout ||
    item?.gy_sched_out ||
    item?.shift_end ||
    item?.shiftEnd ||
    item?.schedEnd ||
    item?.sched_end ||
    item?.gy_sched_logout ||
    null
  );
}

function isLateBySchedule(actualTime, scheduledTime) {
  if (!actualTime || !scheduledTime) return false;

  return actualTime.getTime() - scheduledTime.getTime() >= LATE_GRACE_MS;
}

function getBreakHours(item) {
  if (item?.gy_tracker_breakout && item?.gy_tracker_breakin) {
    return getHoursBetween(item.gy_tracker_breakout, item.gy_tracker_breakin);
  }

  return getNumberValue(item?.gy_tracker_bh);
}

function getComputedWorkHours(item) {
  const savedWh = getNumberValue(item?.gy_tracker_wh);

  const actualLogin = getValidDate(item?.gy_tracker_login);
  const actualLogout = getValidDate(item?.gy_tracker_logout);

  if (!actualLogin || !actualLogout) {
    return savedWh;
  }

  const trackerDate = item?.gy_tracker_date;
  const scheduleStartRaw = getScheduleStart(item);
  const scheduleEndRaw = getScheduleEnd(item);

  const scheduleStart = scheduleStartRaw
    ? buildDateTimeFromTrackerDate(trackerDate, scheduleStartRaw)
    : null;

  const scheduleEnd = scheduleEndRaw
    ? buildDateTimeFromTrackerDate(trackerDate, scheduleEndRaw)
    : null;

  if (
    scheduleStart &&
    scheduleEnd &&
    scheduleEnd.getTime() <= scheduleStart.getTime()
  ) {
    scheduleEnd.setDate(scheduleEnd.getDate() + 1);
  }

  const effectiveStart =
    scheduleStart && actualLogin.getTime() < scheduleStart.getTime()
      ? scheduleStart
      : actualLogin;

  const effectiveEnd =
    scheduleEnd && actualLogout.getTime() > scheduleEnd.getTime()
      ? scheduleEnd
      : actualLogout;

  let totalHours = getHoursBetween(effectiveStart, effectiveEnd);

  totalHours -= getBreakHours(item);

  if (totalHours > 0) return Math.max(totalHours, 0);

  return savedWh;
}

function capWorkHoursFromItem(item) {
  return Math.min(getComputedWorkHours(item), 8);
}

function displayCappedWorkHours(item) {
  const computedHours = getComputedWorkHours(item);

  if (!computedHours) return "—";

  return formatNumber(Math.min(computedHours, 8));
}

function formatEmployeeName(item) {
  const lastName = String(item?.gy_emp_lname || "").trim();
  const firstName = String(item?.gy_emp_fname || "").trim();
  const middleName = String(item?.gy_emp_mname || "").trim();

  if (lastName || firstName || middleName) {
    return `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
      middleName ? ` ${middleName}` : ""
    }`
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return String(item?.gy_emp_fullname || "").trim().toUpperCase() || "—";
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

function canUseAttendanceFilters(user) {
  if (isEmployeeAttendanceSession(user)) return false;

  return (
    isHrAdminUser(user) ||
    isSuperAdminUser(user) ||
    isTalentAcquisitionUser(user) ||
    isTeamLeaderUser(user) ||
    isWfmUser(user)
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

function getAssignedSite(item) {
  const value =
    item?.site ??
    item?.assignedSite ??
    item?.gy_assignedloc ??
    item?.assigned_loc ??
    "";

  const raw = String(value ?? "").trim();

  if (!raw) return "—";

  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Both Tagum and Davao";
  if (raw === "3") return "Hybrid";

  return raw;
}

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

function StatCard({
  title,
  value,
  description,
  icon,
  tone = "navy",
  delay = 0,
}) {
  const tones = {
    navy: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      icon: "bg-[#EAF2FB] text-[#042C51]",
    },
    emerald: {
      label: "text-emerald-700",
      value: "text-emerald-600",
      icon: "bg-emerald-50 text-emerald-600",
    },
    amber: {
      label: "text-amber-700",
      value: "text-amber-500",
      icon: "bg-amber-50 text-amber-600",
    },
    orange: {
      label: "text-[#C2410C]",
      value: "text-[#FF5C28]",
      icon: "bg-[#FFF3ED] text-[#FF5C28]",
    },
  };

  const selectedTone = tones[tone] || tones.navy;
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card flex min-h-[112px] flex-col justify-between overflow-hidden p-3.5"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-[10px] font-extrabold uppercase ${selectedTone.label}`}
        >
          {title}
        </span>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${selectedTone.icon}`}
        >
          <IconComponent size={17} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-2">
        <p
          className={`text-3xl font-extrabold leading-none tabular-nums ${selectedTone.value}`}
        >
          {value}
        </p>
        <p className="mt-1.5 text-xs font-bold leading-4 text-[#667085]">
          {description}
        </p>
      </div>
    </article>
  );
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
      <span className="text-xs font-extrabold tabular-nums text-[#042C51]">
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

function MobileMetric({ label, value, tone = "navy" }) {
  const valueTone = {
    navy: "text-[#042C51]",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    orange: "text-[#FF5C28]",
    blue: "text-blue-600",
  }[tone] || "text-[#042C51]";

  return (
    <div className="sibs-info-tile">
      <p className="sibs-kicker">
        {label}
      </p>
      <p className={`mt-1 text-xs font-extrabold tabular-nums ${valueTone}`}>
        {value}
      </p>
    </div>
  );
}

function getLoginIndicator(item) {
  if (!item?.gy_tracker_login) {
    return { label: "No clock-in", tone: "neutral" };
  }

  const actualLogin = getValidDate(item?.gy_tracker_login);
  const scheduleStartRaw = getScheduleStart(item);
  const scheduledLogin = scheduleStartRaw
    ? buildDateTimeFromTrackerDate(item?.gy_tracker_date, scheduleStartRaw)
    : null;

  if (actualLogin && scheduledLogin) {
    return isLateBySchedule(actualLogin, scheduledLogin)
      ? { label: "Late clock-in", tone: "danger" }
      : { label: "On-Time", tone: "success" };
  }

  const normalized = normalizeStatus(item?.login_status);
  return normalized === "late"
    ? { label: "Late clock-in", tone: "danger" }
    : { label: "On-Time", tone: "success" };
}

function getLogoutIndicator(item) {
  if (!item?.gy_tracker_logout) {
    return { label: "No clock-out", tone: "neutral" };
  }

  const normalized = normalizeStatus(item?.logout_status);

  if (normalized === "early-out" || normalized === "early") {
    return { label: "Early logout", tone: "warning" };
  }

  return { label: "Full shift", tone: "success" };
}

function getSiteBadgeClass(site) {
  const normalized = String(site || "").trim().toLowerCase();

  if (normalized === "davao") {
    return "border-violet-100 bg-violet-50 text-violet-700";
  }

  if (normalized === "tagum") {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (normalized === "hybrid") {
    return "border-teal-100 bg-teal-50 text-teal-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
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

function InlineDateRangeFilter({ visible }) {
  if (!visible) return null;

  return (
    <div className="attendance-date-filter-inline w-full sm:w-auto">
      <PaginationDateRangeFilter
        entity="attendance"
        visible
        className="m-0 w-full"
      />
    </div>
  );
}

export default function AttendanceTable() {
  const [attendance, setAttendance] = useState([]);

  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");

  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);

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

  const dateFrom = filterValues?.dateFrom || "";
  const dateTo = filterValues?.dateTo || "";

  const navigate = useNavigate();
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
  const navigateRef = useRef(navigate);

  const hrAdminView = isHrAdminUser(user);
  const superAdminView = isSuperAdminUser(user);
  const managerView = isManagerUser(user);
  const talentAcquisitionView = isTalentAcquisitionUser(user);

  const attendanceFiltersView = canUseAttendanceFilters(user);
  const attendanceDateRangeView = true;

  const adminView =
    user?.tokenType === "admin" ||
    hrAdminView ||
    superAdminView ||
    managerView ||
    talentAcquisitionView;

  useEffect(() => {
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
    navigateRef.current = navigate;
  }, [setLoading, setPagination, navigate]);

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
    setAccountFilter("All");
    setAccountOptions([]);
    loadedAccountOptionsKeyRef.current = "";

    goToPage(1);
  }

  function handleAccountSelect(accountName) {
    const cleanAccount = accountName || "All";

    if (cleanAccount === accountFilter) return;

    setAccountFilter(cleanAccount);
    goToPage(1);
  }

  function handleAttendanceSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();
    handleAttendanceSearchSubmit();
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
      if (accountFilter !== "All") setAccountFilter("All");

      loadedDepartmentOptionsRef.current = false;
      loadedAccountOptionsKeyRef.current = "";
    }
  }, [attendanceFiltersView, departmentFilter, accountFilter]);

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
    accountFilter,
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
          attendanceFiltersView ? accountFilter : "All",
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
          if (result?.status === 401) {
            navigateRef.current("/login");
            return;
          }

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
    accountFilter,
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Loaded Attendance"
            value={loading ? "..." : formatNumber(pageStats.totalLoaded)}
            description="Records loaded on the current page"
            icon={CalendarDays}
            tone="navy"
            delay={0}
          />

          <StatCard
            title="Approved"
            value={loading ? "..." : formatNumber(pageStats.approvedCount)}
            description="Ready for payroll processing"
            icon={CircleCheckBig}
            tone="emerald"
            delay={60}
          />

          <StatCard
            title="Pending Review"
            value={loading ? "..." : formatNumber(pageStats.pendingCount)}
            description="Awaiting attendance validation"
            icon={CircleX}
            tone="amber"
            delay={120}
          />

          <StatCard
            title="Computed Work Hours"
            value={loading ? "..." : `${formatNumber(pageStats.totalWorkHours)} hrs`}
            description="Capped work hours from this page"
            icon={Timer}
            tone="orange"
            delay={180}
          />
        </div>
      </section>

      <section
        className="sibs-profile-tab-panel sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
        style={getAnimationStyle(120)}
      >
        <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="sibs-section-title">Attendance Records</h2>
              <p className="sibs-section-subtitle">
                {adminView
                  ? "Review employee time entries, work hours, breaks, and approval status."
                  : "Review your time entries, work hours, breaks, and approval status."}
              </p>
            </div>

            <span className="inline-flex w-max items-center rounded-full border border-orange-100 bg-[#FFF3ED] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#FF5C28]">
              Page {currentPage}
            </span>
          </div>
        </div>

        <div className="relative overflow-visible p-4 sm:p-5">
          <div>
            <PaginationTable
              filterLayout="ta-inline"
              showFilterPanel={false}
              showFilterHeader={false}
              showPagination={false}
              loading={loading}
              searchValue={searchInput}
              searchPlaceholder={
                adminView
                  ? "Search by employee, SIBS ID, department, or account..."
                  : "Search attendance records..."
              }
              onSearchChange={(value) => setSearchInput?.(value)}
              onSearchKeyDown={handleAttendanceSearchKeyDown}
              dropdownFilters={
                attendanceFiltersView
                  ? [
                      {
                        key: "department",
                        value: departmentFilter,
                        onChange: handleDepartmentSelect,
                        options: departmentDropdownOptions,
                        allLabel: "All Departments",
                        label: "Department",
                        placeholder: "Search departments...",
                        searchable: true,
                        includeAll: true,
                      },
                      {
                        key: "account",
                        value: accountFilter,
                        onChange: handleAccountSelect,
                        options: accountDropdownOptions,
                        allLabel: "All Accounts",
                        label: "Account",
                        placeholder: "Search accounts...",
                        searchable: true,
                        includeAll: true,
                      },
                    ]
                  : []
              }
              rightContent={
                <InlineDateRangeFilter visible={attendanceDateRangeView} />
              }
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </div>

          <div className="mt-3 block sm:hidden">
            <button
              type="button"
              onClick={handleAttendanceSearchSubmit}
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={16} />
              Apply Search
            </button>
          </div>

          <div className="mt-5 sibs-data-table-shell">
            <div className="overflow-hidden">
              <div
                ref={tableScrollRef}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                className={`max-h-[650px] select-none overflow-auto ${
                  isDraggingTable ? "cursor-grabbing" : "cursor-grab"
                }`}
              >
                <table className="w-full min-w-[1510px] border-collapse bg-white text-left">
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      {adminView ? (
                        <th className="sibs-data-table-th">
                          SiBS ID
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
                    key={`${page}-${search}-${searchSubmitVersion}-${dateFrom}-${dateTo}-${departmentFilter}-${accountFilter}-${loading}`}
                    className="divide-y divide-[#EEF2F6]"
                  >
                    {loading ? (
                      Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                        <tr key={`attendance-skeleton-${index}`}>
                          <td colSpan={emptyColSpan} className="px-4 py-4">
                            <div className="h-7 w-full animate-sibs-pulse rounded bg-slate-100" />
                          </td>
                        </tr>
                      ))
                    ) : attendance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={emptyColSpan}
                          className="px-5 py-12 text-center text-xs font-bold text-[#667085]"
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
                            className="sibs-data-table-row sibs-attendance-row-reveal"
                            style={{
                              animationDelay: `${Math.min(index, 10) * 36}ms`,
                            }}
                          >
                            {adminView ? (
                              <td className="whitespace-nowrap px-4 py-3.5 text-xs font-extrabold tabular-nums text-[#FF5C28]">
                                {item.gy_emp_code || "—"}
                              </td>
                            ) : null}

                            {adminView ? (
                              <td className="px-4 py-3.5">
                                <p className="max-w-[220px] break-words text-xs font-extrabold leading-tight text-[#042C51]">
                                  {employeeName}
                                </p>
                              </td>
                            ) : null}

                            {attendanceFiltersView ? (
                              <td
                                className="max-w-[190px] truncate px-4 py-3.5 text-xs font-semibold text-[#52637A]"
                                title={item.department || "—"}
                              >
                                {item.department || "—"}
                              </td>
                            ) : null}

                            {attendanceFiltersView ? (
                              <td
                                className="max-w-[160px] truncate px-4 py-3.5 text-xs font-extrabold text-[#344054]"
                                title={item.gy_emp_account || "—"}
                              >
                                {item.gy_emp_account || "—"}
                              </td>
                            ) : null}

                            {attendanceFiltersView ? (
                              <td className="whitespace-nowrap px-4 py-3.5">
                                <span
                                  className={`inline-flex rounded-md border px-2 py-0.5 text-[9px] font-extrabold uppercase ${getSiteBadgeClass(
                                    site,
                                  )}`}
                                >
                                  {site}
                                </span>
                              </td>
                            ) : null}

                            <td className="whitespace-nowrap px-4 py-3.5 text-xs font-extrabold text-[#536887]">
                              {formatDate(item.gy_tracker_date)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5">
                              <TimeIndicator
                                value={loginTime}
                                label={loginIndicator.label}
                                tone={loginIndicator.tone}
                              />
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-xs font-extrabold tabular-nums text-[#7B8DB3]">
                              {breakoutTime}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-xs font-extrabold tabular-nums text-[#7B8DB3]">
                              {breakinTime}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5">
                              <TimeIndicator
                                value={logoutTime}
                                label={logoutIndicator.label}
                                tone={logoutIndicator.tone}
                              />
                            </td>

                            <td className="bg-slate-50/60 px-3 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#101828]">
                              {displayCappedWorkHours(item)}
                            </td>

                            <td className="px-3 py-3.5 text-center text-xs font-semibold tabular-nums text-[#667085]">
                              {item.gy_tracker_bh ?? "—"}
                            </td>

                            <td className="bg-blue-50/20 px-3 py-3.5 text-center text-xs font-extrabold tabular-nums text-blue-600">
                              {ot > 0 ? `+${formatNumber(ot)}` : "—"}
                            </td>

                            <td className="bg-orange-50/20 px-3 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#FF5C28]">
                              {ath > 0 ? formatNumber(ath) : "—"}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3.5 text-center">
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

            
          </div>

          <div className="lg:hidden">
            <div ref={mobileScrollRef} className="max-h-[650px] overflow-y-auto">
              {loading ? (
                <div className="sibs-empty-panel">
                  Loading attendance records...
                </div>
              ) : attendance.length === 0 ? (
                <div className="sibs-empty-panel">
                  No attendance records found.
                </div>
              ) : (
                <div
                  key={`${page}-${search}-${searchSubmitVersion}-${dateFrom}-${dateTo}-${departmentFilter}-${accountFilter}`}
                  className="space-y-3"
                >
                  {attendance.map((item, index) => {
                    const employeeName = formatEmployeeName(item);
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
                      <article
                        key={`${
                          item.gy_tracker_id || item.gy_tracker_date || "mobile"
                        }-${index}`}
                        className="sibs-card rounded-xl border border-[#E6ECF2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:bg-[#FFF9F6] hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {adminView ? (
                              <span className="text-[10px] font-extrabold uppercase text-[#FF5C28]">
                                {item.gy_emp_code || "N/A"}
                              </span>
                            ) : null}

                            <h3 className="mt-1 break-words text-sm font-extrabold leading-tight text-[#042C51]">
                              {adminView
                                ? employeeName
                                : formatDate(item.gy_tracker_date)}
                            </h3>

                            {attendanceFiltersView ? (
                              <p className="mt-1 text-[11px] font-semibold leading-4 text-[#667085]">
                                {item.department || "No department"} /{" "}
                                {item.gy_emp_account || "No account"} /{" "}
                                {getAssignedSite(item)}
                              </p>
                            ) : null}

                            {adminView ? (
                              <p className="mt-1 text-[10px] font-semibold text-[#8A98B8]">
                                {formatDate(item.gy_tracker_date)}
                              </p>
                            ) : null}
                          </div>

                          <div className="shrink-0">
                            {renderStatusBadge(item.gy_tracker_status)}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <MobileMetric
                            label="Login"
                            value={`${loginTime} · ${loginIndicator.label}`}
                            tone={loginIndicator.tone === "danger" ? "amber" : "emerald"}
                          />
                          <MobileMetric
                            label="Logout"
                            value={`${logoutTime} · ${logoutIndicator.label}`}
                            tone={logoutIndicator.tone === "warning" ? "amber" : "emerald"}
                          />
                          <MobileMetric label="Start Break" value={breakoutTime} />
                          <MobileMetric label="End Break" value={breakinTime} />
                          <MobileMetric
                            label="WH"
                            value={displayCappedWorkHours(item)}
                          />
                          <MobileMetric
                            label="BH"
                            value={item.gy_tracker_bh ?? "—"}
                          />
                          <MobileMetric
                            label="OT"
                            value={ot > 0 ? `+${formatNumber(ot)}` : "—"}
                            tone="blue"
                          />
                          <MobileMetric
                            label="ATH"
                            value={ath > 0 ? formatNumber(ath) : "—"}
                            tone="orange"
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <PaginationTable
              loading={loading}
              showSearch={false}
              showPagination
              currentPage={currentPage}
              totalPages={totalPages}
              loadedCount={attendance.length}
              totalRecords={totalRecords}
              recordLabel="attendance records"
              onPrevious={goPreviousPage}
              onNext={goNextPage}
              showCount
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
