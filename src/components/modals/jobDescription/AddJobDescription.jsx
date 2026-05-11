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

function normalizeJobDescriptionItem(item) {
  return {
    ...item,
    jdStatus: normalizeJdStatus(item?.jdStatus),
    revisionHistory: Array.isArray(item?.revisionHistory)
      ? item.revisionHistory
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
        dateRequested: getTodayDate(),
      }),
  });

  useEffect(() => {
    if (!open) return;

    resetJobDescriptionForm({
      ownerSibsId: loggedInOwner.ownerSibsId,
      owner: loggedInOwner.owner,
      dateRequested: getTodayDate(),
    });
  }, [open, loggedInOwner.ownerSibsId, loggedInOwner.owner]);

  function handleClose() {
    resetJobDescriptionForm();
    onClose?.();
  }

  async function handleCreateJobDescription(e) {
    e.preventDefault();

    if (!form.roleTitle.trim()) {
      onStatus?.({
        type: "error",
        title: "Missing Role Title",
        message: "Role title is required.",
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

    if (!form.ownerSibsId) {
      onStatus?.({
        type: "error",
        title: "Missing Owner",
        message: "Owner is required.",
      });
      return;
    }

    if (!form.requestedBySibsId) {
      onStatus?.({
        type: "error",
        title: "Missing Requested By",
        message: "Requested By is required.",
      });
      return;
    }

    if (!form.description.trim()) {
      onStatus?.({
        type: "error",
        title: "Missing Job Description",
        message: "Job description is required.",
      });
      return;
    }

    if (!form.responsibilities.trim()) {
      onStatus?.({
        type: "error",
        title: "Missing Responsibilities",
        message: "Responsibilities are required.",
      });
      return;
    }

    if (!form.qualifications.trim()) {
      onStatus?.({
        type: "error",
        title: "Missing Qualifications",
        message: "Qualifications are required.",
      });
      return;
    }

    const cleanCompetencies = competencies
      .filter((item) => String(item.title || "").trim())
      .map((item) => ({
        title: String(item.title || "").trim(),
        description: String(item.description || "").trim(),
        level: String(item.level || "").trim(),
      }));

    const payload = {
      linkedHiringRequirement: form.linkedHiringRequirement,
      roleTitle: form.roleTitle.trim(),
      accountId: form.accountId,
      departmentId: form.departmentId,
      jdStatus: form.linkedHiringRequirement
        ? normalizeJdStatus(form.jdStatus)
        : "New Job Description",
      ownerSibsId: form.ownerSibsId,
      requestedBySibsId: form.requestedBySibsId,
      dateRequested: form.dateRequested || getTodayDate(),
      description: form.description.trim(),
      responsibilities: form.responsibilities.trim(),
      qualifications: form.qualifications.trim(),
      remarks: form.remarks.trim(),
      competencies: cleanCompetencies,
    };

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
