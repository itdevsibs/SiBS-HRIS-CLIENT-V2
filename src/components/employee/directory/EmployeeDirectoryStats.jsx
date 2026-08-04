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
      className="sibs-metric-card sibs-card p-4"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0 flex-1 self-stretch">
          <p
            className={`m-0 truncate text-[10px] font-extrabold uppercase tracking-normal ${metricTone.label}`}
          >
            {item.label}
          </p>

          <p
            className={`mt-2 text-3xl font-extrabold leading-none tabular-nums tracking-normal ${metricTone.value}`}
          >
            {item.count}
          </p>

          <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]">
            {item.description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${metricTone.iconWrap} ${metricTone.icon}`}
        >
          <CardIcon size={17} strokeWidth={2} />
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
