import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      displayCount = `${start}–${end}`;
    } else if (Number(loadedCount) > 0 && safeTotal > 0) {
      const inferredLimit = Math.max(1, Math.ceil(safeTotal / safeTotalPages));
      const start = (safeCurrentPage - 1) * inferredLimit + 1;
      const end = Math.min(start + Number(loadedCount) - 1, safeTotal);
      displayCount = `${start}–${end}`;
    } else if (Number(loadedCount) > 0) {
      displayCount = String(loadedCount);
    } else {
      displayCount = String(safeCurrentPage);
    }
  }

  const displayTotal = rawTotal !== undefined ? safeTotal : safeTotalPages;
  const hasPrevious = safeCurrentPage > 1;
  const hasNext = safeCurrentPage < safeTotalPages;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(safeTotalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col gap-3 border-t border-sibs-border-subtle pt-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
    >
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
      ) : (
        <span />
      )}

      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
        <button
          type="button"
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

        {/* Desktop / Tablet Number Buttons */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {getPageNumbers().map((pageNum) => {
            const isActive = pageNum === safeCurrentPage;
            return (
              <button
                key={pageNum}
                type="button"
                disabled={loading}
                onClick={() => onPageChange?.(pageNum)}
                className={`inline-flex h-8 2xl:h-9 min-w-8 2xl:min-w-9 items-center justify-center rounded-lg px-2 text-[11.5px] 2xl:text-[12px] font-extrabold transition ${
                  isActive
                    ? "bg-sibs-orange text-white shadow-xs"
                    : "border border-sibs-border-subtle bg-white text-sibs-navy hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={loading || !hasNext}
          onClick={() => onPageChange?.(safeCurrentPage + 1)}
          className="inline-flex h-8 2xl:h-9 items-center gap-1 rounded-lg border border-sibs-border-subtle bg-white px-2.5 2xl:px-3 text-[11.5px] 2xl:text-[12px] font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
