import React from "react";
import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import ApplicantLeadsFilters from "./ApplicantLeadsFilters";
import ApplicantLeadsTable from "./ApplicantLeadsTable";

export default function ApplicantLeadsDirectory() {
  const { filteredLeads, leads } = useApplicantLeadsPage();

  return (
    <section className="sibs-profile-tab-panel sibs-page-card-in overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm">
      <div className="border-b border-[#E6ECF2] px-5 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-extrabold text-[#042C51]">
              Applicant Lead Directory
            </h2>
            <p className="text-sm font-semibold text-[#667085]">
              Search and filter pre-applicant inquiries by status, department,
              account, site, and recruiter account.
            </p>
          </div>

          <span className="inline-flex h-7 shrink-0 items-center rounded-lg bg-[#EEF6FF] px-3 text-[11px] font-extrabold text-[#042C51] ring-1 ring-[#CFE3F8]">
            Showing {filteredLeads.length} of {leads.length} leads
          </span>
        </div>
      </div>

      <ApplicantLeadsFilters />
      <ApplicantLeadsTable />
    </section>
  );
}
