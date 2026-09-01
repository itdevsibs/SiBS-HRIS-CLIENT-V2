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
      className="sibs-metric-card flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta"
      style={getAnimationStyle(delay)}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 self-stretch flex flex-col justify-between h-full">
          <div>
            <p className="m-0 truncate sibs-text-micro font-extrabold uppercase tracking-wide text-[#98A2B3]">
              {label}
            </p>

            <p className="font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight text-[#042C51]">
              {value}
            </p>
          </div>
        </div>

        <div className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full bg-[#EBF3FB] text-[#042C51]">
          <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
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
        className="sibs-dashboard-main-wide"
      >
        <div className="mx-auto w-full max-w-[1700px] space-y-5">
          <section
            className="sibs-page-header-in sibs-card relative overflow-hidden p-4 font-jakarta 2xl:p-6"
            style={getAnimationStyle(animationTiming.header)}
          >
            <span className="sibs-top-accent" aria-hidden="true" />
            <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-navy">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                    Core HR View
                  </span>
                  <span className="inline-flex w-max items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold text-sibs-navy">
                    Production API
                  </span>
                </div>
                <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
                  Kronos Datas
                </h1>
                <p className="sibs-text-sm font-semibold leading-relaxed text-sibs-muted">
                  Production employee records loaded from the Kronos Datas API.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh Kronos Datas"
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 shrink-0 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      loading ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          <section
            className="sibs-profile-tab-panel"
            style={getAnimationStyle(animationTiming.summary)}
          >
            <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div>
                <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
                  Kronos Employee Summary
                </h2>

                <p className="mt-0.5 sibs-text-xs font-semibold text-[#667085]">
                  Overview of production employee records from Kronos.
                </p>
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
                  <div className="flex flex-wrap items-center gap-2 font-jakarta">
                    <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
                      Employee Records
                    </h2>

                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-primary-1">
                      <Server size={12} />
                      Kronos Datas
                    </span>
                  </div>

                  <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
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
                      className="h-11 w-full rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] pl-10 pr-3 sibs-text-xs font-medium text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:bg-white focus:ring-4 focus:ring-sibs-primary-1/10"
                    />
                  </div>

                  {canFilterEmployees ? (
                    <>
                      <select
                        value={department}
                        onChange={handleDepartmentChange}
                        disabled={loading}
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 sibs-text-xs font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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
                        className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-3 sibs-text-xs font-bold text-slate-700 outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
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

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-11 rounded-xl bg-sibs-primary-1 px-4 sibs-text-xs font-bold text-white transition hover:bg-[#0b3d68] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Search
                    </button>

                    <button
                      type="button"
                      onClick={handleClearFilters}
                      disabled={loading}
                      className="h-11 rounded-xl border border-[#D9E2EC] bg-white px-4 sibs-text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {loadError ? (
              <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {loadError}
              </div>
            ) : null}

            <div className="sibs-page-card-in font-jakarta" style={getAnimationStyle(60)}>
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
                              <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-slate-400">
                                #{rowNumber}
                              </p>

                              <h3 className="mt-1 truncate sibs-text-xs font-extrabold text-[#101828]">
                                {formatFullName(employee) || "—"}
                              </h3>

                              <p className="mt-0.5 sibs-text-xs font-bold text-sibs-primary-1">
                                {getEmployeeSibsId(employee)}
                              </p>
                            </div>

                            <span className="inline-flex shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 sibs-text-micro font-extrabold text-sibs-primary-1">
                              {getEmployeeSite(employee)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-2 sibs-text-xs">
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
                  <div className="rounded-2xl border border-dashed border-[#D9E2EC] bg-white px-5 py-12 text-center sibs-text-xs font-medium text-slate-500">
                    No Kronos employee records found.
                  </div>
                ) : null}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-[#E6ECF2]">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        #
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        SIBS ID
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        Employee Name
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        Email
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        Contact Number
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        Department
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        Account
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
                        Site
                      </th>
                      <th className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-left sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">
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
                            className="transition hover:bg-[#FFF8F5]"
                          >
                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-medium text-slate-500">
                              {rowNumber}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-extrabold text-[#FF5C28] tabular-nums">
                              {getEmployeeSibsId(employee)}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5">
                              <p className="m-0 max-w-[220px] truncate sibs-text-xs font-extrabold text-[#042C51]">
                                {formatFullName(employee) || "—"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-medium text-slate-700">
                              {getEmployeeEmail(employee)}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-medium text-slate-700">
                              {getEmployeeContact(employee)}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#344054]">
                              {getEmployeeDepartment(employee)}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#344054]">
                              {getEmployeeAccount(employee)}
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5">
                              <span className="inline-flex rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 sibs-text-micro font-extrabold uppercase text-[#164E7A]">
                                {getEmployeeSite(employee)}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 sibs-text-xs font-semibold text-[#52637A]">
                              {formatDate(getEmployeeHireDate(employee))}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-14 text-center sibs-text-xs font-medium text-slate-500"
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