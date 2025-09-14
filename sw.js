// sw.js - 简单资产缓存（用于 PWA 离线体验）
const CACHE_NAME = 'dapp-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // 尝试优先缓存
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
