// QuackWash Service Worker
// Handles push notifications for "Watch this Duck" and "Empty Pond" alerts

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// Listen for messages from the main thread to show notifications
self.addEventListener("message", (event) => {
    const { type, title, body, tag } = event.data || {};

    if (type === "SHOW_NOTIFICATION") {
        self.registration.showNotification(title || "QuackWash 🦆", {
            body: body || "Your laundry needs attention!",
            icon: "/duck-icon.png",
            badge: "/duck-icon.png",
            tag: tag || "quackwash",
            vibrate: [200, 100, 200],
            requireInteraction: true,
            data: { url: "/" },
        });
    }
});

// Handle notification click — focus or open the app
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if found
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return self.clients.openWindow("/");
        })
    );
});
