import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, MapPin, ChevronRight, RefreshCw, FileText, Loader2 } from "lucide-react";
import Header from "../../components/layout/Header";
import RequisitionModal from "../../components/modals/requisitions/RequisitionModal";
import PageHeaderHero from "@/components/ui/PageHeaderHero";
import StatusBadge from "@/components/ui/StatusBadge";
import { DataCard, ResponsiveTableShell, TablePagination } from "@/components/ui";
import { getDepartments, getRequisitions } from "@/lib/axios/getRequisition";

export default function RequisitionPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [requisitions, setRequisitions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const fetchRequisitionsData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getRequisitions();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRequisitions(list);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartmentsData = useCallback(async () => {
    try {
      const res = await getDepartments();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setDepartments(list);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    fetchRequisitionsData();
    fetchDepartmentsData();
  }, [fetchRequisitionsData, fetchDepartmentsData]);

  const handleManualRefresh = async () => {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    await fetchRequisitionsData();
    setTimeout(() => setIsManualRefreshing(false), 500);
  };

  const filteredRequisitions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requisitions.filter((req) => {
      const matchesSearch =
        !keyword ||
        [req.id, req.title, req.department, req.status, req.createdBy, req.jobTitle]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "All" ||
        String(req.status || "").toLowerCase() === statusFilter.toLowerCase();

      const matchesDepartment =
        departmentFilter === "All" ||
        String(req.department || req.departmentName || "").toLowerCase() ===
          departmentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [requisitions, search, statusFilter, departmentFilter]);

  const stats = useMemo(() => {
    return {
      all: requisitions.length,
      draft: requisitions.filter((r) => String(r.status || "").toLowerCase() === "draft").length,
      pending: requisitions.filter((r) =>
        ["pending", "for review", "for approval"].includes(String(r.status || "").toLowerCase()),
      ).length,
      approved: requisitions.filter((r) => String(r.status || "").toLowerCase() === "approved").length,
      rejected: requisitions.filter((r) =>
        ["rejected", "declined"].includes(String(r.status || "").toLowerCase()),
      ).length,
    };
  }, [requisitions]);

  const statusTones = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Draft: "bg-slate-50 text-slate-700 border-slate-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          {/* Header */}
          <PageHeaderHero
            kicker="Requisition Desk"
            title="Job Requisitions"
            description="Manage personnel requisition requests, departmental requirements, and approval routing."
            actions={
              <>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isManualRefreshing}
                  className="sibs-btn-icon"
                  title="Refresh Requisitions"
                >
                  <RefreshCw
                    size={15}
                    className={isManualRefreshing ? "animate-spin text-sibs-orange" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setOpenAddModal(true)}
                  className="sibs-btn-primary max-sm:flex-1"
                >
                  <Plus size={15} />
                  New Requisition
                </button>
              </>
            }
          />

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard title="Total Requisitions" value={stats.all} index={0} />
            <StatCard title="Draft" value={stats.draft} index={1} />
            <StatCard title="Pending Review" value={stats.pending} index={2} />
            <StatCard title="Approved" value={stats.approved} tone="emerald" index={3} />
            <StatCard title="Rejected" value={stats.rejected} tone="rose" index={4} />
          </div>

          {/* Table / List Records Card */}
          <section
            className="sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
              <div className="flex flex-col gap-0.5">
                <h2 className="sibs-card-title">Job Requisition Records</h2>
                <p className="sibs-card-subtitle">
                  Review and filter job requisition requests across departments and approval statuses.
                </p>
              </div>

              <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="relative w-full min-w-0 sm:min-w-[240px] sm:flex-1">
                    <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy">
                      Search
                    </label>
                    <div className="group relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-muted transition-colors group-focus-within:text-sibs-orange"
                        size={15}
                      />
                      <input
                        type="text"
                        placeholder="Search by title, number, department..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-sibs-border bg-[#F8FAFC] px-3 pl-9 sibs-text-xs font-semibold text-sibs-navy outline-none transition placeholder:text-sibs-muted hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/20"
                      />
                    </div>
                  </div>

                  <div className="w-full min-w-0 sm:w-[160px]">
                    <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy">
                      Approval Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-sibs-border bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-sibs-navy outline-none transition hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/20"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Draft">Draft</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="w-full min-w-0 sm:w-[180px]">
                    <label className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy">
                      Department
                    </label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-sibs-border bg-[#F8FAFC] px-3 sibs-text-xs font-bold text-sibs-navy outline-none transition hover:border-sibs-orange/40 hover:bg-white focus:border-sibs-orange focus:bg-white focus:ring-2 focus:ring-sibs-orange/20"
                    >
                      <option value="All">All Departments</option>
                      {departments.map((dept) => {
                        const name = typeof dept === "string" ? dept : dept?.name || dept?.department;
                        return (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {(search || statusFilter !== "All" || departmentFilter !== "All") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("All");
                        setDepartmentFilter("All");
                      }}
                      className="inline-flex h-8.5 2xl:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/25 active:scale-[0.98]"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <ResponsiveTableShell
              breakpoint="lg"
              mobileContent={
                loading ? (
                  <DataCard.Skeleton count={4} lines={3} />
                ) : filteredRequisitions.length === 0 ? (
                  <DataCard.Empty
                    title="No Requisitions Found"
                    description={
                      search || statusFilter !== "All" || departmentFilter !== "All"
                        ? "Try adjusting your search or filters."
                        : "Create your first job requisition using the button above."
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredRequisitions
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((req, index) => {
                        const status = req.status || "Pending";
                        return (
                          <DataCard
                            key={req.id || `req-mobile-${index}`}
                            interactive
                            className="transition hover:border-sibs-orange/40 hover:shadow-md"
                          >
                            <DataCard.Header
                              title={req.title || req.jobTitle || "Untitled Position"}
                              subtitle={
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-sibs-primary-1">
                                  {req.id || `REQ-${index + 1}`}
                                </span>
                              }
                              badge={<StatusBadge status={status} />}
                            />

                            <DataCard.ContextRow>
                              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {req.department || req.departmentName || "General"}
                              </span>
                              <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-sibs-primary-1">
                                {req.positions || req.headcount || 1} position(s)
                              </span>
                              {req.location && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                  <MapPin size={12} className="text-sibs-orange shrink-0" />
                                  <span className="truncate">{req.location}</span>
                                </span>
                              )}
                            </DataCard.ContextRow>

                            <DataCard.Metrics cols={2}>
                              <DataCard.MetricItem
                                label="Hiring Manager"
                                value={req.createdBy || req.hiringManager || "HR"}
                              />
                              <DataCard.MetricItem
                                label="Date Created"
                                value={req.date || req.createdAt || "Recent"}
                              />
                            </DataCard.Metrics>

                            <DataCard.Footer>
                              <span className="text-xs font-semibold text-slate-400">
                                Tap to view requisition details
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-sibs-orange">
                                Details <ChevronRight size={14} />
                              </span>
                            </DataCard.Footer>
                          </DataCard>
                        );
                      })}
                  </div>
                )
              }
              desktopContent={
                <div className="overflow-x-auto sibs-scrollbar">
                  <table className="w-full table-fixed border-collapse bg-white text-left">
                    <colgroup>
                      <col className="w-[12%]" />
                      <col className="w-[22%]" />
                      <col className="w-[16%]" />
                      <col className="w-[10%]" />
                      <col className="w-[12%]" />
                      <col className="w-[14%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-[#F5F7FA]">
                      <tr className="border-b border-sibs-border text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                        <th className="px-4 py-3.5 text-left">Requisition ID</th>
                        <th className="px-4 py-3.5 text-left">Position Title</th>
                        <th className="px-4 py-3.5 text-left">Department</th>
                        <th className="px-4 py-3.5 text-center">Positions</th>
                        <th className="px-4 py-3.5 text-left">Created By</th>
                        <th className="px-4 py-3.5 text-left">Date</th>
                        <th className="px-4 py-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sibs-border bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-sibs-muted">
                            <Loader2 size={24} className="mx-auto mb-2 animate-spin text-sibs-orange" />
                            <p className="sibs-text-xs font-semibold">Loading requisitions...</p>
                          </td>
                        </tr>
                      ) : filteredRequisitions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-sibs-muted">
                            <FileText size={32} className="mx-auto mb-2 text-sibs-muted/60" />
                            <p className="sibs-text-sm font-bold text-sibs-navy">No Requisitions Found</p>
                            <p className="sibs-text-xs text-sibs-muted mt-1">
                              {search || statusFilter !== "All" || departmentFilter !== "All"
                                ? "Try adjusting your search or filters."
                                : "Create your first job requisition using the button above."}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredRequisitions
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map((req, index) => {
                            const status = req.status || "Pending";
                            return (
                              <tr
                                key={req.id || `req-desktop-${index}`}
                                className="transition hover:bg-sibs-surface"
                              >
                                <td className="px-4 py-3.5 font-mono text-xs font-bold text-sibs-primary-1">
                                  {req.id || `REQ-${index + 1}`}
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="truncate text-xs font-bold text-sibs-navy">
                                    {req.title || req.jobTitle || "Untitled Position"}
                                  </p>
                                  {req.location && (
                                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                      <MapPin size={11} className="text-sibs-orange shrink-0" />
                                      <span className="truncate">{req.location}</span>
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                                  {req.department || req.departmentName || "General"}
                                </td>
                                <td className="px-4 py-3.5 text-center text-xs font-bold text-sibs-navy tabular-nums">
                                  {req.positions || req.headcount || 1}
                                </td>
                                <td className="px-4 py-3.5 text-xs font-medium text-slate-600 truncate">
                                  {req.createdBy || req.hiringManager || "HR"}
                                </td>
                                <td className="px-4 py-3.5 text-xs font-medium text-slate-500">
                                  {req.date || req.createdAt || "Recent"}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <StatusBadge status={status} />
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              }
            />

            {!loading && filteredRequisitions.length > 0 && (
              <div className="border-t border-sibs-border px-4 py-3">
                <TablePagination
                  currentPage={currentPage}
                  totalPages={Math.max(1, Math.ceil(filteredRequisitions.length / pageSize))}
                  totalItems={filteredRequisitions.length}
                  limit={pageSize}
                  loading={loading}
                  onPageChange={setCurrentPage}
                  itemName="requisitions"
                />
              </div>
            )}
          </section>
        </div>
      </main>

      <RequisitionModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={() => {
          fetchRequisitionsData();
        }}
      />
    </div>
  );
}

function StatCard({ title, value, tone = "navy", index = 0 }) {
  const tones = {
    navy: "text-[#042C51]",
    emerald: "text-emerald-700",
    rose: "text-rose-700",
  };

  return (
    <article
      className="sibs-metric-card font-jakarta flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden rounded-2xl border border-sibs-border bg-white p-3 2xl:p-3.5 shadow-sm"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between">
        <div className="flex flex-col justify-between h-full min-w-0">
          <p className="sibs-text-micro font-extrabold uppercase text-[#98A2B3] line-clamp-1 truncate">
            {title}
          </p>
          <p
            className={`font-heading text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${
              tones[tone] || tones.navy
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}
