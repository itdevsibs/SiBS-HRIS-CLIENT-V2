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
        <div className="mx-auto w-full max-w-[1600px] space-y-5 2xl:space-y-6">
          <section
            className="sibs-page-header-in sibs-page-card-in sibs-card relative overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-4 shadow-sm 2xl:p-6"
            style={{ animationDelay: "0ms", animationFillMode: "both" }}
          >
            <span className="sibs-top-accent" aria-hidden="true" />

            <div className="mt-0.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-blue-100 bg-[#E9F0FC] px-2 py-0.5 2xl:px-2.5 2xl:py-1 sibs-text-micro font-extrabold uppercase tracking-normal text-[#042C51]">
                    <span className="h-1.5 w-1.5 animate-sibs-pulse rounded-full bg-[#FF5C28]" />
                    Recruitment View
                  </span>
                </div>

                <h1 className="break-words text-lg 2xl:text-2xl font-extrabold text-[#042C51]">
                  Onboarding
                </h1>

                <p className="sibs-text-sm font-semibold leading-relaxed text-[#667085]">
                  Track accepted offers through expected start, actual start, Show / No Show, pre-start withdrawal, and final True Hire conversion.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isManualRefreshing}
                  title="Refresh onboarding data"
                  aria-label="Refresh onboarding data"
                  className="inline-flex h-8.5 2xl:h-10 w-8.5 2xl:w-10 items-center justify-center rounded-lg border border-[#D6E0EA] bg-white text-[#042C51] shadow-sm outline-none transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28] focus-visible:ring-2 focus-visible:ring-[#FF5C28]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={15} className={isManualRefreshing ? "animate-spin" : ""} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] active:scale-[0.98]"
                >
                  <Plus size={15} />
                  Add Onboarding Record
                </button>
              </div>
            </div>
          </section>

          <OnboardingStats />
          <OnboardingOutcomeOverview />

          <section
            className="sibs-page-card-in overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white font-jakarta shadow-sm"
            style={{ animationDelay: "240ms" }}
          >
            <header className="border-b border-[#E6ECF2] bg-white px-5 py-4">
              <h2 className="text-base font-extrabold text-[#042C51]">
                Onboarding Records
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[#667085]">
                Select a row or mobile card to review and resolve candidate start outcomes.
              </p>
            </header>

            <div className="space-y-4 p-4 font-jakarta sm:p-5">
              <OnboardingFilters />
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
