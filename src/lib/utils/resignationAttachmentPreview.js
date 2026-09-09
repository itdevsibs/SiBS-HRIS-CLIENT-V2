const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "heic",
  "heif",
]);

const WORD_EXTENSIONS = new Set(["doc", "docx"]);
const EXCEL_EXTENSIONS = new Set(["xls", "xlsx", "csv"]);

function getExtension(filename = "") {
  return (
    String(filename || "")
      .trim()
      .split(".")
      .pop()
      ?.toLowerCase() || ""
  );
}

export function getResignationAttachmentPreviewKind(filename = "") {
  const extension = getExtension(filename);

  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (extension === "pdf") return "pdf";
  if (WORD_EXTENSIONS.has(extension)) return "word";
  if (EXCEL_EXTENSIONS.has(extension)) return "excel";

  return "unsupported";
}

export function isResignationAttachmentPreviewable(filename = "") {
  return getResignationAttachmentPreviewKind(filename) !== "unsupported";
}
