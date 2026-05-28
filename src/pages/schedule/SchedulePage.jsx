import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
} from "lucide-react";

import Header from "../../components/layout/Header";
import { getSchedule } from "../../lib/axios/getSchedule";
import { formatDate } from "../../components/layout/FormatDateTime";

const SCHEDULE_STATE_KEY = "schedulePageState";
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
      style={{ animationDelay: `${delay}ms` }}
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

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalRecords: 0,
    limit: PAGE_LIMIT,
  });

  const navigate = useNavigate();
  const restoredRef = useRef(false);
  const mainScrollRef = useRef(null);
  const tableScrollRef = useRef(null);

  useEffect(() => {
    if (restoredRef.current) return;

    try {
      const savedState = sessionStorage.getItem(SCHEDULE_STATE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);

        if (typeof parsed.search === "string") {
          setSearchInput(parsed.search);
          setSearchKeyword(parsed.search);
        }

        if (typeof parsed.page === "number" && parsed.page > 0) {
          setPage(parsed.page);
        }
      }
    } catch (err) {
      console.error("Schedule state restore error:", err);
    } finally {
      restoredRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!restoredRef.current) return;

    sessionStorage.setItem(
      SCHEDULE_STATE_KEY,
      JSON.stringify({
        search: searchKeyword,
        page,
      }),
    );
  }, [searchKeyword, page]);

  async function fetchSchedule(showLoading = true) {
    if (showLoading) setLoading(true);

    try {
      const result = await getSchedule(page);

      if (!result?.success) {
        if (result?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setSchedule([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          limit: PAGE_LIMIT,
        });
        return;
      }

      setSchedule(result.data || []);
      setPagination(
        result.pagination || {
          currentPage: page,
          totalPages: 1,
          totalRecords: result.data?.length || 0,
          limit: PAGE_LIMIT,
        },
      );
    } catch (err) {
      console.error("Schedule fetch error:", err);

      setSchedule([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: PAGE_LIMIT,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!restoredRef.current) return;

    fetchSchedule(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const handleFocus = () => {
      fetchSchedule(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [page]);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [page]);

  function runSearch() {
    setSearchKeyword(searchInput.trim());
    setPage(1);
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      runSearch();
    }
  }

  function handlePreviousPage() {
    if (loading || page <= 1) return;
    setPage((prev) => Math.max(prev - 1, 1));
  }

  function handleNextPage() {
    if (loading || page >= pagination.totalPages) return;
    setPage((prev) => Math.min(prev + 1, pagination.totalPages));
  }

  const filteredSchedule = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return schedule;

    return schedule.filter((item) => {
      const values = [
        formatDate(item.gy_sched_day),
        formatMode(item.gy_sched_mode),
        formatTime(item.gy_sched_login),
        formatTime(item.gy_sched_breakout),
        formatTime(item.gy_sched_breakin),
        formatTime(item.gy_sched_logout),
        formatDate(item.gy_sched_reg),
      ];

      return values.some((value) =>
        String(value).toLowerCase().includes(keyword),
      );
    });
  }, [schedule, searchKeyword]);

  const pageStats = useMemo(() => {
    const totalLoaded = filteredSchedule.length;

    const regularCount = filteredSchedule.filter(
      (item) => normalizeMode(item.gy_sched_mode) === "Regular",
    ).length;

    const dayOffCount = filteredSchedule.filter(
      (item) => normalizeMode(item.gy_sched_mode) === "Day Off",
    ).length;

    const restDayCount = filteredSchedule.filter(
      (item) => normalizeMode(item.gy_sched_mode) === "Rest Day",
    ).length;

    return {
      totalLoaded,
      regularCount,
      dayOffCount,
      restDayCount,
    };
  }, [filteredSchedule]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main
        ref={mainScrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <section className="sibs-page-header-in flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <CalendarDays
                  size={34}
                  strokeWidth={2.2}
                  className="shrink-0 text-sibs-primary-1 transition-transform duration-300 group-hover:scale-105"
                />

                <h1 className="m-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                  My Schedule
                </h1>
              </div>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                View your work schedule and assigned shift details.
              </p>
            </div>

            <div className="sibs-profile-tab-panel relative w-full shrink-0 lg:w-80">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
              />

              <input
                type="text"
                placeholder="Search schedule then press Enter"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-11 w-full rounded-full border border-[#e6ecf2] bg-white px-4 pl-11 text-sm font-normal text-sibs-primary-1 outline-none transition-all duration-200 placeholder:text-sibs-tertiary-5 hover:border-sibs-primary-1/30 hover:shadow-sm focus:border-sibs-primary-1 focus:ring-4 focus:ring-sibs-primary-1/10"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#101828]">
                  Current Page Summary
                </h2>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  These totals are based only on the current schedule records
                  loaded for this page.
                </p>
              </div>

              <Badge className="border-blue-200 bg-blue-50 text-sibs-primary-1">
                Page {pagination.currentPage} of {pagination.totalPages}
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
            className="sibs-profile-tab-panel min-w-0 overflow-hidden rounded-xl bg-white shadow-sm"
            style={{ animationDelay: "80ms" }}
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#101828]">
                    Schedule Records
                  </h2>

                  <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                    View your current page of schedule records.
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-[#E6ECF2]">
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

                    <tbody key={`${page}-${searchKeyword}-${loading}`}>
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
                      ) : filteredSchedule.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="border-t border-[#f3f4f6] p-10 text-center text-sm font-bold text-gray-500"
                          >
                            No schedule found.
                          </td>
                        </tr>
                      ) : (
                        filteredSchedule.map((item, index) => (
                          <tr
                            key={item.gy_sched_id || index}
                            className="transition-all duration-200 hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm font-bold text-[#101828]">
                              {formatDate(item.gy_sched_day)}
                            </td>

                            <td className="whitespace-nowrap border-t border-[#f3f4f6] px-5 py-4 text-sm">
                              <Badge
                                className={getModeBadgeClass(
                                  item.gy_sched_mode,
                                )}
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

              <div className="mt-5 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
                <p className="m-0 text-sm font-semibold text-sibs-tertiary-5">
                  Showing {filteredSchedule.length} loaded schedule records
                </p>

                <div className="flex items-center gap-2 max-sm:justify-center">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={handlePreviousPage}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <span className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-4 text-sm font-bold text-[#344054]">
                    Page {pagination.currentPage}
                  </span>

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages || loading}
                    onClick={handleNextPage}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}