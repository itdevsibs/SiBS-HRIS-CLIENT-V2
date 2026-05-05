import { useEffect } from "react";
import { useRouter } from "@/lib/router";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  ClipboardList,
  Calendar,
  Gift,
  Plus,
  UserPlus,
  BarChart3,
  Bell,
  Activity,
  ArrowRight,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { useUser } from "../../../services/context/UserContext";
import { useAdmin } from "../../../services/context/AdminContext";

const dashboardTitleMap = {
  hr: "Human Resource Dashboard",
  ta: "Talent Acquisition Dashboard",
  hr_admin: "HR Admin Dashboard",
  super_admin: "Super Admin Dashboard",
};

const summaryCards = [
  {
    label: "Employees",
    icon: FileText,
    value: 0,
    description: "Total employees",
  },
  {
    label: "Departments",
    icon: Briefcase,
    value: 0,
    description: "Active departments",
  },
  {
    label: "Attendance",
    icon: ClipboardList,
    value: 0,
    description: "Today records",
  },
  {
    label: "Interviews Today",
    icon: Calendar,
    value: 0,
    description: "Scheduled interviews",
  },
  {
    label: "Payroll",
    icon: Gift,
    value: 0,
    description: "Payroll records",
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
    desc: "Analytics and insights",
    icon: BarChart3,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { ADMIN_ROLES } = useAdmin();

  const isAdminSide = ADMIN_ROLES.includes(user?.role);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      router.replace("/dashboard/employee");
    }
  }, [user, loading, router, ADMIN_ROLES]);

  if (loading || !user || !isAdminSide) {
    return (
      <div className="admin-dashboard-page">
        <Header />

        <main className="admin-dashboard-main">
          <div className="admin-dashboard-wrapper">
            <div className="admin-dashboard-skeleton-card">
              <div className="admin-dashboard-skeleton-title" />
              <div className="admin-dashboard-skeleton-subtitle" />
            </div>

            <div className="admin-dashboard-stats-grid">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="admin-dashboard-stat-card">
                  <div className="admin-dashboard-skeleton-icon" />

                  <div className="admin-dashboard-stat-text">
                    <div className="admin-dashboard-skeleton-label" />
                    <div className="admin-dashboard-skeleton-value" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fullName =
    [user?.firstName, user?.middleName, user?.lastName]
      .filter(Boolean)
      .join(" ") || "User";

  return (
    <div className="admin-dashboard-page">
      <Header />

      <main className="admin-dashboard-main">
        <div className="admin-dashboard-wrapper">
          <section className="admin-dashboard-title-section">
            <div className="admin-dashboard-title-row">
              <LayoutDashboard size={28} className="admin-dashboard-title-icon" />

              <h1>{dashboardTitleMap[user?.role] || "Dashboard"}</h1>
            </div>

            <p>
              Welcome back,{" "}
              <span>{fullName.toUpperCase()}</span>
            </p>
          </section>

          <section className="admin-dashboard-stats-grid">
            {summaryCards.map((item) => (
              <DashboardStatCard
                key={item.label}
                label={item.label}
                value={item.value}
                description={item.description}
                icon={item.icon}
              />
            ))}
          </section>

          <section className="admin-dashboard-panels-grid">
            <DashboardPanel
              title="Recent Activity"
              description="Latest system and employee activity"
              icon={Activity}
              emptyText="No activity yet"
              buttonText="View all activity"
            />

            <DashboardPanel
              title="Notifications"
              description="Important updates and pending items"
              icon={Bell}
              emptyText="No notifications"
              buttonText="View all notifications"
            />
          </section>

          <section className="admin-dashboard-quick-card">
            <div className="admin-dashboard-quick-header">
              <div>
                <h2>Quick Actions</h2>
                <p>Common admin shortcuts for HRIS tasks.</p>
              </div>
            </div>

            <div className="admin-dashboard-quick-grid">
              {quickActions.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="admin-dashboard-quick-button"
                >
                  <div className="admin-dashboard-icon-box">
                    <item.icon size={18} />
                  </div>

                  <div className="admin-dashboard-quick-text">
                    <p>{item.title}</p>
                    <span>{item.desc}</span>
                  </div>

                  <ArrowRight size={16} className="admin-dashboard-arrow" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function DashboardStatCard({ label, value, description, icon: Icon }) {
  return (
    <div className="admin-dashboard-stat-card">
      <div className="admin-dashboard-icon-box">
        <Icon size={18} />
      </div>

      <div className="admin-dashboard-stat-text">
        <p>{label}</p>
        <h2>{value}</h2>
        <span>{description}</span>
      </div>
    </div>
  );
}

function DashboardPanel({
  title,
  description,
  icon: Icon,
  emptyText,
  buttonText,
}) {
  return (
    <section className="admin-dashboard-panel">
      <div className="admin-dashboard-panel-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="admin-dashboard-icon-box">
          <Icon size={18} />
        </div>
      </div>

      <div className="admin-dashboard-empty-box">
        <p>{emptyText}</p>
      </div>

      <button type="button" className="admin-dashboard-panel-button">
        {buttonText}
      </button>
    </section>
  );
}