import { Download } from "lucide-react";

import PaginationTable from "../../../services/pagination/PaginationTable";
import { getStatusPillClass } from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

export default function SuperAdminActivity({
  items,
  totalItems,
  pagination,
  onExport,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="sibs-section-title">
            System &amp; Module Activity Audit Log ({totalItems})
          </h2>
          <p className="sibs-section-subtitle">
            Recorded user actions, request updates, and access-level modifications.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#F2F6FA] px-3 text-xs font-extrabold text-[#042C51] hover:bg-[#E6ECF2]"
        >
          <Download size={14} />
          Export Activity Log
        </button>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.id} className="sibs-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#042C51]">{item.action}</p>
                  <p className="mt-1 break-all text-[10px] font-semibold text-[#667085]">
                    {item.actor} • {item.module}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${getStatusPillClass(
                    item.status,
                  )}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#475467]">
                {item.details}
              </p>
              <p className="mt-3 text-[10px] font-semibold text-[#98A2B3]">
                {item.timestamp}
              </p>
            </article>
          ))
        ) : (
          <div className="sibs-empty-panel">No activity logs match the active filters.</div>
        )}
      </div>

      <div className="sibs-data-table-shell hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse bg-white text-left text-xs">
            <thead className="sibs-data-table-head">
              <tr className="sibs-data-table-head-row">
                <th className="sibs-data-table-th text-left">Timestamp</th>
                <th className="sibs-data-table-th text-left">User Actor</th>
                <th className="sibs-data-table-th text-left">Access Level</th>
                <th className="sibs-data-table-th text-left">Module</th>
                <th className="sibs-data-table-th text-left">Action Taken</th>
                <th className="sibs-data-table-th text-left">Log Details</th>
                <th className="sibs-data-table-th text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="sibs-data-table-row">
                    <td className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold text-[#98A2B3]">
                      {item.timestamp}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-[#042C51]">
                      {item.actor}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                        {item.accessLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#344054]">
                      {item.module}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-extrabold text-[#FF5C28]">
                      {item.action}
                    </td>
                    <td className="max-w-[360px] px-4 py-3 text-[#667085]">
                      {item.details}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${getStatusPillClass(
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
                  <td colSpan={7} className="px-5 py-12 text-center text-xs font-bold text-[#667085]">
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
