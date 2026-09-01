import { Filter } from "lucide-react";

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
    <div className="border-b border-sibs-border px-4 py-3.5 font-jakarta sm:px-5 2xl:px-6 2xl:py-4">
      <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">Offer Records</h2>
      <p className="mt-0.5 sibs-text-xs font-semibold leading-relaxed text-sibs-muted">
        Search and filter offered candidates by approval status and account.
      </p>

      <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
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
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-sibs-border-subtle bg-white px-3 text-xs font-extrabold text-sibs-faint transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border-subtle disabled:hover:bg-white disabled:hover:text-sibs-faint xl:w-auto"
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
