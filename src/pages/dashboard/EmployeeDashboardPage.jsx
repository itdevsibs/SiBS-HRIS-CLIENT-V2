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
  ArrowRight,
  Bell,
  Activity,
} from "lucide-react";

import Header from "../../components/layout/Header";
import AdminLoginModal from "../../components/modals/AdminLoginModal";
import { useUser } from "../../services/context/UserContext";
import { useAdmin } from "../../services/context/AdminContext";

function SummaryCard({
  label,
  value,
  icon: Icon,
  valueClassName = "text-sibs-primary-1",
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

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ title, description, icon: Icon, buttonText, delay = 0 }) {
  return (
    <div
      className="sibs-profile-tab-panel rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-bold text-[#101828]">{title}</h3>

          <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2F6FA] text-sibs-primary-1">
          <Icon size={20} />
        </div>
      </div>

      <button
        type="button"
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1 hover:bg-sibs-primary-1/5 hover:shadow-sm active:scale-[0.98]"
      >
        {buttonText}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function QuickActionCard({ title, desc, icon: Icon, delay = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sibs-page-card-in group flex min-h-[74px] w-full items-center justify-between gap-4 rounded-2xl border border-[#E6ECF2] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sibs-primary-1/20 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sibs-primary-1 text-white transition-transform duration-200 group-hover:scale-105">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-extrabold text-sibs-primary-1">
            {title}
          </p>

          <p className="mt-0.5 truncate text-xs font-medium text-sibs-tertiary-5">
            {desc}
          </p>
        </div>
      </div>

      <ArrowRight
        size={18}
        className="shrink-0 text-sibs-primary-1 transition-transform duration-200 group-hover:translate-x-1"
      />
    </button>
  );
}

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
      onClick: () => navigate("/attendance"),
    },
    {
      title: "View Reports",
      desc: "Analytics and insights",
      icon: BarChart3,
    },
  ];

  if (loading || !user || user.role !== "employee") {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
        <Header />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-6">
            <section className="sibs-page-header-in">
              <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded bg-gray-200" />
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="mt-3 h-8 w-12 animate-pulse rounded bg-gray-200" />
                    </div>

                    <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </main>

        <AdminLoginModal />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="sibs-page-header-in flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <LayoutDashboard
                  size={34}
                  strokeWidth={2.2}
                  className="shrink-0 text-sibs-primary-1 transition-transform duration-300 group-hover:scale-105"
                />

                <h1 className="m-0 break-words text-[28px] font-bold leading-tight tracking-[-0.9px] text-sibs-primary-1 sm:text-[32px] xl:text-[38px]">
                  My Dashboard
                </h1>
              </div>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Welcome back,{" "}
                <span className="font-extrabold text-sibs-primary-2">
                  {displayName}
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5">
            <div>
              <h2 className="text-base font-bold text-[#101828]">
                Dashboard Summary
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Overview of your HRIS records, attendance, payroll, and tasks.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {summaryCards.map((item, index) => (
                <SummaryCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  delay={index * 60}
                />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InfoPanel
              title="Recent Activity"
              description="No activity yet"
              buttonText="View all activity"
              icon={Activity}
              delay={90}
            />

            <InfoPanel
              title="Notifications"
              description="No notifications"
              buttonText="View all notifications"
              icon={Bell}
              delay={150}
            />
          </section>

          <section
            className="sibs-profile-tab-panel rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm sm:p-5"
            style={{ animationDelay: "210ms" }}
          >
            <div>
              <h2 className="text-base font-bold text-[#101828]">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Common employee shortcuts for HRIS tasks.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((item, index) => (
                <QuickActionCard
                  key={item.title}
                  title={item.title}
                  desc={item.desc}
                  icon={item.icon}
                  delay={index * 60}
                  onClick={item.onClick}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <AdminLoginModal />
    </div>
  );
}