import { Activity, ChevronRight, RefreshCw } from "lucide-react";

const activityDotClass = {
  leave: "bg-amber-400",
  employee: "bg-blue-400",
  attendance: "bg-emerald-400",
  hiring: "bg-indigo-400",
  department: "bg-violet-400",
  system: "bg-slate-400",
};

export default function AdminDashboardActivity({
  activities = [],
  onSync,
  onViewAll,
  isSyncing = false,
  delay = 0,
}) {
  return (
    <section
      className="sibs-page-card-in sibs-card p-4 2xl:p-6"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-sibs-border pb-3 2xl:pb-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-heading text-sm 2xl:text-base font-bold text-sibs-navy tracking-tight">
            Recent Activity
          </h2>
          <p className="sibs-text-xs font-semibold text-sibs-muted">
            Latest system and employee activity logs
          </p>
        </div>

        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex h-8 2xl:h-8.5 items-center gap-1.5 rounded-lg border border-sibs-border-subtle bg-white px-2.5 sibs-text-xs font-extrabold text-sibs-navy transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-sibs-orange" : ""}`}
          />
          {isSyncing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="divide-y divide-sibs-border">
        {activities.length === 0 ? (
          <div className="py-8 2xl:py-12 text-center">
            <Activity className="mx-auto h-6 w-6 2xl:h-7 2xl:w-7 text-sibs-muted" />
            <p className="mt-2 sibs-text-xs font-bold text-sibs-muted">
              No activity yet
            </p>
          </div>
        ) : (
          activities.slice(0, 6).map((activity, index) => (
            <article
              key={activity.id}
              className="sibs-page-card-in flex items-start gap-2.5 2xl:gap-3 px-1 py-2 2xl:py-3 transition hover:bg-slate-50/70"
              style={{
                animationDelay: `${index * 35}ms`,
                animationFillMode: "both",
              }}
            >
              <span
                className={`mt-1.5 h-2 w-2 2xl:h-2.5 2xl:w-2.5 shrink-0 rounded-full ${
                  activityDotClass[activity.type] || activityDotClass.system
                }`}
              />

              <div className="min-w-0 flex-1">
                <p className="sibs-text-xs leading-relaxed text-sibs-text-secondary font-medium">
                  <span className="font-extrabold text-sibs-navy">
                    {activity.user}
                  </span>{" "}
                  {activity.action}
                </p>

                <p className="mt-0.5 sibs-text-micro leading-relaxed text-sibs-text-secondary">
                  {activity.details}
                </p>
              </div>

              <time className="shrink-0 sibs-text-micro font-semibold text-sibs-text-muted">
                {activity.time}
              </time>
            </article>
          ))
        )}
      </div>

      <div className="flex justify-end border-t border-sibs-border pt-2.5 2xl:pt-3">
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1 sibs-text-xs font-extrabold text-sibs-orange transition hover:text-sibs-navy"
        >
          View all activity
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
