import React from "react";
import Header from "../../layout/Header";
import { Skeleton, MetricGridSkeleton } from "../../ui";

const HR_METRIC_LABELS = [
  "Employees",
  "Departments",
  "Attendance",
  "Interviews Today",
  "Active Requisitions",
];

export default function AdminDashboardSkeleton() {
  return (
    <div
      className="sibs-dashboard-shell font-jakarta"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading HR admin dashboard"
    >
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-5 sm:space-y-6">
          {/* Welcome Banner Skeleton */}
          <section
            data-testid="admin-skeleton-welcome"
            className="sibs-page-card-in sibs-card p-5 sm:p-6"
          >
            <div className="mb-3">
              <span className="inline-flex items-center rounded-full bg-sibs-orange/10 px-3 py-1 text-xs font-black text-sibs-orange">
                HR Admin View
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-extrabold text-sibs-navy tracking-tight">
                  Human Resource Dashboard
                </h1>
                <p className="mt-1 text-xs font-semibold text-[#667085]">
                  Manage organizational workforce, track attendance, and oversee hiring across operational hubs.
                </p>
              </div>
              <div className="flex gap-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  disabled
                  className="sibs-btn-icon"
                  aria-label="Refresh"
                >
                  <Skeleton className="h-4 w-4 rounded-full" />
                </button>
                <button
                  type="button"
                  disabled
                  className="sibs-btn-primary"
                >
                  Launch Employee Directory
                </button>
              </div>
            </div>
          </section>

          {/* HR Admin Metrics Grid (5 cards) */}
          <MetricGridSkeleton
            count={5}
            className="grid grid-cols-1 gap-2.5 2xl:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            labels={HR_METRIC_LABELS}
            ariaLabel="Loading HR metrics"
          />

          {/* Main Grid: 8-col Activity & Notifications + 4-col Quick Actions & Workforce KPI */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-8">
              {/* Recent Activity */}
              <section
                data-testid="admin-skeleton-activity"
                className="sibs-page-card-in sibs-card p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-sibs-navy">Recent Activity</h2>
                  <Skeleton className="h-7 w-24 rounded-lg" />
                </div>
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Notifications */}
              <section
                data-testid="admin-skeleton-notifications"
                className="sibs-page-card-in sibs-card p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-sibs-navy">Notifications</h2>
                    <p className="m-0 text-xs font-semibold text-[#667085]">
                      System activity, pending approvals, and requests
                    </p>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-2/5" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-5 lg:col-span-4">
              {/* Quick Actions */}
              <section
                data-testid="admin-skeleton-quick-actions"
                className="sibs-page-card-in sibs-card p-5 sm:p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-extrabold text-sibs-navy">Quick Actions</h2>
                  <p className="m-0 text-xs font-semibold text-[#667085]">
                    Frequently used shortcuts
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                      <Skeleton className="h-7 w-7 rounded-lg" />
                      <Skeleton className="h-3.5 w-4/5" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Workforce KPI */}
              <section
                data-testid="admin-skeleton-workforce-kpi"
                className="sibs-page-card-in sibs-card p-5 sm:p-6 space-y-4"
              >
                <div>
                  <h2 className="text-base font-extrabold text-sibs-navy">Workforce KPIs</h2>
                  <p className="m-0 text-xs font-semibold text-[#667085]">
                    Headcount fulfillment and stability
                  </p>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
                      <Skeleton className="h-full w-full" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6]">
                      <Skeleton className="h-full w-full" />
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
