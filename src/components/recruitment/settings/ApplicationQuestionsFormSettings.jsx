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
import SettingsHeaderCapsules from "./SettingsHeaderCapsules";

const TABLE_STATUS_OPTIONS = ["All", "Active", "Inactive", "Draft"];
const APPLICATION_FORMS_TABLE_PAGE_SIZE = 6;

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
    return "border-red-200 bg-red-50 text-red-600";
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
      <div className="relative z-[80] overflow-visible rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <SettingsHeaderCapsules
              items={[
                {
                  label:
                    "Create & Edit Application Screening Questionnaire Forms",
                  icon: PenLine,
                },
              ]}
            />

            <h3 className="mt-3 text-base font-extrabold text-sibs-primary-1">
              Position-based Application Forms
            </h3>
            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
              Manage position candidate application intake forms, pre-screening
              questions, voice audio prompts, and intake requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit rounded-full border border-[#D9E9F8] bg-[#F2F7FC] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
              {configuredFormsCount} Records
            </span>
            <button
              type="button"
              onClick={openCandidatePortalPreview}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white transition hover:bg-[#E64E1D]"
            >
              <Eye size={15} />
              Preview Candidate Portal
            </button>
            <button
              type="button"
              onClick={() => refreshAvailablePositions?.()}
              disabled={positionsLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F6FA] text-sibs-primary-1 transition hover:bg-[#E8EEF5] disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh forms"
            >
              <RefreshCw
                size={16}
                className={positionsLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 border-b border-[#E6ECF2] pb-5 xl:grid-cols-[minmax(280px,1fr)_minmax(220px,260px)_auto] xl:items-end">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#101828]">
              Search
            </label>
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sibs-tertiary-5"
              />
              <input
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#D6DEE8] bg-white px-4 pl-11 text-xs font-semibold text-sibs-primary-1 outline-none transition placeholder:text-sibs-tertiary-5 focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
                placeholder="Search forms by role title, position code, department..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#101828]">
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 w-full appearance-none rounded-[10px] border border-[#D6DEE8] bg-white px-4 pr-10 text-xs font-extrabold text-sibs-primary-1 outline-none transition hover:border-[#BFD8F1] focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
              >
                {TABLE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Status" : status}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sibs-primary-1"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setQuestionSearch("");
              setStatusFilter("All");
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-extrabold text-sibs-tertiary-5 transition-all duration-200 hover:border-[#FF5C28]/30 hover:bg-white hover:text-sibs-primary-1 active:scale-[0.98]"
          >
            <Filter size={17} />
            Clear
          </button>
        </div>

        {positionsError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
            {positionsError}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-left text-[11px] font-extrabold uppercase tracking-normal text-[#667085]">
                  <th className="px-5 py-4">Position Title & Code</th>
                  <th className="px-5 py-4">Department & Site</th>
                  <th className="px-5 py-4">Form Name</th>
                  <th className="px-5 py-4">Questions</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECF2]">
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
                      className="cursor-pointer bg-white text-xs outline-none transition hover:bg-[#F8FAFC] focus:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FF5C28]" />
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-xs font-extrabold text-sibs-primary-1">
                              {getPositionTitle(position)}
                            </p>
                            <p className="mt-1 text-[11px] font-bold text-sibs-tertiary-5">
                              {getPositionCode(position)}
                            </p>
                            {jdReference && (
                              <p className="mt-0.5 text-[11px] font-extrabold text-[#FF5C28]">
                                JD: {jdReference}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-extrabold text-sibs-primary-1">
                          {getPositionDepartment(position)}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-[#667085]">
                          {getPositionSite(position)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[260px] truncate text-xs font-semibold text-sibs-primary-1">
                          {savedForm?.formName ||
                            savedForm?.form_name ||
                            getApplicationFormName(position)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-[#F1F5F9] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                          {Number(
                            savedForm?.questionCount ||
                              savedForm?.question_count ||
                              0,
                          )}{" "}
                          Fields
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold uppercase ${statusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openCandidatePortalPreview();
                            }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sibs-tertiary-5 transition hover:bg-[#F1F7FD] hover:text-sibs-primary-1"
                            title="Preview candidate portal"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {positionsLoading && !filteredApplicationForms.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="inline-flex items-center gap-2 text-sm font-extrabold text-sibs-primary-1">
                        <Loader2 size={18} className="animate-spin" />
                        Loading application forms...
                      </div>
                    </td>
                  </tr>
                )}

                {!positionsLoading && !filteredApplicationForms.length && (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <p className="text-sm font-extrabold text-sibs-tertiary-5">
                        No application forms match the selected filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-[#E6ECF2] px-6 py-5 md:flex-row md:items-center">
            <p className="text-xs font-semibold text-sibs-tertiary-5">
              Showing {applicationFormsShowingStart} to{" "}
              {applicationFormsShowingEnd} of {filteredApplicationForms.length}{" "}
              application form records
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setApplicationFormsPage((page) => Math.max(page - 1, 1))
                }
                disabled={applicationFormsPage <= 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 text-xs font-extrabold text-sibs-tertiary-5 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              {Array.from(
                { length: applicationFormsTotalPages },
                (_, index) => index + 1,
              )
                .slice(0, 7)
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setApplicationFormsPage(page)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-xs font-extrabold transition active:scale-[0.98] ${
                      applicationFormsPage === page
                        ? "bg-[#FF5C28] text-white shadow-sm"
                        : "border border-[#E6ECF2] bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

              <button
                type="button"
                onClick={() =>
                  setApplicationFormsPage((page) =>
                    Math.min(page + 1, applicationFormsTotalPages),
                  )
                }
                disabled={applicationFormsPage >= applicationFormsTotalPages}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#BFD8F1] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
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
    <div className="overflow-hidden rounded-2xl border border-[#E6ECF2] bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-[#E6ECF2] pb-5">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E6ECF2] pb-3">
          <button
            type="button"
            onClick={() => setMode("table")}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#D6DEE8] bg-white px-3 text-[11px] font-extrabold text-sibs-primary-1 transition hover:border-[#BFD8F1] hover:bg-[#F8FAFC]"
          >
            <ArrowLeft size={14} className="text-[#FF5C28]" />
            Back to Forms
          </button>
          <span className="hidden h-5 w-px bg-[#D6DEE8] sm:inline-flex" />
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-extrabold text-sibs-tertiary-5">
            <button
              type="button"
              onClick={() => setMode("table")}
              className="rounded px-1 py-0.5 text-sibs-primary-1 transition hover:bg-[#F2F7FC] hover:text-[#FF5C28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD8F1]"
            >
              Settings
            </button>
            <span className="text-[#B8C3D2]">/</span>
            <button
              type="button"
              onClick={() => setMode("table")}
              className="rounded px-1 py-0.5 text-sibs-primary-1 transition hover:bg-[#F2F7FC] hover:text-[#FF5C28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFD8F1]"
            >
              Position-based Application Forms
            </button>
            <span className="text-[#B8C3D2]">/</span>
            <span className="inline-flex max-w-[240px] items-center rounded-md border border-[#D9E9F8] bg-[#F2F7FC] px-2.5 py-1 text-[10px] font-extrabold text-sibs-primary-1">
              <span className="truncate">
                {getPositionTitle(selectedPosition)}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D9E9F8] bg-[#F2F7FC] px-2.5 py-1 text-[10px] font-extrabold uppercase text-sibs-primary-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5C28]" />
                Application Form Builder
              </span>
              <span className="inline-flex rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#FF5C28]">
                {getPositionCode(selectedPosition)}
              </span>
            </div>
            <h3 className="max-w-4xl truncate text-2xl font-extrabold uppercase leading-tight text-sibs-primary-1">
              {getPositionTitle(selectedPosition)}
            </h3>
            <p className="mt-1 text-[12px] font-medium leading-5 text-[#667085]">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#DCE6F1] bg-white text-sibs-primary-1 transition hover:border-[#BFD8F1] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              title="Refresh questions"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={openCandidatePortalPreview}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#D6DEE8] bg-white px-4 text-[11px] font-extrabold text-sibs-primary-1 transition hover:border-[#BFD8F1] hover:bg-[#F8FAFC]"
            >
              <Eye size={14} className="text-[#FF5C28]" />
              Test Candidate Portal
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading || saving || !hasValidQuestion}
              title={hasChanges ? "Save form changes" : "Save form"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-sibs-primary-1 px-4 text-[11px] font-extrabold text-white transition hover:bg-sibs-primary-1/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} className="text-[#FF5C28]" />
              )}
              Save Form
            </button>
          </div>
        </div>
      </div>

      <section className="mb-5 rounded-xl border border-[#E6ECF2] bg-white p-3.5">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#EDF1F5] pb-2.5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#52637A]">
              APPLICATION FORM SUMMARY
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[#8A98B8]">
              Review the selected position before editing its public application
              form.
            </p>
          </div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${statusBadgeClass(
              activeApplicationForm?.status || "Active",
            )}`}
          >
            {activeApplicationForm?.status || "Active"}
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">
              Position Title
            </p>
            <p className="mt-1 truncate text-xs font-extrabold text-sibs-primary-1">
              {getPositionTitle(selectedPosition)}
            </p>
            <p className="mt-1 text-[11px] font-extrabold text-[#FF5C28]">
              {getPositionCode(selectedPosition)}
            </p>
          </div>
          <div className="min-w-0 rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">
              Department / Site
            </p>
            <p className="mt-1 truncate text-xs font-extrabold text-sibs-primary-1">
              {getPositionDepartment(selectedPosition)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#667085]">
              {getPositionSite(selectedPosition)}
            </p>
          </div>
          <div className="min-w-0 rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">
              Questions
            </p>
            <p className="mt-1 text-lg font-extrabold text-sibs-primary-1">
              {configuredCount}
            </p>
          </div>
          <div className="min-w-0 rounded-[10px] border border-[#E6ECF2] bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-[9px] font-extrabold uppercase text-[#8A98B8]">
              JD Reference
            </p>
            <p className="mt-1 truncate text-xs font-extrabold text-sibs-primary-1">
              {activeApplicationForm?.jdCode ||
                activeApplicationForm?.jd_code ||
                getPositionJdCode(selectedPosition) ||
                "Not linked"}
            </p>
          </div>
        </div>
      </section>
      <section className="mb-5 rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between border-b border-[#E6ECF2] pb-4">
            <div>
              <h4 className="text-sm font-extrabold text-sibs-primary-1">
                Form Basic Information & Portal Settings
              </h4>
              <p className="text-xs font-medium text-[#475467]">
                Configure the application form details shown to candidates.
              </p>
            </div>
            <p className="text-xs font-semibold text-sibs-tertiary-5">
              Position Code: {getPositionCode(selectedPosition)}
              {activeApplicationForm?.jdCode || activeApplicationForm?.jd_code
                ? ` • JD: ${
                    activeApplicationForm?.jdCode ||
                    activeApplicationForm?.jd_code
                  }`
                : ""}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <label className="text-xs font-extrabold text-sibs-primary-1">
              Form Name <span className="text-[#FF5C28]">*</span>
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
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-bold text-sibs-primary-1 outline-none focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
              />
              <span className="mt-1 block text-[11px] font-medium text-sibs-tertiary-5">
                Name displayed at the top of the candidate application portal.
              </span>
            </label>
            <label className="text-xs font-extrabold text-sibs-primary-1">
              Form Status
              <select
                value={
                  activeApplicationForm?.status === "Draft"
                    ? "Draft"
                    : activeApplicationForm?.status === "Inactive"
                      ? "Inactive"
                      : "Active (Accepting Applicants)"
                }
                onChange={() => {}}
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-bold text-sibs-primary-1 outline-none"
              >
                <option>Active (Accepting Applicants)</option>
                <option>Draft</option>
                <option>Inactive</option>
              </select>
              <span className="mt-1 block text-[11px] font-medium text-sibs-tertiary-5">
                Only "Active" forms are accessible to job seekers.
              </span>
            </label>
          </div>
          <div className="mt-4 text-xs font-extrabold text-sibs-primary-1">
            <p>Candidate Directives / Overview</p>
            <div className="mt-2">
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
              <span className="mt-1 block text-[11px] font-medium text-sibs-tertiary-5">
                Instructions visible to applicants before filling out the form.
              </span>
          </div>
      </section>

      <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 border-b border-[#E6ECF2] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-extrabold uppercase text-sibs-primary-1">
                Configure Questions & Input Types
              </h4>
              <p className="text-xs font-medium text-[#475467]">
                {applicationSections.length} Sections • {questions.length}{" "}
                Question Fields
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCollapsedSectionIds([])}
                className="h-9 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1"
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
                className="h-9 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1"
              >
                Collapse All
              </button>
              <button
                type="button"
                onClick={openCandidatePortalPreview}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-xs font-extrabold text-white"
              >
                <Eye size={15} className="text-[#FF5C28]" />
                Test Form
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {applicationSections.map((section, index) => {
              const sectionId = section.clientSectionId || section.id;
              const collapsed = collapsedSectionIds.includes(sectionId);

              return (
                <div
                  key={section.id}
                  className="overflow-hidden rounded-xl border border-[#D9E2EC] bg-white"
                >
                  <div className="flex flex-col gap-3 border-b border-[#E6ECF2] bg-[#F8FAFC] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-xs font-extrabold text-white">
                        S{index + 1}
                      </span>
                      <label className="flex min-w-0 flex-1 items-center gap-1 text-[13px] font-extrabold text-sibs-primary-1">
                        <span className="shrink-0">{index + 1}.</span>
                        <input
                          value={section.title || ""}
                          onChange={(event) =>
                            updateSection(sectionId, {
                              title: event.target.value,
                            })
                          }
                          aria-label={`Section ${index + 1} title`}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-[#D6DEE8] bg-white px-3 text-[13px] font-extrabold uppercase text-sibs-primary-1 outline-none transition hover:border-[#B8C7D9] focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
                        />
                      </label>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center rounded-[9px] border border-[#D6DEE8] bg-white">
                        <button
                          type="button"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          className="inline-flex h-8 w-7 items-center justify-center text-[#667085] disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move section up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === applicationSections.length - 1}
                          className="inline-flex h-8 w-7 items-center justify-center text-[#667085] disabled:cursor-not-allowed disabled:opacity-30"
                          title="Move section down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionId)}
                        className="inline-flex h-8 w-10 items-center justify-center rounded-[9px] border border-[#D6DEE8] bg-white text-[#667085]"
                        title={
                          collapsed ? "Expand section" : "Collapse section"
                        }
                      >
                        {collapsed ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronUp size={15} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => addQuestion(sectionId)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#FF5C28] px-3 text-[10px] font-extrabold text-white"
                      >
                        <Plus size={15} />
                        Add Field
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(sectionId)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-red-500 transition hover:bg-red-50"
                        title="Delete section"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {!collapsed && (
                    <div className="space-y-3 p-5">
                      {(section.questions || []).map(
                        (question, questionIndex) => (
                          <div
                            key={question.id}
                            className="rounded-2xl border border-[#D9E2EC] bg-white p-4"
                          >
                            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                              <div className="flex min-w-[260px] items-center gap-3">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sibs-primary-1 text-xs font-extrabold text-white">
                                  {questionIndex + 1}
                                </span>
                                <span className="text-xs font-extrabold text-sibs-primary-1">
                                  {section.title} Field #{questionIndex + 1}
                                </span>
                                <div className="flex items-center rounded-lg border border-[#D6DEE8] bg-[#F1F5F9]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      moveQuestion(sectionId, questionIndex, -1)
                                    }
                                    disabled={questionIndex === 0}
                                    className="inline-flex h-7 w-7 items-center justify-center text-sibs-tertiary-5 disabled:cursor-not-allowed disabled:opacity-30"
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
                                    className="inline-flex h-7 w-7 items-center justify-center text-sibs-tertiary-5 disabled:cursor-not-allowed disabled:opacity-30"
                                    title="Move field down"
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <label className="flex items-center gap-2 text-xs font-bold text-sibs-tertiary-5">
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
                                    className="h-9 min-w-[170px] rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 outline-none"
                                  >
                                    <option>Multi-line Paragraph</option>
                                    <option>Single Line Text</option>
                                    <option>Voice Record</option>
                                    <option>File Upload</option>
                                    <option>Yes/No</option>
                                  </select>
                                </label>
                                <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1">
                                  <input
                                    type="checkbox"
                                    checked={question.required !== false}
                                    onChange={(event) =>
                                      updateQuestion(question.id, {
                                        required: event.target.checked,
                                      })
                                    }
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
                                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#F1F5F9] px-3 text-xs font-extrabold text-sibs-primary-1"
                                >
                                  <Sparkles
                                    size={14}
                                    className="text-[#FF5C28]"
                                  />
                                  Quick Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(question.id)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sibs-tertiary-5 hover:bg-red-50 hover:text-red-600"
                                  title="Delete field"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
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
                              <label className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                                Sublabel / Helper Text (Optional)
                                <input
                                  value={question.helperText || ""}
                                  onChange={(event) =>
                                    updateQuestion(question.id, {
                                      helperText: event.target.value,
                                    })
                                  }
                                  className="mt-1 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-semibold text-sibs-primary-1 outline-none"
                                />
                              </label>
                              <label className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                                Placeholder / Sample (Optional)
                                <input
                                  value={question.placeholderText || ""}
                                  onChange={(event) =>
                                    updateQuestion(question.id, {
                                      placeholderText: event.target.value,
                                    })
                                  }
                                  placeholder="e.g. Juan Dela Cruz"
                                  className="mt-1 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-semibold text-sibs-primary-1 outline-none"
                                />
                              </label>
                            </div>
                            {previewQuestionId === question.id && (
                              <div className="mt-4 rounded-xl border border-dashed border-[#BFD1E5] bg-[#F8FAFC] p-4">
                                <div className="text-xs font-extrabold text-sibs-primary-1">
                                  <RichTextViewer
                                    value={question.label}
                                    emptyText="Untitled question"
                                    className="text-sibs-primary-1"
                                  />
                                  {question.required !== false && (
                                    <span className="ml-1 text-[#FF5C28]">
                                      *
                                    </span>
                                  )}
                                </div>
                                {question.helperText && (
                                  <p className="mt-1 text-[11px] font-medium text-[#667085]">
                                    {question.helperText}
                                  </p>
                                )}
                                <div className="mt-3 h-10 rounded-lg border border-[#D6DEE8] bg-white px-3 py-2 text-xs text-[#98A2B3]">
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
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#BFD1E5] bg-white text-xs font-extrabold text-sibs-primary-1 hover:border-[#FF5C28] hover:bg-[#FFF7F2]"
                        >
                          <Plus size={15} className="text-[#FF5C28]" />
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
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#BFD1E5] bg-white text-xs font-extrabold text-sibs-primary-1 transition hover:border-[#FF5C28] hover:bg-[#FFF7F2]"
            >
              <Plus size={15} className="text-[#FF5C28]" />
              Add New Application Section
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#E6ECF2] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setMode("table")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1"
            >
              <ArrowLeft size={15} />
              Done & Back to Table
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCandidatePortalPreview}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1"
              >
                <Eye size={15} className="text-[#FF5C28]" />
                Preview Live Form
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !hasValidQuestion}
                title={hasChanges ? "Save form changes" : "Save form"}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-xs font-extrabold text-white transition hover:bg-sibs-primary-1/90 disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Save size={15} className="text-[#FF5C28]" />
                )}
                Save Position Form
              </button>
            </div>
          </div>
      </section>

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
