import React from "react";
import {
  Briefcase,
  Calendar,
  GitFork,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

function getInitials(firstName = "", lastName = "") {
  const first = String(firstName || "").trim().charAt(0);
  const last = String(lastName || "").trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "CA";
}

export default function CandidateProfileHero({ data }) {
  const initials = getInitials(data.firstName, data.lastName);
  const fullName = [data.firstName, data.middleName, data.lastName, data.suffix]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D7DEE8] bg-white p-4 sm:p-5 shadow-sm">
      {/* Top Gradient Accent Bar */}
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Avatar & Candidate Identity */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#042C51] text-base font-black text-white shadow-xs">
            {initials}
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500"
              title="Active Record"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#042C51]">
                {fullName || "Candidate Record"}
              </h2>

              {data.stage ? (
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700">
                  {data.stage}
                </span>
              ) : null}

              {data.candidateId ? (
                <span className="rounded-full bg-[#E9F0FC] px-2.5 py-0.5 text-[9px] font-bold text-[#042C51]">
                  {data.candidateId}
                </span>
              ) : null}

              {data.nickname ? (
                <span className="rounded bg-[#F8FAFC] px-2 py-0.5 text-[9px] font-extrabold text-[#667085]">
                  "{data.nickname}"
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 truncate text-xs font-extrabold uppercase text-[#FF5C28]">
              {data.openPosition || "Applied Position"}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[10px] font-semibold text-[#667085]">
              {data.email ? (
                <span className="inline-flex items-center gap-1">
                  <Mail size={11} className="text-[#98A2B3]" />
                  {data.email}
                </span>
              ) : null}

              {data.submissionDate && data.submissionDate !== "—" ? (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} className="text-[#98A2B3]" />
                  Applied: {data.submissionDate}
                </span>
              ) : null}

              {data.openPosition ? (
                <span className="inline-flex items-center gap-1">
                  <GitFork size={11} className="text-[#98A2B3]" />
                  Fit: {data.openPosition}
                </span>
              ) : null}

              {data.applyingLocation ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} className="text-[#98A2B3]" />
                  {data.applyingLocation}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Sourcing Badge */}
        {data.referredBy ? (
          <div className="flex shrink-0 items-center sm:self-center">
            <span className="rounded-full border border-[#FF5C28]/30 bg-[#FFF0EB] px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#FF5C28]">
              Source: {data.referredBy}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
