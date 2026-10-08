import React from "react";
import Header from "../../layout/Header";
import { Skeleton } from "../../ui/skeleton";

const METRIC_COUNT = 6;
const ROW_COUNT = 6;

function MetricCardSkeleton({ index }) {
  return (
    <article
      data-testid={`dashboard-loading-metric-${index}`}
      className="sibs-card min-h-[100px] p-4 sm:min-h-[108px]"
      aria-hidden="true"
    >
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-7 w-14 rounded-md" />
        <Skeleton className="h-2.5 w-3/4 rounded-full" />
      </div>
    </article>
  );
}

function TableRowSkeleton({ index }) {
  return (
    <div
      data-testid={`dashboard-loading-row-${index}`}
      className="grid grid-cols-12 items-center gap-3 border-t border-sibs-border py-3"
      aria-hidden="true"
    >
      <Skeleton className="col-span-4 h-3 w-full rounded-full" />
      <Skeleton className="col-span-6 h-3 w-full rounded-full" />
      <Skeleton className="col-span-2 h-3 w-full rounded-full" />
    </div>
  );
}

export default function DashboardLoadingSkeleton({
  ariaLabel = "Loading dashboard",
  hero = null,
}) {
  return (
    <div className="sibs-dashboard-shell font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto flex min-h-full w-full max-w-[1700px] flex-1 flex-col space-y-4 2xl:space-y-5">
          {hero}

          <div
            className="flex flex-col space-y-4 2xl:space-y-5"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label={ariaLabel}
          >
            <section
              data-testid="dashboard-loading-metrics"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
            >
              {Array.from({ length: METRIC_COUNT }, (_, index) => (
                <MetricCardSkeleton key={index} index={index} />
              ))}
            </section>

            <section
              data-testid="dashboard-loading-table"
              className="sibs-card overflow-hidden p-4 sm:p-5"
            >
              <div className="pb-3" aria-hidden="true">
                <Skeleton className="h-6 w-64 max-w-[55vw] rounded-md" />
              </div>

              <div className="border-t border-sibs-border">
                {Array.from({ length: ROW_COUNT }, (_, index) => (
                  <TableRowSkeleton key={index} index={index} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
