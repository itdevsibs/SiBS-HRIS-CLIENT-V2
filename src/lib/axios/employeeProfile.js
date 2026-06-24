import api from "./api-template";

export async function getMyEmployeeProfilePicture() {
  try {
    const res = await api.get("/api/employee-profile");
    return res.data;
  } catch (err) {
    console.error("GET EMPLOYEE PROFILE PICTURE ERROR:", err);

    return {
      success: false,
      status: err?.response?.status,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch profile picture.",
    };
  }
}

export async function uploadMyEmployeeProfilePicture(file) {
  try {
    const formData = new FormData();
    formData.append("profilePicture", file);

    const res = await api.post("/api/employee-profile/save", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    console.error("UPLOAD EMPLOYEE PROFILE PICTURE ERROR:", err);

    return {
      success: false,
      status: err?.response?.status,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload profile picture.",
    };
  }
}

export async function removeMyEmployeeProfilePicture() {
  try {
    const res = await api.delete("/api/employee-profile");
    return res.data;
  } catch (err) {
    console.error("DELETE EMPLOYEE PROFILE PICTURE ERROR:", err);

    return {
      success: false,
      status: err?.response?.status,
      message:
        err?.response?.data?.message ||
        err?.message ||
        "Failed to remove profile picture.",
    };
  }
}