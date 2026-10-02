import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords,
  totalItems, // alias
  total,      // alias
  loadedCount,
  limit,
  pageSize,   // alias
  recordLabel,
  itemName,   // alias
  onPageChange,
  loading = false,
  showCount = true,
  showPageInfo = true,
  className = "",
}) {
  const safeCurrentPage = Math.max(Number(currentPage) || 1, 1);
  const safeTotalPages = Math.max(Number(totalPages) || 1, 1);
  const rawTotal = totalRecords ?? totalItems ?? total;
  const safeTotal = Math.max(Number(rawTotal) || 0, 0);
  const label = itemName || recordLabel || "records";

  // Calculate range if limit or loadedCount is provided
  let displayCount = "";
  if (typeof loadedCount === "string" && (loadedCount.includes("–") || loadedCount.includes("-"))) {
    displayCount = loadedCount;
  } else if (rawTotal !== undefined && safeTotal === 0) {
    displayCount = "0";
  } else {
    const effectiveLimit = Number(limit || pageSize || 0);
    if (effectiveLimit > 0) {
      const start = (safeCurrentPage - 1) * effectiveLimit + 1;
      const countOnPage = Number(loadedCount) > 0 ? Number(loadedCount) : effectiveLimit;
      const end = Math.min(start + countOnPage - 1, safeTotal > 0 ? safeTotal : start + countOnPage - 1);
      displayCount = `${start.toLocaleString()}–${end.toLocaleString()}`;
    } else if (Number(loadedCount) > 0 && safeTotal > 0) {
      const inferredLimit = Math.max(1, Math.ceil(safeTotal / safeTotalPages));
      const start = (safeCurrentPage - 1) * inferredLimit + 1;
      const end = Math.min(start + Number(loadedCount) - 1, safeTotal);
      displayCount = `${start.toLocaleString()}–${end.toLocaleString()}`;
    } else if (Number(loadedCount) > 0) {
      displayCount = Number(loadedCount).toLocaleString();
    } else {
      displayCount = safeCurrentPage.toLocaleString();
    }
  }

  const rawDisplayTotal = rawTotal !== undefined ? safeTotal : safeTotalPages;
  const displayTotal = rawDisplayTotal.toLocaleString();
  const hasPrevious = safeCurrentPage > 1;
  const hasNext = safeCurrentPage < safeTotalPages;

  // Dynamic window of page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      const pages = [];
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Near beginning: 1, 2, 3, 4, 5, "…", safeTotalPages
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "…", safeTotalPages];
    }

    // Near end: 1, "…", safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages
    if (safeCurrentPage >= safeTotalPages - 3) {
      return [
        1,
        "…",
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    // In middle: 1, "…", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "…", safeTotalPages
    return [
      1,
      "…",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "…",
      safeTotalPages,
    ];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col gap-3 border-t border-sibs-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
      {/* Zone 1: Showing count (Left) */}
      <div className="flex flex-1 items-center justify-center sm:justify-start">
        {showCount ? (
          <p className="m-0 text-center font-jakarta text-[11.5px] 2xl:text-[12px] font-semibold text-sibs-muted sm:text-left">
            Showing{" "}
            <span className="font-extrabold text-sibs-navy">
              {displayCount}
            </span>{" "}
            of{" "}
            <span className="font-extrabold text-sibs-navy">
              {displayTotal}
            </span>{" "}
            {label}
          </p>
        ) : null}
      </div>

      {/* Zone 2: Navigation controls (Centered) */}
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
        {/* First Page Button */}
        <button
          type="button"
          aria-label="First page"
          title="First page"
          disabled={loading || !hasPrevious}
          onClick={() => onPageChange?.(1)}
          className="inline-flex h-8 2xl:h-9 w-8 2xl:w-9 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous Page Button */}
        <button
          type="button"
          aria-label="Previous"
          title="Previous"
          disabled={loading || !hasPrevious}
          onClick={() => onPageChange?.(safeCurrentPage - 1)}
          className="inline-flex h-8 2xl:h-9 items-center gap-1 rounded-lg border border-sibs-border-subtle bg-white px-2.5 2xl:px-3 text-[11.5px] 2xl:text-[12px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Mobile Compact Page Indicator */}
        <span className="inline-flex h-8 items-center px-2 font-jakarta text-xs font-bold text-sibs-navy sm:hidden">
          {safeCurrentPage} / {safeTotalPages}
        </span>

        {/* Desktop / Tablet Number Buttons & Ellipsis */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers.map((pageNum, idx) => {
            if (typeof pageNum === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex h-8 2xl:h-9 min-w-6 items-center justify-center px-1 font-jakarta text-xs font-bold text-sibs-muted select-none"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isActive = pageNum === safeCurrentPage;
            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                aria-label={String(pageNum)}
                aria-current={isActive ? "page" : undefined}
                disabled={loading}
                onClick={() => onPageChange?.(pageNum)}
                className={`inline-flex h-8 2xl:h-9 min-w-8 2xl:min-w-9 items-center justify-center rounded-lg px-2 text-[11.5px] 2xl:text-[12px] font-extrabold transition ${
                  isActive
                    ? "bg-sibs-orange text-white shadow-xs font-black"
                    : "border border-sibs-border-subtle bg-white text-sibs-navy hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
                }`}
              >
                {pageNum.toLocaleString()}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          aria-label="Next"
          title="Next"
          disabled={loading || !hasNext}
          onClick={() => onPageChange?.(safeCurrentPage + 1)}
          className="inline-flex h-8 2xl:h-9 items-center gap-1 rounded-lg border border-sibs-border-subtle bg-white px-2.5 2xl:px-3 text-[11.5px] 2xl:text-[12px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          aria-label="Last page"
          title="Last page"
          disabled={loading || !hasNext}
          onClick={() => onPageChange?.(safeTotalPages)}
          className="inline-flex h-8 2xl:h-9 w-8 2xl:w-9 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Zone 3: Page Indicator Badge (Right - clear of bottom-right floating assistant) */}
      {showPageInfo ? (
        <div className="flex flex-1 items-center justify-center sm:justify-end">
          <span className="inline-flex items-center gap-1 rounded-lg border border-sibs-border-subtle/80 bg-sibs-surface-ground/60 px-2.5 py-1 font-jakarta text-[11px] 2xl:text-[11.5px] font-bold text-sibs-navy">
            Page {safeCurrentPage.toLocaleString()} of {safeTotalPages.toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="hidden flex-1 sm:block" />
      )}
    </div>
  );
}
