import api from "./api-template";

function unwrap(response) {
  return response?.data || response || {};
}

export async function getLatestCandidateOfferVersion(candidateId) {
  return unwrap(await api.get(`/api/candidate-offers/candidate/${encodeURIComponent(candidateId)}/latest`, { withCredentials: true }));
}

export async function createCandidateOfferRevision(candidateId, payload) {
  return unwrap(await api.post(`/api/candidate-offers/candidate/${encodeURIComponent(candidateId)}/revisions`, payload, { withCredentials: true }));
}

export async function getRevisedOfferApproval(token) {
  return unwrap(await api.get(`/api/candidate-offers/approval/${encodeURIComponent(token)}`, { withCredentials: true }));
}

export async function approveRevisedOffer(token) {
  return unwrap(await api.post(`/api/candidate-offers/approval/${encodeURIComponent(token)}/approve`, {}, { withCredentials: true }));
}

export async function rejectRevisedOffer(token, reason) {
  return unwrap(await api.post(`/api/candidate-offers/approval/${encodeURIComponent(token)}/reject`, { reason }, { withCredentials: true }));
}

export async function getPublicOfferResponse(token) {
  return unwrap(await api.get(`/api/candidate-offers/public/response/${encodeURIComponent(token)}`));
}

export async function submitPublicOfferResponse(token, message = "") {
  return unwrap(await api.post(`/api/candidate-offers/public/response/${encodeURIComponent(token)}`, { message }));
}
