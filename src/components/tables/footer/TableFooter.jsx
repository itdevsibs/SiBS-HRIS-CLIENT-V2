import { usePagination } from "@/services/context/PaginationContext";
import PaginationTable from "@/services/pagination/PaginationTable";

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
  const pageSize = pagination?.limit || 15;
  const loadedCount =
    totalCount > 0
      ? Math.max(Math.min(pageSize, totalCount - (currentPage - 1) * pageSize), 0)
      : 0;

  function goToPage(targetPage) {
    const safePage = Math.max(1, Math.min(totalPages, targetPage));
    if (safePage !== currentPage) {
      setPage(safePage);
    }
  }

  return (
    <div className="table-footer">
      <PaginationTable
        showSearch={false}
        currentPage={currentPage}
        totalPages={totalPages}
        loadedCount={loadedCount}
        totalRecords={totalCount}
        recordLabel={totalLabel.toLowerCase()}
        onPrevious={() => goToPage(currentPage - 1)}
        onNext={() => goToPage(currentPage + 1)}
      />
    </div>
  );
}
