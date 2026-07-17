import React, { useEffect, useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserRound,
} from "lucide-react";
import { useActionItems } from "../../../services/context/ActionItemsContext.jsx";
import { usePagination } from "../../../services/context/PaginationContext.jsx";
import {
  ACTION_ITEMS_PER_PAGE,
} from "../../../lib/utils/actionItems/actionItemsConstants.js";
import {
  formatDate,
  getDaysLeft,
  getDaysLeftValue,
  getGapClass,
  getModuleClass,
  getRiskClass,
  getStatusClass,
  sortActionItems,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";
import ActionItemMobileCard from "./ActionItemMobileCard.jsx";

const ENTITY_KEY = "action-items";

export default function ActionItemsTable() {
  const { combinedItems, setSelectedItem } = useActionItems();
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

    return combinedItems.filter((item) => {
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
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!keyword || searchableText.includes(keyword)) &&
        (statusFilter === "All Status" || item.status === statusFilter) &&
        (riskFilter === "All Risk" || item.riskLevel === riskFilter) &&
        (moduleFilter === "All Modules" || item.module === moduleFilter) &&
        (gapFilter === "All Gaps" || item.linkedGap === gapFilter) &&
        (ownerFilter === "All Owners" || item.owner === ownerFilter)
      );
    });
  }, [combinedItems, search, filterValues]);

  const sortedItems = useMemo(() => sortActionItems(filteredItems), [filteredItems]);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / limit));

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * limit;
    return sortedItems.slice(start, start + limit);
  }, [sortedItems, page, totalPages, limit]);

  useEffect(() => {
    setPagination({
      total: sortedItems.length,
      totalPages,
      currentPage: Math.min(page, totalPages),
      limit: ACTION_ITEMS_PER_PAGE,
    });
    setLoading(false);
  }, [
    sortedItems.length,
    totalPages,
    page,
    setPagination,
    setLoading,
    search,
    filterValues,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const showingFrom = sortedItems.length > 0 ? (page - 1) * limit + 1 : 0;
  const showingTo = Math.min(page * limit, sortedItems.length);

  return (
    <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
      <div className="mb-4 flex justify-end">
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
          {sortedItems.length} Records
        </span>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-gray-500">
            Loading...
          </div>
        ) : paginatedItems.length > 0 ? (
          paginatedItems.map((item) => (
            <ActionItemMobileCard
              key={`${item.sourceType}-${item.id}-${item.actionId}`}
              item={item}
              onView={setSelectedItem}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No action item records found.
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1340px] table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
            <colgroup>
              <col className="w-[110px]" />
              <col className="w-[230px]" />
              <col className="w-[160px]" />
              <col className="w-[190px]" />
              <col className="w-[150px]" />
              <col className="w-[125px]" />
              <col className="w-[105px]" />
              <col className="w-[90px]" />
              <col className="w-[105px]" />
              <col className="w-[95px]" />
            </colgroup>

            <thead>
              <tr className="bg-[#F5F7FA] text-[11px] font-extrabold uppercase leading-4 tracking-[0.04em] text-[#174A7C]">
                <th className="px-4 py-3.5 first:rounded-tl-2xl">
                  Action ID
                </th>
                <th className="px-4 py-3.5">Action Item</th>
                <th className="px-4 py-3.5">Module</th>
                <th className="px-4 py-3.5">Role / Account</th>
                <th className="px-4 py-3.5">Owner</th>
                <th className="px-4 py-3.5">Deadline</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Risk</th>
                <th className="px-4 py-3.5">Gap</th>
                <th className="px-4 py-3.5 text-right last:rounded-tr-2xl">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr
                    key={`${item.sourceType}-${item.id}-${item.actionId}`}
                    className="transition-colors duration-200 hover:bg-[#FAFBFC]"
                  >
                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <p className="text-[13px] font-extrabold leading-5 text-sibs-primary-1">
                        {item.actionId}
                      </p>

                      <p className="mt-0.5 text-[10px] font-extrabold uppercase leading-4 tracking-[0.05em] text-sibs-tertiary-5">
                        {item.sourceType || "Manual"}
                      </p>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <p className="line-clamp-2 text-sm font-bold leading-5 text-[#101828]">
                        {item.actionItem}
                      </p>

                      {item.systemGenerated ? (
                        <span className="mt-1.5 inline-flex whitespace-nowrap rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold leading-4 text-purple-700">
                          System Suggested
                        </span>
                      ) : null}
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <span
                        className={`inline-flex max-w-full whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold leading-4 ${getModuleClass(
                          item.module,
                        )}`}
                      >
                        <span className="truncate">
                          {item.module || "Recruitment"}
                        </span>
                      </span>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <p className="line-clamp-2 text-[13px] font-bold leading-5 text-[#101828]">
                        {item.roleTitle || "—"}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-sibs-tertiary-5">
                        {item.account || "—"}
                      </p>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <div className="flex min-w-0 items-center gap-2 whitespace-nowrap text-[13px] font-semibold leading-5 text-[#344054]">
                        <UserRound
                          size={14}
                          className="shrink-0 text-gray-400"
                        />

                        <span className="truncate">{item.owner || "—"}</span>
                      </div>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold leading-5 text-[#344054]">
                          <CalendarDays
                            size={14}
                            className="shrink-0 text-gray-400"
                          />

                          <span>{formatDate(item.deadline)}</span>
                        </div>

                        <p
                          className={`mt-0.5 text-[11px] font-bold leading-4 ${
                            getDaysLeftValue(item.deadline) < 0 &&
                            item.status !== "Completed"
                              ? "text-red-600"
                              : "text-sibs-tertiary-5"
                          }`}
                        >
                          {getDaysLeft(item.deadline)}
                        </p>
                      </div>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold leading-4 ${getStatusClass(
                          item.status,
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold leading-4 ${getRiskClass(
                          item.riskLevel,
                        )}`}
                      >
                        {item.riskLevel}
                      </span>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 align-middle">
                      <span
                        className={`inline-flex max-w-full whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold leading-4 ${getGapClass(
                          item.linkedGap,
                        )}`}
                      >
                        <span className="truncate">{item.linkedGap}</span>
                      </span>
                    </td>

                    <td className="border-b border-[#E6ECF2] px-4 py-4 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="inline-flex h-9 whitespace-nowrap items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3.5 text-[11px] font-bold leading-4 text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-sm active:scale-[0.98]"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    No action item records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm font-semibold text-sibs-tertiary-5">
          Showing {showingFrom} to {showingTo} of {sortedItems.length} action item records
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNumber = index + 1;
            const active = page === pageNumber;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${
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
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E6ECF2] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
