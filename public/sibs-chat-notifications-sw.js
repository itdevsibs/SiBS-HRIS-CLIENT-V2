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

      const fallbackUrl = new URL(
        data.openUrl || self.registration.scope,
        self.registration.scope,
      );

      fallbackUrl.searchParams.set("sibsChat", "1");
      if (conversationId) {
        fallbackUrl.searchParams.set("conversationId", String(conversationId));
      }

      await self.clients.openWindow(fallbackUrl.toString());
    })(),
  );
});
