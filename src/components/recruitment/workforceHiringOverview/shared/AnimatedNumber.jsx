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

  const formattedNumber = meta.hasComma
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: meta.decimals,
        maximumFractionDigits: meta.decimals,
      })
    : value.toFixed(meta.decimals);

  return meta.hasPercent ? `${formattedNumber}%` : formattedNumber;
}

export function useAnimatedNumber(value, enabled = true, duration = 700) {
  const meta = useMemo(() => parseAnimatedValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(() =>
    formatAnimatedValue(enabled ? 0 : meta.number, meta),
  );

  useEffect(() => {
    if (!meta.isNumeric) {
      setDisplayValue(meta.raw);
      return undefined;
    }

    if (!enabled || typeof window === "undefined") {
      setDisplayValue(formatAnimatedValue(meta.number, meta));
      return undefined;
    }

    let animationFrameId;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(
        formatAnimatedValue(meta.number * easedProgress, meta),
      );

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    }

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [duration, enabled, meta]);

  return displayValue;
}

export default function AnimatedNumber({
  value,
  enabled = true,
  duration = 700,
  className = "",
}) {
  const displayValue = useAnimatedNumber(value, enabled, duration);

  return <span className={className}>{displayValue}</span>;
}
