import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  UserRoundX,
  X,
} from "lucide-react";

import Header from "../../components/layout/Header";
import AdminLoginModal from "../../components/modals/AdminLoginModal";
import ResignationModal from "../../components/modals/resignation/ResignationModal";
import { ViewResignationModal } from "../../components/modals/resignation-management/ResignationManagementModal";
import StatusModal from "../../components/modals/StatusModal";
import { getMyEmployeeProfilePicture } from "../../lib/axios/employeeProfile";
import { getEmployeeDashboardSources } from "../../lib/axios/getEmployeeDashboardData.js";
import { getMyResignationStatus } from "../../lib/axios/getMyResignationStatus.js";
import {
  cleanDashboardText,
  formatDashboardDate,
  formatPhtDate,
  formatPhtTime,
  getAttendanceSummaryFromResponses,
  getDashboardAnnouncements,
  getDashboardHolidays,
  getEmployeeDashboardProfile,
  getLeaveDashboardDataFromResponses,
  getProgressPercent,
  getWeeklyScheduleFromResponse,
} from "../../lib/utils/employeeDashboardHelpers.js";
import { useAdmin } from "../../services/context/AdminContext";
import { useUser } from "../../services/context/UserContext";
import { getDefaultDashboardPath } from "../../config/accessControl";

const MANILA_TIME_ZONE = "Asia/Manila";

const DASHBOARD_ROUTES = {
  profile: "/profile/user",
  attendance: "/attendance",
  schedule: "/schedule",
  leaves: "/leaves",
};

function getStatusTone(status = "") {
  const normalized = cleanDashboardText(status).toLowerCase();

  if (
    normalized.includes("not clocked") ||
    normalized.includes("logged out") ||
    normalized.includes("no punch") ||
    !normalized
  ) {
    return {
      wrapper: "border-slate-200 bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    };
  }

  if (normalized.includes("clocked in") || normalized.includes("present")) {
    return {
      wrapper: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (normalized.includes("break")) {
    return {
      wrapper: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  if (normalized.includes("late") || normalized.includes("missing")) {
    return {
      wrapper: "border-rose-200 bg-rose-50 text-rose-700",
      dot: "bg-rose-500",
    };
  }

  if (normalized.includes("completed") || normalized.includes("shift end")) {
    return {
      wrapper: "border-blue-200 bg-blue-50 text-blue-700",
      dot: "bg-blue-500",
    };
  }

  return {
    wrapper: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  };
}

function getRequestStatusTone(status = "") {
  const normalized = cleanDashboardText(status).toLowerCase();

  if (normalized.includes("approved") || normalized.includes("complete")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("reject") || normalized.includes("cancel")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getResignationShortcutTone(status = "") {
  const normalized = cleanDashboardText(status).toLowerCase();

  if (normalized.includes("complete") || normalized.includes("approved")) {
    return {
      button: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100",
      badge: "border-emerald-200 bg-white text-emerald-700",
    };
  }

  if (normalized.includes("declin") || normalized.includes("reject")) {
    return {
      button: "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
      badge: "border-rose-200 bg-white text-rose-700",
    };
  }

  if (normalized.includes("notice")) {
    return {
      button: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100",
      badge: "border-indigo-200 bg-white text-indigo-700",
    };
  }

  return {
    button: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100",
    badge: "border-amber-200 bg-white text-amber-700",
  };
}

function getAnnouncementTone(category = "") {
  const normalized = cleanDashboardText(category).toLowerCase();

  if (normalized.includes("policy")) {
    return "bg-purple-100 text-purple-700";
  }

  if (normalized.includes("jit") || normalized.includes("urgent")) {
    return "bg-rose-100 text-rose-700";
  }

  if (normalized.includes("event")) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
}

function formatLeaveValue(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : Number(value).toLocaleString("en-PH", {
        maximumFractionDigits: 2,
      });
}

function DashboardLoadingState() {
  return (
    <div className="sibs-dashboard-shell font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-6">
          <div className="h-36 animate-sibs-pulse rounded-2xl bg-slate-300" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-sibs-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>

            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-sibs-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <AdminLoginModal />
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useUser();
  const { ADMIN_ROLES } = useAdmin();

  const [now, setNow] = useState(() => new Date());
  const [profilePicture, setProfilePicture] = useState("");
  const [liveSources, setLiveSources] = useState(null);
  const [sourceAvailability, setSourceAvailability] = useState({});
  const [sourceErrors, setSourceErrors] = useState({});
  const [dashboardDataLoading, setDashboardDataLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [openResignation, setOpenResignation] = useState(false);
  const [openResignationDetails, setOpenResignationDetails] = useState(false);
  const [resignationStatusState, setResignationStatusState] = useState({
    loading: true,
    item: null,
    error: "",
  });
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (ADMIN_ROLES.includes(user.role)) {
      navigate(getDefaultDashboardPath(user), { replace: true });
      return;
    }

    if (user.role !== "employee") {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate, ADMIN_ROLES]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  const refreshMyResignationStatus = useCallback(
    async ({ showLoading = true } = {}) => {
      if (!user || user.role !== "employee") {
        setResignationStatusState({
          loading: false,
          item: null,
          error: "",
        });
        return null;
      }

      if (showLoading) {
        setResignationStatusState((current) => ({
          ...current,
          loading: true,
          error: "",
        }));
      }

      const result = await getMyResignationStatus();

      if (!result?.success) {
        setResignationStatusState({
          loading: false,
          item: null,
          error:
            result?.message ||
            "Your resignation status could not be loaded right now.",
        });
        return null;
      }

      const latest =
        result?.latest ||
        (Array.isArray(result?.data) ? result.data[0] : null) ||
        null;

      setResignationStatusState({
        loading: false,
        item: latest,
        error: "",
      });

      return latest;
    },
    [user],
  );

  useEffect(() => {
    void refreshMyResignationStatus();
  }, [refreshMyResignationStatus]);

  useEffect(() => {
    if (!location.state?.openResignationDetails) return;
    if (resignationStatusState.loading) return;

    if (resignationStatusState.item) {
      setOpenResignationDetails(true);
    } else if (resignationStatusState.error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Resignation Status Unavailable",
        message: resignationStatusState.error,
      });
    }

    const nextState = { ...(location.state || {}) };
    delete nextState.openResignationDetails;
    delete nextState.source;

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    resignationStatusState.error,
    resignationStatusState.item,
    resignationStatusState.loading,
  ]);

  useEffect(() => {
    if (!selectedAnnouncement) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedAnnouncement(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedAnnouncement]);

  const authProfile = useMemo(
    () => getEmployeeDashboardProfile(user || {}),
    [user],
  );
  const dashboardDateKey = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: MANILA_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now),
    [now],
  );

  useEffect(() => {
    if (!user || user.role !== "employee") {
      setLiveSources(null);
      setSourceAvailability({});
      setSourceErrors({});
      setDashboardDataLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function loadDashboardSources() {
      setDashboardDataLoading(true);

      try {
        const result = await getEmployeeDashboardSources({
          sibsId: authProfile.sibsId,
          now,
          signal: controller.signal,
        });

        if (cancelled) return;

        setLiveSources(result?.data || {});
        setSourceAvailability(result?.availability || {});
        setSourceErrors(result?.errors || {});
      } catch (error) {
        if (
          cancelled ||
          error?.name === "CanceledError" ||
          error?.name === "AbortError"
        ) {
          return;
        }

        console.error("EMPLOYEE DASHBOARD DATA ERROR:", error);
        setLiveSources({});
        setSourceAvailability({});
        setSourceErrors({
          dashboard: {
            message:
              error?.response?.data?.message ||
              error?.message ||
              "Employee dashboard data could not be loaded.",
          },
        });
      } finally {
        if (!cancelled) setDashboardDataLoading(false);
      }
    }

    void loadDashboardSources();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Refreshes when the Philippine calendar date changes or the signed-in employee changes.
  }, [user, authProfile.sibsId, dashboardDateKey]);

  const employeePayload = useMemo(() => {
    const employeeSource = liveSources?.employee;

    if (employeeSource?.data && typeof employeeSource.data === "object") {
      return employeeSource.data;
    }

    if (
      employeeSource?.employee &&
      typeof employeeSource.employee === "object"
    ) {
      return employeeSource.employee;
    }

    return employeeSource && typeof employeeSource === "object"
      ? employeeSource
      : {};
  }, [liveSources]);

  const profileSource = useMemo(
    () => ({ ...(user || {}), ...(employeePayload || {}) }),
    [user, employeePayload],
  );
  const profile = useMemo(
    () => getEmployeeDashboardProfile(profileSource),
    [profileSource],
  );

  useEffect(() => {
    if (!user) {
      setProfilePicture("");
      return undefined;
    }

    let cancelled = false;

    // The saved employee_profile picture is the source of truth for this
    // avatar. Clear any previous URL so employees without one show initials.
    setProfilePicture("");

    async function loadProfilePicture() {
      try {
        const result = await getMyEmployeeProfilePicture();
        if (cancelled) return;

        const pictureUrl = result?.success
          ? cleanDashboardText(result?.data?.profilePictureUrl)
          : "";

        if (!pictureUrl) {
          setProfilePicture("");
          return;
        }

        const separator = pictureUrl.includes("?") ? "&" : "?";
        setProfilePicture(`${pictureUrl}${separator}v=${Date.now()}`);
      } catch (error) {
        if (!cancelled) {
          setProfilePicture("");
          console.warn(
            "Employee dashboard profile picture was unavailable:",
            error?.message || error,
          );
        }
      }
    }

    void loadProfilePicture();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const attendance = useMemo(
    () =>
      getAttendanceSummaryFromResponses({
        attendanceResponse: liveSources?.attendance,
        kronosResponse: liveSources?.kronosAttendance,
        scheduleResponse: liveSources?.schedule,
        user: profileSource,
        now,
      }),
    [
      liveSources?.attendance,
      liveSources?.kronosAttendance,
      liveSources?.schedule,
      profileSource,
      dashboardDateKey,
    ],
  );
  const weeklySchedule = useMemo(
    () =>
      getWeeklyScheduleFromResponse({
        scheduleResponse: liveSources?.schedule,
        user: profileSource,
        now,
      }),
    [liveSources?.schedule, profileSource, dashboardDateKey],
  );
  const leaveData = useMemo(
    () =>
      getLeaveDashboardDataFromResponses({
        leavesResponse: liveSources?.leaves,
        summaryResponse: liveSources?.leaveSummary,
        user: profileSource,
      }),
    [liveSources?.leaves, liveSources?.leaveSummary, profileSource],
  );
  const announcements = useMemo(
    () => getDashboardAnnouncements(profileSource),
    [profileSource],
  );
  const holidays = useMemo(
    () => getDashboardHolidays(liveSources?.holidays, dashboardDateKey),
    [liveSources?.holidays, dashboardDateKey],
  );

  if (loading || !user || user.role !== "employee") {
    return <DashboardLoadingState />;
  }

  const attendanceTone = getStatusTone(attendance.status);
  const todaySchedule =
    weeklySchedule.find((item) => item.isToday) || weeklySchedule[0] || null;
  const monthLabel = new Intl.DateTimeFormat("en-PH", {
    timeZone: MANILA_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(now);
  const profileSubtitle = [
    profile.position,
    profile.department || profile.account,
    [profile.location, profile.workSetup].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join(" • ");

  const resignationRecord = resignationStatusState.item;
  const resignationStatusLabel =
    cleanDashboardText(resignationRecord?.status) || "For Approval";
  const resignationShortcutTone = getResignationShortcutTone(
    resignationStatusLabel,
  );

  function openStatus(message, type = "success", title = "Action Complete") {
    setStatusModal({
      open: true,
      type,
      title,
      message,
    });
  }

  function handleQuickAction(action) {
    if (action === "resignation") {
      if (resignationStatusState.loading) return;

      if (resignationStatusState.error) {
        openStatus(
          resignationStatusState.error,
          "error",
          "Resignation Status Unavailable",
        );
        return;
      }

      if (resignationRecord) {
        setOpenResignationDetails(true);
        return;
      }

      setOpenResignation(true);
      return;
    }

    const path = DASHBOARD_ROUTES[action];

    if (path) {
      navigate(path);
      return;
    }

    openStatus(
      "This employee shortcut does not have a configured destination yet.",
      "error",
      "Shortcut Not Configured",
    );
  }

  return (
    <div className="sibs-dashboard-shell font-jakarta">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5 pb-8">
          <section className="sibs-page-header-in relative overflow-hidden rounded-2xl border border-[#084075] bg-gradient-to-r from-[#042C51] via-[#063968] to-[#042C51] p-4 text-white shadow-sm sm:p-5 2xl:p-6">
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -top-16 right-36 h-40 w-40 rounded-full bg-[#FF5C28]/10" />

            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-col items-center gap-3.5 text-center sm:flex-row sm:text-left">
                <button
                  type="button"
                  onClick={() => navigate(DASHBOARD_ROUTES.profile)}
                  className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#FF5C28] bg-white/10 text-lg font-black text-white shadow-md transition hover:-translate-y-0.5 sm:h-16 sm:w-16 2xl:h-[72px] 2xl:w-[72px]"
                  title="Open My Profile"
                >
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={`${profile.fullName} profile`}
                      className="h-full w-full object-cover"
                      onError={() => setProfilePicture("")}
                    />
                  ) : (
                    <span>{profile.initials}</span>
                  )}

                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 2xl:h-4 2xl:w-4 rounded-full border-2 border-[#042C51] bg-emerald-500" />
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="rounded-full border border-[#FF5C28]/30 bg-[#FF5C28]/15 px-2.5 py-0.5 sibs-text-micro font-extrabold uppercase tracking-wider text-[#FF8A63]">
                      SIBS Employee Portal
                    </span>
                    {profile.sibsId ? (
                      <span className="font-mono sibs-text-xs font-semibold text-slate-300">
                        ID: {profile.sibsId}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="font-heading mt-0.5 break-words text-xl font-bold tracking-tight text-white sm:text-2xl 2xl:text-3xl">
                    Welcome Back, {profile.firstName}!
                  </h1>

                  <p className="mt-0.5 max-w-3xl sibs-text-xs font-semibold leading-5 text-slate-300">
                    {profileSubtitle ||
                      "Your employee self-service records and HRIS shortcuts are available below."}
                  </p>
                </div>
              </div>

              <div className="w-full shrink-0 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm sm:w-[200px] 2xl:w-[220px] md:text-right">
                <div className="flex items-center justify-center gap-1.5 sibs-text-xs font-medium text-slate-300 md:justify-end">
                  <Clock size={13} className="text-[#FF5C28]" />
                  Current Time (PHT)
                </div>
                <p className="font-heading mt-0.5 text-xl 2xl:text-2xl font-bold tabular-nums tracking-tight text-white">
                  {formatPhtTime(now)}
                </p>
                <p className="mt-0.5 sibs-text-micro font-semibold text-slate-300">
                  {formatPhtDate(now)}
                </p>
              </div>
            </div>
          </section>

          {sourceErrors.dashboard ? (
            <DashboardSourceNotice message={sourceErrors.dashboard.message} />
          ) : null}

          <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3">
            <div className="space-y-4 sm:space-y-5 lg:col-span-2">
              <DashboardCard>
                <DashboardCardHeader
                  icon={Clock}
                  title="Attendance & Live Timecard"
                  description="Today’s attendance status, punch information, and recorded activity."
                  action={
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] 2xl:text-[10px] font-black ${attendanceTone.wrapper}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 2xl:h-2 2xl:w-2 rounded-full ${attendanceTone.dot}`}
                      />
                      {dashboardDataLoading
                        ? "Loading attendance…"
                        : attendance.status}
                    </span>
                  }
                />

                {dashboardDataLoading ? (
                  <DashboardSourceNotice
                    message="Loading today’s attendance from Attendance and Kronos…"
                    loading
                  />
                ) : !sourceAvailability.attendance &&
                  !sourceAvailability.kronosAttendance ? (
                  <DashboardSourceNotice
                    message={
                      sourceErrors.kronosAttendance?.message ||
                      sourceErrors.attendance?.message ||
                      "Attendance data is currently unavailable."
                    }
                  />
                ) : null}

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:p-3.5 2xl:p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <MetricBox label="Clock In" value={attendance.clockIn} />
                    <MetricBox label="Clock Out" value={attendance.clockOut} />
                    <MetricBox
                      label="Rendered Hours"
                      value={attendance.renderedHours}
                      valueClassName="text-emerald-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(DASHBOARD_ROUTES.attendance)}
                    className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E04B1D]"
                  >
                    Open My Attendance
                    <ArrowUpRight size={13} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                      Today&apos;s Punch Activity Log
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Attendance actions remain in My Attendance
                    </span>
                  </div>

                  {attendance.logs.length ? (
                    <div className="max-h-[220px] 2xl:max-h-[300px] overflow-y-auto overflow-x-auto rounded-xl border border-[#E6ECF2] sibs-scrollbar">
                      <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                          <tr className="border-b border-[#CBD5E1] text-[10px] font-black uppercase text-[#042C51]">
                            <th className="px-3 2xl:px-3.5 py-2">Activity</th>
                            <th className="px-3 2xl:px-3.5 py-2">Timestamp</th>
                            <th className="px-3 2xl:px-3.5 py-2">Location / IP</th>
                            <th className="px-3 2xl:px-3.5 py-2">Status</th>
                            <th className="px-3 2xl:px-3.5 py-2 text-right">Device</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6ECF2] bg-white text-slate-600">
                          {attendance.logs.map((log, index) => (
                            <tr
                              key={log.id}
                              className="transition hover:bg-slate-50"
                              style={{
                                animationDelay: `${index * 35}ms`,
                                animationFillMode: "both",
                              }}
                            >
                              <td className="px-3 2xl:px-3.5 py-2 font-bold text-[#042C51]">
                                {log.type || "Activity"}
                              </td>
                              <td className="px-3 2xl:px-3.5 py-2 font-mono text-[10px] 2xl:text-[11px]">
                                {log.timestamp || "—"}
                              </td>
                              <td className="px-3 2xl:px-3.5 py-2 text-[11px] 2xl:text-xs">
                                {log.location || "—"}
                              </td>
                              <td className="px-3 2xl:px-3.5 py-2">
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] 2xl:text-[10px] font-bold text-slate-600">
                                  {log.status || "Recorded"}
                                </span>
                              </td>
                              <td className="px-3 2xl:px-3.5 py-2 text-right text-[10px] text-slate-400">
                                {log.device || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <DashboardEmptyState
                      icon={Clock}
                      title="No punch activity loaded"
                      message="No punch events were returned by today’s Attendance or Kronos records."
                    />
                  )}
                </div>
              </DashboardCard>

              <DashboardCard>
                <DashboardCardHeader
                  icon={CalendarDays}
                  title="Work Schedule & Weekly Timeline"
                  description="Current shift information and your seven-day employee schedule."
                  action={
                    <button
                      type="button"
                      onClick={() => navigate(DASHBOARD_ROUTES.schedule)}
                      className="inline-flex items-center gap-1 text-[10px] 2xl:text-[11px] font-black text-[#FF5C28] hover:underline"
                    >
                      Open Schedule
                      <ArrowUpRight size={12} />
                    </button>
                  }
                />

                {dashboardDataLoading ? (
                  <DashboardSourceNotice
                    message="Loading this week’s employee schedule…"
                    loading
                  />
                ) : !sourceAvailability.schedule ? (
                  <DashboardSourceNotice
                    message={
                      sourceErrors.schedule?.message ||
                      "The employee schedule source is currently unavailable."
                    }
                  />
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <SummaryTile
                    tone="navy"
                    label="Today's Shift"
                    value={todaySchedule?.shift || "Schedule not loaded"}
                    detail={todaySchedule?.hours || todaySchedule?.status || "—"}
                    icon={Clock}
                  />
                  <SummaryTile
                    label="Work Setup / Location"
                    value={profile.workSetup || profile.location || "Not recorded"}
                    detail={profile.account || profile.department || "—"}
                    icon={Building2}
                  />
                  <SummaryTile
                    label="Immediate Supervisor"
                    value={profile.manager || "Not recorded"}
                    detail={profile.managerPosition || "—"}
                    icon={User}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                    Weekly Schedule Timeline
                  </h3>

                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
                    {weeklySchedule.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-2.5 text-center transition ${
                          item.isToday
                            ? "border-[#042C51] bg-[#042C51] text-white shadow-sm ring-2 ring-[#FF5C28]"
                            : item.isOff
                              ? "border-slate-200 bg-slate-50 text-slate-400"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <p
                          className={`text-[9px] 2xl:text-[10px] font-black uppercase ${
                            item.isToday ? "text-[#FF8A63]" : "text-slate-400"
                          }`}
                        >
                          {item.day || "Day"} · {item.date || "—"}
                        </p>
                        <p
                          className={`mt-1 min-h-7 text-[9px] 2xl:text-[10px] font-bold leading-3.5 2xl:leading-4 ${
                            item.isToday ? "text-white" : "text-[#042C51]"
                          }`}
                        >
                          {item.shift}
                        </p>
                        <span
                          className={`mt-1.5 inline-flex rounded-md px-1.5 py-0.5 text-[8px] 2xl:text-[9px] font-black ${
                            item.isToday
                              ? "bg-[#FF5C28] text-white"
                              : item.isOff
                                ? "bg-slate-200 text-slate-600"
                                : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </DashboardCard>

              <section className="sibs-page-card-in relative overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-gradient-to-br from-white via-amber-50/20 to-amber-100/30 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col gap-2.5 border-b border-amber-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xs 2xl:text-sm font-extrabold uppercase tracking-wide text-[#042C51]">
                      Performance & Appraisal Center
                    </h2>
                    <p className="mt-0.5 text-[11px] 2xl:text-xs font-semibold text-[#667085]">
                      KPI scorecards, appraisal cycles, and employee goals.
                    </p>
                  </div>

                  <span className="inline-flex self-start items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider text-white sm:self-center">
                    <Sparkles size={11} />
                    Future Implementation
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <FutureFeature icon={Gauge} label="KPI Scorecards" />
                  <FutureFeature icon={ShieldCheck} label="Appraisal Reviews" />
                  <FutureFeature icon={TrendingUp} label="Goal Tracking" />
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-[10px] 2xl:text-[11px] font-semibold leading-5 text-slate-600">
                  <LockKeyhole
                    size={14}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  The performance workspace is intentionally read-only until the
                  Performance Management integration is available.
                </div>
              </section>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <DashboardCard>
                <DashboardCardHeader
                  icon={User}
                  title="My Profile & Summary"
                  action={
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] 2xl:text-[9px] font-black uppercase text-emerald-700">
                      {profile.status || "Employee"}
                    </span>
                  }
                />

                <div className="space-y-2 text-[11px] 2xl:text-xs">
                  <ProfileSummaryRow
                    label="Position Title"
                    value={profile.position}
                  />
                  <ProfileSummaryRow
                    label="Department"
                    value={profile.department}
                  />
                  <ProfileSummaryRow label="SIBS ID" value={profile.sibsId} mono />
                  <ProfileSummaryRow
                    label="Work Location"
                    value={profile.location}
                  />
                  <ProfileSummaryRow
                    label="Immediate Manager"
                    value={profile.manager}
                    last
                  />
                </div>

                <div className="space-y-2 border-t border-[#E6ECF2] pt-3">
                  <p className="text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Quick Action Shortcuts
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <QuickAction
                      icon={User}
                      label="My Profile"
                      onClick={() => handleQuickAction("profile")}
                    />
                    <QuickAction
                      icon={Clock}
                      label="Attendance"
                      onClick={() => handleQuickAction("attendance")}
                    />
                    <QuickAction
                      icon={CalendarDays}
                      label="Schedule"
                      onClick={() => handleQuickAction("schedule")}
                    />
                    <QuickAction
                      icon={FileText}
                      label="My Leaves"
                      onClick={() => handleQuickAction("leaves")}
                    />
                  </div>

                  {resignationStatusState.loading ? (
                    <button
                      type="button"
                      disabled
                      className="flex h-8 2xl:h-8.5 w-full cursor-wait items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-[11px] 2xl:text-xs font-black text-slate-500"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} />
                        Checking Resignation Status
                      </span>
                    </button>
                  ) : resignationStatusState.error ? (
                    <button
                      type="button"
                      onClick={() => handleQuickAction("resignation")}
                      className="flex h-8 2xl:h-8.5 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-[11px] 2xl:text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="truncate">
                          Resignation Status Unavailable
                        </span>
                      </span>
                      <ChevronRight size={14} className="shrink-0" />
                    </button>
                  ) : resignationRecord ? (
                    <button
                      type="button"
                      onClick={() => handleQuickAction("resignation")}
                      className={`flex h-8 2xl:h-8.5 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-[11px] 2xl:text-xs font-black transition ${resignationShortcutTone.button}`}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <UserRoundX size={14} className="shrink-0" />
                        <span className="truncate">Resignation Status</span>
                      </span>

                      <span className="inline-flex shrink-0 items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[8px] 2xl:text-[9px] font-black uppercase ${resignationShortcutTone.badge}`}
                        >
                          {resignationStatusLabel}
                        </span>
                        <ChevronRight size={14} />
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickAction("resignation")}
                      className="flex h-8 2xl:h-8.5 w-full items-center justify-between rounded-lg border border-rose-100 bg-rose-50 px-3 text-left text-[11px] 2xl:text-xs font-black text-rose-700 transition hover:border-rose-200 hover:bg-rose-100"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <UserRoundX size={14} />
                        Submit Resignation
                      </span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </DashboardCard>

              <DashboardCard>
                <DashboardCardHeader
                  icon={CalendarDays}
                  title="Leaves & Time Off"
                  description="Available balances and recent employee leave requests."
                  action={
                    <button
                      type="button"
                      onClick={() => navigate(DASHBOARD_ROUTES.leaves)}
                      className="inline-flex items-center gap-1 text-[10px] 2xl:text-[11px] font-black text-[#FF5C28] hover:underline"
                    >
                      Open Leaves
                      <ArrowUpRight size={12} />
                    </button>
                  }
                />

                {dashboardDataLoading ? (
                  <DashboardSourceNotice
                    message="Loading leave balances and recent requests…"
                    loading
                  />
                ) : !sourceAvailability.leaves &&
                  !sourceAvailability.leaveSummary ? (
                  <DashboardSourceNotice
                    message={
                      sourceErrors.leaveSummary?.message ||
                      sourceErrors.leaves?.message ||
                      "Leave data is currently unavailable."
                    }
                  />
                ) : null}

                <div className="grid grid-cols-2 gap-2.5">
                  <LeaveBalanceCard
                    label="Vacation Leave"
                    code="VL"
                    available={leaveData.vacation.available}
                    total={leaveData.vacation.total}
                    tone="navy"
                  />
                  <LeaveBalanceCard
                    label="Sick Leave"
                    code="SL"
                    available={leaveData.sick.available}
                    total={leaveData.sick.total}
                    tone="emerald"
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Recent Filed Leave Requests
                  </p>

                  {leaveData.recent.length ? (
                    <div className="max-h-[160px] 2xl:max-h-[200px] space-y-1.5 overflow-y-auto pr-0.5 sibs-scrollbar">
                      {leaveData.recent.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] 2xl:text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#042C51]">
                              {item.type}
                            </p>
                            <p className="mt-0.5 truncate text-[9px] 2xl:text-[10px] text-slate-500">
                              {[item.dates, item.days].filter(Boolean).join(" · ") ||
                                "Pending Review"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] 2xl:text-[9px] font-black ${getRequestStatusTone(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <DashboardEmptyState
                      compact
                      icon={CalendarDays}
                      title="No recent leave requests loaded"
                      message="Open My Leaves to view the complete leave request history."
                    />
                  )}
                </div>
              </DashboardCard>

              <DashboardCard>
                <DashboardCardHeader
                  icon={Bell}
                  title="Announcements & Holidays"
                  action={
                    <span className="font-mono text-[9px] 2xl:text-[10px] font-bold text-slate-400">
                      {monthLabel}
                    </span>
                  }
                />

                <div className="space-y-2">
                  <p className="text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Latest HR Bulletins & Notices
                  </p>

                  {announcements.length ? (
                    announcements.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedAnnouncement(item)}
                        className="w-full space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-blue-300 hover:bg-[#E9F0FC]/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[8px] 2xl:text-[9px] font-black uppercase ${getAnnouncementTone(
                              item.category,
                            )}`}
                          >
                            {item.category}
                          </span>
                          <span className="shrink-0 font-mono text-[8px] 2xl:text-[9px] text-slate-400">
                            {formatDashboardDate(item.date, "")}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-[11px] 2xl:text-xs font-bold text-[#042C51]">
                          {item.title}
                        </p>
                        <p className="line-clamp-2 text-[9px] 2xl:text-[10px] font-medium leading-3.5 2xl:leading-4 text-slate-500">
                          {item.summary || "Open this notice to review the details."}
                        </p>
                      </button>
                    ))
                  ) : (
                    <DashboardEmptyState
                      compact
                      icon={Bell}
                      title="No announcements loaded"
                      message="No announcements endpoint was provided. Notices will remain empty until that source is connected."
                    />
                  )}
                </div>

                <div className="space-y-2 border-t border-[#E6ECF2] pt-3">
                  <p className="text-[9px] 2xl:text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Upcoming Holidays
                  </p>

                  {holidays.length ? (
                    holidays.map((holiday) => {
                      const date = holiday.date ? new Date(holiday.date) : null;
                      const validDate = date && !Number.isNaN(date.getTime());
                      const dayLabel = validDate
                        ? new Intl.DateTimeFormat("en-PH", {
                            timeZone: MANILA_TIME_ZONE,
                            weekday: "short",
                          }).format(date)
                        : "—";
                      const dateNumber = validDate
                        ? new Intl.DateTimeFormat("en-PH", {
                            timeZone: MANILA_TIME_ZONE,
                            day: "2-digit",
                          }).format(date)
                        : "—";

                      return (
                        <div
                          key={holiday.id}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] 2xl:text-xs"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-[#042C51] text-center text-white">
                              <span className="text-[7px] 2xl:text-[8px] font-bold uppercase text-[#FF8A63]">
                                {dayLabel}
                              </span>
                              <span className="font-mono text-[11px] 2xl:text-xs font-black leading-none">
                                {dateNumber}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#042C51]">
                                {holiday.name}
                              </p>
                              <p className="truncate text-[9px] 2xl:text-[10px] text-slate-500">
                                {holiday.type || formatDashboardDate(holiday.date)}
                              </p>
                            </div>
                          </div>
                          {holiday.upcoming ? (
                            <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[8px] 2xl:text-[9px] font-black text-amber-700">
                              Upcoming
                            </span>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <DashboardEmptyState
                      compact
                      icon={CalendarDays}
                      title="No upcoming holidays"
                      message="There are no active holidays on or after today in the holiday calendar."
                    />
                  )}
                </div>
              </DashboardCard>
            </div>
          </div>
        </div>
      </main>

      {selectedAnnouncement ? (
        <div
          className="sibs-modal-blur sibs-modal-backdrop-in fixed inset-0 z-[99999] flex items-center justify-center p-2 font-jakarta sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedAnnouncement(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-announcement-title"
            className="sibs-modal-pop-in flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl font-jakarta"
          >
            <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
              <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
                <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
                  <Bell size={16} />
                </span>
                <div className="min-w-0">
                  <h2
                    id="dashboard-announcement-title"
                    className="sibs-modal-title truncate text-white"
                  >
                    {selectedAnnouncement.category || "Company Announcement"}
                  </h2>
                  <p className="sibs-modal-subtitle mt-0.5 truncate text-white/75">
                    Official Employee Notice & Bulletin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close announcement"
              >
                <X size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-4 sm:p-5 2xl:p-6 sibs-scrollbar">
              <div>
                <div className="flex flex-col gap-1 text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3] sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Issued: {formatDashboardDate(selectedAnnouncement.date)}
                  </span>
                  <span>By: {selectedAnnouncement.author}</span>
                </div>
                <h3 className="sibs-modal-section-title mt-2 leading-snug text-[#042C51]">
                  {selectedAnnouncement.title}
                </h3>
              </div>

              <p className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3.5 2xl:p-4 sibs-text-xs font-medium leading-relaxed text-[#344054]">
                {selectedAnnouncement.summary ||
                  "No additional announcement details were supplied."}
              </p>
            </div>

            <footer className="flex shrink-0 items-center justify-end border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
              >
                Close Notice
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      <ResignationModal
        open={openResignation}
        onClose={() => setOpenResignation(false)}
        onSuccess={async () => {
          setOpenResignation(false);
          await refreshMyResignationStatus({ showLoading: false });
        }}
        setStatusModal={setStatusModal}
      />

      <ViewResignationModal
        open={openResignationDetails}
        item={resignationRecord}
        currentUser={user}
        onClose={() => setOpenResignationDetails(false)}
      />

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() =>
          setStatusModal({
            open: false,
            type: "success",
            title: "",
            message: "",
          })
        }
      />

      <AdminLoginModal />
    </div>
  );
}

function DashboardSourceNotice({ message, loading = false }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-[11px] font-semibold leading-5 ${
        loading
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
      role={loading ? "status" : "alert"}
    >
      {loading ? (
        <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-500" />
      ) : (
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

function DashboardCard({ children }) {
  return (
    <section className="sibs-page-card-in space-y-3.5 2xl:space-y-4 rounded-2xl border border-[#E6ECF2] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-xs">
      {children}
    </section>
  );
}

function DashboardCardHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-[#E6ECF2] pb-2.5 sm:flex-row sm:items-start sm:justify-between font-jakarta">
      <div className="min-w-0">
        <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 sibs-text-xs font-semibold leading-4 2xl:leading-5 text-[#667085]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function MetricBox({ label, value, valueClassName = "text-[#042C51]" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 2xl:p-3">
      <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`font-heading mt-0.5 text-xs 2xl:text-sm font-bold tabular-nums tracking-tight ${valueClassName}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function SummaryTile({ tone = "light", label, value, detail, icon: Icon }) {
  const dark = tone === "navy";

  return (
    <div
      className={`rounded-xl border p-3 2xl:p-3.5 ${
        dark
          ? "border-[#042C51] bg-gradient-to-br from-slate-900 to-[#042C51] text-white"
          : "border-slate-200 bg-slate-50 text-[#042C51]"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          size={14}
          className={dark ? "text-[#FF8A63]" : "text-slate-500"}
        />
        <p
          className={`sibs-text-micro font-extrabold uppercase tracking-wider ${
            dark ? "text-slate-300" : "text-slate-400"
          }`}
        >
          {label}
        </p>
      </div>
      <p
        className={`font-heading mt-1.5 break-words text-xs 2xl:text-sm font-bold leading-4 2xl:leading-5 ${
          dark ? "text-white" : "text-[#042C51]"
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-0.5 break-words sibs-text-micro font-semibold ${
          dark ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {detail || "—"}
      </p>
    </div>
  );
}

function FutureFeature({ icon: Icon, label }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-white/80 p-3 2xl:p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 2xl:h-8 2xl:w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Icon size={14} />
        </span>
        <span className="sibs-text-xs font-extrabold text-[#042C51]">{label}</span>
      </div>
      <p className="mt-1.5 sibs-text-micro font-semibold leading-4 text-slate-500">
        Awaiting the connected performance data source.
      </p>
    </div>
  );
}

function ProfileSummaryRow({ label, value, mono = false, last = false }) {
  return (
    <div
      className={`flex items-start justify-between gap-2.5 py-1 2xl:py-1.5 ${
        last ? "" : "border-b border-slate-100"
      }`}
    >
      <span className="shrink-0 text-slate-500">{label}:</span>
      <strong
        className={`min-w-0 break-words text-right font-bold text-[#042C51] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </strong>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[64px] 2xl:min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2 2xl:p-2.5 text-center text-slate-700 transition hover:border-blue-200 hover:bg-[#E9F0FC] hover:text-[#042C51]"
    >
      <Icon size={15} className="text-[#FF5C28]" />
      <span className="sibs-text-micro font-extrabold">{label}</span>
    </button>
  );
}

function LeaveBalanceCard({ label, code, available, total, tone }) {
  const progress = getProgressPercent(available, total);
  const emerald = tone === "emerald";

  return (
    <div
      className={`rounded-xl border p-2.5 2xl:p-3 ${
        emerald
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-blue-200 bg-blue-50/70"
      }`}
    >
      <div
        className={`flex items-center justify-between sibs-text-micro font-extrabold uppercase ${
          emerald ? "text-emerald-700" : "text-blue-800"
        }`}
      >
        <span>{label}</span>
        <span className="font-mono">{code}</span>
      </div>
      <p className="font-heading mt-0.5 text-base 2xl:text-lg font-bold tabular-nums tracking-tight text-[#042C51]">
        {formatLeaveValue(available)}
        <span className="ml-1 sibs-text-micro font-normal text-slate-500">
          / {formatLeaveValue(total)} Days
        </span>
      </p>
      <div
        className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${
          emerald ? "bg-emerald-200" : "bg-blue-200"
        }`}
      >
        <div
          className={`h-full rounded-full ${
            emerald ? "bg-emerald-600" : "bg-[#042C51]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function DashboardEmptyState({
  icon: Icon = AlertCircle,
  title,
  message,
  compact = false,
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center ${
        compact ? "p-3 2xl:p-4" : "p-4 2xl:p-5"
      }`}
    >
      <Icon
        size={compact ? 16 : 20}
        className="mx-auto text-slate-400"
      />
      <p className="mt-1.5 sibs-text-xs font-extrabold text-[#042C51]">{title}</p>
      <p className="mx-auto mt-0.5 max-w-xl sibs-text-micro font-semibold leading-4 text-slate-500">
        {message}
      </p>
    </div>
  );
}
