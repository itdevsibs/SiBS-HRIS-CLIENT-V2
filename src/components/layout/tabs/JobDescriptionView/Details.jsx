import React, { useEffect, useMemo, useState } from "react";
import { PencilLine, SquarePen, X } from "lucide-react";
import { normalizeJdStatus } from "../../../../lib/utils/NormalizeJDStatus";
import { formatDate } from "../../FormatDateTime";
import DesiredCompetenciesViewTable from "../../../tables/jobDescription/DesiredCompetenciesViewTable";

const Details = ({
  item,
  onOpenRevision,
  revisionComments = [],
  setRevisionComments,
  hasEditedChanges = false,
  onEditedChange,
  editedChangeDetails = [],
  setEditedChangeDetails,
}) => {
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
    effectiveDate: item.effectiveDate || "",
    lastUpdated: item.lastUpdated || "",
    reportsTo: item.reportsTo || "",
    supervisory: item.supervisory || "No",
  });

  const hasRevisionComments = revisionComments.length > 0;
  const disableEditBecauseCommented = hasRevisionComments;
  const disableCommentBecauseEdited = hasEditedChanges;

  useEffect(() => {
    setEditableContent({
      description: item.description || "",
      responsibilities: item.responsibilities || "",
      qualifications: item.qualifications || "",
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
      effectiveDate: item.effectiveDate || "",
      lastUpdated: item.lastUpdated || "",
      reportsTo: item.reportsTo || "",
      supervisory: item.supervisory || "No",
    });

    setEditingRecordInfo(false);
    onEditedChange?.(false);
  }, [item]);

  function getSelectedText() {
    if (typeof window === "undefined") return "";

    const selection = window.getSelection?.();

    if (!selection || selection.rangeCount === 0) return "";

    return String(selection.toString() || "").trim();
  }

  function clearSelectedText() {
    if (typeof window === "undefined") return;

    window.getSelection?.()?.removeAllRanges?.();
  }

  function openSectionComment(sectionKey, sectionTitle) {
    if (disableCommentBecauseEdited) return;

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
    if (disableEditBecauseCommented) return;

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
    remarks: "Preferred Personality Type",
  };

  function updateEditedChanges(nextChanges) {
    setEditedChangeDetails?.(nextChanges);
    onEditedChange?.(nextChanges.length > 0);
  }

  function saveEditSection(sectionKey) {
    const oldValue = String(item?.[sectionKey] || "");
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
      effectiveDate: item.effectiveDate || "",
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
      effectiveDate: item.effectiveDate || "",
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

  return (
    <div className="space-y-6">
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
                  title={
                    disableEditBecauseCommented
                      ? "Editing is disabled because this JD has revision comments."
                      : "Edit record information."
                  }
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
                  title={
                    disableCommentBecauseEdited
                      ? "Commenting is disabled because this JD already has edited changes."
                      : "Add revision comment."
                  }
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
      </section>

      <RevisionCommentList comments={getSectionComments("recordInformation")} />

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
        />

        {String(editableContent.remarks || "").trim() && (
          <DetailArticleSection
            sectionKey="remarks"
            title="Preferred Personality Type"
            value={editableContent.remarks}
            emptyText="No remarks provided."
            comments={getSectionComments("remarks")}
            onAddComment={openSectionComment}
            isEditing={editingSection === "remarks"}
            editingDraft={editingDraft}
            setEditingDraft={setEditingDraft}
            onStartEdit={startEditSection}
            onCancelEdit={cancelEditSection}
            onSaveEdit={saveEditSection}
            disableEdit={disableEditBecauseCommented}
            disableComment={disableCommentBecauseEdited}
          />
        )}

        <div>
          <DesiredCompetenciesViewTable
            competencies={item.competencies || []}
            comments={getSectionComments("competencies")}
            onAddComment={openSectionComment}
            disableEdit={disableEditBecauseCommented}
            disableComment={disableCommentBecauseEdited}
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
              Update Revision and Tag as Existing
            </button>
          </div>
        </section>
      )}

      {commentModal.open && (
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

                  <p className="mt-2 text-sm font-semibold leading-6 text-sibs-primary-1/90">
                    “{commentModal.selectedText}”
                  </p>
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
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#D7DEE8] bg-white px-3 py-2 text-sm font-bold leading-5 text-[#344054] outline-none transition selection:bg-[#FFF3B8] selection:text-[#101828] focus:border-sibs-primary-1"
        />
      ) : (
        <p
          title={finalDisplayValue}
          className="mt-1 truncate text-sm font-bold leading-5 text-[#344054] selection:bg-[#FFF3B8] selection:text-[#101828] hover:cursor-pointer"
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

  const flushList = () => {
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
      flushList();
      return;
    }

    const isBullet = /^[-•*]\s+/.test(trimmed);
    const isNumbered = /^\d+[.)]\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      listItems.push(
        trimmed.replace(/^[-•*]\s+/, "").replace(/^\d+[.)]\s+/, ""),
      );
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
}) {
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

        {!isEditing && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onStartEdit?.(sectionKey)}
              disabled={disableEdit}
              title={
                disableEdit
                  ? "Editing is disabled because this JD has revision comments."
                  : "Edit this section."
              }
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
              title={
                disableComment
                  ? "Commenting is disabled because this JD already has edited changes."
                  : "Add revision comment."
              }
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
        <DetailRichContent value={value} emptyText={emptyText} />
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
            <p className="mt-2 border-l-2 border-amber-400 pl-3 text-sm font-semibold leading-6 text-amber-800">
              “{comment.selectedText}”
            </p>
          )}

          <p className="mt-2 text-sm font-medium leading-6 text-amber-800">
            {comment.comment}
          </p>
        </div>
      ))}
    </div>
  );
}

function DetailRichContent({ value, emptyText = "No information provided." }) {
  const blocks = useMemo(() => parseDetailContent(value), [value]);

  if (!String(value || "").trim()) {
    return <p className="text-sm text-sibs-tertiary-5">{emptyText}</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] px-5 py-4 selection:bg-amber-200 selection:text-[#101828]">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className="list-disc space-y-2 pl-6 text-[15px] font-medium leading-7 text-[#344054]"
            >
              {block.items.map((listItem, listIndex) => (
                <li key={`item-${listIndex}`}>{listItem}</li>
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

export default Details;
