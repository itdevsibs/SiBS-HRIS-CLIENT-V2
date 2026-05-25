import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarDays } from "lucide-react";

import Header from "../../components/layout/Header";
import { getSchedule } from "../../lib/axios/getSchedule";
import { formatDate } from "../../components/layout/FormatDateTime";

const SCHEDULE_STATE_KEY = "schedulePageState";

export default function SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalRecords: 0,
    limit: 15,
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
          setSearch(parsed.search);
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
        search,
        page,
      })
    );
  }, [search, page]);

  const fetchSchedule = async (showLoading = true) => {
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
          limit: 15,
        });
        return;
      }

      setSchedule(result.data || []);
      setPagination(
        result.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 0,
          limit: 15,
        }
      );
    } catch (err) {
      console.error("Schedule fetch error:", err);
      setSchedule([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 15,
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const renderPagination = () => {
    const pages = [];
    const total = pagination.totalPages;
    const current = page;

    const createPage = (p) => (
      <button
        key={p}
        type="button"
        onClick={() => setPage(p)}
        className={`schedule-page-btn ${current === p ? "active" : ""}`}
      >
        {p}
      </button>
    );

    const createDots = (key) => (
      <span key={key} className="schedule-pagination-dots">
        ...
      </span>
    );

    if (total <= 1) return null;

    if (current <= 3) {
      for (let i = 1; i <= Math.min(3, total); i += 1) {
        pages.push(createPage(i));
      }

      if (total > 3) {
        pages.push(createDots("right"));
        pages.push(createPage(total));
      }
    } else if (current >= total - 2) {
      pages.push(createPage(1));
      pages.push(createDots("left"));

      for (let i = total - 2; i <= total; i += 1) {
        if (i > 0) pages.push(createPage(i));
      }
    } else {
      pages.push(createPage(1));
      pages.push(createDots("left"));
      pages.push(createPage(current - 1));
      pages.push(createPage(current));
      pages.push(createPage(current + 1));
      pages.push(createDots("right"));
      pages.push(createPage(total));
    }

    return pages;
  };

  const formatTime = (timeString) => {
    if (!timeString || timeString === "00:00:00") return "-";

    const parts = String(timeString).split(":");
    if (parts.length < 2) return String(timeString);

    const hour = Number(parts[0]);
    const minutes = parts[1];

    if (Number.isNaN(hour)) return String(timeString);

    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;

    return `${formattedHour}:${minutes} ${suffix}`;
  };

  const formatMode = (mode) => {
    if (mode === null || mode === undefined || mode === "") return "-";

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
  };

  const filteredSchedule = useMemo(() => {
    const keyword = search.trim().toLowerCase();

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
        String(value).toLowerCase().includes(keyword)
      );
    });
  }, [schedule, search]);

  return (
    <div className="schedule-page">
      <Header />

      <main ref={mainScrollRef} className="schedule-main">
        <div className="schedule-wrapper">
          <div className="schedule-header sibs-page-header-in">
            <div className="schedule-title-block">
              <div className="schedule-title-row">
                <CalendarDays size={40} className="schedule-title-icon" />

                <h1>My Schedule</h1>
              </div>

              <p>View your work schedule</p>
            </div>

            <div className="schedule-search sibs-profile-tab-panel">
              <Search size={18} className="schedule-search-icon" />

              <input
                type="text"
                placeholder="Search schedule..."
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>

          <section className="schedule-card sibs-profile-tab-panel">
            <div className="schedule-table-wrap" ref={tableScrollRef}>
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Login</th>
                    <th>Break Out</th>
                    <th>Break In</th>
                    <th>Logout</th>
                    <th>Registered</th>
                  </tr>
                </thead>

                <tbody key={`${page}-${search}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="schedule-empty">
                        <div className="schedule-empty-box">Loading...</div>
                      </td>
                    </tr>
                  ) : filteredSchedule.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="schedule-empty">
                        <div className="schedule-empty-box">
                          No schedule found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSchedule.map((item, index) => (
                      <tr
                        key={item.gy_sched_id || index}
                        className="schedule-row-animated"
                        style={{
                          animationDelay: `${Math.min(index * 30, 300)}ms`,
                        }}
                      >
                        <td>{formatDate(item.gy_sched_day)}</td>

                        <td
                          className={
                            String(item.gy_sched_mode) === "0" ? "day-off" : ""
                          }
                        >
                          {formatMode(item.gy_sched_mode)}
                        </td>

                        <td>{formatTime(item.gy_sched_login)}</td>
                        <td>{formatTime(item.gy_sched_breakout)}</td>
                        <td>{formatTime(item.gy_sched_breakin)}</td>
                        <td>{formatTime(item.gy_sched_logout)}</td>
                        <td>{formatDate(item.gy_sched_reg)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="schedule-footer">
              <div className="schedule-page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>

              <div className="schedule-pagination">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="schedule-nav-btn"
                >
                  Prev
                </button>

                {renderPagination()}

                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, pagination.totalPages))
                  }
                  disabled={page === pagination.totalPages}
                  className="schedule-nav-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        .schedule-page {
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--sibs-tertiary-10);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .schedule-main {
          min-width: 0;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          background: var(--sibs-tertiary-10);
        }

        .schedule-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }

        .schedule-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .schedule-title-block {
          min-width: 0;
        }

        .schedule-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .schedule-title-icon {
          flex-shrink: 0;
          color: var(--sibs-primary-1);
          transition: transform 0.25s ease;
        }

        .schedule-title-row:hover .schedule-title-icon {
          transform: scale(1.08);
        }

        .schedule-title-row h1 {
          margin: 0;
          color: var(--sibs-primary-1);
          font-size: 40px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .schedule-title-block p {
          margin: 4px 0 0;
          color: var(--sibs-primary-1);
          font-size: 14px;
          font-weight: 400;
        }

        .schedule-search {
          position: relative;
          width: 290px;
          flex-shrink: 0;
        }

        .schedule-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--sibs-primary-1);
          pointer-events: none;
          transition: transform 0.2s ease;
        }

        .schedule-search:focus-within .schedule-search-icon {
          transform: translateY(-50%) scale(1.08);
        }

        .schedule-search input {
          width: 100%;
          height: 48px;
          border-radius: 999px;
          border: 1px solid var(--sibs-tertiary-8);
          background: #ffffff;
          padding: 0 18px 0 46px;
          color: var(--sibs-primary-1);
          font-size: 14px;
          font-weight: 500;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .schedule-search input::placeholder {
          color: #9ca3af;
        }

        .schedule-search input:hover {
          border-color: rgba(4, 44, 81, 0.35);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.06);
        }

        .schedule-search input:focus {
          border-color: var(--sibs-primary-1);
          box-shadow: 0 0 0 4px rgba(4, 44, 81, 0.08);
          transform: translateY(-1px);
        }

        .schedule-card {
          overflow: hidden;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .schedule-card:hover {
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }

        .schedule-table-wrap {
          max-height: 620px;
          overflow: auto;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          color: var(--sibs-primary-1);
        }

        .schedule-table thead {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #f3f4f6;
        }

        .schedule-table th {
          padding: 14px 12px;
          text-align: left;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
        }

        .schedule-table td {
          padding: 13px 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          font-weight: 400;
          color: var(--sibs-primary-1);
          white-space: nowrap;
        }

        .schedule-table tbody tr {
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .schedule-table tbody tr:hover {
          background: #f9fafb;
        }

        .schedule-table .day-off {
          color: #ef4444;
          font-weight: 600;
        }

        .schedule-empty {
          padding: 32px !important;
          text-align: center;
          color: #6b7280 !important;
        }

        .schedule-empty-box {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--sibs-tertiary-10);
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          animation: sibsProfileTabPanelIn 240ms ease-out both;
        }

        .schedule-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-top: 1px solid #e5e7eb;
          padding: 16px;
          background: #ffffff;
        }

        .schedule-page-info {
          color: #6b7280;
          font-size: 14px;
          font-weight: 400;
        }

        .schedule-pagination {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .schedule-nav-btn,
        .schedule-page-btn {
          min-width: 34px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: var(--sibs-primary-1);
          padding: 0 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .schedule-nav-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .schedule-page-btn.active {
          background: var(--sibs-primary-1);
          border-color: var(--sibs-primary-1);
          color: #ffffff;
          box-shadow: 0 6px 14px rgba(4, 44, 81, 0.18);
        }

        .schedule-page-btn:hover:not(.active),
        .schedule-nav-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: rgba(4, 44, 81, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
        }

        .schedule-page-btn:active,
        .schedule-nav-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .schedule-pagination-dots {
          color: #9ca3af;
          padding: 0 4px;
          font-size: 14px;
        }

        .schedule-row-animated {
          animation: sibsProfileTabPanelIn 240ms ease-out both;
          will-change: opacity, transform;
        }

        @media (max-width: 1024px) {
          .schedule-header {
            align-items: stretch;
            flex-direction: column;
          }

          .schedule-search {
            width: 100%;
          }

          .schedule-table-wrap {
            overflow-x: auto;
          }

          .schedule-table {
            min-width: 900px;
          }
        }

        @media (max-width: 640px) {
          .schedule-main {
            padding: 16px;
          }

          .schedule-title-row h1 {
            font-size: 32px;
          }

          .schedule-title-icon {
            width: 32px;
            height: 32px;
          }

          .schedule-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}