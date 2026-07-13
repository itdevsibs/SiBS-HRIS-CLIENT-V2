import React, { useEffect, useState } from "react";
import { PencilLine, SquarePen } from "lucide-react";

import {
  InlineRevisionCommentBlock,
} from "./DetailContent";
import {
  getCommentUniqueKey,
} from "../../../../../lib/utils/jobDescription/revisionComments";

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
      return "Only authorized JD reviewers can edit this JD.";
    }

    if (disableEdit) {
      return "Editing is disabled because this JD has revision comments.";
    }

    return "Edit preferred personality type.";
  }

  function getCommentTitle() {
    if (!canManageJdDetails) {
      return "Only authorized JD reviewers can add revision comments.";
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
      <div className="jd-details-section-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#101828] sm:text-[15px]">
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
          <div className="jd-mobile-actions-row flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {hasSelectedTypes && (
              <button
                type="button"
                onClick={clearSelectedTypes}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#D7DEE8] bg-white px-2.5 py-1.5 text-xs font-bold text-sibs-tertiary-5 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1 sm:flex-none"
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
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
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
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
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

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSaveEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90 sm:w-auto"
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
                  <span
                    key={type}
                    className="jd-touch-comment-target group relative inline-flex"
                  >
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
                      <div className="jd-personality-comment-popover jd-touch-comment-popover pointer-events-none absolute left-0 top-[calc(100%+8px)] z-[99999] rounded-xl border border-orange-100 bg-white p-3 opacity-0 shadow-lg ring-1 ring-black/5 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
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

export default PreferredPersonalityTypeSection;
