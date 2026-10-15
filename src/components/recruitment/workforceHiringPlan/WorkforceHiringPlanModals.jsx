import React from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ViewPlanModal from "../../modals/workforceHiringPlan/ViewPlanModal";
import KPISnapshotModal from "../../modals/workforceHiringPlan/KPISnapshotModal";
import AIInsightModal from "./AIInsightModal";

export default function WorkforceHiringPlanModals({
  statusModal = {},
  closeStatusModal,
  showKpiSnapshot = false,
  activeWeek,
  filteredPlans = [],
  setShowKpiSnapshot,
  aiInsightOpen = false,
  aiInsightLoading = false,
  aiInsightResult = {},
  aiInsightError,
  aiInsightQuestion,
  setAiInsightQuestion,
  aiInsightConversation = [],
  setAiInsightOpen,
  handleAskAiInsight,
  handleAskAiFollowUp,
} = {}) {
  return (
    <>
      <ConfirmModal
        open={Boolean(statusModal?.open)}
        variant={statusModal?.type === "error" ? "danger" : "primary"}
        title={statusModal?.title || "Notification"}
        description={statusModal?.message || ""}
        confirmLabel="OK"
        cancelLabel="Close"
        onConfirm={closeStatusModal}
        onClose={closeStatusModal}
      />

      <ViewPlanModal />

      <KPISnapshotModal
        open={Boolean(showKpiSnapshot)}
        week={activeWeek}
        records={filteredPlans}
        onClose={() => setShowKpiSnapshot?.(false)}
      />

      <AIInsightModal
        open={Boolean(aiInsightOpen)}
        loading={Boolean(aiInsightLoading)}
        insight={aiInsightResult?.insight}
        highlights={aiInsightResult?.highlights}
        recommendations={aiInsightResult?.recommendations}
        risks={aiInsightResult?.risks}
        error={aiInsightError}
        question={aiInsightQuestion}
        setQuestion={setAiInsightQuestion}
        conversation={aiInsightConversation}
        onClose={() => setAiInsightOpen?.(false)}
        onRegenerate={() => handleAskAiInsight?.({ resetConversation: true })}
        onAskFollowUp={handleAskAiFollowUp}
      />
    </>
  );
}
