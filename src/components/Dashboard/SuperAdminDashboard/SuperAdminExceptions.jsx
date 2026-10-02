import React from "react";
import { CheckCircle2 } from "lucide-react";
import { SearchInput, SelectDropdown, TablePagination } from "@/components/ui";
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

  return (
    <div className="space-y-4 2xl:space-y-5 font-jakarta">
      <div>
        <h2 className="font-heading text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
          Risk &amp; Exception Escalation Desk ({totalItems})
        </h2>
        <p className="sibs-text-xs font-semibold text-sibs-muted">
          System-wide exceptions for user mapping, resignations, leaves,
          attendance, hiring, and approval workflows.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80 2xl:w-96">
          <SearchInput
            value={searchInput}
            onChange={(val) => onSearchChange?.(val)}
            onClear={() => onSearchChange?.("")}
            onKeyDown={onSearchKeyDown}
            placeholder="Search exception title, description, or assigned..."
            ariaLabel="Search risk exceptions"
          />
        </div>

        <div className="w-full sm:w-56 2xl:w-64">
          <SelectDropdown
            label="Target Module"
            hideLabel
            value={module}
            options={formattedModuleOptions}
            onChange={(val) => onFilterChange?.("module", val)}
            searchable
            clearable={false}
            triggerClassName="w-full"
          />
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2.5 2xl:space-y-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="sibs-page-card-in rounded-xl border border-sibs-border bg-white p-3.5 2xl:p-4 transition hover:border-sibs-orange/40 hover:shadow-xs"
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
                    <span className="sibs-text-sm font-extrabold text-sibs-navy">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-1.5 sibs-text-xs font-semibold leading-relaxed text-sibs-muted">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 sibs-text-micro font-semibold text-sibs-muted">
                  Target: <strong className="text-sibs-navy">{item.moduleTarget}</strong> • Pending:{" "}
                  <strong className="text-amber-700">
                    {item.daysPending} days
                  </strong>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-2.5 border-t border-sibs-border pt-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="sibs-text-micro font-semibold text-sibs-muted">
                  Assigned:{" "}
                  <strong className="text-sibs-navy">{item.assignedTo}</strong>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className="h-7.5 2xl:h-8 rounded-lg border border-sibs-border bg-sibs-surface px-2.5 2xl:px-3 sibs-text-micro font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
                  >
                    Open Module
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolve(item.id)}
                    className="h-7.5 2xl:h-8 rounded-lg bg-emerald-600 px-2.5 2xl:px-3 sibs-text-micro font-extrabold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
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
          <p className="mt-3 text-sm font-extrabold text-sibs-navy">
            No Risk Exceptions Found
          </p>
          <p className="mt-1 text-xs font-semibold text-sibs-faint">
            No records match the active search and module filters.
          </p>
        </div>
      )}

      <TablePagination
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        loadedCount={items.length}
        totalItems={totalItems}
        itemName="risk exceptions"
        onPageChange={pagination?.onPageChange}
      />
    </div>
  );
}

