import React from "react";
import { Download, Plus, RefreshCw, Upload } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import { PageHeaderHero } from "@/components/ui";

export default function ApplicantLeadsHeader() {
  const { openAddModal, refreshApplicantLeads, isManualRefreshing } =
    useApplicantLeadsPage();

  const {
    uploadInputRef,
    downloadLeadTemplate,
    uploadLeadsFile,
    isLoading: isTalentPoolLoading,
    isSaving: isTalentPoolSaving,
  } = useTalentPool();

  return (
    <>
      <PageHeaderHero
        kicker="Recruitment View"
        title="Applicant Leads & Inquiries"
        description="Capture walk-ins, calls, social inquiries, referrals, and job fair leads before converting them into full Talent Pool applicants."
        actions={
          <>
            <button
              type="button"
              disabled={isManualRefreshing}
              onClick={refreshApplicantLeads}
              className="sibs-btn-icon"
              title="Refresh Applicant Leads"
              aria-label="Refresh Applicant Leads"
            >
              <RefreshCw
                size={15}
                className={isManualRefreshing ? "animate-spin" : ""}
              />
            </button>

            <button
              type="button"
              onClick={downloadLeadTemplate}
              disabled={isTalentPoolLoading}
              className="sibs-btn-secondary"
            >
              <Download size={14} />
              CSV Template
            </button>

            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isTalentPoolSaving}
              className="sibs-btn-secondary"
            >
              <Upload size={14} />
              {isTalentPoolSaving ? "Uploading" : "Upload Leads"}
            </button>

            <input
              ref={uploadInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={uploadLeadsFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={openAddModal}
              className="sibs-btn-primary"
            >
              <Plus size={15} />
              Log New Lead
            </button>
          </>
        }
      />
    </>
  );
}
