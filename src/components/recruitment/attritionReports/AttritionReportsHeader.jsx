import React from "react";
import { Download } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";
import AttritionReportsFilters from "./AttritionReportsFilters.jsx";

export default function AttritionReportsHeader({
  filters,
  filterOptions,
  onFilterChange,
  onExport,
  isExporting = false,
}) {
  return (
    <PageHeaderHero
      kicker="WORKFORCE ANALYTICS"
      title="Attrition Reports"
      description="Monitor workforce separations, attrition trends, recruitment-stage losses, and employee movement across accounts and reporting periods."
      actions={
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="sibs-btn-primary whitespace-nowrap"
        >
          <Download size={15} className={isExporting ? "animate-bounce" : ""} />
          {isExporting ? "Exporting..." : "Export Report"}
        </button>
      }
      footer={
        <AttritionReportsFilters
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={onFilterChange}
        />
      }
    />
  );
}
