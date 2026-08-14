export function getRequiredPopoverScroll({
  anchorBottom,
  popoverHeight,
  viewportHeight,
  gap = 6,
  viewportMargin = 12,
}) {
  return Math.max(
    0,
    anchorBottom + gap + popoverHeight + viewportMargin - viewportHeight,
  );
}
