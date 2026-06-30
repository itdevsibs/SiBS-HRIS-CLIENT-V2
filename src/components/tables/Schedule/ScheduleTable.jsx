import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock, Search } from "lucide-react";

import { formatDate } from "@/components/layout/FormatDateTime";
import PaginationTable from "@/services/pagination/PaginationTable";
import { PaginationDateRangeFilter } from "@/services/context/PaginationContext";

const PAGE_LIMIT = 15;

function formatTime(timeString) {
  if (!timeString || timeString === "00:00:00") return "—";

  const parts = String(timeString).split(":");
  if (parts.length < 2) return String(timeString);

  const hour = Number(parts[0]);
  const minutes = parts[1];

  if (Number.isNaN(hour)) return String(timeString);

  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minutes} ${suffix}`;
}

function formatMode(mode) {
  if (mode === null || mode === undefined || mode === "") return "—";

  switch (String(mode)) {
    case "0":
      return "Day Off";
    case "1":
      return "Regular";
    case "2":
      return "Rest Day";
    case "3":
      return "Holiday";
    default:
      return String(mode);
  }
}

function normalizeMode(mode) {
  const value = String(mode ?? "").trim();

  if (value === "0") return "Day Off";
  if (value === "1") return "Regular";
  if (value === "2") return "Rest Day";
  if (value === "3") return "Holiday";

  return value || "—";
}

function getModeBadgeClass(mode) {
  const normalized = normalizeMode(mode);

  if (normalized === "Day Off") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  if (normalized === "Rest Day") {
    return "border-amber-200 bg-amber-50 text-amber-600";
  }

  if (normalized === "Holiday") {
    return "border-blue-200 bg-blue-50 text-sibs-primary-1";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-600";
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
  iconClassName = "bg-[#F2F6FA] text-sibs-primary-1",
  delay = 0,
}) {
  return (
    <div
      className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-wide text-[#174A7C]">
            {title}
          </p>

          <p
            className={`mt-3 truncate text-3xl font-extrabold leading-none ${valueClassName}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function InlineScheduleDateRangeFilter({ visible }) {
  if (!visible) return null;

  return (
    <div className="schedule-date-filter-inline w-full lg:w-auto">
      <style>
        {`
          .schedule-date-filter-inline {
            width: 100%;
          }

          .schedule-date-filter-inline > div {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            flex-wrap: wrap !important;
          }

          .schedule-date-filter-inline > div > button,
          .schedule-date-filter-inline > div > div > button,
          .schedule-date-filter-inline > div > div > div > button,
          .schedule-date-filter-inline button[aria-haspopup="dialog"],
          .schedule-date-filter-inline button[data-state] {
            height: 44px !important;
            min-height: 44px !important;
            min-width: 220px !important;
            border-radius: 10px !important;
            border: 1px solid #D0D5DD !important;
            background: #FFFFFF !important;
            padding: 0 16px !important;
            color: #0D4676 !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            box-shadow: none !important;
            outline: none !important;
            transition:
              border-color 180ms ease,
              background-color 180ms ease,
              box-shadow 180ms ease,
              transform 180ms ease !important;
          }

          .schedule-date-filter-inline > div > button:hover,
          .schedule-date-filter-inline > div > div > button:hover,
          .schedule-date-filter-inline > div > div > div > button:hover,
          .schedule-date-filter-inline button[aria-haspopup="dialog"]:hover,
          .schedule-date-filter-inline button[data-state]:hover {
            border-color: rgba(13, 70, 118, 0.3) !important;
            background: #F8FAFC !important;
          }

          .schedule-date-filter-inline > div > button:focus,
          .schedule-date-filter-inline > div > div > button:focus,
          .schedule-date-filter-inline > div > div > div > button:focus,
          .schedule-date-filter-inline button[aria-haspopup="dialog"]:focus,
          .schedule-date-filter-inline button[data-state="open"] {
            border-color: #0D4676 !important;
            box-shadow: 0 0 0 4px rgba(13, 70, 118, 0.10) !important;
          }

          .schedule-date-filter-inline > div > button:active,
          .schedule-date-filter-inline > div > div > button:active,
          .schedule-date-filter-inline > div > div > div > button:active,
          .schedule-date-filter-inline button[aria-haspopup="dialog"]:active {
            transform: scale(0.98) !important;
          }

          .schedule-date-filter-inline > div > button svg,
          .schedule-date-filter-inline > div > div > button svg,
          .schedule-date-filter-inline > div > div > div > button svg,
          .schedule-date-filter-inline button[aria-haspopup="dialog"] svg {
            color: #0D4676 !important;
          }

          @media (max-width: 1023px) {
            .schedule-date-filter-inline,
            .schedule-date-filter-inline > div,
            .schedule-date-filter-inline > div > button,
            .schedule-date-filter-inline > div > div,
            .schedule-date-filter-inline > div > div > button,
            .schedule-date-filter-inline > div > div > div,
            .schedule-date-filter-inline > div > div > div > button {
              width: 100% !important;
            }
          }

          .schedule-date-filter-inline [data-radix-popper-content-wrapper] {
            z-index: 999999 !important;
          }
        `}
      </style>

      <PaginationDateRangeFilter entity="schedule" visible className="m-0" />
    </div>
  );
}

export default function ScheduleTable({
  schedule = [],
  loading = false,
  page = 1,
  searchInput = "",
  searchKeyword = "",
  setSearchInput,
  setSearchKeyword,
  setPage,
  pagination = {
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    total: 0,
    limit: PAGE_LIMIT,
  },
  filterValues = {},
}) {
  const tableScrollRef = useRef(null);
  const [searchSubmitVersion, setSearchSubmitVersion] = useState(0);

  const dateFrom = filterValues?.dateFrom || "";
  const dateTo = filterValues?.dateTo || "";

  useEffect(() => {
    if (!tableScrollRef.current) return;

    tableScrollRef.current.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [page, searchKeyword, searchSubmitVersion, dateFrom, dateTo]);

  function runSearch() {
    const cleanSearch = String(searchInput || "").trim();
    const currentSearch = String(searchKeyword || "").trim();

    setPage?.(1);
    setSearchSubmitVersion((prev) => prev + 1);

    if (cleanSearch === currentSearch) {
      setSearchKeyword?.("");

      window.setTimeout(() => {
        setPage?.(1);
        setSearchKeyword?.(cleanSearch);
      }, 0);

      return;
    }

    setSearchKeyword?.(cleanSearch);
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;

    e.preventDefault();
    runSearch();
  }

  function handlePreviousPage() {
    if (loading || page <= 1) return;

    setPage?.((prev) => Math.max(Number(prev || 1) - 1, 1));
  }

  function handleNextPage() {
    const safeTotalPages = Math.max(Number(pagination.totalPages || 1), 1);

    if (loading || page >= safeTotalPages) return;

    setPage?.((prev) => Math.min(Number(prev || 1) + 1, safeTotalPages));
  }

  const pageStats = useMemo(() => {
    const totalLoaded = schedule.length;

    const regularCount = schedule.filter(
      (item) => normalizeMode(item.gy_sched_mode) === "Regular",
    ).length;

    const dayOffCount = schedule.filter(
      (item) => normalizeMode(item.gy_sched_mode) === "Day Off",
    ).length;

    const restDayCount = schedule.filter(
      (item) => normalizeMode(item.gy_sched_mode) === "Rest Day",
    ).length;

    return {
      totalLoaded,
      regularCount,
      dayOffCount,
      restDayCount,
    };
  }, [schedule]);

  const currentPage = Number(pagination.currentPage || page || 1);
  const totalPages = Math.max(Number(pagination.totalPages || 1), 1);
  const totalRecords = Number(
    pagination.totalRecords ?? pagination.total ?? schedule.length ?? 0,
  );

  return (
    <>
      <section
        className="sibs-profile-tab-panel rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
        style={{ animationDelay: "60ms", animationFillMode: "both" }}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#101828]">
              Current Page Summary
            </h2>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              These totals are based only on the current schedule records loaded
              for this page.
            </p>
          </div>

          <Badge className="border-blue-200 bg-blue-50 text-sibs-primary-1">
            Page {currentPage} of {totalPages}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Loaded Schedules"
            value={loading ? "..." : pageStats.totalLoaded}
            icon={CalendarDays}
            delay={0}
          />

          <StatCard
            title="Regular"
            value={loading ? "..." : pageStats.regularCount}
            icon={Clock}
            valueClassName="text-emerald-600"
            iconClassName="bg-emerald-50 text-emerald-600"
            delay={60}
          />

          <StatCard
            title="Day Off"
            value={loading ? "..." : pageStats.dayOffCount}
            icon={Clock}
            valueClassName="text-red-600"
            iconClassName="bg-red-50 text-red-600"
            delay={120}
          />

          <StatCard
            title="Rest Day"
            value={loading ? "..." : pageStats.restDayCount}
            icon={Clock}
            valueClassName="text-amber-500"
            iconClassName="bg-amber-50 text-amber-600"
            delay={180}
          />
        </div>
      </section>

      <section
        className="sibs-profile-tab-panel min-w-0 overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm transition-all duration-200 hover:border-sibs-primary-1/20 hover:shadow-md"
        style={{ animationDelay: "120ms", animationFillMode: "both" }}
      >
        <div className="relative overflow-visible p-4 sm:p-5">
          <PaginationTable
            title="Schedule Records"
            subtitle="View your current page of schedule records."
            loading={loading}
            searchValue={searchInput}
            searchPlaceholder="Search..."
            onSearchChange={(value) => setSearchInput?.(value)}
            onSearchKeyDown={handleSearchKeyDown}
            rightContent={<InlineScheduleDateRangeFilter visible />}
            showPagination={false}
            className="mb-5"
          />

          <div className="mb-5 block sm:hidden">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={17} />
              Search
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E6ECF2]">
            <div ref={tableScrollRef} className="max-h-[580px] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse bg-white">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Date
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Mode
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Login
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Break Out
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Break In
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Logout
                    </th>

                    <th className="whitespace-nowrap px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.04em] text-sibs-tertiary-5">
                      Registered
                    </th>
                  </tr>
                </thead>

                <tbody
                  key={`${page}-${searchKeyword}-${searchSubmitVersion}-${dateFrom}-${dateTo}-${loading}`}
                >
                  {loading ? (
                    Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                      <tr key={index}>
                        <td
                          colSpan={7}
                          className="border-t border-[#f3f4f6] px-5 py-4"
                        >
                          <div className="h-5 w-full animate-sibs-pulse rounded bg-gray-200" />
                        </td>
                      </tr>
                    ))
                  ) : schedule.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
                      >
                        No schedule found.
                      </td>
                    </tr>
                  ) : (
                    schedule.map((item, index) => (
                      <tr
                        key={item.gy_sched_id || index}
                        className="transition-all duration-200 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#101828]">
                          {formatDate(item.gy_sched_day)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm">
                          <Badge
                            className={getModeBadgeClass(item.gy_sched_mode)}
                          >
                            {formatMode(item.gy_sched_mode)}
                          </Badge>
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-[#344054]">
                          {formatTime(item.gy_sched_login)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {formatTime(item.gy_sched_breakout)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {formatTime(item.gy_sched_breakin)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm font-bold text-sibs-primary-1">
                          {formatTime(item.gy_sched_logout)}
                        </td>

                        <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-center text-sm text-[#344054]">
                          {formatDate(item.gy_sched_reg)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationTable
            loading={loading}
            showSearch={false}
            showPagination
            currentPage={currentPage}
            totalPages={totalPages}
            loadedCount={schedule.length}
            totalRecords={totalRecords}
            recordLabel="schedule records"
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        </div>
      </section>
    </>
  );
}