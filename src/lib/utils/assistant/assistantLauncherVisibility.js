export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function isAssistantLauncherVisible({
  enabled = true,
  userLoading = false,
  user = null,
  isAiOpen = false,
  isChatOpen = false,
  chatSurfaceOpen = false,
  isChatWindowOpen = false,
}) {
  const effectiveChatOpen = Boolean(
    isChatOpen || chatSurfaceOpen || isChatWindowOpen,
  );
  const isDrawerOpen = Boolean(isAiOpen || effectiveChatOpen);

  return Boolean(enabled && !userLoading && user && !isDrawerOpen);
}
