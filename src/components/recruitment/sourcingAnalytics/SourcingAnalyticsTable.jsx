import React, { useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useSourcingAnalytics } from "../../../services/context/SourcingContext";
import { usePagination } from "../../../services/context/PaginationContext";
import SourcingAnalyticsMobileCard from "./SourcingAnalyticsMobileCard";

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

function getSourceStatus(source) {
  if (Number(source?.hired || 0) > 0) return "With Hires";
  if (Number(source?.volume || 0) > 0) return "With Applicants";
  return "No Applicants";
}

function getSourceStatusClass(source) {
  const status = getSourceStatus(source);

  switch (status) {
    case "With Hires":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "With Applicants":
      return "border-blue-200 bg-blue-50 text-sibs-primary-1";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function HeaderCell({ children, className = "" }) {
  return (
    <th className={`px-3 py-4 ${className}`}>
      <span className="block truncate whitespace-nowrap">{children}</span>
    </th>
  );
}

function TextCell({ children, className = "" }) {
  return (
    <td className={`border-b border-[#E6ECF2] px-3 py-5 ${className}`}>
      <span className="block truncate whitespace-nowrap">{children}</span>
    </td>
  );
}

export default function SourcingAnalyticsTable({ onView }) {
  const { sourceRows = [], loading } = useSourcingAnalytics();

  const { page, setPage, setPagination, pagination, search, filterValues } =
    usePagination("sourcing-analytics");

  const limit = pagination?.limit || 8;

  const filteredList = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();

    const sourceFilter = filterValues?.source || "All";
    const costStatusFilter = filterValues?.costStatus || "All";
    const performanceFilter = filterValues?.performance || "All";

    return sourceRows.filter((source) => {
      const matchesSearch =
        !keyword ||
        String(source?.source || "").toLowerCase().includes(keyword) ||
        String(source?.latestCandidate || "").toLowerCase().includes(keyword);

      const matchesSource =
        sourceFilter === "All" || source?.source === sourceFilter;

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

  const totalPages = Math.ceil(filteredList.length / limit) || 1;
  const safePage = Math.min(Math.max(Number(page || 1), 1), totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * limit;
    return filteredList.slice(start, start + limit);
  }, [filteredList, safePage, limit]);

  useEffect(() => {
    setPagination({
      total: filteredList.length,
      totalPages,
    });
  }, [filteredList.length, totalPages, setPagination]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages, setPage]);

  return (
    <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="py-12 text-center text-sm font-bold text-gray-500">
            Loading...
          </div>
        ) : paginatedData.length > 0 ? (
          paginatedData.map((source) => (
            <SourcingAnalyticsMobileCard
              key={source?.id || source?.source}
              source={source}
              onView={onView}
            />
          ))
        ) : (
          <div className="rounded-xl border border-[#E6ECF2] bg-white px-5 py-10 text-center text-sm font-bold text-gray-500">
            No records found.
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#D9E2EC] text-left">
            <thead>
              <tr className="bg-[#F5F7FA] text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
                <HeaderCell className="w-[15%] first:rounded-tl-2xl">
                  Source
                </HeaderCell>

                <HeaderCell className="w-[8%] text-center">
                  Source Cost
                </HeaderCell>

                <HeaderCell className="w-[7%] text-center">
                  Cost Entries
                </HeaderCell>

                <HeaderCell className="w-[7%] text-center">
                  Applicants
                </HeaderCell>

                <HeaderCell className="w-[7%] text-center">
                  Screened
                </HeaderCell>

                <HeaderCell className="w-[8%] text-center">
                  Interviewed
                </HeaderCell>

                <HeaderCell className="w-[7%] text-center">
                  Offered
                </HeaderCell>

                <HeaderCell className="w-[6%] text-center">Hired</HeaderCell>

                <HeaderCell className="w-[8%] text-center">
                  Conversion
                </HeaderCell>

                <HeaderCell className="w-[8%] text-center">
                  Cost / Hire
                </HeaderCell>

                <HeaderCell className="w-[10%]">Latest Applicant</HeaderCell>

                <HeaderCell className="w-[8%]">Last Activity</HeaderCell>

                <HeaderCell className="w-[7%] text-right last:rounded-tr-2xl">
                  Actions
                </HeaderCell>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((source) => (
                  <tr
                    key={source?.id || source?.source}
                    className="transition hover:bg-[#FAFBFC]"
                  >
                    <td className="border-b border-[#E6ECF2] px-3 py-5">
                      <p className="truncate whitespace-nowrap text-sm font-bold text-[#101828]">
                        {source?.source || "—"}
                      </p>

                      <div className="mt-2">
                        <span
                          className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-[10px] font-bold leading-none ${getSourceStatusClass(
                            source,
                          )}`}
                        >
                          <span className="truncate whitespace-nowrap">
                            {getSourceStatus(source)}
                          </span>
                        </span>
                      </div>
                    </td>

                    <TextCell className="text-center text-sm font-bold text-[#344054]">
                      {formatCurrency(source?.sourceCost)}
                    </TextCell>

                    <TextCell className="text-center text-sm font-bold text-[#344054]">
                      {source?.costEntries?.length || 0}
                    </TextCell>

                    <TextCell className="text-center text-sm font-extrabold text-sibs-primary-1">
                      {source?.volume || 0}
                    </TextCell>

                    <TextCell className="text-center text-sm font-bold text-[#344054]">
                      {source?.screened || 0}
                    </TextCell>

                    <TextCell className="text-center text-sm font-bold text-[#344054]">
                      {source?.interviewed || 0}
                    </TextCell>

                    <TextCell className="text-center text-sm font-bold text-[#344054]">
                      {source?.offered || 0}
                    </TextCell>

                    <TextCell className="text-center text-sm font-extrabold text-emerald-600">
                      {source?.hired || 0}
                    </TextCell>

                    <TextCell className="text-center text-sm font-extrabold text-sibs-primary-1">
                      {Number(source?.conversionRate || 0).toFixed(1)}%
                    </TextCell>

                    <TextCell className="text-center text-sm font-extrabold text-sibs-primary-1">
                      {formatCurrency(source?.costPerHire)}
                    </TextCell>

                    <TextCell className="text-sm font-semibold text-[#344054]">
                      {source?.latestCandidate || "—"}
                    </TextCell>

                    <TextCell className="text-sm font-semibold text-[#344054]">
                      {formatDate(source?.lastActivity)}
                    </TextCell>

                    <td className="border-b border-[#E6ECF2] px-3 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => onView(source)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] hover:shadow-sm"
                      >
                        <Eye size={15} />
                        <span className="hidden xl:inline">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={13}
                    className="px-5 py-12 text-center text-sm font-bold text-gray-500"
                  >
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <p className="text-sm font-semibold text-sibs-tertiary-5">
          Showing {filteredList.length > 0 ? (safePage - 1) * limit + 1 : 0} to{" "}
          {Math.min(safePage * limit, filteredList.length)} of{" "}
          {filteredList.length} source records
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-sibs-primary-1 px-3 text-sm font-bold text-white shadow-sm"
          >
            {safePage}
          </button>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}