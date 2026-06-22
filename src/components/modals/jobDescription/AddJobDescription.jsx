import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, RotateCcw } from "lucide-react";

import { useUser } from "../../../services/context/UserContext";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import { createJobDescription } from "../../../lib/axios/jobDescription";
import useAddJobDescriptionModal from "../../../hooks/jobDescription/useAddJobDescription";
import AddJobDescriptionHeader from "./AddJobDescriptionHeader";
import AddJobDescriptionInfoBanner from "./AddJobDescriptionInfoBanner";
import HiringRequirementSection from "./HiringRequirementsSection";
import DesiredCompetenciesTable from "../../tables/jobDescription/DesiredCompetenciesTable";
import JobDescriptionContentSection from "./JobDescriptionContentSection";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function normalizeJdStatus(status) {
  if (status === "New JD") return "New Job Description";
  return status || "New Job Description";
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeArrayText(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return normalizeText(value);
}

function normalizeJobDescriptionItem(item) {
  if (!item) return null;

  return {
    ...item,

    id: item.id,
    jdCode: item.jdCode || item.jd_code || "",

    existingJdId:
      item.existingJdId ||
      item.existing_jd_id ||
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      "",

    linkedHiringRequirement:
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      item.existingJdId ||
      item.existing_jd_id ||
      "",

    documentTitle:
      item.documentTitle ||
      item.document_title ||
      item.roleTitle ||
      item.role_title ||
      "",

    roleTitle:
      item.roleTitle ||
      item.role_title ||
      item.documentTitle ||
      item.document_title ||
      "",

    accountId: item.accountId || item.account_id || "",
    departmentId: item.departmentId || item.department_id || "",

    jdStatus: normalizeJdStatus(item.jdStatus || item.jd_status || item.status),

    ownerSibsId:
      item.ownerSibsId ||
      item.owner_sibs_id ||
      item.requestedBySibsId ||
      item.requested_by_sibs_id ||
      "",

    requestedBySibsId:
      item.requestedBySibsId || item.requested_by_sibs_id || "",

    dateRequested: item.dateRequested || item.date_requested || "",
    effectiveDate: item.effectiveDate || item.effective_date || "",

    description: item.description || "",
    responsibilities: item.responsibilities || "",
    qualifications: item.qualifications || "",

    personalityType:
      item.personalityType || item.personality_type || item.remarks || "",

    reportsTo: item.reportsTo || item.reports_to || "",
    supervisory: item.supervisory || "No",

    remarks: item.remarks || "",

    competencies: Array.isArray(item.competencies) ? item.competencies : [],

    revisionHistory: Array.isArray(item.revisionHistory)
      ? item.revisionHistory
      : Array.isArray(item.revisions)
        ? item.revisions
        : [],
  };
}

function formatLoggedInOwner(user) {
  const sibsId = String(
    user?.username ||
      user?.sibs_id ||
      user?.gy_user_code ||
      user?.gy_emp_code ||
      user?.sibsId ||
      "",
  ).trim();

  const lastName = String(
    user?.gy_emp_lname || user?.lastName || user?.last_name || "",
  ).trim();

  const firstName = String(
    user?.gy_emp_fname || user?.firstName || user?.first_name || "",
  ).trim();

  const middleName = String(
    user?.gy_emp_mname || user?.middleName || user?.middle_name || "",
  ).trim();

  const fallbackName = String(
    user?.full_name ||
      user?.fullName ||
      user?.employee_name ||
      user?.name ||
      "",
  ).trim();

  const formattedName =
    lastName || firstName || middleName
      ? `${lastName}, ${firstName} ${middleName}`.replace(/\s+/g, " ").trim()
      : fallbackName;

  return {
    ownerSibsId: sibsId,
    owner: `${sibsId}${formattedName ? ` - ${formattedName}` : ""}`
      .trim()
      .toUpperCase(),
  };
}

function normalizeCompetencyItem(item = {}) {
  const title = String(
    item.title ||
      item.competency ||
      item.competencyTitle ||
      item.competencyName ||
      item.name ||
      item.label ||
      item.competencyForThisPosition ||
      item.description ||
      "",
  ).trim();

  const description = String(
    item.details ||
      item.competencyDescription ||
      item.definition ||
      item.competencyDetails ||
      item.longDescription ||
      item.description ||
      "",
  ).trim();

  const level = String(
    item.level ||
      item.proficiencyLevel ||
      item.selectedLevel ||
      item.rating ||
      "",
  ).trim();

  return {
    title,
    description,
    level,
    average: item.average,
    proficient: item.proficient,
    excellent: item.excellent,
  };
}

export default function AddJobDescription({
  open,
  onClose,
  onCreated,
  onStatus,
}) {
  const { user } = useUser();

  const {
    form,
    competencies,
    setCompetencies,
    resetJobDescriptionForm,
    handleRequirementChange: resetRequirementFromProvider,
  } = useJobDescription();

  const loggedInOwner = useMemo(() => formatLoggedInOwner(user), [user]);

  const {
    refs,
    dropdownState,
    searchState,
    handleLinkedRequirementChange,
    handleResetForm,
  } = useAddJobDescriptionModal({
    open,
    onClose,
    resetRequirementFromProvider,
    resetJobDescriptionForm: () =>
      resetJobDescriptionForm({
        ownerSibsId: loggedInOwner.ownerSibsId,
        owner: loggedInOwner.owner,
        requestedBySibsId: loggedInOwner.ownerSibsId,
        requestedBy: loggedInOwner.owner,
        dateRequested: getTodayDate(),
        effectiveDate: getTodayDate(),
      }),
  });

  useEffect(() => {
    if (!open) return;

    resetJobDescriptionForm({
      ownerSibsId: loggedInOwner.ownerSibsId,
      owner: loggedInOwner.owner,
      requestedBySibsId: loggedInOwner.ownerSibsId,
      requestedBy: loggedInOwner.owner,
      dateRequested: getTodayDate(),
      effectiveDate: getTodayDate(),
    });
  }, [open, loggedInOwner.ownerSibsId, loggedInOwner.owner]);

  function handleClose() {
    resetJobDescriptionForm();
    onClose?.();
  }

  async function handleCreateJobDescription(e) {
    e.preventDefault();

    const documentTitle = normalizeText(form.documentTitle || form.roleTitle);

    const existingJdId = normalizeText(
      form.existingJdId || form.linkedHiringRequirement,
    );

    const requestedBySibsId = normalizeText(
      form.requestedBySibsId || form.ownerSibsId || loggedInOwner.ownerSibsId,
    );

    const description = normalizeText(form.description);

    const responsibilities = normalizeText(
      form.responsibilities ||
        form.dutiesResponsibilities ||
        form.duties ||
        form.qualifications ||
        "",
    );

    const qualifications = normalizeText(
      form.qualificationDetails ||
        form.characteristics ||
        form.qualificationCharacteristics ||
        form.remarks ||
        form.qualifications ||
        "",
    );

    const personalityType = normalizeText(
      form.personalityType ||
        form.personality_type ||
        normalizeArrayText(form.personalityTypes),
    );

    const remarks = normalizeText(form.remarks);

    if (!documentTitle) {
      onStatus?.({
        type: "error",
        title: "Missing Document Title",
        message: "Document title / role title is required.",
      });
      return;
    }

    if (!form.accountId) {
      onStatus?.({
        type: "error",
        title: "Missing Account",
        message: "Account is required.",
      });
      return;
    }

    if (!form.departmentId) {
      onStatus?.({
        type: "error",
        title: "Missing Department",
        message: "Department is required.",
      });
      return;
    }

    if (!requestedBySibsId) {
      onStatus?.({
        type: "error",
        title: "Missing Requested By",
        message: "Requested By is required.",
      });
      return;
    }

    if (!form.effectiveDate) {
      onStatus?.({
        type: "error",
        title: "Missing Effective Date",
        message: "Effective date is required.",
      });
      return;
    }

    if (!description) {
      onStatus?.({
        type: "error",
        title: "Missing Job Description",
        message: "Job description is required.",
      });
      return;
    }

    if (!responsibilities) {
      onStatus?.({
        type: "error",
        title: "Missing Responsibilities",
        message: "Responsibilities are required.",
      });
      return;
    }

    if (!qualifications) {
      onStatus?.({
        type: "error",
        title: "Missing Qualifications",
        message: "Qualifications are required.",
      });
      return;
    }

    const cleanCompetencies = Array.isArray(competencies)
      ? competencies
          .map(normalizeCompetencyItem)
          .filter((item) => item.title || item.description)
      : [];

    const payload = {
      existingJdId: existingJdId || null,
      linkedHiringRequirement: existingJdId || null,

      documentTitle,
      roleTitle: documentTitle,

      accountId: form.accountId,
      departmentId: form.departmentId,

      jdStatus: existingJdId
        ? normalizeJdStatus(form.jdStatus || "Existing")
        : "New Job Description",

      requestedBySibsId,
      dateRequested: form.dateRequested || getTodayDate(),
      effectiveDate: form.effectiveDate || getTodayDate(),

      description,
      responsibilities,
      qualifications,

      personalityType,

      reportsTo: normalizeText(form.reportsTo || form.reports_to),
      supervisory: normalizeText(form.supervisory || "No") || "No",

      remarks,

      competencies: cleanCompetencies,
    };

    console.log("RAW COMPETENCIES:", competencies);
    console.log("CLEAN COMPETENCIES:", cleanCompetencies);
    console.log("JD PAYLOAD:", payload);

    const result = await createJobDescription(payload);

    if (!result.success) {
      onStatus?.({
        type: "error",
        title: "Save Failed",
        message: result.message || "Failed to create job description.",
      });
      return;
    }

    const newItem = normalizeJobDescriptionItem(result.data);

    onCreated?.(newItem);

    resetJobDescriptionForm();

    onStatus?.({
      type: "success",
      title: "Job Description Saved",
      message: result.message || "Job description created successfully.",
    });

    onClose?.();
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 px-4 py-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-job-description-modal-title"
        className="relative flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-sibs-tertiary-9 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <AddJobDescriptionHeader onClose={handleClose} />

        <form
          onSubmit={handleCreateJobDescription}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-8 sm:p-6 sm:pb-8">
            <AddJobDescriptionInfoBanner />

            <HiringRequirementSection
              refs={refs}
              dropdownState={dropdownState}
              searchState={searchState}
              handleLinkedRequirementChange={handleLinkedRequirementChange}
            />

            <JobDescriptionContentSection />

            <DesiredCompetenciesTable
              competencies={competencies}
              setCompetencies={setCompetencies}
            />
          </div>

          <div className="shrink-0 border-t border-sibs-tertiary-9 bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sibs-tertiary-8 bg-white px-5 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10"
              >
                <RotateCcw size={17} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-sibs-tertiary-8 bg-white px-5 text-sm font-semibold text-sibs-tertiary-5 transition hover:bg-sibs-tertiary-10"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--sibs-primary-1)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus size={17} />
                Save Job Description
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
