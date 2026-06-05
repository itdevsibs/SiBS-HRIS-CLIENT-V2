import api from "./api-template";

/* =========================================
   UPDATE HEADCOUNTS / HEADCOUNT REQUESTS
========================================= */

export async function getHeadcountUpdateRequests(params = {}) {
  try {
    const {
      status = "Pending",
      search = "",
      weekStart = "",
      weekEnd = "",
      limit = 100,
    } = params;

    const res = await api.get("/api/recruitment-settings/headcount-requests", {
      params: {
        status,
        search,
        weekStart,
        weekEnd,
        limit,
        _t: Date.now(),
      },
    });

    return res.data;
  } catch (err) {
    console.error("GET HEADCOUNT UPDATE REQUESTS API ERROR:", err);
    throw err;
  }
}

export async function approveHeadcountUpdateRequest(id) {
  try {
    const res = await api.patch(
      `/api/recruitment-settings/headcount-requests/${id}/status`,
      {
        status: "Approved",
      },
    );

    return res.data;
  } catch (err) {
    console.error("APPROVE HEADCOUNT UPDATE REQUEST API ERROR:", err);
    throw err;
  }
}

export async function rejectHeadcountUpdateRequest(id) {
  try {
    const res = await api.patch(
      `/api/recruitment-settings/headcount-requests/${id}/status`,
      {
        status: "Rejected",
      },
    );

    return res.data;
  } catch (err) {
    console.error("REJECT HEADCOUNT UPDATE REQUEST API ERROR:", err);
    throw err;
  }
}

export async function updateHeadcountRequestStatus(id, status) {
  try {
    const res = await api.patch(
      `/api/recruitment-settings/headcount-requests/${id}/status`,
      {
        status,
      },
    );

    return res.data;
  } catch (err) {
    console.error("UPDATE HEADCOUNT REQUEST STATUS API ERROR:", err);
    throw err;
  }
}