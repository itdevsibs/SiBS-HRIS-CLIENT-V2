const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function normalizeReportText(value) {
  return String(value ?? "").trim();
}

export function toReportNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function firstReportValue(record, keys, fallback = "") {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

function normalizeKeyPart(value) {
  return normalizeReportText(value)
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDepartmentParts(record = {}) {
  return normalizeReportText(
    firstReportValue(record, ["departmentAccount", "department_account"]),
  )
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getRoleAccountKey(record = {}) {
  const role = firstReportValue(record, [
    "roleAccountRole",
    "roleTitle",
    "role_title",
    "role",
    "positionTitle",
    "position_title",
    "jobTitle",
    "job_title",
    "position",
    "title",
  ]);

  const departmentParts = getDepartmentParts(record);
  const account = firstReportValue(
    record,
    [
      "account",
      "accountName",
      "account_name",
      "client",
      "campaign",
    ],
    departmentParts.at(-1) || firstReportValue(record, ["department"]),
  );

  return `${normalizeKeyPart(role)}::${normalizeKeyPart(account)}`;
}

export function getFillRate(accepted, required) {
  const denominator = toReportNumber(required, 0);
  if (denominator <= 0) return 0;
  return Math.round((toReportNumber(accepted, 0) / denominator) * 100);
}

function parseLocalDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(text);
  const parsed = isoDate ? new Date(`${text}T00:00:00`) : new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDaysOpen(openDate, today = new Date()) {
  const parsed = parseLocalDate(openDate);
  if (!parsed) return 0;

  const reference = new Date(today);
  if (Number.isNaN(reference.getTime())) return 0;

  reference.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor((reference.getTime() - parsed.getTime()) / MS_PER_DAY),
  );
}

function startOfWeek(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + offset);
  return result;
}

function getIsoWeekNumber(date) {
  const current = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return Math.ceil(((current - yearStart) / MS_PER_DAY + 1) / 7);
}

function formatShortDate(date, includeYear = false) {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function formatLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildReportingWeekOptions(count = 8, referenceDate = new Date()) {
  const currentStart = startOfWeek(referenceDate);

  return Array.from({ length: Math.max(2, count) }, (_, index) => {
    const start = new Date(currentStart);
    start.setDate(start.getDate() - index * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const weekNumber = getIsoWeekNumber(start);
    const startDate = formatLocalIsoDate(start);
    const endDate = formatLocalIsoDate(end);

    return {
      value: `${startDate}::${endDate}`,
      weekNumber,
      startDate,
      endDate,
      shortLabel: `Week ${weekNumber}`,
      label: `Week ${weekNumber} (${formatShortDate(start)} - ${formatShortDate(end, true)})`,
    };
  });
}

function normalizeStageCount(record, keys) {
  const raw = firstReportValue(record, keys, null);
  if (raw === null || raw === undefined || raw === "") return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

function normalizeRoleAccount(record, fallbackSource = "Recruitment") {
  const departmentParts = getDepartmentParts(record);

  const role = normalizeReportText(
    firstReportValue(
      record,
      [
        "roleTitle",
        "role_title",
        "role",
        "positionTitle",
        "position_title",
        "jobTitle",
        "job_title",
        "position",
      ],
      "Unspecified Role",
    ),
  );

  const account = normalizeReportText(
    firstReportValue(
      record,
      ["account", "accountName", "account_name", "client", "campaign"],
      departmentParts.at(-1) || fallbackSource,
    ),
  );

  const cluster = normalizeReportText(
    firstReportValue(
      record,
      ["cluster", "clusterName", "cluster_name", "businessUnit", "groupName"],
      departmentParts.length > 1
        ? departmentParts[0]
        : firstReportValue(record, ["department"], "Unassigned Cluster"),
    ),
  );

  return {
    role,
    account,
    cluster,
    roleAccountKey: getRoleAccountKey({ roleTitle: role, account }),
  };
}

function getRecordId(record, index) {
  return String(
    firstReportValue(
      record,
      [
        "id",
        "rawId",
        "raw_id",
        "prfId",
        "prf_id",
        "weeklyPlanItemId",
        "weekly_plan_item_id",
        "hiringNeedId",
        "hiring_need_id",
      ],
      index,
    ),
  );
}

function deriveLatestNote(record) {
  return normalizeReportText(
    firstReportValue(
      record,
      [
        "latestStatusNotes",
        "latest_status_notes",
        "latestStatusNote",
        "latest_status_note",
        "statusNotes",
        "status_notes",
        "approvalRemarks",
        "approval_remarks",
        "remarks",
        "notes",
        "updatedRemarks",
        "updated_remarks",
      ],
      "No status note recorded.",
    ),
  );
}

function getReportStage(record = {}) {
  return normalizeReportText(
    firstReportValue(record, [
      "currentStage",
      "current_stage",
      "currentPipelineStage",
      "current_pipeline_stage",
      "pipelineStage",
      "pipeline_stage",
      "stage",
      "finalStage",
      "final_stage",
      "status",
      "pipelineStatus",
      "pipeline_status",
      "finalStatus",
      "final_status",
    ]),
  ).toLowerCase();
}

const STAGE_RANKS = [
  ["initial screening", 1],
  ["online assessment", 2],
  ["assessment fit", 3],
  ["interview scheduled", 3],
  ["interviewed", 4],
  ["offered", 5],
  ["accepted", 6],
  ["for nho", 7],
  ["incomplete requirements", 7],
  ["onboarding", 8],
  ["hired / active", 9],
  ["hired", 9],
];

function getStageRank(record = {}) {
  const stage = getReportStage(record);
  const match = STAGE_RANKS.find(([name]) => stage.includes(name));
  return match?.[1] || 0;
}

function isDropOffRecord(record = {}) {
  const stage = getReportStage(record);
  return (
    stage.includes("drop-off") ||
    stage.includes("drop off") ||
    stage.includes("withdraw") ||
    stage.includes("no show")
  );
}

function findMatchingRecords(records, requirementRecord, roleAccountKey, allCurrentRows = []) {
  return (records || []).filter((record) =>
    candidateMatchesCurrentRow(
      record,
      requirementRecord?.roleAccountKey
        ? requirementRecord
        : { ...requirementRecord, roleAccountKey },
      allCurrentRows,
    ),
  );
}

function dedupeRecords(records = []) {
  const map = new Map();

  records.forEach((record, index) => {
    const key = normalizeReportText(
      firstReportValue(
        record,
        [
          "candidatePipelineId",
          "candidate_pipeline_id",
          "candidateApplicationId",
          "candidate_application_id",
          "candidateId",
          "candidate_id",
          "id",
          "dbId",
          "rawId",
          "email",
          "candidateEmail",
        ],
        `record-${index}`,
      ),
    ).toLowerCase();

    map.set(key, { ...(map.get(key) || {}), ...record });
  });

  return Array.from(map.values());
}

function countAtOrBeyondStage(records, minimumRank) {
  return records.filter(
    (record) => !isDropOffRecord(record) && getStageRank(record) >= minimumRank,
  ).length;
}

function countTrueHires(records = []) {
  return records.filter((record) => {
    const outcome = normalizeReportText(
      firstReportValue(record, [
        "finalOutcome",
        "final_outcome",
        "showStatus",
        "show_status",
        "currentStage",
        "current_stage",
        "status",
      ]),
    ).toLowerCase();

    return ["true hire", "hired", "hired / active", "show"].includes(outcome);
  }).length;
}

export function hasActiveActionForRow(row, items = []) {
  return items.some((item) => {
    if (!item || !["Planned", "Ongoing"].includes(item.status)) return false;

    const bySource =
      (row.weeklyPlanItemId &&
        String(item.weeklyPlanItemId || "") === String(row.weeklyPlanItemId)) ||
      (row.hiringNeedId &&
        String(item.hiringNeedId || "") === String(row.hiringNeedId)) ||
      (row.sourceRecordId &&
        String(item.sourceRecordId || "") === String(row.sourceRecordId));

    const itemKey = item.roleAccountKey || getRoleAccountKey(item);
    return Boolean(bySource || (itemKey && itemKey === row.roleAccountKey));
  });
}

function getDueDateState(dueDate, today) {
  const due = parseLocalDate(dueDate);
  const reference = new Date(today);

  if (!due || Number.isNaN(reference.getTime())) {
    return { overdue: false, nearDue: false };
  }

  due.setHours(0, 0, 0, 0);
  reference.setHours(0, 0, 0, 0);

  const daysUntilDue = Math.ceil(
    (due.getTime() - reference.getTime()) / MS_PER_DAY,
  );

  return {
    overdue: daysUntilDue < 0,
    nearDue: daysUntilDue >= 0 && daysUntilDue <= 7,
  };
}

function isPendingApproval(record = {}) {
  const rawApprovalStatus = firstReportValue(
    record,
    ["approvalStatus", "approval_status"],
    null,
  );

  // Workforce-plan rows may not have an approval workflow at all.
  if (rawApprovalStatus === null || rawApprovalStatus === undefined) {
    return false;
  }

  const status = normalizeReportText(rawApprovalStatus).toLowerCase();

  return (
    !status ||
    status.includes("for approval") ||
    status.includes("pending") ||
    status.includes("under review") ||
    status.includes("for validation")
  );
}

function deriveAtRisk({
  record,
  required,
  accepted,
  qualifiedPipeline,
  dueDate,
  today,
}) {
  const sourceStatus = normalizeReportText(
    firstReportValue(record, [
      "riskStatus",
      "risk_status",
      "overallStatus",
      "overall_status",
      "pipelineStatus",
      "pipeline_status",
      "status",
    ]),
  ).toLowerCase();

  const explicitRisk =
    Boolean(record?.atRisk) ||
    sourceStatus.includes("risk") ||
    sourceStatus.includes("delay");

  const gap = Math.max(0, required - accepted);
  const { overdue, nearDue } = getDueDateState(dueDate, today);
  const insufficientPipeline = gap > 0 && qualifiedPipeline < gap;

  return Boolean(
    isPendingApproval(record) ||
      explicitRisk ||
      (gap > 0 && (overdue || nearDue)) ||
      insufficientPipeline,
  );
}

function deriveRiskReason({
  record,
  required,
  accepted,
  qualifiedPipeline,
  dueDate,
  today,
}) {
  const explicit = normalizeReportText(
    firstReportValue(record, [
      "riskReason",
      "risk_reason",
      "atRiskReason",
      "at_risk_reason",
      "blockerReason",
      "blocker_reason",
    ]),
  );

  if (explicit) return explicit;
  if (isPendingApproval(record)) {
    return "Hiring need is pending approval or validation";
  }

  const gap = Math.max(0, required - accepted);
  const { overdue, nearDue } = getDueDateState(dueDate, today);

  if (gap > 0 && overdue) {
    return "Requirement is overdue with an open hiring gap";
  }
  if (gap > 0 && nearDue) {
    return "Open hiring gap is within 7 days of the due date";
  }
  if (gap > 0 && qualifiedPipeline < gap) {
    return "Insufficient qualified pipeline";
  }
  if (gap > 0) {
    return "Accepted or filled headcount is below requirement";
  }

  return "";
}

function isDownsizeRecord(record = {}) {
  const requestType = normalizeReportText(
    firstReportValue(record, [
      "requestType",
      "request_type",
      "hiringRequestType",
      "hiring_request_type",
      "type",
    ]),
  ).toLowerCase();

  const roleText = normalizeReportText(
    firstReportValue(record, [
      "roleTitle",
      "role_title",
      "positionTitle",
      "position_title",
      "jobTitle",
      "job_title",
      "role",
    ]),
  ).toLowerCase();

  return ["downsize", "reduction", "decrease"].some(
    (term) => requestType.includes(term) || roleText.includes(term),
  );
}

function isOpenRequirementRecord(record = {}) {
  if (isDownsizeRecord(record)) return false;

  const status = normalizeReportText(
    firstReportValue(record, [
      "approvalStatus",
      "approval_status",
      "status",
      "overallStatus",
      "overall_status",
    ]),
  ).toLowerCase();

  return ![
    "not approved",
    "rejected",
    "declined",
    "cancelled",
    "canceled",
    "closed",
    "archived",
    "inactive",
  ].some((value) => status.includes(value));
}

function getSuggestedGap(reason = "") {
  const text = reason.toLowerCase();
  if (text.includes("approval") || text.includes("validation")) return "Approval";
  if (text.includes("screen")) return "Screening";
  if (text.includes("interview")) return "Interview";
  if (text.includes("offer")) return "Offer";
  if (text.includes("onboard") || text.includes("show")) return "Onboarding";
  if (text.includes("pipeline")) return "Pipeline";
  return "Capacity / Manpower";
}

export function buildCurrentStatusRows(context = {}, items = [], options = {}) {
  const today = options.today || new Date();

  const sourceRecords = [
    ...(context.weeklyPlan || [])
      .filter(isOpenRequirementRecord)
      .map((record) => ({
        record,
        sourceModule: "Workforce Hiring Plan",
        sourceType: "weekly",
      })),
    ...(context.hiringNeeds || [])
      .filter(isOpenRequirementRecord)
      .map((record) => ({
        record,
        sourceModule: "Hiring Needs",
        sourceType: "hiring",
      })),
  ];

  // Current Status must always be built from real hiring requirements.
  // Action Items and demo seed records are never valid requisition fallbacks.
  if (!sourceRecords.length) return [];

  const deduped = new Map();

  sourceRecords.forEach(({ record, sourceModule, sourceType }, index) => {
    const normalized = normalizeRoleAccount(record, sourceModule);
    const id = getRecordId(record, index);
    const key = normalized.roleAccountKey || `${sourceModule}-${id}`;

    const relatedCandidates = dedupeRecords([
      ...findMatchingRecords(context.candidateApplications, record, key),
      ...findMatchingRecords(context.pipelineCandidates, record, key),
    ]);
    const relatedOffers = dedupeRecords(
      findMatchingRecords(context.offers, record, key),
    );
    const relatedOnboarding = dedupeRecords(
      findMatchingRecords(context.onboarding, record, key),
    );

    const requiredHiring = toReportNumber(
      firstReportValue(
        record,
        ["requiredHiring", "requiredHeadcount", "requirement", "headcount"],
        0,
      ),
      0,
    );

    const recordAccepted = toReportNumber(
      firstReportValue(
        record,
        [
          "accepted",
          "acceptedCount",
          "acceptedJO",
          "filled",
          "actualHeadcount",
          "currentFilled",
        ],
        0,
      ),
      0,
    );

    const activePipelineCandidates = relatedCandidates.filter(
      (candidate) => !isDropOffRecord(candidate),
    );

    const qualifiedPipeline = toReportNumber(
      firstReportValue(
        record,
        [
          "qualifiedPipeline",
          "qualifiedCount",
          "pipelineCount",
          "startingPipeline",
        ],
        activePipelineCandidates.length,
      ),
      activePipelineCandidates.length,
    );

    const screenedFallback = countAtOrBeyondStage(relatedCandidates, 2);
    const interviewedFallback = countAtOrBeyondStage(relatedCandidates, 4);
    const offersFromPipeline = countAtOrBeyondStage(relatedCandidates, 5);
    const acceptedFromPipeline = countAtOrBeyondStage(relatedCandidates, 6);

    const screened = toReportNumber(
      firstReportValue(record, ["screened", "screenedCount"], screenedFallback),
      screenedFallback,
    );
    const interviewed = toReportNumber(
      firstReportValue(
        record,
        ["interviewed", "interviewedCount"],
        interviewedFallback,
      ),
      interviewedFallback,
    );

    const offersFallback = Math.max(relatedOffers.length, offersFromPipeline);
    const offers = toReportNumber(
      firstReportValue(
        record,
        ["offers", "offerCount", "offersExtended", "joCount"],
        offersFallback,
      ),
      offersFallback,
    );

    const acceptedFromOffers = relatedOffers.filter((offer) => {
      const status = normalizeReportText(
        firstReportValue(offer, [
          "offerDecision",
          "offer_decision",
          "candidateResponse",
          "candidate_response",
          "offerApprovalStatus",
          "offer_approval_status",
          "approvalStatus",
          "approval_status",
          "status",
        ]),
      ).toLowerCase();

      return status.includes("accepted") || status === "approved";
    }).length;

    const confirmedAccepted = Math.max(
      recordAccepted,
      acceptedFromOffers,
      acceptedFromPipeline,
    );

    const hiredFromOnboarding = countTrueHires(relatedOnboarding);
    const hiredFromPipeline = countAtOrBeyondStage(relatedCandidates, 9);
    const hiredFallback = Math.max(hiredFromOnboarding, hiredFromPipeline);

    const hired = toReportNumber(
      firstReportValue(
        record,
        ["hired", "hiredCount", "goLive", "goLiveCount"],
        hiredFallback,
      ),
      hiredFallback,
    );

    const openDate = normalizeReportText(
      firstReportValue(record, [
        "openDate",
        "createdDate",
        "createdAt",
        "created_at",
        "requestDate",
        "dateOpened",
      ]),
    );

    const dueDate = normalizeReportText(
      firstReportValue(record, [
        "dueDate",
        "targetDate",
        "requiredDate",
        "dateNeeded",
        "date_needed",
      ]),
    );

    const atRisk = deriveAtRisk({
      record,
      required: requiredHiring,
      accepted: confirmedAccepted,
      qualifiedPipeline,
      dueDate,
      today,
    });

    const reason = atRisk
      ? deriveRiskReason({
          record,
          required: requiredHiring,
          accepted: confirmedAccepted,
          qualifiedPipeline,
          dueDate,
          today,
        })
      : "";

    const row = {
      id: `CS-${sourceModule.replace(/\s+/g, "-").toUpperCase()}-${id}`,
      role: normalized.role,
      roleTitle: normalized.role,
      account: normalized.account,
      cluster: normalized.cluster,
      taOwner: normalizeReportText(
        firstReportValue(
          record,
          [
            "taOwner",
            "ta_owner",
            "owner",
            "recruiter",
            "requestOwner",
            "preparedBy",
            "prepared_by",
            "requestedBy",
            "requested_by",
          ],
          "Unassigned",
        ),
      ),
      openDate,
      dueDate,
      requiredHiring,
      qualifiedPipeline,
      screened,
      interviewed,
      offers,
      accepted: confirmedAccepted,
      hired,
      fillRate: getFillRate(confirmedAccepted, requiredHiring),
      daysOpen: getDaysOpen(openDate, today),
      atRisk,
      reason,
      latestStatusNotes: deriveLatestNote(record),
      weeklyPlanItemId: sourceType === "weekly" ? id : "",
      hiringNeedId: sourceType === "hiring" ? id : "",
      sourceModule,
      sourceRecordId: id,
      roleAccountKey: key,
      reportingWeek: options.reportingWeekLabel || "",
      suggestedRisk: atRisk ? "High" : "Medium",
      suggestedGap: getSuggestedGap(reason),
    };

    row.hasActiveAction = hasActiveActionForRow(row, items);
    row.missingAction = row.atRisk && !row.hasActiveAction;

    const existing = deduped.get(key);
    if (!existing || sourceModule === "Workforce Hiring Plan") {
      deduped.set(key, row);
    }
  });

  return Array.from(deduped.values());
}

function safeJsonArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getCandidateTimeline(candidate = {}) {
  const sources = [
    candidate.timeline,
    candidate.history,
    candidate.stageHistory,
    candidate.stage_history,
    candidate.applicationHistory,
    candidate.application_history,
    candidate.movementTimeline,
    candidate.movement_timeline,
    candidate.timelineJson,
    candidate.timeline_json,
    candidate.applicationHistoryJson,
    candidate.application_history_json,
  ];

  const events = sources.flatMap((source) => safeJsonArray(source));
  const unique = new Map();

  events.forEach((event, index) => {
    const date = getTimelineEventDate(event);
    const stage = normalizeTimelineStage(event);
    const key = [
      stage,
      date?.toISOString?.() || "",
      normalizeReportText(
        firstReportValue(event, ["status", "statusLabel", "reason", "remarks"]),
      ).toLowerCase(),
      index,
    ].join("::");

    unique.set(key, event);
  });

  return Array.from(unique.values()).sort((first, second) => {
    const firstTime = getTimelineEventDate(first)?.getTime?.() || 0;
    const secondTime = getTimelineEventDate(second)?.getTime?.() || 0;
    return firstTime - secondTime;
  });
}

function getTimelineEventDate(event = {}) {
  const value = firstReportValue(event, [
    "createdAt",
    "created_at",
    "date",
    "timestamp",
    "updatedAt",
    "updated_at",
    "movedAt",
    "moved_at",
    "dateMoved",
    "date_moved",
  ]);

  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getCandidateEntryDate(candidate = {}) {
  const directValue = firstReportValue(candidate, [
    "createdAt",
    "created_at",
    "movedToPipelineAt",
    "moved_to_pipeline_at",
    "pipelineCreatedAt",
    "pipeline_created_at",
    "dateMoved",
    "date_moved",
  ]);

  const direct = directValue ? new Date(directValue) : null;
  if (direct && !Number.isNaN(direct.getTime())) return direct;

  return (
    getCandidateTimeline(candidate)
      .map(getTimelineEventDate)
      .filter(Boolean)
      .sort((first, second) => first.getTime() - second.getTime())[0] || null
  );
}

function normalizeTimelineStage(event = {}) {
  const direct = normalizeReportText(
    firstReportValue(event, [
      "stage",
      "pipelineStage",
      "pipeline_stage",
      "currentStage",
      "current_stage",
      "currentPipelineStage",
      "current_pipeline_stage",
      "title",
    ]),
  );

  const text = [
    direct,
    firstReportValue(event, ["status", "statusLabel", "status_label"]),
    firstReportValue(event, ["outcome", "reason", "description", "remarks"]),
  ]
    .map((value) => normalizeReportText(value).toLowerCase())
    .filter(Boolean)
    .join(" ")
    .replace(/[–—−_]/g, "-")
    .replace(/\s+/g, " ");

  if (!text) return "";
  if (/drop[ -]?off|dropped[ -]?off|withdraw|no show/.test(text)) {
    return "Drop-off";
  }
  if (/hired\s*\/\s*active|true hire|go live|\bhired\b/.test(text)) {
    return "Hired / Active";
  }
  if (/for nho|\bnho\b/.test(text)) return "For NHO";
  if (/\baccepted\b|offer decision[^a-z]*accepted/.test(text)) {
    return "Accepted";
  }
  if (/\boffered\b|offer details|offer approved|offer sent/.test(text)) {
    return "Offered";
  }
  if (/interview completed|\binterviewed\b|final interview/.test(text)) {
    return "Interviewed";
  }
  if (/interview scheduled|schedule interview/.test(text)) {
    return "Interview Scheduled";
  }
  if (/assessment fit/.test(text)) return "Assessment Fit";
  if (/online assessment|assessment completed|assessment taken/.test(text)) {
    return "Online Assessment";
  }
  if (/initial screening|screening completed|screening passed|prf status/.test(text)) {
    return "Initial Screening";
  }
  if (/onboarding/.test(text)) return "Onboarding";

  return direct;
}

function getTimelineEventStatusText(event = {}) {
  return [
    firstReportValue(event, ["status", "statusLabel", "status_label"]),
    firstReportValue(event, ["outcome", "reason", "description", "remarks"]),
  ]
    .map((value) => normalizeReportText(value).toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function isScreenedTimelineEvent(event = {}) {
  const stage = normalizeTimelineStage(event);
  const statusText = getTimelineEventStatusText(event);

  return (
    stage === "Online Assessment" ||
    stage === "Assessment Fit" ||
    (stage === "Initial Screening" &&
      /completed|passed|fit|approved/.test(statusText))
  );
}

function isTerminalTimelineStage(stage = "") {
  return stage === "Drop-off" || stage === "Hired / Active";
}

function parseManilaWeekBoundary(dateOnly, { endExclusive = false } = {}) {
  const text = normalizeReportText(dateOnly).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;

  const parsed = new Date(`${text}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  if (endExclusive) parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed;
}

function isDateWithinWeek(date, weekStart, weekEndExclusive) {
  return Boolean(
    date &&
      weekStart &&
      weekEndExclusive &&
      date.getTime() >= weekStart.getTime() &&
      date.getTime() < weekEndExclusive.getTime(),
  );
}

function getFirstTerminalDate(candidate = {}) {
  const dates = getCandidateTimeline(candidate)
    .filter((event) => isTerminalTimelineStage(normalizeTimelineStage(event)))
    .map(getTimelineEventDate)
    .filter(Boolean)
    .sort((first, second) => first.getTime() - second.getTime());

  if (dates.length) return dates[0];

  const currentStage = getReportStage(candidate);
  if (
    currentStage.includes("drop-off") ||
    currentStage.includes("drop off") ||
    currentStage.includes("hired / active") ||
    currentStage === "hired"
  ) {
    const fallbackValue = firstReportValue(candidate, [
      "droppedOffAt",
      "dropped_off_at",
      "dateMoved",
      "date_moved",
      "updatedAt",
      "updated_at",
    ]);
    const fallback = fallbackValue ? new Date(fallbackValue) : null;
    return fallback && !Number.isNaN(fallback.getTime()) ? fallback : null;
  }

  return null;
}

function getExplicitCandidateRequirementId(candidate = {}) {
  const offerDetails =
    candidate.offerDetails && typeof candidate.offerDetails === "object"
      ? candidate.offerDetails
      : candidate.offer_details && typeof candidate.offer_details === "object"
        ? candidate.offer_details
        : {};

  const metadata =
    candidate.metadata && typeof candidate.metadata === "object"
      ? candidate.metadata
      : candidate.metadata_json && typeof candidate.metadata_json === "object"
        ? candidate.metadata_json
        : {};

  const candidateSnapshot =
    candidate.candidateSnapshot &&
    typeof candidate.candidateSnapshot === "object"
      ? candidate.candidateSnapshot
      : candidate.candidate_snapshot &&
          typeof candidate.candidate_snapshot === "object"
        ? candidate.candidate_snapshot
        : {};

  return normalizeReportText(
    candidate.hiringRequirementId ||
      candidate.hiring_requirement_id ||
      candidate.currentHiringRequirementId ||
      candidate.current_hiring_requirement_id ||
      offerDetails.hiringRequirementId ||
      offerDetails.hiring_requirement_id ||
      metadata.hiringRequirementId ||
      metadata.hiring_requirement_id ||
      candidateSnapshot.hiringRequirementId ||
      candidateSnapshot.hiring_requirement_id ||
      "",
  );
}

function getCurrentRequirementIds(current = {}) {
  return [
    current.hiringNeedId,
    current.hiring_need_id,
    current.weeklyPlanItemId,
    current.weekly_plan_item_id,
    current.sourceRecordId,
    current.prfId,
    current.prf_id,
    current.hiringRequirementId,
    current.hiring_requirement_id,
  ]
    .map((value) => normalizeReportText(value))
    .filter(Boolean);
}

function isUnassignedAccount(value) {
  const normalized = normalizeKeyPart(value);

  return (
    !normalized ||
    normalized === "not assigned yet" ||
    normalized === "unassigned" ||
    normalized === "not assigned" ||
    normalized === "n a"
  );
}

function candidateMatchesCurrentRow(
  candidate = {},
  current = {},
  allCurrentRows = [],
) {
  if (!candidate || !current) return false;

  // 1. Match the canonical Hiring Need / PRF identifier first.
  const candidateRequirementId =
    getExplicitCandidateRequirementId(candidate);
  const currentRequirementIds =
    getCurrentRequirementIds(current);

  if (candidateRequirementId) {
    return currentRequirementIds.includes(
      candidateRequirementId,
    );
  }

  // 2. Fall back to an exact normalized role and account match.
  const candidateKey =
    candidate.roleAccountKey ||
    getRoleAccountKey(candidate);
  const currentKey =
    current.roleAccountKey ||
    getRoleAccountKey(current);

  if (
    candidateKey &&
    currentKey &&
    candidateKey === currentKey
  ) {
    return true;
  }

  const candidateRole = normalizeKeyPart(
    candidate.roleTitle ||
      candidate.role_title ||
      candidate.currentAppliedRole ||
      candidate.current_applied_role ||
      candidate.openPosition ||
      candidate.open_position,
  );

  const currentRole = normalizeKeyPart(
    current.role ||
      current.roleTitle ||
      current.role_title,
  );

  if (!candidateRole || candidateRole !== currentRole) {
    return false;
  }

  const candidateAccount =
    candidate.account ||
    candidate.accountName ||
    candidate.account_name ||
    candidate.currentAppliedAccount ||
    candidate.current_applied_account ||
    candidate.finalAccount ||
    candidate.final_account ||
    "";

  // Never ignore a real account that conflicts with the requirement.
  if (!isUnassignedAccount(candidateAccount)) {
    return false;
  }

  // 3. Use role-only matching only when one active requirement owns the role.
  const sameRoleRows = (allCurrentRows || []).filter(
    (row) =>
      normalizeKeyPart(
        row.role ||
          row.roleTitle ||
          row.role_title,
      ) === currentRole,
  );

  return sameRoleRows.length === 1;
}

function countCandidatesWithWeeklyEvent(candidates, predicate, weekStart, weekEndExclusive) {
  return candidates.filter((candidate) =>
    getCandidateTimeline(candidate).some((event) => {
      const date = getTimelineEventDate(event);
      return isDateWithinWeek(date, weekStart, weekEndExclusive) && predicate(event);
    }),
  ).length;
}

function buildWeeklyKeyIssue({ targetHires, hired, dropOffs, newSourced, startingPipeline }) {
  const issues = [];
  const gap = Math.max(0, toReportNumber(targetHires, 0) - toReportNumber(hired, 0));

  if (gap > 0) issues.push(`${gap} hire(s) below target`);
  if (dropOffs > 0) issues.push(`${dropOffs} candidate drop-off(s)`);
  if (startingPipeline + newSourced === 0) issues.push("No active candidate pipeline recorded");

  return issues.length ? issues.join("; ") : "No critical pipeline issue recorded.";
}

export function buildWeeklyPerformanceRows(context = {}, options = {}) {
  const currentRows =
    options.currentStatusRows || buildCurrentStatusRows(context, [], options);

  const weekStart = parseManilaWeekBoundary(options.previousWeekStart);
  const weekEndExclusive = parseManilaWeekBoundary(options.previousWeekEnd, {
    endExclusive: true,
  });
  const pipelineState = context.sourceState?.pipeline || {};
  const pipelineLoaded =
    pipelineState.loaded !== undefined
      ? Boolean(pipelineState.loaded)
      : Array.isArray(context.pipelineCandidates);
  const pipelineError = normalizeReportText(pipelineState.error);
  const allCandidates = dedupeRecords([
    ...(context.candidateApplications || []),
    ...(context.pipelineCandidates || []),
  ]);

  return currentRows.map((current, index) => {
    const candidates = allCandidates.filter((candidate) =>
      candidateMatchesCurrentRow(candidate, current, currentRows),
    );

    const hasValidWeek = Boolean(weekStart && weekEndExclusive);
    const hasHistoricalData = Boolean(pipelineLoaded && !pipelineError && hasValidWeek);
    const targetHires = toReportNumber(current.requiredHiring, 0);

    if (!hasHistoricalData) {
      const unavailableMessage = pipelineError
        ? `Candidate Pipeline unavailable: ${pipelineError}`
        : pipelineState.loading
          ? "Candidate Pipeline is still loading."
          : "No historical movement data";

      return {
        id: `WP-${current.sourceRecordId || index}`,
        role: current.role,
        account: current.account,
        cluster: current.cluster,
        roleAccountKey: current.roleAccountKey,
        weekCovered: options.previousWeekLabel || "Previous week",
        startingPipeline: null,
        newSourced: null,
        screened: null,
        interviewed: null,
        offers: null,
        accepted: null,
        hired: null,
        dropOffs: null,
        endingPipeline: null,
        targetHires,
        progressVsPlan: "No historical data",
        keyIssueLastWeek: unavailableMessage,
        hasHistoricalData: false,
      };
    }

    const startingPipeline = candidates.filter((candidate) => {
      const entryDate = getCandidateEntryDate(candidate);
      if (!entryDate || entryDate.getTime() >= weekStart.getTime()) return false;

      const terminalDate = getFirstTerminalDate(candidate);
      return !terminalDate || terminalDate.getTime() >= weekStart.getTime();
    }).length;

    const newSourced = candidates.filter((candidate) =>
      isDateWithinWeek(
        getCandidateEntryDate(candidate),
        weekStart,
        weekEndExclusive,
      ),
    ).length;

    const screened = countCandidatesWithWeeklyEvent(
      candidates,
      isScreenedTimelineEvent,
      weekStart,
      weekEndExclusive,
    );
    const interviewed = countCandidatesWithWeeklyEvent(
      candidates,
      (event) => normalizeTimelineStage(event) === "Interviewed",
      weekStart,
      weekEndExclusive,
    );
    const offers = countCandidatesWithWeeklyEvent(
      candidates,
      (event) => normalizeTimelineStage(event) === "Offered",
      weekStart,
      weekEndExclusive,
    );
    const accepted = countCandidatesWithWeeklyEvent(
      candidates,
      (event) => normalizeTimelineStage(event) === "Accepted",
      weekStart,
      weekEndExclusive,
    );
    const hired = countCandidatesWithWeeklyEvent(
      candidates,
      (event) => normalizeTimelineStage(event) === "Hired / Active",
      weekStart,
      weekEndExclusive,
    );
    const dropOffs = countCandidatesWithWeeklyEvent(
      candidates,
      (event) => normalizeTimelineStage(event) === "Drop-off",
      weekStart,
      weekEndExclusive,
    );
    const endingPipeline = Math.max(
      0,
      startingPipeline + newSourced - hired - dropOffs,
    );

    return {
      id: `WP-${current.sourceRecordId || index}`,
      role: current.role,
      account: current.account,
      cluster: current.cluster,
      roleAccountKey: current.roleAccountKey,
      weekCovered: options.previousWeekLabel || "Previous week",
      startingPipeline,
      newSourced,
      screened,
      interviewed,
      offers,
      accepted,
      hired,
      dropOffs,
      endingPipeline,
      targetHires,
      progressVsPlan: `Target: ${targetHires}, Actual: ${hired}`,
      keyIssueLastWeek: buildWeeklyKeyIssue({
        targetHires,
        hired,
        dropOffs,
        newSourced,
        startingPipeline,
      }),
      hasHistoricalData: true,
    };
  });
}

export function filterReportRows(
  rows = [],
  scope = {},
  selectedRoleAccount = null,
) {
  return rows.filter((row) => {
    const matchCluster =
      !scope.cluster || scope.cluster === "All" || row.cluster === scope.cluster;
    const matchAccount =
      !scope.account || scope.account === "All" || row.account === scope.account;
    const matchRole =
      !scope.role ||
      scope.role === "All" ||
      row.role === scope.role ||
      row.roleTitle === scope.role;
    const matchOwner =
      !scope.owner ||
      scope.owner === "All" ||
      !row.taOwner ||
      row.taOwner === scope.owner;
    const matchRisk = !scope.atRiskOnly || row.atRisk;
    const matchSelected =
      !selectedRoleAccount ||
      row.roleAccountKey === selectedRoleAccount.roleAccountKey;

    return (
      matchCluster &&
      matchAccount &&
      matchRole &&
      matchOwner &&
      matchRisk &&
      matchSelected
    );
  });
}

export function filterActionItemsForReport(
  items = [],
  scope = {},
  selectedRoleAccount = null,
) {
  return items.filter((item) => {
    const itemKey = item.roleAccountKey || getRoleAccountKey(item);
    const matchCluster =
      !scope.cluster ||
      scope.cluster === "All" ||
      !item.cluster ||
      item.cluster === scope.cluster;
    const matchAccount =
      !scope.account || scope.account === "All" || item.account === scope.account;
    const matchRole =
      !scope.role ||
      scope.role === "All" ||
      item.roleTitle === scope.role ||
      item.role === scope.role;
    const matchOwner =
      !scope.owner || scope.owner === "All" || item.owner === scope.owner;
    const matchRisk = !scope.atRiskOnly || item.riskLevel === "High";
    const matchSelected =
      !selectedRoleAccount || itemKey === selectedRoleAccount.roleAccountKey;

    return (
      matchCluster &&
      matchAccount &&
      matchRole &&
      matchOwner &&
      matchRisk &&
      matchSelected
    );
  });
}

export function getMissingActionRows(currentRows = []) {
  return currentRows.filter((row) => row.atRisk && row.missingAction);
}

function getLocalDayKey(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : parseLocalDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return formatLocalIsoDate(date);
}

export function buildExecutionMetrics(
  currentRows = [],
  actionItems = [],
  _systemSignalCount = 0,
) {
  const todayKey = getLocalDayKey();

  const atRiskAccounts = new Set(
    currentRows.filter((row) => row.atRisk).map((row) => row.account),
  ).size;

  // The card represents uncovered hiring gaps/requirements, not unique accounts.
  const missingActionAccounts = getMissingActionRows(currentRows).length;

  return {
    atRiskAccounts,
    missingActionAccounts,
    planned: actionItems.filter((item) => item.status === "Planned").length,
    ongoing: actionItems.filter((item) => item.status === "Ongoing").length,
    overdue: actionItems.filter((item) => {
      if (["Completed", "Cancelled"].includes(item.status) || !item.deadline) {
        return false;
      }

      const deadlineKey = getLocalDayKey(item.deadline);
      return Boolean(deadlineKey && todayKey && deadlineKey < todayKey);
    }).length,
    completed: actionItems.filter((item) => item.status === "Completed").length,
    systemSuggested: actionItems.filter(
      (item) =>
        item.systemGenerated ||
        String(item.sourceType || "").toLowerCase().includes("system"),
    ).length,
  };
}

export function buildActionItemsReportPayload({
  scope,
  previousWeekLabel,
  weeklyPerformanceRows,
  currentStatusRows,
  actionItems,
  recipients,
  subject,
  note,
  requestedBy,
}) {
  const requiredHires = currentStatusRows.reduce(
    (sum, row) => sum + toReportNumber(row.requiredHiring, 0),
    0,
  );
  const acceptedHires = currentStatusRows.reduce(
    (sum, row) => sum + toReportNumber(row.accepted, 0),
    0,
  );

  return {
    reportType: "recruitment-action-items",
    scope: { ...scope, previousWeekLabel },
    recipients,
    subject,
    note,
    requestedBy,
    generatedAt: new Date().toISOString(),
    summary: {
      activeRoles: currentStatusRows.length,
      requiredHires,
      acceptedHires,
      fillRate: getFillRate(acceptedHires, requiredHires),
      atRiskRoles: currentStatusRows.filter((row) => row.atRisk).length,
      missingActions: currentStatusRows.filter((row) => row.missingAction).length,
      openActions: actionItems.filter((item) =>
        ["Planned", "Ongoing"].includes(item.status),
      ).length,
    },
    sections: {
      weeklyPerformance: weeklyPerformanceRows,
      currentStatus: currentStatusRows,
      actionItems,
    },
  };
}

export function buildPlainTextReport(payload) {
  const lines = [
    "RECRUITMENT SLA & EXECUTION REPORT",
    `Reporting Week: ${payload.scope?.weekLabel || payload.scope?.week || "—"}`,
    `Previous Week: ${payload.scope?.previousWeekLabel || "—"}`,
    `Scope: Cluster [${payload.scope?.cluster || "All"}] | Account [${payload.scope?.account || "All"}] | Role [${payload.scope?.role || "All"}] | TA Owner [${payload.scope?.owner || "All"}]`,
    "",
  ];

  if (payload.note) lines.push("NOTE FROM SENDER:", payload.note, "");

  lines.push("EXECUTIVE SUMMARY");
  lines.push(`- Active roles/accounts: ${payload.summary.activeRoles}`);
  lines.push(`- Required hires: ${payload.summary.requiredHires}`);
  lines.push(
    `- Accepted/filled: ${payload.summary.acceptedHires} (${payload.summary.fillRate}% fill rate)`,
  );
  lines.push(`- At-risk roles: ${payload.summary.atRiskRoles}`);
  lines.push(`- Missing actions: ${payload.summary.missingActions}`);
  lines.push(`- Open actions: ${payload.summary.openActions}`, "");

  lines.push("WEEKLY PERFORMANCE");
  payload.sections.weeklyPerformance.forEach((row, index) => {
    lines.push(`${index + 1}. ${row.account} - ${row.role}`);
    if (!row.hasHistoricalData) {
      lines.push("   No historical data");
    } else {
      lines.push(
        `   Pipeline ${row.startingPipeline ?? "—"} | Sourced ${row.newSourced ?? "—"} | Screened ${row.screened ?? "—"} | Interviewed ${row.interviewed ?? "—"}`,
      );
      lines.push(
        `   Offers ${row.offers ?? "—"} | Accepted ${row.accepted ?? "—"} | Hired ${row.hired ?? "—"} | Drop-offs ${row.dropOffs ?? "—"}`,
      );
      lines.push(
        `   ${row.progressVsPlan} | Issue: ${row.keyIssueLastWeek}`,
      );
    }
  });

  lines.push("", "CURRENT STATUS");
  payload.sections.currentStatus.forEach((row, index) => {
    lines.push(`${index + 1}. ${row.account} - ${row.role}`);
    lines.push(
      `   Owner: ${row.taOwner} | Required: ${row.requiredHiring} | Accepted/filled: ${row.accepted} | Fill rate: ${row.fillRate}%`,
    );
    lines.push(
      `   Status: ${row.atRisk ? `AT RISK - ${row.reason}` : "ON TRACK"} | Action coverage: ${row.missingAction ? "MISSING ACTION" : "COVERED"}`,
    );
    lines.push(`   Latest note: ${row.latestStatusNotes}`);
  });

  lines.push("", "ACTION ITEMS - JIT DELIVERY FOCUS");
  payload.sections.actionItems.forEach((item, index) => {
    lines.push(
      `${index + 1}. [${item.actionId || item.id}] ${item.actionItem || item.description}`,
    );
    lines.push(
      `   ${item.roleTitle || item.role || "—"} / ${item.account || "—"} | Owner: ${item.owner || "—"}`,
    );
    lines.push(
      `   Deadline: ${item.deadline || "—"} | Status: ${item.status || "—"} | Risk: ${item.riskLevel || item.risk || "—"}`,
    );
    if (item.remarks || item.notes) {
      lines.push(`   Remarks: ${item.remarks || item.notes}`);
    }
  });

  return lines.join("\n");
}
