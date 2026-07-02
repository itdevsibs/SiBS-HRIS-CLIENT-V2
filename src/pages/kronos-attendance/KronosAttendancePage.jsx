import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleX,
  Clock,
  RefreshCw,
  Search,
  Timer,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import { getKronosAttendance } from "../../lib/axios/getKronosAttendance";

const PAGE_LIMIT = 15;
const KRONOS_ATTENDANCE_STATE_KEY = "kronosAttendancePageState";
const LIVE_REFRESH_INTERVAL_MS = 5000;

function cleanString(value) {
  return String(value || "").trim();
}

function formatNumber(value) {
  if (value === "..." || value === null || value === undefined) return "...";

  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "—";

  const raw = String(value).trim();

  if (!raw || raw === "0000-00-00") return "—";

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(value) {
  if (!value) return "—";

  const raw = String(value).trim();

  if (!raw || raw === "0000-00-00 00:00:00") return "—";

  const timeOnlyMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (timeOnlyMatch) {
    const date = new Date();

    date.setHours(
      Number(timeOnlyMatch[1]),
      Number(timeOnlyMatch[2]),
      Number(timeOnlyMatch[3] || 0),
      0,
    );

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getNumberValue(value) {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return 0;

  return numberValue;
}

function formatEmployeeName(item) {
  const lastName = cleanString(item?.gy_emp_lname);
  const firstName = cleanString(item?.gy_emp_fname);
  const middleName = cleanString(item?.gy_emp_mname);
  const fullName = cleanString(item?.gy_emp_fullname);

  if (lastName || firstName || middleName) {
    return `${lastName}${lastName && firstName ? ", " : ""}${firstName}${
      middleName ? ` ${middleName}` : ""
    }`
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return fullName.toUpperCase() || "—";
}

function normalizeStatus(value) {
  return cleanString(value).toLowerCase().replace(/[\s_]+/g, "-");
}

function getAssignedSite(item) {
  const value =
    item?.site ??
    item?.assignedSite ??
    item?.gy_assignedloc ??
    item?.assigned_loc ??
    "";

  const raw = cleanString(value);

  if (!raw) return "—";
  if (raw === "0") return "Tagum";
  if (raw === "1") return "Davao";
  if (raw === "2") return "Both Tagum and Davao";
  if (raw === "3") return "Hybrid";

  return raw;
}

function getWorkHours(item) {
  const value =
    item?.gy_tracker_wh ??
    item?.workHours ??
    item?.work_hours ??
    item?.wh ??
    item?.WH;

  if (value === null || value === undefined || value === "") return "—";

  return formatNumber(Math.min(getNumberValue(value), 8));
}

function getStatusBadgeClass(status) {
  const cleanStatus = normalizeStatus(status);

  if (cleanStatus === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-600";
  }

  if (cleanStatus === "rejected" || cleanStatus === "declined") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  if (cleanStatus === "ongoing" || cleanStatus === "active") {
    return "border-blue-200 bg-blue-50 text-sibs-primary-1";
  }

  return "border-amber-200 bg-amber-50 text-amber-600";
}

function getTimeBadgeClass(value, statusKey) {
  if (value === "—") {
    return "border-slate-200 bg-slate-50 text-sibs-primary-1";
  }

  const cleanStatus = normalizeStatus(statusKey);

  if (
    cleanStatus === "late" ||
    cleanStatus === "over-break" ||
    cleanStatus === "early-out"
  ) {
    return "border-red-200 bg-red-50 text-red-600";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-600";
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

function TimeBadge({ value, className = "" }) {
  return (
    <div
      className={`inline-flex min-w-[74px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      {value}
    </div>
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
        option?.label ||
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

export default function KronosAttendancePage() {
  const { user } = useUser();

  const mainRef = useRef(null);
  const latestRequestIdRef = useRef(0);
  const restoredRef = useRef(false);
  const isMountedRef = useRef(false);
  const latestLoadingRef = useRef(false);

  const latestFiltersRef = useRef({
    page: 1,
    search: "",
    dateFrom: "",
    dateTo: "",
    department: "All",
    account: "All",
  });

  const [attendance, setAttendance] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [liveSyncing, setLiveSyncing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const [access, setAccess] = useState({
    isAdmin: false,
    isManager: false,
    isHrAdmin: false,
    isSuperAdmin: false,
    isTalentAcquisition: false,
    canFilterAttendance: false,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_LIMIT,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  const isEmployee =
    user?.role === "employee" &&
    !access?.isAdmin &&
    !access?.isManager &&
    !access?.isHrAdmin &&
    !access?.isSuperAdmin &&
    !access?.isTalentAcquisition;

  const pageTitle = isEmployee ? "My Kronos Attendance" : "Kronos Attendance";

  const canFilterAttendance = access?.canFilterAttendance === true;

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
      .map((item) => cleanString(item?.gy_emp_account))
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

  const currentPage = Number(pagination.currentPage || page || 1);
  const totalPages = Number(pagination.totalPages || 1);
  const totalRecords = Number(pagination.total || 0);
  const hasPreviousPage = Boolean(pagination.hasPreviousPage) || currentPage > 1;
  const hasNextPage = Boolean(pagination.hasNextPage) || currentPage < totalPages;

  const pageStats = useMemo(() => {
    const totalLoaded = attendance.length;

    const approvedCount = attendance.filter(
      (item) => normalizeStatus(item.gy_tracker_status) === "approved",
    ).length;

    const pendingCount = attendance.filter(
      (item) => normalizeStatus(item.gy_tracker_status) !== "approved",
    ).length;

    const totalWorkHours = attendance.reduce((sum, item) => {
      const value = getNumberValue(item?.gy_tracker_wh);
      return sum + Math.min(value, 8);
    }, 0);

    return {
      totalLoaded,
      approvedCount,
      pendingCount,
      totalWorkHours,
    };
  }, [attendance]);

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({
          top: 0,
          left: 0,
          behavior,
        });
      }
    });
  }

  function savePageState(nextState) {
    try {
      sessionStorage.setItem(
        KRONOS_ATTENDANCE_STATE_KEY,
        JSON.stringify({
          page: nextState.page || 1,
          search: nextState.search || "",
          dateFrom: nextState.dateFrom || "",
          dateTo: nextState.dateTo || "",
          department: nextState.department || "All",
          account: nextState.account || "All",
        }),
      );
    } catch (error) {
      console.error("Kronos attendance state save error:", error);
    }
  }

  async function loadAttendance({
    nextPage = page,
    nextSearch = search,
    nextDateFrom = dateFrom,
    nextDateTo = dateTo,
    nextDepartment = departmentFilter,
    nextAccount = accountFilter,
    silent = false,
    latestPage = false,
  } = {}) {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    const resolvedPage = latestPage ? 1 : nextPage;

    if (!silent) {
      setLoading(true);
      setLoadError("");
    } else {
      setLiveSyncing(true);
    }

    try {
      const result = await getKronosAttendance(
        resolvedPage,
        nextSearch,
        nextAccount,
        {
          dateFrom: nextDateFrom,
          dateTo: nextDateTo,
          department: nextDepartment,
          includeDepartments: true,
          includeAccounts: true,
          limit: PAGE_LIMIT,
        },
      );

      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return;
      }

      if (!result?.success) {
        if (!silent) {
          setAttendance([]);
          setDepartmentOptions([]);
          setAccountOptions([]);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            total: 0,
            limit: PAGE_LIMIT,
            hasPreviousPage: false,
            hasNextPage: false,
          });
          setLoadError(result?.message || "Failed to fetch Kronos attendance.");
        } else {
          console.warn(
            "Live Kronos attendance refresh failed:",
            result?.message || "Unknown error",
          );
        }

        return;
      }

      const nextPagination = {
        currentPage: Number(result.pagination?.currentPage || resolvedPage || 1),
        totalPages: Number(result.pagination?.totalPages || 1),
        total: Number(result.pagination?.total || 0),
        limit: Number(result.pagination?.limit || PAGE_LIMIT),
        hasPreviousPage:
          Boolean(result.pagination?.hasPreviousPage) ||
          Number(result.pagination?.currentPage || 1) > 1,
        hasNextPage:
          Boolean(result.pagination?.hasNextPage) ||
          Number(result.pagination?.currentPage || 1) <
            Number(result.pagination?.totalPages || 1),
      };

      setAttendance(result.data || []);
      setDepartmentOptions(result.departmentOptions || []);
      setAccountOptions(result.accountOptions || []);
      setAccess(result.access || {});
      setPagination(nextPagination);
      setPage(nextPagination.currentPage);

      setDateFrom(result.selectedDateFrom || nextDateFrom || "");
      setDateTo(result.selectedDateTo || nextDateTo || "");
      setDepartmentFilter(result.selectedDepartment || nextDepartment || "All");
      setAccountFilter(result.selectedAccount || nextAccount || "All");
      setLastUpdatedAt(new Date());
      setLoadError("");

      savePageState({
        page: nextPagination.currentPage,
        search: nextSearch || "",
        dateFrom: result.selectedDateFrom || nextDateFrom || "",
        dateTo: result.selectedDateTo || nextDateTo || "",
        department: result.selectedDepartment || nextDepartment || "All",
        account: result.selectedAccount || nextAccount || "All",
      });
    } catch (error) {
      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return;
      }

      console.error("Kronos attendance load error:", error);

      if (!silent) {
        setAttendance([]);
        setLoadError(error?.message || "Failed to fetch Kronos attendance.");
        setPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: PAGE_LIMIT,
          hasPreviousPage: false,
          hasNextPage: false,
        });
      }
    } finally {
      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return;
      }

      if (!silent) {
        setLoading(false);
      }

      setLiveSyncing(false);
    }
  }

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollToTop("auto");

    const timer = window.setTimeout(() => {
      scrollToTop("auto");
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    latestLoadingRef.current = loading || liveSyncing;
  }, [loading, liveSyncing]);

  useEffect(() => {
    latestFiltersRef.current = {
      page,
      search,
      dateFrom,
      dateTo,
      department: departmentFilter,
      account: accountFilter,
    };
  }, [page, search, dateFrom, dateTo, departmentFilter, accountFilter]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!restoredRef.current) return;
      if (latestLoadingRef.current) return;

      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }

      const latestFilters = latestFiltersRef.current;

      loadAttendance({
        nextPage: 1,
        nextSearch: latestFilters.search,
        nextDateFrom: latestFilters.dateFrom,
        nextDateTo: latestFilters.dateTo,
        nextDepartment: latestFilters.department,
        nextAccount: latestFilters.account,
        silent: true,
        latestPage: true,
      });
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;

    restoredRef.current = true;

    let savedPage = 1;
    let savedSearch = "";
    let savedDateFrom = "";
    let savedDateTo = "";
    let savedDepartment = "All";
    let savedAccount = "All";

    try {
      const savedState = sessionStorage.getItem(KRONOS_ATTENDANCE_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        savedPage = Math.max(Number(parsed?.page || 1), 1);
        savedSearch = cleanString(parsed?.search);
        savedDateFrom = cleanString(parsed?.dateFrom);
        savedDateTo = cleanString(parsed?.dateTo);
        savedDepartment = cleanString(parsed?.department || "All");
        savedAccount = cleanString(parsed?.account || "All");
      }
    } catch (error) {
      console.error("Kronos attendance restore error:", error);
    }

    setPage(savedPage);
    setSearch(savedSearch);
    setSearchInput(savedSearch);
    setDateFrom(savedDateFrom);
    setDateTo(savedDateTo);
    setDepartmentFilter(savedDepartment);
    setAccountFilter(savedAccount);

    loadAttendance({
      nextPage: savedPage,
      nextSearch: savedSearch,
      nextDateFrom: savedDateFrom,
      nextDateTo: savedDateTo,
      nextDepartment: savedDepartment,
      nextAccount: savedAccount,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(event) {
    event.preventDefault();

    const nextSearch = searchInput.trim();

    setSearch(nextSearch);
    setPage(1);

    loadAttendance({
      nextPage: 1,
      nextSearch,
      nextDateFrom: dateFrom,
      nextDateTo: dateTo,
      nextDepartment: departmentFilter,
      nextAccount: accountFilter,
    });
  }

  function handleRefresh() {
    loadAttendance({
      nextPage: 1,
      nextSearch: search,
      nextDateFrom: dateFrom,
      nextDateTo: dateTo,
      nextDepartment: departmentFilter,
      nextAccount: accountFilter,
      latestPage: true,
    });
  }

  function handleClearFilters() {
    setSearch("");
    setSearchInput("");
    setDateFrom("");
    setDateTo("");
    setDepartmentFilter("All");
    setAccountFilter("All");
    setPage(1);

    loadAttendance({
      nextPage: 1,
      nextSearch: "",
      nextDateFrom: "",
      nextDateTo: "",
      nextDepartment: "All",
      nextAccount: "All",
    });
  }

  function handleDateFromChange(value) {
    setDateFrom(value);
    setPage(1);

    loadAttendance({
      nextPage: 1,
      nextSearch: search,
      nextDateFrom: value,
      nextDateTo: dateTo,
      nextDepartment: departmentFilter,
      nextAccount: accountFilter,
    });
  }

  function handleDateToChange(value) {
    setDateTo(value);
    setPage(1);

    loadAttendance({
      nextPage: 1,
      nextSearch: search,
      nextDateFrom: dateFrom,
      nextDateTo: value,
      nextDepartment: departmentFilter,
      nextAccount: accountFilter,
    });
  }

  function handleDepartmentChange(value) {
    setDepartmentFilter(value || "All");
    setAccountFilter("All");
    setPage(1);

    loadAttendance({
      nextPage: 1,
      nextSearch: search,
      nextDateFrom: dateFrom,
      nextDateTo: dateTo,
      nextDepartment: value || "All",
      nextAccount: "All",
    });
  }

  function handleAccountChange(value) {
    setAccountFilter(value || "All");
    setPage(1);

    loadAttendance({
      nextPage: 1,
      nextSearch: search,
      nextDateFrom: dateFrom,
      nextDateTo: dateTo,
      nextDepartment: departmentFilter,
      nextAccount: value || "All",
    });
  }

  function handlePageChange(nextPage) {
    if (loading) return;
    if (nextPage < 1 || nextPage > totalPages) return;

    setPage(nextPage);

    loadAttendance({
      nextPage,
      nextSearch: search,
      nextDateFrom: dateFrom,
      nextDateTo: dateTo,
      nextDepartment: departmentFilter,
      nextAccount: accountFilter,
    });

    scrollToTop("smooth");
  }

  function renderStatusBadge(status) {
    const cleanStatus = normalizeStatus(status);
    const approved = cleanStatus === "approved";

    return (
      <Badge className={getStatusBadgeClass(status)}>
        <span className="mr-1 inline-flex items-center">
          {approved ? <CircleCheckBig size={15} /> : <CircleX size={15} />}
        </span>
        {status || "—"}
      </Badge>
    );
  }

  const pageStart =
    totalRecords > 0 ? (currentPage - 1) * pagination.limit + 1 : 0;

  const pageEnd = Math.min(currentPage * pagination.limit, totalRecords);

  const pageNumbers = [];

  for (
    let item = Math.max(1, currentPage - 2);
    item <= Math.min(totalPages, currentPage + 2);
    item += 1
  ) {
    pageNumbers.push(item);
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main
        ref={mainRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <section className="sibs-page-header-in">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <Clock
                  size={34}
                  strokeWidth={2.2}
                  className="shrink-0 text-sibs-primary-1"
                />

                <h1 className="m-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                  {pageTitle}
                </h1>
              </div>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                {isEmployee
                  ? "View your Kronos attendance records from the production API."
                  : "View Kronos attendance records from the production API."}
              </p>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel"
            style={{ animationDelay: "60ms" }}
          >
            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#101828]">
                    Current Page Summary
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    These totals are based only on the current Kronos attendance
                    records loaded for this page.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-blue-200 bg-blue-50 text-sibs-primary-1">
                    Page {currentPage}
                  </Badge>

                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-600">
                    Live 5s
                  </Badge>

                  {liveSyncing ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sibs-tertiary-5">
                      <RefreshCw size={13} className="animate-spin" />
                      Syncing
                    </span>
                  ) : null}

                  {lastUpdatedAt ? (
                    <span className="text-xs font-bold text-sibs-tertiary-5">
                      Updated{" "}
                      {lastUpdatedAt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading || liveSyncing}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3d68] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={14}
                      className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
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
                  value={
                    loading ? "..." : formatNumber(pageStats.totalWorkHours)
                  }
                  icon={Timer}
                  delay={180}
                />
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm transition-all duration-200 hover:border-sibs-primary-1/20 hover:shadow-md"
            style={{ animationDelay: "120ms" }}
          >
            <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#101828]">
                    Kronos Attendance Records
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Showing {pageStart} to {pageEnd} of {totalRecords} Kronos
                    attendance records.
                  </p>
                </div>

                <form
                  onSubmit={handleSearchSubmit}
                  className="flex w-full flex-col gap-2 xl:w-auto"
                >
                  <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-[280px_160px_160px] xl:w-auto">
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Search employee..."
                        className="h-11 w-full rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
                      />
                    </div>

                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) =>
                        handleDateFromChange(event.target.value)
                      }
                      disabled={loading}
                      className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />

                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) =>
                        handleDateToChange(event.target.value)
                      }
                      disabled={loading}
                      className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>

                  {canFilterAttendance ? (
                    <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-[260px_280px_auto_auto] xl:w-auto">
                      <select
                        value={departmentFilter}
                        onChange={(event) =>
                          handleDepartmentChange(event.target.value)
                        }
                        disabled={loading}
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      >
                        <option value="All">All Departments</option>
                        {departmentDropdownOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={accountFilter}
                        onChange={(event) =>
                          handleAccountChange(event.target.value)
                        }
                        disabled={loading}
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      >
                        <option value="All">All Accounts</option>
                        {accountDropdownOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        disabled={loading}
                        className="h-11 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white transition hover:bg-[#0b3d68] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Search
                      </button>

                      <button
                        type="button"
                        onClick={handleClearFilters}
                        disabled={loading}
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-[auto_auto] xl:w-auto">
                      <button
                        type="submit"
                        disabled={loading}
                        className="h-11 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white transition hover:bg-[#0b3d68] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Search
                      </button>

                      <button
                        type="button"
                        onClick={handleClearFilters}
                        disabled={loading}
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {loadError ? (
              <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {loadError}
              </div>
            ) : null}

            <div className="p-4 sm:p-6">
              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-xl border border-[#E6ECF2]">
                  <div className="max-h-[580px] overflow-auto">
                    <table className="w-full min-w-[1480px] border-collapse bg-white">
                      <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr>
                          <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                            SiBS ID
                          </th>
                          <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                            Employee Name
                          </th>
                          <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                            Department
                          </th>
                          <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                            Account
                          </th>
                          <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                            Site
                          </th>
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

                      <tbody>
                        {loading ? (
                          Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                            <tr key={index}>
                              <td
                                colSpan={15}
                                className="border-t border-[#f3f4f6] px-5 py-4"
                              >
                                <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
                              </td>
                            </tr>
                          ))
                        ) : attendance.length === 0 ? (
                          <tr>
                            <td
                              colSpan={15}
                              className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
                            >
                              No Kronos attendance records found.
                            </td>
                          </tr>
                        ) : (
                          attendance.map((item, index) => {
                            const loginTime = formatTime(item.gy_tracker_login);
                            const breakoutTime = formatTime(
                              item.gy_tracker_breakout,
                            );
                            const breakinTime = formatTime(
                              item.gy_tracker_breakin,
                            );
                            const logoutTime = formatTime(
                              item.gy_tracker_logout,
                            );

                            return (
                              <tr
                                key={`${
                                  item.gy_tracker_id ||
                                  item.gy_tracker_date ||
                                  "row"
                                }-${index}`}
                                className="transition-all duration-200 hover:bg-slate-50"
                              >
                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-sibs-primary-1">
                                  {item.gy_emp_code || "—"}
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#101828]">
                                  {formatEmployeeName(item)}
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                                  {item.department || "—"}
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                                  {item.gy_emp_account || "—"}
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-[#344054]">
                                  {getAssignedSite(item)}
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#344054]">
                                  {formatDate(item.gy_tracker_date)}
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                                  <TimeBadge
                                    value={loginTime}
                                    className={getTimeBadgeClass(
                                      loginTime,
                                      item.login_status,
                                    )}
                                  />
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                                  <TimeBadge
                                    value={breakoutTime}
                                    className={getTimeBadgeClass(
                                      breakoutTime,
                                      "",
                                    )}
                                  />
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                                  <TimeBadge
                                    value={breakinTime}
                                    className={getTimeBadgeClass(
                                      breakinTime,
                                      item.breakin_status,
                                    )}
                                  />
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center">
                                  <TimeBadge
                                    value={logoutTime}
                                    className={getTimeBadgeClass(
                                      logoutTime,
                                      item.logout_status,
                                    )}
                                  />
                                </td>

                                <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-sibs-primary-1">
                                  {getWorkHours(item)}
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
                </div>

                <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
                  Scroll horizontally to view all Kronos attendance fields.
                </p>
              </div>

              <div className="block lg:hidden">
                {loading ? (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                    Loading...
                  </div>
                ) : attendance.length === 0 ? (
                  <div className="rounded-xl border border-[#E6ECF2] bg-white p-6 text-center text-sm font-bold text-gray-500">
                    No Kronos attendance records found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {attendance.map((item, index) => {
                      const loginTime = formatTime(item.gy_tracker_login);
                      const breakoutTime = formatTime(
                        item.gy_tracker_breakout,
                      );
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
                              <p className="m-0 text-xs font-semibold text-sibs-tertiary-5">
                                {item.gy_emp_code || "N/A"}
                              </p>

                              <h3 className="m-0 text-sm font-bold leading-tight text-sibs-primary-1">
                                {formatEmployeeName(item)}
                              </h3>

                              <p className="mt-1 text-xs font-semibold text-[#344054]">
                                {item.department || "No department"} /{" "}
                                {item.gy_emp_account || "No account"} /{" "}
                                {getAssignedSite(item)}
                              </p>

                              <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                                {formatDate(item.gy_tracker_date)}
                              </p>
                            </div>

                            <div className="shrink-0">
                              {renderStatusBadge(item.gy_tracker_status)}
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <MobileMetric
                              label="Login"
                              value={loginTime}
                              className={getTimeBadgeClass(
                                loginTime,
                                item.login_status,
                              )}
                            />

                            <MobileMetric
                              label="Logout"
                              value={logoutTime}
                              className={getTimeBadgeClass(
                                logoutTime,
                                item.logout_status,
                              )}
                            />

                            <MobileMetric
                              label="Start Break"
                              value={breakoutTime}
                              className={getTimeBadgeClass(breakoutTime, "")}
                            />

                            <MobileMetric
                              label="End Break"
                              value={breakinTime}
                              className={getTimeBadgeClass(
                                breakinTime,
                                item.breakin_status,
                              )}
                            />

                            <MobileMetric
                              label="WH"
                              value={getWorkHours(item)}
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

              <div className="mt-5 flex flex-col gap-3 border-t border-[#E6ECF2] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Showing{" "}
                  <span className="font-extrabold text-slate-700">
                    {pageStart}
                  </span>{" "}
                  to{" "}
                  <span className="font-extrabold text-slate-700">
                    {pageEnd}
                  </span>{" "}
                  of{" "}
                  <span className="font-extrabold text-slate-700">
                    {totalRecords}
                  </span>{" "}
                  records
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={loading || liveSyncing || !hasPreviousPage}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  {pageNumbers.map((pageNumber) => {
                    const isActive = pageNumber === currentPage;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => handlePageChange(pageNumber)}
                        disabled={loading || liveSyncing || isActive}
                        className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold transition disabled:cursor-default ${
                          isActive
                            ? "bg-sibs-primary-1 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={loading || liveSyncing || !hasNextPage}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}