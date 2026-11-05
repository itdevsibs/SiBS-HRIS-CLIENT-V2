import React from "react";
import { Skeleton, MetricGridSkeleton, TableSkeletonRows } from "@/components/ui";

/**
 * QDSDashboardSkeleton Component
 * Full-page loading skeleton for Quality Development Specialist (QDS) Dashboard.
 * Matches PageHeaderHero, MetricGrid (4 columns), Dual-Column Analytics, and Tactical Operations Data Grid.
 */
export default function QDSDashboardSkeleton({
  ariaLabel = "Loading QDS Dashboard",
  hero = null,
  showHero = true,
  showMetrics = true,
  className = "",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`space-y-4 2xl:space-y-5 font-jakarta ${className}`.trim()}
    >
      {/* 1. PageHeaderHero Skeleton */}
      {showHero && (
        hero || (
          <div className="sibs-card rounded-2xl border border-sibs-border bg-white p-4 2xl:p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-7 w-72 sm:w-96 rounded-lg" />
                <Skeleton className="h-4 w-64 sm:w-[500px] rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        )
      )}

      {/* 2. Tier 2 Executive Horizon MetricGrid Skeleton (4 columns) */}
      {showMetrics && (
        <section data-testid="qds-metrics-skeleton">
          <MetricGridSkeleton
            count={4}
            columns={4}
            labels={[
              "TRAINEES IN OVERSIGHT",
              "INDEPENDENT QA PASS RATE",
              "CALIBRATION GAPS",
              "PENDING QUALITY AUDITS",
            ]}
          />
        </section>
      )}

      {/* 3. Tier 3 Dual-Column Strategic Analytics Skeleton */}
      <section
        data-testid="qds-analytics-skeleton"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:gap-5"
      >
        {/* Left Column: Trainer Calibration Skeleton */}
        <div className="sibs-card rounded-2xl border border-sibs-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sibs-border pb-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3.5 w-72 rounded-md" />
            </div>
            <Skeleton className="h-9 w-40 rounded-xl" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-sibs-border bg-sibs-surface/40 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-sibs-border/60">
                  <Skeleton className="h-7 w-full rounded-md" />
                  <Skeleton className="h-7 w-full rounded-md" />
                  <Skeleton className="h-7 w-full rounded-md" />
                  <Skeleton className="h-7 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Training Funnel Skeleton */}
        <div className="sibs-card rounded-2xl border border-sibs-border bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-sibs-border pb-4 space-y-1.5">
            <Skeleton className="h-5 w-52 rounded-md" />
            <Skeleton className="h-3.5 w-80 rounded-md" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>

          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-13 rounded-xl" />
            ))}
          </div>

          <Skeleton className="h-16 rounded-xl" />
        </div>
      </section>

      {/* 4. Tier 4 Tactical Operations Table Skeleton */}
      <section
        data-testid="qds-table-skeleton"
        className="sibs-card rounded-2xl border border-sibs-border bg-white shadow-xs overflow-hidden"
      >
        <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-3.5 w-80 rounded-md" />
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <Skeleton className="h-9 w-full xl:w-72 rounded-xl" />
            <Skeleton className="h-9 w-full xl:w-44 rounded-xl" />
            <Skeleton className="h-9 w-full xl:w-40 rounded-xl" />
            <Skeleton className="h-9 w-full xl:w-48 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>

        <div className="p-4 sm:p-5 2xl:p-6">
          <div className="overflow-hidden rounded-xl border border-sibs-border">
            <div className="bg-sibs-surface p-3 border-b border-sibs-border">
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="divide-y divide-sibs-border p-3 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-8 w-48 rounded-md" />
          </div>
        </div>
      </section>
    </div>
  );
}
