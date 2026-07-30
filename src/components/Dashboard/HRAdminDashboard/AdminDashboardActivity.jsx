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
      className="sibs-page-card-in sibs-card p-5 sm:p-6"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <h2 className="text-base font-extrabold text-[#042C51]">
            Recent Activity
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#667085]">
            Latest system and employee activity logs
          </p>
        </div>

        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F1F5F9] px-2.5 text-xs font-extrabold text-[#042C51] transition hover:bg-[#FFF0EB] hover:text-[#FF5C28] disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
          {isSyncing ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {activities.length === 0 ? (
          <div className="py-12 text-center">
            <Activity className="mx-auto h-7 w-7 text-[#667085]" />
            <p className="mt-2 text-xs font-bold text-[#667085]">
              No activity yet
            </p>
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
                  <span className="font-extrabold text-[#042C51]">
                    {activity.user}
                  </span>{" "}
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
