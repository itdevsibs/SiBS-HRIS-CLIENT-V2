import { createElement } from "react";
import { ChevronRight } from "lucide-react";

function getToneClasses(tone = "navy") {
  const safeTone = tone || "navy";
  return {
    label: `sibs-tone-${safeTone}-label`,
    icon: `sibs-tone-${safeTone}-icon`,
    badge: `sibs-tone-${safeTone}-icon`,
  };
}

function AdminDashboardMetricCard({ item, onClick, delay = 0 }) {
  const tone = getToneClasses(item?.tone);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group sibs-metric-card sibs-page-card-in relative overflow-hidden text-left active:translate-y-0 p-3 2xl:p-4 min-h-[104px] 2xl:min-h-[116px]"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`sibs-text-micro font-extrabold uppercase tracking-wide ${tone.label}`}
          >
            {item?.label}
          </p>

          <div className="mt-2 2xl:mt-3 flex flex-wrap items-baseline gap-1.5 2xl:gap-2">
            <span className="text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#042C51]">
              {item?.value}
            </span>

            {item?.badge ? (
              <span
                className={`rounded px-1.5 py-0.5 sibs-text-micro font-extrabold ${tone.badge}`}
              >
                {item.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-1 2xl:mt-1.5 sibs-text-xs font-bold leading-tight text-[#667085] line-clamp-1">
            {item?.description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          {item?.icon
            ? createElement(item.icon, {
                className: "h-3.5 w-3.5 2xl:h-4 2xl:w-4",
                strokeWidth: 2,
              })
            : null}
        </span>
      </div>

      <ChevronRight className="absolute bottom-2.5 right-2.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 translate-x-1 text-[#FF5C28] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
    </button>
  );
}

export default function AdminDashboardStats({
  metrics = [],
  onMetricClick,
}) {
  return (
    <section className="grid grid-cols-1 gap-2.5 2xl:gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <AdminDashboardMetricCard
          key={metric.id}
          item={metric}
          onClick={() => onMetricClick?.(metric)}
          delay={index * 60}
        />
      ))}
    </section>
  );
}
