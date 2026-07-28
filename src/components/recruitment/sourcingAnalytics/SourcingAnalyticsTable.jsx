import React, {
  useEffect,
  useMemo,
} from "react";
import { Compass } from "lucide-react";

import { useSourcingAnalytics } from "../../../services/context/SourcingContext";
import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import SourcingAnalyticsMobileCard from "./SourcingAnalyticsMobileCard";

const SOURCING_ENTITY = "sourcing-analytics";
const DEFAULT_PAGE_LIMIT = 8;

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCostPerHire(source) {
  if (Number(source?.hired || 0) <= 0) {
    return "—";
  }

  return formatCurrency(source?.costPerHire);
}

function getSourceStatus(source) {
  if (Number(source?.hired || 0) > 0) {
    return "With Hires";
  }

  if (Number(source?.volume || 0) > 0) {
    return "With Applicants";
  }

  return "No Applicants";
}

function getSourceStatusClass(source) {
  const status = getSourceStatus(source);

  if (status === "With Hires") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "With Applicants") {
    return "border-blue-200 bg-blue-50 text-[#042C51]";
  }

  return "border-gray-200 bg-gray-50 text-gray-600";
}

export default function SourcingAnalyticsTable({
  onView,
}) {
  const {
    sourceRows = [],
    loading,
  } = useSourcingAnalytics();

  const {
    page,
    setPage,
    setPagination,
    pagination,
    search,
    filterValues,
  } = usePagination(SOURCING_ENTITY);

  const limit =
    Number(pagination?.limit) ||
    DEFAULT_PAGE_LIMIT;

  const filteredList = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    const sourceFilter =
      filterValues?.source || "All";
    const costStatusFilter =
      filterValues?.costStatus || "All";
    const performanceFilter =
      filterValues?.performance || "All";

    return (Array.isArray(sourceRows)
      ? sourceRows
      : []
    ).filter((source) => {
      const matchesSearch =
        !keyword ||
        String(source?.source || "")
          .toLowerCase()
          .includes(keyword) ||
        String(source?.latestCandidate || "")
          .toLowerCase()
          .includes(keyword);

      const matchesSource =
        sourceFilter === "All" ||
        source?.source === sourceFilter;

      const matchesCostStatus =
        costStatusFilter === "All" ||
        (costStatusFilter === "With Cost" &&
          Number(source?.sourceCost || 0) > 0) ||
        (costStatusFilter === "No Cost" &&
          Number(source?.sourceCost || 0) <= 0);

      const matchesPerformance =
        performanceFilter === "All" ||
        (performanceFilter === "With Applicants" &&
          Number(source?.volume || 0) > 0) ||
        (performanceFilter === "No Applicants" &&
          Number(source?.volume || 0) <= 0) ||
        (performanceFilter === "With Hires" &&
          Number(source?.hired || 0) > 0) ||
        (performanceFilter === "No Hires" &&
          Number(source?.hired || 0) <= 0);

      return (
        matchesSearch &&
        matchesSource &&
        matchesCostStatus &&
        matchesPerformance
      );
    });
  }, [sourceRows, search, filterValues]);

  const totalPages = Math.max(
    Math.ceil(filteredList.length / limit),
    1,
  );

  const safeCurrentPage = Math.min(
    Math.max(Number(page) || 1, 1),
    totalPages,
  );

  const paginatedData = useMemo(() => {
    const start =
      (safeCurrentPage - 1) * limit;

    return filteredList.slice(
      start,
      start + limit,
    );
  }, [filteredList, limit, safeCurrentPage]);

  useEffect(() => {
    setPagination({
      total: filteredList.length,
      totalPages,
      currentPage: safeCurrentPage,
      limit,
    });
  }, [
    filteredList.length,
    limit,
    safeCurrentPage,
    setPagination,
    totalPages,
  ]);

  useEffect(() => {
    if (Number(page) !== safeCurrentPage) {
      setPage(safeCurrentPage);
    }
  }, [page, safeCurrentPage, setPage]);

  function handlePreviousPage() {
    if (loading || safeCurrentPage <= 1) return;

    setPage(
      Math.max(safeCurrentPage - 1, 1),
    );
  }

  function handleNextPage() {
    if (
      loading ||
      safeCurrentPage >= totalPages
    ) {
      return;
    }

    setPage(
      Math.min(
        safeCurrentPage + 1,
        totalPages,
      ),
    );
  }

  function handleRowKeyDown(event, source) {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();
    onView?.(source);
  }

  return (
    <div className="px-4 pb-4 pt-0 font-jakarta sm:px-5 sm:pb-5">
      <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
        <div className="p-4 lg:hidden">
          {loading ? (
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] py-12 text-center text-sm font-bold text-[#667085]">
              Loading sourcing channels...
            </div>
          ) : paginatedData.length > 0 ? (
            <div className="space-y-3">
              {paginatedData.map(
                (source, index) => (
                  <SourcingAnalyticsMobileCard
                    key={
                      source?.id ||
                      `${source?.source}-${index}`
                    }
                    source={source}
                    onView={onView}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="sibs-empty-panel">
              <Compass className="mx-auto h-9 w-9 text-[#CBD5E1]" />

              <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                No Sourcing Channels Found
              </p>

              <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                No records matched the active search
                and filters.
              </p>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1450px] border-collapse bg-white text-left text-xs">
            <thead className="sibs-data-table-head">
              <tr className="sibs-data-table-head-row">
                <th className="sibs-data-table-th text-left">
                  Source Channel
                </th>

                <th className="sibs-data-table-th text-center">
                  Source Cost
                </th>

                <th className="sibs-data-table-th text-center">
                  Cost Entries
                </th>

                <th className="sibs-data-table-th text-center">
                  Applicants
                </th>

                <th className="sibs-data-table-th text-center">
                  Screened
                </th>

                <th className="sibs-data-table-th text-center">
                  Interviewed
                </th>

                <th className="sibs-data-table-th text-center">
                  Offered
                </th>

                <th className="sibs-data-table-th text-center">
                  Hired
                </th>

                <th className="sibs-data-table-th text-center">
                  Conversion
                </th>

                <th className="sibs-data-table-th text-center">
                  Cost / Hire
                </th>

                <th className="sibs-data-table-th text-left">
                  Latest Applicant
                </th>

                <th className="sibs-data-table-th text-left">
                  Last Activity
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E6ECF2]">
              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-5 py-14 text-center"
                  >
                    <Compass className="mx-auto h-9 w-9 animate-pulse text-[#CBD5E1]" />

                    <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                      Loading Sourcing Channels
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                      Fetching the current sourcing
                      performance records.
                    </p>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map(
                  (source, index) => (
                    <tr
                      key={
                        source?.id ||
                        `${source?.source}-${index}`
                      }
                      role="button"
                      tabIndex={0}
                      onClick={() => onView?.(source)}
                      onKeyDown={(event) =>
                        handleRowKeyDown(
                          event,
                          source,
                        )
                      }
                      className="sibs-data-table-row sibs-page-card-in cursor-pointer outline-none transition hover:bg-[#F8FAFC] focus-visible:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/40"
                      style={{
                        animationDelay:
                          `${index * 30}ms`,
                      }}
                      aria-label={`View sourcing channel ${
                        source?.source || ""
                      }`}
                    >
                      <td className="px-4 py-2.5 align-middle">
                        <p
                          className="max-w-[280px] truncate text-xs font-extrabold leading-5 text-[#042C51]"
                          title={source?.source || ""}
                        >
                          {source?.source || "—"}
                        </p>

                        <span
                          className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold leading-none ${getSourceStatusClass(
                            source,
                          )}`}
                        >
                          {getSourceStatus(source)}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-extrabold tabular-nums text-[#042C51] align-middle">
                        {formatCurrency(
                          source?.sourceCost,
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-bold tabular-nums text-[#475467] align-middle">
                        {source?.costEntries?.length || 0}
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-extrabold tabular-nums text-[#042C51] align-middle">
                        {source?.volume || 0}
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-semibold tabular-nums text-[#475467] align-middle">
                        {source?.screened || 0}
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-semibold tabular-nums text-[#475467] align-middle">
                        {source?.interviewed || 0}
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-semibold tabular-nums text-[#475467] align-middle">
                        {source?.offered || 0}
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-extrabold tabular-nums text-emerald-600 align-middle">
                        {source?.hired || 0}
                      </td>

                      <td className="px-3 py-2.5 text-center align-middle">
                        <span className="inline-flex rounded-lg bg-[#F2F6FA] px-2.5 py-1 text-[10px] font-extrabold tabular-nums text-[#042C51]">
                          {Number(
                            source?.conversionRate || 0,
                          ).toFixed(1)}%
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center text-xs font-extrabold tabular-nums text-[#FF5C28] align-middle">
                        {formatCostPerHire(source)}
                      </td>

                      <td className="px-4 py-2.5 align-middle">
                        <p
                          className="max-w-[190px] truncate text-xs font-semibold text-[#475467]"
                          title={
                            source?.latestCandidate || ""
                          }
                        >
                          {source?.latestCandidate || "—"}
                        </p>
                      </td>

                      <td className="px-4 py-2.5 text-xs font-semibold tabular-nums text-[#475467] align-middle">
                        {formatDate(
                          source?.lastActivity,
                        )}
                      </td>
                    </tr>
                  ),
                )
              ) : (
                <tr>
                  <td
                    colSpan={12}
                    className="px-5 py-14 text-center"
                  >
                    <Compass className="mx-auto h-9 w-9 text-[#CBD5E1]" />

                    <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                      No Sourcing Channels Found
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                      No records matched the active
                      search and filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <PaginationTable
            showSearch={false}
            showPagination
            showCount
            loading={loading}
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            loadedCount={paginatedData.length}
            totalRecords={filteredList.length}
            recordLabel="sourcing channels"
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
