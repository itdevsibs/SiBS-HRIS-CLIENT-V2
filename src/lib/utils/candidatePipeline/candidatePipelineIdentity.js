function cleanIdentityValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function cleanRecordId(value) {
  return String(value ?? "").trim();
}

function getFirstIdentityValue(values = []) {
  return values.map(cleanIdentityValue).find(Boolean) || "";
}

/**
 * Return only an identifier that explicitly represents candidate_pipeline.id.
 *
 * candidateId, candidateApplicationId, sourceTalentPoolId, and a generic id
 * from Talent Pool records are intentionally excluded. They are different ID
 * namespaces and may contain the same number as another pipeline row.
 */
export function getCandidatePipelineRecordId(candidate = {}) {
  const safeCandidate =
    candidate && typeof candidate === "object" ? candidate : {};

  return cleanRecordId(
    safeCandidate.candidatePipelineRowId ||
      safeCandidate.candidate_pipeline_row_id ||
      safeCandidate.dbId ||
      safeCandidate.db_id ||
      safeCandidate.candidatePipelineId ||
      safeCandidate.candidate_pipeline_id ||
      safeCandidate.pipelineRecordId ||
      safeCandidate.pipeline_record_id ||
      "",
  );
}

export function getCandidatePipelineIdentity(candidate = {}) {
  const safeCandidate =
    candidate && typeof candidate === "object" ? candidate : {};

  return {
    recordId: cleanIdentityValue(
      getCandidatePipelineRecordId(safeCandidate),
    ),

    candidateId: getFirstIdentityValue([
      safeCandidate.candidateId,
      safeCandidate.candidate_id,
      safeCandidate.candidateSnapshot?.candidateId,
      safeCandidate.candidateSnapshot?.candidate_id,
    ]),

    applicationId: getFirstIdentityValue([
      safeCandidate.candidateApplicationId,
      safeCandidate.candidate_application_id,
      safeCandidate.applicationId,
      safeCandidate.application_id,
      safeCandidate.candidateSnapshot?.candidateApplicationId,
      safeCandidate.candidateSnapshot?.candidate_application_id,
      safeCandidate.candidateSnapshot?.applicationId,
      safeCandidate.candidateSnapshot?.application_id,
    ]),

    sourceTalentPoolId: getFirstIdentityValue([
      safeCandidate.sourceTalentPoolId,
      safeCandidate.source_talent_pool_id,
      safeCandidate.talentPoolId,
      safeCandidate.talent_pool_id,
    ]),

    email: getFirstIdentityValue([
      safeCandidate.email,
      safeCandidate.candidateEmail,
      safeCandidate.candidate_email,
      safeCandidate.emailAddress,
      safeCandidate.email_address,
    ]),
  };
}

export function getCandidatePipelineIdentityKey(candidate = {}) {
  const identity = getCandidatePipelineIdentity(candidate);

  if (identity.recordId) return `record:${identity.recordId}`;
  if (identity.candidateId) return `candidate:${identity.candidateId}`;
  if (identity.applicationId) return `application:${identity.applicationId}`;
  if (identity.sourceTalentPoolId) {
    return `talent-pool:${identity.sourceTalentPoolId}`;
  }
  if (identity.email) return `email:${identity.email}`;

  return "";
}

function compareKnownIdentity(leftValue, rightValue) {
  if (!leftValue || !rightValue) return null;
  return leftValue === rightValue;
}

export function isSameCandidatePipelineRecord(
  firstCandidate = {},
  secondCandidate = {},
) {
  const left = getCandidatePipelineIdentity(firstCandidate);
  const right = getCandidatePipelineIdentity(secondCandidate);

  const comparisons = [
    compareKnownIdentity(left.recordId, right.recordId),
    compareKnownIdentity(left.candidateId, right.candidateId),
    compareKnownIdentity(left.applicationId, right.applicationId),
    compareKnownIdentity(left.sourceTalentPoolId, right.sourceTalentPoolId),
    compareKnownIdentity(left.email, right.email),
  ];

  const firstKnownComparison = comparisons.find(
    (comparison) => comparison !== null,
  );

  return firstKnownComparison === true;
}

function applyPipelinePrimaryKeyAliases(candidate = {}, recordId = "") {
  const cleanId = cleanRecordId(recordId);

  if (!cleanId) return { ...candidate };

  const value = /^\d+$/.test(cleanId) ? Number(cleanId) : cleanId;

  return {
    ...candidate,
    id: value,
    candidatePipelineRowId: value,
    candidate_pipeline_row_id: value,
    dbId: value,
    db_id: value,
    candidatePipelineId: value,
    candidate_pipeline_id: value,
    pipelineRecordId: value,
    pipeline_record_id: value,
  };
}

export function mergeCandidatePipelineRecord(
  currentCandidate = {},
  incomingCandidate = {},
  { preserveProfile = false } = {},
) {
  const current =
    currentCandidate && typeof currentCandidate === "object"
      ? currentCandidate
      : {};

  const incoming =
    incomingCandidate && typeof incomingCandidate === "object"
      ? incomingCandidate
      : {};

  if (
    Object.keys(incoming).length > 0 &&
    !isSameCandidatePipelineRecord(current, incoming)
  ) {
    return { ...current };
  }

  const lockedRecordId =
    getCandidatePipelineRecordId(current) ||
    getCandidatePipelineRecordId(incoming);

  const merged = applyPipelinePrimaryKeyAliases(
    {
      ...current,
      ...incoming,
    },
    lockedRecordId,
  );

  if (!preserveProfile) return merged;

  return applyPipelinePrimaryKeyAliases(
    {
      ...merged,

      candidateId:
        current.candidateId ??
        current.candidate_id ??
        incoming.candidateId ??
        incoming.candidate_id,

      candidateApplicationId:
        current.candidateApplicationId ??
        current.candidate_application_id ??
        current.applicationId ??
        current.application_id ??
        incoming.candidateApplicationId ??
        incoming.candidate_application_id ??
        incoming.applicationId ??
        incoming.application_id,

      applicationId:
        current.applicationId ??
        current.application_id ??
        current.candidateApplicationId ??
        current.candidate_application_id ??
        incoming.applicationId ??
        incoming.application_id ??
        incoming.candidateApplicationId ??
        incoming.candidate_application_id,

      sourceTalentPoolId:
        current.sourceTalentPoolId ??
        current.source_talent_pool_id ??
        incoming.sourceTalentPoolId ??
        incoming.source_talent_pool_id,

      name:
        current.name ||
        current.candidateName ||
        incoming.name ||
        incoming.candidateName ||
        "",

      candidateName:
        current.candidateName ||
        current.name ||
        incoming.candidateName ||
        incoming.name ||
        "",

      email:
        current.email ||
        current.candidateEmail ||
        incoming.email ||
        incoming.candidateEmail ||
        "",
    },
    lockedRecordId,
  );
}
