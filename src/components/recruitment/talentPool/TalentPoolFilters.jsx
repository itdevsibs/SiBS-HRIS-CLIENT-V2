import { Search, Filter, ChevronDown } from "lucide-react";

import { useTalentPool } from "../../../services/context/TalentPoolContext";
import { statusOptions } from "../../../lib/utils/talentPool/talentPoolConstants";

export default function TalentPoolFilters() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    positionFilter,
    setPositionFilter,
    activePositionOptions,
    clearFilters,
  } = useTalentPool();

  return (
    <div className="border-b border-[#E6ECF2] bg-white px-4 py-5 sm:px-5 lg:px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_minmax(210px,260px)_minmax(170px,220px)_110px] xl:items-end">
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <label className="mb-1.5 block text-sm font-bold text-[#101828]">
            Search
          </label>

          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate, email, phone, position, location..."
              className="h-12 w-full min-w-0 rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-bold text-[#101828]">
            Applied Position
          </label>

          <div className="relative min-w-0">
            <select
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              title={
                positionFilter === "All" ? "All Positions" : positionFilter
              }
              className="h-12 w-full min-w-0 appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-[#D0D5DD] bg-white px-4 pr-10 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              <option value="All">All Positions</option>

              {activePositionOptions.map((position) => (
                <option
                  key={position.positionId || position.positionTitle}
                  value={position.positionTitle}
                >
                  {position.positionTitle}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#344054]"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-bold text-[#101828]">
            Status
          </label>

          <div className="relative min-w-0">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              title={statusFilter === "All" ? "All Statuses" : statusFilter}
              className="h-12 w-full min-w-0 appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-[#D0D5DD] bg-white px-4 pr-10 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Statuses" : status}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#344054]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] md:col-span-2 xl:col-span-1"
        >
          <Filter size={17} />
          Clear
        </button>
      </div>
    </div>
  );
}
