import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  CircleUser,
  ClipboardList,
  Clock,
  DollarSign,
  FileClock,
  FileCog,
  FileText,
  Gift,
  LayoutDashboard,
  MapPin,
  Menu,
  PieChart,
  Shield,
  Table2,
  Users,
  X,
} from "lucide-react";
import { useUser } from "../../services/context/UserContext";

export default function Sidebar() {
  const { user, loading } = useUser();

  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const ADMIN_ROLES = useMemo(
    () => [
      "ta",
      "hr",
      "hr_admin",
      "finance",
      "manager",
      "executive",
      "super_admin",
    ],
    [],
  );

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [mounted, user, loading, navigate]);

  useEffect(() => {
    if (!mounted || loading || !user) return;

    if (user.role === "employee") {
      const allowed = [
        "/dashboard/employee",
        "/attendance",
        "/leaves",
        "/profile",
        "/profile/user",
        "/schedule",
        "/resignation",
      ];

      const ok = allowed.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      );

      if (!ok) {
        navigate("/dashboard/employee", { replace: true });
      }

      return;
    }

    if (
      ADMIN_ROLES.includes(user.role) &&
      pathname.startsWith("/dashboard/employee")
    ) {
      navigate("/dashboard/admin", { replace: true });
    }
  }, [mounted, user, loading, pathname, navigate, ADMIN_ROLES]);

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!mounted) return;

    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, mounted]);

  const employeeCoreMenu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard/employee",
    },
    {
      name: "Profile",
      icon: CircleUser,
      path: "/profile/user",
    },
    {
      name: "Attendance",
      icon: Clock,
      path: "/attendance",
    },
    {
      name: "My Schedule",
      icon: CalendarDays,
      path: "/schedule",
    },
    {
      name: "Leaves",
      icon: Calendar,
      path: "/leaves",
    },
  ];

  const adminCoreMenu = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard/admin",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "TA Dashboard",
      icon: LayoutDashboard,
      path: "/recruitment/ta-dashboard",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "OM Dashboard",
      icon: LayoutDashboard,
      path: "/recruitment/om-dashboard",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Employees",
      icon: Users,
      path: "/employee",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Attendance",
      icon: Clock,
      path: "/attendance",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Leaves",
      icon: Calendar,
      path: "/leaves",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Attrition",
      icon: FileText,
      path: "/attrition",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
  ];

  const recruitmentMenu = [
    {
      name: "Weekly Hiring Plan",
      icon: CalendarDays,
      path: "/recruitment/weekly-hiring-plan",
      allowedUsers: [1, 2, 3, 5, 6, 7],
    },
    {
      name: "Job Description",
      icon: ClipboardList,
      path: "/recruitment/job-description",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Hiring Needs Intake",
      icon: FileText,
      path: "/recruitment/hiring-needs",
      allowedUsers: [1, 2, 3, 5, 6, 7],
    },
    {
      name: "Available Positions",
      icon: BriefcaseBusiness,
      path: "/recruitment/available-positions",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Sourcing Analytics",
      icon: BarChart3,
      path: "/recruitment/sourcing-analytics",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Talent Pool",
      icon: Users,
      path: "/recruitment/talent-pool",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Candidate Pipeline",
      icon: Table2,
      path: "/recruitment/candidate-pipeline",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Offers",
      icon: Gift,
      path: "/recruitment/offers",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Onboarding",
      icon: ClipboardList,
      path: "/recruitment/onboarding",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Action Items",
      icon: Activity,
      path: "/recruitment/action-items",
      allowedUsers: [1, 2, 3, 6, 7],
    },
    {
      name: "Weekly Reports",
      icon: FileClock,
      path: "/recruitment/weekly-reports",
      allowedUsers: [1, 2, 3, 5, 6, 7],
    },
    {
      name: "Candidate Experience",
      icon: BookOpen,
      path: "/recruitment/candidate-experience",
      allowedUsers: [1, 2, 3, 6, 7],
    },
  ];

  const settingsMenu = [
    {
      name: "Recruitment Settings",
      icon: FileCog,
      path: "/settings/recruitment-settings",
      allowedUsers: [1, 2, 3, 6, 7],
    },
  ];

  const communicationMenu = [
    {
      name: "Email Logs",
      icon: FileClock,
      path: "/email-logs",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
  ];

  const analyticsMenu = [
    {
      name: "Reports",
      icon: BarChart3,
      path: "/reports",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Analytics",
      icon: PieChart,
      path: "/analytics",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
    {
      name: "Costs",
      icon: DollarSign,
      path: "/costs",
      allowedUsers: [4, 5, 6, 7],
    },
    {
      name: "Payroll",
      icon: DollarSign,
      path: "/payroll",
      allowedUsers: [4, 5, 6, 7],
    },
  ];

  const administrationMenu = [
    {
      name: "Departments",
      icon: Building2,
      path: "/departments",
      allowedUsers: [5, 6, 7],
    },
    {
      name: "Office Locations",
      icon: MapPin,
      path: "/locations",
      allowedUsers: [5, 6, 7],
    },
    {
      name: "User Management",
      icon: Shield,
      path: "/users",
      allowedUsers: [7],
    },
  ];

  const isAdminSide = ADMIN_ROLES.includes(user?.role);
  const coreMenu = isAdminSide ? adminCoreMenu : employeeCoreMenu;
  const coreSectionTitle = isAdminSide ? "CORE HR" : "EMPLOYEE ACCESS";
  const coreSectionShort = isAdminSide ? "HR" : "EMP";

  const getVisibleItems = (items) =>
    items.filter((item) =>
      item.allowedUsers ? item.allowedUsers.includes(user?.adminAccess) : true,
    );

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const renderMenu = (items) =>
    getVisibleItems(items).map((item, index) => {
      const Icon = item.icon;

      const isActive =
        pathname === item.path || pathname.startsWith(`${item.path}/`);

      return (
        <Link
          key={`${item.name}-${index}`}
          to={item.path}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onClick={handleLinkClick}
          title={!isMobile && collapsed ? item.name : ""}
          className={[
            "group flex min-w-0 select-none items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-normal transition",
            "text-sibs-tertiary-5 hover:bg-sibs-tertiary-9 hover:text-sibs-primary-1",
            isActive ? "bg-sibs-tertiary-9 text-sibs-primary-1" : "",
            !isMobile && collapsed ? "justify-center px-2" : "",
          ].join(" ")}
        >
          <Icon
            size={18}
            strokeWidth={1.9}
            draggable={false}
            className={[
              "pointer-events-none shrink-0 transition",
              isActive
                ? "text-sibs-primary-1"
                : "text-sibs-tertiary-5 group-hover:text-sibs-primary-1",
            ].join(" ")}
          />

          {(!collapsed || isMobile) && (
            <span draggable={false} className="pointer-events-none min-w-0 truncate">
              {item.name}
            </span>
          )}
        </Link>
      );
    });

  const showMenu = mounted && !loading && !!user;

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[998] bg-black/40 lg:hidden"
        />
      )}

      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-[1001] rounded-xl border border-sibs-tertiary-9 bg-white p-2 shadow-sm lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} className="text-sibs-primary-1" />
        </button>
      )}

      <aside
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={[
          "fixed left-0 top-0 z-[1000] flex h-dvh shrink-0 select-none flex-col border-r border-[#C9D6E4] bg-sibs-tertiary-10 transition-all duration-300",
          !isMobile && collapsed ? "w-20" : "w-[260px]",
          isMobile
            ? mobileOpen
              ? "translate-x-0 shadow-2xl"
              : "-translate-x-full"
            : "translate-x-0",
          "lg:sticky lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-[73px] shrink-0 items-center justify-between gap-2 px-4">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.04 }}
            className="flex min-w-0 select-none items-center gap-2"
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-800 text-[11px] font-semibold text-white">
              S
            </div>

            {(!collapsed || isMobile) && (
              <span className="inline-flex min-w-0 select-none whitespace-nowrap text-xl font-bold tracking-tight">
                <motion.span
                  animate={{
                    color: ["#003366", "#ff6b00", "#003366"],
                    textShadow: [
                      "0 0 0px rgba(255,255,255,0)",
                      "0 0 6px rgba(255,255,255,0.35)",
                      "0 0 0px rgba(255,255,255,0)",
                    ],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  SiBS&nbsp;
                </motion.span>

                <motion.span
                  animate={{
                    color: ["#ff6b00", "#003366", "#ff6b00"],
                    textShadow: [
                      "0 0 0px rgba(255,255,255,0)",
                      "0 0 6px rgba(255,255,255,0.35)",
                      "0 0 0px rgba(255,255,255,0)",
                    ],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  HRIS
                </motion.span>
              </span>
            )}
          </motion.div>

          <button
            onClick={() => {
              if (isMobile) {
                setMobileOpen(false);
              } else {
                setCollapsed((prev) => !prev);
              }
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sibs-primary-1 transition hover:bg-sibs-tertiary-9"
            type="button"
            aria-label={isMobile ? "Close sidebar" : "Toggle sidebar"}
          >
            {isMobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {!showMenu ? (
          <div className="space-y-3 px-4 pt-4">
            <div className="h-8 animate-pulse rounded-lg bg-sibs-tertiary-9" />
            <div className="h-8 animate-pulse rounded-lg bg-sibs-tertiary-9" />
            <div className="h-8 animate-pulse rounded-lg bg-sibs-tertiary-9" />
            <div className="h-8 animate-pulse rounded-lg bg-sibs-tertiary-9" />
          </div>
        ) : (
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-5 pt-2">
            <Section
              title={coreSectionTitle}
              short={coreSectionShort}
              collapsed={!isMobile && collapsed}
            >
              {renderMenu(coreMenu)}
            </Section>

            {isAdminSide && (
              <>
                {getVisibleItems(recruitmentMenu).length > 0 && (
                  <Section
                    title="RECRUITMENT"
                    short="REC"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(recruitmentMenu)}
                  </Section>
                )}

                {getVisibleItems(communicationMenu).length > 0 && (
                  <Section
                    title="COMMUNICATION"
                    short="COM"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(communicationMenu)}
                  </Section>
                )}

                {getVisibleItems(analyticsMenu).length > 0 && (
                  <Section
                    title="ANALYTICS"
                    short="ANA"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(analyticsMenu)}
                  </Section>
                )}

                {getVisibleItems(administrationMenu).length > 0 && (
                  <Section
                    title="ADMINISTRATION"
                    short="ADM"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(administrationMenu)}
                  </Section>
                )}

                {getVisibleItems(settingsMenu).length > 0 && (
                  <Section
                    title="SETTINGS"
                    short="SET"
                    collapsed={!isMobile && collapsed}
                  >
                    {renderMenu(settingsMenu)}
                  </Section>
                )}
              </>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function Section({ title, short, collapsed, children }) {
  return (
    <section className="mb-4 select-none">
      <p
        className={[
          "mb-2 text-[12px] font-semibold uppercase text-sibs-tertiary-6",
          collapsed ? "text-center text-[10px]" : "",
        ].join(" ")}
      >
        {collapsed ? short : title}
      </p>

      <nav className="space-y-1">{children}</nav>
    </section>
  );
}