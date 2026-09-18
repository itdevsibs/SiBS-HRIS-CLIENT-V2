import React from "react";
import { Skeleton } from "@/components/ui";

/**
 * In-place skeleton placeholder for JobDescriptionViewPage.
 * Preserves the exact geometry of the top header bar, tabs,
 * paper document preview, and footer actions to achieve Zero CLS.
 */
export default function JobDescriptionViewSkeleton({ className = "" }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading job description details"
      data-testid="job-description-view-skeleton"
      className={`jd-view-page-shell fixed inset-0 z-[9999] flex min-h-0 flex-col overflow-hidden bg-[#EEF2F6] font-jakarta text-sibs-primary-1 ${className}`}
    >
      {/* Top Header Bar */}
      <div
        data-jd-header
        className="shrink-0 overflow-hidden border-b border-[#D9E2EC] bg-white px-3 pt-3 opacity-100 sm:px-6 sm:pt-4"
      >
        <div className="jd-view-header-content mx-auto flex w-full max-w-[1760px] flex-col gap-3 sm:gap-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div className="min-w-0 space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1/80">
                Job Description Overview
              </div>
              <div className="flex items-center gap-3">
                <Skeleton
                  data-testid="jd-skeleton-title"
                  className="h-6 w-72 rounded-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton
                  data-testid="jd-skeleton-subtitle"
                  className="h-4 w-48 rounded"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Skeleton
                data-testid="jd-skeleton-badge"
                className="h-8 w-28 rounded-full"
              />
            </div>
          </div>

          <div
            data-testid="jd-skeleton-tabs"
            className="relative flex gap-5 overflow-x-auto text-sm font-bold text-[#344054] no-scrollbar sm:gap-8 pb-3"
          >
            <span className="text-blue-600 pb-1 border-b-2 border-blue-500">
              Details
            </span>
            <span className="text-[#667085] pb-1">
              Revision History
            </span>
          </div>
        </div>
      </div>

      {/* Content Document Area */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#EEF2F6]">
        <div className="thin-scroll h-full overscroll-contain overflow-y-auto px-2.5 py-4 sm:px-5 sm:py-7 lg:px-8">
          <article
            data-testid="jd-skeleton-document"
            className="jd-details-document mx-auto w-full max-w-[1100px] space-y-6 overflow-visible rounded-2xl bg-white p-6 sm:p-8 text-[#1D2939] shadow-[0_18px_55px_rgba(15,23,42,0.14)] sm:shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
          >
            {/* Document Header Banner Skeleton */}
            <div className="flex items-center justify-between border-b border-[#E6ECF2] pb-5">
              <div className="space-y-2">
                <Skeleton className="h-7 w-64 rounded-md" />
                <Skeleton className="h-4 w-40 rounded" />
              </div>
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>

            {/* Record Info / Identification Grid Skeleton */}
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-4 w-32 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Job Summary / Purpose Section Skeleton */}
            <section className="space-y-3 pt-2">
              <Skeleton className="h-5 w-44 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-11/12 rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            </section>

            {/* Duties & Responsibilities Section Skeleton */}
            <section className="space-y-3 pt-2">
              <Skeleton className="h-5 w-52 rounded" />
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-full mt-0.5" />
                    <Skeleton className="h-4 w-full rounded" />
                  </div>
                ))}
              </div>
            </section>

            {/* Competencies Section Skeleton */}
            <section className="space-y-3 pt-2">
              <Skeleton className="h-5 w-48 rounded" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-24 rounded-full" />
                ))}
              </div>
            </section>
          </article>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div
        data-testid="jd-skeleton-footer"
        className="jd-view-footer shrink-0 overflow-hidden border-t border-[#D9E2EC] bg-white px-5 py-3 sm:px-7"
      >
        <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
