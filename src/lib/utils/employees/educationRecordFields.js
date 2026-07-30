export const EDUCATION_LEVEL_OPTIONS = Object.freeze([
  "Elementary",
  "Secondary",
  "Senior High",
  "Vocational",
  "College Level",
  "College Graduate",
  "Graduate Studies",
]);

const LEVEL_FIELD = Object.freeze([
  "level",
  "Level",
  "select",
  EDUCATION_LEVEL_OPTIONS,
]);

const SCHOOL_FIELD = Object.freeze(["school", "Name of School"]);
const ADDRESS_FIELD = Object.freeze(["address", "Address"]);
const DEGREE_FIELD = Object.freeze(["degree", "Degree / Course"]);
const YEAR_GRADUATED_FIELD = Object.freeze([
  "yearGraduated",
  "Year Graduated",
]);

const BASIC_EDUCATION_LEVELS = new Set([
  "Elementary",
  "Secondary",
  "Senior High",
]);

function value(value) {
  return value === null || value === undefined ? "" : String(value);
}

export function normalizeEducationLevel(level) {
  const normalized = value(level).trim();

  // Preserve records created before College Level and College Graduate
  // were separated in the employee profile.
  if (normalized === "College") return "College Graduate";

  return normalized;
}

export function getEducationRecordFields(level) {
  const normalizedLevel = normalizeEducationLevel(level);

  if (BASIC_EDUCATION_LEVELS.has(normalizedLevel)) {
    return [LEVEL_FIELD, SCHOOL_FIELD, ADDRESS_FIELD, YEAR_GRADUATED_FIELD];
  }

  if (normalizedLevel === "Vocational") {
    return [LEVEL_FIELD, DEGREE_FIELD];
  }

  if (normalizedLevel === "College Level") {
    return [LEVEL_FIELD, SCHOOL_FIELD, ADDRESS_FIELD, DEGREE_FIELD];
  }

  if (
    normalizedLevel === "College Graduate" ||
    normalizedLevel === "Graduate Studies"
  ) {
    return [
      LEVEL_FIELD,
      SCHOOL_FIELD,
      ADDRESS_FIELD,
      DEGREE_FIELD,
      YEAR_GRADUATED_FIELD,
    ];
  }

  return [LEVEL_FIELD, SCHOOL_FIELD, ADDRESS_FIELD, DEGREE_FIELD];
}

export function normalizeEducationRecordForLevel(record = {}) {
  const level = normalizeEducationLevel(record?.level) || "Elementary";
  const supportedFields = new Set(
    getEducationRecordFields(level).map(([field]) => field),
  );

  const normalized = {
    ...(record?.id !== undefined && record?.id !== null
      ? { id: record.id }
      : {}),
    level,
    school: supportedFields.has("school") ? value(record?.school) : "",
    address: supportedFields.has("address") ? value(record?.address) : "",
    degree: supportedFields.has("degree") ? value(record?.degree) : "",
    yearGraduated: supportedFields.has("yearGraduated")
      ? value(record?.yearGraduated)
      : "",
  };

  return normalized;
}

export function createEmptyEducationRecord() {
  return normalizeEducationRecordForLevel({ level: "Elementary" });
}
