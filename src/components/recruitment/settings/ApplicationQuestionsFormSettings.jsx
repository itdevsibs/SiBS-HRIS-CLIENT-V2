import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Filter,
  Layers,
  Lightbulb,
  ListChecks,
  Loader2,
  Pencil,
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

const TABLE_STATUS_OPTIONS = ["All", "Active", "Inactive", "Draft"];
const APPLICATION_FORMS_TABLE_PAGE_SIZE = 6;

const APPLICATION_SECTIONS = [
  {
    id: "sourcing",
    title: "Sourcing Channel & Attribution",
    subtitle: "Recruitment source and referral tracking.",
  },
  {
    id: "personal",
    title: "Personal & Contact Details",
    subtitle: "Legal name, contact information, and location.",
  },
  {
    id: "voice",
    title: "Voice Screening",
    subtitle: "English audio recording prompt.",
  },
];

const SECTION_PRESETS = [
  ["Voice Screening", "45-sec English audio recording prompt"],
  ["Typing / Tech Diagnostic", "WPM benchmarks & tools proficiencies"],
  ["Work & BPO History", "Tenure, past employer, account types"],
  ["Shift & Readiness", "Night shift, on-site, start dates"],
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

function getPositionJdCode(position = {}) {
  return asText(
    position.jdCode ||
      position.jd_code,
    "",
  );
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

function createBlankQuestion() {
  return {
    id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    databaseId: null,
    label: "",
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
    required: Boolean(item.required ?? item.isRequired ?? item.is_required ?? true),
  };
}

function normalizeSection(item = {}, index = 0) {
  const fallback = APPLICATION_SECTIONS[index] || APPLICATION_SECTIONS[0];
  const questions = Array.isArray(item.questions)
    ? item.questions
    : Array.isArray(item.fields)
      ? item.fields
      : [];

  return {
    id:
      item.id ||
      item.clientSectionId ||
      item.client_section_id ||
      fallback.id,
    clientSectionId:
      item.clientSectionId ||
      item.client_section_id ||
      item.id ||
      fallback.id,
    title:
      item.title ||
      item.sectionTitle ||
      item.section_title ||
      fallback.title,
    description:
      item.description ||
      item.sectionDescription ||
      item.section_description ||
      fallback.subtitle,
    questions: questions.map(normalizeQuestion),
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
  return questions
    .map((question) => String(question.label || "").trim())
    .filter(Boolean)
    .join("||");
}

export default function ApplicationQuestionsFormSettings() {
  const {
    availablePositions,
    positionsLoading,
    positionsError,
    refreshAvailablePositions,
  } = useRecruitmentSettings();

  const [mode, setMode] = useState("table");
  const [step, setStep] = useState(1);
  const [showGuide, setShowGuide] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [applicationForms, setApplicationForms] = useState([]);
  const [activeApplicationForm, setActiveApplicationForm] = useState(null);
  const [applicationSections, setApplicationSections] =
    useState(APPLICATION_SECTIONS);
  const [questions, setQuestions] = useState([]);
  const [initialSignature, setInitialSignature] = useState("");
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
  const sectionFieldRows = useMemo(
    () =>
      applicationSections.map((section, index) => ({
        section,
        question:
          section.questions?.[0] ||
          questions.find((question) => question.sectionId === section.id) ||
          {
            id: `${section.id}-default-field`,
            sectionId: section.id,
            label:
              index === 0
                ? "How did you find out about SiBS Solutions?"
                : index === 1
                  ? "Complete your personal and contact details."
                  : "Why did you apply for this position?",
            helperText:
              index === 0
                ? "Select your primary recruitment channel."
                : index === 1
                  ? "Candidate contact information is collected from the public form."
                  : "",
            placeholderText: "",
            type: index === 2 ? "Voice Record" : "Multi-line Paragraph",
            required: true,
          },
      })),
    [applicationSections, questions],
  );
  const filteredQuestions = useMemo(() => {
    const keyword = questionSearch.trim().toLowerCase();

    return questions.filter((question) => {
      const hasLabel = Boolean(String(question.label || "").trim());
      const statusMatch =
        statusFilter === "All" ||
        (statusFilter === "Active" && hasLabel) ||
        (statusFilter === "Draft" && !hasLabel);

      if (!statusMatch) return false;
      if (!keyword) return true;

      return String(question.label || "").toLowerCase().includes(keyword);
    });
  }, [questionSearch, questions, statusFilter]);
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
      (position) => String(getPositionId(position)) === String(selectedPositionId),
    ) ||
    positionsForApplicationForms[0] ||
    {};
  const applicationFormsTotalPages = Math.max(
    1,
    Math.ceil(filteredApplicationForms.length / APPLICATION_FORMS_TABLE_PAGE_SIZE),
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
          : APPLICATION_SECTIONS.map((section, index) =>
              normalizeSection(section, index),
            ),
      );
      const fields = sections.flatMap((section) =>
        Array.isArray(section.questions) ? section.questions : [],
      );

      setActiveApplicationForm(form);
      setApplicationSections(sections);
      setQuestions(fields.length ? fields : [createBlankQuestion()]);
      setInitialSignature(getQuestionSignature(fields));
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

  function updateQuestion(id, value) {
    setApplicationSections((previous) =>
      previous.map((section) => ({
        ...section,
        questions: (section.questions || []).map((question) =>
          question.id === id || question.clientQuestionId === id
            ? {
                ...question,
                label: value,
              }
            : question,
        ),
      })),
    );
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === id
          ? {
              ...question,
              label: value,
            }
          : question,
      ),
    );
  }

  function addQuestion() {
    const blankQuestion = {
      ...createBlankQuestion(),
      sectionId: "voice",
      clientQuestionId: `voice-question-${Date.now()}`,
      label: "New voice screening question",
      type: "Voice Record",
      required: true,
    };

    setApplicationSections((previous) =>
      previous.map((section) =>
        section.id === "voice" || section.clientSectionId === "voice"
          ? {
              ...section,
              questions: [...(section.questions || []), blankQuestion],
            }
          : section,
      ),
    );
    setQuestions((previous) => [...previous, blankQuestion]);
  }

  function removeQuestion(id) {
    setApplicationSections((previous) =>
      previous.map((section) => {
        const nextQuestions = (section.questions || []).filter(
          (question) => question.id !== id && question.clientQuestionId !== id,
        );

        return {
          ...section,
          questions: nextQuestions.length ? nextQuestions : section.questions,
        };
      }),
    );
    setQuestions((previous) => {
      const nextQuestions = previous.filter((question) => question.id !== id);

      return nextQuestions.length ? nextQuestions : [createBlankQuestion()];
    });
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
    setStep(1);
    setShowAllSteps(false);
    setQuestionSearch("");
    setStatusFilter("All");
    void loadApplicationFormForPosition(positionId);
  }

  async function handleSave() {
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
        sectionFieldRows.map(({ section, question }) => ({
          id: section.id,
          clientSectionId: section.clientSectionId || section.id,
          title: section.title,
          description: section.description,
          questions: [
            {
              id: question.clientQuestionId || question.id,
              clientQuestionId: question.clientQuestionId || question.id,
              label: question.label,
              helperText: question.helperText,
              placeholderText: question.placeholderText,
              type: question.type,
              required: question.required !== false,
            },
          ],
        })),
      );

      const response = await saveApplicationFormByPosition(
        getPositionId(selectedPosition),
        {
          formName:
            activeApplicationForm?.formName ||
            activeApplicationForm?.form_name ||
            `${getPositionTitle(selectedPosition)} - Application Intake Form`,
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
      setQuestions(savedQuestions.length ? savedQuestions : [createBlankQuestion()]);
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
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-normal text-sibs-primary-1">
              <ListChecks size={14} />
              Application Screening
            </div>

            <h3 className="mt-3 text-base font-extrabold text-sibs-primary-1">
              Position-based Application Forms
            </h3>
            <p className="mt-1 text-xs font-semibold text-sibs-tertiary-5">
              Manage position candidate application intake forms,
              pre-screening questions, voice audio prompts, and intake
              requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-sibs-primary-1">
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

        <div className="mb-5 grid grid-cols-1 gap-3 border-b border-[#E6ECF2] pb-5 xl:grid-cols-[minmax(280px,1fr)_minmax(360px,auto)_auto] xl:items-end">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#101828]">
              Search
            </label>
            <div className="relative">
              <Search
                size={18}
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
            <div className="flex flex-wrap items-center gap-2">
            {TABLE_STATUS_OPTIONS.map((status) => {
              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-extrabold transition ${
                    active
                      ? "bg-sibs-primary-1 text-white shadow-sm"
                      : "border border-[#D6DEE8] bg-white text-[#475467] hover:border-[#BFD8F1] hover:bg-[#EFF6FF] hover:text-sibs-primary-1"
                  }`}
                >
                  {status}
                </button>
              );
            })}
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
                <tr className="border-b border-[#E6ECF2] bg-[#F8FAFC] text-left text-[10px] font-extrabold uppercase tracking-normal text-[#667085]">
                  <th className="px-5 py-4">Position Title & Code</th>
                  <th className="px-5 py-4">Department & Site</th>
                  <th className="px-5 py-4">Form Name</th>
                  <th className="px-5 py-4">Key Requirements / Benchmark</th>
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
                      .map((value) => String(value || "").trim().toLowerCase())
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
                      className="cursor-pointer bg-white text-[13px] outline-none transition hover:bg-[#F8FAFC] focus:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#FF5C28]" />
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-[13px] font-extrabold text-sibs-primary-1">
                              {getPositionTitle(position)}
                            </p>
                            <p className="mt-1 text-xs font-bold text-sibs-tertiary-5">
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
                        <p className="text-[13px] font-extrabold text-sibs-primary-1">
                          {getPositionDepartment(position)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#475467]">
                          {getPositionSite(position)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[260px] truncate text-[13px] font-medium text-sibs-primary-1">
                          {savedForm?.formName ||
                            savedForm?.form_name ||
                            getApplicationFormName(position)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">
                          Voice Prompt Required
                          {savedForm?.benchmark ? ` • ${savedForm.benchmark}` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-[#F1F5F9] px-3 py-1 text-xs font-extrabold text-sibs-primary-1">
                          {Number(savedForm?.questionCount || savedForm?.question_count || 0) ||
                            APPLICATION_SECTIONS.length}{" "}
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
                              openEditor(position);
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-sibs-primary-1 px-4 text-xs font-extrabold text-white transition hover:bg-sibs-primary-1/90"
                          >
                            <Pencil size={14} className="text-[#FF5C28]" />
                            Edit Form
                          </button>
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
      <div className="mb-5 flex flex-col gap-3 border-b border-[#E6ECF2] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-sibs-tertiary-5">
            <span>Settings</span>
            <span>/</span>
            <button
              type="button"
              onClick={() => setMode("table")}
              className="text-sibs-primary-1 hover:underline"
            >
              Position-based Application Forms
            </button>
            <span>/</span>
            <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-sibs-primary-1">
              {getPositionTitle(selectedPosition)}
            </span>
          </div>
          <h3 className="text-[22px] font-extrabold leading-tight text-sibs-primary-1">
            Position-based Application Forms
          </h3>
          <p className="mt-1 text-[13px] font-medium leading-5 text-[#475467]">
            Manage public Talent Pool screening questions, voice audio prompts,
            and intake requirements shown to applicants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-extrabold text-blue-700">
            {configuredCount} configured questions
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
              onClick={() =>
                void loadApplicationFormForPosition(getPositionId(selectedPosition))
              }
            disabled={loading || saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F6FA] text-sibs-primary-1 transition hover:bg-[#E8EEF5] disabled:cursor-not-allowed disabled:opacity-60"
            title="Refresh questions"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setMode("table")}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
        >
          <ArrowLeft size={15} />
          Return to Position Forms Table
        </button>
        <p className="text-xs font-extrabold text-[#667085]">
          Currently Editing Role:{" "}
          <span className="rounded-xl border border-[#D6DEE8] bg-white px-3 py-2 text-sibs-primary-1">
            {getPositionTitle(selectedPosition)} ({getPositionCode(selectedPosition)})
          </span>
        </p>
      </div>

      <div className="mb-6 rounded-2xl bg-sibs-primary-1 px-5 py-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
              <span className="rounded-md bg-[#FF5C28] px-2 py-1 uppercase">
                Application Form Builder
              </span>
              <span>{getPositionCode(selectedPosition)}</span>
            </div>
            <h4 className="mt-2 text-xl font-extrabold">
              {getPositionTitle(selectedPosition)}
            </h4>
            <p className="mt-1 text-xs font-bold text-white/90">
              {getPositionDepartment(selectedPosition)} •{" "}
              {getPositionSite(selectedPosition)} • Benchmark:{" "}
              <span className="text-yellow-300">35 WPM</span> •{" "}
              <span className="text-yellow-300">Voice Prompt Required</span> •
              Total Questions: {APPLICATION_SECTIONS.length} Fields
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCandidatePortalPreview}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-extrabold text-white"
            >
              <Eye size={15} className="text-[#FF5C28]" />
              Test Candidate Portal
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-extrabold text-white"
            >
              <Copy size={15} />
              Copy Link
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading || saving || !hasValidQuestion}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white transition hover:bg-[#E64E1D] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Form
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-2">
        <div className="grid gap-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          {[
            [1, "Form Info & Settings"],
            [2, "Sections & Presets"],
            [3, "Questions & Input Types"],
          ].map(([number, label]) => {
            const active = step === number;

            return (
              <button
                key={number}
                type="button"
                onClick={() => setStep(number)}
                className={`inline-flex h-12 items-center justify-center gap-3 rounded-xl text-xs font-extrabold transition ${
                  active
                    ? "bg-sibs-primary-1 text-white shadow-sm"
                    : "bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                    active
                      ? "bg-[#FF5C28] text-white"
                      : "bg-[#E8EEF5] text-[#667085]"
                  }`}
                >
                  {number}
                </span>
                {label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAllSteps((previous) => !previous)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D6DEE8] bg-white px-4 text-xs font-extrabold text-sibs-primary-1"
          >
            <Layers size={15} />
            {showAllSteps ? "One Step" : "Show All Steps"}
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-[#FFFBEA] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase text-[#9A4A00]">
              <Sparkles size={15} className="text-[#FF5C28]" />
              <Lightbulb size={14} className="text-amber-500" />
              Beginner's Guide: How to Configure an Application Form Per JD
            </p>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-xs font-extrabold text-[#C75A00] underline"
            >
              Hide Guide
            </button>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              [
                "Step 1: Form Details",
                "Set form title, public portal URL slug, status (Active/Draft), and role intake benchmark.",
              ],
              [
                "Step 2: Organize Sections",
                "Structure candidate flow. Use 1-Click Presets for standard Voice, Typing, or Education sections.",
              ],
              [
                "Step 3: Define Questions",
                "Add intake questions, choose input type, and test inline previews.",
              ],
            ].map(([title, copy]) => (
              <div
                key={title}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3"
              >
                <p className="text-xs font-extrabold text-sibs-primary-1">
                  {title}
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-[#475467]">
                  {copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAllSteps || step === 1) && (
        <section className="mb-5 rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between border-b border-[#E6ECF2] pb-4">
            <div>
              <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold uppercase text-blue-700">
                Step 1 of 3
              </span>
              <h4 className="mt-2 text-sm font-extrabold text-sibs-primary-1">
                Form Basic Information & Portal Settings
              </h4>
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
          <div className="grid gap-4 lg:grid-cols-[1fr_360px_360px]">
            <label className="text-xs font-extrabold text-sibs-primary-1">
              Form Name <span className="text-[#FF5C28]">*</span>
              <input
                value={
                  activeApplicationForm?.formName ||
                  activeApplicationForm?.form_name ||
                  `${getPositionTitle(selectedPosition)} - Application Intake Form`
                }
                readOnly
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-bold text-sibs-primary-1 outline-none"
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
            <label className="text-xs font-extrabold text-sibs-primary-1">
              Key Benchmark / Requirement{" "}
              <span className="text-[#FF5C28]">*</span>
              <input
                value={
                  activeApplicationForm?.benchmark ||
                  "35 WPM • Voice Prompt Required"
                }
                readOnly
                className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-bold text-sibs-primary-1 outline-none"
              />
              <span className="mt-1 block text-[11px] font-medium text-sibs-tertiary-5">
                Screening threshold displayed on public job card.
              </span>
            </label>
          </div>
          <label className="mt-4 block text-xs font-extrabold text-sibs-primary-1">
            Candidate Directives / Overview
            <input
              value={
                activeApplicationForm?.description ||
                "Application screening form evaluating verbal English clarity, active listening, customer empathy, and operational night shift readiness."
              }
              readOnly
              className="mt-2 h-11 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-bold text-sibs-primary-1 outline-none"
            />
            <span className="mt-1 block text-[11px] font-medium text-sibs-tertiary-5">
              Instructions visible to applicants before filling out the form.
            </span>
          </label>
          {!showAllSteps && (
            <div className="mt-5 flex justify-end border-t border-[#E6ECF2] pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-sibs-primary-1 px-5 text-xs font-extrabold text-white"
              >
                Next Step: Add & Organize Sections
                <ArrowLeft size={15} className="rotate-180 text-[#FF5C28]" />
              </button>
            </div>
          )}
        </section>
      )}

      {(showAllSteps || step === 2) && (
        <section className="mb-5 rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 border-b border-[#E6ECF2] pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold uppercase text-blue-700">
                Step 2 of 3
              </span>
              <h4 className="mt-2 text-sm font-extrabold text-sibs-primary-1">
                Form Sections & 1-Click Standard Presets
              </h4>
              <p className="text-xs font-medium text-[#475467]">
                Organize candidate intake topics into step-by-step wizard pages.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white"
            >
              <Plus size={15} />
              Add Blank Section
            </button>
          </div>
          <div className="rounded-2xl border border-[#E6ECF2] bg-[#F8FAFC] p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold text-sibs-primary-1">
              <Sparkles size={15} className="text-[#FF5C28]" />
              Quickly add pre-configured sections using 1-Click Standard
              Presets:
            </p>
            <div className="grid gap-3 lg:grid-cols-4">
              {SECTION_PRESETS.map(([title, copy]) => (
                <button
                  key={title}
                  type="button"
                  className="rounded-xl border border-[#D6DEE8] bg-white px-4 py-3 text-left transition hover:border-[#FF5C28] hover:bg-[#FFF7F2]"
                >
                  <p className="text-xs font-extrabold text-sibs-primary-1">
                    <Plus size={14} className="mr-2 inline text-[#FF5C28]" />
                    {title}
                  </p>
                  <p className="mt-1 text-xs font-medium text-sibs-tertiary-5">
                    {copy}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase text-sibs-primary-1">
                Current Application Sections ({APPLICATION_SECTIONS.length})
              </p>
              <div className="flex items-center gap-2 text-xs font-extrabold text-sibs-primary-1">
                <button type="button">Expand All</button>
                <span className="text-sibs-tertiary-5">•</span>
                <button type="button">Collapse All</button>
              </div>
            </div>
            <div className="space-y-3">
              {APPLICATION_SECTIONS.map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center gap-3 rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] px-4 py-3"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-xs font-extrabold text-white">
                    S{index + 1}
                  </span>
                  <div className="min-w-0 flex-1 rounded-lg border border-[#D6DEE8] bg-white px-4 py-2 text-sm font-extrabold uppercase text-sibs-primary-1">
                    {index + 1}. {section.title}
                  </div>
                  <span className="hidden rounded-lg border border-[#D6DEE8] bg-white px-3 py-2 text-xs font-extrabold text-[#475467] sm:inline-flex">
                    1 Field
                  </span>
                  <button className="inline-flex h-9 w-12 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white text-sibs-primary-1">
                    <ChevronUp size={14} />
                    <ChevronDown size={14} />
                  </button>
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {(showAllSteps || step === 3) && (
        <section className="rounded-2xl border border-[#D9E2EC] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 border-b border-[#E6ECF2] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-extrabold uppercase text-blue-700">
                Step 3 of 3
              </span>
              <h4 className="mt-2 text-sm font-extrabold uppercase text-sibs-primary-1">
                Configure Questions & Input Types
              </h4>
              <p className="text-xs font-medium text-[#475467]">
                {APPLICATION_SECTIONS.length} Sections • {APPLICATION_SECTIONS.length}{" "}
                Question Fields
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="h-9 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1">
                Expand All
              </button>
              <button className="h-9 rounded-xl bg-[#F1F5F9] px-4 text-xs font-extrabold text-sibs-primary-1">
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
            {sectionFieldRows.map(({ section, question }, index) => (
              <div
                key={`${section.id}-${question.id}`}
                className="overflow-hidden rounded-2xl border border-[#D9E2EC] bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 bg-sibs-primary-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-xs font-extrabold text-white">
                      S{index + 1}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-[15px] font-extrabold uppercase text-white">
                      {index + 1}. {section.title}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button className="inline-flex h-9 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
                      <ChevronUp size={15} />
                      <ChevronDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#FF5C28] px-4 text-xs font-extrabold text-white"
                    >
                      <Plus size={15} />
                      Add Field
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="rounded-2xl border border-[#D9E2EC] bg-white p-4">
                  <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex min-w-[260px] items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sibs-primary-1 text-xs font-extrabold text-white">
                        1
                      </span>
                      <span className="text-xs font-extrabold text-sibs-primary-1">
                        {section.title} Field
                      </span>
                      <button className="inline-flex h-7 w-11 items-center justify-center rounded-lg border border-[#D6DEE8] bg-[#F1F5F9] text-sibs-tertiary-5">
                        <ChevronUp size={13} />
                        <ChevronDown size={13} />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <label className="flex items-center gap-2 text-xs font-bold text-sibs-tertiary-5">
                        Type:
                        <select className="h-9 min-w-[170px] rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1 outline-none">
                          <option>Multi-line Paragraph</option>
                          <option>Single Line Text</option>
                          <option>Voice Record</option>
                          <option>File Upload</option>
                          <option>Yes/No</option>
                        </select>
                      </label>
                      <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-3 text-xs font-extrabold text-sibs-primary-1">
                        <input type="checkbox" defaultChecked />
                        Required
                      </label>
                      <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#F1F5F9] px-3 text-xs font-extrabold text-sibs-primary-1">
                        <Sparkles size={14} className="text-[#FF5C28]" />
                        Quick Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sibs-tertiary-5 hover:bg-red-50 hover:text-red-600 ${
                          index < 2 ? "pointer-events-none opacity-40" : ""
                        }`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <label className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                    Question Prompt / Field Label
                    <input
                      value={question.label}
                      onChange={(event) =>
                        index >= 2
                          ? updateQuestion(question.id, event.target.value)
                          : undefined
                      }
                      readOnly={index < 2}
                      className="mt-1 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-semibold text-sibs-primary-1 outline-none focus:border-[#BFD8F1] focus:ring-4 focus:ring-[#EFF6FF]"
                    />
                  </label>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <label className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                      Sublabel / Helper Text (Optional)
                      <input
                        defaultValue={
                          index === 0
                            ? "Select your primary recruitment channel."
                            : index === 1
                              ? "Candidate contact information is collected from the public form."
                            : ""
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-semibold text-sibs-primary-1 outline-none"
                      />
                    </label>
                    <label className="text-[11px] font-extrabold uppercase text-sibs-tertiary-5">
                      Placeholder / Sample (Optional)
                      <input
                        placeholder="e.g. Juan Dela Cruz"
                        className="mt-1 h-10 w-full rounded-xl border border-[#D6DEE8] bg-[#F8FAFC] px-4 text-xs font-semibold text-sibs-primary-1 outline-none"
                      />
                    </label>
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#E6ECF2] pt-5 sm:flex-row sm:items-center sm:justify-between">
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
              onClick={() => void handleSave()}
              disabled={saving || !hasValidQuestion}
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
        </section>
      )}

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
