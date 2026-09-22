const CHAT_NOTIFICATION_SW_URL =
  `${import.meta.env.BASE_URL}sibs-chat-notifications-sw.js`;

function isLikelyMobileDevice() {
  if (typeof navigator === "undefined") return false;

  if (navigator.userAgentData?.mobile === true) return true;

  const userAgent = String(navigator.userAgent || "");
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return true;

  // iPadOS can identify itself as Macintosh while using touch input.
  return /Macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints || 0) > 1;
}

async function getChatNotificationRegistration() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !isLikelyMobileDevice()
  ) {
    return null;
  }

  const registration = await navigator.serviceWorker.register(
    CHAT_NOTIFICATION_SW_URL,
  );

  await navigator.serviceWorker.ready;
  return registration;
}

export async function ensureSibsChatSystemNotifications() {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    !isLikelyMobileDevice()
  ) {
    return false;
  }

  try {
    const registration = await getChatNotificationRegistration();
    if (!registration) return false;

    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch {
    return false;
  }
}

export async function showSibsChatSystemNotification({
  title = "SiBS Chat",
  body = "New message",
  conversationId = null,
  messageId = null,
} = {}) {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    Notification.permission !== "granted" ||
    !isLikelyMobileDevice()
  ) {
    return false;
  }

  try {
    const registration = await getChatNotificationRegistration();
    if (!registration) return false;

    const id = Number(conversationId || 0) || null;
    const msgId = Number(messageId || 0) || null;

    await registration.showNotification(title, {
      body: String(body || "New message").slice(0, 220),
      icon: `${import.meta.env.BASE_URL}SiBSLogoNavy.png`,
      badge: `${import.meta.env.BASE_URL}favicon.svg`,
      tag: `sibs-chat-${id || "conversation"}-${msgId || Date.now()}`,
      renotify: true,
      silent: true,
      data: {
        type: "SIBS_CHAT_OPEN_CONVERSATION",
        conversationId: id,
        messageId: msgId,
        openUrl: window.location.href,
      },
    });

    return true;
  } catch {
    return false;
  }
}
