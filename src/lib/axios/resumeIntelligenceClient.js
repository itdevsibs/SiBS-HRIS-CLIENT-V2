import api from "./api-template";

function resolveApiBaseUrl() {
  const configured =
    api?.defaults?.baseURL ||
    import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    "http://localhost:5001";
  return String(configured)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

export async function getApplicationResumeIntelligence(identifier) {
  if (!identifier) {
    throw new Error("Application or candidate identifier is required.");
  }
  const response = await api.get(
    `/api/resume-intelligence/applications/${encodeURIComponent(String(identifier))}`
  );
  return response.data;
}

export async function getFinalInterviewResumeIntelligence(identifier) {
  if (!identifier) {
    throw new Error("Application or candidate identifier is required.");
  }
  const response = await api.get(
    `/api/resume-intelligence/applications/${encodeURIComponent(
      String(identifier)
    )}/final-interview`
  );
  return response.data;
}

export async function reviewResumeIntelligenceQuestions(
  identifier,
  {
    questionSetId = null,
    questionIds = [],
    reviewAll = false,
    decision,
    reviewRemarks = "",
  }
) {
  if (!identifier) {
    throw new Error("Application or candidate identifier is required.");
  }
  const response = await api.post(
    `/api/resume-intelligence/applications/${encodeURIComponent(
      String(identifier)
    )}/questions/review`,
    {
      questionSetId,
      questionIds,
      reviewAll,
      decision,
      reviewRemarks,
    }
  );
  return response.data;
}

export async function regenerateApplicationResumeIntelligence(
  identifier,
  { forceRegenerate = true, waitForCompletion = true } = {}
) {
  if (!identifier) {
    throw new Error("Application or candidate identifier is required.");
  }
  const response = await api.post(
    `/api/resume-intelligence/applications/${encodeURIComponent(
      String(identifier)
    )}/regenerate`,
    {
      forceRegenerate,
      waitForCompletion,
    }
  );
  return response.data;
}

export function buildAuthorizedResumeDocumentUrl(identifier) {
  if (!identifier) return "";
  return `${resolveApiBaseUrl()}/api/resume-intelligence/applications/${encodeURIComponent(
    String(identifier)
  )}/document`;
}
