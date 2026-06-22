import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getJobDescriptionRevisionComments,
  saveJobDescriptionRevisionComments,
} from "../../lib/axios/jobDescription";

const JobDescriptionContext = createContext(null);

export const jdStatusOptions = [
  { value: "Existing", label: "Existing" },
  { value: "New Job Description", label: "New Job Description" },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

const initialJobDescriptionForm = {
  existingJdId: "",
  linkedHiringRequirement: "",

  documentTitle: "",
  roleTitle: "",

  accountId: "",
  account: "",

  departmentId: "",
  department: "",

  jdStatus: "New Job Description",

  personalityType: "",
  personalityTypes: [],

  ownerSibsId: "",
  owner: "",

  requestedBySibsId: "",
  requestedBy: "",

  dateRequested: "",
  effectiveDate: "",

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
  const [form, setForm] = useState({
    ...initialJobDescriptionForm,
    dateRequested: getTodayDate(),
    effectiveDate: getTodayDate(),
  });

  const [accounts, setAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [requestedByUsers, setRequestedByUsers] = useState([]);

  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [dropdownError, setDropdownError] = useState("");

  const [competencies, setCompetencies] = useState([]);

  const [revisionComments, setRevisionComments] = useState([]);
  const [revisionCommentsLoading, setRevisionCommentsLoading] = useState(false);
  const [revisionCommentsError, setRevisionCommentsError] = useState("");

  const linkedRequirementOptions = useMemo(
    () => [
      {
        value: "",
        label: "No Existing Job Description — New Job Description",
      },
    ],
    [],
  );

  const hasLinkedHiringRequirement = !!String(
    form.existingJdId || form.linkedHiringRequirement || "",
  ).trim();

  const selectedLinkedRequirement =
    linkedRequirementOptions.find((option) => {
      const currentValue = String(
        form.existingJdId || form.linkedHiringRequirement || "",
      );

      return String(option.value) === currentValue;
    })?.label || "";

  const selectedJdStatus =
    jdStatusOptions.find(
      (option) => option.value === String(form.jdStatus || ""),
    )?.label || "";

  const resetJobDescriptionForm = useCallback((overrides = {}) => {
    setForm({
      ...initialJobDescriptionForm,
      dateRequested: getTodayDate(),
      effectiveDate: getTodayDate(),
      ...overrides,
    });

    setCompetencies([]);
  }, []);

  const handleRequirementChange = useCallback((value = "") => {
    const nextValue = String(value || "").trim();

    setForm((prev) => ({
      ...prev,

      existingJdId: nextValue,
      linkedHiringRequirement: nextValue,

      documentTitle: "",
      roleTitle: "",

      accountId: "",
      account: "",

      departmentId: "",
      department: "",

      jdStatus: nextValue ? "Existing" : "New Job Description",

      requestedBySibsId: "",
      requestedBy: "",

      description: "",
      responsibilities: "",
      qualifications: "",
      remarks: "",

      personalityType: "",
      reportsTo: "",
      supervisory: "No",
      effectiveDate: prev.effectiveDate || getTodayDate(),
    }));

    setCompetencies([]);
  }, []);

  const clearRevisionComments = useCallback(() => {
    setRevisionComments([]);
    setRevisionCommentsError("");
    setRevisionCommentsLoading(false);
  }, []);

  const loadRevisionComments = useCallback(async (jdId, params = {}) => {
    const resolvedJdId = Number(jdId || 0);

    if (!resolvedJdId) {
      setRevisionComments([]);
      setRevisionCommentsError("");
      return {
        success: false,
        data: [],
        message: "Invalid job description ID.",
      };
    }

    setRevisionCommentsLoading(true);
    setRevisionCommentsError("");

    try {
      const result = await getJobDescriptionRevisionComments(
        resolvedJdId,
        params,
      );

      if (!result?.success) {
        setRevisionComments([]);
        setRevisionCommentsError(
          result?.message || "Failed to load revision comments.",
        );

        return result;
      }

      setRevisionComments(result.data || []);

      return result;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load revision comments.";

      setRevisionComments([]);
      setRevisionCommentsError(message);

      return {
        success: false,
        data: [],
        message,
      };
    } finally {
      setRevisionCommentsLoading(false);
    }
  }, []);

  const saveRevisionComments = useCallback(async (jdId, comments = []) => {
    const resolvedJdId = Number(jdId || 0);

    if (!resolvedJdId) {
      return {
        success: false,
        message: "Invalid job description ID.",
      };
    }

    setRevisionCommentsLoading(true);
    setRevisionCommentsError("");

    try {
      const result = await saveJobDescriptionRevisionComments(
        resolvedJdId,
        comments,
      );

      if (!result?.success) {
        setRevisionCommentsError(
          result?.message || "Failed to save revision comments.",
        );

        return result;
      }

      setRevisionComments(result.data || comments || []);

      return result;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save revision comments.";

      setRevisionCommentsError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setRevisionCommentsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
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

      revisionComments,
      setRevisionComments,

      revisionCommentsLoading,
      setRevisionCommentsLoading,

      revisionCommentsError,
      setRevisionCommentsError,

      loadRevisionComments,
      clearRevisionComments,
      saveRevisionComments,

      jdStatusOptions,
      linkedRequirementOptions,

      hasLinkedHiringRequirement,
      selectedLinkedRequirement,
      selectedJdStatus,

      resetJobDescriptionForm,
      handleRequirementChange,
    }),
    [
      form,
      accounts,
      departments,
      requestedByUsers,
      dropdownLoading,
      dropdownError,
      competencies,
      revisionComments,
      revisionCommentsLoading,
      revisionCommentsError,
      loadRevisionComments,
      clearRevisionComments,
      saveRevisionComments,
      linkedRequirementOptions,
      hasLinkedHiringRequirement,
      selectedLinkedRequirement,
      selectedJdStatus,
      resetJobDescriptionForm,
      handleRequirementChange,
    ],
  );

  return (
    <JobDescriptionContext.Provider value={value}>
      {children}
    </JobDescriptionContext.Provider>
  );
}
