import axios from "axios";

export function isCancellation(error) {
  if (!error) return false;
  if (typeof axios.isCancel === "function" && axios.isCancel(error)) return true;
  const name = typeof error === "object" ? (error.name || error.constructor?.name || "") : "";
  const rawText = typeof error === "string" ? error : String(error.message || error.reason || "");
  const lower = rawText.toLowerCase();
  const code = error.code || "";
  if (
    name === "CanceledError" ||
    name === "CancelledError" ||
    name === "AbortError" ||
    code === "ERR_CANCELED" ||
    rawText === "canceled" ||
    rawText === "CancelledError" ||
    rawText === "Request cancelled" ||
    lower.includes("canceled") ||
    lower.includes("cancelled") ||
    lower.includes("aborted")
  ) {
    return true;
  }
  if (error.cause && isCancellation(error.cause)) {
    return true;
  }
  return false;
}

export default isCancellation;
