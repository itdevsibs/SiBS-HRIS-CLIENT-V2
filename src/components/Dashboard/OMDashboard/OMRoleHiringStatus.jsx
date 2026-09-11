import { RotateCcw } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
import { DataCard, ResponsiveTableShell } from "../../ui";
import { formatDate } from "../../../lib/utils/Dashboards/OMDashboard/omDashboardHelpers.js";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "All" },
  { label: "On Track", value: "On Track" },
  { label: "At Risk", value: "At Risk" },
  { label: "Delayed", value: "Delayed" },
];

function getStatusClass(status) {
  if (status === "On Track") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "At Risk") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Delayed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-normal ${getStatusClass(
        status,
      )}`}
    >
      {status || "Unknown"}
    </span>
  );
}

function RoleMobileCard({ role, onViewRole, delay = 0 }) {
  return (
    <DataCard
      interactive
      onClick={() => onViewRole(role)}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <DataCard.Header
        title={role.roleTitle}
        subtitle={role.account}
        badge={<StatusBadge status={role.status} />}
      />

      <DataCard.Metrics cols={3}>
        <DataCard.MetricItem
          label="Req."
          value={Number(role.req || 0)}
          tone="navy"
        />
        <DataCard.MetricItem
          label="Filled"
          value={Number(role.filled || 0)}
          tone="emerald"
        />
        <DataCard.MetricItem
          label="Open"
          value={Number(role.open || 0)}
          tone="orange"
        />
      </DataCard.Metrics>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sibs-border pt-2.5 text-[10px] font-semibold text-sibs-muted">
        <div>
          <span>
            Owner: <strong className="text-sibs-navy">{role.taOwner || "Unassigned"}</strong>
          </span>
          {role.dueDate ? (
            <span className="ml-2 text-[#98A2B3]">
              Due: <strong className="font-semibold text-[#536887]">{formatDate(role.dueDate)}</strong>
            </span>
          ) : null}
        </div>
        <span>
          Aging: <strong className="text-sibs-navy">{Number(role.aging || 0)}d</strong>
        </span>
      </div>
    </DataCard>
  );
}

export default function OMRoleHiringStatus({
  roles = [],
  totalRoles = 0,
  scopeText,
  loading = false,
  searchInput,
  onSearchChange,
  onSearchKeyDown,
  status,
  onStatusChange,
  hasActiveFilters,
  onClearFilters,
  onViewRole,
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  delay = 0,
}) {
  return (
    <section
      className="sibs-page-card-in sibs-card flex h-full w-full flex-col justify-between overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5 2xl:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h3 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Role Hiring Status
            </h3>
            <p className="mt-1 sibs-text-xs font-semibold text-[#667085]">
              Role-level delivery, risk status, aging, and ownership
            </p>
          </div>

          <span className="w-fit rounded border border-amber-300 bg-amber-50 px-2.5 py-1 sibs-text-micro font-extrabold uppercase tracking-wide text-amber-800">
            Manager Restricted View
          </span>
        </div>

        <div className="mt-3 rounded-xl border border-blue-100 bg-[#E9F0FC] px-3.5 py-2.5 sibs-text-xs font-semibold text-[#042C51]">
          Viewing only: <strong className="font-extrabold text-[#042C51]">{scopeText || "manager-assigned scope"}</strong>
        </div>

        <PaginationTable
          className="mt-4 border-0 bg-transparent p-0 shadow-none"
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search by role, account, department, owner, or status..."
          onSearchChange={onSearchChange}
          onSearchKeyDown={onSearchKeyDown}
          filters={[
            {
              key: "status",
              label: "Status",
              value: status,
              options: STATUS_OPTIONS,
              onChange: onStatusChange,
              searchable: false,
              includeAll: false,
              allLabel: "All Statuses",
              placeholder: "All Statuses",
              className: "xl:w-[190px]",
            },
          ]}
          rightContent={
            <button
              type="button"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-xs font-extrabold text-[#98A2B3] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          }
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 2xl:p-6">
        <ResponsiveTableShell
          mobileView={
            loading ? (
              <DataCard.Skeleton count={4} lines={2} />
            ) : roles.length === 0 ? (
              <DataCard.Empty
                title="No Accessible Roles Found"
                description="No roles match the current search and status filter."
              />
            ) : (
              roles.map((role, index) => (
                <RoleMobileCard
                  key={role.id || role.roleAccount}
                  role={role}
                  onViewRole={onViewRole}
                  delay={index * 40}
                />
              ))
            )
          }
          desktopView={
            <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
              <div className="max-h-[480px] overflow-auto sibs-scrollbar">
                <table className="w-full min-w-[920px] border-collapse bg-white text-left text-xs">
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Role / Account</th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Req.</th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Filled</th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Open</th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Due Date</th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Status</th>
                      <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">TA Owner</th>
                      <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3 sibs-text-micro font-extrabold uppercase tracking-wider text-[#8A98B8]">Aging</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E6ECF2]">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center font-semibold text-[#667085]">
                          Loading accessible roles...
                        </td>
                      </tr>
                    ) : roles.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center font-semibold text-[#667085]">
                          No roles match the current search and status filter.
                        </td>
                      </tr>
                    ) : (
                      roles.map((role, index) => (
                        <tr
                          key={role.id || role.roleAccount}
                          role="button"
                          tabIndex={0}
                          onClick={() => onViewRole(role)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            onViewRole(role);
                          }}
                          className="sibs-data-table-row sibs-page-card-in"
                          style={{
                            animationDelay: `${index * 35}ms`,
                            animationFillMode: "both",
                          }}
                          aria-label={`Open details for ${role.roleTitle}`}
                        >
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                            <strong className="block text-xs font-extrabold leading-snug text-[#042C51]">
                              {role.roleTitle}
                            </strong>
                            <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-[#667085]">
                              {role.account}
                            </span>
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-[#042C51]">
                            {role.req}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-emerald-600">
                            {role.filled}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-[#FF5C28]">
                            {role.open}
                          </td>
                          <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 font-bold text-[#344054]">
                            {formatDate(role.dueDate)}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                            <StatusBadge status={role.status} />
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-bold text-[#344054]">
                            {role.taOwner}
                          </td>
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-extrabold tabular-nums text-[#344054]">
                            {role.aging}d
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          }
        />

        <PaginationTable
          className="mt-4 border-0 bg-transparent p-0 shadow-none"
          showSearch={false}
          showPagination
          showCount
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          loadedCount={roles.length}
          totalRecords={totalRoles}
          recordLabel="accessible roles"
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </div>
    </section>
  );
}
