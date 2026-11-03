// PropPage service worker. Small on purpose: it only makes the app open
// without a network (an "you're offline" page instead of the browser's error)
// and keeps the icons handy. Pages and data always come fresh from the server,
// so agents never see stale listings or someone else's dashboard.
const CACHE = "proppage-v2";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192x192.png", "/icons/icon-512x512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Page loads: network first, the offline page if there is no network.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  // App icons: cache first.
  const url = new URL(req.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});

// "New enquiry" alerts. The server sends data-only messages through Firebase
// Cloud Messaging ({ data: { title, body, link } }), and this shows them.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    const payload = event.data ? event.data.json() : {};
    data = payload.data || payload;
  } catch (e) {
    // Not JSON: show a plain alert below.
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "PropPage", {
      body: data.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { link: data.link || "/dashboard/enquiries" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.link) || "/dashboard/enquiries", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) if (w.url === url && "focus" in w) return w.focus();
      return self.clients.openWindow(url);
    })
  );
});
