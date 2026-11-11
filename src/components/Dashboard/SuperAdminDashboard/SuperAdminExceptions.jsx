import React from "react";
import { SearchInput, SelectDropdown, TablePagination } from "@/components/ui";

export default function SuperAdminExceptions({
  items,
  totalItems,
  pagination,
  onNavigate,
  queuesIncomplete,
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
          Risk &amp; Exceptions Desk
        </h2>
        <p className="sibs-text-xs font-semibold text-sibs-muted">
          {queuesIncomplete
            ? "Some queue counts are unavailable or still updating. Only verified categories are shown."
            : `${totalItems} matching flagged ${totalItems === 1 ? "category" : "categories"} across Attrition approvals and pending leaves.`}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80 2xl:w-96">
          <SearchInput
            value={searchInput}
            onChange={(val) => onSearchChange?.(val)}
            onClear={() => onSearchChange?.("")}
            onKeyDown={onSearchKeyDown}
            placeholder="Search by category or module..."
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
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-sibs-border bg-white p-3.5 2xl:p-4 transition hover:border-sibs-orange/40 hover:shadow-xs"
            >
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="sibs-text-sm font-extrabold text-sibs-navy">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-1.5 sibs-text-xs font-semibold leading-relaxed text-sibs-muted">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0 sibs-text-micro font-semibold text-sibs-muted">
                  Target: <strong className="text-sibs-navy">{item.moduleTarget}</strong>
                </div>
              </div>

              <div className="mt-3 flex justify-end border-t border-sibs-border pt-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate(item.path, { state: item.state })}
                  className="h-7.5 2xl:h-8 rounded-lg border border-sibs-border bg-sibs-surface px-2.5 2xl:px-3 sibs-text-micro font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
                >
                  Open Queue
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="sibs-empty-panel">
          <p className="mt-3 text-sm font-extrabold text-sibs-navy">
            {queuesIncomplete ? "No verified categories to display" : "No matching flagged categories"}
          </p>
          <p className="mt-1 text-xs font-semibold text-sibs-faint">
            {queuesIncomplete ? "Check the queue cards for their current source status." : "No flagged categories match the active filters."}
          </p>
        </div>
      )}

      <TablePagination
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        loadedCount={items.length}
        totalRecords={totalItems}
        recordLabel="flagged categories"
        onPageChange={pagination?.onPageChange}
      />
    </div>
  );
}

