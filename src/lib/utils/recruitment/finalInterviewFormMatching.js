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

function safeObject(value) {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value
    : {};
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
  const safeForm = safeObject(form);

  return cleanText(
    safeForm.id ||
      safeForm.formId ||
      safeForm.form_id ||
      safeForm.finalInterviewFormId ||
      safeForm.final_interview_form_id,
  );
}
 
export function getFinalInterviewFormName(form = {}) {
  const safeForm = safeObject(form);

  return cleanText(
    safeForm.name ||
      safeForm.formName ||
      safeForm.form_name ||
      safeForm.title ||
      safeForm.formTitle ||
      safeForm.form_title ||
      "Final Interview Form",
  );
}
 
export function getFinalInterviewFormPositionId(form = {}) {
  const safeForm = safeObject(form);

  return cleanText(
    safeForm.positionId ||
      safeForm.position_id ||
      safeForm.openPositionId ||
      safeForm.open_position_id ||
      safeForm.availablePositionId ||
      safeForm.available_position_id ||
      safeForm.selectedPositionId ||
      safeForm.selected_position_id ||
      safeForm.appliedPositionId ||
      safeForm.applied_position_id ||
      safeForm.roleId ||
      safeForm.role_id ||
      safeForm.positionCode ||
      safeForm.position_code,
  );
}
 
export function getFinalInterviewFormPositionTitle(form = {}) {
  const safeForm = safeObject(form);

  return cleanText(
    safeForm.positionTitle ||
      safeForm.position_title ||
      safeForm.positionName ||
      safeForm.position_name ||
      safeForm.openPosition ||
      safeForm.open_position ||
      safeForm.availablePositionTitle ||
      safeForm.available_position_title ||
      safeForm.availablePositionName ||
      safeForm.available_position_name ||
      safeForm.selectedPositionTitle ||
      safeForm.selected_position_title ||
      safeForm.selectedPositionName ||
      safeForm.selected_position_name ||
      safeForm.appliedPosition ||
      safeForm.applied_position ||
      safeForm.roleTitle ||
      safeForm.role_title ||
      safeForm.roleName ||
      safeForm.role_name ||
      safeForm.formPosition ||
      safeForm.form_position ||
      safeForm.name,
  );
}
 
export function getFinalInterviewFormFields(form = {}) {
  const safeForm = safeObject(form);

  return safeArray(
    safeForm.fields ||
      safeForm.questions ||
      safeForm.formFields ||
      safeForm.form_fields ||
      safeForm.items,
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
  requireConfiguredQuestions = false, 
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
  const eligibleForms = requireConfiguredQuestions 
    ? availableForms.filter((form) => 
        getFinalInterviewFormFields(form).some( 
          (field) => field?.enabled !== false, 
        ), 
      ) 
    : availableForms; 
 
  if (!eligibleForms.length) { 
    return null; 
  } 
 
  if (preferredId) { 
    const formByExactId = eligibleForms.find( 
      (form) => 
        getFinalInterviewFormId(form) === preferredId, 
    ); 
 
    if (formByExactId) { 
      return formByExactId; 
    } 
  } 
 
  if (targetPositionId) { 
    const activeFormByPositionId = eligibleForms.find( 
      (form) => 
        isActiveForm(form) && 
        getFinalInterviewFormPositionId(form) === 
          targetPositionId, 
    ); 
 
    if (activeFormByPositionId) { 
      return activeFormByPositionId; 
    } 
 
    const formByPositionId = eligibleForms.find( 
      (form) => 
        getFinalInterviewFormPositionId(form) === 
        targetPositionId, 
    ); 
 
    if (formByPositionId) { 
      return formByPositionId; 
    } 
  } 
 
  if (targetPositionTitle) { 
    const activeExactTitleForm = eligibleForms.find( 
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
 
    const exactTitleForm = eligibleForms.find( 
      (form) => 
        isExactTextMatch( 
          getFinalInterviewFormPositionTitle(form), 
          targetPositionTitle, 
        ), 
    ); 
 
    if (exactTitleForm) { 
      return exactTitleForm; 
    } 
 
    const activeLooseTitleForm = eligibleForms.find( 
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
 
    const looseTitleForm = eligibleForms.find( 
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
 
  const activeForms = eligibleForms.filter(isActiveForm); 
 
  if (activeForms.length === 1) { 
    return activeForms[0]; 
  } 
 
  if (eligibleForms.length === 1) { 
    return eligibleForms[0]; 
  } 
 
  return null; 
} 
