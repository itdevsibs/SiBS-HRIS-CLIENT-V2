function cleanText(value) {
  return String(value ?? "").trim();
}

export function getAvailablePositionAccount(item = {}) {
  const account = cleanText(
    item.accountName ||
      item.account_name ||
      item.account ||
      item.raw?.accountName ||
      item.raw?.account_name ||
      item.raw?.account ||
      "",
  );

  return account || "—";
}

export function getAvailablePositionDepartment(item = {}) {
  const department = cleanText(
    item.departmentName ||
      item.department_name ||
      item.department ||
      item.raw?.departmentName ||
      item.raw?.department_name ||
      item.raw?.department ||
      "",
  );

  return department || "—";
}

export function getAvailablePositionLinkedJd(item = {}) {
  const code = cleanText(
    item.jdCode ||
      item.jd_code ||
      item.jobDescriptionCode ||
      item.job_description_code ||
      item.raw?.jdCode ||
      item.raw?.jd_code ||
      "",
  );

  const documentTitle = cleanText(
    item.documentTitle ||
      item.document_title ||
      item.jobDescriptionTitle ||
      item.job_description_title ||
      item.linkedJd ||
      item.raw?.documentTitle ||
      item.raw?.document_title ||
      "",
  );

  return {
    code: code || "—",
    documentTitle: documentTitle || "—",
  };
}

export function getAvailablePositionSkills(item = {}, limit = 3) {
  let rawSkills =
    item.preferredSkills ||
    item.preferred_skills ||
    item.skills ||
    item.raw?.preferredSkills ||
    item.raw?.preferred_skills ||
    [];

  if (typeof rawSkills === "string") {
    rawSkills = rawSkills.split(/[,;\n]+/).map((s) => s.trim());
  }

  const all = Array.isArray(rawSkills)
    ? rawSkills.map(cleanText).filter(Boolean)
    : [];

  const visible = all.slice(0, limit);
  const hiddenCount = Math.max(0, all.length - limit);

  return {
    visible,
    hiddenCount,
    all,
  };
}

export function getAvailablePositionUpdatedAt(item = {}) {
  return cleanText(
    item.updatedAt ||
      item.updated_at ||
      item.createdAt ||
      item.created_at ||
      item.dateUpdated ||
      item.date_updated ||
      "",
  );
}

export function getAvailablePositionUpdatedBy(item = {}) {
  return cleanText(
    item.updatedBy ||
      item.updated_by ||
      item.createdBy ||
      item.created_by ||
      item.lastUpdatedBy ||
      item.last_updated_by ||
      "",
  );
}

export function getAvailablePositionSearchText(item = {}) {
  const linkedJd = getAvailablePositionLinkedJd(item);
  const skills = getAvailablePositionSkills(item, 99).all;

  return [
    item.positionId,
    item.positionTitle,
    item.position_title,
    getAvailablePositionDepartment(item),
    getAvailablePositionAccount(item),
    item.locationSite,
    item.location_site,
    item.status,
    linkedJd.code,
    linkedJd.documentTitle,
    ...skills,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
