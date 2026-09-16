import api from "./api-template";

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
