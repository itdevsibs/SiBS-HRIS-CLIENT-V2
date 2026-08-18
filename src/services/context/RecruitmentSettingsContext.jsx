import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "./UserContext";

import {
  RECRUITMENT_SETTINGS_STORAGE_KEY,
  createDefaultFormForPosition,
  defaultRecruitmentSettings,
  fieldTypes,
  pipelineStages,
  recruitmentTabs,
} from "../../lib/utils/recruitmentSettings/recruitmentSettingsConstants";

import { getAvailablePositions } from "../../lib/axios/getAvailablePosition";

import {
  getFinalInterviewForms,
  replaceFinalInterviewQuestions,
  saveFinalInterviewFormDetails,
} from "../../lib/axios/getRecruitmentSettings";

import {
  findFormForAvailablePosition,
  mergeFormsForActivePositions,
  normalizeActiveAvailablePositions,
} from "../../lib/utils/recruitmentSettings/activeAvailablePositions";

const PUBLIC_RECRUITMENT_PATHS = [
  "/",
  "/login",
  "/online-assessment",
  "/apply",
  "/public/talent-pool/apply",
  "/public/interview-date",
  "/public/candidate-experience-survey",
  "/recruitment/candidate-experience/survey",
  "/recruitment/talent-pool/apply",
];

function isPublicRecruitmentPath(pathname = "") {
  return PUBLIC_RECRUITMENT_PATHS.some((path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

const RecruitmentSettingsContext =
  createContext(null);

const emptyFieldForm = {
  section: "",
  label: "",
  type: "Rating",
  required: true,
};

const EMPTY_ACTIVE_FORM = {
  id: "",
  positionId: "",
  name: "Final Interview Form",
  status: "Inactive",
  passingScore: 80,
  description: "",
  fields: [],
};

function safeReadSettings() {
  if (typeof window === "undefined") {
    return defaultRecruitmentSettings;
  }

  try {
    const raw =
      window.localStorage.getItem(
        RECRUITMENT_SETTINGS_STORAGE_KEY,
      );

    const parsed = raw
      ? JSON.parse(raw)
      : null;

    if (
      !parsed ||
      !Array.isArray(parsed.forms)
    ) {
      return defaultRecruitmentSettings;
    }

    return {
      ...defaultRecruitmentSettings,
      ...parsed,
      activePositionId: "",
      activeFormId: "",
      forms: [],
    };
  } catch {
    return defaultRecruitmentSettings;
  }
}

function getApiErrorMessage(
  error,
  fallback,
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getAvailablePositionRows(
  response = {},
) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (
    Array.isArray(response?.data?.data)
  ) {
    return response.data.data;
  }

  if (
    Array.isArray(response?.positions)
  ) {
    return response.positions;
  }

  return [];
}

function getDatabaseFormRows(
  response = {},
) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (
    Array.isArray(response?.data?.data)
  ) {
    return response.data.data;
  }

  if (
    Array.isArray(
      response?.finalInterviewForms,
    )
  ) {
    return response.finalInterviewForms;
  }

  return [];
}

function getPositionDatabaseIdentifier(
  position = {},
) {
  return (
    position.databaseId ||
    position.database_id ||
    position.availablePositionId ||
    position.available_position_id ||
    position.id ||
    position.positionId ||
    position.code ||
    ""
  );
}

function getFormDetailsPayload(
  form = {},
) {
  return {
    formId:
      form.id ||
      form.formId ||
      form.form_id ||
      "",
    formName:
      form.name ||
      form.formName ||
      form.form_name ||
      "Final Interview Form",
    status:
      form.status || "Active",
    passingScore:
      Number(
        form.passingScore ??
        form.passing_score ??
        80,
      ),
    description:
      form.description || "",
  };
}

function upsertForm(
  forms = [],
  savedForm = {},
) {
  const list = Array.isArray(forms)
    ? forms
    : [];

  const savedDatabasePositionId =
    String(
      savedForm.databasePositionId ||
      savedForm.database_position_id ||
      savedForm.availablePositionId ||
      savedForm.available_position_id ||
      "",
    );

  const savedPositionId =
    String(
      savedForm.positionId ||
      savedForm.position_id ||
      "",
    );

  const savedFormId =
    String(
      savedForm.id ||
      savedForm.formId ||
      savedForm.form_id ||
      "",
    );

  let replaced = false;

  const nextForms = list.map((form) => {
    const sameDatabasePosition =
      savedDatabasePositionId &&
      String(
        form.databasePositionId ||
        form.database_position_id ||
        form.availablePositionId ||
        form.available_position_id ||
        "",
      ) === savedDatabasePositionId;

    const samePosition =
      savedPositionId &&
      String(
        form.positionId ||
        form.position_id ||
        "",
      ) === savedPositionId;

    const sameForm =
      savedFormId &&
      String(
        form.id ||
        form.formId ||
        form.form_id ||
        "",
      ) === savedFormId;

    if (
      sameDatabasePosition ||
      samePosition ||
      sameForm
    ) {
      replaced = true;

      return {
        ...form,
        ...savedForm,
      };
    }

    return form;
  });

  return replaced
    ? nextForms
    : [...nextForms, savedForm];
}

function buildSettingsForActivePositions(
  previousSettings,
  activePositions,
  sourceForms,
) {
  const safeSettings =
    previousSettings &&
    typeof previousSettings === "object"
      ? previousSettings
      : defaultRecruitmentSettings;

  const nextForms =
    mergeFormsForActivePositions({
      forms: Array.isArray(sourceForms)
        ? sourceForms
        : safeSettings.forms,
      positions: activePositions,
      createDefaultForm:
        createDefaultFormForPosition,
    });

  const previousActivePositionId =
    safeSettings.activePositionId || "";

  const selectedPosition =
    activePositions.find(
      (position) =>
        String(position.id) ===
        String(
          previousActivePositionId,
        ),
    ) ||
    activePositions[0] ||
    null;

  const selectedForm =
    selectedPosition
      ? findFormForAvailablePosition(
          nextForms,
          selectedPosition,
        )
      : null;

  return {
    ...safeSettings,
    activePositionId:
      selectedPosition?.id || "",
    activeFormId:
      selectedForm?.id || "",
    forms: nextForms,
  };
}

export function RecruitmentSettingsProvider({
  children,
}) {
  const location = useLocation();
  const { user, loading: userLoading } = useUser();

  const publicRoute = isPublicRecruitmentPath(location.pathname);
  const canLoadRecruitmentSettings =
    Boolean(user) && !userLoading && !publicRoute;

  const questionSaveQueueRef =
    useRef(Promise.resolve());

  const questionSaveSequenceRef =
    useRef(0);

  const [
    availablePositions,
    setAvailablePositions,
  ] = useState([]);

  const [
    positionsLoading,
    setPositionsLoading,
  ] = useState(false);

  const [
    positionsError,
    setPositionsError,
  ] = useState("");

  const [settings, setSettings] =
    useState(() => safeReadSettings());

  const [activeTab, setActiveTab] =
    useState("Final Interview Form");

  const [search, setSearch] =
    useState("");

  const [
    positionSearch,
    setPositionSearch,
  ] = useState("");

  const [saveStatus, setSaveStatus] =
    useState("");

  const [
    formSavingStatus,
    setFormSavingStatus,
  ] = useState("");

  const [
    formSaveError,
    setFormSaveError,
  ] = useState("");

  const [
    questionsSaving,
    setQuestionsSaving,
  ] = useState(false);

  const [
    questionsSaveError,
    setQuestionsSaveError,
  ] = useState("");

  const [
    editingFieldId,
    setEditingFieldId,
  ] = useState(null);

  const [newField, setNewField] =
    useState(emptyFieldForm);

  const mergeSavedDatabaseForm =
    useCallback((savedForm) => {
      if (!savedForm) return;

      setSettings((previous) => ({
        ...previous,
        activeFormId:
          savedForm.id ||
          previous.activeFormId,
        forms: upsertForm(
          previous.forms,
          savedForm,
        ),
      }));
    }, []);

  const refreshAvailablePositions =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (!canLoadRecruitmentSettings) {
          if (!silent) {
            setPositionsLoading(false);
            setPositionsError("");
          }

          return [];
        }

        if (!silent) {
          setPositionsLoading(true);
        }

        setPositionsError("");

        try {
          const [
            positionsResponse,
            formsResponse,
          ] = await Promise.all([
            getAvailablePositions({
              page: 1,
              limit: 500,
              search: "",
              status: "Active",
              departmentId: "All",
              accountId: "All",
            }),
            getFinalInterviewForms(),
          ]);

          if (!positionsResponse?.success) {
            throw new Error(
              positionsResponse?.message ||
              "Failed to load active positions.",
            );
          }

          if (!formsResponse?.success) {
            throw new Error(
              formsResponse?.message ||
              "Failed to load Final Interview forms.",
            );
          }

          const activePositions =
            normalizeActiveAvailablePositions(
              getAvailablePositionRows(
                positionsResponse,
              ),
            );

          const databaseForms =
            getDatabaseFormRows(
              formsResponse,
            );

          setAvailablePositions(
            activePositions,
          );

          setSettings((previous) =>
            buildSettingsForActivePositions(
              previous,
              activePositions,
              databaseForms,
            ),
          );

          return activePositions;
        } catch (error) {
          console.error(
            "LOAD RECRUITMENT SETTINGS DATABASE DATA ERROR:",
            error,
          );

          setAvailablePositions([]);

          setSettings((previous) =>
            buildSettingsForActivePositions(
              previous,
              [],
              [],
            ),
          );

          setPositionsError(
            getApiErrorMessage(
              error,
              "Failed to load Recruitment Settings database data.",
            ),
          );

          return [];
        } finally {
          setPositionsLoading(false);
        }
      },
      [canLoadRecruitmentSettings],
    );

  useEffect(() => {
    if (!canLoadRecruitmentSettings) {
      setPositionsLoading(false);
      setPositionsError("");
      return undefined;
    }

    void refreshAvailablePositions();

    function handleAvailablePositionsChanged() {
      void refreshAvailablePositions({
        silent: true,
      });
    }

    window.addEventListener(
      "available-positions-updated",
      handleAvailablePositionsChanged,
    );

    window.addEventListener(
      "ta-available-positions-updated",
      handleAvailablePositionsChanged,
    );

    return () => {
      window.removeEventListener(
        "available-positions-updated",
        handleAvailablePositionsChanged,
      );

      window.removeEventListener(
        "ta-available-positions-updated",
        handleAvailablePositionsChanged,
      );
    };
  }, [canLoadRecruitmentSettings, refreshAvailablePositions]);

  const activePosition = useMemo(() => {
    return (
      availablePositions.find(
        (position) =>
          String(position.id) ===
          String(
            settings.activePositionId,
          ),
      ) ||
      availablePositions[0] ||
      null
    );
  }, [
    availablePositions,
    settings.activePositionId,
  ]);

  const activeForm = useMemo(() => {
    if (!activePosition) {
      return EMPTY_ACTIVE_FORM;
    }

    const existingForm =
      findFormForAvailablePosition(
        settings.forms,
        activePosition,
      );

    return (
      existingForm ||
      createDefaultFormForPosition(
        activePosition,
      )
    );
  }, [
    settings.forms,
    activePosition,
  ]);

  const fields = useMemo(
    () =>
      Array.isArray(activeForm.fields)
        ? activeForm.fields
        : [],
    [activeForm.fields],
  );

  const filteredPositions =
    useMemo(() => {
      const keyword =
        positionSearch
          .trim()
          .toLowerCase();

      return availablePositions.filter(
        (position) => {
          if (!keyword) return true;

          return [
            position.position,
            position.department,
            position.code,
            position.skills,
            position.accountName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword);
        },
      );
    }, [
      availablePositions,
      positionSearch,
    ]);

  const filteredFields =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return fields.filter((field) => {
        if (!keyword) return true;

        return [
          field.label,
          field.type,
          field.section,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      });
    }, [fields, search]);

  const enabledFields = useMemo(
    () =>
      fields.filter(
        (field) => field.enabled,
      ).length,
    [fields],
  );

  const requiredFields = useMemo(
    () =>
      fields.filter(
        (field) => field.required,
      ).length,
    [fields],
  );

  const activeFormsCount = useMemo(
    () =>
      settings.forms.filter(
        (form) =>
          form.status === "Active",
      ).length,
    [settings.forms],
  );

  function setActivePositionId(
    positionId,
  ) {
    const selectedPosition =
      availablePositions.find(
        (position) =>
          String(position.id) ===
          String(positionId),
      );

    if (!selectedPosition) return;

    setSettings((previous) => {
      const existingForm =
        findFormForAvailablePosition(
          previous.forms,
          selectedPosition,
        );

      const nextForm =
        existingForm ||
        createDefaultFormForPosition(
          selectedPosition,
        );

      return {
        ...previous,
        activePositionId:
          selectedPosition.id,
        activeFormId: nextForm.id,
        forms: upsertForm(
          previous.forms,
          nextForm,
        ),
      };
    });

    setSearch("");
    setFormSaveError("");
    setQuestionsSaveError("");
    setEditingFieldId(null);
    setNewField(emptyFieldForm);
  }

  function updateActiveForm(patch) {
    if (!activePosition) {
      return EMPTY_ACTIVE_FORM;
    }

    const currentForm =
      activeForm ||
      createDefaultFormForPosition(
        activePosition,
      );

    const nextForm = {
      ...currentForm,
      ...patch,
      positionId: activePosition.id,
      position_id: activePosition.id,
      databasePositionId:
        activePosition.databaseId ||
        activePosition.database_id ||
        "",
      database_position_id:
        activePosition.databaseId ||
        activePosition.database_id ||
        "",
      positionTitle:
        activePosition.position,
      position_title:
        activePosition.position,
      updatedAt:
        new Date().toISOString(),
    };

    setSettings((previous) => ({
      ...previous,
      activePositionId:
        activePosition.id,
      activeFormId: nextForm.id,
      forms: upsertForm(
        previous.forms,
        nextForm,
      ),
    }));

    return nextForm;
  }

  function setFormName(value) {
    updateActiveForm({
      name: value,
      formName: value,
      form_name: value,
    });
  }

  function setFormStatus(value) {
    updateActiveForm({ status: value });
  }

  function setPassingScore(value) {
    updateActiveForm({
      passingScore: value,
      passing_score: value,
    });
  }

  function setFormDescription(value) {
    updateActiveForm({ description: value });
  }

  function setFieldsLocally(
    nextFields,
  ) {
    return updateActiveForm({
      fields: Array.isArray(nextFields)
        ? nextFields
        : [],
      questions:
        Array.isArray(nextFields)
          ? nextFields
          : [],
    });
  }

  async function persistQuestionFields(
    nextFields,
  ) {
    if (!activePosition) {
      throw new Error("No position is selected.");
    }

    const cleanFields =
      Array.isArray(nextFields)
        ? nextFields
        : [];

    const positionIdentifier =
      getPositionDatabaseIdentifier(
        activePosition,
      );

    if (!positionIdentifier) {
      const message =
        "The selected position has no database identifier.";
      setQuestionsSaveError(message);
      throw new Error(message);
    }

    const saveSequence =
      questionSaveSequenceRef.current + 1;

    questionSaveSequenceRef.current =
      saveSequence;

    setFieldsLocally(cleanFields);
    setQuestionsSaving(true);
    setQuestionsSaveError("");
    setSaveStatus(
      "Saving questions...",
    );

    const saveOperation =
      questionSaveQueueRef.current
        .catch(() => null)
        .then(async () => {
          const response =
            await replaceFinalInterviewQuestions(
              positionIdentifier,
              cleanFields,
            );

          if (!response?.success) {
            throw new Error(
              response?.message ||
              "Failed to save questions.",
            );
          }

          return response;
        });

    questionSaveQueueRef.current =
      saveOperation;

    try {
      const response =
        await saveOperation;

      if (
        saveSequence ===
        questionSaveSequenceRef.current
      ) {
        mergeSavedDatabaseForm(
          response.data,
        );

        setSaveStatus(
          "Questions saved",
        );

        window.setTimeout(() => {
          setSaveStatus("");
        }, 1800);
      }

      return true;
    } catch (error) {
      if (
        saveSequence ===
        questionSaveSequenceRef.current
      ) {
        setQuestionsSaveError(
          getApiErrorMessage(
            error,
            "Failed to save Final Interview questions.",
          ),
        );

        setSaveStatus(
          "Question save failed",
        );
      }

      throw error;
    } finally {
      if (
        saveSequence ===
        questionSaveSequenceRef.current
      ) {
        setQuestionsSaving(false);
      }
    }
  }

  function handleAddField() {
    if (!activePosition) return false;

    if (
      !newField.section.trim() ||
      !newField.label.trim()
    ) {
      return false;
    }

    let nextFields;

    if (editingFieldId) {
      nextFields = fields.map((field) =>
        field.id === editingFieldId
          ? {
              ...field,
              section:
                newField.section.trim(),
              label:
                newField.label.trim(),
              type: newField.type,
              required:
                newField.required,
            }
          : field,
      );

      setEditingFieldId(null);
    } else {
      nextFields = [
        ...fields,
        {
          id:
            `${activePosition.id}-${Date.now()}`,
          section:
            newField.section.trim(),
          label:
            newField.label.trim(),
          type: newField.type,
          required:
            newField.required,
          enabled: true,
        },
      ];
    }

    setNewField(emptyFieldForm);
    setFieldsLocally(nextFields);

    return true;
  }

  function handleEditField(field) {
    setEditingFieldId(field.id);

    setNewField({
      section: field.section || "",
      label: field.label || "",
      type: field.type || "Rating",
      required:
        Boolean(field.required),
    });
  }

  function handleCancelFieldEdit() {
    setEditingFieldId(null);
    setNewField(emptyFieldForm);
  }

  function handleToggleField(id, key) {
    const nextFields = fields.map(
      (field) =>
        field.id === id
          ? {
              ...field,
              [key]: !field[key],
            }
          : field,
    );

    setFieldsLocally(nextFields);
  }

  function handleDeleteField(id) {
    const nextFields =
      fields.filter(
        (field) => field.id !== id,
      );

    if (editingFieldId === id) {
      setEditingFieldId(null);
      setNewField(emptyFieldForm);
    }

    setFieldsLocally(nextFields);
  }

  function handleResetFields() {
    if (!activePosition) return;

    const resetForm =
      createDefaultFormForPosition(
        activePosition,
      );

    updateActiveForm({
      ...resetForm,
      fields: resetForm.fields || [],
    });

    setSearch("");
    setEditingFieldId(null);
    setNewField(emptyFieldForm);
    setSaveStatus("");
  }

  async function handleSaveSettings() {
    if (!activePosition) {
      throw new Error("No position is selected.");
    }

    const positionIdentifier =
      getPositionDatabaseIdentifier(
        activePosition,
      );
    const detailsPayload =
      getFormDetailsPayload(activeForm);

    if (!positionIdentifier) {
      throw new Error(
        "The selected position has no database identifier.",
      );
    }

    if (!String(detailsPayload.formName || "").trim()) {
      const message = "Form name is required.";
      setFormSaveError(message);
      throw new Error(message);
    }

    setFormSavingStatus("Saving form details...");
    setFormSaveError("");
    setQuestionsSaveError("");

    try {
      const response =
        await saveFinalInterviewFormDetails(
          positionIdentifier,
          detailsPayload,
        );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to save form details.",
        );
      }

      mergeSavedDatabaseForm(response.data);
      setFormSavingStatus("Form details saved");
    } catch (error) {
      setFormSavingStatus("Save failed");
      setFormSaveError(
        getApiErrorMessage(
          error,
          "Failed to save form details.",
        ),
      );
      throw error;
    }

    await persistQuestionFields(fields);

    return true;
  }

  function getFinalInterviewForm(
    positionId,
  ) {
    if (positionId) {
      const requestedPosition =
        availablePositions.find(
          (position) =>
            [
              position.id,
              position.positionId,
              position.code,
              position.databaseId,
              position.sourcePositionId,
            ].some(
              (value) =>
                String(value || "") ===
                String(positionId),
            ),
        );

      if (requestedPosition) {
        return (
          findFormForAvailablePosition(
            settings.forms,
            requestedPosition,
          ) ||
          createDefaultFormForPosition(
            requestedPosition,
          )
        );
      }
    }

    return activeForm;
  }

  function handleAddFieldGroup(
    sectionTitle,
    questions = [],
  ) {
    if (!activePosition) {
      return false;
    }

    const cleanSection =
      String(
        sectionTitle || "",
      ).trim();

    const validQuestions =
      questions
        .map((question) => ({
          label:
            String(
              question.label || "",
            ).trim(),
          type:
            question.type ||
            "Rating",
          required:
            Boolean(
              question.required,
            ),
        }))
        .filter(
          (question) =>
            question.label,
        );

    if (
      !cleanSection ||
      !validQuestions.length
    ) {
      return false;
    }

    const timestamp = Date.now();

    const nextFields = [
      ...fields,
      ...validQuestions.map(
        (question, index) => ({
          id:
            `${activePosition.id}-${timestamp}-${index}`,
          section: cleanSection,
          label: question.label,
          type: question.type,
          required:
            question.required,
          enabled: true,
        }),
      ),
    ];

    setSearch("");
    setNewField(emptyFieldForm);
    setEditingFieldId(null);

    setFieldsLocally(nextFields);

    return true;
  }

  function handleUpdateFieldFromModal(
    fieldId,
    payload,
  ) {
    const cleanSection =
      String(
        payload?.section || "",
      ).trim();

    const cleanLabel =
      String(
        payload?.label || "",
      ).trim();

    if (
      !fieldId ||
      !cleanSection ||
      !cleanLabel
    ) {
      return false;
    }

    const nextFields =
      fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              section: cleanSection,
              label: cleanLabel,
              type:
                payload.type ||
                "Rating",
              required:
                Boolean(
                  payload.required,
                ),
            }
          : field,
      );

    setSearch("");
    setEditingFieldId(null);
    setNewField(emptyFieldForm);

    setFieldsLocally(nextFields);

    return true;
  }

  function handleToggleFieldGroup(
    section,
    key,
  ) {
    const cleanSection =
      String(
        section || "",
      ).trim();

    if (!cleanSection) return;

    const sectionFields =
      fields.filter(
        (field) =>
          field.section ===
          cleanSection,
      );

    const shouldEnable =
      sectionFields.some(
        (field) => !field[key],
      );

    const nextFields =
      fields.map((field) =>
        field.section === cleanSection
          ? {
              ...field,
              [key]: shouldEnable,
            }
          : field,
      );

    setFieldsLocally(nextFields);
  }

  function handleRenameFieldGroup(
    section,
    nextSectionTitle,
  ) {
    const cleanSection = String(section || "").trim();
    const cleanNextTitle = String(nextSectionTitle || "").trim();

    if (!cleanSection || !cleanNextTitle) {
      return false;
    }

    if (cleanSection === cleanNextTitle) {
      return true;
    }

    const nextFields = fields.map((field) =>
      field.section === cleanSection
        ? { ...field, section: cleanNextTitle }
        : field,
    );

    setFieldsLocally(nextFields);
    return true;
  }

  function handleDeleteFieldGroup(
    section,
  ) {
    const cleanSection =
      String(
        section || "",
      ).trim();

    if (!cleanSection) return;

    const nextFields =
      fields.filter(
        (field) =>
          field.section !==
          cleanSection,
      );

    if (
      newField.section ===
      cleanSection
    ) {
      setEditingFieldId(null);
      setNewField(emptyFieldForm);
    }

    setFieldsLocally(nextFields);
  }

  return (
    <RecruitmentSettingsContext.Provider
      value={{
        settings,
        setSettings,

        availablePositions,
        setAvailablePositions,
        positionsLoading,
        positionsError,
        refreshAvailablePositions,

        activePosition,
        activePositionId:
          settings.activePositionId,
        setActivePositionId,

        activeTab,
        setActiveTab,

        search,
        setSearch,

        positionSearch,
        setPositionSearch,
        filteredPositions,

        activeForm,
        formName: activeForm.name,
        formStatus:
          activeForm.status,
        passingScore:
          activeForm.passingScore,
        formDescription:
          activeForm.description,

        setFormName,
        setFormStatus,
        setPassingScore,
        setFormDescription,

        fields,
        filteredFields,
        enabledFields,
        requiredFields,
        activeFormsCount,

        newField,
        setNewField,
        editingFieldId,

        saveStatus,
        formSavingStatus,
        formSaveError,
        questionsSaving,
        questionsSaveError,

        handleAddField,
        handleEditField,
        handleCancelFieldEdit,
        handleToggleField,
        handleDeleteField,
        handleResetFields,
        handleSaveSettings,

        getFinalInterviewForm,

        recruitmentTabs,
        fieldTypes,
        pipelineStages,

        handleAddFieldGroup,
        handleUpdateFieldFromModal,
        handleRenameFieldGroup,
        handleToggleFieldGroup,
        handleDeleteFieldGroup,
      }}
    >
      {children}
    </RecruitmentSettingsContext.Provider>
  );
}

export function useRecruitmentSettings() {
  const context =
    useContext(
      RecruitmentSettingsContext,
    );

  if (!context) {
    throw new Error(
      "useRecruitmentSettings must be used inside RecruitmentSettingsProvider",
    );
  }

  return context;
}
