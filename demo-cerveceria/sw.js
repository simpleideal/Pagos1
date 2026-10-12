/* Carcasa de Bruma Personal.
   Al cambiar el html, el css, el js o los íconos, sube el número
   (ahora bruma-personal-v3). Así el teléfono toma la versión nueva.
   No guarda la clave ni las respuestas del script. */
var CACHE = "bruma-personal-v3";

var CARCASA = [
    "admin.html",
    "manifest.webmanifest",
    "js/instalar.js",
    "js/reservas-url.js",
    "js/llamados.js",
    "js/admin-api.js",
    "js/sala-llamados.js",
    "js/mesas.js",
    "js/ocupadas.js",
    "js/admin-ui.js",
    "img/admin-icono-192.png",
    "img/admin-icono-512.png",
    "img/admin-icono-maskable-192.png",
    "img/admin-icono-maskable-512.png",
    "img/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            return cache.addAll(CARCASA);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (nombres) {
            return Promise.all(nombres.map(function (nombre) {
                if (nombre !== CACHE) return caches.delete(nombre);
            }));
        }).then(function () {
            return self.clients.claim();
        })
    );
});

function esScript(url) {
    return url.hostname === "script.google.com" ||
        url.hostname === "script.googleusercontent.com";
}

self.addEventListener("fetch", function (event) {
    var pedido = event.request;
    if (pedido.method !== "GET") return;

    var url;
    try { url = new URL(pedido.url); }
    catch (error) { return; }

    if (esScript(url)) return;
    if (url.origin !== self.location.origin) return;

    var enCarcasa = CARCASA.some(function (pieza) {
        return url.pathname.endsWith("/" + pieza);
    });
    if (!enCarcasa) return;

    event.respondWith(
        caches.match(pedido).then(function (guardado) {
            return guardado || fetch(pedido);
        })
    );
});
