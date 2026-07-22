import { createElement } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from "lucide-react";

export const DASHBOARD_SURFACE_CLASS =
  "sibs-page-card-in sibs-card";

const activityDotClass = {
  leave: "bg-amber-400",
  employee: "bg-blue-400",
  attendance: "bg-emerald-400",
  hiring: "bg-indigo-400",
  department: "bg-violet-400",
  system: "bg-slate-400",
};

const notificationTone = {
  action: {
    wrapper: "border-blue-200/70 bg-blue-50/70",
    icon: "bg-blue-100 text-blue-600",
    button: "bg-[#FF5C28] text-white hover:bg-[#E64F21]",
  },
  warning: {
    wrapper: "border-amber-200/70 bg-amber-50/70",
    icon: "bg-amber-100 text-amber-700",
    button: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  },
  info: {
    wrapper: "border-slate-200 bg-slate-50",
    icon: "bg-slate-200 text-slate-600",
    button: "bg-slate-200 text-slate-700 hover:bg-slate-300",
  },
};

const metricTone = {
  orange: {
    label: "text-[#FF5C28]",
    icon: "bg-orange-50 text-[#FF5C28]",
    badge: "bg-orange-50 text-[#FF5C28]",
  },
  navy: {
    label: "text-[#042C51]",
    icon: "bg-[#E9F0FC] text-[#042C51]",
    badge: "bg-[#E9F0FC] text-[#042C51]",
  },
  green: {
    label: "text-emerald-700",
    icon: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  indigo: {
    label: "text-indigo-700",
    icon: "bg-indigo-50 text-indigo-600",
    badge: "bg-indigo-50 text-indigo-700",
  },
  amber: {
    label: "text-amber-700",
    icon: "bg-amber-50 text-amber-600",
    badge: "bg-amber-50 text-amber-700",
  },
};

function getAnimationStyle(delay = 0) {
  return {
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
  };
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
      <section className={`${DASHBOARD_SURFACE_CLASS} p-5 sm:p-6`}>
        <div className="mb-3 h-5 w-44 animate-sibs-pulse rounded-lg bg-slate-200" />
        <div className="h-8 w-72 max-w-full animate-sibs-pulse rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-64 max-w-full animate-sibs-pulse rounded-lg bg-slate-200" />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className={`${DASHBOARD_SURFACE_CLASS} h-[116px] p-4`}>
            <div className="flex h-full items-center justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-3 w-24 animate-sibs-pulse rounded bg-slate-200" />
                <div className="h-7 w-20 animate-sibs-pulse rounded bg-slate-200" />
                <div className="h-3 w-32 animate-sibs-pulse rounded bg-slate-200" />
              </div>
              <div className="h-10 w-10 animate-sibs-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className={`${DASHBOARD_SURFACE_CLASS} h-[360px] lg:col-span-8`} />
        <div className="space-y-5 lg:col-span-4">
          <div className={`${DASHBOARD_SURFACE_CLASS} h-[250px]`} />
          <div className="h-[220px] rounded-2xl bg-slate-300" />
        </div>
      </section>
    </div>
  );
}

export function DashboardToast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="sibs-toast-in fixed right-4 top-20 z-[1200] flex max-w-[360px] items-start gap-3 rounded-r-xl border-l-4 border-[#FF5C28] bg-[#042C51] px-4 py-3 text-white shadow-2xl sm:right-6">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5C28]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold">{toast.title || "Dashboard Update"}</p>
        {toast.message ? (
        <p className="mt-0.5 text-xs leading-relaxed text-slate-200">
            {toast.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function DashboardWelcome({ title, fullName, onOpenEmployees }) {
  return (
    <section className={`sibs-page-header-in relative overflow-hidden ${DASHBOARD_SURFACE_CLASS} p-5 sm:p-6`}>
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-1 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E9F0FC] text-[#042C51]">
            <LayoutDashboard size={24} strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
                <Users className="h-3 w-3" />
                Admin View
              </span>
            </div>

            <h1 className="break-words text-xl font-extrabold leading-tight text-[#042C51] sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1.5 text-xs font-semibold text-[#667085] sm:text-sm">
              Welcome back, <span className="font-extrabold text-[#042C51]">{fullName}</span>.
              You have administrative permissions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenEmployees}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] px-3.5 text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          <Users className="h-4 w-4" />
          Launch Employee Directory
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

export function DashboardMetricCard({ item, onClick, delay = 0 }) {
  const tone = metricTone[item.tone] || metricTone.navy;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group sibs-metric-card relative overflow-hidden text-left active:translate-y-0"
      style={getAnimationStyle(delay)}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-extrabold uppercase tracking-wide ${tone.label}`}>
            {item.label}
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#042C51]">
              {item.value}
            </span>
            {item.badge ? (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${tone.badge}`}>
                {item.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-xs font-bold leading-4 text-[#667085]">
            {item.description}
          </p>
        </div>

        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
          {item.icon ? createElement(item.icon, { size: 17, strokeWidth: 2 }) : null}
        </div>
      </div>

      <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 translate-x-1 text-[#FF5C28] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
    </button>
  );
}

export function RecentActivityPanel({ activities, onSync, onViewAll, delay = 0 }) {
  return (
    <section className={`${DASHBOARD_SURFACE_CLASS} p-5 sm:p-6`} style={getAnimationStyle(delay)}>
      <div className="flex items-start justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <h2 className="text-base font-extrabold text-[#042C51]">Recent Activity</h2>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            Latest system and employee activity logs
          </p>
        </div>

        <button
          type="button"
          onClick={onSync}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F1F5F9] px-2.5 text-xs font-extrabold text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Activity
        </button>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {activities.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="mx-auto h-7 w-7 text-[#667085]" />
            <p className="mt-2 text-xs font-bold text-[#667085]">No activity yet</p>
          </div>
        ) : (
          activities.slice(0, 6).map((activity) => (
            <article
              key={activity.id}
              className="flex items-start gap-3 px-1 py-3 transition hover:bg-slate-50/70"
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  activityDotClass[activity.type] || activityDotClass.system
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-[#344054]">
                  <span className="font-extrabold text-[#042C51]">{activity.user}</span>{" "}
                  {activity.action}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#667085]">
                  {activity.details}
                </p>
              </div>
              <time className="shrink-0 text-[10px] font-bold text-[#667085]">
                {activity.time}
              </time>
            </article>
          ))
        )}
      </div>

      <div className="flex justify-end border-t border-[#F1F5F9] pt-3">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-[#FF5C28] transition hover:text-[#042C51]"
        >
          View all activity
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

export function NotificationsPanel({ notifications, onDismiss, onAction, onViewAll, delay = 0 }) {
  return (
    <section className={`${DASHBOARD_SURFACE_CLASS} p-5 sm:p-6`} style={getAnimationStyle(delay)}>
      <div className="border-b border-[#F1F5F9] pb-4">
        <h2 className="text-base font-extrabold text-[#042C51]">Notifications</h2>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Important updates and pending items requiring attention
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-6 py-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-xs font-extrabold text-[#042C51]">All caught up!</p>
            <p className="mt-1 text-xs text-[#667085]">
              No new administrative notifications
            </p>
          </div>
        ) : (
          notifications.slice(0, 4).map((notification) => {
            const tone = notificationTone[notification.type] || notificationTone.info;
            const Icon = notification.icon || Bell;

            return (
              <article
                key={notification.id}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${tone.wrapper}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-[#667085]">
                    {notification.time}
                  </span>
                  <h3 className="mt-0.5 text-xs font-extrabold text-[#042C51]">
                    {notification.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#344054]">
                    {notification.message}
                  </p>

                  {notification.actionLabel ? (
                    <button
                      type="button"
                      onClick={() => onAction(notification)}
                      className={`mt-2 rounded px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition ${tone.button}`}
                    >
                      {notification.actionLabel}
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => onDismiss(notification.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#667085] transition hover:bg-white/70 hover:text-[#FF5C28]"
                  aria-label={`Dismiss ${notification.title}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </article>
            );
          })
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="mt-4 flex justify-end border-t border-[#F1F5F9] pt-3">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#FF5C28] transition hover:text-[#042C51]"
          >
            View all notifications
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function QuickActionsPanel({ actions, onAction, delay = 0 }) {
  return (
    <section className={`${DASHBOARD_SURFACE_CLASS} p-5`} style={getAnimationStyle(delay)}>
      <div className="border-b border-[#F1F5F9] pb-3">
        <h2 className="text-base font-extrabold text-[#042C51]">Quick Actions</h2>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Instant shortcuts for common admin tasks
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className="group flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:border-[#FF5C28]/50 hover:bg-[#FFF0EB]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF5C28] transition-colors group-hover:bg-[#FF5C28] group-hover:text-white">
              {action.icon ? createElement(action.icon, { size: 18 }) : null}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold leading-5 text-[#042C51] transition group-hover:text-[#FF5C28]">
                {action.title}
              </span>
              <span className="mt-0.5 block text-xs leading-4 text-[#667085]">
                {action.description}
              </span>
            </span>

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#FF5C28]" />
          </button>
        ))}
      </div>
    </section>
  );
}

export function WorkforceKpiCard({ utilization, absenteeismBuffer, delay = 0 }) {
  const safeUtilization = Math.max(0, Math.min(100, Number(utilization || 0)));

  return (
    <section
      className="sibs-page-card-in rounded-2xl border border-blue-400/20 bg-gradient-to-br from-[#042C51] to-[#031D36] p-5 text-white shadow-md"
      style={getAnimationStyle(delay)}
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-200">
          Frontend Preview KPI
        </span>
        <Sparkles className="h-4 w-4 text-[#FF5C28]" />
      </div>

      <div className="mt-5">
        <span className="text-xs font-medium text-slate-300">Workforce Utilization</span>
        <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight text-[#FF5C28]">
          {safeUtilization.toFixed(1)}%
        </p>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#FF5C28] transition-all duration-300"
          style={{ width: `${safeUtilization}%` }}
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-300/90">
        Active manpower allocation is aligned with the frontend planning scenario.
        Absenteeism buffer is currently{" "}
        <span className="font-extrabold text-[#FF5C28]">{absenteeismBuffer}%</span>.
      </p>

      <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] leading-relaxed text-slate-300">
        Frontend-only demonstration data. Values and changes reset when the page refreshes.
      </p>
    </section>
  );
}
