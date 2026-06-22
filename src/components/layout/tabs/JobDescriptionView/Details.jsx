import React, { useEffect, useMemo, useState } from "react";
import { PencilLine, SquarePen, X } from "lucide-react";
import { normalizeJdStatus } from "../../../../lib/utils/NormalizeJDStatus";
import { formatDate } from "../../FormatDateTime";
import DesiredCompetenciesViewTable from "../../../tables/jobDescription/DesiredCompetenciesViewTable";
import { useUser } from "../../../../services/context/UserContext";
import { useJobDescription } from "../../../../services/context/JobDescriptionContext";

const Details = ({
  item,
  onOpenRevision,
  hasEditedChanges = false,
  onEditedChange,
  editedChangeDetails = [],
  setEditedChangeDetails,
  approvalPage = false,
}) => {
  const { user } = useUser();

  const { revisionComments, setRevisionComments } = useJobDescription();

  function getEffectiveDateValue(source = {}) {
    return (
      source.effectiveDate ||
      source.effective_date ||
      source.effectiveDateRaw ||
      source.effective_date_raw ||
      ""
    );
  }

  useEffect(() => {
    console.log("item from details:", item);
  }, [item]);

  const canManageJdDetails = useMemo(() => {
    return [6, 7].includes(Number(user?.adminAccess));
  }, [user?.adminAccess]);

  const [commentModal, setCommentModal] = useState({
    open: false,
    sectionKey: "",
    sectionTitle: "",
    selectedText: "",
    comment: "",
  });

  const [editableContent, setEditableContent] = useState({
    description: item.description || "",
    responsibilities: item.responsibilities || "",
    qualifications: item.qualifications || "",
    personalityType: item.personalityType || item.personality_type || "",
    remarks: item.remarks || "",
  });

  const [editingSection, setEditingSection] = useState("");
  const [editingDraft, setEditingDraft] = useState("");

  const [editingRecordInfo, setEditingRecordInfo] = useState(false);

  const [recordInfoDraft, setRecordInfoDraft] = useState({
    roleTitle: item.roleTitle || "",
    department: item.department || "",
    dateRequested: item.dateRequested || "",
    linkedHiringRequirement: item.linkedHiringRequirement || "",
    preparedFor: item.preparedFor || "",
    requestedBy: item.requestedBy || "",
    jdCode: item.jdCode || "",
    currentVersion: item.currentVersion || "2.0",
    effectiveDate: getEffectiveDateValue(item),
    lastUpdated: item.lastUpdated || "",
    reportsTo: item.reportsTo || "",
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
      personalityType: item.personalityType || item.personality_type || "",
      remarks: item.remarks || "",
    });

    setEditingSection("");
    setEditingDraft("");

    setRecordInfoDraft({
      roleTitle: item.roleTitle || "",
      department: item.department || "",
      dateRequested: item.dateRequested || "",
      linkedHiringRequirement: item.linkedHiringRequirement || "",
      preparedFor: item.preparedFor || "",
      requestedBy: item.requestedBy || "",
      jdCode: item.jdCode || "",
      currentVersion: item.currentVersion || "2.0",
      effectiveDate: getEffectiveDateValue(item),
      lastUpdated: item.lastUpdated || "",
      reportsTo: item.reportsTo || "",
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

    function getListPrefix(liElement) {
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
        const letter = String.fromCharCode(97 + Math.max(index, 0));

        return `${letter}. `;
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
        const prefix = getListPrefix(node);
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

  function openSectionComment(sectionKey, sectionTitle) {
    if (!approvalPage || disableCommentBecauseEdited) return;

    const selectedText = getSelectedText();

    setCommentModal({
      open: true,
      sectionKey,
      sectionTitle,
      selectedText,
      comment: "",
    });
  }

  function closeCommentModal() {
    setCommentModal({
      open: false,
      sectionKey: "",
      sectionTitle: "",
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
        ? item?.personalityType || item?.personality_type || ""
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
      roleTitle: item.roleTitle || "",
      department: item.department || "",
      dateRequested: item.dateRequested || "",
      linkedHiringRequirement: item.linkedHiringRequirement || "",
      preparedFor: item.preparedFor || "",
      requestedBy: item.requestedBy || "",
      jdCode: item.jdCode || "",
      currentVersion: item.currentVersion || "2.0",
      effectiveDate: getEffectiveDateValue(item),
      lastUpdated: item.lastUpdated || "",
      reportsTo: item.reportsTo || "",
      supervisory: item.supervisory || "No",
    });

    setEditingRecordInfo(false);
  }

  function saveRecordInfoEdit() {
    const originalRecordInfo = {
      roleTitle: item.roleTitle || "",
      department: item.department || "",
      dateRequested: item.dateRequested || "",
      linkedHiringRequirement: item.linkedHiringRequirement || "",
      preparedFor: item.preparedFor || "",
      requestedBy: item.requestedBy || "",
      jdCode: item.jdCode || "",
      currentVersion: item.currentVersion || "2.0",
      effectiveDate: getEffectiveDateValue(item),
      lastUpdated: item.lastUpdated || "",
      reportsTo: item.reportsTo || "",
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

  return (
    <div className="space-y-6 ">
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

            {/* {approvalPage && ( */}
            <button
              type="button"
              onClick={() => onOpenRevision?.(item)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
            >
              <PencilLine size={16} />
              Revise Job Description
            </button>
            {/* )} */}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-[#E6ECF2] bg-white shadow-2xs">
        <div className="flex flex-col gap-3 border-b border-[#E6ECF2] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
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

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
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
                onChange={(value) => handleRecordInfoChange("roleTitle", value)}
              />

              <DocumentInfoInput
                label="Department"
                value={recordInfoDraft.department}
                editable={editingRecordInfo}
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
                onChange={(value) =>
                  handleRecordInfoChange("dateRequested", value)
                }
              />

              <DocumentInfoInput
                label="Linked Hiring Requirement"
                value={recordInfoDraft.linkedHiringRequirement}
                editable={editingRecordInfo}
                onChange={(value) =>
                  handleRecordInfoChange("linkedHiringRequirement", value)
                }
              />

              <DocumentInfoInput
                label="Prepared For"
                value={recordInfoDraft.preparedFor}
                editable={editingRecordInfo}
                onChange={(value) =>
                  handleRecordInfoChange("preparedFor", value)
                }
              />

              <DocumentInfoInput
                label="Created By"
                value={recordInfoDraft.requestedBy}
                editable={editingRecordInfo}
                onChange={(value) =>
                  handleRecordInfoChange("requestedBy", value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1">
            <CompactSummaryRow
              label="Document Code"
              value={recordInfoDraft.jdCode}
              editable={editingRecordInfo}
              onChange={(value) => handleRecordInfoChange("jdCode", value)}
              className="border-b border-r border-[#E6ECF2] lg:border-r-0"
            />

            <CompactSummaryRow
              label="Revision No."
              value={recordInfoDraft.currentVersion}
              editable={editingRecordInfo}
              onChange={(value) =>
                handleRecordInfoChange("currentVersion", value)
              }
              className="border-b border-[#E6ECF2]"
            />

            <CompactSummaryRow
              label="Effective Date"
              value={recordInfoDraft.effectiveDate}
              displayValue={formatDate(recordInfoDraft.effectiveDate)}
              editable={editingRecordInfo}
              inputType="date"
              onChange={(value) =>
                handleRecordInfoChange("effectiveDate", value)
              }
              className="border-r border-[#E6ECF2] lg:border-r-0 lg:border-b"
            />

            <CompactSummaryRow
              label="Last Reviewed"
              value={recordInfoDraft.lastUpdated}
              displayValue={formatDate(recordInfoDraft.lastUpdated)}
              editable={editingRecordInfo}
              inputType="date"
              onChange={(value) => handleRecordInfoChange("lastUpdated", value)}
            />
          </div>
        </div>

        <div className="border-t border-[#E6ECF2] bg-[#F8FAFC] p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <CompactSummaryRow
              label="Reports To"
              value={recordInfoDraft.reportsTo}
              editable={editingRecordInfo}
              onChange={(value) => handleRecordInfoChange("reportsTo", value)}
            />

            <CompactSummaryRow
              label="Supervisory"
              value={recordInfoDraft.supervisory || "No"}
              editable={editingRecordInfo}
              onChange={(value) => handleRecordInfoChange("supervisory", value)}
            />
          </div>
        </div>

        {getSectionComments("recordInformation").length > 0 && (
          <div className="border-t border-[#E6ECF2] bg-[#F8FAFC] px-5 py-5">
            <div className="space-y-3">
              {getSectionComments("recordInformation").map((comment) => (
                <InlineRevisionCommentBlock
                  key={comment.id}
                  comment={comment}
                />
              ))}
            </div>
          </div>
        )}
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

        {String(editableContent.personalityType || "").trim() && (
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
            onAddComment={() =>
              openSectionComment(
                "personalityType",
                "Preferred Personality Type",
              )
            }
          />
        )}

        <div>
          <DesiredCompetenciesViewTable
            competencies={item.competencies || []}
            comments={getSectionComments("competencies")}
            onAddComment={openSectionComment}
            disableEdit={disableEditBecauseCommented}
            disableComment={disableCommentBecauseEdited}
            canManageActions={approvalPage && canManageJdDetails}
            onEditedChange={onEditedChange}
          />

          <RevisionCommentList comments={getSectionComments("competencies")} />
        </div>
      </section>

      <section className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 shadow-2xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-sibs-primary-1">
              Connection Rule
            </h3>

            <p className="mt-1 text-sm font-medium leading-6 text-sibs-primary-1/80">
              When JD Status is Existing, the role can proceed to sourcing and
              weekly hiring plan execution.
            </p>
          </div>
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
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                    Highlighted Text
                  </p>

                  <div className="mt-3">
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
    </div>
  );
};

function DocumentInfoInput({
  label,
  value,
  displayValue,
  editable = false,
  inputType = "text",
  onChange,
}) {
  const finalDisplayValue = displayValue || value || "—";

  return (
    <div className="min-w-0 rounded-lg bg-[#F8FAFC] px-4 py-3 selection:bg-[#FFF3B8] selection:text-[#101828]">
      <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
        {label}
      </p>

      {editable ? (
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#D7DEE8] bg-white px-3 py-2 text-sm font-bold leading-5 text-[#344054] outline-none transition selection:bg-[#FFF3B8] selection:text-[#101828] focus:border-sibs-primary-1"
        />
      ) : (
        <p
          title={finalDisplayValue}
          className="mt-1 max-w-full overflow-x-auto whitespace-nowrap text-sm font-bold leading-5 text-[#344054] selection:bg-[#FFF3B8] selection:text-[#101828] hover:cursor-pointer [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1] [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {finalDisplayValue}
        </p>
      )}
    </div>
  );
}

function CompactSummaryRow({
  label,
  value,
  displayValue,
  className = "",
  editable = false,
  inputType = "text",
  onChange,
}) {
  const finalDisplayValue = displayValue || value || "—";

  return (
    <div className={`bg-white px-4 py-3 ${className}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
        {label}
      </p>

      {editable ? (
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#D7DEE8] bg-[#F8FAFC] px-3 py-2 text-sm font-bold leading-5 text-[#344054] outline-none transition focus:border-sibs-primary-1"
        />
      ) : (
        <p className="mt-1 break-words text-sm font-bold leading-5 text-[#344054]">
          {finalDisplayValue}
        </p>
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

  const flushCurrentParent = () => {
    if (currentParent) {
      listItems.push(currentParent);
      currentParent = null;
    }
  };

  const flushList = () => {
    flushCurrentParent();

    if (listItems.length > 0) {
      blocks.push({
        type: "list",
        items: [...listItems],
      });

      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    const isBullet = /^[-•*]\s+/.test(trimmed);
    const isNumbered = /^\d+[.)]\s+/.test(trimmed);
    const isLettered = /^[a-zA-Z][.)]\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      flushCurrentParent();

      currentParent = {
        text: trimmed.replace(/^[-•*]\s+/, "").replace(/^\d+[.)]\s+/, ""),
        children: [],
      };

      return;
    }

    if (isLettered) {
      const childText = trimmed.replace(/^[a-zA-Z][.)]\s+/, "");

      if (currentParent) {
        currentParent.children.push(childText);
      } else if (listItems.length > 0) {
        listItems[listItems.length - 1].children.push(childText);
      } else {
        listItems.push({
          text: "",
          children: [childText],
        });
      }

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

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="text-base font-extrabold text-[#101828]">{title}</h4>

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

      {/* <RevisionCommentList comments={comments} /> */}
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

  const personalityTypes = String(value || "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

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

    return "Add revision comment.";
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[15px] font-extrabold text-[#101828]">
              Preferred Personality Type
            </h4>

            {comments.length > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
                {comments.length} comment{comments.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {approvalPage && !isEditing && canManageJdDetails && (
          <div className="flex shrink-0 items-center gap-2">
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
              onClick={onAddComment}
              disabled={disableComment}
              title={getCommentTitle()}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
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
        <div className="rounded-xl border border-[#D7DEE8] bg-white p-4 shadow-sm">
          <textarea
            rows={4}
            value={editingDraft}
            onChange={(e) => setEditingDraft?.(e.target.value)}
            placeholder="Example: INTJ, INTP, ENTJ, ENTP, INFP, ENFJ"
            className="min-h-[120px] w-full resize-y rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] px-4 py-3 text-sm font-medium leading-7 text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1"
          />

          <p className="mt-2 text-xs font-semibold text-sibs-tertiary-5">
            Separate personality types with commas, semicolons, or new lines.
          </p>

          {String(editingDraft || "").trim() && (
            <div className="mt-4 rounded-xl border border-[#D7DEE8] bg-[#F8FAFC] p-3">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1/70">
                Preview
              </p>

              <div className="flex flex-wrap gap-2">
                {String(editingDraft || "")
                  .split(/[,;\n]/)
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
        <div className="rounded-xl border border-[#D7DEE8] bg-white px-4 py-4 shadow-sm">
          {personalityTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {personalityTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center rounded-full border border-[#BFD6F6] bg-[#EAF2FB] px-3 py-1.5 text-xs font-bold text-sibs-primary-1"
                >
                  {formatPersonalityTypeLabel(type)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-sibs-tertiary-5">
              No preferred personality type provided.
            </p>
          )}
        </div>
      )}

      <RevisionCommentList comments={comments} />
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
          return (
            <ul
              key={`highlight-list-${index}`}
              className="list-disc space-y-2 pl-5"
            >
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
            </ul>
          );
        }

        return <p key={`highlight-paragraph-${index}`}>{block.text}</p>;
      })}
    </div>
  );
}

function normalizeContentLine(value = "") {
  return String(value || "")
    .trim()
    .replace(/^[-•*]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^[a-zA-Z][.)]\s+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getContentLines(value = "") {
  return String(value || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function findSelectedTextRange(contentLines = [], selectedText = "") {
  const selectedLines = getContentLines(selectedText)
    .map(normalizeContentLine)
    .filter(Boolean);

  if (!selectedLines.length || !contentLines.length) {
    return null;
  }

  const normalizedContentLines = contentLines.map(normalizeContentLine);

  for (
    let startIndex = 0;
    startIndex < normalizedContentLines.length;
    startIndex += 1
  ) {
    let selectedIndex = 0;
    let contentIndex = startIndex;

    while (
      contentIndex < normalizedContentLines.length &&
      selectedIndex < selectedLines.length
    ) {
      const contentLine = normalizedContentLines[contentIndex];
      const selectedLine = selectedLines[selectedIndex];

      if (
        contentLine === selectedLine ||
        contentLine.includes(selectedLine) ||
        selectedLine.includes(contentLine)
      ) {
        selectedIndex += 1;
        contentIndex += 1;
        continue;
      }

      break;
    }

    if (selectedIndex === selectedLines.length) {
      return {
        start: startIndex,
        end: contentIndex,
      };
    }
  }

  return null;
}

function buildRevisionContentParts(value = "", comments = []) {
  const contentLines = getContentLines(value);

  if (!contentLines.length || !comments.length) {
    return [
      {
        type: "content",
        value,
      },
    ];
  }

  const sortedComments = comments
    .map((comment) => ({
      ...comment,
      range: findSelectedTextRange(contentLines, comment.selectedText),
    }))
    .filter((comment) => comment.range)
    .sort((a, b) => a.range.start - b.range.start);

  if (!sortedComments.length) {
    return [
      {
        type: "content",
        value,
      },
      ...comments.map((comment) => ({
        type: "comment",
        comment,
      })),
    ];
  }

  const parts = [];
  let cursor = 0;

  sortedComments.forEach((comment) => {
    const { start, end } = comment.range;

    if (start > cursor) {
      parts.push({
        type: "content",
        value: contentLines.slice(cursor, start).join("\n"),
      });
    }

    parts.push({
      type: "comment",
      comment,
    });

    cursor = Math.max(cursor, end);
  });

  if (cursor < contentLines.length) {
    parts.push({
      type: "content",
      value: contentLines.slice(cursor).join("\n"),
    });
  }

  return parts.filter((part) => {
    if (part.type === "content") {
      return String(part.value || "").trim();
    }

    return true;
  });
}

function DetailContentRenderer({
  value,
  emptyText = "No information provided.",
  approvalPage = false,
}) {
  const blocks = useMemo(() => parseDetailContent(value), [value]);

  if (!String(value || "").trim()) {
    return <p className="text-sm text-sibs-tertiary-5">{emptyText}</p>;
  }

  const selectionClass = approvalPage
    ? "selection:bg-amber-200 selection:text-[#101828]"
    : "selection:bg-transparent selection:text-inherit";

  return (
    <div className={`space-y-4 ${selectionClass}`}>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className="list-disc space-y-3 pl-6 text-[15px] font-medium leading-7 text-[#344054]"
            >
              {block.items.map((listItem, listIndex) => (
                <li key={`item-${listIndex}`}>
                  {listItem.text}

                  {listItem.children?.length > 0 && (
                    <ol className="mt-3 list-[lower-alpha] space-y-2 pl-6">
                      {listItem.children.map((child, childIndex) => (
                        <li key={`child-${listIndex}-${childIndex}`}>
                          {child}
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`paragraph-${index}`}
            className="text-[15px] font-medium leading-8 text-[#344054]"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function InlineRevisionCommentBlock({ comment }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-amber-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
            Text Marked for Revision
          </p>

          <p className="mt-1 text-xs font-semibold text-amber-700/80">
            The highlighted content below needs to be reviewed and updated.
          </p>
        </div>

        <span className="w-fit rounded-full border border-amber-200 bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
          {comment.status || "Open"}
        </span>
      </div>

      <div className="px-4 py-4">
        {comment.selectedText && (
          <div className="rounded-xl border border-amber-200 bg-white/70 px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />

              <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
                Selected JD Content
              </p>
            </div>

            <div className="border-l-2 border-amber-400 pl-4">
              <HighlightedRevisionText value={comment.selectedText} />
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-orange-100 bg-white px-4 py-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />

            <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">
              Reviewer Comment
            </p>
          </div>

          <p className="text-sm font-semibold leading-6 text-orange-800">
            {comment.comment || "No revision comment provided."}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRichContent({
  value,
  emptyText = "No information provided.",
  approvalPage = false,
  comments = [],
}) {
  const parts = useMemo(
    () => buildRevisionContentParts(value, comments),
    [value, comments],
  );

  if (!String(value || "").trim() && !comments.length) {
    return <p className="text-sm text-sibs-tertiary-5">{emptyText}</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4">
      {parts.map((part, index) => {
        if (part.type === "comment") {
          return (
            <InlineRevisionCommentBlock
              key={`revision-comment-${part.comment.id || index}`}
              comment={part.comment}
            />
          );
        }

        return (
          <DetailContentRenderer
            key={`content-${index}`}
            value={part.value}
            emptyText={emptyText}
            approvalPage={approvalPage}
          />
        );
      })}
    </div>
  );
}

export default Details;
