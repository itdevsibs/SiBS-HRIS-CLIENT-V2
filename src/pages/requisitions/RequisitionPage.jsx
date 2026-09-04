import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, MapPin, ChevronRight, RefreshCw, FileText, Loader2 } from "lucide-react";
import Header from "../../components/layout/Header";
import RequisitionModal from "../../components/modals/requisitions/RequisitionModal";
import { getDepartments, getRequisitions } from "@/lib/axios/getRequisition";

export default function RequisitionPage() {
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
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 font-jakarta shadow-sm 2xl:p-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span className="sibs-top-accent" aria-hidden="true" />
            <div className="mt-0.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-sibs-navy">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-sibs-orange" />
                    Requisition Desk
                  </span>
                </div>
                <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
                  Job Requisitions
                </h1>
                <p className="sibs-text-sm font-semibold text-[#667085]">
                  Manage personnel requisition requests, departmental requirements, and approval routing.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isManualRefreshing}
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] shadow-sm transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-60"
                  title="Refresh Requisitions"
                >
                  <RefreshCw
                    size={15}
                    className={isManualRefreshing ? "animate-spin text-[#FF5C28]" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setOpenAddModal(true)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-sibs-orange px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98]"
                >
                  <Plus size={15} />
                  New Requisition
                </button>
              </div>
            </div>
          </section>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard title="Total Requisitions" value={stats.all} index={0} />
            <StatCard title="Draft" value={stats.draft} index={1} />
            <StatCard title="Pending Review" value={stats.pending} index={2} />
            <StatCard title="Approved" value={stats.approved} tone="emerald" index={3} />
            <StatCard title="Rejected" value={stats.rejected} tone="rose" index={4} />
          </div>

          {/* Filters */}
          <section
            className="sibs-page-card-in sibs-card flex flex-wrap items-center gap-3 rounded-2xl border border-sibs-border bg-white p-3.5 shadow-sm 2xl:p-4"
            style={{ animationDelay: "180ms", animationFillMode: "both" }}
          >
            <div className="relative min-w-[240px] flex-1">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-sibs-muted"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by title, number, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sibs-dashboard-input h-9 2xl:h-10 w-full rounded-xl border border-sibs-border bg-[#F8FAFC] pr-3 pl-9 sibs-text-xs font-medium text-sibs-navy placeholder:text-sibs-muted focus:border-sibs-navy focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 2xl:h-10 rounded-xl border border-sibs-border bg-white px-3 sibs-text-xs font-semibold text-sibs-navy focus:border-sibs-navy focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Draft">Draft</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 2xl:h-10 rounded-xl border border-sibs-border bg-white px-3 sibs-text-xs font-semibold text-sibs-navy focus:border-sibs-navy focus:outline-none"
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
          </section>

          {/* Table / List Records */}
          <section
            className="sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            {loading ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-sibs-muted">
                <Loader2 size={24} className="animate-spin text-sibs-orange" />
                <p className="sibs-text-xs font-semibold">Loading requisitions...</p>
              </div>
            ) : filteredRequisitions.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sibs-muted p-6">
                <FileText size={32} className="text-sibs-muted/60" />
                <p className="sibs-text-sm font-bold text-sibs-navy">No Requisitions Found</p>
                <p className="sibs-text-xs text-[#667085]">
                  {search || statusFilter !== "All" || departmentFilter !== "All"
                    ? "Try adjusting your search or filters."
                    : "Create your first job requisition using the button above."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E6ECF2]">
                {filteredRequisitions.map((req, index) => {
                  const status = req.status || "Pending";
                  const toneClass =
                    statusTones[status] || "bg-slate-50 text-slate-700 border-slate-200";

                  return (
                    <div
                      key={req.id || `req-${index}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 2xl:p-5 transition hover:bg-[#F8FAFC]"
                      style={{
                        animationDelay: `${index * 35}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="sibs-text-sm font-bold text-sibs-navy">
                            {req.title || req.jobTitle || "Untitled Position"}
                          </h2>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 sibs-text-micro font-extrabold ${toneClass}`}
                          >
                            {status}
                          </span>
                        </div>

                        <p className="sibs-text-xs font-medium text-[#667085]">
                          {req.id} • {req.department || req.departmentName || "General"} •{" "}
                          {req.positions || req.headcount || 1} position(s)
                        </p>

                        {req.location && (
                          <div className="flex items-center gap-1.5 sibs-text-micro font-semibold text-[#667085]">
                            <MapPin size={12} className="text-sibs-orange" />
                            {req.location}
                          </div>
                        )}

                        <p className="sibs-text-micro font-medium text-[#98A2B3]">
                          Created by {req.createdBy || req.hiringManager || "HR"} on{" "}
                          {req.date || req.createdAt || "Recent"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <ChevronRight className="text-[#98A2B3]" size={18} />
                      </div>
                    </div>
                  );
                })}
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
