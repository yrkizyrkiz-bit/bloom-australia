/* Sanative service worker — Web Push for members and staff */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function toAbsoluteUrl(raw) {
  try {
    return new URL(raw || "/dashboard", self.location.origin).href;
  } catch {
    return new URL("/dashboard", self.location.origin).href;
  }
}

self.addEventListener("push", (event) => {
  let data = {
    title: "Sanative",
    body: "You have a new notification",
    url: "/dashboard",
    tag: "sanative",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    try {
      const text = event.data?.text();
      if (text) data.body = text;
    } catch {
      // keep defaults
    }
  }

  const url = toAbsoluteUrl(data.url);

  event.waitUntil(
    self.registration.showNotification(data.title || "Sanative", {
      body: data.body || "",
      icon: "/icons/sanative-192.png",
      badge: "/icons/sanative-192.png",
      tag: data.tag || "sanative",
      data: { url },
      requireInteraction: Boolean(data.requireInteraction),
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = toAbsoluteUrl(event.notification.data?.url || "/dashboard");

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (!client.url.startsWith(self.location.origin)) continue;
        if (!("focus" in client)) continue;

        try {
          client.postMessage({ type: "SANATIVE_NOTIFICATION_OPEN", url });
        } catch {
          // ignore
        }

        if ("navigate" in client) {
          try {
            await client.navigate(url);
          } catch {
            // Some browsers reject navigate; focus + client-side handler still help.
          }
        }

        return client.focus();
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })()
  );
});
