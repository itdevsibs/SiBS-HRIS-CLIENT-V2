import { ChevronRight } from "lucide-react";
import { formatNumber } from "../../../lib/utils/weeklyReports/weeklyReportsHelpers.js";

const TONE_MAP = {
  navy: {
    label: "text-sibs-navy",
    value: "text-sibs-navy",
    iconWrap: "bg-blue-50",
    icon: "text-sibs-navy",
  },
  indigo: {
    label: "text-indigo-700",
    value: "text-indigo-500",
    iconWrap: "bg-indigo-50",
    icon: "text-indigo-500",
  },
  green: {
    label: "text-emerald-700",
    value: "text-emerald-700",
    iconWrap: "bg-emerald-50",
    icon: "text-emerald-600",
  },
  teal: {
    label: "text-teal-700",
    value: "text-teal-600",
    iconWrap: "bg-teal-50",
    icon: "text-teal-600",
  },
  orange: {
    label: "text-orange-700",
    value: "text-sibs-orange",
    iconWrap: "bg-sibs-cream-light",
    icon: "text-sibs-orange",
  },
  purple: {
    label: "text-purple-700",
    value: "text-purple-600",
    iconWrap: "bg-purple-50",
    icon: "text-purple-600",
  },
  red: {
    label: "text-rose-700",
    value: "text-rose-600",
    iconWrap: "bg-rose-50",
    icon: "text-rose-600",
  },
};

export default function ModuleSignalCard({ item, delay = 0, tone = "navy" }) {
  const Icon = item.icon;
  const selectedTone = TONE_MAP[tone] || TONE_MAP.navy;

  return (
    <article
      className="sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 font-jakarta"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex h-full items-start justify-between gap-2.5 2xl:gap-3">
        <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
          <div>
            <p
              className={`m-0 truncate sibs-text-micro font-extrabold uppercase ${selectedTone.label}`}
            >
              {item.title}
            </p>

            <p
              className={`font-heading mt-1.5 2xl:mt-2 text-2xl 2xl:text-3xl font-bold leading-none tabular-nums tracking-tight ${selectedTone.value}`}
            >
              {formatNumber(item.value)}
            </p>
          </div>

          <p className="line-clamp-1 truncate sibs-text-micro font-bold text-sibs-muted">
            {item.description}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full ${selectedTone.iconWrap} ${selectedTone.icon}`}
        >
          <Icon className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}
