export const MAX_PROFILE_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

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
].join(",");

export const PROFILE_DOCUMENT_TYPES = [
  "Resume",
  "Government ID",
  "Contract",
  "Certificate",
  "Training Record",
  "Other",
];

const ALLOWED_EXTENSIONS = new Set(
  PROFILE_DOCUMENT_ACCEPT.split(",").map((item) => item.trim()),
);

export function getProfileDocumentExtension(filename) {
  const normalized = String(filename || "").trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

export function formatProfileDocumentSize(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateProfileDocumentFile(file) {
  if (!file) {
    return {
      valid: false,
      message: "Select a document to upload.",
    };
  }

  const extension = getProfileDocumentExtension(file.name);

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      message:
        "Unsupported file type. Use PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, JPEG, or PNG.",
    };
  }

  if (!Number(file.size || 0)) {
    return {
      valid: false,
      message: "The selected document is empty.",
    };
  }

  if (Number(file.size) > MAX_PROFILE_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      message: "The selected document exceeds the 10 MB limit.",
    };
  }

  return {
    valid: true,
    message: "",
    extension,
  };
}

export function isInlinePreviewSupported(document) {
  const mimeType = String(document?.mimeType || "").toLowerCase();
  const extension = getProfileDocumentExtension(document?.name);

  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/") ||
    [".pdf", ".jpg", ".jpeg", ".png"].includes(extension)
  );
}
