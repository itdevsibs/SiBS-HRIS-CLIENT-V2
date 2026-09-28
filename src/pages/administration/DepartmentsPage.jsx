import { useState } from "react";

import {
  AlertTriangle,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import DepartmentCard from "@/components/departments/DepartmentCard";
import DepartmentDetailsModal from "@/components/departments/DepartmentDetailsModal";
import DepartmentFilters from "@/components/departments/DepartmentFilters";
import DepartmentSummaryCards from "@/components/departments/DepartmentSummaryCards";
import Header from "@/components/layout/Header";
import { PageHeaderHero } from "@/components/ui";
import useDepartments from "@/hooks/departments/useDepartments";
import { DepartmentsProvider } from "@/services/context/DepartmentsContext";

function DepartmentsPageContent() {
  const departments = useDepartments();
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  return (
    <div className="sibs-dashboard-shell">
      <Header />

      <main className="sibs-dashboard-main-wide">
        <PageHeaderHero
          kicker="Organization View"
          title="Department Units & Account Status"
          description="Read-only organization directory and operational account reporting sourced from the Kronos database."
          className="mb-5"
          actions={
            <button
              type="button"
              className="sibs-btn-icon"
              title="Refresh departments"
              onClick={departments.refresh}
              disabled={departments.refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  departments.refreshing
                    ? "animate-spin text-sibs-orange"
                    : ""
                }`}
              />
            </button>
          }
        />

        <DepartmentSummaryCards summary={departments.summary} />

        <section className="mt-5 overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-sibs-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="sibs-card-title">
                Department Directory & Status Reports
              </h2>
              <p className="sibs-card-subtitle">
                Select a department to review its accounts, Operations Managers,
                and Team Leaders.
              </p>
            </div>

            <span className="self-start rounded-lg border border-sibs-border bg-sibs-surface px-3 py-1.5 text-[10px] font-extrabold text-sibs-secondary sm:self-auto">
              {departments.pagination.total || departments.departments.length}{" "}
              departments found
            </span>
          </div>

          <DepartmentFilters
            search={departments.search}
            status={departments.status}
            onSearch={departments.setSearch}
            onStatus={departments.setStatus}
            onClear={departments.clearFilters}
            canClear={departments.hasActiveFilters}
          />

          {departments.loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-sibs-orange" />
            </div>
          ) : departments.error ? (
            <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
              <AlertTriangle className="mx-auto h-8 w-8" />
              <h3 className="mt-3 text-sm font-extrabold">
                Department report unavailable
              </h3>
              <p className="mt-1 text-xs font-semibold">{departments.error}</p>
              <button
                type="button"
                className="sibs-btn-secondary mt-4"
                onClick={departments.refresh}
              >
                Try Again
              </button>
            </div>
          ) : departments.departments.length ? (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
              {departments.departments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  onView={setSelectedDepartment}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <Building2 className="mx-auto h-10 w-10 text-sibs-tertiary-8" />
              <h3 className="mt-3 text-sm font-extrabold text-sibs-navy">
                No departments found
              </h3>
              <p className="mt-1 text-xs font-semibold text-sibs-muted">
                Adjust or clear the current filters.
              </p>
            </div>
          )}
        </section>
      </main>

      <DepartmentDetailsModal
        department={selectedDepartment}
        onClose={() => setSelectedDepartment(null)}
      />
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <DepartmentsProvider>
      <DepartmentsPageContent />
    </DepartmentsProvider>
  );
}
