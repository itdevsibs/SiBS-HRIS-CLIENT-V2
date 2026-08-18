function cleanText(value) {
  return String(value ?? "").trim();
}

function getPositionId(position = {}) {
  return cleanText(
    position.positionId ??
      position.position_id ??
      position.sourcePositionId ??
      position.source_position_id ??
      position.id,
  );
}

function getApprovalStatus(position = {}) {
  return cleanText(
    position.approvalStatus ??
      position.approval_status ??
      position.approval ??
      "",
  ).toLowerCase();
}

function getPositionStatus(position = {}) {
  return cleanText(position.status ?? position.positionStatus ?? "").toLowerCase();
}

export function buildPublicOpenPositionOptions(positions = []) {
  if (!Array.isArray(positions)) return [];

  return positions
    .filter((position) => {
      return (
        getPositionStatus(position) === "active" &&
        getApprovalStatus(position) === "approved"
      );
    })
    .map((position) => {
      const positionId = getPositionId(position);
      const positionTitle = cleanText(
        position.positionTitle ?? position.position_title ?? position.title,
      );
      const accountName = cleanText(
        position.accountName ?? position.account_name ?? position.accountGhlName,
      );
      const locationSite = cleanText(
        position.locationSite ?? position.location_site ?? position.location,
      );
      const details = [accountName, locationSite].filter(Boolean).join(" • ");

      return {
        ...position,
        positionId,
        positionTitle,
        accountName,
        locationSite,
        displayLabel: details ? `${positionTitle} — ${details}` : positionTitle,
      };
    })
    .filter((position) => position.positionId && position.positionTitle)
    .sort((first, second) =>
      first.displayLabel.localeCompare(second.displayLabel, undefined, {
        sensitivity: "base",
      }),
    );
}
