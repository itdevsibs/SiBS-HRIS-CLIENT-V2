import React from "react";
import Header from "../../layout/Header";
import { Skeleton } from "../../ui/skeleton";

const TA_METRICS = [
  "Total Open Roles",
  "Requirement vs Filled",
  "At-Risk Roles",
  "Delayed Roles",
  "Weekly Movement",
  "Drop-Offs",
  "Recruiter Load",
  "Aging Roles",
];
const OM_METRICS = TA_METRICS.filter((label) => label !== "Recruiter Load");

function MetricSkeleton({ label, testId }) {
  return (
    <article
      data-testid={testId}
      className="sibs-metric-card font-jakarta flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
    >
      <div className="flex h-full items-start justify-between gap-2 2xl:gap-2.5">
        <div className="min-w-0 flex-1 self-stretch">
          <p className="m-0 truncate sibs-text-micro font-extrabold uppercase text-sibs-navy">
            {label}
          </p>
          <Skeleton className="mt-1.5 h-6 w-20 2xl:mt-2 2xl:h-7" />
          <Skeleton className="mt-1 h-2.5 w-24" />
        </div>
        <Skeleton className="h-7 w-7 shrink-0 rounded-full 2xl:h-8 2xl:w-8" />
      </div>
    </article>
  );
}

function PanelSkeleton({ title, subtitle, className = "", testId }) {
  return (
    <section
      data-testid={testId}
      className={`sibs-card min-h-[260px] space-y-4 p-4 sm:p-5 ${className}`}
    >
      <div>
        <h2 className="m-0 text-base font-extrabold text-sibs-navy">{title}</h2>
        <p className="m-0 sibs-text-micro font-semibold text-sibs-muted">{subtitle}</p>
      </div>
      <div aria-hidden="true" className="space-y-3 pt-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 flex-1" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RoleDashboardSkeleton({ kind }) {
  const isTa = kind === "ta";
  const prefix = isTa ? "ta" : "om";
  const metrics = isTa ? TA_METRICS : OM_METRICS;
  const gridClass = isTa
    ? "grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-8"
    : "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7";

  return (
    <div
      className="sibs-dashboard-shell font-jakarta"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`Loading ${isTa ? "TA" : "OM"} dashboard`}
    >
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-1 flex-col space-y-4 sm:space-y-5">
          {/* Welcome Banner */}
          <section
            data-testid={`${prefix}-skeleton-welcome`}
            className="sibs-card relative overflow-hidden p-5 sm:p-6"
          >
            <p className="m-0 sibs-text-micro font-extrabold uppercase text-sibs-orange">
              {isTa ? "TA Central Station" : "Operations Manager View"}
            </p>
            <h1 className="mt-2 text-xl font-extrabold text-sibs-navy">
              {isTa ? "Talent Acquisition Dashboard" : "Operations Dashboard"}
            </h1>
            <p className="mt-2 text-sm font-semibold text-sibs-muted">
              {isTa
                ? "Complete hiring overview across all departments and functional units."
                : "Hiring overview filtered by your department and assigned accounts."}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled className="sibs-btn-icon">
                Refresh
              </button>
              <button type="button" disabled className="sibs-btn-primary">
                {isTa ? "Hiring Plan View" : "Return to Hiring Plan"}
              </button>
            </div>
          </section>

          {/* Metrics Grid */}
          <section className={gridClass}>
            {metrics.map((metric) => (
              <MetricSkeleton
                key={metric}
                label={metric}
                testId={`${prefix}-skeleton-metric`}
              />
            ))}
          </section>

          {/* Progress & Movement Panels */}
          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
            <PanelSkeleton
              title="Approved Requirement vs Filled Progress"
              subtitle="Current hiring coverage and fulfillment."
            />
            <PanelSkeleton
              title="Weekly Movement Pipeline"
              subtitle="Recent hiring activity and movement."
            />
          </section>

          {/* Role Status & Recruiter Panels */}
          <section className="grid grid-cols-1 items-stretch gap-5 2xl:grid-cols-12">
            <PanelSkeleton
              title="Role Hiring Status"
              subtitle="Review open roles, status, and filters."
              testId={`${prefix}-skeleton-role-panel`}
              className="2xl:col-span-8"
            />
            <PanelSkeleton
              title="Recruiter Load"
              subtitle="Recruiter workload and assignment coverage."
              testId={`${prefix}-skeleton-recruiter-panel`}
              className="2xl:col-span-4"
            />
          </section>
        </div>
      </main>
    </div>
  );
}
