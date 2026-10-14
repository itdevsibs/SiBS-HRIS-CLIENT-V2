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

export function getMetricGridColClass(columns = 6) {
  if (typeof columns === "string") return columns;
  if (columns === 9) {
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-9";
  }
  if (columns === 7) {
    return "grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 2xl:grid-cols-7";
  }
  if (columns === 6) {
    return "grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6";
  }
  if (columns === 5) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
  }
  if (columns === 4) {
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  }
  if (columns === 3) {
    return "grid-cols-1 sm:grid-cols-3";
  }
  if (columns === 2) {
    return "grid-cols-1 sm:grid-cols-2";
  }
  return "grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6";
}

export function MetricGridSkeleton({
  count = 4,
  columns = null,
  labels = [],
  className = "",
  testId = "metric-grid-skeleton",
  "aria-label": ariaLabelProp,
  ariaLabel = "Loading metrics",
}) {
  const items = labels.length > 0 ? labels : Array.from({ length: count });
  const resolvedColumns =
    columns !== null
      ? columns
      : labels.length > 0
        ? labels.length
        : count;
  const autoColClass = getMetricGridColClass(resolvedColumns);
  const defaultGridClass = `grid gap-2.5 2xl:gap-3 ${autoColClass}`;

  return (
    <section
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabelProp || ariaLabel}
      className={className ? cn(defaultGridClass, className) : defaultGridClass}
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
