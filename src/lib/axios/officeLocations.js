import api from "./api-template";

const BASE_PATH = "/api/office-locations";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

export async function getOfficeLocations() {
  try {
    const response = await api.get(BASE_PATH, { withCredentials: true });

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Unable to load office location counts."),
    );
  }
}
