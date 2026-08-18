import React, { useMemo } from "react";
import { Filter } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import PaginationTable from "../../../services/pagination/PaginationTable";

function getOptionLabel(option) {
  return String(option?.label || option?.name || option?.value || option || "");
}

function cleanText(value) {
  return String(value ?? "").trim();
}

export default function ApplicantLeadsFilters() {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    siteFilter,
    setSiteFilter,
    clearFilters,
    departmentOptions,
    siteOptions,
    statusOptions,
    isLoading,
  } = useApplicantLeadsPage();

  const formattedStatusOptions = useMemo(() => {
    return [
      { id: "All", label: "All Status", value: "All" },
      ...statusOptions.map((opt) => ({
        id: getOptionLabel(opt),
        label: getOptionLabel(opt),
        value: getOptionLabel(opt),
      })),
    ];
  }, [statusOptions]);

  const formattedDepartmentOptions = useMemo(() => {
    return [
      { id: "All", label: "All Departments", value: "All" },
      ...departmentOptions.map((opt) => ({
        id: opt.id || getOptionLabel(opt),
        label: getOptionLabel(opt),
        value: getOptionLabel(opt),
      })),
    ];
  }, [departmentOptions]);

  const formattedSiteOptions = useMemo(() => {
    return [
      { id: "All", label: "All Sites", value: "All" },
      ...siteOptions.map((opt) => ({
        id: getOptionLabel(opt),
        label: getOptionLabel(opt),
        value: getOptionLabel(opt),
      })),
    ];
  }, [siteOptions]);

  const hasActiveFilters =
    cleanText(searchTerm) ||
    statusFilter !== "All" ||
    departmentFilter !== "All" ||
    siteFilter !== "All";

  return (
    <div className="relative z-[90] overflow-visible border-b border-[#E6ECF2] bg-white p-3.5 sm:p-4 2xl:p-5 font-jakarta">
      <PaginationTable
        filterLayout="ta-inline"
        showFilterPanel={false}
        showFilterHeader={false}
        showPagination={false}
        loading={isLoading}
        searchValue={searchTerm}
        searchPlaceholder="Search candidate, email, phone, account, position..."
        onSearchChange={setSearchTerm}
        dropdownFilters={[
          {
            key: "department",
            value: departmentFilter,
            options: formattedDepartmentOptions,
            onChange: setDepartmentFilter,
            includeAll: false,
            allLabel: "All Departments",
            label: "Department",
            placeholder: "All Departments",
            searchable: true,
            disabled: isLoading,
          },
          {
            key: "site",
            value: siteFilter,
            options: formattedSiteOptions,
            onChange: setSiteFilter,
            includeAll: false,
            allLabel: "All Sites",
            label: "Site",
            placeholder: "All Sites",
            searchable: false,
            disabled: isLoading,
          },
          {
            key: "status",
            value: statusFilter,
            options: formattedStatusOptions,
            onChange: setStatusFilter,
            includeAll: false,
            allLabel: "All Status",
            label: "Status",
            placeholder: "All Status",
            searchable: false,
            disabled: isLoading,
          },
        ]}
        rightContent={
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters || isLoading}
            className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-[#E6ECF2] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#52637A] outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus-visible:ring-2 focus-visible:ring-[#FF5C28]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
          >
            <Filter size={14} />
            Clear
          </button>
        }
        className="border-0 bg-transparent p-0 shadow-none"
      />
    </div>
  );
}
