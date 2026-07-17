import { useEffect, useMemo, useState } from "react";

function parseAnimatedValue(value) {
  const cleanValue = String(value ?? "").trim();

  const numericValue = Number(cleanValue.replace(/,/g, "").replace("%", ""));

  return {
    raw: cleanValue,
    number: Number.isFinite(numericValue) ? numericValue : 0,
    isNumeric: Number.isFinite(numericValue),
    hasPercent: cleanValue.includes("%"),
    hasComma:
      typeof value === "number" ||
      cleanValue.includes(",") ||
      Math.abs(numericValue) >= 1000,
    decimals: cleanValue.includes(".")
      ? cleanValue.split(".")[1]?.replace("%", "").length || 0
      : 0,
  };
}

function formatAnimatedValue(value, meta) {
  if (!meta.isNumeric) return meta.raw;

  const decimals = meta.decimals;

  const formattedNumber = meta.hasComma
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : value.toFixed(decimals);

  return meta.hasPercent ? `${formattedNumber}%` : formattedNumber;
}

function useAnimatedNumber(value, duration = 850) {
  const meta = useMemo(() => parseAnimatedValue(value), [value]);

  const [displayValue, setDisplayValue] = useState(() =>
    formatAnimatedValue(0, meta),
  );

  useEffect(() => {
    if (!meta.isNumeric) {
      setDisplayValue(meta.raw);
      return;
    }

    let animationFrameId;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = meta.number;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(formatAnimatedValue(currentValue, meta));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [duration, meta]);

  return displayValue;
}

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
    green2: "text-green-600",
    orange: "text-orange-500",
    red: "text-red-600",
    purple: "text-violet-600",
    teal: "text-cyan-600",
  };

  const mainDisplayValue = useAnimatedNumber(sideValue || value);
  const sideDisplayValue = useAnimatedNumber(value);

  const IconComponent = icon;

  return (
    <div
      className={[
        "flex min-h-[160px] flex-col rounded-xl border border-slate-200 bg-white px-3 py-4 text-center shadow-sm",
        toneClass[tone] || "text-sibs-primary-80",
      ].join(" ")}
    >
      <div className="flex h-[30px] items-start justify-center overflow-hidden">
        <h4 className="m-0 max-w-full whitespace-nowrap text-[13px] font-extrabold leading-tight tracking-[-0.01em] text-slate-950">
          {title}
        </h4>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex h-[48px] items-center justify-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-current/10">
            <IconComponent className="h-7 w-7" strokeWidth={2.5} />
          </span>

          {sideValue ? (
            <span className="text-[28px] font-bold leading-none tracking-[-0.03em]">
              {sideDisplayValue}
            </span>
          ) : null}
        </div>

        <strong className="mt-2 block text-[34px] font-extrabold leading-none tracking-[-0.045em]">
          {mainDisplayValue}
        </strong>

        <div className="mt-2 flex min-h-[18px] items-start justify-center">
          {subtitle ? (
            <p className="m-0 text-xs font-semibold leading-tight tracking-[-0.01em] text-slate-600">
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
