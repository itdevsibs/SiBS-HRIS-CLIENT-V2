import {
  deleteChatPushSubscription,
  getChatPushConfig,
  saveChatPushSubscription,
} from "@/lib/axios/sibsChat";

const CHAT_NOTIFICATION_SW_URL =
  `${import.meta.env.BASE_URL}sibs-chat-notifications-sw.js`;

function isLikelyMobileDevice() {
  if (typeof navigator === "undefined") return false;

  if (navigator.userAgentData?.mobile === true) return true;

  const userAgent = String(navigator.userAgent || "");
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return true;

  return /Macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints || 0) > 1;
}

function urlBase64ToUint8Array(value = "") {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = `${value}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(normalized);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function arrayBuffersEqual(first, second) {
  if (!first || !second) return false;

  const a = new Uint8Array(first);
  const b = new Uint8Array(second);
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }

  return true;
}

async function getChatNotificationRegistration() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !window.isSecureContext
  ) {
    return null;
  }

  const registration = await navigator.serviceWorker.register(
    CHAT_NOTIFICATION_SW_URL,
  );

  await navigator.serviceWorker.ready;
  return registration;
}

async function ensurePushSubscription(registration) {
  if (!registration?.pushManager) return null;

  const config = await getChatPushConfig();
  const publicKey = String(config?.publicKey || "").trim();
  if (!config?.enabled || !publicKey) return null;

  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  let subscription = await registration.pushManager.getSubscription();

  if (
    subscription &&
    subscription.options?.applicationServerKey &&
    !arrayBuffersEqual(
      subscription.options.applicationServerKey,
      applicationServerKey,
    )
  ) {
    const oldEndpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => false);
    await deleteChatPushSubscription(oldEndpoint).catch(() => null);
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  await saveChatPushSubscription(subscription.toJSON());
  return subscription;
}

export async function ensureSibsChatSystemNotifications() {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    !("PushManager" in window) ||
    !isLikelyMobileDevice() ||
    !window.isSecureContext
  ) {
    return false;
  }

  try {
    const registration = await getChatNotificationRegistration();
    if (!registration) return false;

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") return false;

    const subscription = await ensurePushSubscription(registration);
    return Boolean(subscription);
  } catch (error) {
    console.warn(
      "Unable to enable SiBS Chat mobile notifications:",
      error?.message || error,
    );
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
    !isLikelyMobileDevice() ||
    !window.isSecureContext
  ) {
    return false;
  }

  try {
    const registration = await getChatNotificationRegistration();
    if (!registration) return false;

    const id = Number(conversationId || 0) || null;
    const msgId = Number(messageId || 0) || null;

    await registration.showNotification(
      String(title || "SiBS Chat").slice(0, 120),
      {
        body: String(body || "New message").slice(0, 220),
        icon: `${import.meta.env.BASE_URL}SiBSLogoNavy.png`,
        badge: `${import.meta.env.BASE_URL}favicon.svg`,
        tag: `sibs-chat-${id || "conversation"}-${msgId || Date.now()}`,
        renotify: false,
        data: {
          type: "SIBS_CHAT_OPEN_CONVERSATION",
          conversationId: id,
          messageId: msgId,
        },
      },
    );

    return true;
  } catch (error) {
    console.warn(
      "Unable to display SiBS Chat system notification:",
      error?.message || error,
    );
    return false;
  }
}

