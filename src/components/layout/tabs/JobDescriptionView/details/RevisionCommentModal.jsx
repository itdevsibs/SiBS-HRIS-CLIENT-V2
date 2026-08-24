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
    <div className="sibs-modal-backdrop-in sibs-modal-blur fixed inset-0 z-[999999] flex h-dvh items-center justify-center p-3 sm:p-5 font-jakarta bg-[#042C51]/60">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-revision-comment-title"
        className="sibs-modal-pop-in flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl font-jakarta"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between bg-[#042C51] px-4 py-3 text-white sm:px-5">
          <div>
            <h3
              id="add-revision-comment-title"
              className="text-sm sm:text-base font-extrabold text-white"
            >
              Add Revision Comment
            </h3>

            <p className="mt-0.5 text-[10px] sm:text-xs font-semibold leading-4 text-slate-300">
              {commentModal.sectionTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sibs-modal-close-btn"
            aria-label="Close revision comment modal"
          >
            <X size={17} />
          </button>
        </div>

        <div className="sibs-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5">
          {commentModal.selectedText ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-amber-700">
                {commentModal.sectionKey === "personalityType"
                  ? "Selected Personality Type"
                  : commentModal.sectionKey === "competencies"
                    ? "Selected Competencies"
                    : "Highlighted Text"}
              </p>

              <div className="mt-2 selection:bg-[#FFF3B8] selection:text-[#101828]">
                <HighlightedRevisionText
                  value={commentModal.selectedText}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold leading-5 text-amber-800">
                No highlighted text detected. This comment will apply to the
                whole section.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-bold text-[#042C51]">
              Revision Comment <span className="text-[#FF5C28]">*</span>
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
              className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28]"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#E6ECF2] bg-white px-4 py-3 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center rounded-lg border border-[#D7DEE8] bg-white px-4 sibs-text-xs font-bold text-[#042C51] transition hover:bg-[#F8FAFC] active:scale-[0.98] sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!String(commentModal.comment || "").trim()}
            className="inline-flex h-8.5 2xl:h-10 w-full items-center justify-center rounded-lg bg-[#FF5C28] px-4 sibs-text-xs font-extrabold text-white transition hover:bg-[#E95324] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] sm:w-auto"
          >
            Save Comment
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
