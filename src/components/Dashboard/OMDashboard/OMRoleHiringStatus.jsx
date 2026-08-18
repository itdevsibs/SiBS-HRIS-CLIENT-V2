import { RotateCcw } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
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

function RoleMobileCard({ role, onViewRole }) {
  return (
    <button
      type="button"
      onClick={() => onViewRole(role)}
      className="sibs-card w-full p-4 text-left transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-extrabold text-[#042C51]">
            {role.roleTitle}
          </h3>
          <p className="mt-0.5 break-words text-xs font-semibold text-[#667085]">
            {role.account}
          </p>
        </div>
        <StatusBadge status={role.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Req.", role.req, "text-[#042C51]"],
          ["Filled", role.filled, "text-emerald-600"],
          ["Open", role.open, "text-[#FF5C28]"],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-lg bg-[#F8FAFC] p-2.5">
            <span className="block text-[10px] font-bold uppercase text-[#98A2B3]">
              {label}
            </span>
            <span
              className={`mt-1 block text-base font-extrabold tabular-nums ${tone}`}
            >
              {Number(value || 0)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-[#667085]">
        <span>
          Owner: <strong className="text-[#042C51]">{role.taOwner}</strong>
        </span>
        <span>
          Aging:{" "}
          <strong className="text-[#042C51]">
            {Number(role.aging || 0)}d
          </strong>
        </span>
      </div>
    </button>
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
      className="sibs-page-card-in sibs-card h-full w-full overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="border-b border-[#E6ECF2] p-4 sm:p-5 2xl:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
              Role Hiring Status
            </h3>
            <p className="mt-1 text-xs font-semibold text-[#667085]">
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

      <div className="p-4 sm:p-5 2xl:p-6">
        <div className="space-y-3 lg:hidden">
          {loading ? (
            <div className="sibs-empty-panel">Loading accessible roles...</div>
          ) : roles.length === 0 ? (
            <div className="sibs-empty-panel">
              No roles match the current search and status filter.
            </div>
          ) : (
            roles.map((role) => (
              <RoleMobileCard
                key={role.id || role.roleAccount}
                role={role}
                onViewRole={onViewRole}
              />
            ))
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white hidden lg:block">
          <div className="max-h-[480px] overflow-auto sibs-scrollbar">
            <table className="w-full min-w-[920px] border-collapse bg-white text-left text-xs">
              <thead className="sibs-data-table-head">
                <tr className="sibs-data-table-head-row">
                  <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Role / Account</th>
                  <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Req.</th>
                  <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Filled</th>
                  <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Open</th>
                  <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Due Date</th>
                  <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Status</th>
                  <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">TA Owner</th>
                  <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Aging</th>
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
                  roles.map((role) => (
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
                      className="sibs-data-table-row"
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
