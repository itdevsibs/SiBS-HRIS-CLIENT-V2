export function getExpandedChatBounds({
  workspace,
  top,
  viewportHeight,
  maxWidth = 1700,
  gutter = 16,
  bottomGutter = 16,
}) {
  const availableWidth = Math.max(0, workspace.width - gutter * 2);
  const width = Math.min(maxWidth, availableWidth);

  return {
    left: workspace.left + (workspace.width - width) / 2,
    top,
    width,
    height: Math.max(0, viewportHeight - top - bottomGutter),
  };
}

export function getChatLayoutFlip(from, to) {
  return {
    translateX: from.left - to.left,
    translateY: from.top - to.top,
    scaleX: to.width > 0 ? from.width / to.width : 1,
    scaleY: to.height > 0 ? from.height / to.height : 1,
  };
}
