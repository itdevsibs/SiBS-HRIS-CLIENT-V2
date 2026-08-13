import { Filter, RotateCcw } from "lucide-react";

import {
  accountOptions,
  statusOptions,
} from "../../../lib/utils/offers/offerConstants";
import { useOffers } from "../../../services/context/OffersContext";
import PaginationTable from "../../../services/pagination/PaginationTable";

function toDropdownOptions(options = []) {
  return options.map((option) => ({
    id: option,
    value: option,
    label: option,
  }));
}

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

  const hasActiveFilters =
    String(search || "").trim() ||
    (statusFilter && statusFilter !== "All Status") ||
    (accountFilter && accountFilter !== "All Accounts");

  return (
    <div className="border-b border-[#E6ECF2] px-4 py-4 font-jakarta sm:px-5 sm:py-5">
      <h2 className="font-jakarta text-base font-extrabold text-[#042C51]">Offer Records</h2>
      <p className="mt-1 font-jakarta text-xs font-semibold leading-5 text-[#667085]">
        Search and filter offered candidates by approval status and account.
      </p>

      <div className="relative z-[90] mt-4 overflow-visible">
        <PaginationTable
          filterLayout="ta-inline"
          showFilterPanel={false}
          showFilterHeader={false}
          showPagination={false}
          searchValue={search}
          searchPlaceholder="Search candidate, offer ID, role, or account..."
          onSearchChange={setSearch}
          dropdownFilters={[
            {
              key: "status",
              value: statusFilter,
              options: toDropdownOptions(statusOptions),
              onChange: setStatusFilter,
              includeAll: false,
              allLabel: "All Status",
              label: "Status",
              placeholder: "All Status",
              searchable: false,
            },
            {
              key: "account",
              value: accountFilter,
              options: toDropdownOptions(accountOptions),
              onChange: setAccountFilter,
              includeAll: false,
              allLabel: "All Accounts",
              label: "Account",
              placeholder: "Search accounts...",
              searchable: true,
            },
          ]}
          rightContent={
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-extrabold text-[#98A2B3] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF7F3] hover:text-[#FF5C28] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#D7DEE8] disabled:hover:bg-white disabled:hover:text-[#98A2B3] xl:w-auto"
            >
              <Filter size={14} />
              Clear
            </button>
          }
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </div>
  );
}
