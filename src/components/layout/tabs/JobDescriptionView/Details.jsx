import React, { useEffect, useMemo, useState } from "react";
import { PencilLine, SquarePen, X } from "lucide-react";
import { normalizeJdStatus } from "../../../../lib/utils/NormalizeJDStatus";
import { formatDate } from "../../FormatDateTime";
import DesiredCompetenciesViewTable from "../../../tables/jobDescription/DesiredCompetenciesViewTable";
import { useUser } from "../../../../services/context/UserContext";
import { useJobDescription } from "../../../../services/context/JobDescriptionContext";

const Details = ({
  onOpenRevision,
  hasEditedChanges = false,
  onEditedChange,
  editedChangeDetails = [],
  setEditedChangeDetails,
  approvalPage = false,
}) => {
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

  const canManageJdDetails = useMemo(() => {
    return [6, 7].includes(Number(user?.adminAccess));
  }, [user?.adminAccess]);

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
    dateRequested: item.dateRequested || item.date_requested || "",
    linkedHiringRequirement:
      item.linkedHiringRequirement ||
      item.linked_hiring_requirement ||
      item.existingJdId ||
      item.existing_jd_id ||
      "",
    preparedFor: item.preparedFor || item.prepared_for || item.account || "",
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

  const hasRevisionComments = revisionComments.length > 0;

  const disableEditBecauseCommented =
    !canManageJdDetails || hasRevisionComments;

  const disableCommentBecauseEdited = !canManageJdDetails || hasEditedChanges;

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
      dateRequested: item.dateRequested || item.date_requested || "",
      linkedHiringRequirement:
        item.linkedHiringRequirement ||
        item.linked_hiring_requirement ||
        item.existingJdId ||
        item.existing_jd_id ||
        "",
      preparedFor: item.preparedFor || item.prepared_for || item.account || "",
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
    onEditedChange?.(false);
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
  };

  function saveEditSection(sectionKey) {
    const oldValue = String(
      sectionKey === "personalityType"
        ? getPersonalityTypeValue(item)
        : item?.[sectionKey] || "",
    );

    const newValue = String(editingDraft || "");

    setEditableContent((prev) => ({
      ...prev,
      [sectionKey]: editingDraft,
    }));

    setEditedChangeDetails?.((prev) => {
      const withoutCurrent = prev.filter((change) => change.key !== sectionKey);

      const nextChanges =
        oldValue === newValue
          ? withoutCurrent
          : [
              ...withoutCurrent,
              {
                key: sectionKey,
                label: fieldLabels[sectionKey] || sectionKey,
                oldValue,
                newValue,
              },
            ];

      onEditedChange?.(nextChanges.length > 0);

      return nextChanges;
    });

    setEditingSection("");
    setEditingDraft("");
  }

  function handleRecordInfoChange(field, value) {
    setRecordInfoDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
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
      dateRequested: item.dateRequested || item.date_requested || "",
      linkedHiringRequirement:
        item.linkedHiringRequirement ||
        item.linked_hiring_requirement ||
        item.existingJdId ||
        item.existing_jd_id ||
        "",
      preparedFor: item.preparedFor || item.prepared_for || item.account || "",
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
      dateRequested: item.dateRequested || item.date_requested || "",
      linkedHiringRequirement:
        item.linkedHiringRequirement ||
        item.linked_hiring_requirement ||
        item.existingJdId ||
        item.existing_jd_id ||
        "",
      preparedFor: item.preparedFor || item.prepared_for || item.account || "",
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

      return nextChanges;
    });

    setEditingRecordInfo(false);
  }

  function getEditDisabledTitle(defaultTitle) {
    if (!canManageJdDetails) {
      return "Only admin access roles 6 and 7 can edit this JD.";
    }

    if (disableEditBecauseCommented) {
      return "Editing is disabled because this JD has revision comments.";
    }

    return defaultTitle;
  }

  function getCommentDisabledTitle(defaultTitle) {
    if (!canManageJdDetails) {
      return "Only admin access roles 6 and 7 can add revision comments.";
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

  return (
    <article className="mx-auto w-full max-w-[816px] space-y-8 bg-white px-6 py-8 text-[#1D2939] shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:px-10 sm:py-10 lg:min-h-[1056px] print:shadow-none">
      <header className="border-b border-[#D9E2EC] pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sibs-primary-1/70">
              Job Description
            </p>

            <h1 className="mt-2 break-words text-2xl font-extrabold leading-tight text-sibs-primary-1 sm:text-[28px]">
              {recordInfoDraft.roleTitle || item.roleTitle || "Job Description"}
            </h1>

            <p className="mt-2 text-sm font-bold text-[#475467]">
              {recordInfoDraft.department || item.department || "—"} • {recordInfoDraft.preparedFor || item.account || "—"}
            </p>
          </div>

          <p className="shrink-0 text-xs font-bold text-sibs-tertiary-5">
            Page 1 of 1
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#EEF2F6] pt-5 text-xs sm:grid-cols-4">
          <DocumentMeta label="Document Code" value={recordInfoDraft.jdCode} />
          <DocumentMeta label="Revision No." value={recordInfoDraft.currentVersion} />
          <DocumentMeta label="Effective Date" value={formatDate(recordInfoDraft.effectiveDate)} />
          <DocumentMeta label="Last Reviewed" value={formatDate(recordInfoDraft.lastUpdated)} />
          <DocumentMeta label="Prepared For" value={recordInfoDraft.preparedFor} />
          <DocumentMeta label="Created By" value={recordInfoDraft.createdBy} />
          <DocumentMeta label="Reports To" value={recordInfoDraft.reportsTo} />
          <DocumentMeta label="Supervisory" value={recordInfoDraft.supervisory || "No"} />
        </div>
      </header>
      {normalizeJdStatus(item.jdStatus) === "For Revision" && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-amber-700">
                Revision Required
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-amber-700/90">
                This job description needs revision before it can be treated as
                sourcing-ready.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenRevision?.(item)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              <PencilLine size={16} />
              Revise Job Description
            </button>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-visible border-b border-[#D9E2EC] bg-white pb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#101828]">
                Record Information
              </h3>

              {getSectionComments("recordInformation").length > 0 && (
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">
                  {getSectionComments("recordInformation").length} comment
                  {getSectionComments("recordInformation").length > 1
                    ? "s"
                    : ""}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              Key document details and tracking information.
            </p>
          </div>

          {approvalPage && canManageJdDetails && (
            <div className="flex shrink-0 items-center gap-2">
              {!editingRecordInfo ? (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (disableEditBecauseCommented) return;
                      setEditingRecordInfo(true);
                    }}
                    disabled={disableEditBecauseCommented}
                    title={getEditDisabledTitle("Edit record information.")}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                      disableEditBecauseCommented
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <SquarePen size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      openSectionComment(
                        "recordInformation",
                        "Record Information",
                      )
                    }
                    disabled={disableCommentBecauseEdited}
                    title={getCommentDisabledTitle("Add revision comment.")}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                      disableCommentBecauseEdited
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "border-blue-100 bg-blue-50 text-sibs-primary-1 hover:bg-blue-100"
                    }`}
                  >
                    <PencilLine size={14} />
                    Add Comment
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={cancelRecordInfoEdit}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-3 text-xs font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveRecordInfoEdit}
                    className="inline-flex h-8 items-center justify-center rounded-lg bg-sibs-primary-1 px-3 text-xs font-extrabold text-white transition hover:opacity-90"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="relative grid grid-cols-1 overflow-visible rounded-xl border border-[#E6ECF2] lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="border-b border-[#E6ECF2] p-5 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/80">
              Document Title
            </p>

            {editingRecordInfo ? (
              <input
                value={recordInfoDraft.roleTitle}
                onChange={(e) =>
                  handleRecordInfoChange("roleTitle", e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-[#D7DEE8] bg-white px-3 py-2 text-xl font-extrabold leading-7 text-[#101828] outline-none transition focus:border-sibs-primary-1"
              />
            ) : (
              <h3 className="mt-2 text-xl font-extrabold leading-7 text-[#101828]">
                {recordInfoDraft.roleTitle || "—"}
              </h3>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DocumentInfoInput
                label="Position"
                value={recordInfoDraft.roleTitle}
                editable={editingRecordInfo}
                comments={getRecordFieldComments(recordInfoDraft.roleTitle)}
                onChange={(value) => handleRecordInfoChange("roleTitle", value)}
              />

              <DocumentInfoInput
                label="Department"
                value={recordInfoDraft.department}
                editable={editingRecordInfo}
                comments={getRecordFieldComments(recordInfoDraft.department)}
                onChange={(value) =>
                  handleRecordInfoChange("department", value)
                }
              />

              <DocumentInfoInput
                label="Date Requested"
                value={recordInfoDraft.dateRequested}
                displayValue={formatDate(recordInfoDraft.dateRequested)}
                editable={editingRecordInfo}
                inputType="date"
                comments={getRecordFieldComments(
                  formatDate(recordInfoDraft.dateRequested),
                )}
                onChange={(value) =>
                  handleRecordInfoChange("dateRequested", value)
                }
              />

              <DocumentInfoInput
                label="Linked Hiring Requirement"
                value={recordInfoDraft.linkedHiringRequirement}
                editable={editingRecordInfo}
                comments={getRecordFieldComments(
                  recordInfoDraft.linkedHiringRequirement,
                )}
                onChange={(value) =>
                  handleRecordInfoChange("linkedHiringRequirement", value)
                }
              />

              <DocumentInfoInput
                label="Prepared For"
                value={recordInfoDraft.preparedFor}
                editable={editingRecordInfo}
                comments={getRecordFieldComments(recordInfoDraft.preparedFor)}
                onChange={(value) =>
                  handleRecordInfoChange("preparedFor", value)
                }
              />

              <DocumentInfoInput
                label="Created By"
                value={recordInfoDraft.createdBy}
                editable={editingRecordInfo}
                comments={getRecordFieldComments(recordInfoDraft.createdBy)}
                onChange={(value) => handleRecordInfoChange("createdBy", value)}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-2 overflow-visible lg:grid-cols-1">
            <CompactSummaryRowRight
              label="Document Code"
              value={recordInfoDraft.jdCode}
              editable={editingRecordInfo}
              comments={getRecordFieldComments(recordInfoDraft.jdCode)}
              onChange={(value) => handleRecordInfoChange("jdCode", value)}
              className="border-b border-r border-[#E6ECF2] lg:border-r-0"
            />

            <CompactSummaryRowRight
              label="Revision No."
              value={recordInfoDraft.currentVersion}
              editable={editingRecordInfo}
              comments={getRecordFieldComments(recordInfoDraft.currentVersion)}
              onChange={(value) =>
                handleRecordInfoChange("currentVersion", value)
              }
              className="border-b border-[#E6ECF2]"
            />

            <CompactSummaryRowRight
              label="Effective Date"
              value={recordInfoDraft.effectiveDate}
              displayValue={formatDate(recordInfoDraft.effectiveDate)}
              editable={editingRecordInfo}
              inputType="date"
              comments={getRecordFieldComments(
                formatDate(recordInfoDraft.effectiveDate),
              )}
              onChange={(value) =>
                handleRecordInfoChange("effectiveDate", value)
              }
              className="border-r border-[#E6ECF2] lg:border-r-0 lg:border-b"
            />

            <CompactSummaryRowRight
              label="Last Reviewed"
              value={recordInfoDraft.lastUpdated}
              displayValue={formatDate(recordInfoDraft.lastUpdated)}
              editable={editingRecordInfo}
              inputType="date"
              comments={getRecordFieldComments(
                formatDate(recordInfoDraft.lastUpdated),
              )}
              onChange={(value) => handleRecordInfoChange("lastUpdated", value)}
            />
          </div>
        </div>

        <div className="relative overflow-visible rounded-b-xl border-t border-[#E6ECF2] bg-[#F8FAFC] p-5">
          <div className="relative grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2">
            <CompactSummaryRowBottom
              label="Reports To"
              value={recordInfoDraft.reportsTo}
              editable={editingRecordInfo}
              comments={getRecordFieldComments(recordInfoDraft.reportsTo)}
              onChange={(value) => handleRecordInfoChange("reportsTo", value)}
            />

            <CompactSummaryRowBottom
              label="Supervisory"
              value={recordInfoDraft.supervisory || "No"}
              editable={editingRecordInfo}
              comments={getRecordFieldComments(
                recordInfoDraft.supervisory || "No",
              )}
              onChange={(value) => handleRecordInfoChange("supervisory", value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-7">
        <DetailArticleSection
          sectionKey="description"
          title="Position Overview"
          value={editableContent.description}
          emptyText="No Position Overview provided."
          comments={getSectionComments("description")}
          onAddComment={openSectionComment}
          isEditing={editingSection === "description"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={startEditSection}
          onCancelEdit={cancelEditSection}
          onSaveEdit={saveEditSection}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          canManageJdDetails={canManageJdDetails}
          approvalPage={approvalPage}
        />

        <DetailArticleSection
          sectionKey="responsibilities"
          title="Duties & Responsibilities"
          value={editableContent.responsibilities}
          emptyText="No responsibilities provided."
          comments={getSectionComments("responsibilities")}
          onAddComment={openSectionComment}
          isEditing={editingSection === "responsibilities"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={startEditSection}
          onCancelEdit={cancelEditSection}
          onSaveEdit={saveEditSection}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          canManageJdDetails={canManageJdDetails}
          approvalPage={approvalPage}
        />

        <DetailArticleSection
          sectionKey="qualifications"
          title="Qualifications & Characteristics"
          value={editableContent.qualifications}
          emptyText="No qualifications provided."
          comments={getSectionComments("qualifications")}
          onAddComment={openSectionComment}
          isEditing={editingSection === "qualifications"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={startEditSection}
          onCancelEdit={cancelEditSection}
          onSaveEdit={saveEditSection}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          canManageJdDetails={canManageJdDetails}
          approvalPage={approvalPage}
        />

        <PreferredPersonalityTypeSection
          value={editableContent.personalityType}
          comments={getSectionComments("personalityType")}
          approvalPage={approvalPage}
          canManageJdDetails={canManageJdDetails}
          disableEdit={disableEditBecauseCommented}
          disableComment={disableCommentBecauseEdited}
          isEditing={editingSection === "personalityType"}
          editingDraft={editingDraft}
          setEditingDraft={setEditingDraft}
          onStartEdit={() => startEditSection("personalityType")}
          onCancelEdit={cancelEditSection}
          onSaveEdit={() => saveEditSection("personalityType")}
          onAddComment={(options = {}) =>
            openSectionComment(
              "personalityType",
              "Preferred Personality Type",
              options,
            )
          }
        />

        <div>
          <DesiredCompetenciesViewTable
            competencies={item.competencies || item.desiredCompetencies || []}
            comments={getSectionComments("competencies")}
            onAddComment={openSectionComment}
            disableEdit={disableEditBecauseCommented}
            disableComment={disableCommentBecauseEdited}
            canManageActions={approvalPage && canManageJdDetails}
            onEditedChange={onEditedChange}
          />
        </div>
      </section>



      {commentModal.open && approvalPage && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E6ECF2] px-5 py-4">
              <div>
                <h3 className="text-base font-extrabold text-[#101828]">
                  Add Revision Comment
                </h3>

                <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
                  {commentModal.sectionTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCommentModal}
                className="rounded-lg p-1 text-sibs-tertiary-5 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {commentModal.selectedText ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
                    {commentModal.sectionKey === "personalityType"
                      ? "Selected Personality Type"
                      : "Highlighted Text"}
                  </p>

                  <div className="mt-3 selection:bg-[#FFF3B8] selection:text-[#101828]">
                    <HighlightedRevisionText
                      value={commentModal.selectedText}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold leading-6 text-amber-700">
                    No highlighted text detected. This comment will apply to the
                    whole section.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-bold text-sibs-primary-1">
                  Revision Comment <span className="text-red-500">*</span>
                </label>

                <textarea
                  rows={5}
                  value={commentModal.comment}
                  onChange={(e) =>
                    setCommentModal((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                  placeholder="Explain what needs to be changed..."
                  className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
              <button
                type="button"
                onClick={closeCommentModal}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveRevisionComment}
                disabled={!String(commentModal.comment || "").trim()}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-sibs-primary-2 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

function DocumentMeta({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-extrabold uppercase tracking-wide text-sibs-primary-1/60">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-extrabold text-[#344054]">
        {value || "—"}
      </p>
    </div>
  );
}

function DocumentInfoInput({
  label,
  value,
  displayValue,
  editable = false,
  inputType = "text",
  comments = [],
  onChange,
}) {
  const finalDisplayValue = displayValue || value || "—";
  const hasComments = Array.isArray(comments) && comments.length > 0;
  const firstComment = comments[0];

  return (
    <div
      className={`group relative min-h-[68px] min-w-0 rounded-lg px-4 py-3 transition selection:bg-[#FFF3B8] selection:text-[#101828] ${
        hasComments
          ? "border border-amber-200 bg-amber-50 hover:cursor-pointer"
          : "bg-[#F8FAFC]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`truncate text-[10px] font-extrabold uppercase tracking-wide ${
            hasComments ? "text-amber-700" : "text-sibs-primary-1/70"
          }`}
        >
          {label}
        </p>

        {hasComments && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
            Needs revision
          </span>
        )}
      </div>

      {editable ? (
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#D7DEE8] bg-white px-3 py-2 text-sm font-bold leading-5 text-[#344054] outline-none transition focus:border-sibs-primary-1"
        />
      ) : (
        <p
          title={finalDisplayValue}
          className={`mt-1 max-w-full overflow-x-auto whitespace-nowrap text-sm font-bold leading-5 selection:bg-[#FFF3B8] selection:text-[#101828] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1] [&::-webkit-scrollbar-track]:bg-transparent ${
            hasComments ? "text-amber-800" : "text-[#344054]"
          }`}
        >
          {finalDisplayValue}
        </p>
      )}

      {hasComments && (
        <div className="pointer-events-none absolute left-0 right-0 top-[calc(100%-4px)] z-50 translate-y-1 rounded-xl border border-orange-100 bg-white p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-2 group-focus-within:opacity-100">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>

            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
              {firstComment?.status || "Open"}
            </span>
          </div>

          <p className="text-xs font-semibold leading-5 text-orange-800">
            {firstComment?.comment || "No revision comment provided."}
          </p>
        </div>
      )}
    </div>
  );
}

function CompactSummaryRowRight({
  label,
  value,
  displayValue,
  className = "",
  editable = false,
  inputType = "text",
  comments = [],
  onChange,
}) {
  const finalDisplayValue = displayValue || value || "—";
  const hasComments = Array.isArray(comments) && comments.length > 0;
  const firstComment = comments[0];

  return (
    <div
      className={`group relative z-0 min-h-[82px] overflow-visible px-4 py-3 transition selection:bg-[#FFF3B8] selection:text-[#101828] hover:z-[9999] focus-within:z-[9999] ${
        hasComments
          ? "border border-amber-200 bg-amber-50 hover:cursor-pointer"
          : "bg-white"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[10px] font-extrabold uppercase tracking-wide ${
            hasComments ? "text-amber-700" : "text-sibs-primary-1/70"
          }`}
        >
          {label}
        </p>

        {hasComments && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
            Needs revision
          </span>
        )}
      </div>

      {editable ? (
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-sm font-bold leading-5 text-[#344054] outline-none transition focus:border-sibs-primary-1"
        />
      ) : (
        <p
          title={finalDisplayValue}
          className={`mt-1 break-words text-sm font-bold leading-5 selection:bg-[#FFF3B8] selection:text-[#101828] ${
            hasComments ? "text-amber-800" : "text-[#344054]"
          }`}
        >
          {finalDisplayValue}
        </p>
      )}

      {hasComments && (
        <div className="pointer-events-none absolute left-0 right-0 top-[calc(100%-4px)] z-999 translate-y-1 rounded-xl border border-orange-100 bg-white p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-2 group-focus-within:opacity-100">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>

            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
              {firstComment?.status || "Open"}
            </span>
          </div>

          <p className="text-xs font-semibold leading-5 text-orange-800">
            {firstComment?.comment || "No revision comment provided."}
          </p>
        </div>
      )}
    </div>
  );
}

function CompactSummaryRowBottom({
  label,
  value,
  displayValue,
  className = "",
  editable = false,
  inputType = "text",
  comments = [],
  onChange,
}) {
  const finalDisplayValue = displayValue || value || "—";
  const hasComments = Array.isArray(comments) && comments.length > 0;
  const firstComment = comments[0];

  return (
    <div
      className={`group relative z-0 min-h-[82px] overflow-visible rounded-xl px-4 py-3 transition selection:bg-[#FFF3B8] selection:text-[#101828] hover:z-[9999] focus-within:z-[9999] ${
        hasComments
          ? "border border-amber-200 bg-amber-50 hover:cursor-pointer"
          : "bg-white"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[10px] font-extrabold uppercase tracking-wide ${
            hasComments ? "text-amber-700" : "text-sibs-primary-1/70"
          }`}
        >
          {label}
        </p>

        {hasComments && (
          <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
            Needs revision
          </span>
        )}
      </div>

      {editable ? (
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-sm font-bold leading-5 text-[#344054] outline-none transition focus:border-sibs-primary-1"
        />
      ) : (
        <p
          title={finalDisplayValue}
          className={`mt-1 break-words text-sm font-bold leading-5 selection:bg-[#FFF3B8] selection:text-[#101828] ${
            hasComments ? "text-amber-800" : "text-[#344054]"
          }`}
        >
          {finalDisplayValue}
        </p>
      )}

      {hasComments && (
        <div className="pointer-events-none absolute left-0 right-0 top-[calc(100%-4px)] z-999 translate-y-1 rounded-xl border border-orange-100 bg-white p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-2 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-2 group-focus-within:opacity-100">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>

            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
              {firstComment?.status || "Open"}
            </span>
          </div>

          <p className="text-xs font-semibold leading-5 text-orange-800">
            {firstComment?.comment || "No revision comment provided."}
          </p>
        </div>
      )}
    </div>
  );
}

function parseDetailContent(value) {
  const lines = String(value || "")
    .replace(/\r/g, "")
    .split("\n");

  const blocks = [];
  let listItems = [];
  let currentParent = null;
  let currentChild = null;
  let currentListOrdered = false;

  const flushCurrentParent = () => {
    if (currentParent) {
      listItems.push(currentParent);
      currentParent = null;
      currentChild = null;
    }
  };

  const flushList = () => {
    flushCurrentParent();

    if (listItems.length > 0) {
      blocks.push({
        type: "list",
        ordered: currentListOrdered,
        items: [...listItems],
      });

      listItems = [];
      currentListOrdered = false;
      currentChild = null;
    }
  };

  const attachDecimalChild = (parentNumber, child) => {
    if (
      currentParent &&
      String(currentParent.number || "") === String(parentNumber || "")
    ) {
      currentParent.children.push(child);
      currentChild = child;
      return;
    }

    flushCurrentParent();

    const targetParent =
      [...listItems]
        .reverse()
        .find(
          (item) => String(item.number || "") === String(parentNumber || ""),
        ) || listItems[listItems.length - 1];

    if (targetParent) {
      targetParent.children.push(child);
      currentChild = child;
      return;
    }

    currentListOrdered = true;
    currentParent = {
      text: `${child.prefix} ${child.text}`.trim(),
      children: [],
      number: null,
    };
    currentChild = null;
  };

  lines.forEach((rawLine) => {
    const line = String(rawLine || "").replace(/\t/g, "    ");
    const trimmed = line.trim();

    if (!trimmed) {
      currentChild = null;
      return;
    }

    const decimalMatch = trimmed.match(/^(\d+)\.(\d+)(?:[.)])?\s+(.*)$/);
    const numberMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    const bulletMatch = trimmed.match(/^[-•*]\s+(.*)$/);
    const letterMatch = trimmed.match(/^([a-zA-Z])[.)]\s+(.*)$/);

    if (decimalMatch) {
      const parentNumber = decimalMatch[1];
      const childNumber = decimalMatch[2];
      const childText = decimalMatch[3].trim();

      if (listItems.length > 0 && !currentListOrdered) {
        flushList();
      }

      currentListOrdered = true;

      attachDecimalChild(parentNumber, {
        text: childText,
        prefix: `${parentNumber}.${childNumber}.`,
      });

      return;
    }

    if (numberMatch) {
      if (listItems.length > 0 && !currentListOrdered) {
        flushList();
      }

      flushCurrentParent();
      currentListOrdered = true;

      currentParent = {
        text: numberMatch[2].trim(),
        children: [],
        number: Number(numberMatch[1]),
      };

      currentChild = null;
      return;
    }

    if (bulletMatch) {
      if (listItems.length > 0 && currentListOrdered) {
        flushList();
      }

      flushCurrentParent();
      currentListOrdered = false;

      currentParent = {
        text: bulletMatch[1].trim(),
        children: [],
        number: null,
      };

      currentChild = null;
      return;
    }

    if (letterMatch) {
      const childText = letterMatch[2].trim();

      const child = {
        text: childText,
        prefix: `${letterMatch[1].toLowerCase()}.`,
      };

      if (currentParent) {
        currentParent.children.push(child);
        currentChild = child;
      } else if (listItems.length > 0) {
        listItems[listItems.length - 1].children.push(child);
        currentChild = child;
      } else {
        currentListOrdered = false;
        currentParent = {
          text: "",
          children: [child],
          number: null,
        };
        currentChild = child;
      }

      return;
    }

    if (currentChild) {
      currentChild.text = `${currentChild.text} ${trimmed}`
        .replace(/\s+/g, " ")
        .trim();
      return;
    }

    if (currentParent) {
      currentParent.text = `${currentParent.text} ${trimmed}`
        .replace(/\s+/g, " ")
        .trim();
      return;
    }

    flushList();

    blocks.push({
      type: "paragraph",
      text: trimmed,
    });
  });

  flushList();

  return blocks;
}

function getChildText(child = "") {
  if (typeof child === "string") return child;
  return String(child?.text || "");
}

function getChildPrefix(child = "") {
  if (typeof child === "string") return "";
  return String(child?.prefix || "");
}

function DetailArticleSection({
  sectionKey,
  title,
  value,
  emptyText,
  comments = [],
  onAddComment,
  isEditing = false,
  editingDraft = "",
  setEditingDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  disableEdit = false,
  disableComment = false,
  canManageJdDetails = false,
  approvalPage = false,
}) {
  function getEditTitle() {
    if (!canManageJdDetails) {
      return "Only admin access roles 6 and 7 can edit this JD.";
    }

    if (disableEdit) {
      return "Editing is disabled because this JD has revision comments.";
    }

    return "Edit this section.";
  }

  function getCommentTitle() {
    if (!canManageJdDetails) {
      return "Only admin access roles 6 and 7 can add revision comments.";
    }

    if (disableComment) {
      return "Commenting is disabled because this JD already has edited changes.";
    }

    return "Add revision comment.";
  }

  const sectionNumber = {
    description: "1",
    responsibilities: "2",
    qualifications: "3",
  }[sectionKey];

  return (
    <section className="break-inside-avoid">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="text-[15px] font-extrabold uppercase tracking-wide text-[#101828]">
            {sectionNumber ? `${sectionNumber}. ${title}` : title}
          </h4>

          {comments.length > 0 && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">
              {comments.length} comment{comments.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {approvalPage && !isEditing && canManageJdDetails && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onStartEdit?.(sectionKey)}
              disabled={disableEdit}
              title={getEditTitle()}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableEdit
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
              }`}
            >
              <SquarePen size={14} />
              Edit
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAddComment?.(sectionKey, title)}
              disabled={disableComment}
              title={getCommentTitle()}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableComment
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-blue-100 bg-blue-50 text-sibs-primary-1 hover:bg-blue-100"
              }`}
            >
              <PencilLine size={14} />
              Add Comment
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="rounded-xl border border-[#D7DEE8] bg-white p-3 shadow-sm">
          <textarea
            rows={8}
            value={editingDraft}
            onChange={(e) => setEditingDraft?.(e.target.value)}
            className="min-h-[180px] w-full resize-y rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 text-sm font-medium leading-7 text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1"
          />

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onSaveEdit?.(sectionKey)}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <DetailRichContent
          value={value}
          emptyText={emptyText}
          approvalPage={approvalPage}
          comments={comments}
        />
      )}
    </section>
  );
}

function PreferredPersonalityTypeSection({
  value = "",
  comments = [],
  approvalPage = false,
  canManageJdDetails = false,
  disableEdit = false,
  disableComment = false,
  isEditing = false,
  editingDraft = "",
  setEditingDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onAddComment,
}) {
  const [selectedTypes, setSelectedTypes] = useState([]);

  const PERSONALITY_TYPE_LABELS = {
    INTJ: "Architect",
    INTP: "Logician",
    ENTJ: "Commander",
    ENTP: "Debater",
    INFJ: "Advocate",
    INFP: "Mediator",
    ENFJ: "Protagonist",
    ENFP: "Campaigner",
    ISTJ: "Logistician",
    ISFJ: "Defender",
    ESTJ: "Executive",
    ESFJ: "Consul",
    ISTP: "Virtuoso",
    ISFP: "Adventurer",
    ESTP: "Entrepreneur",
    ESFP: "Entertainer",
  };

  function formatPersonalityTypeLabel(type = "") {
    const cleanType = String(type || "").trim();

    if (!cleanType) return "";

    if (cleanType.includes("(") && cleanType.includes(")")) {
      return cleanType;
    }

    const code = cleanType.toUpperCase();
    const label = PERSONALITY_TYPE_LABELS[code];

    return label ? `${code} (${label})` : cleanType;
  }

  function normalizePersonalityCompare(value = "") {
    return String(value || "")
      .trim()
      .replace(/[()]/g, " ")
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function getCommentSelectedText(comment = {}) {
    return String(comment.selectedText || comment.selected_text || "").trim();
  }

  const personalityTypes = String(value || "")
    .split(/[,;\n|]/)
    .map((item) => item.trim())
    .filter(Boolean);

  useEffect(() => {
    setSelectedTypes((prev) =>
      prev.filter((selectedType) =>
        personalityTypes.some(
          (type) =>
            normalizePersonalityCompare(type) ===
              normalizePersonalityCompare(selectedType) ||
            normalizePersonalityCompare(formatPersonalityTypeLabel(type)) ===
              normalizePersonalityCompare(selectedType),
        ),
      ),
    );
  }, [value]);

  function isTypeSelected(type = "") {
    return selectedTypes.some(
      (selectedType) =>
        normalizePersonalityCompare(selectedType) ===
          normalizePersonalityCompare(type) ||
        normalizePersonalityCompare(selectedType) ===
          normalizePersonalityCompare(formatPersonalityTypeLabel(type)),
    );
  }

  function toggleSelectedType(type = "") {
    if (!approvalPage || disableComment || isEditing) return;

    const formattedType = formatPersonalityTypeLabel(type);

    setSelectedTypes((prev) => {
      const exists = prev.some(
        (selectedType) =>
          normalizePersonalityCompare(selectedType) ===
            normalizePersonalityCompare(type) ||
          normalizePersonalityCompare(selectedType) ===
            normalizePersonalityCompare(formattedType),
      );

      if (exists) {
        return prev.filter(
          (selectedType) =>
            normalizePersonalityCompare(selectedType) !==
              normalizePersonalityCompare(type) &&
            normalizePersonalityCompare(selectedType) !==
              normalizePersonalityCompare(formattedType),
        );
      }

      return [...prev, formattedType];
    });
  }

  function clearSelectedTypes() {
    setSelectedTypes([]);
  }

  function handleAddComment() {
    const selectedText = selectedTypes.join(", ");

    onAddComment?.({
      selectedText,
    });

    clearSelectedTypes();
  }

  function getCommentsForPersonalityType(type = "") {
    const formattedType = formatPersonalityTypeLabel(type);
    const normalizedType = normalizePersonalityCompare(type);
    const normalizedFormattedType = normalizePersonalityCompare(formattedType);

    return comments.filter((comment) => {
      const selectedText = getCommentSelectedText(comment);

      if (!selectedText) return false;

      const normalizedSelectedText = normalizePersonalityCompare(selectedText);

      return (
        normalizedSelectedText === normalizedType ||
        normalizedSelectedText === normalizedFormattedType ||
        normalizedSelectedText.includes(normalizedType) ||
        normalizedSelectedText.includes(normalizedFormattedType) ||
        normalizedFormattedType.includes(normalizedSelectedText)
      );
    });
  }

  const sectionLevelComments = comments.filter((comment) => {
    const selectedText = getCommentSelectedText(comment);
    return !selectedText;
  });

  const selectedCount = selectedTypes.length;
  const hasSelectedTypes = selectedCount > 0;
  const hasComments = comments.length > 0;

  function getEditTitle() {
    if (!canManageJdDetails) {
      return "Only admin access roles 6 and 7 can edit this JD.";
    }

    if (disableEdit) {
      return "Editing is disabled because this JD has revision comments.";
    }

    return "Edit preferred personality type.";
  }

  function getCommentTitle() {
    if (!canManageJdDetails) {
      return "Only admin access roles 6 and 7 can add revision comments.";
    }

    if (disableComment) {
      return "Commenting is disabled because this JD already has edited changes.";
    }

    if (!hasSelectedTypes) {
      return "Select one or more personality capsules first.";
    }

    return `Add comment for ${selectedCount} selected personality type${
      selectedCount > 1 ? "s" : ""
    }.`;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-extrabold uppercase tracking-wide text-[#101828]">
              4. Preferred Personality Type
            </h4>

            {hasComments && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
                {comments.length} comment{comments.length > 1 ? "s" : ""}
              </span>
            )}

            {hasSelectedTypes && !isEditing && (
              <span className="rounded-full border border-amber-300 bg-[#FFF3B8] px-2.5 py-1 text-[11px] font-extrabold text-[#101828]">
                {selectedCount} selected
              </span>
            )}
          </div>

          {approvalPage && canManageJdDetails && !isEditing && (
            <p className="mt-1 text-xs font-semibold text-sibs-primary-1/80">
              Click one or more personality capsules, then click Add Comment.
            </p>
          )}
        </div>

        {approvalPage && !isEditing && canManageJdDetails && (
          <div className="flex shrink-0 items-center gap-2">
            {hasSelectedTypes && (
              <button
                type="button"
                onClick={clearSelectedTypes}
                className="inline-flex items-center gap-1 rounded-lg border border-[#D7DEE8] bg-white px-2.5 py-1 text-xs font-bold text-sibs-tertiary-5 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onStartEdit}
              disabled={disableEdit}
              title={getEditTitle()}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableEdit
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-[#D7DEE8] bg-white text-sibs-primary-1 hover:bg-[#F8FAFC]"
              }`}
            >
              <SquarePen size={14} />
              Edit
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleAddComment}
              disabled={disableComment || !hasSelectedTypes}
              title={getCommentTitle()}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                disableComment || !hasSelectedTypes
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : "border-blue-100 bg-blue-50 text-sibs-primary-1 hover:bg-blue-100"
              }`}
            >
              <PencilLine size={14} />
              Add Comment
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="rounded-xl border border-[#D7DEE8] bg-white p-4">
          <textarea
            rows={4}
            value={editingDraft}
            onChange={(e) => setEditingDraft?.(e.target.value)}
            placeholder="Example: INTJ, INTP, ENTJ, ENTP, INFP, ENFJ"
            className="min-h-[120px] w-full resize-y rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 text-sm font-medium leading-7 text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1"
          />

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Separate personality types with commas, semicolons, vertical bars,
            or new lines.
          </p>

          {String(editingDraft || "").trim() && (
            <div className="mt-4 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-3">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                Preview
              </p>

              <div className="flex flex-wrap gap-2">
                {String(editingDraft || "")
                  .split(/[,;\n|]/)
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center rounded-full border border-[#BFD6F6] bg-[#EAF2FB] px-3 py-1.5 text-xs font-bold text-sibs-primary-1"
                    >
                      {formatPersonalityTypeLabel(type)}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSaveEdit}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border px-3 py-2 ${
            hasComments
              ? "border-amber-200 bg-amber-50/40"
              : "border-[#D7DEE8] bg-white"
          }`}
        >
          {personalityTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {personalityTypes.map((type) => {
                const formattedType = formatPersonalityTypeLabel(type);
                const typeComments = getCommentsForPersonalityType(type);
                const hasTypeComments = typeComments.length > 0;
                const firstComment = typeComments[0];
                const selected = isTypeSelected(type);

                return (
                  <span key={type} className="group relative inline-flex">
                    <button
                      type="button"
                      onClick={() => toggleSelectedType(type)}
                      disabled={!approvalPage || disableComment}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-[0.98] ${
                        selected
                          ? "border-amber-300 bg-[#FFF3B8] text-[#101828] shadow-sm ring-1 ring-amber-300"
                          : hasTypeComments
                            ? "border-amber-300 bg-[#FFF3B8] text-[#101828] ring-1 ring-amber-300"
                            : "border-[#BFD6F6] bg-[#EAF2FB] text-sibs-primary-1 hover:border-sibs-primary-1/40 hover:bg-blue-50"
                      } ${
                        !approvalPage || disableComment
                          ? "cursor-default"
                          : "cursor-pointer"
                      }`}
                    >
                      {formattedType}
                    </button>

                    {hasTypeComments && (
                      <div className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-[99999] w-[280px] rounded-xl border border-orange-100 bg-white p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
                            Reviewer Comment
                          </p>

                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-amber-700">
                            {firstComment?.status || "Open"}
                          </span>
                        </div>

                        {firstComment?.selectedText && (
                          <p className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">
                            {firstComment.selectedText}
                          </p>
                        )}

                        <p className="text-xs font-semibold leading-5 text-orange-800">
                          {firstComment?.comment ||
                            "No revision comment provided."}
                        </p>
                      </div>
                    )}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-sm font-semibold text-sibs-tertiary-5">
              No preferred personality type provided.
            </p>
          )}
        </div>
      )}

      {sectionLevelComments.length > 0 && (
        <div className="space-y-3">
          {sectionLevelComments.map((comment, index) => (
            <InlineRevisionCommentBlock
              key={getCommentUniqueKey(comment, `personality-${index}`)}
              comment={comment}
              showSelectedContent={false}
            />
          ))}
        </div>
      )}

      {comments
        .filter((comment) => getCommentSelectedText(comment))
        .map((comment, index) => (
          <div
            key={getCommentUniqueKey(comment, `personality-selected-${index}`)}
            className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 shadow-sm"
          >
            <div className="flex flex-col gap-3 border-b border-amber-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-orange-700">
                  Personality Type Marked for Revision
                </p>

                <p className="mt-1 text-xs font-semibold text-orange-700/90">
                  The selected personality capsule needs to be reviewed and
                  updated.
                </p>
              </div>

              <span className="w-fit rounded-full border border-amber-300 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
                {comment.status || "Open"}
              </span>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className="rounded-xl border border-orange-100 bg-white px-4 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
                    Reviewer Comment
                  </p>
                </div>

                <p className="whitespace-pre-line text-sm font-semibold leading-6 text-orange-800">
                  {comment.comment || "No revision comment provided."}
                </p>
              </div>
            </div>
          </div>
        ))}
    </section>
  );
}

function RevisionCommentList({ comments = [] }) {
  if (!comments.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
              Revision Comment
            </p>

            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-amber-700">
              {comment.status}
            </span>
          </div>

          {comment.selectedText && (
            <div className="mt-3 border-l-2 border-amber-400 pl-3">
              <HighlightedRevisionText value={comment.selectedText} />
            </div>
          )}

          <p className="mt-3 text-sm font-medium leading-6 text-amber-800">
            {comment.comment}
          </p>
        </div>
      ))}
    </div>
  );
}

function HighlightedRevisionText({ value = "" }) {
  const blocks = useMemo(() => parseDetailContent(value), [value]);

  if (!String(value || "").trim()) return null;

  return (
    <div className="space-y-3 text-sm font-semibold leading-6 text-amber-800">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          const listClassName = block.ordered
            ? "list-decimal space-y-2 pl-5"
            : "list-disc space-y-2 pl-5";

          return (
            <ListTag key={`highlight-list-${index}`} className={listClassName}>
              {block.items.map((listItem, listIndex) => (
                <li key={`highlight-item-${listIndex}`}>
                  {listItem.text}

                  {listItem.children?.length > 0 && (
                    <ol className="mt-2 list-[lower-alpha] space-y-1 pl-5">
                      {listItem.children.map((child, childIndex) => (
                        <li key={`highlight-child-${listIndex}-${childIndex}`}>
                          {child}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ListTag>
          );
        }

        return <p key={`highlight-paragraph-${index}`}>{block.text}</p>;
      })}
    </div>
  );
}

function normalizeSelectedPhrase(value = "") {
  return String(value || "")
    .trim()
    .replace(/^\d+\.\d+(?:[.)])?\s*/, "")
    .replace(/^[-•*]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/\s+/g, " ");
}

function buildNormalizedTextMap(value = "") {
  const original = String(value || "");
  let normalized = "";
  const map = [];
  let lastWasSpace = false;

  for (let index = 0; index < original.length; index += 1) {
    const char = original[index];

    if (/\s/.test(char)) {
      if (!lastWasSpace && normalized.length > 0) {
        normalized += " ";
        map.push(index);
        lastWasSpace = true;
      }

      continue;
    }

    normalized += char.toLowerCase();
    map.push(index);
    lastWasSpace = false;
  }

  return {
    normalized: normalized.trim(),
    map,
  };
}

function findSelectedPhraseRange(text = "", selectedText = "") {
  const sourceText = String(text || "");
  const cleanSelectedText = normalizeSelectedPhrase(selectedText);

  if (!sourceText.trim() || !cleanSelectedText.trim()) return null;

  const directIndex = sourceText
    .toLowerCase()
    .indexOf(cleanSelectedText.toLowerCase());

  if (directIndex >= 0) {
    return {
      start: directIndex,
      end: directIndex + cleanSelectedText.length,
    };
  }

  const source = buildNormalizedTextMap(sourceText);
  const selected = buildNormalizedTextMap(cleanSelectedText);

  if (!source.normalized || !selected.normalized) return null;

  const normalizedIndex = source.normalized.indexOf(selected.normalized);

  if (normalizedIndex < 0) return null;

  const start = source.map[normalizedIndex];
  const endMapIndex = normalizedIndex + selected.normalized.length - 1;
  const end = Number(source.map[endMapIndex] ?? start) + 1;

  return {
    start,
    end,
  };
}

function getSelectedTextCandidatePhrases(selectedText = "") {
  const rawSelectedText = String(selectedText || "").trim();

  if (!rawSelectedText) return [];

  const phrases = [];

  const pushPhrase = (value = "") => {
    const cleanValue = normalizeSelectedPhrase(value);

    if (!cleanValue) return;

    const alreadyExists = phrases.some(
      (phrase) =>
        phrase.toLowerCase().replace(/\s+/g, " ").trim() ===
        cleanValue.toLowerCase().replace(/\s+/g, " ").trim(),
    );

    if (!alreadyExists) {
      phrases.push(cleanValue);
    }
  };

  pushPhrase(rawSelectedText);

  const blocks = parseDetailContent(rawSelectedText);

  blocks.forEach((block) => {
    if (block.type === "paragraph") {
      pushPhrase(block.text);
      return;
    }

    if (block.type === "list") {
      block.items.forEach((item) => {
        pushPhrase(item.text);

        if (Array.isArray(item.children)) {
          item.children.forEach((child) => pushPhrase(getChildText(child)));
        }
      });
    }
  });

  return phrases.sort((a, b) => b.length - a.length);
}

function getInlineCommentMatches(text = "", comments = []) {
  const matches = comments
    .flatMap((comment) => {
      const selectedText = comment.selectedText || comment.selected_text || "";
      const candidatePhrases = getSelectedTextCandidatePhrases(selectedText);

      return candidatePhrases
        .map((phrase) => {
          const range = findSelectedPhraseRange(text, phrase);

          if (!range) return null;

          return {
            comment,
            phrase,
            start: range.start,
            end: range.end,
          };
        })
        .filter(Boolean);
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const nonOverlappingMatches = [];
  let cursor = 0;

  matches.forEach((match) => {
    if (match.start < cursor) return;

    nonOverlappingMatches.push(match);
    cursor = match.end;
  });

  return nonOverlappingMatches;
}

function InlineCommentedText({
  text = "",
  comments = [],
  className = "",
  approvalPage = false,
  boundaryMap = {},
}) {
  const matches = getInlineCommentMatches(text, comments);

  if (!matches.length) {
    return (
      <span
        className={`${className} ${
          approvalPage ? "selection:bg-[#FFF3B8] selection:text-[#101828]" : ""
        }`}
      >
        {text}
      </span>
    );
  }

  const nodes = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(
        <span key={`text-before-${index}`}>
          {text.slice(cursor, match.start)}
        </span>,
      );
    }

    const commentKey = getCommentStableKey(match.comment);
    const boundary = boundaryMap[commentKey] || {};
    const isStart = Boolean(boundary.start);
    const isEnd = Boolean(boundary.end);

    nodes.push(
      <React.Fragment key={`highlight-fragment-${commentKey}-${match.start}`}>
        <span className="inline-flex items-center gap-1 align-middle">
          {isStart && (
            <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-orange-600">
              &gt;&gt;&gt;
            </span>
          )}

          <span
            className="inline-flex items-center self-center rounded-md bg-[#FFF3B8] px-1.5 py-0.5 font-semibold leading-normal text-[#101828] ring-1 ring-amber-300"
            title={match.comment.comment || "Marked for revision"}
          >
            {text.slice(match.start, match.end)}
          </span>

          {isEnd && (
            <span className="inline-flex items-center self-center text-sm font-extrabold leading-none text-orange-600">
              &lt;&lt;&lt;
            </span>
          )}
        </span>
      </React.Fragment>,
    );

    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(<span key="text-after">{text.slice(cursor)}</span>);
  }

  return (
    <span
      className={`${className} ${
        approvalPage ? "selection:bg-[#FFF3B8] selection:text-[#101828]" : ""
      }`}
    >
      {nodes}
    </span>
  );
}

function getBlockTextUnits(block = {}) {
  if (block.type === "paragraph") {
    return [
      {
        key: "paragraph",
        text: block.text || "",
      },
    ];
  }

  if (block.type !== "list") return [];

  return block.items.flatMap((listItem, listIndex) => {
    const units = [
      {
        key: `item-${listIndex}`,
        text: listItem.text || "",
      },
    ];

    if (Array.isArray(listItem.children)) {
      listItem.children.forEach((child, childIndex) => {
        units.push({
          key: `child-${listIndex}-${childIndex}`,
          text: getChildText(child),
        });
      });
    }

    return units;
  });
}

function getCommentStableKey(comment = {}) {
  return String(
    comment.id ||
      `${comment.sectionKey || ""}-${comment.selectedText || ""}-${
        comment.comment || ""
      }`,
  );
}

function getFirstMatchedUnitKey(block = {}, comment = {}) {
  const units = getBlockTextUnits(block);

  for (const unit of units) {
    const hasMatch = getInlineCommentMatches(unit.text, [comment]).length > 0;

    if (hasMatch) {
      return unit.key;
    }
  }

  return "";
}

function getLastMatchedUnitKey(block = {}, comment = {}) {
  const units = getBlockTextUnits(block);
  let lastKey = "";

  units.forEach((unit) => {
    const hasMatch = getInlineCommentMatches(unit.text, [comment]).length > 0;

    if (hasMatch) {
      lastKey = unit.key;
    }
  });

  return lastKey;
}

function getCommentsForTextUnit(text = "", comments = []) {
  const matches = getInlineCommentMatches(text, comments);

  const uniqueComments = [];

  matches.forEach((match) => {
    const exists = uniqueComments.some(
      (comment) =>
        String(comment.id || "") === String(match.comment.id || "") &&
        String(comment.comment || "") === String(match.comment.comment || "") &&
        String(comment.selectedText || "") ===
          String(match.comment.selectedText || ""),
    );

    if (!exists) {
      uniqueComments.push(match.comment);
    }
  });

  return uniqueComments;
}

function DetailContentRenderer({
  value,
  emptyText = "No information provided.",
  approvalPage = false,
  comments = [],
}) {
  const blocks = useMemo(() => parseDetailContent(value), [value]);

  if (!String(value || "").trim()) {
    return <p className="text-sm text-sibs-tertiary-5">{emptyText}</p>;
  }

  const selectionClass = approvalPage
    ? "selection:bg-[#FFF3B8] selection:text-[#101828]"
    : "selection:bg-transparent selection:text-inherit";

  return (
    <div className={`space-y-4 ${selectionClass}`}>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          const listClassName = block.ordered
            ? "list-decimal space-y-3 pl-6 text-[15px] font-medium leading-7 text-[#344054]"
            : "list-disc space-y-3 pl-6 text-[15px] font-medium leading-7 text-[#344054]";

          return (
            <ListTag key={`list-${index}`} className={listClassName}>
              {block.items.map((listItem, listIndex) => {
                const itemUnitKey = `item-${listIndex}`;
                const itemComments = getCommentsForTextUnit(
                  listItem.text,
                  comments,
                );

                const itemCommentsToDisplay = itemComments.filter(
                  (comment) =>
                    getLastMatchedUnitKey(block, comment) === itemUnitKey,
                );

                return (
                  <li key={`item-${listIndex}`}>
                    <InlineCommentedText
                      text={listItem.text}
                      comments={comments}
                      approvalPage={approvalPage}
                      boundaryMap={Object.fromEntries(
                        itemComments.map((comment) => {
                          const commentKey = getCommentStableKey(comment);

                          return [
                            commentKey,
                            {
                              start:
                                getFirstMatchedUnitKey(block, comment) ===
                                itemUnitKey,
                              end:
                                getLastMatchedUnitKey(block, comment) ===
                                itemUnitKey,
                            },
                          ];
                        }),
                      )}
                    />

                    {itemCommentsToDisplay.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {itemCommentsToDisplay.map((comment) => (
                          <InlineRevisionCommentBlock
                            key={
                              comment.id || `${listIndex}-${comment.comment}`
                            }
                            comment={comment}
                            showSelectedContent={false}
                          />
                        ))}
                      </div>
                    )}

                    {listItem.children?.length > 0 && (
                      <ol className="mt-3 space-y-2 pl-6">
                        {listItem.children.map((child, childIndex) => {
                          const childText = getChildText(child);
                          const childPrefix = getChildPrefix(child);
                          const childUnitKey = `child-${listIndex}-${childIndex}`;

                          const childComments = getCommentsForTextUnit(
                            childText,
                            comments,
                          );

                          const childCommentsToDisplay = childComments.filter(
                            (comment) =>
                              getLastMatchedUnitKey(block, comment) ===
                              childUnitKey,
                          );

                          return (
                            <li
                              key={`child-${listIndex}-${childIndex}`}
                              className="list-none"
                            >
                              <div className="flex gap-2">
                                {childPrefix && (
                                  <span className="shrink-0 font-semibold text-[#344054]">
                                    {childPrefix}
                                  </span>
                                )}

                                <div className="min-w-0 flex-1">
                                  <InlineCommentedText
                                    text={childText}
                                    comments={comments}
                                    approvalPage={approvalPage}
                                    boundaryMap={Object.fromEntries(
                                      childComments.map((comment) => {
                                        const commentKey =
                                          getCommentStableKey(comment);

                                        return [
                                          commentKey,
                                          {
                                            start:
                                              getFirstMatchedUnitKey(
                                                block,
                                                comment,
                                              ) === childUnitKey,
                                            end:
                                              getLastMatchedUnitKey(
                                                block,
                                                comment,
                                              ) === childUnitKey,
                                          },
                                        ];
                                      }),
                                    )}
                                  />

                                  {childCommentsToDisplay.length > 0 && (
                                    <div className="mt-3 space-y-3">
                                      {childCommentsToDisplay.map((comment) => (
                                        <InlineRevisionCommentBlock
                                          key={
                                            comment.id ||
                                            `${childIndex}-${comment.comment}`
                                          }
                                          comment={comment}
                                          showSelectedContent={false}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ListTag>
          );
        }

        const paragraphComments = getCommentsForTextUnit(block.text, comments);

        return (
          <div key={`paragraph-wrap-${index}`}>
            <p className="text-[15px] font-medium leading-8 text-[#344054]">
              <InlineCommentedText
                text={block.text}
                comments={comments}
                approvalPage={approvalPage}
              />
            </p>

            {paragraphComments.length > 0 && (
              <div className="mt-3 space-y-3">
                {paragraphComments.map((comment) => (
                  <InlineRevisionCommentBlock
                    key={comment.id || `${index}-${comment.comment}`}
                    comment={comment}
                    showSelectedContent={false}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function InlineRevisionCommentBlock({ comment, showSelectedContent = true }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-amber-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-orange-700">
            Text Marked for Revision
          </p>

          <p className="mt-1 text-xs font-semibold text-orange-700/90">
            The highlighted phrase above needs to be reviewed and updated.
          </p>
        </div>

        <span className="w-fit rounded-full border border-amber-300 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-orange-700">
          {comment.status || "Open"}
        </span>
      </div>

      <div className="space-y-4 px-4 py-4">
        {showSelectedContent && comment.selectedText && (
          <div className="rounded-xl border border-amber-300 bg-white/70 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

              <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
                Selected JD Content
              </p>
            </div>

            <div className="flex min-h-[40px] items-center border-l-2 border-amber-400 pl-4">
              <HighlightedRevisionText value={comment.selectedText} />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-orange-100 bg-white px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />

            <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>
          </div>

          <div className="flex min-h-[40px] items-center">
            <p className="whitespace-pre-line text-sm font-semibold leading-6 text-orange-800">
              {comment.comment || "No revision comment provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCommentUniqueKey(comment = {}, fallback = "") {
  return String(
    comment.id ||
      `${comment.sectionKey || ""}-${comment.selectedText || ""}-${
        comment.comment || ""
      }-${fallback}`,
  );
}

function doesCommentMatchText(text = "", comment = {}) {
  return getInlineCommentMatches(text, [comment]).length > 0;
}

function doesCommentMatchAnyRenderedBlock(value = "", comment = {}) {
  const blocks = parseDetailContent(value);

  return blocks.some((block) => {
    if (block.type === "paragraph") {
      return doesCommentMatchText(block.text, comment);
    }

    if (block.type === "list") {
      return block.items.some((listItem) => {
        const parentMatches = doesCommentMatchText(listItem.text, comment);

        const childMatches = Array.isArray(listItem.children)
          ? listItem.children.some((child) =>
              doesCommentMatchText(getChildText(child), comment),
            )
          : false;

        return parentMatches || childMatches;
      });
    }

    return false;
  });
}

function getUnmatchedRevisionComments(value = "", comments = []) {
  return comments.filter(
    (comment) => !doesCommentMatchAnyRenderedBlock(value, comment),
  );
}

function DetailRichContent({
  value,
  emptyText = "No information provided.",
  approvalPage = false,
  comments = [],
}) {
  const unmatchedComments = useMemo(
    () => getUnmatchedRevisionComments(value, comments),
    [value, comments],
  );

  if (!String(value || "").trim() && !comments.length) {
    return <p className="text-sm text-sibs-tertiary-5">{emptyText}</p>;
  }

  return (
    <div className="space-y-4 rounded-none border-0 bg-white px-0 py-0">
      <DetailContentRenderer
        value={value}
        emptyText={emptyText}
        approvalPage={approvalPage}
        comments={comments}
      />

      {unmatchedComments.length > 0 && (
        <div className="space-y-3">
          {unmatchedComments.map((comment, index) => (
            <InlineRevisionCommentBlock
              key={getCommentUniqueKey(comment, index)}
              comment={comment}
              showSelectedContent={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Details;
