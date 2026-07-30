import api from "./api-template";

function encodeIdentifier(value) {
  return encodeURIComponent(
    String(value ?? "").trim(),
  );
}

/* =========================================
   FINAL INTERVIEW FORMS
========================================= */

export async function getFinalInterviewForms() {
  try {
    const res = await api.get(
      "/api/recruitment-settings/final-interview-forms",
      {
        params: {
          _t: Date.now(),
        },
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "GET FINAL INTERVIEW FORMS API ERROR:",
      err,
    );

    throw err;
  }
}

export async function getFinalInterviewFormByPosition(
  positionIdentifier,
) {
  try {
    const res = await api.get(
      `/api/recruitment-settings/final-interview-forms/position/${encodeIdentifier(
        positionIdentifier,
      )}`,
      {
        params: {
          _t: Date.now(),
        },
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    if (err?.response?.status === 404) {
      return {
        success: true,
        data: null,
        message:
          err?.response?.data?.message ||
          "Final Interview form not found.",
      };
    }

    console.error(
      "GET FINAL INTERVIEW FORM BY POSITION API ERROR:",
      err,
    );

    throw err;
  }
}

export async function saveFinalInterviewFormDetails(
  positionIdentifier,
  payload = {},
) {
  try {
    const res = await api.put(
      `/api/recruitment-settings/final-interview-forms/position/${encodeIdentifier(
        positionIdentifier,
      )}`,
      payload,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "SAVE FINAL INTERVIEW FORM DETAILS API ERROR:",
      err,
    );

    throw err;
  }
}

export async function replaceFinalInterviewQuestions(
  positionIdentifier,
  questions = [],
) {
  try {
    const res = await api.put(
      `/api/recruitment-settings/final-interview-forms/position/${encodeIdentifier(
        positionIdentifier,
      )}/questions`,
      {
        questions:
          Array.isArray(questions)
            ? questions
            : [],
      },
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "SAVE FINAL INTERVIEW QUESTIONS API ERROR:",
      err,
    );

    throw err;
  }
}

export async function deleteFinalInterviewQuestion(
  positionIdentifier,
  questionIdentifier,
) {
  try {
    const res = await api.delete(
      `/api/recruitment-settings/final-interview-forms/position/${encodeIdentifier(
        positionIdentifier,
      )}/questions/${encodeIdentifier(
        questionIdentifier,
      )}`,
      {
        withCredentials: true,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "DELETE FINAL INTERVIEW QUESTION API ERROR:",
      err,
    );

    throw err;
  }
}

/* =========================================
   UPDATE HEADCOUNTS / HEADCOUNT REQUESTS
========================================= */

export async function getHeadcountUpdateRequests(
  params = {},
) {
  try {
    const {
      status = "Pending",
      search = "",
      weekStart = "",
      weekEnd = "",
      limit = 100,
    } = params;

    const res = await api.get(
      "/api/recruitment-settings/headcount-requests",
      {
        params: {
          status,
          search,
          weekStart,
          weekEnd,
          limit,
          _t: Date.now(),
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "GET HEADCOUNT UPDATE REQUESTS API ERROR:",
      err,
    );

    throw err;
  }
}

export async function approveHeadcountUpdateRequest(
  id,
) {
  try {
    const res = await api.patch(
      `/api/recruitment-settings/headcount-requests/${id}/status`,
      {
        status: "Approved",
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "APPROVE HEADCOUNT UPDATE REQUEST API ERROR:",
      err,
    );

    throw err;
  }
}

export async function rejectHeadcountUpdateRequest(
  id,
) {
  try {
    const res = await api.patch(
      `/api/recruitment-settings/headcount-requests/${id}/status`,
      {
        status: "Rejected",
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "REJECT HEADCOUNT UPDATE REQUEST API ERROR:",
      err,
    );

    throw err;
  }
}

export async function updateHeadcountRequestStatus(
  id,
  status,
) {
  try {
    const res = await api.patch(
      `/api/recruitment-settings/headcount-requests/${id}/status`,
      {
        status,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "UPDATE HEADCOUNT REQUEST STATUS API ERROR:",
      err,
    );

    throw err;
  }
}

/* =========================================
   PHILIPPINE HOLIDAY CALENDAR
========================================= */

export async function getRecruitmentHolidays({
  includeInactive = true,
} = {}) {
  const res = await api.get(
    "/api/recruitment-settings/holidays",
    {
      params: {
        includeInactive: includeInactive ? "1" : "0",
        _t: Date.now(),
      },
      withCredentials: true,
    },
  );

  return res.data;
}

export async function createRecruitmentHoliday(payload = {}) {
  const res = await api.post(
    "/api/recruitment-settings/holidays",
    payload,
    {
      withCredentials: true,
    },
  );

  return res.data;
}

export async function updateRecruitmentHoliday(id, payload = {}) {
  const res = await api.put(
    `/api/recruitment-settings/holidays/${encodeIdentifier(id)}`,
    payload,
    {
      withCredentials: true,
    },
  );

  return res.data;
}

export async function deleteRecruitmentHoliday(id) {
  const res = await api.delete(
    `/api/recruitment-settings/holidays/${encodeIdentifier(id)}`,
    {
      withCredentials: true,
    },
  );

  return res.data;
}

