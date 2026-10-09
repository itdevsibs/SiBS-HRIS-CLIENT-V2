import React, { useState } from "react";
import { Download, FileText, FolderLock, ShieldCheck } from "lucide-react";

import { ModalShell } from "@/components/ui";
import { formatDisplayDate } from "../../../../../lib/utils/employees/employeeProfileHelpers.js";
import { getDocumentFileType } from "./documentPresentation.js";

export default function DocumentPreviewModal({
  document,
  onClose,
  onDownload,
  variant = "navy",
}) {
  const [failedUrl, setFailedUrl] = useState("");

  if (!document) return null;

  const previewUrl =
    document.url || document.fileUrl || document.previewUrl || "";
  const isImageFailed = Boolean(previewUrl) && failedUrl === previewUrl;

  const fileName =
    document.name ||
    document.fileName ||
    document.file_name ||
    "Document Preview";
  const fileType = getDocumentFileType(fileName);
  const normalizedMime = String(document.mimeType || "").toLowerCase();
  const isImage =
    normalizedMime.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
  const isPdf =
    normalizedMime === "application/pdf" || /\.pdf$/i.test(fileName);

  return (
    <ModalShell
      open={Boolean(document)}
      onClose={onClose}
      variant={variant}
      icon={FolderLock}
      title={fileName}
      subtitle="Employee Personnel File"
      badge={document.category}
      maxWidth={previewUrl ? "max-w-4xl" : "max-w-xl"}
      bodyClassName="space-y-4 p-4 sm:p-5 2xl:p-6"
      footerMeta={
        <div className="flex items-center gap-2 sibs-text-micro font-semibold text-sibs-muted">
          <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
          <span>Downloads are recorded in the HRIS security audit trail.</span>
        </div>
      }
      footer={
        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(document)}
              className="sibs-btn-primary"
            >
              <Download size={14} />
              Download
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="sibs-btn-secondary"
          >
            Close
          </button>
        </div>
      }
    >
      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-sibs-border bg-sibs-surface p-2 sm:p-4">
          {isImage && !isImageFailed ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <img
                src={previewUrl}
                alt={fileName}
                onError={() => setFailedUrl(previewUrl)}
                className="max-h-[55vh] sm:max-h-[62vh] 2xl:max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-xs"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              title={fileName}
              loading="lazy"
              className="h-[55vh] sm:h-[62vh] 2xl:h-[65vh] w-full rounded-lg border border-sibs-border bg-white"
            />
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-sibs-border bg-white p-6 text-center">
              <FileText size={36} className="text-sibs-navy" />
              <p className="mt-2 sibs-text-sm font-extrabold text-sibs-navy">
                Preview not available for this {isImage ? "image" : "file type"}
              </p>
              <p className="mt-1 sibs-text-xs font-semibold text-sibs-muted">
                Download the document to open it on your device.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex items-start gap-4 rounded-xl border border-sibs-border bg-sibs-surface p-3.5 2xl:p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xs font-extrabold text-red-600">
          {fileType}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="sibs-modal-section-title truncate">{fileName}</h4>
          <span className="mt-1.5 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-sibs-navy">
            {document.category || "General"}
          </span>
        </div>
      </div>

      <div className="divide-y divide-sibs-border sibs-text-xs">
        {[
          ["File Size", document.fileSize],
          ["Uploaded Date", formatDisplayDate(document.uploadedAt)],
          ["Uploaded By", document.uploadedBy],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 py-2.5 2xl:py-3"
          >
            <span className="font-semibold text-sibs-muted">{label}</span>
            <span className="text-right font-extrabold text-sibs-navy">
              {value || "—"}
            </span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
