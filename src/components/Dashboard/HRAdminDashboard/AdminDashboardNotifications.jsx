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
      className="sibs-page-card-in sibs-card p-4 2xl:p-6"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="border-b border-[#E6ECF2] pb-3 2xl:pb-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm 2xl:text-base font-extrabold text-[#042C51]">
            Notifications
          </h2>
          <p className="sibs-text-xs font-semibold text-[#667085]">
            Important updates and pending items requiring attention
          </p>
        </div>
      </div>

      <div className="mt-3 2xl:mt-4 space-y-2.5 2xl:space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D6E0EA] bg-[#F8FAFC] px-5 py-6 2xl:py-8 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 2xl:h-8 2xl:w-8 text-emerald-500" />
            <p className="mt-2 sibs-text-xs font-extrabold text-[#042C51]">
              All caught up!
            </p>
            <p className="mt-0.5 sibs-text-micro text-[#667085]">
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
                className={`flex items-start gap-2 2xl:gap-3 rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 2xl:p-3.5 ${tone.wrapper}`}
              >
                <span
                  className={`flex h-6.5 w-6.5 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                >
                  <Icon className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <span className="sibs-text-micro font-bold text-[#667085]">
                    {notification.time}
                  </span>
                  <h3 className="sibs-text-xs font-extrabold text-[#042C51]">
                    {notification.title}
                  </h3>
                  <p className="sibs-text-xs leading-snug text-[#344054]">
                    {notification.message}
                  </p>

                  {notification.actionLabel ? (
                    <button
                      type="button"
                      onClick={() => onAction?.(notification)}
                      className={`mt-1 2xl:mt-2 rounded px-2 2xl:px-2.5 py-0.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-wide transition ${tone.button}`}
                    >
                      {notification.actionLabel}
                    </button>
                  ) : null}
                </div>

                {onDismiss ? (
                  <button
                    type="button"
                    onClick={() => onDismiss(notification.id)}
                    className="flex h-5.5 w-5.5 2xl:h-7 2xl:w-7 shrink-0 items-center justify-center rounded-md text-[#667085] transition hover:bg-white/70 hover:text-[#FF5C28]"
                    aria-label={`Dismiss ${notification.title}`}
                  >
                    <X className="h-3 w-3 2xl:h-3.5 2xl:w-3.5" />
                  </button>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="mt-3 2xl:mt-4 flex justify-end border-t border-[#F1F5F9] pt-2.5 2xl:pt-3">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 sibs-text-xs font-extrabold text-[#FF5C28] transition hover:text-[#042C51]"
          >
            View all notifications
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
