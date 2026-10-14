import { RotateCcw } from "lucide-react";

import PaginationTable from "@/services/pagination/PaginationTable";

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function DepartmentFilters({
  search,
  status,
  onSearch,
  onStatus,
  onClear,
  canClear,
}) {
  return (
    <div className="relative z-[90] overflow-visible border-b border-sibs-border p-4 font-jakarta sm:p-5">
      <PaginationTable
        filterLayout="ta-inline"
        showFilterPanel={false}
        showFilterHeader={false}
        showPagination={false}
        searchValue={search}
        searchPlaceholder="Search department or account..."
        onSearchChange={(val) =>
          onSearch(typeof val === "string" ? val : val?.target?.value ?? "")
        }
        className="border-0 bg-transparent p-0 shadow-none font-jakarta"
        filters={[
          {
            key: "status",
            value: status || "all",
            options: STATUS_OPTIONS,
            onChange: onStatus,
            includeAll: false,
            allLabel: "All Statuses",
            label: "Department Status",
            placeholder: "All Statuses",
            searchable: false,
            className: "w-full xl:w-[170px] 2xl:w-[200px] xl:flex-none",
          },
        ]}
        rightContent={
          canClear ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-sibs-border bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-sibs-muted transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto"
            >
              <RotateCcw size={14} />
              Clear
            </button>
          ) : null
        }
      />
    </div>
  );
}
