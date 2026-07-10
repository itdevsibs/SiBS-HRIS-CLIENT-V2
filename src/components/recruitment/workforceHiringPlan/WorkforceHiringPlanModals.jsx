import React from "react";
import StatusModal from "../../modals/StatusModal";
import ViewPlanModal from "../../modals/workforceHiringPlan/ViewPlanModal";
import KPISnapshotModal from "../../modals/workforceHiringPlan/KPISnapshotModal";
import AIInsightModal from "./AIInsightModal";

export default function WorkforceHiringPlanModals({
  statusModal,
  closeStatusModal,
  showKpiSnapshot,
  activeWeek,
  filteredPlans,
  setShowKpiSnapshot,
  aiInsightOpen,
  aiInsightLoading,
  aiInsightResult,
  aiInsightError,
  aiInsightQuestion,
  setAiInsightQuestion,
  aiInsightConversation,
  setAiInsightOpen,
  handleAskAiInsight,
  handleAskAiFollowUp,
}) {
  return (
    <>
      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={closeStatusModal}
      />

      <ViewPlanModal />

      <KPISnapshotModal
        open={showKpiSnapshot}
        week={activeWeek}
        records={filteredPlans}
        onClose={() => setShowKpiSnapshot(false)}
      />

      <AIInsightModal
        open={aiInsightOpen}
        loading={aiInsightLoading}
        insight={aiInsightResult.insight}
        highlights={aiInsightResult.highlights}
        recommendations={aiInsightResult.recommendations}
        risks={aiInsightResult.risks}
        error={aiInsightError}
        question={aiInsightQuestion}
        setQuestion={setAiInsightQuestion}
        conversation={aiInsightConversation}
        onClose={() => setAiInsightOpen(false)}
        onRegenerate={() => handleAskAiInsight({ resetConversation: true })}
        onAskFollowUp={handleAskAiFollowUp}
      />
    </>
  );
}
