import React from "react";
import { CalendarDays, ChevronRight, Eye, Mail, UserRound } from "lucide-react";
import { DataCard } from "@/components/ui";

function getInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "ON";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function OnboardingMobileCardView({
  record,
  onView,
  formatDate,
  getShowStatusClass,
  getOutcomeClass,
  delay = 0,
}) {
  const candidateName = record.candidateName || "Candidate";
  const onboardingId = record.onboardingId || record.id || "—";
  const email = record.candidateEmail;
  const owner = record.owner || "—";

  return (
    <DataCard
      interactive
      onClick={onView}
      aria-label={`View onboarding record for ${candidateName}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
      className="font-jakarta"
    >
      <DataCard.Header
        avatar={
          <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-[#042C51] text-xs font-extrabold text-white shadow-sm">
            {getInitials(candidateName)}
          </span>
        }
        title={candidateName}
        subtitle={
          <div className="mt-0.5 space-y-0.5">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
              {onboardingId}
            </span>
            {email ? (
              <p className="flex items-center gap-1.5 truncate text-[11px] font-medium text-[#667085]">
                <Mail size={11} className="shrink-0 text-[#98A2B3]" />
                <span className="truncate">{email}</span>
              </p>
            ) : null}
          </div>
        }
        badge={
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${getShowStatusClass(
                record.showStatus,
              )}`}
            >
              {record.showStatus}
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${getOutcomeClass(
                record.finalOutcome,
              )}`}
            >
              {record.finalOutcome}
            </span>
          </div>
        }
      />

      <DataCard.ContextRow>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8A98B8]">
            Role Assignment
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-[#042C51]">
            {record.roleTitle || "Not assigned"}
          </p>
        </div>
        <div className="min-w-0 flex-1 border-l border-[#E6ECF2] pl-2.5">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#8A98B8]">
            Account
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-[#344054]">
            {record.account || "No account assigned"}
          </p>
        </div>
      </DataCard.ContextRow>

      <DataCard.Metrics cols={3}>
        <DataCard.MetricItem
          label="Offer Accepted"
          value={
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} className="shrink-0 text-[#98A2B3]" />
              <span>{formatDate(record.acceptedOfferDate)}</span>
            </span>
          }
          valueClassName="text-xs font-bold text-[#042C51]"
        />
        <DataCard.MetricItem
          label="Expected Start"
          value={
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} className="shrink-0 text-[#98A2B3]" />
              <span>{formatDate(record.expectedStartDate)}</span>
            </span>
          }
          valueClassName="text-xs font-bold text-[#042C51]"
        />
        <DataCard.MetricItem
          label="Actual Start"
          value={
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} className="shrink-0 text-[#98A2B3]" />
              <span>{formatDate(record.actualStartDate)}</span>
            </span>
          }
          valueClassName="text-xs font-bold text-[#042C51]"
        />
      </DataCard.Metrics>

      <DataCard.Footer>
        <div className="flex w-full items-center justify-between gap-2">
          <p className="flex items-center gap-1 truncate text-[10px] font-semibold text-[#667085]">
            <UserRound size={11} className="shrink-0 text-[#98A2B3]" />
            <span className="truncate">TA Owner: {owner}</span>
          </p>

          <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#FF5C28] group-hover:underline">
            <Eye size={12} />
            View Record
            <ChevronRight size={12} />
          </span>
        </div>
      </DataCard.Footer>
    </DataCard>
  );
}
