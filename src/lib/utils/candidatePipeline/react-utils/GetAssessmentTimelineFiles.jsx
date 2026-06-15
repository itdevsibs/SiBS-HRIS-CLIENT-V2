import React from "react";
import { Eye } from "lucide-react";
import { formatFileSize, getUploadFileIcon } from "../candidatePipelineHelpers";

function isTakenAssessmentTimelineItem(item = {}) {
  const text = [
    item.stage,
    item.source,
    item.reason,
    item.description,
    item.remarks,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    item.stage === "Online Assessment" &&
    (text.includes("assessment marked as taken") ||
      text.includes("marked as taken") ||
      text.includes("tagged as assessment fit") ||
      text.includes("tagged as assessment not fit"))
  );
}

function getAssessmentTimelineFiles(item = {}, candidate = {}) {
  const files = [];

  const pushFile = (file = {}) => {
    const fileName =
      file.fileName ||
      file.name ||
      file.assessmentFileName ||
      file.assessmentAttachmentName ||
      "";

    const fileUrl =
      file.fileUrl ||
      file.url ||
      file.assessmentFileUrl ||
      file.assessmentAttachmentUrl ||
      "";

    if (!fileName && !fileUrl) return;

    files.push({
      id:
        file.id ||
        `${fileName}-${fileUrl}-${files.length}` ||
        `assessment-file-${files.length}`,
      fileName: fileName || "Assessment attachment",
      fileUrl,
      fileType:
        file.fileType ||
        file.type ||
        file.assessmentFileType ||
        file.assessmentAttachmentType ||
        "",
      fileSize:
        file.fileSize ||
        file.size ||
        file.assessmentFileSize ||
        file.assessmentAttachmentSize ||
        0,
    });
  };

  if (Array.isArray(item.assessmentFiles)) {
    item.assessmentFiles.forEach(pushFile);
  }

  if (Array.isArray(item.files)) {
    item.files.forEach(pushFile);
  }

  pushFile({
    assessmentFileName: item.assessmentFileName,
    assessmentFileUrl: item.assessmentFileUrl,
    assessmentFileType: item.assessmentFileType,
    assessmentFileSize: item.assessmentFileSize,
  });

  pushFile({
    assessmentAttachmentName: item.assessmentAttachmentName,
    assessmentAttachmentUrl: item.assessmentAttachmentUrl,
    assessmentAttachmentType: item.assessmentAttachmentType,
    assessmentAttachmentSize: item.assessmentAttachmentSize,
  });

  /**
   * Fallback to candidate-level attachment ONLY on the actual
   * "Assessment marked as Taken..." timeline item.
   *
   * This prevents the file from also showing on the earlier
   * "assessment email has been triggered" timeline item.
   */
  if (files.length === 0 && isTakenAssessmentTimelineItem(item)) {
    pushFile({
      assessmentFileName: candidate.assessmentFileName,
      assessmentFileUrl: candidate.assessmentFileUrl,
      assessmentFileType: candidate.assessmentFileType,
      assessmentFileSize: candidate.assessmentFileSize,
    });

    pushFile({
      assessmentAttachmentName: candidate.assessmentAttachmentName,
      assessmentAttachmentUrl: candidate.assessmentAttachmentUrl,
      assessmentAttachmentType: candidate.assessmentAttachmentType,
      assessmentAttachmentSize: candidate.assessmentAttachmentSize,
    });
  }

  const uniqueFiles = new Map();

  files.forEach((file) => {
    const key = `${file.fileName}-${file.fileUrl}`;

    if (!uniqueFiles.has(key)) {
      uniqueFiles.set(key, file);
    }
  });

  return Array.from(uniqueFiles.values());
}

export default function GetAssessmentTimelineFiles({
  item = {},
  candidate = {},
}) {
  const files = getAssessmentTimelineFiles(item, candidate);

  if (!files.length) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        Assessment Attachment
      </p>

      <div className="mt-2 space-y-2">
        {files.map((file) => {
          const Icon = getUploadFileIcon(file.fileName);

          return (
            <div
              key={file.id}
              className="flex min-w-0 items-center gap-3 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6ECF2] bg-[#F8FAFC] text-sibs-primary-1">
                <Icon size={18} />
              </div>

              <button
                type="button"
                title={file.fileUrl || file.fileName}
                onClick={() => {
                  if (file.fileUrl) {
                    window.open(file.fileUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-bold text-blue-600 underline">
                  {file.fileName}
                </p>

                <p className="mt-0.5 truncate text-[11px] font-semibold text-[#667085] no-underline">
                  {file.fileType || "Assessment file"} •{" "}
                  {formatFileSize(file.fileSize)}
                </p>
              </button>

              {/* {file.fileUrl && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(file.fileUrl, "_blank", "noopener,noreferrer")
                  }
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                  title="View uploaded file"
                >
                  <Eye size={16} />
                </button>
              )} */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
