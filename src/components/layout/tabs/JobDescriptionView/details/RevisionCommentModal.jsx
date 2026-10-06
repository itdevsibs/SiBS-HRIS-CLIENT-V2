import React from "react";
import { ModalShell } from "@/components/ui";

import { HighlightedRevisionText } from "./DetailContent";

export default function RevisionCommentModal({
  approvalPage = false,
  commentModal,
  setCommentModal,
  onClose,
  onSave,
}) {
  if (
    !commentModal?.open ||
    !approvalPage
  ) {
    return null;
  }

  const isSaveDisabled = !String(commentModal.comment || "").trim();

  return (
    <ModalShell
      open={Boolean(commentModal?.open && approvalPage)}
      onClose={onClose}
      variant="navy"
      size="lg"
      title="Add Revision Comment"
      subtitle={commentModal.sectionTitle}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="sibs-btn-secondary !h-8.5 2xl:!h-10 text-xs font-extrabold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaveDisabled}
            className="sibs-btn-primary !h-8.5 2xl:!h-10 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Comment
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {commentModal.selectedText ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-amber-700">
              {commentModal.sectionKey === "personalityType"
                ? "Selected Personality Type"
                : commentModal.sectionKey === "competencies"
                  ? "Selected Competencies"
                  : "Highlighted Text"}
            </p>

            <div className="mt-2 selection:bg-amber-100 selection:text-sibs-navy">
              <HighlightedRevisionText
                value={commentModal.selectedText}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
            <p className="sibs-text-xs font-semibold leading-relaxed text-amber-800">
              No highlighted text detected. This comment will apply to the
              whole section.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-sibs-faint">
            Revision Comment <span className="text-sibs-orange">*</span>
          </label>

          <textarea
            rows={4}
            value={commentModal.comment}
            onChange={(event) =>
              setCommentModal((previous) => ({
                ...previous,
                comment: event.target.value,
              }))
            }
            placeholder="Explain what needs to be changed..."
            className="w-full resize-none rounded-xl border border-sibs-border bg-white px-3.5 py-2.5 sibs-text-xs font-semibold text-sibs-navy outline-none transition focus:border-sibs-orange focus:ring-2 focus:ring-sibs-orange/10"
          />
        </div>
      </div>
    </ModalShell>
  );
}
