const MAJOR_ONBOARDING_REQUIREMENTS = Object.freeze([
  "Transcript of Records and/or Diploma",
  "Medical Records",
  "NBI Clearance",
  "Birth Certificate",
  "Valid ID",
]);

const MAX_NOTIFICATION_ITEMS_PER_TYPE = 3;

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRequirement(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTimestamp(value) {
  if (!value) return 0;

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getNewestTimestamp(...values) {
  return values.reduce(
    (latest, value) => Math.max(latest, toTimestamp(value)),
    0,
  );
}

export function formatNotificationTime(value, now = Date.now()) {
  const timestamp = toTimestamp(value);
  const currentTime = Number(now) || Date.now();

  if (!timestamp) return "Current";

  const difference = Math.max(currentTime - timestamp, 0);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) return "Current";

  if (difference < hour) {
    const minutes = Math.max(1, Math.floor(difference / minute));
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  if (difference < day) {
    const hours = Math.max(1, Math.floor(difference / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  if (difference < 7 * day) {
    const days = Math.max(1, Math.floor(difference / day));
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Date(timestamp).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPipelineRows(response = {}) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.candidates)) return response.candidates;
  return [];
}

function getHiringNeedsRows(response = {}) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.hiringNeeds)) return response.hiringNeeds;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function getPipelineRecordId(candidate = {}) {
  return cleanText(
    candidate.id ||
      candidate.dbId ||
      candidate.db_id ||
      candidate.candidatePipelineId ||
      candidate.candidate_pipeline_id ||
      candidate.pipelineRecordId ||
      candidate.pipeline_record_id ||
      "",
  );
}

function getCandidateName(candidate = {}) {
  return (
    cleanText(
      candidate.name ||
        candidate.candidateName ||
        candidate.candidate_name ||
        candidate.fullName ||
        candidate.full_name,
    ) || "Candidate"
  );
}

function getCandidateRole(candidate = {}) {
  return cleanText(
    candidate.currentAppliedRole ||
      candidate.current_applied_role ||
      candidate.roleTitle ||
      candidate.role_title ||
      candidate.openPosition ||
      candidate.open_position ||
      candidate.roleCapability ||
      candidate.role_capability ||
      "",
  );
}

function getCandidateAccount(candidate = {}) {
  return cleanText(
    candidate.currentAppliedAccount ||
      candidate.current_applied_account ||
      candidate.account ||
      candidate.accountFit ||
      candidate.account_fit ||
      candidate.leadAccount ||
      candidate.lead_account ||
      "",
  );
}

function getCandidateStage(candidate = {}) {
  return normalizeText(
    candidate.currentPipelineStage ||
      candidate.current_pipeline_stage ||
      candidate.currentStage ||
      candidate.current_stage ||
      candidate.pipelineStage ||
      candidate.pipeline_stage ||
      candidate.stage ||
      "",
  );
}

function getInterviewResponseStatus(candidate = {}) {
  return normalizeText(
    candidate.interviewResponseStatus ||
      candidate.interview_response_status ||
      "",
  );
}

function getCandidateFiles(candidate = {}) {
  const files =
    candidate.nhoFiles ||
    candidate.nho_files ||
    candidate.preEmploymentFiles ||
    candidate.pre_employment_files ||
    candidate.files ||
    [];

  return Array.isArray(files) ? files : [];
}

function getRequirementFromFile(file = {}) {
  const direct = cleanText(
    file.requirement ||
      file.label ||
      file.category ||
      file.title ||
      "",
  );

  if (direct) return direct;

  return cleanText(
    file.savedFileName ||
      file.saved_file_name ||
      file.filename ||
      file.storedFileName ||
      file.stored_file_name ||
      file.fileName ||
      file.name ||
      file.originalName ||
      file.originalname ||
      "",
  );
}

function fileMatchesRequirement(file = {}, requirement = "") {
  const actual = normalizeRequirement(getRequirementFromFile(file));
  const expected = normalizeRequirement(requirement);

  if (!actual || !expected) return false;

  return (
    actual === expected ||
    actual.includes(expected) ||
    expected.includes(actual)
  );
}

export function getMissingMajorRequirementCount(candidate = {}) {
  const files = getCandidateFiles(candidate);

  const completed = MAJOR_ONBOARDING_REQUIREMENTS.filter((requirement) =>
    files.some((file) => fileMatchesRequirement(file, requirement)),
  ).length;

  return Math.max(MAJOR_ONBOARDING_REQUIREMENTS.length - completed, 0);
}

function buildCandidateIdentity(candidate = {}) {
  return {
    pipelineId: getPipelineRecordId(candidate),
    candidateId: cleanText(candidate.candidateId || candidate.candidate_id),
    applicationId: cleanText(
      candidate.candidateApplicationId ||
        candidate.candidate_application_id ||
        candidate.applicationId ||
        candidate.application_id,
    ),
    sourceTalentPoolId: cleanText(
      candidate.sourceTalentPoolId ||
        candidate.source_talent_pool_id,
    ),
    email: cleanText(candidate.email).toLowerCase(),
    name: getCandidateName(candidate),
  };
}

function sortByTimestampDescending(items = []) {
  return [...items].sort(
    (left, right) =>
      Number(right.notificationTimestamp || 0) -
      Number(left.notificationTimestamp || 0),
  );
}

function makeStableNotificationId(prefix, recordId, timestamp, fallback = "") {
  const suffix = cleanText(timestamp) || cleanText(fallback) || "current";
  return `${prefix}-${recordId || "record"}-${suffix}`;
}

export function buildCandidatePipelineNotifications(
  response = {},
  now = Date.now(),
) {
  if (response?.success === false) return [];

  const rows = getPipelineRows(response);

  const confirmedInterviews = rows
    .filter((candidate) => {
      const stage = getCandidateStage(candidate);
      const responseStatus = getInterviewResponseStatus(candidate);

      return (
        stage === "interview scheduled" &&
        ["accepted", "rescheduled"].includes(responseStatus)
      );
    })
    .map((candidate) => {
      const recordId = getPipelineRecordId(candidate);
      const responseAt =
        candidate.interviewResponseAt ||
        candidate.interview_response_at ||
        candidate.updatedAt ||
        candidate.updated_at ||
        candidate.lastActivity ||
        candidate.last_activity ||
        "";
      const notificationTimestamp = getNewestTimestamp(responseAt);
      const name = getCandidateName(candidate);
      const role = getCandidateRole(candidate);

      return {
        id: makeStableNotificationId(
          "notif-interview-confirmed",
          recordId,
          responseAt,
          getInterviewResponseStatus(candidate),
        ),
        category: "system",
        type: "info",
        title: "Candidate Interview Confirmed",
        message: role
          ? `${name} responded and confirmed their ${role} interview.`
          : `${name} responded and confirmed their interview.`,
        time: formatNotificationTime(notificationTimestamp, now),
        timestamp: notificationTimestamp || Number(now),
        notificationTimestamp,
        actionLabel: "",
        actionPath: "/recruitment/candidate-pipeline",
        actionState: {
          source: "candidate-interview-notification",
          candidate,
        },
      };
    });

  const incompleteRequirements = rows
    .filter((candidate) => {
      const stage = getCandidateStage(candidate);

      return (
        stage === "incomplete requirements" ||
        stage === "for incomplete requirements" ||
        stage === "for onboarding incomplete requirements" ||
        stage === "onboarding incomplete requirements" ||
        (
          stage.includes("incomplete requirements") &&
          (stage.includes("onboarding") || stage.includes("nho"))
        )
      );
    })
    .map((candidate) => {
      const recordId = getPipelineRecordId(candidate);
      const updatedAt =
        candidate.updatedAt ||
        candidate.updated_at ||
        candidate.lastActivity ||
        candidate.last_activity ||
        "";
      const notificationTimestamp = getNewestTimestamp(updatedAt);
      const name = getCandidateName(candidate);
      const account = getCandidateAccount(candidate);
      const missing = getMissingMajorRequirementCount(candidate);
      const missingText =
        missing > 0
          ? `${missing} missing major onboarding requirement${
              missing === 1 ? "" : "s"
            }`
          : "incomplete onboarding requirements";

      return {
        id: makeStableNotificationId(
          "notif-incomplete-onboarding",
          recordId,
          updatedAt,
          getCandidateStage(candidate),
        ),
        category: "system",
        type: "warning",
        title: "Incomplete Onboarding Requirements",
        message: account
          ? `${name} has ${missingText} for ${account}.`
          : `${name} has ${missingText}.`,
        time: formatNotificationTime(notificationTimestamp, now),
        timestamp: notificationTimestamp || Number(now),
        notificationTimestamp,
        actionLabel: "",
        actionPath: "/recruitment/talent-pool",
        actionState: {
          source: "incomplete-requirements-notification",
          candidateIdentity: buildCandidateIdentity(candidate),
        },
      };
    });

  return [
    ...sortByTimestampDescending(confirmedInterviews).slice(
      0,
      MAX_NOTIFICATION_ITEMS_PER_TYPE,
    ),
    ...sortByTimestampDescending(incompleteRequirements).slice(
      0,
      MAX_NOTIFICATION_ITEMS_PER_TYPE,
    ),
  ];
}

function getHiringNeedStatus(item = {}) {
  return normalizeText(
    item.approvalStatus ||
      item.approval_status ||
      item.status ||
      "",
  );
}

function isPendingHiringNeed(item = {}) {
  return [
    "pending",
    "for approval",
    "for review",
    "for validation",
    "under review",
  ].includes(getHiringNeedStatus(item));
}

function getHiringNeedId(item = {}) {
  return cleanText(
    item.rawId ||
      item.raw_id ||
      item.dbId ||
      item.hiringNeedId ||
      item.hiring_need_id ||
      item.prfRawId ||
      item.prfId ||
      item.prf_id ||
      item.id ||
      "",
  ).replace(/^HN-|^PRF-|^HIRING-NEEDS-/i, "");
}

function getHiringNeedRole(item = {}) {
  return (
    cleanText(
      item.positionTitle ||
        item.position_title ||
        item.roleTitle ||
        item.role_title ||
        item.jobDescriptionTitle ||
        item.job_description_title ||
        "",
    ) || "the requested position"
  );
}

export function buildHiringNeedsNotifications(
  response = {},
  now = Date.now(),
) {
  if (response?.success === false) return [];

  return sortByTimestampDescending(
    getHiringNeedsRows(response)
      .filter(isPendingHiringNeed)
      .map((item) => {
        const recordId = getHiringNeedId(item);
        const createdAt =
          item.createdAt ||
          item.created_at ||
          item.dateRequested ||
          item.date_requested ||
          item.updatedAt ||
          item.updated_at ||
          "";
        const notificationTimestamp = getNewestTimestamp(createdAt);

        return {
          id: makeStableNotificationId(
            "notif-requisition-submitted",
            recordId,
            createdAt,
            getHiringNeedStatus(item),
          ),
          category: "approvals",
          type: "action",
          title: "New Requisition Submitted",
          message: `A requisition request for ${getHiringNeedRole(
            item,
          )} was submitted for review.`,
          time: formatNotificationTime(notificationTimestamp, now),
          timestamp: notificationTimestamp || Number(now),
          notificationTimestamp,
          actionLabel: "",
          actionPath: "/recruitment/hiring-needs",
          actionState: {
            source: "hiring-needs-notification",
            hiringNeedId: recordId,
          },
        };
      }),
  ).slice(0, MAX_NOTIFICATION_ITEMS_PER_TYPE);
}

export function sortNotificationsByNewest(notifications = []) {
  return [...notifications].sort(
    (left, right) =>
      Number(right.timestamp || 0) - Number(left.timestamp || 0),
  );
}
