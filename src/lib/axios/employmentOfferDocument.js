import api from "./api-template";

export async function getEmploymentOfferDocument(candidatePipelineId, versionNumber) {
  const response = await api.get(
    `/api/candidate-pipeline/${encodeURIComponent(candidatePipelineId)}/offer-versions/${encodeURIComponent(versionNumber)}/document`,
    {
      withCredentials: true,
      params: { _t: Date.now() },
    },
  );

  return response?.data ?? response;
}

export async function saveEmploymentOfferDocument(
  candidatePipelineId,
  versionNumber,
  payload = {},
) {
  const response = await api.put(
    `/api/candidate-pipeline/${encodeURIComponent(candidatePipelineId)}/offer-versions/${encodeURIComponent(versionNumber)}/document`,
    payload,
    { withCredentials: true },
  );

  return response?.data ?? response;
}

export function getEmploymentOfferPdfUrl(candidatePipelineId, versionNumber) {
  return `/api/candidate-pipeline/${encodeURIComponent(candidatePipelineId)}/offer-versions/${encodeURIComponent(versionNumber)}/pdf`;
}
