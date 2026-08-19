import React, {
  useEffect,
  useMemo,
} from "react";
import { FileText } from "lucide-react";

import { useHiringNeeds } from "../../../services/context/HiringNeedsContext";
import { usePagination } from "../../../services/context/PaginationContext";
import PaginationTable from "../../../services/pagination/PaginationTable";
import HiringNeedsMobileCard from "./HiringNeedsMobileCard";
import StatusFilterTabs from "../StatusFilterTabs";
import {
  getHiringNeedsDateOrWeek,
  getHiringNeedsDepartmentAccount,
  getHiringNeedsHeadcount,
  getHiringNeedsReason,
  getHiringNeedsRequestType,
  getHiringNeedsRequestTypeClass,
  getHiringNeedsSearchText,
  getHiringNeedsSite,
  getHiringNeedsStatusClass,
  getHiringNeedsSubtitle,
  getHiringNeedsTitle,
  normalizeHiringNeedsStatus,
} from "../../../lib/utils/hiringNeeds/hiringNeedsHelpers";

const HIRING_NEEDS_ENTITY = "hiring-needs";
const DEFAULT_PAGE_LIMIT = 15;
const STATUS_TABS = [
  { label: "All PRFs", value: "All" },
  { label: "For Approval", value: "For Approval" },
  { label: "Approved", value: "Approved" },
  { label: "Not Approved", value: "Not Approved" },
];

export default function HiringNeedsTable({
  onView,
  canApproveHiringNeeds = false,
}) {
  const {
    list,
    loading,
  } = useHiringNeeds();

  const {
    page,
    setPage,
    setPagination,
    pagination,
    search,
    filterValues,
    setFilter,
  } = usePagination(HIRING_NEEDS_ENTITY);

  const limit =
    Number(pagination?.limit) || DEFAULT_PAGE_LIMIT;

  const visibleStatusTabs = useMemo(
    () =>
      STATUS_TABS.filter(
        (tab) => tab.value !== "For Approval" || canApproveHiringNeeds,
      ),
    [canApproveHiringNeeds],
  );

  const filteredList = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    const statusValue =
      filterValues?.status || "All";

    const siteValue =
      filterValues?.site || "All";

    const reasonValue =
      filterValues?.reason || "All";

    return (Array.isArray(list) ? list : []).filter(
      (item) => {
        const status =
          normalizeHiringNeedsStatus(
            item.approvalStatus ||
              item.approval_status,
          );

        const site =
          getHiringNeedsSite(item);

        const reason =
          getHiringNeedsReason(item);

        const matchesSearch =
          !keyword ||
          getHiringNeedsSearchText(item).includes(
            keyword,
          );

        const matchesStatus =
          statusValue === "All" ||
          status === statusValue;

        const matchesSite =
          siteValue === "All" ||
          site === siteValue;

        const matchesReason =
          reasonValue === "All" ||
          reason === reasonValue;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesSite &&
          matchesReason
        );
      },
    );
  }, [
    filterValues,
    list,
    search,
  ]);

  const statusCounts = useMemo(() => {
    return (Array.isArray(list) ? list : []).reduce(
      (counts, item) => {
        const status = normalizeHiringNeedsStatus(
          item.approvalStatus || item.approval_status,
        );

        return {
          ...counts,
          All: counts.All + 1,
          [status]: Number(counts[status] || 0) + 1,
        };
      },
      {
        All: 0,
        "For Approval": 0,
        Approved: 0,
        "Not Approved": 0,
      },
    );
  }, [list]);

  function handleStatusTabChange(value) {
    setFilter("status", value);
    setPage(1);
  }

  useEffect(() => {
    if (
      !canApproveHiringNeeds &&
      (filterValues?.status || "All") === "For Approval"
    ) {
      setFilter("status", "All");
      setPage(1);
    }
  }, [canApproveHiringNeeds, filterValues?.status, setFilter, setPage]);

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
  }, [
    filteredList,
    limit,
    safeCurrentPage,
  ]);

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
  }, [
    page,
    safeCurrentPage,
    setPage,
  ]);

  function handlePreviousPage() {
    if (
      loading ||
      safeCurrentPage <= 1
    ) {
      return;
    }

    setPage(
      Math.max(
        safeCurrentPage - 1,
        1,
      ),
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

  function handleRowKeyDown(event, item) {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();
    onView?.(item);
  }

  return (
    <div className="px-4 pb-4 pt-0 font-jakarta sm:px-5 sm:pb-5">
      <div className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
          <StatusFilterTabs
            tabs={visibleStatusTabs}
            activeValue={filterValues?.status || "All"}
            counts={statusCounts}
            onChange={handleStatusTabChange}
        />

        {/* Mobile cards */}
        <div className="p-4 lg:hidden">
          {loading ? (
            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] py-12 text-center text-sm font-bold text-[#667085]">
              Loading Hiring Needs records...
            </div>
          ) : paginatedData.length > 0 ? (
            <div className="space-y-3">
              {paginatedData.map(
                (item, index) => (
                  <HiringNeedsMobileCard
                    key={
                      item.id ||
                      `${getHiringNeedsTitle(
                        item,
                      )}-${index}`
                    }
                    item={item}
                    onView={onView}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="sibs-empty-panel">
              <FileText className="mx-auto h-9 w-9 text-[#CBD5E1]" />

              <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                No Personnel Requisitions Found
              </p>

              <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                No records matched the active search
                and filters.
              </p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto max-h-[480px] 2xl:max-h-[640px] overflow-y-auto sibs-scrollbar lg:block">
          <table className="w-full min-w-[1180px] table-fixed border-collapse bg-white text-left text-xs">
            <thead className="sibs-data-table-head sticky top-0 z-10 bg-[#F8FAFC]">
              <tr className="sibs-data-table-head-row">
                <th className="sibs-data-table-th w-[15%] text-left">
                  ID / Request Type
                </th>

                <th className="sibs-data-table-th w-[18%] text-left">
                  Department / Account
                </th>

                <th className="sibs-data-table-th w-[22%] text-left">
                  Job Description / Request
                </th>

                <th className="sibs-data-table-th w-[8%] text-center">
                  Headcount
                </th>

                <th className="sibs-data-table-th w-[15%] text-left">
                  Reason
                </th>

                <th className="sibs-data-table-th w-[8%] text-left">
                  Location / Site
                </th>

                <th className="sibs-data-table-th w-[7%] text-left">
                  Date Needed / Week
                </th>

                <th className="sibs-data-table-th w-[7%] text-center">
                  Approval Status
                </th>
              </tr>
            </thead>

            <tbody key={filterValues?.status || "All"} className="divide-y divide-[#E6ECF2]">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center"
                  >
                    <FileText className="mx-auto h-9 w-9 animate-pulse text-[#CBD5E1]" />

                    <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                      Loading Personnel Requisitions
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#98A2B3]">
                      Fetching the current Hiring Needs
                      records.
                    </p>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map(
                  (item, index) => {
                    const requestType =
                      getHiringNeedsRequestType(
                        item,
                      );

                    const status =
                      normalizeHiringNeedsStatus(
                        item.approvalStatus ||
                          item.approval_status,
                      );

                    const title =
                      getHiringNeedsTitle(item);

                    return (
                      <tr
                        key={
                          item.id ||
                          `${title}-${index}`
                        }
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          onView?.(item)
                        }
                        onKeyDown={(event) =>
                          handleRowKeyDown(
                            event,
                            item,
                          )
                        }
                        className="sibs-data-table-row sibs-page-card-in cursor-pointer outline-none transition hover:bg-[#F8FAFC] focus-visible:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF5C28]/40"
                        style={{
                          animationDelay:
                            `${index * 30}ms`,
                          animationFillMode: "both",
                        }}
                        aria-label={`View Hiring Needs request ${
                          item.id || ""
                        }`}
                      >
                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <p className="text-xs font-extrabold leading-none text-[#042C51]">
                              {item.id || "--"}
                            </p>

                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold leading-none ${getHiringNeedsRequestTypeClass(
                                requestType,
                              )}`}
                            >
                              {requestType}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                          <p
                            className="max-w-[260px] truncate text-xs font-extrabold leading-5 text-[#042C51]"
                            title={getHiringNeedsDepartmentAccount(
                              item,
                            )}
                          >
                            {getHiringNeedsDepartmentAccount(
                              item,
                            )}
                          </p>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                          <p className="max-w-[320px] text-xs font-extrabold leading-5 text-[#042C51]">
                            {title}
                          </p>

                          <p className="mt-0.5 max-w-[320px] truncate sibs-text-micro font-semibold leading-4 text-[#98A2B3]">
                            {getHiringNeedsSubtitle(
                              item,
                            )}
                          </p>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center align-middle">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-[#F2F6FA] px-2 py-0.5 text-xs font-extrabold leading-none tabular-nums text-[#042C51]">
                            {getHiringNeedsHeadcount(
                              item,
                            )}
                          </span>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 align-middle">
                          <p className="max-w-[220px] text-xs font-semibold leading-5 text-[#475467]">
                            {getHiringNeedsReason(
                              item,
                            )}
                          </p>
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-xs font-semibold text-[#475467] align-middle">
                          {getHiringNeedsSite(item)}
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-xs font-semibold tabular-nums text-[#475467] align-middle">
                          {getHiringNeedsDateOrWeek(
                            item,
                          )}
                        </td>

                        <td className="px-3 2xl:px-4 py-2 2xl:py-2.5 text-center align-middle">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-extrabold leading-none ${getHiringNeedsStatusClass(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  },
                )
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-14 text-center"
                  >
                    <FileText className="mx-auto h-9 w-9 text-[#CBD5E1]" />

                    <p className="mt-3 text-sm font-extrabold text-[#042C51]">
                      No Personnel Requisitions Found
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
            recordLabel="personnel requisitions"
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
