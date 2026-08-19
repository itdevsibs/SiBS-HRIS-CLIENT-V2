import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
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
import TalentPoolTabs from "../../../components/recruitment/talentPool/TalentPoolTabs";
import DropOffListSection from "../../../components/recruitment/shared/DropOffListSection";
import AddCandidateModal from "../../../components/modals/talentPool/AddCandidateModal";
import CandidateProfileModal from "../../../components/modals/talentPool/CandidateProfileModal";
import UpdateStatusModal from "../../../components/modals/talentPool/UpdateStatusModal";
import MoveToPipeLineModal from "../../../components/modals/talentPool/MoveToPipeLineModal";
import useCombinedDropOffCandidates from "../../../hooks/useCombinedDropOffCandidates";
import {
  filterTalentPoolCandidatesForTab,
  getTalentPoolTabFromSearchParams,
  TALENT_POOL_TABS,
} from "../../../lib/utils/talentPool/talentPoolTabs";

export default function TalentPoolPage() {
  const {
    uploadInputRef,
    openPublicForm,
    openAddCandidateModal,
    downloadLeadTemplate,
    refreshTalentPool,
    uploadLeadsFile,
    setSelectedCandidate,
    candidateList,
    filteredCandidates,
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

  const [searchParams] = useSearchParams();
  const requestedTab = getTalentPoolTabFromSearchParams(searchParams);
  const [activeTab, setActiveTab] = useState(requestedTab);

  useEffect(() => {
    setActiveTab(requestedTab);
  }, [requestedTab]);

  const tabCounts = useMemo(() => ({
    [TALENT_POOL_TABS.ALL]: filterTalentPoolCandidatesForTab(
      candidateList,
      TALENT_POOL_TABS.ALL,
    ).length,
    [TALENT_POOL_TABS.NEW_APPLICANT]: filterTalentPoolCandidatesForTab(
      candidateList,
      TALENT_POOL_TABS.NEW_APPLICANT,
    ).length,
    [TALENT_POOL_TABS.APPLICANT_PIPELINE]: filterTalentPoolCandidatesForTab(
      candidateList,
      TALENT_POOL_TABS.APPLICANT_PIPELINE,
    ).length,
    [TALENT_POOL_TABS.BELOW_18]: filterTalentPoolCandidatesForTab(
      candidateList,
      TALENT_POOL_TABS.BELOW_18,
    ).length,
    [TALENT_POOL_TABS.INCOMPLETE_REQUIREMENTS]: filterTalentPoolCandidatesForTab(
      candidateList,
      TALENT_POOL_TABS.INCOMPLETE_REQUIREMENTS,
    ).length,
    [TALENT_POOL_TABS.DROP_OFF]: dropOffCandidates.length,
  }), [candidateList, dropOffCandidates.length]);

  const tabCandidates = useMemo(() =>
    filterTalentPoolCandidatesForTab(filteredCandidates, activeTab),
  [filteredCandidates, activeTab]);

  const activeTabCopy = {
    [TALENT_POOL_TABS.ALL]: {
      title: "No applicants found",
      message: "All Talent Pool applicants will appear here regardless of their current status.",
    },
    [TALENT_POOL_TABS.NEW_APPLICANT]: {
      title: "No new applicants found",
      message: "Applicants whose current status is New Applicant will appear here.",
    },
    [TALENT_POOL_TABS.APPLICANT_PIPELINE]: {
      title: "No applicants in Candidate Pipeline",
      message: "Candidates currently processed in Candidate Pipeline will appear here, except Incomplete Requirements and Drop Off records.",
    },
    [TALENT_POOL_TABS.BELOW_18]: {
      title: "No applicants below 18",
      message: "Applicants below 18 years old will appear here until they become eligible to move to Candidate Pipeline.",
    },
    [TALENT_POOL_TABS.INCOMPLETE_REQUIREMENTS]: {
      title: "No incomplete NHO requirements",
      message: "Candidates in For Onboarding - Incomplete Requirements will appear here.",
    },
  }[activeTab] || {};

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
            className="sibs-page-card-in sibs-card relative z-[10] overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-xs font-jakarta"
          >
            <div className="border-b border-[#E6ECF2] px-4 py-3.5 sm:px-5 2xl:py-4">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
                  Candidate Directory
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-[#667085]">
                  Search and narrow the reusable candidate database
                </p>
              </div>
            </div>

            <TalentPoolFilters />

            <div className="min-h-0 flex-1 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
              <TalentPoolTabs
                activeTab={activeTab}
                onChange={setActiveTab}
                counts={tabCounts}
              />

              {activeTab === TALENT_POOL_TABS.DROP_OFF ? (
                <div className="overflow-hidden rounded-b-xl border border-t-0 border-[#E6ECF2] bg-white p-4 sm:p-5">
                  <DropOffListSection
                    candidates={dropOffCandidates}
                    isLoading={dropOffListLoading}
                    loadError={dropOffListError}
                    onViewCandidate={(candidate) => setSelectedCandidate(candidate)}
                  />
                </div>
              ) : (
                <div className="relative z-[1]">
                  <TalentPoolTable
                    candidates={tabCandidates}
                    emptyTitle={activeTabCopy.title}
                    emptyMessage={activeTabCopy.message}
                  />
                </div>
              )}
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
