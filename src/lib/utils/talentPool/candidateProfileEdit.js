const editableSectionLabels = {
  "personal.basic": "Basic Information",
  "personal.contact": "Contact Information",
  "personal.address": "Address & Preferences",
  "application.overview": "Application Overview",
  "application.readiness": "Application Readiness",
  education: "Education & Training",
  training: "Education & Training",
  experience: "Work Experience",
  "skills.skills": "Skills & Language",
  references: "References",
  answers: "Application Responses",
  notes: "Candidate Notes",
};

export function getTalentPoolEditableSectionLabel(tab) {
  return editableSectionLabels[tab] || null;
}

export function getTalentPoolCandidateEditValidationError(form = {}) {
  if (!String(form.firstName || "").trim() || !String(form.lastName || "").trim() || !String(form.email || "").trim()) {
    return "First name, last name, and email are required.";
  }

  return "";
}

export function updateTalentPoolCandidateEducationDetails(
  details = {},
  sectionKey,
  field,
  value,
) {
  let source = details;

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = {};
    }
  }

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    source = {};
  }

  return {
    ...source,
    [sectionKey]: {
      ...(source[sectionKey] && typeof source[sectionKey] === "object"
        ? source[sectionKey]
        : {}),
      [field]: value,
    },
  };
}
