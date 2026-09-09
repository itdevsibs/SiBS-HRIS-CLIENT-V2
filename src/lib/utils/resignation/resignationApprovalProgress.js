function cleanText(value) {
  return String(value ?? "").trim();
}

function getValue(item = {}, aliases = []) {
  const sources = [item, item?.meta, item?.raw, item?.raw?.meta].filter(Boolean);

  for (const source of sources) {
    for (const alias of aliases) {
      const value = source?.[alias];

      if (value !== null && value !== undefined && cleanText(value) !== "") {
        return value;
      }
    }
  }

  return "";
}

function isEnabledFlag(value) {
  if (value === true) return true;
  return Number(value || 0) === 1;
}

function normalizeSibsId(value) {
  const text = cleanText(value);

  if (!text) return "";

  const numeric = Number(text);

  if (Number.isFinite(numeric)) {
    return String(numeric);
  }

  return text;
}

function getUserSibsId(user = {}) {
  return normalizeSibsId(
    user?.username ||
      user?.sibs_id ||
      user?.sibsId ||
      user?.gy_user_code ||
      user?.gyUserCode ||
      "",
  );
}

const STAGE_DEFINITIONS = [
  {
    key: "tl",
    label: "Team Leader",
    approverIdKeys: ["tlSibsId", "tl_sibs_id"],
    approverNameKeys: ["tlFullName", "tl_full_name", "tlName", "tl_name"],
    approvedKeys: ["tlIsApproved", "tl_is_approved"],
    declinedKeys: ["tlIsDeclined", "tl_is_declined"],
  },
  {
    key: "om",
    label: "Operations Manager",
    approverIdKeys: ["omSibsId", "om_sibs_id"],
    approverNameKeys: ["omFullName", "om_full_name", "omName", "om_name"],
    approvedKeys: ["omIsApproved", "om_is_approved"],
    declinedKeys: ["omIsDeclined", "om_is_declined"],
  },
  {
    key: "som",
    label: "Senior Operations Manager",
    approverIdKeys: ["somSibsId", "som_sibs_id"],
    approverNameKeys: ["somFullName", "som_full_name", "somName", "som_name"],
    approvedKeys: ["somIsApproved", "som_is_approved"],
    declinedKeys: ["somIsDeclined", "som_is_declined"],
  },
];

export function buildResignationApprovalStages(item = {}) {
  const activeStages = STAGE_DEFINITIONS.filter((definition) =>
    cleanText(getValue(item, definition.approverIdKeys)),
  );

  const suppliedStages = Array.isArray(item?.approvalStages)
    ? item.approvalStages
    : Array.isArray(item?.approval_stages)
      ? item.approval_stages
      : [];

  let chainStopped = false;
  let currentStageAssigned = false;

  if (!activeStages.length && suppliedStages.length) {
    return suppliedStages
      .map((stage) => {
        const key = cleanText(
          stage?.key || stage?.id || stage?.stageKey || stage?.stage_key,
        ).toLowerCase();

        if (!key) return null;

        const rawStatus = cleanText(
          stage?.status || stage?.approvalStatus || stage?.approval_status,
        ).toLowerCase();

        let status = "Pending";
        let progressState = "pending";

        if (["approved", "approve", "completed", "complete"].includes(rawStatus)) {
          status = "Approved";
          progressState = "completed";
        } else if (["declined", "decline", "rejected", "reject"].includes(rawStatus)) {
          status = "Declined";
          progressState = "declined";
          chainStopped = true;
        } else if (chainStopped) {
          status = "Cancelled";
        } else if (!currentStageAssigned) {
          status = "Pending";
          progressState = "current";
          currentStageAssigned = true;
        }

        return {
          key,
          label: cleanText(
            stage?.label || stage?.stage || stage?.stageName || stage?.stage_name,
          ),
          approverId: cleanText(
            stage?.approverSibsId ||
              stage?.approver_sibs_id ||
              stage?.approverId ||
              stage?.approver_id,
          ),
          approverName: cleanText(
            stage?.approverName ||
              stage?.approver_name ||
              stage?.approver ||
              stage?.name,
          ),
          status,
          progressState,
        };
      })
      .filter(Boolean);
  }

  return activeStages.map((definition) => {
    const approverId = cleanText(getValue(item, definition.approverIdKeys));
    const approverName = cleanText(getValue(item, definition.approverNameKeys));
    const approved = isEnabledFlag(getValue(item, definition.approvedKeys));
    const declined = isEnabledFlag(getValue(item, definition.declinedKeys));

    let status = "Pending";
    let progressState = "pending";

    if (approved) {
      status = "Approved";
      progressState = "completed";
    } else if (declined) {
      status = "Declined";
      progressState = "declined";
      chainStopped = true;
    } else if (chainStopped) {
      status = "Cancelled";
      progressState = "pending";
    } else if (!currentStageAssigned) {
      status = "Pending";
      progressState = "current";
      currentStageAssigned = true;
    }

    return {
      key: definition.key,
      label: definition.label,
      approverId,
      approverName,
      status,
      progressState,
    };
  });
}

export function getResignationApprovalRouteLabel(stages = []) {
  return (Array.isArray(stages) ? stages : [])
    .map((stage) => cleanText(stage?.label || stage?.stage))
    .filter(Boolean)
    .join(" → ");
}

export function getCurrentResignationApprovalStage(item = {}) {
  return (
    buildResignationApprovalStages(item).find(
      (stage) => stage.progressState === "current",
    ) || null
  );
}

export function canUserActOnResignationStage(
  item = {},
  stageKey = "",
  user = {},
) {
  const currentStage = getCurrentResignationApprovalStage(item);
  const userSibsId = getUserSibsId(user);

  if (!currentStage || !userSibsId) return false;
  if (cleanText(currentStage.key) !== cleanText(stageKey)) return false;

  return normalizeSibsId(currentStage.approverId) === userSibsId;
}

