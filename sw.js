/* sw.js - lets Focus List open offline after the first visit */
const CACHE = "focuslist-v1";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./icon.svg",
  "./manifest.webmanifest",
  "./js/utils.js",
  "./js/store.js",
  "./js/reminders.js",
  "./js/tasks.js",
  "./js/notes.js",
  "./js/projects.js",
  "./js/settings.js",
  "./js/salah.js",
  "./js/main.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
