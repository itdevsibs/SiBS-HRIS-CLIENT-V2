import React from "react";
import { Download } from "lucide-react";

import {
  DataCard,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  TablePagination,
} from "@/components/ui";
import {
  formatLogDetails,
  getStatusPillClass,
} from "../../../lib/utils/Dashboards/SuperAdminDashboard/superAdminDashboardHelpers.js";

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
  const formattedModuleOptions = React.useMemo(() => {
    const hasAll = moduleOptions.some(
      (opt) => (typeof opt === "string" ? opt : opt.value) === "All Modules",
    );
    const mapped = moduleOptions.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt,
    );
    return hasAll
      ? mapped
      : [{ value: "All Modules", label: "All Modules" }, ...mapped];
  }, [moduleOptions]);

  const formattedStatusOptions = React.useMemo(() => {
    const hasAll = statusOptions.some(
      (opt) => (typeof opt === "string" ? opt : opt.value) === "All Statuses",
    );
    const mapped = statusOptions.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt,
    );
    return hasAll
      ? mapped
      : [{ value: "All Statuses", label: "All Statuses" }, ...mapped];
  }, [statusOptions]);

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
          className="sibs-btn-secondary"
        >
          <Download className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 text-sibs-orange" />
          Export Activity Log
        </button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80 2xl:w-96">
          <SearchInput
            value={searchInput}
            onChange={(val) => onSearchChange?.(val)}
            onClear={() => onSearchChange?.("")}
            onKeyDown={onSearchKeyDown}
            placeholder="Search user actor, action, or details..."
            ariaLabel="Search activity logs"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:flex sm:flex-1 sm:items-center">
          <div className="w-full sm:w-52 2xl:w-60">
            <SelectDropdown
              label="Module"
              hideLabel
              value={module}
              options={formattedModuleOptions}
              onChange={(val) => onFilterChange?.("module", val)}
              searchable
              clearable={false}
              triggerClassName="w-full"
            />
          </div>

          <div className="w-full sm:w-44 2xl:w-48">
            <SelectDropdown
              label="Result Status"
              hideLabel
              value={status}
              options={formattedStatusOptions}
              onChange={(val) => onFilterChange?.("status", val)}
              searchable={false}
              clearable={false}
              triggerClassName="w-full"
            />
          </div>
        </div>
      </div>

      <ResponsiveTableShell
        mobileView={
          items.length > 0 ? (
            items.map((item, index) => (
              <DataCard
                key={item.id}
                interactive={false}
                style={{
                  animationDelay: `${index * 40}ms`,
                  animationFillMode: "both",
                }}
              >
                <DataCard.Header
                  title={item.action}
                  subtitle={`${item.actor} • ${item.module}`}
                  badge={
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${getStatusPillClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  }
                />
                <div className="mt-2 text-xs font-semibold leading-relaxed text-sibs-text-secondary">
                  {formatLogDetails(item.details)}
                </div>
                <DataCard.Footer
                  timestamp={item.timestamp}
                  note={
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                      Tier: {item.accessLevel}
                    </span>
                  }
                />
              </DataCard>
            ))
          ) : (
            <DataCard.Empty
              title="No Activity Logs Found"
              description="No activity logs match the active filters."
            />
          )
        }
        desktopView={
          <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
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
                <tbody className="divide-y divide-sibs-border">
                  {items.length > 0 ? (
                    items.map((item, index) => (
                      <tr
                        key={item.id}
                        className="sibs-data-table-row sibs-page-card-in hover:bg-sibs-cream-light/60 transition-colors"
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
                          {formatLogDetails(item.details)}
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
                      <td colSpan={7} className="px-4 py-10 text-center text-xs font-bold text-sibs-muted">
                        No activity logs match the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      />

      <TablePagination
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        loadedCount={items.length}
        totalItems={totalItems}
        itemName="activity logs"
        onPageChange={pagination?.onPageChange}
      />
    </div>
  );
}

