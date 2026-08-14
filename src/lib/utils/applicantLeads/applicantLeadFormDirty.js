export const APPLICANT_LEAD_EDIT_FIELDS = [
  "firstName",
  "lastName",
  "middleName",
  "suffix",
  "cpNum",
  "email",
  "departmentId",
  "department",
  "accountId",
  "specificAccount",
  "sourcingId",
  "source",
  "preferredSite",
  "status",
  "notes",
];

function cleanComparableValue(value) {
  return String(value ?? "").trim();
}

export function getApplicantLeadEditSnapshot(lead = {}) {
  return {
    firstName: lead.firstName || "",
    lastName: lead.lastName || "",
    middleName: lead.middleName || "",
    suffix: lead.suffix || "",
    cpNum: lead.cpNum || "",
    email: lead.email || "",
    departmentId: lead.departmentId || "",
    department: lead.department || "",
    accountId: lead.accountId || "",
    specificAccount: lead.specificAccount || "",
    sourcingId: lead.sourcingId || "",
    source: lead.source || "",
    preferredSite: lead.preferredSite || "",
    status: lead.status || "",
    notes: lead.notes || "",
  };
}

export function isApplicantLeadFieldEdited(formData = {}, lead = {}, field) {
  const original = getApplicantLeadEditSnapshot(lead);

  return cleanComparableValue(formData[field]) !== cleanComparableValue(original[field]);
}

export function getApplicantLeadEditedFields(formData = {}, lead = {}) {
  return APPLICANT_LEAD_EDIT_FIELDS.reduce((editedFields, field) => {
    if (isApplicantLeadFieldEdited(formData, lead, field)) {
      return {
        ...editedFields,
        [field]: true,
      };
    }

    return editedFields;
  }, {});
}

export function isApplicantLeadFormEdited(formData = {}, lead = {}) {
  return Object.keys(getApplicantLeadEditedFields(formData, lead)).length > 0;
}
