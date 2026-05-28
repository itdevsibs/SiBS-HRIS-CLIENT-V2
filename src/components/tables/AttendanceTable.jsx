import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleX,
  Search,
  Timer,
} from "lucide-react";

import { useUser } from "../../services/context/UserContext";
import { getAttendance } from "../../lib/axios/getAttendance";
import { usePagination } from "@/services/context/PaginationContext";
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

/*
  Late rule:
  Schedule 01:00:00 PM
  Login 01:00:00 PM to 01:00:59 PM = not late
  Login 01:01:00 PM and above = late
*/
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

function isManagerUser(user) {
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

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold leading-none ${valueClassName}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function AnimatedDropdown({ open, children, className = "" }) {
  return (
    <div
      className={`absolute left-0 right-0 top-full mt-2 grid transition-all duration-300 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "pointer-events-none grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-2xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AttendanceTable() {
  const [attendance, setAttendance] = useState([]);
  const [accountFilter, setAccountFilter] = useState("All");
  const [accountOptions, setAccountOptions] = useState([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const paginationContext = usePagination("attendance");

  const {
    page = 1,
    search = "",
    loading,
    setLoading,
    setPagination,
    pagination,
    setPage,
    setCurrentPage,
    handlePageChange,
  } = paginationContext;

  const navigate = useNavigate();
  const tableScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  const accountDropdownRef = useRef(null);
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
  const managerView = isManagerUser(user);
  const adminView = user?.tokenType === "admin" || hrAdminView || managerView;

  const filteredAccountOptions = useMemo(() => {
    const keyword = accountSearch.trim().toLowerCase();

    if (!keyword) return accountOptions;

    return accountOptions.filter((account) =>
      String(account || "").toLowerCase().includes(keyword),
    );
  }, [accountOptions, accountSearch]);

  useEffect(() => {
    setLoadingRef.current = setLoading;
    setPaginationRef.current = setPagination;
    navigateRef.current = navigate;
  }, [setLoading, setPagination, navigate]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target)
      ) {
        setShowAccountDropdown(false);
        setAccountSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
  const hasPreviousPage =
    Boolean(safePagination.hasPreviousPage) || currentPage > 1;
  const hasNextPage =
    Boolean(safePagination.hasNextPage) || currentPage < totalPages;

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

  function handleAccountSelect(accountName) {
    setAccountFilter(accountName);
    setAccountSearch("");
    setShowAccountDropdown(false);
    goToPage(1);
  }

  function getAccountFilterLabel() {
    if (!accountFilter || accountFilter === "All") return "All Accounts";
    return accountFilter;
  }

  function handleDragStart(e) {
    if (e.button !== 0) return;

    const target = e.target;
    const isInteractiveElement = target.closest(
      "button, a, input, select, textarea",
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
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page, accountFilter]);

  useEffect(() => {
    let cancelled = false;
    const requestId = latestRequestIdRef.current + 1;

    latestRequestIdRef.current = requestId;

    const fetchAttendance = async () => {
      try {
        setLoadingRef.current?.(true);

        const shouldLoadAccountOptions = hrAdminView && accountOptions.length === 0;

        /*
          If you updated getAttendance to support includeAccounts, this sends it.
          If your helper still only accepts 3 params, the extra object is ignored by JS.
        */
        const result = await getAttendance(
          page,
          search,
          hrAdminView ? accountFilter : "All",
          { includeAccounts: shouldLoadAccountOptions },
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

        if (Array.isArray(result.accountOptions) && result.accountOptions.length > 0) {
          setAccountOptions(result.accountOptions);
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
  }, [page, search, accountFilter, hrAdminView, accountOptions.length]);

  function formatTime(time) {
    if (!time) return "—";

    const parsed = new Date(time);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleTimeString("en-US", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getTimeBadgeClass(value, statusKey) {
    if (value === "—") {
      return "border-slate-200 bg-slate-50 text-sibs-primary-1";
    }

    const cleanStatus = normalizeStatus(statusKey);

    if (
      cleanStatus === "on-time" ||
      cleanStatus === "ontime" ||
      cleanStatus === "early"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-600";
    }

    if (
      cleanStatus === "late" ||
      cleanStatus === "over-break" ||
      cleanStatus === "early-out"
    ) {
      return "border-red-200 bg-red-50 text-red-600";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-600";
  }

  function getLoginBadgeClass(item, value, statusKey) {
    if (value === "—") {
      return "border-slate-200 bg-slate-50 text-sibs-primary-1";
    }

    const actualLogin = getValidDate(item?.gy_tracker_login);
    const scheduleStartRaw = getScheduleStart(item);

    const scheduledLogin = scheduleStartRaw
      ? buildDateTimeFromTrackerDate(item?.gy_tracker_date, scheduleStartRaw)
      : null;

    if (actualLogin && scheduledLogin) {
      if (isLateBySchedule(actualLogin, scheduledLogin)) {
        return "border-red-200 bg-red-50 text-red-600";
      }

      return "border-emerald-200 bg-emerald-50 text-emerald-600";
    }

    const cleanStatus = normalizeStatus(statusKey);

    if (cleanStatus === "late" && actualLogin) {
      const loginMinute = actualLogin.getMinutes();

      if (loginMinute === 0) {
        return "border-emerald-200 bg-emerald-50 text-emerald-600";
      }

      return "border-red-200 bg-red-50 text-red-600";
    }

    return getTimeBadgeClass(value, statusKey);
  }

  function getManagerSafeTimeBadgeClass(item, value, statusKey) {
    if (value === "—") {
      return "border-slate-200 bg-slate-50 text-sibs-primary-1";
    }

    const workHours = getComputedWorkHours(item);
    const isManagerOwnRow = managerView && isOwnAttendanceRow(item, user);

    if (isManagerOwnRow && workHours >= 8) {
      return "border-emerald-200 bg-emerald-50 text-emerald-600";
    }

    return getTimeBadgeClass(value, statusKey);
  }

  function getStatusBadgeClass(status) {
    if (status === "Approved") {
      return "border-emerald-200 bg-emerald-50 text-emerald-600";
    }

    return "border-amber-200 bg-amber-50 text-amber-600";
  }

  function renderStatusBadge(status) {
    const approved = status === "Approved";

    return (
      <Badge className={getStatusBadgeClass(status)}>
        <span className="mr-1 inline-flex items-center">
          {approved ? <CircleCheckBig size={15} /> : <CircleX size={15} />}
        </span>
        {status ?? "—"}
      </Badge>
    );
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

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white">
      <div className="p-4 sm:p-5">
        <div className="mb-5 rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#101828]">
                Current Page Summary
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                These totals are based only on the current attendance records
                loaded for this page.
              </p>
            </div>

            <Badge className="border-blue-200 bg-blue-50 text-sibs-primary-1">
              Page {currentPage}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Loaded Attendance"
              value={loading ? "..." : formatNumber(pageStats.totalLoaded)}
              icon={CalendarDays}
              delay={0}
            />

            <StatCard
              title="Approved"
              value={loading ? "..." : formatNumber(pageStats.approvedCount)}
              icon={CircleCheckBig}
              valueClassName="text-emerald-600"
              iconClassName="bg-emerald-50 text-emerald-600"
              delay={60}
            />

            <StatCard
              title="Pending"
              value={loading ? "..." : formatNumber(pageStats.pendingCount)}
              icon={CircleX}
              valueClassName="text-amber-500"
              iconClassName="bg-amber-50 text-amber-600"
              delay={120}
            />

            <StatCard
              title="Page WH"
              value={loading ? "..." : formatNumber(pageStats.totalWorkHours)}
              icon={Timer}
              delay={180}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#101828]">
              Attendance Records
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {adminView
                ? "View employee attendance records for the current page."
                : "View your current page of attendance records."}
            </p>
          </div>

          {hrAdminView && (
            <div
              ref={accountDropdownRef}
              className="relative z-50 w-full lg:w-[320px]"
            >
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
                />

                <input
                  type="text"
                  value={
                    showAccountDropdown ? accountSearch : getAccountFilterLabel()
                  }
                  onChange={(e) => {
                    setAccountSearch(e.target.value);
                    setShowAccountDropdown(true);
                  }}
                  onFocus={() => {
                    setShowAccountDropdown(true);
                    setAccountSearch("");
                  }}
                  placeholder="Search accounts..."
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 pr-11 text-sm font-bold text-[#344054] outline-none transition placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                />

                <ChevronDown
                  size={18}
                  onClick={() => {
                    setShowAccountDropdown((prev) => !prev);
                    setAccountSearch("");
                  }}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-sibs-tertiary-5 transition-transform duration-300 ${
                    showAccountDropdown ? "rotate-180" : ""
                  }`}
                />

                <AnimatedDropdown open={showAccountDropdown}>
                  <div className="max-h-64 overflow-y-auto py-2 sibs-scrollbar">
                    <button
                      type="button"
                      onClick={() => handleAccountSelect("All")}
                      className={`block w-full px-4 py-3 text-left text-sm transition ${
                        accountFilter === "All"
                          ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                          : "text-[#344054] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      All Accounts
                    </button>

                    {filteredAccountOptions.length > 0 ? (
                      filteredAccountOptions.map((account, index) => {
                        const checked = accountFilter === account;

                        return (
                          <button
                            key={`${account}-${index}`}
                            type="button"
                            onClick={() => handleAccountSelect(account)}
                            className={`block w-full px-4 py-3 text-left text-sm transition ${
                              checked
                                ? "bg-[#EAF2FB] font-bold text-sibs-primary-1"
                                : "text-[#344054] hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <span className="block truncate">{account}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-4 text-sm font-semibold text-sibs-tertiary-5">
                        No accounts found.
                      </div>
                    )}
                  </div>
                </AnimatedDropdown>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 hidden overflow-hidden rounded-xl border border-[#E6ECF2] lg:block">
          <div
            ref={tableScrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            className={`max-h-[580px] overflow-auto select-none ${
              isDraggingTable ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            <table className="w-full min-w-[1280px] border-collapse bg-white">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  {adminView && (
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      SiBS ID
                    </th>
                  )}

                  {adminView && (
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Employee Name
                    </th>
                  )}

                  {hrAdminView && (
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Account
                    </th>
                  )}

                  <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Tracker Date
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Login
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Start Break
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    End Break
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Logout
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    WH
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    BH
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    OT
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    ATH
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody key={`${page}-${search}-${accountFilter}-${loading}`}>
                {loading ? (
                  Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                    <tr key={index}>
                      <td
                        colSpan={adminView ? (hrAdminView ? 13 : 12) : 10}
                        className="border-t border-[#f3f4f6] px-5 py-4"
                      >
                        <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                      </td>
                    </tr>
                  ))
                ) : attendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={adminView ? (hrAdminView ? 13 : 12) : 10}
                      className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
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

                    return (
                      <tr
                        key={`${
                          item.gy_tracker_id || item.gy_tracker_date || "row"
                        }-${index}`}
                        className="transition-all duration-200 hover:bg-slate-50"
                      >
                        {adminView && (
                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                            {item.gy_emp_code || "—"}
                          </td>
                        )}

                        {adminView && (
                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#101828]">
                            {employeeName}
                          </td>
                        )}

                        {hrAdminView && (
                          <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                            {item.gy_emp_account || "—"}
                          </td>
                        )}

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#344054]">
                          {formatDate(item.gy_tracker_date)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                          <TimeBadge
                            value={loginTime}
                            className={getLoginBadgeClass(
                              item,
                              loginTime,
                              item.login_status,
                            )}
                          />
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                          <TimeBadge
                            value={breakoutTime}
                            className={
                              breakoutTime === "—"
                                ? "border-slate-200 bg-slate-50 text-sibs-primary-1"
                                : "border-emerald-200 bg-emerald-50 text-emerald-600"
                            }
                          />
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                          <TimeBadge
                            value={breakinTime}
                            className={getManagerSafeTimeBadgeClass(
                              item,
                              breakinTime,
                              item.breakin_status,
                            )}
                          />
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                          <TimeBadge
                            value={logoutTime}
                            className={getManagerSafeTimeBadgeClass(
                              item,
                              logoutTime,
                              item.logout_status,
                            )}
                          />
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-sibs-primary-1">
                          {displayCappedWorkHours(item)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {item.gy_tracker_bh ?? "—"}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {item.gy_tracker_ot ?? "—"}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {item.gy_tracker_ath ?? "—"}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                          {renderStatusBadge(item.gy_tracker_status)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Hold left click and drag left or right to scroll the table.
          </p>
        </div>

        <div className="mt-5 block lg:hidden">
          <div ref={mobileScrollRef} className="max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                Loading...
              </div>
            ) : attendance.length === 0 ? (
              <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                No attendance records found.
              </div>
            ) : (
              <div
                key={`${page}-${search}-${accountFilter}`}
                className="flex flex-col gap-3"
              >
                {attendance.map((item, index) => {
                  const employeeName = formatEmployeeName(item);
                  const loginTime = formatTime(item.gy_tracker_login);
                  const breakoutTime = formatTime(item.gy_tracker_breakout);
                  const breakinTime = formatTime(item.gy_tracker_breakin);
                  const logoutTime = formatTime(item.gy_tracker_logout);

                  return (
                    <div
                      key={`${
                        item.gy_tracker_id ||
                        item.gy_tracker_date ||
                        "mobile"
                      }-${index}`}
                      className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {adminView && (
                            <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
                              {item.gy_emp_code || "N/A"}
                            </p>
                          )}

                          <h3 className="m-0 text-sm font-bold leading-tight text-sibs-primary-1">
                            {adminView
                              ? employeeName
                              : formatDate(item.gy_tracker_date)}
                          </h3>

                          {hrAdminView && (
                            <p className="mt-1 text-xs font-semibold text-[#344054]">
                              {item.gy_emp_account || "No account"}
                            </p>
                          )}

                          {adminView && (
                            <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                              {formatDate(item.gy_tracker_date)}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {renderStatusBadge(item.gy_tracker_status)}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MobileMetric
                          label="Login"
                          value={loginTime}
                          className={getLoginBadgeClass(
                            item,
                            loginTime,
                            item.login_status,
                          )}
                        />

                        <MobileMetric
                          label="Start Break"
                          value={breakoutTime}
                          className={
                            breakoutTime === "—"
                              ? "border-slate-200 bg-slate-50 text-sibs-primary-1"
                              : "border-emerald-200 bg-emerald-50 text-emerald-600"
                          }
                        />

                        <MobileMetric
                          label="End Break"
                          value={breakinTime}
                          className={getManagerSafeTimeBadgeClass(
                            item,
                            breakinTime,
                            item.breakin_status,
                          )}
                        />

                        <MobileMetric
                          label="Logout"
                          value={logoutTime}
                          className={getManagerSafeTimeBadgeClass(
                            item,
                            logoutTime,
                            item.logout_status,
                          )}
                        />

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
                          value={item.gy_tracker_ot ?? "—"}
                        />

                        <MobileMetric
                          label="ATH"
                          value={item.gy_tracker_ath ?? "—"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
          <p className="m-0 text-sm font-semibold text-sibs-tertiary-5">
            Showing {attendance.length} loaded attendance records
          </p>

          <div className="flex items-center gap-2 max-sm:justify-center">
            <button
              type="button"
              disabled={loading || !hasPreviousPage}
              onClick={goPreviousPage}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-[#344054]">
              Page {currentPage}
            </span>

            <button
              type="button"
              disabled={loading || !hasNextPage}
              onClick={goNextPage}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeBadge({ value, className = "" }) {
  return (
    <div
      className={`inline-flex min-w-[74px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      {value}
    </div>
  );
}

function MobileMetric({ label, value, className = "" }) {
  return (
    <div className="rounded-xl border border-[#E6ECF2] bg-slate-50 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm">
      <p className="m-0 text-xs font-bold uppercase tracking-wide text-sibs-tertiary-5">
        {label}
      </p>

      {className ? (
        <div
          className={`mt-1 inline-flex min-w-[70px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
        >
          {value}
        </div>
      ) : (
        <strong className="mt-1 block text-sm font-bold text-sibs-primary-1">
          {value}
        </strong>
      )}
    </div>
  );
}