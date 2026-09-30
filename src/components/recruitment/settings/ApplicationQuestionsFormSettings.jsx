import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import {
  getApplicationFormByPosition,
  getApplicationForms,
  saveApplicationFormByPosition,
} from "../../../lib/axios/getRecruitmentSettings";
import { useRecruitmentSettings } from "../../../services/context/RecruitmentSettingsContext";
import StatusModal from "../../modals/StatusModal";
import RichTextEditor from "../../modals/jobDescription/RichTextEditor";
import RichTextViewer from "../../modals/jobDescription/RichTextViewer";
import { SelectDropdown, TablePagination, TableSkeletonRows } from "@/components/ui";

const TABLE_STATUS_OPTIONS = ["All", "Active", "Inactive", "Draft"];
const APPLICATION_FORMS_TABLE_PAGE_SIZE = 15;

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

function getPositionStatus(position = {}) {
  return asText(position.status, "Active");
}

function statusBadgeClass(status) {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Inactive") {
    return "border-rose-200 bg-rose-50 text-rose-600";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getApplicationFormName(position = {}) {
  return `${getPositionTitle(position)} - Application Screening Form`;
}

function getApiMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function createBlankQuestion(sectionId = "", overrides = {}) {
  return {
    id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    databaseId: null,
    clientQuestionId: `question-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sectionId,
    label: "",
    helperText: "",
    placeholderText: "",
    type: "Multi-line Paragraph",
    required: true,
    ...overrides,
  };
}

function normalizeQuestion(item = {}, index = 0) {
  return {
    id: String(item.id || item.databaseId || `question-${index}`),
    databaseId: item.databaseId || item.database_id || item.id || null,
    clientQuestionId: item.clientQuestionId || item.client_question_id || "",
    sectionId: item.sectionId || item.section_id || "",
    label:
      item.label ||
      item.optionLabel ||
      item.option_label ||
      item.questionLabel ||
      item.question_label ||
      item.value ||
      item.option_value ||
      "",
    helperText: item.helperText || item.helper_text || "",
    placeholderText: item.placeholderText || item.placeholder_text || "",
    type: item.type || item.questionType || item.question_type || "Text",
    required: Boolean(
      item.required ?? item.isRequired ?? item.is_required ?? true,
    ),
  };
}

function normalizeSection(item = {}, index = 0) {
  const fallbackId = `section-${index + 1}`;
  const sectionId =
    item.id || item.clientSectionId || item.client_section_id || fallbackId;
  const questions = Array.isArray(item.questions)
    ? item.questions
    : Array.isArray(item.fields)
      ? item.fields
      : [];
  const normalizedQuestions = questions.map(normalizeQuestion);

  return {
    id: sectionId,
    clientSectionId:
      item.clientSectionId || item.client_section_id || item.id || fallbackId,
    title:
      item.title || item.sectionTitle || item.section_title || `Section ${index + 1}`,
    description:
      item.description ||
      item.sectionDescription ||
      item.section_description ||
      "",
    questions: normalizedQuestions.length
      ? normalizedQuestions
      : [
          createBlankQuestion(sectionId, {
            label: "New application question",
          }),
        ],
  };
}

function dedupeApplicationSections(sections = []) {
  const seen = new Set();
  const orderedSections = [];

  sections.forEach((section) => {
    const key = String(
      section.clientSectionId ||
        section.client_section_id ||
        section.id ||
        section.title ||
        "",
    )
      .trim()
      .toLowerCase();

    if (!key || seen.has(key)) return;

    seen.add(key);
    orderedSections.push(section);
  });

  return orderedSections;
}

function getQuestionSignature(questions = []) {
  return JSON.stringify(
    questions.map((question) => ({
      id: question.clientQuestionId || question.id,
      label: String(question.label || "").trim(),
      helperText: String(question.helperText || "").trim(),
      placeholderText: String(question.placeholderText || "").trim(),
      type: question.type || "Multi-line Paragraph",
      required: question.required !== false,
    })),
  );
}

export default function ApplicationQuestionsFormSettings() {
  const {
    availablePositions,
    positionsLoading,
    positionsError,
    refreshAvailablePositions,
  } = useRecruitmentSettings();

  const [mode, setMode] = useState("table");
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [applicationForms, setApplicationForms] = useState([]);
  const [activeApplicationForm, setActiveApplicationForm] = useState(null);
  const [applicationSections, setApplicationSections] = useState([]);
  const [initialSignature, setInitialSignature] = useState("");
  const [collapsedSectionIds, setCollapsedSectionIds] = useState([]);
  const [previewQuestionId, setPreviewQuestionId] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [applicationFormsPage, setApplicationFormsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const questions = useMemo(
    () =>
      applicationSections.flatMap((section) =>
        Array.isArray(section.questions) ? section.questions : [],
      ),
    [applicationSections],
  );
  const currentSignature = useMemo(
    () => getQuestionSignature(questions),
    [questions],
  );

  const hasChanges = currentSignature !== initialSignature;
  const hasValidQuestion = questions.some((question) =>
    String(question.label || "").trim(),
  );
  const configuredCount = questions.filter((question) =>
    String(question.label || "").trim(),
  ).length;
  const allPositions = Array.isArray(availablePositions)
    ? availablePositions
    : [];
  const applicationFormsByPosition = useMemo(() => {
    const map = new Map();

    applicationForms.forEach((form) => {
      [
        form.availablePositionId,
        form.available_position_id,
        form.databasePositionId,
        form.database_position_id,
        form.id,
        form.positionId,
        form.position_id,
      ].forEach((value) => {
        const key = String(value || "").trim();
        if (key) map.set(key.toLowerCase(), form);
      });
    });

    return map;
  }, [applicationForms]);
  const positionsForApplicationForms = applicationForms.length
    ? applicationForms
    : allPositions;
  const configuredFormsCount =
    positionsForApplicationForms.length || allPositions.length;
  const filteredApplicationForms = useMemo(() => {
    const keyword = questionSearch.trim().toLowerCase();

    return positionsForApplicationForms.filter((position) => {
      const status = getPositionStatus(position);
      const statusMatch = statusFilter === "All" || status === statusFilter;

      if (!statusMatch) return false;
      if (!keyword) return true;

      return [
        getPositionTitle(position),
        getPositionCode(position),
        getPositionDepartment(position),
        getPositionSite(position),
        getApplicationFormName(position),
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [positionsForApplicationForms, questionSearch, statusFilter]);
  const selectedPosition =
    positionsForApplicationForms.find(
      (position) =>
        String(getPositionId(position)) === String(selectedPositionId),
    ) ||
    positionsForApplicationForms[0] ||
    {};
  const applicationFormsTotalPages = Math.max(
    1,
    Math.ceil(
      filteredApplicationForms.length / APPLICATION_FORMS_TABLE_PAGE_SIZE,
    ),
  );
  const applicationFormsPageRows = useMemo(() => {
    const safePage = Math.min(
      Math.max(applicationFormsPage, 1),
      applicationFormsTotalPages,
    );
    const startIndex = (safePage - 1) * APPLICATION_FORMS_TABLE_PAGE_SIZE;

    return filteredApplicationForms.slice(
      startIndex,
      startIndex + APPLICATION_FORMS_TABLE_PAGE_SIZE,
    );
  }, [
    applicationFormsPage,
    applicationFormsTotalPages,
    filteredApplicationForms,
  ]);
  const applicationFormsShowingStart = filteredApplicationForms.length
    ? (Math.min(Math.max(applicationFormsPage, 1), applicationFormsTotalPages) -
        1) *
        APPLICATION_FORMS_TABLE_PAGE_SIZE +
      1
    : 0;
  const applicationFormsShowingEnd = filteredApplicationForms.length
    ? Math.min(
        applicationFormsShowingStart + applicationFormsPageRows.length - 1,
        filteredApplicationForms.length,
      )
    : 0;

  const loadApplicationFormList = useCallback(async () => {
    try {
      const response = await getApplicationForms();
      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.forms)
          ? response.forms
          : [];

      setApplicationForms(rows);
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Application Forms Unavailable",
        message: getApiMessage(
          error,
          "Failed to load position-based application forms.",
        ),
      });
    }
  }, []);

  const loadApplicationFormForPosition = useCallback(async (positionId) => {
    if (!positionId) return;

    setLoading(true);

    try {
      const response = await getApplicationFormByPosition(positionId);
      const form = response?.data || null;
      const sections = dedupeApplicationSections(
        Array.isArray(form?.sections)
          ? form.sections.map(normalizeSection)
          : [],
      );
      const nextSections = sections;
      const nextQuestions = nextSections.flatMap((section) =>
        Array.isArray(section.questions) ? section.questions : [],
      );

      setActiveApplicationForm(form);
      setApplicationSections(nextSections);
      setInitialSignature(getQuestionSignature(nextQuestions));
      setCollapsedSectionIds([]);
      setPreviewQuestionId("");
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Application Form Unavailable",
        message: getApiMessage(
          error,
          "Failed to load the selected application form.",
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplicationFormList();
  }, [loadApplicationFormList]);

  useEffect(() => {
    setApplicationFormsPage(1);
  }, [questionSearch, statusFilter]);

  useEffect(() => {
    setApplicationFormsPage((previous) =>
      Math.min(previous, applicationFormsTotalPages),
    );
  }, [applicationFormsTotalPages]);

  function updateQuestion(id, changes) {
    const patch =
      typeof changes === "string" ? { label: changes } : changes || {};

    setApplicationSections((previous) =>
      previous.map((section) => ({
        ...section,
        questions: (section.questions || []).map((question) =>
          question.id === id || question.clientQuestionId === id
            ? {
                ...question,
                ...patch,
              }
            : question,
        ),
      })),
    );
  }

  function updateSection(id, changes) {
    setApplicationSections((previous) =>
      previous.map((section) =>
        section.id === id || section.clientSectionId === id
          ? { ...section, ...changes }
          : section,
      ),
    );
  }

  function addQuestion(sectionId) {
    const blankQuestion = {
      ...createBlankQuestion(sectionId),
      label: "New application question",
    };

    setApplicationSections((previous) =>
      previous.map((section) =>
        section.id === sectionId || section.clientSectionId === sectionId
          ? {
              ...section,
              questions: [...(section.questions || []), blankQuestion],
            }
          : section,
      ),
    );
    setCollapsedSectionIds((previous) =>
      previous.filter((collapsedId) => collapsedId !== sectionId),
    );
  }

  function removeQuestion(id) {
    setApplicationSections((previous) =>
      previous.map((section) => {
        const nextQuestions = (section.questions || []).filter(
          (question) => question.id !== id && question.clientQuestionId !== id,
        );

        return { ...section, questions: nextQuestions };
      }),
    );
    setPreviewQuestionId((previous) => (previous === id ? "" : previous));
  }

  function addSection(title = "New Application Section", description = "") {
    const sectionId = `section-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const question = createBlankQuestion(sectionId, {
      label: "New application question",
    });

    setApplicationSections((previous) => [
      ...previous,
      {
        id: sectionId,
        clientSectionId: sectionId,
        title,
        description,
        questions: [question],
      },
    ]);
  }

  function removeSection(id) {
    setApplicationSections((previous) =>
      previous.filter(
        (section) => section.id !== id && section.clientSectionId !== id,
      ),
    );
    setCollapsedSectionIds((previous) =>
      previous.filter((collapsedId) => collapsedId !== id),
    );
  }

  function moveSection(index, direction) {
    setApplicationSections((previous) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= previous.length) return previous;

      const next = [...previous];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function moveQuestion(sectionId, index, direction) {
    setApplicationSections((previous) =>
      previous.map((section) => {
        if (section.id !== sectionId && section.clientSectionId !== sectionId) {
          return section;
        }

        const nextQuestions = [...(section.questions || [])];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= nextQuestions.length) {
          return section;
        }

        [nextQuestions[index], nextQuestions[targetIndex]] = [
          nextQuestions[targetIndex],
          nextQuestions[index],
        ];
        return { ...section, questions: nextQuestions };
      }),
    );
  }

  function toggleSection(id) {
    setCollapsedSectionIds((previous) =>
      previous.includes(id)
        ? previous.filter((collapsedId) => collapsedId !== id)
        : [...previous, id],
    );
  }

  function openCandidatePortalPreview() {
    window.open(
      "/recruitment/talent-pool/apply",
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openEditor(position) {
    const positionId = getPositionId(position);
    setSelectedPositionId(positionId);
    setMode("editor");
    setQuestionSearch("");
    setStatusFilter("All");
    void loadApplicationFormForPosition(positionId);
  }

  async function handleSave() {
    const formName = String(
      activeApplicationForm?.formName ||
        activeApplicationForm?.form_name ||
        "",
    ).trim();

    if (!formName) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Form Name Required",
        message: "Enter a title for the application form before saving.",
      });
      return;
    }

    if (!hasValidQuestion) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Question Required",
        message: "Add at least one application question before saving.",
      });
      return;
    }

    setSaving(true);

    try {
      const payloadSections = dedupeApplicationSections(
        applicationSections.map((section) => ({
          id: section.id,
          clientSectionId: section.clientSectionId || section.id,
          title: section.title,
          description: section.description,
          questions: (section.questions || [])
            .filter((question) => String(question.label || "").trim())
            .map((question) => ({
              id: question.clientQuestionId || question.id,
              clientQuestionId: question.clientQuestionId || question.id,
              label: question.label,
              helperText: question.helperText,
              placeholderText: question.placeholderText,
              type: question.type,
              required: question.required !== false,
            })),
        })),
      );

      const response = await saveApplicationFormByPosition(
        getPositionId(selectedPosition),
        {
          formName,
          status: activeApplicationForm?.status || "Active",
          benchmark:
            activeApplicationForm?.benchmark ||
            "35 WPM • Voice Prompt Required",
          description:
            activeApplicationForm?.description ||
            "Application screening form evaluating verbal English clarity, active listening, customer empathy, and operational night shift readiness.",
          sections: payloadSections,
        },
      );
      const form = response?.data || null;
      const savedSections = dedupeApplicationSections(
        Array.isArray(form?.sections)
          ? form.sections.map(normalizeSection)
          : applicationSections,
      );
      const savedQuestions = savedSections.flatMap((section) =>
        Array.isArray(section.questions) ? section.questions : [],
      );

      setActiveApplicationForm(form);
      setApplicationSections(savedSections);
      setInitialSignature(getQuestionSignature(savedQuestions));
      void loadApplicationFormList();
      setStatusModal({
        open: true,
        type: "success",
        title: "Questions Saved",
        message:
          "The public Talent Pool application questions were updated successfully.",
      });
    } catch (error) {
      setStatusModal({
        open: true,
        type: "error",
        title: "Save Failed",
        message: getApiMessage(
          error,
          "Failed to save the public application questions.",
        ),
      });
    } finally {
      setSaving(false);
    }
  }

  if (mode === "table") {
    return (
      <div className="sibs-card overflow-hidden font-jakarta">
        <div className="border-b border-sibs-border p-4 sm:p-5 2xl:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-heading text-sm sm:text-base 2xl:text-lg font-bold text-sibs-navy tracking-tight">
                Position-based Application Forms
              </h3>
              <p className="mt-1 sibs-text-xs 2xl:text-sm font-semibold text-sibs-muted">
                Manage position candidate application intake forms, pre-screening
                questions, voice audio prompts, and intake requirements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 font-jakarta text-[10px] 2xl:text-[10.5px] font-extrabold uppercase tracking-wide text-sibs-navy">
                {configuredFormsCount} Records
              </span>
              <button
                type="button"
                onClick={openCandidatePortalPreview}
                className="sibs-btn-primary inline-flex h-9 items-center justify-center gap-2 px-3 text-xs font-bold"
              >
                <Eye size={14} />
                Preview Candidate Portal
              </button>
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
                    value={questionSearch}
                    onChange={(event) => setQuestionSearch(event.target.value)}
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
                    setApplicationFormsPage(1);
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
                  setQuestionSearch("");
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
                      Questions
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
                  {applicationFormsPageRows.map((position) => {
                    const savedForm =
                      [
                        position.availablePositionId,
                        position.available_position_id,
                        position.databasePositionId,
                        position.database_position_id,
                        getPositionId(position),
                        getPositionCode(position),
                      ]
                        .map((value) =>
                          String(value || "")
                            .trim()
                            .toLowerCase(),
                        )
                        .filter(Boolean)
                        .map((key) => applicationFormsByPosition.get(key))
                        .find(Boolean) || null;
                    const status =
                      savedForm?.status || getPositionStatus(position);
                    const jdReference =
                      savedForm?.jdCode ||
                      savedForm?.jd_code ||
                      getPositionJdCode(position);

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
                            {savedForm?.formName ||
                              savedForm?.form_name ||
                              getApplicationFormName(position)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-lg border border-sibs-border bg-sibs-surface px-2.5 py-0.5 text-xs font-bold text-sibs-navy">
                            {Number(
                              savedForm?.questionCount ||
                                savedForm?.question_count ||
                                0,
                            )}{" "}
                            Fields
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
                              openCandidatePortalPreview();
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sibs-grey-4 transition hover:bg-sibs-surface hover:text-sibs-navy"
                            title="Preview candidate portal"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {positionsLoading && !filteredApplicationForms.length && (
                    <TableSkeletonRows count={5} columns={7} />
                  )}

                  {!positionsLoading && !filteredApplicationForms.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <p className="text-xs font-bold text-sibs-grey-4">
                          No application forms match the selected filters.
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
            currentPage={applicationFormsPage}
            totalPages={applicationFormsTotalPages}
            totalRecords={filteredApplicationForms.length}
            loadedCount={applicationFormsPageRows.length}
            recordLabel="application form records"
            onPageChange={setApplicationFormsPage}
          />
        </div>

        <StatusModal
          open={statusModal.open}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          variant="center"
          onClose={() =>
            setStatusModal((previous) => ({ ...previous, open: false }))
          }
        />
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
              Position-based Application Forms
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
                Application Form Builder
              </span>
              <span className="inline-flex rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase text-sibs-orange">
                {getPositionCode(selectedPosition)}
              </span>
            </div>
            <h3 className="font-heading max-w-4xl truncate text-xl sm:text-2xl font-bold uppercase leading-tight text-sibs-navy tracking-tight">
              {getPositionTitle(selectedPosition)}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-sibs-grey-4">
              Configure this position's public Talent Pool screening questions,
              voice prompts, and intake requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <button
              type="button"
              onClick={() =>
                void loadApplicationFormForPosition(
                  getPositionId(selectedPosition),
                )
              }
              disabled={loading || saving}
              className="sibs-btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-xl p-0 text-sibs-navy disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh questions"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={openCandidatePortalPreview}
              className="sibs-btn-secondary inline-flex h-10 items-center justify-center gap-2 px-4 text-xs font-bold text-sibs-navy"
            >
              <Eye size={14} className="text-sibs-orange" />
              Test Candidate Portal
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading || saving || !hasValidQuestion}
              title={hasChanges ? "Save form changes" : "Save form"}
              className="sibs-btn-primary inline-flex h-10 items-center justify-center gap-2 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
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
                APPLICATION FORM SUMMARY
              </p>
              <p className="mt-0.5 text-xs text-sibs-grey-4">
                Review the selected position before editing its public application form.
              </p>
            </div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${statusBadgeClass(
                activeApplicationForm?.status || "Active",
              )}`}
            >
              {activeApplicationForm?.status || "Active"}
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5">
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
            <div className="min-w-0 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase text-sibs-grey-4">
                Questions
              </p>
              <p className="mt-1 text-base font-bold tabular-nums text-sibs-navy">
                {configuredCount}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-sibs-border bg-sibs-surface px-3.5 py-2.5">
              <p className="text-[10px] font-bold uppercase text-sibs-grey-4">
                JD Reference
              </p>
              <p className="mt-1 truncate text-xs font-bold text-sibs-navy">
                {activeApplicationForm?.jdCode ||
                  activeApplicationForm?.jd_code ||
                  getPositionJdCode(selectedPosition) ||
                  "Not linked"}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-xl border border-sibs-border bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between border-b border-sibs-border pb-3">
            <div>
              <h4 className="font-heading text-sm sm:text-base font-bold text-sibs-navy tracking-tight">
                Form Basic Information & Portal Settings
              </h4>
              <p className="text-xs text-sibs-grey-4">
                Configure the application form details shown to candidates.
              </p>
            </div>
            <p className="text-xs font-semibold text-sibs-grey-4">
              Position Code: {getPositionCode(selectedPosition)}
              {activeApplicationForm?.jdCode || activeApplicationForm?.jd_code
                ? ` • JD: ${
                    activeApplicationForm?.jdCode ||
                    activeApplicationForm?.jd_code
                  }`
                : ""}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <label className="block">
              <span className="text-xs font-bold text-sibs-navy">
                Form Name <span className="text-rose-500">*</span>
              </span>
              <input
                value={
                  activeApplicationForm?.formName ||
                  activeApplicationForm?.form_name ||
                  ""
                }
                onChange={(event) =>
                  setActiveApplicationForm((previous) => ({
                    ...(previous || {}),
                    formName: event.target.value,
                    form_name: event.target.value,
                  }))
                }
                placeholder={`${getPositionTitle(selectedPosition)} - Application Intake Form`}
                className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm text-sibs-navy placeholder:text-sibs-grey-3"
              />
              <span className="mt-1 block text-xs text-sibs-grey-4">
                Name displayed at the top of the candidate application portal.
              </span>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-sibs-navy">
                Form Status
              </span>
              <select
                value={
                  activeApplicationForm?.status === "Draft"
                    ? "Draft"
                    : activeApplicationForm?.status === "Inactive"
                      ? "Inactive"
                      : "Active (Accepting Applicants)"
                }
                onChange={() => {}}
                className="sibs-dashboard-input mt-1.5 h-10 w-full text-xs sm:text-sm font-semibold text-sibs-navy bg-white cursor-pointer"
              >
                <option>Active (Accepting Applicants)</option>
                <option>Draft</option>
                <option>Inactive</option>
              </select>
              <span className="mt-1 block text-xs text-sibs-grey-4">
                Only "Active" forms are accessible to job seekers.
              </span>
            </label>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-sibs-navy">Candidate Directives / Overview</p>
            <div className="mt-1.5">
              <DraftRichTextEditor
                key={`application-overview-${getPositionId(selectedPosition)}`}
                id="application-form-candidate-directives"
                value={activeApplicationForm?.description || ""}
                onCommit={(html) =>
                  setActiveApplicationForm((previous) => ({
                    ...(previous || {}),
                    description: html,
                  }))
                }
                placeholder="Describe the application screening instructions shown to candidates."
                minHeight={96}
              />
            </div>
            <span className="mt-1 block text-xs text-sibs-grey-4">
              Instructions visible to applicants before filling out the form.
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-sibs-border bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-sibs-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-heading text-sm sm:text-base font-bold text-sibs-navy tracking-tight">
                Configure Questions & Input Types
              </h4>
              <p className="text-xs text-sibs-grey-4">
                {applicationSections.length} Sections • {questions.length} Question Fields
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCollapsedSectionIds([])}
                className="sibs-btn-secondary inline-flex h-9 items-center px-3 text-xs font-semibold text-sibs-navy"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() =>
                  setCollapsedSectionIds(
                    applicationSections.map(
                      (section) => section.clientSectionId || section.id,
                    ),
                  )
                }
                className="sibs-btn-secondary inline-flex h-9 items-center px-3 text-xs font-semibold text-sibs-navy"
              >
                Collapse All
              </button>
              <button
                type="button"
                onClick={openCandidatePortalPreview}
                className="sibs-btn-secondary inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold text-sibs-navy"
              >
                <Eye size={14} className="text-sibs-orange" />
                Test Form
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {applicationSections.map((section, index) => {
              const sectionId = section.clientSectionId || section.id;
              const collapsed = collapsedSectionIds.includes(sectionId);

              return (
                <div
                  key={section.id}
                  className="overflow-hidden rounded-xl border border-sibs-border bg-white"
                >
                  <div className="flex flex-col gap-3 border-b border-sibs-border bg-sibs-surface px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sibs-orange text-xs font-bold text-white">
                        S{index + 1}
                      </span>
                      <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs sm:text-sm font-bold text-sibs-navy">
                        <span className="shrink-0">{index + 1}.</span>
                        <input
                          value={section.title || ""}
                          onChange={(event) =>
                            updateSection(sectionId, {
                              title: event.target.value,
                            })
                          }
                          aria-label={`Section ${index + 1} title`}
                          className="sibs-dashboard-input h-9 min-w-0 flex-1 text-xs sm:text-sm font-bold uppercase text-sibs-navy"
                        />
                      </label>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center rounded-lg border border-sibs-border bg-white">
                        <button
                          type="button"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          className="inline-flex h-8 w-7 items-center justify-center text-sibs-grey-4 hover:text-sibs-navy disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move section up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === applicationSections.length - 1}
                          className="inline-flex h-8 w-7 items-center justify-center text-sibs-grey-4 hover:text-sibs-navy disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move section down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionId)}
                        className="sibs-btn-secondary inline-flex h-8 w-9 items-center justify-center p-0 text-sibs-grey-4"
                        title={
                          collapsed ? "Expand section" : "Collapse section"
                        }
                      >
                        {collapsed ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronUp size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion(sectionId)}
                        className="sibs-btn-primary inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold"
                      >
                        <Plus size={14} />
                        Add Field
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(sectionId)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                        title="Delete section"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {!collapsed && (
                    <div className="space-y-3 p-4">
                      {(section.questions || []).map(
                        (question, questionIndex) => (
                          <div
                            key={question.id}
                            className="rounded-xl border border-sibs-border bg-white p-3.5"
                          >
                            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                              <div className="flex min-w-[240px] items-center gap-2.5">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sibs-navy text-xs font-bold text-white">
                                  {questionIndex + 1}
                                </span>
                                <span className="text-xs font-bold text-sibs-navy">
                                  {section.title} Field #{questionIndex + 1}
                                </span>
                                <div className="flex items-center rounded-lg border border-sibs-border bg-sibs-surface">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveQuestion(sectionId, questionIndex, -1)
                                    }
                                    disabled={questionIndex === 0}
                                    className="inline-flex h-7 w-7 items-center justify-center text-sibs-grey-4 hover:text-sibs-navy disabled:cursor-not-allowed disabled:opacity-30"
                                    title="Move field up"
                                  >
                                    <ChevronUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveQuestion(sectionId, questionIndex, 1)
                                    }
                                    disabled={
                                      questionIndex ===
                                      (section.questions || []).length - 1
                                    }
                                    className="inline-flex h-7 w-7 items-center justify-center text-sibs-grey-4 hover:text-sibs-navy disabled:cursor-not-allowed disabled:opacity-30"
                                    title="Move field down"
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <label className="flex items-center gap-2 text-xs font-semibold text-sibs-navy">
                                  Type:
                                  <select
                                    value={
                                      question.type || "Multi-line Paragraph"
                                    }
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        type: event.target.value,
                                      })
                                    }
                                    className="sibs-dashboard-input h-8 min-w-[170px] text-xs font-semibold text-sibs-navy bg-white cursor-pointer"
                                  >
                                    <option>Multi-line Paragraph</option>
                                    <option>Single Line Text</option>
                                    <option>Voice Record</option>
                                    <option>File Upload</option>
                                    <option>Yes/No</option>
                                  </select>
                                </label>
                                <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-sibs-border bg-white px-2.5 text-xs font-semibold text-sibs-navy cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={question.required !== false}
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        required: event.target.checked,
                                      })
                                    }
                                    className="rounded border-sibs-border text-sibs-primary-1 focus:ring-sibs-primary-1"
                                  />
                                  Required
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewQuestionId((previous) =>
                                      previous === question.id
                                        ? ""
                                        : question.id,
                                    )
                                  }
                                  className="sibs-btn-secondary inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-semibold text-sibs-navy"
                                >
                                  <Sparkles
                                    size={13}
                                    className="text-sibs-orange"
                                  />
                                  Quick Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(question.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sibs-grey-4 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="Delete field"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] font-bold uppercase text-sibs-navy">
                              Question Prompt / Field Label
                              <div className="mt-1 normal-case">
                                <DraftRichTextEditor
                                  id={`application-question-${question.id}`}
                                  value={question.label || ""}
                                  onCommit={(html) =>
                                    updateQuestion(question.id, {
                                      label: html,
                                    })
                                  }
                                  placeholder="Enter the application question prompt."
                                  minHeight={84}
                                />
                              </div>
                            </div>
                            <div className="mt-3 grid gap-3 lg:grid-cols-2">
                              <label className="text-[11px] font-bold uppercase text-sibs-navy">
                                Sublabel / Helper Text (Optional)
                                <input
                                  value={question.helperText || ""}
                                  onChange={(event) =>
                                    updateQuestion(question.id, {
                                      helperText: event.target.value,
                                    })
                                  }
                                  className="sibs-dashboard-input mt-1 h-9 w-full text-xs font-medium text-sibs-navy"
                                />
                              </label>
                              <label className="text-[11px] font-bold uppercase text-sibs-navy">
                                Placeholder / Sample (Optional)
                                <input
                                  value={question.placeholderText || ""}
                                  onChange={(event) =>
                                    updateQuestion(question.id, {
                                      placeholderText: event.target.value,
                                    })
                                  }
                                  placeholder="e.g. Juan Dela Cruz"
                                  className="sibs-dashboard-input mt-1 h-9 w-full text-xs font-medium text-sibs-navy placeholder:text-sibs-grey-3"
                                />
                              </label>
                            </div>
                            {previewQuestionId === question.id && (
                              <div className="mt-3 rounded-xl border border-dashed border-sibs-border bg-sibs-surface p-3.5">
                                <div className="text-xs font-bold text-sibs-navy">
                                  <RichTextViewer
                                    value={question.label}
                                    emptyText="Untitled question"
                                    className="text-sibs-navy"
                                  />
                                  {question.required !== false && (
                                    <span className="ml-1 text-sibs-orange">
                                      *
                                    </span>
                                  )}
                                </div>
                                {question.helperText && (
                                  <p className="mt-1 text-xs text-sibs-grey-4">
                                    {question.helperText}
                                  </p>
                                )}
                                <div className="mt-2.5 h-9 rounded-lg border border-sibs-border bg-white px-3 py-2 text-xs text-sibs-grey-3">
                                  {question.placeholderText || question.type}
                                </div>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                      {!(section.questions || []).length && (
                        <button
                          type="button"
                          onClick={() => addQuestion(sectionId)}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sibs-border bg-white text-xs font-bold text-sibs-navy hover:border-sibs-orange hover:bg-orange-50/30 transition"
                        >
                          <Plus size={14} className="text-sibs-orange" />
                          Add First Field
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => addSection()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sibs-border bg-white text-xs font-bold text-sibs-navy transition hover:border-sibs-orange hover:bg-orange-50/30"
            >
              <Plus size={15} className="text-sibs-orange" />
              Add New Application Section
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-sibs-border pt-4 sm:flex-row sm:items-center sm:justify-between">
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
                onClick={openCandidatePortalPreview}
                className="sibs-btn-secondary inline-flex h-10 items-center gap-2 px-4 text-xs font-bold text-sibs-navy"
              >
                <Eye size={15} className="text-sibs-orange" />
                Preview Live Form
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !hasValidQuestion}
                title={hasChanges ? "Save form changes" : "Save form"}
                className="sibs-btn-primary inline-flex h-10 items-center gap-2 px-5 text-xs font-bold disabled:opacity-70"
              >
                {saving ? (
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

      <StatusModal
        open={statusModal.open}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        variant="center"
        onClose={() =>
          setStatusModal((previous) => ({ ...previous, open: false }))
        }
      />
    </div>
  );
}
