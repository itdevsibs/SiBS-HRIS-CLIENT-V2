import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Calendar,
  FileSpreadsheet,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import {
  ResponsiveTableShell,
  TablePagination,
  TableSkeletonRows,
} from "@/components/ui";
import ThemedDropdown from "../../layout/dropdown/ThemedDropdown.jsx";

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
}) {
  const [sortField, setSortField] = useState("lastWorkingDate");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const statusOptions = useMemo(
    () => [
      { label: "All Status", value: "All" },
      { label: "Inactive", value: "Inactive" },
    ],
    [],
  );

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [records, sortField, sortAsc]);

  return (
    <section
      aria-label="Detailed Employee Attrition Records"
      className="sibs-page-card-in overflow-hidden rounded-[14px] border border-sibs-border bg-white shadow-xs font-jakarta"
      style={{ animationDelay: "240ms", animationFillMode: "both" }}
    >
      {/* 1. Card Header */}
      <div className="flex flex-col gap-3 border-b border-sibs-border p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="sibs-card-title flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-sibs-orange" />
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
      </div>

      {/* 2. Table Search and Filters Toolbar */}
      <div className="border-b border-sibs-border bg-slate-50/50 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(220px,1fr)_minmax(150px,220px)] items-end">
          {/* SEARCH FIELD (Employee Name and SiBS ID) */}
          <div className="min-w-0 space-y-1">
            <label
              htmlFor="attrition-table-search"
              className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            >
              Search Employee
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sibs-muted" />
              <input
                id="attrition-table-search"
                type="text"
                aria-label="Search by Employee Name or SiBS ID"
                placeholder="Search by Employee Name or SiBS ID..."
                value={filters?.search || ""}
                onChange={(e) => onFilterChange?.("search", e.target.value)}
                className="flex h-8.5 2xl:h-10 w-full items-center rounded-[10px] border border-sibs-border bg-white pl-8 pr-8 font-jakarta sibs-text-xs font-bold text-sibs-navy outline-none transition placeholder:text-sibs-muted hover:border-sibs-orange/40 focus:border-sibs-orange focus:ring-4 focus:ring-sibs-orange/10"
              />
              {filters?.search ? (
                <button
                  type="button"
                  onClick={() => onFilterChange?.("search", "")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sibs-muted hover:text-sibs-navy"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* TABLE FILTER: STATUS */}
          <div className="min-w-0 space-y-1">
            <label
              id="table-filter-status-label"
              className="mb-1 block font-jakarta sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            >
              Status
            </label>
            <ThemedDropdown
              value={filters?.status || "All"}
              options={statusOptions}
              onChange={(val) => onFilterChange?.("status", val)}
              searchable={false}
              showPlaceholderOption={false}
              className="w-full"
              aria-labelledby="table-filter-status-label"
            />
          </div>

        </div>
      </div>

      {/* Error state */}
      {error ? (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center">
          <p className="text-xs font-extrabold text-rose-900">{error}</p>
          <p className="mt-1 text-[11px] font-semibold text-rose-700">
            Please check connection to Kronos API or try refreshing.
          </p>
        </div>
      ) : null}

      {/* 3. Table Content */}
      <ResponsiveTableShell
        desktopContent={
          <div className="relative overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 border-b border-sibs-border bg-sibs-surface text-[10px] font-extrabold uppercase tracking-wider text-sibs-muted">
                <tr>
                  <th scope="col" className="px-3 py-3 w-10 text-center">
                    #
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort("sibsId")}
                    className="cursor-pointer px-3 py-3 hover:text-sibs-navy"
                  >
                    <span className="flex items-center gap-1">
                      SiBS ID <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort("employeeName")}
                    className="cursor-pointer px-3 py-3 hover:text-sibs-navy min-w-[180px]"
                  >
                    <span className="flex items-center gap-1">
                      Employee Name <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Cluster
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Account
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Department
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Position / Role
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort("hireDate")}
                    className="cursor-pointer px-3 py-3 hover:text-sibs-navy"
                  >
                    <span className="flex items-center gap-1">
                      Hire Date <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    scope="col"
                    onClick={() => handleSort("lastWorkingDate")}
                    className="cursor-pointer px-3 py-3 hover:text-sibs-navy"
                  >
                    <span className="flex items-center gap-1">
                      Last Working Day <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Tenure
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Classification
                  </th>
                  <th scope="col" className="px-3 py-3 min-w-[140px]">
                    Separation Reason
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-sibs-border/60 font-jakarta">
                {loading ? (
                  <TableSkeletonRows columns={13} rows={10} />
                ) : error ? null : sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-xs font-extrabold text-sibs-navy">
                          No employee attrition records found
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-sibs-muted">
                          Try adjusting search query, date range, or organizational filters.
                        </p>
                      </div>
                    </td>
                  </tr>
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
                      className="group cursor-pointer transition-colors hover:bg-orange-50/40 active:bg-orange-100/30 focus-visible:outline-none focus-visible:bg-orange-50/50"
                    >
                      <td className="px-3 py-2.5 text-center font-mono text-[11px] text-sibs-muted">
                        {row.index}
                      </td>

                      <td className="px-3 py-2.5 font-mono text-xs font-bold text-sibs-navy whitespace-nowrap">
                        {row.sibsId}
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sibs-border bg-slate-100">
                            {row.profilePictureUrl ? (
                              <img
                                src={row.profilePictureUrl}
                                alt={row.employeeName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <span className="font-extrabold text-sibs-navy group-hover:text-sibs-orange transition-colors">
                            {row.employeeName}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-medium">
                        {row.cluster}
                      </td>

                      <td className="px-3 py-2.5 font-bold text-sibs-navy whitespace-nowrap">
                        {row.account}
                      </td>

                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-medium">
                        {row.department}
                      </td>

                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                        {row.position}
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formatTableDate(row.hireDate)}
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-rose-600 whitespace-nowrap">
                        {formatTableDate(row.lastWorkingDate)}
                      </td>

                      <td className="px-3 py-2.5 font-extrabold text-sibs-orange whitespace-nowrap">
                        {row.tenure}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            row.separationClassification === "Voluntary"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : row.separationClassification === "Involuntary"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {row.separationClassification}
                        </span>
                      </td>

                      <td
                        className="px-3 py-2.5 text-slate-600 text-[11px] max-w-[180px] truncate"
                        title={row.separationReason}
                      >
                        {row.separationReason}
                      </td>

                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 border border-rose-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        }
        mobileContent={
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-28 rounded-xl border border-sibs-border bg-white p-3 space-y-2"
                  >
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? null : sortedRecords.length === 0 ? (
              <div className="py-10 text-center text-xs font-bold text-sibs-muted">
                No employee attrition records found.
              </div>
            ) : (
              sortedRecords.map((row) => (
                <article
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
                  className="cursor-pointer rounded-xl border border-sibs-border bg-white p-3.5 shadow-xs space-y-2 transition hover:border-sibs-orange/60 hover:shadow-sm active:bg-orange-50/20 focus-visible:outline-none focus-visible:border-sibs-orange"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sibs-navy text-xs">
                        {row.employeeName}
                      </h4>
                      <p className="font-mono text-[10px] text-sibs-muted">
                        {row.sibsId} · {row.account}
                      </p>
                    </div>
                    <span className="rounded bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-700 border border-rose-200">
                      {row.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                    <div>
                      <span className="block text-[9px] text-sibs-muted font-bold uppercase">
                        Last Working Day
                      </span>
                      <span className="font-bold text-rose-600 font-mono">
                        {formatTableDate(row.lastWorkingDate)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-sibs-muted font-bold uppercase">
                        Tenure
                      </span>
                      <span className="font-extrabold text-sibs-orange">
                        {row.tenure}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
                      {row.department} · {row.separationClassification}
                    </span>
                    <span className="text-[10px] font-bold text-sibs-orange group-hover:underline">
                      View details →
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        }
      />

      {/* 4. Pagination Footer */}
      <div className="border-t border-sibs-border p-3 sm:p-4">
        <TablePagination
          currentPage={pagination.currentPage || 1}
          totalPages={pagination.totalPages || 1}
          totalRecords={pagination.total ?? records.length}
          pageSize={pagination.limit || 15}
          onPageChange={onPageChange}
          recordLabel="employees"
        />
      </div>
    </section>
  );
}
