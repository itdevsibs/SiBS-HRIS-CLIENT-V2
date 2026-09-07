import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Download,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  X,
} from "lucide-react";

import {
  getResignationSibsId,
  normalizeAttachmentUrl,
  normalizeResignationAttachments,
} from "../../../lib/utils/resignation/attachmentUtils.js";

const DEFAULT_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001";

export { normalizeAttachmentUrl, normalizeResignationAttachments };

function getEmployeeName(resignation) {
  return (
    resignation?.employeeName ||
    resignation?.fullName ||
    resignation?.full_name ||
    resignation?.name ||
    "Employee"
  );
}

function formatFileSize(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatUploadedAt(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileTypeLabel(attachment) {
  const extension = String(attachment?.extension || "").toUpperCase();
  return extension || "FILE";
}

function AttachmentTypeIcon({ attachment }) {
  const extension = attachment.extension;

  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(
      extension,
    )
  ) {
    return <FileImage size={20} />;
  }

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return <FileSpreadsheet size={20} />;
  }

  if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension)) {
    return <FileText size={20} />;
  }

  return <File size={20} />;
}

function AttachmentCard({ attachment, onOpen, onDownload }) {
  const sizeLabel = formatFileSize(attachment.size);
  const uploadedLabel = formatUploadedAt(attachment.uploadedAt);

  return (
    <article className="rounded-xl border border-[#E6ECF2] bg-white p-4 transition hover:border-[#FF5C28]/30 hover:shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#FF5C28]">
            <AttachmentTypeIcon attachment={attachment} />
          </span>

          <div className="min-w-0">
            <p
              className="break-all text-sm font-extrabold leading-5 text-[#042C51]"
              title={attachment.name}
            >
              {attachment.name}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-[#667085]">
              <span className="rounded bg-[#F2F4F7] px-2 py-1 uppercase text-[#344054]">
                {getFileTypeLabel(attachment)}
              </span>

              {sizeLabel && <span>{sizeLabel}</span>}
              {uploadedLabel && <span>{uploadedLabel}</span>}
            </div>

            {!attachment.url && (
              <p className="mt-2 text-xs font-semibold text-amber-700">
                The filename is available, but the file URL could not be built.
              </p>
            )}
          </div>
        </div>

        {attachment.url && (
          <div className="flex shrink-0 flex-col gap-2 min-[420px]:flex-row">
            <button
              type="button"
              onClick={() => onOpen(attachment)}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg border border-[#D6DEE8] bg-white px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-[#042C51] transition hover:border-[#FF5C28]/50 hover:bg-[#FFF8F5] hover:text-[#FF5C28]"
            >
              <ExternalLink size={13} />
              Open
            </button>

            <button
              type="button"
              onClick={() => onDownload(attachment)}
              className="inline-flex h-8.5 2xl:h-10 items-center justify-center gap-2 rounded-lg bg-[#042C51] px-3.5 2xl:px-4 sibs-text-xs font-extrabold text-white transition hover:bg-[#FF5C28] active:scale-[0.98]"
            >
              <Download size={13} />
              Download
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function AttachmentsModal({
  open,
  resignation,
  onClose,
  apiBaseUrl = DEFAULT_API_URL,
}) {
  const [isClosing, setIsClosing] = useState(false);

  const attachments = useMemo(
    () => normalizeResignationAttachments(resignation, apiBaseUrl),
    [resignation, apiBaseUrl],
  );

  const employeeName = getEmployeeName(resignation);
  const sibsId = getResignationSibsId(resignation);

  useEffect(() => {
    if (!open) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    function handleEscape(event) {
      if (event.key === "Escape") {
        requestClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
    // requestClose is intentionally resolved from the latest render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) setIsClosing(false);
  }, [open, resignation]);

  if (!open || !resignation || typeof document === "undefined") return null;

  function requestClose() {
    if (isClosing) return;

    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 220);
  }

  function handleOpen(attachment) {
    if (!attachment.url) return;
    window.open(attachment.url, "_blank", "noopener,noreferrer");
  }

  function handleDownload(attachment) {
    if (!attachment.url) return;

    const anchor = document.createElement("a");
    anchor.href = attachment.url;
    anchor.download = attachment.name;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return createPortal(
    <div
      className={`sibs-modal-blur fixed inset-0 z-[999999] flex h-dvh items-center justify-center p-2 sm:p-5 ${
        isClosing ? "sibs-modal-backdrop-out" : "sibs-modal-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="resignation-attachments-title"
        className={`flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white font-jakarta shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${
          isClosing ? "sibs-modal-pop-out" : "sibs-modal-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 bg-[#042C51] px-5 py-3 text-white sm:px-6 2xl:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 2xl:gap-3">
            <span className="flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#FF5C28] text-white shadow-sm">
              <Paperclip size={16} />
            </span>

            <div className="min-w-0">
              <h2
                id="resignation-attachments-title"
                className="sibs-modal-title truncate text-white"
              >
                Resignation Attachments
              </h2>

              <p className="sibs-modal-subtitle mt-0.5 truncate text-white/75">
                {employeeName} · {sibsId || "No SIBS ID"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-8 w-8 2xl:h-8.5 2xl:w-8.5 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close attachments modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sibs-scrollbar sm:p-5">
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-[#E6ECF2] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#667085]">
                Submitted Files
              </p>
              <p className="mt-1 text-sm font-extrabold text-[#042C51]">
                {attachments.length} {attachments.length === 1 ? "attachment" : "attachments"}
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#FFF0EB] px-3 py-2 text-xs font-extrabold text-[#FF5C28]">
              <Paperclip size={14} />
              View-only file access
            </span>
          </div>

          {attachments.length > 0 ? (
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  onOpen={handleOpen}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#D9E2EC] bg-white p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0EB] text-[#FF5C28]">
                <Paperclip size={22} />
              </span>

              <h3 className="sibs-modal-section-title mt-4 text-[#042C51]">
                No Attachments
              </h3>

              <p className="sibs-modal-section-subtitle mt-2 max-w-sm leading-6 text-[#667085]">
                No attachment was submitted for this resignation.
              </p>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 justify-end border-t border-[#DDE5EE] bg-[#F1F5F9] px-5 py-3 2xl:py-3.5 sm:px-6">
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-8.5 2xl:h-10 items-center justify-center rounded-lg bg-[#042C51] px-4 2xl:px-5 font-jakarta sibs-text-xs font-extrabold text-white transition hover:bg-[#FF5C28]"
          >
            Close
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
