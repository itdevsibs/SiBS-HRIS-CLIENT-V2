import React from "react";

const PRIMARY_TABS = [
  "Personal Info",
  "Job & Compensation",
  "Education & Experience",
  "Documents",
  "CHWCP",
  "Resignation History",
];

const SUBSECTIONS = [
  "Basic Information",
  "Contact Details",
  "Government IDs",
];

const FACT_WIDTHS = [120, 100, 95, 80, 70, 110];

export default function EmployeeProfileSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading employee profile"
      className="sibs-page-header-in space-y-4 sm:space-y-5"
    >
      {/* Header Region */}
      <section className="sibs-page-header-in sibs-card relative overflow-hidden p-3.5 2xl:p-4">
        <span className="sibs-top-accent" aria-hidden="true" />

        <div className="mt-0.5 flex flex-col items-center justify-between gap-4 2xl:gap-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-col items-center gap-3.5 2xl:gap-4 text-center sm:flex-row sm:text-left">
            {/* Avatar Skeleton */}
            <div
              data-testid="employee-skeleton-avatar"
              className="h-13 w-13 2xl:h-16 2xl:w-16 shrink-0 rounded-2xl bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none shadow-md"
            />

            <div className="min-w-0">
              {/* Name & Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <div
                  data-testid="employee-skeleton-name"
                  className="h-6 w-52 2xl:h-7 2xl:w-64 rounded-md bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none"
                />

                <div
                  data-testid="employee-skeleton-badge-status"
                  className="h-5 w-16 rounded-full bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none"
                />

                <div
                  data-testid="employee-skeleton-badge-sibs"
                  className="h-5 w-24 rounded-full bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none"
                />
              </div>

              {/* Role Skeleton */}
              <div className="mt-1.5 h-3.5 w-36 rounded bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />

              {/* Facts Skeleton */}
              <div
                data-testid="employee-skeleton-facts"
                className="mt-2 flex flex-wrap justify-center gap-x-3.5 2xl:gap-x-4 gap-y-1.5 sm:justify-start"
              >
                {FACT_WIDTHS.map((width, idx) => (
                  <div
                    key={idx}
                    className="h-3.5 rounded bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none"
                    style={{ width }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Button Skeleton */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center shrink-0">
            <div
              data-testid="employee-skeleton-action-btn"
              className="h-9 w-28 rounded-xl bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none"
            />
          </div>
        </div>
      </section>

      {/* Navigation Region */}
      <nav
        data-testid="employee-skeleton-nav"
        className="sibs-card p-2 2xl:p-2.5 font-jakarta"
        aria-label="Employee profile navigation placeholder"
      >
        <div className="flex min-w-0 items-center gap-1 2xl:gap-1.5 overflow-x-auto pb-1 2xl:pb-1.5 sibs-scrollbar">
          {PRIMARY_TABS.map((tab, idx) => (
            <div
              key={tab}
              className={`inline-flex h-8 2xl:h-9 min-w-max items-center justify-center gap-1.5 rounded-lg border px-2.5 2xl:px-3.5 sibs-text-micro 2xl:sibs-text-xs font-extrabold ${
                idx === 0
                  ? "border-[#BFD3F2] bg-[#E9F0FC] text-sibs-navy shadow-xs"
                  : "border-transparent text-sibs-muted/60"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />
              <span>{tab}</span>
            </div>
          ))}
        </div>

        <div className="mt-1.5 2xl:mt-2 flex items-center gap-1.5 overflow-x-auto border-t border-sibs-border pt-1.5 2xl:pt-2 pb-0.5 sibs-scrollbar">
          <span className="shrink-0 px-1.5 sibs-text-micro font-extrabold uppercase tracking-wider text-sibs-faint">
            Subsections:
          </span>
          {SUBSECTIONS.map((sub, idx) => (
            <div
              key={sub}
              className={`h-6 2xl:h-7 min-w-max rounded-full px-2.5 2xl:px-3 sibs-text-micro font-extrabold ${
                idx === 0
                  ? "bg-sibs-navy text-white shadow-xs"
                  : "bg-[#F1F5F9] text-sibs-muted/60"
              }`}
            >
              {sub}
            </div>
          ))}
        </div>
      </nav>

      {/* Main 2-Column Section */}
      <div className="sibs-page-card-in grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        {/* Left Column: Form Card */}
        <section
          data-testid="employee-skeleton-form-card"
          className="sibs-profile-tab-panel min-w-0 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
        >
          {/* Header Row */}
          <div className="mb-5 flex min-w-0 flex-col gap-3 border-b border-[#F1F5F9] pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="h-4 w-44 rounded bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />
              <div className="h-3 w-72 rounded bg-sibs-tertiary-9/60 animate-sibs-pulse motion-reduce:animate-none" />
            </div>

            <div className="h-4 w-28 shrink-0 rounded bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />
          </div>

          {/* Form Fields Grid (8 inputs) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                data-testid="employee-skeleton-field"
                className="space-y-1.5"
              >
                <div className="h-3 w-28 rounded bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />
                <div className="h-10 w-full rounded-lg border border-sibs-border bg-[#F8FAFC] animate-sibs-pulse motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Context Panel */}
        <aside
          data-testid="employee-skeleton-context-panel"
          className="space-y-4 2xl:space-y-5 xl:sticky xl:top-4 font-jakarta"
        >
          {/* Health Check Card */}
          <section
            data-testid="employee-skeleton-health-card"
            className="sibs-page-card-in sibs-card p-3.5 2xl:p-4"
          >
            <h3 className="mb-2.5 2xl:mb-3 border-b border-sibs-border pb-2 font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Profile Health Check
            </h3>
            <div className="space-y-3 2xl:space-y-4 text-center">
              <div className="relative mx-auto flex h-24 w-24 2xl:h-28 2xl:w-28 items-center justify-center rounded-full border-8 border-sibs-border/60 animate-sibs-pulse motion-reduce:animate-none">
                <div className="h-6 w-12 rounded bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />
              </div>
              <div className="h-12 w-full rounded-xl border border-sibs-border-subtle bg-[#F8FAFC] animate-sibs-pulse motion-reduce:animate-none" />
            </div>
          </section>

          {/* Quick Actions Card */}
          <section
            data-testid="employee-skeleton-actions-card"
            className="sibs-page-card-in sibs-card p-3.5 2xl:p-4"
          >
            <h3 className="mb-2.5 2xl:mb-3 border-b border-sibs-border pb-2 font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Profile Quick Actions
            </h3>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-8 w-full rounded-lg border border-sibs-border bg-[#F8FAFC] animate-sibs-pulse motion-reduce:animate-none"
                />
              ))}
            </div>
          </section>

          {/* Supervisor / Organization / Audit Trail Card */}
          <section
            data-testid="employee-skeleton-supervisor-card"
            className="sibs-page-card-in sibs-card p-3.5 2xl:p-4"
          >
            <h3 className="mb-2.5 2xl:mb-3 border-b border-sibs-border pb-2 font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
              Audit Trail & Status History
            </h3>
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 rounded bg-sibs-tertiary-9 animate-sibs-pulse motion-reduce:animate-none" />
                    <div className="h-2.5 w-48 rounded bg-sibs-tertiary-9/60 animate-sibs-pulse motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
