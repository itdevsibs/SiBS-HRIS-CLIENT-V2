const text = (value) => String(value ?? "").trim();
const sameId = (left, right) => Boolean(text(left) && text(right) && text(left) === text(right));

export function buildOnboardingRoster(records = [], journeys = [], coachingActions = []) {
  const matched = new Set();
  const makeRow = (record, journey) => {
    const handoff = journey?.day30Handoff || journey?.day30?.handoff;
    return {
      key: record ? `onboarding-${record.id}` : `journey-${journey.id}`,
      record,
      journey,
      name: record?.candidateName || journey?.fullName || "Unnamed candidate",
      email: record?.candidateEmail || journey?.email || "",
      employeeId: journey?.sibsEmployeeId || record?.convertedEmployeeId || "",
      role: record?.roleTitle || journey?.roleTitle || "—",
      account: record?.account || journey?.account || "",
      site: record?.location || journey?.siteLocation || "",
      trainer: journey?.trainerName || "",
      owner: record?.owner || journey?.tl || "",
      outcome: record?.finalOutcome || "",
      stage: record?.onboardingStage || record?.onboarding_stage || record?.showStatus || "",
      reviewsDue: journey ? [30, 60, 90].filter((day) => journey.daysElapsed >= day && !journey.reviews?.[day]?.hr).length : 0,
      openCoaching: journey ? coachingActions.filter((action) => (sameId(action.emp, journey.id) || sameId(action.emp, journey.sibsEmployeeId)) && action.status !== "Done").length : 0,
      handoffDue: Boolean(journey && journey.daysElapsed >= 14 && handoff?.status !== "Accepted"),
    };
  };
  const rows = records.map((record) => {
    const employeeId = record.convertedEmployeeId || record.converted_employee_id || record.sibsEmployeeId;
    const email = text(record.candidateEmail).toLowerCase();
    const matches = journeys.filter((item) => employeeId
      ? sameId(employeeId, item.sibsEmployeeId) || sameId(employeeId, item.id)
      : Boolean(email && email === text(item.email).toLowerCase()));
    const journey = matches.length === 1 ? matches[0] : undefined;
    if (journey) matched.add(journey.id);
    return makeRow(record, journey);
  });
  return [...rows, ...journeys.filter((journey) => !matched.has(journey.id)).map((journey) => makeRow(undefined, journey))];
}

export function filterOnboardingRoster(rows, filters = {}) {
  const query = text(filters.search).toLowerCase();
  return rows.filter((row) =>
    (!query || [row.name, row.email, row.employeeId, row.record?.onboardingId, row.record?.id, row.journey?.id, row.role, row.account, row.site, row.trainer, row.owner].some((value) => text(value).toLowerCase().includes(query))) &&
    (!filters.outcome || row.outcome === filters.outcome) &&
    (!filters.stage || row.stage === filters.stage) &&
    (!filters.phase || row.journey?.stage === filters.phase) &&
    (!filters.account || row.account === filters.account) &&
    (!filters.site || row.site === filters.site) &&
    (!filters.trainer || row.trainer === filters.trainer) &&
    (filters.action !== "handoff" || row.handoffDue) &&
    (filters.action !== "reviews" || row.reviewsDue > 0) &&
    (filters.action !== "coaching" || row.openCoaching > 0) &&
    (filters.action !== "hires" || row.outcome === "True Hire") &&
    (filters.action !== "dropoffs" || ["No Show", "Pre-start Withdrawal"].includes(row.outcome))
  );
}
