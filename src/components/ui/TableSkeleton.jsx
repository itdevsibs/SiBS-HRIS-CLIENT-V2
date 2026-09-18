import React from "react";
import { cn } from "cn";
import { Skeleton } from "./skeleton";

export function TableSkeletonRow({
  columns = 6,
  colSpan = null,
  rowHeight = "h-5",
  className = "",
  testId = "table-skeleton-row",
}) {
  if (colSpan) {
    return (
      <tr data-testid={testId} className={cn("border-b border-[#EEF2F6]", className)}>
        <td colSpan={colSpan} className="px-4 py-3.5">
          <Skeleton className={cn(`${rowHeight} w-full`, className)} />
        </td>
      </tr>
    );
  }

  return (
    <tr data-testid={testId} className={cn("border-b border-[#EEF2F6]", className)}>
      {Array.from({ length: columns }).map((_, index) => (
        <td
          key={`table-cell-skeleton-${index}`}
          data-testid="table-skeleton-cell"
          className="px-3 py-3 2xl:px-4"
        >
          <Skeleton
            className={cn(index === 0 ? "h-4 w-3/4" : "h-4 w-full", className)}
          />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeletonRows({
  count = 5,
  columns = 6,
  colSpan = null,
  rowHeight = "h-5",
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <TableSkeletonRow
          key={`table-skeleton-row-${index}`}
          columns={columns}
          colSpan={colSpan}
          rowHeight={rowHeight}
        />
      ))}
    </>
  );
}
