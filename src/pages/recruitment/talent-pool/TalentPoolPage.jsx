import {
  ExternalLink,
  Download,
  Upload,
  Plus,
  UsersRound,
  RefreshCw,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { useTalentPool } from "../../../services/context/TalentPoolContext";

import TalentPoolStats from "../../../components/recruitment/talentPool/TalentPoolStats";
import TalentPoolFilters from "../../../components/recruitment/talentPool/TalentPoolFilters";
import TalentPoolTable from "../../../components/recruitment/talentPool/TalentPoolTable";

import AddCandidateModal from "../../../components/modals/talentPool/AddCandidateModal";
import CandidateProfileModal from "../../../components/modals/talentPool/CandidateProfileModal";
import UpdateStatusModal from "../../../components/modals/talentPool/UpdateStatusModal";
import MoveToPipeLineModal from "../../../components/modals/talentPool/MoveToPipeLineModal";

export default function TalentPoolPage() {
  const {
    uploadInputRef,
    openPublicForm,
    openAddCandidateModal,
    downloadLeadTemplate,
    uploadLeadsFile,
    refreshTalentPool,
    isLoading,
    isSaving,
    loadError,
  } = useTalentPool();

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-sibs-tertiary-10 p-4 sm:p-6">
        <div className="mx-auto max-w-[1600px] space-y-5">
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <UsersRound size={14} />
                Recruitment
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">
                Talent Pool / Candidate Database
              </h1>

              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Store reusable candidate master profiles, import leads from CSV,
                and move qualified candidates to the pipeline.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={refreshTalentPool}
                disabled={isLoading || isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openPublicForm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98]"
              >
                <ExternalLink size={18} />
                Public Form
              </button>

              <button
                type="button"
                onClick={downloadLeadTemplate}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={18} />
                CSV Template
              </button>

              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8FAFC] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload size={18} />
                {isSaving ? "Uploading..." : "Upload CSV Leads"}
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
                onClick={openAddCandidateModal}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={18} />
                Add Candidate
              </button>
            </div>
          </div>

          {loadError && (
            <section className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {loadError}
            </section>
          )}

          <div className="sibs-profile-tab-panel">
            <TalentPoolStats />
          </div>

          <section className="relative z-[80] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm">
            <TalentPoolFilters />

            <div className="relative z-[1] overflow-hidden rounded-b-2xl">
              <TalentPoolTable />
            </div>
          </section>

          <section className="sibs-profile-tab-panel mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-sibs-primary-1">
              Talent Pool Design Note
            </h3>

            <p className="mt-2 text-sm leading-6 text-sibs-primary-1/80">
              Talent Pool is now database-driven. Public entries, manually added
              candidates, CSV imports, status updates, and pipeline movements
              should be saved through the backend API.
            </p>
          </section>
        </div>
      </main>

      <AddCandidateModal />
      <CandidateProfileModal />
      <UpdateStatusModal />
      <MoveToPipeLineModal />
    </div>
  );
}