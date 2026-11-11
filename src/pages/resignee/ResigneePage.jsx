import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck2, CheckCircle2, Clock3, FileText, RefreshCw, RotateCcw, UsersRound } from "lucide-react";
import Header from "../../components/layout/Header";
import {
  DataCard, MetricCard, MetricGrid, PageHeaderHero, ResponsiveTableShell, SearchInput, SelectDropdown, TablePagination, TableSkeletonRows,
} from "@/components/ui";
import { getResignees, getResigneeStats } from "@/lib/axios/getResignees";
import { getDepartmentDirectoryData } from "@/lib/axios/departments";
import ResigneeAvatar from "./ResigneeAvatar";

const PAGE_SIZE = 15;

function formatDate(value) {
  if (!value) return "—";
  const raw = String(value);
  // Dates from MySQL may be ISO UTC; format as a calendar day without local
  // timezone drift for dates that are already YYYY-MM-DD.
  const day = raw.slice(0, 10);
  const date = new Date(`${day}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? day
    : new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(date);
}

export default function ResigneePage() {
  const navigate = useNavigate();
  const tableScrollRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [accountFilter, setAccountFilter] = useState("All");
  const [directoryDepartments, setDirectoryDepartments] = useState([]);
  const [directoryAccounts, setDirectoryAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [loadedQueryKey, setLoadedQueryKey] = useState(null);
  const queryKey = `${search}\u0001${departmentFilter}\u0001${accountFilter}\u0001${refreshKey}`;
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const hasActiveFilters = useMemo(
    () => Boolean(search.trim() || draft.trim() || departmentFilter !== "All" || accountFilter !== "All"),
    [search, draft, departmentFilter, accountFilter],
  );

  useEffect(() => {
    let mounted = true;
    getDepartmentDirectoryData()
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res?.departments)) {
          setDirectoryDepartments(res.departments);
        }
        if (Array.isArray(res?.accounts)) {
          setDirectoryAccounts(res.accounts);
        }
      })
      .catch(() => {
        // Silently fallback to departments and accounts collected from loaded records
      });
    return () => {
      mounted = false;
    };
  }, []);

  const departmentOptions = useMemo(() => {
    const set = new Set();
    directoryDepartments.forEach((d) => {
      const name = typeof d === "string" ? d : d?.departmentName || d?.department_name || d?.name;
      if (name && String(name).trim()) set.add(String(name).trim());
    });
    rows.forEach((r) => {
      if (r.department && r.department !== "—" && r.department !== "Unassigned") {
        set.add(String(r.department).trim());
      }
    });
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { value: "All", label: "All Departments" },
      ...list.map((item) => ({ value: item, label: item })),
    ];
  }, [directoryDepartments, rows]);

  const accountOptions = useMemo(() => {
    const set = new Set();
    directoryAccounts.forEach((a) => {
      const name = typeof a === "string" ? a : a?.accountName || a?.account_name || a?.name;
      if (name && String(name).trim()) set.add(String(name).trim());
    });
    rows.forEach((r) => {
      if (r.account && r.account !== "—" && r.account !== "Unassigned") {
        set.add(String(r.account).trim());
      }
    });
    const list = Array.from(set).sort((a, b) => a.localeCompare(b));
    return [
      { value: "All", label: "All Accounts" },
      ...list.map((item) => ({ value: item, label: item })),
    ];
  }, [directoryAccounts, rows]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(draft.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    getResignees(
      { page, limit: PAGE_SIZE, search, department: departmentFilter, account: accountFilter },
      controller.signal,
    )
      .then((result) => {
        if (!active) return;
        if (!result?.success || !Array.isArray(result?.data)) {
          throw new Error(result?.message || "Unable to load Resignee records.");
        }
        setRows(result.data);
        // Counts are retrieved separately. Page changes only load 15 records.
        setLoadedQueryKey(queryKey);
        const rawPagination = result.pagination || {};
        const total = Math.max(0, Number(rawPagination.total) || 0);
        const limit = Math.max(1, Number(rawPagination.limit) || PAGE_SIZE);
        const totalPages = Math.max(1, Number(rawPagination.totalPages) || Math.ceil(total / limit) || 1);
        const currentPage = Math.max(1, Number(rawPagination.currentPage || page) || 1);
        setPagination({ currentPage, totalPages, total, limit });
      })
      .catch((requestError) => {
        if (!active || controller.signal.aborted) return;
        setError(requestError?.response?.data?.message || requestError?.message || "Unable to load Resignee records.");
        setStats(null);
        setStatsLoading(false);
        setStatsError("Resignee summary counts are unavailable while records cannot be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [page, search, departmentFilter, accountFilter, refreshKey, queryKey]);

  // Wait until the first page has loaded before running the summary SELECT;
  // avoid overlapping heavyweight counts with the initial page request.
  useEffect(() => {
    if (loadedQueryKey !== queryKey) return undefined;
    const controller = new AbortController();
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatsLoading(true);
    setStatsError("");
    getResigneeStats(
      { search, department: departmentFilter, account: accountFilter, revision: refreshKey },
      controller.signal,
    )
      .then((result) => {
        if (!active) return;
        if (result?.success !== true || !result.stats) {
          throw new Error(result?.message || "Unable to load Resignee counts.");
        }
        setStats(result.stats);
      })
      .catch((requestError) => {
        if (!active || controller.signal.aborted) return;
        setStats(null);
        setStatsError(requestError?.response?.data?.message || "Resignee summary counts are unavailable.");
      })
      .finally(() => { if (active) setStatsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [loadedQueryKey, queryKey, search, departmentFilter, accountFilter, refreshKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(null);
     
    setStatsLoading(true);
    setStatsError("");
  }, [queryKey]);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  const handleClearFilters = useCallback(() => {
    setDraft("");
    setSearch("");
    setDepartmentFilter("All");
    setAccountFilter("All");
    setPage(1);
  }, []);

  const handleDepartmentFilterChange = useCallback((val) => {
    setDepartmentFilter(val || "All");
    setPage(1);
  }, []);

  const handleAccountFilterChange = useCallback((val) => {
    setAccountFilter(val || "All");
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage) => {
    const target = Number(nextPage);
    const maxPages = pagination.totalPages || 1;
    if (!Number.isInteger(target) || target < 1 || target > maxPages || target === page) return;

    setPage(target);
    // Match Employee Directory: reset the records table’s internal scroll.
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
      tableScrollRef.current.scrollLeft = 0;
    }
  }, [page, pagination.totalPages]);

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0"><Header /></div>
      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-col gap-4 sm:gap-5">
          <PageHeaderHero
            kicker="Core HR View"
            title="Resignees"
            description="View inactive Kronos employees whose recorded last working day has passed."
            actions={<div className="flex flex-wrap items-center gap-2">
              <button type="button" aria-label="Refresh resignee records" onClick={refresh} disabled={loading || statsLoading}
                className="sibs-btn-icon"
                title="Refresh"><RefreshCw className={`h-4 w-4 ${loading || statsLoading ? "animate-spin text-sibs-orange" : ""}`} /></button>
              <button type="button" onClick={() => navigate("/resignation")}
                className="sibs-btn-primary">
                <FileText className="h-4 w-4" /> Resignation Management
              </button>
            </div>}
          />

          <MetricGrid columns={4} style={{ animationDelay: "60ms", animationFillMode: "both" }}>
            <MetricCard label="TOTAL RESIGNEES" value={stats?.total?.toLocaleString() ?? "—"} description="Inactive Kronos users with an elapsed last working day" icon={UsersRound} tone="orange" loading={statsLoading} delay={0} />
            <MetricCard label="THIS MONTH" value={stats?.thisMonth?.toLocaleString() ?? "—"} description="Last working date this month" icon={CalendarCheck2} tone="green" loading={statsLoading} delay={60} />
            <MetricCard label="LAST 30 DAYS" value={stats?.last30Days?.toLocaleString() ?? "—"} description="Last working date in past 30 days" icon={Clock3} tone="amber" loading={statsLoading} delay={120} />
            <MetricCard label="ACCOUNTS" value={stats?.accounts?.toLocaleString() ?? "—"} description="Accounts with inactive employees" icon={CheckCircle2} tone="navy" loading={statsLoading} delay={180} />
          </MetricGrid>
          {statsError ? <p role="status" className="sibs-page-card-in sibs-text-xs font-semibold text-amber-700">{statsError} Employee records remain available.</p> : null}

          <section
            className="flex shrink-0 grow flex-col sibs-page-card-in sibs-card min-w-0 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
                    Resignee Records
                  </h2>
                  <p className="sibs-text-xs font-semibold text-sibs-muted">
                    Kronos employee and user records with an elapsed last working day.
                  </p>
                </div>
              </div>

              <div className="relative z-[90] mt-3.5 2xl:mt-4 flex flex-col gap-3 overflow-visible xl:flex-row xl:items-end">
                <div className="relative w-full min-w-0 xl:min-w-[180px] xl:flex-[1_1_220px] 2xl:min-w-[280px] 2xl:flex-[1_1_360px]">
                  <SearchInput
                    label="Search"
                    labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                    placeholder="Search employee, SIBS ID, account, or department..."
                    value={draft}
                    onChange={setDraft}
                    onClear={() => setDraft("")}
                    disabled={loading && rows.length === 0}
                  />
                </div>

                <div className="w-full xl:w-[160px] 2xl:w-[210px] xl:flex-none">
                  <SelectDropdown
                    label="Department"
                    labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                    value={departmentFilter}
                    options={departmentOptions}
                    onChange={handleDepartmentFilterChange}
                    placeholder="All Departments"
                    searchable
                    searchPlaceholder="Search departments..."
                    clearable={false}
                    disabled={loading && rows.length === 0}
                  />
                </div>

                <div className="w-full xl:w-[160px] 2xl:w-[210px] xl:flex-none">
                  <SelectDropdown
                    label="Account"
                    labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                    value={accountFilter}
                    options={accountOptions}
                    onChange={handleAccountFilterChange}
                    placeholder="All Accounts"
                    searchable
                    searchPlaceholder="Search accounts..."
                    clearable={false}
                    disabled={loading && rows.length === 0}
                  />
                </div>

                {hasActiveFilters ? (
                  <div className="flex w-full min-w-0 items-end xl:w-auto xl:flex-none">
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      disabled={loading}
                      className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
                    >
                      <RotateCcw size={14} />
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="sibs-page-card-in m-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 sibs-text-xs font-semibold text-red-700"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={refresh}
                  className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 sibs-text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : null}

            <div className="flex flex-1 flex-col p-3 sm:p-5 2xl:p-6 font-jakarta">
              <ResponsiveTableShell
                desktopContent={
                  <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
                    <div ref={tableScrollRef} className="max-h-[620px] overflow-auto sibs-scrollbar">
                      <table className="w-full min-w-[1100px] border-collapse bg-white text-left">
                        <thead className="sticky top-0 z-10 bg-sibs-surface">
                          <tr className="border-b border-sibs-border">
                            <th scope="col" className="sibs-data-table-th w-[100px] whitespace-nowrap text-left">SIBS ID</th>
                            <th scope="col" className="sibs-data-table-th w-[260px] whitespace-nowrap text-left">Employee Name</th>
                            <th scope="col" className="sibs-data-table-th w-[180px] whitespace-nowrap text-left">Department</th>
                            <th scope="col" className="sibs-data-table-th w-[180px] whitespace-nowrap text-left">Account</th>
                            <th scope="col" className="sibs-data-table-th w-[140px] whitespace-nowrap text-center">Hire Date</th>
                            <th scope="col" className="sibs-data-table-th w-[160px] whitespace-nowrap text-center">Last Working Day</th>
                            <th scope="col" className="sibs-data-table-th w-[140px] whitespace-nowrap text-center">Kronos Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sibs-border" aria-busy={loading}>
                          {loading && rows.length === 0 ? (
                            <TableSkeletonRows
                              count={PAGE_SIZE}
                              columns={7}
                              cellClassName="px-3 2xl:px-4 py-3.5 align-middle"
                            />
                          ) : rows.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-16 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <UsersRound className="h-8 w-8 text-sibs-muted" />
                                  <p className="sibs-text-sm font-bold text-sibs-navy">
                                    {error ? "Resignee records could not be loaded." : "No resignee records found."}
                                  </p>
                                  <p className="sibs-text-xs font-semibold text-sibs-muted">
                                    {error ? error : "Try adjusting your search or filter criteria."}
                                  </p>
                                  {error ? (
                                    <button
                                      type="button"
                                      onClick={refresh}
                                      className="sibs-btn-secondary mt-2"
                                    >
                                      Retry
                                    </button>
                                  ) : hasActiveFilters ? (
                                    <button
                                      type="button"
                                      onClick={handleClearFilters}
                                      className="sibs-btn-secondary mt-2"
                                    >
                                      Clear Filters
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ) : (
                            rows.map((record, index) => (
                              <tr
                                key={record.employeeId ? `emp-${record.employeeId}` : (record.sibsId ? `sibs-${record.sibsId}` : `row-${index}`)}
                                className="border-b border-sibs-border transition-colors hover:bg-sibs-cream-light"
                              >
                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-extrabold tabular-nums text-sibs-orange">
                                  {record.sibsId}
                                </td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                                  <div className="flex min-w-[200px] items-center gap-2.5 2xl:gap-3">
                                    <ResigneeAvatar record={record} />
                                    <span className="break-words sibs-text-xs font-extrabold leading-tight text-sibs-navy transition-colors group-hover:text-sibs-orange">
                                      {record.employeeName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-medium text-sibs-text-secondary">
                                  {record.department || "—"}
                                </td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-medium text-sibs-text-secondary">
                                  {record.account || "—"}
                                </td>
                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center align-middle sibs-text-xs font-medium tabular-nums text-sibs-text-secondary">
                                  {formatDate(record.hireDate)}
                                </td>
                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-center align-middle sibs-text-xs font-semibold tabular-nums text-sibs-navy">
                                  {formatDate(record.lastWorkingDate)}
                                </td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center align-middle">
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wider text-slate-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" /> {record.statusLabel || "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
                mobileContent={
                  <div>
                    {loading && rows.length === 0 ? (
                      <DataCard.Skeleton count={5} lines={3} />
                    ) : rows.length === 0 ? (
                      <DataCard.Empty
                        icon={<UsersRound size={22} />}
                        title="No resignees found"
                        description={error || "Try adjusting your search or filter criteria."}
                      />
                    ) : (
                      <div className="space-y-3">
                        {rows.map((record, index) => (
                          <DataCard
                            key={record.employeeId ? `emp-${record.employeeId}` : (record.sibsId ? `sibs-${record.sibsId}` : `card-${index}`)}
                            index={index}
                          >
                            <DataCard.Header
                              avatar={<ResigneeAvatar record={record} />}
                              kicker={`SIBS ID ${record.sibsId || "—"}`}
                              title={record.employeeName}
                              subtitle={record.account || "Unassigned"}
                            />
                            <DataCard.ContextRow>
                              <span className="sibs-text-micro font-medium text-sibs-muted">
                                Department: <strong className="font-bold text-sibs-navy">{record.department || "—"}</strong>
                              </span>
                            </DataCard.ContextRow>
                            <DataCard.Metrics cols={2}>
                              <DataCard.MetricItem
                                label="Hire Date"
                                value={formatDate(record.hireDate)}
                                valueClassName="tabular-nums font-semibold"
                              />
                              <DataCard.MetricItem
                                label="Last Working Day"
                                value={formatDate(record.lastWorkingDate)}
                                valueClassName="tabular-nums font-semibold"
                              />
                            </DataCard.Metrics>
                            <DataCard.Footer
                              actionLabel={null}
                              metadata={
                                <span className="inline-flex items-center gap-1.5 sibs-text-micro font-extrabold uppercase tracking-wider text-slate-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                                  {record.statusLabel || "Inactive (Kronos)"}
                                </span>
                              }
                            />
                          </DataCard>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />

              <div className="mt-auto pt-4 2xl:pt-5">
                <TablePagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalRecords={pagination.total}
                  limit={PAGE_SIZE}
                  pageSize={PAGE_SIZE}
                  loadedCount={rows.length}
                  recordLabel="resignee records"
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
