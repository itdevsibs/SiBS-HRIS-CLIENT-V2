import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

function cleanText(value) {
  return String(value ?? "").trim();
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return ["", "—", "-", "n/a", "na"].includes(cleanText(value).toLowerCase());
}

export function CandidateProfileField({
  label,
  value,
  copyable = false,
  highlight = false,
  className = "",
}) {
  const [copied, setCopied] = useState(false);
  const isFilled = !isEmptyValue(value);

  function handleCopy() {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>
      <div className="group mt-0.5 flex min-w-0 items-center gap-1.5">
        <p
          title={isFilled ? String(value) : undefined}
          className={`min-w-0 flex-1 truncate text-xs font-extrabold leading-5 ${
            highlight ? "text-[#FF5C28]" : isFilled ? "text-[#344054]" : "text-[#98A2B3]"
          }`}
        >
          {isFilled ? String(value) : "N/A"}
        </p>

        {copyable && isFilled && (
          <button
            type="button"
            onClick={handleCopy}
            title={`Copy ${label}`}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[#98A2B3] opacity-0 transition hover:bg-[#E6ECF2] hover:text-[#042C51] group-hover:opacity-100 focus:opacity-100"
          >
            {copied ? (
              <Check size={10} className="text-emerald-600" />
            ) : (
              <Copy size={10} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function CandidateProfilePanel({
  title,
  children,
  badge = null,
  className = "",
}) {
  return (
    <section
      className={`p-4 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#E6ECF2]/60 pb-2">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-[#042C51]">
          {title}
        </h4>
        {badge ? (
          <span className="rounded bg-[#E9F0FC] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#042C51]">
            {badge}
          </span>
        ) : null}
      </div>

      <div>{children}</div>
    </section>
  );
}
