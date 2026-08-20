/**
 * Parses and sanitizes a Content-Disposition header filename for candidate PDF resumes.
 *
 * @param {string} contentDisposition - The Content-Disposition response header.
 * @param {string} [fallback="Candidate_SiBS_Profile.pdf"] - Fallback filename if parsing fails.
 * @returns {string} Safe PDF filename.
 */
export function parseTalentPoolResumeFilename(
  contentDisposition = "",
  fallback = "Candidate_SiBS_Profile.pdf",
) {
  const match = String(contentDisposition).match(
    /filename\*?=(?:UTF-8''|"?)([^";]+)/i,
  );
  let candidate = match?.[1] || "";
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    candidate = "";
  }
  candidate = candidate.replace(/["\\/\r\n]/g, "").trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.pdf$/i.test(candidate)
    ? candidate
    : fallback;
}
