import React from "react";
import { CalendarDays, Eye, UserRound } from "lucide-react";

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
  return (
    <article
      className="sibs-page-card-in overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <button
        type="button"
        onClick={onView}
        className="w-full p-3.5 text-left transition hover:bg-[#FFF9F6] active:bg-[#FFF4ED]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-full bg-[#042C51] sibs-text-micro font-extrabold text-white shadow-sm">
              {getInitials(record.candidateName)}
            </span>

            <div className="min-w-0">
              <p className="sibs-text-micro font-extrabold uppercase tracking-wide text-[#6B88A8]">
                {record.onboardingId || record.id}
              </p>
              <h3 className="mt-0.5 truncate sibs-text-xs font-extrabold text-[#101828]">
                {record.candidateName}
              </h3>
              <p className="mt-0.5 truncate sibs-text-micro font-semibold text-[#667085]">
                {record.candidateEmail}
              </p>
            </div>
          </div>

          <Eye size={15} className="mt-1 shrink-0 text-[#FF5C28]" />
        </div>

        <div className="mt-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-2.5">
          <p className="truncate sibs-text-xs font-extrabold text-[#042C51]">
            {record.roleTitle || "Not assigned"}
          </p>
          <p className="mt-0.5 truncate sibs-text-micro font-semibold text-[#667085]">
            {record.account || "No account assigned"}
          </p>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#E6ECF2] bg-white p-2.5">
            <div className="flex items-center gap-1.5 text-[#98A2B3]">
              <CalendarDays size={12} />
              <p className="sibs-text-micro font-extrabold uppercase tracking-wide">
                Expected Start
              </p>
            </div>
            <p className="mt-1 sibs-text-micro font-extrabold text-[#344054]">
              {formatDate(record.expectedStartDate)}
            </p>
          </div>

          <div className="rounded-xl border border-[#E6ECF2] bg-white p-2.5">
            <div className="flex items-center gap-1.5 text-[#98A2B3]">
              <UserRound size={12} />
              <p className="sibs-text-micro font-extrabold uppercase tracking-wide">
                Actual Start
              </p>
            </div>
            <p className="mt-1 sibs-text-micro font-extrabold text-[#344054]">
              {formatDate(record.actualStartDate)}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 sibs-text-micro font-extrabold ${getShowStatusClass(
              record.showStatus,
            )}`}
          >
            {record.showStatus}
          </span>

          <span
            className={`inline-flex rounded-full border px-2.5 py-1 sibs-text-micro font-extrabold ${getOutcomeClass(
              record.finalOutcome,
            )}`}
          >
            {record.finalOutcome}
          </span>

          <span className="ml-auto truncate sibs-text-micro font-bold text-[#667085]">
            Owner: {record.owner || "—"}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-[#EEF2F6] pt-2.5 sibs-text-micro font-extrabold text-[#042C51]">
          <Eye size={13} className="text-[#FF5C28]" />
          View Details
        </div>
      </button>
    </article>
  );
}
