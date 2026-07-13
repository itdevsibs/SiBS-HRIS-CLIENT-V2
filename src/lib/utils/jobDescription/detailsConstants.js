export const JD_PREVIEW_PAGE_WIDTH = 1100;
export const JD_PREVIEW_MIN_SCALE = 0.7;
export const JD_COMPACT_VIEW_BREAKPOINT = 820;
export function calculateJdPreviewScale(containerWidth = 0) {
  const safeWidth = Number(containerWidth || 0);

  if (!safeWidth) return 1;

  const horizontalAllowance =
    safeWidth <= 390
      ? 8
      : safeWidth <= 640
        ? 12
        : safeWidth <= 1024
          ? 20
          : 32;

  return Math.min(
    1,
    Math.max(
      JD_PREVIEW_MIN_SCALE,
      (safeWidth - horizontalAllowance) /
        JD_PREVIEW_PAGE_WIDTH,
    ),
  );
}
