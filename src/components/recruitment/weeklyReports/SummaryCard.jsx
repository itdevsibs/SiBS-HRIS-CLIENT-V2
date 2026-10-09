import React from "react";

export default function SummaryCard({
  title,
  value,
  icon,
  description,
  tone = "navy",
  delay = 0,
}) {
  const Icon = icon;
  const toneMap = {
    navy: {
      label: "text-sibs-navy",
      value: "text-sibs-navy",
      iconWrap: "bg-blue-50",
      icon: "text-sibs-navy",
    },
    green: {
      label: "text-emerald-700",
      value: "text-emerald-700",
      iconWrap: "bg-emerald-50",
      icon: "text-emerald-600",
    },
    amber: {
      label: "text-amber-700",
      value: "text-amber-500",
      iconWrap: "bg-amber-50",
      icon: "text-amber-500",
    },
    red: {
      label: "text-rose-700",
      value: "text-rose-600",
      iconWrap: "bg-rose-50",
      icon: "text-rose-600",
    },
    orange: {
      label: "text-orange-700",
      value: "text-sibs-orange",
      iconWrap: "bg-sibs-cream-light",
      icon: "text-sibs-orange",
    },
    indigo: {
      label: "text-indigo-700",
      value: "text-indigo-500",
      iconWrap: "bg-indigo-50",
      icon: "text-indigo-500",
    },
  };

  const currentTone = toneMap[tone] || toneMap.navy;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] min-h-[96px] 2xl:min-h-[112px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${currentTone.label}`}>
              {title}
            </p>
            <p className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${currentTone.value}`}>
              {Number(value || 0).toLocaleString("en-US")}
            </p>
          </div>

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-bold text-sibs-muted">
            {description}
          </p>
        </div>

        <span className={`flex h-7.5 w-7.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${currentTone.iconWrap} ${currentTone.icon}`}>
          <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}
