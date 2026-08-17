export const FOR_NHO_STATUS = "For NHO";
export const INCOMPLETE_REQUIREMENTS_STATUS = "Incomplete Requirements";
export const INCOMPLETE_REQUIREMENTS_PIPELINE_STAGE =
  "For Onboarding - Incomplete Requirements";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeStageKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[_/()-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isIncompleteRequirementsStage(value) {
  const key = normalizeStageKey(value);

  return (
    key === "incomplete requirements" ||
    key === "for incomplete requirements" ||
    key === "onboarding incomplete requirements" ||
    key === "for onboarding incomplete requirements" ||
    key.includes("incomplete requirement")
  );
}

export function getNhoIncompleteRoutingDecision(
  majorProgress = {},
  currentStage = "",
  uploadedFileCount,
) {
  const hasExplicitFileCount =
    uploadedFileCount !== undefined && uploadedFileCount !== null;
  const hasNoUploadedFiles =
    hasExplicitFileCount && Number(uploadedFileCount) <= 0;

  if (hasNoUploadedFiles) {
    const isAlreadyForNho = normalizeStageKey(currentStage) === "for nho";

    return {
      shouldMove: !isAlreadyForNho,
      targetStage: FOR_NHO_STATUS,
    };
  }

  if (majorProgress?.isComplete || isIncompleteRequirementsStage(currentStage)) {
    return {
      shouldMove: false,
      targetStage: INCOMPLETE_REQUIREMENTS_STATUS,
    };
  }

  return {
    shouldMove: true,
    targetStage: INCOMPLETE_REQUIREMENTS_STATUS,
  };
}


export function getNhoSaveResultAction({
  uploadedFileCount = 0,
  majorProgress = {},
  routedStage = "",
} = {}) {
  if (Number(uploadedFileCount) <= 0) {
    return {
      kind: "for-nho",
      navigateToIncompleteRequirements: false,
      closeCandidatePipelineOnSuccess: true,
    };
  }

  if (majorProgress?.isComplete) {
    return {
      kind: "complete",
      navigateToIncompleteRequirements: false,
    };
  }

  if (isIncompleteRequirementsStage(routedStage)) {
    return {
      kind: "incomplete",
      navigateToIncompleteRequirements: true,
    };
  }

  return {
    kind: "saved",
    navigateToIncompleteRequirements: false,
  };
}

export function getTalentPoolStatusForNhoStage(
  stage = "",
  currentStatus = "",
) {
  if (isIncompleteRequirementsStage(stage)) {
    return INCOMPLETE_REQUIREMENTS_STATUS;
  }

  if (cleanText(stage).toLowerCase() === "onboarding") {
    return "Hired / Active";
  }

  return currentStatus;
}
