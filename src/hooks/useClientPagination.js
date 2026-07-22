import { useMemo, useState } from "react";

export default function useClientPagination(items = [], pageSize = 5) {
  const [currentPage, setCurrentPage] = useState(1);
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const safePageSize = Math.max(Number(pageSize) || 1, 1);
  const totalItems = safeItems.length;
  const totalPages = Math.max(Math.ceil(totalItems / safePageSize), 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * safePageSize;
    return safeItems.slice(startIndex, startIndex + safePageSize);
  }, [safeCurrentPage, safeItems, safePageSize]);

  return {
    items: paginatedItems,
    pagination: {
      currentPage: safeCurrentPage,
      totalPages,
      totalItems,
      pageSize: safePageSize,
      onPageChange: setCurrentPage,
    },
  };
}
