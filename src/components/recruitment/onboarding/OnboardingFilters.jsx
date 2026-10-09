import React, { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { useOnboarding } from "../../../services/context/OnboardingContext";
import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";

function cleanText(value) {
  return String(value ?? "").trim();
}

function toOptions(options) {
  return options.map((option) => ({ label: option, value: option }));
}

const STATUS_OPTIONS = ["All Status", "Pending", "Show", "No Show", "Withdrawn"];
const OUTCOME_OPTIONS = [
  "All Outcomes",
  "Pending Start",
  "True Hire",
  "No Show",
  "Pre-start Withdrawal",
];

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

  function handleResetFilters() {
    setSearchInput("");
    setSearch("");
    resetFilters();
    setFilter("showStatus", "All Status");
    setFilter("outcome", "All Outcomes");
    setFilter("owner", "All Owners");
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      commitSearch();
    }
  }

  return (
    <PaginationTable
      filterLayout="ta-inline"
      showFilterPanel={false}
      showFilterHeader={false}
      showPagination={false}
      searchValue={searchInput}
      searchPlaceholder="Search candidate, onboarding ID, email, role, account, or owner..."
      onSearchChange={(val) =>
        setSearchInput(typeof val === "string" ? val : val?.target?.value ?? "")
      }
      onSearchKeyDown={handleSearchKeyDown}
      className="border-0 bg-transparent p-0 shadow-none font-jakarta"
      filters={[
        {
          key: "showStatus",
          value: showStatus,
          options: toOptions(STATUS_OPTIONS),
          onChange: (nextValue) => setFilter("showStatus", nextValue),
          includeAll: false,
          allLabel: "All Status",
          label: "Status",
          placeholder: "All Status",
          searchable: false,
          className: "w-full xl:w-[140px] 2xl:w-[170px] xl:flex-none",
        },
        {
          key: "outcome",
          value: outcome,
          options: toOptions(OUTCOME_OPTIONS),
          onChange: (nextValue) => setFilter("outcome", nextValue),
          includeAll: false,
          allLabel: "All Outcomes",
          label: "Outcome",
          placeholder: "All Outcomes",
          searchable: false,
          className: "w-full xl:w-[170px] 2xl:w-[200px] xl:flex-none",
        },
        {
          key: "owner",
          value: owner,
          options: toOptions(ownerOptions),
          onChange: (nextValue) => setFilter("owner", nextValue),
          includeAll: false,
          allLabel: "All Owners",
          label: "Owner",
          placeholder: "All Owners",
          searchable: true,
          className: "w-full xl:w-[160px] 2xl:w-[190px] xl:flex-none",
        },
      ]}
      rightContent={
        <button
          type="button"
          onClick={handleResetFilters}
          disabled={!isFiltered}
          className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
        >
          <RotateCcw size={14} />
          Clear
        </button>
      }
    />
  );
}
