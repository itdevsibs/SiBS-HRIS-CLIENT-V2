import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Layers,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";

const FORM_STATUS_OPTIONS = ["Active", "Inactive", "Draft"];
const TABLE_STATUS_OPTIONS = ["All", "Active", "Inactive", "Draft"];
const FORMS_PAGE_LIMIT = 15;

const SECTION_PRESETS = [
  {
    title: "Communication",
    subtitle: "Grammar, tone & active listening",
    questions: [
      {
        label:
          "Demonstrates clear vocal articulation, accent neutralization, and active listening skills during scenario simulation.",
        type: "Rating",
        required: true,
      },
      {
        label:
          "Provide detailed feedback on candidate's tone, pacing, and confidence during mock call.",
        type: "Text",
        required: true,
      },
    ],
  },
  {
    title: "Problem Solving",
    subtitle: "Scenario handling & reasoning",
    questions: [
      {
        label:
          "Explains a structured approach to diagnosing customer issues and choosing the best resolution path.",
        type: "Rating",
        required: true,
      },
      {
        label:
          "Documents the candidate's reasoning quality, escalation judgment, and ownership mindset.",
        type: "Text",
        required: true,
      },
    ],
  },
  {
    title: "Technical / Tools",
    subtitle: "CRM knowledge & Pass/Fail rules",
    questions: [
      {
        label:
          "Demonstrates familiarity with required systems, documentation standards, and workflow navigation.",
        type: "Rating",
        required: true,
      },
      {
        label: "System navigation and tool proficiency verification.",
        type: "Rating",
        required: true,
      },
    ],
  },
  {
    title: "Culture & Attendance",
    subtitle: "Shift flexibility & values fit",
    questions: [
      {
        label:
          "SIBS core values alignment: Commitment to team collaboration, schedule flexibility, and continuous learning.",
        type: "Rating",
        required: true,
      },
    ],
  },
];

function asText(value, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getPositionId(position = {}) {
  return (
    position.id ||
    position.positionId ||
    position.position_id ||
    position.databaseId ||
    position.database_id ||
    ""
  );
}

function getPositionCode(position = {}) {
  return asText(
    position.code ||
      position.positionCode ||
      position.position_code ||
      position.positionId ||
      position.id,
  );
}

function getPositionTitle(position = {}) {
  return asText(position.position || position.title || position.positionTitle);
}

function getPositionDepartment(position = {}) {
  return asText(position.department || position.departmentName);
}

function getPositionSite(position = {}) {
  return asText(position.location || position.site || position.branch);
}

function getFormName(form = {}, position = {}) {
  return asText(
    form.name ||
      form.formName ||
      form.form_name ||
      `${getPositionTitle(position)} - Final Interview Form`,
  );
}

function getFormStatus(form = {}) {
  return asText(form.status, "Active");
}

function getPassingScore(form = {}) {
  return Number(form.passingScore ?? form.passing_score ?? 80) || 80;
}

function getFormFields(form = {}) {
  if (Array.isArray(form.fields)) return form.fields;
  if (Array.isArray(form.questions)) return form.questions;
  return [];
}

function getCriteriaCount(form = {}) {
  return getFormFields(form).length;
}

function statusBadgeClass(status) {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Inactive") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function groupFieldsBySection(fields = []) {
  const groups = new Map();

  fields.forEach((field) => {
    const section = asText(field.section, "Untitled Section");

    if (!groups.has(section)) {
      groups.set(section, {
        section,
        enabled: true,
        questions: [],
      });
    }

    const group = groups.get(section);
    group.questions.push(field);

    if (field.enabled === false) {
      group.enabled = false;
    }
  });

  return Array.from(groups.values());
}

function getFieldTypeOptions(fieldTypes = []) {
  const options = Array.isArray(fieldTypes) ? fieldTypes : [];
  const normalized = options
    .map((option) =>
      typeof option === "string"
        ? option
        : option?.value || option?.label || option?.name,
    )
    .filter(Boolean);

  return normalized.length ? normalized : ["Rating", "Text", "Pass/Fail"];
}

function StatusFilterButton({ active, children, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[11px] font-extrabold transition ${
        active
          ? "border border-[#BFD8F1] bg-[#EFF6FF] text-sibs-primary-1 shadow-sm"
          : "border border-[#D6DEE8] bg-white text-[#475467] hover:border-[#BFD8F1] hover:bg-[#EFF6FF] hover:text-sibs-primary-1"
      }`}
    >
      {children}
      {Number.isFinite(count) && count > 0 && (
        <span
          className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-100 px-1 text-[9px] font-extrabold text-red-600"
        >
          {count}
        </span>
      )}
    </button>
  );
}

function StepButton({ number, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] border px-3 text-[11px] font-extrabold transition ${
        active
          ? "border-[#BFD8F1] bg-[#EFF6FF] text-sibs-primary-1 shadow-sm"
          : "border-transparent bg-white text-[#475467] hover:border-[#D9E2EC] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${
          active ? "bg-[#FF5C28] text-white" : "bg-[#E8EEF5] text-[#667085]"
        }`}
      >
        {number}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function BeginnerGuide({ hidden, onToggle }) {
  if (hidden) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-extrabold text-[#C75A00] underline"
        >
          Show Guide
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-[#FFFCF2] p-3">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase text-[#9A4A00]">
          <Sparkles size={15} className="text-[#FF5C28]" />
          <Lightbulb size={14} className="text-amber-500" />
          Beginner's Guide: How to Create an Interview Form
        </p>

        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-extrabold text-[#C75A00] underline"
        >
          Hide Guide
        </button>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-3">
        {[
          [
            "Step 1: Basic Info",
            "Give your form a name, set the status, and define the passing score required to recommend a candidate.",
          ],
          [
            "Step 2: Add Sections",
            "Group evaluation topics and use presets when you want standard pre-written sections.",
          ],
          [
            "Step 3: Define Questions",
            "Add criteria questions and select whether interviewers rate on a scale or leave feedback.",
          ],
        ].map(([title, copy]) => (
          <div
            key={title}
            className="rounded-[10px] border border-amber-100 bg-white px-3 py-2.5"
          >
            <p className="text-xs font-extrabold text-sibs-primary-1">
              {title}
            </p>
            <p className="mt-1 text-[11px] font-medium leading-4 text-[#667085]">
              {copy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FormBuilderCard() {
  const {
    availablePositions,
    positionsLoading,
    positionsError,
    refreshAvailablePositions,
    activePosition,
    activePositionId,
    setActivePositionId,
    activeForm,
    settings,
    getFinalInterviewForm,
    formName,
    formStatus,
    passingScore,
    formDescription,
    setFormName,
    setFormStatus,
    setPassingScore,
    setFormDescription,
    fields,
    fieldTypes,
    formSavingStatus,
    formSaveError,
    questionsSaving,
    questionsSaveError,
    handleSaveSettings,
    handleAddFieldGroup,
    handleUpdateFieldFromModal,
    handleDeleteField,
    handleDeleteFieldGroup,
  } = useRecruitmentSettings();

  const [mode, setMode] = useState("table");
  const [step, setStep] = useState(1);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [formsSearch, setFormsSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formsPage, setFormsPage] = useState(1);
  const [guideHidden, setGuideHidden] = useState(false);

  const allPositions = Array.isArray(availablePositions)
    ? availablePositions
    : [];

  const formsForTable = useMemo(() => {
    const keyword = formsSearch.trim().toLowerCase();

    return allPositions
      .map((position) => {
        const form =
          getFinalInterviewForm?.(getPositionId(position)) ||
          getFinalInterviewForm?.(position.code) ||
          {};

        return {
          position,
          form,
          status: getFormStatus(form),
        };
      })
      .filter(({ position, form, status }) => {
        const statusMatch = statusFilter === "All" || status === statusFilter;

        if (!statusMatch) return false;
        if (!keyword) return true;

        return [
          getPositionTitle(position),
          getPositionCode(position),
          getPositionDepartment(position),
          getPositionSite(position),
          getFormName(form, position),
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      });
  }, [allPositions, formsSearch, getFinalInterviewForm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      All: allPositions.length,
      Active: 0,
      Inactive: 0,
      Draft: 0,
    };

    allPositions.forEach((position) => {
      const form =
        getFinalInterviewForm?.(getPositionId(position)) ||
        getFinalInterviewForm?.(position.code) ||
        {};

      const status = getFormStatus(form);
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }, [allPositions, getFinalInterviewForm]);

  const totalFormsPages = Math.max(
    1,
    Math.ceil(formsForTable.length / FORMS_PAGE_LIMIT),
  );
  const currentFormsPage = Math.min(formsPage, totalFormsPages);
  const formsPageStart = (currentFormsPage - 1) * FORMS_PAGE_LIMIT;
  const paginatedForms = formsForTable.slice(
    formsPageStart,
    formsPageStart + FORMS_PAGE_LIMIT,
  );

  function handlePreviousFormsPage() {
    if (positionsLoading || currentFormsPage <= 1) return;
    setFormsPage(Math.max(currentFormsPage - 1, 1));
  }

  function handleNextFormsPage() {
    if (positionsLoading || currentFormsPage >= totalFormsPages) return;
    setFormsPage(Math.min(currentFormsPage + 1, totalFormsPages));
  }

  const groupedSections = useMemo(() => groupFieldsBySection(fields), [fields]);
  const typeOptions = useMemo(
    () => getFieldTypeOptions(fieldTypes),
    [fieldTypes],
  );

  const selectedPosition =
    activePosition ||
    allPositions.find(
      (position) =>
        String(getPositionId(position)) === String(activePositionId),
    ) ||
    allPositions[0] ||
    {};

  const selectedForm = activeForm || {};
  const totalCriteria = groupedSections.reduce(
    (total, group) => total + group.questions.length,
    0,
  );

  function openPreview(position = selectedPosition, form = selectedForm) {
    const positionId = getPositionId(position);
    const formId = form?.id || form?.formId || "";
    const query = new URLSearchParams({
      positionId: String(positionId || ""),
      formId: String(formId || ""),
      mode: "preview",
    });

    window.open(
      `/recruitment/final-interview-form?${query.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openEditor(position) {
    setActivePositionId?.(getPositionId(position));
    setMode("editor");
    setStep(1);
    setShowAllSteps(false);
    setGuideHidden(false);
  }

  async function saveForm() {
    await handleSaveSettings?.();
  }

  function addBlankSection() {
    const nextNumber = groupedSections.length + 1;
    handleAddFieldGroup?.(`New Evaluation Section ${nextNumber}`, [
      {
        label: "New criteria field",
        type: "Rating",
        required: true,
      },
    ]);
  }

  function addFieldToSection(section) {
    handleAddFieldGroup?.(section, [
      {
        label: "New criteria field",
        type: "Rating",
        required: true,
      },
    ]);
  }

  function updateFieldOnBlur(field, patch) {
    handleUpdateFieldFromModal?.(field.id, {
      ...field,
      ...patch,
      section: patch.section ?? field.section,
      label: patch.label ?? field.label,
      type: patch.type ?? field.type,
      required: patch.required ?? field.required ?? true,
    });
  }

  function resizeCriteriaTextarea(element) {
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  const saveBusy =
    Boolean(questionsSaving) || /saving/i.test(formSavingStatus || "");
  const configuredCount = Array.isArray(settings?.forms)
    ? settings.forms.length
    : formsForTable.length;

  if (mode === "table") {
    const shownFrom = formsForTable.length ? formsPageStart + 1 : 0;
    const shownTo = Math.min(
      formsPageStart + paginatedForms.length,
      formsForTable.length,
    );

    return (
      <>
        <style>{`
          @keyframes sibsFinalInterviewRowReveal {
            from {
              opacity: 0;
              transform: translateY(8px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .sibs-final-interview-row-reveal {
            animation: sibsFinalInterviewRowReveal 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
            will-change: opacity, transform;
          }

          @media (prefers-reduced-motion: reduce) {
            .sibs-final-interview-row-reveal {
              animation: none !important;
              transform: none !important;
            }
          }
        `}</style>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] font-extrabold text-[#8A98B8]">
                <span>Settings</span>
                <span>/</span>
                <span className="text-sibs-primary-1">
                  Position-based Final Interview Forms
                </span>
              </div>
              <h3 className="sibs-section-title text-[18px] sm:text-[20px]">
                Position-based Final Interview Forms
              </h3>
              <p className="sibs-section-subtitle mt-1">
                Manage position interview forms, scoring rubrics, passing thresholds, and custom question fields.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="inline-flex h-8 items-center rounded-full border border-blue-100 bg-blue-50 px-3 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
                {configuredCount} configured forms
              </span>
              <button
                type="button"
                onClick={() => refreshAvailablePositions?.()}
                disabled={positionsLoading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#DCE6F1] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                title="Refresh forms"
              >
                <RefreshCw
                  size={14}
                  className={positionsLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          <div className="relative overflow-visible p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <label className="min-w-0">
                <span className="mb-1 block text-[10px] font-extrabold text-[#101828]">
                  Search
                </span>
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A98B8]"
                  />
                  <input
                    value={formsSearch}
                    onChange={(event) => {
                      setFormsSearch(event.target.value);
                      setFormsPage(1);
                    }}
                    className="h-9 w-full rounded-[10px] border border-[#D6DEE8] bg-white px-3 pl-9 text-[11px] font-semibold text-sibs-primary-1 outline-none transition placeholder:text-[#8A98B8] focus:border-[#BFD8F1] focus:ring-2 focus:ring-[#EFF6FF]"
                    placeholder="Search forms by role title, position code, department..."
                  />
                </div>
              </label>

              <div className="min-w-0">
                <span className="mb-1 block text-[10px] font-extrabold text-[#101828]">
                  Status
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {TABLE_STATUS_OPTIONS.map((status) => (
                    <StatusFilterButton
                      key={status}
                      active={statusFilter === status}
                      count={status === "All" ? undefined : statusCounts[status]}
                      onClick={() => {
                        setStatusFilter(status);
                        setFormsPage(1);
                      }}
                    >
                      {status}
                    </StatusFilterButton>
                  ))}
                </div>
              </div>
            </div>

            {positionsError && (
              <div className="mt-3 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-bold text-amber-700">
                {positionsError}
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-xl border border-[#E6ECF2] bg-white">
              <div className="max-h-[580px] overflow-auto sibs-scrollbar">
                <table className="w-full min-w-[920px] border-collapse bg-white">
                  <thead className="sibs-data-table-head">
                    <tr className="sibs-data-table-head-row">
                      <th className="sibs-data-table-th whitespace-nowrap py-3 text-left">
                        Position Title &amp; Code
                      </th>
                      <th className="sibs-data-table-th whitespace-nowrap py-3 text-left">
                        Department &amp; Site
                      </th>
                      <th className="sibs-data-table-th whitespace-nowrap py-3 text-left">
                        Form Name
                      </th>
                      <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                        Passing Score
                      </th>
                      <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                        Criteria
                      </th>
                      <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                        Status
                      </th>
                      <th className="sibs-data-table-th whitespace-nowrap py-3 text-center">
                        Preview
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    key={`${currentFormsPage}-${formsSearch}-${statusFilter}-${positionsLoading}`}
                    className="divide-y divide-[#F1F5F9]"
                  >
                    {positionsLoading && !paginatedForms.length ? (
                      Array.from({ length: FORMS_PAGE_LIMIT }).map((_, index) => (
                        <tr key={index}>
                          <td colSpan={7} className="px-3 py-3">
                            <div className="h-5 w-full animate-sibs-pulse rounded bg-[#E6ECF2]" />
                          </td>
                        </tr>
                      ))
                    ) : paginatedForms.length > 0 ? (
                      paginatedForms.map(({ position, form }, index) => {
                        const status = getFormStatus(form);

                        return (
                          <tr
                            key={getPositionId(position)}
                            role="button"
                            tabIndex={0}
                            onClick={() => openEditor(position)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openEditor(position);
                              }
                            }}
                            className="sibs-data-table-row sibs-final-interview-row-reveal cursor-pointer outline-none hover:bg-[#FFF9F6] focus:bg-[#FFF9F6]"
                            style={{
                              animationDelay: `${Math.min(index, 10) * 36}ms`,
                            }}
                          >
                            <td className="whitespace-nowrap px-3 py-3 text-[11px]">
                              <div className="flex items-center gap-2.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF5C28]" />
                                <div className="min-w-0">
                                  <p className="max-w-[210px] truncate font-extrabold text-sibs-primary-1">
                                    {getPositionTitle(position)}
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-bold text-[#52637A]">
                                    {getPositionCode(position)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-[11px]">
                              <p className="max-w-[220px] truncate font-extrabold text-sibs-primary-1">
                                {getPositionDepartment(position)}
                              </p>
                              <p className="mt-0.5 text-[10px] font-medium text-[#667085]">
                                {getPositionSite(position)}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-[11px]">
                              <p className="max-w-[270px] truncate font-semibold text-sibs-primary-1">
                                {getFormName(form, position)}
                              </p>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-extrabold text-blue-700">
                                {getPassingScore(form)}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex rounded-md bg-[#F1F5F9] px-2 py-1 text-[10px] font-extrabold text-sibs-primary-1">
                                {getCriteriaCount(form)} Fields
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${statusBadgeClass(status)}`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openPreview(position, form);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-[#52637A] transition hover:bg-[#F1F7FD] hover:text-sibs-primary-1"
                                title="Preview form"
                              >
                                <Eye size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <p className="text-sm font-extrabold text-sibs-primary-1">
                            No final interview forms found
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#667085]">
                            Adjust the search or status filter to view other forms.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#E6ECF2] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-semibold text-[#667085]">
                Showing <span className="font-extrabold text-sibs-primary-1">{shownFrom}</span> to{" "}
                <span className="font-extrabold text-sibs-primary-1">{shownTo}</span> of{" "}
                <span className="font-extrabold text-sibs-primary-1">{formsForTable.length}</span> forms
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePreviousFormsPage}
                  disabled={positionsLoading || currentFormsPage <= 1}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-[11px] font-bold text-[#52637A] transition hover:border-[#BFD8F1] hover:text-sibs-primary-1 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] bg-[#FF5C28] px-3 text-[11px] font-extrabold text-white shadow-sm">
                  {currentFormsPage}
                </span>

                <button
                  type="button"
                  onClick={handleNextFormsPage}
                  disabled={positionsLoading || currentFormsPage >= totalFormsPages}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#E6ECF2] bg-white px-3 text-[11px] font-bold text-sibs-primary-1 transition hover:border-[#BFD8F1] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  const showStepOne = showAllSteps || step === 1;
  const showStepTwo = showAllSteps || step === 2;
  const showStepThree = showAllSteps || step === 3;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white shadow-sm">
      <div className="border-b border-[#E6ECF2] bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-sibs-primary-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                FINAL INTERVIEW FORM EDITOR
              </span>
              <span className="inline-flex rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#FF5C28]">
                {getPositionCode(selectedPosition)}
              </span>
            </div>
            <h3 className="text-[20px] font-extrabold leading-tight text-sibs-primary-1">
              Position-based Final Interview Forms
            </h3>
            <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">
              Configure the selected position's final interview form, scoring threshold, sections, and criteria fields.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("table")}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#D6DEE8] bg-white px-3 text-[11px] font-extrabold text-sibs-primary-1 transition hover:border-[#BFD8F1] hover:bg-[#F8FAFC]"
            >
              <ArrowLeft size={14} className="text-[#FF5C28]" />
              Back to Forms
            </button>
            <button
              type="button"
              onClick={() => refreshAvailablePositions?.()}
              disabled={positionsLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#DCE6F1] bg-white text-sibs-primary-1 transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh forms"
            >
              <RefreshCw
                size={14}
                className={positionsLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[10px] font-extrabold text-[#101828]">
              Currently Editing Role
            </span>
            <select
              value={getPositionId(selectedPosition)}
              onChange={(event) => {
                setActivePositionId?.(event.target.value);
                setStep(1);
                setShowAllSteps(false);
              }}
              className="h-9 w-full rounded-[10px] border border-[#D6DEE8] bg-white px-3 text-[11px] font-extrabold text-sibs-primary-1 outline-none transition focus:border-[#BFD8F1] focus:ring-2 focus:ring-[#EFF6FF] lg:max-w-[560px]"
            >
              {allPositions.map((position) => (
                <option
                  key={getPositionId(position)}
                  value={getPositionId(position)}
                >
                  {getPositionTitle(position)} ({getPositionCode(position)})
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openPreview()}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#D6DEE8] bg-white px-3 text-[11px] font-extrabold text-sibs-primary-1 transition hover:border-[#BFD8F1] hover:bg-[#EFF6FF]"
            >
              <Eye size={14} className="text-[#FF5C28]" />
              Test Live Evaluation
            </button>
            <button
              type="button"
              onClick={() => void saveForm()}
              disabled={saveBusy}
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-sibs-primary-1 px-3.5 text-[11px] font-extrabold text-white transition hover:bg-sibs-primary-1/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saveBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} className="text-[#FF5C28]" />
              )}
              Save Form
            </button>
          </div>
        </div>

        <section className="mb-4 rounded-xl border border-[#E6ECF2] bg-white p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#EDF1F5] pb-2.5">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#52637A]">
                POSITION FORM SUMMARY
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[#8A98B8]">
                Review the selected position before editing its interview form.
              </p>
            </div>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${statusBadgeClass(formStatus || "Active")}`}>
              {formStatus || "Active"}
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
            <div className="min-w-0 rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5 xl:col-span-2">
              <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">Position Title</p>
              <p className="mt-1 truncate text-[12px] font-extrabold text-sibs-primary-1">{getPositionTitle(selectedPosition)}</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#FF5C28]">{getPositionCode(selectedPosition)}</p>
            </div>
            <div className="min-w-0 rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5">
              <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">Department / Site</p>
              <p className="mt-1 truncate text-[11px] font-extrabold text-sibs-primary-1">{getPositionDepartment(selectedPosition)}</p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#667085]">{getPositionSite(selectedPosition)}</p>
            </div>
            <div className="rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5">
              <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">Passing Score</p>
              <p className="mt-1 text-[16px] font-extrabold tabular-nums text-[#FF5C28]">{passingScore || 80}%</p>
            </div>
            <div className="rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5">
              <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">Criteria Fields</p>
              <p className="mt-1 text-[16px] font-extrabold tabular-nums text-sibs-primary-1">{totalCriteria}</p>
            </div>
          </div>
        </section>

      {(formSavingStatus || formSaveError || questionsSaveError) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {formSavingStatus && (
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
              {/saving/i.test(formSavingStatus) && (
                <Loader2 size={13} className="animate-spin" />
              )}
              {formSavingStatus}
            </span>
          )}
          {(formSaveError || questionsSaveError) && (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-700">
              {formSaveError || questionsSaveError}
            </span>
          )}
        </div>
      )}

        <div className="mb-4 flex gap-1.5 overflow-x-auto rounded-xl border border-[#E6ECF2] bg-white p-1.5 shadow-sm sibs-scrollbar">
        <StepButton
          number={1}
          label="Form Info & Score"
          active={!showAllSteps && step === 1}
          onClick={() => {
            setStep(1);
            setShowAllSteps(false);
          }}
        />
        <StepButton
          number={2}
          label="Sections & Presets"
          active={!showAllSteps && step === 2}
          onClick={() => {
            setStep(2);
            setShowAllSteps(false);
          }}
        />
        <StepButton
          number={3}
          label="Questions & Rating Types"
          active={!showAllSteps && step === 3}
          onClick={() => {
            setStep(3);
            setShowAllSteps(false);
          }}
        />
        <button
          type="button"
          onClick={() => setShowAllSteps((value) => !value)}
          className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] border px-3 text-[11px] font-extrabold transition ${
            showAllSteps
              ? "border-[#BFD8F1] bg-[#EFF6FF] text-sibs-primary-1 shadow-sm"
              : "border-transparent bg-white text-[#344054] hover:border-[#D9E2EC] hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
          }`}
        >
          <Layers
            size={15}
            className={showAllSteps ? "text-[#FF5C28]" : "text-[#98A2B3]"}
          />
          {showAllSteps ? "Guided Wizard Mode" : "Show All Steps"}
        </button>
        </div>

        <BeginnerGuide
        hidden={guideHidden}
        onToggle={() => setGuideHidden((value) => !value)}
      />

        <div className="mt-4 space-y-4">
        {showStepOne && (
          <section className="rounded-xl border border-[#D9E2EC] bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-[#E6ECF2] pb-3">
              <div>
                <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold text-blue-700">
                  Step 1 of 3
                </span>
                <h4 className="mt-2 text-[15px] font-extrabold text-sibs-primary-1">
                  Form Basic Information & Passing Threshold
                </h4>
              </div>
              <p className="text-[13px] font-medium leading-5 text-sibs-tertiary-5">
                Position Code: {getPositionCode(selectedPosition)}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.75fr)_minmax(220px,0.55fr)]">
              <label className="block">
                <span className="text-xs font-extrabold text-sibs-primary-1">
                  Form Name <span className="text-red-500">*</span>
                </span>
                <input
                  value={formName || ""}
                  onChange={(event) => setFormName?.(event.target.value)}
                  className="mt-1.5 h-9 w-full rounded-[10px] border border-[#D6DEE8] bg-white px-4 text-xs font-semibold text-sibs-primary-1 outline-none focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
                />
                <span className="mt-1 block text-xs font-medium text-sibs-tertiary-5">
                  Name displayed to interviewers during live evaluation.
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-extrabold text-sibs-primary-1">
                  Form Status
                </span>
                <select
                  value={formStatus || "Active"}
                  onChange={(event) => setFormStatus?.(event.target.value)}
                  className="mt-1.5 h-9 w-full rounded-[10px] border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 outline-none focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
                >
                  {FORM_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === "Active"
                        ? "Active (Ready for Hiring)"
                        : status}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-medium text-sibs-tertiary-5">
                  Only Active forms appear to interviewers.
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-extrabold text-sibs-primary-1">
                  Passing Score (%) <span className="text-red-500">*</span>
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore ?? 80}
                  onChange={(event) => setPassingScore?.(event.target.value)}
                  className="mt-1.5 h-9 w-full rounded-[10px] border border-[#D6DEE8] bg-white px-4 text-xs font-semibold text-sibs-primary-1 outline-none focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
                />
                <span className="mt-1 block text-xs font-medium text-sibs-tertiary-5">
                  Minimum score candidate needs to pass.
                </span>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-extrabold text-sibs-primary-1">
                Description / Evaluation Directive
              </span>
              <textarea
                rows={2}
                value={formDescription || ""}
                onChange={(event) => setFormDescription?.(event.target.value)}
                className="mt-1.5 w-full resize-none rounded-[10px] border border-[#D6DEE8] bg-white px-4 py-3 text-xs font-semibold text-sibs-primary-1 outline-none focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
              />
              <span className="mt-1 block text-xs font-medium text-sibs-tertiary-5">
                Instructions visible at the top of the interview form.
              </span>
            </label>

            {!showAllSteps && (
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-xs font-extrabold text-white transition hover:bg-sibs-primary-1/90"
                >
                  Next Step: Add & Organize Sections
                  <Plus size={15} className="text-[#FF5C28]" />
                </button>
              </div>
            )}
          </section>
        )}

        {showStepTwo && (
          <section className="rounded-xl border border-[#D9E2EC] bg-white p-4">
            <div className="mb-3 flex flex-col gap-3 border-b border-[#E6ECF2] pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold text-blue-700">
                  Step 2 of 3
                </span>
                <h4 className="mt-2 text-[15px] font-extrabold text-sibs-primary-1">
                  Form Sections & 1-Click Presets
                </h4>
                <p className="text-[13px] font-medium leading-5 text-[#475467]">
                  Sections organize evaluation criteria into categories.
                </p>
              </div>
              <button
                type="button"
                onClick={addBlankSection}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white transition hover:bg-[#E64E1D]"
              >
                <Plus size={15} />
                Add Blank Section
              </button>
            </div>

            <div className="rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3">
              <p className="mb-3 flex items-center gap-2 text-xs font-extrabold text-sibs-primary-1">
                <Sparkles size={15} className="text-[#FF5C28]" />
                Need help structuring your form? Click a 1-Click Standard
                Section Preset:
              </p>
              <div className="grid gap-2.5 lg:grid-cols-4">
                {SECTION_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() =>
                      handleAddFieldGroup?.(preset.title, preset.questions)
                    }
                    className="rounded-[10px] border border-[#D6DEE8] bg-white px-3 py-2.5 text-left transition hover:border-[#FF5C28] hover:bg-[#FFF7F2]"
                  >
                    <p className="flex items-center gap-2 text-xs font-extrabold text-sibs-primary-1">
                      <Plus size={14} className="text-[#FF5C28]" />
                      {preset.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                      {preset.subtitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold uppercase text-sibs-primary-1">
                  Current Form Sections ({groupedSections.length})
                </p>
                <div className="flex items-center gap-2 text-xs font-extrabold text-sibs-primary-1">
                  <button type="button" className="hover:text-[#FF5C28]">
                    Expand All
                  </button>
                  <span className="text-sibs-tertiary-5">-</span>
                  <button type="button" className="hover:text-[#FF5C28]">
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {groupedSections.map((group, index) => (
                  <div
                    key={group.section}
                    className="flex items-center gap-2.5 rounded-[10px] border border-[#D9E2EC] bg-[#F8FAFC] px-3 py-2.5"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-xs font-extrabold text-white">
                      S{index + 1}
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-extrabold uppercase text-sibs-primary-1">
                      {index + 1}. {group.section}
                    </div>
                    <span className="hidden rounded-lg border border-[#D6DEE8] bg-white px-3 py-2 text-xs font-extrabold text-[#475467] sm:inline-flex">
                      {group.questions.length} Questions
                    </span>
                    <button
                      type="button"
                      className="inline-flex h-9 w-12 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-sibs-primary-1"
                      title="Move section"
                    >
                      <ChevronUp size={14} />
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFieldGroup?.(group.section)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                      title="Delete section"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {!groupedSections.length && (
                  <div className="rounded-xl border border-dashed border-[#C8D7E8] bg-white px-4 py-10 text-center text-sm font-extrabold text-sibs-tertiary-5">
                    No sections yet. Add a preset or blank section to start.
                  </div>
                )}
              </div>
            </div>

            {!showAllSteps && (
              <div className="mt-5 flex items-center justify-between border-t border-[#E6ECF2] pt-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1"
                >
                  <ArrowLeft size={15} />
                  Previous Step
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-xs font-extrabold text-white transition hover:bg-sibs-primary-1/90"
                >
                  Next Step: Edit Criteria Questions
                  <Plus size={15} className="text-[#FF5C28]" />
                </button>
              </div>
            )}
          </section>
        )}

        {showStepThree && (
          <section>
            <div className="mb-3 flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold uppercase text-blue-700">
                  Step 3 of 3
                </span>
                <h4 className="mt-2 text-sm font-extrabold uppercase text-sibs-primary-1">
                  Configure Criteria Fields & Rating Scales
                </h4>
                <p className="text-[13px] font-medium leading-5 text-[#475467]">
                  {groupedSections.length} Sections - {totalCriteria} Criteria
                  Fields
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-9 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  className="h-9 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1"
                >
                  Collapse All
                </button>
                <button
                  type="button"
                  onClick={() => openPreview()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-xs font-extrabold text-white"
                >
                  <Eye size={15} className="text-[#FF5C28]" />
                  Test Live Form
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {groupedSections.map((group, groupIndex) => (
                <div
                  key={group.section}
                  className="overflow-hidden rounded-xl border border-[#D9E2EC] bg-white"
                >
                  <div className="flex flex-col gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-xs font-extrabold text-white">
                        S{groupIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1 px-1 text-[13px] font-extrabold uppercase text-sibs-primary-1">
                        {groupIndex + 1}. {group.section}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-8 w-10 items-center justify-center rounded-[9px] border border-[#D6DEE8] bg-white text-[#667085]"
                      >
                        <ChevronUp size={15} />
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => addFieldToSection(group.section)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#FF5C28] px-3 text-[10px] font-extrabold text-white"
                      >
                        <Plus size={15} />
                        Add Field
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#D6DEE8] bg-white text-[#667085]"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFieldGroup?.(group.section)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-red-100 bg-red-50 text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3.5">
                    {group.questions.map((field, fieldIndex) => (
                      <div
                        key={field.id}
                        className="rounded-xl border border-[#D9E2EC] bg-white p-3"
                      >
                        <div className="mb-2.5 flex flex-col gap-2.5 lg:flex-row lg:items-center">
                          <div className="flex min-w-[210px] items-center gap-3">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sibs-primary-1 text-xs font-extrabold text-white">
                              {fieldIndex + 1}
                            </span>
                            <span className="text-xs font-extrabold text-sibs-primary-1">
                              Criteria Field #{fieldIndex + 1}
                            </span>
                            <button
                              type="button"
                              className="inline-flex h-7 w-11 items-center justify-center rounded-lg border border-[#D6DEE8] bg-[#F1F5F9] text-sibs-tertiary-5"
                            >
                              <ChevronUp size={13} />
                              <ChevronDown size={13} />
                            </button>
                          </div>

                          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                            <label className="flex items-center gap-2 text-xs font-bold text-sibs-tertiary-5">
                              Type:
                              <select
                                defaultValue={field.type || "Rating"}
                                onBlur={(event) =>
                                  updateFieldOnBlur(field, {
                                    type: event.target.value,
                                  })
                                }
                                className="h-9 min-w-[170px] rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 outline-none"
                              >
                                {typeOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold text-sibs-tertiary-5">
                              Scale:
                              <select className="h-9 min-w-[170px] rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 outline-none">
                                <option>1 to 5 Scale</option>
                                <option>Pass / Fail</option>
                              </select>
                            </label>
                            <button
                              type="button"
                              onClick={() => openPreview()}
                              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#F1F5F9] px-3 text-xs font-extrabold text-sibs-primary-1"
                            >
                              <Sparkles size={14} className="text-[#FF5C28]" />
                              Quick Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteField?.(field.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sibs-tertiary-5 hover:bg-red-50 hover:text-red-600"
                              title="Delete field"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <textarea
                          rows={5}
                          defaultValue={field.label || ""}
                          ref={resizeCriteriaTextarea}
                          onInput={(event) =>
                            resizeCriteriaTextarea(event.currentTarget)
                          }
                          onBlur={(event) =>
                            updateFieldOnBlur(field, {
                              label: event.target.value,
                            })
                          }
                          className="min-h-10 w-full resize-none overflow-hidden rounded-[10px] border border-[#D6DEE8] bg-[#F8FAFC] px-4 py-3 text-xs font-semibold leading-5 text-sibs-primary-1 outline-none focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addFieldToSection(group.section)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#BFD1E5] bg-white text-xs font-extrabold text-sibs-primary-1 transition hover:border-[#FF5C28] hover:bg-[#FFF7F2]"
                    >
                      <Plus size={15} className="text-[#FF5C28]" />
                      Add Field to "{group.section}"
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBlankSection}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#BFD1E5] bg-white text-xs font-extrabold text-sibs-primary-1 transition hover:border-[#FF5C28] hover:bg-[#FFF7F2]"
              >
                <Plus size={15} className="text-[#FF5C28]" />
                Add New Evaluation Section
              </button>
            </div>

            {!showAllSteps && (
              <div className="mt-5 flex items-center justify-between border-t border-[#E6ECF2] pt-5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1"
                >
                  <ArrowLeft size={15} />
                  Previous Step
                </button>
                <button
                  type="button"
                  onClick={() => void saveForm()}
                  disabled={saveBusy}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-xs font-extrabold text-white transition hover:bg-sibs-primary-1/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saveBusy ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} className="text-[#FF5C28]" />
                  )}
                  Save Position Form
                </button>
              </div>
            )}
          </section>
        )}
      </div>

        {questionsSaveError && (
          <p className="mt-3 text-xs font-extrabold text-red-600">
            {questionsSaveError}
          </p>
        )}
      </div>
    </div>
  );
}
