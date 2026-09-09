import { heicTo } from "heic-to";

export function isHeicFileName(filename = "") {
  const cleanName = String(filename || "")
    .trim()
    .toLowerCase();

  return (
    cleanName.endsWith(".heic") ||
    cleanName.endsWith(".heif")
  );
}

export async function convertHeicBlobToJpeg(
  sourceBlob,
  converter = null,
) {
  if (
    !(sourceBlob instanceof Blob) ||
    sourceBlob.size <= 0
  ) {
    throw new Error(
      "HEIC preview source is empty.",
    );
  }

  const convert =
    converter || heicTo;

  if (typeof convert !== "function") {
    throw new Error(
      "HEIC browser converter is not available.",
    );
  }

  const convertedBlob = await convert({
    blob: sourceBlob,
    type: "image/jpeg",
    quality: 0.92,
  });

  if (
    !(convertedBlob instanceof Blob) ||
    convertedBlob.size <= 0
  ) {
    throw new Error(
      "HEIC conversion returned an empty preview.",
    );
  }

  return convertedBlob;
}