import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ClipboardCheck,
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
import { getApprovalRequestsByModule } from "../../lib/axios/getApprovalRequest";

const APPROVAL_MODULES = ["Attrition", "Job Description", "Hiring Needs"];

const APPROVAL_NOTIFICATION_TYPES_BY_MODULE = {
  Attrition: ["Resignation", "Attrition"],
  "Job Description": ["Job Description"],
  "Hiring Needs": ["Hiring Needs"],
};

function normalizeApprovalNotificationStatus(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (cleanValue === "approved") return "Approved";
  if (cleanValue === "for review") return "For Review";
  if (cleanValue === "rejected") return "Rejected";
  if (cleanValue === "declined") return "Rejected";
  if (cleanValue === "retained") return "Rejected";
  if (cleanValue === "pending") return "Pending";

  return "Pending";
}

function getApprovalNotificationStatus(item = {}) {
  const raw = item.raw || {};

  return normalizeApprovalNotificationStatus(
    item.status ||
      item.recruitmentSettingsStatus ||
      item.recruitment_settings_status ||
      item.updateHeadcountStatus ||
      item.update_headcount_status ||
      raw.status ||
      raw.recruitmentSettingsStatus ||
      raw.recruitment_settings_status ||
      raw.updateHeadcountStatus ||
      raw.update_headcount_status ||
      "",
  );
}

function getApprovalNotificationKey(moduleName, item = {}) {
  return [
    moduleName,
    item.source || item.module || "approval",
    item.rawId || item.raw_id || item.id || "",
    item.type || item.requestType || item.request_type || "",
  ].join("::");
}

function countApprovalNotificationData(moduleName, data = []) {
  const uniqueItems = new Map();

  data.forEach((item) => {
    const key = getApprovalNotificationKey(moduleName, item);

    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  });

  return Array.from(uniqueItems.values()).filter((item) => {
    const status = getApprovalNotificationStatus(item);

    return status === "Pending" || status === "For Review";
  }).length;
}

async function getApprovalNotificationCountByModule(moduleName) {
  const types = APPROVAL_NOTIFICATION_TYPES_BY_MODULE[moduleName] || [""];

  const results = await Promise.allSettled(
    types.map((type) =>
      getApprovalRequestsByModule(moduleName, {
        page: 1,
        limit: 500,
        search: "",
        status: "",
        type,
      }),
    ),
  );

  const fulfilledResults = results
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value)
    .filter((result) => result?.success);

  const mergedData = fulfilledResults.flatMap((result) =>
    Array.isArray(result?.data) ? result.data : [],
  );

  if (mergedData.length > 0) {
    return countApprovalNotificationData(moduleName, mergedData);
  }

  return fulfilledResults.reduce((sum, result) => {
    const counts = result?.counts || {};

    return sum + Number(counts.pending || 0) + Number(counts.forReview || 0);
  }, 0);
}

function SibsLogo({ collapsed = false, isMobile = false }) {
  const showText = !collapsed || isMobile;

  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ scale: 1.025 }}
      className={[
        "flex min-w-0 select-none items-center",
        showText ? "gap-3" : "justify-center",
      ].join(" ")}
    >
      <motion.div
        whileHover={{ rotate: -3, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] bg-[#042C51] shadow-[0_10px_24px_rgba(4,44,81,0.20)]"
      >
        <motion.div
          className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-sibs-tertiary-10"
          animate={{
            backgroundColor: ["#FF5C28", "#042C51", "#FF5C28"],
            boxShadow: [
              "0 0 0px rgba(255,92,40,0)",
              "0 0 14px rgba(255,92,40,0.40)",
              "0 0 0px rgba(255,92,40,0)",
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="absolute inset-[5px] rounded-[13px] border border-white/10" />

        <motion.span
          className="relative text-[20px] font-semibold leading-none tracking-[-0.04em] text-white"
          animate={{
            textShadow: [
              "0 0 0px rgba(255,255,255,0)",
              "0 0 10px rgba(255,255,255,0.32)",
              "0 0 0px rgba(255,255,255,0)",
            ],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          S
        </motion.span>
      </motion.div>

      {showText && (
        <div className="min-w-0 leading-none">
          <div className="flex min-w-0 items-baseline whitespace-nowrap">
            <motion.span
              className="text-[22px] font-semibold tracking-[-0.035em]"
              animate={{
                color: ["#042C51", "#FF5C28", "#042C51"],
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
              className="text-[22px] font-semibold tracking-[-0.035em]"
              animate={{
                color: ["#FF5C28", "#042C51", "#FF5C28"],
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
          </div>

          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-sibs-tertiary-5">
            Human Resource System
          </p>
        </div>
      )}
    </motion.div>
  );
}

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

  const [
    approvalRequestNotificationCount,
    setApprovalRequestNotificationCount,
  ] = useState(0);

  const loadApprovalRequestNotifications = useCallback(async () => {
    try {
      const moduleCounts = await Promise.all(
        APPROVAL_MODULES.map((moduleName) =>
          getApprovalNotificationCountByModule(moduleName),
        ),
      );

      const totalPending = moduleCounts.reduce(
        (sum, count) => sum + Number(count || 0),
        0,
      );

      setApprovalRequestNotificationCount(totalPending);
    } catch (error) {
      console.error("Sidebar approval request notification error:", error);
      setApprovalRequestNotificationCount(0);
    }
  }, []);

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

  useEffect(() => {
    if (!mounted || loading || !user) return;
    if (!ADMIN_ROLES.includes(user.role)) return;

    loadApprovalRequestNotifications();

    const interval = window.setInterval(() => {
      loadApprovalRequestNotifications();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    mounted,
    loading,
    user,
    pathname,
    ADMIN_ROLES,
    loadApprovalRequestNotifications,
  ]);

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
      name: "Resignation Management",
      icon: FileText,
      path: "/resignation",
      allowedUsers: [1, 2, 3, 4, 5, 6, 7],
    },
  ];

  const recruitmentMenu = [
    {
      name: "Workforce & Hiring Overview",
      icon: CalendarDays,
      path: "/recruitment/workforce-hiring-overview",
      allowedUsers: [1, 2, 3, 5, 6, 7],
    },
    {
      name: "Workforce & Hiring Plan",
      icon: CalendarDays,
      path: "/recruitment/workforce-hiring-plan",
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
      name: "Approval Requests",
      icon: ClipboardCheck,
      path: "/approval-request",
      allowedUsers: [3, 4, 5, 6, 7],
      notificationCount: approvalRequestNotificationCount,
    },
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

      const notificationCount = Number(item.notificationCount || 0);
      const hasNotification = notificationCount > 0;

      return (
        <Link
          key={`${item.name}-${index}`}
          to={item.path}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onClick={handleLinkClick}
          title={!isMobile && collapsed ? item.name : ""}
          className={[
            "group relative flex min-w-0 select-none items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-normal transition",
            "text-sibs-tertiary-5 hover:bg-sibs-tertiary-9 hover:text-sibs-primary-1",
            isActive ? "bg-sibs-tertiary-9 text-sibs-primary-1" : "",
            !isMobile && collapsed ? "justify-center px-2" : "",
          ].join(" ")}
        >
          <div className="relative shrink-0">
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

            {hasNotification && collapsed && !isMobile && (
              <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-sibs-tertiary-10" />
            )}
          </div>

          {(!collapsed || isMobile) && (
            <>
              <span
                draggable={false}
                className="pointer-events-none min-w-0 flex-1 truncate"
              >
                {item.name}
              </span>

              {hasNotification && (
                <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </>
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

      {isMobile && !mobileOpen && (
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
        onDragStart={(event) => event.preventDefault()}
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
        <div
          className={[
            "flex h-[73px] shrink-0 items-center gap-2 px-4",
            !isMobile && collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          <SibsLogo collapsed={!isMobile && collapsed} isMobile={isMobile} />

          {(!collapsed || isMobile) && (
            <button
              onClick={() => {
                if (isMobile) {
                  setMobileOpen(false);
                } else {
                  setCollapsed((prev) => !prev);
                }
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-sibs-tertiary-9 active:scale-[0.98]"
              type="button"
              aria-label={isMobile ? "Close sidebar" : "Toggle sidebar"}
            >
              {isMobile ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          {!isMobile && collapsed && (
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="absolute right-3 top-[20px] flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sibs-primary-1 transition hover:bg-sibs-tertiary-9 active:scale-[0.98]"
              type="button"
              aria-label="Expand sidebar"
            >
              <Menu size={17} />
            </button>
          )}
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
                    title="COMMUNICATIONS"
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
