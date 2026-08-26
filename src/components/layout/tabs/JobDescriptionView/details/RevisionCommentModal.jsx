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
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="min-w-0">
            <h3
              id="add-revision-comment-title"
              className="truncate text-base sm:text-lg 2xl:text-xl font-extrabold text-white"
            >
              Add Revision Comment
            </h3>

            <p className="mt-0.5 truncate sibs-text-xs font-semibold text-white/75">
              {commentModal.sectionTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close revision comment modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="sibs-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5 2xl:p-6">
          {commentModal.selectedText ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
              <p className="text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-amber-700">
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
              <p className="sibs-text-xs font-semibold leading-relaxed text-amber-800">
                No highlighted text detected. This comment will apply to the
                whole section.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[8.5px] 2xl:text-[9px] font-extrabold uppercase tracking-wide text-[#98A2B3]">
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
              className="w-full resize-none rounded-xl border border-[#D7DEE8] bg-white px-3.5 py-2.5 sibs-text-xs font-semibold text-[#042C51] outline-none transition focus:border-[#FF5C28]"
            />
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#667085] transition hover:border-[#FF5C28]/40 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!String(commentModal.comment || "").trim()}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg bg-[#FF5C28] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E94F1F] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
          >
            Save Comment
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
