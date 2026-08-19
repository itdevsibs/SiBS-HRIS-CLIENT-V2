import { CheckCircle2 } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
import { getSeverityPillClass } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

export default function SuperAdminExceptions({
  items,
  totalItems,
  pagination,
  onNavigate,
  onResolve,
  searchInput = "",
  onSearchChange,
  onSearchKeyDown,
  module = "All Modules",
  moduleOptions = [],
  onFilterChange,
}) {
  return (
    <div className="space-y-4 2xl:space-y-5 font-jakarta">
      <div>
        <h2 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
          Risk &amp; Exception Escalation Desk ({totalItems})
        </h2>
        <p className="sibs-text-xs font-semibold text-[#667085]">
          System-wide exceptions for user mapping, resignations, leaves,
          attendance, hiring, and approval workflows.
        </p>
      </div>

      <div className="relative overflow-visible">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={searchInput}
          searchPlaceholder="Search exception title, description, or assigned..."
          onSearchChange={onSearchChange}
          onSearchKeyDown={onSearchKeyDown}
          filters={[
            {
              key: "module",
              label: "Target Module",
              value: module,
              options: moduleOptions,
              onChange: (value) => onFilterChange?.("module", value),
              searchable: true,
              allLabel: "All Modules",
              includeAll: true,
            },
          ]}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      {items.length > 0 ? (
        <div className="space-y-2.5 2xl:space-y-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="sibs-page-card-in rounded-xl border border-slate-200 bg-white p-3.5 2xl:p-4 transition hover:border-[#FF5C28]/40 hover:shadow-xs"
              style={{
                animationDelay: `${index * 45}ms`,
                animationFillMode: "both",
              }}
            >
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wide ${getSeverityPillClass(
                        item.severity,
                      )}`}
                    >
                      {item.severity} Severity
                    </span>
                    <span className="sibs-text-sm font-extrabold text-[#042C51]">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-1.5 sibs-text-xs font-semibold leading-relaxed text-[#667085]">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 sibs-text-micro font-semibold text-[#667085]">
                  Target: <strong className="text-[#042C51]">{item.moduleTarget}</strong> • Pending:{" "}
                  <strong className="text-amber-700">
                    {item.daysPending} days
                  </strong>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2.5 border-t border-[#EEF2F6] pt-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="sibs-text-micro font-semibold text-[#667085]">
                  Assigned:{" "}
                  <strong className="text-[#042C51]">{item.assignedTo}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className="h-7.5 2xl:h-8 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-2.5 2xl:px-3 sibs-text-micro font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
                  >
                    Open Module
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolve(item.id)}
                    className="h-7.5 2xl:h-8 rounded-lg bg-emerald-600 px-2.5 2xl:px-3 sibs-text-micro font-extrabold text-white transition hover:bg-emerald-700"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="sibs-empty-panel">
          <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
          <p className="mt-3 text-sm font-extrabold text-[#042C51]">
            No Risk Exceptions Found
          </p>
          <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
            No records match the active search and module filters.
          </p>
        </div>
      )}

      <PaginationTable
        className="border-0 bg-transparent p-0 shadow-none"
        showSearch={false}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        loadedCount={items.length}
        totalRecords={totalItems}
        recordLabel="risk exceptions"
        onPrevious={() => pagination.onPageChange(pagination.currentPage - 1)}
        onNext={() => pagination.onPageChange(pagination.currentPage + 1)}
      />
    </div>
  );
}

