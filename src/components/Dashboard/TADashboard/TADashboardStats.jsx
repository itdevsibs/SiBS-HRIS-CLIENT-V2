import { createElement } from "react";

const metricTone = {
  navy: {
    label: "text-[#042C51]",
    icon: "bg-[#E9F0FC] text-[#042C51]",
    value: "text-[#042C51]",
  },
  orange: {
    label: "text-[#FF5C28]",
    icon: "bg-orange-50 text-[#FF5C28]",
    value: "text-[#FF5C28]",
  },
  amber: {
    label: "text-amber-800",
    icon: "bg-amber-50 text-amber-600",
    value: "text-amber-600",
  },
  rose: {
    label: "text-rose-800",
    icon: "bg-rose-50 text-rose-600",
    value: "text-rose-600",
  },
  indigo: {
    label: "text-indigo-800",
    icon: "bg-indigo-50 text-indigo-600",
    value: "text-indigo-600",
  },
  slate: {
    label: "text-slate-700",
    icon: "bg-slate-100 text-slate-700",
    value: "text-slate-700",
  },
};

function MetricCard({ item, delay }) {
  const tone = metricTone[item.tone] || metricTone.navy;

  return (
    <article
      className="sibs-metric-card flex flex-col justify-between overflow-hidden p-3.5"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`text-[10px] font-extrabold uppercase tracking-normal ${tone.label}`}
        >
          {item.label}
        </span>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          {item.icon
            ? createElement(item.icon, { size: 17, strokeWidth: 2 })
            : null}
        </span>
      </div>

      <div className="mt-2">
        <p
          className={`text-3xl font-extrabold leading-none tabular-nums tracking-tight ${tone.value}`}
        >
          {item.value}
        </p>

        <p className="mt-1.5 text-xs font-bold leading-4 text-[#667085]">
          {item.description}
        </p>
      </div>
    </article>
  );
}

export default function TADashboardStats({ metrics = [] }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
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
