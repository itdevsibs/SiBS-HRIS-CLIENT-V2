import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { useActionItemsReport } from "../../../services/context/ActionItemsReportContext.jsx";
import { usePagination } from "../../../services/context/PaginationContext.jsx";
import { ACTION_ITEMS_PER_PAGE } from "../../../lib/utils/actionItems/actionItemsConstants.js";
import {
  formatDate,
  getDaysLeft,
  getRiskClass,
  getStatusClass,
  sortActionItems,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";
import ActionItemMobileCard from "./ActionItemMobileCard.jsx";

const ENTITY_KEY = "action-items";

export default function ActionItemsTable() {
  const { setSelectedItem, completeActionItem } = useActionItems();
  const { filteredActionItems } = useActionItemsReport();
  const {
    page,
    setPage,
    setPagination,
    setLoading,
    loading,
    pagination,
    search,
    filterValues,
  } = usePagination(ENTITY_KEY);

  const limit = pagination?.limit || ACTION_ITEMS_PER_PAGE;
  const filteredItems = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();
    const statusFilter = filterValues?.status || "All Status";
    const riskFilter = filterValues?.risk || "All Risk";
    const moduleFilter = filterValues?.module || "All Modules";
    const gapFilter = filterValues?.gap || "All Gaps";
    const ownerFilter = filterValues?.owner || "All Owners";

    return filteredActionItems.filter((item) => {
      const searchableText = [
        item.actionId,
        item.actionItem,
        item.roleAccount,
        item.roleTitle,
        item.account,
        item.owner,
        item.linkedGap,
        item.module,
        item.status,
        item.riskLevel,
        item.remarks,
      ].join(" ").toLowerCase();
      return (
        (!keyword || searchableText.includes(keyword)) &&
        (statusFilter === "All Status" || item.status === statusFilter) &&
        (riskFilter === "All Risk" || item.riskLevel === riskFilter) &&
        (moduleFilter === "All Modules" || item.module === moduleFilter) &&
        (gapFilter === "All Gaps" || item.linkedGap === gapFilter) &&
        (ownerFilter === "All Owners" || item.owner === ownerFilter)
      );
    });
  }, [filteredActionItems, search, filterValues]);

  const sortedItems = useMemo(() => sortActionItems(filteredItems), [filteredItems]);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * limit;
    return sortedItems.slice(start, start + limit);
  }, [sortedItems, safePage, limit]);

  useEffect(() => {
    setPagination({
      total: sortedItems.length,
      totalPages,
      currentPage: safePage,
      limit: ACTION_ITEMS_PER_PAGE,
    });
    setLoading(false);
  }, [sortedItems.length, totalPages, safePage, setPagination, setLoading]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage, setPage]);

  const showingFrom = sortedItems.length ? (safePage - 1) * limit + 1 : 0;
  const showingTo = Math.min(safePage * limit, sortedItems.length);

  const dragScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleDragStart = (e) => {
    if (!dragScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - dragScrollRef.current.offsetLeft);
    setScrollLeft(dragScrollRef.current.scrollLeft);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragMove = (e) => {
    if (!isDragging || !dragScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - dragScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    dragScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  if (loading) {
    return <div className="px-5 py-12 text-center text-sm font-semibold text-[#667085]">Loading action items...</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
      <div
        ref={dragScrollRef}
        tabIndex={0}
        role="region"
        aria-label="Action Items Registry table scroll area"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        className={`hidden overflow-x-auto sibs-scrollbar focus:outline-none focus:ring-2 focus:ring-[#FF5C28]/20 lg:block ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <table className="w-full min-w-[1240px] border-collapse font-jakarta text-xs text-left">
          <thead className="bg-[#F8FAFC]">
            <tr className="border-b border-[#E6ECF2]">
              {[
                ["Action Item", "text-left"],
                ["Role / Account", "text-left"],
                ["Owner", "text-left"],
                ["Deadline", "text-left"],
                ["Status", "text-left"],
                ["Risk Level", "text-left"],
                ["Remarks", "text-left"],
                ["Action", "text-right"],
              ].map(([label, alignment], idx, arr) => (
                <th
                  key={label}
                  className={`border-r border-[#E6ECF2] px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-[#667085] ${
                    idx === arr.length - 1 ? "border-r-0" : ""
                  } ${alignment}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6ECF2] font-jakarta">
            {paginatedItems.length ? (
              paginatedItems.map((item, index) => {
                const systemGenerated = item.systemGenerated || String(item.sourceType || "").toLowerCase().includes("system");
                return (
                  <tr
                    key={`${item.sourceType}-${item.id}-${item.actionId}`}
                    onClick={() => setSelectedItem(item)}
                    className="sibs-data-table-row sibs-page-card-in cursor-pointer transition hover:bg-[#F8FAFC]"
                    style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
                  >
                    <td className="max-w-[360px] border-r border-[#E6ECF2] px-2.5 2xl:px-3.5 py-1.5 2xl:py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#F2F4F7] px-1.5 py-0.5 font-jakarta text-[9px] font-extrabold text-[#042C51]">{item.actionId}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[8px] font-extrabold uppercase ${systemGenerated ? "border-purple-100 bg-purple-50 text-purple-700" : "border-blue-100 bg-blue-50 text-blue-700"}`}>
                          {systemGenerated ? "System" : "Manual"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-extrabold leading-5 text-[#042C51]" title={item.actionItem}>{item.actionItem}</p>
                    </td>
                    <td className="border-r border-[#E6ECF2] px-2.5 2xl:px-3.5 py-1.5 2xl:py-2.5 align-middle">
                      <p className="text-xs font-extrabold text-[#042C51]">{item.account || "—"}</p>
                      <p className="mt-0.5 text-[10px] font-semibold uppercase text-[#667085]">{item.roleTitle || item.roleAccount || "—"}</p>
                    </td>
                    <td className="border-r border-[#E6ECF2] px-2.5 2xl:px-3 py-1.5 2xl:py-2.5 align-middle text-xs font-bold text-[#042C51]">{item.owner || "—"}</td>
                    <td className="border-r border-[#E6ECF2] px-2.5 2xl:px-3 py-1.5 2xl:py-2.5 align-middle">
                      <p className="text-xs font-extrabold text-[#042C51]">{formatDate(item.deadline)}</p>
                      <p className="mt-0.5 text-[9px] font-extrabold text-[#667085]">
                        {item.status === "Completed"
                          ? `Completed${item.completedDate ? ` ${formatDate(item.completedDate)}` : ""}`
                          : getDaysLeft(item.deadline)}
                      </p>
                    </td>
                    <td className="border-r border-[#E6ECF2] px-2.5 2xl:px-3 py-1.5 2xl:py-2.5 align-middle">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getStatusClass(item.status)}`}>{item.status}</span>
                    </td>
                    <td className="border-r border-[#E6ECF2] px-2.5 2xl:px-3 py-1.5 2xl:py-2.5 align-middle">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getRiskClass(item.riskLevel)}`}>{item.riskLevel}</span>
                    </td>
                    <td className="max-w-[300px] border-r border-[#E6ECF2] px-2.5 2xl:px-3.5 py-1.5 2xl:py-2.5 align-middle">
                      <p className="line-clamp-2 text-xs font-semibold leading-4 text-[#667085]" title={item.remarks}>{item.remarks || "No remarks logged"}</p>
                    </td>
                    <td className="px-2.5 2xl:px-3 py-1.5 2xl:py-2.5 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        {!systemGenerated && item.status !== "Completed" ? (
                          <button
                            type="button"
                            onClick={() => completeActionItem(item)}
                            className="inline-flex h-7.5 2xl:h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 2xl:px-3 text-[10px] 2xl:text-xs font-black text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                          >
                            <CheckCircle2 size={12} /> Resolve
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="inline-flex h-7.5 2xl:h-8 items-center gap-1 rounded-lg bg-[#042C51] px-2.5 2xl:px-3 text-[10px] 2xl:text-xs font-black text-white transition hover:bg-[#073966] active:scale-[0.98]"
                        >
                          <Eye size={12} /> Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm font-semibold text-[#98A2B3]">
                  No action items match the current reporting scope and registry filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 lg:hidden">
        {paginatedItems.length ? paginatedItems.map((item, index) => (
          <ActionItemMobileCard
            key={`${item.sourceType}-${item.id}-${item.actionId}`}
            item={item}
            delay={index * 40}
            onOpen={() => setSelectedItem(item)}
            onComplete={() => completeActionItem(item)}
          />
        )) : (
          <div className="rounded-xl border border-dashed border-[#D9E2EC] p-8 text-center text-sm font-semibold text-[#98A2B3]">
            No action items match the current filters.
          </div>
        )}
      </div>

      <footer className="border-t border-[#E6ECF2] bg-white px-5 py-3.5">
        <div className="sibs-pagination sibs-pagination--compact">
          <p className="sibs-pagination__summary">
            Showing <span>{showingFrom}–{showingTo}</span> of <span>{sortedItems.length}</span> actions
          </p>
          <div className="sibs-pagination__controls">
            <button
              type="button"
              className="sibs-pagination__button h-8 gap-1 px-3"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={`sibs-pagination__page h-8 min-w-8 px-2.5 ${
                  pageNum === safePage ? "is-active" : ""
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="sibs-pagination__button h-8 gap-1 px-3"
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
