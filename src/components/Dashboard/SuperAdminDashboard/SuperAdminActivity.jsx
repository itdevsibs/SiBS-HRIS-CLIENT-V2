import { Download } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
import { getStatusPillClass } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

export default function SuperAdminActivity({
  items,
  totalItems,
  pagination,
  onExport,
  searchInput = "",
  onSearchChange,
  onSearchKeyDown,
  module = "All Modules",
  status = "All Statuses",
  moduleOptions = [],
  statusOptions = [],
  onFilterChange,
}) {
  return (
    <div className="space-y-4 2xl:space-y-5 font-jakarta">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
            System &amp; Module Activity Audit Log ({totalItems})
          </h2>
          <p className="sibs-text-xs font-semibold text-sibs-text-muted">
            Recorded user actions, request updates, and access-level modifications.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-8.5 2xl:h-9 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-sibs-border bg-white px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-sibs-navy shadow-xs transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange"
        >
          <Download className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-sibs-orange" />
          Export Activity Log
        </button>
      </div>

      <div className="relative overflow-visible">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search user actor, action, or details..."
          onSearchChange={onSearchChange}
          onSearchKeyDown={onSearchKeyDown}
          filters={[
            {
              key: "module",
              label: "Module",
              value: module,
              options: moduleOptions,
              onChange: (value) => onFilterChange?.("module", value),
              searchable: true,
              allLabel: "All Modules",
              includeAll: true,
            },
            {
              key: "status",
              label: "Result Status",
              value: status,
              options: statusOptions,
              onChange: (value) => onFilterChange?.("status", value),
              searchable: false,
              includeAll: false,
            },
          ]}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      <div className="space-y-3 lg:hidden">
        {items.length > 0 ? (
          items.map((item, index) => (
            <article
              key={item.id}
              className="sibs-card sibs-page-card-in p-3.5 sm:p-4"
              style={{
                animationDelay: `${index * 40}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#042C51]">{item.action}</p>
                  <p className="mt-1 break-all text-[10px] font-semibold text-[#667085]">
                    {item.actor} • {item.module}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${getStatusPillClass(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-2.5 text-xs font-semibold leading-5 text-[#475467]">
                {item.details}
              </p>
              <p className="mt-2.5 text-[10px] font-semibold text-[#98A2B3]">
                {item.timestamp}
              </p>
            </article>
          ))
        ) : (
          <div className="sibs-empty-panel">No activity logs match the active filters.</div>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white hidden lg:block">
        <div className="max-h-[520px] overflow-auto sibs-scrollbar">
          <table className="w-full min-w-[1100px] border-collapse bg-white text-left text-xs">
            <thead className="sibs-data-table-head">
              <tr className="sibs-data-table-head-row">
                <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Timestamp</th>
                <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">User Actor</th>
                <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Access Level</th>
                <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Module</th>
                <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Action Taken</th>
                <th className="sibs-data-table-th text-left px-3 2xl:px-4 py-2.5 2xl:py-3">Log Details</th>
                <th className="sibs-data-table-th text-center px-3 2xl:px-4 py-2.5 2xl:py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {items.length > 0 ? (
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="sibs-data-table-row sibs-page-card-in"
                    style={{
                      animationDelay: `${index * 35}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <td className="whitespace-nowrap px-3 2xl:px-4 py-2 2xl:py-2.5 text-[10px] font-semibold text-sibs-text-muted">
                      {item.timestamp}
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-extrabold text-sibs-navy">
                      {item.actor}
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] 2xl:text-[10px] font-bold text-slate-700">
                        {item.accessLevel}
                      </span>
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-semibold text-sibs-text-secondary">
                      {item.module}
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-[10px] font-extrabold text-sibs-orange">
                      {item.action}
                    </td>
                    <td className="max-w-[360px] px-3 2xl:px-4 py-2 2xl:py-2.5 text-sibs-text-secondary font-medium">
                      {item.details}
                    </td>
                    <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${getStatusPillClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-xs font-bold text-[#667085]">
                    No activity logs match the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationTable
        className="border-0 bg-transparent p-0 shadow-none"
        showSearch={false}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        loadedCount={items.length}
        totalRecords={totalItems}
        recordLabel="activity logs"
        onPrevious={() => pagination.onPageChange(pagination.currentPage - 1)}
        onNext={() => pagination.onPageChange(pagination.currentPage + 1)}
      />
    </div>
  );
}

