import api from "./api-template";

export async function getMyResignationStatus() {
  try {
    const response = await api.get("/api/resignation-management/my-resignation", {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("GET MY RESIGNATION STATUS ERROR:", error);

    return {
      success: false,
      data: [],
      latest: null,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load resignation status.",
      status: error?.response?.status || 500,
    };
  }
}
