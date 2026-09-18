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

export const UNLINKED_JD_TAB = "Unlinked From Job Descriptions";

export const AVAILABLE_POSITION_STATUS_TABS = [
  {
    label: "All Positions",
    value: "All",
  },
  {
    label: "For Approval",
    value: "For Approval",
  },
  {
    label: "Active",
    value: "Active",
  },
  {
    label: "Inactive",
    value: "Inactive",
  },
  {
    label: "Approved",
    value: "Approved",
  },
  {
    label: "Rejected",
    value: "Rejected",
  },
  {
    label: "Archived",
    value: "Archived",
  },
  {
    label: "Unlinked From Job Descriptions",
    value: UNLINKED_JD_TAB,
  },
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
