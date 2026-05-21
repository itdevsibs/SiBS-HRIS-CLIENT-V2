import React from "react";
import { ChevronDown, Search } from "lucide-react";

export default function HiringSearchTable({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  siteFilter,
  setSiteFilter,
  reasonFilter,
  setReasonFilter,
  reasonForHiringOptions = [],
}) {
  const hasActiveFilters =
    search ||
    statusFilter !== "All" ||
    siteFilter !== "All" ||
    reasonFilter !== "All";

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("All");
    setSiteFilter("All");
    setReasonFilter("All");
  }

  return (
    <div className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_240px_240px_260px] xl:items-end">
        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PRF, position, department/account, JD, reason, site, prepared by..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Approval Status
          </label>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
            >
              <option value="All">All Status</option>
              <option value="For Approval">For Approval</option>
              <option value="Approved">Approved</option>
              <option value="Not Approved">Not Approved</option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Location / Site
          </label>

          <div className="relative">
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
            >
              <option value="All">All Sites</option>
              <option value="Davao Site">Davao Site</option>
              <option value="Tagum Site">Tagum Site</option>
              <option value="Mabini Site">Mabini Site</option>
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Reason for Hiring
          </label>

          <div className="relative">
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="h-12 w-full appearance-none rounded-xl border border-[#D0D5DD] bg-white px-4 pr-11 text-sm font-bold text-[#344054] outline-none transition focus:border-[var(--sibs-primary-1)] focus:ring-4 focus:ring-[var(--sibs-primary-1)]/10"
            >
              <option value="All">All Reasons</option>

              {reasonForHiringOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleClearFilters}
            className="inline-flex rounded-full border border-[#E6ECF2] bg-white px-3 py-1 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}