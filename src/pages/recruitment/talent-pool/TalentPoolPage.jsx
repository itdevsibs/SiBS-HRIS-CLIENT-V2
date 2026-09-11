import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react";

import Header from "../../../components/layout/Header";
import { useTalentPool } from "../../../services/context/TalentPoolContext";
import { PageHeaderHero } from "@/components/ui";
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

function cleanIdentityValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getCandidateNotificationIdentity(candidate = {}) {
  return {
    id: cleanIdentityValue(candidate.id || candidate.rawId || candidate.raw_id),
    pipelineId: cleanIdentityValue(
      candidate.pipelineId ||
        candidate.pipeline_id ||
        candidate.pipelineDbId ||
        candidate.pipeline_db_id ||
        candidate.candidatePipelineId ||
        candidate.candidate_pipeline_id ||
        candidate.pipelineCandidate?.id ||
        candidate.pipelineCandidate?.dbId,
    ),
    candidateId: cleanIdentityValue(
      candidate.candidateId || candidate.candidate_id,
    ),
    applicationId: cleanIdentityValue(
      candidate.applicationId ||
        candidate.application_id ||
        candidate.candidateApplicationId ||
        candidate.candidate_application_id,
    ),
    email: cleanIdentityValue(candidate.email || candidate.candidateEmail),
    name: cleanIdentityValue(
      candidate.name || candidate.fullName || candidate.full_name,
    ),
  };
}

function matchesNotificationCandidate(candidate = {}, target = {}) {
  const current = getCandidateNotificationIdentity(candidate);

  const expected = {
    id: cleanIdentityValue(target.id),
    pipelineId: cleanIdentityValue(target.pipelineId),
    candidateId: cleanIdentityValue(target.candidateId),
    applicationId: cleanIdentityValue(target.applicationId),
    email: cleanIdentityValue(target.email),
    name: cleanIdentityValue(target.name),
  };

  return Boolean(
    (expected.pipelineId && expected.pipelineId === current.pipelineId) ||
      (expected.candidateId && expected.candidateId === current.candidateId) ||
      (expected.applicationId &&
        expected.applicationId === current.applicationId) ||
      (expected.id && expected.id === current.id) ||
      (expected.email && expected.email === current.email) ||
      (expected.name && expected.name === current.name),
  );
}

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
  const location = useLocation();
  const navigate = useNavigate();

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

  useEffect(() => {
    const notificationState = location.state;

    if (
      notificationState?.source !==
      "incomplete-requirements-notification"
    ) {
      return;
    }

    setActiveTab(TALENT_POOL_TABS.INCOMPLETE_REQUIREMENTS);

    if (isLoading) return;

    const targetIdentity =
      notificationState.candidateIdentity || {};

    const matchedCandidate = candidateList.find((candidate) =>
      matchesNotificationCandidate(candidate, targetIdentity),
    );

    if (matchedCandidate) {
      setSelectedCandidate(matchedCandidate);
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [
    candidateList,
    isLoading,
    location.pathname,
    location.state,
    navigate,
    setSelectedCandidate,
  ]);

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
          <PageHeaderHero
            kicker="Recruitment View"
            title="Talent Pool / Candidate Database"
            description="Store reusable candidate master profiles, import leads from CSV, and move qualified candidates to the pipeline."
            actions={
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRefreshPage}
                    disabled={pageIsRefreshing}
                    aria-label="Refresh"
                    className="sibs-btn-icon shrink-0"
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
                    className="sibs-btn-secondary flex-1 sm:flex-none sm:w-auto whitespace-nowrap"
                  >
                    <ExternalLink size={14} />
                    Public Form
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openAddCandidateModal}
                  disabled={isSaving}
                  className="sibs-btn-primary w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus size={15} />
                  Add Candidate
                </button>
              </div>
            }
          />

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

            <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6">
              <div className="overflow-hidden rounded-xl border border-sibs-border bg-white shadow-xs">
                <TalentPoolTabs
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  counts={tabCounts}
                />

                {activeTab === TALENT_POOL_TABS.DROP_OFF ? (
                  <div className="p-4 sm:p-5">
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
                  <TalentPoolTable
                    candidates={tabCandidates}
                    emptyTitle={activeTabCopy.title}
                    emptyMessage={activeTabCopy.message}
                  />
                )}
              </div>
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
