export const DEFAULT_PUBLIC_APPLICATION_HOST = "sibsapply.getleadsource.com";

export function normalizeHostname(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

export function getPublicApplicationHosts() {
  const configuredHosts =
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_PUBLIC_APPLICATION_HOSTS ||
        import.meta.env.VITE_PUBLIC_APPLICATION_HOST
      : undefined) || DEFAULT_PUBLIC_APPLICATION_HOST;

  return String(configuredHosts)
    .split(",")
    .map(normalizeHostname)
    .filter(Boolean);
}

export function isPublicApplicationHostname(hostname = "") {
  const normalizedHostname = normalizeHostname(hostname);

  if (!normalizedHostname) {
    return false;
  }

  return getPublicApplicationHosts().includes(normalizedHostname);
}

export const STANDALONE_PUBLIC_PATHS = [
  // 1. Talent Pool Application
  "/apply",
  "/public/talent-pool/apply",
  "/recruitment/talent-pool/apply",

  // 2. Public Job Description
  "/job-description",
  "/public/job-description",

  // 3. Interview Scheduling
  "/public/interview-date",

  // 4. Offer Response
  "/public/offer-response",

  // 5. NHO Schedule Confirmation
  "/public/nho-schedule-response",

  // 6. Candidate Experience Survey
  "/public/candidate-experience-survey",
  "/recruitment/candidate-experience/survey",

  // 7. Online Assessment
  "/online-assessment",
];

export const PUBLIC_EXTERNAL_PATHS = [
  ...STANDALONE_PUBLIC_PATHS,

  // 8. Authentication & Entry
  "/login",
  "/",
];

export function normalizePath(pathname = "") {
  const clean = String(pathname ?? "").trim().split("?")[0].split("#")[0];
  if (!clean || clean === "/") return "/";
  return clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

function matchesPathPattern(normalized, pattern) {
  if (pattern === "/") {
    return normalized === "/";
  }
  return normalized === pattern || normalized.startsWith(`${pattern}/`);
}

export function isPublicPath(pathname = "") {
  const normalized = normalizePath(pathname);
  return PUBLIC_EXTERNAL_PATHS.some((pattern) =>
    matchesPathPattern(normalized, pattern)
  );
}

export function isPublicOrExternalRoute(pathname = "", hostname = "") {
  if (isPublicApplicationHostname(hostname)) {
    return true;
  }
  return isPublicPath(pathname);
}

export function isStandalonePublicRoute(pathname = "", hostname = "") {
  if (isPublicApplicationHostname(hostname)) {
    return true;
  }

  const normalized = normalizePath(pathname);
  return STANDALONE_PUBLIC_PATHS.some((pattern) =>
    matchesPathPattern(normalized, pattern)
  );
}
