import { createElement } from "react";

function getToneClasses(tone = "navy") {
  const safeTone = tone === "rose" ? "red" : tone || "navy";
  return {
    label: `sibs-tone-${safeTone}-label`,
    icon: `sibs-tone-${safeTone}-icon`,
    value: `sibs-tone-${safeTone}-label`,
  };
}

function MetricCard({ item, delay }) {
  const tone = getToneClasses(item.tone);

  return (
    <article
      className="sibs-metric-card flex flex-col justify-between overflow-hidden p-3.5"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`min-w-0 line-clamp-2 text-[10px] font-extrabold uppercase tracking-tight ${tone.label}`}
        >
          {item.label}
        </span>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          {item.icon
            ? createElement(item.icon, { size: 16, strokeWidth: 2 })
            : null}
        </span>
      </div>

      <div className="mt-2">
        <p
          className={`text-2xl sm:text-3xl font-extrabold leading-none tabular-nums tracking-tight ${tone.value}`}
        >
          {item.value}
        </p>

        <p className="mt-1.5 truncate text-xs font-bold leading-4 text-[#667085]">
          {item.description}
        </p>
      </div>
    </article>
  );
}

export default function TADashboardStats({ metrics = [] }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
      {metrics.map((item, index) => (
        <MetricCard
          key={item.id || item.label}
          item={item}
          delay={80 + index * 55}
        />
      ))}
    </section>
  );
}
