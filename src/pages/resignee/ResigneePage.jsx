import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck2, CheckCircle2, Clock3, FileText, RefreshCw, UsersRound } from "lucide-react";
import Header from "../../components/layout/Header";
import {
  DataCard, MetricCard, MetricGrid, PageHeaderHero, ResponsiveTableShell, SearchInput, TablePagination, TableSkeletonRows,
} from "@/components/ui";
import { getResignees } from "@/lib/axios/getResignees";
import ResigneeAvatar from "./ResigneeAvatar";

const PAGE_SIZE = 15;
const EMPTY = { total: 0, thisMonth: 0, last30Days: 0, accounts: 0 };

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
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(EMPTY);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    setLoading(true);
    setError("");
    getResignees({ page, limit: PAGE_SIZE, search }, controller.signal)
      .then((result) => {
        if (!active) return;
        if (!result?.success || !Array.isArray(result?.data)) {
          throw new Error(result?.message || "Unable to load Resignee records.");
        }
        setRows(result.data);
        setStats(result.stats || EMPTY);
        setPagination(result.pagination || { currentPage: page, totalPages: 1, total: 0, limit: PAGE_SIZE });
      })
      .catch((requestError) => {
        if (!active || controller.signal.aborted) return;
        setError(requestError?.response?.data?.message || requestError?.message || "Unable to load Resignee records.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [page, search, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  const handlePageChange = useCallback((nextPage) => {
    const target = Number(nextPage);
    if (!Number.isInteger(target) || target < 1 || target > pagination.totalPages || target === page) return;

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
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker="Core HR View"
            title="Resignees"
            description="View inactive Kronos employees whose recorded last working day has passed."
            actions={<div className="flex flex-wrap items-center gap-2">
              <button type="button" aria-label="Refresh resignee records" onClick={refresh}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-sibs-border bg-white text-sibs-navy hover:text-sibs-orange"
                title="Refresh"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
              <button type="button" onClick={() => navigate("/resignation")}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-sibs-orange px-4 text-xs font-bold text-white hover:opacity-90">
                <FileText className="h-4 w-4" /> Resignation Management
              </button>
            </div>}
          />

          <MetricGrid columns={4}>
            <MetricCard label="TOTAL RESIGNEES" value={stats.total.toLocaleString()} description="Inactive Kronos users with an elapsed last working day" icon={UsersRound} tone="orange" loading={loading && !rows.length} />
            <MetricCard label="THIS MONTH" value={stats.thisMonth.toLocaleString()} description="Last working date this month" icon={CalendarCheck2} tone="green" loading={loading && !rows.length} />
            <MetricCard label="LAST 30 DAYS" value={stats.last30Days.toLocaleString()} description="Last working date in past 30 days" icon={Clock3} tone="amber" loading={loading && !rows.length} />
            <MetricCard label="ACCOUNTS" value={stats.accounts.toLocaleString()} description="Accounts with inactive employees" icon={CheckCircle2} tone="navy" loading={loading && !rows.length} />
          </MetricGrid>

          <section className="overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-sibs-border-subtle p-4 2xl:p-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-heading text-sm font-bold text-sibs-navy 2xl:text-base">Resignee Records</h2>
                <p className="mt-1 text-xs font-medium text-sibs-muted">Kronos employee and user records with an elapsed last working day.</p>
              </div>
              <div className="w-full md:max-w-sm">
                <SearchInput label="Search" placeholder="Search employee, SIBS ID, account, or department..." value={draft} onChange={setDraft} onClear={() => setDraft("")} />
              </div>
            </div>
            {error ? (
              <div role="alert" className="m-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <span>{error}</span><button type="button" onClick={refresh} className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5">Retry</button>
              </div>
            ) : null}
            <div className="p-4 sm:p-5 2xl:p-6">
              <div className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs">
                <ResponsiveTableShell
                  desktopContent={
                    <div className="overflow-hidden bg-white">
                      <div ref={tableScrollRef} className="max-h-[480px] 2xl:max-h-[640px] overflow-auto sibs-scrollbar">
                        <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
                          <thead className="sticky top-0 z-10 bg-sibs-surface">
                            <tr className="border-b border-sibs-border">
                              {[
                                ["SIBS ID", "w-[9%]"],
                                ["EMPLOYEE NAME", "w-[23%]"],
                                ["DEPARTMENT", "w-[14%]"],
                                ["ACCOUNT", "w-[15%]"],
                                ["HIRE DATE", "w-[13%]"],
                                ["LAST WORKING DAY", "w-[15%]"],
                                ["KRONOS STATUS", "w-[11%]"],
                              ].map(([label, width]) => (
                                <th key={label} scope="col" className={`${width} px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-muted`}>
                                  {label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sibs-border" aria-busy={loading}>
                            {loading && rows.length === 0 ? (
                              <TableSkeletonRows count={PAGE_SIZE} columns={7} cellClassName="px-3 2xl:px-4 py-3 align-middle" />
                            ) : rows.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-12 text-center sibs-text-xs font-semibold text-sibs-muted">
                                  {error ? "Resignee records could not be loaded. Use Retry after resolving the API error." : "No inactive Kronos employees with an elapsed last working day found."}
                                </td>
                              </tr>
                            ) : rows.map((record) => (
                              <tr key={record.employeeId || record.sibsId} className="group transition-colors hover:bg-sibs-cream-light">
                                <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-extrabold text-sibs-orange">{record.sibsId}</td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                                  <div className="flex min-w-[200px] items-center gap-2.5 2xl:gap-3">
                                    <ResigneeAvatar record={record} />
                                    <span className="break-words sibs-text-xs font-extrabold leading-tight text-sibs-navy transition-colors group-hover:text-sibs-orange">{record.employeeName}</span>
                                  </div>
                                </td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs text-sibs-navy">{record.department || "—"}</td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs text-sibs-navy">{record.account || "—"}</td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs text-sibs-navy">{formatDate(record.hireDate)}</td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle sibs-text-xs font-semibold text-sibs-navy">{formatDate(record.lastWorkingDate)}</td>
                                <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 sibs-text-micro font-bold text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" /> {record.statusLabel || "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  }
                  mobileContent={
                    <div className="p-3.5 sm:p-4">
                      {loading && rows.length === 0 ? (
                        <DataCard.Skeleton count={5} lines={3} />
                      ) : rows.length === 0 ? (
                        <DataCard.Empty title="No resignees found" description={error || "Try adjusting your search."} />
                      ) : (
                        <div className="space-y-3">
                          {rows.map((record, index) => (
                            <DataCard key={record.employeeId || record.sibsId} index={index}>
                              <DataCard.Header
                                avatar={<ResigneeAvatar record={record} />}
                                kicker={`SIBS ID ${record.sibsId || "—"}`}
                                title={record.employeeName}
                                subtitle={record.account || "Unassigned"}
                              />
                              <DataCard.ContextRow>
                                <span>Department: <strong>{record.department || "—"}</strong></span>
                              </DataCard.ContextRow>
                              <DataCard.Metrics cols={2}>
                                <DataCard.MetricItem label="Hire Date" value={formatDate(record.hireDate)} />
                                <DataCard.MetricItem label="Last Working Day" value={formatDate(record.lastWorkingDate)} />
                              </DataCard.Metrics>
                              <DataCard.Footer actionLabel={null} metadata={record.statusLabel || "Inactive (Kronos)"} />
                            </DataCard>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            </div>
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <TablePagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalRecords={pagination.total} limit={PAGE_SIZE} loadedCount={rows.length} recordLabel="resignee records" onPageChange={handlePageChange} loading={loading} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
