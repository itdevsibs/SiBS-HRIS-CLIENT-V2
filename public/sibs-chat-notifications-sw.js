self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data?.json?.() || {};
  } catch {
    payload = {
      title: "SiBS Chat",
      body: event.data?.text?.() || "New message",
    };
  }

  const conversationId = Number(payload?.conversationId || 0) || null;
  const messageId = Number(payload?.messageId || 0) || null;
  const scopeUrl = new URL(self.registration.scope);
  const iconUrl = new URL("SiBSLogoNavy.png", scopeUrl).href;
  const badgeUrl = new URL("favicon.svg", scopeUrl).href;

  event.waitUntil(
    self.registration.showNotification(payload?.title || "SiBS Chat", {
      body: String(payload?.body || "New message").slice(0, 220),
      icon: iconUrl,
      badge: badgeUrl,
      tag: `sibs-chat-${conversationId || "conversation"}-${messageId || Date.now()}`,
      renotify: false,
      data: {
        type: "SIBS_CHAT_OPEN_CONVERSATION",
        conversationId,
        messageId,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification?.data || {};
  const conversationId = Number(data.conversationId || 0) || null;

  event.waitUntil(
    (async () => {
      const openClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const sameOriginClients = openClients.filter((client) => {
        try {
          return new URL(client.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      if (sameOriginClients.length) {
        const target =
          sameOriginClients.find((client) => client.visibilityState === "visible") ||
          sameOriginClients[0];

        await target.focus();

        target.postMessage({
          type: "SIBS_CHAT_OPEN_CONVERSATION",
          conversationId,
        });

        return;
      }

      const openUrl = new URL(self.registration.scope);
      openUrl.searchParams.set("sibsChat", "1");

      if (conversationId) {
        openUrl.searchParams.set("conversationId", String(conversationId));
      }

      await self.clients.openWindow(openUrl.toString());
    })(),
  );
});
