export function cleanDropOffText(value) {
  return String(value ?? "").trim();
}

export function normalizeDropOffText(value) {
  return cleanDropOffText(value).toLowerCase().replace(/\s+/g, " ");
}

export function getDropOffCandidateName(candidate = {}) {
  return (
    candidate.name ||
    candidate.candidateName ||
    candidate.fullName ||
    candidate.full_name ||
    "—"
  );
}

export function getDropOffCandidateEmail(candidate = {}) {
  return (
    candidate.email ||
    candidate.candidateEmail ||
    candidate.candidate_email ||
    candidate.emailAddress ||
    candidate.email_address ||
    ""
  );
}

export function getDropOffCandidateId(candidate = {}) {
  return (
    candidate.candidateId ||
    candidate.candidate_id ||
    candidate.candidateApplicationId ||
    candidate.candidate_application_id ||
    candidate.applicationId ||
    candidate.application_id ||
    candidate.id ||
    "—"
  );
}

export function getDropOffCandidateRole(candidate = {}) {
  return (
    candidate.currentAppliedRole ||
    candidate.current_applied_role ||
    candidate.roleTitle ||
    candidate.role_title ||
    candidate.openPosition ||
    candidate.open_position ||
    candidate.roleCapability ||
    candidate.role_capability ||
    ""
  );
}

export function getDropOffCandidateAccount(candidate = {}) {
  return (
    candidate.currentAppliedAccount ||
    candidate.current_applied_account ||
    candidate.account ||
    candidate.leadAccount ||
    candidate.lead_account ||
    candidate.accountFit ||
    candidate.account_fit ||
    ""
  );
}

export function getDropOffReason(candidate = {}) {
  return (
    candidate.dropOffReason ||
    candidate.drop_off_reason ||
    candidate.reasonForMovement ||
    candidate.reason_for_movement ||
    candidate.remarks ||
    "No reason provided."
  );
}

export function getDropOffDate(candidate = {}) {
  return (
    candidate.droppedOffAt ||
    candidate.dropped_off_at ||
    candidate.dateMoved ||
    candidate.date_moved ||
    candidate.updatedAt ||
    candidate.updated_at ||
    candidate.lastActivity ||
    candidate.last_activity ||
    ""
  );
}

export function getDropOffBy(candidate = {}) {
  return (
    candidate.droppedOffByName ||
    candidate.dropped_off_by_name ||
    candidate.currentTaOwner ||
    candidate.current_ta_owner ||
    candidate.updatedByName ||
    candidate.updated_by_name ||
    ""
  );
}

export function formatDropOffDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isDropOffCandidate(candidate = {}) {
  const authoritativeStateValues = [
    candidate.currentStage,
    candidate.current_stage,
    candidate.currentPipelineStage,
    candidate.current_pipeline_stage,
    candidate.pipelineStage,
    candidate.pipeline_stage,
    candidate.stage,
    candidate.status,
    candidate.pipelineStatus,
    candidate.pipeline_status,
  ]
    .map(normalizeDropOffText)
    .filter(Boolean);

  const acceptedValues = new Set([
    "drop off",
    "drop-off",
    "drop offs",
    "drop-offs",
    "dropped off",
  ]);

  if (
    authoritativeStateValues.some((value) => acceptedValues.has(value))
  ) {
    return true;
  }

  /*
   * Current stage/status is authoritative. Drop-off category, reason, and date
   * can remain in history-shaped or stale payloads after a candidate has been
   * restored to New Applicant, Silver Pool, Recyclable, or another live state.
   */
  if (authoritativeStateValues.length > 0) {
    return false;
  }

  return Boolean(
    cleanDropOffText(
      candidate.dropOffCategory ||
        candidate.drop_off_category ||
        candidate.dropOffReason ||
        candidate.drop_off_reason ||
        candidate.droppedOffAt ||
        candidate.dropped_off_at,
    ),
  );
}

export function getDropOffCandidateKey(candidate = {}) {
  const candidateId = normalizeDropOffText(
    candidate.candidateId || candidate.candidate_id,
  );

  if (candidateId) return `candidate:${candidateId}`;

  const email = normalizeDropOffText(getDropOffCandidateEmail(candidate));
  if (email) return `email:${email}`;

  const name = normalizeDropOffText(getDropOffCandidateName(candidate));
  if (name && name !== "—") return `name:${name}`;

  const talentPoolId = normalizeDropOffText(
    candidate.sourceTalentPoolId ||
      candidate.source_talent_pool_id ||
      candidate.talentPoolRecordId ||
      candidate.talent_pool_record_id,
  );

  if (talentPoolId) return `talent-pool:${talentPoolId}`;

  const recordId = normalizeDropOffText(
    candidate.dbId ||
      candidate.db_id ||
      candidate.id ||
      candidate.applicationId ||
      candidate.application_id,
  );

  return recordId ? `record:${recordId}` : "";
}

function annotatePipelineCandidate(candidate = {}) {
  const pipelineRecordId =
    candidate.pipelineRecordId ||
    candidate.pipeline_record_id ||
    candidate.dbId ||
    candidate.db_id ||
    candidate.id ||
    "";

  return {
    ...candidate,
    pipelineRecordId,
    pipeline_record_id: pipelineRecordId,
    dbId: candidate.dbId || candidate.db_id || pipelineRecordId,
    _dropOffSources: ["candidate-pipeline"],
  };
}

function annotateTalentPoolCandidate(candidate = {}) {
  const talentPoolRecordId =
    candidate.talentPoolRecordId ||
    candidate.talent_pool_record_id ||
    candidate.id ||
    candidate.sourceTalentPoolId ||
    candidate.source_talent_pool_id ||
    "";

  return {
    ...candidate,
    talentPoolRecordId,
    talent_pool_record_id: talentPoolRecordId,
    _dropOffSources: ["talent-pool"],
  };
}

function mergeDropOffCandidateRecords(current = {}, incoming = {}) {
  const sources = Array.from(
    new Set([
      ...(Array.isArray(current._dropOffSources)
        ? current._dropOffSources
        : []),
      ...(Array.isArray(incoming._dropOffSources)
        ? incoming._dropOffSources
        : []),
    ]),
  );

  const pipelineRecordId =
    current.pipelineRecordId ||
    current.pipeline_record_id ||
    current.dbId ||
    current.db_id ||
    incoming.pipelineRecordId ||
    incoming.pipeline_record_id ||
    incoming.dbId ||
    incoming.db_id ||
    "";

  const talentPoolRecordId =
    incoming.talentPoolRecordId ||
    incoming.talent_pool_record_id ||
    current.talentPoolRecordId ||
    current.talent_pool_record_id ||
    "";

  return {
    ...current,
    ...incoming,
    _dropOffSources: sources,
    pipelineRecordId,
    pipeline_record_id: pipelineRecordId,
    dbId: pipelineRecordId || incoming.dbId || current.dbId,
    talentPoolRecordId,
    talent_pool_record_id: talentPoolRecordId,
    id: talentPoolRecordId || incoming.id || current.id,
  };
}

export function mergeDropOffCandidates(
  pipelineCandidates = [],
  talentPoolCandidates = [],
) {
  const candidateMap = new Map();

  const addCandidate = (candidate) => {
    if (!candidate || !isDropOffCandidate(candidate)) return;

    const key = getDropOffCandidateKey(candidate);
    if (!key) return;

    if (!candidateMap.has(key)) {
      candidateMap.set(key, candidate);
      return;
    }

    candidateMap.set(
      key,
      mergeDropOffCandidateRecords(candidateMap.get(key), candidate),
    );
  };

  pipelineCandidates.map(annotatePipelineCandidate).forEach(addCandidate);
  talentPoolCandidates.map(annotateTalentPoolCandidate).forEach(addCandidate);

  return Array.from(candidateMap.values()).sort(
    (firstCandidate, secondCandidate) => {
      const firstDate = new Date(getDropOffDate(firstCandidate)).getTime();
      const secondDate = new Date(getDropOffDate(secondCandidate)).getTime();

      return (
        (Number.isFinite(secondDate) ? secondDate : 0) -
        (Number.isFinite(firstDate) ? firstDate : 0)
      );
    },
  );
}

export function matchesDropOffFilters(
  candidate,
  {
    search = "",
    roleFilter = "All Roles",
    accountFilter = "All Accounts",
  } = {},
) {
  const keyword = normalizeDropOffText(search);

  const searchableText = normalizeDropOffText(
    [
      getDropOffCandidateName(candidate),
      getDropOffCandidateEmail(candidate),
      getDropOffCandidateId(candidate),
      getDropOffCandidateRole(candidate),
      getDropOffCandidateAccount(candidate),
      candidate.applyingLocation || candidate.applying_location,
      getDropOffReason(candidate),
      getDropOffBy(candidate),
    ]
      .filter(Boolean)
      .join(" "),
  );

  const matchesSearch = !keyword || searchableText.includes(keyword);

  const matchesRole =
    roleFilter === "All Roles" ||
    normalizeDropOffText(getDropOffCandidateRole(candidate)) ===
      normalizeDropOffText(roleFilter);

  const matchesAccount =
    accountFilter === "All Accounts" ||
    normalizeDropOffText(getDropOffCandidateAccount(candidate)) ===
      normalizeDropOffText(accountFilter);

  return matchesSearch && matchesRole && matchesAccount;
}

export function filterDropOffCandidates(candidates = [], filters = {}) {
  if (!Array.isArray(candidates)) return [];

  return candidates.filter((candidate) =>
    matchesDropOffFilters(candidate, filters),
  );
}
