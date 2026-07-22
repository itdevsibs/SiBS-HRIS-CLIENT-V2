import PaginationTable from "@/services/pagination/PaginationTable";

export default function WeeklyReportsPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalRecords,
  onPageChange,
}) {
  return (
    <PaginationTable
      className="mt-5"
      showSearch={false}
      currentPage={currentPage}
      totalPages={totalPages}
      loadedCount={totalRecords > 0 ? Math.max(showingTo - showingFrom + 1, 0) : 0}
      totalRecords={totalRecords}
      recordLabel="weekly reports"
      onPrevious={() => onPageChange(currentPage - 1)}
      onNext={() => onPageChange(currentPage + 1)}
    />
  );
}
