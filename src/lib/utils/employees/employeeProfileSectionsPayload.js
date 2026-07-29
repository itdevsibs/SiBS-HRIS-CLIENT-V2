import { normalizeEducationRecordForLevel } from "./educationRecordFields.js";

export const STRUCTURED_PROFILE_SECTION_BY_PRIMARY = Object.freeze({
  family: "family",
  education: "education",
  eligibility: "eligibility",
  experience: "experience",
  training: "training",
  skills: "skills",
  references: "references",
  application: "application",
});

export const STRUCTURED_PROFILE_SECTIONS = Object.freeze(
  Object.values(STRUCTURED_PROFILE_SECTION_BY_PRIMARY),
);

const FAMILY_FIELDS = Object.freeze([
  "spouseSurname",
  "spouseFirstName",
  "spouseMiddleName",
  "spouseOccupation",
  "spouseEmployer",
  "spouseTelephone",
  "spouseBusinessAddress",
  "fatherSurname",
  "fatherFirstName",
  "fatherMiddleName",
  "motherMaidenSurname",
  "motherFirstName",
  "motherMiddleName",
  "emergencyName",
  "emergencyRelationship",
  "emergencyPhone",
  "emergencyEmail",
]);

const APPLICATION_FIELDS = Object.freeze([
  "appliedPosition",
  "preferredAccount",
  "source",
  "expectedSalary",
  "availability",
  "recruiter",
  "status",
  "pipelineStage",
  "prfMatchStatus",
  "remarks",
  "assessmentStatus",
  "assessmentScore",
  "assessmentRemarks",
]);

const SECTION_KEYS = Object.freeze([
  ...FAMILY_FIELDS,
  "children",
  "education",
  "eligibility",
  "experience",
  "trainings",
  "skills",
  "recognitions",
  "organizations",
  "references",
  ...APPLICATION_FIELDS,
  "statusHistory",
]);

function list(value) {
  return Array.isArray(value) ? value : [];
}

function pick(source, fields) {
  return fields.reduce((result, field) => {
    result[field] = source?.[field] ?? "";
    return result;
  }, {});
}

export function getStructuredProfileSection(primaryKey) {
  return STRUCTURED_PROFILE_SECTION_BY_PRIMARY[primaryKey] || "";
}

export function isStructuredProfileSection(section) {
  return STRUCTURED_PROFILE_SECTIONS.includes(section);
}

export function buildEmployeeProfileSectionPayload(section, employee = {}) {
  switch (section) {
    case "family":
      return {
        ...pick(employee, FAMILY_FIELDS),
        children: list(employee.children),
      };
    case "education":
      return {
        education: list(employee.education).map((record) =>
          normalizeEducationRecordForLevel(record),
        ),
      };
    case "eligibility":
      return { eligibility: list(employee.eligibility) };
    case "experience":
      return { experience: list(employee.experience) };
    case "training":
      return { trainings: list(employee.trainings) };
    case "skills":
      return {
        skills: list(employee.skills),
        recognitions: list(employee.recognitions),
        organizations: list(employee.organizations),
      };
    case "references":
      return { references: list(employee.references) };
    case "application":
      return {
        ...pick(employee, APPLICATION_FIELDS),
        statusHistory: list(employee.statusHistory),
      };
    default:
      return null;
  }
}

export function mergeEmployeeProfileSections(employee = {}, sections = {}) {
  const allowed = {};

  for (const key of SECTION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(sections, key)) continue;
    allowed[key] = Array.isArray(sections[key])
      ? [...sections[key]]
      : sections[key] ?? "";
  }

  return {
    ...employee,
    ...allowed,
  };
}
