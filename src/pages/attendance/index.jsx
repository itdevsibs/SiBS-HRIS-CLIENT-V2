import { Search, Clock } from "lucide-react";

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import AttendanceTable from "../../components/tables/AttendanceTable";
import { usePagination } from "../../services/context/PaginationContext";

export default function AttendancePage() {
  const { user } = useUser();

  const { searchInput, setSearchInput, handleSearchKeyDown } =
    usePagination("attendance");

  const isEmployee = user?.role === "employee";
  const pageTitle = isEmployee ? "My Attendance" : "Attendance";

  return (
    <div className="attendance-page">
      <Header />

      <main className="attendance-main">
        <div className="attendance-wrapper">
          {/* PAGE HEADER */}
          <div className="attendance-header">
            <div className="attendance-title-area">
              <div className="attendance-icon-box">
                <Clock size={24} strokeWidth={2.2} />
              </div>

              <div className="attendance-title-text">
                <h1>{pageTitle}</h1>

                <p>
                  {isEmployee
                    ? "View your attendance records and details"
                    : "View attendance records of all employees"}
                </p>
              </div>
            </div>

            <div className="attendance-search-wrap">
              <Search size={18} className="attendance-search-icon" />

              <input
                type="text"
                placeholder={isEmployee ? "Search records..." : "Search employee..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="attendance-search-input"
              />
            </div>
          </div>

          {/* TABLE */}
          <section className="attendance-table-card">
            <AttendanceTable />
          </section>
        </div>
      </main>

      <style>{`
        .attendance-page {
          min-width: 0;
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--sibs-tertiary-10);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .attendance-main {
          min-width: 0;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          background: var(--sibs-tertiary-10);
        }

        .attendance-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
          min-width: 0;
        }

        .attendance-header {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .attendance-title-area {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .attendance-icon-box {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: var(--sibs-primary-1);
          color: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }

        .attendance-title-text {
          min-width: 0;
        }

        .attendance-title-text h1 {
          margin: 0;
          color: var(--sibs-primary-1);
          font-size: 36px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.8px;
          word-break: break-word;
        }

        .attendance-title-text p {
          margin: 4px 0 0;
          color: var(--sibs-tertiary-5);
          font-size: 14px;
          line-height: 1.4;
          font-weight: 500;
        }

        .attendance-search-wrap {
          position: relative;
          width: 320px;
          flex-shrink: 0;
        }

        .attendance-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--sibs-tertiary-5);
          pointer-events: none;
        }

        .attendance-search-input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #e6ecf2;
          background: #ffffff;
          padding: 0 16px 0 44px;
          color: #344054;
          font-size: 14px;
          font-weight: 600;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .attendance-search-input::placeholder {
          color: var(--sibs-tertiary-5);
          font-weight: 500;
        }

        .attendance-search-input:focus {
          border-color: var(--sibs-primary-1);
          box-shadow: 0 0 0 4px rgba(4, 44, 81, 0.1);
        }

        .attendance-table-card {
          min-width: 0;
          overflow: hidden;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
        }

        @media (max-width: 1024px) {
          .attendance-header {
            align-items: stretch;
            flex-direction: column;
          }

          .attendance-search-wrap {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .attendance-main {
            padding: 16px;
          }

          .attendance-title-area {
            align-items: flex-start;
          }

          .attendance-icon-box {
            width: 48px;
            height: 48px;
          }

          .attendance-title-text h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}