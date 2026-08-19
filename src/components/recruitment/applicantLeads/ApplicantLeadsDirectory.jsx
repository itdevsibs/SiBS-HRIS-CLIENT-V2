import React from "react";
import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import ApplicantLeadViewTabs from "./ApplicantLeadViewTabs";
import ApplicantLeadsChannelSources from "./ApplicantLeadsChannelSources";
import ApplicantLeadsFilters from "./ApplicantLeadsFilters";
import ApplicantLeadsTable from "./ApplicantLeadsTable";

export default function ApplicantLeadsDirectory() {
  const { filteredLeads, leads, leadView, activeLeadCount, archivedLeadCount } =
    useApplicantLeadsPage();

  const title =
    leadView === "archive"
      ? "Moved to Talent Pool Archive"
      : leadView === "channels"
        ? "Channel Sources"
        : "Applicant Lead Directory";

  const description =
    leadView === "archive"
      ? "Historical repository of applicant leads converted and transferred to the Talent Pool module."
      : leadView === "channels"
        ? "Review lead-generation source mix and account intake volume."
        : "Search and filter pre-applicant inquiries by status, department, account, site, and recruiter account.";

  const totalForView =
    leadView === "archive"
      ? archivedLeadCount
      : leadView === "active"
        ? activeLeadCount
        : leads.length;

  return (
    <section className="sibs-page-card-in overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-xs font-jakarta">
      <div className="border-b border-[#E6ECF2] px-4 py-3.5 sm:px-5 2xl:py-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
            {title}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-[#667085]">
            {description}
          </p>
        </div>
      </div>

      <ApplicantLeadsFilters />

      <div className="min-h-0 flex-1 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        <ApplicantLeadViewTabs />
        {leadView === "channels" ? (
          <div className="overflow-hidden rounded-b-xl border border-t-0 border-[#E6ECF2] bg-white">
            <ApplicantLeadsChannelSources />
          </div>
        ) : (
          <ApplicantLeadsTable />
        )}
      </div>
    </section>
  );
}
