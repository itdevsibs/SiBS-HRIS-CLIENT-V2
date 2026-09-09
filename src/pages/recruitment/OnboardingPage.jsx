import React, { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../components/layout/Header";
import { useOnboarding } from "../../services/context/OnboardingContext";
import { CreateOnboardingModal } from "../../components/modals/onboarding/OnboardingModal.jsx";
import OnboardingDetailsModal from "../../components/modals/onboarding/OnboardingDetailsModal";
import OutcomeModal from "../../components/modals/onboarding/OnboardingOutcomeModal";
import OnboardingStats from "../../components/recruitment/onboarding/OnboardingStats";
import OnboardingOutcomeOverview from "../../components/recruitment/onboarding/OnboardingOutcomeOverview";
import OnboardingFilters from "../../components/recruitment/onboarding/OnboardingFilters";
import OnboardingTable from "../../components/recruitment/onboarding/OnboardingTable";
import { getAcceptedOffers } from "../../lib/axios/onboarding";
import { Plus, RefreshCw } from "lucide-react";
import { PageHeaderHero } from "@/components/ui";

const formatDate = (dateValue) =>
  !dateValue
    ? "—"
    : new Date(dateValue).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

const getDaysToStart = (acceptedDate, expectedDate) =>
  acceptedDate && expectedDate
    ? `${Math.ceil((new Date(expectedDate) - new Date(acceptedDate)) / 86400000)} day/s`
    : "—";

const getShowStatusClass = (status) =>
  status === "Show"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "No Show"
      ? "bg-red-50 text-red-700 border-red-200"
      : status === "Withdrawn"
        ? "bg-orange-50 text-orange-700 border-orange-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

const getOutcomeClass = (outcome) =>
  outcome === "True Hire"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : outcome === "No Show"
      ? "bg-red-50 text-red-700 border-red-200"
      : outcome === "Pre-start Withdrawal"
        ? "bg-orange-50 text-orange-700 border-orange-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

const emptyOnboardingForm = {
  offerId: "",
  candidateApplicationId: "",
  candidateId: "",
  candidateName: "",
  candidateEmail: "",
  roleTitle: "",
  account: "",
  roleAccount: "",
  acceptedOfferDate: "",
  expectedStartDate: "",
  owner: "",
  location: "Davao",
  remarks: "",
};

export default function OnboardingPage() {
  const { fetchList, createRecord, updateOutcome, list } = useOnboarding();

  const refreshTimerRef = useRef(null);
  const loadingDataRef = useRef(false);

  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState(emptyOnboardingForm);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [outcomeRecord, setOutcomeRecord] = useState(null);
  const [outcomeType, setOutcomeType] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const [outcomeForm, setOutcomeForm] = useState({
    actualStartDate: new Date().toISOString().split("T")[0],
    reasonCategory: "No Response",
    remarks: "",
    withdrawalReason: "",
    candidateFeedback: "",
    experienceRating: 3,
    feedbackTag: "",
  });

  const loadData = useCallback(async () => {
    if (loadingDataRef.current) return;

    loadingDataRef.current = true;

    try {
      /*
       * GET /api/onboarding performs the Candidate Pipeline-to-Onboarding
       * synchronization before returning the records.
       */
      await fetchList();

      const response = await getAcceptedOffers();

      setAcceptedOffers(
        response?.success && Array.isArray(response.data) ? response.data : [],
      );
    } finally {
      loadingDataRef.current = false;
    }
  }, [fetchList]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    function scheduleRefresh() {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        loadData();
      }, 180);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") scheduleRefresh();
    }

    window.addEventListener("ta-onboarding-updated", scheduleRefresh);
    window.addEventListener("ta-pipeline-candidates-updated", scheduleRefresh);
    window.addEventListener("focus", scheduleRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(refreshTimerRef.current);
      window.removeEventListener("ta-onboarding-updated", scheduleRefresh);
      window.removeEventListener("ta-pipeline-candidates-updated", scheduleRefresh);
      window.removeEventListener("focus", scheduleRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadData]);

  function handleOpenOutcomeModal(record, type) {
    setOutcomeRecord(record);
    setOutcomeType(type);

    setOutcomeForm((previous) => ({
      ...previous,
      actualStartDate:
        type === "Show" ? new Date().toISOString().split("T")[0] : "",
      feedbackTag:
        type === "No Show"
          ? "No Show"
          : type === "Withdrawn"
            ? "Pre-start Withdrawal"
            : "",
    }));
  }

  async function handleManualRefresh() {
    if (isManualRefreshing) return;

    setIsManualRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsManualRefreshing(false);
    }
  }

  async function handleSubmitCreate(event) {
    event.preventDefault();

    if (isSubmittingCreate) return;

    setIsSubmittingCreate(true);

    try {
      const response = await createRecord(onboardingForm);

      if (!response?.success) {
        window.alert(response?.message || "Failed to create onboarding record.");
        return;
      }

      setShowCreateModal(false);
      setOnboardingForm(emptyOnboardingForm);
      await loadData();
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function handleSubmitOutcome(event) {
    event.preventDefault();

    if (!outcomeRecord?.id) return;

    const finalOutcome =
      outcomeType === "Show"
        ? "True Hire"
        : outcomeType === "No Show"
          ? "No Show"
          : "Pre-start Withdrawal";

    const response = await updateOutcome(outcomeRecord.id, {
      ...outcomeForm,
      finalOutcome,
      showStatus: outcomeType,
    });

    if (!response?.success) {
      window.alert(response?.message || "Failed to update onboarding outcome.");
      return;
    }

    setOutcomeRecord(null);
    setSelectedRecord(null);
    await loadData();
  }

  return (
    <div className="sibs-dashboard-shell">
      <div className="shrink-0">
        <Header />
      </div>

      <main className="sibs-dashboard-main-wide">
        <div className="mx-auto w-full max-w-[1700px] space-y-3.5 sm:space-y-4 2xl:space-y-5">
          <PageHeaderHero
            kicker="Recruitment View"
            title="Onboarding"
            description="Track accepted offers through expected start, actual start, Show / No Show, pre-start withdrawal, and final True Hire conversion."
            actions={
              <div className="flex shrink-0 flex-wrap items-center gap-2 2xl:gap-2.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isManualRefreshing}
                  title="Refresh onboarding data"
                  aria-label="Refresh onboarding data"
                  className="sibs-btn-icon"
                >
                  <RefreshCw className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${isManualRefreshing ? "animate-spin text-sibs-orange" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={setShowCreateModal}
                  className="sibs-btn-primary"
                >
                  <Plus size={15} />
                  Add Onboarding Record
                </button>
              </div>
            }
          />

          <OnboardingStats />
          <OnboardingOutcomeOverview />

          <section
            className="sibs-page-card-in overflow-hidden rounded-2xl border border-sibs-border bg-white font-jakarta shadow-sm"
            style={{ animationDelay: "240ms", animationFillMode: "both" }}
          >
            <header className="border-b border-sibs-border bg-white p-4 sm:p-5 2xl:p-6 font-jakarta">
              <h2 className="sibs-card-title">
                Onboarding Records
              </h2>
              <p className="sibs-card-subtitle">
                Select a row or mobile card to review and resolve candidate start outcomes.
              </p>

              <div className="relative z-[90] mt-3.5 2xl:mt-4 overflow-visible">
                <OnboardingFilters />
              </div>
            </header>

            <div className="min-h-0 flex-1 p-4 sm:p-5 2xl:p-6 font-jakarta">
              <OnboardingTable onView={setSelectedRecord} />
            </div>
          </section>
        </div>
      </main>

      <CreateOnboardingModal
        open={showCreateModal}
        form={onboardingForm}
        setForm={setOnboardingForm}
        onReset={() => setOnboardingForm(emptyOnboardingForm)}
        onClose={() => {
          setShowCreateModal(false);
          setOnboardingForm(emptyOnboardingForm);
        }}
        onboardingList={list}
        acceptedOfferList={acceptedOffers}
        onSubmit={handleSubmitCreate}
        isSubmitting={isSubmittingCreate}
      />

      <OnboardingDetailsModal
        open={Boolean(selectedRecord)}
        item={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onOpenOutcomeModal={handleOpenOutcomeModal}
        formatDate={formatDate}
        getShowStatusClass={getShowStatusClass}
        getOutcomeClass={getOutcomeClass}
        getDaysToStart={getDaysToStart}
      />

      <OutcomeModal
        open={Boolean(outcomeRecord)}
        record={outcomeRecord}
        type={outcomeType}
        form={outcomeForm}
        setForm={setOutcomeForm}
        onClose={() => setOutcomeRecord(null)}
        onSubmit={handleSubmitOutcome}
      />
    </div>
  );
}
