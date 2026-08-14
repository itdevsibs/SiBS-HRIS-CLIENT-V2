import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock, Search } from "lucide-react";

import { formatDate } from "@/components/layout/FormatDateTime";
import PaginationTable from "@/services/pagination/PaginationTable";
import { PaginationDateRangeFilter } from "@/services/context/PaginationContext";

const PAGE_LIMIT = 15;

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

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
    return "border-rose-200 bg-rose-50 text-rose-600";
  }

  if (normalized === "Rest Day") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "Holiday") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${className}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  tone = "navy",
  delay = 0,
}) {
  const tones = {
    navy: {
      label: "text-[#174A7C]",
      value: "text-[#042C51]",
      icon: "bg-[#F2F6FA] text-[#174A7C]",
    },
    emerald: {
      label: "text-emerald-700",
      value: "text-emerald-600",
      icon: "bg-emerald-50 text-emerald-600",
    },
    rose: {
      label: "text-rose-700",
      value: "text-rose-600",
      icon: "bg-rose-50 text-rose-600",
    },
    amber: {
      label: "text-amber-700",
      value: "text-amber-500",
      icon: "bg-amber-50 text-amber-600",
    },
  };

  const selectedTone = tones[tone] || tones.navy;
  const IconComponent = icon;

  return (
    <article
      className="sibs-metric-card flex min-h-[112px] flex-col justify-between overflow-hidden p-3.5"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-[10px] font-extrabold uppercase ${selectedTone.label}`}
        >
          {title}
        </span>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${selectedTone.icon}`}
        >
          <IconComponent size={17} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-2">
        <p
          className={`text-3xl font-extrabold leading-none tabular-nums ${selectedTone.value}`}
        >
          {value}
        </p>
        <p className="mt-1.5 text-xs font-bold leading-4 text-[#667085]">
          {description}
        </p>
      </div>
    </article>
  );
}

function InlineScheduleDateRangeFilter({ visible }) {
  if (!visible) return null;

  return (
    <div className="schedule-date-filter-inline w-full sm:w-auto">
      <PaginationDateRangeFilter
        entity="schedule"
        visible
        className="m-0 w-full"
      />
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
    if (loading || currentPage <= 1) return;

    setPage?.(Math.max(currentPage - 1, 1));
  }

  function handleNextPage() {
    if (loading || currentPage >= totalPages) return;

    setPage?.(Math.min(currentPage + 1, totalPages));
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
      <style>{`
        @keyframes sibsScheduleRowReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sibs-schedule-row-reveal {
          animation: sibsScheduleRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .sibs-schedule-row-reveal {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="space-y-5 sm:space-y-6">
      <section
        className="sibs-profile-tab-panel"
        style={getAnimationStyle(60)}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Loaded Schedules"
            value={loading ? "..." : pageStats.totalLoaded}
            description="Records loaded on the current page"
            icon={CalendarDays}
            tone="navy"
            delay={0}
          />

          <StatCard
            title="Regular"
            value={loading ? "..." : pageStats.regularCount}
            description="Regular work schedules on this page"
            icon={Clock}
            tone="emerald"
            delay={60}
          />

          <StatCard
            title="Day Off"
            value={loading ? "..." : pageStats.dayOffCount}
            description="Scheduled days off on this page"
            icon={Clock}
            tone="rose"
            delay={120}
          />

          <StatCard
            title="Rest Day"
            value={loading ? "..." : pageStats.restDayCount}
            description="Rest days scheduled on this page"
            icon={Clock}
            tone="amber"
            delay={180}
          />
        </div>
      </section>

      <section
        className="sibs-profile-tab-panel sibs-page-card-in sibs-card overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
        style={getAnimationStyle(120)}
      >
        <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 className="sibs-section-title">Schedule Records</h2>
              <p className="sibs-section-subtitle">
                Review your scheduled work days, shift times, breaks, and registered dates.
              </p>
            </div>

            <span className="inline-flex w-max items-center rounded-full border border-orange-100 bg-[#FFF3ED] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#FF5C28]">
              Page {currentPage}
            </span>
          </div>
        </div>

        <div className="relative overflow-visible p-4 sm:p-5">
          <PaginationTable
            filterLayout="ta-inline"
            showFilterPanel={false}
            showFilterHeader={false}
            showPagination={false}
            loading={loading}
            searchValue={searchInput}
            searchPlaceholder="Search schedule records..."
            onSearchChange={(value) => setSearchInput?.(value)}
            onSearchKeyDown={handleSearchKeyDown}
            dropdownFilters={[]}
            rightContent={<InlineScheduleDateRangeFilter visible />}
            className="border-0 bg-transparent p-0 shadow-none"
          />

          <div className="mt-3 block sm:hidden">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search size={16} />
              Apply Search
            </button>
          </div>

          <div className="mt-5 sibs-data-table-shell">
            <div className="overflow-hidden">
              <div
                ref={tableScrollRef}
                className="max-h-[650px] overflow-auto"
              >
                <table className="w-full min-w-[980px] border-collapse bg-white text-left">
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th">Date</th>
                      <th className="sibs-data-table-th">Mode</th>
                      <th className="sibs-data-table-th text-center">Login</th>
                      <th className="sibs-data-table-th text-center">Break Out</th>
                      <th className="sibs-data-table-th text-center">Break In</th>
                      <th className="sibs-data-table-th text-center">Logout</th>
                      <th className="sibs-data-table-th text-center">Registered</th>
                    </tr>
                  </thead>

                  <tbody
                    key={`${page}-${searchKeyword}-${searchSubmitVersion}-${dateFrom}-${dateTo}-${loading}`}
                    className="divide-y divide-[#EEF2F6]"
                  >
                    {loading ? (
                      Array.from({ length: PAGE_LIMIT }).map((_, index) => (
                        <tr key={`schedule-skeleton-${index}`}>
                          <td colSpan={7} className="px-4 py-4">
                            <div className="h-7 w-full animate-sibs-pulse rounded bg-slate-100" />
                          </td>
                        </tr>
                      ))
                    ) : schedule.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-[#667085]">
                            <CalendarDays size={34} className="text-[#C8D3DF]" />
                            <p className="text-sm font-extrabold text-[#042C51]">
                              No schedule records found
                            </p>
                            <p className="text-xs font-semibold">
                              Adjust the search or date range filters and try again.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      schedule.map((item, index) => (
                        <tr
                          key={item.gy_sched_id || index}
                          className="sibs-data-table-row sibs-schedule-row-reveal"
                          style={{
                            animationDelay: `${Math.min(index, 10) * 36}ms`,
                          }}
                        >
                          <td className="whitespace-nowrap px-4 py-3.5 text-xs font-extrabold text-[#536887]">
                            {formatDate(item.gy_sched_day)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5">
                            <Badge className={getModeBadgeClass(item.gy_sched_mode)}>
                              {formatMode(item.gy_sched_mode)}
                            </Badge>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#042C51]">
                            {formatTime(item.gy_sched_login)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#7B8DB3]">
                            {formatTime(item.gy_sched_breakout)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#7B8DB3]">
                            {formatTime(item.gy_sched_breakin)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-extrabold tabular-nums text-[#042C51]">
                            {formatTime(item.gy_sched_logout)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-center text-xs font-semibold text-[#667085]">
                            {formatDate(item.gy_sched_reg)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-5">
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
              showCount
              className="border-0 bg-transparent p-0 shadow-none"
            />
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
