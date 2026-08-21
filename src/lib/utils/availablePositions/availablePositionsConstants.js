// constants
export const POSITIONS_PER_PAGE = 8;

export const LOCATION_SITE_OPTIONS = [
  "Davao Site",
  "Tagum Site",
  "Mabini Site",
  "Both Davao and Tagum Site",
];

// Used in the page filter dropdown.
export const STATUS_FILTER_OPTIONS = [
  "All",
  "For Approval",
  "Active",
  "Inactive",
  "Approved",
  "Rejected",
  "Archived",
];

// Used in the Add/Edit Position modal.
export const STATUS_OPTIONS = ["Active", "Inactive", "Archived"];

export const emptyForm = {
  jdId: "",
  jd_id: "",
  jdCode: "",
  jd_code: "",

  documentTitle: "",
  document_title: "",

  positionTitle: "",
  departmentId: "",
  department: "",
  accountId: "",
  accountName: "",
  accountGhlName: "",
  description: "",
  preferredSkills: "",
  locationSite: "",
  status: "Inactive",
  remarks: "",
};
