export const RECRUITMENT_SETTINGS_STORAGE_KEY =
  "sibs_recruitment_settings_temp";

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeValue(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeJsonParse(value, fallback) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeArray(value) {
  const parsed = safeJsonParse(value, value);
  return Array.isArray(parsed)
    ? parsed.filter(Boolean)
    : [];
}

export function getRecruitmentSettingsSnapshot() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(
      RECRUITMENT_SETTINGS_STORAGE_KEY,
    );

    const parsed = safeJsonParse(raw, {});

    return parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function getRecruitmentFinalInterviewForms(
  settings = getRecruitmentSettingsSnapshot(),
) {
  const root =
    settings &&
    typeof settings === "object" &&
    !Array.isArray(settings)
      ? settings
      : {};

  return safeArray(
    root.forms ||
      root.finalInterviewForms ||
      root.final_interview_forms ||
      root.formBuilder?.forms ||
      root.form_builder?.forms,
  );
}

export function getFinalInterviewFormId(form = {}) {
  return cleanText(
    form.id ||
      form.formId ||
      form.form_id ||
      form.finalInterviewFormId ||
      form.final_interview_form_id,
  );
}

export function getFinalInterviewFormName(form = {}) {
  return cleanText(
    form.name ||
      form.formName ||
      form.form_name ||
      form.title ||
      form.formTitle ||
      form.form_title ||
      "Final Interview Form",
  );
}

export function getFinalInterviewFormPositionId(form = {}) {
  return cleanText(
    form.positionId ||
      form.position_id ||
      form.openPositionId ||
      form.open_position_id ||
      form.availablePositionId ||
      form.available_position_id ||
      form.selectedPositionId ||
      form.selected_position_id ||
      form.appliedPositionId ||
      form.applied_position_id ||
      form.roleId ||
      form.role_id ||
      form.positionCode ||
      form.position_code,
  );
}

export function getFinalInterviewFormPositionTitle(form = {}) {
  return cleanText(
    form.positionTitle ||
      form.position_title ||
      form.positionName ||
      form.position_name ||
      form.openPosition ||
      form.open_position ||
      form.availablePositionTitle ||
      form.available_position_title ||
      form.availablePositionName ||
      form.available_position_name ||
      form.selectedPositionTitle ||
      form.selected_position_title ||
      form.selectedPositionName ||
      form.selected_position_name ||
      form.appliedPosition ||
      form.applied_position ||
      form.roleTitle ||
      form.role_title ||
      form.roleName ||
      form.role_name ||
      form.formPosition ||
      form.form_position ||
      form.name,
  );
}

export function getFinalInterviewFormFields(form = {}) {
  return safeArray(
    form.fields ||
      form.questions ||
      form.formFields ||
      form.form_fields ||
      form.items,
  );
}

export function getCandidateAppliedPositionId(
  candidate = {},
  fallback = "",
) {
  return cleanText(
    candidate.positionId ||
      candidate.position_id ||
      candidate.openPositionId ||
      candidate.open_position_id ||
      candidate.availablePositionId ||
      candidate.available_position_id ||
      candidate.appliedPositionId ||
      candidate.applied_position_id ||
      candidate.currentPositionId ||
      candidate.current_position_id ||
      candidate.finalInterviewPositionId ||
      candidate.final_interview_position_id ||
      candidate.offerDetails?.positionId ||
      candidate.offerDetails?.position_id ||
      candidate.hiringRequirementPositionId ||
      candidate.hiring_requirement_position_id ||
      candidate.hiringRequirementId ||
      candidate.hiring_requirement_id ||
      candidate.candidateSnapshot?.positionId ||
      candidate.candidateSnapshot?.position_id ||
      candidate.candidateSnapshot?.openPositionId ||
      candidate.candidateSnapshot?.open_position_id ||
      fallback,
  );
}

export function getCandidateAppliedPositionTitle(
  candidate = {},
  fallback = "",
) {
  return cleanText(
    candidate.openPosition ||
      candidate.open_position ||
      candidate.appliedPosition ||
      candidate.applied_position ||
      candidate.currentAppliedRole ||
      candidate.current_applied_role ||
      candidate.roleCapability ||
      candidate.role_capability ||
      candidate.roleTitle ||
      candidate.role_title ||
      candidate.positionTitle ||
      candidate.position_title ||
      candidate.positionName ||
      candidate.position_name ||
      candidate.candidateSnapshot?.openPosition ||
      candidate.candidateSnapshot?.open_position ||
      candidate.candidateSnapshot?.appliedPosition ||
      candidate.candidateSnapshot?.applied_position ||
      candidate.candidateSnapshot?.currentAppliedRole ||
      candidate.candidateSnapshot?.current_applied_role ||
      candidate.candidateSnapshot?.roleCapability ||
      candidate.candidateSnapshot?.role_capability ||
      candidate.candidateSnapshot?.roleTitle ||
      candidate.candidateSnapshot?.role_title ||
      fallback,
  );
}

function isActiveForm(form = {}) {
  const status = normalizeValue(
    form.status ||
      form.formStatus ||
      form.form_status ||
      "active",
  );

  return !status || status === "active";
}

function isExactTextMatch(left, right) {
  const leftKey = normalizeValue(left);
  const rightKey = normalizeValue(right);

  return Boolean(
    leftKey &&
      rightKey &&
      leftKey === rightKey,
  );
}

function isLooseTextMatch(left, right) {
  const leftKey = normalizeValue(left);
  const rightKey = normalizeValue(right);

  if (!leftKey || !rightKey) {
    return false;
  }

  return (
    leftKey === rightKey ||
    leftKey.includes(rightKey) ||
    rightKey.includes(leftKey)
  );
}

export function findMatchingFinalInterviewForm({
  settings,
  forms,
  preferredFormId = "",
  positionId = "",
  positionTitle = "",
} = {}) {
  const availableForms = safeArray(
    forms ||
      getRecruitmentFinalInterviewForms(
        settings || getRecruitmentSettingsSnapshot(),
      ),
  );

  if (!availableForms.length) {
    return null;
  }

  const preferredId = cleanText(preferredFormId);
  const targetPositionId = cleanText(positionId);
  const targetPositionTitle = cleanText(positionTitle);

  if (preferredId) {
    const formByExactId = availableForms.find(
      (form) =>
        getFinalInterviewFormId(form) === preferredId,
    );

    if (formByExactId) {
      return formByExactId;
    }
  }

  if (targetPositionId) {
    const activeFormByPositionId = availableForms.find(
      (form) =>
        isActiveForm(form) &&
        getFinalInterviewFormPositionId(form) ===
          targetPositionId,
    );

    if (activeFormByPositionId) {
      return activeFormByPositionId;
    }

    const formByPositionId = availableForms.find(
      (form) =>
        getFinalInterviewFormPositionId(form) ===
        targetPositionId,
    );

    if (formByPositionId) {
      return formByPositionId;
    }
  }

  if (targetPositionTitle) {
    const activeExactTitleForm = availableForms.find(
      (form) =>
        isActiveForm(form) &&
        isExactTextMatch(
          getFinalInterviewFormPositionTitle(form),
          targetPositionTitle,
        ),
    );

    if (activeExactTitleForm) {
      return activeExactTitleForm;
    }

    const exactTitleForm = availableForms.find(
      (form) =>
        isExactTextMatch(
          getFinalInterviewFormPositionTitle(form),
          targetPositionTitle,
        ),
    );

    if (exactTitleForm) {
      return exactTitleForm;
    }

    const activeLooseTitleForm = availableForms.find(
      (form) =>
        isActiveForm(form) &&
        isLooseTextMatch(
          getFinalInterviewFormPositionTitle(form),
          targetPositionTitle,
        ),
    );

    if (activeLooseTitleForm) {
      return activeLooseTitleForm;
    }

    const looseTitleForm = availableForms.find(
      (form) =>
        isLooseTextMatch(
          getFinalInterviewFormPositionTitle(form),
          targetPositionTitle,
        ),
    );

    if (looseTitleForm) {
      return looseTitleForm;
    }
  }

  const activeForms = availableForms.filter(isActiveForm);

  if (activeForms.length === 1) {
    return activeForms[0];
  }

  if (availableForms.length === 1) {
    return availableForms[0];
  }

  return null;
}
