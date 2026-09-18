import React from "react";
import Header from "../../layout/Header";
import { Skeleton, MetricGridSkeleton, TableSkeletonRows } from "../../ui";
import { WORKFORCE_OVERVIEW_METRIC_LABELS } from "../../../lib/utils/workforceHiringOverview/workforceHiringOverviewConstants";


export function WorkforceHiringHeaderSkeleton() {
  return (
    <section
      data-testid="workforce-header-skeleton"
      className="sibs-page-card-in sibs-card p-5 sm:p-6"
    >
      <div className="mb-3">
        <span className="inline-flex items-center rounded-full bg-sibs-orange/10 px-3 py-1 text-xs font-black text-sibs-orange">
          Recruitment View
        </span>
      </div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-extrabold text-sibs-navy tracking-tight">
            Workforce & Hiring Overview
          </h1>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            Review workforce capacity, hiring gaps, pipeline conversion, attrition, and six-week operating trends.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 xl:pt-0">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
      </div>
    </section>
  );
}

export function WorkforceHiringPipelineStripSkeleton() {
  return (
    <section
      data-testid="workforce-pipeline-strip-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading pipeline conversion strip"
      className="sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-3.5 shadow-sm 2xl:p-5"
    >
      <div className="flex flex-col gap-3 2xl:gap-4 2xl:flex-row 2xl:items-center">
        <div className="grid min-w-0 flex-1 grid-cols-1 items-center gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_20px_1fr_20px_1fr_20px_1fr_20px_1fr] 2xl:grid-cols-[1fr_26px_1fr_26px_1fr_26px_1fr_26px_1fr]">
          {["Sourced", "Screened", "Interview", "Offered", "Hired"].map((stage, index) => (
            <React.Fragment key={stage}>
              <article className="flex min-h-[64px] 2xl:min-h-[78px] items-center gap-2.5 2xl:gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-2 2xl:px-3 2xl:py-2.5">
                <Skeleton className="h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="m-0 truncate sibs-text-micro font-extrabold uppercase text-[#667085]">
                    {stage}
                  </p>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-10 2xl:h-6" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                </div>
              </article>
              {index < 4 && (
                <div className="hidden justify-center xl:flex">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <aside className="grid shrink-0 grid-cols-2 gap-3 border-t border-[#E6ECF2] pt-3 2xl:w-[260px] 2xl:border-l 2xl:border-t-0 2xl:pl-5 2xl:pt-0">
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="ml-auto h-3 w-20" />
            <Skeleton className="ml-auto h-6 w-16" />
          </div>
        </aside>
      </div>
    </section>
  );
}

export function WorkforceHiringChartsSkeleton() {
  return (
    <div
      data-testid="workforce-charts-skeleton"
      className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:gap-5"
    >
      {/* Hiring Funnel / Attrition Panel Skeleton */}
      <section
        data-testid="attrition-stages-skeleton"
        className="sibs-page-card-in sibs-card flex h-full min-h-[520px] flex-col rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
      >
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="mt-4 flex flex-1 flex-col justify-around gap-3 rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] p-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <article
              key={index}
              className="rounded-lg border border-[#DDE5EE] bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="mt-2.5 h-2 w-full rounded-full" />
            </article>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="ml-auto h-4 w-12" />
            <Skeleton className="ml-auto h-2.5 w-14" />
          </div>
        </div>
      </section>

      {/* 6-Week Trends Panel Skeleton */}
      <section
        data-testid="trends-chart-skeleton"
        className="sibs-page-card-in sibs-card flex h-full min-h-[520px] flex-col rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3.5 w-60" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col justify-between rounded-xl border border-[#DDE5EE] bg-[#F8FAFC] p-3 xl:min-h-[350px]">
          <div className="mb-2 flex justify-center gap-4">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-3 w-14 rounded" />
          </div>

          <div className="flex flex-1 items-end justify-between gap-3 px-4 py-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <Skeleton className="w-full rounded-t" style={{ height: `${50 + (idx % 3) * 35}px` }} />
                <Skeleton className="h-2.5 w-12" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </section>
    </div>
  );
}

export function WorkforceHiringTableSkeleton() {
  return (
    <section
      data-testid="workforce-table-skeleton"
      className="sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
    >
      <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="sibs-data-table-shell overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed border-collapse">
            <tbody className="bg-white">
              <TableSkeletonRows count={6} columns={24} rowHeight="h-7" />
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function WorkforceHiringOverviewSkeleton() {
  return (
    <div
      className="sibs-dashboard-shell flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading workforce & hiring overview"
    >
      <Header />

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5">
          <WorkforceHiringHeaderSkeleton />
          <MetricGridSkeleton
            labels={WORKFORCE_OVERVIEW_METRIC_LABELS}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9 xl:gap-3 2xl:gap-4"
            testId="workforce-summary-skeleton"
            ariaLabel="Loading workforce hiring summary metrics"
          />
          <WorkforceHiringPipelineStripSkeleton />
          <WorkforceHiringChartsSkeleton />
          <WorkforceHiringTableSkeleton />
        </div>
      </main>
    </div>
  );
}
