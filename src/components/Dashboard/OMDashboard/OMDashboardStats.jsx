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
      className="sibs-metric-card sibs-page-card-in font-jakarta relative flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2 2xl:gap-2.5">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${tone.label}`}
          >
            {item.label}
          </p>

          <p
            className={`mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums tracking-tight ${tone.value}`}
          >
            {item.value}
          </p>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-bold leading-4 text-[#667085]">
            {item.description}
          </p>
        </div>

        <span
          className={`flex h-7 w-7 2xl:h-8 2xl:w-8 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
        >
          {item.icon
            ? createElement(item.icon, {
                className: "h-3.5 w-3.5 2xl:h-4 2xl:w-4",
                strokeWidth: 2,
              })
            : null}
        </span>
      </div>
    </article>
  );
}

export default function OMDashboardStats({ metrics = [] }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {metrics.map((item, index) => (
        <MetricCard
          key={item.id || item.label}
          item={item}
          delay={index * 60}
        />
      ))}
    </section>
  );
}
