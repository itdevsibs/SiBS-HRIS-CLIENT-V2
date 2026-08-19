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
      className="sibs-metric-card flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-1.5 2xl:gap-3">
        <span
          title={title}
          className={`min-w-0 truncate sibs-text-micro font-extrabold uppercase tracking-normal ${palette.label}`}
        >
          {title}
        </span>

        <div className="flex shrink-0 items-center gap-1.5 2xl:gap-2">
          {auxiliaryValue !== undefined && auxiliaryValue !== null ? (
            <span
              className={`rounded-md border px-1.5 py-0.5 2xl:px-2 2xl:py-1 sibs-text-micro font-extrabold tabular-nums ${palette.auxiliary}`}
            >
              <AnimatedNumber value={auxiliaryValue} />
            </span>
          ) : null}

          {Icon ? (
            <span
              className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 items-center justify-center rounded-full ${palette.icon}`}
            >
              <Icon className="h-3.5 w-3.5 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-1 2xl:mt-1.5">
        <AnimatedNumber
          value={value}
          className={`block text-xl 2xl:text-2xl font-extrabold leading-none tabular-nums tracking-normal ${palette.value}`}
        />
        <p
          title={subtitle}
          className="mt-1 line-clamp-1 truncate sibs-text-micro font-bold leading-tight text-[#667085]"
        >
          {subtitle || "Current selected scope"}
        </p>
      </div>
    </article>
  );
}

