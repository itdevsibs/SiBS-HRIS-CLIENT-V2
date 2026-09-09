import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyStatePanel({
  icon: Icon = Inbox,
  title = "No records found",
  description = "There are currently no items matching your criteria.",
  actionLabel = null,
  onAction = null,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`.trim()}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sibs-cream-light text-sibs-orange border border-[#FFE0D3]">
        <Icon size={22} strokeWidth={2.2} />
      </div>

      <h3 className="mt-3.5 font-heading text-sm font-bold text-sibs-navy">
        {title}
      </h3>

      {description ? (
        <p className="mt-1 max-w-sm font-jakarta text-[11.5px] 2xl:text-[12px] font-semibold text-sibs-muted">
          {description}
        </p>
      ) : null}

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="sibs-btn-primary mt-4"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
