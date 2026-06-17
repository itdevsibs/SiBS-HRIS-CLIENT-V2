import React, { useEffect, useState, useCallback } from "react";
import Header from "../../components/layout/Header";
import { useOnboarding } from "../../services/context/OnboardingContext";
import { CreateOnboardingModal } from "../../components/modals/onboarding/OnboardingModal.jsx";
import OnboardingDetailsModal from "../../components/modals/onboarding/OnboardingDetailsModal";
import OutcomeModal from "../../components/modals/onboarding/OnboardingOutcomeModal";
import OnboardingStats from "../../components/recruitment/onboarding/OnboardingStats";
import OnboardingOutcomeOverview from "../../components/recruitment/onboarding/OnboardingOutcomeOverview";
import OnboardingFilters from "../../components/recruitment/onboarding/OnboardingFilters";
import OnboardingTable from "../../components/recruitment/onboarding/OnboardingTable";
import OnboardingProcessNote from "../../components/recruitment/onboarding/OnboardingProcessNote";
import { getAcceptedOffers } from "../../lib/axios/onboarding";
import { ClipboardList, Plus } from "lucide-react";

// 1. ABSOLUTE PARITY HELPERS
const formatDate = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

const getDaysToStart = (a, e) =>
  a && e ? `${Math.ceil((new Date(e) - new Date(a)) / 86400000)} day/s` : "—";

const getShowStatusClass = (s) =>
  s === "Show"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : s === "No Show"
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

const getOutcomeClass = (o) =>
  o === "True Hire"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : o === "No Show"
    ? "bg-red-50 text-red-700 border-red-200"
    : o === "Pre-start Withdrawal"
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
  const { fetchList, updateOutcome, list } = useOnboarding();
  const [acceptedOffers, setAcceptedOffers] = useState([]);

  // MODAL & FORM STATES
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState(emptyOnboardingForm);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [outcomeRecord, setOutcomeRecord] = useState(null);
  const [outcomeType, setOutcomeType] = useState("");
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
    fetchList();
    const res = await getAcceptedOffers();
    if (res.success) setAcceptedOffers(res.data);
  }, [fetchList]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. MODAL HANDLERS (Details -> Outcome Trigger)
  const handleOpenOutcomeModal = (record, type) => {
    setOutcomeRecord(record);
    setOutcomeType(type);
    setOutcomeForm((prev) => ({
      ...prev,
      actualStartDate: type === "Show" ? new Date().toISOString().split("T")[0] : "",
      feedbackTag: type === "No Show" ? "No Show" : "Pre-start Withdrawal",
    }));
  };

  const handleSubmitOutcome = async (e) => {
    e.preventDefault();
    const finalOutcome =
      outcomeType === "Show"
        ? "True Hire"
        : outcomeType === "No Show"
        ? "No Show"
        : "Pre-start Withdrawal";

    await updateOutcome(outcomeRecord.id, {
      ...outcomeForm,
      finalOutcome,
      showStatus: outcomeType,
    });
    setOutcomeRecord(null);
    setSelectedRecord(null);
    fetchList();
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sibs-tertiary-10 font-jakarta">
      <Header />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 bg-sibs-tertiary-10">
        <div className="mx-auto max-w-[1600px] space-y-5">
          {/* HEADER (0ms) */}
          <div className="sibs-page-header-in flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                <ClipboardList size={14} /> Recruitment Setup
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-sibs-primary-1 sm:text-3xl">Onboarding</h1>
              <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                Track transitions, true hires, show/no-show, and pre-start withdrawals.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98]"
            >
              <Plus size={18} /> Add Onboarding Record
            </button>
          </div>

          <OnboardingStats /> {/* Summary Cards (60ms) */}
          <OnboardingOutcomeOverview /> {/* Progress Bars & Alert (120ms) */}

          {/* Records Table Section (240ms) */}
          <section
            className="sibs-profile-tab-panel overflow-visible rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
            style={{ animationDelay: "240ms" }}
          >
            <OnboardingFilters />
            <OnboardingTable onView={setSelectedRecord} />
          </section>

          <OnboardingProcessNote delay={300} />
        </div>
      </main>

      {/* MODALS TRILOGY */}
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
        onSubmit={(e) => {
          e.preventDefault();
          setShowCreateModal(false);
          fetchList();
        }}
      />

      <OnboardingDetailsModal
        open={!!selectedRecord}
        item={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onOpenOutcomeModal={handleOpenOutcomeModal}
        formatDate={formatDate}
        getShowStatusClass={getShowStatusClass}
        getOutcomeClass={getOutcomeClass}
        getDaysToStart={getDaysToStart}
      />

      <OutcomeModal
        open={!!outcomeRecord}
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