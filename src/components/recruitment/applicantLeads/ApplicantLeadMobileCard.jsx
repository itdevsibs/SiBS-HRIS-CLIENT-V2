import React from "react";
import {
  CircleCheckBig,
  Mail,
  MapPin,
  Phone,
  RotateCw,
  UserRound,
} from "lucide-react";
import { DataCard } from "@/components/ui";
import ApplicantLeadStatusBadge from "./ApplicantLeadStatusBadge";
import { isApplicantLeadApplicationLinkSent } from "../../../lib/utils/applicantLeads/applicantLeadEmailStatus";

function cleanText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export default function ApplicantLeadMobileCard({
  lead,
  activeLeadView,
  onOpenEdit,
  onRequestSendEmail,
  isSendingApplicationLink,
}) {
  const leadId = cleanText(lead.leadId || lead.lead_id, "");
  const fullName = cleanText(lead.fullName, "Unnamed Applicant");
  const phone = cleanText(lead.cpNum);
  const email = cleanText(lead.email);
  const department = cleanText(lead.department);
  const account = cleanText(lead.specificAccount);
  const site = cleanText(lead.preferredSite);
  const inputtedBy = cleanText(lead.inputtedBy);
  const dateLogged = cleanText(lead.dateLogged);
  const applicationLinkSent = isApplicantLeadApplicationLinkSent(lead);
  const talentPoolApplicationId = cleanText(lead.talentPoolApplicationId, "");

  return (
    <DataCard
      interactive
      onClick={() => onOpenEdit?.(lead)}
      aria-label={`View applicant lead ${fullName}`}
    >
      <DataCard.Header
        title={fullName}
        subtitle={
          <div className="flex flex-wrap items-center gap-1.5">
            {leadId && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#98A2B3]">
                Lead ID: {leadId}
              </span>
            )}
            {activeLeadView === "archive" && talentPoolApplicationId ? (
              <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-700">
                • TP ID: {talentPoolApplicationId}
              </span>
            ) : null}
          </div>
        }
        badge={<ApplicantLeadStatusBadge status={lead.status} />}
      />

      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
        {phone && phone !== "-" && (
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-sibs-text-secondary hover:text-sibs-orange tabular-nums"
          >
            <Phone size={11} strokeWidth={2} className="shrink-0 text-emerald-600" />
            <span className="truncate">{phone}</span>
          </a>
        )}
        {email && email !== "-" && (
          <a
            href={`mailto:${email}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-sibs-text-muted hover:text-sibs-orange"
          >
            <Mail size={11} strokeWidth={2} className="shrink-0 text-sibs-text-faint" />
            <span className="max-w-[200px] truncate">{email}</span>
          </a>
        )}
      </div>

      <DataCard.ContextRow>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-extrabold text-sibs-navy">{department}</span>
          {account && account !== "-" && (
            <>
              <span className="text-sibs-text-faint">•</span>
              <span className="text-sibs-text-muted">
                Account: <span className="font-semibold text-sibs-text-secondary">{account}</span>
              </span>
            </>
          )}
        </div>
        {site && site !== "-" && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold text-sibs-text-muted">
            <MapPin size={11} className="shrink-0 text-sibs-text-faint" />
            {site}
          </span>
        )}
      </DataCard.ContextRow>

      <DataCard.Metrics cols={2}>
        <DataCard.MetricItem
          label="Inputted By"
          value={
            <span className="inline-flex items-center gap-1">
              <UserRound size={11} className="shrink-0 text-sibs-orange" />
              <span className="truncate">{inputtedBy}</span>
            </span>
          }
          valueClassName="text-[11px] font-bold text-sibs-navy"
        />
        <DataCard.MetricItem
          label="Date Logged"
          value={dateLogged}
          valueClassName="text-[11px] font-bold text-sibs-navy tabular-nums"
        />
      </DataCard.Metrics>

      {activeLeadView !== "archive" && (
        <DataCard.Footer>
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-[#98A2B3]">
              {applicationLinkSent ? "Link email dispatched" : "Awaiting application link"}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSendingApplicationLink}
                onClick={(event) => onRequestSendEmail?.(event, lead)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-extrabold transition active:scale-95 disabled:cursor-not-allowed ${
                  applicationLinkSent
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
              >
                {applicationLinkSent ? (
                  <>
                    <RotateCw size={11} strokeWidth={2.2} />
                    Resend Link
                  </>
                ) : (
                  <>
                    <Mail size={11} strokeWidth={2} />
                    Send Link
                  </>
                )}
              </button>

              {applicationLinkSent ? (
                <span
                  title="Application link email has been sent"
                  className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-600"
                >
                  <CircleCheckBig size={12} strokeWidth={2.2} />
                </span>
              ) : null}
            </div>
          </div>
        </DataCard.Footer>
      )}
    </DataCard>
  );
}
