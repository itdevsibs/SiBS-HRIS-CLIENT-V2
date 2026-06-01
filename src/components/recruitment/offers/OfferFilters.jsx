import { Search } from "lucide-react";
import {
  accountOptions,
  statusOptions,
} from "../../../lib/utils/offers/offerConstants";
import { useOffers } from "../../../services/context/OffersContext";

export default function OfferFilters() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    accountFilter,
    setAccountFilter,
    clearFilters,
  } = useOffers();

  return (
    <div className="border-b border-[#E6ECF2] p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_220px_auto] xl:items-end">
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
              placeholder="Search candidate, offer ID, role, account..."
              className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 pl-11 text-sm font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Status
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-[#101828]">
            Account
          </label>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="h-12 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-bold text-[#344054] outline-none transition focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          >
            {accountOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
