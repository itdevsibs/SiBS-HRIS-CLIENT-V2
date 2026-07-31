import AnimatedNumber from "./AnimatedNumber";

const TONES = {
  navy: {
    label: "text-[#52637A]",
    value: "text-[#042C51]",
    icon: "bg-[#E9F0FC] text-[#042C51]",
    auxiliary: "border-blue-100 bg-[#E9F0FC] text-[#042C51]",
  },
  orange: {
    label: "text-[#C2410C]",
    value: "text-[#FF5C28]",
    icon: "bg-orange-50 text-[#FF5C28]",
    auxiliary: "border-orange-100 bg-orange-50 text-[#C2410C]",
  },
  green: {
    label: "text-emerald-700",
    value: "text-emerald-600",
    icon: "bg-emerald-50 text-emerald-600",
    auxiliary: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  red: {
    label: "text-rose-700",
    value: "text-rose-600",
    icon: "bg-rose-50 text-rose-600",
    auxiliary: "border-rose-100 bg-rose-50 text-rose-700",
  },
  amber: {
    label: "text-amber-700",
    value: "text-amber-600",
    icon: "bg-amber-50 text-amber-600",
    auxiliary: "border-amber-100 bg-amber-50 text-amber-700",
  },
  indigo: {
    label: "text-indigo-700",
    value: "text-indigo-600",
    icon: "bg-indigo-50 text-indigo-600",
    auxiliary: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
  teal: {
    label: "text-cyan-700",
    value: "text-cyan-600",
    icon: "bg-cyan-50 text-cyan-600",
    auxiliary: "border-cyan-100 bg-cyan-50 text-cyan-700",
  },
};

export default function KpiCard({
  title,
  value,
  auxiliaryValue,
  icon: Icon,
  subtitle,
  tone = "navy",
  delay = 0,
}) {
  const palette = TONES[tone] || TONES.navy;

  return (
    <article
      className="sibs-metric-card flex min-h-[116px] flex-col justify-between overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5C28]/40 hover:shadow-md"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`min-w-0 text-[9px] font-extrabold uppercase tracking-wider ${palette.label}`}
        >
          {title}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          {auxiliaryValue !== undefined && auxiliaryValue !== null ? (
            <span
              className={`rounded border px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${palette.auxiliary}`}
            >
              <AnimatedNumber value={auxiliaryValue} />
            </span>
          ) : null}

          {Icon ? (
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${palette.icon}`}
            >
              <Icon size={15} strokeWidth={2.2} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2">
        <AnimatedNumber
          value={value}
          className={`block text-[25px] font-extrabold leading-none tabular-nums tracking-tight ${palette.value}`}
        />
        <p className="mt-1.5 line-clamp-2 min-h-[28px] text-[10px] font-bold leading-4 text-[#667085]">
          {subtitle || "Current selected scope"}
        </p>
      </div>
    </article>
  );
}
