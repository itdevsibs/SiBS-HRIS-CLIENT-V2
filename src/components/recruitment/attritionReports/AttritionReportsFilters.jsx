import React, { useMemo } from "react";
import DatePicker from "../../ui/DatePicker.jsx";
import SelectDropdown from "../../ui/SelectDropdown.jsx";

export default function AttritionReportsFilters({
  filters,
  filterOptions,
  onFilterChange,
}) {
  const accountOptions = useMemo(() => {
    const allAccounts = filterOptions?.accounts || [];
    const list = [{ label: "All Accounts", value: "All" }];
    allAccounts.forEach((a) => {
      list.push({ label: a.name, value: a.name });
    });
    return list;
  }, [filterOptions?.accounts]);

  const departmentOptions = useMemo(() => {
    const raw = filterOptions?.departments || ["All"];
    return raw.map((d) => ({
      label: d === "All" ? "All Departments" : d,
      value: d,
    }));
  }, [filterOptions?.departments]);

  return (
    <div
      aria-label="Attrition Report Filters"
      className="relative z-30 w-full min-w-0 overflow-visible font-jakarta"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        {/* 1. DATE FROM */}
        <div className="min-w-0">
          <DatePicker
            label="Date From"
            labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            value={filters.dateFrom || ""}
            max={filters.dateTo || undefined}
            onChange={(value) => onFilterChange("dateFrom", value)}
            showCalendarIcon
            clearable={false}
            buttonClassName="h-8.5 2xl:h-10 px-2.5 2xl:px-3"
          />
        </div>

        {/* 2. DATE TO */}
        <div className="min-w-0">
          <DatePicker
            label="Date To"
            labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            value={filters.dateTo || ""}
            min={filters.dateFrom || undefined}
            onChange={(value) => onFilterChange("dateTo", value)}
            showCalendarIcon
            clearable={false}
            buttonClassName="h-8.5 2xl:h-10 px-2.5 2xl:px-3"
          />
        </div>

        {/* 3. ACCOUNT */}
        <div className="min-w-0">
          <SelectDropdown
            label="Account"
            labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            value={filters.account || "All"}
            options={accountOptions}
            onChange={(val) => onFilterChange("account", val)}
            searchable
            searchPlaceholder="Search accounts..."
            emptyMessage="No accounts found."
            clearable={false}
            buttonClassName="h-8.5 2xl:h-10 px-2.5 2xl:px-3"
          />
        </div>

        {/* 4. DEPARTMENT */}
        <div className="min-w-0">
          <SelectDropdown
            label="Department"
            labelClassName="sibs-text-micro font-extrabold tracking-normal text-sibs-navy"
            value={filters.department || "All"}
            options={departmentOptions}
            onChange={(val) => onFilterChange("department", val)}
            searchable={false}
            clearable={false}
            buttonClassName="h-8.5 2xl:h-10 px-2.5 2xl:px-3"
          />
        </div>
      </div>
    </div>
  );
}
