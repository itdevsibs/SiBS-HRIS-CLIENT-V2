/**
 * Backwards-compatible entry point. All HRIS screens use the same global
 * Manila date/time formatter; do not create page-specific Intl formatters here.
 */
export {
  getTodayDate,
  formatDate,
  formatDateTime,
  formatDateTime as default,
} from "../../lib/axios/dateFormatter.js";
