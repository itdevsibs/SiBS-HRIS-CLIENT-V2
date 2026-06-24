import React, { useMemo } from "react";
import {
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  Link as LinkIcon,
} from "lucide-react";

function cleanText(value) {
  return String(value ?? "").trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function getWindowOrigin() {
  if (typeof window === "undefined") return "";
  return window.location?.origin || "";
}

function getApiBaseUrl() {
  const apiUrl = cleanText(import.meta.env.VITE_API_URL).replace(/\/+$/, "");

  if (apiUrl) return apiUrl;

  return getWindowOrigin();
}

function isFullUrl(value = "") {
  const text = cleanText(value).toLowerCase();

  return (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("data:") ||
    text.startsWith("blob:")
  );
}

function getCandidateLookupId(candidate = {}) {
  const safeCandidate = safeObject(candidate);
  const pipelineCandidate = safeObject(safeCandidate.pipelineCandidate);
  const metadata = safeObject(safeCandidate.metadata);
  const candidateSnapshot = safeObject(safeCandidate.candidateSnapshot);

  return (
    safeCandidate.dbId ||
    safeCandidate.pipelineDbId ||
    safeCandidate.pipelineId ||
    safeCandidate.id ||
    pipelineCandidate.dbId ||
    pipelineCandidate.id ||
    safeCandidate.candidateId ||
    safeCandidate.candidate_id ||
    safeCandidate.candidateApplicationId ||
    safeCandidate.candidate_application_id ||
    safeCandidate.applicationId ||
    metadata.pipelineId ||
    metadata.pipelineDbId ||
    metadata.candidatePipelineId ||
    candidateSnapshot.pipelineId ||
    candidateSnapshot.dbId ||
    ""
  );
}

function buildCandidatePipelineFileUrl(candidate = {}, fileName = "") {
  const lookupId = getCandidateLookupId(candidate);
  const filename = cleanText(fileName);

  if (!lookupId || !filename) return "";

  return `/api/candidate-pipeline/file/${encodeURIComponent(
    lookupId,
  )}/${encodeURIComponent(filename)}`;
}

function getResolvedUrl(value = "", candidate = {}, fallbackFileName = "") {
  const text = cleanText(value);

  if (text) {
    if (isFullUrl(text)) return text;

    if (text.startsWith("/api/")) {
      return `${getApiBaseUrl()}${text}`;
    }

    if (text.startsWith("/")) {
      return `${getWindowOrigin()}${text}`;
    }

    if (
      text.includes("/") ||
      text.includes("\\") ||
      text.includes(".") ||
      fallbackFileName
    ) {
      const builtUrl = buildCandidatePipelineFileUrl(candidate, text);

      if (builtUrl) {
        return `${getApiBaseUrl()}${builtUrl}`;
      }
    }

    return text;
  }

  const builtUrl = buildCandidatePipelineFileUrl(candidate, fallbackFileName);

  if (builtUrl) {
    return `${getApiBaseUrl()}${builtUrl}`;
  }

  return "";
}

function getDisplayUrl(value = "", candidate = {}, fallbackFileName = "") {
  return getResolvedUrl(value, candidate, fallbackFileName);
}

function getStageKey(item = {}) {
  const safeItem = safeObject(item);

  return cleanText(
    safeItem.stage ||
      safeItem.currentStage ||
      safeItem.pipelineStage ||
      safeItem.title ||
      safeItem.outcome,
  ).toLowerCase();
}

function isInterviewedStage(item = {}) {
  const stage = getStageKey(item);

  return (
    stage === "interviewed" ||
    stage.includes("interviewed") ||
    stage.includes("final interview") ||
    stage.includes("job evaluation")
  );
}

function isAssessmentStage(item = {}) {
  const safeItem = safeObject(item);
  const stage = getStageKey(safeItem);

  return (
    stage.includes("assessment") ||
    stage.includes("online assessment") ||
    Boolean(
      safeItem.assessmentFileName ||
        safeItem.assessment_file_name ||
        safeItem.assessmentFileUrl ||
        safeItem.assessment_file_url,
    )
  );
}

function getFileIcon(fileName = "", fileType = "") {
  const name = cleanText(fileName).toLowerCase();
  const type = cleanText(fileType).toLowerCase();

  if (
    type.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(name)
  ) {
    return FileImage;
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    /\.(xls|xlsx|csv)$/i.test(name)
  ) {
    return FileSpreadsheet;
  }

  return FileText;
}

function formatFileSize(value = 0) {
  const size = Number(value || 0);

  if (!size || Number.isNaN(size)) return "—";

  const kb = size / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

function getCleanFileName(value = "") {
  const text = cleanText(value);

  if (!text) return "";

  return text.split(/[\\/]/).pop();
}

function normalizeFile(file, candidate = {}) {
  const safeFile = safeObject(file);

  if (!Object.keys(safeFile).length) return null;

  const fileName =
    safeFile.fileName ||
    safeFile.name ||
    safeFile.originalName ||
    safeFile.originalname ||
    safeFile.assessmentFileName ||
    safeFile.assessment_file_name ||
    safeFile.savedFileName ||
    safeFile.saved_file_name ||
    safeFile.filename ||
    "";

  const savedFileName =
    safeFile.savedFileName ||
    safeFile.saved_file_name ||
    safeFile.filename ||
    getCleanFileName(safeFile.filePath || safeFile.storedPath || "") ||
    "";

  const finalFileName = getCleanFileName(fileName || savedFileName);

  const rawFileUrl =
    safeFile.fileUrl ||
    safeFile.url ||
    safeFile.downloadUrl ||
    safeFile.assessmentFileUrl ||
    safeFile.assessment_file_url ||
    "";

  const fileType =
    safeFile.fileType ||
    safeFile.type ||
    safeFile.mimeType ||
    safeFile.mimetype ||
    safeFile.assessmentFileType ||
    safeFile.assessment_file_type ||
    "";

  const fileSize =
    safeFile.fileSize ||
    safeFile.size ||
    safeFile.assessmentFileSize ||
    safeFile.assessment_file_size ||
    0;

  if (!finalFileName && !rawFileUrl) return null;

  const resolvedUrl = getResolvedUrl(
    rawFileUrl,
    candidate,
    savedFileName || finalFileName,
  );

  return {
    id:
      safeFile.id ||
      safeFile.fileId ||
      `${finalFileName || "assessment-file"}-${resolvedUrl || "no-url"}`,
    fileName: finalFileName || "Assessment attachment",
    savedFileName: savedFileName || finalFileName,
    fileUrl: resolvedUrl,
    fileType,
    fileSize,
    label:
      safeFile.label ||
      safeFile.requirement ||
      safeFile.title ||
      safeFile.category ||
      "Assessment Attachment",
  };
}

function getAssessmentFiles(item = {}, candidate = {}) {
  const safeItem = safeObject(item);
  const safeCandidate = safeObject(candidate);
  const itemExtra = safeObject(safeItem.extra);
  const candidateMetadata = safeObject(safeCandidate.metadata);

  const directFiles = [
    safeItem.assessmentFile,
    safeItem.assessment_file,
    itemExtra.assessmentFile,
    itemExtra.assessment_file,
    safeCandidate.assessmentFile,
    safeCandidate.assessment_file,
    candidateMetadata.assessmentFile,
    candidateMetadata.assessment_file,
  ];

  const arraySources = [
    safeItem.assessmentFiles,
    safeItem.assessment_files,
    safeItem.attachments,
    safeItem.files,
    itemExtra.assessmentFiles,
    itemExtra.assessment_files,
    itemExtra.attachments,
    itemExtra.files,
    safeCandidate.assessmentFiles,
    safeCandidate.assessment_files,
    safeCandidate.attachments,
    candidateMetadata.assessmentFiles,
    candidateMetadata.assessment_files,
  ];

  const fallbackFile =
    safeItem.assessmentFileName ||
    safeItem.assessment_file_name ||
    safeItem.assessmentFileUrl ||
    safeItem.assessment_file_url ||
    safeCandidate.assessmentFileName ||
    safeCandidate.assessment_file_name ||
    safeCandidate.assessmentFileUrl ||
    safeCandidate.assessment_file_url
      ? {
          fileName:
            safeItem.assessmentFileName ||
            safeItem.assessment_file_name ||
            safeCandidate.assessmentFileName ||
            safeCandidate.assessment_file_name ||
            "Assessment attachment",
          savedFileName:
            safeItem.assessmentSavedFileName ||
            safeItem.assessment_saved_file_name ||
            safeCandidate.assessmentSavedFileName ||
            safeCandidate.assessment_saved_file_name ||
            safeItem.assessmentFileName ||
            safeItem.assessment_file_name ||
            safeCandidate.assessmentFileName ||
            safeCandidate.assessment_file_name ||
            "",
          fileUrl:
            safeItem.assessmentFileUrl ||
            safeItem.assessment_file_url ||
            safeCandidate.assessmentFileUrl ||
            safeCandidate.assessment_file_url ||
            "",
          fileType:
            safeItem.assessmentFileType ||
            safeItem.assessment_file_type ||
            safeCandidate.assessmentFileType ||
            safeCandidate.assessment_file_type ||
            "",
          fileSize:
            safeItem.assessmentFileSize ||
            safeItem.assessment_file_size ||
            safeCandidate.assessmentFileSize ||
            safeCandidate.assessment_file_size ||
            0,
          label: "Assessment Attachment",
        }
      : null;

  const allFiles = [
    ...directFiles,
    ...arraySources.flatMap((source) => safeArray(source)),
    fallbackFile,
  ]
    .filter(Boolean)
    .map((file) => normalizeFile(file, safeCandidate))
    .filter(Boolean);

  const uniqueMap = new Map();

  allFiles.forEach((file) => {
    const key = `${cleanText(file.fileName).toLowerCase()}|${cleanText(
      file.fileUrl,
    ).toLowerCase()}`;

    if (!key.trim()) return;

    uniqueMap.set(key, file);
  });

  return Array.from(uniqueMap.values());
}

function getLatestFinalInterviewSubmission(candidate = {}, item = {}) {
  const safeCandidate = safeObject(candidate);
  const safeItem = safeObject(item);
  const itemExtra = safeObject(safeItem.extra);
  const candidateMetadata = safeObject(safeCandidate.metadata);

  const submissions = [
    safeItem.submission,
    safeItem.finalInterviewSubmission,
    safeItem.final_interview_submission,
    itemExtra.submission,
    itemExtra.finalInterviewSubmission,
    itemExtra.final_interview_submission,
    ...safeArray(safeItem.finalInterviewSubmittedForms),
    ...safeArray(safeItem.final_interview_submitted_forms),
    ...safeArray(safeItem.finalInterviewSubmissions),
    ...safeArray(safeItem.final_interview_submissions),
    ...safeArray(itemExtra.finalInterviewSubmittedForms),
    ...safeArray(itemExtra.final_interview_submitted_forms),
    ...safeArray(itemExtra.finalInterviewSubmissions),
    ...safeArray(itemExtra.final_interview_submissions),
    ...safeArray(safeCandidate.finalInterviewSubmittedForms),
    ...safeArray(safeCandidate.final_interview_submitted_forms),
    ...safeArray(safeCandidate.finalInterviewSubmissions),
    ...safeArray(safeCandidate.final_interview_submissions),
    ...safeArray(candidateMetadata.finalInterviewSubmittedForms),
    ...safeArray(candidateMetadata.final_interview_submitted_forms),
    ...safeArray(candidateMetadata.finalInterviewSubmissions),
    ...safeArray(candidateMetadata.final_interview_submissions),
  ]
    .map((entry) => safeObject(entry))
    .filter((entry) => Object.keys(entry).length > 0);

  if (!submissions.length) return null;

  const itemSubmissionId =
    safeItem.submittedFormId ||
    safeItem.submissionId ||
    safeItem.finalInterviewSubmissionId ||
    itemExtra.submittedFormId ||
    itemExtra.submissionId ||
    itemExtra.finalInterviewSubmissionId ||
    "";

  if (itemSubmissionId) {
    const matchedSubmission = submissions.find(
      (entry) =>
        String(entry.id || entry.submissionId || "") ===
        String(itemSubmissionId),
    );

    if (matchedSubmission) return matchedSubmission;
  }

  return submissions
    .slice()
    .sort((a, b) => {
      const dateA = new Date(
        a.submittedAtIso || a.submittedAt || a.createdAt || a.updatedAt || 0,
      ).getTime();

      const dateB = new Date(
        b.submittedAtIso || b.submittedAt || b.createdAt || b.updatedAt || 0,
      ).getTime();

      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;

      return dateB - dateA;
    })[0];
}

function getInterviewAssessmentLink(item = {}, candidate = {}) {
  const safeItem = safeObject(item);
  const safeCandidate = safeObject(candidate);
  const itemExtra = safeObject(safeItem.extra);
  const candidateMetadata = safeObject(safeCandidate.metadata);
  const latestSubmission = getLatestFinalInterviewSubmission(
    safeCandidate,
    safeItem,
  );

  const possibleLinks = [
    safeItem.savedFormLink,
    safeItem.jobEvaluationLink,
    safeItem.finalInterviewLink,
    safeItem.assessmentLink,
    safeItem.formLink,
    safeItem.viewLink,

    itemExtra.savedFormLink,
    itemExtra.jobEvaluationLink,
    itemExtra.finalInterviewLink,
    itemExtra.assessmentLink,
    itemExtra.formLink,
    itemExtra.viewLink,

    latestSubmission?.savedFormLink,
    latestSubmission?.jobEvaluationLink,
    latestSubmission?.finalInterviewLink,
    latestSubmission?.assessmentLink,
    latestSubmission?.formLink,
    latestSubmission?.viewLink,

    safeCandidate.savedFormLink,
    safeCandidate.jobEvaluationLink,
    safeCandidate.finalInterviewLink,
    safeCandidate.assessmentLink,

    candidateMetadata.savedFormLink,
    candidateMetadata.jobEvaluationLink,
    candidateMetadata.finalInterviewLink,
    candidateMetadata.assessmentLink,
  ];

  const link = possibleLinks.find((value) => cleanText(value));

  if (!link) return null;

  return {
    label:
      latestSubmission?.formName ||
      safeItem.formName ||
      itemExtra.formName ||
      safeCandidate.finalInterviewFormName ||
      "Job Evaluation / Assessment Link",
    href: getResolvedUrl(link, safeCandidate),
    display: getDisplayUrl(link, safeCandidate),
    submittedBy:
      latestSubmission?.submittedBy ||
      safeItem.submittedBy ||
      itemExtra.submittedBy ||
      "",
    submittedAt:
      latestSubmission?.submittedAt ||
      latestSubmission?.submittedAtIso ||
      safeItem.submittedAt ||
      itemExtra.submittedAt ||
      "",
  };
}

function openReadableUrl(url = "") {
  const href = cleanText(url);

  if (!href || typeof window === "undefined") return;

  window.open(href, "_blank", "noopener,noreferrer");
}

function TimelineLinkCard({ link }) {
  if (!link?.href) return null;

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sibs-primary-1">
          <LinkIcon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
            {link.label || "Assessment Link"}
          </p>

          <button
            type="button"
            title={link.display}
            onClick={() => openReadableUrl(link.href)}
            className="mt-1 block w-full min-w-0 break-all rounded-lg text-left text-xs font-bold leading-5 text-blue-700 underline underline-offset-2 outline-none transition hover:text-blue-900 focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            {link.display}
          </button>

          {(link.submittedBy || link.submittedAt) && (
            <p className="mt-2 truncate text-[11px] font-semibold text-[#667085]">
              {link.submittedBy ? `Submitted by ${link.submittedBy}` : ""}
              {link.submittedBy && link.submittedAt ? " • " : ""}
              {link.submittedAt || ""}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => openReadableUrl(link.href)}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 text-xs font-extrabold text-sibs-primary-1 outline-none transition hover:bg-blue-100 focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <ExternalLink size={15} />
          Open
        </button>
      </div>
    </div>
  );
}

function TimelineFileCard({ file }) {
  const safeFile = safeObject(file);

  if (!Object.keys(safeFile).length) return null;

  const FileIcon = getFileIcon(safeFile.fileName, safeFile.fileType);
  const resolvedUrl = cleanText(safeFile.fileUrl);

  return (
    <div className="mt-3 rounded-xl border border-[#CFE0F5] bg-white p-3">
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-sibs-primary-1">
        {safeFile.label || "Assessment Attachment"}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E6ECF2] bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sibs-primary-1 shadow-sm">
            <FileIcon size={21} />
          </div>

          <div className="min-w-0 flex-1">
            {resolvedUrl ? (
              <button
                type="button"
                title={resolvedUrl}
                onClick={() => openReadableUrl(resolvedUrl)}
                className="block w-full min-w-0 break-words text-left text-sm font-extrabold leading-5 text-blue-700 underline underline-offset-2 outline-none transition hover:text-blue-900 focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                {safeFile.fileName || "Open assessment file"}
              </button>
            ) : (
              <p className="break-words text-sm font-extrabold leading-5 text-[#101828]">
                {safeFile.fileName || "Assessment attachment"}
              </p>
            )}

            <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#667085]">
              {safeFile.fileType || "File"} •{" "}
              {formatFileSize(safeFile.fileSize)}
            </p>
          </div>
        </div>

        {resolvedUrl && (
          <button
            type="button"
            onClick={() => openReadableUrl(resolvedUrl)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 text-xs font-extrabold text-sibs-primary-1 outline-none transition hover:bg-blue-100 focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <ExternalLink size={15} />
            Open File
          </button>
        )}
      </div>
    </div>
  );
}

export default function GetAssessmentTimelineFiles({
  item = {},
  candidate = {},
}) {
  const safeItem = safeObject(item);
  const safeCandidate = safeObject(candidate);

  const assessmentFiles = useMemo(
    () => getAssessmentFiles(safeItem, safeCandidate),
    [safeItem, safeCandidate],
  );

  const interviewedAssessmentLink = useMemo(
    () => getInterviewAssessmentLink(safeItem, safeCandidate),
    [safeItem, safeCandidate],
  );

  const shouldShowInterviewLink =
    isInterviewedStage(safeItem) && interviewedAssessmentLink;

  const shouldShowAssessmentFiles =
    assessmentFiles.length > 0 &&
    (isAssessmentStage(safeItem) || isInterviewedStage(safeItem));

  if (!shouldShowInterviewLink && !shouldShowAssessmentFiles) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {shouldShowInterviewLink && (
        <TimelineLinkCard link={interviewedAssessmentLink} />
      )}

      {shouldShowAssessmentFiles &&
        assessmentFiles.map((file) => (
          <TimelineFileCard
            key={`${file.id}-${file.fileName}-${file.fileUrl}`}
            file={file}
          />
        ))}
    </div>
  );
}