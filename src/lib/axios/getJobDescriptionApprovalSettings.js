import api from "./api-template";

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

export async function getJobDescriptionApprovalUsers() {
  try {
    const response = await api.get("/api/job-description-approval-rules", {
      withCredentials: true,
    });

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Failed to fetch Job Description approval users.",
      ),
    );
  }
}

export async function saveJobDescriptionApprovalUsers(users = []) {
  try {
    const response = await api.put(
      "/api/job-description-approval-rules",
      {
        users,
      },
      {
        withCredentials: true,
      },
    );

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Failed to save Job Description approval users.",
      ),
    );
  }
}

export async function addJobDescriptionApprovalUser(user) {
  try {
    const response = await api.post(
      "/api/job-description-approval-rules",
      user,
      {
        withCredentials: true,
      },
    );

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to add Job Description approval user."),
    );
  }
}

export async function removeJobDescriptionApprovalUser(sibsId) {
  try {
    const response = await api.delete(
      `/api/job-description-approval-rules/${encodeURIComponent(sibsId)}`,
      {
        withCredentials: true,
      },
    );

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Failed to remove Job Description approval user.",
      ),
    );
  }
}

export async function searchJobDescriptionApprovalEmployees(search = "") {
  try {
    const response = await api.get(
      "/api/job-description-approval-rules/employees",
      {
        params: {
          search,
          limit: 50,
        },
        withCredentials: true,
      },
    );

    return unwrapResponse(response);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to search employees."));
  }
}

export default {
  getJobDescriptionApprovalUsers,
  saveJobDescriptionApprovalUsers,
  addJobDescriptionApprovalUser,
  removeJobDescriptionApprovalUser,
  searchJobDescriptionApprovalEmployees,
};
