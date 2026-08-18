function cleanText(value) {
  return String(value ?? '').trim();
}

export function buildApprovedOpenPositionOptions(positions = []) {
  if (!Array.isArray(positions)) return [];

  return positions
    .filter((position) => cleanText(position?.positionTitle || position?.position_title))
    .sort((firstPosition, secondPosition) => {
      const firstLabel = [
        firstPosition.positionTitle || firstPosition.position_title,
        firstPosition.accountName || firstPosition.account_name || firstPosition.accountGhlName,
        firstPosition.locationSite || firstPosition.location_site,
        firstPosition.positionId || firstPosition.position_id,
      ]
        .filter(Boolean)
        .join(' ');

      const secondLabel = [
        secondPosition.positionTitle || secondPosition.position_title,
        secondPosition.accountName || secondPosition.account_name || secondPosition.accountGhlName,
        secondPosition.locationSite || secondPosition.location_site,
        secondPosition.positionId || secondPosition.position_id,
      ]
        .filter(Boolean)
        .join(' ');

      return firstLabel.localeCompare(secondLabel, undefined, {
        sensitivity: 'base',
      });
    });
}
