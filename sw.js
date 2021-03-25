const cacheName = "cache27";
const cacheFiles = [
	"/",
	"common.js",
	"disclaimer.html",
	"index.html",
	"manifest.json",
	"privacy-policy.html",
	"terms-and-conditions.html",
	"logo_nav.svg",
	"style.css",
	"main.js",
	"background.jpg",
	"google_auth.js",
	"fonts/raleway/raleway-700.eot",
	"fonts/raleway/raleway-700.svg",
	"fonts/raleway/raleway-700.ttf",
	"fonts/raleway/raleway-700.woff",
	"fonts/raleway/raleway-700.woff2",
	"fonts/raleway/raleway-regular.eot",
	"fonts/raleway/raleway-regular.svg",
	"fonts/raleway/raleway-regular.ttf",
	"fonts/raleway/raleway-regular.woff",
	"fonts/raleway/raleway-regular.woff2",
	"fonts/open-sans/open-sans-700.eot",
	"fonts/open-sans/open-sans-700.svg",
	"fonts/open-sans/open-sans-700.ttf",
	"fonts/open-sans/open-sans-700.woff",
	"fonts/open-sans/open-sans-700.woff2",
	"fonts/open-sans/open-sans-regular.eot",
	"fonts/open-sans/open-sans-regular.svg",
	"fonts/open-sans/open-sans-regular.ttf",
	"fonts/open-sans/open-sans-regular.woff",
	"fonts/open-sans/open-sans-regular.woff2",
	"fonts/fontawesome/css/brands.min.css",
	"fonts/fontawesome/css/fontawesome.min.css",
	"fonts/fontawesome/css/solid.min.css",
	"fonts/fontawesome/webfonts/fa-brands-400.eot",
	"fonts/fontawesome/webfonts/fa-brands-400.svg",
	"fonts/fontawesome/webfonts/fa-brands-400.ttf",
	"fonts/fontawesome/webfonts/fa-brands-400.woff",
	"fonts/fontawesome/webfonts/fa-brands-400.woff2",
	"fonts/fontawesome/webfonts/fa-solid-900.eot",
	"fonts/fontawesome/webfonts/fa-solid-900.svg",
	"fonts/fontawesome/webfonts/fa-solid-900.ttf",
	"fonts/fontawesome/webfonts/fa-solid-900.woff",
	"fonts/fontawesome/webfonts/fa-solid-900.woff2",
	"android-chrome-36x36.png", // Favicon, Android Chrome M39+ with 0.75 screen density
	"android-chrome-48x48.png", // Favicon, Android Chrome M39+ with 1.0 screen density
	"android-chrome-72x72.png", // Favicon, Android Chrome M39+ with 1.5 screen density
	"android-chrome-96x96.png", // Favicon, Android Chrome M39+ with 2.0 screen density
	"android-chrome-144x144.png", // Favicon, Android Chrome M39+ with 3.0 screen density
	"android-chrome-192x192.png", // Favicon, Android Chrome M39+ with 4.0 screen density
	"android-chrome-256x256.png", // Favicon, Android Chrome M47+ Splash screen with 1.5 screen density
	"android-chrome-384x384.png", // Favicon, Android Chrome M47+ Splash screen with 3.0 screen density
	"android-chrome-512x512.png", // Favicon, Android Chrome M47+ Splash screen with 4.0 screen density
	"apple-touch-icon.png", // Favicon, Apple default
	"apple-touch-icon-57x57.png", // Apple iPhone, Non-retina with iOS6 or prior
	"apple-touch-icon-60x60.png", // Apple iPhone, Non-retina with iOS7
	"apple-touch-icon-72x72.png", // Apple iPad, Non-retina with iOS6 or prior
	"apple-touch-icon-76x76.png", // Apple iPad, Non-retina with iOS7
	"apple-touch-icon-114x114.png", // Apple iPhone, Retina with iOS6 or prior
	"apple-touch-icon-120x120.png", // Apple iPhone, Retina with iOS7
	"apple-touch-icon-144x144.png", // Apple iPad, Retina with iOS6 or prior
	"apple-touch-icon-152x152.png", // Apple iPad, Retina with iOS7
	"apple-touch-icon-180x180.png", // Apple iPhone 6 Plus with iOS8
	"browserconfig.xml", // IE11 icon configuration file
	"favicon.ico", // Favicon, IE and fallback for other browsers
	"favicon-16x16.png", // Favicon, default
	"favicon-32x32.png", // Favicon, Safari on Mac OS
	"maskable_icon.png", // Favicon, maskable https://web.dev/maskable-icon
	"monochrome_icon.png", // Favicon, monochrome https://web.dev/monochrome-icon
	"mstile-70x70.png", // Favicon, Windows 8 / IE11
	"mstile-144x144.png", // Favicon, Windows 8 / IE10
	"mstile-150x150.png", // Favicon, Windows 8 / IE11
	"mstile-310x150.png", // Favicon, Windows 8 / IE11
	"mstile-310x310.png", // Favicon, Windows 8 / IE11
	"safari-pinned-tab.svg", // Favicon, Safari pinned tab
	"share.jpg" // Social media sharing
];

// 1) INSTALL - triggers when service worker-controlled pages are accessed subsequently
// Add all cacheFiles to cache
// If any file fails to be fetched
//	cache.addAll rejects
//	install fails
//	the service worker will be abandoned (if an older version is running, it'll be left intact)
self.addEventListener("install", event => {

	// Kick out the old service worker
	self.skipWaiting();

	event.waitUntil(
		caches.open(cacheName).then(cache => {
			return cache.addAll(cacheFiles);
		})
	);
});

// 2) ACTIVATE - triggers when service worker is installed successfully
// Delete non-current caches used in previous versions
// (Can block page loads, only use for things you couldn't do while previous version was active)
self.addEventListener("activate", event => {
	event.waitUntil(
		caches.keys().then(cacheObjects => {
			return Promise.all(
				cacheObjects.map(cacheObjectName => {
					if (cacheObjectName != cacheName) {
						return caches.delete(cacheObjectName);
					}
				})
			)
		})
	);
});

// 3) FETCH - triggers when any resource controlled by a service worker is fetched
// Offline-first - cache falling back to network strategy
self.addEventListener("fetch", event => {
	const cacheBlacklist = [
		"adservice",
		"amazon-adsystem",
		"amazon.com",
		"doubleclick",
		"facebook",
		"google-analytics",
		"google.com",
		"googleads",
		"googlesyndication",
		"googletagmanager",
		"googletagservices",
		"pagead",
		"repixel"
	];
	
	const url = new URL(event.request.url);
	const online = navigator.onLine ? true : false;
	const blacklisted = [url.hostname].filter(hostname => cacheBlacklist.some(item => hostname.includes(item))).length ? true : false;
	const cacheMatch = cacheFiles.find(cacheFile => cacheFile.includes(url.pathname.replace("/", "")));
	const cacheResponse = (online && (event.request.method == "GET") && !blacklisted) ? true : false;

	if (!online) {
		if (cacheMatch) {
			event.respondWith(fetchCacheResponse(cacheMatch));
		} else {
			if (blacklisted) {
				console.warn(`Ignoring offline blacklisted request: ${event.request.url}`);
			} else {
				event.respondWith(fetchCacheResponse("index.html"));
			}
		}
	} else {
		if (cacheMatch) {
			event.respondWith(fetchCacheResponse(cacheMatch) || fetchNetworkResponse(event.request, cacheResponse));
		} else {
			event.respondWith(fetchNetworkResponse(event.request, cacheResponse));
		}
	}
});

const fetchCacheResponse = eventRequest => {
	return caches.match(eventRequest)
		.then(responseCache => {
			if (responseCache) {
				return responseCache;
			} else {
				return fetchCacheResponse("index.html");
			}
		})
		.catch(error => {
			return fetchCacheResponse("index.html");
		});
}

const fetchNetworkResponse = (eventRequest, updateCache = false) => {
	return fetch(eventRequest)
		.then(responseNetwork => {
			if (updateCache) {
				const responseNetworkCache = responseNetwork.clone();
				const responseNetworkReturn = responseNetwork.clone();
				caches.open(cacheName)
					.then(cache => cache.put(eventRequest, responseNetworkCache))
					.catch(error => console.warn(error));
				return responseNetworkReturn;
			} else {
				return responseNetwork;
			}
		})
		.catch(error => console.warn(error));
}