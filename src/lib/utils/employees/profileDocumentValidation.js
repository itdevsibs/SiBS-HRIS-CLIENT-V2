export const PROFILE_DOCUMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;

export const PROFILE_DOCUMENT_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".heif",
  ".txt",
].join(",");

export const PROFILE_DOCUMENT_TYPES = Object.freeze([
  "Certificate",
  "Contract",
  "Government ID",
  "Medical Record",
  "Memo",
  "Performance Document",
  "Training Document",
  "Other",
]);

const ALLOWED_EXTENSIONS = new Set(
  PROFILE_DOCUMENT_ACCEPT.split(",").map((extension) =>
    extension.trim().toLowerCase(),
  ),
);

const INLINE_PREVIEW_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
]);

const INLINE_PREVIEW_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function cleanText(value) {
  return String(value ?? "").trim();
}

function getFileExtension(value = "") {
  const filename = cleanText(value).toLowerCase();
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex < 0) return "";

  return filename.slice(lastDotIndex);
}

export function formatProfileDocumentSize(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const amount = bytes / 1024 ** unitIndex;
  const decimals = unitIndex === 0 || amount >= 10 ? 0 : 1;

  return `${amount.toFixed(decimals)} ${units[unitIndex]}`;
}

export function validateProfileDocumentFile(file) {
  if (!file) {
    return {
      valid: false,
      message: "Select a document before uploading.",
    };
  }

  const filename = cleanText(file.name);
  const extension = getFileExtension(filename);

  if (!filename) {
    return {
      valid: false,
      message: "The selected document has no filename.",
    };
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      message:
        "Unsupported document type. Allowed files: PDF, Word, Excel, CSV, images, HEIC/HEIF, and TXT.",
    };
  }

  const fileSize = Number(file.size || 0);

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return {
      valid: false,
      message: "The selected document is empty.",
    };
  }

  if (fileSize > PROFILE_DOCUMENT_MAX_SIZE_BYTES) {
    return {
      valid: false,
      message: `The document exceeds the ${formatProfileDocumentSize(
        PROFILE_DOCUMENT_MAX_SIZE_BYTES,
      )} upload limit.`,
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export function isInlinePreviewSupported(document = {}) {
  const mimeType = cleanText(
    document.mimeType ||
      document.mimetype ||
      document.contentType ||
      document.type,
  ).toLowerCase();

  if (INLINE_PREVIEW_MIME_TYPES.has(mimeType)) {
    return true;
  }

  const filename = cleanText(
    document.name ||
      document.fileName ||
      document.filename ||
      document.originalName,
  );

  return INLINE_PREVIEW_EXTENSIONS.has(getFileExtension(filename));
}
