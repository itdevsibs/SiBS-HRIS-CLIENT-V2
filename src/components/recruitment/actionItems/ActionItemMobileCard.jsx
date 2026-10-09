import React from "react";
import { CalendarDays, CheckCircle2, Eye, MessageSquareText, UserRound } from "lucide-react";
import { DataCard } from "@/components/ui";
import {
  formatDate,
  getDaysLeft,
  getRiskClass,
  getStatusClass,
} from "../../../lib/utils/actionItems/actionItemsHelpers.js";

export default function ActionItemMobileCard({
  item,
  delay = 0,
  index = 0,
  onOpen,
  onComplete,
}) {
  const systemGenerated =
    item.systemGenerated ||
    String(item.sourceType || "").toLowerCase().includes("system");

  return (
    <DataCard
      index={index}
      style={delay ? { animationDelay: `${delay}ms`, animationFillMode: "both" } : undefined}
      onClick={onOpen}
    >
      <DataCard.Header
        title={item.actionItem}
        subtitle={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-sibs-surface-subtle px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-sibs-navy">
              {item.actionId}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[8px] font-extrabold uppercase ${
                systemGenerated
                  ? "border-purple-100 bg-purple-50 text-purple-700"
                  : "border-blue-100 bg-blue-50 text-blue-700"
              }`}
            >
              {systemGenerated ? "System" : "Manual"}
            </span>
          </div>
        }
        badge={
          <div className="flex flex-col items-end gap-1">
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${getRiskClass(
                item.riskLevel
              )}`}
            >
              {item.riskLevel}
            </span>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${getStatusClass(
                item.status
              )}`}
            >
              {item.status}
            </span>
          </div>
        }
      />

      <DataCard.ContextRow>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-extrabold text-sibs-navy">
            {item.account || "—"}
          </span>
          <span className="text-sibs-faint">•</span>
          <span className="font-semibold text-sibs-muted">
            {item.roleTitle || item.roleAccount || "—"}
          </span>
        </div>
      </DataCard.ContextRow>

      <DataCard.Metrics cols={2}>
        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sibs-surface-subtle text-sibs-muted">
            <UserRound size={13} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-faint">
              Owner
            </span>
            <p className="truncate text-xs font-bold text-sibs-navy">
              {item.owner || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sibs-cream-light text-sibs-orange">
            <CalendarDays size={13} />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-faint">
              Deadline
            </span>
            <p className="truncate text-xs font-bold tabular-nums text-sibs-navy">
              {formatDate(item.deadline)}
            </p>
            <span className="text-[10px] font-bold tabular-nums text-sibs-muted">
              {item.status === "Completed"
                ? `Completed${item.completedDate ? ` ${formatDate(item.completedDate)}` : ""}`
                : getDaysLeft(item.deadline)}
            </span>
          </div>
        </div>
      </DataCard.Metrics>

      {item.remarks && (
        <div className="mt-2.5 rounded-[10px] border border-sibs-border bg-sibs-surface p-2.5">
          <div className="flex items-start gap-1.5 text-xs italic text-sibs-muted">
            <MessageSquareText size={13} className="mt-0.5 shrink-0 text-sibs-orange" />
            <p className="line-clamp-2 leading-relaxed">{item.remarks}</p>
          </div>
        </div>
      )}

      <div
        className="mt-3 flex items-center justify-end gap-2 border-t border-sibs-border pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        {!systemGenerated && item.status !== "Completed" && (
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[10px] bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <CheckCircle2 size={14} />
            <span>Resolve</span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[10px] bg-sibs-navy px-4 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-sibs-navy-hover active:scale-[0.98]"
        >
          <Eye size={14} />
          <span>Details</span>
        </button>
      </div>
    </DataCard>
  );
}

