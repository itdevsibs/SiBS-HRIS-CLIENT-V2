import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import { ApplicantLeadsProvider } from "../../../services/context/ApplicantLeadsContext";
import { useApplicantLeadsPage } from "../../../hooks/applicantLeads/useApplicantLeadsPage";

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

function cleanText(value) {
  return String(value ?? "").trim();
}

function mapConvertedLeadToTalentPoolCandidate(lead = {}, talentPoolCandidate = {}) {
  const leadId = cleanText(lead.leadId || lead.lead_id || lead.id);
  const talentPoolApplicationDbId = cleanText(
    talentPoolCandidate.id ||
      talentPoolCandidate.talentPoolApplicationId ||
      talentPoolCandidate.talent_pool_application_id ||
      lead.talentPoolApplicationId ||
      lead.talent_pool_application_id ||
      lead.applicationId ||
      lead.application_id,
  );
  const talentPoolPublicId = cleanText(
    talentPoolCandidate.candidateId ||
      talentPoolCandidate.candidate_id ||
      lead.candidateId ||
      lead.candidate_id,
  );
  const fullName =
    cleanText(talentPoolCandidate.name || talentPoolCandidate.fullName) ||
    cleanText(lead.fullName || lead.name) ||
    "Unnamed Applicant";
  const appliedPosition = cleanText(
    talentPoolCandidate.openPosition ||
      talentPoolCandidate.open_position ||
      talentPoolCandidate.roleCapability ||
      talentPoolCandidate.role_capability ||
      lead.openPosition ||
      lead.open_position ||
      lead.appliedPosition ||
      lead.applied_position ||
      lead.position ||
      lead.positionTitle ||
      lead.department,
  );

  return {
    ...lead,
    ...talentPoolCandidate,
    id: talentPoolCandidate.id || talentPoolApplicationDbId || leadId || lead.id,
    name: fullName,
    candidateId: talentPoolPublicId,
    leadId,
    talentPoolApplicationId: talentPoolApplicationDbId,
    openPosition: appliedPosition,
    roleCapability: appliedPosition,
    applyingLocation: cleanText(
      talentPoolCandidate.applyingLocation ||
        talentPoolCandidate.applying_location ||
        lead.applyingLocation ||
        lead.applying_location ||
        lead.preferredSite ||
        lead.preferred_site ||
        lead.preferredLocation,
    ),
    currentAppliedAccount: cleanText(
      talentPoolCandidate.currentAppliedAccount ||
        talentPoolCandidate.current_applied_account ||
        talentPoolCandidate.accountFit ||
        talentPoolCandidate.account_fit ||
        lead.currentAppliedAccount ||
        lead.current_applied_account ||
        lead.specificAccount ||
        lead.accountName ||
        lead.account,
    ),
    skillsLanguage: cleanText(
      talentPoolCandidate.skillsLanguage ||
        talentPoolCandidate.skills_language ||
        lead.skillsLanguage ||
        lead.skills_language,
    ),
    status: cleanText(talentPoolCandidate.status) || "Leads Converted",
    currentPipelineStage: cleanText(talentPoolCandidate.currentPipelineStage),
    pipelineStage: cleanText(talentPoolCandidate.pipelineStage),
    currentStage: cleanText(talentPoolCandidate.currentStage),
    pipelineStatus: cleanText(talentPoolCandidate.pipelineStatus),
    lastActivity:
      talentPoolCandidate.lastPipelineUpdate ||
      talentPoolCandidate.lastActivity ||
      lead.movedToTalentPoolAt ||
      lead.updatedAt ||
      lead.dateLogged,
    isConvertedLead: true,
  };
}

function TalentPoolPageContent() {
  const {
    openPublicForm,
    openAddCandidateModal,
    refreshTalentPool,
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
  const {
    archivedLeads,
    archivedLeadCount,
    refreshApplicantLeads,
  } = useApplicantLeadsPage();

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
    [TALENT_POOL_TABS.LEADS_CONVERTED]: archivedLeadCount,
  }), [candidateList, dropOffCandidates.length, archivedLeadCount]);

  const tabCandidates = useMemo(() =>
    filterTalentPoolCandidatesForTab(filteredCandidates, activeTab),
  [filteredCandidates, activeTab]);

  const talentPoolCandidateByApplicationId = useMemo(() => {
    const lookup = new Map();

    candidateList.forEach((candidate) => {
      [
        candidate.talentPoolApplicationId,
        candidate.talent_pool_application_id,
        candidate.candidateId,
        candidate.candidate_id,
        candidate.applicationId,
        candidate.application_id,
        candidate.id,
      ].forEach((value) => {
        const key = cleanText(value);
        if (key) lookup.set(key, candidate);
      });
    });

    return lookup;
  }, [candidateList]);

  const convertedLeadCandidates = useMemo(
    () =>
      archivedLeads.map((lead) => {
        const talentPoolApplicationId = cleanText(
          lead.talentPoolApplicationId ||
            lead.talent_pool_application_id ||
            lead.applicationId ||
            lead.application_id,
        );

        return mapConvertedLeadToTalentPoolCandidate(
          lead,
          talentPoolCandidateByApplicationId.get(talentPoolApplicationId),
        );
      }),
    [archivedLeads, talentPoolCandidateByApplicationId],
  );

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
    [TALENT_POOL_TABS.LEADS_CONVERTED]: {
      title: "No converted leads found",
      message: "Applicant leads moved into Talent Pool will appear here.",
    },
  }[activeTab] || {};

  const pageIsRefreshing = isLoading || dropOffListLoading;

  const handleRefreshPage = () => {
    refreshTalentPool();
    refreshDropOffCandidates();
    refreshApplicantLeads();
  };

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-4 sm:space-y-5 2xl:space-y-6">
          <section
            className="sibs-page-header-in sibs-card relative overflow-hidden rounded-2xl border border-sibs-border bg-white p-4 sm:p-5 2xl:p-6 font-jakarta shadow-sm"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-1 flex flex-col gap-3.5 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-sibs-canvas px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-normal text-sibs-navy">
                  <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                  Recruitment View
                </div>

                <h1 className="font-heading mt-2 break-words text-xl sm:text-2xl 2xl:text-3xl font-bold tracking-tight text-sibs-navy">
                  Talent Pool / Candidate Database
                </h1>

                <p className="mt-0.5 max-w-3xl sibs-text-xs font-semibold leading-relaxed text-sibs-text-muted">
                  Store reusable candidate master profiles, import leads from CSV,
                  and move qualified candidates to the pipeline.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-1.5 2xl:gap-2 sm:justify-end xl:flex-nowrap shrink-0">
                <button
                  type="button"
                  onClick={handleRefreshPage}
                  disabled={pageIsRefreshing}
                  aria-label="Refresh"
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 shrink-0 items-center justify-center rounded-lg border border-sibs-border bg-white text-sibs-navy shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      pageIsRefreshing ? "animate-spin text-sibs-orange" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={openPublicForm}
                  className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg border border-sibs-border bg-white px-2.5 2xl:px-3.5 sibs-text-xs font-extrabold text-sibs-navy shadow-xs outline-none transition hover:border-sibs-orange/40 hover:bg-sibs-cream-subtle hover:text-sibs-orange focus-visible:ring-2 focus-visible:ring-sibs-orange/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto whitespace-nowrap"
                >
                  <ExternalLink size={14} />
                  Public Form
                </button>


                <button
                  type="button"
                  onClick={openAddCandidateModal}
                  disabled={isSaving}
                  className="inline-flex h-8.5 2xl:h-10 shrink-0 items-center justify-center gap-1.5 2xl:gap-2 rounded-lg bg-sibs-orange px-3 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-xs transition hover:bg-sibs-orange/90 focus:outline-none focus:ring-4 focus:ring-sibs-orange/20 active:scale-[0.98] w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus size={15} />
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
            className="sibs-page-card-in sibs-card relative z-[10] overflow-hidden rounded-2xl border border-sibs-border bg-white shadow-xs font-jakarta"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6 font-jakarta">
              <div className="flex flex-col gap-0.5">
                <h2 className="sibs-card-title">
                  Candidate Directory
                </h2>
                <p className="sibs-card-subtitle">
                  Search and narrow the reusable candidate database
                </p>
              </div>

              <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
                <TalentPoolFilters />
              </div>
            </div>

            <div className="min-h-0 flex-1 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
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
              ) : activeTab === TALENT_POOL_TABS.LEADS_CONVERTED ? (
                <TalentPoolTable
                  candidates={convertedLeadCandidates}
                  emptyTitle={activeTabCopy.title}
                  emptyMessage={activeTabCopy.message}
                  recordLabel="converted leads"
                />
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

export default function TalentPoolPage() {
  return (
    <ApplicantLeadsProvider>
      <TalentPoolPageContent />
    </ApplicantLeadsProvider>
  );
}
