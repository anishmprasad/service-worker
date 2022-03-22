/* eslint-disable no-restricted-globals */
// https://web.dev/offline-fallback-page/

const SCOPE = 'module'
const CACHE_STATIC_NAME = 'static-v2-%BUILDVERSION%';
const CACHE_DYNAMIC_NAME = 'dynamic-v2-%BUILDVERSION%';

const whiteList = ['/page1', '/page2'];

// The URL constructor is available in all browsers that support SW.
self.addEventListener('install', function (event) {
	console.log('[Service Worker] Installing Service Worker ...', event);
	event.waitUntil(
		caches.open(CACHE_STATIC_NAME).then(function (cache) {
			console.log('[Service Worker] Precaching App Shell');
			cache.addAll(whiteList);
		})
	);
});

self.addEventListener('activate', function (event) {
	console.log('[Service Worker] Activating Service Worker ....', event);
	event.waitUntil(
		caches.keys().then(function (keyList) {
			return Promise.all(
				keyList.map(function (key) {
					if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
						console.log('[Service Worker] Removing old cache.', key);
						return caches.delete(key);
					}
				})
			);
		})
	);
	return self.clients.claim();
});

self.addEventListener('fetch', function (event) {
	if (event.request.url.indexOf('/page1') === -1) {
		return false;
	}
	// console.log('[Service Worker] cached => ', event.request.url)
	event.respondWith(
		caches.match(event.request).then(function (response) {
			if (response) {
				return response;
			} else {
				return fetch(event.request)
					.then(function (res) {
						return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
							cache.put(event.request.url, res.clone());
							return res;
						});
					})
					.catch(function (err) {
						console.log('[Service Worker] Error Occured.', err);
					});
			}
		})
	);
});
