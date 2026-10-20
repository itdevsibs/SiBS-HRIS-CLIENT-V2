// HEIC is not supported by most Chrome-based image viewers. Preserve the
// original HEIC upload; decode to JPEG only for an in-browser preview.
const HEIC_BRANDS = new Set([
  "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs",
]);

export function isChatHeicImage(value = {}) {
  const name = String(value.originalName || value.name || "").toLowerCase();
  const mime = String(value.mimeType || value.type || "").toLowerCase();
  return /\.hei(?:c|f)$/.test(name) || ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"].includes(mime);
}

// Validate the ISO-BMFF file-type brands instead of trusting the filename or
// MIME type. MP4/QuickTime also use ftyp and must not be treated as HEIC.
export function hasChatHeicSignature(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 20) return false;
  const ascii = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (ascii(4) !== "ftyp") return false;
  const boxSize = (bytes[0] * 0x1000000 + bytes[1] * 0x10000 + bytes[2] * 256 + bytes[3]) >>> 0;
  if (boxSize < 20 || boxSize > bytes.length) return false;
  for (let at = 8; at + 4 <= Math.min(boxSize, 256); at += 4) {
    if (at === 12) continue; // ftyp minor-version is not a brand
    if (HEIC_BRANDS.has(ascii(at))) return true;
  }
  return false;
}

export async function makeChatHeicJpeg(blob) {
  // Loaded only when a HEIC file is actually viewed; already a project dependency.
  const { heicTo } = await import("heic-to/csp");
  const converted = await heicTo({ blob, type: "image/jpeg", quality: 0.86 });
  if (!(converted instanceof Blob) || !converted.size) {
    throw new Error("Unable to convert this HEIC image for preview.");
  }
  return converted;
}
