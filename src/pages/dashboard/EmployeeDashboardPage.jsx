import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import StatusModal from "../../components/modals/StatusModal";
import { getMyEmployeeProfilePicture } from "../../lib/axios/employeeProfile";
import { getEmployeeDashboardSources } from "../../lib/axios/getEmployeeDashboardData.js";
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

const MANILA_TIME_ZONE = "Asia/Manila";

const DASHBOARD_ROUTES = {
  profile: "/profile/user",
  attendance: "/attendance",
  schedule: "/schedule",
  leaves: "/leaves",
};

function getStatusTone(status = "") {
  const normalized = cleanDashboardText(status).toLowerCase();

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
        <div className="mx-auto w-full max-w-[1600px] space-y-6">
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
      navigate("/dashboard/admin", { replace: true });
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
        user: profileSource,
        now,
      }),
    [
      liveSources?.attendance,
      liveSources?.kronosAttendance,
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
    () => getDashboardHolidays(profileSource),
    [profileSource],
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
        <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
          <section className="sibs-page-header-in relative overflow-hidden rounded-2xl border border-[#084075] bg-gradient-to-r from-[#042C51] via-[#063968] to-[#042C51] p-5 text-white shadow-lg sm:p-6">
            <div className="pointer-events-none absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -top-16 right-36 h-40 w-40 rounded-full bg-[#FF5C28]/10" />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <button
                  type="button"
                  onClick={() => navigate(DASHBOARD_ROUTES.profile)}
                  className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#FF5C28] bg-white/10 text-xl font-black text-white shadow-md transition hover:-translate-y-0.5 sm:h-[72px] sm:w-[72px]"
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

                  <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#042C51] bg-emerald-500" />
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="rounded-full border border-[#FF5C28]/30 bg-[#FF5C28]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#FF8A63]">
                      SIBS Employee Portal
                    </span>
                    {profile.sibsId ? (
                      <span className="font-mono text-[11px] font-semibold text-slate-300">
                        ID: {profile.sibsId}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Welcome Back, {profile.firstName}!
                  </h1>

                  <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-300">
                    {profileSubtitle ||
                      "Your employee self-service records and HRIS shortcuts are available below."}
                  </p>
                </div>
              </div>

              <div className="w-full shrink-0 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center backdrop-blur-sm sm:w-[220px] md:text-right">
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-300 md:justify-end">
                  <Clock size={15} className="text-[#FF5C28]" />
                  Current Time (PHT)
                </div>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums tracking-tight text-white">
                  {formatPhtTime(now)}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-300">
                  {formatPhtDate(now)}
                </p>
              </div>
            </div>
          </section>

          {sourceErrors.dashboard ? (
            <DashboardSourceNotice message={sourceErrors.dashboard.message} />
          ) : null}

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <DashboardCard>
                <DashboardCardHeader
                  icon={Clock}
                  title="Attendance & Live Timecard"
                  description="Today’s attendance status, punch information, and recorded activity."
                  action={
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black ${attendanceTone.wrapper}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${attendanceTone.dot}`}
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

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-5 text-xs font-black text-white shadow-sm transition hover:bg-[#E04B1D]"
                  >
                    Open My Attendance
                    <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wide text-[#042C51]">
                      Today&apos;s Punch Activity Log
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Attendance actions remain in My Attendance
                    </span>
                  </div>

                  {attendance.logs.length ? (
                    <div className="overflow-x-auto rounded-xl border border-[#E6ECF2]">
                      <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#CBD5E1] bg-[#F8FAFC] text-[10px] font-black uppercase text-[#042C51]">
                            <th className="px-3.5 py-2.5">Activity</th>
                            <th className="px-3.5 py-2.5">Timestamp</th>
                            <th className="px-3.5 py-2.5">Location / IP</th>
                            <th className="px-3.5 py-2.5">Status</th>
                            <th className="px-3.5 py-2.5 text-right">Device</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6ECF2] bg-white text-slate-600">
                          {attendance.logs.map((log) => (
                            <tr
                              key={log.id}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-3.5 py-2.5 font-bold text-[#042C51]">
                                {log.type || "Activity"}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-[11px]">
                                {log.timestamp || "—"}
                              </td>
                              <td className="px-3.5 py-2.5">
                                {log.location || "—"}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                                  {log.status || "Recorded"}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-right text-[10px] text-slate-400">
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
                      className="inline-flex items-center gap-1 text-[11px] font-black text-[#FF5C28] hover:underline"
                    >
                      Open Schedule
                      <ArrowUpRight size={13} />
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <h3 className="text-xs font-black uppercase tracking-wide text-[#042C51]">
                    Weekly Schedule Timeline
                  </h3>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                    {weeklySchedule.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3 text-center transition ${
                          item.isToday
                            ? "border-[#042C51] bg-[#042C51] text-white shadow-md ring-2 ring-[#FF5C28]"
                            : item.isOff
                              ? "border-slate-200 bg-slate-50 text-slate-400"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-black uppercase ${
                            item.isToday ? "text-[#FF8A63]" : "text-slate-400"
                          }`}
                        >
                          {item.day || "Day"} · {item.date || "—"}
                        </p>
                        <p
                          className={`mt-1 min-h-8 text-[10px] font-bold leading-4 ${
                            item.isToday ? "text-white" : "text-[#042C51]"
                          }`}
                        >
                          {item.shift}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-md px-2 py-1 text-[9px] font-black ${
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

              <section className="sibs-page-card-in relative overflow-hidden rounded-2xl border border-dashed border-amber-300 bg-gradient-to-br from-white via-amber-50/20 to-amber-100/30 p-5 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-amber-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                      <TrendingUp size={17} />
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-[#042C51]">
                        Performance & Appraisal Center
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-[#667085]">
                        KPI scorecards, appraisal cycles, and employee goals.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex self-start items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white sm:self-center">
                    <Sparkles size={13} />
                    Future Implementation
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FutureFeature icon={Gauge} label="KPI Scorecards" />
                  <FutureFeature icon={ShieldCheck} label="Appraisal Reviews" />
                  <FutureFeature icon={TrendingUp} label="Goal Tracking" />
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[11px] font-semibold leading-5 text-slate-600">
                  <LockKeyhole
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />
                  The performance workspace is intentionally read-only until the
                  Performance Management integration is available.
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <DashboardCard>
                <DashboardCardHeader
                  icon={User}
                  title="My Profile & Summary"
                  action={
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">
                      {profile.status || "Employee"}
                    </span>
                  }
                />

                <div className="space-y-2.5 text-xs">
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

                <div className="space-y-2 border-t border-[#E6ECF2] pt-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
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

                  <button
                    type="button"
                    onClick={() => handleQuickAction("resignation")}
                    className="flex w-full items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-left text-xs font-black text-rose-700 transition hover:border-rose-200 hover:bg-rose-100"
                  >
                    <span className="inline-flex items-center gap-2">
                      <UserRoundX size={15} />
                      Submit Resignation
                    </span>
                    <ChevronRight size={15} />
                  </button>
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
                      className="inline-flex items-center gap-1 text-[11px] font-black text-[#FF5C28] hover:underline"
                    >
                      Open Leaves
                      <ArrowUpRight size={13} />
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

                <div className="grid grid-cols-2 gap-3">
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

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Recent Filed Leave Requests
                  </p>

                  {leaveData.recent.length ? (
                    <div className="max-h-[220px] space-y-2 overflow-y-auto pr-0.5 sibs-scrollbar">
                      {leaveData.recent.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#042C51]">
                              {item.type}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">
                              {[item.dates, item.days].filter(Boolean).join(" · ") ||
                                "Pending Review"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-black ${getRequestStatusTone(
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
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {monthLabel}
                    </span>
                  }
                />

                <div className="space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Latest HR Bulletins & Notices
                  </p>

                  {announcements.length ? (
                    announcements.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedAnnouncement(item)}
                        className="w-full space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-[#E9F0FC]/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[9px] font-black uppercase ${getAnnouncementTone(
                              item.category,
                            )}`}
                          >
                            {item.category}
                          </span>
                          <span className="shrink-0 font-mono text-[9px] text-slate-400">
                            {formatDashboardDate(item.date, "")}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs font-bold text-[#042C51]">
                          {item.title}
                        </p>
                        <p className="line-clamp-2 text-[10px] font-medium leading-4 text-slate-500">
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

                <div className="space-y-2.5 border-t border-[#E6ECF2] pt-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[#042C51] text-center text-white">
                              <span className="text-[8px] font-bold uppercase text-[#FF8A63]">
                                {dayLabel}
                              </span>
                              <span className="font-mono text-xs font-black leading-none">
                                {dateNumber}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[#042C51]">
                                {holiday.name}
                              </p>
                              <p className="truncate text-[10px] text-slate-500">
                                {holiday.type || formatDashboardDate(holiday.date)}
                              </p>
                            </div>
                          </div>
                          {holiday.upcoming ? (
                            <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700">
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
                      title="No holiday calendar loaded"
                      message="No holiday endpoint was provided. The calendar will remain empty until that source is connected."
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
          className="sibs-modal-blur fixed inset-0 z-[99999] flex items-center justify-center p-4"
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
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 bg-[#042C51] px-5 py-4 text-white">
              <div className="flex min-w-0 items-center gap-2">
                <Bell size={18} className="shrink-0 text-[#FF5C28]" />
                <h2
                  id="dashboard-announcement-title"
                  className="truncate text-sm font-black uppercase tracking-wider"
                >
                  {selectedAnnouncement.category}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close announcement"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <div className="flex flex-col gap-1 text-[10px] font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Issued: {formatDashboardDate(selectedAnnouncement.date)}
                  </span>
                  <span>By: {selectedAnnouncement.author}</span>
                </div>
                <h3 className="mt-2 text-base font-black leading-6 text-[#042C51]">
                  {selectedAnnouncement.title}
                </h3>
              </div>

              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium leading-6 text-slate-700">
                {selectedAnnouncement.summary ||
                  "No additional announcement details were supplied."}
              </p>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#042C51] px-4 text-xs font-black text-white transition hover:bg-[#063968]"
                >
                  <CheckCircle2 size={14} className="text-[#FF5C28]" />
                  Close Notice
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <ResignationModal
        open={openResignation}
        onClose={() => setOpenResignation(false)}
        onSuccess={() => setOpenResignation(false)}
        setStatusModal={setStatusModal}
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
    <section className="sibs-page-card-in space-y-5 rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      {children}
    </section>
  );
}

function DashboardCardHeader({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#042C51]">
          <Icon size={16} className="shrink-0 text-[#FF5C28]" />
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
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
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 font-mono text-sm font-black ${valueClassName}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function SummaryTile({ tone = "light", label, value, detail, icon: Icon }) {
  const dark = tone === "navy";

  return (
    <div
      className={`rounded-xl border p-4 ${
        dark
          ? "border-[#042C51] bg-gradient-to-br from-slate-900 to-[#042C51] text-white"
          : "border-slate-200 bg-slate-50 text-[#042C51]"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={15}
          className={dark ? "text-[#FF8A63]" : "text-slate-500"}
        />
        <p
          className={`text-[9px] font-black uppercase tracking-wider ${
            dark ? "text-slate-300" : "text-slate-400"
          }`}
        >
          {label}
        </p>
      </div>
      <p
        className={`mt-2 break-words text-sm font-black leading-5 ${
          dark ? "text-white" : "text-[#042C51]"
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-1 break-words text-[10px] font-semibold ${
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
    <div className="rounded-xl border border-amber-200/80 bg-white/80 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Icon size={15} />
        </span>
        <span className="text-xs font-black text-[#042C51]">{label}</span>
      </div>
      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">
        Awaiting the connected performance data source.
      </p>
    </div>
  );
}

function ProfileSummaryRow({ label, value, mono = false, last = false }) {
  return (
    <div
      className={`flex items-start justify-between gap-3 py-1.5 ${
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
      className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-slate-700 transition hover:border-blue-200 hover:bg-[#E9F0FC] hover:text-[#042C51]"
    >
      <Icon size={17} className="text-[#FF5C28]" />
      <span className="text-[10px] font-black">{label}</span>
    </button>
  );
}

function LeaveBalanceCard({ label, code, available, total, tone }) {
  const progress = getProgressPercent(available, total);
  const emerald = tone === "emerald";

  return (
    <div
      className={`rounded-xl border p-3 ${
        emerald
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-blue-200 bg-blue-50/70"
      }`}
    >
      <div
        className={`flex items-center justify-between text-[9px] font-black uppercase ${
          emerald ? "text-emerald-700" : "text-blue-800"
        }`}
      >
        <span>{label}</span>
        <span className="font-mono">{code}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-black text-[#042C51]">
        {formatLeaveValue(available)}
        <span className="ml-1 text-[10px] font-normal text-slate-500">
          / {formatLeaveValue(total)} Days
        </span>
      </p>
      <div
        className={`mt-2 h-1.5 overflow-hidden rounded-full ${
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
        compact ? "p-4" : "p-6"
      }`}
    >
      <Icon
        size={compact ? 18 : 22}
        className="mx-auto text-slate-400"
      />
      <p className="mt-2 text-xs font-black text-[#042C51]">{title}</p>
      <p className="mx-auto mt-1 max-w-xl text-[10px] font-semibold leading-4 text-slate-500">
        {message}
      </p>
    </div>
  );
}
