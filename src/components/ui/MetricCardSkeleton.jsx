import React from "react";
import { cn } from "cn";
import { Skeleton } from "./skeleton";

export function MetricCardSkeleton({
  label = null,
  className = "",
  testId = "metric-card-skeleton",
}) {
  return (
    <article
      data-testid={testId}
      className={cn(
        "sibs-metric-card font-jakarta relative flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5",
        className,
      )}
      aria-hidden="true"
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
          <div className="space-y-2">
            {label ? (
              <p className="m-0 truncate sibs-text-micro font-extrabold uppercase text-sibs-navy">
                {label}
              </p>
            ) : (
              <Skeleton className="h-2.5 w-20" />
            )}
            <Skeleton className="h-7 w-16 2xl:h-8" />
          </div>
          <Skeleton className="h-2.5 w-4/5" />
        </div>
        <Skeleton className="h-8 w-8 shrink-0 rounded-full 2xl:h-9 2xl:w-9" />
      </div>
    </article>
  );
}

export function MetricGridSkeleton({
  count = 4,
  labels = [],
  className = "",
  testId = "metric-grid-skeleton",
  "aria-label": ariaLabelProp,
  ariaLabel = "Loading metrics",
}) {
  const items = labels.length > 0 ? labels : Array.from({ length: count });

  return (
    <section
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabelProp || ariaLabel}
      className={
        className ||
        "grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
      }
    >
      {items.map((item, index) => (
        <MetricCardSkeleton
          key={typeof item === "string" ? item : `metric-card-skeleton-${index}`}
          label={typeof item === "string" ? item : null}
        />
      ))}
    </section>
  );
}
