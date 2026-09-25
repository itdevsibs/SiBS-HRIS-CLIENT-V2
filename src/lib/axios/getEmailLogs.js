import api from "./api-template";

function getApiBaseUrl() {
  const axiosBaseUrl = api?.defaults?.baseURL || "";
  const viteBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return String(axiosBaseUrl || viteBaseUrl).replace(/\/$/, "");
}

export function getGmailReplyConnectUrl() {
  return `${getApiBaseUrl()}/api/google/calendar/gmail-replies/connect`;
}

export async function getGmailReplyConnectionStatus() {
  const response = await api.get("/api/google/calendar/gmail-replies/status", {
    skipAuthRedirect: true,
  });

  return response?.data || {
    success: false,
    connected: false,
  };
}


export async function getEmailLogs({ limit = 2000 } = {}) {
  const safeLimit = Math.min(5000, Math.max(1, Number(limit) || 2000));
  const response = await api.get("/api/email-logs", {
    params: {
      limit: safeLimit,
    },
  });

  return response?.data || {
    success: false,
    records: [],
    count: 0,
  };
}

export async function sendTestEmailDispatch({
  recipientEmail,
  category,
  subject,
  messageHtml = "",
  messageText = "",
} = {}) {
  const response = await api.post("/api/email-logs/test-dispatch", {
    recipientEmail,
    category,
    subject,
    messageHtml,
    messageText,
  });

  return response?.data || {
    success: false,
    message: "Unable to send test email.",
  };
}

export default getEmailLogs;

export async function getCandidateEmailReplies({
  providerMessageIds = [],
  candidateEmails = [],
  outboundMessages = [],
} = {}) {
  const response = await api.post("/api/email-logs/replies", {
    providerMessageIds,
    candidateEmails,
    outboundMessages,
  });

  return response?.data || {
    success: false,
    records: [],
    count: 0,
  };
}
