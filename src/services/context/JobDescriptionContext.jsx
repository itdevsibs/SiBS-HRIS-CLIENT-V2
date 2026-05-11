import React, { createContext, useContext, useMemo, useState } from "react";

const JobDescriptionContext = createContext(null);

export const jdStatusOptions = [
  { value: "Existing", label: "Existing" },
  { value: "For Revision", label: "For Revision" },
  { value: "New Job Description", label: "New Job Description" },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const initialJobDescriptionForm = {
  linkedHiringRequirement: "",
  documentTitle: "",
  roleTitle: "",
  accountId: "",
  account: "",
  departmentId: "",
  department: "",
  jdStatus: "New Job Description",
  personalityTypes: [],
  ownerSibsId: "",
  owner: "",
  requestedBySibsId: "",
  requestedBy: "",
  dateRequested: "",
  reportsTo: "",
  supervisory: "No",
  description: "",
  responsibilities: "",
  qualifications: "",
  remarks: "",
};

export function useJobDescription() {
  const context = useContext(JobDescriptionContext);

  if (!context) {
    throw new Error(
      "useJobDescription must be used within JobDescriptionProvider",
    );
  }

  return context;
}

export default function JobDescriptionProvider({ children }) {
  const [form, setForm] = useState(initialJobDescriptionForm);

  const [accounts, setAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [requestedByUsers, setRequestedByUsers] = useState([]);

  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownError, setDropdownError] = useState("");

  const [competencies, setCompetencies] = useState([]);

  const linkedRequirementOptions = useMemo(
    () => [
      {
        value: "",
        label: "No linked hiring requirement — New Job Description",
      },
    ],
    [],
  );

  const hasLinkedHiringRequirement = !!form.linkedHiringRequirement;

  const selectedLinkedRequirement =
    linkedRequirementOptions.find(
      (option) => option.value === String(form.linkedHiringRequirement || ""),
    )?.label || "";

  const selectedJdStatus =
    jdStatusOptions.find(
      (option) => option.value === String(form.jdStatus || ""),
    )?.label || "";

  function resetJobDescriptionForm(overrides = {}) {
    setForm({
      ...initialJobDescriptionForm,
      dateRequested: getTodayDate(),
      ...overrides,
    });

    setCompetencies([]);
  }

  function handleRequirementChange() {
    setForm((prev) => ({
      ...prev,
      linkedHiringRequirement: "",
      roleTitle: "",
      accountId: "",
      account: "",
      departmentId: "",
      department: "",
      jdStatus: "New Job Description",
      requestedBySibsId: "",
      requestedBy: "",
    }));
  }

  const value = {
    form,
    setForm,

    accounts,
    setAccounts,
    departments,
    setDepartments,
    requestedByUsers,
    setRequestedByUsers,

    dropdownLoading,
    setDropdownLoading,
    dropdownError,
    setDropdownError,

    competencies,
    setCompetencies,

    jdStatusOptions,
    linkedRequirementOptions,
    hasLinkedHiringRequirement,
    selectedLinkedRequirement,
    selectedJdStatus,

    resetJobDescriptionForm,
    handleRequirementChange,
  };

  return (
    <JobDescriptionContext.Provider value={value}>
      {children}
    </JobDescriptionContext.Provider>
  );
}
