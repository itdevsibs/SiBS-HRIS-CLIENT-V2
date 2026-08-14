export function isApplicantLeadApplicationLinkSent(lead = {}) {
  return String(lead.status || "").trim() === "Application Link Sent";
}
