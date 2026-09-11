import React from "react";
import { ArrowUpRight, CalendarDays, ExternalLink, Mail, MapPin } from "lucide-react";
import { DataCard } from "@/components/ui";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import {
  formatDate,
  getStatusClass,
} from "../../../lib/utils/talentPool/talentPoolHelpers";
import { isUnder18Candidate } from "../../../lib/utils/talentPool/talentPoolTabs";

function getTalentPoolStatusLabel(status = "") {
  const value = String(status || "").trim();

  if (
    value === "For Onboarding - Incomplete Requirements" ||
    value === "Onboarding - Incomplete Requirements"
  ) {
    return "Incomplete Requirements";
  }

  return value || "—";
}

function getTalentPoolStatusClass(status = "") {
  const value = String(status || "").trim().toLowerCase();

  if (value === "under age") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return getStatusClass(status);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

export default function TalentPoolMobileCard({ candidate, index = 0 }) {
  const { setSelectedCandidate } = useTalentPool();

  const displayStatus = isUnder18Candidate(candidate)
    ? "Under Age"
    : candidate.currentPipelineStage ||
      candidate.pipelineStage ||
      candidate.currentStage ||
      candidate.pipelineStatus ||
      candidate.status ||
      "—";

  const position =
    candidate.openPosition || candidate.roleCapability || "—";
  const location = candidate.applyingLocation || "—";
  const finalAccount = candidate.currentAppliedAccount || "";
  const candidateId =
    candidate.candidateId ||
    candidate.candidate_id ||
    candidate.publicTalentPoolId ||
    candidate.public_talent_pool_id ||
    "Candidate";

  const leadId = cleanText(
    candidate.leadId ||
      candidate.lead_id ||
      candidate.applicantLeadId ||
      candidate.applicant_lead_id ||
      candidate.sourceLeadId ||
      candidate.source_lead_id,
  );

  const lastActivityDate = formatDate(
    candidate.lastPipelineUpdate || candidate.lastActivity,
  );

  const contactInfo = cleanText(candidate.email || candidate.contactNumber, "");

  return (
    <DataCard
      interactive
      onClick={() => setSelectedCandidate(candidate)}
      aria-label={`View candidate ${candidate.name || "profile"}`}
      style={{
        animationDelay: `${index * 30}ms`,
        animationFillMode: "both",
      }}
      className="font-jakarta"
    >
      <DataCard.Header
        title={candidate.name || "—"}
        subtitle={
          <div className="mt-0.5 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wide text-sibs-orange">
                {candidateId}
              </span>
              {leadId && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-text-muted">
                  Lead: {leadId}
                </span>
              )}
            </div>
            {contactInfo ? (
              <p className="flex items-center gap-1.5 truncate text-[11px] font-medium text-sibs-text-muted">
                <Mail size={11} className="shrink-0 text-sibs-text-faint" />
                <span className="truncate">{contactInfo}</span>
              </p>
            ) : null}
          </div>
        }
        badge={
          <span
            title={displayStatus}
            className={`inline-flex max-w-[150px] shrink-0 items-center justify-center rounded-lg border px-2.5 py-1 text-center text-[10px] font-extrabold leading-4 ${getTalentPoolStatusClass(
              displayStatus,
            )}`}
          >
            <span className="line-clamp-2 break-words">
              {getTalentPoolStatusLabel(displayStatus)}
            </span>
          </span>
        }
      />

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg border border-sibs-border bg-sibs-canvas px-2.5 py-2">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-text-faint">
            Applied Position
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-sibs-navy" title={position}>
            {position}
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-sibs-border bg-sibs-canvas px-2.5 py-2">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-sibs-text-faint">
            Preferred Location
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-sibs-text-secondary" title={location}>
            <MapPin size={11} className="shrink-0 text-sibs-text-faint" />
            <span className="truncate">{location}</span>
          </p>
        </div>
      </div>

      {candidate.skillsLanguage ? (
        <div className="mt-2 flex items-center gap-1.5 rounded-md border border-sibs-border bg-slate-50/80 px-2.5 py-1 text-[10.5px] font-semibold text-sibs-text-secondary">
          <span className="font-extrabold text-sibs-navy">Skills:</span>
          <span className="truncate">{candidate.skillsLanguage}</span>
        </div>
      ) : null}

      <DataCard.Metrics cols={2}>
        <DataCard.MetricItem
          label="Final Account"
          value={finalAccount || "—"}
          valueClassName="text-xs font-bold text-sibs-navy"
        />
        <DataCard.MetricItem
          label="Source"
          value={
            <div className="flex items-center justify-center gap-1">
              <span className="truncate">{candidate.source || "Not specified"}</span>
              {candidate.isPublicSubmission ? (
                <span className="inline-flex items-center rounded border border-purple-200 bg-purple-50 px-1 py-0.2 text-[9px] font-extrabold text-purple-700">
                  Public
                </span>
              ) : null}
            </div>
          }
          valueClassName="text-xs font-bold text-sibs-navy"
        />
      </DataCard.Metrics>

      <DataCard.Footer>
        <div className="flex w-full items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-[#667085]">
            <CalendarDays size={12} className="shrink-0 text-[#98A2B3]" />
            Activity: {lastActivityDate}
          </p>

          <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-sibs-cream text-sibs-navy transition group-hover:bg-sibs-orange group-hover:text-white">
            <ArrowUpRight size={13} />
          </span>
        </div>
      </DataCard.Footer>
    </DataCard>
  );
}
