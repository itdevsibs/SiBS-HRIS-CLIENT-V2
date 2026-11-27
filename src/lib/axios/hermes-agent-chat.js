/**
 * SiBS HRIS - Hermes Chat API
 *
 * Reuses the existing authenticated Axios client.
 * No Hermes credentials are exposed to the browser.
 */

export const sendHermesAgentChat = async ({
  apiClient,
  message,
  conversation = [],
  includeReport = false,
  uatScenarioId,
  expectedSibsId,
  expectedEmployeeId,
  expectedTokenType,
  signal,
}) => {
  const cleanedMessage = message?.trim();

  if (!cleanedMessage) {
    throw new Error("Please enter a message.");
  }

  if (cleanedMessage.length > 2000) {
    throw new Error("Message exceeds 2000 characters.");
  }

  const payload = {
    message: cleanedMessage,
    conversation,
    ...(expectedSibsId ? { expectedSibsId } : {}),
    ...(expectedEmployeeId ? { expectedEmployeeId } : {}),
    ...(expectedTokenType ? { expectedTokenType } : {}),
    ...(includeReport ? { includeReport: true } : {}),
    ...(uatScenarioId ? { uatScenarioId } : {}),
  };

  const response = await apiClient.post(
    uatScenarioId ? "/api/dev-ai/chat" : "/api/ai/chat",
    payload,
    {
      timeout: uatScenarioId ? 180000 : 300000,
      signal,
    }
  );

  if (response.data?.success !== true) {
    throw new Error(response.data?.message || "Hermes could not complete the request.");
  }

  const reply = response.data?.reply;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Invalid response from Hermes.");
  }

  return {
    reply: reply.trim(),
    model: response.data?.model,
    ...(response.data?.status ? { status: response.data.status } : {}),
    ...(response.data?.finishReason ? { finishReason: response.data.finishReason } : {}),
    ...(response.data?.requestId ? { requestId: response.data.requestId } : {}),
    ...(response.data?.durationMs != null ? { durationMs: response.data.durationMs } : {}),
    ...(response.data?.report ? { report: response.data.report } : {}),
    ...(response.data?.verifiedData ? { verifiedData: response.data.verifiedData } : {}),
    ...(response.data?.plan?.capability ? { actualCapability: response.data.plan.capability } : {}),
    ...(response.data?.uatEvidence ? { uatEvidence: response.data.uatEvidence } : {}),
    ...(response.data?.uatExecution ? { uatExecution: response.data.uatExecution } : {}),
  };
};
