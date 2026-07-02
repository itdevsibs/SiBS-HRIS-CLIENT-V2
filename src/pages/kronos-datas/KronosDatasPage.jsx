import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  Search,
  Server,
  Users,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { getKronosDatas } from "../../lib/axios/getKronosDatas";

const PAGE_LIMIT = 15;
const KRONOS_STATE_KEY = "kronosDatasPageState";

const animationTiming = {
  header: 0,
  summary: 60,
  table: 120,

  summaryCardBase: 0,
  summaryCardStagger: 60,
};

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

function cleanString(value) {
  return String(value || "").trim();
}

function formatFullName(row) {
  const fullName = cleanString(row?.fullName || row?.full_name);

  if (fullName) return fullName;

  return [
    row?.firstName || row?.first_name || row?.gy_emp_fname,
    row?.middleName || row?.middle_name || row?.gy_emp_mname,
    row?.lastName || row?.last_name || row?.gy_emp_lname,
  ]
    .map(cleanString)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value) {
  if (!value) return "—";

  if (String(value).trim() === "0000-00-00") {
    return "0000-00-00";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function getEmployeeSibsId(employee) {
  return (
    employee?.sibsId ||
    employee?.sibs_id ||
    employee?.gy_emp_code ||
    employee?.gy_user_code ||
    employee?.employee_id ||
    "—"
  );
}

function getEmployeeEmail(employee) {
  return (
    employee?.email ||
    employee?.Email ||
    employee?.EMAIL ||
    employee?.emailAddress ||
    employee?.email_address ||
    employee?.EmailAddress ||
    employee?.employeeEmail ||
    employee?.employee_email ||
    employee?.empEmail ||
    employee?.emp_email ||
    employee?.workEmail ||
    employee?.work_email ||
    employee?.companyEmail ||
    employee?.company_email ||
    employee?.officialEmail ||
    employee?.official_email ||
    employee?.gy_emp_email ||
    employee?.gy_email ||
    employee?.gy_user_email ||
    employee?.gy_user_emailadd ||
    employee?.gy_emp_emailadd ||
    employee?.user_email ||
    employee?.username ||
    employee?.raw?.email ||
    employee?.raw?.Email ||
    employee?.raw?.EMAIL ||
    employee?.raw?.emailAddress ||
    employee?.raw?.email_address ||
    employee?.raw?.employeeEmail ||
    employee?.raw?.employee_email ||
    employee?.raw?.empEmail ||
    employee?.raw?.emp_email ||
    employee?.raw?.workEmail ||
    employee?.raw?.work_email ||
    employee?.raw?.companyEmail ||
    employee?.raw?.company_email ||
    employee?.raw?.officialEmail ||
    employee?.raw?.official_email ||
    employee?.raw?.gy_emp_email ||
    employee?.raw?.gy_email ||
    employee?.raw?.gy_user_email ||
    employee?.raw?.gy_user_emailadd ||
    employee?.raw?.gy_emp_emailadd ||
    employee?.raw?.user_email ||
    employee?.raw?.username ||
    "—"
  );
}

function getEmployeeContact(employee) {
  return (
    employee?.contact ||
    employee?.contactNumber ||
    employee?.contact_number ||
    employee?.phone ||
    employee?.mobile ||
    employee?.gy_contact_num ||
    employee?.raw?.contact ||
    employee?.raw?.contactNumber ||
    employee?.raw?.contact_number ||
    employee?.raw?.phone ||
    employee?.raw?.mobile ||
    employee?.raw?.gy_contact_num ||
    "—"
  );
}

function getEmployeeDepartment(employee) {
  return (
    employee?.department ||
    employee?.departmentName ||
    employee?.department_name ||
    employee?.name_department ||
    "—"
  );
}

function getEmployeeAccount(employee) {
  return (
    employee?.account ||
    employee?.accountName ||
    employee?.account_name ||
    employee?.gy_acc_name ||
    employee?.gy_emp_account ||
    "—"
  );
}

function getEmployeeSite(employee) {
  return employee?.site || employee?.location || employee?.workSite || "—";
}

function getEmployeeHireDate(employee) {
  return (
    employee?.hireDate ||
    employee?.hire_date ||
    employee?.dateHired ||
    employee?.date_hired ||
    employee?.gy_emp_hiredate ||
    ""
  );
}

function SummaryCard({ label, value, icon: Icon, delay = 0 }) {
  return (
    <div
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
            {label}
          </p>

          <p className="mt-3 truncate text-3xl font-extrabold leading-none text-sibs-primary-1">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return Array.from({ length: 8 }).map((_, index) => (
    <tr key={index}>
      <td colSpan={9} className="px-5 py-4">
        <div className="h-5 animate-pulse rounded bg-slate-100" />
      </td>
    </tr>
  ));
}

function MobileLoadingCards() {
  return Array.from({ length: 5 }).map((_, index) => (
    <div
      key={index}
      className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
    >
      <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-slate-100" />
    </div>
  ));
}

export default function KronosDatasPage() {
  const mainScrollRef = useRef(null);
  const restoredRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const [records, setRecords] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [account, setAccount] = useState("All");

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [access, setAccess] = useState({
    canFilterEmployees: true,
    role: "",
    tokenType: "",
    adminAccess: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: PAGE_LIMIT,
  });

  const canFilterEmployees = access?.canFilterEmployees !== false;

  function scrollToTop(behavior = "auto") {
    requestAnimationFrame(() => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({
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
        KRONOS_STATE_KEY,
        JSON.stringify({
          page: nextState.page || 1,
          search: nextState.search || "",
          department: nextState.department || "All",
          account: nextState.account || "All",
        }),
      );
    } catch (err) {
      console.error("Kronos page state save error:", err);
    }
  }

  async function loadRecords({
    nextPage = page,
    nextSearch = search,
    nextDepartment = department,
    nextAccount = account,
  } = {}) {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    setLoading(true);
    setLoadError("");

    try {
      const response = await getKronosDatas(
        nextPage,
        nextSearch,
        nextAccount,
        {
          department: nextDepartment,
          includeDepartments: true,
          includeAccounts: true,
          limit: PAGE_LIMIT,
        },
      );

      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return;
      }

      if (response.success) {
        const nextPagination = {
          currentPage: Number(response.pagination?.currentPage || nextPage || 1),
          totalPages: Number(response.pagination?.totalPages || 1),
          total: Number(response.pagination?.total || 0),
          limit: Number(response.pagination?.limit || PAGE_LIMIT),
        };

        const nextSelectedDepartment =
          response.selectedDepartment || nextDepartment || "All";

        const nextSelectedAccount =
          response.selectedAccount || nextAccount || "All";

        setRecords(response.data || []);
        setDepartmentOptions(response.departmentOptions || []);
        setAccountOptions(response.accountOptions || []);
        setDepartment(nextSelectedDepartment);
        setAccount(nextSelectedAccount);
        setPagination(nextPagination);
        setPage(nextPagination.currentPage);

        if (response.access) {
          setAccess(response.access);
        }

        savePageState({
          page: nextPagination.currentPage,
          search: nextSearch || "",
          department: nextSelectedDepartment,
          account: nextSelectedAccount,
        });
      } else {
        setRecords([]);
        setDepartmentOptions([]);
        setAccountOptions([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: PAGE_LIMIT,
        });
        setLoadError(response.message || "Failed to load Kronos data.");
      }
    } catch (error) {
      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) {
        return;
      }

      console.error("Kronos load records error:", error);

      setRecords([]);
      setDepartmentOptions([]);
      setAccountOptions([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit: PAGE_LIMIT,
      });
      setLoadError(error?.message || "Failed to load Kronos data.");
    } finally {
      if (isMountedRef.current && latestRequestIdRef.current === requestId) {
        setLoading(false);
      }
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
    if (restoredRef.current) return;

    restoredRef.current = true;

    let savedPage = 1;
    let savedSearch = "";
    let savedDepartment = "All";
    let savedAccount = "All";

    try {
      const savedState = sessionStorage.getItem(KRONOS_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        savedPage = Math.max(Number(parsed?.page || 1), 1);
        savedSearch = cleanString(parsed?.search);
        savedDepartment = cleanString(parsed?.department || "All");
        savedAccount = cleanString(parsed?.account || "All");
      }
    } catch (err) {
      console.error("Kronos page state restore error:", err);
    }

    setPage(savedPage);
    setSearch(savedSearch);
    setSearchInput(savedSearch);
    setDepartment(savedDepartment);
    setAccount(savedAccount);

    loadRecords({
      nextPage: savedPage,
      nextSearch: savedSearch,
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

    loadRecords({
      nextPage: 1,
      nextSearch,
      nextDepartment: department,
      nextAccount: account,
    });
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);

    loadRecords({
      nextPage: 1,
      nextSearch: "",
      nextDepartment: department,
      nextAccount: account,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setDepartment("All");
    setAccount("All");
    setPage(1);

    loadRecords({
      nextPage: 1,
      nextSearch: "",
      nextDepartment: "All",
      nextAccount: "All",
    });
  }

  function handleDepartmentChange(event) {
    const nextDepartment = event.target.value;

    setDepartment(nextDepartment);
    setAccount("All");
    setPage(1);

    loadRecords({
      nextPage: 1,
      nextSearch: search,
      nextDepartment,
      nextAccount: "All",
    });
  }

  function handleAccountChange(event) {
    const nextAccount = event.target.value;

    setAccount(nextAccount);
    setPage(1);

    loadRecords({
      nextPage: 1,
      nextSearch: search,
      nextDepartment: department,
      nextAccount,
    });
  }

  function handlePageChange(nextPage) {
    if (loading) return;
    if (nextPage < 1 || nextPage > pagination.totalPages) return;

    setPage(nextPage);

    loadRecords({
      nextPage,
      nextSearch: search,
      nextDepartment: department,
      nextAccount: account,
    });

    scrollToTop("smooth");
  }

  function handleRefresh() {
    loadRecords({
      nextPage: page,
      nextSearch: search,
      nextDepartment: department,
      nextAccount: account,
    });
  }

  const pageStart =
    pagination.total > 0
      ? (pagination.currentPage - 1) * pagination.limit + 1
      : 0;

  const pageEnd = Math.min(
    pagination.currentPage * pagination.limit,
    pagination.total,
  );

  const pageNumbers = [];

  for (
    let item = Math.max(1, pagination.currentPage - 2);
    item <= Math.min(pagination.totalPages, pagination.currentPage + 2);
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
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="mx-auto max-w-[1600px] space-y-5">
          <section
            className="sibs-page-header-in"
            style={getAnimationStyle(animationTiming.header)}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Database
                size={34}
                strokeWidth={2.2}
                className="shrink-0 text-sibs-primary-1"
              />

              <h1 className="m-0 min-w-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                Kronos Datas
              </h1>
            </div>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Production employee records loaded from the Kronos Datas API.
            </p>
          </section>

          <section
            className="sibs-profile-tab-panel"
            style={getAnimationStyle(animationTiming.summary)}
          >
            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#101828]">
                    Kronos Employee Summary
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Overview of production employee records from Kronos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex w-max items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
                    Production API
                  </span>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="inline-flex h-9 w-max items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0b3d68] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={14}
                      className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryCard
                  label="Total Employees"
                  value={pagination.total}
                  icon={Users}
                  delay={
                    animationTiming.summaryCardBase +
                    0 * animationTiming.summaryCardStagger
                  }
                />

                <SummaryCard
                  label="Displayed"
                  value={records.length}
                  icon={Search}
                  delay={
                    animationTiming.summaryCardBase +
                    1 * animationTiming.summaryCardStagger
                  }
                />

                <SummaryCard
                  label="Departments"
                  value={departmentOptions.length}
                  icon={Building2}
                  delay={
                    animationTiming.summaryCardBase +
                    2 * animationTiming.summaryCardStagger
                  }
                />
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel min-h-[520px] overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm transition-all duration-200 hover:border-sibs-primary-1/20 hover:shadow-md"
            style={getAnimationStyle(animationTiming.table)}
          >
            <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#101828]">
                      Employee Records
                    </h2>

                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <Server size={12} />
                      Kronos Datas
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    Showing {pageStart} to {pageEnd} of {pagination.total}{" "}
                    production employee records. Only {PAGE_LIMIT} records are
                    loaded per page.
                  </p>
                </div>

                <form
                  onSubmit={handleSearchSubmit}
                  className="flex w-full flex-col gap-2 lg:flex-row xl:w-auto"
                >
                  <div className="relative w-full lg:w-[280px]">
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

                  {canFilterEmployees ? (
                    <>
                      <select
                        value={department}
                        onChange={handleDepartmentChange}
                        disabled={loading}
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      >
                        <option value="All">All Departments</option>
                        {departmentOptions.map((item) => (
                          <option
                            key={item.value || item.label || item}
                            value={item.value || item.label || item}
                          >
                            {item.label || item}
                          </option>
                        ))}
                      </select>

                      <select
                        value={account}
                        onChange={handleAccountChange}
                        disabled={loading}
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
                      >
                        <option value="All">All Accounts</option>
                        {accountOptions.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white transition hover:bg-[#0b3d68] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Search
                  </button>

                  {search ? (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      disabled={loading}
                      className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      disabled={loading}
                      className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reset
                    </button>
                  )}
                </form>
              </div>
            </div>

            {loadError ? (
              <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {loadError}
              </div>
            ) : null}

            <div className="sibs-page-card-in" style={getAnimationStyle(60)}>
              <div className="grid gap-3 p-4 lg:hidden">
                {loading ? <MobileLoadingCards /> : null}

                {!loading && records.length > 0
                  ? records.map((employee, index) => {
                      const rowNumber =
                        (pagination.currentPage - 1) * pagination.limit +
                        index +
                        1;

                      return (
                        <article
                          key={`mobile-${getEmployeeSibsId(employee)}-${rowNumber}`}
                          className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                                #{rowNumber}
                              </p>

                              <h3 className="mt-1 truncate text-sm font-extrabold text-[#101828]">
                                {formatFullName(employee) || "—"}
                              </h3>

                              <p className="mt-0.5 text-xs font-bold text-sibs-primary-1">
                                {getEmployeeSibsId(employee)}
                              </p>
                            </div>

                            <span className="inline-flex shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-extrabold text-sibs-primary-1">
                              {getEmployeeSite(employee)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-2 text-sm">
                            <div className="flex justify-between gap-3">
                              <span className="font-bold text-slate-400">
                                Email
                              </span>
                              <span className="text-right font-medium text-slate-700">
                                {getEmployeeEmail(employee)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="font-bold text-slate-400">
                                Contact Number
                              </span>
                              <span className="text-right font-medium text-slate-700">
                                {getEmployeeContact(employee)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="font-bold text-slate-400">
                                Department
                              </span>
                              <span className="text-right font-medium text-slate-700">
                                {getEmployeeDepartment(employee)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="font-bold text-slate-400">
                                Account
                              </span>
                              <span className="text-right font-medium text-slate-700">
                                {getEmployeeAccount(employee)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-3">
                              <span className="font-bold text-slate-400">
                                Hire Date
                              </span>
                              <span className="text-right font-medium text-slate-700">
                                {formatDate(getEmployeeHireDate(employee))}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  : null}

                {!loading && records.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D9E2EC] bg-white px-5 py-12 text-center text-sm font-medium text-slate-500">
                    No Kronos employee records found.
                  </div>
                ) : null}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-[#E6ECF2]">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        #
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        SIBS ID
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        Employee
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        Email
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        Contact Number
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        Department
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        Account
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        Site
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                        Hire Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEF2F6] bg-white">
                    {loading ? (
                      <LoadingRows />
                    ) : records.length > 0 ? (
                      records.map((employee, index) => {
                        const rowNumber =
                          (pagination.currentPage - 1) * pagination.limit +
                          index +
                          1;

                        return (
                          <tr
                            key={`${getEmployeeSibsId(employee)}-${rowNumber}`}
                            className="transition hover:bg-[#F8FAFC]"
                          >
                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-500">
                              {rowNumber}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm font-extrabold text-sibs-primary-1">
                              {getEmployeeSibsId(employee)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <p className="text-sm font-bold text-[#101828]">
                                {formatFullName(employee) || "—"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                              {getEmployeeEmail(employee)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                              {getEmployeeContact(employee)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                              {getEmployeeDepartment(employee)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                              {getEmployeeAccount(employee)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                                {getEmployeeSite(employee)}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                              {formatDate(getEmployeeHireDate(employee))}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-14 text-center text-sm font-medium text-slate-500"
                        >
                          No Kronos employee records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#E6ECF2] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
                    {pagination.total}
                  </span>{" "}
                  records
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={loading || pagination.currentPage <= 1}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  {pageNumbers.map((pageNumber) => {
                    const isActive = pageNumber === pagination.currentPage;

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => handlePageChange(pageNumber)}
                        disabled={loading || isActive}
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
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={
                      loading || pagination.currentPage >= pagination.totalPages
                    }
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