import React from "react";
import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import ApplicantLeadViewTabs from "./ApplicantLeadViewTabs";
import ApplicantLeadsChannelSources from "./ApplicantLeadsChannelSources";
import ApplicantLeadsFilters from "./ApplicantLeadsFilters";
import ApplicantLeadsTable from "./ApplicantLeadsTable";

export default function ApplicantLeadsDirectory() {
  const { leadView } = useApplicantLeadsPage();
  const selectedStatus = leadView.startsWith("status:")
    ? leadView.slice("status:".length)
    : "";

  const title =
    leadView === "channels"
        ? "Channel Sources"
        : "Applicant Lead Directory";

  const description =
    leadView === "channels"
        ? "Review lead-generation source mix and account intake volume."
        : selectedStatus
          ? `Showing applicant leads currently marked as ${selectedStatus}.`
        : "Search and filter pre-applicant inquiries by status, department, account, site, and recruiter account.";

  return (
    <section className="sibs-page-card-in overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta">
      <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
        <div className="flex flex-col gap-0.5">
          <h2 className="sibs-card-title">
            {title}
          </h2>
          <p className="sibs-card-subtitle">
            {description}
          </p>
        </div>

        <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
          <ApplicantLeadsFilters />
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
        <ApplicantLeadViewTabs />
        {leadView === "channels" ? (
          <div className="overflow-hidden rounded-b-xl border border-t-0 border-sibs-border bg-white">
            <ApplicantLeadsChannelSources />
          </div>
        ) : (
          <ApplicantLeadsTable />
        )}
      </div>
    </section>
  );
}
