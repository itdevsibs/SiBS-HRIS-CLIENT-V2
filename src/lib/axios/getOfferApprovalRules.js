import api from "./api-template";
import { notifyApprovalRulesChanged } from "../utils/approvalRuleEvents";

function unwrapResponse(response) {
  return response?.data ?? response;
}

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function getOfferApprovalUsers() {
  try {
    const response = await api.get("/api/offer-approval-rules", {
      withCredentials: true,
    });

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch offer approval users."),
    );
  }
}

export async function saveOfferApprovalUsers(users = []) {
  try {
    const response = await api.put(
      "/api/offer-approval-rules",
      {
        users,
      },
      {
        withCredentials: true,
      },
    );

    notifyApprovalRulesChanged("offers");
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to save offer approval users."),
    );
  }
}

export async function addOfferApprovalUser(user) {
  try {
    const response = await api.post("/api/offer-approval-rules", user, {
      withCredentials: true,
    });

    notifyApprovalRulesChanged("offers");
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to add offer approval user."),
    );
  }
}

export async function removeOfferApprovalUser(sibsId) {
  try {
    const response = await api.delete(
      `/api/offer-approval-rules/${encodeURIComponent(sibsId)}`,
      {
        withCredentials: true,
      },
    );

    notifyApprovalRulesChanged("offers");
    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to remove offer approval user."),
    );
  }
}

export async function searchOfferApprovalEmployees(search = "") {
  try {
    const response = await api.get("/api/offer-approval-rules/employees", {
      params: {
        search,
        limit: 50,
      },
      withCredentials: true,
    });

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to search employees."),
    );
  }
}
