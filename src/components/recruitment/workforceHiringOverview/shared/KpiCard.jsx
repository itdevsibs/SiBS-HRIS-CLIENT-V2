import AnimatedNumber from "./AnimatedNumber";

function getToneClasses(tone = "navy") {
  const safeTone = tone === "teal" ? "green" : tone || "navy";
  return {
    label: `sibs-tone-${safeTone}-label`,
    value: `sibs-tone-${safeTone}-label`,
    icon: `sibs-tone-${safeTone}-icon`,
    auxiliary: `sibs-tone-${safeTone}-icon border`,
  };
}

export default function KpiCard({
  title,
  value,
  auxiliaryValue,
  icon: Icon,
  subtitle,
  tone = "navy",
  delay = 0,
}) {
  const palette = getToneClasses(tone);

  return (
    <article
      className="sibs-metric-card flex min-h-[126px] flex-col justify-between overflow-hidden"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          title={title}
          className={`min-w-0 truncate text-[10px] font-extrabold uppercase tracking-normal ${palette.label}`}
        >
          {title}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          {auxiliaryValue !== undefined && auxiliaryValue !== null ? (
            <span
              className={`rounded-md border px-2 py-1 text-[10px] font-extrabold tabular-nums ${palette.auxiliary}`}
            >
              <AnimatedNumber value={auxiliaryValue} />
            </span>
          ) : null}

          {Icon ? (
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${palette.icon}`}
            >
              <Icon size={17} strokeWidth={2} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        <AnimatedNumber
          value={value}
          className={`block text-3xl font-extrabold leading-none tabular-nums tracking-normal ${palette.value}`}
        />
        <p
          title={subtitle}
          className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-[#667085]"
        >
          {subtitle || "Current selected scope"}
        </p>
      </div>
    </article>
  );
}

