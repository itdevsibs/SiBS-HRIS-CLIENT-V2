export default function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  tone = "navy",
  badge = null,
  delay = 0,
}) {
  const toneMap = {
    navy: {
      label: "text-[#042C51]",
      value: "text-[#042C51]",
      iconWrap: "bg-[#EAF2FB]",
      icon: "text-[#042C51]",
    },
    green: {
      label: "text-[#047857]",
      value: "text-[#047857]",
      iconWrap: "bg-[#ECFDF3]",
      icon: "text-[#059669]",
    },
    amber: {
      label: "text-[#B45309]",
      value: "text-[#F59E0B]",
      iconWrap: "bg-[#FFFBEB]",
      icon: "text-[#F59E0B]",
    },
    red: {
      label: "text-[#BE123C]",
      value: "text-[#E11D48]",
      iconWrap: "bg-[#FFF1F2]",
      icon: "text-[#E11D48]",
    },
    orange: {
      label: "text-[#C2410C]",
      value: "text-[#FF5C28]",
      iconWrap: "bg-[#FFF3ED]",
      icon: "text-[#FF5C28]",
    },
    indigo: {
      label: "text-[#4338CA]",
      value: "text-[#6366F1]",
      iconWrap: "bg-[#EEF2FF]",
      icon: "text-[#6366F1]",
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

          <p className="mt-1 line-clamp-1 truncate sibs-text-micro font-bold text-[#667085]">
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
