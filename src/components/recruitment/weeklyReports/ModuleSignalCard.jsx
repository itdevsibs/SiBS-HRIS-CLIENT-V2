import { ChevronRight } from "lucide-react";
import { formatNumber } from "../../../lib/utils/weeklyReports/weeklyReportsHelpers.js";

const TONE_MAP = {
  navy: {
    label: "text-[#042C51]",
    value: "text-[#042C51]",
    iconWrap: "bg-[#EAF2FB]",
    icon: "text-[#042C51]",
  },
  indigo: {
    label: "text-[#4338CA]",
    value: "text-[#6366F1]",
    iconWrap: "bg-[#EEF2FF]",
    icon: "text-[#6366F1]",
  },
  green: {
    label: "text-[#047857]",
    value: "text-[#047857]",
    iconWrap: "bg-[#ECFDF3]",
    icon: "text-[#059669]",
  },
  teal: {
    label: "text-[#0F766E]",
    value: "text-[#0D9488]",
    iconWrap: "bg-[#F0FDFA]",
    icon: "text-[#0D9488]",
  },
  orange: {
    label: "text-[#C2410C]",
    value: "text-[#FF5C28]",
    iconWrap: "bg-[#FFF3ED]",
    icon: "text-[#FF5C28]",
  },
  purple: {
    label: "text-[#7E22CE]",
    value: "text-[#9333EA]",
    iconWrap: "bg-[#FAF5FF]",
    icon: "text-[#9333EA]",
  },
  red: {
    label: "text-[#BE123C]",
    value: "text-[#E11D48]",
    iconWrap: "bg-[#FFF1F2]",
    icon: "text-[#E11D48]",
  },
};

export default function ModuleSignalCard({ item, delay = 0, tone = "navy" }) {
  const Icon = item.icon;
  const risk = Boolean(item.hasRisk);
  const selectedTone = risk ? TONE_MAP.red : TONE_MAP[tone] || TONE_MAP.navy;

  return (
    <article
      className={`sibs-metric-card sibs-page-card-in flex h-[104px] 2xl:h-[116px] flex-col justify-between overflow-hidden p-3 2xl:p-3.5 ${
        risk ? "!border-red-200" : ""
      }`}
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
              className={`mt-1 text-2xl 2xl:text-3xl font-extrabold leading-none tabular-nums ${selectedTone.value}`}
            >
              {formatNumber(item.value)}
            </p>
          </div>

          <p className={`line-clamp-1 truncate sibs-text-micro font-bold ${risk ? "text-red-600" : "text-[#667085]"}`}>
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
