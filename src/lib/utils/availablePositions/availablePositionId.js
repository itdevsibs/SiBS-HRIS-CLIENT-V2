function cleanText(value) {
  return String(value ?? "").trim();
}

function getTrailingNumber(value) {
  const match = cleanText(value).match(/(\d+)\s*$/);

  return match ? match[1] : "";
}

function getSourcePositionId(position = {}) {
  return cleanText(
    position.sourcePositionId ||
      position.source_position_id ||
      position.positionId ||
      position.position_id,
  );
}

function getRecordPriority(position = {}) {
  const sourcePositionId = getSourcePositionId(position);

  if (/^POS[-_\s]?\d+$/i.test(sourcePositionId)) {
    return 0;
  }

  if (/^HN[-_\s]?\d+$/i.test(sourcePositionId)) {
    return 2;
  }

  return 1;
}

function getCanonicalPositionKey(position = {}) {
  const positionId = cleanText(position.positionId);

  if (!positionId || positionId === "—") {
    return "";
  }

  return positionId.toLowerCase();
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
  if (!Array.isArray(positions)) {
    return [];
  }

  const uniquePositions = [];
  const indexByPositionId = new Map();

  positions
    .filter(Boolean)
    .map(normalizeAvailablePositionRecord)
    .forEach((position) => {
      const key = getCanonicalPositionKey(position);

      if (!key) {
        uniquePositions.push(position);
        return;
      }

      const existingIndex = indexByPositionId.get(key);

      if (existingIndex === undefined) {
        indexByPositionId.set(key, uniquePositions.length);
        uniquePositions.push(position);
        return;
      }

      const existingPosition = uniquePositions[existingIndex];

      if (
        getRecordPriority(position) <
        getRecordPriority(existingPosition)
      ) {
        uniquePositions[existingIndex] = position;
      }
    });

  return uniquePositions;
}
