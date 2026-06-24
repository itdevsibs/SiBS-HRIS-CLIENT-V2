import api from "./api-template";

export async function getFinalInterviewDraft({
  candidateId,
  candidateApplicationId,
  formId = "",
}) {
  const response = await api.get(
    `/api/candidate-pipeline/final-interview-draft/${candidateId}/${candidateApplicationId}`,
    {
      params: {
        formId,
      },
    },
  );

  return response.data;
}

export async function saveFinalInterviewDraft(payload) {
  const response = await api.post(
    "/api/candidate-pipeline/final-interview-draft",
    payload,
  );

  return response.data;
}

export async function deleteFinalInterviewDraft({
  candidateId,
  candidateApplicationId,
  formId = "",
}) {
  const response = await api.delete(
    `/api/candidate-pipeline/final-interview-draft/${candidateId}/${candidateApplicationId}`,
    {
      params: {
        formId,
      },
    },
  );

  return response.data;
}