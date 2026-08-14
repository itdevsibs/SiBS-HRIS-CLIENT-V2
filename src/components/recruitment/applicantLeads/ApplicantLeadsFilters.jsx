import React from "react";
import { Search } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

function getOptionLabel(option) {
  return String(option?.label || option?.name || option?.value || option || "");
}

function SelectFilter({ value, onChange, options, allLabel }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 text-xs font-bold text-[#344054] outline-none transition hover:border-sibs-primary-1/40 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
    >
      <option value="All">{allLabel}</option>
      {options.map((option, index) => (
        <option
          key={`${getOptionLabel(option)}-${option?.id || index}`}
          value={getOptionLabel(option)}
        >
          {getOptionLabel(option)}
        </option>
      ))}
    </select>
  );
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
  } = useApplicantLeadsPage();

  return (
    <div className="border-b border-[#E6ECF2] bg-white px-5 py-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(320px,520px)_1fr] xl:items-end">
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-[#101828]">
            Search
          </span>
          <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"
          />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search active leads by candidate name, phone, email, account..."
            className="h-10 w-full rounded-[10px] border border-[#D0D5DD] bg-white px-3 pl-9 text-xs font-semibold text-[#042C51] outline-none transition placeholder:text-[#98A2B3] hover:border-sibs-primary-1/30 hover:bg-[#F8FAFC] focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
          />
          </div>
        </label>

        <div className="grid gap-3 lg:grid-cols-[180px_220px_220px_auto]">
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-[#101828]">
            Status
          </span>
          <SelectFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            allLabel="All Statuses"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-[#101828]">
            Department
          </span>
          <SelectFilter
            value={departmentFilter}
            onChange={setDepartmentFilter}
            options={departmentOptions}
            allLabel="All Departments"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-[#101828]">
            Site
          </span>
          <SelectFilter
            value={siteFilter}
            onChange={setSiteFilter}
            options={siteOptions}
            allLabel="All Sites"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/30 hover:bg-white hover:text-[#042C51]"
          >
            Clear
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
