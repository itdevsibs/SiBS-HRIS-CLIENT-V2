import api from "./api-template";

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
    const res = await api.get("/api/google/calendar/status");

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

export async function createGoogleCalendarEvent(payload) {
  try {
    const res = await api.post("/api/google/calendar/events", payload);

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
    const res = await api.post("/api/google/calendar/disconnect");

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
