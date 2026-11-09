import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  RotateCw,
  Users,
} from "lucide-react";
import {
  DataCard,
  ResponsiveTableShell,
  SearchInput,
  SelectDropdown,
  StatusBadge,
  TableEmptyRow,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";

function formatTableDate(val) {
  if (!val) return "—";
  const str = String(val).slice(0, 10);
  const d = new Date(`${str}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return str;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export default function AttritionReportsTable({
  records = [],
  pagination = {},
  loading = false,
  error = "",
  filters = {},
  onFilterChange,
  onPageChange,
  onViewRecord,
  onRetry,
}) {
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [sortField, setSortField] = useState("lastWorkingDate");
  const [sortAsc, setSortAsc] = useState(false);

  // Synchronize local search input if filters.search was modified externally
  const [prevFilterSearch, setPrevFilterSearch] = useState(filters?.search || "");
  if (prevFilterSearch !== (filters?.search || "")) {
    setPrevFilterSearch(filters?.search || "");
    setSearchTerm(filters?.search || "");
  }

  // Debounced search dispatch (350ms) to prevent server request flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters?.search || "") !== searchTerm) {
        onFilterChange?.("search", searchTerm);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, filters?.search, onFilterChange]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "All" },
      { label: "Inactive (Kronos)", value: "Inactive (Kronos)" },
      { label: "Inactive", value: "Inactive" },
    ],
    [],
  );

  const classificationOptions = useMemo(
    () => [
      { label: "All Classifications", value: "All" },
      { label: "Voluntary", value: "Voluntary" },
      { label: "Involuntary", value: "Involuntary" },
    ],
    [],
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    onFilterChange?.("search", "");
    onFilterChange?.("status", "All");
    onFilterChange?.("classification", "All");
  };

  const hasActiveTableFilters = Boolean(
    searchTerm ||
      (filters?.status && filters.status !== "All") ||
      (filters?.classification && filters.classification !== "All")
  );

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";

      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (
        !Number.isNaN(aNum) &&
        !Number.isNaN(bNum) &&
        String(aVal).trim() !== "" &&
        String(bVal).trim() !== ""
      ) {
        return sortAsc ? aNum - bNum : bNum - aNum;
      }

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [records, sortField, sortAsc]);

  const renderSortableHeader = (label, field, className = "") => {
    const isActive = sortField === field;
    return (
      <th
        scope="col"
        onClick={() => handleSort(field)}
        className={`sibs-data-table-th group cursor-pointer select-none px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy transition-colors hover:text-sibs-orange ${className}`.trim()}
        aria-sort={isActive ? (sortAsc ? "ascending" : "descending") : "none"}
      >
        <span className="inline-flex items-center gap-1.5">
          <span>{label}</span>
          {isActive ? (
            sortAsc ? (
              <ArrowUp className="h-3 w-3 text-sibs-orange shrink-0" aria-hidden="true" />
            ) : (
              <ArrowDown className="h-3 w-3 text-sibs-orange shrink-0" aria-hidden="true" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 text-sibs-navy/40 group-hover:text-sibs-orange shrink-0" aria-hidden="true" />
          )}
        </span>
      </th>
    );
  };

  return (
    <section
      aria-label="Detailed Employee Attrition Records"
      className="sibs-page-card-in rounded-[14px] border border-sibs-border bg-white font-jakarta shadow-xs"
      style={{ animationDelay: "360ms", animationFillMode: "both" }}
    >
      {/* 1. Card Header with Integrated Search and Filters (Matching Sourcing Channel Performance Directory) */}
      <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="sibs-card-title">
              Detailed Employee Attrition Records
            </h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-700">
              {Number(pagination?.total ?? records.length).toLocaleString()}{" "}
              {(pagination?.total ?? records.length) === 1 ? "record" : "records"}
            </span>
            {filters?.dateFrom && filters?.dateTo ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sibs-border bg-sibs-surface px-2.5 py-0.5 text-[10.5px] font-bold text-sibs-navy">
                <Calendar className="h-3 w-3 text-sibs-orange" />
                <span>
                  {filters.dateFrom} to {filters.dateTo}
                </span>
              </span>
            ) : null}
          </div>
          <p className="sibs-card-subtitle mt-0.5">
            Individual employee separations matching current organizational scope and filters. Click any row to view full details.
          </p>
        </div>

        {/* Integrated Toolbar on clean white surface */}
        <div className="relative z-30 mt-3.5 2xl:mt-4 overflow-visible">
          <div className="flex flex-wrap items-end gap-3">
            {/* SEARCH FIELD (Employee Name and SiBS ID) */}
            <div className="w-full sm:max-w-md sm:flex-1 min-w-[240px]">
              <SearchInput
                id="attrition-table-search"
                label="Search Employee"
                labelClassName="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                placeholder="Search by Employee Name or SiBS ID..."
                value={searchTerm}
                onChange={(val) =>
                  setSearchTerm(typeof val === "string" ? val : val?.target?.value || "")
                }
                onClear={() => {
                  setSearchTerm("");
                  onFilterChange?.("search", "");
                }}
                disabled={loading}
                inputClassName="h-8.5 2xl:h-10 text-xs font-bold"
              />
            </div>

            {/* TABLE FILTER: CLASSIFICATION */}
            <div className="w-full sm:w-48">
              <SelectDropdown
                label="Classification"
                labelClassName="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                value={filters?.classification || "All"}
                options={classificationOptions}
                onChange={(val) => onFilterChange?.("classification", val)}
                searchable={false}
                clearable={false}
                disabled={loading}
                buttonClassName="h-8.5 2xl:h-10 px-2.5 2xl:px-3"
              />
            </div>

            {/* TABLE FILTER: STATUS */}
            <div className="w-full sm:w-48">
              <SelectDropdown
                label="Status"
                labelClassName="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
                value={filters?.status || "All"}
                options={statusOptions}
                onChange={(val) => onFilterChange?.("status", val)}
                searchable={false}
                clearable={false}
                disabled={loading}
                buttonClassName="h-8.5 2xl:h-10 px-2.5 2xl:px-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error state with retry */}
      {error ? (
        <div className="m-4 sm:m-5 2xl:m-6 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
          <div className="text-left">
            <p className="text-xs font-extrabold text-rose-900">{error}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-rose-700">
              Please check connection to Kronos API or try refreshing.
            </p>
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-extrabold text-rose-800 shadow-xs hover:bg-rose-50 transition active:scale-95"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {/* 2. Framed Table Container with standard padding */}
      <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6 font-jakarta">
        <ResponsiveTableShell
          desktopContent={
            <div className="overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-2xs">
              <div className="overflow-x-auto max-h-[560px] 2xl:max-h-[640px] overflow-y-auto sibs-scrollbar">
                <table className="w-full min-w-[1450px] border-collapse bg-white text-left text-xs">
                  <thead className="sibs-data-table-head sticky top-0 z-10 bg-sibs-surface">
                    <tr className="sibs-data-table-head-row">
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 w-10 text-center text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        #
                      </th>
                      {renderSortableHeader("SiBS ID", "sibsId", "whitespace-nowrap")}
                      {renderSortableHeader("Employee Name", "employeeName", "min-w-[180px]")}
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Cluster
                      </th>
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Account
                      </th>
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Department
                      </th>
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Position / Role
                      </th>
                      {renderSortableHeader("Hire Date", "hireDate", "whitespace-nowrap")}
                      {renderSortableHeader("Last Working Day", "lastWorkingDate", "whitespace-nowrap")}
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Tenure
                      </th>
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Classification
                      </th>
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 min-w-[140px] text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Separation Reason
                      </th>
                      <th scope="col" className="sibs-data-table-th px-3 2xl:px-4 py-2.5 2xl:py-3 text-[10px] 2xl:text-[11px] font-extrabold uppercase tracking-wider text-sibs-navy">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-sibs-border/60 font-jakarta" aria-busy={loading}>
                    {loading ? (
                      <TableSkeletonRows columns={13} count={15} />
                    ) : error ? null : sortedRecords.length === 0 ? (
                      <TableEmptyRow
                        colSpan={13}
                        icon={Users}
                        title="No employee attrition records found"
                        description="Try adjusting your search query, date range, or organizational filters."
                        actionLabel={hasActiveTableFilters ? "Reset Search & Filters" : undefined}
                        onAction={hasActiveTableFilters ? handleResetFilters : undefined}
                      />
                    ) : (
                      sortedRecords.map((row) => (
                        <tr
                          key={row.employeeId || row.sibsId}
                          role="button"
                          tabIndex={0}
                          onClick={() => onViewRecord?.(row)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onViewRecord?.(row);
                            }
                          }}
                          aria-label={`View separation details for ${row.employeeName}`}
                          className="group cursor-pointer transition-colors hover:bg-sibs-cream-light focus-visible:bg-sibs-cream-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sibs-orange/30"
                        >
                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center font-mono text-[11px] text-sibs-muted">
                            {row.index}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-mono text-xs font-bold text-sibs-orange whitespace-nowrap">
                            {row.sibsId}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5">
                            <span className="font-extrabold text-sibs-navy group-hover:text-sibs-orange transition-colors">
                              {row.employeeName}
                            </span>
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-slate-600 whitespace-nowrap font-medium">
                            {row.cluster && row.cluster !== "Unassigned" ? (
                              row.cluster
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-bold text-sibs-navy whitespace-nowrap">
                            {row.account}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-slate-600 whitespace-nowrap font-medium">
                            {row.department && row.department !== "Unassigned" ? (
                              row.department
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-slate-500 whitespace-nowrap">
                            {row.position && row.position !== "—" ? (
                              row.position
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {formatTableDate(row.hireDate)}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-mono text-[11px] font-bold text-rose-600 whitespace-nowrap">
                            {formatTableDate(row.lastWorkingDate)}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 font-extrabold text-sibs-orange whitespace-nowrap">
                            {row.tenure}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap">
                            {row.separationClassification === "Voluntary" ? (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Voluntary
                              </span>
                            ) : row.separationClassification === "Involuntary" ? (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Involuntary
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          <td
                            className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-slate-600 text-[11px] max-w-[180px] truncate"
                            title={
                              row.separationReason && row.separationReason !== "Not available"
                                ? row.separationReason
                                : undefined
                            }
                          >
                            {row.separationReason && row.separationReason !== "Not available" ? (
                              row.separationReason
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>

                          <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 whitespace-nowrap">
                            <StatusBadge status={row.status || "Inactive"} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          }
          mobileContent={
            <div className="space-y-3 font-jakarta">
              {loading ? (
                <DataCard.Skeleton count={4} lines={3} />
              ) : error ? null : sortedRecords.length === 0 ? (
                <DataCard.Empty
                  icon={Users}
                  title="No employee attrition records found"
                  description="Try adjusting your search query, date range, or organizational filters."
                  action={
                    hasActiveTableFilters ? (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center rounded-lg border border-sibs-border bg-white px-3.5 py-1.5 text-xs font-extrabold text-sibs-navy hover:bg-sibs-surface transition active:scale-95 shadow-2xs"
                      >
                        Reset Search &amp; Filters
                      </button>
                    ) : null
                  }
                />
              ) : (
                sortedRecords.map((row, index) => (
                  <DataCard
                    key={row.employeeId || row.sibsId}
                    index={index}
                    onClick={() => onViewRecord?.(row)}
                    aria-label={`View separation details for ${row.employeeName}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sibs-navy text-xs truncate group-hover:text-sibs-orange transition-colors">
                          {row.employeeName}
                        </h4>
                        <p className="font-mono text-[10.5px] font-bold text-sibs-orange">
                          {row.sibsId} · <span className="font-normal text-sibs-muted">{row.account}</span>
                        </p>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={row.status || "Inactive"} />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                      <div>
                        <span className="block text-[9.5px] text-sibs-muted font-bold uppercase tracking-wide">
                          Last Working Day
                        </span>
                        <span className="font-bold text-rose-600 font-mono">
                          {formatTableDate(row.lastWorkingDate)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9.5px] text-sibs-muted font-bold uppercase tracking-wide">
                          Tenure
                        </span>
                        <span className="font-extrabold text-sibs-orange">
                          {row.tenure || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100/80">
                      <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                        {row.department && row.department !== "Unassigned" ? row.department : "—"} ·{" "}
                        {row.separationClassification && row.separationClassification !== "Not available"
                          ? row.separationClassification
                          : "—"}
                      </span>
                      <span className="text-[10.5px] font-extrabold text-sibs-orange group-hover:underline">
                        View details →
                      </span>
                    </div>
                  </DataCard>
                ))
              )}
            </div>
          }
        />

        {/* 3. Pagination Footer (Framed cleanly inside card padding) */}
        <div className="pt-3 sm:pt-4">
          <TablePagination
            currentPage={pagination.currentPage || 1}
            totalPages={pagination.totalPages || 1}
            totalRecords={pagination.total ?? records.length}
            pageSize={pagination.limit || 15}
            onPageChange={onPageChange}
            recordLabel="employees"
            className="border-t-0 pt-0"
          />
        </div>
      </div>
    </section>
  );
}
