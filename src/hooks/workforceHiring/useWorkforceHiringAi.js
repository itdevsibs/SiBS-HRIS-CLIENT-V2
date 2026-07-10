import { useState } from "react";
import api from "../../lib/axios/api-template";
import { parseAiResponsePayload } from "../../lib/utils/workforceHiringPlan/workforceHiringPlanAiHelpers";

export default function useWorkforceHiringAi({
  activeWeekId,
  activeWeek,
  activeWeekStartDate,
  activeWeekEndDate,
  selectedClusters,
  selectedAccounts,
  search,
  accountSearch,
  filteredPlans,
}) {
  const [aiInsightOpen, setAiInsightOpen] = useState(false);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState("");
  const [aiInsightResult, setAiInsightResult] = useState({
    insight: "",
    highlights: [],
    recommendations: [],
    risks: [],
  });
  const [aiInsightQuestion, setAiInsightQuestion] = useState("");
  const [aiInsightConversation, setAiInsightConversation] = useState([]);
  async function handleAskAiInsight(options = {}) {
    if (aiInsightLoading) return;

    const question = String(options.question || "").trim();
    const isFollowUp = Boolean(question);
    const shouldResetConversation = Boolean(options.resetConversation);

    setAiInsightOpen(true);
    setAiInsightLoading(true);
    setAiInsightError("");

    if (!isFollowUp) {
      setAiInsightResult({
        insight: "",
        highlights: [],
        recommendations: [],
        risks: [],
      });

      if (shouldResetConversation) {
        setAiInsightConversation([]);
      }
    }

    try {
      const response = await api.post(
        "/api/ai-insight/workforce-hiring-plan",
        {
          weekId: activeWeekId,
          week: activeWeek?.label || activeWeek?.weekRange || "",
          weekNumber: activeWeek?.weekNumber || activeWeek?.week_number || null,
          weekStart: activeWeekStartDate,
          weekEnd: activeWeekEndDate,
          clusters: selectedClusters,
          accounts: selectedAccounts,
          search,
          accountSearch,
          status: "All",
          question,
          previousInsight: aiInsightResult.insight,
          conversation: aiInsightConversation,
          filteredAccounts: (filteredPlans || []).map((item) => ({
            account: item.account || item.accountName || "",
            cluster: item.cluster || item.clusterName || "",
            requiredHeadcount:
              item.requiredHeadcount || item.required_headcount || 0,
            actualHeadcount: item.actualHeadcount || item.actual_headcount || 0,
            absenteeism:
              item.absenteeismSixWeeks ||
              item.absenteeism_6_weeks ||
              item.absenteeismCount ||
              item.absenteeism_count ||
              0,
            attrition:
              item.attritionSixWeeks ||
              item.attrition_6_weeks ||
              item.attritionPastCount ||
              item.attrition_past_count ||
              item.attritionCount ||
              item.attrition_count ||
              0,
            hiringIntake:
              item.opsPrf ||
              item.ops_prf ||
              item.hiringIntakeCount ||
              item.prfCount ||
              item.totalPrf ||
              item.requisitionCount ||
              0,
            hiringIntakeHeadcount:
              item.opsPrf ||
              item.ops_prf ||
              item.hiringIntakeHeadcount ||
              item.intakeHeadcount ||
              item.prfHeadcount ||
              item.requestedHeadcount ||
              0,
            interviewCount:
              item.interviewCount ||
              item.interview_count ||
              item.interviewPopulationCount ||
              item.interview_population_count ||
              0,
            nhoCount: item.nhoCount || item.nho_count || 0,
            fstCount: item.fstCount || item.fst_count || 0,
            pstCount: item.pstCount || item.pst_count || 0,
            hiringRate: item.hiringRate || item.hiring_rate || 0,
            leadsToInterview: item.leadsToInterview || item.leads_to_interview || 0,
            pipelineStatus: item.pipelineStatus || item.pipeline_status || "",
          })),
        },
        {
          withCredentials: true,
        },
      );

      const result = response?.data || {};

      if (!result?.success) {
        throw new Error(result?.message || "Failed to generate AI insight.");
      }

      const formattedAiResponse = parseAiResponsePayload(result);
      const nextInsight = formattedAiResponse.insight;

      console.log("[AI INSIGHT FRONTEND PARSED]", {
        insightPreview: String(nextInsight || "").slice(0, 250),
        rawKeys: Object.keys(result || {}),
        rawInsight: result?.insight,
        rawMessage: result?.message,
      });

      if (isFollowUp) {
        setAiInsightConversation((prev) => [
          ...prev,
          {
            question,
            answer: nextInsight || "No answer returned.",
          },
        ]);

        setAiInsightQuestion("");
      } else {
        setAiInsightResult({
          insight: nextInsight,
          highlights: formattedAiResponse.highlights,
          recommendations: formattedAiResponse.recommendations,
          risks: formattedAiResponse.risks,
        });
      }
    } catch (error) {
      console.error("ASK AI WEEKLY HIRING ERROR:", error);

      setAiInsightError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to generate AI insight.",
      );
    } finally {
      setAiInsightLoading(false);
    }
  }

  function handleAskAiFollowUp() {
    const question = String(aiInsightQuestion || "").trim();

    if (!question) return;

    handleAskAiInsight({
      question,
    });
  }

  function handleOpenAiInsight() {
    const hasExistingAiSession =
      Boolean(aiInsightResult.insight) ||
      aiInsightConversation.length > 0 ||
      Boolean(aiInsightError);

    if (hasExistingAiSession) {
      setAiInsightOpen(true);
      return;
    }

    handleAskAiInsight({
      resetConversation: true,
    });
  }


  return {
    aiInsightOpen,
    aiInsightLoading,
    aiInsightError,
    aiInsightResult,
    aiInsightQuestion,
    setAiInsightQuestion,
    aiInsightConversation,
    setAiInsightOpen,
    handleAskAiInsight,
    handleAskAiFollowUp,
    handleOpenAiInsight,
  };
}