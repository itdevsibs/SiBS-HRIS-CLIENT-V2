import api from "./api-template";
import { notifyApprovalRulesChanged } from "../utils/approvalRuleEvents";

function getApiErrorMessage(error, fallback = "Request failed.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export async function getAccountApprovalUsers() {
  try {
    const { data } = await api.get("/api/account-approval-rules", {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch Account approval users."),
    );
  }
}

export async function addAccountApprovalUser(user) {
  try {
    const { data } = await api.post("/api/account-approval-rules", user, {
      withCredentials: true,
    });
    notifyApprovalRulesChanged("accounts");
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to add Account approval user."),
    );
  }
}

export async function removeAccountApprovalUser(sibsId) {
  try {
    const { data } = await api.delete(
      `/api/account-approval-rules/${encodeURIComponent(sibsId)}`,
      { withCredentials: true },
    );
    notifyApprovalRulesChanged("accounts");
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to remove Account approval user."),
    );
  }
}

export async function searchAccountApprovalEmployees(search = "") {
  try {
    const { data } = await api.get("/api/account-approval-rules/employees", {
      params: { search, limit: 50 },
      withCredentials: true,
    });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to search employees."));
  }
}

export default {
  getAccountApprovalUsers,
  addAccountApprovalUser,
  removeAccountApprovalUser,
  searchAccountApprovalEmployees,
};
