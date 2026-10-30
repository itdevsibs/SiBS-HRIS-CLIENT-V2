import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck2, CheckCircle2, Clock3, FileText, RefreshCw, UsersRound } from "lucide-react";
import Header from "../../components/layout/Header";
import {
  MetricCard, MetricGrid, PageHeaderHero, SearchInput, TablePagination,
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

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0"><Header /></div>
      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <PageHeaderHero
            kicker="Core HR View"
            title="Resignee"
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
            <div className="p-4 2xl:p-5">
              <div className="overflow-x-auto rounded-xl border border-sibs-border-subtle">
                <table className="w-full min-w-[960px] border-collapse text-left font-jakarta text-xs text-sibs-navy">
                  <thead className="bg-sibs-surface text-[10px] font-extrabold uppercase tracking-wide text-sibs-muted">
                    <tr>{["SIBS ID", "Employee Name", "Department", "Account", "Hire Date", "Last Working Day", "Kronos Status"].map((item) => (
                      <th key={item} scope="col" className="whitespace-nowrap border-b border-sibs-border-subtle px-4 py-3">{item}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {rows.map((record) => (
                      <tr key={record.employeeId || record.sibsId} className="border-b border-sibs-border-subtle last:border-b-0 hover:bg-sibs-surface/70">
                        <td className="px-4 py-3 font-extrabold text-sibs-orange">{record.sibsId}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ResigneeAvatar record={record} />
                            <span className="font-bold text-sibs-navy">{record.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{record.department || "—"}</td>
                        <td className="px-4 py-3">{record.account || "—"}</td>
                        <td className="px-4 py-3">{formatDate(record.hireDate)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatDate(record.lastWorkingDate)}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> {record.statusLabel || "Inactive"}</span></td>
                      </tr>
                    ))}
                    {!error && rows.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-xs font-semibold text-sibs-muted">{loading ? "Loading Resignee records..." : "No inactive Kronos employees with an elapsed last working day found."}</td></tr>
                    ) : null}
                    {error && rows.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-xs font-semibold text-sibs-muted">Resignee records could not be loaded. Use Retry after resolving the API error.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <TablePagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalRecords={pagination.total} limit={PAGE_SIZE} loadedCount={rows.length} recordLabel="resignee records" onPageChange={setPage} loading={loading} />
              </div>
            </div>
          </section>
          <p className="px-1 pb-3 text-[11px] font-medium text-sibs-muted">
            Data comes from Kronos gy_employee and gy_user. It identifies inactive users with a past recorded last working day; these tables do not confirm whether the separation was a voluntary resignation. HRIS resignation approvals are not used for this list.
          </p>
        </div>
      </main>
    </div>
  );
}
