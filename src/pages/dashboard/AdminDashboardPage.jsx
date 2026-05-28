import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

import Header from "../../components/layout/Header";
import { useUser } from "../../services/context/UserContext";
import { useAdmin } from "../../services/context/AdminContext";

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const { ADMIN_ROLES } = useAdmin();

  const isAdminSide = ADMIN_ROLES.includes(user?.role);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      navigate("/dashboard/employee", { replace: true });
    }
  }, [user, loading, navigate, ADMIN_ROLES]);

  if (loading || !user || !isAdminSide) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
        <Header />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-6">
            <div className="sibs-page-header-in min-w-0">
              <div className="mb-4 h-8 w-56 max-w-full animate-sibs-pulse rounded-lg bg-gray-300" />
              <div className="h-4 w-72 max-w-full animate-sibs-pulse rounded-lg bg-gray-300" />
            </div>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <div className="mb-2 h-5 w-48 animate-sibs-pulse rounded-lg bg-gray-300" />
                <div className="h-4 w-80 max-w-full animate-sibs-pulse rounded-lg bg-gray-300" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {[1, 2, 3, 4, 5].map((item, index) => (
                  <div
                    key={item}
                    className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-4 h-3 w-24 animate-sibs-pulse rounded-lg bg-gray-300" />
                        <div className="h-8 w-14 animate-sibs-pulse rounded-lg bg-gray-300" />
                      </div>

                      <div className="h-12 w-12 shrink-0 animate-sibs-pulse rounded-2xl bg-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <div className="mb-2 h-5 w-36 animate-sibs-pulse rounded-lg bg-gray-300" />
                <div className="h-4 w-72 max-w-full animate-sibs-pulse rounded-lg bg-gray-300" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item, index) => (
                  <div
                    key={item}
                    className="sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-12 w-12 shrink-0 animate-sibs-pulse rounded-2xl bg-gray-300" />

                        <div className="min-w-0">
                          <div className="mb-2 h-4 w-28 animate-sibs-pulse rounded-lg bg-gray-300" />
                          <div className="h-3 w-32 animate-sibs-pulse rounded-lg bg-gray-300" />
                        </div>
                      </div>

                      <div className="h-4 w-4 shrink-0 animate-sibs-pulse rounded bg-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="sibs-page-header-in min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <LayoutDashboard
                size={28}
                className="shrink-0 text-sibs-primary-1 transition-transform duration-300 hover:scale-110"
              />

              <h1 className="min-w-0 break-words text-[26px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                {dashboardTitleMap[user?.role] || "Dashboard"}
              </h1>
            </div>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Welcome back,{" "}
              <span className="font-bold text-sibs-primary-2">
                {fullName.toUpperCase()}
              </span>
            </p>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#101828]">
                  Admin Dashboard Summary
                </h2>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  Overview of employees, departments, attendance, interviews,
                  and payroll records.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
              {summaryCards.map((item, index) => (
                <DashboardStatCard
                  key={item.label}
                  label={item.label}
                  value={formatNumber(item.value)}
                  icon={item.icon}
                  delay={index * 60}
                />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashboardPanel
              title="Recent Activity"
              description="Latest system and employee activity"
              icon={Activity}
              emptyText="No activity yet"
              buttonText="View all activity"
              delay={90}
            />

            <DashboardPanel
              title="Notifications"
              description="Important updates and pending items"
              icon={Bell}
              emptyText="No notifications"
              buttonText="View all notifications"
              delay={150}
            />
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#101828]">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  Common admin shortcuts for HRIS tasks.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className="group sibs-page-card-in rounded-2xl border border-[#E6ECF2] bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md active:scale-[0.99]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sibs-primary-1 text-white transition-transform duration-200 group-hover:scale-105">
                        <item.icon size={22} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-sibs-primary-1">
                          {item.title}
                        </p>

                        <p className="mt-0.5 truncate text-xs font-semibold text-sibs-tertiary-5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <ArrowRight
                      size={18}
                      className="shrink-0 text-sibs-primary-1 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function DashboardStatCard({
  label,
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
            {label}
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

function DashboardPanel({
  title,
  description,
  icon: Icon,
  emptyText,
  buttonText,
  delay = 0,
}) {
  return (
    <section
      className="sibs-profile-tab-panel rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-bold text-sibs-primary-1">
            {title}
          </h2>

          <p className="mt-0.5 text-sm font-normal text-sibs-tertiary-5">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-sibs-primary-1 text-white transition-transform duration-200 hover:scale-105">
          <Icon size={18} />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-[#e6ecf2] bg-slate-50 p-5 text-center transition-all duration-200 hover:bg-white hover:shadow-sm">
        <p className="m-0 text-sm font-semibold text-sibs-tertiary-5">
          {emptyText}
        </p>
      </div>

      <button
        type="button"
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#e6ecf2] bg-white text-sm font-semibold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98]"
      >
        {buttonText}
      </button>
    </section>
  );
}