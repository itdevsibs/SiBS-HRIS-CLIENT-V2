export function getApplicantLeadUserDisplayName(user) {
  const explicitName = [
    user?.firstName || user?.first_name,
    user?.middleName || user?.middle_name,
    user?.lastName || user?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (explicitName) return explicitName;

  const email = user?.email || user?.userEmail || "";

  if (email.includes("@")) {
    return email
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return "Active HR User";
}

export function filterApplicantLeads({
  leads = [],
  searchTerm = "",
  statusFilter = "All",
  sourceFilter = "All",
  siteFilter = "All",
  departmentFilter = "All",
}) {
  const keyword = searchTerm.trim().toLowerCase();

  return leads.filter((lead) => {
    const matchesSearch =
      !keyword ||
      [
        lead.id,
        lead.fullName,
        lead.cpNum,
        lead.email,
        lead.department,
        lead.specificAccount,
        lead.source,
        lead.preferredSite,
        lead.inputtedBy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    return (
      matchesSearch &&
      (statusFilter === "All" || lead.status === statusFilter) &&
      (sourceFilter === "All" || lead.source === sourceFilter) &&
      (siteFilter === "All" || lead.preferredSite === siteFilter) &&
      (departmentFilter === "All" || lead.department === departmentFilter)
    );
  });
}

export function getApplicantLeadMetrics(leads = []) {
  const total = leads.length;
  const newCount = leads.filter((lead) => lead.status === "New Lead").length;
  const linkSentCount = leads.filter(
    (lead) => lead.status === "Application Link Sent",
  ).length;
  const convertedCount = leads.filter(
    (lead) => lead.status === "Converted to Applicant",
  ).length;
  const conversionRate = total
    ? `${((convertedCount / total) * 100).toFixed(1)}%`
    : "0.0%";

  return {
    total,
    newCount,
    linkSentCount,
    convertedCount,
    conversionRate,
  };
}

export function buildApplicantLeadId(count = 0) {
  return `LEAD-2026-${String(count + 101).padStart(3, "0")}`;
}
