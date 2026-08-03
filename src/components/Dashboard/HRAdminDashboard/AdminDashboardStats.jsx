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
      className="group sibs-metric-card relative overflow-hidden text-left active:translate-y-0"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-extrabold uppercase tracking-wide ${tone.label}`}
          >
            {item?.label}
          </p>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#042C51]">
              {item?.value}
            </span>

            {item?.badge ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${tone.badge}`}
              >
                {item.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-xs font-bold leading-4 text-[#667085]">
            {item?.description}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          {item?.icon
            ? createElement(item.icon, {
                size: 17,
                strokeWidth: 2,
              })
            : null}
        </span>
      </div>

      <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 translate-x-1 text-[#FF5C28] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
    </button>
  );
}

export default function AdminDashboardStats({
  metrics = [],
  onMetricClick,
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <AdminDashboardMetricCard
          key={metric.id}
          item={metric}
          onClick={() => onMetricClick?.(metric)}
          delay={80 + index * 55}
        />
      ))}
    </section>
  );
}
