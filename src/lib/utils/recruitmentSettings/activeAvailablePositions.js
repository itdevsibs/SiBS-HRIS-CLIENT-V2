function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTrailingNumber(value) {
  const match = cleanText(value).match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

function formatPositionCode(value, fallbackId = "") {
  const rawValue = cleanText(value);
  const number =
    getTrailingNumber(rawValue) ||
    getTrailingNumber(fallbackId);

  if (!number) {
    return rawValue;
  }

  return `POS-${String(number).padStart(3, "0")}`;
}

export function normalizeActiveAvailablePosition(
  row = {},
  index = 0,
) {
  const databaseId =
    row.databaseId ||
    row.database_id ||
    row.id ||
    "";

  const sourcePositionId = cleanText(
    row.sourcePositionId ||
      row.source_position_id ||
      row.positionId ||
      row.position_id ||
      row.code ||
      "",
  );

  const code =
    formatPositionCode(
      row.positionId ||
        row.position_id ||
        row.code ||
        sourcePositionId,
      databaseId || index + 1,
    ) ||
    `POS-${String(index + 1).padStart(3, "0")}`;

  const positionTitle = cleanText(
    row.positionTitle ||
      row.position_title ||
      row.position ||
      row.title ||
      row.name ||
      "Untitled Position",
  );

  const status = cleanText(
    row.status ||
      row.positionStatus ||
      row.position_status ||
      "Active",
  );

  return {
    ...row,
    id: databaseId || code,
    databaseId,
    database_id: databaseId,
    availablePositionId: databaseId || "",
    available_position_id: databaseId || "",
    positionId: code,
    position_id: code,
    sourcePositionId:
      sourcePositionId || code,
    source_position_id:
      sourcePositionId || code,
    code,
    position: positionTitle,
    positionTitle,
    position_title: positionTitle,
    department: cleanText(
      row.department ||
        row.departmentName ||
        row.department_name ||
        "—",
    ),
    departmentId:
      row.departmentId ||
      row.department_id ||
      "",
    accountId:
      row.accountId ||
      row.account_id ||
      "",
    accountName: cleanText(
      row.accountName ||
        row.account_name ||
        "",
    ),
    location: cleanText(
      row.location ||
        row.locationSite ||
        row.location_site ||
        "—",
    ),
    locationSite: cleanText(
      row.locationSite ||
        row.location_site ||
        row.location ||
        "—",
    ),
    skills: cleanText(
      row.skills ||
        row.preferredSkills ||
        row.preferred_skills ||
        "—",
    ),
    preferredSkills: cleanText(
      row.preferredSkills ||
        row.preferred_skills ||
        row.skills ||
        "",
    ),
    status,
  };
}

export function normalizeActiveAvailablePositions(
  rows = [],
) {
  const uniquePositions = new Map();

  (Array.isArray(rows) ? rows : [])
    .filter(Boolean)
    .map(normalizeActiveAvailablePosition)
    .filter(
      (position) =>
        normalizeKey(position.status) === "active",
    )
    .forEach((position) => {
      const key =
        normalizeKey(position.databaseId) ||
        normalizeKey(position.id);

      if (!key || uniquePositions.has(key)) {
        return;
      }

      uniquePositions.set(key, position);
    });

  return Array.from(uniquePositions.values());
}

function getPositionKeys(position = {}) {
  return [
    position.databaseId,
    position.database_id,
    position.availablePositionId,
    position.available_position_id,
    position.id,
    position.positionId,
    position.position_id,
    position.code,
    position.sourcePositionId,
    position.source_position_id,
  ]
    .map(normalizeKey)
    .filter(Boolean);
}

function getFormPositionKeys(form = {}) {
  return [
    form.availablePositionId,
    form.available_position_id,
    form.databasePositionId,
    form.database_position_id,
    form.positionId,
    form.position_id,
    form.positionCode,
    form.position_code,
  ]
    .map(normalizeKey)
    .filter(Boolean);
}

export function findFormForAvailablePosition(
  forms = [],
  position = {},
) {
  const databaseKeys = [
    position.databaseId,
    position.database_id,
    position.availablePositionId,
    position.available_position_id,
    position.id,
  ]
    .map(normalizeKey)
    .filter(Boolean);

  if (databaseKeys.length) {
    const databaseKeySet = new Set(databaseKeys);
    const databaseMatch = (Array.isArray(forms) ? forms : []).find((form) =>
      [
        form.availablePositionId,
        form.available_position_id,
        form.databasePositionId,
        form.database_position_id,
      ]
        .map(normalizeKey)
        .filter(Boolean)
        .some((key) => databaseKeySet.has(key)),
    );

    if (databaseMatch) {
      return databaseMatch;
    }
  }

  const positionKeys = new Set(
    getPositionKeys(position),
  );

  if (!positionKeys.size) {
    return null;
  }

  return (
    (Array.isArray(forms) ? forms : []).find(
      (form) =>
        getFormPositionKeys(form).some((key) =>
          positionKeys.has(key),
        ),
    ) || null
  );
}

export function mergeFormsForActivePositions({
  forms = [],
  positions = [],
  createDefaultForm,
} = {}) {
  const currentForms = Array.isArray(forms)
    ? forms.filter(Boolean)
    : [];

  const activePositions = Array.isArray(positions)
    ? positions.filter(Boolean)
    : [];

  const matchedForms = new Set();

  const activePositionForms = activePositions.map(
    (position) => {
      const existingForm =
        findFormForAvailablePosition(
          currentForms,
          position,
        );

      if (existingForm) {
        matchedForms.add(existingForm);
      }

      const fallbackForm =
        typeof createDefaultForm === "function"
          ? createDefaultForm(position)
          : {
              id: `final-interview-${position.id}`,
              fields: [],
            };

      const baseForm =
        existingForm || fallbackForm;

      return {
        ...baseForm,
        positionId: position.id,
        position_id: position.id,
        positionCode: position.code,
        position_code: position.code,
        databasePositionId:
          position.databaseId || "",
        database_position_id:
          position.databaseId || "",
        positionTitle: position.position,
        position_title: position.position,
        positionName: position.position,
        position_name: position.position,
        department: position.department,
        departmentId:
          position.departmentId || "",
        location: position.location,
        locationSite: position.locationSite,
        skills: position.skills,
        fields: Array.isArray(baseForm.fields)
          ? baseForm.fields
          : [],
      };
    },
  );

  const preservedForms = currentForms.filter(
    (form) => !matchedForms.has(form),
  );

  return [
    ...activePositionForms,
    ...preservedForms,
  ];
}
