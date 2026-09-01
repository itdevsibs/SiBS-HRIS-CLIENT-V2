import React from "react";
import { Download, Plus, RefreshCw, Upload } from "lucide-react";

import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";
import { useTalentPool } from "../../../services/context/TalentPoolContext";

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
    <section className="sibs-page-header-in sibs-card relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 shadow-sm 2xl:p-6 font-jakarta">
      <span className="sibs-top-accent" aria-hidden="true" />

      <div className="mt-1 flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-sibs-navy">
              <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
              Recruitment View
            </span>
          </div>

          <h1 className="font-heading break-words text-xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
            Applicant Leads & Inquiries
          </h1>

          <p className="max-w-3xl text-xs font-semibold leading-relaxed text-sibs-muted">
            Capture walk-ins, calls, social inquiries, referrals, and job fair
            leads before converting them into full Talent Pool applicants.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end md:self-auto">
          <button
            type="button"
            disabled={isManualRefreshing}
            onClick={refreshApplicantLeads}
            className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-sibs-border-subtle bg-white text-sibs-navy shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-sibs-border-subtle bg-white px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-sibs-navy shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
          >
            <Download size={14} />
            CSV Template
          </button>

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isTalentPoolSaving}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-sibs-border-subtle bg-white px-3 2xl:px-3.5 sibs-text-xs font-extrabold text-sibs-navy shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-light hover:text-sibs-orange disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
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
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-sibs-orange px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-sibs-button-hover focus:outline-none focus:ring-4 focus:ring-sibs-orange/20"
          >
            <Plus size={15} />
            Log New Lead
          </button>
        </div>
      </div>
    </section>
  );
}
