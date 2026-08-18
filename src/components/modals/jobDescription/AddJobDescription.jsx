import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BriefcaseBusiness,
  FileText,
  Info,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import { useUser } from "../../../services/context/UserContext";
import { useJobDescription } from "../../../services/context/JobDescriptionContext";
import {
  createJobDescription,
  getApprovedJobDescriptions,
  getJobDescriptionDropdowns,
} from "../../../lib/axios/getJobDescription";
import useAddJobDescriptionModal from "../../../hooks/jobDescription/useAddJobDescription";
import HiringRequirementSection from "./HiringRequirementsSection";
import DesiredCompetenciesTable from "../../tables/jobDescription/DesiredCompetenciesTable";
import JobDescriptionContentSection from "./JobDescriptionContentSection";

const JD_FOR_APPROVAL_STATUS = "For Approval";

const DEFAULT_EXISTING_JD_OPTION = {
  value: "",
  label: "No Existing Job Description — New Job Description",
  raw: null,
};

function normalizeDatabaseJdId(value = "") {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) return "";

  const jdCodeMatch = cleanValue.match(/^JD[-_ ]?0*(\d+)$/i);

  if (jdCodeMatch?.[1]) {
    return jdCodeMatch[1];
  }

  if (/^\d+$/.test(cleanValue)) {
    return cleanValue;
  }

  return "";
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function normalizeJdStatus(status) {
  if (status === "New JD") return "New Job Description";
  return status || JD_FOR_APPROVAL_STATUS;
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

function normalizeExistingJdId(item = {}) {
  const raw = item.raw || {};

  const possibleId =
    item.rawId ||
    item.raw_id ||
    item.jdId ||
    item.jd_id ||
    item.databaseId ||
    item.database_id ||
    raw.rawId ||
    raw.raw_id ||
    raw.jdId ||
    raw.jd_id ||
    raw.id ||
    item.id ||
    item.value ||
    "";

  return normalizeDatabaseJdId(possibleId);
}

function getApprovedJdTitle(item = {}) {
  return normalizeText(
    item.documentTitle ||
      item.document_title ||
      item.roleTitle ||
      item.role_title ||
      item.title ||
      item.raw?.documentTitle ||
      item.raw?.document_title ||
      item.raw?.roleTitle ||
      item.raw?.role_title ||
      "",
  );
}

function getApprovedJdCode(item = {}) {
  const raw = item.raw || {};

  return normalizeText(
    item.jdCode ||
      item.jd_code ||
      raw.jdCode ||
      raw.jd_code ||
      (normalizeExistingJdId(item)
        ? `JD-${String(normalizeExistingJdId(item)).padStart(3, "0")}`
        : ""),
  );
}

function normalizeApprovedJdOption(item = {}) {
  const value = normalizeExistingJdId(item);

  if (!value) return null;

  const title = getApprovedJdTitle(item) || "Approved Job Description";
  const jdCode = getApprovedJdCode(item);

  return {
    value,
    label: jdCode ? `${title} (${jdCode})` : title,
    description: jdCode,
    raw: item,
  };
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



function isHtmlContent(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function plainTextToHtml(value = "") {
  const text = String(value || "")
    .replace(/\r\n?/g, "\n")
    .trim();

  if (!text) return "";

  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const escaped = paragraph
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");

      return `<p>${escaped}</p>`;
    })
    .join("");
}

function normalizeRichTextHtml(value = "") {
  const content = String(value || "").trim();

  if (!content) return "";

  return isHtmlContent(content)
    ? content
    : plainTextToHtml(content);
}

function richTextToPlainText(value = "") {
  const content = String(value || "").trim();

  if (!content) return "";

  if (!isHtmlContent(content)) {
    return content.replace(/\s+/g, " ").trim();
  }

  if (typeof DOMParser === "undefined") {
    return content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const parsed = new DOMParser().parseFromString(
    content,
    "text/html",
  );

  return String(parsed.body?.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasRichTextContent(value = "") {
  return richTextToPlainText(value).length > 0;
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


function CompactSection({
  title,
  subtitle,
  meta,
  metaNode,
  icon,
  contentClassName = "",
  children,
}) {
  return (
    <section className="rounded-2xl border border-[#DCE6F1] bg-white p-3.5 sm:p-4 2xl:p-5 shadow-sm">
      <div className="mb-3 2xl:mb-4 flex flex-col gap-2 border-b border-[#EEF2F6] pb-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2 2xl:gap-2.5">
          {React.createElement(icon, {
            className: "mt-0.5 h-3.5 w-3.5 2xl:h-4 2xl:w-4 shrink-0 text-[#FF5C28]",
            "aria-hidden": "true",
          })}
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#042C51]">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 text-xs font-semibold leading-relaxed text-[#667085]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {metaNode || meta ? (
          <div className="shrink-0 sibs-text-micro font-extrabold text-[#98A2B3]">
            {metaNode || meta}
          </div>
        ) : null}
      </div>

      <div className={contentClassName}>{children}</div>
    </section>
  );
}

function JobDescriptionStatusPill({ status }) {
  const cleanStatus = String(status || "New Job Description");
  const normalized = cleanStatus.toLowerCase();
  const statusClass = normalized.includes("approval")
    ? "border-[#FFB088] bg-[#FFF3ED] text-[#FF5C28]"
    : normalized.includes("approved")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized.includes("revision")
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-extrabold ${statusClass}`}
    >
      {cleanStatus}
    </span>
  );
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
    setForm,
    accounts,
    departments,
    setAccounts,
    setDepartments,
    setRequestedByUsers,
    setDropdownLoading,
    setDropdownError,
    competencies,
    setCompetencies,
    resetJobDescriptionForm,
    handleRequirementChange: resetRequirementFromProvider,
    selectedJdStatus,
  } = useJobDescription();

  const [approvedJdOptions, setApprovedJdOptions] = useState([
    DEFAULT_EXISTING_JD_OPTION,
  ]);
  const [approvedJdLoading, setApprovedJdLoading] = useState(false);

  const loggedInOwner = useMemo(() => formatLoggedInOwner(user), [user]);

  const { refs, dropdownState, searchState, handleResetForm } =
    useAddJobDescriptionModal({
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

  useEffect(() => {
    let cancelled = false;

    async function loadApprovedJobDescriptions() {
      if (!open) return;

      setApprovedJdLoading(true);

      try {
        const result = await getApprovedJobDescriptions({
          page: 1,
          limit: 500,
          search: "",
        });

        const options = result?.success
          ? [
              DEFAULT_EXISTING_JD_OPTION,
              ...(Array.isArray(result.data)
                ? result.data.map(normalizeApprovedJdOption).filter(Boolean)
                : []),
            ]
          : [DEFAULT_EXISTING_JD_OPTION];

        if (!cancelled) {
          setApprovedJdOptions(options);
        }
      } catch (error) {
        console.error("LOAD APPROVED JD OPTIONS ERROR:", error);

        if (!cancelled) {
          setApprovedJdOptions([DEFAULT_EXISTING_JD_OPTION]);
        }
      } finally {
        if (!cancelled) {
          setApprovedJdLoading(false);
        }
      }
    }

    loadApprovedJobDescriptions();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    async function loadGlobalDropdowns() {
      if (!open) return;
      if ((accounts || []).length > 0 && (departments || []).length > 0) {
        return;
      }

      setDropdownLoading(true);
      setDropdownError("");

      try {
        const result = await getJobDescriptionDropdowns();

        if (cancelled) return;

        if (result?.success) {
          setAccounts(result.accounts || []);
          setDepartments(result.departments || []);
          setRequestedByUsers(result.requestedByUsers || []);
          return;
        }

        setAccounts([]);
        setDepartments([]);
        setRequestedByUsers([]);
        setDropdownError(result?.message || "Failed to load dropdowns.");
      } catch (error) {
        if (cancelled) return;

        setAccounts([]);
        setDepartments([]);
        setRequestedByUsers([]);
        setDropdownError(error?.message || "Failed to load dropdowns.");
      } finally {
        if (!cancelled) {
          setDropdownLoading(false);
        }
      }
    }

    loadGlobalDropdowns();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    accounts,
    departments,
    setAccounts,
    setDepartments,
    setRequestedByUsers,
    setDropdownLoading,
    setDropdownError,
  ]);

  function handleApprovedJdChange(value) {
    const cleanValue = normalizeDatabaseJdId(value);

    resetRequirementFromProvider(cleanValue);

    setForm((prev) => ({
      ...prev,

      existingJdId: cleanValue || "",
      existing_jd_id: cleanValue || "",
      linkedHiringRequirement: cleanValue || "",

      jdStatus: JD_FOR_APPROVAL_STATUS,
      jd_status: JD_FOR_APPROVAL_STATUS,
      status: JD_FOR_APPROVAL_STATUS,

      ownerSibsId: prev.ownerSibsId || loggedInOwner.ownerSibsId,
      owner: prev.owner || loggedInOwner.owner,
      requestedBySibsId: prev.requestedBySibsId || loggedInOwner.ownerSibsId,
      requestedBy: prev.requestedBy || loggedInOwner.owner,

      dateRequested: prev.dateRequested || getTodayDate(),
      effectiveDate: prev.effectiveDate || getTodayDate(),
    }));
  }

  function handleClose() {
    resetJobDescriptionForm();
    onClose?.();
  }

  async function handleCreateJobDescription(e) {
    e.preventDefault();

    const documentTitle = normalizeText(form.documentTitle);
    const roleTitle = normalizeText(form.roleTitle || form.documentTitle);

    const existingJdId = normalizeDatabaseJdId(
      form.existingJdId || form.existing_jd_id || form.linkedHiringRequirement,
    );

    const requestedBySibsId = normalizeText(
      form.requestedBySibsId || form.ownerSibsId || loggedInOwner.ownerSibsId,
    );

    const description = normalizeRichTextHtml(
      form.description,
    );

    const responsibilities = normalizeRichTextHtml(
      form.responsibilities ||
        form.dutiesResponsibilities ||
        form.duties ||
        "",
    );

    const qualifications = normalizeRichTextHtml(
      form.qualifications ||
        form.qualificationDetails ||
        form.characteristics ||
        form.qualificationCharacteristics ||
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

    if (!roleTitle) {
      onStatus?.({
        type: "error",
        title: "Missing Position",
        message: "Position is required.",
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

    if (!hasRichTextContent(description)) {
      onStatus?.({
        type: "error",
        title: "Missing Job Description",
        message: "Job description is required.",
      });
      return;
    }

    if (!hasRichTextContent(responsibilities)) {
      onStatus?.({
        type: "error",
        title: "Missing Responsibilities",
        message: "Responsibilities are required.",
      });
      return;
    }

    if (!hasRichTextContent(qualifications)) {
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
      existingJdId: existingJdId ? Number(existingJdId) : null,
      existing_jd_id: existingJdId ? Number(existingJdId) : null,
      linkedHiringRequirement: existingJdId ? Number(existingJdId) : null,

      documentTitle,
      roleTitle,

      accountId: form.accountId,
      departmentId: form.departmentId,

      jdStatus: JD_FOR_APPROVAL_STATUS,
      jd_status: JD_FOR_APPROVAL_STATUS,
      status: JD_FOR_APPROVAL_STATUS,
      approvalStatus: "Pending",
      approval_status: "Pending",

      requestedBySibsId,
      dateRequested: form.dateRequested || getTodayDate(),
      effectiveDate: form.effectiveDate || getTodayDate(),

      /*
       * The existing database fields now contain sanitized Tiptap-compatible
       * HTML so list structure, indentation, and inline formatting persist.
       */
      description,
      responsibilities,
      qualifications,

      descriptionPlainText: richTextToPlainText(description),
      responsibilitiesPlainText: richTextToPlainText(responsibilities),
      qualificationsPlainText: richTextToPlainText(qualifications),

      personalityType,

      reportsTo: normalizeText(form.reportsTo || form.reports_to),
      supervisory: normalizeText(form.supervisory || "No") || "No",

      remarks,

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

    onClose?.();
  }

  const linkedExistingJdId = normalizeDatabaseJdId(
    form.existingJdId ||
      form.existing_jd_id ||
      form.linkedHiringRequirement,
  );

  const isExistingTemplateMode = Boolean(linkedExistingJdId);

  if (!open) return null;

  return createPortal(
    <div
      className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[99999] flex items-center justify-center p-2 font-jakarta sm:p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-job-description-modal-title"
        aria-describedby="add-job-description-modal-description"
        className="sibs-modal-pop-in relative flex max-h-[84vh] 2xl:max-h-[86vh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-[#9FB3C8] bg-[#F7F9FC] font-jakarta shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 bg-[#042C51] px-4 py-2.5 sm:px-6 2xl:py-3 text-white">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
              <span className="flex h-8 w-8 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#FF5C28]">
                <FileText className="h-4 w-4 2xl:h-4.5 2xl:w-4.5" />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="add-job-description-modal-title"
                    className="text-xs 2xl:text-sm font-extrabold uppercase tracking-wide text-white"
                  >
                    Add Job Description
                  </h2>
                  <span className="inline-flex rounded bg-[#FF5C28] px-2 py-0.5 sibs-text-micro font-extrabold uppercase text-white">
                    Specification
                  </span>
                </div>

                <p
                  id="add-job-description-modal-description"
                  className="mt-0.5 sibs-text-micro font-medium leading-relaxed text-blue-100"
                >
                  Create or update job description specifications for hiring
                  requirements.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex h-8 2xl:h-8.5 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 sibs-text-xs font-extrabold text-white transition hover:bg-white/20 active:scale-[0.98]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>

              <button
                type="submit"
                form="add-job-description-form"
                className="inline-flex h-8 2xl:h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#FF5C28] px-3.5 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E95324] active:scale-[0.98]"
              >
                <Save className="h-3.5 w-3.5" />
                Save Job Description
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 items-center justify-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white active:scale-[0.96]"
                aria-label="Close Add Job Description modal"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <form
          id="add-job-description-form"
          onSubmit={handleCreateJobDescription}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F7F9FC] p-3 sm:p-5">
            <div className="space-y-4">
              <style>{`
                /*
                 * Sections 2 and 3 inherit the compact input language used by
                 * Section 1 without replacing their existing components or
                 * state handlers.
                 */
                .jd-compact-input-theme label {
                  display: block;
                  margin-bottom: 0.375rem;
                  color: #042c51;
                  font-size: 0.75rem;
                  font-weight: 800;
                  line-height: 1rem;
                }

                .jd-compact-input-theme input:not([type="checkbox"]):not([type="radio"]),
                .jd-compact-input-theme textarea,
                .jd-compact-input-theme select {
                  width: 100%;
                  min-height: 2.5rem;
                  border: 1px solid #d7dee8;
                  border-radius: 10px;
                  background: #f8fafc;
                  padding: 0.625rem 0.75rem;
                  color: #042c51;
                  font-size: 0.75rem;
                  font-weight: 600;
                  line-height: 1.25rem;
                  outline: none;
                  transition:
                    border-color 160ms ease,
                    background-color 160ms ease,
                    box-shadow 160ms ease;
                }

                .jd-compact-input-theme input::placeholder,
                .jd-compact-input-theme textarea::placeholder {
                  color: #98a2b3;
                }

                .jd-compact-input-theme input:not([type="checkbox"]):not([type="radio"]):hover,
                .jd-compact-input-theme textarea:hover,
                .jd-compact-input-theme select:hover {
                  border-color: rgba(255, 92, 40, 0.4);
                  background: #ffffff;
                }

                .jd-compact-input-theme input:not([type="checkbox"]):not([type="radio"]):focus,
                .jd-compact-input-theme textarea:focus,
                .jd-compact-input-theme select:focus {
                  border-color: #ff5c28;
                  background: #ffffff;
                  box-shadow: 0 0 0 4px rgba(255, 92, 40, 0.1);
                }

                .jd-compact-input-theme button[aria-haspopup="listbox"],
                .jd-compact-input-theme button[aria-expanded] {
                  min-height: 2.5rem;
                  border-color: #d7dee8;
                  border-radius: 10px;
                  background: #f8fafc;
                  color: #042c51;
                  font-size: 0.75rem;
                  font-weight: 600;
                }

                .jd-compact-input-theme button[aria-haspopup="listbox"]:hover,
                .jd-compact-input-theme button[aria-expanded]:hover {
                  border-color: rgba(255, 92, 40, 0.4);
                  background: #ffffff;
                }

                .jd-compact-input-theme table {
                  border-color: #d7dee8;
                }

                .jd-compact-input-theme thead {
                  background: #f8fafc;
                }

                .jd-compact-input-theme th {
                  color: #042c51;
                  font-size: 0.625rem;
                  font-weight: 800;
                  letter-spacing: 0.04em;
                  text-transform: uppercase;
                }

                .jd-compact-input-theme td {
                  border-color: #e6ecf2;
                }
              `}</style>

              <section className="rounded-xl border border-blue-200 bg-[#EEF5FF] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#245BFF] text-white">
                      <Info size={16} />
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-extrabold text-[#042C51]">
                          Contextual Specification Guide
                        </h3>
                        <span className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-indigo-700">
                          {isExistingTemplateMode
                            ? "Existing Template Mode"
                            : "New Spec Mode"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#667085]">
                        {isExistingTemplateMode
                          ? "You are linking this record to an approved job description template. Review the inherited details and complete the remaining specification inputs."
                          : "You are creating a new Job Description specification. Define competency standards, supervisory level, and core responsibilities for the recruitment intake."}
                      </p>
                    </div>
                  </div>

                </div>
              </section>

              <CompactSection
                title="Section 1: Hiring Requirement & Template Link"
                subtitle="Select an approved template or create a new record, then complete all existing ownership and position fields."
                metaNode={
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-sibs-primary-1/70">
                      Status
                    </span>
                    <JobDescriptionStatusPill
                      status={selectedJdStatus || form.jdStatus}
                    />
                  </div>
                }
                icon={BriefcaseBusiness}
              >
                <HiringRequirementSection
                  refs={refs}
                  dropdownState={dropdownState}
                  searchState={searchState}
                  approvedJdOptions={approvedJdOptions}
                  approvedJdLoading={approvedJdLoading}
                  handleLinkedRequirementChange={handleApprovedJdChange}
                />
              </CompactSection>

              

              <CompactSection
                title="Section 2: Job Description Content"
                subtitle="Retains all original reporting, personality, description, responsibilities, qualifications, and remarks inputs."
                meta="Role Specification"
                icon={FileText}
                contentClassName="jd-compact-input-theme"
              >
                <JobDescriptionContentSection />
              </CompactSection>

              <CompactSection
                title="Section 3: Desired Competencies & Capability Matrix"
                subtitle="Retains the original competency rows, descriptions, proficiency selections, and row actions."
                meta="Capability Standards"
                icon={Award}
                contentClassName="jd-compact-input-theme"
              >
                <DesiredCompetenciesTable
                  competencies={competencies}
                  setCompetencies={setCompetencies}
                />
              </CompactSection>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
