import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AVAILABLE_POSITIONS_STORAGE_KEY,
  RECRUITMENT_SETTINGS_STORAGE_KEY,
  createDefaultFormForPosition,
  defaultAvailablePositions,
  defaultRecruitmentSettings,
  fieldTypes,
  pipelineStages,
  recruitmentTabs,
} from "../../lib/utils/recruitmentSettings/recruitmentSettingsConstants";

function safeReadArray(key, fallback = []) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;

    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeReadSettings() {
  if (typeof window === "undefined") return defaultRecruitmentSettings;

  try {
    const raw = window.localStorage.getItem(RECRUITMENT_SETTINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || !Array.isArray(parsed.forms)) {
      return defaultRecruitmentSettings;
    }

    return {
      ...defaultRecruitmentSettings,
      ...parsed,
      forms: parsed.forms.length
        ? parsed.forms
        : defaultRecruitmentSettings.forms,
    };
  } catch {
    return defaultRecruitmentSettings;
  }
}

function safeWriteStorage(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // temporary localStorage only
  }
}

const RecruitmentSettingsContext = createContext(null);

export function RecruitmentSettingsProvider({ children }) {
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const [availablePositions, setAvailablePositions] = useState(
    defaultAvailablePositions,
  );

  const [settings, setSettings] = useState(defaultRecruitmentSettings);

  const [activeTab, setActiveTab] = useState("Final Interview Form");
  const [search, setSearch] = useState("");
  const [positionSearch, setPositionSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const [newField, setNewField] = useState({
    label: "",
    type: "Short Text",
    section: "Interview Assessment",
    required: false,
  });

  useEffect(() => {
    const storedPositions = safeReadArray(
      AVAILABLE_POSITIONS_STORAGE_KEY,
      defaultAvailablePositions,
    );

    const storedSettings = safeReadSettings();

    const formsWithPositions = storedPositions.map((position) => {
      const existingForm = storedSettings.forms.find(
        (form) => form.positionId === position.id,
      );

      return existingForm || createDefaultFormForPosition(position);
    });

    setAvailablePositions(storedPositions);

    setSettings({
      ...storedSettings,
      activePositionId:
        storedSettings.activePositionId || storedPositions[0]?.id || "",
      activeFormId:
        storedSettings.activeFormId ||
        formsWithPositions[0]?.id ||
        "final-interview-form",
      forms: formsWithPositions,
    });

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    safeWriteStorage(AVAILABLE_POSITIONS_STORAGE_KEY, availablePositions);
    safeWriteStorage(RECRUITMENT_SETTINGS_STORAGE_KEY, settings);
  }, [availablePositions, settings, hasLoadedStorage]);

  const activePosition = useMemo(() => {
    return (
      availablePositions.find(
        (position) => position.id === settings.activePositionId,
      ) ||
      availablePositions[0] ||
      defaultAvailablePositions[0]
    );
  }, [availablePositions, settings.activePositionId]);

  const activeForm = useMemo(() => {
    const existingForm = settings.forms.find(
      (form) => form.positionId === activePosition?.id,
    );

    return existingForm || createDefaultFormForPosition(activePosition);
  }, [settings.forms, activePosition]);

  const fields = activeForm.fields || [];

  const filteredPositions = useMemo(() => {
    const keyword = positionSearch.trim().toLowerCase();

    return availablePositions.filter((position) => {
      if (!keyword) return true;

      return (
        String(position.position || "")
          .toLowerCase()
          .includes(keyword) ||
        String(position.department || "")
          .toLowerCase()
          .includes(keyword) ||
        String(position.code || "")
          .toLowerCase()
          .includes(keyword) ||
        String(position.skills || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [availablePositions, positionSearch]);

  const filteredFields = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return fields.filter((field) => {
      if (!keyword) return true;

      return (
        String(field.label || "")
          .toLowerCase()
          .includes(keyword) ||
        String(field.type || "")
          .toLowerCase()
          .includes(keyword) ||
        String(field.section || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [fields, search]);

  const enabledFields = useMemo(
    () => fields.filter((field) => field.enabled).length,
    [fields],
  );

  const requiredFields = useMemo(
    () => fields.filter((field) => field.required).length,
    [fields],
  );

  const activeFormsCount = useMemo(() => {
    return settings.forms.filter((form) => form.status === "Active").length;
  }, [settings.forms]);

  function setActivePositionId(positionId) {
    const selectedPosition = availablePositions.find(
      (position) => position.id === positionId,
    );

    if (!selectedPosition) return;

    setSettings((prev) => {
      const existingForm = prev.forms.find(
        (form) => form.positionId === positionId,
      );

      const nextForm =
        existingForm || createDefaultFormForPosition(selectedPosition);

      const hasForm = prev.forms.some((form) => form.id === nextForm.id);

      return {
        ...prev,
        activePositionId: positionId,
        activeFormId: nextForm.id,
        forms: hasForm ? prev.forms : [...prev.forms, nextForm],
      };
    });

    setSearch("");
    setNewField({
      label: "",
      type: "Short Text",
      section: "Interview Assessment",
      required: false,
    });
  }

  function updateActiveForm(patch) {
    setSettings((prev) => {
      const existingForm = prev.forms.find(
        (form) => form.positionId === activePosition.id,
      );

      const currentForm =
        existingForm || createDefaultFormForPosition(activePosition);

      const nextForm = {
        ...currentForm,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      const hasForm = prev.forms.some((form) => form.id === nextForm.id);

      return {
        ...prev,
        activePositionId: activePosition.id,
        activeFormId: nextForm.id,
        forms: hasForm
          ? prev.forms.map((form) =>
              form.id === nextForm.id ? nextForm : form,
            )
          : [...prev.forms, nextForm],
      };
    });
  }

  function setFormName(value) {
    updateActiveForm({ name: value });
  }

  function setFormStatus(value) {
    updateActiveForm({ status: value });
  }

  function setPassingScore(value) {
    updateActiveForm({ passingScore: value });
  }

  function setFormDescription(value) {
    updateActiveForm({ description: value });
  }

  function setFields(nextFields) {
    updateActiveForm({ fields: nextFields });
  }

  function handleAddField() {
    if (!newField.label.trim()) return;

    setFields([
      ...fields,
      {
        id: `${activePosition.id}-${Date.now()}`,
        label: newField.label.trim(),
        type: newField.type,
        section: newField.section,
        required: newField.required,
        enabled: true,
      },
    ]);

    setNewField({
      label: "",
      type: "Short Text",
      section: "Interview Assessment",
      required: false,
    });
  }

  function handleToggleField(id, key) {
    setFields(
      fields.map((field) =>
        field.id === id
          ? {
              ...field,
              [key]: !field[key],
            }
          : field,
      ),
    );
  }

  function handleDeleteField(id) {
    setFields(fields.filter((field) => field.id !== id));
  }

  function handleResetFields() {
    const resetForm = createDefaultFormForPosition(activePosition);

    updateActiveForm(resetForm);

    setSearch("");
    setNewField({
      label: "",
      type: "Short Text",
      section: "Interview Assessment",
      required: false,
    });

    setSaveStatus("Reset complete");
  }

  function handleSaveSettings() {
    const nextSettings = {
      ...settings,
      forms: settings.forms.map((form) =>
        form.id === activeForm.id
          ? {
              ...form,
              updatedAt: new Date().toISOString(),
            }
          : form,
      ),
    };

    setSettings(nextSettings);
    safeWriteStorage(RECRUITMENT_SETTINGS_STORAGE_KEY, nextSettings);
    setSaveStatus("Saved");

    window.setTimeout(() => {
      setSaveStatus("");
    }, 1800);
  }

  function getFinalInterviewForm(positionId) {
    if (positionId) {
      return (
        settings.forms.find((form) => form.positionId === positionId) ||
        settings.forms.find((form) => form.positionId === activePosition?.id) ||
        activeForm
      );
    }

    return activeForm;
  }

  return (
    <RecruitmentSettingsContext.Provider
      value={{
        settings,
        setSettings,

        availablePositions,
        setAvailablePositions,
        activePosition,
        activePositionId: settings.activePositionId,
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
        formStatus: activeForm.status,
        passingScore: activeForm.passingScore,
        formDescription: activeForm.description,

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

        saveStatus,

        handleAddField,
        handleToggleField,
        handleDeleteField,
        handleResetFields,
        handleSaveSettings,

        getFinalInterviewForm,

        recruitmentTabs,
        fieldTypes,
        pipelineStages,
      }}
    >
      {children}
    </RecruitmentSettingsContext.Provider>
  );
}

export function useRecruitmentSettings() {
  const context = useContext(RecruitmentSettingsContext);

  if (!context) {
    throw new Error(
      "useRecruitmentSettings must be used inside RecruitmentSettingsProvider",
    );
  }

  return context;
}
