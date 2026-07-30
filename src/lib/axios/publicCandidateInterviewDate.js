import axios from "axios";

const SIBS_HRIS_PRODUCTION_API_URL =
  "https://sibs-hris-server.getleadsource.com";

function getBaseURL() {
  const rawBaseURL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    SIBS_HRIS_PRODUCTION_API_URL;

  return String(rawBaseURL)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");
}

function cleanToken(token) {
  return String(token ?? "").trim();
}

const publicInterviewDateApi = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

export async function getPublicCandidateInterviewDate(token) {
  const resolvedToken = cleanToken(token);

  if (!resolvedToken) {
    throw new Error("Interview scheduling token is missing.");
  }

  const response = await publicInterviewDateApi.get(
    `/api/candidate-pipeline/public/interview-date/${encodeURIComponent(
      resolvedToken,
    )}`,
    {
      params: {
        _t: Date.now(),
      },
    },
  );

  return response.data;
}

export async function submitPublicCandidateInterviewResponse(
  token,
  {
    action,
    selectedDate = "",
    selectedTime = "",
    reason = "",
  } = {},
) {
  const resolvedToken = cleanToken(token);

  if (!resolvedToken) {
    throw new Error("Interview response token is missing.");
  }

  const response = await publicInterviewDateApi.post(
    `/api/candidate-pipeline/public/interview-date/${encodeURIComponent(
      resolvedToken,
    )}`,
    {
      action,
      selectedDate,
      selectedTime,
      reason,
    },
  );

  return response.data;
}

export async function submitPublicCandidateInterviewDate(
  token,
  selectedDate,
  selectedTime,
) {
  return submitPublicCandidateInterviewResponse(token, {
    action: "reschedule",
    selectedDate,
    selectedTime,
  });
}

export default publicInterviewDateApi;
