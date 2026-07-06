import api from "./api-template";

const HIRING_NEEDS_APPROVAL_RULES_URL = "/api/hiring-needs-approval-rules";

function normalizeApiError(error, fallbackMessage) {
  return new Error(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage,
  );
}

export async function getHiringNeedsApprovalUsers() {
  try {
    const res = await api.get(HIRING_NEEDS_APPROVAL_RULES_URL, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Axios getHiringNeedsApprovalUsers API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    throw normalizeApiError(
      error,
      "Failed to load Hiring Needs approval users.",
    );
  }
}

export async function searchHiringNeedsApprovalEmployees(search = "") {
  try {
    const res = await api.get(`${HIRING_NEEDS_APPROVAL_RULES_URL}/employees`, {
      params: { search },
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Axios searchHiringNeedsApprovalEmployees API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    throw normalizeApiError(
      error,
      "Failed to search employees for Hiring Needs approval.",
    );
  }
}

export async function addHiringNeedsApprovalUser(payload = {}) {
  try {
    const res = await api.post(HIRING_NEEDS_APPROVAL_RULES_URL, payload, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    console.error(
      "Axios addHiringNeedsApprovalUser API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    throw normalizeApiError(
      error,
      "Failed to add Hiring Needs approval user.",
    );
  }
}

export async function removeHiringNeedsApprovalUser(sibsId) {
  try {
    const cleanSibsId = String(sibsId || "").trim();

    const res = await api.delete(
      `${HIRING_NEEDS_APPROVAL_RULES_URL}/${encodeURIComponent(cleanSibsId)}`,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (error) {
    console.error(
      "Axios removeHiringNeedsApprovalUser API error:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    throw normalizeApiError(
      error,
      "Failed to remove Hiring Needs approval user.",
    );
  }
}
