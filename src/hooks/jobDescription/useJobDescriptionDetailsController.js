import { useEffect, useMemo, useState } from "react";

import { getJobDescriptionDropdowns } from "../../lib/axios/getJobDescription";
import { useJobDescription } from "../../services/context/JobDescriptionContext";
import { useUser } from "../../services/context/UserContext";
import {
  isHtmlContent,
  normalizeDocumentText,
} from "../../lib/utils/jobDescription/documentText";
import usePagedJobDescriptionPreview from "./usePagedJobDescriptionPreview";

export default function useJobDescriptionDetailsController({
  hasEditedChanges = false,
  onEditedChange,
  editedChangeDetails = [],
  setEditedChangeDetails,
  onRevisionDraftChange,
  approvalPage = false,
}) {
  const { user } = useUser();

  const { selectedJobDescription, revisionComments, setRevisionComments } =
    useJobDescription();

  const item = selectedJobDescription;

  function getEffectiveDateValue(source = {}) {
    return (
      source.effectiveDate ||
      source.effective_date ||
      source.effectiveDateRaw ||
      source.effective_date_raw ||
      source.raw?.effectiveDate ||
      source.raw?.effective_date ||
      source.raw?.effectiveDateRaw ||
      source.raw?.effective_date_raw ||
      ""
    );
  }

  function getPersonalityTypeValue(source = {}) {
    return String(
      source.personalityType ||
        source.personality_type ||
        source.preferredPersonalityType ||
        source.preferred_personality_type ||
        source.personality ||
        source.preferredPersonality ||
        source.preferred_personality ||
        source.raw?.personalityType ||
        source.raw?.personality_type ||
        source.raw?.preferredPersonalityType ||
        source.raw?.preferred_personality_type ||
        source.raw?.personality ||
        source.raw?.preferredPersonality ||
        source.raw?.preferred_personality ||
        "",
    ).trim();
  }

  function getSourceField(source = {}, camelKey = "", snakeKey = "") {
    return (
      source?.[camelKey] ||
      source?.[snakeKey] ||
      source?.raw?.[camelKey] ||
      source?.raw?.[snakeKey] ||
      ""
    );
  }


  function getOptionLabel(options = [], value = "") {
    const cleanValue = String(value || "").trim();

    if (!cleanValue) return "";

    const option = options.find(
      (item) => String(item.value || "") === cleanValue,
    );

    return option?.label || "";
  }

  function normalizeRevisionDate(value = "") {
    const text = String(value || "").trim();

    if (!text || text === "—") return "";

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
      return text.slice(0, 10);
    }

    const parsed = new Date(text);

    if (Number.isNaN(parsed.getTime())) return text;

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getRevisionAccountId(source = item) {
    return (
      getSourceField(source, "accountId", "account_id") ||
      getSourceField(source, "preparedForId", "prepared_for_id") ||
      ""
    );
  }

  function getRevisionDepartmentId(source = item) {
    return getSourceField(source, "departmentId", "department_id") || "";
  }

  function getRevisionExistingJdId(source = item, recordInfo = {}) {
    return (
      recordInfo?.existingJdId ||
      getSourceField(source, "existingJdId", "existing_jd_id") ||
      getSourceField(source, "linkedHiringRequirement", "linked_hiring_requirement") ||
      ""
    );
  }

  function normalizeCompetenciesForRevision(competencies = []) {
    if (!Array.isArray(competencies)) return [];

    return competencies
      .map((competency) => {
        const title = String(
          competency?.title ||
            competency?.competency ||
            competency?.competencyName ||
            competency?.label ||
            "",
        ).trim();

        const description = String(
          competency?.description ||
            competency?.details ||
            competency?.competencyDescription ||
            competency?.definition ||
            "",
        ).trim();

        const rawLevel = String(
          competency?.level ||
            competency?.proficiencyLevel ||
            competency?.selectedLevel ||
            "",
        )
          .trim()
          .toLowerCase();

        const level =
          rawLevel === "average"
            ? "Average"
            : rawLevel === "proficient"
              ? "Proficient"
              : rawLevel === "excellent"
                ? "Excellent"
                : Number(competency?.average) === 1 || competency?.average === true
                  ? "Average"
                  : Number(competency?.proficient) === 1 ||
                      competency?.proficient === true
                    ? "Proficient"
                    : Number(competency?.excellent) === 1 ||
                        competency?.excellent === true
                      ? "Excellent"
                      : "";

        return {
          id: competency?.id || null,
          title,
          description,
          level,
          average: level === "Average" ? 1 : 0,
          proficient: level === "Proficient" ? 1 : 0,
          excellent: level === "Excellent" ? 1 : 0,
        };
      })
      .filter((competency) => competency.title || competency.description);
  }

  function stringifyCompetenciesForChange(competencies = []) {
    const normalized = normalizeCompetenciesForRevision(competencies);

    if (!normalized.length) return "";

    return normalized
      .map((competency) => {
        const title = competency.title ? `${competency.title}: ` : "";
        const level = competency.level ? ` (${competency.level})` : "";

        return `${title}${competency.description}${level}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");
  }

  function buildRevisionDraftPayload({
    nextRecordInfoDraft = recordInfoDraft,
    nextEditableContent = editableContent,
    nextCompetencies = competencyDrafts,
    nextChangeDetails = editedChangeDetails,
  } = {}) {
    const documentTitle =
      nextRecordInfoDraft.roleTitle ||
      item.documentTitle ||
      item.document_title ||
      item.raw?.documentTitle ||
      item.raw?.document_title ||
      "";

    const roleTitle = nextRecordInfoDraft.roleTitle || documentTitle;
    const accountId =
      nextRecordInfoDraft.accountId ||
      nextRecordInfoDraft.preparedForId ||
      getRevisionAccountId(item);

    const departmentId =
      nextRecordInfoDraft.departmentId || getRevisionDepartmentId(item);
    const effectiveDate = normalizeRevisionDate(nextRecordInfoDraft.effectiveDate);

    return {
      existingJdId: getRevisionExistingJdId(item, nextRecordInfoDraft),
      existing_jd_id: getRevisionExistingJdId(item, nextRecordInfoDraft),
      linkedHiringRequirement: getRevisionExistingJdId(item, nextRecordInfoDraft) || "",
      linked_hiring_requirement: getRevisionExistingJdId(item, nextRecordInfoDraft) || "",

      documentTitle,
      document_title: documentTitle,
      roleTitle,
      role_title: roleTitle,

      accountId,
      account_id: accountId,
      account: nextRecordInfoDraft.preparedFor || item.account || "",
      preparedFor: nextRecordInfoDraft.preparedFor || item.preparedFor || item.account || "",
      prepared_for: nextRecordInfoDraft.preparedFor || item.prepared_for || item.account || "",

      departmentId,
      department_id: departmentId,
      department: nextRecordInfoDraft.department || item.department || "",

      effectiveDate,
      effective_date: effectiveDate,
      reportsTo: nextRecordInfoDraft.reportsTo || "",
      reports_to: nextRecordInfoDraft.reportsTo || "",
      supervisory: nextRecordInfoDraft.supervisory || "No",

      description: nextEditableContent.description || "",
      responsibilities: nextEditableContent.responsibilities || "",
      qualifications: nextEditableContent.qualifications || "",
      personalityType: nextEditableContent.personalityType || "",
      personality_type: nextEditableContent.personalityType || "",
      remarks: nextEditableContent.remarks || item.remarks || "",

      competencies: normalizeCompetenciesForRevision(nextCompetencies),
      desiredCompetencies: normalizeCompetenciesForRevision(nextCompetencies),
      desired_competencies: normalizeCompetenciesForRevision(nextCompetencies),
      changeDetails: nextChangeDetails,
      editedChangeDetails: nextChangeDetails,
    };
  }

  const canManageJdDetails = useMemo(() => {
    // Approval reviewers should be able to use the full-page approval tools
    // even when their adminAccess is not 6 or 7.
    if (approvalPage) return true;

    return [6, 7].includes(Number(user?.adminAccess));
  }, [approvalPage, user?.adminAccess]);

  const [commentModal, setCommentModal] = useState({
    open: false,
    sectionKey: "",
    sectionTitle: "",
    competencyId: null,
    selectedText: "",
    comment: "",
  });

  const [editableContent, setEditableContent] = useState({
    description: item.description || "",
    responsibilities: item.responsibilities || "",
    qualifications: item.qualifications || "",
    personalityType: getPersonalityTypeValue(item),
    remarks: item.remarks || "",
  });

  const [editingSection, setEditingSection] = useState("");
  const [editingDraft, setEditingDraft] = useState("");
  const [editingRecordInfo, setEditingRecordInfo] = useState(false);

  const [recordInfoDraft, setRecordInfoDraft] = useState({
    roleTitle:
      item.roleTitle ||
      item.role_title ||
      item.documentTitle ||
      item.document_title ||
      "",
    department: item.department || "",
    departmentId: getRevisionDepartmentId(item),
    dateRequested: item.dateRequested || item.date_requested || "",
    linkedHiringRequirement:
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      item.existingJdId ||
      item.existing_jd_id ||
      "",
    existingJdId: getRevisionExistingJdId(item),
    preparedFor: item.preparedFor || item.prepared_for || item.account || "",
    accountId: getRevisionAccountId(item),
    preparedForId: getRevisionAccountId(item),
    createdBy:
      item.createdBy ||
      item.created_by ||
      item.requestedBy ||
      item.requested_by ||
      "",
    jdCode: item.jdCode || item.jd_code || "",
    currentVersion:
      item.currentVersion || item.current_version || item.revisionNo || "2.0",
    effectiveDate: getEffectiveDateValue(item),
    lastUpdated: item.lastUpdated || item.last_updated || item.updatedAt || "",
    reportsTo: item.reportsTo || item.reports_to || "",
    supervisory: item.supervisory || "No",
  });

  const [competencyDrafts, setCompetencyDrafts] = useState(
    item.competencies || item.desiredCompetencies || [],
  );

  const [recordDropdownOptions, setRecordDropdownOptions] = useState({
    accounts: [],
    departments: [],
    existingJobDescriptions: [],
  });

  const {
    isCompactDocumentView,
    isPagedPreviewLoading,
    mobilePagedOutputRef,
    pagedOutputRef,
    pagedPreviewScale,
    pagedPreviewViewportRef,
    pagedSourceRef,
  } = usePagedJobDescriptionPreview({
    approvalPage,
    item,
    editableContent,
    recordInfoDraft,
    competencyDrafts,
  });

  const hasRevisionComments = revisionComments.length > 0;

  const disableEditBecauseCommented =
    !canManageJdDetails || hasRevisionComments;

  const disableCommentBecauseEdited = !canManageJdDetails || hasEditedChanges;

  useEffect(() => {
    let cancelled = false;

    async function loadRecordDropdowns() {
      const result = await getJobDescriptionDropdowns();

      if (cancelled || !result?.success) return;

      const accounts = (result.accounts || []).map((account) => ({
        value: String(account.gy_acc_id || account.id || account.value || ""),
        label: String(account.gy_acc_name || account.name || account.label || "").trim(),
      })).filter((option) => option.value && option.label);

      const departments = (result.departments || []).map((department) => ({
        value: String(department.id_department || department.id || department.value || ""),
        label: String(department.name_department || department.name || department.label || "").trim(),
      })).filter((option) => option.value && option.label);

      const existingJobDescriptions = (result.existingJobDescriptions || []).map((jd) => ({
        value: String(jd.id || jd.value || ""),
        label: String(jd.label || jd.documentTitle || jd.document_title || jd.roleTitle || jd.role_title || "").trim(),
      })).filter((option) => option.value && option.label);

      setRecordDropdownOptions({
        accounts,
        departments,
        existingJobDescriptions,
      });
    }

    loadRecordDropdowns();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setEditableContent({
      description: item.description || "",
      responsibilities: item.responsibilities || "",
      qualifications: item.qualifications || "",
      personalityType: getPersonalityTypeValue(item),
      remarks: item.remarks || "",
    });

    setEditingSection("");
    setEditingDraft("");

    setRecordInfoDraft({
      roleTitle:
        item.roleTitle ||
        item.role_title ||
        item.documentTitle ||
        item.document_title ||
        "",
      department: item.department || "",
      departmentId: getRevisionDepartmentId(item),
      dateRequested: item.dateRequested || item.date_requested || "",
      linkedHiringRequirement:
        item.linkedHiringRequirement ||
        item.linked_hiring_requirement ||
        item.existingJdId ||
        item.existing_jd_id ||
        "",
      existingJdId: getRevisionExistingJdId(item),
      preparedFor: item.preparedFor || item.prepared_for || item.account || "",
      accountId: getRevisionAccountId(item),
      preparedForId: getRevisionAccountId(item),
      createdBy:
        item.createdBy ||
        item.created_by ||
        item.requestedBy ||
        item.requested_by ||
        "",
      jdCode: item.jdCode || item.jd_code || "",
      currentVersion:
        item.currentVersion ||
        item.current_version ||
        item.revisionNo ||
        item.revision_no ||
        "2.0",
      effectiveDate: getEffectiveDateValue(item),
      lastUpdated:
        item.lastUpdated || item.last_updated || item.updatedAt || "",
      reportsTo: item.reportsTo || item.reports_to || "",
      supervisory: item.supervisory || "No",
    });

    setCompetencyDrafts(item.competencies || item.desiredCompetencies || []);
    setEditingRecordInfo(false);
    onEditedChange?.(false);
    onRevisionDraftChange?.(
      buildRevisionDraftPayload({
        nextChangeDetails: [],
        nextCompetencies: item.competencies || item.desiredCompetencies || [],
      }),
    );
  }, [item, onEditedChange]);

  function getSelectedText() {
    if (typeof window === "undefined") return "";

    const selection = window.getSelection?.();

    if (!selection || selection.rangeCount === 0) return "";

    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();

    const formattedLines = [];

    function getListPrefix(liElement, depth = 0) {
      const parentList = liElement.parentElement;

      if (!parentList) return "- ";

      const tagName = parentList.tagName?.toLowerCase();

      if (tagName === "ul") {
        return "- ";
      }

      if (tagName === "ol") {
        const siblings = Array.from(parentList.children).filter(
          (child) => child.tagName?.toLowerCase() === "li",
        );

        const index = siblings.indexOf(liElement);

        if (depth > 0) {
          const letter = String.fromCharCode(97 + Math.max(index, 0));
          return `${letter}. `;
        }

        return `${Math.max(index, 0) + 1}. `;
      }

      return "- ";
    }

    function extractNodeText(node, depth = 0) {
      if (!node) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = String(node.textContent || "")
          .replace(/\s+/g, " ")
          .trim();

        if (text) {
          formattedLines.push(text);
        }

        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const tagName = node.tagName?.toLowerCase();

      if (tagName === "li") {
        const prefix = getListPrefix(node, depth);
        const indent = depth > 0 ? "  ".repeat(depth) : "";

        const directTextParts = [];

        Array.from(node.childNodes).forEach((child) => {
          const childTagName = child.tagName?.toLowerCase?.();

          if (childTagName === "ul" || childTagName === "ol") {
            return;
          }

          const text = String(child.textContent || "")
            .replace(/\s+/g, " ")
            .trim();

          if (text) {
            directTextParts.push(text);
          }
        });

        const directText = directTextParts.join(" ").trim();

        if (directText) {
          formattedLines.push(`${indent}${prefix}${directText}`);
        }

        Array.from(node.children).forEach((child) => {
          const childTagName = child.tagName?.toLowerCase();

          if (childTagName === "ul" || childTagName === "ol") {
            Array.from(child.children).forEach((childLi) => {
              extractNodeText(childLi, depth + 1);
            });
          }
        });

        return;
      }

      if (tagName === "ul" || tagName === "ol") {
        Array.from(node.children).forEach((child) => {
          extractNodeText(child, depth);
        });

        return;
      }

      Array.from(node.childNodes).forEach((child) => {
        extractNodeText(child, depth);
      });
    }

    Array.from(fragment.childNodes).forEach((node) => {
      extractNodeText(node);
    });

    const formattedText = formattedLines
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .join("\n");

    if (formattedText) return formattedText;

    return String(selection.toString() || "").trim();
  }

  function clearSelectedText() {
    if (typeof window === "undefined") return;

    window.getSelection?.()?.removeAllRanges?.();
  }

  function openSectionComment(sectionKey, sectionTitle, options = {}) {
    if (!approvalPage || disableCommentBecauseEdited) return;

    const selectedTextFromOptions = String(options.selectedText || "").trim();
    const selectedText = selectedTextFromOptions || getSelectedText();

    setCommentModal({
      open: true,
      sectionKey,
      sectionTitle,
      competencyId: options.competencyId || null,
      selectedText,
      comment: "",
    });
  }

  function closeCommentModal() {
    setCommentModal({
      open: false,
      sectionKey: "",
      sectionTitle: "",
      competencyId: null,
      selectedText: "",
      comment: "",
    });

    clearSelectedText();
  }

  function saveRevisionComment() {
    const commentText = String(commentModal.comment || "").trim();

    if (!commentText) return;

    setRevisionComments?.((prev) => [
      ...prev,
      {
        id: Date.now(),
        jdId: item.id,
        sectionKey: commentModal.sectionKey,
        sectionTitle: commentModal.sectionTitle,
        competencyId: commentModal.competencyId || null,
        selectedText: commentModal.selectedText,
        comment: commentText,
        status: "Open",
        createdAt: new Date().toISOString(),
      },
    ]);

    closeCommentModal();
  }

  function getSectionComments(sectionKey) {
    return revisionComments.filter(
      (comment) => comment.sectionKey === sectionKey,
    );
  }

  function startEditSection(sectionKey) {
    if (!approvalPage || disableEditBecauseCommented) return;

    setEditingSection(sectionKey);
    setEditingDraft(editableContent[sectionKey] || "");
  }

  function cancelEditSection() {
    setEditingSection("");
    setEditingDraft("");
  }

  const fieldLabels = {
    roleTitle: "Document Title / Position",
    department: "Department",
    dateRequested: "Date Requested",
    linkedHiringRequirement: "Linked Hiring Requirement",
    preparedFor: "Prepared For",
    requestedBy: "Created By",
    createdBy: "Created By",
    jdCode: "Document Code",
    currentVersion: "Revision No.",
    effectiveDate: "Effective Date",
    lastUpdated: "Last Reviewed",
    reportsTo: "Reports To",
    supervisory: "Supervisory",
    description: "Position Overview",
    responsibilities: "Duties & Responsibilities",
    qualifications: "Qualifications & Characteristics",
    personalityType: "Preferred Personality Type",
    remarks: "Remarks",
    competencies: "Desired Competencies",
  };

  function saveEditSection(sectionKey) {
  const oldValue = String(
    sectionKey === "personalityType"
      ? getPersonalityTypeValue(item)
      : item?.[sectionKey] || "",
  );

  const shouldNormalizeDocumentText = [
    "description",
    "responsibilities",
    "qualifications",
  ].includes(sectionKey);

  const savedValue = shouldNormalizeDocumentText
    ? isHtmlContent(editingDraft)
      ? String(editingDraft || "").trim()
      : normalizeDocumentText(editingDraft)
    : String(editingDraft || "");

  const newValue = String(savedValue);

  const nextEditableContent = {
    ...editableContent,
    [sectionKey]: savedValue,
  };

  setEditableContent(nextEditableContent);

  setEditedChangeDetails?.((prev) => {
    const withoutCurrent = prev.filter(
      (change) => change.key !== sectionKey,
    );

    const nextChanges =
      oldValue === newValue
        ? withoutCurrent
        : [
            ...withoutCurrent,
            {
              key: sectionKey,
              label:
                fieldLabels[sectionKey] || sectionKey,
              oldValue,
              newValue,
            },
          ];

    onEditedChange?.(nextChanges.length > 0);

    onRevisionDraftChange?.(
      buildRevisionDraftPayload({
        nextEditableContent,
        nextChangeDetails: nextChanges,
      }),
    );

    return nextChanges;
  });

  setEditingSection("");
  setEditingDraft("");
}

  function handleRecordInfoChange(field, value) {
    setRecordInfoDraft((prev) => {
      if (field === "departmentId") {
        const department = getOptionLabel(recordDropdownOptions.departments, value);

        return {
          ...prev,
          departmentId: value,
          department: department || prev.department || "",
        };
      }

      if (field === "accountId" || field === "preparedForId") {
        const preparedFor = getOptionLabel(recordDropdownOptions.accounts, value);

        return {
          ...prev,
          accountId: value,
          preparedForId: value,
          preparedFor: preparedFor || prev.preparedFor || "",
        };
      }

      if (field === "existingJdId") {
        const linkedHiringRequirement = getOptionLabel(
          recordDropdownOptions.existingJobDescriptions,
          value,
        );

        return {
          ...prev,
          existingJdId: value,
          linkedHiringRequirement: linkedHiringRequirement || "",
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  }

  function cancelRecordInfoEdit() {
    setRecordInfoDraft({
      roleTitle:
        item.roleTitle ||
        item.role_title ||
        item.documentTitle ||
        item.document_title ||
        "",
      department: item.department || "",
      departmentId: getRevisionDepartmentId(item),
      dateRequested: item.dateRequested || item.date_requested || "",
      linkedHiringRequirement:
        item.linkedHiringRequirement ||
        item.linked_hiring_requirement ||
        item.existingJdId ||
        item.existing_jd_id ||
        "",
      existingJdId: getRevisionExistingJdId(item),
      preparedFor: item.preparedFor || item.prepared_for || item.account || "",
      accountId: getRevisionAccountId(item),
      preparedForId: getRevisionAccountId(item),
      createdBy:
        item.createdBy ||
        item.created_by ||
        item.requestedBy ||
        item.requested_by ||
        "",
      jdCode: item.jdCode || item.jd_code || "",
      currentVersion:
        item.currentVersion ||
        item.current_version ||
        item.revisionNo ||
        item.revision_no ||
        "2.0",
      effectiveDate: getEffectiveDateValue(item),
      lastUpdated:
        item.lastUpdated || item.last_updated || item.updatedAt || "",
      reportsTo: item.reportsTo || item.reports_to || "",
      supervisory: item.supervisory || "No",
    });

    setEditingRecordInfo(false);
  }

  function saveRecordInfoEdit() {
    const originalRecordInfo = {
      roleTitle:
        item.roleTitle ||
        item.role_title ||
        item.documentTitle ||
        item.document_title ||
        "",
      department: item.department || "",
      departmentId: getRevisionDepartmentId(item),
      dateRequested: item.dateRequested || item.date_requested || "",
      linkedHiringRequirement:
        item.linkedHiringRequirement ||
        item.linked_hiring_requirement ||
        item.existingJdId ||
        item.existing_jd_id ||
        "",
      existingJdId: getRevisionExistingJdId(item),
      preparedFor: item.preparedFor || item.prepared_for || item.account || "",
      accountId: getRevisionAccountId(item),
      preparedForId: getRevisionAccountId(item),
      createdBy:
        item.createdBy ||
        item.created_by ||
        item.requestedBy ||
        item.requested_by ||
        "",
      jdCode: item.jdCode || item.jd_code || "",
      currentVersion:
        item.currentVersion ||
        item.current_version ||
        item.revisionNo ||
        item.revision_no ||
        "2.0",
      effectiveDate: getEffectiveDateValue(item),
      lastUpdated:
        item.lastUpdated || item.last_updated || item.updatedAt || "",
      reportsTo: item.reportsTo || item.reports_to || "",
      supervisory: item.supervisory || "No",
    };

    setEditedChangeDetails?.((prev) => {
      const recordKeys = Object.keys(originalRecordInfo);

      const withoutRecordInfo = prev.filter(
        (change) => !recordKeys.includes(change.key),
      );

      const recordChanges = recordKeys
        .filter(
          (key) =>
            String(originalRecordInfo[key] || "") !==
            String(recordInfoDraft[key] || ""),
        )
        .map((key) => ({
          key,
          label: fieldLabels[key] || key,
          oldValue: originalRecordInfo[key] || "",
          newValue: recordInfoDraft[key] || "",
        }));

      const nextChanges = [...withoutRecordInfo, ...recordChanges];

      onEditedChange?.(nextChanges.length > 0);
      onRevisionDraftChange?.(
        buildRevisionDraftPayload({
          nextRecordInfoDraft: recordInfoDraft,
          nextChangeDetails: nextChanges,
        }),
      );

      return nextChanges;
    });

    setEditingRecordInfo(false);
  }

  function handleCompetenciesChange(nextCompetencies = []) {
    const previousCompetencies = item.competencies || item.desiredCompetencies || [];
    const normalizedNextCompetencies = Array.isArray(nextCompetencies)
      ? nextCompetencies
      : [];

    setCompetencyDrafts(normalizedNextCompetencies);

    setEditedChangeDetails?.((prev) => {
      const withoutCompetencies = prev.filter(
        (change) => change.key !== "competencies",
      );

      const oldValue = stringifyCompetenciesForChange(previousCompetencies);
      const newValue = stringifyCompetenciesForChange(normalizedNextCompetencies);

      const nextChanges =
        oldValue === newValue
          ? withoutCompetencies
          : [
              ...withoutCompetencies,
              {
                key: "competencies",
                label: fieldLabels.competencies || "Desired Competencies",
                oldValue,
                newValue,
              },
            ];

      onEditedChange?.(nextChanges.length > 0);
      onRevisionDraftChange?.(
        buildRevisionDraftPayload({
          nextCompetencies: normalizedNextCompetencies,
          nextChangeDetails: nextChanges,
        }),
      );

      return nextChanges;
    });
  }

  function getEditDisabledTitle(defaultTitle) {
    if (!canManageJdDetails) {
      return "Only authorized JD reviewers can edit this JD.";
    }

    if (disableEditBecauseCommented) {
      return "Editing is disabled because this JD has revision comments.";
    }

    return defaultTitle;
  }

  function getCommentDisabledTitle(defaultTitle) {
    if (!canManageJdDetails) {
      return "Only authorized JD reviewers can add revision comments.";
    }

    if (disableCommentBecauseEdited) {
      return "Commenting is disabled because this JD already has edited changes.";
    }

    return defaultTitle;
  }

  function normalizeRevisionCompareText(value = "") {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function getRecordFieldComments(fieldValue = "") {
    const comments = getSectionComments("recordInformation");
    const normalizedFieldValue = normalizeRevisionCompareText(fieldValue);

    if (!normalizedFieldValue) return [];

    return comments.filter((comment) => {
      const selectedText = normalizeRevisionCompareText(comment.selectedText);

      if (!selectedText) return false;

      return (
        selectedText === normalizedFieldValue ||
        selectedText.includes(normalizedFieldValue) ||
        normalizedFieldValue.includes(selectedText)
      );
    });
  }

  return {
    canManageJdDetails,
    cancelEditSection,
    cancelRecordInfoEdit,
    closeCommentModal,
    commentModal,
    competencyDrafts,
    disableCommentBecauseEdited,
    disableEditBecauseCommented,
    editableContent,
    editingDraft,
    editingRecordInfo,
    editingSection,
    getCommentDisabledTitle,
    getEditDisabledTitle,
    getRecordFieldComments,
    getSectionComments,
    handleCompetenciesChange,
    handleRecordInfoChange,
    isCompactDocumentView,
    isPagedPreviewLoading,
    item,
    mobilePagedOutputRef,
    openSectionComment,
    pagedOutputRef,
    pagedPreviewScale,
    pagedPreviewViewportRef,
    pagedSourceRef,
    recordDropdownOptions,
    recordInfoDraft,
    saveEditSection,
    saveRecordInfoEdit,
    saveRevisionComment,
    setCommentModal,
    setEditingDraft,
    setEditingRecordInfo,
    startEditSection,
  };
}
