import {
  Bell,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";

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

export default function AdminDashboardNotifications({
  notifications = [],
  onDismiss,
  onAction,
  onViewAll,
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
      <div className="border-b border-[#F1F5F9] pb-4">
        <h2 className="text-base font-extrabold text-[#042C51]">
          Notifications
        </h2>
        <p className="mt-1 text-xs font-semibold text-[#667085]">
          Important updates and pending items requiring attention
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-6 py-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-xs font-extrabold text-[#042C51]">
              All caught up!
            </p>
            <p className="mt-1 text-xs text-[#667085]">
              No new administrative notifications
            </p>
          </div>
        ) : (
          notifications.slice(0, 4).map((notification) => {
            const tone =
              notificationTone[notification.type] || notificationTone.info;
            const Icon = notification.icon || Bell;

            return (
              <article
                key={notification.id}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${tone.wrapper}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                >
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
                      onClick={() => onAction?.(notification)}
                      className={`mt-2 rounded px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide transition ${tone.button}`}
                    >
                      {notification.actionLabel}
                    </button>
                  ) : null}
                </div>

                {onDismiss ? (
                  <button
                    type="button"
                    onClick={() => onDismiss(notification.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#667085] transition hover:bg-white/70 hover:text-[#FF5C28]"
                    aria-label={`Dismiss ${notification.title}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
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
