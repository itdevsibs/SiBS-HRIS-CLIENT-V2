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

export async function getDepartmentApprovalUsers() {
  try {
    const { data } = await api.get("/api/department-approval-rules", {
      withCredentials: true,
    });
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch Department approval users."),
    );
  }
}

export async function addDepartmentApprovalUser(user) {
  try {
    const { data } = await api.post("/api/department-approval-rules", user, {
      withCredentials: true,
    });
    notifyApprovalRulesChanged("departments");
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to add Department approval user."),
    );
  }
}

export async function removeDepartmentApprovalUser(sibsId) {
  try {
    const { data } = await api.delete(
      `/api/department-approval-rules/${encodeURIComponent(sibsId)}`,
      { withCredentials: true },
    );
    notifyApprovalRulesChanged("departments");
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to remove Department approval user."),
    );
  }
}

export async function searchDepartmentApprovalEmployees(search = "") {
  try {
    const { data } = await api.get("/api/department-approval-rules/employees", {
      params: { search, limit: 50 },
      withCredentials: true,
    });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to search employees."));
  }
}

export default {
  getDepartmentApprovalUsers,
  addDepartmentApprovalUser,
  removeDepartmentApprovalUser,
  searchDepartmentApprovalEmployees,
};
