import React, { useMemo } from "react";
import { RotateCcw } from "lucide-react";

import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { usePagination } from "../../../services/context/PaginationContext.jsx";
import PaginationTable from "../../../services/pagination/PaginationTable.jsx";
import {
  GAP_OPTIONS,
  MODULE_OPTIONS,
  RISK_OPTIONS,
  STATUS_OPTIONS,
} from "../../../lib/utils/actionItems/actionItemsConstants.js";

const ENTITY_KEY = "action-items";

function toOptions(options = []) {
  return options.map((opt) => ({
    id: opt,
    label: opt,
    value: opt,
  }));
}

export default function ActionItemsFilters() {
  const { ownerOptions = [] } = useActionItems();
  const {
    searchInput,
    setSearchInput,
    commitSearch,
    resetFilters,
    setFilter,
    filterValues,
  } = usePagination(ENTITY_KEY);

  const formattedStatusOptions = useMemo(() => toOptions(STATUS_OPTIONS), []);
  const formattedRiskOptions = useMemo(() => toOptions(RISK_OPTIONS), []);
  const formattedModuleOptions = useMemo(() => toOptions(MODULE_OPTIONS), []);
  const formattedGapOptions = useMemo(() => toOptions(GAP_OPTIONS), []);
  const formattedOwnerOptions = useMemo(() => toOptions(ownerOptions), [ownerOptions]);

  const hasActiveFilters = Boolean(
    searchInput ||
      (filterValues?.status && filterValues.status !== "All Status") ||
      (filterValues?.risk && filterValues.risk !== "All Risk") ||
      (filterValues?.module && filterValues.module !== "All Modules") ||
      (filterValues?.gap && filterValues.gap !== "All Gaps") ||
      (filterValues?.owner && filterValues.owner !== "All Owners"),
  );

  function handleClearAll() {
    setSearchInput("");
    resetFilters();
    setFilter("status", "All Status");
    setFilter("risk", "All Risk");
    setFilter("module", "All Modules");
    setFilter("gap", "All Gaps");
    setFilter("owner", "All Owners");
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
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
      searchPlaceholder="Search action, role, account, owner..."
      onSearchChange={(val) =>
        setSearchInput(typeof val === "string" ? val : val?.target?.value ?? "")
      }
      onSearchKeyDown={handleSearchKeyDown}
      className="border-0 bg-transparent p-0 shadow-none font-jakarta"
      filters={[
        {
          key: "status",
          value: filterValues?.status || "All Status",
          options: formattedStatusOptions,
          onChange: (val) => setFilter("status", val),
          includeAll: false,
          allLabel: "All Status",
          label: "Status",
          placeholder: "All Status",
          searchable: false,
          className: "w-full xl:w-[130px] 2xl:w-[160px] xl:flex-none",
        },
        {
          key: "risk",
          value: filterValues?.risk || "All Risk",
          options: formattedRiskOptions,
          onChange: (val) => setFilter("risk", val),
          includeAll: false,
          allLabel: "All Risk",
          label: "Risk",
          placeholder: "All Risk",
          searchable: false,
          className: "w-full xl:w-[125px] 2xl:w-[150px] xl:flex-none",
        },
        {
          key: "module",
          value: filterValues?.module || "All Modules",
          options: formattedModuleOptions,
          onChange: (val) => setFilter("module", val),
          includeAll: false,
          allLabel: "All Modules",
          label: "Module",
          placeholder: "All Modules",
          searchable: true,
          className: "w-full xl:w-[145px] 2xl:w-[175px] xl:flex-none",
        },
        {
          key: "gap",
          value: filterValues?.gap || "All Gaps",
          options: formattedGapOptions,
          onChange: (val) => setFilter("gap", val),
          includeAll: false,
          allLabel: "All Gaps",
          label: "Gap",
          placeholder: "All Gaps",
          searchable: true,
          className: "w-full xl:w-[135px] 2xl:w-[165px] xl:flex-none",
        },
        {
          key: "owner",
          value: filterValues?.owner || "All Owners",
          options: formattedOwnerOptions,
          onChange: (val) => setFilter("owner", val),
          includeAll: false,
          allLabel: "All Owners",
          label: "Owner",
          placeholder: "All Owners",
          searchable: true,
          className: "w-full xl:w-[155px] 2xl:w-[185px] xl:flex-none",
        },
      ]}
      rightContent={
        <button
          type="button"
          onClick={handleClearAll}
          disabled={!hasActiveFilters}
          className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-sibs-border disabled:hover:bg-white disabled:hover:text-sibs-muted xl:w-auto"
        >
          <RotateCcw size={14} />
          Clear
        </button>
      }
    />
  );
}
