import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Briefcase,
  ClipboardList,
  Calendar,
  Gift,
  Plus,
  UserPlus,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";

import Header from "../../components/layout/Header";
import AdminLoginModal from "../../components/modals/AdminLoginModal";
import { useUser } from "../../services/context/UserContext";
import { useAdmin } from "../../services/context/AdminContext";

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const { ADMIN_ROLES } = useAdmin();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (ADMIN_ROLES.includes(user.role)) {
      navigate("/dashboard/admin", { replace: true });
      return;
    }

    if (user.role !== "employee") {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate, ADMIN_ROLES]);

  const displayName = (
    `${user?.lastName || ""}${user?.lastName ? ", " : ""}${
      user?.firstName || ""
    }${user?.middleName ? " " + user.middleName : ""}`.trim() || "User"
  ).toUpperCase();

  if (loading || !user || user.role !== "employee") {
    return (
      <div className="employee-dashboard-page">
        <Header />

        <main className="employee-dashboard-main">
          <div className="mb-4 h-10 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-80 animate-pulse rounded bg-gray-200" />
        </main>

        <AdminLoginModal />
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Employees",
      icon: FileText,
      value: 0,
    },
    {
      label: "Departments",
      icon: Briefcase,
      value: 0,
    },
    {
      label: "Attendance",
      icon: ClipboardList,
      value: 0,
    },
    {
      label: "Interviews Today",
      icon: Calendar,
      value: 0,
    },
    {
      label: "Payroll",
      icon: Gift,
      value: 0,
    },
  ];

  const quickActions = [
    {
      title: "Add Employee",
      desc: "Create employee profile",
      icon: UserPlus,
    },
    {
      title: "Create Department",
      desc: "Manage departments",
      icon: Plus,
    },
    {
      title: "Attendance",
      desc: "Track attendance",
      icon: ClipboardList,
    },
    {
      title: "View Reports",
      desc: "Analytics & insights",
      icon: BarChart3,
    },
  ];

  return (
    <div className="employee-dashboard-page">
      <Header />

      <main className="employee-dashboard-main">
        {/* TITLE */}
        <section className="employee-dashboard-title-section">
          <div className="employee-dashboard-title-row">
            <LayoutDashboard size={30} className="employee-dashboard-title-icon" />

            <h1 className="employee-dashboard-title">
              My Dashboard
            </h1>
          </div>

          <p className="employee-dashboard-welcome">
            Welcome back,{" "}
            <span>
              {displayName}
            </span>
          </p>
        </section>

        {/* SUMMARY CARDS */}
        <section className="employee-summary-grid">
          {summaryCards.map((item, index) => (
            <div key={index} className="employee-summary-card">
              <div className="employee-card-icon">
                <item.icon size={18} />
              </div>

              <div>
                <p className="employee-card-label">{item.label}</p>
                <h2 className="employee-card-value">{item.value}</h2>
              </div>
            </div>
          ))}
        </section>

        {/* ACTIVITY + NOTIFICATIONS */}
        <section className="employee-info-grid">
          <div className="employee-info-card">
            <h3>Recent Activity</h3>
            <p>No activity yet</p>

            <button type="button">
              View all activity
            </button>
          </div>

          <div className="employee-info-card">
            <h3>Notifications</h3>
            <p>No notifications</p>

            <button type="button">
              View all notifications
            </button>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="employee-quick-section">
          <h3 className="employee-quick-title">Quick Actions</h3>

          <div className="employee-quick-grid">
            {quickActions.map((item, index) => (
              <div key={index} className="employee-quick-card">
                <div className="employee-card-icon">
                  <item.icon size={18} />
                </div>

                <div>
                  <p className="employee-quick-name">{item.title}</p>
                  <p className="employee-quick-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AdminLoginModal />

      <style>{`
        .employee-dashboard-page {
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--sibs-tertiary-10);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .employee-dashboard-main {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: var(--sibs-tertiary-10);
        }

        .employee-dashboard-title-section {
          margin-bottom: 24px;
        }

        .employee-dashboard-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .employee-dashboard-title-icon {
          color: var(--sibs-primary-1);
        }

        .employee-dashboard-title {
          margin: 0;
          color: var(--sibs-primary-1);
          font-size: 36px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .employee-dashboard-welcome {
          margin-top: 6px;
          color: var(--sibs-primary-1);
          font-size: 14px;
          font-weight: 400;
        }

        .employee-dashboard-welcome span {
          color: var(--sibs-primary-2);
          font-weight: 500;
        }

        .employee-summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .employee-summary-card {
          min-height: 76px;
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .employee-card-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--sibs-primary-1);
          color: #ffffff;
        }

        .employee-card-label {
          margin: 0;
          color: var(--sibs-primary-1);
          font-size: 12px;
          font-weight: 500;
          line-height: 1.2;
        }

        .employee-card-value {
          margin: 2px 0 0;
          color: var(--sibs-primary-1);
          font-size: 20px;
          line-height: 1;
          font-weight: 800;
        }

        .employee-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .employee-info-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .employee-info-card h3 {
          margin: 0 0 10px;
          color: var(--sibs-primary-1);
          font-size: 16px;
          font-weight: 800;
        }

        .employee-info-card p {
          margin: 0 0 16px;
          color: var(--sibs-primary-1);
          font-size: 14px;
          font-weight: 400;
        }

        .employee-info-card button {
          width: 100%;
          height: 38px;
          border-radius: 8px;
          border: 1px solid var(--sibs-tertiary-9);
          background: #ffffff;
          color: var(--sibs-primary-1);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .employee-info-card button:hover {
          background: var(--sibs-tertiary-10);
        }

        .employee-quick-section {
          margin-top: 4px;
        }

        .employee-quick-title {
          margin: 0 0 14px;
          color: var(--sibs-primary-1);
          font-size: 16px;
          font-weight: 800;
        }

        .employee-quick-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .employee-quick-card {
          min-height: 76px;
          background: #ffffff;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .employee-quick-card:hover {
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }

        .employee-quick-name {
          margin: 0;
          color: var(--sibs-primary-1);
          font-size: 14px;
          line-height: 1.2;
          font-weight: 800;
        }

        .employee-quick-desc {
          margin: 2px 0 0;
          color: var(--sibs-primary-1);
          font-size: 12px;
          line-height: 1.2;
          font-weight: 400;
        }

        @media (max-width: 1280px) {
          .employee-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .employee-quick-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .employee-dashboard-main {
            padding: 20px;
          }

          .employee-dashboard-title {
            font-size: 30px;
          }

          .employee-summary-grid,
          .employee-info-grid,
          .employee-quick-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}