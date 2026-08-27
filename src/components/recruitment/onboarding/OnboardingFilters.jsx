import React, { useMemo } from "react";
import { Filter, Search, X } from "lucide-react";
import ThemedDropdown from "../../layout/dropdown/ThemedDropdown.jsx";
import { useOnboarding } from "../../../services/context/OnboardingContext";
import { usePagination } from "../../../services/context/PaginationContext";

function cleanText(value) {
  return String(value ?? "").trim();
}

const labelClass =
  "mb-1.5 block font-jakarta text-xs font-extrabold tracking-normal text-[#101828]";

function toOptions(options) {
  return options.map((option) => ({ label: option, value: option }));
}

export default function OnboardingFilters() {
  const { list = [] } = useOnboarding();
  const {
    searchInput,
    setSearchInput,
    setSearch,
    filterValues,
    setFilter,
    commitSearch,
    resetFilters,
  } = usePagination("onboarding");

  const ownerOptions = useMemo(() => {
    const owners = Array.from(
      new Set(
        (Array.isArray(list) ? list : [])
          .map((record) => cleanText(record?.owner))
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));

    return ["All Owners", ...owners];
  }, [list]);

  const showStatus = filterValues.showStatus || "All Status";
  const outcome = filterValues.outcome || "All Outcomes";
  const owner = filterValues.owner || "All Owners";

  const isFiltered = Boolean(
    cleanText(searchInput) ||
      showStatus !== "All Status" ||
      outcome !== "All Outcomes" ||
      owner !== "All Owners",
  );

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
  }

  function handleResetFilters() {
    setSearchInput("");
    setSearch("");
    resetFilters();
    setFilter("showStatus", "All Status");
    setFilter("outcome", "All Outcomes");
    setFilter("owner", "All Owners");
  }

  return (
    <div className="bg-white font-jakarta">
      <div className="flex flex-col gap-3 overflow-visible sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative w-full min-w-0 sm:min-w-[240px] 2xl:sm:min-w-[280px] sm:flex-1">
          <label className={labelClass}>Search</label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3]"
            />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitSearch();
              }}
              placeholder="Search candidate, onboarding ID, email, role, account, or owner..."
              className="h-8.5 2xl:h-10 w-full rounded-lg 2xl:rounded-xl border border-[#D0D5DD] bg-white pl-9 pr-9 sibs-text-xs font-semibold text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#FF5C28] focus:ring-2 focus:ring-[#FF5C28]/20"
            />

            {cleanText(searchInput) ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear onboarding search"
                className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[#98A2B3] hover:bg-white hover:text-[#FF5C28]"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>

        {[
          ["Status", showStatus, ["All Status", "Pending", "Show", "No Show", "Withdrawn"], "showStatus", "sm:w-[145px] 2xl:sm:w-[175px]"],
          ["Outcome", outcome, ["All Outcomes", "Pending Start", "True Hire", "No Show", "Pre-start Withdrawal"], "outcome", "sm:w-[175px] 2xl:sm:w-[210px]"],
          ["Owner", owner, ownerOptions, "owner", "sm:w-[155px] 2xl:sm:w-[185px]"],
        ].map(([label, selectedValue, options, key, widthClass]) => (
          <div key={key} className={`w-full min-w-0 ${widthClass}`}>
            <label className={labelClass}>{label}</label>
            <ThemedDropdown
              value={selectedValue}
              options={toOptions(options)}
              onChange={(nextValue) => setFilter(key, nextValue)}
              searchable={false}
              showPlaceholderOption={false}
              className="w-full"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={handleResetFilters}
          disabled={!isFiltered}
          className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-2 rounded-lg 2xl:rounded-xl border border-[#D0D5DD] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#344054] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Filter size={14} />
          Clear
        </button>
      </div>
    </div>
  );
}
