import api from "./api-template";

const GOOGLE_CALENDAR_TIMEOUT_MS = 15000;

function getApiBaseUrl() {
  const axiosBaseUrl = api?.defaults?.baseURL || "";
  const viteBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  return String(axiosBaseUrl || viteBaseUrl).replace(/\/$/, "");
}

/*
  OAuth login must open a browser URL.
  Axios is used for JSON API requests.
*/
export function getGoogleCalendarConnectUrl() {
  return `${getApiBaseUrl()}/api/google/calendar/connect`;
}

export async function getGoogleCalendarStatus() {
  try {
    const res = await api.get("/api/google/calendar/status", {
      skipAuthRedirect: true,
      timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getGoogleCalendarStatus API Error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      connected: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to check Google Calendar connection.",
    };
  }
}

export async function getGoogleCalendarEvents(params = {}) {
  try {
    const res = await api.get("/api/google/calendar/events", {
      params,
      skipAuthRedirect: true,
      timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios getGoogleCalendarEvents API Error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      events: [],
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load Google Calendar events.",
    };
  }
}

export async function getGoogleCalendarBusyTimes(params = {}) {
  try {
    const res = await api.get("/api/google/calendar/busy-times", {
      params,
      skipAuthRedirect: true,
      timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
    });
    return res.data;
  } catch (err) {
    return {
      success: false,
      status: err?.response?.status || 500,
      message: err?.response?.data?.error || err?.message || "Unable to check booked times.",
    };
  }
}

export async function createGoogleCalendarEvent(payload) {
  try {
    const res = await api.post("/api/google/calendar/events", payload, {
      skipAuthRedirect: true,
      timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios createGoogleCalendarEvent API Error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to create Google Calendar event.",
    };
  }
}

export async function updateGoogleCalendarEvent(eventId, payload) {
  try {
    const res = await api.put(
      `/api/google/calendar/events/${encodeURIComponent(eventId)}`,
      payload,
      {
        skipAuthRedirect: true,
        timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios updateGoogleCalendarEvent API Error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update Google Calendar event.",
    };
  }
}

export async function deleteGoogleCalendarEvent(eventId) {
  try {
    const res = await api.delete(
      `/api/google/calendar/events/${encodeURIComponent(eventId)}`,
      {
        skipAuthRedirect: true,
        timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Axios deleteGoogleCalendarEvent API Error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to delete Google Calendar event.",
    };
  }
}

export async function disconnectGoogleCalendar() {
  try {
    const res = await api.post("/api/google/calendar/disconnect", undefined, {
      skipAuthRedirect: true,
      timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
    });

    return res.data;
  } catch (err) {
    console.error(
      "Axios disconnectGoogleCalendar API Error:",
      err?.response?.status,
      err?.message,
    );

    return {
      success: false,
      status: err?.response?.status || 500,
      message:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to disconnect Google Calendar.",
    };
  }
}

/** Available interview slots are resolved server-side for the logged-in user. */
export async function getGoogleInterviewAvailability(params = {}) {
  const response = await api.get('/api/google/calendar/interview-availability', {
    params, skipAuthRedirect: true, timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
  });
  return response.data;
}

/** Preview only: does not modify Google Calendar. */
export async function previewHrisCalendarOrphans() {
  const response = await api.get("/api/google/calendar/orphan-hris-events", {
    timeout: 120000, skipAuthRedirect: true,
  });
  return response.data;
}

/** Automatically remove verified orphaned HRIS events after a successful calendar sync.
 * The server excludes ambiguous legacy entries and unrelated Google events. */
export async function autoCleanupVerifiedHrisCalendarOrphans() {
  const response = await api.post("/api/google/calendar/orphan-hris-events/auto-cleanup", {}, {
    timeout: 120000, skipAuthRedirect: true,
  });
  return response.data;
}

/** Explicitly confirmed deletion of unmatched, HRIS-owned events. */
export async function cleanupHrisCalendarOrphans({ legacyEventIds = [] } = {}) {
  const response = await api.post("/api/google/calendar/orphan-hris-events/cleanup", {
    confirm: "DELETE_ORPHAN_HRIS_EVENTS",
    legacyEventIds,
  }, { timeout: 180000, skipAuthRedirect: true });
  return response.data;
}
