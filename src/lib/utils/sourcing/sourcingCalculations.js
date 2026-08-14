export function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

export function isScreenedCandidate(candidate) {
  const status = normalizeStatus(candidate?.status);

  return [
    "screened",
    "initial screening",
    "for interview",
    "interview scheduled",
    "interviewed",
    "online assessment",
    "assessment taken",
    "offered",
    "accepted",
    "hired",
  ].includes(status);
}

export function isInterviewedCandidate(candidate) {
  const status = normalizeStatus(candidate?.status);

  return [
    "interviewed",
    "online assessment",
    "assessment taken",
    "offered",
    "accepted",
    "hired",
  ].includes(status);
}

export function isOfferedCandidate(candidate) {
  const status = normalizeStatus(candidate?.status);

  return ["offered", "accepted", "hired"].includes(status);
}

export function isHiredCandidate(candidate) {
  const status = normalizeStatus(candidate?.status);

  return ["hired", "accepted"].includes(status);
}

export function calculateConversionRate(hired, volume) {
  const safeHired = Number(hired || 0);
  const safeVolume = Number(volume || 0);

  if (safeVolume <= 0) return 0;

  return Number(((safeHired / safeVolume) * 100).toFixed(1));
}

export function calculateCostPerHire(sourceCost, hired) {
  const safeCost = Number(sourceCost || 0);
  const safeHired = Number(hired || 0);

  if (safeCost <= 0 || safeHired <= 0) return 0;

  return Number((safeCost / safeHired).toFixed(2));
}

export function buildSourceRows(
  publicSubmissions = [],
  costEntries = [],
) {
  const safeSubmissions = Array.isArray(publicSubmissions)
    ? publicSubmissions
    : [];

  const safeCostEntries = Array.isArray(costEntries) ? costEntries : [];

  const activeChannelNames = [
    ...new Set(
      safeCostEntries
        .map((entry) => String(entry?.source || "").trim())
        .filter(Boolean),
    ),
  ];

  return activeChannelNames.map((sourceName, index) => {
    const matchedCandidates = safeSubmissions.filter((candidate) => {
      const candidateSources = Array.isArray(candidate?.hearAboutUs)
        ? candidate.hearAboutUs
        : [];

      return candidateSources.includes(sourceName);
    });

    const matchedCostEntries = safeCostEntries.filter((entry) => {
      return entry?.source === sourceName;
    });

    const volume = matchedCandidates.length;
    const screened = matchedCandidates.filter(isScreenedCandidate).length;
    const interviewed = matchedCandidates.filter(isInterviewedCandidate).length;
    const offered = matchedCandidates.filter(isOfferedCandidate).length;
    const hired = matchedCandidates.filter(isHiredCandidate).length;

    const sourceCost = matchedCostEntries.reduce((sum, entry) => {
      return sum + Number(entry?.amount || 0);
    }, 0);

    const latestCandidate = matchedCandidates[0];

    return {
      id: `${sourceName}-${index}`,
      source: sourceName,
      sourceCost,
      costEntries: matchedCostEntries,
      volume,
      screened,
      interviewed,
      offered,
      hired,
      conversionRate: calculateConversionRate(hired, volume),
      costPerHire: calculateCostPerHire(sourceCost, hired),
      latestCandidate:
        latestCandidate?.name ||
        latestCandidate?.candidateName ||
        latestCandidate?.email ||
        "",
      lastActivity: latestCandidate?.submittedAt || "",
    };
  });
}

export function buildSourcingTotals(sourceRows = [], costEntries = []) {
  const safeRows = Array.isArray(sourceRows) ? sourceRows : [];
  const safeCostEntries = Array.isArray(costEntries) ? costEntries : [];

  const activeSourceRows = safeRows.filter((source) => {
    return Number(source?.volume || 0) > 0;
  });

  const totalVolume = safeRows.reduce((sum, source) => {
    return sum + Number(source?.volume || 0);
  }, 0);

  const totalHired = safeRows.reduce((sum, source) => {
    return sum + Number(source?.hired || 0);
  }, 0);

  const totalSourceCost = safeRows.reduce((sum, source) => {
    return sum + Number(source?.sourceCost || 0);
  }, 0);

  const overallCostPerHire =
    totalHired > 0 ? Number((totalSourceCost / totalHired).toFixed(2)) : 0;

  const averageConversion =
    totalVolume > 0 ? Number(((totalHired / totalVolume) * 100).toFixed(1)) : 0;

  return {
    totalSources: safeRows.length,
    activeSources: activeSourceRows.length,
    totalVolume,
    totalHired,
    totalSourceCost,
    totalCostEntries: safeCostEntries.length,
    overallCostPerHire,
    averageConversion,
  };
}
