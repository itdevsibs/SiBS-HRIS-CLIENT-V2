export function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function getDateAfterDays(days = 3) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function generateActionId(nextNumber) {
  return `ACT-${String(nextNumber).padStart(3, "0")}`;
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

export function getStatusClass(status) {
  switch (status) {
    case "Completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Ongoing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Planned":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function getRiskClass(risk) {
  switch (risk) {
    case "High":
      return "border-red-200 bg-red-50 text-red-700";
    case "Medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function getGapClass(gap) {
  switch (gap) {
    case "Pipeline":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Screening":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "Interview":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "Offer":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "JD":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Approval":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Capacity / Manpower":
      return "border-red-200 bg-red-50 text-red-700";
    case "Onboarding":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Reporting":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function getModuleClass(moduleName) {
  switch (moduleName) {
    case "Public Talent Pool":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "Talent Pool":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Hiring Needs":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "Job Description":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "Candidate Pipeline":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "Offers":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Onboarding":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Workforce Hiring Plan":
      return "border-red-200 bg-red-50 text-red-700";
    case "Reports":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function getDaysLeftValue(deadline) {
  if (!deadline) return 999;

  const today = new Date();
  const due = new Date(deadline);

  if (Number.isNaN(due.getTime())) return 999;

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDaysLeft(deadline) {
  const days = getDaysLeftValue(deadline);

  if (days === 999) return "—";
  if (days < 0) return `${Math.abs(days)} day/s overdue`;
  if (days === 0) return "Due today";
  return `${days} day/s left`;
}

export function getCompletionPercent(filled, requirement) {
  const total = Number(requirement || 0);
  const value = Number(filled || 0);

  if (total <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

export function sortActionItems(items = []) {
  const riskRank = { High: 1, Medium: 2, Low: 3 };
  const statusRank = { Planned: 1, Ongoing: 2, Completed: 3 };

  return [...items].sort((a, b) => {
    if (a.status === "Completed" && b.status !== "Completed") return 1;
    if (a.status !== "Completed" && b.status === "Completed") return -1;

    const riskDiff =
      (riskRank[a.riskLevel] || 9) - (riskRank[b.riskLevel] || 9);

    if (riskDiff !== 0) return riskDiff;

    const dayDiff = getDaysLeftValue(a.deadline) - getDaysLeftValue(b.deadline);
    if (dayDiff !== 0) return dayDiff;

    return (statusRank[a.status] || 9) - (statusRank[b.status] || 9);
  });
}

export function getActionItemsStats(items = []) {
  const total = items.length;
  const planned = items.filter((item) => item.status === "Planned").length;
  const ongoing = items.filter((item) => item.status === "Ongoing").length;
  const completed = items.filter((item) => item.status === "Completed").length;
  const highRisk = items.filter((item) => item.riskLevel === "High").length;
  const suggested = items.filter((item) => item.systemGenerated).length;
  const overdue = items.filter(
    (item) => item.status !== "Completed" && getDaysLeftValue(item.deadline) < 0,
  ).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    planned,
    ongoing,
    completed,
    highRisk,
    suggested,
    overdue,
    completionRate,
    active: total - completed,
  };
}

export function getTopRisks(items = [], limit = 4) {
  return sortActionItems(items.filter((item) => item.status !== "Completed")).slice(
    0,
    limit,
  );
}
