export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentWeekLabel() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.ceil(diff / oneWeek);

  return `Week ${weekNumber}, ${now.getFullYear()}`;
}

export function getCurrentWeekDateRange() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })} - ${sunday.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function generateReportId() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNumber = Math.ceil(diff / oneWeek);

  return `WR-${now.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

export function normalizeText(value) {
  return String(value || "").trim();
}

export function getCandidateStatus(record) {
  return normalizeText(
    record?.status ||
      record?.pipelineStatus ||
      record?.currentStage ||
      record?.stage ||
      record?.finalStatus ||
      "",
  );
}

export function getRoleFromRecord(record) {
  return normalizeText(
    record?.roleTitle ||
      record?.positionTitle ||
      record?.openPosition ||
      record?.roleCapability ||
      record?.appliedRole ||
      record?.jobDescriptionTitle ||
      record?.job_description_title ||
      "Not assigned",
  );
}

export function getAccountFromRecord(record) {
  return normalizeText(
    record?.account ||
      record?.appliedAccount ||
      record?.departmentAccount ||
      record?.department_account ||
      record?.accountName ||
      record?.roleAccount ||
      "Not assigned",
  );
}

export function getOwnerFromRecord(record) {
  return normalizeText(
    record?.owner ||
      record?.taOwner ||
      record?.assignedTo ||
      record?.preparedBy ||
      record?.createdBy ||
      "Unassigned",
  );
}

export function getStatusClass(status) {
  switch (status) {
    case "Generated":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Sent":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Archived":
      return "border-gray-200 bg-gray-50 text-gray-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function getRoleStatusClass(status) {
  switch (status) {
    case "On Track":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "At Risk":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Delayed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function getPriorityStatus(required, filled) {
  const req = Number(required || 0);
  const done = Number(filled || 0);

  if (req <= 0) return "On Track";

  const percentage = Math.round((done / req) * 100);

  if (percentage >= 100) return "On Track";
  if (percentage >= 70) return "At Risk";
  return "Delayed";
}
