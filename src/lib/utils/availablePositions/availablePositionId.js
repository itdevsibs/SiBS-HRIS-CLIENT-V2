function cleanText(value) {
  return String(value ?? "").trim();
}

function getTrailingNumber(value) {
  const match = cleanText(value).match(/(\d+)\s*$/);

  return match ? match[1] : "";
}

export function formatAvailablePositionId(
  positionId,
  fallbackRecordId = "",
) {
  const rawPositionId = cleanText(positionId);

  const sequenceNumber =
    getTrailingNumber(rawPositionId) ||
    getTrailingNumber(fallbackRecordId);

  if (!sequenceNumber) {
    return rawPositionId || "—";
  }

  const normalizedNumber = String(
    Number(sequenceNumber),
  ).padStart(3, "0");

  return `POS-${normalizedNumber}`;
}

export function normalizeAvailablePositionRecord(
  position = {},
) {
  const rawPositionId = cleanText(
    position.positionId ||
      position.position_id ||
      "",
  );

  return {
    ...position,
    sourcePositionId:
      position.sourcePositionId ||
      position.source_position_id ||
      rawPositionId,
    positionId: formatAvailablePositionId(
      rawPositionId,
      position.id,
    ),
  };
}

export function normalizeAvailablePositionRecords(
  positions = [],
) {
  return Array.isArray(positions)
    ? positions
        .filter(Boolean)
        .map(normalizeAvailablePositionRecord)
    : [];
}
