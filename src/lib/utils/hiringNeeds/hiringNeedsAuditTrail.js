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

function normalizeId(value) {
  return cleanText(value).replace(/^SIBS[-_ ]?/i, "").toLowerCase();
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

function getActorDisplayName(actor = "", item = {}, entry = {}, options = {}) {
  const actorText = cleanText(actor);

  if (!actorText) return "";

  const directName = firstText(
    entry.approverName,
    entry.approver_name,
    entry.approvedByName,
    entry.approved_by_name,
    entry.performedByName,
    entry.performed_by_name,
    entry.actorName,
    entry.actor_name,
  );

  if (directName && directName !== actorText) return directName;

  const actorId = normalizeId(actorText);

  if (
    options.currentUserName &&
    normalizeId(options.currentUserSibsId) === actorId
  ) {
    return options.currentUserName;
  }

  const approvalUsers = Array.isArray(options.approvalUsers)
    ? options.approvalUsers
    : [];

  const matchingApprovalUser = approvalUsers.find((user) => {
    const ids = [
      user.sibsId,
      user.sibs_id,
      user.employeeSibsId,
      user.employee_sibs_id,
      user.gy_emp_code,
      user.gy_user_code,
      user.userCode,
      user.user_code,
      user.employeeCode,
      user.employee_code,
      user.username,
    ];

    return ids.some((id) => normalizeId(id) === actorId);
  });

  if (matchingApprovalUser) {
    const approvalUserName = firstText(
      matchingApprovalUser.fullName,
      matchingApprovalUser.full_name,
      matchingApprovalUser.employeeName,
      matchingApprovalUser.employee_name,
      matchingApprovalUser.name,
      matchingApprovalUser.displayName,
      matchingApprovalUser.display_name,
      matchingApprovalUser.approverName,
      matchingApprovalUser.approver_name,
    );

    if (approvalUserName) return approvalUserName;
  }

  const idNamePairs = [
    {
      ids: [
        item.approverSibsId,
        item.approver_sibs_id,
        item.approvedBySibsId,
        item.approved_by_sibs_id,
        item.approvedBy,
        item.approved_by,
      ],
      names: [
        item.approverName,
        item.approver_name,
        item.approvedByName,
        item.approved_by_name,
      ],
    },
    {
      ids: [
        item.preparedById,
        item.prepared_by_id,
        item.requestedById,
        item.requested_by_id,
        item.createdById,
        item.created_by_id,
      ],
      names: [
        item.preparedBy,
        item.prepared_by,
        item.requestedBy,
        item.requested_by,
        item.createdBy,
        item.created_by,
      ],
    },
    {
      ids: [
        item.filedBy?.id,
        item.filedBy?.sibsId,
        item.filedBy?.sibs_id,
        item.filed_by?.id,
        item.filed_by?.sibsId,
        item.filed_by?.sibs_id,
      ],
      names: [item.filedBy?.name, item.filed_by?.name],
    },
  ];

  for (const pair of idNamePairs) {
    const hasMatchingId = pair.ids.some(
      (id) => normalizeId(id) === actorId,
    );

    if (hasMatchingId) {
      const name = firstText(...pair.names);

      if (name) return name;
    }
  }

  return actorText;
}

function normalizeHistoryEntry(entry, item = {}, options = {}) {
  if (!entry || typeof entry !== "object") return null;

  const actor = firstText(
    entry.actor,
    entry.performedBy,
    entry.performed_by,
    entry.approverName,
    entry.approver_name,
    entry.approvedByName,
    entry.approved_by_name,
    entry.approvedBy,
    entry.approved_by,
  );

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
    actor: getActorDisplayName(actor, item, entry, options),
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
    actor: firstText(
      item.approverName,
      item.approver_name,
      item.approvedByName,
      item.approved_by_name,
      item.approvedBy,
      item.approved_by,
    ),
    remarks: firstText(item.approvalRemarks, item.approval_remarks),
  };
}

export function buildHiringNeedsAuditTrail(
  item = {},
  normalizedStatus = "",
  options = {},
) {
  const normalizedHistory = getHistoryArray(item)
    .map((entry) => normalizeHistoryEntry(entry, item, options))
    .filter(Boolean);

  if (normalizedHistory.length > 0) {
    return normalizedHistory;
  }

  return [
    getSubmittedFallback(item),
    getDecisionFallback(item, normalizedStatus),
  ].filter(Boolean);
}
