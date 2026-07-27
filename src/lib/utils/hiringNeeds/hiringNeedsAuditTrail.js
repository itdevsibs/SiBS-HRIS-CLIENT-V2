function cleanText(value) {
  return String(value ?? "").trim();
}

function firstText(...values) {
  for (const value of values) {
    const text = cleanText(value);

    if (text) return text;
  }

  return "";
}

function getHistoryArray(item = {}) {
  const candidates = [
    item.history,
    item.approvalHistory,
    item.approval_history,
    item.auditTrail,
    item.audit_trail,
  ];

  return candidates.find(Array.isArray) || [];
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") return null;

  const normalized = {
    date: firstText(
      entry.date,
      entry.createdAt,
      entry.created_at,
      entry.actionDate,
      entry.action_date,
    ),
    action: firstText(
      entry.action,
      entry.event,
      entry.status,
      entry.description,
    ),
    actor: firstText(
      entry.actor,
      entry.performedBy,
      entry.performed_by,
      entry.approvedBy,
      entry.approved_by,
    ),
    remarks: firstText(
      entry.remarks,
      entry.comment,
      entry.comments,
      entry.reason,
    ),
  };

  if (!Object.values(normalized).some(Boolean)) return null;

  return normalized;
}

function getRequestType(item = {}) {
  const type = firstText(item.requestType, item.request_type).toLowerCase();

  return type === "downsize" ? "Downsize" : "Requisition";
}

function getSubmittedFallback(item = {}) {
  const date = firstText(item.createdAt, item.created_at);

  if (!date) return null;

  return {
    date,
    action: `Submitted ${getRequestType(item)}`,
    actor: firstText(
      item.hiringManager,
      item.hiring_manager,
      item.preparedBy,
      item.prepared_by,
      item.filedBy?.name,
      item.filed_by?.name,
    ),
    remarks: "",
  };
}

function getDecisionFallback(item = {}, normalizedStatus = "") {
  const status = cleanText(normalizedStatus);
  const finalAction =
    status === "Approved"
      ? "Approved Request"
      : status === "Not Approved"
        ? "Rejected Request"
        : "";

  if (!finalAction) return null;

  const date = firstText(item.approvalDate, item.approval_date);

  if (!date) return null;

  return {
    date,
    action: finalAction,
    actor: firstText(item.approvedBy, item.approved_by),
    remarks: firstText(item.approvalRemarks, item.approval_remarks),
  };
}

export function buildHiringNeedsAuditTrail(item = {}, normalizedStatus = "") {
  const normalizedHistory = getHistoryArray(item)
    .map(normalizeHistoryEntry)
    .filter(Boolean);

  if (normalizedHistory.length > 0) {
    return normalizedHistory;
  }

  return [
    getSubmittedFallback(item),
    getDecisionFallback(item, normalizedStatus),
  ].filter(Boolean);
}
