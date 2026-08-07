function cleanTrainingText(value) {
  return String(value ?? "").trim();
}

function splitLegacyTrainingText(value) {
  return cleanTrainingText(value)
    .split(/[\n;|]+/)
    .map(cleanTrainingText)
    .filter(Boolean);
}

export function normalizeTrainingEntries(value) {
  let entries = value;

  if (typeof value === "string") {
    const cleanValue = cleanTrainingText(value);

    if (!cleanValue) return [];

    try {
      const parsed = JSON.parse(cleanValue);
      entries = Array.isArray(parsed) ? parsed : splitLegacyTrainingText(value);
    } catch {
      entries = splitLegacyTrainingText(value);
    }
  }

  if (!Array.isArray(entries)) {
    entries = entries === undefined || entries === null ? [] : [entries];
  }

  return entries.map(cleanTrainingText).filter(Boolean).map((item) => item.toUpperCase());
}

export function serializeTrainingEntries(value) {
  return JSON.stringify(normalizeTrainingEntries(value));
}

export function ensureTrainingEntryRows(value) {
  const entries = normalizeTrainingEntries(value);
  return entries.length ? entries : [""];
}
