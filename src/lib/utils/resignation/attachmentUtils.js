export function normalizeAttachmentUrl(url, apiBaseUrl = "") {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl || cleanUrl === "#") return "";

  if (/^https?:\/\//i.test(cleanUrl)) return cleanUrl;

  const cleanBase = String(apiBaseUrl || "").replace(/\/+$/, "");
  const cleanPath = cleanUrl.replace(/^\/+/, "");

  return cleanBase ? `${cleanBase}/${cleanPath}` : cleanUrl;
}

export function getResignationSibsId(resignation) {
  return String(
    resignation?.employeeSibsId ||
      resignation?.sibsId ||
      resignation?.sibs_id ||
      "",
  ).trim();
}

export function getAttachmentExtension(name) {
  const cleanName = String(name || "").trim();
  const dotIndex = cleanName.lastIndexOf(".");
  return dotIndex >= 0 ? cleanName.slice(dotIndex + 1).toLowerCase() : "";
}

function getMimeType(attachment, extension) {
  const direct = String(
    attachment?.mimeType ||
      attachment?.mime_type ||
      attachment?.type ||
      "",
  ).trim();

  if (direct) return direct;
  if (extension === "pdf") return "application/pdf";

  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"].includes(
      extension,
    )
  ) {
    return `image/${extension === "jpg" ? "jpeg" : extension}`;
  }

  if (["doc", "docx"].includes(extension)) return "application/msword";

  if (["xls", "xlsx", "csv"].includes(extension)) {
    return "application/vnd.ms-excel";
  }

  return "application/octet-stream";
}

function getAttachmentName(item) {
  const directName = String(
    item?.name ||
      item?.filename ||
      item?.fileName ||
      item?.uploadedFile ||
      "",
  ).trim();

  if (directName) return directName;

  const rawUrl = String(
    item?.url ||
      item?.fileUrl ||
      item?.file_url ||
      item?.uploadedFileUrl ||
      item?.uploaded_file_url ||
      "",
  ).trim();

  if (!rawUrl) return "";

  const pathWithoutQuery = rawUrl.split(/[?#]/)[0];
  const encodedName = pathWithoutQuery.split("/").filter(Boolean).pop() || "";

  try {
    return decodeURIComponent(encodedName).trim();
  } catch {
    return encodedName.trim();
  }
}

function buildFallbackFileUrl({ apiBaseUrl, sibsId, name }) {
  const cleanBase = String(apiBaseUrl || "").replace(/\/+$/, "");
  if (!cleanBase || !sibsId || !name) return "";

  return `${cleanBase}/api/resignation/file/${encodeURIComponent(
    sibsId,
  )}/${encodeURIComponent(name)}`;
}

export function normalizeResignationAttachments(resignation, apiBaseUrl = "") {
  if (!resignation || typeof resignation !== "object") return [];

  const sibsId = getResignationSibsId(resignation);
  const recordFileName = String(
    resignation.uploadedFile ||
      resignation.uploaded_file ||
      resignation.uploadedFileName ||
      resignation.fileName ||
      "",
  ).trim();

  const directRecordUrl =
    resignation.uploadedFileUrl ||
    resignation.uploaded_file_url ||
    resignation.fileUrl ||
    resignation.file_url ||
    "";

  const source = Array.isArray(resignation.attachments)
    ? resignation.attachments
    : recordFileName
      ? [
          {
            name: recordFileName,
            url: directRecordUrl,
            size:
              resignation.uploadedFileSize || resignation.fileSize || null,
            uploadedAt:
              resignation.uploadedFileUploadedAt ||
              resignation.fileUploadedAt ||
              null,
            mimeType:
              resignation.uploadedFileMimeType ||
              resignation.fileMimeType ||
              "",
          },
        ]
      : [];

  const normalized = source
    .map((entry, index) => {
      const item =
        typeof entry === "string"
          ? { name: entry }
          : entry && typeof entry === "object"
            ? entry
            : null;

      if (!item) return null;

      const name = getAttachmentName(item);
      if (!name) return null;

      const directUrl =
        item.url ||
        item.fileUrl ||
        item.file_url ||
        item.uploadedFileUrl ||
        item.uploaded_file_url ||
        "";

      const url = directUrl
        ? normalizeAttachmentUrl(directUrl, apiBaseUrl)
        : buildFallbackFileUrl({ apiBaseUrl, sibsId, name });

      const extension = getAttachmentExtension(name);

      return {
        id: String(
          item.id || item.attachmentId || `${index}-${name}-${url || "no-url"}`,
        ),
        name,
        url,
        size: item.size ?? item.fileSize ?? item.file_size ?? null,
        uploadedAt:
          item.uploadedAt ||
          item.uploaded_at ||
          item.createdAt ||
          item.created_at ||
          null,
        mimeType: getMimeType(item, extension),
        extension,
      };
    })
    .filter(Boolean);

  const seen = new Set();

  return normalized.filter((attachment) => {
    const key = `${attachment.name.toLowerCase()}::${attachment.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getAttachmentCount(resignation) {
  return normalizeResignationAttachments(resignation, "").length;
}

export function getAttachmentCountLabel(resignation) {
  const count = getAttachmentCount(resignation);
  if (count === 0) return "No Attachment";
  if (count === 1) return "1 Attachment";
  return `${count} Attachments`;
}

export function getFirstAttachmentName(resignation) {
  return normalizeResignationAttachments(resignation, "")[0]?.name || "";
}
