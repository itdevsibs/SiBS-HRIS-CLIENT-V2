function getMetricTone(tone) {
  const safeTone = tone === "emerald" ? "green" : tone || "navy";
  return {
    label: `sibs-tone-${safeTone}-label`,
    value: `sibs-tone-${safeTone}-label`,
    iconWrap: `sibs-tone-${safeTone}-icon`,
    icon: "",
  };
}

function SummaryCard({ item, delay = 0 }) {
  const metricTone = getMetricTone(item.tone);
  const CardIcon = item.icon;

  return (
    <article
      className="sibs-metric-card font-jakarta flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${metricTone.label}`}
          >
            {item.label}
          </p>

          <p
            className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${metricTone.value}`}
          >
            {item.count}
          </p>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-bold leading-4 text-[#667085]">
            {item.description}
          </p>
        </div>

        <div
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${metricTone.iconWrap} ${metricTone.icon}`}
        >
          <CardIcon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}

export default function EmployeeDirectoryStats({ tabs }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {tabs.map((tab, index) => (
        <SummaryCard key={tab.label} item={tab} delay={index * 60} />
      ))}
    </section>
  );
}
