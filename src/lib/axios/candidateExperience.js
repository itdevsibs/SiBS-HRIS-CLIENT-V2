import api from "./api-template";

function errorResponse(error, fallback, data = null) {
  return {
    success: false,
    status: error?.response?.status || 0,
    message: error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback,
    data,
    error,
  };
}

export async function getCandidateExperienceList(params = {}) {
  try {
    const res = await api.get("/api/recruitment/candidate-experience", {
      params: { limit: 500, ...params },
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error("GET CANDIDATE EXPERIENCE API ERROR:", error);
    }
    return errorResponse(error, "Failed to load candidate experience records.", []);
  }
}

export async function createManualCandidateExperience(payload = {}) {
  try {
    const res = await api.post("/api/recruitment/candidate-experience/manual", payload, {
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    console.error("POST MANUAL CANDIDATE EXPERIENCE API ERROR:", error);
    return errorResponse(error, "Failed to save the manual candidate experience record.");
  }
}

export async function resendCandidateExperienceSurvey(id) {
  try {
    const res = await api.post(
      `/api/recruitment/candidate-experience/${encodeURIComponent(id)}/resend-survey`,
      {},
      { withCredentials: true },
    );
    return res.data;
  } catch (error) {
    console.error("RESEND CANDIDATE EXPERIENCE SURVEY API ERROR:", error);
    return errorResponse(error, "Failed to resend the candidate experience survey.");
  }
}

export async function getCandidatePipelineCandidatesForExperience(params = {}) {
  try {
    const res = await api.get("/api/candidate-pipeline", {
      params: { limit: 500, _t: Date.now(), ...params },
      withCredentials: true,
    });
    return res.data;
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error("GET CANDIDATE PIPELINE FOR EXPERIENCE API ERROR:", error);
    }
    return errorResponse(error, "Failed to load Candidate Pipeline records.", []);
  }
}

export async function getPublicCandidateExperienceSurvey(token) {
  try {
    const res = await api.get(
      `/api/public/candidate-experience/${encodeURIComponent(token)}`,
      { skipAuthRedirect: true },
    );
    return res.data;
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error("GET PUBLIC CANDIDATE EXPERIENCE SURVEY API ERROR:", error);
    }
    return errorResponse(error, "This survey link is invalid, expired, or unavailable.");
  }
}

export async function submitPublicCandidateExperienceSurvey(token, payload = {}) {
  try {
    const res = await api.post(
      `/api/public/candidate-experience/${encodeURIComponent(token)}`,
      payload,
      { skipAuthRedirect: true },
    );
    return res.data;
  } catch (error) {
    console.error("SUBMIT PUBLIC CANDIDATE EXPERIENCE SURVEY API ERROR:", error);
    return errorResponse(error, "Your feedback could not be submitted. Please try again.");
  }
}
