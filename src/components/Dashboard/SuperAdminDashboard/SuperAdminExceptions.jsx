import { CheckCircle2 } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
import { getSeverityPillClass } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

export default function SuperAdminExceptions({
  items,
  totalItems,
  pagination,
  onNavigate,
  onResolve,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="sibs-section-title">
          Risk &amp; Exception Escalation Desk ({totalItems})
        </h2>
        <p className="sibs-section-subtitle">
          System-wide exceptions for user mapping, resignations, leaves,
          attendance, hiring, and approval workflows.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="sibs-page-card-in rounded-xl border border-[#E6ECF2] bg-white p-4 transition hover:border-[#FF5C28]/40"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${getSeverityPillClass(
                        item.severity,
                      )}`}
                    >
                      {item.severity} Severity
                    </span>
                    <span className="text-xs font-extrabold text-[#042C51]">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-[#667085]">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 text-[10px] font-semibold text-[#667085]">
                  Target: <strong>{item.moduleTarget}</strong> • Pending:{" "}
                  <strong className="text-amber-700">
                    {item.daysPending} days
                  </strong>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#EEF2F6] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[10px] font-semibold text-[#667085]">
                  Assigned:{" "}
                  <strong className="text-[#042C51]">{item.assignedTo}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className="h-8 rounded-lg bg-[#F2F6FA] px-3 text-[10px] font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
                  >
                    Open Module
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolve(item.id)}
                    className="h-8 rounded-lg bg-emerald-600 px-3 text-[10px] font-extrabold text-white hover:bg-emerald-700"
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
