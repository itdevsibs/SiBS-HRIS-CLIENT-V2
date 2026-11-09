// The floating SiBS Chat is the employee request entry point. Support-team
// work and ticket history are managed in IT Support / TA-HR Concerns instead.
// Filtering is presentation-only: the backend still enforces all membership
// and HRIS role/site permissions; requests remain in Helpdesk dashboards.
export function shouldShowHelpdeskInSibsChat(conversation = {}, currentSibsId = "") {
  const type = String(conversation?.conversationType ?? "").trim().toUpperCase();
  if (!conversation?.isHelpdesk && type !== "HELPDESK") return true;

  const status = String(conversation?.caseStatus ?? "").trim().toUpperCase();
  // Finalized Helpdesk records (both closed cases and rejected requests)
  // belong in the dedicated support dashboards, not personal SiBS Chat.
  // Rejected requests remain auditable in the Rejected tab with their reason.
  if (["RESOLVED", "CLOSED", "REJECTED"].includes(status)) return false;

  const requesterId = String(conversation?.createdBySibsId ?? conversation?.requester?.sibsId ?? "").trim();
  const viewerId = String(currentSibsId ?? "").trim();
  if (conversation?.isHelpdeskSupportMember === true && requesterId !== viewerId) {
    return false;
  }

  // Requesters can still see an open Helpdesk thread they initiated, and all
  // employees can start new Helpdesk requests from SiBS Chat.
  return true;
}
