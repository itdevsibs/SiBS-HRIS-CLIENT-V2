import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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
    !approvalPage ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <div className="sibs-modal-blur fixed inset-0 z-[999999] flex h-dvh items-end justify-center px-3 pb-3 pt-6 sm:items-center sm:px-4 sm:py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-revision-comment-title"
        className="max-h-[94dvh] w-full max-w-xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#E6ECF2] px-5 py-4">
          <div>
            <h3
              id="add-revision-comment-title"
              className="text-base font-extrabold text-[#101828]"
            >
              Add Revision Comment
            </h3>

            <p className="mt-1 text-sm font-medium text-sibs-tertiary-5">
              {commentModal.sectionTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-sibs-tertiary-5 transition hover:bg-[#F8FAFC] hover:text-sibs-primary-1"
            aria-label="Close revision comment modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="thin-scroll max-h-[calc(94dvh-180px)] space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {commentModal.selectedText ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-amber-700">
                {commentModal.sectionKey === "personalityType"
                  ? "Selected Personality Type"
                  : commentModal.sectionKey === "competencies"
                    ? "Selected Competencies"
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
              onChange={(event) =>
                setCommentModal((previous) => ({
                  ...previous,
                  comment: event.target.value,
                }))
              }
              placeholder="Explain what needs to be changed..."
              className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-4 py-3 text-sm text-sibs-primary-1 outline-none transition focus:border-sibs-primary-1"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-[#F8FAFC] px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-5 text-sm font-bold text-sibs-primary-1 transition hover:bg-[#F8FAFC] sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!String(commentModal.comment || "").trim()}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sibs-primary-2 px-5 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Save Comment
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
