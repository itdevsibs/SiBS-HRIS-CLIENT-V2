import React from "react";
import { usePagination } from "@/services/context/PaginationContext";

const TableFooter = ({ tableEntity, totalLabel = "Total Records" }) => {
  const { pagination, setPage } = usePagination(tableEntity);

  const currentPage = Number(pagination?.currentPage || 1);
  const totalPages = Number(pagination?.totalPages || 1);
  const total = Number(
    pagination?.total ??
      pagination?.totalRecords ??
      pagination?.totalCount ??
      0
  );

  return (
    <div className="border-t px-3 py-4 sm:px-4 bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>

        <div className="text-center text-sm text-gray-500 sm:text-left">
          {totalLabel}: {total}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(1)}
            className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            &lt;&lt;
          </button>

          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(Math.max(currentPage - 1, 1))}
            className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            &lt;
          </button>

          <div className="min-w-[72px] text-center text-sm font-medium text-gray-700">
            {currentPage}/{totalPages}
          </div>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
            className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            &gt;
          </button>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage(totalPages)}
            className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableFooter;