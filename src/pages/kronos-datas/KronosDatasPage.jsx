import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Building2,
  Database,
  RefreshCw,
  Search,
  Server,
  Users,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { PageHeaderHero, TablePagination, TableEmptyRow, DataCard, ResponsiveTableShell } from "@/components/ui";

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
          <PageHeaderHero
            kicker={
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-sibs-navy">
                  <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                  Core HR View
                </span>
                <span className="inline-flex w-max items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold text-sibs-navy">
                  Production API
                </span>
              </div>
            }
            title="Kronos Datas"
            description="Production employee records loaded from the Kronos Datas API."
            actions={
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh Kronos Datas"
                className="sibs-btn-icon"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                    loading ? "animate-spin text-sibs-orange" : ""
                  }`}
                />
              </button>
            }
          />

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
              <ResponsiveTableShell
                breakpoint="lg"
                mobileContent={
                  loading ? (
                    <DataCard.Skeleton count={5} lines={3} />
                  ) : records.length === 0 ? (
                    <DataCard.Empty
                      title="No Kronos Records Found"
                      description="Adjust your search or filter parameters to see records."
                    />
                  ) : (
                    <div className="space-y-3">
                      {records.map((employee, index) => {
                        const rowNumber =
                          (pagination.currentPage - 1) * pagination.limit +
                          index +
                          1;

                        return (
                          <DataCard
                            key={`mobile-${getEmployeeSibsId(employee)}-${rowNumber}`}
                            className="transition hover:border-sibs-orange/40 hover:shadow-md"
                          >
                            <DataCard.Header
                              title={formatFullName(employee) || "—"}
                              subtitle={
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-sibs-orange tabular-nums">
                                    {getEmployeeSibsId(employee)}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-400">
                                    #{rowNumber}
                                  </span>
                                </div>
                              }
                              badge={
                                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-sibs-primary-1">
                                  {getEmployeeSite(employee)}
                                </span>
                              }
                            />

                            <DataCard.ContextRow>
                              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {getEmployeeDepartment(employee)}
                              </span>
                              <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-sibs-primary-1">
                                {getEmployeeAccount(employee)}
                              </span>
                            </DataCard.ContextRow>

                            <DataCard.Metrics cols={2}>
                              <DataCard.MetricItem
                                label="Email"
                                value={getEmployeeEmail(employee)}
                              />
                              <DataCard.MetricItem
                                label="Contact Number"
                                value={getEmployeeContact(employee)}
                              />
                              <DataCard.MetricItem
                                label="Hire Date"
                                value={formatDate(getEmployeeHireDate(employee))}
                              />
                              <DataCard.MetricItem
                                label="Site"
                                value={getEmployeeSite(employee)}
                              />
                            </DataCard.Metrics>
                          </DataCard>
                        );
                      })}
                    </div>
                  )
                }
                desktopContent={
                  <div className="overflow-x-auto sibs-scrollbar">
                    <table className="min-w-full divide-y divide-[#E6ECF2] bg-white text-left">
                      <thead className="sticky top-0 z-10 bg-[#F5F7FA]">
                        <tr className="text-xs font-extrabold uppercase tracking-wider text-[#174A7C]">
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            #
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            SIBS ID
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            Employee Name
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            Email
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            Contact Number
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            Department
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            Account
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
                            Site
                          </th>
                          <th className="px-3 2xl:px-4 py-3 text-left">
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
                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5 sibs-text-xs font-medium text-slate-500">
                                  {rowNumber}
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5 sibs-text-xs font-extrabold text-[#FF5C28] tabular-nums">
                                  {getEmployeeSibsId(employee)}
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5">
                                  <p className="m-0 max-w-[220px] truncate sibs-text-xs font-extrabold text-[#042C51]">
                                    {formatFullName(employee) || "—"}
                                  </p>
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5 sibs-text-xs font-medium text-slate-700">
                                  {getEmployeeEmail(employee)}
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5 sibs-text-xs font-medium text-slate-700">
                                  {getEmployeeContact(employee)}
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5 sibs-text-xs font-semibold text-[#344054]">
                                  {getEmployeeDepartment(employee)}
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5 sibs-text-xs font-semibold text-[#344054]">
                                  {getEmployeeAccount(employee)}
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5">
                                  <span className="inline-flex rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 sibs-text-micro font-extrabold uppercase text-[#164E7A]">
                                    {getEmployeeSite(employee)}
                                  </span>
                                </td>

                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2.5 sibs-text-xs font-semibold text-[#52637A]">
                                  {formatDate(getEmployeeHireDate(employee))}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <TableEmptyRow
                            colSpan={9}
                            title="No Kronos employee records found"
                            description="Adjust your search or filter parameters to see records."
                          />
                        )}
                      </tbody>
                    </table>
                  </div>
                }
              />

              <TablePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                loading={loading}
                onPageChange={handlePageChange}
                itemName="records"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}