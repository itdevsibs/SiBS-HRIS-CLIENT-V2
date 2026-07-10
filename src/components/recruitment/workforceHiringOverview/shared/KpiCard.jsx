export default function KpiCard({
  title,
  value,
  sideValue,
  icon,
  subtitle,
  tone,
}) {
  const toneClass = {
    blue: "text-sibs-primary-80",
    green: "text-emerald-600",
    orange: "text-orange-500",
    red: "text-red-600",
    purple: "text-violet-600",
    teal: "text-cyan-600",
  };

  const displayValue =
    typeof value === "number" ? value.toLocaleString("en-US") : value;
  const IconComponent = icon;

  return (
    <div
      className={`flex min-h-[160px] flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm ${
        toneClass[tone] || "text-sibs-primary-80"
      }`}
    >
      <div className="flex h-[28px] items-start justify-center overflow-hidden">
        <h4 className="m-0 max-w-full whitespace-nowrap text-[13px] font-bold leading-tight text-slate-900">
          {title}
        </h4>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <div className="flex h-[46px] items-center justify-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-current/10">
            <IconComponent className="h-7 w-7" strokeWidth={2.4} />
          </span>

          {sideValue ? (
            <strong className="text-[26px] font-semibold leading-none">
              {displayValue}
            </strong>
          ) : null}
        </div>

        <div className="flex items-center justify-center">
          <strong className="block text-[30px] font-semibold leading-none tracking-tight">
            {sideValue || displayValue}
          </strong>
        </div>

        <div className="flex items-start justify-center">
          {subtitle ? (
            <p className="m-0 text-xs font-semibold leading-tight text-slate-500">
              {subtitle}
            </p>
          ) : (
            <span className="h-4" />
          )}
        </div>
      </div>
    </div>
  );
}
