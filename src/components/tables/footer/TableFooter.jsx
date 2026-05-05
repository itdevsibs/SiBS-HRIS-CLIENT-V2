import React from "react";
import { usePagination } from "@/services/context/PaginationContext";

export default function TableFooter({
  tableEntity,
  totalLabel = "Total Records",
}) {
  const { page, setPage, pagination } = usePagination(tableEntity);

  const currentPage = pagination?.currentPage || page || 1;
  const totalPages = pagination?.totalPages || 1;

  const totalCount =
    pagination?.totalItems ??
    pagination?.totalCount ??
    pagination?.totalRecords ??
    pagination?.total ??
    0;

  const goToPage = (targetPage) => {
    const safePage = Math.max(1, Math.min(totalPages, targetPage));
    if (safePage !== currentPage) {
      setPage(safePage);
    }
  };

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="table-footer">
      <div className="table-footer__left">
        <span className="table-footer__meta">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="table-footer__center">
        <span className="table-footer__meta">
          {totalLabel}: {totalCount}
        </span>
      </div>

      <div className="table-footer__right">
        <button
          type="button"
          className="table-footer__btn"
          onClick={() => goToPage(1)}
          disabled={isFirstPage}
        >
          {"<<"}
        </button>

        <button
          type="button"
          className="table-footer__btn"
          onClick={() => goToPage(currentPage - 1)}
          disabled={isFirstPage}
        >
          {"<"}
        </button>

        <span className="table-footer__page-indicator">
          {currentPage}/{totalPages}
        </span>

        <button
          type="button"
          className="table-footer__btn"
          onClick={() => goToPage(currentPage + 1)}
          disabled={isLastPage}
        >
          {">"}
        </button>

        <button
          type="button"
          className="table-footer__btn"
          onClick={() => goToPage(totalPages)}
          disabled={isLastPage}
        >
          {">>"}
        </button>
      </div>
    </div>
  );
}