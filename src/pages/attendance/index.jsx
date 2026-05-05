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
                placeholder={
                  isEmployee ? "Search records..." : "Search employee..."
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="attendance-search-input"
              />
            </div>
          </div>

          <section className="attendance-table-card">
            <AttendanceTable />
          </section>
        </div>
      </main>
    </div>
  );
}