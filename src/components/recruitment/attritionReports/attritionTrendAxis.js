export function shortTrendLabel(point) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(point?.weekStart || ""));
  if (!match) return `W${point?.weekNumber ?? ""}`;
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
    .format(new Date(`${point.weekStart}T12:00:00Z`));
  return `${month} ${match[3]}`;
}

export function getVisibleTrendLabelIndexes(count, pixelWidth) {
  if (count <= 0) return [];
  const maxLabels = Math.max(2, Math.floor(pixelWidth / 65));
  if (count <= maxLabels) return Array.from({ length: count }, (_, index) => index);
  const stride = Math.ceil((count - 1) / (maxLabels - 1));
  const indexes = [];
  for (let index = 0; index < count - 1; index += stride) indexes.push(index);
  indexes.push(count - 1);
  return indexes;
}
