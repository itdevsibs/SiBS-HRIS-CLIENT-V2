import React from "react";
import { PencilLine, SquarePen } from "lucide-react";

import RichTextEditor from "../../../../modals/jobDescription/RichTextEditor";
import { DetailRichContent } from "./DetailContent";

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
      return "Only authorized JD reviewers can edit this JD.";
    }

    if (disableEdit) {
      return "Editing is disabled because this JD has revision comments.";
    }

    return "Edit this section.";
  }

  function getCommentTitle() {
    if (!canManageJdDetails) {
      return "Only authorized JD reviewers can add revision comments.";
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
    education: "4",
    experience: "5",
    certificationsAffiliations: "6",
  }[sectionKey];

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:break-after-avoid">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#101828] sm:text-[15px]">
            {sectionNumber ? `${sectionNumber}. ${title}` : title}
          </h4>

          {comments.length > 0 && (
            <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">
              {comments.length} comment{comments.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {approvalPage && !isEditing && canManageJdDetails && (
          <div className="jd-mobile-actions-row flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onStartEdit?.(sectionKey)}
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
              onClick={() => onAddComment?.(sectionKey, title)}
              disabled={disableComment}
              title={getCommentTitle()}
              className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition sm:flex-none ${
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
        <div className="rounded-xl border border-[#D7DEE8] bg-white p-3 shadow-sm sm:p-4">
          <RichTextEditor
            id={`jd-details-editor-${sectionKey}`}
            value={editingDraft}
            onChange={(html) =>
              setEditingDraft?.(html)
            }
            placeholder={`Edit ${title.toLowerCase()}...`}
            minHeight={180}
          />

          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onSaveEdit?.(sectionKey)}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sibs-primary-1 px-4 text-sm font-extrabold text-white transition hover:opacity-90 sm:w-auto"
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

export default DetailArticleSection;
