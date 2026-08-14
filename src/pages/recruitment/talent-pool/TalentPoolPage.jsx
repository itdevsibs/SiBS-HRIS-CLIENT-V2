import {
  Database,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  Upload,
  UsersRound,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { useTalentPool } from "../../../services/context/TalentPoolContext";

import TalentPoolStats from "../../../components/recruitment/talentPool/TalentPoolStats";
import TalentPoolFilters from "../../../components/recruitment/talentPool/TalentPoolFilters";
import TalentPoolTable from "../../../components/recruitment/talentPool/TalentPoolTable";
import DropOffListSection from "../../../components/recruitment/shared/DropOffListSection";
import AddCandidateModal from "../../../components/modals/talentPool/AddCandidateModal";
import CandidateProfileModal from "../../../components/modals/talentPool/CandidateProfileModal";
import UpdateStatusModal from "../../../components/modals/talentPool/UpdateStatusModal";
import MoveToPipeLineModal from "../../../components/modals/talentPool/MoveToPipeLineModal";
import useCombinedDropOffCandidates from "../../../hooks/useCombinedDropOffCandidates";

export default function TalentPoolPage() {
  const {
    uploadInputRef,
    openPublicForm,
    openAddCandidateModal,
    downloadLeadTemplate,
    refreshTalentPool,
    uploadLeadsFile,
    setSelectedCandidate,
    isLoading,
    isSaving,
    loadError,
  } = useTalentPool();

  const {
    candidates: dropOffCandidates,
    isLoading: dropOffListLoading,
    loadError: dropOffListError,
    refresh: refreshDropOffCandidates,
  } = useCombinedDropOffCandidates();

  const pageIsRefreshing = isLoading || dropOffListLoading;

  const handleRefreshPage = () => {
    refreshTalentPool();
    refreshDropOffCandidates();
  };

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 font-jakarta shadow-sm sm:p-6"
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-sibs-tertiary-10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-normal text-sibs-primary-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-sibs-primary-2" />
                  Recruitment View
                </div>

                <h1 className="mt-2.5 break-words text-xl font-extrabold tracking-normal text-sibs-primary-1 sm:text-2xl">
                  Talent Pool / Candidate Database
                </h1>

                <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-sibs-tertiary-6 sm:text-sm sm:leading-6">
                  Store reusable candidate master profiles, import leads from CSV,
                  and move qualified candidates to the pipeline.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={handleRefreshPage}
                  disabled={pageIsRefreshing}
                  aria-label="Refresh"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-sibs-tertiary-9 bg-white text-sibs-primary-1 shadow-sm outline-none transition hover:border-sibs-primary-2/40 hover:bg-sibs-primary-3 hover:text-sibs-primary-2 focus-visible:ring-2 focus-visible:ring-sibs-primary-2/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-10"
                >
                  <RefreshCw
                    size={16}
                    className={pageIsRefreshing ? "animate-spin" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={openPublicForm}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sibs-tertiary-9 bg-white px-3.5 text-xs font-extrabold text-sibs-primary-1 shadow-sm outline-none transition hover:border-sibs-primary-2/40 hover:bg-sibs-primary-3 hover:text-sibs-primary-2 focus-visible:ring-2 focus-visible:ring-sibs-primary-2/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                >
                  <ExternalLink size={16} />
                  Public Form
                </button>

                <button
                  type="button"
                  onClick={downloadLeadTemplate}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sibs-tertiary-9 bg-white px-3.5 text-xs font-extrabold text-sibs-primary-1 shadow-sm outline-none transition hover:border-sibs-primary-2/40 hover:bg-sibs-primary-3 hover:text-sibs-primary-2 focus-visible:ring-2 focus-visible:ring-sibs-primary-2/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                >
                  <Download size={16} />
                  CSV Template
                </button>


                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-sibs-tertiary-9 bg-white px-3.5 text-xs font-extrabold text-sibs-primary-1 shadow-sm outline-none transition hover:border-sibs-primary-2/40 hover:bg-sibs-primary-3 hover:text-sibs-primary-2 focus-visible:ring-2 focus-visible:ring-sibs-primary-2/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                >
                  <Upload size={16} />
                  {isSaving ? "Uploading" : "Upload Leads"}
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
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] focus:outline-none focus:ring-4 focus:ring-[#FF5C28]/20"
                >
                  <Plus size={16} />
                  Add Candidate
                </button>
              </div>
            </div>
          </section>

          {loadError ? (
            <section
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700"
              role="alert"
            >
              {loadError}
            </section>
          ) : null}

          <TalentPoolStats />

          <section
            className="sibs-page-card-in sibs-card relative z-[10] overflow-visible"
          >
            <TalentPoolFilters />

            <div className="relative z-[1] overflow-hidden rounded-b-2xl">
              <TalentPoolTable />
            </div>
          </section>

          <DropOffListSection
            candidates={dropOffCandidates}
            isLoading={dropOffListLoading}
            loadError={dropOffListError}
            onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
          />

          <section className="sibs-page-card-in flex items-start gap-3 rounded-xl border border-blue-100 bg-[#F7FAFE] px-4 py-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sibs-tertiary-10 text-sibs-primary-1">
              <Database size={16} />
            </span>

            <div className="min-w-0">
              <h3 className="text-[13px] font-extrabold text-sibs-primary-1">
                Database-Backed Talent Pool
              </h3>

              <p className="mt-0.5 text-xs font-medium leading-5 text-sibs-tertiary-6">
                Public entries, manually added candidates, CSV imports, status
                updates, and pipeline movements are persisted through the backend
                API.
              </p>
            </div>
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
