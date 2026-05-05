import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CalendarDays,
  CircleUser,
  ClipboardList,
  Clock,
  DollarSign,
  FileClock,
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
      name: "TA Dashboard",
      icon: LayoutDashboard,
      path: "/recruitment/ta-dashboard",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Weekly Hiring Plan",
      icon: CalendarDays,
      path: "/recruitment/weekly-hiring-plan",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Job Description",
      icon: ClipboardList,
      path: "/recruitment/job-description",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Hiring Needs Intake",
      icon: FileText,
      path: "/recruitment/hiring-needs",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Sourcing Analytics",
      icon: BarChart3,
      path: "/recruitment/sourcing-analytics",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Talent Pool",
      icon: Users,
      path: "/recruitment/talent-pool",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Candidate Pipeline",
      icon: Table2,
      path: "/recruitment/candidate-pipeline",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Offers",
      icon: Gift,
      path: "/recruitment/offers",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Onboarding",
      icon: ClipboardList,
      path: "/recruitment/onboarding",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Action Items",
      icon: Activity,
      path: "/recruitment/action-items",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Weekly Reports",
      icon: FileClock,
      path: "/recruitment/weekly-reports",
      allowedUsers: [1, 2, 3, 7],
    },
    {
      name: "Candidate Experience",
      icon: BookOpen,
      path: "/recruitment/candidate-experience",
      allowedUsers: [1, 2, 3, 7],
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
          onClick={handleLinkClick}
          title={!isMobile && collapsed ? item.name : ""}
          className={`sibs-sidebar-link ${isActive ? "active" : ""} ${
            !isMobile && collapsed ? "collapsed" : ""
          }`}
        >
          <Icon size={18} className="sibs-sidebar-link-icon" />
          {(!collapsed || isMobile) && (
            <span className="sibs-sidebar-link-text">{item.name}</span>
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
          className="sibs-sidebar-backdrop"
        />
      )}

      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="sibs-sidebar-mobile-toggle"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
      )}

      <aside
        className={[
          "sibs-sidebar",
          collapsed && !isMobile ? "collapsed" : "",
          isMobile ? "mobile" : "",
          isMobile && mobileOpen ? "mobile-open" : "",
        ].join(" ")}
      >
        <div className="sibs-sidebar-brand-row">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.04 }}
            className="sibs-sidebar-brand"
          >
            <div className="sibs-sidebar-logo-dot">S</div>

            {(!collapsed || isMobile) && (
              <span className="sibs-sidebar-logo-text">
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
            className="sibs-sidebar-toggle"
            type="button"
            aria-label={isMobile ? "Close sidebar" : "Toggle sidebar"}
          >
            {isMobile ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {!showMenu ? (
          <div className="sibs-sidebar-loading">
            <div />
            <div />
            <div />
            <div />
          </div>
        ) : (
          <div className="sibs-sidebar-scroll">
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
    <section className="sibs-sidebar-section">
      <p className={`sibs-sidebar-section-title ${collapsed ? "collapsed" : ""}`}>
        {collapsed ? short : title}
      </p>

      <nav className="sibs-sidebar-nav">{children}</nav>
    </section>
  );
}
