import { ChevronLeft, ChevronRight } from "lucide-react";

export default function WeeklyReportsPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalRecords,
  onPageChange,
}) {
  return (
    <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <p className="text-sm font-semibold text-sibs-tertiary-5">
        Showing {showingFrom} to {showingTo} of {totalRecords} weekly reports
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }).map((_, index) => {
          const pageNumber = index + 1;
          const active = currentPage === pageNumber;

          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
                active
                  ? "bg-sibs-primary-1 text-white shadow-sm"
                  : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
