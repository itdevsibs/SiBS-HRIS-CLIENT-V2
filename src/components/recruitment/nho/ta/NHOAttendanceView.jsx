import PaginationTable from "@/services/pagination/PaginationTable";
import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, UserX, Users } from "lucide-react";
import { useNHO } from "../NHOContext";
import { MetricCard, MetricGrid } from "@/components/ui";

function NHOAttendanceView({ onOpenAttendanceModal, onOpenDetails }) {
  const { applicants, simulatedCurrentDate } = useNHO();
  const todaysApplicants = useMemo(
    () => applicants.filter((app) => app.scheduledNhoDate === simulatedCurrentDate),
    [applicants, simulatedCurrentDate]
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const metrics = useMemo(
    () => ({
      scheduled: todaysApplicants.length,
      show: todaysApplicants.filter((a) => a.attendance === "Show").length,
      noShow: todaysApplicants.filter((a) => a.attendance === "No Show").length,
      pending: todaysApplicants.filter((a) => a.attendance === "Pending").length,
    }),
    [todaysApplicants]
  );

  const filtered = useMemo(
    () =>
      todaysApplicants.filter((app) => {
        const term = search.trim().toLowerCase();
        const matches = [app.fullName, app.applicantNumber, app.position, app.account].some((value) =>
          value.toLowerCase().includes(term)
        );
        return matches && (status === "All" || app.attendance === status);
      }),
    [todaysApplicants, search, status]
  );

  return (
    <div className="min-w-0 space-y-3.5 sm:space-y-4 2xl:space-y-5 font-jakarta">
      {/* 4 Metric Cards */}
      <MetricGrid columns={4}>
        <MetricCard
          label="Scheduled"
          value={metrics.scheduled}
          description="Scheduled for today"
          icon={Users}
          tone="navy"
          delay={0}
        />
        <MetricCard
          label="Show"
          value={metrics.show}
          description="Attendance confirmed"
          icon={CheckCircle2}
          tone="green"
          delay={50}
        />
        <MetricCard
          label="No Show"
          value={metrics.noShow}
          description="Follow-up or reschedule"
          icon={UserX}
          tone="red"
          delay={100}
        />
        <MetricCard
          label="Pending Attendance"
          value={metrics.pending}
          description="Awaiting attendance tagging"
          icon={Clock3}
          tone="amber"
          delay={150}
        />
      </MetricGrid>

      {/* Main Table Section */}
      <section
        className="sibs-page-card-in min-w-0 rounded-2xl border border-sibs-border bg-white p-4 sm:p-5 shadow-xs"
        style={{ animationDelay: "220ms", animationFillMode: "both" }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="sibs-section-title font-extrabold text-sibs-navy">
              NHO Attendance — Today
            </h2>
            <p className="sibs-section-subtitle text-sibs-muted mt-0.5">
              Only candidates scheduled for the selected NHO date are shown. Record attendance, follow up with no-shows, or open candidate profiles.
            </p>
          </div>
          <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3 py-2 text-xs font-bold text-sibs-navy">
            NHO Date: <span className="text-sibs-orange font-extrabold">{simulatedCurrentDate}</span>
          </div>
        </div>

        {/* Global Standard Filter Bar */}
        <div className="mb-4 relative z-[90] overflow-visible">
          <PaginationTable filterLayout="ta-inline" showFilterPanel={false} showFilterHeader={false} showPagination={false}
            className="border-0 bg-transparent p-0 shadow-none" searchValue={search} onSearchChange={setSearch}
            searchPlaceholder="Search applicant, ID, position, or account…"
            dropdownFilters={[{ key: "attendance", label: "Attendance Status", value: status, onChange: (value) => setStatus(value || "All"), includeAll: false, searchable: false,
              options: [{ value: "All", label: `All Attendance (${todaysApplicants.length})` }, { value: "Show", label: `Show (${metrics.show})` }, { value: "No Show", label: `No Show (${metrics.noShow})` }, { value: "Pending", label: `Pending (${metrics.pending})` }] }]}
          />
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-sibs-border bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-sibs-border px-4 py-2.5 bg-sibs-surface">
            <div className="flex items-center gap-2 text-xs font-extrabold text-sibs-navy">
              <CalendarDays className="h-4 w-4 text-sibs-orange" />
              <span>Today&apos;s Attendance</span>
              <span className="rounded-full bg-sibs-navy px-2 py-0.5 text-[10px] font-black text-white">
                {filtered.length}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-sibs-muted">
              {filtered.length} of {todaysApplicants.length} records
            </span>
          </div>

          <div className="max-w-full overflow-x-auto sibs-scrollbar">
            <table className="w-full min-w-[930px] border-collapse text-left text-xs">
              <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                <tr className="sibs-data-table-head-row">
                  <th className="sibs-data-table-th px-4 py-3">Applicant</th>
                  <th className="sibs-data-table-th px-3 py-3">Position &amp; Account</th>
                  <th className="sibs-data-table-th px-3 py-3">Scheduled NHO</th>
                  <th className="sibs-data-table-th px-3 py-3">Attendance</th>
                  <th className="sibs-data-table-th px-3 py-3">Next Step</th>
                  <th className="sibs-data-table-th px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sibs-border font-medium text-sibs-navy">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sibs-muted text-xs">
                      No candidates scheduled for this NHO date match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((app) => (
                    <tr key={app.id} className="hover:bg-sibs-surface/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-sibs-navy">{app.fullName}</div>
                        <div className="font-mono text-[10px] text-sibs-muted font-medium">
                          {app.applicantNumber}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800">{app.position}</div>
                        <div className="text-[11px] text-sibs-muted">{app.account}</div>
                      </td>
                      <td className="px-3 py-3 font-bold text-slate-800 tabular-nums">
                        {app.scheduledNhoDate}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            app.attendance === "Show"
                              ? "sibs-badge-success"
                              : app.attendance === "No Show"
                              ? "sibs-badge-danger"
                              : "sibs-badge-warning"
                          }
                        >
                          {app.attendance}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-sibs-muted">
                        {app.attendance === "No Show"
                          ? "Follow-up / Reschedule"
                          : app.attendance === "Pending"
                          ? "Confirm attendance"
                          : "Review requirements"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenAttendanceModal(app)}
                            className={
                              app.attendance === "Pending"
                                ? "sibs-btn-primary h-7.5 px-3 text-xs font-bold"
                                : "sibs-btn-secondary h-7.5 px-3 text-xs font-bold"
                            }
                          >
                            {app.attendance === "Pending" ? "Tag Attendance" : "Edit Attendance"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDetails(app)}
                            className="sibs-btn-secondary h-7.5 px-3 text-xs font-bold"
                          >
                            View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default NHOAttendanceView;
