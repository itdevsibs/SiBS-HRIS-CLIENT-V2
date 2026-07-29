import { cleanText } from "../../../../../lib/utils/employees/employeeProfileHelpers.js";

export function getDocumentFileType(name) {
  const lower = cleanText(name).toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".xlsx") || lower.endsWith(".csv")) return "XLS";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "DOC";
  return "FILE";
}
