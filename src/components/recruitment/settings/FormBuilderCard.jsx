import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Filter,
  ListChecks,
  Loader2,
  PenLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";
import StatusModal from "../../modals/StatusModal";
import RichTextEditor from "../../modals/jobDescription/RichTextEditor";
import { SelectDropdown, TablePagination, TableSkeletonRows } from "@/components/ui";

const FORM_STATUS_OPTIONS = ["Active", "Inactive", "Draft"];
const TABLE_STATUS_OPTIONS = ["All", "Active", "Inactive", "Draft"];
const FORMS_PAGE_LIMIT = 15;

function DraftRichTextEditor({ value = "", onCommit, ...props }) {
  const [draft, setDraft] = useState(value);

  return (
    <RichTextEditor
      {...props}
      value={draft}
      syncValue={false}
      onChange={(html) => setDraft(html)}
      onBlur={(html) => {
        setDraft(html);
        onCommit?.(html);
      }}
    />
  );
}

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

function getPositionJdCode(position = {}) {
  return asText(position.jdCode || position.jd_code, "");
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
    saveStatus,
    formSavingStatus,
    formSaveError,
    questionsSaving,
    questionsSaveError,
    handleSaveSettings,
    handleAddFieldGroup,
    handleUpdateFieldFromModal,
    handleRenameFieldGroup,
    handleMoveFieldGroup,
    handleDeleteField,
    handleDeleteFieldGroup,
  } = useRecruitmentSettings();

  const [mode, setMode] = useState("table");
  const [formsSearch, setFormsSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formsPage, setFormsPage] = useState(1);
  const [manualSaveFeedback, setManualSaveFeedback] = useState({
    type: "idle",
    message: "",
  });

  const allPositions = useMemo(
    () => (Array.isArray(availablePositions) ? availablePositions : []),
    [availablePositions],
  );

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
          getPositionJdCode(form) || getPositionJdCode(position),
          getPositionDepartment(position),
          getPositionSite(position),
          getFormName(form, position),
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      });
  }, [allPositions, formsSearch, getFinalInterviewForm, statusFilter]);

  const formsTotalPages = Math.max(
    1,
    Math.ceil(formsForTable.length / FORMS_PAGE_LIMIT),
  );

  const formsPageRows = useMemo(() => {
    const safePage = Math.min(Math.max(formsPage, 1), formsTotalPages);
    const startIndex = (safePage - 1) * FORMS_PAGE_LIMIT;

    return formsForTable.slice(startIndex, startIndex + FORMS_PAGE_LIMIT);
  }, [formsForTable, formsPage, formsTotalPages]);

  const formsShowingStart = formsForTable.length
    ? (Math.min(Math.max(formsPage, 1), formsTotalPages) - 1) *
        FORMS_PAGE_LIMIT +
      1
    : 0;
  const formsShowingEnd = formsForTable.length
    ? Math.min(
        formsShowingStart + formsPageRows.length - 1,
        formsForTable.length,
      )
    : 0;



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
    setManualSaveFeedback({ type: "idle", message: "" });
    setMode("editor");
  }

  async function saveForm() {
    setManualSaveFeedback({
      type: "saving",
      message: "Saving form settings...",
    });

    try {
      await handleSaveSettings?.();
      setManualSaveFeedback({
        type: "success",
        message: "Form settings saved successfully.",
      });
    } catch (error) {
      setManualSaveFeedback({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "The form settings could not be saved.",
      });
    }
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

  const saveBusy =
    manualSaveFeedback.type === "saving" ||
    Boolean(questionsSaving) ||
    /saving/i.test(formSavingStatus || "");
  const saveErrorMessage =
    manualSaveFeedback.type === "error"
      ? manualSaveFeedback.message
      : formSaveError || questionsSaveError;
  const saveSuccessMessage =
    manualSaveFeedback.type === "success"
      ? manualSaveFeedback.message
      : /saved/i.test(saveStatus || "")
        ? saveStatus
        : /saved/i.test(formSavingStatus || "")
          ? formSavingStatus
          : "";
  const saveProgressMessage = saveBusy
    ? manualSaveFeedback.type === "saving"
      ? manualSaveFeedback.message
      : formSavingStatus || saveStatus || "Saving form settings..."
    : "";
  const configuredCount = allPositions.length;

  if (mode === "table") {
    return (
      <div className="sibs-card overflow-hidden font-jakarta">
        <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-heading text-sm sm:text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
                Position-based Final Interview Forms
              </h3>
              <p className="mt-1 sibs-text-xs 2xl:text-sm font-semibold text-sibs-muted">
                Manage position interview forms, scoring rubrics, passing
                thresholds, and custom question fields.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 font-jakarta text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-navy">
                {configuredCount} Records
              </span>
              <button
                type="button"
                onClick={() => refreshAvailablePositions?.()}
                disabled={positionsLoading}
                className="sibs-btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-full p-0 text-sibs-navy disabled:cursor-not-allowed disabled:opacity-60"
                title="Refresh forms"
              >
                <RefreshCw
                  size={16}
                  className={positionsLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1fr)_220px_auto] xl:items-end">
              <div>
                <label className="mb-1 block font-jakarta text-xs font-bold text-sibs-navy">
                  Search
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sibs-muted"
                  />
                  <input
                    value={formsSearch}
                    onChange={(event) => {
                      setFormsSearch(event.target.value);
                      setFormsPage(1);
                    }}
                    className="sibs-dashboard-input h-10 w-full pl-9 text-xs sm:text-sm text-sibs-navy placeholder:text-sibs-grey-3"
                    placeholder="Search forms by role title, position code, department..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-jakarta text-xs font-bold text-sibs-navy">
                  Status
                </label>
                <SelectDropdown
                  value={statusFilter}
                  onChange={(val) => {
                    setStatusFilter(val);
                    setFormsPage(1);
                  }}
                  options={TABLE_STATUS_OPTIONS.map((status) => ({
                    value: status,
                    label: status === "All" ? "All Status" : status,
                  }))}
                  className="w-full text-xs font-semibold"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormsSearch("");
                  setStatusFilter("All");
                }}
                className="sibs-btn-secondary inline-flex h-10 items-center justify-center gap-2 px-4 text-xs font-semibold"
              >
                <Filter size={15} />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-5 2xl:p-6 font-jakarta">
          {positionsError && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
              {positionsError}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-sibs-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-sibs-border text-left font-jakarta text-xs 2xl:text-[13px] border-collapse">
                <thead className="bg-sibs-surface text-sibs-navy sticky top-0 z-20 shadow-sm border-b border-sibs-border sibs-data-table-th">
                  <tr className="sibs-data-table-th">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sibs-navy">
                      Position Title & Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sibs-navy">
                      Department & Site
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sibs-navy">
                      Form Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sibs-navy">
                      Passing Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sibs-navy">
                      Criteria
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-sibs-navy">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-sibs-navy">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sibs-border bg-white">
                  {formsPageRows.map(({ position, form }) => {
                    const status = getFormStatus(form);
                    const jdReference =
                      getPositionJdCode(form) || getPositionJdCode(position);

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
                        className="sibs-data-table-row cursor-pointer text-xs outline-none transition-colors hover:bg-sibs-surface/60"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sibs-orange" />
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate text-xs font-bold text-sibs-navy">
                                {getPositionTitle(position)}
                              </p>
                              <p className="mt-0.5 text-[11px] font-semibold text-sibs-grey-4">
                                {getPositionCode(position)}
                              </p>
                              {jdReference && (
                                <p className="mt-0.5 text-[11px] font-bold text-sibs-orange">
                                  JD: {jdReference}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-bold text-sibs-navy">
                            {getPositionDepartment(position)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-sibs-grey-4">
                            {getPositionSite(position)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="max-w-[260px] truncate text-xs font-medium text-sibs-navy">
                            {getFormName(form, position)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                            {getPassingScore(form)}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-0.5 text-xs font-bold text-sibs-navy">
                            {getCriteriaCount(form)} Fields
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${statusBadgeClass(status)}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openPreview(position, form);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sibs-grey-4 transition hover:bg-sibs-surface hover:text-sibs-navy"
                            title="Preview form"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {positionsLoading && !formsForTable.length && (
                    <TableSkeletonRows count={5} columns={7} />
                  )}

                  {!positionsLoading && !formsForTable.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <p className="text-xs font-bold text-sibs-grey-4">
                          No final interview forms match the selected filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-sibs-border bg-white px-4 py-3 sm:px-5">
          <TablePagination
            currentPage={formsPage}
            totalPages={formsTotalPages}
            totalRecords={formsForTable.length}
            loadedCount={formsPageRows.length}
            recordLabel="final interview form records"
            onPageChange={setFormsPage}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sibs-card overflow-hidden font-jakarta">
      <div className="border-b border-sibs-border bg-white px-4 py-4 sm:px-5 2xl:px-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-sibs-border pb-3">
          <button
            type="button"
            onClick={() => setMode("table")}
            className="sibs-btn-secondary inline-flex h-9 items-center justify-center gap-2 px-3 text-xs font-bold text-sibs-navy"
          >
            <ArrowLeft size={14} className="text-sibs-orange" />
            Back to Forms
          </button>
          <span className="hidden h-5 w-px bg-sibs-border sm:inline-flex" />
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold text-sibs-grey-4">
            <button
              type="button"
              onClick={() => setMode("table")}
              className="rounded px-1 py-0.5 text-sibs-navy transition hover:bg-sibs-surface hover:text-sibs-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-border"
            >
              Settings
            </button>
            <span className="text-sibs-grey-3">/</span>
            <button
              type="button"
              onClick={() => setMode("table")}
              className="rounded px-1 py-0.5 text-sibs-navy transition hover:bg-sibs-surface hover:text-sibs-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sibs-border"
            >
              Position-based Final Interview Forms
            </button>
            <span className="text-sibs-grey-3">/</span>
            <span className="inline-flex max-w-[240px] items-center rounded-md border border-sibs-border bg-sibs-surface px-2.5 py-1 text-[11px] font-bold text-sibs-navy">
              <span className="truncate">
                {getPositionTitle(selectedPosition)}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sibs-border bg-sibs-surface px-2.5 py-1 text-[10px] font-bold uppercase text-sibs-navy">
                <span className="h-1.5 w-1.5 rounded-full bg-sibs-orange" />
                FINAL INTERVIEW FORM EDITOR
              </span>
              <span className="inline-flex rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase text-sibs-orange">
                {getPositionCode(selectedPosition)}
              </span>
            </div>
            <h3 className="font-heading max-w-4xl truncate text-xl sm:text-2xl font-bold uppercase leading-tight text-sibs-navy tracking-tight">
              {getPositionTitle(selectedPosition)}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-sibs-grey-4">
              Configure this position's final interview form, scoring threshold,
              sections, and criteria fields.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {(saveProgressMessage ||
              saveSuccessMessage ||
              saveErrorMessage) && (
              <span
                role="status"
                aria-live="polite"
                className={`inline-flex min-h-10 max-w-[320px] items-center gap-2 rounded-xl border px-3 text-xs font-bold ${
                  saveErrorMessage
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : saveProgressMessage
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {saveErrorMessage ? (
                  <TriangleAlert size={15} className="shrink-0" />
                ) : saveProgressMessage ? (
                  <Loader2 size={15} className="shrink-0 animate-spin" />
                ) : (
                  <CheckCircle2 size={15} className="shrink-0" />
                )}
                <span className="line-clamp-2">
                  {saveErrorMessage ||
                    saveProgressMessage ||
                    saveSuccessMessage}
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => refreshAvailablePositions?.()}
              disabled={positionsLoading}
              className="sibs-btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-xl p-0 text-sibs-navy disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh forms"
            >
              <RefreshCw
                size={15}
                className={positionsLoading ? "animate-spin" : ""}
              />
            </button>
            <button
              type="button"
              onClick={() => openPreview()}
              className="sibs-btn-secondary inline-flex h-10 items-center justify-center gap-2 px-4 text-xs font-bold text-sibs-navy"
            >
              <Eye size={14} className="text-sibs-orange" />
              Test Live Evaluation
            </button>
            <button
              type="button"
              onClick={() => void saveForm()}
              disabled={saveBusy}
              className="sibs-btn-primary inline-flex h-10 items-center justify-center gap-2 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saveBusy ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Form
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 2xl:p-6">
        <section className="mb-4 rounded-xl border border-sibs-border bg-white p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-sibs-border pb-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sibs-navy">
                POSITION FORM SUMMARY
              </p>
              <p className="mt-0.5 text-xs text-sibs-grey-4">
                Review the selected position before editing its interview form.
              </p>
            </div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${statusBadgeClass(formStatus || "Active")}`}
            >
              {formStatus || "Active"}
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
            <div className="min-w-0 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5 xl:col-span-2">
              <p className="text-[10px] font-bold uppercase text-sibs-grey-4">
                Position Title
              </p>
              <p className="mt-1 truncate text-xs font-bold text-sibs-navy">
                {getPositionTitle(selectedPosition)}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-sibs-orange">
                {getPositionCode(selectedPosition)}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase text-sibs-grey-4">
                Department / Site
              </p>
              <p className="mt-1 truncate text-xs font-bold text-sibs-navy">
                {getPositionDepartment(selectedPosition)}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-sibs-grey-4">
                {getPositionSite(selectedPosition)}
              </p>
            </div>
            <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase text-sibs-grey-4">
                Passing Score
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-sibs-orange">
                {passingScore || 80}%
              </p>
            </div>
            <div className="rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase text-sibs-grey-4">
                Criteria Fields
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-sibs-navy">
                {totalCriteria}
              </p>
            </div>
          </div>
        </section>

        {(saveProgressMessage || saveSuccessMessage || saveErrorMessage) && (
          <div
            role="alert"
            aria-live="polite"
            className={`mb-4 flex items-start gap-2 rounded-xl border px-3.5 py-3 text-xs font-bold ${
              saveErrorMessage
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : saveProgressMessage
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {saveErrorMessage ? (
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            ) : saveProgressMessage ? (
              <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            )}
            <span>
              {saveErrorMessage || saveProgressMessage || saveSuccessMessage}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <section className="rounded-xl border border-sibs-border bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-sibs-border pb-3">
              <div>
                <h4 className="font-heading text-sm sm:text-base font-bold text-sibs-navy tracking-tight">
                  Form Basic Information & Passing Threshold
                </h4>
                <p className="text-xs text-sibs-grey-4">
                  Configure primary form details and candidate passing score.
                </p>
              </div>
              <p className="text-xs font-semibold text-sibs-grey-4">
                Position Code: {getPositionCode(selectedPosition)}
                {getPositionJdCode(selectedForm) ||
                getPositionJdCode(selectedPosition)
                  ? ` • JD: ${
                      getPositionJdCode(selectedForm) ||
                      getPositionJdCode(selectedPosition)
                    }`
                  : ""}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.75fr)_minmax(220px,0.55fr)]">
              <label className="block">
                <span className="text-xs font-bold text-sibs-navy">
                  Form Name <span className="text-rose-500">*</span>
                </span>
                <input
                  value={formName || ""}
                  onChange={(event) => setFormName?.(event.target.value)}
                  placeholder={`${getPositionTitle(selectedPosition)} - Final Interview Form`}
                  className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm text-sibs-navy placeholder:text-sibs-grey-3"
                />
                <span className="mt-1 block text-xs text-sibs-grey-4">
                  Name displayed to interviewers during live evaluation.
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-sibs-navy">
                  Form Status
                </span>
                <select
                  value={formStatus || "Active"}
                  onChange={(event) => setFormStatus?.(event.target.value)}
                  className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm font-semibold text-sibs-navy bg-white cursor-pointer"
                >
                  {FORM_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status === "Active"
                        ? "Active (Ready for Hiring)"
                        : status}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-sibs-grey-4">
                  Only Active forms appear to interviewers.
                </span>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-sibs-navy">
                  Passing Score (%) <span className="text-rose-500">*</span>
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore ?? 80}
                  onChange={(event) => setPassingScore?.(event.target.value)}
                  className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm text-sibs-navy"
                />
                <span className="mt-1 block text-xs text-sibs-grey-4">
                  Minimum score candidate needs to pass.
                </span>
              </label>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-sibs-navy">
                Description / Evaluation Directive
              </p>
              <div className="mt-1.5">
                <DraftRichTextEditor
                  key={`directive-${getPositionId(selectedPosition)}`}
                  id="final-interview-evaluation-directive"
                  value={formDescription || ""}
                  onCommit={(html) => setFormDescription?.(html)}
                  placeholder="Describe the interview focus and evaluation instructions."
                  minHeight={96}
                />
              </div>
              <span className="mt-1 block text-xs text-sibs-grey-4">
                Instructions visible at the top of the interview form.
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-sibs-border bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 border-b border-sibs-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-heading text-sm sm:text-base font-bold text-sibs-navy tracking-tight">
                  Configure Criteria Fields & Rating Scales
                </h4>
                <p className="text-xs text-sibs-grey-4">
                  {groupedSections.length} Sections • {totalCriteria} Criteria
                  Fields
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPreview()}
                  className="sibs-btn-secondary inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold text-sibs-navy"
                >
                  <Eye size={14} className="text-sibs-orange" />
                  Test Live Form
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {groupedSections.map((group, groupIndex) => (
                <div
                  key={group.questions[0]?.id || `section-${groupIndex}`}
                  className="overflow-hidden rounded-xl border border-sibs-border bg-white"
                >
                  <div className="flex flex-col gap-3 border-b border-sibs-border bg-sibs-surface px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sibs-orange text-xs font-bold text-white">
                        S{groupIndex + 1}
                      </span>
                      <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs sm:text-sm font-bold text-sibs-navy">
                        <span className="shrink-0">{groupIndex + 1}.</span>
                        <input
                          defaultValue={group.section}
                          onBlur={(event) => {
                            const renamed = handleRenameFieldGroup?.(
                              group.section,
                              event.target.value,
                            );

                            if (renamed === false) {
                              event.target.value = group.section;
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              event.currentTarget.blur();
                            }
                          }}
                          aria-label={`Section ${groupIndex + 1} title`}
                          className="sibs-dashboard-input h-9 min-w-0 flex-1 text-xs sm:text-sm font-bold uppercase text-sibs-navy"
                        />
                      </label>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center rounded-lg border border-sibs-border bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            handleMoveFieldGroup?.(group.section, -1)
                          }
                          disabled={groupIndex === 0}
                          className="inline-flex h-8 w-7 items-center justify-center text-sibs-grey-4 hover:text-sibs-navy disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move section up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMoveFieldGroup?.(group.section, 1)
                          }
                          disabled={groupIndex === groupedSections.length - 1}
                          className="inline-flex h-8 w-7 items-center justify-center text-sibs-grey-4 hover:text-sibs-navy disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move section down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => addFieldToSection(group.section)}
                        className="sibs-btn-primary inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold"
                      >
                        <Plus size={14} />
                        Add Field
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFieldGroup?.(group.section)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                        title="Delete section"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    {group.questions.map((field, fieldIndex) => (
                      <div
                        key={field.id}
                        className="rounded-xl border border-sibs-border bg-white p-3.5"
                      >
                        <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                          <div className="flex min-w-[240px] items-center gap-2.5">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sibs-navy text-xs font-bold text-white">
                              {fieldIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-sibs-navy">
                              Criteria Field #{fieldIndex + 1}
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                            <label className="flex items-center gap-2 text-xs font-semibold text-sibs-navy">
                              Type:
                              <select
                                defaultValue={field.type || "Rating"}
                                onBlur={(event) =>
                                  updateFieldOnBlur(field, {
                                    type: event.target.value,
                                  })
                                }
                                className="sibs-dashboard-input h-8 min-w-[150px] text-xs font-semibold text-sibs-navy bg-white cursor-pointer"
                              >
                                {typeOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-sibs-navy">
                              Scale:
                              <select className="sibs-dashboard-input h-8 min-w-[150px] text-xs font-semibold text-sibs-navy bg-white cursor-pointer">
                                <option>1 to 5 Scale</option>
                                <option>Pass / Fail</option>
                              </select>
                            </label>
                            <button
                              type="button"
                              onClick={() => openPreview()}
                              className="sibs-btn-secondary inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold text-sibs-navy"
                            >
                              <Sparkles size={13} className="text-sibs-orange" />
                              Quick Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteField?.(field.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sibs-grey-4 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete field"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <DraftRichTextEditor
                          id={`final-interview-criterion-${field.id}`}
                          value={field.label || ""}
                          onCommit={(html) =>
                            updateFieldOnBlur(field, { label: html })
                          }
                          placeholder="Enter the evaluation criterion or interview question."
                          minHeight={96}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addBlankSection}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sibs-border bg-white text-xs font-bold text-sibs-navy transition hover:border-sibs-orange hover:bg-orange-50/30"
              >
                <Plus size={15} className="text-sibs-orange" />
                Add New Evaluation Section
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-sibs-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setMode("table")}
                className="sibs-btn-secondary inline-flex h-10 items-center gap-2 px-4 text-xs font-bold text-sibs-navy"
              >
                <ArrowLeft size={15} />
                Done & Back to Table
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPreview()}
                  className="sibs-btn-secondary inline-flex h-10 items-center gap-2 px-4 text-xs font-bold text-sibs-navy"
                >
                  <Eye size={15} className="text-sibs-orange" />
                  Preview Live Form
                </button>
                <button
                  type="button"
                  onClick={() => void saveForm()}
                  disabled={saveBusy}
                  className="sibs-btn-primary inline-flex h-10 items-center gap-2 px-5 text-xs font-bold disabled:opacity-70"
                >
                  {saveBusy ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  Save Position Form
                </button>
              </div>
            </div>
          </section>
        </div>

        {questionsSaveError && (
          <p className="mt-3 text-xs font-bold text-rose-600">
            {questionsSaveError}
          </p>
        )}
      </div>

      <StatusModal
        open={manualSaveFeedback.type !== "idle"}
        type={
          manualSaveFeedback.type === "saving"
            ? "loading"
            : manualSaveFeedback.type
        }
        title={
          manualSaveFeedback.type === "saving"
            ? "Saving Form Settings"
            : manualSaveFeedback.type === "success"
              ? "Settings Saved"
              : "Save Failed"
        }
        message={manualSaveFeedback.message}
        variant="center"
        lockScroll
        onClose={() => setManualSaveFeedback({ type: "idle", message: "" })}
      />
    </div>
  );
}
